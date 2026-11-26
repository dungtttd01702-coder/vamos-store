/**
 * VAMOS CLUB - MEDIUM-03 SQL Server 2022 Integration & Multi-Connection Concurrency Suite (TC09-TC22)
 * Exercises atomic stock decrement, rollback integrity across transaction stages,
 * multi-customer / multi-pool race conditions, idempotency, order cancellation & expiry non-restock,
 * and CHECK constraint protection on isolated fixtures in vamos_store_test_db.
 */

require('./test_bootstrap');

const assert = require('node:assert');
const crypto = require('node:crypto');
const http = require('node:http');
const bcrypt = require('bcryptjs');
const sql = require('mssql');

const app = require('../src/app');
const appConfig = require('../src/config/app.config');
const { validateDatabaseConnection } = require('../src/config/db-guard');
const { getPool, query, closePool } = require('../src/config/database');
const loyaltyService = require('../src/services/loyalty.service');
const orderService = require('../src/services/order.service');
const { createSuiteRunner } = require('./helpers/loyalty-test-helpers');

function extractCookie(setCookieHeader) {
  return setCookieHeader ? setCookieHeader.split(';')[0] : '';
}

async function loginHttpSession(baseUrl, email, password) {
  const loginPageRes = await fetch(`${baseUrl}/auth/login`, { redirect: 'manual' });
  assert.strictEqual(loginPageRes.status, 200);
  const loginHtml = await loginPageRes.text();
  const initialCookie = extractCookie(loginPageRes.headers.get('set-cookie'));
  const csrfMatch = loginHtml.match(/name="_csrf" value="([^"]+)"/);
  assert.ok(csrfMatch && csrfMatch[1], 'Login CSRF token must be present');

  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { Cookie: initialCookie, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password, _csrf: csrfMatch[1] }).toString(),
    redirect: 'manual'
  });
  assert.strictEqual(loginRes.status, 302, 'Customer login must succeed with 302 redirect');
  const authCookie = extractCookie(loginRes.headers.get('set-cookie')) || initialCookie;

  const homeRes = await fetch(`${baseUrl}/account/rewards`, { headers: { Cookie: authCookie }, redirect: 'manual' });
  assert.strictEqual(homeRes.status, 200);
  const rewardsHtml = await homeRes.text();
  const tokenMatch = rewardsHtml.match(/window\.CSRF_TOKEN = '([^']+)';/);
  assert.ok(tokenMatch && tokenMatch[1], 'Session CSRF token must be present on /account/rewards');
  return { cookie: authCookie, csrfToken: tokenMatch[1], html: rewardsHtml };
}

