/**
 * VAMOS CLUB - SQL Server Integration Tests (12-Month Tier Cycle & 365-Day Expiration)
 * Designed for CI isolated test DB (`vamos_store_test_db`) via `./test_bootstrap`.
 * NEVER run against development or production databases.
 */

require('./test_bootstrap');
const assert = require('node:assert');
const sql = require('mssql');
const { getPool, query, closePool } = require('../src/config/database');
const loyaltyService = require('../src/services/loyalty.service');
const { runLoyaltyCycleWorker, acquireSessionAppLock, releaseSessionAppLock } = require('../src/jobs/processLoyaltyCycle');
const { runLoyaltyBackfill } = require('../src/jobs/backfillLoyaltyHistory');
const { utc, createSuiteRunner } = require('./helpers/loyalty-test-helpers');

async function createIsolatedUser(prefix) {
  const email = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}@test.vamos.local`;
  const res = await query(`
    INSERT INTO users (full_name, email, password_hash, role, status)
    OUTPUT INSERTED.id, INSERTED.email
    VALUES (@name, @email, '$2b$10$dummyhashfortestonly000000000000000000000000', 'CUSTOMER', 'active')
  `, { name: `Loyalty Test ${prefix}`, email });
  return res.recordset[0];
}

async function main() {
  const { asyncTest, assertSummary } = createSuiteRunner('VAMOS CLUB - SQL SERVER INTEGRATION TESTS');

  const trackedUserIds = [];
  const trackedRuleIds = [];
  const trackedVoucherIds = [];

  try {
    // Create an isolated active test reward rule adhering strictly to Migration 005 CHECK constraints
    const ruleRes = await query(`
      INSERT INTO point_reward_rules
      (title, reward_type, points_required, discount_type, discount_value, min_order_amount, max_discount_amount, voucher_valid_days, stock_quantity, is_active, sort_order)
      OUTPUT INSERTED.id
      VALUES (N'CI Cycle Test Voucher', 'VOUCHER', 700, 'fixed_amount', 50000, 200000, 50000, 30, 999, 1, 999)
    `);
    const testRuleId = ruleRes.recordset[0].id;
    trackedRuleIds.push(testRuleId);

    // -----------------------------------------------------------------
    // INT-07: Backfill APPLY Success Path & Idempotency (Runs on clean DB before INT-01..06 create batches)
    // -----------------------------------------------------------------
    await asyncTest('INT-07: Backfill APPLY reconciles clean historical ledger into FEFO batches & cycle state cleanly', async () => {
      const preExistingBatches = (await query('SELECT COUNT(*) AS cnt FROM loyalty_point_batches')).recordset[0].cnt;
      const preExistingTxs = (await query('SELECT COUNT(*) AS cnt FROM point_transactions')).recordset[0].cnt;
      assert.strictEqual(preExistingBatches, 0, 'INT-07 requires clean test DB without pre-existing batches');
      assert.strictEqual(preExistingTxs, 0, 'INT-07 requires clean test DB without pre-existing point_transactions');

      const uClean = await createIsolatedUser('int07_clean_backfill');
      const uControl = await createIsolatedUser('int07_control_user');
      const localCleanupIds = [uClean.id, uControl.id];
      trackedUserIds.push(uClean.id, uControl.id);

      try {
        // Seed clean unbatched historical wallet + ledger (1200 ORDER + 400 REVIEW - 500 VOUCHER = 1100 available, 1600 qualifying -> SILVER)
        await query(`
          INSERT INTO user_points_wallets
          (user_id, available_points, lifetime_earned_points, lifetime_redeemed_points, tier_code, cycle_anchor_at, cycle_number, cycle_start_at, cycle_end_at, qualifying_points_cycle)
          VALUES
          (@uClean, 1100, 1600, 500, 'MEMBER', NULL, 0, NULL, NULL, 0),
          (@uControl, 0, 0, 0, 'MEMBER', NULL, 0, NULL, NULL, 0)
        `, { uClean: uClean.id, uControl: uControl.id });

        const tx1Res = await query(`
          INSERT INTO point_transactions (user_id, transaction_type, amount, balance_after, reference_type, reference_id, description, idempotency_key, created_at)
          OUTPUT INSERTED.id
          VALUES (@uid, 'ORDER_PURCHASE', 1200, 1200, 'ORDER', 'INT07_O1', N'INT-07 Order 1', @idem1, '2026-01-10T00:00:00Z')
        `, { uid: uClean.id, idem1: `INT07_O1_${uClean.id}` });
        const tx2Res = await query(`
          INSERT INTO point_transactions (user_id, transaction_type, amount, balance_after, reference_type, reference_id, description, idempotency_key, created_at)
          OUTPUT INSERTED.id
          VALUES (@uid, 'REVIEW_REWARD', 400, 1600, 'REVIEW', 'INT07_R1', N'INT-07 Review 1', @idem2, '2026-02-10T00:00:00Z')
        `, { uid: uClean.id, idem2: `INT07_R1_${uClean.id}` });
        await query(`
          INSERT INTO point_transactions (user_id, transaction_type, amount, balance_after, reference_type, reference_id, description, idempotency_key, created_at)
          VALUES (@uid, 'VOUCHER_REDEMPTION', -500, 1100, 'VOUCHER_REDEMPTION', 'INT07_V1', N'INT-07 Redeem 1', @idem3, '2026-03-01T00:00:00Z')
        `, { uid: uClean.id, idem3: `INT07_V1_${uClean.id}` });

        const dryRes = await runLoyaltyBackfill({ apply: false, nowOverride: utc('2026-06-01T00:00:00Z') });
        assert.strictEqual(dryRes.status, 'DRY_RUN_READY');
        assert.strictEqual(dryRes.applied, false);

        const applyRes = await runLoyaltyBackfill({
          apply: true,
          confirmApply: true,
          nowOverride: utc('2026-06-01T00:00:00Z')
        });
        assert.strictEqual(applyRes.status, 'APPLIED');
        assert.strictEqual(applyRes.applied, true);
        assert.strictEqual(applyRes.insertedBatches, 2);

        const cleanBatches = (await query(
          'SELECT transaction_id, initial_points, remaining_points, status FROM loyalty_point_batches WHERE user_id = @uid ORDER BY expires_at ASC, id ASC',
          { uid: uClean.id }
        )).recordset;
        assert.strictEqual(cleanBatches.length, 2);
        assert.strictEqual(cleanBatches[0].transaction_id, tx1Res.recordset[0].id);
        assert.strictEqual(cleanBatches[0].initial_points, 1200);
        assert.strictEqual(cleanBatches[0].remaining_points, 700);
        assert.strictEqual(cleanBatches[0].status, 'ACTIVE');
        assert.strictEqual(cleanBatches[1].transaction_id, tx2Res.recordset[0].id);
        assert.strictEqual(cleanBatches[1].initial_points, 400);
        assert.strictEqual(cleanBatches[1].remaining_points, 400);
        assert.strictEqual(cleanBatches[1].status, 'ACTIVE');

        const cleanWallet = (await query('SELECT * FROM user_points_wallets WHERE user_id = @uid', { uid: uClean.id })).recordset[0];
        assert.strictEqual(cleanWallet.available_points, 1100);
        assert.strictEqual(cleanWallet.tier_code, 'SILVER');
        assert.strictEqual(cleanWallet.cycle_number, 1);
        assert.strictEqual(cleanWallet.qualifying_points_cycle, 1600);
        assert.strictEqual(new Date(cleanWallet.cycle_anchor_at).toISOString(), '2026-01-10T00:00:00.000Z');

        const controlWallet = (await query('SELECT * FROM user_points_wallets WHERE user_id = @uid', { uid: uControl.id })).recordset[0];
        assert.strictEqual(controlWallet.available_points, 0);
        assert.strictEqual(controlWallet.cycle_number, 0);
        assert.strictEqual(controlWallet.qualifying_points_cycle, 0);

        // Re-run APPLY must fail closed without creating duplicate batches or transactions
        const rerunRes = await runLoyaltyBackfill({
          apply: true,
          confirmApply: true,
          nowOverride: utc('2026-06-01T00:00:00Z')
        });
        assert.strictEqual(rerunRes.status, 'ABORTED_PREFLIGHT_FAILED');
        assert.strictEqual(rerunRes.applied, false);
        const batchCntAfter = (await query(
          'SELECT COUNT(*) AS cnt FROM loyalty_point_batches WHERE user_id = @uid',
          { uid: uClean.id }
        )).recordset[0].cnt;
        assert.strictEqual(batchCntAfter, 2);
      } finally {
        const cleanList = localCleanupIds.join(',');
        await query(`DELETE FROM loyalty_point_batches WHERE user_id IN (${cleanList})`);
        await query(`DELETE FROM point_transactions WHERE user_id IN (${cleanList})`);
        await query(`DELETE FROM user_points_wallets WHERE user_id IN (${cleanList})`);
        await query(`DELETE FROM users WHERE id IN (${cleanList})`);
      }
    });

    // -----------------------------------------------------------------
    // INT-01: Schema & Constraint Verification (Migration 006)
    // -----------------------------------------------------------------
    await asyncTest('INT-01: Migration 006 tables, columns, and CHECK constraints exist and enforce invariants', async () => {
      const colCheck = await query(`
        SELECT
          COL_LENGTH('dbo.user_points_wallets', 'cycle_anchor_at') AS has_anchor,
          COL_LENGTH('dbo.user_points_wallets', 'cycle_number') AS has_cycle_num,
          COL_LENGTH('dbo.user_points_wallets', 'qualifying_points_cycle') AS has_qualifying,
          OBJECT_ID('dbo.loyalty_point_batches', 'U') AS has_batches_table
      `);
      const row = colCheck.recordset[0];
      assert.ok(row.has_anchor !== null, 'cycle_anchor_at missing');
      assert.ok(row.has_cycle_num !== null, 'cycle_number missing');
      assert.ok(row.has_qualifying !== null, 'qualifying_points_cycle missing');
      assert.ok(row.has_batches_table !== null, 'loyalty_point_batches table missing');

      const u = await createIsolatedUser('int01_chk');
      trackedUserIds.push(u.id);
      await loyaltyService.getOrCreateWallet(u.id);

      await assert.rejects(
        () => query(`
          UPDATE user_points_wallets
          SET cycle_number = 0, qualifying_points_cycle = 10
          WHERE user_id = @uid
        `, { uid: u.id }),
        /chk_wallets_cycle_consistency/
      );

      await assert.rejects(
        () => query(`
          UPDATE user_points_wallets
          SET cycle_number = 1, cycle_anchor_at = NULL
          WHERE user_id = @uid
        `, { uid: u.id }),
        /chk_wallets_cycle_consistency/
      );
    });

    // -----------------------------------------------------------------
    // INT-02: Atomic Earn, 365-Day Batch Creation, Cycle Activation & ADMIN Exclusion
    // -----------------------------------------------------------------
    await asyncTest('INT-02: ORDER_PURCHASE creates 365d batch & activates Cycle 1; ADMIN_ADJUSTMENT does not qualify cycle', async () => {
      const u = await createIsolatedUser('int02_earn');
      trackedUserIds.push(u.id);

      const tEarn = utc('2026-03-10T09:00:00Z');
      const pool = await getPool();
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        // Insert ADMIN_ADJUSTMENT directly before first real earn
        await loyaltyService.getOrCreateWallet(u.id, tx);
        await new sql.Request(tx).input('uid', sql.Int, u.id).query(`
          INSERT INTO point_transactions (user_id, transaction_type, amount, balance_after, description, idempotency_key)
          VALUES (@uid, 'ADMIN_ADJUSTMENT', 500, 500, N'Seed adj', 'TEST_INT02_ADJ_' + CAST(@uid AS NVARCHAR(20)));
          UPDATE user_points_wallets SET available_points = 500, lifetime_earned_points = 500 WHERE user_id = @uid;
        `);
        await tx.commit();
      } catch (err) {
        await tx.rollback();
        throw err;
      }

      let walletRow = (await query('SELECT * FROM user_points_wallets WHERE user_id = @uid', { uid: u.id })).recordset[0];
      assert.strictEqual(walletRow.cycle_number, 0);
      assert.strictEqual(walletRow.cycle_anchor_at, null);
      assert.strictEqual(walletRow.qualifying_points_cycle, 0);

      // Now perform ORDER_PURCHASE (+1,200 points via 40,000 VND eligibleAmount * 3%)
      const ordTx = new sql.Transaction(pool);
      await ordTx.begin();
      try {
        const awardRes = await loyaltyService.awardOrderPurchasePoints(ordTx, {
          orderId: 100000000 + u.id * 10 + 1,
          userId: u.id,
          eligibleAmount: 40000,
          txTimeOverride: tEarn
        });
        assert.strictEqual(awardRes.pointsAwarded, 1200);
        assert.strictEqual(awardRes.tierCode, 'SILVER');
        await ordTx.commit();
      } catch (err) {
        await ordTx.rollback();
        throw err;
      }

      walletRow = (await query('SELECT * FROM user_points_wallets WHERE user_id = @uid', { uid: u.id })).recordset[0];
      assert.strictEqual(walletRow.cycle_number, 1);
      assert.strictEqual(walletRow.tier_code, 'SILVER');
      assert.strictEqual(walletRow.qualifying_points_cycle, 1200);

      const batchRow = (await query(
        'SELECT *, DATEDIFF(day, created_at, expires_at) AS ttl_days FROM loyalty_point_batches WHERE user_id = @uid',
        { uid: u.id }
      )).recordset[0];
      assert.strictEqual(batchRow.initial_points, 1200);
      assert.strictEqual(batchRow.remaining_points, 1200);
      assert.strictEqual(batchRow.ttl_days, 365);
      assert.strictEqual(batchRow.status, 'ACTIVE');
    });

    // -----------------------------------------------------------------
    // INT-03: FEFO Voucher Redemption across multiple batches (All tiers allowed)
    // -----------------------------------------------------------------
    await asyncTest('INT-03: redeemVoucher deducts unexpired batches FEFO, marks exhausted, preserves qualifying_points_cycle', async () => {
      const u = await createIsolatedUser('int03_fefo');
      trackedUserIds.push(u.id);

      const pool = await getPool();
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        await loyaltyService.awardOrderPurchasePoints(tx, {
          orderId: 100000000 + u.id * 10 + 2,
          userId: u.id,
          eligibleAmount: 10000, // 300 pts (earlier expires_at: 2027-01-10)
          txTimeOverride: utc('2026-01-10T00:00:00Z')
        });
        await loyaltyService.awardOrderPurchasePoints(tx, {
          orderId: 100000000 + u.id * 10 + 3,
          userId: u.id,
          eligibleAmount: 20000, // 600 pts (later expires_at: 2027-03-10)
          txTimeOverride: utc('2026-03-10T00:00:00Z')
        });
        await tx.commit();
      } catch (err) {
        await tx.rollback();
        throw err;
      }

      const redeemRes = await loyaltyService.redeemVoucher(u.id, testRuleId, {
        nowOverride: utc('2026-04-01T00:00:00Z')
      });
      trackedVoucherIds.push(redeemRes.voucherId);
      assert.strictEqual(redeemRes.pointsSpent, 700);
      assert.strictEqual(redeemRes.balanceAfter, 200);

      const batches = (await query(
        'SELECT remaining_points, status FROM loyalty_point_batches WHERE user_id = @uid ORDER BY expires_at ASC, id ASC',
        { uid: u.id }
      )).recordset;
      assert.strictEqual(batches[0].remaining_points, 0);
      assert.strictEqual(batches[0].status, 'EXHAUSTED');
      assert.strictEqual(batches[1].remaining_points, 200);
      assert.strictEqual(batches[1].status, 'ACTIVE');

      const w = (await query('SELECT available_points, qualifying_points_cycle FROM user_points_wallets WHERE user_id = @uid', { uid: u.id })).recordset[0];
      assert.strictEqual(w.available_points, 200);
      assert.strictEqual(w.qualifying_points_cycle, 900);
    });

    // -----------------------------------------------------------------
    // INT-04: Worker Expiration, Multi-Cycle Soft Landing & Partial Failure Retry
    // -----------------------------------------------------------------
    await asyncTest('INT-04: Worker expires due batches idempotently, retries safely, and applies multi-cycle Soft Landing', async () => {
      const u = await createIsolatedUser('int04_worker');
      trackedUserIds.push(u.id);

      const pool = await getPool();
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        // Two past batches totaling 6000 pts -> activates Cycle 1 (2024-01-01 .. 2025-01-01) -> VIP
        await loyaltyService.awardOrderPurchasePoints(tx, {
          orderId: 100000000 + u.id * 10 + 4,
          userId: u.id,
          eligibleAmount: 100000, // 3000 pts
          txTimeOverride: utc('2024-01-01T00:00:00Z')
        });
        await loyaltyService.awardOrderPurchasePoints(tx, {
          orderId: 100000000 + u.id * 10 + 5,
          userId: u.id,
          eligibleAmount: 100000, // 3000 pts
          txTimeOverride: utc('2024-01-02T00:00:00Z')
        });
        await tx.commit();
      } catch (err) {
        await tx.rollback();
        throw err;
      }

      let failedOnce = false;
      let userBatchSeenCount = 0;
      await assert.rejects(
        () => runLoyaltyCycleWorker({
          nowOverride: utc('2026-06-01T00:00:00Z'),
          testHooks: {
            beforeExpireBatch: async (row) => {
              if (row.user_id === u.id) {
                userBatchSeenCount++;
                if (!failedOnce && userBatchSeenCount === 2) {
                  failedOnce = true;
                  throw new Error('Simulated worker abort after batch 1');
                }
              }
            }
          }
        }),
        /Simulated worker abort after batch 1/
      );

      // Re-run cleanly: remaining due batches + multi-cycle Soft Landing complete idempotently at 2026-06-01
      const summary = await runLoyaltyCycleWorker({
        nowOverride: utc('2026-06-01T00:00:00Z')
      });
      assert.strictEqual(summary.skippedDueToLock, false);
      assert.ok(summary.expiredBatches >= 1);

      const w = (await query('SELECT * FROM user_points_wallets WHERE user_id = @uid', { uid: u.id })).recordset[0];
      assert.strictEqual(w.available_points, 0);
      // Cycle 1 (2024-01-01..2025-01-01) earned 6000 pts -> kept VIP in Cycle 2; Cycle 2 earned 0 pts -> Soft Landing VIP -> GOLD (Cycle 3)
      assert.strictEqual(w.tier_code, 'GOLD');
      assert.strictEqual(w.cycle_number, 3);
      assert.strictEqual(w.qualifying_points_cycle, 0);
      assert.strictEqual(new Date(w.cycle_anchor_at).toISOString(), '2024-01-01T00:00:00.000Z');
      assert.strictEqual(new Date(w.cycle_start_at).toISOString(), '2026-01-01T00:00:00.000Z');
      assert.strictEqual(new Date(w.cycle_end_at).toISOString(), '2027-01-01T00:00:00.000Z');

      const expLogs = (await query(
        "SELECT idempotency_key, amount FROM point_transactions WHERE user_id = @uid AND transaction_type = 'POINT_EXPIRATION'",
        { uid: u.id }
      )).recordset;
      assert.strictEqual(expLogs.length, 2);

      // Next-cycle follow-up at 2027-06-01: Cycle 3 ends with 0 qualifying pts -> Soft Landing GOLD -> SILVER (Cycle 4)
      const summary2027 = await runLoyaltyCycleWorker({
        nowOverride: utc('2027-06-01T00:00:00Z')
      });
      assert.strictEqual(summary2027.skippedDueToLock, false);
      assert.ok(summary2027.walletsRolledOver >= 1);
      assert.ok(summary2027.cyclesProcessedTotal >= 1);

      const w2027 = (await query('SELECT * FROM user_points_wallets WHERE user_id = @uid', { uid: u.id })).recordset[0];
      assert.strictEqual(w2027.tier_code, 'SILVER');
      assert.strictEqual(w2027.cycle_number, 4);
      assert.strictEqual(w2027.qualifying_points_cycle, 0);
      assert.strictEqual(w2027.available_points, w.available_points);
      assert.strictEqual(new Date(w2027.cycle_anchor_at).toISOString(), '2024-01-01T00:00:00.000Z');
      assert.strictEqual(new Date(w2027.cycle_start_at).toISOString(), '2027-01-01T00:00:00.000Z');
      assert.strictEqual(new Date(w2027.cycle_end_at).toISOString(), '2028-01-01T00:00:00.000Z');

      const batches2027 = (await query(
        'SELECT status, remaining_points FROM loyalty_point_batches WHERE user_id = @uid ORDER BY id ASC',
        { uid: u.id }
      )).recordset;
      assert.strictEqual(batches2027.length, 2);
      assert.ok(batches2027.every((b) => b.status === 'EXPIRED' && b.remaining_points === 0));

      const txs2027 = (await query(
        'SELECT transaction_type FROM point_transactions WHERE user_id = @uid ORDER BY id ASC',
        { uid: u.id }
      )).recordset;
      assert.strictEqual(txs2027.length, 4);
      assert.strictEqual(txs2027.filter((t) => t.transaction_type === 'ORDER_PURCHASE').length, 2);
      assert.strictEqual(txs2027.filter((t) => t.transaction_type === 'POINT_EXPIRATION').length, 2);

      // Re-run at identical timestamp 2027-06-01 must NOT roll over or downgrade Cycle 4 a second time
      const summary2027Repeat = await runLoyaltyCycleWorker({
        nowOverride: utc('2027-06-01T00:00:00Z')
      });
      assert.strictEqual(summary2027Repeat.skippedDueToLock, false);
      assert.strictEqual(summary2027Repeat.expiredBatches, 0);
      assert.strictEqual(summary2027Repeat.walletsRolledOver, 0);
      assert.strictEqual(summary2027Repeat.cyclesProcessedTotal, 0);

      const w2027Repeat = (await query('SELECT * FROM user_points_wallets WHERE user_id = @uid', { uid: u.id })).recordset[0];
      assert.strictEqual(w2027Repeat.tier_code, 'SILVER');
      assert.strictEqual(w2027Repeat.cycle_number, 4);
      assert.strictEqual(w2027Repeat.qualifying_points_cycle, 0);
      assert.strictEqual(w2027Repeat.available_points, 0);
      assert.strictEqual(new Date(w2027Repeat.cycle_anchor_at).toISOString(), '2024-01-01T00:00:00.000Z');
      assert.strictEqual(new Date(w2027Repeat.cycle_start_at).toISOString(), '2027-01-01T00:00:00.000Z');
      assert.strictEqual(new Date(w2027Repeat.cycle_end_at).toISOString(), '2028-01-01T00:00:00.000Z');
    });

    // -----------------------------------------------------------------
    // INT-05: Concurrent Redemption + Worker Expiration & Multi-Worker sp_getapplock
    // -----------------------------------------------------------------
    await asyncTest('INT-05: Multi-worker sp_getapplock rejects overlap; expired points rejected; concurrent redemption serialized', async () => {
      const lockState = await acquireSessionAppLock(0);
      assert.strictEqual(lockState.acquired, true);
      try {
        const secondWorker = await runLoyaltyCycleWorker({ lockTimeoutMs: 0 });
        assert.strictEqual(secondWorker.skippedDueToLock, true);
        assert.strictEqual(secondWorker.expiredBatches, 0);
        assert.strictEqual(secondWorker.walletsRolledOver, 0);
      } finally {
        await releaseSessionAppLock(lockState.lockPool);
      }

      // Case A: Expired batch while worker has not run yet -> redeemVoucher rejects expired points; worker expires batch cleanly
      const uExpired = await createIsolatedUser('int05_exp_race');
      trackedUserIds.push(uExpired.id);
      const pool = await getPool();
      const txA = new sql.Transaction(pool);
      await txA.begin();
      try {
        await loyaltyService.awardOrderPurchasePoints(txA, {
          orderId: 100000000 + uExpired.id * 10 + 6,
          userId: uExpired.id,
          eligibleAmount: 30000, // 900 pts earned 2025-01-01 (expires 2026-01-01)
          txTimeOverride: utc('2025-01-01T00:00:00Z')
        });
        await txA.commit();
      } catch (err) {
        await txA.rollback();
        throw err;
      }

      const [rRedeemExpired, rWorkerExpire] = await Promise.allSettled([
        loyaltyService.redeemVoucher(uExpired.id, testRuleId, { nowOverride: utc('2026-06-01T00:00:00Z') }),
        runLoyaltyCycleWorker({ nowOverride: utc('2026-06-01T00:00:00Z') })
      ]);
      assert.strictEqual(rRedeemExpired.status, 'rejected', 'Expired batch must never be redeemable');
      assert.strictEqual(rWorkerExpire.status, 'fulfilled');

      const wExp = (await query('SELECT available_points FROM user_points_wallets WHERE user_id = @uid', { uid: uExpired.id })).recordset[0];
      assert.strictEqual(wExp.available_points, 0);

      // Case B: Unexpired batch of 750 pts -> 2 concurrent redeemVoucher calls (700 pts) -> strictly 1 succeeds, 1 rejects, balance 50
      const uRace = await createIsolatedUser('int05_conc_redeem');
      trackedUserIds.push(uRace.id);
      const txB = new sql.Transaction(pool);
      await txB.begin();
      try {
        await loyaltyService.awardOrderPurchasePoints(txB, {
          orderId: 100000000 + uRace.id * 10 + 7,
          userId: uRace.id,
          eligibleAmount: 25000, // 750 pts earned 2026-05-01 (expires 2027-05-01)
          txTimeOverride: utc('2026-05-01T00:00:00Z')
        });
        await txB.commit();
      } catch (err) {
        await txB.rollback();
        throw err;
      }

      const concResults = await Promise.allSettled([
        loyaltyService.redeemVoucher(uRace.id, testRuleId, { nowOverride: utc('2026-06-01T00:00:00Z') }),
        loyaltyService.redeemVoucher(uRace.id, testRuleId, { nowOverride: utc('2026-06-01T00:00:00Z') })
      ]);
      const fulfilled = concResults.filter((r) => r.status === 'fulfilled');
      const rejected = concResults.filter((r) => r.status === 'rejected');
      for (const r of fulfilled) {
        if (r.value.voucherId) trackedVoucherIds.push(r.value.voucherId);
      }
      assert.strictEqual(fulfilled.length, 1);
      assert.strictEqual(rejected.length, 1);

      const wRace = (await query('SELECT available_points FROM user_points_wallets WHERE user_id = @uid', { uid: uRace.id })).recordset[0];
      assert.strictEqual(wRace.available_points, 50);
    });

    // -----------------------------------------------------------------
    // INT-06: Backfill Dry-Run & Fail-Closed Guard
    // -----------------------------------------------------------------
    await asyncTest('INT-06: Backfill DRY_RUN & fail-closed APPLY aborts cleanly with zero writes on anomalies', async () => {
      const dry = await runLoyaltyBackfill({ apply: false, nowOverride: utc('2026-06-01T00:00:00Z') });
      assert.strictEqual(dry.mode, 'DRY_RUN');
      assert.strictEqual(dry.applied, false);
      assert.ok((dry.reconciledAccounts + dry.failedAccounts) >= 1);

      const uAnomaly = await createIsolatedUser('int06_anomaly');
      trackedUserIds.push(uAnomaly.id);
      await loyaltyService.getOrCreateWallet(uAnomaly.id);
      // Create a mismatch without ledger tx -> fail closed
      await query('UPDATE user_points_wallets SET available_points = 500 WHERE user_id = @uid', { uid: uAnomaly.id });

      const applyRes = await runLoyaltyBackfill({
        apply: true,
        confirmApply: true,
        nowOverride: utc('2026-06-01T00:00:00Z')
      });
      assert.strictEqual(applyRes.status, 'ABORTED_PREFLIGHT_FAILED');
      assert.strictEqual(applyRes.applied, false);
      assert.ok(applyRes.failedAccounts >= 1);

      const anomalyBatches = (await query(
        'SELECT COUNT(*) AS cnt FROM loyalty_point_batches WHERE user_id = @uid',
        { uid: uAnomaly.id }
      )).recordset[0].cnt;
      assert.strictEqual(anomalyBatches, 0, 'Fail-closed APPLY must never write batches');
    });

    assertSummary();
  } finally {
    // Strict FK cleanup order
    try {
      if (trackedUserIds.length > 0) {
        const uList = trackedUserIds.join(',');
        await query(`DELETE FROM voucher_redemptions WHERE user_id IN (${uList})`);
        await query(`DELETE FROM reviews WHERE user_id IN (${uList})`);
        await query(`DELETE FROM loyalty_point_batches WHERE user_id IN (${uList})`);
        await query(`DELETE FROM point_transactions WHERE user_id IN (${uList})`);
        await query(`DELETE FROM user_points_wallets WHERE user_id IN (${uList})`);
        await query(`DELETE FROM inventory_transactions WHERE user_id IN (${uList})`);
        await query(`DELETE FROM users WHERE id IN (${uList})`);
      }
      if (trackedVoucherIds.length > 0) {
        await query(`DELETE FROM vouchers WHERE id IN (${trackedVoucherIds.join(',')})`);
      }
      if (trackedRuleIds.length > 0) {
        await query(`DELETE FROM point_reward_rules WHERE id IN (${trackedRuleIds.join(',')})`);
      }
    } catch (cleanupErr) {
      console.error('[INTEGRATION CLEANUP WARNING]:', cleanupErr.message);
    }
    await closePool();
  }
}

main().catch((err) => {
  console.error('[FATAL INTEGRATION TEST ERROR]:', err);
  process.exitCode = 1;
});
