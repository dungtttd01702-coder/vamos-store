const { query } = require('../config/database');

class CartController {
  /**
   * Display Shopping Cart
   */
  async index(req, res, next) {
    try {
      const user = req.session?.user;

      // Rule: Guest must log in to view and manage cart
      if (!user) {
        return res.render('pages/cart/index', {
          title: 'Giỏ Hàng Của Bạn',
          isGuest: true,
          items: [],
          subtotal: 0,
          shippingFee: 0,
          totalAmount: 0,
        });
      }

      // Fetch cart items for logged in customer
      const sqlStr = `
        SELECT 
          ci.id AS cart_item_id, ci.quantity,
          pv.id AS variant_id, pv.sku, pv.stock_quantity,
          p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
          COALESCE(p.sale_price, p.base_price) AS unit_price,
          (COALESCE(p.sale_price, p.base_price) * ci.quantity) AS line_total,
          s.size_name,
          c.color_name,
          (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC) AS image_url
        FROM cart_items ci
        JOIN carts ct ON ci.cart_id = ct.id
        JOIN product_variants pv ON ci.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN sizes s ON pv.size_id = s.id
        JOIN colors c ON pv.color_id = c.id
        WHERE ct.user_id = @userId
        ORDER BY ci.id DESC
      `;
      const resData = await query(sqlStr, { userId: user.id });
      const items = resData.recordset;

      const subtotal = items.reduce((sum, item) => sum + Number(item.line_total), 0);
      const shippingFee = subtotal >= 500000 || subtotal === 0 ? 0 : 30000;
      const totalAmount = subtotal + shippingFee;

      res.render('pages/cart/index', {
        title: 'Giỏ Hàng Của Bạn',
        isGuest: false,
        items,
        subtotal,
        shippingFee,
        totalAmount,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add Item to Cart
   */
  async addItem(req, res, next) {
    try {
      const user = req.session?.user;
      const { productId, size, color, quantity = 1 } = req.body;

      // Guest redirect to login
      if (!user) {
        return res.redirect(`/auth/login?returnUrl=/products`);
      }

      const qty = Math.max(1, parseInt(quantity, 10) || 1);

      // Find matching variant
      const varRes = await query(`
        SELECT pv.id, pv.stock_quantity
        FROM product_variants pv
        JOIN sizes s ON pv.size_id = s.id
        JOIN colors c ON pv.color_id = c.id
        WHERE pv.product_id = @productId AND s.size_name = @size AND c.color_name = @color AND pv.status = 'active'
      `, {
        productId: parseInt(productId, 10),
        size,
        color,
      });

      if (varRes.recordset.length === 0) {
        const err = new Error('Biến thể sản phẩm (Size x Màu) không tồn tại hoặc đã ngừng kinh doanh');
        err.status = 400;
        return next(err);
      }

      const variant = varRes.recordset[0];

      // Get or create user cart
      let cartId = user.cartId;
      if (!cartId) {
        const cartRes = await query('SELECT id FROM carts WHERE user_id = @userId', { userId: user.id });
        if (cartRes.recordset.length === 0) {
          const newCart = await query('INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@userId)', { userId: user.id });
          cartId = newCart.recordset[0].id;
        } else {
          cartId = cartRes.recordset[0].id;
        }
        user.cartId = cartId;
      }

      // Check if already in cart
      const itemRes = await query('SELECT id, quantity FROM cart_items WHERE cart_id = @cartId AND variant_id = @varId', {
        cartId,
        varId: variant.id,
      });

      if (itemRes.recordset.length > 0) {
        const currentQty = itemRes.recordset[0].quantity;
        const newQty = Math.min(variant.stock_quantity, currentQty + qty);
        await query('UPDATE cart_items SET quantity = @qty, updated_at = GETDATE() WHERE id = @id', {
          qty: newQty,
          id: itemRes.recordset[0].id,
        });
      } else {
        const initialQty = Math.min(variant.stock_quantity, qty);
        await query('INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@cartId, @varId, @qty)', {
          cartId,
          varId: variant.id,
          qty: initialQty,
        });
      }

      // Update cart count in session
      const countRes = await query('SELECT SUM(quantity) AS total_items FROM cart_items WHERE cart_id = @cartId', { cartId });
      req.session.cartCount = countRes.recordset[0]?.total_items || 0;

      res.redirect('/cart');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Quantity of Item in Cart
   */
  async updateItem(req, res, next) {
    try {
      const user = req.session?.user;
      const { itemId, quantity } = req.body;

      if (!user || !user.cartId) {
        return res.redirect('/cart');
      }

      const qty = parseInt(quantity, 10) || 0;
      const cartItemId = parseInt(itemId, 10);

      if (qty <= 0) {
        await query('DELETE FROM cart_items WHERE id = @itemId AND cart_id = @cartId', {
          itemId: cartItemId,
          cartId: user.cartId,
        });
      } else {
        // Check stock bound
        const checkRes = await query(`
          SELECT pv.stock_quantity 
          FROM cart_items ci 
          JOIN product_variants pv ON ci.variant_id = pv.id 
          WHERE ci.id = @itemId AND ci.cart_id = @cartId
        `, { itemId: cartItemId, cartId: user.cartId });

        if (checkRes.recordset.length > 0) {
          const maxStock = checkRes.recordset[0].stock_quantity;
          const finalQty = Math.min(qty, maxStock);
          await query('UPDATE cart_items SET quantity = @qty, updated_at = GETDATE() WHERE id = @itemId AND cart_id = @cartId', {
            qty: finalQty,
            itemId: cartItemId,
            cartId: user.cartId,
          });
        }
      }

      // Update cart count
      const countRes = await query('SELECT SUM(quantity) AS total_items FROM cart_items WHERE cart_id = @cartId', { cartId: user.cartId });
      req.session.cartCount = countRes.recordset[0]?.total_items || 0;

      res.redirect('/cart');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear All Items in Cart
   */
  async clearCart(req, res, next) {
    try {
      const user = req.session?.user;
      if (!user || !user.cartId) {
        return res.redirect('/cart');
      }

      await query('DELETE FROM cart_items WHERE cart_id = @cartId', { cartId: user.cartId });
      req.session.cartCount = 0;

      res.redirect('/cart');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove Item from Cart
   */
  async removeItem(req, res, next) {
    try {
      const user = req.session?.user;
      const itemId = req.params.itemId || req.body.itemId;

      if (!user || !user.cartId || !itemId) {
        return res.redirect('/cart');
      }

      await query('DELETE FROM cart_items WHERE id = @itemId AND cart_id = @cartId', {
        itemId: parseInt(itemId, 10),
        cartId: user.cartId,
      });

      // Update cart count
      const countRes = await query('SELECT SUM(quantity) AS total_items FROM cart_items WHERE cart_id = @cartId', { cartId: user.cartId });
      req.session.cartCount = countRes.recordset[0]?.total_items || 0;

      res.redirect('/cart');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CartController();

