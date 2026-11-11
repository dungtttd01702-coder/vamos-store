const { query } = require('../config/database');

class CartController {
  /**
   * Display Shopping Cart (Guest session cart or Customer database cart)
   */
  async index(req, res, next) {
    try {
      const user = req.session?.user;

      if (!user) {
        // Guest shopping cart stored in session (Decision Q2)
        const guestItems = req.session?.guestCart || [];
        const items = guestItems.map(item => ({
          ...item,
          cart_item_id: item.cart_item_id || `guest_${item.variant_id}`,
          line_total: (item.unit_price || 0) * (item.quantity || 1),
        }));

        const subtotal = items.reduce((sum, item) => sum + Number(item.line_total), 0);
        const shippingFee = subtotal >= 500000 || subtotal === 0 ? 0 : 30000;
        const totalAmount = subtotal + shippingFee;

        return res.render('pages/cart/index', {
          title: 'Giỏ Hàng Của Bạn (Khách Vãng Lai) | VAMOS STORE',
          isGuest: true,
          items,
          subtotal,
          shippingFee,
          totalAmount,
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
        title: 'Giỏ Hàng Của Bạn | VAMOS STORE',
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
   * Add Item to Cart (Guest session or Customer DB)
   */
  async addItem(req, res, next) {
    try {
      const user = req.session?.user;
      const { productId, size, color, quantity = 1 } = req.body;
      const qty = Math.max(1, parseInt(quantity, 10) || 1);

      // Find matching variant (must be active and parent product must be active)
      const varRes = await query(`
        SELECT 
          pv.id, pv.stock_quantity, pv.sku,
          p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
          COALESCE(p.sale_price, p.base_price) AS unit_price,
          s.size_name, c.color_name,
          (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC) AS image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        JOIN sizes s ON pv.size_id = s.id
        JOIN colors c ON pv.color_id = c.id
        WHERE pv.product_id = @productId 
          AND s.size_name = @size 
          AND c.color_name = @color 
          AND pv.status = 'active' 
          AND p.status = 'active'
      `, {
        productId: parseInt(productId, 10),
        size,
        color,
      });

      if (varRes.recordset.length === 0) {
        const err = new Error('Biến thể sản phẩm (Size x Màu) không tồn tại hoặc đã ngừng kinh doanh.');
        err.status = 400;
        return next(err);
      }

      const variant = varRes.recordset[0];

      // Check stock availability
      if (variant.stock_quantity <= 0) {
        const err = new Error(`Sản phẩm "${variant.product_name}" hiện đã hết hàng.`);
        err.status = 400;
        return next(err);
      }

      // ── CASE A: GUEST SHOPPING CART (STORE IN SESSION - DECISION Q2) ──
      if (!user) {
        req.session.guestCart = req.session.guestCart || [];
        const existingIdx = req.session.guestCart.findIndex(i => i.variant_id === variant.id);

        if (existingIdx > -1) {
          const currentItem = req.session.guestCart[existingIdx];
          const newQty = Math.min(variant.stock_quantity, currentItem.quantity + qty);
          currentItem.quantity = newQty;
          currentItem.line_total = Number(variant.unit_price) * newQty;
        } else {
          const initialQty = Math.min(variant.stock_quantity, qty);
          req.session.guestCart.push({
            cart_item_id: `guest_${variant.id}`,
            variant_id: variant.id,
            product_id: variant.product_id,
            product_name: variant.product_name,
            product_slug: variant.product_slug,
            sku: variant.sku,
            size_name: variant.size_name,
            color_name: variant.color_name,
            unit_price: Number(variant.unit_price),
            quantity: initialQty,
            line_total: Number(variant.unit_price) * initialQty,
            stock_quantity: variant.stock_quantity,
            image_url: variant.image_url,
          });
        }

        req.session.cartCount = req.session.guestCart.reduce((sum, item) => sum + item.quantity, 0);
        return res.redirect('/cart');
      }

      // ── CASE B: LOGGED IN CUSTOMER (DATABASE CART) ──
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
        if (newQty <= 0) {
          const err = new Error('Số lượng sản phẩm không hợp lệ.');
          err.status = 400;
          return next(err);
        }
        await query('UPDATE cart_items SET quantity = @qty, updated_at = GETDATE() WHERE id = @id', {
          qty: newQty,
          id: itemRes.recordset[0].id,
        });
      } else {
        const initialQty = Math.min(variant.stock_quantity, qty);
        if (initialQty <= 0) {
          const err = new Error('Số lượng sản phẩm thêm vào giỏ không hợp lệ.');
          err.status = 400;
          return next(err);
        }
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
   * Update Quantity of Item in Cart (Guest session or Customer DB)
   */
  async updateItem(req, res, next) {
    try {
      const user = req.session?.user;
      const { itemId, quantity } = req.body;
      const qty = parseInt(quantity, 10) || 0;

      // Guest Cart
      if (!user) {
        const guestCart = req.session?.guestCart || [];
        const targetIdx = guestCart.findIndex(i => String(i.cart_item_id) === String(itemId) || String(i.variant_id) === String(itemId));

        if (targetIdx > -1) {
          if (qty <= 0) {
            guestCart.splice(targetIdx, 1);
          } else {
            const item = guestCart[targetIdx];
            item.quantity = Math.min(qty, item.stock_quantity);
            item.line_total = item.unit_price * item.quantity;
          }
          req.session.guestCart = guestCart;
          req.session.cartCount = guestCart.reduce((sum, item) => sum + item.quantity, 0);
        }
        return res.redirect('/cart');
      }

      // Customer DB Cart
      if (!user.cartId) {
        return res.redirect('/cart');
      }

      const cartItemId = parseInt(itemId, 10);
      if (qty <= 0) {
        await query('DELETE FROM cart_items WHERE id = @itemId AND cart_id = @cartId', {
          itemId: cartItemId,
          cartId: user.cartId,
        });
      } else {
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

      const countRes = await query('SELECT SUM(quantity) AS total_items FROM cart_items WHERE cart_id = @cartId', { cartId: user.cartId });
      req.session.cartCount = countRes.recordset[0]?.total_items || 0;

      res.redirect('/cart');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear All Items in Cart (Guest session or Customer DB)
   */
  async clearCart(req, res, next) {
    try {
      const user = req.session?.user;

      if (!user) {
        req.session.guestCart = [];
        req.session.cartCount = 0;
        return res.redirect('/cart');
      }

      if (user.cartId) {
        await query('DELETE FROM cart_items WHERE cart_id = @cartId', { cartId: user.cartId });
        req.session.cartCount = 0;
      }

      res.redirect('/cart');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove Item from Cart (Guest session or Customer DB)
   */
  async removeItem(req, res, next) {
    try {
      const user = req.session?.user;
      const itemId = req.params.itemId || req.body.itemId;

      if (!itemId) {
        return res.redirect('/cart');
      }

      if (!user) {
        const guestCart = req.session?.guestCart || [];
        req.session.guestCart = guestCart.filter(i => String(i.cart_item_id) !== String(itemId) && String(i.variant_id) !== String(itemId));
        req.session.cartCount = req.session.guestCart.reduce((sum, item) => sum + item.quantity, 0);
        return res.redirect('/cart');
      }

      if (user.cartId) {
        await query('DELETE FROM cart_items WHERE id = @itemId AND cart_id = @cartId', {
          itemId: parseInt(itemId, 10),
          cartId: user.cartId,
        });
        const countRes = await query('SELECT SUM(quantity) AS total_items FROM cart_items WHERE cart_id = @cartId', { cartId: user.cartId });
        req.session.cartCount = countRes.recordset[0]?.total_items || 0;
      }

      res.redirect('/cart');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Merge Guest Session Cart into Customer Database Cart upon login/registration (Decision Q2)
   */
  static async mergeGuestCart(cartId, guestCart) {
    if (!cartId || !Array.isArray(guestCart) || guestCart.length === 0) {
      return 0;
    }

    for (const item of guestCart) {
      const variantId = parseInt(item.variant_id, 10);
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (!variantId) continue;

      // Verify active status and current available stock
      const varRes = await query(`
        SELECT pv.id, pv.stock_quantity 
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = @varId AND pv.status = 'active' AND p.status = 'active'
      `, { varId: variantId });

      if (varRes.recordset.length === 0) continue;
      const variant = varRes.recordset[0];
      if (variant.stock_quantity <= 0) continue;

      // Check if item already exists in customer's cart
      const existRes = await query(`
        SELECT id, quantity FROM cart_items WHERE cart_id = @cartId AND variant_id = @varId
      `, { cartId, varId: variantId });

      if (existRes.recordset.length > 0) {
        const currentQty = existRes.recordset[0].quantity;
        const newQty = Math.min(variant.stock_quantity, currentQty + quantity);
        await query(`
          UPDATE cart_items SET quantity = @qty, updated_at = GETDATE() WHERE id = @id
        `, { qty: newQty, id: existRes.recordset[0].id });
      } else {
        const initialQty = Math.min(variant.stock_quantity, quantity);
        await query(`
          INSERT INTO cart_items (cart_id, variant_id, quantity)
          VALUES (@cartId, @varId, @qty)
        `, { cartId, varId: variantId, qty: initialQty });
      }
    }

    const countRes = await query('SELECT SUM(quantity) AS total_items FROM cart_items WHERE cart_id = @cartId', { cartId });
    return countRes.recordset[0]?.total_items || 0;
  }
}

module.exports = new CartController();
