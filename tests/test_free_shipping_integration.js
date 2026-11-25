/**
 * SQL Server 2022 Integration & End-to-End Regression Suite: MEDIUM-01 True Free Shipping
 * Exercises Migration 007 constraints, loyaltyService.redeemVoucher, POST /checkout/apply-voucher,
 * orderService.createCodOrder, loyalty 3% points exclusion of shipping_discount_amount,
 * legacy fixed_amount compatibility, concurrency, and cancellation restitution on vamos_store_test_db.
 */

require('./test_bootstrap');

const assert = require('assert');
const crypto = require('crypto');
const http = require('http');
const sql = require('mssql');
const bcrypt = require('bcryptjs');

const app = require('../src/app');
const { getPool, query, closePool } = require('../src/config/database');
const loyaltyService = require('../src/services/loyalty.service');
const orderService = require('../src/services/order.service');

function extractCookie(setCookieHeader) {
  return setCookieHeader ? setCookieHeader.split(';')[0] : '';
}

async function loginHttpSession(baseUrl, email, password) {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password }).toString(),
    redirect: 'manual'
  });
  assert.strictEqual(loginRes.status, 302, 'Test login must redirect 302');
  return extractCookie(loginRes.headers.get('set-cookie'));
}

async function runIntegrationTests() {
  console.log('===============================================================');
  console.log('   VAMOS STORE - MEDIUM-01 TRUE FREE SHIPPING SQL INTEGRATION');
  console.log('===============================================================');

  const dbCheck = await query('SELECT DB_NAME() AS current_db');
  const currentDb = dbCheck.recordset[0]?.current_db;
  if (!currentDb || !currentDb.toLowerCase().includes('test')) {
    throw new Error(`[ABORT] test_free_shipping_integration must run on test DB, got: ${currentDb}`);
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const runId = `fs_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const trackedUserIds = [];
  const trackedProductIds = [];
  const trackedOrderIds = [];
  const trackedVoucherIds = [];
  const trackedRedemptionIds = [];
  const trackedCartIds = [];
  let passed = 0;

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  async function seedPointsForUser(userId, amount) {
    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const w = await loyaltyService.getOrCreateWallet(userId, tx);
      const nextBal = w.available_points + amount;
      const pt = await new sql.Request(tx)
        .input('uid', sql.Int, userId)
        .input('amt', sql.Int, amount)
        .input('bal', sql.Int, nextBal)
        .input('idem', sql.NVarChar(100), `TEST_FS_SEED_${runId}_${userId}_${crypto.randomBytes(3).toString('hex')}`)
        .query(`
          INSERT INTO point_transactions (user_id, transaction_type, amount, balance_after, description, idempotency_key)
          OUTPUT INSERTED.id
          VALUES (@uid, 'ADMIN_ADJUSTMENT', @amt, @bal, N'Seed points for FREE_SHIPPING integration test', @idem)
        `);
      await new sql.Request(tx)
        .input('uid', sql.Int, userId)
        .input('txId', sql.Int, pt.recordset[0].id)
        .input('pts', sql.Int, amount)
        .query(`
          INSERT INTO loyalty_point_batches (user_id, transaction_id, initial_points, remaining_points, expires_at, status)
          VALUES (@uid, @txId, @pts, @pts, DATEADD(day, 365, GETDATE()), 'ACTIVE')
        `);
      await new sql.Request(tx)
        .input('uid', sql.Int, userId)
        .input('bal', sql.Int, nextBal)
        .query(`
          UPDATE user_points_wallets
          SET available_points = @bal, lifetime_earned_points = lifetime_earned_points + @bal
          WHERE user_id = @uid
        `);
      await tx.commit();
    } catch (err) {
      try { await tx.rollback(); } catch (_) {}
      throw err;
    }
  }

  async function setCartSingleVariant(cartId, variantId, qty) {
    await query('DELETE FROM cart_items WHERE cart_id = @cid', { cid: cartId });
    await query('INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@cid, @vid, @qty)', {
      cid: cartId,
      vid: variantId,
      qty
    });
  }

  try {
    // Seed 3 isolated users + 1 active admin + 2 isolated test products (no sale & with sale)
    const passPlain = crypto.randomBytes(12).toString('hex');
    const passHash = await bcrypt.hash(passPlain, 4);

    async function createCustomer(suffix) {
      const res = await query(`
        INSERT INTO users (email, password_hash, full_name, role, status)
        OUTPUT INSERTED.id, INSERTED.email
        VALUES (@email, @hash, @name, 'CUSTOMER', 'active')
      `, { email: `fs_${suffix}_${runId}@vamos.test`, hash: passHash, name: `FS Customer ${suffix}` });
      trackedUserIds.push(res.recordset[0].id);
      const cartRes = await query('INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@uid)', { uid: res.recordset[0].id });
      trackedCartIds.push(cartRes.recordset[0].id);
      return { id: res.recordset[0].id, email: res.recordset[0].email, cartId: cartRes.recordset[0].id };
    }

    const u1 = await createCustomer('u1');
    const u2 = await createCustomer('u2');
    const admRes = await query(`
      INSERT INTO users (email, password_hash, full_name, role, status)
      OUTPUT INSERTED.id
      VALUES (@email, @hash, N'FS Admin Test', 'ADMIN', 'active')
    `, { email: `fs_adm_${runId}@vamos.test`, hash: passHash });
    const adminId = admRes.recordset[0].id;
    trackedUserIds.push(adminId);

    const catRes = await query('SELECT TOP 1 id FROM categories');
    const sizeRes = await query('SELECT TOP 1 id FROM sizes');
    const colorRes = await query('SELECT TOP 1 id FROM colors');
    const catId = catRes.recordset[0].id;
    const sizeId = sizeRes.recordset[0].id;
    const colorId = colorRes.recordset[0].id;

    async function createProductWithVariant(codeSuffix, basePrice, salePrice) {
      const pRes = await query(`
        INSERT INTO products (category_id, product_code, name, slug, base_price, sale_price, status)
        OUTPUT INSERTED.id
        VALUES (@catId, @pCode, @name, @slug, @basePrice, @salePrice, 'active')
      `, {
        catId,
        pCode: `FS-${codeSuffix}-${runId}`,
        name: `Test Shoe ${codeSuffix}`,
        slug: `fs-shoe-${codeSuffix}-${runId}`,
        basePrice,
        salePrice
      });
      const productId = pRes.recordset[0].id;
      trackedProductIds.push(productId);
      const vRes = await query(`
        INSERT INTO product_variants (product_id, size_id, color_id, sku, stock_quantity, status)
        OUTPUT INSERTED.id
        VALUES (@pid, @sid, @cid, @sku, 100, 'active')
      `, { pid: productId, sid: sizeId, cid: colorId, sku: `SKU-${codeSuffix}-${runId}` });
      return { productId, variantId: vRes.recordset[0].id };
    }

    const prod100k = await createProductWithVariant('100K', 100000, null); // qty 3=300k, qty 5=500k, qty 6=600k
    const prod450k = await createProductWithVariant('450K', 450000, null);
    const prod490k = await createProductWithVariant('490K', 490000, null);
    const prodSale400k = await createProductWithVariant('SALE400K', 550000, 400000); // product discount via sale_price
    const prodOos = await createProductWithVariant('OOS', 300000, null);
    await query('UPDATE product_variants SET stock_quantity = 0 WHERE id = @vid', { vid: prodOos.variantId });

    const fsRuleRes = await query(`SELECT TOP 1 * FROM point_reward_rules WHERE reward_type = 'FREE_SHIPPING' AND is_active = 1`);
    assert.strictEqual(fsRuleRes.recordset.length, 1, 'Migration 005 FREE_SHIPPING rule must exist');
    const fsRule = fsRuleRes.recordset[0];

    await asyncTest('MIG-007-SQL: Migration 007 schema columns & check constraints active on test DB', async () => {
      const colCheck = await query("SELECT COL_LENGTH('orders', 'shipping_discount_amount') AS col_len");
      assert.ok(colCheck.recordset[0].col_len !== null, 'orders.shipping_discount_amount must exist');
      const chkCheck = await query(`
        SELECT name, definition FROM sys.check_constraints
        WHERE name IN ('chk_vouchers_discount_type', 'chk_orders_shipping_discount_cap', 'chk_orders_shipping_discount_non_negative')
      `);
      assert.strictEqual(chkCheck.recordset.length, 3, 'All 3 Migration 007 check constraints must exist');
      const vTypeDef = chkCheck.recordset.find((c) => c.name === 'chk_vouchers_discount_type').definition;
      assert.ok(vTypeDef.includes('free_shipping'), 'chk_vouchers_discount_type must include free_shipping');
    });

    await seedPointsForUser(u1.id, 2000);
    const u1Cookie = await loginHttpSession(baseUrl, u1.email, passPlain);

    let fsVoucher1;
    await asyncTest('REDEEM-FS & TC19a: redeemVoucher preserves free_shipping type and honors idempotencyKey retry', async () => {
      const idemKey = `IDEM_FS_${runId}_1`;
      fsVoucher1 = await loyaltyService.redeemVoucher(u1.id, fsRule.id, { idempotencyKey: idemKey });
      trackedVoucherIds.push(fsVoucher1.voucherId);
      trackedRedemptionIds.push(fsVoucher1.redemptionId);

      const vRow = (await query('SELECT * FROM vouchers WHERE id = @id', { id: fsVoucher1.voucherId })).recordset[0];
      assert.strictEqual(vRow.discount_type, 'free_shipping');
      assert.strictEqual(Number(vRow.discount_value), 40000);
      assert.strictEqual(Number(vRow.min_order_value), 200000);

      // Idempotent retry must return existing voucher without deducting another 300 pts
      const walletBeforeRetry = await loyaltyService.getOrCreateWallet(u1.id);
      const retryRes = await loyaltyService.redeemVoucher(u1.id, fsRule.id, { idempotencyKey: idemKey });
      assert.strictEqual(retryRes.idempotent, true);
      assert.strictEqual(retryRes.voucherId, fsVoucher1.voucherId);
      const walletAfterRetry = await loyaltyService.getOrCreateWallet(u1.id);
      assert.strictEqual(walletAfterRetry.available_points, walletBeforeRetry.available_points);
    });

    await asyncTest('TC04 & TC05 & TC11 & HTTP-PREVIEW: shippingFee=0 rejects FREE_SHIPPING and keeps voucher AVAILABLE', async () => {
      await setCartSingleVariant(u1.cartId, prod100k.variantId, 5); // Subtotal 500,000 -> shippingFee = 0

      // HTTP POST /checkout/apply-voucher preview must reject with exact policy message
      const prev500Res = await fetch(`${baseUrl}/checkout/apply-voucher`, {
        method: 'POST',
        headers: { Cookie: u1Cookie, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ voucher_code: fsVoucher1.voucherCode })
      });
      assert.strictEqual(prev500Res.status, 400);
      const prev500Json = await prev500Res.json();
      assert.strictEqual(prev500Json.message, 'Đơn hàng của bạn đã được miễn phí vận chuyển. Voucher này không thể áp dụng.');

      // Order placement at 500k and 600k must both reject
      await assert.rejects(
        () => orderService.createCodOrder({ userId: u1.id, recipientName: 'U1', recipientPhone: '0912345678', deliveryAddress: 'HCM', voucherCode: fsVoucher1.voucherCode }),
        /Đơn hàng của bạn đã được miễn phí vận chuyển\. Voucher này không thể áp dụng\./
      );

      await setCartSingleVariant(u1.cartId, prod100k.variantId, 6); // Subtotal 600,000 -> shippingFee = 0
      await assert.rejects(
        () => orderService.createCodOrder({ userId: u1.id, recipientName: 'U1', recipientPhone: '0912345678', deliveryAddress: 'HCM', voucherCode: fsVoucher1.voucherCode }),
        /Đơn hàng của bạn đã được miễn phí vận chuyển\. Voucher này không thể áp dụng\./
      );

      // TC11: Voucher remains untouched (AVAILABLE, used_count=0, 0 voucher_usages)
      const vState = (await query('SELECT used_count FROM vouchers WHERE id = @id', { id: fsVoucher1.voucherId })).recordset[0];
      const vrState = (await query('SELECT status FROM voucher_redemptions WHERE id = @id', { id: fsVoucher1.redemptionId })).recordset[0];
      const vuCount = (await query('SELECT COUNT(*) AS cnt FROM voucher_usages WHERE voucher_id = @id', { id: fsVoucher1.voucherId })).recordset[0].cnt;
      assert.strictEqual(vState.used_count, 0);
      assert.strictEqual(vrState.status, 'AVAILABLE');
      assert.strictEqual(vuCount, 0);
    });

    await asyncTest('TC01 & TC15 & TC16: Subtotal 300k + ship 30k saves shipping_discount_amount=30k & awards 9,000 loyalty points', async () => {
      await setCartSingleVariant(u1.cartId, prod100k.variantId, 3); // 300,000 -> ship 30,000

      // Preview must succeed without consuming voucher
      const prevRes = await fetch(`${baseUrl}/checkout/apply-voucher`, {
        method: 'POST',
        headers: { Cookie: u1Cookie, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ voucher_code: fsVoucher1.voucherCode })
      });
      assert.strictEqual(prevRes.status, 200);
      const prevJson = await prevRes.json();
      assert.strictEqual(prevJson.data.shippingDiscountAmount, 30000);
      assert.strictEqual(prevJson.data.discountAmount, 0);
      assert.strictEqual(prevJson.data.totalAmount, 300000);

      // Preview did not consume voucher -> real checkout must succeed
      const ord1 = await orderService.createCodOrder({
        userId: u1.id,
        recipientName: 'U1 Order 1',
        recipientPhone: '0912345678',
        deliveryAddress: 'HCM',
        voucherCode: fsVoucher1.voucherCode
      });
      trackedOrderIds.push(ord1.orderId);

      const dbOrd = (await query('SELECT subtotal, discount_amount, shipping_fee, shipping_discount_amount, total_amount FROM orders WHERE id = @id', { id: ord1.orderId })).recordset[0];
      assert.strictEqual(Number(dbOrd.subtotal), 300000);
      assert.strictEqual(Number(dbOrd.discount_amount), 0);
      assert.strictEqual(Number(dbOrd.shipping_fee), 30000);
      assert.strictEqual(Number(dbOrd.shipping_discount_amount), 30000);
      assert.strictEqual(Number(dbOrd.total_amount), 300000);

      // Move order through State Machine -> COMPLETED -> must award 3% on FULL 300,000 (9,000 pts, NOT 8,100)
      const walletBefore = await loyaltyService.getOrCreateWallet(u1.id);
      await orderService.updateOrderStatusByAdmin({ orderId: ord1.orderId, newStatus: 'CONFIRMED', adminUserId: adminId });
      await orderService.updateOrderStatusByAdmin({ orderId: ord1.orderId, newStatus: 'PROCESSING', adminUserId: adminId });
      await orderService.updateOrderStatusByAdmin({ orderId: ord1.orderId, newStatus: 'SHIPPING', adminUserId: adminId });
      await orderService.updateOrderStatusByAdmin({ orderId: ord1.orderId, newStatus: 'COMPLETED', adminUserId: adminId });

      const walletAfter = await loyaltyService.getOrCreateWallet(u1.id);
      assert.strictEqual(walletAfter.available_points - walletBefore.available_points, 9000, '3% points must exclude shipping_discount_amount');
    });

    await asyncTest('TC02, TC03, TC06 & TC17: 450k, 490k, 50k-ship cap (40k), and sale_price+freeship persist exact SQL amounts', async () => {
      // TC02: 450,000 + ship 30,000
      const fs2 = await loyaltyService.redeemVoucher(u1.id, fsRule.id);
      trackedVoucherIds.push(fs2.voucherId);
      trackedRedemptionIds.push(fs2.redemptionId);
      await setCartSingleVariant(u1.cartId, prod450k.variantId, 1);
      const ord450 = await orderService.createCodOrder({ userId: u1.id, recipientName: 'U1', recipientPhone: '0912345678', deliveryAddress: 'HCM', voucherCode: fs2.voucherCode });
      trackedOrderIds.push(ord450.orderId);
      assert.strictEqual(ord450.shippingDiscountAmount, 30000);
      assert.strictEqual(ord450.totalAmount, 450000);

      // TC03: 490,000 + ship 30,000
      const fs3 = await loyaltyService.redeemVoucher(u1.id, fsRule.id);
      trackedVoucherIds.push(fs3.voucherId);
      trackedRedemptionIds.push(fs3.redemptionId);
      await setCartSingleVariant(u1.cartId, prod490k.variantId, 1);
      const ord490 = await orderService.createCodOrder({ userId: u1.id, recipientName: 'U1', recipientPhone: '0912345678', deliveryAddress: 'HCM', voucherCode: fs3.voucherCode });
      trackedOrderIds.push(ord490.orderId);
      assert.strictEqual(ord490.shippingDiscountAmount, 30000);
      assert.strictEqual(ord490.totalAmount, 490000);

      // TC06: Shipping fee 50,000 caps shipping_discount_amount at 40,000
      const fs4 = await loyaltyService.redeemVoucher(u1.id, fsRule.id);
      trackedVoucherIds.push(fs4.voucherId);
      trackedRedemptionIds.push(fs4.redemptionId);
      await setCartSingleVariant(u1.cartId, prod450k.variantId, 1);
      const ordCap = await orderService.createCodOrder({ userId: u1.id, recipientName: 'U1', recipientPhone: '0912345678', deliveryAddress: 'HCM', voucherCode: fs4.voucherCode, shippingFeeOverride: 50000 });
      trackedOrderIds.push(ordCap.orderId);
      const dbCap = (await query('SELECT shipping_fee, shipping_discount_amount, total_amount FROM orders WHERE id = @id', { id: ordCap.orderId })).recordset[0];
      assert.strictEqual(Number(dbCap.shipping_fee), 50000);
      assert.strictEqual(Number(dbCap.shipping_discount_amount), 40000);
      assert.strictEqual(Number(dbCap.total_amount), 460000);

      // TC17: Product with sale_price=400k (base=550k) + ship=30k + FREE_SHIPPING -> 12,000 loyalty pts
      const fs5 = await loyaltyService.redeemVoucher(u1.id, fsRule.id);
      trackedVoucherIds.push(fs5.voucherId);
      trackedRedemptionIds.push(fs5.redemptionId);
      await setCartSingleVariant(u1.cartId, prodSale400k.variantId, 1);
      const ordSale = await orderService.createCodOrder({ userId: u1.id, recipientName: 'U1', recipientPhone: '0912345678', deliveryAddress: 'HCM', voucherCode: fs5.voucherCode });
      trackedOrderIds.push(ordSale.orderId);
      assert.strictEqual(ordSale.subtotal, 400000);
      assert.strictEqual(ordSale.shippingDiscountAmount, 30000);
      assert.strictEqual(ordSale.totalAmount, 400000);
    });

    await asyncTest('TC07, TC08, TC09, TC10, TC20, TC22: Min order, expired, ownership, used, rollback & cancel reuse', async () => {
      const fsV = await loyaltyService.redeemVoucher(u1.id, fsRule.id);
      trackedVoucherIds.push(fsV.voucherId);
      trackedRedemptionIds.push(fsV.redemptionId);

      // TC07: Subtotal 100k (< 200k)
      await setCartSingleVariant(u1.cartId, prod100k.variantId, 1);
      await assert.rejects(
        () => orderService.createCodOrder({ userId: u1.id, recipientName: 'U1', recipientPhone: '0912345678', deliveryAddress: 'HCM', voucherCode: fsV.voucherCode }),
        /tối thiểu/
      );

      // TC09: Ownership rejection (u2 cannot use u1 voucher)
      await setCartSingleVariant(u2.cartId, prod100k.variantId, 3);
      await assert.rejects(
        () => orderService.createCodOrder({ userId: u2.id, recipientName: 'U2', recipientPhone: '0987654321', deliveryAddress: 'HN', voucherCode: fsV.voucherCode }),
        /không hợp lệ hoặc không áp dụng được cho tài khoản/
      );

      // TC20: Failed checkout (out-of-stock variant) rolls back cleanly -> voucher stays AVAILABLE
      await setCartSingleVariant(u1.cartId, prodOos.variantId, 1);
      await assert.rejects(
        () => orderService.createCodOrder({ userId: u1.id, recipientName: 'U1', recipientPhone: '0912345678', deliveryAddress: 'HCM', voucherCode: fsV.voucherCode }),
        /không đủ số lượng/
      );
      const vrAfterOos = (await query('SELECT status FROM voucher_redemptions WHERE id = @id', { id: fsV.redemptionId })).recordset[0];
      assert.strictEqual(vrAfterOos.status, 'AVAILABLE');

      // Place valid 300k order then cancel (TC22) -> voucher restored to AVAILABLE and reusable
      await setCartSingleVariant(u1.cartId, prod100k.variantId, 3);
      const ordCancel = await orderService.createCodOrder({ userId: u1.id, recipientName: 'U1', recipientPhone: '0912345678', deliveryAddress: 'HCM', voucherCode: fsV.voucherCode });
      trackedOrderIds.push(ordCancel.orderId);

      // TC10: Used voucher rejected while USED
      await setCartSingleVariant(u1.cartId, prod100k.variantId, 3);
      await assert.rejects(
        () => orderService.createCodOrder({ userId: u1.id, recipientName: 'U1', recipientPhone: '0912345678', deliveryAddress: 'HCM', voucherCode: fsV.voucherCode }),
        /đã hết lượt|đã từng sử dụng/
      );

      // Cancel restores voucher
      await orderService.cancelOrder(ordCancel.orderId, u1.id, 'Cancel to test voucher restitution');
      const vrRestored = (await query('SELECT status, used_at FROM voucher_redemptions WHERE id = @id', { id: fsV.redemptionId })).recordset[0];
      assert.strictEqual(vrRestored.status, 'AVAILABLE');
      assert.strictEqual(vrRestored.used_at, null);

      // TC08: Expired voucher rejected
      const expRes = await query(`
        INSERT INTO vouchers (code, name, discount_type, discount_value, min_order_value, max_discount_amount, start_date, end_date, usage_limit, used_count, is_active)
        OUTPUT INSERTED.id, INSERTED.code
        VALUES (@code, N'Expired FreeShip', 'free_shipping', 40000, 200000, 40000, DATEADD(day,-20,GETDATE()), DATEADD(day,-1,GETDATE()), 1, 0, 1)
      `, { code: `EXP-FS-${runId}` });
      trackedVoucherIds.push(expRes.recordset[0].id);
      await assert.rejects(
        () => orderService.createCodOrder({ userId: u1.id, recipientName: 'U1', recipientPhone: '0912345678', deliveryAddress: 'HCM', voucherCode: expRes.recordset[0].code }),
        /không tồn tại hoặc đã hết hạn/
      );
    });

    await asyncTest('TC12, TC13, TC14 & TC21: Legacy fixed_amount voucher compatibility & concurrent single-voucher lock', async () => {
      // Insert pre-cutover legacy fixed_amount 40k voucher (representing previously issued rule-4 voucher)
      const legCode = `LEGACY-FS-${runId}`;
      const legRes = await query(`
        INSERT INTO vouchers (code, name, discount_type, discount_value, min_order_value, max_discount_amount, start_date, end_date, usage_limit, used_count, is_active)
        OUTPUT INSERTED.id
        VALUES (@code, N'Voucher VAMOS Club - Voucher Miễn Phí Vận Chuyển', 'fixed_amount', 40000, 200000, 40000, DATEADD(day,-1,GETDATE()), DATEADD(day,14,GETDATE()), 1, 0, 1)
      `, { code: legCode });
      trackedVoucherIds.push(legRes.recordset[0].id);

      // TC13/14: Must still have discount_type='fixed_amount' and deduct 40,000 from subtotal even at 600k (shippingFee=0)
      await setCartSingleVariant(u1.cartId, prod100k.variantId, 6);
      const ordLeg = await orderService.createCodOrder({ userId: u1.id, recipientName: 'U1 Legacy', recipientPhone: '0912345678', deliveryAddress: 'HCM', voucherCode: legCode });
      trackedOrderIds.push(ordLeg.orderId);
      assert.strictEqual(ordLeg.discountAmount, 40000);
      assert.strictEqual(ordLeg.shippingDiscountAmount, 0);
      assert.strictEqual(ordLeg.totalAmount, 560000);

      // TC21: Two concurrent checkouts racing for a usage_limit=1 free_shipping voucher -> strictly 1 succeeds
      const raceCode = `RACE-FS-${runId}`;
      const raceRes = await query(`
        INSERT INTO vouchers (code, name, discount_type, discount_value, min_order_value, max_discount_amount, start_date, end_date, usage_limit, used_count, is_active)
        OUTPUT INSERTED.id
        VALUES (@code, N'Concurrent FreeShip', 'free_shipping', 40000, 200000, 40000, DATEADD(day,-1,GETDATE()), DATEADD(day,15,GETDATE()), 1, 0, 1)
      `, { code: raceCode });
      const raceVouchId = raceRes.recordset[0].id;
      trackedVoucherIds.push(raceVouchId);

      await setCartSingleVariant(u1.cartId, prod100k.variantId, 3);
      await setCartSingleVariant(u2.cartId, prod100k.variantId, 3);
      const raceResults = await Promise.allSettled([
        orderService.createCodOrder({ userId: u1.id, recipientName: 'R1', recipientPhone: '0911111111', deliveryAddress: 'HCM', voucherCode: raceCode }),
        orderService.createCodOrder({ userId: u2.id, recipientName: 'R2', recipientPhone: '0922222222', deliveryAddress: 'HN', voucherCode: raceCode })
      ]);
      const fulfilled = raceResults.filter((r) => r.status === 'fulfilled');
      const rejected = raceResults.filter((r) => r.status === 'rejected');
      assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent checkout may win usage_limit=1 voucher');
      assert.strictEqual(rejected.length, 1);
      trackedOrderIds.push(fulfilled[0].value.orderId);

      const vuCnt = (await query('SELECT COUNT(*) AS cnt FROM voucher_usages WHERE voucher_id = @vid', { vid: raceVouchId })).recordset[0].cnt;
      assert.strictEqual(vuCnt, 1);
    });

    console.log(`\n[MEDIUM-01 FREE SHIPPING SQL INTEGRATION]: ALL ${passed}/7 SUITES PASSED!`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (trackedVoucherIds.length > 0) {
      const vList = trackedVoucherIds.join(',');
      await query(`DELETE FROM voucher_usages WHERE voucher_id IN (${vList})`);
      await query(`DELETE FROM voucher_redemptions WHERE voucher_id IN (${vList})`);
    }
    if (trackedOrderIds.length > 0) {
      const oList = trackedOrderIds.join(',');
      await query(`DELETE FROM order_items WHERE order_id IN (${oList})`);
      await query(`DELETE FROM order_status_histories WHERE order_id IN (${oList})`);
      await query(`DELETE FROM orders WHERE id IN (${oList})`);
    }
    if (trackedVoucherIds.length > 0) {
      await query(`DELETE FROM vouchers WHERE id IN (${trackedVoucherIds.join(',')})`);
    }
    if (trackedCartIds.length > 0) {
      await query(`DELETE FROM cart_items WHERE cart_id IN (${trackedCartIds.join(',')})`);
      await query(`DELETE FROM carts WHERE id IN (${trackedCartIds.join(',')})`);
    }
    if (trackedProductIds.length > 0) {
      const pList = trackedProductIds.join(',');
      const vRows = await query(`SELECT id FROM product_variants WHERE product_id IN (${pList})`);
      if (vRows.recordset.length > 0) {
        await query(`DELETE FROM inventory_transactions WHERE variant_id IN (${vRows.recordset.map((r) => r.id).join(',')})`);
      }
      await query(`DELETE FROM product_variants WHERE product_id IN (${pList})`);
      await query(`DELETE FROM products WHERE id IN (${pList})`);
    }
    if (trackedUserIds.length > 0) {
      const uList = trackedUserIds.join(',');
      await query(`DELETE FROM inventory_transactions WHERE user_id IN (${uList})`);
      await query(`DELETE FROM loyalty_point_batches WHERE user_id IN (${uList})`);
      await query(`DELETE FROM point_transactions WHERE user_id IN (${uList})`);
      await query(`DELETE FROM user_points_wallets WHERE user_id IN (${uList})`);
      await query(`DELETE FROM users WHERE id IN (${uList})`);
    }
    await closePool();
  }
}

runIntegrationTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[MEDIUM-01 FREE SHIPPING SQL INTEGRATION FAILED]:', err);
    process.exit(1);
  });
