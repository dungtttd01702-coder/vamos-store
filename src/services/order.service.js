const { sql, getPool, query } = require('../config/database');

/**
 * State Transition Matrix for VAMOS STORE
 * Enforces valid forward lifecycle and permitted cancellations
 */
const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPING'], // In v1.0, orders in processing packaging cannot be cancelled
  SHIPPING: ['COMPLETED'],  // In v1.0, orders currently out for delivery cannot be cancelled
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

class OrderService {
  /**
   * Create COD Order inside Atomic Transaction with Row Locks & Stock Deduction
   */
  async createCodOrder({
    userId,
    recipientName,
    recipientPhone,
    deliveryAddress,
    customerNote = '',
    voucherCode = null,
  }) {
    if (!userId) {
      throw new Error('Yêu cầu định danh khách hàng (userId required).');
    }
    if (!recipientName || !recipientPhone || !deliveryAddress) {
      throw new Error('Vui lòng cung cấp đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.');
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Re-read and Lock Customer Cart Items INSIDE the Transaction
      const cartReq = new sql.Request(transaction);
      cartReq.input('userId', userId);
      const cartItemsRes = await cartReq.query(`
        SELECT 
          ci.id AS cart_item_id, ci.quantity, ci.variant_id,
          pv.sku, pv.stock_quantity, pv.status AS variant_status,
          p.id AS product_id, p.name AS product_name, p.status AS product_status,
          COALESCE(p.sale_price, p.base_price) AS unit_price,
          (COALESCE(p.sale_price, p.base_price) * ci.quantity) AS line_total,
          s.size_name,
          c.color_name,
          ct.id AS cart_id
        FROM carts ct WITH (UPDLOCK, ROWLOCK)
        JOIN cart_items ci WITH (UPDLOCK, HOLDLOCK) ON ci.cart_id = ct.id
        JOIN product_variants pv ON ci.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN sizes s ON pv.size_id = s.id
        JOIN colors c ON pv.color_id = c.id
        WHERE ct.user_id = @userId
      `);

      const cartItems = cartItemsRes.recordset;
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Giỏ hàng của bạn đang trống, không thể tiến hành đặt hàng.');
      }

      const cartId = cartItems[0].cart_id;
      const subtotal = cartItems.reduce((sum, item) => sum + Number(item.line_total), 0);
      const shippingFee = subtotal >= 500000 ? 0 : 30000;
      let discountAmount = 0;
      let voucherId = null;
      let appliedVoucherCode = null;

      // 2. Lock & Validate Voucher inside Transaction if provided
      if (voucherCode && voucherCode.trim() !== '') {
        const codeTrim = voucherCode.trim().toUpperCase();
        const vouchReq = new sql.Request(transaction);
        vouchReq.input('code', codeTrim);
        const vouchRes = await vouchReq.query(`
          SELECT id, code, discount_type, discount_value, min_order_value, max_discount_amount, is_active, start_date, end_date, usage_limit, used_count
          FROM vouchers WITH (UPDLOCK, ROWLOCK)
          WHERE code = @code AND is_active = 1
            AND start_date <= GETDATE() AND end_date >= GETDATE()
        `);

        if (vouchRes.recordset.length === 0) {
          throw new Error(`Mã giảm giá "${codeTrim}" không tồn tại hoặc đã hết hạn.`);
        }

        const v = vouchRes.recordset[0];
        const minOrder = Number(v.min_order_value || 0);
        if (subtotal < minOrder) {
          throw new Error(`Mã giảm giá "${codeTrim}" yêu cầu đơn hàng tối thiểu từ ${minOrder.toLocaleString('vi-VN')} đ.`);
        }

        if (v.usage_limit > 0 && v.used_count >= v.usage_limit) {
          throw new Error(`Mã giảm giá "${codeTrim}" đã hết lượt sử dụng.`);
        }

        // Rule Q8: Enforce max 1 usage per Customer
        const vuCheckReq = new sql.Request(transaction);
        vuCheckReq.input('vouchId', v.id);
        vuCheckReq.input('userId', userId);
        const vuRes = await vuCheckReq.query(`
          SELECT 1 FROM voucher_usages WITH (UPDLOCK, ROWLOCK)
          WHERE voucher_id = @vouchId AND user_id = @userId
        `);
        if (vuRes.recordset.length > 0) {
          throw new Error(`Bạn đã từng sử dụng mã giảm giá "${codeTrim}" trước đây. Theo quy định (Q8), mỗi tài khoản chỉ được áp dụng mã này 1 lần.`);
        }

        // Calculate discount
        voucherId = v.id;
        appliedVoucherCode = v.code;
        if (v.discount_type === 'fixed_amount') {
          discountAmount = Math.min(Number(v.discount_value), subtotal);
        } else if (v.discount_type === 'percentage') {
          const calc = (subtotal * Number(v.discount_value)) / 100;
          discountAmount = v.max_discount_amount ? Math.min(calc, Number(v.max_discount_amount)) : calc;
        }

        // Conditional atomic update of voucher used_count
        const vUpdReq = new sql.Request(transaction);
        vUpdReq.input('vouchId', voucherId);
        const vUpdRes = await vUpdReq.query(`
          UPDATE vouchers
          SET used_count = used_count + 1
          WHERE id = @vouchId AND (usage_limit = 0 OR used_count < usage_limit)
        `);

        if (vUpdRes.rowsAffected[0] === 0) {
          throw new Error(`Mã giảm giá "${codeTrim}" vừa hết lượt sử dụng trong thời gian thực.`);
        }
      }

      const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

      // 3. Generate Order Code with Collision Handling
      let orderCode = null;
      let orderId = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        const orderDateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const candidateCode = `VAM${orderDateStr}-${randomSuffix}`;

        const codeChkReq = new sql.Request(transaction);
        codeChkReq.input('candCode', candidateCode);
        const codeRes = await codeChkReq.query('SELECT id FROM orders WHERE order_code = @candCode');
        if (codeRes.recordset.length === 0) {
          orderCode = candidateCode;
          break;
        }
      }

