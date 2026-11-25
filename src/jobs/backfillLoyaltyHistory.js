/**
 * Safe Fail-Closed Historical Backfill Tool for VAMOS CLUB Stage 2
 *
 * Modes:
 * - DRY_RUN (default): Strictly read-only reconciliation audit across all wallets & point_transactions.
 * - APPLY (--apply --confirm-apply): Only executes inside a single atomic transaction holding:
 *   1) sp_getapplock (Session lock) to serialize against workers/other backfill runs
 *   2) user_points_wallets WITH (UPDLOCK, HOLDLOCK) FIRST -> matching app lock hierarchy (wallet -> batch/tx)
 *   Re-reads all wallets, point_transactions, and batches INSIDE the locked transaction, re-verifies 100%
 *   reconciliation with zero anomalies, and rolls back fail-closed on any discrepancy.
 *   Never alters wallet.available_points, never creates fake batches, never hardcodes any user ID.
 */

require('dotenv').config();
const sql = require('mssql');
const { getPool, closePool } = require('../config/database');
const loyaltyCycle = require('../utils/loyaltyCycle');
const { acquireSessionAppLock, releaseSessionAppLock } = require('./processLoyaltyCycle');

function reconcileSnapshot(wallets, transactions, batchCounts, nowTs) {
  const txByUser = new Map();
  for (const txRow of transactions) {
    if (!txByUser.has(txRow.user_id)) txByUser.set(txRow.user_id, []);
    txByUser.get(txRow.user_id).push(txRow);
  }

  const batchCountByUser = new Map();
  for (const row of batchCounts) {
    batchCountByUser.set(row.user_id, row.cnt);
  }

  const walletMap = new Map();
  for (const w of wallets) {
    walletMap.set(w.user_id, w);
  }

  const accountReports = [];
  const allAnomalies = [];

  for (const [uid, txs] of txByUser.entries()) {
    if (!walletMap.has(uid)) {
      const orphanAnomaly = {
        userId: uid,
        code: 'ORPHAN_LEDGER_WITHOUT_WALLET',
        message: `User ${uid} has ${txs.length} point_transactions but no row in user_points_wallets.`
      };
      allAnomalies.push(orphanAnomaly);
      accountReports.push({
        userId: uid,
        reconciled: false,
        anomalies: [orphanAnomaly],
        ledgerCount: txs.length
      });
    }
  }

  for (const wallet of wallets) {
    const txs = txByUser.get(wallet.user_id) || [];
    const existingBatchesCount = batchCountByUser.get(wallet.user_id) || 0;
    const report = loyaltyCycle.replayUserHistory({
      userId: wallet.user_id,
      wallet,
      transactions: txs,
      existingBatchesCount,
      now: nowTs
    });
    accountReports.push(report);
    for (const a of report.anomalies) {
      allAnomalies.push({ userId: wallet.user_id, ...a });
    }
  }

  return { accountReports, allAnomalies };
}

