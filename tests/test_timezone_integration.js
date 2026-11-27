/**
 * VAMOS STORE — MEDIUM-05 SQL Server 2022 UTC Standardization Integration Tests
 * Covers: TC01-TC04 (SYSUTCDATETIME / default constraints / DATETIME2 round-trip),
 *         TC09-TC12 (Admin voucher ICT boundaries vs SQL SYSUTCDATETIME),
 *         TC15-TC17 (Loyalty voucher 15x24h & 30x24h expiration boundaries),
 *         TC18-TC26 (365d point expiration, worker retry, leap-year & Soft Landing),
 *         TC27-TC30 (Live order creation VAMYYMMDD),
 *         Dev/Test Reset Safety Guard negative assertions.
 */

require('./test_bootstrap');

const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const sql = require('mssql');

const appConfig = require('../src/config/app.config');
const { query, getPool, closePool } = require('../src/config/database');
const adminController = require('../src/controllers/admin.controller');
const loyaltyService = require('../src/services/loyalty.service');
const orderService = require('../src/services/order.service');
const { runLoyaltyCycleWorker } = require('../src/jobs/processLoyaltyCycle');
const { resetAndReseedTargetDb } = require('../database/reset_dev_test_db');
const dateTime = require('../src/utils/dateTime');
const { utc, createSuiteRunner } = require('./helpers/loyalty-test-helpers');