      if (!orderCode) {
        orderCode = `VAM${Date.now()}`;
      }

      // 4. Lock each variant with UPDLOCK/ROWLOCK, check retail limits & stock, and deduct
      for (const item of cartItems) {
        const itemQty = Number(item.quantity);
        if (!Number.isInteger(itemQty) || itemQty < 1 || itemQty > 10) {
          throw new Error(`Số lượng đặt mua cho sản phẩm "${item.product_name}" không hợp lệ (${item.quantity} đôi). Giới hạn bán lẻ trên website là từ 1 đến 10 đôi/sản phẩm. Quý khách có nhu cầu mua sỉ vui lòng liên hệ Hotline 1900 2126.`);
        }

        if (item.variant_status !== 'active' || item.product_status !== 'active') {
          throw new Error(`Sản phẩm "${item.product_name}" hiện đã ngừng kinh doanh.`);
        }

        const lockReq = new sql.Request(transaction);
        lockReq.input('varId', item.variant_id);
        const lockRes = await lockReq.query(`
          SELECT id, stock_quantity, sku 
          FROM product_variants WITH (UPDLOCK, ROWLOCK) 
          WHERE id = @varId
        `);

        if (lockRes.recordset.length === 0) {
          throw new Error(`Biến thể sản phẩm #${item.sku} không còn tồn tại trên hệ thống.`);
        }

        const currentStock = lockRes.recordset[0].stock_quantity;
        if (currentStock < item.quantity) {
          throw new Error(`Sản phẩm ${item.product_name} (${item.color_name} - Size ${item.size_name}) chỉ còn ${currentStock} đôi trong kho, không đủ số lượng ${item.quantity} bạn yêu cầu.`);
        }

        // Deduct stock
        const deductReq = new sql.Request(transaction);
        deductReq.input('varId', item.variant_id);
        deductReq.input('qty', item.quantity);
        await deductReq.query(`
          UPDATE product_variants 
          SET stock_quantity = stock_quantity - @qty, updated_at = GETDATE()
          WHERE id = @varId
        `);

        // Audit Log to inventory_transactions
        const invReq = new sql.Request(transaction);
        invReq.input('variantId', item.variant_id);
        invReq.input('userId', userId);
        invReq.input('oldQty', currentStock);
        invReq.input('newQty', currentStock - item.quantity);
        invReq.input('changeQty', -item.quantity);
        invReq.input('reason', `Xuất kho tạo đơn hàng #${orderCode}`);
        await invReq.query(`
          INSERT INTO inventory_transactions (variant_id, user_id, old_quantity, new_quantity, change_quantity, reason)
          VALUES (@variantId, @userId, @oldQty, @newQty, @changeQty, @reason)
        `);
      }

