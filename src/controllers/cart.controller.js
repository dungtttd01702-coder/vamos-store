const { sql, getPool, query } = require('../config/database');

const MAX_RETAIL_QUANTITY = 10;

/**
 * Helper to strictly validate cart quantity at the server layer
 * Rejects non-integers, negatives, decimals, zero, and quantities > 10
 */
function validateCartQuantity(quantity) {
  if (quantity === undefined || quantity === null || String(quantity).trim() === '') {
    return { valid: false, message: 'Vui lòng cung cấp số lượng sản phẩm hợp lệ.' };
  }
  const str = String(quantity).trim();
  if (!/^[1-9]\d*$/.test(str)) {
    return { valid: false, message: 'Số lượng sản phẩm không hợp lệ (phải là số nguyên dương từ 1 đến 10).' };
  }
  const num = Number.parseInt(str, 10);
  if (num > MAX_RETAIL_QUANTITY) {
    return {
      valid: false,
      message: `Đơn hàng bán lẻ trên website tối đa 10 đôi/sản phẩm. Nếu quý khách có nhu cầu mua sỉ số lượng lớn (${num} đôi), vui lòng liên hệ Hotline 1900 2126 để nhận báo giá sỉ ưu đãi!`,
    };
  }
  return { valid: true, quantity: num };
}

class CartController {
  /**
   * Display Shopping Cart (Guest session cart or Customer database cart)
   */
  async index(req, res, next) {
    try {
      const user = req.session?.user;

      if (!user) {
        // Guest shopping cart stored in session (Decision Q2)
        let guestItems = req.session?.guestCart || [];

        // Live DB Sync for Guest Items: current price, live stock, active status, and retail cap
        if (guestItems.length > 0) {
          const varIds = guestItems.map(i => Number.parseInt(i.variant_id, 10)).filter(id => !Number.isNaN(id) && id > 0);
          if (varIds.length > 0) {
            const varListSql = `
              SELECT 
                pv.id AS variant_id, pv.sku, pv.stock_quantity, pv.status AS variant_status,
                p.id AS product_id, p.name AS product_name, p.slug AS product_slug, p.status AS product_status,
                COALESCE(p.sale_price, p.base_price) AS unit_price,
                s.size_name, c.color_name,
                (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC) AS image_url
              FROM product_variants pv
              JOIN products p ON pv.product_id = p.id
              JOIN sizes s ON pv.size_id = s.id
              JOIN colors c ON pv.color_id = c.id
              WHERE pv.id IN (${varIds.join(',')})
            `;
            const liveRes = await query(varListSql);
            const liveMap = new Map(liveRes.recordset.map(r => [r.variant_id, r]));

            const updatedGuestItems = [];
            const notices = [];
            for (const item of guestItems) {
              const live = liveMap.get(item.variant_id);
              if (!live || live.variant_status !== 'active' || live.product_status !== 'active') {
                notices.push(`Sản phẩm "${item.product_name || 'Đã chọn'}" hiện đã ngừng kinh doanh và được gỡ khỏi giỏ hàng.`);
                continue;
              }
              if (live.stock_quantity <= 0) {
                notices.push(`Sản phẩm "${live.product_name}" (Màu ${live.color_name} - Size ${live.size_name}) hiện đã hết hàng trong kho.`);
                continue;
              }
              const oldQty = Math.max(1, Number.parseInt(item.quantity, 10) || 1);
              const safeQty = Math.min(MAX_RETAIL_QUANTITY, live.stock_quantity, oldQty);
              if (safeQty < oldQty) {
                notices.push(`Số lượng sản phẩm "${live.product_name}" được điều chỉnh từ ${oldQty} thành ${safeQty} do hạn mức tồn kho.`);
              }
              const unitPrice = Number(live.unit_price);
              updatedGuestItems.push({
                ...item,
                product_name: live.product_name,
                product_slug: live.product_slug,
                sku: live.sku,
                size_name: live.size_name,
                color_name: live.color_name,
                unit_price: unitPrice,
                stock_quantity: live.stock_quantity,
                image_url: live.image_url || item.image_url,
                quantity: safeQty,
                line_total: unitPrice * safeQty,
              });
            }
            if (notices.length > 0 && req.flash) {
              req.flash('warning', notices.join(' '));
            }
            guestItems = updatedGuestItems;
            req.session.guestCart = guestItems;
            req.session.cartCount = guestItems.reduce((sum, i) => sum + i.quantity, 0);
          }
        }

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

      // 1. Strict Server-Side Quantity Validation
      const qtyValidation = validateCartQuantity(quantity);
      if (!qtyValidation.valid) {
        if (req.xhr || req.headers?.accept?.includes('application/json')) {
          return res.status(400).json({ success: false, message: qtyValidation.message });
        }
        if (req.flash) req.flash('warning', qtyValidation.message);
        const err = new Error(qtyValidation.message);
        err.status = 400;
        return next(err);
      }
      const qty = qtyValidation.quantity;

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
        productId: Number.parseInt(productId, 10),
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
          const newQty = currentItem.quantity + qty;
          if (newQty > MAX_RETAIL_QUANTITY) {
            const msg = `Mỗi sản phẩm chỉ được mua tối đa 10 đôi trong đơn hàng bán lẻ (Hiện trong giỏ đã có ${currentItem.quantity} đôi). Vui lòng liên hệ Hotline 1900 2126 để mua sỉ!`;
            if (req.flash) req.flash('warning', msg);
            return res.redirect('/cart');
          }
          if (newQty > variant.stock_quantity) {
            const msg = `Sản phẩm "${variant.product_name}" hiện chỉ còn ${variant.stock_quantity} đôi trong kho (Hiện trong giỏ đã có ${currentItem.quantity} đôi).`;
            if (req.flash) req.flash('warning', msg);
            return res.redirect('/cart');
          }
          currentItem.quantity = newQty;
          currentItem.line_total = Number(variant.unit_price) * newQty;
        } else {
          if (qty > variant.stock_quantity) {
            const msg = `Sản phẩm "${variant.product_name}" hiện chỉ còn ${variant.stock_quantity} đôi trong kho.`;
            if (req.flash) req.flash('warning', msg);
            return res.redirect('/cart');
          }
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
            quantity: qty,
            line_total: Number(variant.unit_price) * qty,
            stock_quantity: variant.stock_quantity,
            image_url: variant.image_url,
          });
        }

