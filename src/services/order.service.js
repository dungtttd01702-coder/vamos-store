const { sql, getPool, query } = require('../config/database');

class OrderService {
  /**
   * Create COD Order inside Transaction with Row Lock & Stock Deduction
   */
  async createCodOrder({
    userId,
    recipientName,
    recipientPhone,
    deliveryAddress,
    customerNote = '',
    voucherCode = null,
  }) {
    const pool = await getPool();

    // 1. Fetch Cart Items
    const cartItemsRes = await query(`
      SELECT 
        ci.id AS cart_item_id, ci.quantity, ci.variant_id,
        pv.sku, pv.stock_quantity,
        p.id AS product_id, p.name AS product_name,
        COALESCE(p.sale_price, p.base_price) AS unit_price,
        (COALESCE(p.sale_price, p.base_price) * ci.quantity) AS line_total,
        s.size_name,
        c.color_name,
        ct.id AS cart_id
      FROM cart_items ci
      JOIN carts ct ON ci.cart_id = ct.id
      JOIN product_variants pv ON ci.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN sizes s ON pv.size_id = s.id
      JOIN colors c ON pv.color_id = c.id
      WHERE ct.user_id = @userId
    `, { userId });

    const cartItems = cartItemsRes.recordset;
    if (!cartItems || cartItems.length === 0) {
      const err = new Error('Giỏ hàng của bạn đang trống, không thể tiến hành đặt hàng');
      err.status = 400;
      throw err;
    }

    const cartId = cartItems[0].cart_id;
    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.line_total), 0);
    const shippingFee = subtotal >= 500000 ? 0 : 30000;
    let discountAmount = 0;
    let voucherId = null;
    let appliedVoucherCode = null;

    // 2. Validate Voucher if provided
    if (voucherCode && voucherCode.trim() !== '') {
      const codeTrim = voucherCode.trim().toUpperCase();
      const vouchRes = await query(`
        SELECT id, code, discount_type, discount_value, min_order_value, max_discount_amount, is_active, start_date, end_date
        FROM vouchers
        WHERE code = @code AND is_active = 1
      `, { code: codeTrim });

      if (vouchRes.recordset.length > 0) {
        const v = vouchRes.recordset[0];
        const minOrder = Number(v.min_order_value || 0);
        if (subtotal >= minOrder) {
          voucherId = v.id;
          appliedVoucherCode = v.code;
          if (v.discount_type === 'fixed_amount') {
            discountAmount = Math.min(Number(v.discount_value), subtotal);
          } else if (v.discount_type === 'percentage') {
            const calc = (subtotal * Number(v.discount_value)) / 100;
            discountAmount = v.max_discount_amount ? Math.min(calc, Number(v.max_discount_amount)) : calc;
          }
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    // 3. Begin Database Transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Step A: Lock and check stock for each variant
      for (const item of cartItems) {
        const lockReq = new sql.Request(transaction);
        lockReq.input('varId', item.variant_id);
        const lockRes = await lockReq.query(`
          SELECT id, stock_quantity, sku 
          FROM product_variants WITH (UPDLOCK, ROWLOCK) 
          WHERE id = @varId
        `);

        if (lockRes.recordset.length === 0) {
          throw new Error(`Biến thể sản phẩm #${item.sku} không còn tồn tại trên hệ thống`);
        }

        const currentStock = lockRes.recordset[0].stock_quantity;
        if (currentStock < item.quantity) {
          throw new Error(`Sản phẩm ${item.product_name} (${item.color_name} - Size ${item.size_name}) chỉ còn ${currentStock} đôi trong kho, không đủ số lượng ${item.quantity} bạn yêu cầu.`);
        }

        // Step B: Deduct stock immediately
        const deductReq = new sql.Request(transaction);
        deductReq.input('varId', item.variant_id);
        deductReq.input('qty', item.quantity);
        await deductReq.query(`
          UPDATE product_variants 
          SET stock_quantity = stock_quantity - @qty, updated_at = GETDATE()
          WHERE id = @varId
        `);

        // Step C: Log to inventory_transactions
        const invReq = new sql.Request(transaction);
        invReq.input('variantId', item.variant_id);
        invReq.input('userId', userId);
        invReq.input('oldQty', currentStock);
        invReq.input('newQty', currentStock - item.quantity);
        invReq.input('changeQty', -item.quantity);
        invReq.input('reason', `Đơn hàng COD mới (Người dùng ID: ${userId})`);
        await invReq.query(`
          INSERT INTO inventory_transactions (variant_id, user_id, old_quantity, new_quantity, change_quantity, reason)
          VALUES (@variantId, @userId, @oldQty, @newQty, @changeQty, @reason)
        `);
      }

      // Step D: Generate Unique Order Code (e.g. VAM260211-1234)
      const orderDateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderCode = `VAM${orderDateStr}-${randomSuffix}`;

      // Step E: Insert into orders table
      const orderReq = new sql.Request(transaction);
      orderReq.input('orderCode', orderCode);
      orderReq.input('userId', userId);
      orderReq.input('recName', recipientName);
      orderReq.input('recPhone', recipientPhone);
      orderReq.input('address', deliveryAddress);
      orderReq.input('subtotal', subtotal);
      orderReq.input('discount', discountAmount);
      orderReq.input('shipFee', shippingFee);
      orderReq.input('total', totalAmount);
      orderReq.input('voucherId', voucherId);
      orderReq.input('vouchCode', appliedVoucherCode);
      orderReq.input('payMethod', 'COD');
      orderReq.input('payStatus', 'UNPAID');
      orderReq.input('orderStatus', 'PENDING');
      orderReq.input('note', customerNote);

      const orderInsertRes = await orderReq.query(`
        INSERT INTO orders (
          order_code, user_id, recipient_name_snapshot, recipient_phone_snapshot,
          delivery_address_snapshot, subtotal, discount_amount, shipping_fee,
          total_amount, voucher_id, voucher_code_snapshot, payment_method,
          payment_status, order_status, customer_note
        )
        OUTPUT INSERTED.id, INSERTED.order_code
        VALUES (
          @orderCode, @userId, @recName, @recPhone,
          @address, @subtotal, @discount, @shipFee,
          @total, @voucherId, @vouchCode, @payMethod,
          @payStatus, @orderStatus, @note
        )
      `);

      const createdOrder = orderInsertRes.recordset[0];
      const newOrderId = createdOrder.id;

      // Step F: Insert order items
      for (const item of cartItems) {
        const itemReq = new sql.Request(transaction);
        itemReq.input('orderId', newOrderId);
        itemReq.input('varId', item.variant_id);
        itemReq.input('pName', item.product_name);
        itemReq.input('sku', item.sku);
        itemReq.input('size', item.size_name);
        itemReq.input('color', item.color_name);
        itemReq.input('price', item.unit_price);
        itemReq.input('qty', item.quantity);
        itemReq.input('lineTotal', item.line_total);

        await itemReq.query(`
          INSERT INTO order_items (
            order_id, product_variant_id, product_name_snapshot, sku_snapshot,
            size_snapshot, color_snapshot, unit_price, quantity, line_total
          )
          VALUES (
            @orderId, @varId, @pName, @sku,
            @size, @color, @price, @qty, @lineTotal
          )
        `);
      }

      // Step G: Insert status history
      const histReq = new sql.Request(transaction);
      histReq.input('orderId', newOrderId);
      histReq.input('changedBy', userId);
      histReq.input('newStatus', 'PENDING');
      histReq.input('histNote', 'Đơn hàng COD được tạo mới thành công bởi khách hàng.');

      await histReq.query(`
        INSERT INTO order_status_histories (order_id, changed_by, previous_status, new_status, note)
        VALUES (@orderId, @changedBy, NULL, @newStatus, @histNote)
      `);

      // Step H: Clear User Cart
      const clearReq = new sql.Request(transaction);
      clearReq.input('cartId', cartId);
      await clearReq.query('DELETE FROM cart_items WHERE cart_id = @cartId');

      // Commit Transaction
      await transaction.commit();

      return {
        id: newOrderId,
        orderCode: createdOrder.order_code,
        recipientName,
        recipientPhone,
        deliveryAddress,
        subtotal,
        shippingFee,
        discountAmount,
        totalAmount,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Cancel Order (Only permitted when order_status = 'PENDING')
   */
  async cancelOrder(orderId, userId) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Lock Order
      const orderReq = new sql.Request(transaction);
      orderReq.input('orderId', orderId);
      orderReq.input('userId', userId);
      const orderRes = await orderReq.query(`
        SELECT id, order_code, order_status, payment_status
        FROM orders WITH (UPDLOCK, ROWLOCK)
        WHERE id = @orderId AND user_id = @userId
      `);

      if (orderRes.recordset.length === 0) {
        throw new Error('Không tìm thấy đơn hàng hoặc bạn không có quyền hủy đơn hàng này.');
      }

      const order = orderRes.recordset[0];

      // Business Rule: ONLY cancel when PENDING
      if (order.order_status !== 'PENDING') {
        throw new Error(`Đơn hàng hiện đang ở trạng thái "${order.order_status}". Quý khách chỉ được hủy khi đơn hàng đang ở trạng thái "PENDING" (Chờ xác nhận).`);
      }

      // 2. Fetch order items to restore inventory
      const itemsReq = new sql.Request(transaction);
      itemsReq.input('orderId', orderId);
      const itemsRes = await itemsReq.query(`
        SELECT product_variant_id, quantity, product_name_snapshot
        FROM order_items
        WHERE order_id = @orderId
      `);

      for (const item of itemsRes.recordset) {
        // Fetch current stock
        const stockReq = new sql.Request(transaction);
        stockReq.input('varId', item.product_variant_id);
        const stockRes = await stockReq.query(`
          SELECT stock_quantity FROM product_variants WITH (UPDLOCK, ROWLOCK) WHERE id = @varId
        `);

        if (stockRes.recordset.length > 0) {
          const currentStock = stockRes.recordset[0].stock_quantity;
          const newStock = currentStock + item.quantity;

          // Restore stock
          const restoreReq = new sql.Request(transaction);
          restoreReq.input('varId', item.product_variant_id);
          restoreReq.input('newStock', newStock);
          await restoreReq.query(`
            UPDATE product_variants SET stock_quantity = @newStock, updated_at = GETDATE() WHERE id = @varId
          `);

          // Log inventory transaction
          const invReq = new sql.Request(transaction);
          invReq.input('varId', item.product_variant_id);
          invReq.input('userId', userId);
          invReq.input('oldStock', currentStock);
          invReq.input('newStock', newStock);
          invReq.input('qty', item.quantity);
          invReq.input('reason', `Hoàn tồn kho do hủy đơn hàng #${order.order_code}`);
          await invReq.query(`
            INSERT INTO inventory_transactions (variant_id, user_id, old_quantity, new_quantity, change_quantity, reason)
            VALUES (@varId, @userId, @oldStock, @newStock, @qty, @reason)
          `);
        }
      }

      // 3. Update order status
      const updateReq = new sql.Request(transaction);
      updateReq.input('orderId', orderId);
      await updateReq.query(`
        UPDATE orders 
        SET order_status = 'CANCELLED', updated_at = GETDATE() 
        WHERE id = @orderId
      `);

      // 4. Log status history
      const histReq = new sql.Request(transaction);
      histReq.input('orderId', orderId);
      histReq.input('userId', userId);
      histReq.input('note', 'Khách hàng hủy đơn khi đang chờ xác nhận (PENDING).');
      await histReq.query(`
        INSERT INTO order_status_histories (order_id, changed_by, previous_status, new_status, note)
        VALUES (@orderId, @userId, 'PENDING', 'CANCELLED', @note)
      `);

      await transaction.commit();
      return order;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Get Customer Order History
   */
  async getCustomerOrders(userId) {
    const sqlStr = `
      SELECT 
        o.id, o.order_code, o.total_amount, o.order_status, o.payment_method,
        o.payment_status, o.created_at,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
      FROM orders o
      WHERE o.user_id = @userId
      ORDER BY o.id DESC
    `;
    const res = await query(sqlStr, { userId });
    return res.recordset;
  }

  /**
   * Get Order Details
   */
  async getOrderDetails(orderId, userId = null) {
    let sqlStr = `
      SELECT 
        o.*,
        u.email AS customer_email, u.full_name AS customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = @orderId
    `;
    const params = { orderId };

    if (userId) {
      sqlStr += ' AND o.user_id = @userId';
      params.userId = userId;
    }

    const orderRes = await query(sqlStr, params);
    if (orderRes.recordset.length === 0) return null;

    const order = orderRes.recordset[0];

    // Order items
    const itemsRes = await query(`
      SELECT 
        oi.*,
        (SELECT TOP 1 image_url FROM product_images WHERE product_id = pv.product_id ORDER BY is_primary DESC, display_order ASC) AS image_url
      FROM order_items oi
      LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
      WHERE oi.order_id = @orderId
      ORDER BY oi.id ASC
    `, { orderId });

    order.items = itemsRes.recordset;

    // Status histories
    const histRes = await query(`
      SELECT osh.*, u.full_name AS changed_by_name
      FROM order_status_histories osh
      LEFT JOIN users u ON osh.changed_by = u.id
      WHERE osh.order_id = @orderId
      ORDER BY osh.created_at ASC
    `, { orderId });

    order.histories = histRes.recordset;

    return order;
  }
}

module.exports = new OrderService();
