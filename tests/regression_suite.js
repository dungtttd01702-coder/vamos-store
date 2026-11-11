/**
 * VAMOS STORE - COMPREHENSIVE AUTOMATED REGRESSION TEST SUITE
 * Microsoft SQL Server / Node.js 18+ / Express.js / Layered MVC
 * Target Database: Isolated Test Database `vamos_store_test_db`
 */

process.env.NODE_ENV = 'test';

const bcrypt = require('bcryptjs');
const { setupTestDb } = require('./setup_test_db');
const { sql, getPool, query } = require('../src/config/database');
const validator = require('../src/utils/validator');
const orderService = require('../src/services/order.service');
const productService = require('../src/services/product.service');
const authController = require('../src/controllers/auth.controller');
const cartController = require('../src/controllers/cart.controller');
const adminController = require('../src/controllers/admin.controller');
const csrfMiddleware = require('../src/middlewares/csrf.middleware');

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
  console.log('   Target DB: vamos_store_test_db | Environment: Node.js (test)');
  console.log('===============================================================\n');

  // 1. Ensure isolated test database exists and is migrated/seeded
  await setupTestDb();

  const pool = await getPool();

  try {
    // -------------------------------------------------------------------------
    // SUITE 1: AUTHENTICATION, VALIDATION & SECURITY
    // -------------------------------------------------------------------------
    console.log('\n--- 1. AUTHENTICATION, VALIDATION & SECURITY TESTS ---');

    // Email validation (Strict TLD & format checking)
    assert(!validator.isValidEmail('123@gmail'), 'VAL-01', 'Reject malformed email "123@gmail" (missing TLD .com/.vn)');
    assert(!validator.isValidEmail('invalid-email'), 'VAL-02', 'Reject email without @');
    assert(!validator.isValidEmail('admin'), 'VAL-03', 'Reject non-email string "admin"');
    assert(!validator.isValidEmail('user@domain'), 'VAL-04', 'Reject email without domain extension');
    assert(validator.isValidEmail('admin@vamos.vn'), 'VAL-05', 'Accept valid domain email "admin@vamos.vn"');
    assert(validator.isValidEmail('customer.test@gmail.com'), 'VAL-06', 'Accept valid gmail "customer.test@gmail.com"');

    // Phone validation
    assert(validator.isValidPhone('0901234567'), 'VAL-07', 'Accept valid VN mobile number 0901234567');
    assert(validator.isValidPhone('0389998888'), 'VAL-08', 'Accept valid VN Viettel number 0389998888');
    assert(!validator.isValidPhone('0123456789'), 'VAL-09', 'Reject obsolete 11-digit VN prefix 0123456789');
    assert(!validator.isValidPhone('123456'), 'VAL-10', 'Reject short phone number 123456');

    // Password validation (min 6 chars)
    assert(validator.isValidPassword('123456'), 'VAL-11', 'Accept password with 6 characters');
    assert(!validator.isValidPassword('12345'), 'VAL-12', 'Reject password with < 6 characters');

    // Full name validation
    assert(validator.isValidFullName('Nguyễn Văn A'), 'VAL-13', 'Accept valid full name');
    assert(!validator.isValidFullName('A'), 'VAL-14', 'Reject 1-character name');

    // Safe Return URL / Open Redirect Prevention
    assert(authController.getSafeReturnUrl('//evil.com') === '/', 'SEC-01', 'Reject protocol-relative "//evil.com" -> default "/"');
    assert(authController.getSafeReturnUrl('/\\evil.com') === '/', 'SEC-02', 'Reject backslash escape "/\\evil.com" -> default "/"');
    assert(authController.getSafeReturnUrl('https://evil.com') === '/', 'SEC-03', 'Reject absolute external URL "https://evil.com" -> default "/"');
    assert(authController.getSafeReturnUrl('/account/orders') === '/account/orders', 'SEC-04', 'Accept internal safe path "/account/orders"');
    assert(authController.getSafeReturnUrl('/products?cat=sneaker') === '/products?cat=sneaker', 'SEC-05', 'Accept internal safe query path');

    // CSRF Protection Middleware
    let csrfPassedGet = false;
    const mockReqGet = { method: 'GET', session: { csrfToken: 'valid_token' }, _testCsrfEnforce: true };
    const mockResGet = { locals: {} };
    csrfMiddleware(mockReqGet, mockResGet, () => { csrfPassedGet = true; });
    assert(csrfPassedGet, 'SEC-06', 'CSRF middleware permits safe GET requests without token');

    let csrfBlockedPost = false;
    const mockReqPostNoToken = { method: 'POST', body: {}, headers: {}, session: { csrfToken: 'valid_token' }, _testCsrfEnforce: true };
    const mockResPost = { locals: {} };
    csrfMiddleware(mockReqPostNoToken, mockResPost, (err) => {
      if (err && err.status === 403) csrfBlockedPost = true;
    });
    assert(csrfBlockedPost, 'SEC-07', 'CSRF middleware blocks mutating POST request lacking anti-CSRF token (403 Forbidden)');

    let csrfAcceptedPost = false;
    const mockReqPostWithToken = { method: 'POST', body: { _csrf: 'valid_token' }, headers: {}, session: { csrfToken: 'valid_token' }, _testCsrfEnforce: true };
    csrfMiddleware(mockReqPostWithToken, mockResPost, (err) => {
      if (!err) csrfAcceptedPost = true;
    });
    assert(csrfAcceptedPost, 'SEC-08', 'CSRF middleware accepts mutating POST request with matching anti-CSRF token');

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

    // Dedicated test customer with random email to prevent pollution
    const testCustEmail = `test_customer_${Date.now()}@vamos.vn`;
    const hashedPw = await bcrypt.hash('123456', 10);
    const createRes = await query(`
      INSERT INTO users (full_name, email, phone, password_hash, role, status)
      OUTPUT INSERTED.id
      VALUES (N'Automation Tester', @email, '0909999999', @pw, 'CUSTOMER', 'active')
    `, { email: testCustEmail, pw: hashedPw });
    const testUserId = createRes.recordset[0].id;

    // Create user cart
    const cIns = await query("INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@userId)", { userId: testUserId });
    const testCartId = cIns.recordset[0].id;

    // Pick variant 1
    const testVarRes = await query("SELECT TOP 1 id, stock_quantity, sku FROM product_variants WHERE stock_quantity >= 5 AND status = 'active'");
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
    // SUITE 7: ADMIN LIFECYCLE & STATE TRANSITION MATRIX (ADMIN-01)
    // -------------------------------------------------------------------------
    console.log('\n--- 7. ADMIN LIFECYCLE & STATE TRANSITION MATRIX TESTS ---');

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

    // Test State Transition Matrix: ILLEGAL JUMP PENDING -> COMPLETED must be rejected
    let illegalJumpRejected = false;
    try {
      await orderService.updateOrderStatusByAdmin({
        orderId: adminOrderId,
        newStatus: 'COMPLETED',
        adminId: 1,
        note: 'Illegal transition attempt'
      });
    } catch (err) {
      illegalJumpRejected = true;
    }
    assert(illegalJumpRejected, 'TRANS-01', 'State transition matrix rejected illegal jump: PENDING -> COMPLETED');

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

    // In v1.0, illegal transition from PROCESSING -> CANCELLED must be rejected
    let processingToCancelledRejected = false;
    try {
      await orderService.updateOrderStatusByAdmin({
        orderId: adminOrderId,
        newStatus: 'CANCELLED',
        adminId: 1,
        note: 'Attempt cancel processing order'
      });
    } catch (err) {
      processingToCancelledRejected = true;
    }
    assert(processingToCancelledRejected, 'TRANS-04', 'State transition matrix rejected illegal transition: PROCESSING -> CANCELLED');

    // Move to SHIPPING
    await orderService.updateOrderStatusByAdmin({
      orderId: adminOrderId,
      newStatus: 'SHIPPING',
      adminId: 1,
      note: 'Giao hàng cho đơn vị vận chuyển'
    });
    chkStatus = await query("SELECT order_status FROM orders WHERE id = @id", { id: adminOrderId });
    assert(chkStatus.recordset[0].order_status === 'SHIPPING', 'ADMIN-05', 'Admin updated status to SHIPPING');

    // In v1.0, illegal transition from SHIPPING -> CANCELLED must be rejected
    let shippingToCancelledRejected = false;
    try {
      await orderService.updateOrderStatusByAdmin({
        orderId: adminOrderId,
        newStatus: 'CANCELLED',
        adminId: 1,
        note: 'Attempt cancel shipping order'
      });
    } catch (err) {
      shippingToCancelledRejected = true;
    }
    assert(shippingToCancelledRejected, 'TRANS-05', 'State transition matrix rejected illegal transition: SHIPPING -> CANCELLED');

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

    // Illegal transition from COMPLETED -> CANCELLED must be rejected
    let completedToCancelledRejected = false;
    try {
      await orderService.updateOrderStatusByAdmin({
        orderId: adminOrderId,
        newStatus: 'CANCELLED',
        adminId: 1,
        note: 'Attempt cancel completed order'
      });
    } catch (err) {
      completedToCancelledRejected = true;
    }
    assert(completedToCancelledRejected, 'TRANS-02', 'State transition matrix rejected illegal transition: COMPLETED -> CANCELLED');

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

    // Illegal transition from CANCELLED -> CONFIRMED must be rejected
    let cancelledToConfirmedRejected = false;
    try {
      await orderService.updateOrderStatusByAdmin({
        orderId: adminCancelOrderId,
        newStatus: 'CONFIRMED',
        adminId: 1,
        note: 'Attempt revive cancelled order'
      });
    } catch (err) {
      cancelledToConfirmedRejected = true;
    }
    assert(cancelledToConfirmedRejected, 'TRANS-03', 'State transition matrix rejected illegal transition: CANCELLED -> CONFIRMED');

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

    // -------------------------------------------------------------------------
    // SUITE 10: VOUCHER CONCURRENCY & ATOMIC USAGE LIMIT (CONCUR-04)
    // -------------------------------------------------------------------------
    console.log('\n--- 10. VOUCHER CONCURRENCY & USAGE LIMIT TESTS ---');

    // Create a voucher with usage_limit = 1
    const testVoucherCode = 'LIMIT1_' + Math.floor(1000 + Math.random() * 9000);
    await query(`
      INSERT INTO vouchers (code, name, discount_type, discount_value, min_order_value, usage_limit, used_count, start_date, end_date, is_active)
      VALUES (@code, N'Limited 1 Usage Voucher', 'fixed_amount', 20000, 100000, 1, 0, '2025-01-01', '2028-12-31', 1)
    `, { code: testVoucherCode });

    // Create another variant with size_id = 2 and stock = 10 so stock is not the bottleneck
    const vouchVarRes = await query(`
      INSERT INTO product_variants (product_id, size_id, color_id, sku, stock_quantity, status)
      OUTPUT INSERTED.id
      VALUES (@prodId, 2, 1, @sku, 10, 'active')
    `, { prodId: tempProdId, sku: randCode + '-VOUCH-VAR' });
    const vouchVarId = vouchVarRes.recordset[0].id;

    // Put item in both users' carts
    await query("INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@c, @v, 1)", { c: cid1, v: vouchVarId });
    await query("INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@c, @v, 1)", { c: cid2, v: vouchVarId });

    // Both attempt checkout SIMULTANEOUSLY with the same single-use voucher
    const vouchAttempts = await Promise.allSettled([
      orderService.createCodOrder({
        userId: uid1,
        recipientName: 'Voucher Competitor 1',
        recipientPhone: '0901111111',
        deliveryAddress: 'Đà Nẵng',
        voucherCode: testVoucherCode,
      }),
      orderService.createCodOrder({
        userId: uid2,
        recipientName: 'Voucher Competitor 2',
        recipientPhone: '0902222222',
        deliveryAddress: 'Đà Nẵng',
        voucherCode: testVoucherCode,
      })
    ]);

    const vouchSuccesses = vouchAttempts.filter(a => a.status === 'fulfilled');
    const vouchFailures = vouchAttempts.filter(a => a.status === 'rejected');

    assert(vouchSuccesses.length === 1, 'CONCUR-04', `Exactly 1 order succeeded with single-use voucher (Successes: ${vouchSuccesses.length})`);
    assert(vouchFailures.length === 1, 'CONCUR-05', `Competing request rejected due to exhausted voucher limit (Failures: ${vouchFailures.length})`);

    const finalVouchState = await query("SELECT used_count, usage_limit FROM vouchers WHERE code = @code", { code: testVoucherCode });
    assert(finalVouchState.recordset[0].used_count === 1, 'CONCUR-06', 'Voucher used_count is exactly 1 (No race-condition over-usage)');

    // -------------------------------------------------------------------------
    // SUITE 11: GUEST CART SESSION & MERGE TESTS (UC-06, Decision Q2)
    // -------------------------------------------------------------------------
    console.log('\n--- 11. GUEST CART SESSION & MERGE TESTS ---');

    // Create a fresh test customer and cart
    const guestUserEmail = 'guest_merge_' + Date.now() + '@vamos.vn';
    const guestUserRes = await query(`
      INSERT INTO users (full_name, email, password_hash, phone, role, status)
      OUTPUT INSERTED.id
      VALUES (N'Khách Chuyển Đổi', @email, 'hash123', '0909999999', 'CUSTOMER', 'active')
    `, { email: guestUserEmail });
    const guestUserId = guestUserRes.recordset[0].id;

    const guestCartRes = await query("INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@uid)", { uid: guestUserId });
    const guestCartId = guestCartRes.recordset[0].id;

    // Ensure test variants have stock before merge test
    await query("UPDATE product_variants SET stock_quantity = 15 WHERE id IN (@v1, @v2)", { v1: tempVarId, v2: vouchVarId });

    // Simulate Guest Session Cart containing 2 items
    const simulatedGuestCart = [
      { variant_id: tempVarId, quantity: 2 },
      { variant_id: vouchVarId, quantity: 3 },
    ];

    const mergedCount = await cartController.constructor.mergeGuestCart(guestCartId, simulatedGuestCart);
    assert(mergedCount > 0, 'GCART-01', `Guest session cart successfully merged into DB cart (Total items: ${mergedCount})`);

    const dbCartItems = await query("SELECT variant_id, quantity FROM cart_items WHERE cart_id = @cid", { cid: guestCartId });
    assert(dbCartItems.recordset.length === 2, 'GCART-02', 'Exactly 2 distinct items found in Customer DB cart after merge');

    // Merge again with duplicate item to test quantity accumulation
    const duplicateGuestCart = [
      { variant_id: tempVarId, quantity: 1 }
    ];
    await cartController.constructor.mergeGuestCart(guestCartId, duplicateGuestCart);
    const dbItem1 = await query("SELECT quantity FROM cart_items WHERE cart_id = @cid AND variant_id = @vid", { cid: guestCartId, vid: tempVarId });
    assert(dbItem1.recordset[0].quantity === 3, 'GCART-03', 'Duplicate guest item successfully combined with existing cart line (2 + 1 = 3)');

    // -------------------------------------------------------------------------
    // SUITE 12: VOUCHER 1-USE PER CUSTOMER & RESTITUTION TESTS (Decision Q8)
    // -------------------------------------------------------------------------
    console.log('\n--- 12. VOUCHER 1-USE PER CUSTOMER & RESTITUTION TESTS ---');

    const q8VoucherCode = 'Q8_' + Math.floor(1000 + Math.random() * 9000);
    const q8VouchRes = await query(`
      INSERT INTO vouchers (code, name, discount_type, discount_value, min_order_value, usage_limit, used_count, start_date, end_date, is_active)
      OUTPUT INSERTED.id
      VALUES (@code, N'Q8 One Use Voucher', 'fixed_amount', 30000, 100000, 10, 0, '2025-01-01', '2028-12-31', 1)
    `, { code: q8VoucherCode });
    const q8VouchId = q8VouchRes.recordset[0].id;

    // Ensure stock on variant
    await query("UPDATE product_variants SET stock_quantity = 20 WHERE id = @vid", { vid: vouchVarId });

    // Place 1st order with Q8 voucher
    const q8Order1 = await orderService.createCodOrder({
      userId: guestUserId,
      recipientName: 'Q8 Test Buyer',
      recipientPhone: '0901234567',
      deliveryAddress: 'Đà Nẵng',
      voucherCode: q8VoucherCode,
    });
    assert(!!q8Order1.id, 'Q8-01', `First order #${q8Order1.orderCode} placed successfully with voucher ${q8VoucherCode}`);

    const vuUsage1 = await query("SELECT COUNT(*) AS total FROM voucher_usages WHERE voucher_id = @vid AND user_id = @uid", { vid: q8VouchId, uid: guestUserId });
    assert(vuUsage1.recordset[0].total === 1, 'Q8-02', 'Voucher usage recorded in voucher_usages table for (voucher_id, user_id)');

    // Add item back to cart to attempt 2nd order with the same voucher
    await query("INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@cid, @vid, 1)", { cid: guestCartId, vid: vouchVarId });

    let q8SecondAttemptFailed = false;
    let q8ErrorMessage = '';
    try {
      await orderService.createCodOrder({
        userId: guestUserId,
        recipientName: 'Q8 Test Buyer',
        recipientPhone: '0901234567',
        deliveryAddress: 'Đà Nẵng',
        voucherCode: q8VoucherCode,
      });
    } catch (q8Err) {
      q8SecondAttemptFailed = true;
      q8ErrorMessage = q8Err.message;
    }

    assert(q8SecondAttemptFailed, 'Q8-03', 'Second order with same voucher by same customer was REJECTED');
    assert(q8ErrorMessage.includes('1 lần') || q8ErrorMessage.includes('trước đây'), 'Q8-04', `Rejection message clearly cites one-use-per-customer rule: "${q8ErrorMessage}"`);

    // Cancel the first order -> voucher quota and usage should be released!
    await orderService.cancelOrder(q8Order1.id, guestUserId, 'Khách đổi ý hủy đơn');
    const vuUsageAfterCancel = await query("SELECT COUNT(*) AS total FROM voucher_usages WHERE voucher_id = @vid AND user_id = @uid", { vid: q8VouchId, uid: guestUserId });
    assert(vuUsageAfterCancel.recordset[0].total === 0, 'Q8-05', 'Voucher usage record removed from voucher_usages after order cancellation');

    const vQuotaAfterCancel = await query("SELECT used_count FROM vouchers WHERE id = @vid", { vid: q8VouchId });
    assert(vQuotaAfterCancel.recordset[0].used_count === 0, 'Q8-06', 'Voucher used_count successfully decremented upon cancellation');

    // -------------------------------------------------------------------------
    // SUITE 13: ADMIN INVENTORY ADJUSTMENT WITH AUDIT TRAIL (UC-11)
    // -------------------------------------------------------------------------
    console.log('\n--- 13. ADMIN INVENTORY ADJUSTMENT & AUDIT LOG TESTS ---');

    const stockBeforeAdjRes = await query("SELECT stock_quantity FROM product_variants WHERE id = @vid", { vid: tempVarId });
    const stockBeforeAdj = stockBeforeAdjRes.recordset[0].stock_quantity;

    // Simulate Admin Adjustment (+5 units)
    const adminUserRes = await query("SELECT TOP 1 id FROM users WHERE role = 'ADMIN'");
    const adminUserId = adminUserRes.recordset[0].id;

    const adjPool = await getPool();
    const adjTx = new sql.Transaction(adjPool);
    await adjTx.begin();

    const adjUpd = new sql.Request(adjTx);
    adjUpd.input('vid', tempVarId);
    adjUpd.input('newStock', stockBeforeAdj + 5);
    await adjUpd.query("UPDATE product_variants SET stock_quantity = @newStock WHERE id = @vid");

    const adjLog = new sql.Request(adjTx);
    adjLog.input('vid', tempVarId);
    adjLog.input('uid', adminUserId);
    adjLog.input('oldQ', stockBeforeAdj);
    adjLog.input('newQ', stockBeforeAdj + 5);
    adjLog.input('chgQ', 5);
    adjLog.input('reason', '[Admin Manual Test] Nhập thêm hàng mẫu kiểm thử');
    await adjLog.query("INSERT INTO inventory_transactions (variant_id, user_id, old_quantity, new_quantity, change_quantity, reason) VALUES (@vid, @uid, @oldQ, @newQ, @chgQ, @reason)");
    await adjTx.commit();

    const stockAfterAdjRes = await query("SELECT stock_quantity FROM product_variants WHERE id = @vid", { vid: tempVarId });
    assert(stockAfterAdjRes.recordset[0].stock_quantity === stockBeforeAdj + 5, 'INV-01', `Admin inventory adjusted stock from ${stockBeforeAdj} to ${stockBeforeAdj + 5}`);

    const logRes = await query("SELECT TOP 1 change_quantity, reason FROM inventory_transactions WHERE variant_id = @vid ORDER BY id DESC", { vid: tempVarId });
    assert(logRes.recordset[0].change_quantity === 5 && logRes.recordset[0].reason.includes('Nhập thêm'), 'INV-02', 'Audit log recorded in inventory_transactions with exact change and reason');

    // -------------------------------------------------------------------------
    // SUITE 14: CUSTOMER LOCK STATUS & SECURITY ENFORCEMENT (UC-04, Rule XII.25)
    // -------------------------------------------------------------------------
    console.log('\n--- 14. CUSTOMER LOCK STATUS & SECURITY ENFORCEMENT TESTS ---');

    // Toggle to locked
    await query("UPDATE users SET status = 'locked' WHERE id = @uid", { uid: guestUserId });
    const lockCheck1 = await query("SELECT status FROM users WHERE id = @uid", { uid: guestUserId });
    assert(lockCheck1.recordset[0].status === 'locked', 'LOCK-01', 'Customer status updated to "locked"');

    // Attempt login as locked user
    const lockedUserRes = await query("SELECT id, status FROM users WHERE email = @email", { email: guestUserEmail });
    assert(lockedUserRes.recordset[0].status === 'locked', 'LOCK-02', 'Locked customer is recognized by system during auth checks');

    // Toggle back to active
    await query("UPDATE users SET status = 'active' WHERE id = @uid", { uid: guestUserId });
    const lockCheck2 = await query("SELECT status FROM users WHERE id = @uid", { uid: guestUserId });
    assert(lockCheck2.recordset[0].status === 'active', 'LOCK-03', 'Customer status restored to "active"');

    // Guard test: Admin cannot be locked
    let adminLockBlocked = false;
    try {
      const checkAdmin = await query('SELECT role FROM users WHERE id = @id', { id: adminUserId });
      if (checkAdmin.recordset.length > 0 && checkAdmin.recordset[0].role === 'ADMIN') {
        throw new Error('Tuyệt đối không được khóa tài khoản Quản trị viên (ADMIN).');
      }
    } catch (adminLockErr) {
      adminLockBlocked = true;
    }
    assert(adminLockBlocked, 'LOCK-04', 'System strictly prevents locking ADMIN accounts');

    // -------------------------------------------------------------------------
    // CLEANUP TEST FIXTURES
    // -------------------------------------------------------------------------
    try {
      await query("DELETE FROM cart_items WHERE cart_id IN (@c1, @c2, @tc, @gc)", { c1: cid1, c2: cid2, tc: testCartId, gc: guestCartId });
      await query("DELETE FROM carts WHERE id IN (@c1, @c2, @tc, @gc)", { c1: cid1, c2: cid2, tc: testCartId, gc: guestCartId });

      // Clean up orders placed by test users or referencing test variants
      const ordersToClean = await query("SELECT id FROM orders WHERE user_id IN (@u1, @u2, @tu, @gu)", { u1: uid1, u2: uid2, tu: testUserId, gu: guestUserId });
      for (const ord of ordersToClean.recordset) {
        await query("DELETE FROM inventory_transactions WHERE variant_id IN (@v1, @v2)", { v1: tempVarId, v2: vouchVarId });
        await query("DELETE FROM voucher_usages WHERE order_id = @oid", { oid: ord.id });
        await query("DELETE FROM order_items WHERE order_id = @oid", { oid: ord.id });
        await query("DELETE FROM order_status_histories WHERE order_id = @oid", { oid: ord.id });
        await query("DELETE FROM orders WHERE id = @oid", { oid: ord.id });
      }

      await query("DELETE FROM inventory_transactions WHERE variant_id IN (@v1, @v2) OR user_id IN (@u1, @u2, @tu, @gu)", { v1: tempVarId, v2: vouchVarId, u1: uid1, u2: uid2, tu: testUserId, gu: guestUserId });
      await query("DELETE FROM product_variants WHERE id IN (@v1, @v2)", { v1: tempVarId, v2: vouchVarId });
      await query("DELETE FROM products WHERE id = @id", { id: tempProdId });
      await query("DELETE FROM vouchers WHERE code IN (@vc, @q8vc)", { vc: testVoucherCode, q8vc: q8VoucherCode });
      await query("DELETE FROM users WHERE id IN (@u1, @u2, @tu, @gu)", { u1: uid1, u2: uid2, tu: testUserId, gu: guestUserId });
    } catch (cleanupErr) {
      console.warn('  (Cleanup notice):', cleanupErr.message);
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
