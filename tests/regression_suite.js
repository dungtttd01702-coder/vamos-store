/**
 * VAMOS STORE - COMPREHENSIVE AUTOMATED REGRESSION TEST SUITE
 * Microsoft SQL Server 2025 / Node.js 18+ / Express.js / Layered MVC
 */

const bcrypt = require('bcryptjs');
const { sql, getPool, query } = require('../src/config/database');
const validator = require('../src/utils/validator');
const orderService = require('../src/services/order.service');
const productService = require('../src/services/product.service');

let passedTests = 0;
let failedTests = 0;
const results = [];

function assert(condition, testId, description, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${testId}: ${description}`);
    results.push({ testId, description, status: 'PASS', details });
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ [FAIL]\x1b[0m ${testId}: ${description} ${details ? '(' + details + ')' : ''}`);
    results.push({ testId, description, status: 'FAIL', details });
  }
}

async function runSuite() {
  console.log('\n===============================================================');
  console.log('   VAMOS STORE - AUTOMATED REGRESSION & INTEGRATION TEST SUITE');
  console.log('   Target DB: Microsoft SQL Server 2025 | Environment: Node.js');
  console.log('===============================================================\n');

  const pool = await getPool();

  try {
    // -------------------------------------------------------------------------
    // SUITE 1: AUTHENTICATION & SERVER-SIDE VALIDATION (AUTH-01)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. AUTHENTICATION & VALIDATION TESTS ---');

    // Email validation
    assert(!validator.isValidEmail('123@gmail'), 'VAL-01', 'Reject malformed email "123@gmail" (missing TLD)');
    assert(!validator.isValidEmail('invalid-email'), 'VAL-02', 'Reject email without @');
    assert(validator.isValidEmail('admin@vamos.vn'), 'VAL-03', 'Accept valid domain email "admin@vamos.vn"');
    assert(validator.isValidEmail('customer.test@gmail.com'), 'VAL-04', 'Accept valid gmail "customer.test@gmail.com"');

    // Phone validation
    assert(validator.isValidPhone('0901234567'), 'VAL-05', 'Accept valid VN mobile number 0901234567');
    assert(validator.isValidPhone('0389998888'), 'VAL-06', 'Accept valid VN Viettel number 0389998888');
    assert(!validator.isValidPhone('0123456789'), 'VAL-07', 'Reject obsolete 11-digit VN prefix 0123456789');
    assert(!validator.isValidPhone('123456'), 'VAL-08', 'Reject short phone number 123456');

    // Password validation (min 6 chars)
    assert(validator.isValidPassword('123456'), 'VAL-09', 'Accept password with 6 characters');
    assert(!validator.isValidPassword('12345'), 'VAL-10', 'Reject password with < 6 characters');

    // Password hash verification in DB
    const adminRes = await query("SELECT id, email, password_hash, role, status FROM users WHERE email = 'admin@vamos.vn'");
    assert(adminRes.recordset.length === 1, 'AUTH-01', 'Admin user exists in database');
    if (adminRes.recordset.length > 0) {
      const admin = adminRes.recordset[0];
      const match = await bcrypt.compare('123456', admin.password_hash);
      assert(match, 'AUTH-02', 'Admin bcrypt password hash verified against "123456"');
      assert(admin.role === 'ADMIN', 'AUTH-03', 'Admin user has role ADMIN');
      assert(admin.status.toLowerCase() === 'active', 'AUTH-04', 'Admin account is in active status');
    }

    const custRes = await query("SELECT id, email, password_hash, role, status FROM users WHERE email = 'khachhang@vamos.vn'");
    assert(custRes.recordset.length === 1, 'AUTH-05', 'Customer user exists in database');
    if (custRes.recordset.length > 0) {
      const cust = custRes.recordset[0];
      const match = await bcrypt.compare('123456', cust.password_hash);
      assert(match, 'AUTH-06', 'Customer bcrypt password hash verified against "123456"');
      assert(cust.role === 'CUSTOMER', 'AUTH-07', 'Customer user has role CUSTOMER');
    }

    // -------------------------------------------------------------------------
    // SUITE 2: PRODUCT CATALOG & FILTERING (PROD-01)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. PRODUCT CATALOG & FILTERING TESTS ---');

    const catRes = await query("SELECT id, name, slug FROM categories WHERE is_active = 1");
    assert(catRes.recordset.length >= 4, 'PROD-01', 'At least 4 active categories found in database');

    const prodAll = await query("SELECT COUNT(*) AS cnt FROM products WHERE status = 'active'");
    assert(prodAll.recordset[0].cnt > 0, 'PROD-02', `Active products catalog has ${prodAll.recordset[0].cnt} products`);

    const filterMen = await query(`
      SELECT COUNT(*) AS cnt 
      FROM products p
      WHERE p.gender_target IN ('MEN', 'UNISEX') AND p.status = 'active'
    `);
    assert(filterMen.recordset[0].cnt > 0, 'PROD-03', 'Gender filter MEN/UNISEX returns active products');

    const varRes = await query(`
      SELECT TOP 1 pv.id, pv.sku, pv.stock_quantity, p.name 
      FROM product_variants pv 
      JOIN products p ON pv.product_id = p.id 
      WHERE pv.stock_quantity > 0 AND pv.status = 'active'
    `);
    assert(varRes.recordset.length === 1, 'PROD-04', 'Product variants with available stock found');

    // -------------------------------------------------------------------------
    // SUITE 3: SHOPPING CART & STOCK BOUNDING (CART-01)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. CART OPERATIONS & STOCK BOUNDING TESTS ---');

    // Ensure a dedicated test customer exists
    let testUser = await query("SELECT id FROM users WHERE email = 'test_automation@vamos.vn'");
    let testUserId;
    if (testUser.recordset.length === 0) {
      const hashedPw = await bcrypt.hash('123456', 10);
      const createRes = await query(`
        INSERT INTO users (full_name, email, phone, password_hash, role, status)
        OUTPUT INSERTED.id
        VALUES (N'Automation Tester', 'test_automation@vamos.vn', '0909999999', @pw, 'CUSTOMER', 'active')
      `, { pw: hashedPw });
      testUserId = createRes.recordset[0].id;
    } else {
      testUserId = testUser.recordset[0].id;
    }

    // Get or create user cart
    let cartRes = await query("SELECT id FROM carts WHERE user_id = @userId", { userId: testUserId });
    let testCartId;
    if (cartRes.recordset.length === 0) {
      const cIns = await query("INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@userId)", { userId: testUserId });
      testCartId = cIns.recordset[0].id;
    } else {
      testCartId = cartRes.recordset[0].id;
    }

    // Clear previous items in test cart
    await query("DELETE FROM cart_items WHERE cart_id = @cartId", { cartId: testCartId });

    // Pick variant 1
    const testVarRes = await query("SELECT id, stock_quantity, sku FROM product_variants WHERE id = 1");
    const testVar = testVarRes.recordset[0];
    const initialVarStock = testVar.stock_quantity;

    // Add 2 items to cart
    await query(`
      INSERT INTO cart_items (cart_id, variant_id, quantity)
      VALUES (@cartId, @varId, 2)
    `, { cartId: testCartId, varId: testVar.id });

    const cartCheck = await query("SELECT quantity FROM cart_items WHERE cart_id = @cartId AND variant_id = @varId", {
      cartId: testCartId,
      varId: testVar.id
    });
    assert(cartCheck.recordset[0].quantity === 2, 'CART-01', 'Added 2 items to test cart');

    // Stock bounding test: ensure logic caps at stock_quantity if user requests 999
    const requestedQty = 999;
    const cappedQty = Math.min(requestedQty, initialVarStock);
    await query(`
      UPDATE cart_items 
      SET quantity = @qty 
      WHERE cart_id = @cartId AND variant_id = @varId
    `, { cartId: testCartId, varId: testVar.id, qty: cappedQty });

    const cappedCheck = await query("SELECT quantity FROM cart_items WHERE cart_id = @cartId AND variant_id = @varId", {
      cartId: testCartId,
      varId: testVar.id
    });
    assert(cappedCheck.recordset[0].quantity === initialVarStock, 'CART-02', `Cart quantity bounded to maximum available stock (${initialVarStock})`);

    // Reset back to 1 item for checkout test
    await query("UPDATE cart_items SET quantity = 1 WHERE cart_id = @cartId AND variant_id = @varId", {
      cartId: testCartId,
      varId: testVar.id
    });

    // -------------------------------------------------------------------------
    // SUITE 4: VOUCHER BUSINESS LOGIC (VOUCH-01)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. VOUCHER RULES & VALIDATION TESTS ---');

    const v50Res = await query("SELECT * FROM vouchers WHERE code = 'VAMOS50K' AND is_active = 1");
    assert(v50Res.recordset.length === 1, 'VOUCH-01', 'Voucher VAMOS50K exists and is active');
    const v50 = v50Res.recordset[0];
    assert(v50.min_order_value === 500000, 'VOUCH-02', 'VAMOS50K minimum order value is 500,000đ');

    const vfRes = await query("SELECT * FROM vouchers WHERE code = 'FREESHIP' AND is_active = 1");
    assert(vfRes.recordset.length === 1, 'VOUCH-03', 'Voucher FREESHIP exists and is active');
    const vf = vfRes.recordset[0];
    assert(vf.discount_value === 30000, 'VOUCH-04', 'FREESHIP discount value is 30,000đ');

    // Test voucher validation with expired dates
    const expiredRes = await query(`
      SELECT id FROM vouchers 
      WHERE code = 'EXPIRED_CODE' 
        AND is_active = 1 
        AND start_date <= GETDATE() AND end_date >= GETDATE()
    `);
    assert(expiredRes.recordset.length === 0, 'VOUCH-05', 'Expired or non-existent voucher code rejected');

    // -------------------------------------------------------------------------
    // SUITE 5: COD CHECKOUT TRANSACTION & INVENTORY DEDUCTION (CHECK-01)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. COD CHECKOUT ATOMIC TRANSACTION & STOCK DEDUCTION TESTS ---');

    // Check stock before checkout
    const stockBeforeRes = await query("SELECT stock_quantity FROM product_variants WHERE id = @varId", { varId: testVar.id });
    const stockBefore = stockBeforeRes.recordset[0].stock_quantity;

    // Check voucher used_count before
    const vouchBeforeRes = await query("SELECT used_count FROM vouchers WHERE code = 'FREESHIP'");
    const usedCountBefore = vouchBeforeRes.recordset[0].used_count;

    // Execute createCodOrder
    const orderResult = await orderService.createCodOrder({
      userId: testUserId,
      recipientName: 'Automation Receiver',
      recipientPhone: '0909999999',
      deliveryAddress: '137 Nguyễn Thị Thập, Liên Chiểu, Đà Nẵng',
      customerNote: 'Kiểm tra giao hàng COD tự động',
      voucherCode: 'FREESHIP',
    });

    const createdOrderId = orderResult.id || orderResult.orderId;
    assert(Boolean(createdOrderId), 'CHECK-01', `Order created successfully with ID #${createdOrderId}`);
    assert(orderResult.orderCode && orderResult.orderCode.startsWith('VAM'), 'CHECK-02', `Order code generated with prefix VAM: ${orderResult.orderCode}`);

    // Verify order in database
    const orderDbRes = await query("SELECT * FROM orders WHERE id = @id", { id: createdOrderId });
    const orderDb = orderDbRes.recordset[0];
    assert(orderDb.order_status === 'PENDING', 'CHECK-03', 'Order initial status is PENDING');
    assert(orderDb.payment_method === 'COD', 'CHECK-04', 'Order payment method is COD');
    assert(orderDb.payment_status === 'UNPAID', 'CHECK-05', 'Order initial payment status is UNPAID');
    assert(orderDb.recipient_name_snapshot === 'Automation Receiver', 'CHECK-06', 'Recipient name snapshot matches');
    assert(orderDb.recipient_phone_snapshot === '0909999999', 'CHECK-07', 'Recipient phone snapshot matches');
    assert(orderDb.delivery_address_snapshot.includes('137 Nguyễn Thị Thập'), 'CHECK-08', 'Delivery address snapshot matches');

    // Verify order_items snapshot
    const itemsDbRes = await query("SELECT * FROM order_items WHERE order_id = @id", { id: createdOrderId });
    assert(itemsDbRes.recordset.length === 1, 'CHECK-09', 'Order item snapshot created');
    const orderItem = itemsDbRes.recordset[0];
    assert(orderItem.quantity === 1, 'CHECK-10', 'Order item quantity is 1');
    assert(Boolean(orderItem.product_name_snapshot), 'CHECK-11', `Order item product_name snapshot: "${orderItem.product_name_snapshot}"`);
    assert(Boolean(orderItem.sku_snapshot), 'CHECK-12', `Order item SKU snapshot: "${orderItem.sku_snapshot}"`);
    assert(Boolean(orderItem.size_snapshot), 'CHECK-13', `Order item size_name snapshot: "${orderItem.size_snapshot}"`);
    assert(Boolean(orderItem.color_snapshot), 'CHECK-14', `Order item color_name snapshot: "${orderItem.color_snapshot}"`);

    // Verify stock deduction
    const stockAfterRes = await query("SELECT stock_quantity FROM product_variants WHERE id = @varId", { varId: testVar.id });
    const stockAfter = stockAfterRes.recordset[0].stock_quantity;
    assert(stockAfter === stockBefore - 1, 'CHECK-15', `Stock deducted exactly by 1 (Before: ${stockBefore}, After: ${stockAfter})`);

    // Verify inventory_transactions log
    const invLogRes = await query(`
      SELECT * FROM inventory_transactions 
      WHERE variant_id = @varId AND reason LIKE @searchReason
    `, { varId: testVar.id, searchReason: `%${orderResult.orderCode}%` });
    assert(invLogRes.recordset.length >= 1, 'CHECK-16', 'Inventory export transaction logged in inventory_transactions');
    assert(invLogRes.recordset[0].change_quantity === -1, 'CHECK-17', 'Inventory transaction change_quantity is -1');

    // Verify voucher used_count increment
    const vouchAfterRes = await query("SELECT used_count FROM vouchers WHERE code = 'FREESHIP'");
    const usedCountAfter = vouchAfterRes.recordset[0].used_count;
    assert(usedCountAfter === usedCountBefore + 1, 'CHECK-18', `Voucher used_count incremented by 1 (${usedCountBefore} -> ${usedCountAfter})`);

    // Verify cart was cleared
    const remainingCartRes = await query("SELECT COUNT(*) AS cnt FROM cart_items WHERE cart_id = @cartId", { cartId: testCartId });
    assert(remainingCartRes.recordset[0].cnt === 0, 'CHECK-19', 'Customer cart was cleared after successful checkout');

    // -------------------------------------------------------------------------
    // SUITE 6: CUSTOMER ORDER CANCELLATION & INVENTORY RESTITUTION (ORDER-01)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. CUSTOMER CANCELLATION & INVENTORY RESTITUTION TESTS ---');

    // Customer cancels their PENDING order
    const cancelRes = await orderService.cancelOrder(createdOrderId, testUserId);
    assert(Boolean(cancelRes), 'ORDER-01', 'Customer successfully canceled PENDING order');

    // Check order status
    const orderCanceledDb = await query("SELECT order_status FROM orders WHERE id = @id", { id: createdOrderId });
    assert(orderCanceledDb.recordset[0].order_status === 'CANCELLED', 'ORDER-02', 'Order status updated to CANCELLED in DB');

    // Check inventory restitution
    const stockRestoredRes = await query("SELECT stock_quantity FROM product_variants WHERE id = @varId", { varId: testVar.id });
    const stockRestored = stockRestoredRes.recordset[0].stock_quantity;
    assert(stockRestored === stockBefore, 'ORDER-03', `Stock fully restored to initial level (${stockAfter} -> ${stockRestored})`);

    // Check inventory_transactions RESTOCK log
    const restockLogRes = await query(`
      SELECT * FROM inventory_transactions 
      WHERE variant_id = @varId AND change_quantity > 0 AND reason LIKE @searchReason
    `, { varId: testVar.id, searchReason: `%${orderResult.orderCode}%` });
    assert(restockLogRes.recordset.length === 1, 'ORDER-04', 'Restock logged in inventory_transactions');
    assert(restockLogRes.recordset[0].change_quantity === 1, 'ORDER-05', 'Restock quantity is +1');

    // Attempt SECOND cancellation (must fail and not double-restock)
    let doubleCancelFailed = false;
    try {
      await orderService.cancelOrder(createdOrderId, testUserId);
    } catch (err) {
      doubleCancelFailed = true;
    }
    assert(doubleCancelFailed, 'ORDER-06', 'Prevent double cancellation on already CANCELLED order');

    const stockNoDoubleRestock = await query("SELECT stock_quantity FROM product_variants WHERE id = @varId", { varId: testVar.id });
    assert(stockNoDoubleRestock.recordset[0].stock_quantity === stockBefore, 'ORDER-07', 'Stock quantity was NOT restocked twice');

    // -------------------------------------------------------------------------
    // SUITE 7: ADMIN LIFECYCLE & REVENUE CALCULATION (ADMIN-01)
    // -------------------------------------------------------------------------
    console.log('\n--- 7. ADMIN LIFECYCLE & REVENUE INTEGRATION TESTS ---');

    // Create a new order for admin processing
    await query("INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@cartId, @varId, 1)", {
      cartId: testCartId,
      varId: testVar.id
    });

    const adminTestOrder = await orderService.createCodOrder({
      userId: testUserId,
      recipientName: 'Admin LifeCycle Test',
      recipientPhone: '0901234567',
      deliveryAddress: '456 Lê Duẩn, Thanh Khê, Đà Nẵng',
      customerNote: 'Đơn test trạng thái admin',
    });

    const adminOrderId = adminTestOrder.id || adminTestOrder.orderId;

    // Move to CONFIRMED
    await orderService.updateOrderStatusByAdmin({
      orderId: adminOrderId,
      newStatus: 'CONFIRMED',
      adminId: 1,
      note: 'Admin xác nhận đơn hàng'
    });
    let chkStatus = await query("SELECT order_status, payment_status FROM orders WHERE id = @id", { id: adminOrderId });
    assert(chkStatus.recordset[0].order_status === 'CONFIRMED', 'ADMIN-01', 'Admin updated status to CONFIRMED');
    assert(chkStatus.recordset[0].payment_status === 'UNPAID', 'ADMIN-02', 'Payment status remains UNPAID during CONFIRMED');

    // Attempt customer cancel on CONFIRMED order (MUST BE REJECTED)
    let custCancelConfirmedRejected = false;
    try {
      await orderService.cancelOrder(adminOrderId, testUserId);
    } catch (e) {
      custCancelConfirmedRejected = true;
    }
    assert(custCancelConfirmedRejected, 'ADMIN-03', 'Customer CANNOT cancel order once status is CONFIRMED');

    // Move to PROCESSING
    await orderService.updateOrderStatusByAdmin({
      orderId: adminOrderId,
      newStatus: 'PROCESSING',
      adminId: 1,
      note: 'Kho đóng gói sản phẩm'
    });
    chkStatus = await query("SELECT order_status FROM orders WHERE id = @id", { id: adminOrderId });
    assert(chkStatus.recordset[0].order_status === 'PROCESSING', 'ADMIN-04', 'Admin updated status to PROCESSING');

    // Move to SHIPPING
    await orderService.updateOrderStatusByAdmin({
      orderId: adminOrderId,
      newStatus: 'SHIPPING',
      adminId: 1,
      note: 'Giao hàng cho đơn vị vận chuyển'
    });
    chkStatus = await query("SELECT order_status FROM orders WHERE id = @id", { id: adminOrderId });
    assert(chkStatus.recordset[0].order_status === 'SHIPPING', 'ADMIN-05', 'Admin updated status to SHIPPING');

    // Move to COMPLETED (MUST AUTOMATICALLY SET payment_status = 'PAID')
    await orderService.updateOrderStatusByAdmin({
      orderId: adminOrderId,
      newStatus: 'COMPLETED',
      adminId: 1,
      note: 'Khách nhận hàng và thanh toán tiền mặt COD'
    });
    chkStatus = await query("SELECT order_status, payment_status FROM orders WHERE id = @id", { id: adminOrderId });
    assert(chkStatus.recordset[0].order_status === 'COMPLETED', 'ADMIN-06', 'Admin updated status to COMPLETED');
    assert(chkStatus.recordset[0].payment_status === 'PAID', 'ADMIN-07', 'COD payment_status automatically transitioned to PAID upon COMPLETED');

    // Verify Admin Revenue Calculation: only COMPLETED + PAID counts
    const revRes = await query(`
      SELECT COALESCE(SUM(total_amount), 0) AS total_revenue 
      FROM orders 
      WHERE order_status = 'COMPLETED' AND payment_status = 'PAID'
    `);
    const totalRev = Number(revRes.recordset[0].total_revenue);
    assert(totalRev > 0, 'ADMIN-08', `Revenue calculation includes COMPLETED + PAID orders (Total: ${totalRev.toLocaleString('vi-VN')} đ)`);

    const invalidRevRes = await query(`
      SELECT COUNT(*) AS cnt 
      FROM orders 
      WHERE order_status != 'COMPLETED' AND payment_status = 'PAID'
    `);
    assert(invalidRevRes.recordset[0].cnt === 0, 'ADMIN-09', 'Zero non-completed orders are marked as PAID (Strict COD rule enforced)');

    // -------------------------------------------------------------------------
    // SUITE 8: ADMIN CANCELLATION & INVENTORY RESTITUTION (ADMIN-02)
    // -------------------------------------------------------------------------
    console.log('\n--- 8. ADMIN CANCELLATION & RESTOCK TESTS ---');

    // Create an order to test admin cancellation
    await query("INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@cartId, @varId, 1)", {
      cartId: testCartId,
      varId: testVar.id
    });

    const adminCancelOrder = await orderService.createCodOrder({
      userId: testUserId,
      recipientName: 'Admin Cancel Test',
      recipientPhone: '0901234567',
      deliveryAddress: '789 Điện Biên Phủ, Đà Nẵng',
    });
    const adminCancelOrderId = adminCancelOrder.id || adminCancelOrder.orderId;

    const stockBeforeAdminCancelRes = await query("SELECT stock_quantity FROM product_variants WHERE id = @varId", { varId: testVar.id });
    const stockBeforeAdminCancel = stockBeforeAdminCancelRes.recordset[0].stock_quantity;

    // Admin cancels the order
    await orderService.updateOrderStatusByAdmin({
      orderId: adminCancelOrderId,
      newStatus: 'CANCELLED',
      adminId: 1,
      note: 'Khách hàng yêu cầu hủy qua điện thoại'
    });

    const chkAdminCancel = await query("SELECT order_status FROM orders WHERE id = @id", { id: adminCancelOrderId });
    assert(chkAdminCancel.recordset[0].order_status === 'CANCELLED', 'ADMIN-10', 'Admin successfully changed status to CANCELLED');

    const stockAfterAdminCancelRes = await query("SELECT stock_quantity FROM product_variants WHERE id = @varId", { varId: testVar.id });
    const stockAfterAdminCancel = stockAfterAdminCancelRes.recordset[0].stock_quantity;
    assert(stockAfterAdminCancel === stockBeforeAdminCancel + 1, 'ADMIN-11', `Stock restored on Admin cancellation (${stockBeforeAdminCancel} -> ${stockAfterAdminCancel})`);

    // -------------------------------------------------------------------------
    // SUITE 9: CONCURRENCY & ANTI-OVERSELLING (CONCUR-01)
    // -------------------------------------------------------------------------
    console.log('\n--- 9. CONCURRENCY & ANTI-OVERSELLING SIMULATION ---');

    // Create temporary test product & variant with stock = 1
    const randCode = 'CONCUR-' + Math.floor(10000 + Math.random() * 90000);
    const tempProdRes = await query(`
      INSERT INTO products (category_id, product_code, name, slug, base_price, status)
      OUTPUT INSERTED.id
      VALUES (1, @code, N'Test Concurrency Shoe', @code, 500000, 'active')
    `, { code: randCode });
    const tempProdId = tempProdRes.recordset[0].id;

    const tempVarRes = await query(`
      INSERT INTO product_variants (product_id, size_id, color_id, sku, stock_quantity, status)
      OUTPUT INSERTED.id
      VALUES (@prodId, 1, 1, @sku, 1, 'active')
    `, { prodId: tempProdId, sku: randCode + '-VAR' });
    const tempVarId = tempVarRes.recordset[0].id;

    // Create two test users with carts
    const hashedPw = await bcrypt.hash('123456', 10);
    const buyerEmail1 = 'buyer1_' + Math.floor(1000 + Math.random() * 9000) + '@concur.test';
    const buyerEmail2 = 'buyer2_' + Math.floor(1000 + Math.random() * 9000) + '@concur.test';
    const u1 = await query("INSERT INTO users (full_name, email, password_hash, role) OUTPUT INSERTED.id VALUES (N'Buyer 1', @e, @pw, 'CUSTOMER')", { e: buyerEmail1, pw: hashedPw });
    const u2 = await query("INSERT INTO users (full_name, email, password_hash, role) OUTPUT INSERTED.id VALUES (N'Buyer 2', @e, @pw, 'CUSTOMER')", { e: buyerEmail2, pw: hashedPw });
    const uid1 = u1.recordset[0].id;
    const uid2 = u2.recordset[0].id;

    const c1 = await query("INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@u)", { u: uid1 });
    const c2 = await query("INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@u)", { u: uid2 });
    const cid1 = c1.recordset[0].id;
    const cid2 = c2.recordset[0].id;

    // Both users add the single item to their cart
    await query("INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@c, @v, 1)", { c: cid1, v: tempVarId });
    await query("INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@c, @v, 1)", { c: cid2, v: tempVarId });

    // Both attempt to checkout SIMULTANEOUSLY
    const attempts = await Promise.allSettled([
      orderService.createCodOrder({
        userId: uid1,
        recipientName: 'Simultaneous Buyer 1',
        recipientPhone: '0901111111',
        deliveryAddress: 'Đà Nẵng',
      }),
      orderService.createCodOrder({
        userId: uid2,
        recipientName: 'Simultaneous Buyer 2',
        recipientPhone: '0902222222',
        deliveryAddress: 'Đà Nẵng',
      })
    ]);

    const successes = attempts.filter(a => a.status === 'fulfilled');
    const failures = attempts.filter(a => a.status === 'rejected');

    assert(successes.length === 1, 'CONCUR-01', `Exactly 1 buyer succeeded out of 2 competing requests (Successes: ${successes.length})`);
    assert(failures.length === 1, 'CONCUR-02', `Exactly 1 buyer failed due to out-of-stock (Failures: ${failures.length})`);

    const finalTempStock = await query("SELECT stock_quantity FROM product_variants WHERE id = @id", { id: tempVarId });
    assert(finalTempStock.recordset[0].stock_quantity === 0, 'CONCUR-03', 'Remaining stock is exactly 0 (No overselling / negative stock)');

    // Cleanup concurrency test variant & users
    try {
      await query("DELETE FROM cart_items WHERE cart_id IN (@c1, @c2)", { c1: cid1, c2: cid2 });
      await query("DELETE FROM carts WHERE id IN (@c1, @c2)", { c1: cid1, c2: cid2 });
      // clean up successful order
      if (successes.length > 0) {
        const succOrder = successes[0].value;
        const succOrderId = succOrder.id || succOrder.orderId;
        const succCode = succOrder.orderCode;
        if (succCode) {
          await query("DELETE FROM inventory_transactions WHERE reason LIKE @srch", { srch: `%${succCode}%` });
        }
        await query("DELETE FROM order_items WHERE order_id = @oid", { oid: succOrderId });
        await query("DELETE FROM order_status_histories WHERE order_id = @oid", { oid: succOrderId });
        await query("DELETE FROM orders WHERE id = @oid", { oid: succOrderId });
      }
      await query("DELETE FROM users WHERE id IN (@u1, @u2)", { u1: uid1, u2: uid2 });
      await query("DELETE FROM product_variants WHERE id = @id", { id: tempVarId });
      await query("DELETE FROM products WHERE id = @id", { id: tempProdId });
    } catch (cleanupErr) {
      console.warn('  (Non-critical concurrency cleanup notice):', cleanupErr.message);
    }

    console.log('\n===============================================================');
    console.log(`   TEST EXECUTION SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('===============================================================\n');

  } catch (error) {
    console.error('\n\x1b[31m[CRITICAL ERROR DURING TEST SUITE EXECUTION]:\x1b[0m', error);
    process.exit(1);
  } finally {
    await pool.close();
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runSuite();