      // 5. Insert into orders table (Preserve recipient & address snapshot)
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
      orderReq.input('note', customerNote || '');

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

      orderId = orderInsertRes.recordset[0].id;

      // 5b. Record voucher usage to enforce one-use-per-customer rule (Q8)
      if (voucherId) {
        const vuInsReq = new sql.Request(transaction);
        vuInsReq.input('vouchId', voucherId);
        vuInsReq.input('userId', userId);
        vuInsReq.input('orderId', orderId);
        await vuInsReq.query(`
          INSERT INTO voucher_usages (voucher_id, user_id, order_id, used_at)
          VALUES (@vouchId, @userId, @orderId, GETDATE())
        `);
      }

      // 6. Insert Order Items (Preserve product name, SKU, size, color, price snapshots)
      for (const item of cartItems) {
        const itemReq = new sql.Request(transaction);
        itemReq.input('orderId', orderId);
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

      // 7. Insert Initial Order Status History
      const histReq = new sql.Request(transaction);
      histReq.input('orderId', orderId);
      histReq.input('userId', userId);
      histReq.input('note', 'Khách hàng đặt hàng COD thành công qua website.');
      await histReq.query(`
        INSERT INTO order_status_histories (order_id, changed_by, previous_status, new_status, note)
        VALUES (@orderId, @userId, NULL, 'PENDING', @note)
      `);

      // 8. Clear User's Cart
      const clearReq = new sql.Request(transaction);
      clearReq.input('cartId', cartId);
      await clearReq.query('DELETE FROM cart_items WHERE cart_id = @cartId');

      await transaction.commit();

      return {
        id: orderId,
        orderId,
        orderCode,
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
   * Internal Shared Cancellation Execution (ACID, Row Locking, Inventory Restitution, Anti-Double Cancel)
   */
  async _executeCancellation(transaction, { orderId, orderCode, actorId, note, cancelReason, previousStatus = 'PENDING' }) {
    // 1. Fetch order items to restore stock
    const itemsReq = new sql.Request(transaction);
    itemsReq.input('orderId', orderId);
    const itemsRes = await itemsReq.query(`
      SELECT product_variant_id, quantity, product_name_snapshot
      FROM order_items
      WHERE order_id = @orderId
    `);

    // 2. Lock and restore stock for each variant with audit log
    for (const item of itemsRes.recordset) {
      const stockReq = new sql.Request(transaction);
      stockReq.input('varId', item.product_variant_id);
      const stockRes = await stockReq.query(`
        SELECT stock_quantity 
        FROM product_variants WITH (UPDLOCK, ROWLOCK) 
        WHERE id = @varId
      `);

      if (stockRes.recordset.length > 0) {
        const currentStock = stockRes.recordset[0].stock_quantity;
        const newStock = currentStock + item.quantity;

        const restoreReq = new sql.Request(transaction);
        restoreReq.input('varId', item.product_variant_id);
        restoreReq.input('newStock', newStock);
        await restoreReq.query(`
          UPDATE product_variants 
          SET stock_quantity = @newStock, updated_at = GETDATE() 
          WHERE id = @varId
        `);

        const invReq = new sql.Request(transaction);
        invReq.input('varId', item.product_variant_id);
        invReq.input('userId', actorId);
        invReq.input('oldStock', currentStock);
        invReq.input('newStock', newStock);
        invReq.input('qty', item.quantity);
        invReq.input('reason', cancelReason || `Hoàn tồn kho do hủy đơn hàng #${orderCode}`);
        await invReq.query(`
          INSERT INTO inventory_transactions (variant_id, user_id, old_quantity, new_quantity, change_quantity, reason)
          VALUES (@varId, @userId, @oldStock, @newStock, @qty, @reason)
        `);
      }
    }

    // 3. Update order status to CANCELLED
    const updateReq = new sql.Request(transaction);
    updateReq.input('orderId', orderId);
    await updateReq.query(`
      UPDATE orders 
      SET order_status = 'CANCELLED', updated_at = GETDATE() 
      WHERE id = @orderId
    `);

    // 3b. Release voucher quota and remove voucher_usages record so customer can reuse the voucher
    const vouchReq = new sql.Request(transaction);
    vouchReq.input('orderId', orderId);
    const vouchRes = await vouchReq.query('SELECT voucher_id FROM orders WHERE id = @orderId');
    const appliedVoucherId = vouchRes.recordset[0]?.voucher_id;
    if (appliedVoucherId) {
      const delVuReq = new sql.Request(transaction);
      delVuReq.input('orderId', orderId);
      await delVuReq.query('DELETE FROM voucher_usages WHERE order_id = @orderId');

      const decVReq = new sql.Request(transaction);
      decVReq.input('vouchId', appliedVoucherId);
      await decVReq.query(`
        UPDATE vouchers
        SET used_count = CASE WHEN used_count > 0 THEN used_count - 1 ELSE 0 END
        WHERE id = @vouchId
      `);
    }

    // 4. Log status history
    const histReq = new sql.Request(transaction);
    histReq.input('orderId', orderId);
    histReq.input('userId', actorId);
    histReq.input('prevStatus', previousStatus);
    histReq.input('note', note || `Hủy đơn hàng #${orderCode}. Đã tự động hoàn trả tồn kho.`);
    await histReq.query(`
      INSERT INTO order_status_histories (order_id, changed_by, previous_status, new_status, note)
      VALUES (@orderId, @userId, @prevStatus, 'CANCELLED', @note)
    `);
  }

  /**
   * Cancel Order by Customer (Allowed ONLY when order_status = 'PENDING')
   */
  async cancelOrder(orderId, userId, reason = '') {
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

      // Anti Double Restitution: Check if already CANCELLED
      if (order.order_status === 'CANCELLED') {
        throw new Error(`Đơn hàng #${order.order_code} đã ở trạng thái ĐÃ HỦY (CANCELLED), không thể hủy thêm lần nữa.`);
      }

      // Rule: Customer can ONLY cancel PENDING orders
      if (order.order_status !== 'PENDING') {
        throw new Error(`Đơn hàng hiện đang ở trạng thái "${order.order_status}". Quý khách chỉ được hủy khi đơn hàng đang ở trạng thái "PENDING" (Chờ xác nhận).`);
      }

      // Execute shared cancellation logic
      await this._executeCancellation(transaction, {
        orderId: order.id,
        orderCode: order.order_code,
        actorId: userId,
        note: reason ? `Khách hàng hủy đơn: ${reason}` : 'Khách hàng tự hủy đơn khi đang chờ xác nhận.',
        cancelReason: `Hoàn tồn kho do khách hủy đơn hàng #${order.order_code}`,
      });

      await transaction.commit();
      return { success: true, orderId: order.id, orderCode: order.order_code, status: 'CANCELLED' };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Update Order Status by Admin with Matrix Verification & Audit Trail
   */
  async updateOrderStatusByAdmin({ orderId, newStatus, adminUserId, adminId, note = '' }) {
    const actorId = adminUserId || adminId;
    if (!actorId) {
      throw new Error('Yêu cầu định danh quản trị viên thực hiện thao tác (adminUserId required).');
    }

    const allowedStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error(`Trạng thái "${newStatus}" không hợp lệ trong hệ thống.`);
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Verify that actor is a valid, active ADMIN
      const adminReq = new sql.Request(transaction);
      adminReq.input('adminId', actorId);
      const adminRes = await adminReq.query(`
        SELECT id, role, status FROM users WHERE id = @adminId
      `);
      if (adminRes.recordset.length === 0 || adminRes.recordset[0].role !== 'ADMIN' || adminRes.recordset[0].status !== 'active') {
        throw new Error('Tài khoản thực hiện không có quyền Quản trị viên (ADMIN) hoặc đã bị khóa.');
      }

      // 2. Lock Order
      const orderReq = new sql.Request(transaction);
      orderReq.input('orderId', orderId);
      const orderRes = await orderReq.query(`
        SELECT id, order_code, order_status, payment_status
        FROM orders WITH (UPDLOCK, ROWLOCK)
        WHERE id = @orderId
      `);

      if (orderRes.recordset.length === 0) {
        throw new Error(`Không tìm thấy đơn hàng #${orderId}`);
      }

      const currentOrder = orderRes.recordset[0];
      const oldStatus = currentOrder.order_status;

      // Idempotency: if already in target status, return cleanly
      if (oldStatus === newStatus) {
        await transaction.commit();
        return { id: orderId, oldStatus, newStatus, paymentStatus: currentOrder.payment_status };
      }

      // 3. State Transition Matrix Check
      const allowedNext = VALID_TRANSITIONS[oldStatus] || [];
      if (!allowedNext.includes(newStatus)) {
        throw new Error(`Không thể chuyển trạng thái đơn hàng từ "${oldStatus}" sang "${newStatus}". Luồng chuyển trạng thái không được phép.`);
      }

      // 4. Handle CANCELLED (Restores inventory & logs audit)
      if (newStatus === 'CANCELLED') {
        await this._executeCancellation(transaction, {
          orderId: currentOrder.id,
          orderCode: currentOrder.order_code,
          actorId,
          note: note || `Admin hủy đơn hàng #${currentOrder.order_code}`,
          cancelReason: `Admin hủy đơn hàng #${currentOrder.order_code}`,
          previousStatus: oldStatus,
        });

        await transaction.commit();
        return { id: orderId, oldStatus, newStatus: 'CANCELLED', paymentStatus: currentOrder.payment_status };
      }

      // 5. COD Payment Rule: payment_status = 'PAID' ONLY when order_status = 'COMPLETED'
      let newPaymentStatus = currentOrder.payment_status;
      if (newStatus === 'COMPLETED') {
        newPaymentStatus = 'PAID';
      }

      // 6. Update orders table
      const updateReq = new sql.Request(transaction);
      updateReq.input('orderId', orderId);
      updateReq.input('newStatus', newStatus);
      updateReq.input('payStatus', newPaymentStatus);
      await updateReq.query(`
        UPDATE orders 
        SET order_status = @newStatus, payment_status = @payStatus, updated_at = GETDATE() 
        WHERE id = @orderId
      `);

      // 7. Log History
      const histReq = new sql.Request(transaction);
      histReq.input('orderId', orderId);
      histReq.input('adminId', actorId);
      histReq.input('oldStatus', oldStatus);
      histReq.input('newStatus', newStatus);
      histReq.input('histNote', note || `Admin cập nhật trạng thái đơn hàng từ ${oldStatus} sang ${newStatus}`);
      await histReq.query(`
        INSERT INTO order_status_histories (order_id, changed_by, previous_status, new_status, note)
        VALUES (@orderId, @adminId, @oldStatus, @newStatus, @histNote)
      `);

      await transaction.commit();
      return { id: orderId, oldStatus, newStatus, paymentStatus: newPaymentStatus };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Get Orders of a Customer
   */
  async getOrdersByUser(userId) {
    const sqlStr = `
      SELECT 
        o.id, o.order_code, o.total_amount, o.order_status, o.payment_status, o.created_at,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count,
        (SELECT TOP 1 product_name_snapshot FROM order_items WHERE order_id = o.id) AS first_item_name
      FROM orders o
      WHERE o.user_id = @userId
      ORDER BY o.id DESC
    `;
    const res = await query(sqlStr, { userId });
    return res.recordset;
  }

  /**
   * Get Order Details by Numeric ID or Order Code String (User Isolated)
   */
  async getOrderDetails(orderIdentifier, userId = null) {
    const isNumeric = /^\d+$/.test(String(orderIdentifier).trim());
    let sqlStr = `
      SELECT 
        o.*,
        u.email AS customer_email, u.full_name AS customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE ${isNumeric ? 'o.id = @orderId' : 'o.order_code = @orderCode'}
    `;
    const params = isNumeric ? { orderId: parseInt(orderIdentifier, 10) } : { orderCode: String(orderIdentifier).trim() };

    if (userId) {
      sqlStr += ' AND o.user_id = @userId';
      params.userId = userId;
    }

    const orderRes = await query(sqlStr, params);
    if (orderRes.recordset.length === 0) return null;

    const order = orderRes.recordset[0];
    const orderId = order.id;

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