async function runLoyaltyBackfill(options = {}) {
  const mode = options.apply === true ? 'APPLY' : 'DRY_RUN';
  const confirmApply = options.confirmApply === true;

  if (mode === 'APPLY' && !confirmApply) {
    throw new Error('[BACKFILL GUARD]: APPLY mode requires explicit confirmApply=true / --confirm-apply flag.');
  }

  const pool = await getPool();

  // DRY_RUN: strictly read-only, zero locks or writes
  if (mode === 'DRY_RUN') {
    const nowRes = await pool.request().query('SELECT GETDATE() AS db_now');
    const nowTs = options.nowOverride
      ? loyaltyCycle.toUtcDate(options.nowOverride, 'nowOverride')
      : loyaltyCycle.toUtcDate(nowRes.recordset[0].db_now, 'db_now');

    const walletsRes = await pool.request().query(`
      SELECT user_id, available_points, lifetime_earned_points, lifetime_redeemed_points,
             tier_code, cycle_anchor_at, cycle_number, cycle_start_at, cycle_end_at, qualifying_points_cycle
      FROM user_points_wallets
      ORDER BY user_id ASC
    `);
    const txRes = await pool.request().query(`
      SELECT id, user_id, transaction_type, amount, balance_after, reference_type, reference_id, idempotency_key, created_at
      FROM point_transactions
      ORDER BY user_id ASC, created_at ASC, id ASC
    `);
    const batchCountRes = await pool.request().query(`
      SELECT user_id, COUNT(*) AS cnt
      FROM loyalty_point_batches
      GROUP BY user_id
    `);

    const { accountReports, allAnomalies } = reconcileSnapshot(
      walletsRes.recordset,
      txRes.recordset,
      batchCountRes.recordset,
      nowTs
    );

    if (allAnomalies.length > 0) {
      return {
        mode,
        status: 'DRY_RUN_ANOMALIES_FOUND',
        applied: false,
        reconciledAccounts: accountReports.filter(r => r.reconciled).length,
        failedAccounts: accountReports.filter(r => !r.reconciled).length,
        anomalies: allAnomalies,
        accountReports
      };
    }

    return {
      mode,
      status: 'DRY_RUN_READY',
      applied: false,
      reconciledAccounts: accountReports.length,
      failedAccounts: 0,
      anomalies: [],
      accountReports
    };
  }

  // APPLY mode: acquire Session app lock + lock wallets FIRST inside atomic transaction before authoritative read/replay
  const lockTimeoutMs = options.lockTimeoutMs !== undefined ? options.lockTimeoutMs : 0;
  const lockState = await acquireSessionAppLock(lockTimeoutMs);
  if (!lockState.acquired) {
    return {
      mode,
      status: 'ABORTED_LOCK_UNAVAILABLE',
      applied: false,
      reconciledAccounts: 0,
      failedAccounts: 0,
      anomalies: [{ code: 'LOCK_UNAVAILABLE', message: 'Another worker or backfill session holds sp_getapplock.' }],
      accountReports: []
    };
  }

  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    // Lock Hierarchy Step 1: Lock all wallets serializably (matches wallet -> batch/tx order)
    const walletsRes = await new sql.Request(tx).query(`
      SELECT user_id, available_points, lifetime_earned_points, lifetime_redeemed_points,
             tier_code, cycle_anchor_at, cycle_number, cycle_start_at, cycle_end_at, qualifying_points_cycle
      FROM user_points_wallets WITH (UPDLOCK, HOLDLOCK)
      ORDER BY user_id ASC
    `);

    if (options.testHooks && typeof options.testHooks.afterWalletLockInApply === 'function') {
      await options.testHooks.afterWalletLockInApply(tx);
    }

    // Fetch single consistent canonical clock AFTER transaction start and wallet locks are held
    const nowTs = options.nowOverride
      ? loyaltyCycle.toUtcDate(options.nowOverride, 'nowOverride')
      : loyaltyCycle.toUtcDate(
          (await new sql.Request(tx).query('SELECT GETDATE() AS db_now')).recordset[0].db_now,
          'db_now'
        );

    // Read authoritative ledger and existing batches INSIDE the locked transaction
    const txRes = await new sql.Request(tx).query(`
      SELECT id, user_id, transaction_type, amount, balance_after, reference_type, reference_id, idempotency_key, created_at
      FROM point_transactions WITH (HOLDLOCK)
      ORDER BY user_id ASC, created_at ASC, id ASC
    `);
    const batchCountRes = await new sql.Request(tx).query(`
      SELECT user_id, COUNT(*) AS cnt
      FROM loyalty_point_batches WITH (HOLDLOCK)
      GROUP BY user_id
    `);

    const { accountReports, allAnomalies } = reconcileSnapshot(
      walletsRes.recordset,
      txRes.recordset,
      batchCountRes.recordset,
      nowTs
    );

    if (allAnomalies.length > 0) {
      await tx.rollback();
      return {
        mode,
        status: 'ABORTED_PREFLIGHT_FAILED',
        applied: false,
        reconciledAccounts: accountReports.filter(r => r.reconciled).length,
        failedAccounts: accountReports.filter(r => !r.reconciled).length,
        anomalies: allAnomalies,
        accountReports
      };
    }

    let insertedBatches = 0;
    let updatedWallets = 0;

    for (const report of accountReports) {
      for (const b of report.batches) {
        const insB = new sql.Request(tx);
        insB.input('userId', sql.Int, report.userId);
        insB.input('txId', sql.Int, b.transaction_id);
        insB.input('initPts', sql.Int, b.initial_points);
        insB.input('remPts', sql.Int, b.remaining_points);
        insB.input('expiresAt', sql.DateTime2, b.expires_at);
        insB.input('status', sql.NVarChar(20), b.status);
        insB.input('createdAt', sql.DateTime2, b.created_at);
        insB.input('updatedAt', sql.DateTime2, nowTs);
        await insB.query(`
          INSERT INTO loyalty_point_batches
          (user_id, transaction_id, initial_points, remaining_points, expires_at, status, created_at, updated_at)
          VALUES
          (@userId, @txId, @initPts, @remPts, @expiresAt, @status, @createdAt, @updatedAt)
        `);
        insertedBatches++;
      }

      const cs = report.cycleState;
      const upW = new sql.Request(tx);
      upW.input('userId', sql.Int, report.userId);
      upW.input('tier', sql.NVarChar(20), cs.tier_code);
      upW.input('anchorAt', sql.DateTime2, cs.cycle_anchor_at);
      upW.input('cycleNum', sql.Int, cs.cycle_number);
      upW.input('cycleStart', sql.DateTime2, cs.cycle_start_at);
      upW.input('cycleEnd', sql.DateTime2, cs.cycle_end_at);
      upW.input('qualifying', sql.Int, cs.qualifying_points_cycle);
      upW.input('nowTs', sql.DateTime2, nowTs);
      await upW.query(`
        UPDATE user_points_wallets
        SET tier_code = @tier,
            cycle_anchor_at = @anchorAt,
            cycle_number = @cycleNum,
            cycle_start_at = @cycleStart,
            cycle_end_at = @cycleEnd,
            qualifying_points_cycle = @qualifying,
            updated_at = @nowTs
        WHERE user_id = @userId
      `);
      updatedWallets++;
    }

    await tx.commit();
    return {
      mode,
      status: 'APPLIED',
      applied: true,
      reconciledAccounts: accountReports.length,
      failedAccounts: 0,
      insertedBatches,
      updatedWallets,
      anomalies: [],
      accountReports
    };
  } catch (err) {
    try {
      await tx.rollback();
    } catch (_) {}
    throw err;
  } finally {
    await releaseSessionAppLock(lockState.lockPool);
  }
}

if (require.main === module) {
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply');
  const confirmApply = args.has('--confirm-apply');

  runLoyaltyBackfill({ apply, confirmApply })
    .then(async (result) => {
      console.log('[LOYALTY BACKFILL RESULT]', JSON.stringify({
        mode: result.mode,
        status: result.status,
        applied: result.applied,
        reconciledAccounts: result.reconciledAccounts,
        failedAccounts: result.failedAccounts,
        anomaliesCount: result.anomalies.length,
        anomalies: result.anomalies
      }, null, 2));
      process.exitCode = result.status.startsWith('ABORTED') ? 1 : 0;
      await closePool();
    })
    .catch(async (err) => {
      console.error('[LOYALTY BACKFILL ERROR]', err.message);
      process.exitCode = 1;
      await closePool();
    });
}

module.exports = {
  reconcileSnapshot,
  runLoyaltyBackfill
};