async function main() {
  const { asyncTest, assertSummary } = createSuiteRunner('VAMOS STORE - MEDIUM-05 SQL SERVER UTC INTEGRATION TESTS');
  const runId = `${Date.now()}_${crypto.randomInt(100, 999)}`;

  const trackedUserIds = [];
  const trackedVoucherCodes = [];
  const trackedOrderIds = [];
  let testProductId = null;
  let testVariantId = null;

  async function createTestUser(tag, initialPoints = 0) {
    const email = `tz_${tag}_${runId}_${crypto.randomInt(1000, 9999)}@vamos.test`;
    const hash = await bcrypt.hash(crypto.randomBytes(12).toString('hex'), 4);
    const uRes = await query(`
      INSERT INTO users (full_name, email, password_hash, phone, role, status)
      OUTPUT INSERTED.id, INSERTED.created_at
      VALUES (@name, @email, @hash, '0901234567', 'CUSTOMER', 'active')
    `, { name: `TZ User ${tag}`, email, hash });
    const user = uRes.recordset[0];
    trackedUserIds.push(user.id);
    await loyaltyService.getOrCreateWallet(user.id);

    if (initialPoints > 0) {
      const pool = await getPool();
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        await loyaltyService.awardOrderPurchasePoints(tx, {
          orderId: 900000000 + user.id,
          userId: user.id,
          eligibleAmount: Math.ceil(initialPoints / 0.03),
          txTimeOverride: new Date(Date.now() - 1000)
        });
        await tx.commit();
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    }
    return user;
  }

  try {
    // Seed an isolated active product + variant for real order checkout tests
    const catId = (await query('SELECT TOP 1 id FROM categories')).recordset[0].id;
    const brandId = (await query('SELECT TOP 1 id FROM brands')).recordset[0].id;
    const sizeId = (await query('SELECT TOP 1 id FROM sizes')).recordset[0].id;
    const colorId = (await query('SELECT TOP 1 id FROM colors')).recordset[0].id;

    const pRes = await query(`
      INSERT INTO products (category_id, brand_id, product_code, name, slug, description, gender_target, base_price, status)
      OUTPUT INSERTED.id
      VALUES (@catId, @brandId, @pcode, N'TZ Test Sneaker', @slug, N'TZ test', 'UNISEX', 500000, 'active')
    `, { catId, brandId, pcode: `TZ-${runId}`, slug: `tz-test-sneaker-${runId}` });
    testProductId = pRes.recordset[0].id;

    const vRes = await query(`
      INSERT INTO product_variants (product_id, size_id, color_id, sku, stock_quantity, status)
      OUTPUT INSERTED.id
      VALUES (@pid, @sid, @cid, @sku, 50, 'active')
    `, { pid: testProductId, sid: sizeId, cid: colorId, sku: `TZ-SKU-${runId}` });
    testVariantId = vRes.recordset[0].id;

    // --- TC01-TC04: SQL SYSUTCDATETIME, zero GETDATE defaults & DATETIME2 round-trip ---
    await asyncTest('TC01-TC04: SQL SYSUTCDATETIME matches Node UTC, zero GETDATE() defaults remain & DATETIME2 round-trip preserves exact instant', async () => {
      assert.strictEqual(appConfig.db.options.useUTC, true);

      const clockRow = (await query('SELECT SYSUTCDATETIME() AS sys_utc, GETUTCDATE() AS utc_dt')).recordset[0];
      const jsNowMs = Date.now();
      assert.ok(
        Math.abs(clockRow.sys_utc.getTime() - jsNowMs) < 15000,
        `SYSUTCDATETIME (${clockRow.sys_utc.toISOString()}) must match Node UTC (${new Date(jsNowMs).toISOString()}) within 15s (never 420m)`
      );
      assert.ok(
        Math.abs(clockRow.sys_utc.getTime() - clockRow.utc_dt.getTime()) < 5000
      );

      const legacyDefaults = (await query(`
        SELECT OBJECT_NAME(dc.parent_object_id) AS tbl, COL_NAME(dc.parent_object_id, dc.parent_column_id) AS col, dc.definition
        FROM sys.default_constraints dc
        JOIN sys.tables t ON dc.parent_object_id = t.object_id
        WHERE t.is_ms_shipped = 0 AND LOWER(dc.definition) LIKE '%getdate%'
      `)).recordset;
      assert.strictEqual(legacyDefaults.length, 0, `Remaining GETDATE() defaults found: ${JSON.stringify(legacyDefaults)}`);

      const u = await createTestUser('roundtrip');
      assert.ok(
        Math.abs(u.created_at.getTime() - jsNowMs) < 15000,
        'Default SYSUTCDATETIME() column users.created_at must store UTC instant matching Node nowUtc()'
      );

      // Exact millisecond round-trip via query() sql.DateTime2 binding
      const exactTs = utc('2026-11-26T16:59:59.750Z');
      const rt = (await query('SELECT @dt AS roundtripped', { dt: exactTs })).recordset[0].roundtripped;
      assert.strictEqual(rt.toISOString(), exactTs.toISOString());
    });

    // --- TC09-TC12: Admin Voucher Creation + End-Exclusive Checkout Enforcement ---
    await asyncTest('TC09-TC12: Admin voucher ICT calendar boundaries work all day and expire at exact end_exclusive boundary', async () => {
      const buyer = await createTestUser('adm_vouch');
      const todayIct = dateTime.getVietnameseCalendarDate();
      const todayCode = `TODAY_${runId}`;
      trackedVoucherCodes.push(todayCode);

      await adminController.postCreateVoucher(
        {
          body: {
            code: todayCode,
            name: 'Today Voucher',
            discount_type: 'fixed_amount',
            discount_value: '25000',
            min_order_value: '100000',
            usage_limit: '10',
            start_date: todayIct,
            end_date: todayIct
          }
        },
        { redirect: () => {} },
        (err) => { throw err; }
      );

      const vRow = (await query('SELECT * FROM vouchers WHERE code = @code', { code: todayCode })).recordset[0];
      const expected = dateTime.parseVietnameseDateInput(todayIct);
      assert.strictEqual(vRow.start_date.toISOString(), expected.startUtc.toISOString());
      assert.strictEqual(vRow.end_date.toISOString(), expected.endExclusiveUtc.toISOString());

      // Active throughout today ICT (before end_exclusive)
      const pool = await getPool();
      const previewOk = await orderService._validateAndCalculateVoucher(pool, {
        voucherCode: todayCode,
        userId: buyer.id,
        subtotal: 500000,
        shippingFee: 30000
      });
      assert.strictEqual(previewOk.discountAmount, 25000);

      // Move window so end_date == past instant or exact current SYSUTCDATETIME -> rejected (< end_exclusive)
      const boundaryCode = `EXACTEND_${runId}`;
      trackedVoucherCodes.push(boundaryCode);
      await query(`
        INSERT INTO vouchers (code, name, discount_type, discount_value, min_order_value, usage_limit, used_count, start_date, end_date, is_active)
        VALUES (@code, N'Exact End Test', 'fixed_amount', 20000, 100000, 1, 0, DATEADD(day, -2, SYSUTCDATETIME()), SYSUTCDATETIME(), 1)
      `, { code: boundaryCode });

      await assert.rejects(
        () => orderService._validateAndCalculateVoucher(pool, {
          voucherCode: boundaryCode,
          userId: buyer.id,
          subtotal: 500000,
          shippingFee: 30000
        }),
        /không tồn tại hoặc đã hết hạn/
      );
    });

    // --- TC15-TC17: Loyalty Voucher 15x24h & 30x24h + Exact Expiration Boundary ---
    await asyncTest('TC15-TC17: Redeemed FREE_SHIPPING (15x24h) & VOUCHER (30x24h) store exact UTC bounds and reject at nowUtc >= expiresAtUtc', async () => {
      const buyer = await createTestUser('redeem_exp', 2000);
      const fsRule = (await query("SELECT id, voucher_valid_days FROM point_reward_rules WHERE reward_type = 'FREE_SHIPPING' AND is_active = 1")).recordset[0];
      const vRule = (await query("SELECT id, voucher_valid_days FROM point_reward_rules WHERE reward_type = 'VOUCHER' AND is_active = 1")).recordset[0];
      assert.strictEqual(fsRule.voucher_valid_days, 15);

      const redeemedAt = utc('2026-11-26T10:30:00.000Z');
      const resFs = await loyaltyService.redeemVoucher(buyer.id, fsRule.id, { nowOverride: redeemedAt });
      trackedVoucherCodes.push(resFs.voucherCode);
      const fsVoucher = (await query('SELECT start_date, end_date FROM vouchers WHERE id = @id', { id: resFs.voucherId })).recordset[0];
      assert.strictEqual(fsVoucher.start_date.toISOString(), '2026-11-26T10:30:00.000Z');
      assert.strictEqual(fsVoucher.end_date.getTime() - fsVoucher.start_date.getTime(), 15 * 24 * 60 * 60 * 1000);

      const resOther = await loyaltyService.redeemVoucher(buyer.id, vRule.id, { nowOverride: redeemedAt });
      trackedVoucherCodes.push(resOther.voucherCode);
      const otherVoucher = (await query('SELECT start_date, end_date FROM vouchers WHERE id = @id', { id: resOther.voucherId })).recordset[0];
      assert.strictEqual(
        otherVoucher.end_date.getTime() - otherVoucher.start_date.getTime(),
        vRule.voucher_valid_days * 24 * 60 * 60 * 1000
      );

      // Exact boundary: voucher where end_date == SYSUTCDATETIME() (or past) fails checkout
      await query(
        'UPDATE vouchers SET start_date = DATEADD(day, -15, SYSUTCDATETIME()), end_date = SYSUTCDATETIME() WHERE id = @id',
        { id: resFs.voucherId }
      );
      const pool = await getPool();
      await assert.rejects(
        () => orderService._validateAndCalculateVoucher(pool, {
          voucherCode: resFs.voucherCode,
          userId: buyer.id,
          subtotal: 500000,
          shippingFee: 30000
        }),
        /không tồn tại hoặc đã hết hạn/
      );
    });

    // --- TC18-TC26: Point Expiration 365d + Worker Idempotency + Leap-year Soft Landing ---
    await asyncTest('TC18-TC26: 365-day batches, exact boundary worker idempotency & leap-year 2024-02-29 cycle rollover succeed on UTC DB', async () => {
      const u = await createTestUser('cycle_leap');
      const pool = await getPool();
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        await loyaltyService.awardOrderPurchasePoints(tx, {
          orderId: 910000000 + u.id,
          userId: u.id,
          eligibleAmount: 100000, // 3000 pts -> SILVER (tier >= 1000, GOLD = 2500)
          txTimeOverride: utc('2024-02-29T17:30:00.000Z')
        });
        await tx.commit();
      } catch (e) {
        await tx.rollback();
        throw e;
      }

      const batch = (await query('SELECT created_at, expires_at FROM loyalty_point_batches WHERE user_id = @uid', { uid: u.id })).recordset[0];
      assert.strictEqual(batch.created_at.toISOString(), '2024-02-29T17:30:00.000Z');
      assert.strictEqual(
        batch.expires_at.getTime() - batch.created_at.getTime(),
        365 * 24 * 60 * 60 * 1000
      );

      const beforeExp = new Date(batch.expires_at.getTime() - 1000);
      await runLoyaltyCycleWorker({ nowOverride: beforeExp });
      const wBefore = (await query('SELECT available_points, cycle_end_at FROM user_points_wallets WHERE user_id = @uid', { uid: u.id })).recordset[0];
      assert.strictEqual(wBefore.available_points, 3000, 'Must NOT expire 1s before expires_at');
      assert.strictEqual(wBefore.cycle_end_at.toISOString(), '2025-02-28T17:30:00.000Z');

      // Run at exact expires_at + rerun same timestamp -> batch expires once idempotently; cycle stays 1 at exact boundary
      await runLoyaltyCycleWorker({ nowOverride: batch.expires_at });
      await runLoyaltyCycleWorker({ nowOverride: batch.expires_at });

      const wAt = (await query('SELECT available_points, tier_code, cycle_number, cycle_end_at FROM user_points_wallets WHERE user_id = @uid', { uid: u.id })).recordset[0];
      assert.strictEqual(wAt.available_points, 0);
      assert.strictEqual(wAt.tier_code, 'GOLD');
      assert.strictEqual(wAt.cycle_number, 1, 'At exact cycle_end_at (<=), Cycle 1 must not roll over yet');

      // 1ms after boundary -> Cycle 1 rolls over to Cycle 2 retaining GOLD
      const afterBoundary = new Date(wAt.cycle_end_at.getTime() + 1);
      await runLoyaltyCycleWorker({ nowOverride: afterBoundary });
      const wRolled = (await query('SELECT cycle_number, tier_code, cycle_end_at FROM user_points_wallets WHERE user_id = @uid', { uid: u.id })).recordset[0];
      assert.strictEqual(wRolled.tier_code, 'GOLD');
      assert.strictEqual(wRolled.cycle_number, 2);
      assert.strictEqual(wRolled.cycle_end_at.toISOString(), '2026-02-28T17:30:00.000Z');

      const expTxs = (await query("SELECT id FROM point_transactions WHERE user_id = @uid AND transaction_type = 'POINT_EXPIRATION'", { uid: u.id })).recordset;
      assert.strictEqual(expTxs.length, 1, 'Worker rerun at exact expiration boundary must remain idempotent');

      // Advance past 2028-02-29 -> leap-year anchor restores Feb 29 (2028-02-29) without Feb 28 drift
      await runLoyaltyCycleWorker({ nowOverride: utc('2028-03-01T00:00:00.000Z') });
      const wLeap = (await query('SELECT cycle_number, cycle_start_at, cycle_end_at, tier_code FROM user_points_wallets WHERE user_id = @uid', { uid: u.id })).recordset[0];
      assert.strictEqual(wLeap.cycle_number, 5);
      assert.strictEqual(wLeap.cycle_start_at.toISOString(), '2028-02-29T17:30:00.000Z');
      assert.strictEqual(wLeap.cycle_end_at.toISOString(), '2029-02-28T17:30:00.000Z');
    });

    // --- Live Order Code Uses ICT Calendar Prefix & UTC created_at ---
    await asyncTest('ORDER-UTC-ICT: createCodOrder creates VAMYYMMDD in Asia/Ho_Chi_Minh and stores created_at in UTC', async () => {
      const buyer = await createTestUser('order_live');
      const cartRes = await query('INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@uid)', { uid: buyer.id });
      const cartId = cartRes.recordset[0].id;
      await query('INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@cid, @vid, 1)', {
        cid: cartId,
        vid: testVariantId
      });

      const created = await orderService.createCodOrder({
        userId: buyer.id,
        recipientName: 'Order TZ Check',
        recipientPhone: '0912345678',
        deliveryAddress: '100 Trần Hưng Đạo, Hà Nội'
      });
      trackedOrderIds.push(created.orderId);

      const expectedPrefix = `VAM${dateTime.getVietnameseOrderDatePrefix()}-`;
      assert.ok(
        created.orderCode.startsWith(expectedPrefix),
        `Order code "${created.orderCode}" must start with ICT date prefix "${expectedPrefix}"`
      );

      const ordRow = (await query('SELECT created_at FROM orders WHERE id = @id', { id: created.orderId })).recordset[0];
      assert.ok(Math.abs(ordRow.created_at.getTime() - Date.now()) < 15000, 'orders.created_at must reflect UTC instant');
    });

    // --- Clean Dev/Test Cutover Guard Fail-Closed Verification ---
    await asyncTest('RESET-GUARD: resetAndReseedTargetDb fails closed on missing guard, unknown DB, or production mode', async () => {
      const prevAllow = process.env.ALLOW_DEV_TEST_DB_RESET;
      try {
        delete process.env.ALLOW_DEV_TEST_DB_RESET;
        await assert.rejects(
          () => resetAndReseedTargetDb({ targetEnv: 'test', expectedDbName: 'vamos_store_test_db' }),
          /ALLOW_DEV_TEST_DB_RESET=1/
        );

        process.env.ALLOW_DEV_TEST_DB_RESET = '1';
        await assert.rejects(
          () => resetAndReseedTargetDb({ targetEnv: 'production', expectedDbName: 'vamos_store_prod_db' }),
          /forbidden in production/
        );
        await assert.rejects(
          () => resetAndReseedTargetDb({ targetEnv: 'test', expectedDbName: 'bookstore_db' }),
          /allowlist/
        );
      } finally {
        if (prevAllow === undefined) delete process.env.ALLOW_DEV_TEST_DB_RESET;
        else process.env.ALLOW_DEV_TEST_DB_RESET = prevAllow;
      }
    });

    assertSummary();
  } finally {
    try {
      for (const oid of trackedOrderIds) {
        await query('DELETE FROM order_status_histories WHERE order_id = @id', { id: oid });
        await query('DELETE FROM order_items WHERE order_id = @id', { id: oid });
        await query('DELETE FROM voucher_usages WHERE order_id = @id', { id: oid });
        await query('DELETE FROM orders WHERE id = @id', { id: oid });
      }
      if (testVariantId) {
        await query('DELETE FROM cart_items WHERE variant_id = @vid', { vid: testVariantId });
        await query('DELETE FROM inventory_transactions WHERE variant_id = @vid', { vid: testVariantId });
      }
      for (const uid of trackedUserIds) {
        await query('DELETE FROM voucher_redemptions WHERE user_id = @uid', { uid });
        await query('DELETE FROM loyalty_point_batches WHERE user_id = @uid', { uid });
        await query('DELETE FROM point_transactions WHERE user_id = @uid', { uid });
        await query('DELETE FROM user_points_wallets WHERE user_id = @uid', { uid });
        await query('DELETE FROM carts WHERE user_id = @uid', { uid });
        await query('DELETE FROM users WHERE id = @uid', { uid });
      }
      for (const code of trackedVoucherCodes) {
        await query('DELETE FROM vouchers WHERE code = @code', { code });
      }
      if (testVariantId) {
        await query('DELETE FROM product_variants WHERE id = @vid', { vid: testVariantId });
      }
      if (testProductId) {
        await query('DELETE FROM products WHERE id = @pid', { pid: testProductId });
      }
    } catch (cleanErr) {
      console.warn('[CLEANUP WARNING]:', cleanErr.message);
    }
    await closePool();
  }
}

main().catch((err) => {
  console.error('[FATAL TIMEZONE INTEGRATION ERROR]:', err);
  process.exitCode = 1;
});
