# COD Checkout Transaction Flow Example

This example demonstrates how VAMOS STORE handles checkout transactions safely to prevent overselling and data inconsistencies.

## 1. Flow Diagram (UML Sequence Concept)

```
Customer              OrderController          OrderService             MySQL (Pool Connection)
   |                         |                      |                               |
   |-- POST /checkout ------>|                      |                               |
   |   (address_id, note)    |-- processCheckout()->|                               |
   |                         |                      |-- START TRANSACTION --------->|
   |                         |                      |                               |
   |                         |                      |-- SELECT cart_items --------->|
   |                         |                      |   FOR UPDATE (lock variants)  |
   |                         |                      |                               |
   |                         |                      |-- Verify stock >= quantity -->|
   |                         |                      |                               |
   |                         |                      |-- INSERT INTO orders -------->|
   |                         |                      |   (status: PENDING, COD,      |
   |                         |                      |    payment_status: UNPAID)    |
   |                         |                      |                               |
   |                         |                      |-- INSERT INTO order_items --->|
   |                         |                      |                               |
   |                         |                      |-- UPDATE product_variants --->|
   |                         |                      |   stock_quantity = stock - qty|
   |                         |                      |                               |
   |                         |                      |-- INSERT inventory_trans ---->|
   |                         |                      |                               |
   |                         |                      |-- INSERT order_status_hist -->|
   |                         |                      |                               |
   |                         |                      |-- DELETE FROM cart_items ---->|
   |                         |                      |                               |
   |                         |                      |-- COMMIT -------------------->|
   |                         |<-- Order Created ----|                               |
   |<-- 201 /order-success --|                      |                               |
```

## 2. Code Pattern (Node.js / Express / MySQL2 Pool)

```javascript
// Example service method using an explicit transaction
async function createCodOrder({ userId, addressId, voucherCode, note }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch cart items with pessimistic locking on variants
    const [cartItems] = await connection.query(
      `SELECT ci.variant_id, ci.quantity, pv.stock_quantity, pv.price, p.name 
       FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       JOIN product_variants pv ON ci.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       WHERE c.user_id = ? FOR UPDATE`,
      [userId],
    );

    if (cartItems.length === 0) {
      throw new Error("Giỏ hàng trống");
    }

    // 2. Validate stock availability
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        throw new Error(
          `Sản phẩm "${item.name}" không đủ số lượng tồn kho (còn: ${item.stock_quantity})`,
        );
      }
    }

    // 3. Recalculate totals server-side
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shippingFee = 30000; // Business rule
    const discountAmount = 0; // Apply voucher logic if valid
    const totalAmount = subtotal - discountAmount + shippingFee;

    // 4. Insert into orders (Payment: COD, Status: PENDING, Payment status: UNPAID)
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, address_id, total_amount, subtotal, shipping_fee, discount_amount, payment_method, order_status, payment_status, note)
       VALUES (?, ?, ?, ?, ?, ?, 'COD', 'PENDING', 'UNPAID', ?)`,
      [
        userId,
        addressId,
        totalAmount,
        subtotal,
        shippingFee,
        discountAmount,
        note,
      ],
    );
    const orderId = orderResult.insertId;

    // 5. Insert order items & update inventory with audit logging
    for (const item of cartItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, variant_id, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          item.variant_id,
          item.quantity,
          item.price,
          item.price * item.quantity,
        ],
      );

      const oldQuantity = item.stock_quantity;
      const newQuantity = oldQuantity - item.quantity;

      await connection.query(
        `UPDATE product_variants SET stock_quantity = ? WHERE id = ?`,
        [newQuantity, item.variant_id],
      );

      await connection.query(
        `INSERT INTO inventory_transactions (variant_id, old_quantity, new_quantity, change_quantity, transaction_type, reference_type, reference_id, user_id)
         VALUES (?, ?, ?, ?, 'EXPORT', 'ORDER', ?, ?)`,
        [
          item.variant_id,
          oldQuantity,
          newQuantity,
          -item.quantity,
          orderId,
          userId,
        ],
      );
    }

    // 6. Record initial order status history
    await connection.query(
      `INSERT INTO order_status_histories (order_id, from_status, to_status, user_id, note)
       VALUES (?, NULL, 'PENDING', ?, 'Đơn hàng mới tạo qua hình thức COD')`,
      [orderId, userId],
    );

    // 7. Clear cart items
    await connection.query(
      `DELETE ci FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE c.user_id = ?`,
      [userId],
    );

    await connection.commit();
    return { orderId, totalAmount, orderStatus: "PENDING" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Example service method for Customer cancellation (strictly allowed ONLY when status is PENDING)
 */
async function cancelPendingOrder({ orderId, userId, reason }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Lock and verify order ownership and status
    const [orders] = await connection.query(
      `SELECT id, user_id, order_status FROM orders WHERE id = ? AND user_id = ? FOR UPDATE`,
      [orderId, userId]
    );

    if (orders.length === 0) {
      throw new Error('Đơn hàng không tồn tại hoặc không thuộc về người dùng');
    }

    const order = orders[0];
    if (order.order_status !== 'PENDING') {
      throw new Error('Khách hàng chỉ được phép hủy đơn hàng khi đơn ở trạng thái PENDING');
    }

    // 2. Fetch order items to restore stock
    const [items] = await connection.query(
      `SELECT oi.variant_id, oi.quantity, pv.stock_quantity 
       FROM order_items oi
       JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = ? FOR UPDATE`,
      [orderId]
    );

    // 3. Re-stock variants & record inventory transactions
    for (const item of items) {
      const oldQuantity = item.stock_quantity;
      const newQuantity = oldQuantity + item.quantity;

      await connection.query(
        `UPDATE product_variants SET stock_quantity = ? WHERE id = ?`,
        [newQuantity, item.variant_id]
      );

      await connection.query(
        `INSERT INTO inventory_transactions (variant_id, old_quantity, new_quantity, change_quantity, transaction_type, reference_type, reference_id, user_id)
         VALUES (?, ?, ?, ?, 'IMPORT', 'CANCELLED_ORDER', ?, ?)`,
        [item.variant_id, oldQuantity, newQuantity, item.quantity, orderId, userId]
      );
    }

    // 4. Update order status to CANCELLED
    await connection.query(
      `UPDATE orders SET order_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [orderId]
    );

    // 5. Append order status history
    await connection.query(
      `INSERT INTO order_status_histories (order_id, from_status, to_status, user_id, note)
       VALUES (?, 'PENDING', 'CANCELLED', ?, ?)`,
      [orderId, userId, reason || 'Khách hàng hủy đơn khi đang ở trạng thái PENDING']
    );

    await connection.commit();
    return { orderId, orderStatus: 'CANCELLED' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```