async function main() {
  const dbCheck = await query('SELECT DB_NAME() AS current_db');
  const currentDb = dbCheck.recordset[0]?.current_db;
  if (!currentDb || !currentDb.toLowerCase().includes('test')) {
    throw new Error(`[ABORT] test_voucher_stock must run on test DB, got: ${currentDb}`);
  }

  const { asyncTest, assertSummary } = createSuiteRunner('VAMOS CLUB - MEDIUM-03 SQL SERVER INTEGRATION & CONCURRENCY TESTS (TC09-TC22)');
  const runId = `vs_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const runtimePass = crypto.randomBytes(12).toString('hex');
  const passHash = await bcrypt.hash(runtimePass, 4);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const trackedUserIds = [];
  const trackedRuleIds = [];
  const trackedVoucherIds = [];
  const trackedOrderIds = [];
  const trackedCartIds = [];
  const trackedProductIds = [];

  async function createIsolatedCustomer(tag, initialPoints = 0) {
    const email = `${runId}_${tag}@test.vamos.local`;
    const uRes = await query(`
      INSERT INTO users (full_name, email, password_hash, role, status)
      OUTPUT INSERTED.id, INSERTED.email
      VALUES (@name, @email, @hash, 'CUSTOMER', 'active')
    `, { name: `Stock Test ${tag}`, email, hash: passHash });
    const user = uRes.recordset[0];
    trackedUserIds.push(user.id);

    if (initialPoints > 0) {
      const pool = await getPool();
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        await loyaltyService.getOrCreateWallet(user.id, tx);
        const ptRes = await new sql.Request(tx)
          .input('uid', sql.Int, user.id)
          .input('amt', sql.Int, initialPoints)
          .input('bal', sql.Int, initialPoints)
          .input('idem', sql.NVarChar(100), `VS_SEED_${runId}_${user.id}_${crypto.randomBytes(4).toString('hex')}`)
          .query(`
            INSERT INTO point_transactions (user_id, transaction_type, amount, balance_after, description, idempotency_key)
            OUTPUT INSERTED.id
            VALUES (@uid, 'ADMIN_ADJUSTMENT', @amt, @bal, N'Fixture seed points for MEDIUM-03 test', @idem)
          `);
        await new sql.Request(tx)
          .input('uid', sql.Int, user.id)
          .input('txId', sql.Int, ptRes.recordset[0].id)
          .input('pts', sql.Int, initialPoints)
          .query(`
            INSERT INTO loyalty_point_batches (user_id, transaction_id, initial_points, remaining_points, expires_at, status)
            VALUES (@uid, @txId, @pts, @pts, DATEADD(day, 365, SYSUTCDATETIME()), 'ACTIVE')
          `);
        await new sql.Request(tx)
          .input('uid', sql.Int, user.id)
          .input('pts', sql.Int, initialPoints)
          .query(`
            UPDATE user_points_wallets
            SET available_points = @pts, lifetime_earned_points = @pts
            WHERE user_id = @uid
          `);
        await tx.commit();
      } catch (err) {
        await tx.rollback();
        throw err;
      }
    }
    return user;
  }

  async function createIsolatedRule({
    title,
    pointsRequired = 300,
    stockQuantity = 5,
    isActive = 1,
    discountType = 'fixed_amount',
    discountValue = 30000,
    minOrderAmount = 200000
  }) {
    const res = await query(`
      INSERT INTO point_reward_rules
      (title, description, reward_type, points_required, discount_type, discount_value, min_order_amount, max_discount_amount, voucher_valid_days, stock_quantity, is_active, sort_order)
      OUTPUT INSERTED.id
      VALUES
      (@title, N'Isolated stock test rule', 'VOUCHER', @pts, @discType, @discVal, @minOrd, @discVal, 30, @stock, @active, 999)
    `, {
      title: `${title} [${runId}]`,
      pts: pointsRequired,
      discType: discountType,
      discVal: discountValue,
      minOrd: minOrderAmount,
      stock: stockQuantity,
      active: isActive ? 1 : 0
    });
    const ruleId = res.recordset[0].id;
    trackedRuleIds.push(ruleId);
    return ruleId;
  }

  async function getRuleState(ruleId) {
    const res = await query('SELECT id, stock_quantity, is_active FROM point_reward_rules WHERE id = @id', { id: ruleId });
    return res.recordset[0];
  }

  async function getRuleRedemptionSummary(ruleId) {
    const res = await query(`
      SELECT vr.id AS redemption_id, vr.user_id, vr.voucher_id, vr.status,
             v.code AS voucher_code,
             (SELECT COUNT(*) FROM point_transactions pt WHERE pt.reference_type = 'VOUCHER_REDEMPTION' AND pt.reference_id = CAST(vr.voucher_id AS NVARCHAR(100))) AS tx_count
      FROM voucher_redemptions vr
      JOIN vouchers v ON vr.voucher_id = v.id
      WHERE vr.reward_rule_id = @ruleId
    `, { ruleId });
    return res.recordset;
  }

  async function getWalletBalance(userId) {
    const res = await query('SELECT available_points, lifetime_redeemed_points FROM user_points_wallets WHERE user_id = @uid', { uid: userId });
    return res.recordset[0];
  }

  async function postHttpRedeemJson(session, ruleId, extraFields = {}) {
    const res = await fetch(`${baseUrl}/account/rewards/redeem`, {
      method: 'POST',
      headers: {
        Cookie: session.cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: new URLSearchParams({
        _csrf: session.csrfToken,
        reward_rule_id: String(ruleId),
        ...extraFields
      }).toString(),
      redirect: 'manual'
    });
    const body = await res.json();
    if (body?.data?.voucherId) {
      trackedVoucherIds.push(body.data.voucherId);
    }
    return { status: res.status, body };
  }

  async function createTestCartProduct(userId, unitPrice = 300000) {
    const refIds = (await query(`
      SELECT
        (SELECT TOP 1 id FROM categories ORDER BY id ASC) AS category_id,
        (SELECT TOP 1 id FROM sizes ORDER BY id ASC) AS size_id,
        (SELECT TOP 1 id FROM colors ORDER BY id ASC) AS color_id
    `)).recordset[0];
    assert.ok(refIds.category_id && refIds.size_id && refIds.color_id, 'Base catalog fixtures must exist in vamos_store_test_db');

    const prodIdx = trackedProductIds.length;
    const prodRes = await query(`
      INSERT INTO products (category_id, product_code, name, slug, base_price, status)
      OUTPUT INSERTED.id
      VALUES (@catId, @pCode, @name, @slug, @price, 'active')
    `, {
      catId: refIds.category_id,
      pCode: `VS-PROD-${runId}-${prodIdx}`,
      name: `Stock Test Shoe ${runId}`,
      slug: `stock-test-shoe-${runId}-${prodIdx}`,
      price: unitPrice
    });
    const productId = prodRes.recordset[0].id;
    trackedProductIds.push(productId);

    const varRes = await query(`
      INSERT INTO product_variants (product_id, size_id, color_id, sku, stock_quantity, status)
      OUTPUT INSERTED.id
      VALUES (@pid, @sizeId, @colorId, @sku, 20, 'active')
    `, {
      pid: productId,
      sizeId: refIds.size_id,
      colorId: refIds.color_id,
      sku: `VS-STK-${runId}-${productId}`
    });
    const variantId = varRes.recordset[0].id;

    const cartRes = await query(`
      INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@uid)
    `, { uid: userId });
    const cartId = cartRes.recordset[0].id;
    trackedCartIds.push(cartId);

    await query('INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@cid, @vid, 1)', {
      cid: cartId,
      vid: variantId
    });
    return { productId, variantId, cartId };
  }

  try {
    // TC09 & TC10
    await asyncTest('TC09 & TC10: Successful redeem creates 1 voucher + 1 redemption and decrements DB stock by 1', async () => {
      const ruleId = await createIsolatedRule({ title: 'TC09 Single Redeem', pointsRequired: 300, stockQuantity: 5 });
      const u1 = await createIsolatedCustomer('tc09_u1', 1000);

      const res = await loyaltyService.redeemVoucher(u1.id, ruleId);
      trackedVoucherIds.push(res.voucherId);

      assert.strictEqual(res.remainingStock, 4);
      const dbRule = await getRuleState(ruleId);
      assert.strictEqual(dbRule.stock_quantity, 4);

      const rows = await getRuleRedemptionSummary(ruleId);
      assert.strictEqual(rows.length, 1);
      assert.strictEqual(rows[0].tx_count, 1);
      assert.strictEqual(rows[0].status, 'AVAILABLE');

      const wallet = await getWalletBalance(u1.id);
      assert.strictEqual(wallet.available_points, 700);
      assert.strictEqual(wallet.lifetime_redeemed_points, 300);
    });

    // TC11 & TC12: Rollback on failures AFTER stock decrement
    await asyncTest('TC11 & TC12: Failure before voucher/redemption/point_transaction insert rolls back stock, wallet, batches, and vouchers', async () => {
      const ruleId = await createIsolatedRule({ title: 'TC11 Rollback Guard', pointsRequired: 400, stockQuantity: 3 });
      const uRb = await createIsolatedCustomer('tc11_rb', 900);

      for (const failPoint of ['before_voucher_insert', 'before_redemption_insert', 'before_point_transaction_insert']) {
        await assert.rejects(
          () => loyaltyService.redeemVoucher(uRb.id, ruleId, { _testFailAt: failPoint }),
          /Simulated failure/
        );

        const ruleAfter = await getRuleState(ruleId);
        assert.strictEqual(ruleAfter.stock_quantity, 3, `Stock must roll back cleanly on ${failPoint}`);

        const walletAfter = await getWalletBalance(uRb.id);
        assert.strictEqual(walletAfter.available_points, 900, `Wallet points must roll back cleanly on ${failPoint}`);
        assert.strictEqual(walletAfter.lifetime_redeemed_points, 0);

        const batchRem = (await query(
          'SELECT SUM(remaining_points) AS rem FROM loyalty_point_batches WHERE user_id = @uid',
          { uid: uRb.id }
        )).recordset[0].rem;
        assert.strictEqual(batchRem, 900, `FEFO batch must roll back cleanly on ${failPoint}`);

        const redRows = await getRuleRedemptionSummary(ruleId);
        assert.strictEqual(redRows.length, 0, `No redemption or voucher may remain committed after ${failPoint}`);
      }
    });

    // TC13: Out-of-stock rejection at service and HTTP controller layer
    await asyncTest('TC13: Zero-stock active rule rejects at service and HTTP /account/rewards/redeem without side effects', async () => {
      const zeroRuleId = await createIsolatedRule({ title: 'TC13 Out Of Stock', pointsRequired: 200, stockQuantity: 0, isActive: 1 });
      const uZero = await createIsolatedCustomer('tc13_u', 800);

      await assert.rejects(
        () => loyaltyService.redeemVoucher(uZero.id, zeroRuleId),
        /Voucher này đã hết lượt đổi\./
      );

      const session = await loginHttpSession(baseUrl, uZero.email, runtimePass);
      assert.ok(session.html.includes('HẾT LƯỢT ĐỔI'), 'Customer UI must render HẾT LƯỢT ĐỔI for zero-stock active rule');

      const httpOut = await postHttpRedeemJson(session, zeroRuleId);
      assert.strictEqual(httpOut.status, 400);
      assert.strictEqual(httpOut.body.success, false);
      assert.ok(/Voucher này đã hết lượt đổi\./.test(httpOut.body.message));

      assert.strictEqual((await getRuleState(zeroRuleId)).stock_quantity, 0);
      assert.strictEqual((await getRuleRedemptionSummary(zeroRuleId)).length, 0);
      assert.strictEqual((await getWalletBalance(uZero.id)).available_points, 800);
    });

    // TC14: Two different customers racing via real HTTP + DB transactions for last 1 stock
    await asyncTest('TC14: Two customers race concurrently on stock = 1 via HTTP -> strictly 1 succeeds, 1 rejected, stock = 0', async () => {
      const lastStockRuleId = await createIsolatedRule({ title: 'TC14 Last Stock Race', pointsRequired: 300, stockQuantity: 1 });
      const custA = await createIsolatedCustomer('tc14_a', 600);
      const custB = await createIsolatedCustomer('tc14_b', 600);

      const sessA = await loginHttpSession(baseUrl, custA.email, runtimePass);
      const sessB = await loginHttpSession(baseUrl, custB.email, runtimePass);

      const [resA, resB] = await Promise.all([
        postHttpRedeemJson(sessA, lastStockRuleId),
        postHttpRedeemJson(sessB, lastStockRuleId)
      ]);

      const successes = [resA, resB].filter((r) => r.status === 200 && r.body.success === true);
      const failures = [resA, resB].filter((r) => r.status === 400 && r.body.success === false);

      assert.strictEqual(successes.length, 1, 'Strictly 1 HTTP customer request must acquire the final stock');
      assert.strictEqual(failures.length, 1, 'The losing customer request must return HTTP 400');
      assert.ok(/Voucher này đã hết lượt đổi\./.test(failures[0].body.message));

      assert.strictEqual((await getRuleState(lastStockRuleId)).stock_quantity, 0);
      const rows = await getRuleRedemptionSummary(lastStockRuleId);
      assert.strictEqual(rows.length, 1, 'Exactly 1 voucher and 1 redemption record must exist');
      assert.strictEqual(rows[0].tx_count, 1);

      const winnerId = rows[0].user_id;
      const loserId = winnerId === custA.id ? custB.id : custA.id;
      assert.strictEqual((await getWalletBalance(winnerId)).available_points, 300);
      assert.strictEqual((await getWalletBalance(loserId)).available_points, 600);
    });

    // TC15: Contention with stock = 2 across 4 different customers concurrently
    await asyncTest('TC15: Four customers race concurrently on stock = 2 -> strictly 2 win, 2 fail, stock = 0', async () => {
      const ruleId = await createIsolatedRule({ title: 'TC15 Multi Race 2', pointsRequired: 250, stockQuantity: 2 });
      const customers = await Promise.all([
        createIsolatedCustomer('tc15_c1', 500),
        createIsolatedCustomer('tc15_c2', 500),
        createIsolatedCustomer('tc15_c3', 500),
        createIsolatedCustomer('tc15_c4', 500)
      ]);

      const settled = await Promise.allSettled(
        customers.map((c) => loyaltyService.redeemVoucher(c.id, ruleId))
      );
      const fulfilled = settled.filter((r) => r.status === 'fulfilled');
      const rejected = settled.filter((r) => r.status === 'rejected');

      for (const item of fulfilled) {
        trackedVoucherIds.push(item.value.voucherId);
      }

      assert.strictEqual(fulfilled.length, 2, 'Strictly 2 customers must succeed for stock = 2');
      assert.strictEqual(rejected.length, 2, 'Strictly 2 customers must be rejected out-of-stock');
      for (const fail of rejected) {
        assert.ok(/Voucher này đã hết lượt đổi\./.test(fail.reason.message));
      }

      assert.strictEqual((await getRuleState(ruleId)).stock_quantity, 0);
      const rows = await getRuleRedemptionSummary(ruleId);
      assert.strictEqual(rows.length, 2);

      const winnerSet = new Set(rows.map((r) => r.user_id));
      for (const c of customers) {
        const w = await getWalletBalance(c.id);
        assert.strictEqual(w.available_points, winnerSet.has(c.id) ? 250 : 500);
      }
    });

    // TC16 & TC17: Same idempotency key (sequential & concurrent) + same-customer duplicate retry without idempotency key
    await asyncTest('TC16 & TC17: Same idempotency key consumes 1 stock max; different keys protect wallet balance cleanly', async () => {
      const ruleId = await createIsolatedRule({ title: 'TC16 Idem Guard', pointsRequired: 400, stockQuantity: 1 });
      const uIdem = await createIsolatedCustomer('tc16_idem', 1200);
      const sharedKey = `IDEM_${runId}_${crypto.randomBytes(6).toString('hex')}`;

      // Concurrent duplicate submit with same idempotencyKey when stock = 1 -> both return success (1 minted + 1 idempotent replay), stock = 0
      const [r1, r2] = await Promise.all([
        loyaltyService.redeemVoucher(uIdem.id, ruleId, { idempotencyKey: sharedKey }),
        loyaltyService.redeemVoucher(uIdem.id, ruleId, { idempotencyKey: sharedKey })
      ]);
      if (r1.voucherId) trackedVoucherIds.push(r1.voucherId);
      if (r2.voucherId && r2.voucherId !== r1.voucherId) trackedVoucherIds.push(r2.voucherId);

      assert.strictEqual(r1.voucherCode, r2.voucherCode);
      assert.strictEqual(r1.voucherId, r2.voucherId);

      // Sequential replay after stock is already 0 must STILL return cached idempotent result
      const r3 = await loyaltyService.redeemVoucher(uIdem.id, ruleId, { idempotencyKey: sharedKey });
      assert.strictEqual(r3.idempotent, true);
      assert.strictEqual(r3.voucherCode, r1.voucherCode);

      assert.strictEqual((await getRuleState(ruleId)).stock_quantity, 0);
      assert.strictEqual((await getRuleRedemptionSummary(ruleId)).length, 1);
      assert.strictEqual((await getWalletBalance(uIdem.id)).available_points, 800);

      // TC17: Same user concurrent calls without shared idempotency key when wallet only covers 1 redemption
      const ruleMultiId = await createIsolatedRule({ title: 'TC17 Single User Race', pointsRequired: 500, stockQuantity: 5 });
      const uSingleRace = await createIsolatedCustomer('tc17_race', 500);
      const raceRes = await Promise.allSettled([
        loyaltyService.redeemVoucher(uSingleRace.id, ruleMultiId),
        loyaltyService.redeemVoucher(uSingleRace.id, ruleMultiId)
      ]);
      const won = raceRes.filter((r) => r.status === 'fulfilled');
      const lost = raceRes.filter((r) => r.status === 'rejected');
      for (const item of won) trackedVoucherIds.push(item.value.voucherId);

      assert.strictEqual(won.length, 1);
      assert.strictEqual(lost.length, 1);
      assert.strictEqual((await getRuleState(ruleMultiId)).stock_quantity, 4);
      assert.strictEqual((await getWalletBalance(uSingleRace.id)).available_points, 0);
      assert.strictEqual((await getRuleRedemptionSummary(ruleMultiId)).length, 1);
    });

    // TC18 & TC19: Order cancellation & voucher expiry NEVER restock point_reward_rules
    await asyncTest('TC18 & TC19: Order cancellation restores voucher to AVAILABLE and expiry rejects checkout without restocking rule', async () => {
      const ruleId = await createIsolatedRule({ title: 'TC18 No Restock Policy', pointsRequired: 300, stockQuantity: 3 });
      const uLife = await createIsolatedCustomer('tc18_life', 800);
      const { variantId, cartId } = await createTestCartProduct(uLife.id, 400000);

      const redeemed1 = await loyaltyService.redeemVoucher(uLife.id, ruleId);
      trackedVoucherIds.push(redeemed1.voucherId);
      assert.strictEqual((await getRuleState(ruleId)).stock_quantity, 2);

      const orderRes = await orderService.createCodOrder({
        userId: uLife.id,
        voucherCode: redeemed1.voucherCode,
        recipientName: 'Stock Lifecycle User',
        recipientPhone: '0912345678',
        deliveryAddress: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội'
      });
      trackedOrderIds.push(orderRes.orderId);

      await orderService.cancelOrder(orderRes.orderId, uLife.id, 'Kiểm thử chính sách không hoàn stock rule');

      const vrAfterCancel = (await query('SELECT status FROM voucher_redemptions WHERE id = @id', { id: redeemed1.redemptionId })).recordset[0];
      assert.strictEqual(vrAfterCancel.status, 'AVAILABLE', 'Personal voucher must return to AVAILABLE for customer reuse');
      assert.strictEqual((await getRuleState(ruleId)).stock_quantity, 2, 'Order cancellation MUST NOT restock point_reward_rules');

      // TC19: Re-seed cart item, redeem a second voucher, expire its dates in DB -> checkout rejects, rule stock stays 1
      await query('INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@cid, @vid, 1)', { cid: cartId, vid: variantId });
      const redeemed2 = await loyaltyService.redeemVoucher(uLife.id, ruleId);
      trackedVoucherIds.push(redeemed2.voucherId);
      assert.strictEqual((await getRuleState(ruleId)).stock_quantity, 1);

      await query(`
        UPDATE vouchers
        SET start_date = DATEADD(day, -40, SYSUTCDATETIME()),
            end_date = DATEADD(day, -5, SYSUTCDATETIME())
        WHERE id = @vid
      `, { vid: redeemed2.voucherId });

      await assert.rejects(
        () => orderService.createCodOrder({
          userId: uLife.id,
          voucherCode: redeemed2.voucherCode,
          recipientName: 'Expired Voucher User',
          recipientPhone: '0912345678',
          deliveryAddress: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội'
        }),
        /không tồn tại hoặc đã hết hạn/
      );
      assert.strictEqual((await getRuleState(ruleId)).stock_quantity, 1, 'Expired voucher MUST NOT restock point_reward_rules');
    });

    // TC20: Multi-pool independent SQL connections & distinct reward rules
    await asyncTest('TC20: Independent SQL ConnectionPools confirm distinct SPIDs & cross-rule concurrency without blocking', async () => {
      validateDatabaseConnection(appConfig.db, process.env.NODE_ENV);
      const pool1 = await new sql.ConnectionPool({ ...appConfig.db, pool: { max: 2, min: 1 } }).connect();
      const pool2 = await new sql.ConnectionPool({ ...appConfig.db, pool: { max: 2, min: 1 } }).connect();

      try {
        const ruleX = await createIsolatedRule({ title: 'TC20 Rule X', pointsRequired: 200, stockQuantity: 2 });
        const ruleY = await createIsolatedRule({ title: 'TC20 Rule Y', pointsRequired: 200, stockQuantity: 2 });

        const spid1 = (await pool1.request().query('SELECT @@SPID AS spid')).recordset[0].spid;
        const spid2 = (await pool2.request().query('SELECT @@SPID AS spid')).recordset[0].spid;
        assert.notStrictEqual(spid1, spid2, 'Two independent pools must use distinct SQL Server SPIDs');

        const tx1 = new sql.Transaction(pool1);
        const tx2 = new sql.Transaction(pool2);
        await tx1.begin();
        await tx2.begin();

        try {
          // Hold row lock on ruleX in connection 1 while connection 2 atomically decrements ruleY concurrently
          const lockX = await new sql.Request(tx1).input('id', sql.Int, ruleX).query(`
            SELECT stock_quantity FROM point_reward_rules WITH (UPDLOCK, ROWLOCK) WHERE id = @id
          `);
          assert.strictEqual(lockX.recordset[0].stock_quantity, 2);

          const updY = await new sql.Request(tx2).input('id', sql.Int, ruleY).query(`
            UPDATE point_reward_rules SET stock_quantity = stock_quantity - 1 WHERE id = @id AND is_active = 1 AND stock_quantity > 0
          `);
          assert.strictEqual(updY.rowsAffected[0], 1, 'Independent connection updating ruleY must NOT block behind lock on ruleX');

          const updX = await new sql.Request(tx1).input('id', sql.Int, ruleX).query(`
            UPDATE point_reward_rules SET stock_quantity = stock_quantity - 1 WHERE id = @id AND is_active = 1 AND stock_quantity > 0
          `);
          assert.strictEqual(updX.rowsAffected[0], 1);

          await tx1.commit();
          await tx2.commit();
        } catch (err) {
          try { await tx1.rollback(); } catch (_rb1) { /* ignore already rolled back */ }
          try { await tx2.rollback(); } catch (_rb2) { /* ignore already rolled back */ }
          throw err;
        }

        assert.strictEqual((await getRuleState(ruleX)).stock_quantity, 1);
        assert.strictEqual((await getRuleState(ruleY)).stock_quantity, 1);
      } finally {
        await pool1.close();
        await pool2.close();
      }
    });

    // TC21 & TC22: Burst against zero stock + DB CHECK constraint + cross-table consistency
    await asyncTest('TC21 & TC22: Concurrent burst on stock = 0 never passes, CHECK constraint blocks <0, all tables stay consistent', async () => {
      const zeroBurstRuleId = await createIsolatedRule({ title: 'TC21 Zero Burst', pointsRequired: 100, stockQuantity: 0 });
      const users = await Promise.all([
        createIsolatedCustomer('tc21_1', 300),
        createIsolatedCustomer('tc21_2', 300),
        createIsolatedCustomer('tc21_3', 300),
        createIsolatedCustomer('tc21_4', 300),
        createIsolatedCustomer('tc21_5', 300)
      ]);

      const burstZero = await Promise.allSettled(users.map((u) => loyaltyService.redeemVoucher(u.id, zeroBurstRuleId)));
      assert.ok(burstZero.every((r) => r.status === 'rejected'), 'All requests on zero stock must be rejected');
      assert.strictEqual((await getRuleState(zeroBurstRuleId)).stock_quantity, 0);
      assert.strictEqual((await getRuleRedemptionSummary(zeroBurstRuleId)).length, 0);

      // Verify CHECK (stock_quantity >= 0) rejects direct negative update at DB layer
      await assert.rejects(
        () => query('UPDATE point_reward_rules SET stock_quantity = -1 WHERE id = @id', { id: zeroBurstRuleId }),
        /chk_reward_rules_stock|CHECK constraint/i
      );

      // Re-run a mixed 5-user race on stock = 3 and reconcile global invariants
      const burstRuleId = await createIsolatedRule({ title: 'TC22 Consistency Burst', pointsRequired: 100, stockQuantity: 3 });
      const burstRes = await Promise.allSettled(users.map((u) => loyaltyService.redeemVoucher(u.id, burstRuleId)));
      const burstWon = burstRes.filter((r) => r.status === 'fulfilled');
      const burstLost = burstRes.filter((r) => r.status === 'rejected');
      for (const item of burstWon) trackedVoucherIds.push(item.value.voucherId);

      assert.strictEqual(burstWon.length, 3);
      assert.strictEqual(burstLost.length, 2);
      assert.strictEqual((await getRuleState(burstRuleId)).stock_quantity, 0);

      const finalReds = await getRuleRedemptionSummary(burstRuleId);
      assert.strictEqual(finalReds.length, 3);
      assert.ok(finalReds.every((r) => r.tx_count === 1));

      for (const u of users) {
        const w = await getWalletBalance(u.id);
        const ledgerSum = (await query('SELECT COALESCE(SUM(amount), 0) AS net FROM point_transactions WHERE user_id = @uid', { uid: u.id })).recordset[0].net;
        const batchSum = (await query("SELECT COALESCE(SUM(remaining_points), 0) AS rem FROM loyalty_point_batches WHERE user_id = @uid AND status = 'ACTIVE'", { uid: u.id })).recordset[0].rem;
        assert.strictEqual(w.available_points, ledgerSum, 'Wallet available_points must match ledger net sum');
        assert.strictEqual(w.available_points, batchSum, 'Wallet available_points must match active FEFO batches');
      }
    });

    assertSummary();
  } finally {
    await new Promise((resolve) => server.close(resolve));
    try {
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
        const cList = trackedCartIds.join(',');
        await query(`DELETE FROM cart_items WHERE cart_id IN (${cList})`);
        await query(`DELETE FROM carts WHERE id IN (${cList})`);
      }
      if (trackedProductIds.length > 0) {
        const pList = trackedProductIds.join(',');
        const varRows = await query(`SELECT id FROM product_variants WHERE product_id IN (${pList})`);
        if (varRows.recordset.length > 0) {
          await query(`DELETE FROM inventory_transactions WHERE variant_id IN (${varRows.recordset.map((r) => r.id).join(',')})`);
        }
        await query(`DELETE FROM product_variants WHERE product_id IN (${pList})`);
        await query(`DELETE FROM products WHERE id IN (${pList})`);
      }
      if (trackedUserIds.length > 0) {
        const uList = trackedUserIds.join(',');
        await query(`DELETE FROM voucher_redemptions WHERE user_id IN (${uList})`);
        await query(`DELETE FROM loyalty_point_batches WHERE user_id IN (${uList})`);
        await query(`DELETE FROM point_transactions WHERE user_id IN (${uList})`);
        await query(`DELETE FROM user_points_wallets WHERE user_id IN (${uList})`);
        await query(`DELETE FROM inventory_transactions WHERE user_id IN (${uList})`);
        await query(`DELETE FROM users WHERE id IN (${uList})`);
      }
      if (trackedRuleIds.length > 0) {
        await query(`DELETE FROM point_reward_rules WHERE id IN (${trackedRuleIds.join(',')})`);
      }
    } catch (cleanupErr) {
      console.error('[TEST CLEANUP WARNING]:', cleanupErr.message);
    }
    await closePool();
  }
}

main().catch((err) => {
  console.error('[FATAL VOUCHER STOCK INTEGRATION ERROR]:', err);
  process.exitCode = 1;
});