        req.session.cartCount = req.session.guestCart.reduce((sum, item) => sum + item.quantity, 0);
        return res.redirect('/cart');
      }

      // ── CASE B: LOGGED IN CUSTOMER (DATABASE CART WITH ROW-LOCKING TRANSACTION) ──
      const pool = await getPool();
      const transaction = new sql.Transaction(pool);
      await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

      try {
        let cartId = user.cartId;
        if (!cartId) {
          const cartReq = new sql.Request(transaction);
          cartReq.input('userId', sql.Int, user.id);
          const cartRes = await cartReq.query('SELECT id FROM carts WITH (UPDLOCK, ROWLOCK) WHERE user_id = @userId');
          if (cartRes.recordset.length === 0) {
            const newCart = await cartReq.query('INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@userId)');
            cartId = newCart.recordset[0].id;
          } else {
            cartId = cartRes.recordset[0].id;
          }
          user.cartId = cartId;
        } else {
          const lockCartReq = new sql.Request(transaction);
          lockCartReq.input('cartId', sql.Int, cartId);
          await lockCartReq.query('SELECT id FROM carts WITH (UPDLOCK, ROWLOCK) WHERE id = @cartId');
        }

        // Lock live stock of variant
        const varStockReq = new sql.Request(transaction);
        varStockReq.input('varId', sql.Int, variant.id);
        const liveStockRes = await varStockReq.query('SELECT stock_quantity, status FROM product_variants WITH (UPDLOCK, ROWLOCK) WHERE id = @varId');
        const liveStock = liveStockRes.recordset[0]?.stock_quantity || 0;
        const liveStatus = liveStockRes.recordset[0]?.status;

        if (liveStatus !== 'active' || liveStock <= 0) {
          await transaction.rollback();
          const msg = `Sản phẩm "${variant.product_name}" hiện đã hết hàng hoặc ngưng kinh doanh.`;
          if (req.flash) req.flash('warning', msg);
          return res.redirect('/cart');
        }

        // Lock cart_item with UPDLOCK, HOLDLOCK to avoid lost updates under concurrency
        const itemReq = new sql.Request(transaction);
        itemReq.input('cartId', sql.Int, cartId);
        itemReq.input('varId', sql.Int, variant.id);
        const itemRes = await itemReq.query('SELECT id, quantity FROM cart_items WITH (UPDLOCK, HOLDLOCK) WHERE cart_id = @cartId AND variant_id = @varId');

        if (itemRes.recordset.length > 0) {
          const currentQty = itemRes.recordset[0].quantity;
          const newQty = currentQty + qty;
          if (newQty > MAX_RETAIL_QUANTITY) {
            await transaction.rollback();
            const msg = `Mỗi sản phẩm chỉ được mua tối đa 10 đôi trong đơn hàng bán lẻ (Hiện trong giỏ đã có ${currentQty} đôi). Vui lòng liên hệ Hotline 1900 2126 để mua sỉ!`;
            if (req.flash) req.flash('warning', msg);
            return res.redirect('/cart');
          }
          if (newQty > liveStock) {
            await transaction.rollback();
            const msg = `Sản phẩm "${variant.product_name}" hiện chỉ còn ${liveStock} đôi trong kho (Hiện trong giỏ đã có ${currentQty} đôi).`;
            if (req.flash) req.flash('warning', msg);
            return res.redirect('/cart');
          }
          itemReq.input('newQty', sql.Int, newQty);
          itemReq.input('itemId', sql.Int, itemRes.recordset[0].id);
          await itemReq.query('UPDATE cart_items SET quantity = @newQty, updated_at = GETDATE() WHERE id = @itemId');
        } else {
          if (qty > liveStock) {
            await transaction.rollback();
            const msg = `Sản phẩm "${variant.product_name}" hiện chỉ còn ${liveStock} đôi trong kho.`;
            if (req.flash) req.flash('warning', msg);
            return res.redirect('/cart');
          }
          itemReq.input('qty', sql.Int, qty);
          await itemReq.query('INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@cartId, @varId, @qty)');
        }

        // Update cart count in session
        const countReq = new sql.Request(transaction);
        countReq.input('cartId', sql.Int, cartId);
        const countRes = await countReq.query('SELECT SUM(quantity) AS total_items FROM cart_items WHERE cart_id = @cartId');
        req.session.cartCount = countRes.recordset[0]?.total_items || 0;

        await transaction.commit();
        res.redirect('/cart');
      } catch (txErr) {
        await transaction.rollback();
        throw txErr;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buy Now Action: adds item to cart and immediately redirects to checkout (or login if guest)
   */
  async buyNow(req, res, next) {
    try {
      const user = req.session?.user;
      const { productId, size, color, quantity = 1 } = req.body;

      // 1. Strict Server-Side Quantity Validation
      const qtyValidation = validateCartQuantity(quantity);
      if (!qtyValidation.valid) {
        if (req.xhr || req.headers?.accept?.includes('application/json')) {
          return res.status(400).json({ success: false, message: qtyValidation.message });
        }
        if (req.flash) req.flash('warning', qtyValidation.message);
        const err = new Error(qtyValidation.message);
        err.status = 400;
        return next(err);
      }
      const qty = qtyValidation.quantity;

      // Find matching variant
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
        productId: Number.parseInt(productId, 10),
        size,
        color,
      });

      if (varRes.recordset.length === 0) {
        const err = new Error('Biến thể sản phẩm (Size x Màu) không tồn tại hoặc đã ngừng kinh doanh.');
        err.status = 400;
        return next(err);
      }

      const variant = varRes.recordset[0];
      if (variant.stock_quantity <= 0) {
        const err = new Error(`Sản phẩm "${variant.product_name}" hiện đã hết hàng.`);
        err.status = 400;
        return next(err);
      }

      // Guest flow: save in guestCart and redirect to login with returnUrl=/checkout
      if (!user) {
        req.session.guestCart = req.session.guestCart || [];
        const existingIdx = req.session.guestCart.findIndex(i => i.variant_id === variant.id);

        if (existingIdx > -1) {
          const currentItem = req.session.guestCart[existingIdx];
          const newQty = Math.min(MAX_RETAIL_QUANTITY, Math.min(variant.stock_quantity, currentItem.quantity + qty));
          currentItem.quantity = newQty;
          currentItem.line_total = Number(variant.unit_price) * newQty;
        } else {
          const newQty = Math.min(MAX_RETAIL_QUANTITY, Math.min(variant.stock_quantity, qty));
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
            quantity: newQty,
            line_total: Number(variant.unit_price) * newQty,
            stock_quantity: variant.stock_quantity,
            image_url: variant.image_url,
          });
        }
        req.session.cartCount = req.session.guestCart.reduce((sum, item) => sum + item.quantity, 0);
        return res.redirect('/auth/login?returnUrl=/checkout');
      }

      // Logged in Customer: atomic transaction with row locking and direct redirect to /checkout
      const pool = await getPool();
      const transaction = new sql.Transaction(pool);
      await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

      try {
        let cartId = user.cartId;
        if (!cartId) {
          const cartReq = new sql.Request(transaction);
          cartReq.input('userId', sql.Int, user.id);
          const cartRes = await cartReq.query('SELECT id FROM carts WITH (UPDLOCK, ROWLOCK) WHERE user_id = @userId');
          if (cartRes.recordset.length === 0) {
            const newCart = await cartReq.query('INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@userId)');
            cartId = newCart.recordset[0].id;
          } else {
            cartId = cartRes.recordset[0].id;
          }
          user.cartId = cartId;
        } else {
          const lockCartReq = new sql.Request(transaction);
          lockCartReq.input('cartId', sql.Int, cartId);
          await lockCartReq.query('SELECT id FROM carts WITH (UPDLOCK, ROWLOCK) WHERE id = @cartId');
        }

        // Lock live stock of variant
        const varStockReq = new sql.Request(transaction);
        varStockReq.input('varId', sql.Int, variant.id);
        const liveStockRes = await varStockReq.query('SELECT stock_quantity, status FROM product_variants WITH (UPDLOCK, ROWLOCK) WHERE id = @varId');
        const liveStock = liveStockRes.recordset[0]?.stock_quantity || 0;
        const liveStatus = liveStockRes.recordset[0]?.status;

        if (liveStatus !== 'active' || liveStock <= 0) {
          await transaction.rollback();
          const msg = `Sản phẩm "${variant.product_name}" hiện đã hết hàng hoặc ngưng kinh doanh.`;
          if (req.flash) req.flash('warning', msg);
          return res.redirect('/cart');
        }

        const itemReq = new sql.Request(transaction);
        itemReq.input('cartId', sql.Int, cartId);
        itemReq.input('varId', sql.Int, variant.id);
        const itemRes = await itemReq.query('SELECT id, quantity FROM cart_items WITH (UPDLOCK, HOLDLOCK) WHERE cart_id = @cartId AND variant_id = @varId');

        if (itemRes.recordset.length > 0) {
          const currentQty = itemRes.recordset[0].quantity;
          const newQty = Math.min(MAX_RETAIL_QUANTITY, Math.min(liveStock, currentQty + qty));
          itemReq.input('newQty', sql.Int, newQty);
          itemReq.input('itemId', sql.Int, itemRes.recordset[0].id);
          await itemReq.query('UPDATE cart_items SET quantity = @newQty, updated_at = GETDATE() WHERE id = @itemId');
        } else {
          const initialQty = Math.min(MAX_RETAIL_QUANTITY, Math.min(liveStock, qty));
          itemReq.input('qty', sql.Int, initialQty);
          await itemReq.query('INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@cartId, @varId, @qty)');
        }

        const countReq = new sql.Request(transaction);
        countReq.input('cartId', sql.Int, cartId);
        const countRes = await countReq.query('SELECT SUM(quantity) AS total_items FROM cart_items WHERE cart_id = @cartId');
        req.session.cartCount = countRes.recordset[0]?.total_items || 0;

        await transaction.commit();
        return res.redirect('/checkout');
      } catch (txErr) {
        await transaction.rollback();
        throw txErr;
      }
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
      const rawQtyStr = String(quantity !== undefined && quantity !== null ? quantity : '').trim();

      // Case: Removal if quantity is explicitly 0
      const isRemoval = rawQtyStr === '0';

      let targetQty = 0;
      if (!isRemoval) {
        const qtyCheck = validateCartQuantity(rawQtyStr);
        if (!qtyCheck.valid) {
          if (req.flash) req.flash('warning', qtyCheck.message);
          return res.redirect('/cart');
        }
        targetQty = qtyCheck.quantity;
      }

      // Guest Cart
      if (!user) {
        const guestCart = req.session?.guestCart || [];
        const targetIdx = guestCart.findIndex(i => String(i.cart_item_id) === String(itemId) || String(i.variant_id) === String(itemId));

        if (targetIdx > -1) {
          if (isRemoval || targetQty <= 0) {
            guestCart.splice(targetIdx, 1);
          } else {
            const item = guestCart[targetIdx];
            if (targetQty > item.stock_quantity) {
              if (req.flash) req.flash('warning', `Sản phẩm "${item.product_name}" chỉ còn ${item.stock_quantity} đôi trong kho.`);
              return res.redirect('/cart');
            }
            item.quantity = targetQty;
            item.line_total = item.unit_price * targetQty;
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

      const cartItemId = Number.parseInt(itemId, 10);
      if (isRemoval || targetQty <= 0) {
        await query('DELETE FROM cart_items WHERE id = @itemId AND cart_id = @cartId', {
          itemId: cartItemId,
          cartId: user.cartId,
        });
      } else {
        const checkRes = await query(`
          SELECT pv.stock_quantity, p.name AS product_name
          FROM cart_items ci 
          JOIN product_variants pv ON ci.variant_id = pv.id 
          JOIN products p ON pv.product_id = p.id
          WHERE ci.id = @itemId AND ci.cart_id = @cartId
        `, { itemId: cartItemId, cartId: user.cartId });

        if (checkRes.recordset.length > 0) {
          const maxStock = checkRes.recordset[0].stock_quantity;
          const prodName = checkRes.recordset[0].product_name;
          if (targetQty > maxStock) {
            if (req.flash) req.flash('warning', `Sản phẩm "${prodName}" chỉ còn ${maxStock} đôi trong kho.`);
            return res.redirect('/cart');
          }
          await query('UPDATE cart_items SET quantity = @qty, updated_at = GETDATE() WHERE id = @itemId AND cart_id = @cartId', {
            qty: targetQty,
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
          itemId: Number.parseInt(itemId, 10),
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

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

    try {
      // Lock cart record
      const lockCartReq = new sql.Request(transaction);
      lockCartReq.input('cartId', sql.Int, cartId);
      await lockCartReq.query('SELECT id FROM carts WITH (UPDLOCK, ROWLOCK) WHERE id = @cartId');

      for (const item of guestCart) {
        const variantId = Number.parseInt(item.variant_id, 10);
        if (!variantId || Number.isNaN(variantId)) continue;

        // Strict quantity validation
        const qtyCheck = validateCartQuantity(item.quantity);
        const quantity = qtyCheck.valid ? qtyCheck.quantity : Math.min(MAX_RETAIL_QUANTITY, Math.max(1, Number.parseInt(item.quantity, 10) || 1));

        // Verify active status and current available stock inside transaction
        const varReq = new sql.Request(transaction);
        varReq.input('varId', sql.Int, variantId);
        const varRes = await varReq.query(`
          SELECT pv.id, pv.stock_quantity 
          FROM product_variants pv WITH (UPDLOCK, ROWLOCK)
          JOIN products p ON pv.product_id = p.id
          WHERE pv.id = @varId AND pv.status = 'active' AND p.status = 'active'
        `);

        if (varRes.recordset.length === 0) continue;
        const variant = varRes.recordset[0];
        if (variant.stock_quantity <= 0) continue;

        // Lock existing cart item if any
        const existReq = new sql.Request(transaction);
        existReq.input('cartId', sql.Int, cartId);
        existReq.input('varId', sql.Int, variantId);
        const existRes = await existReq.query(`
          SELECT id, quantity 
          FROM cart_items WITH (UPDLOCK, HOLDLOCK) 
          WHERE cart_id = @cartId AND variant_id = @varId
        `);

        if (existRes.recordset.length > 0) {
          const currentQty = existRes.recordset[0].quantity;
          const newQty = Math.min(MAX_RETAIL_QUANTITY, variant.stock_quantity, currentQty + quantity);
          existReq.input('qty', sql.Int, newQty);
          existReq.input('id', sql.Int, existRes.recordset[0].id);
          await existReq.query(`
            UPDATE cart_items SET quantity = @qty, updated_at = GETDATE() WHERE id = @id
          `);
        } else {
          const initialQty = Math.min(MAX_RETAIL_QUANTITY, variant.stock_quantity, quantity);
          existReq.input('qty', sql.Int, initialQty);
          await existReq.query(`
            INSERT INTO cart_items (cart_id, variant_id, quantity)
            VALUES (@cartId, @varId, @qty)
          `);
        }
      }

      const countReq = new sql.Request(transaction);
      countReq.input('cartId', sql.Int, cartId);
      const countRes = await countReq.query('SELECT SUM(quantity) AS total_items FROM cart_items WHERE cart_id = @cartId');

      await transaction.commit();
      return countRes.recordset[0]?.total_items || 0;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

CartController.validateCartQuantity = validateCartQuantity;
const cartControllerInstance = new CartController();
cartControllerInstance.validateCartQuantity = validateCartQuantity;

module.exports = cartControllerInstance;
