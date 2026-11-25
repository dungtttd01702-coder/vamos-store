/**
 * VAMOS CLUB CLI Worker: 365-Day Point Expiration & 12-Month Tier Cycle Soft Landing
 *
 * Security & Concurrency:
 * - Enforces database-guard validation via src/config/database.js & db-guard.js
 * - Coordinates multi-worker runs via SQL Server sp_getapplock (Session-scoped on pinned pool)
 * - Uses strict Lock Hierarchy: user_points_wallets FIRST -> loyalty_point_batches SECOND
 * - Never auto-starts timers inside Express web requests
 */

require('dotenv').config();
const sql = require('mssql');
const appConfig = require('../config/app.config');
const { validateDatabaseConnection } = require('../config/db-guard');
const { getPool, closePool } = require('../config/database');
const loyaltyCycle = require('../utils/loyaltyCycle');

const APPLOCK_RESOURCE = 'VAMOS_LOYALTY_CYCLE_WORKER_LOCK';

async function acquireSessionAppLock(lockTimeoutMs = 0) {
  validateDatabaseConnection(appConfig.db, process.env.NODE_ENV);
  const lockPool = new sql.ConnectionPool({
    ...appConfig.db,
    pool: { max: 1, min: 1, idleTimeoutMillis: 30000 }
  });
  await lockPool.connect();

  try {
    const req = lockPool.request();
    req.input('resource', sql.NVarChar(255), APPLOCK_RESOURCE);
    req.input('timeoutMs', sql.Int, Number.isSafeInteger(lockTimeoutMs) ? lockTimeoutMs : 0);
    const res = await req.query(`
      DECLARE @lockResult INT;
      EXEC @lockResult = sp_getapplock
        @Resource = @resource,
        @LockMode = 'Exclusive',
        @LockOwner = 'Session',
        @LockTimeout = @timeoutMs;
      SELECT @lockResult AS lock_result;
    `);
    const lockResult = res.recordset[0]?.lock_result;
    if (lockResult === undefined || lockResult < 0) {
      await lockPool.close();
      return { acquired: false, lockResult, lockPool: null };
    }
    return { acquired: true, lockResult, lockPool };
  } catch (err) {
    try {
      await lockPool.close();
    } catch (_) {}
    throw err;
  }
}

async function releaseSessionAppLock(lockPool) {
  if (!lockPool) return;
  try {
    const req = lockPool.request();
    req.input('resource', sql.NVarChar(255), APPLOCK_RESOURCE);
    await req.query(`
      EXEC sp_releaseapplock
        @Resource = @resource,
        @LockOwner = 'Session';
    `);
  } catch (err) {
    console.warn('[LOYALTY WORKER] sp_releaseapplock warning:', err.message);
  } finally {
    try {
      await lockPool.close();
    } catch (_) {}
  }
}

async function expireSingleBatch(pool, batchId, userId, nowTs) {
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    // Lock Hierarchy Step 1: Lock wallet FIRST
    const wReq = new sql.Request(tx);
    wReq.input('userId', sql.Int, userId);
    const wRes = await wReq.query(`
      SELECT user_id, available_points, tier_code, qualifying_points_cycle
      FROM user_points_wallets WITH (UPDLOCK, ROWLOCK)
      WHERE user_id = @userId
    `);
    if (wRes.recordset.length === 0) {
      throw new Error(`[INVARIANT VIOLATION] Wallet not found for user_id=${userId} while expiring batch #${batchId}`);
    }
    const wallet = wRes.recordset[0];

    // Lock Hierarchy Step 2: Lock batch SECOND
    const bReq = new sql.Request(tx);
    bReq.input('batchId', sql.Int, batchId);
    bReq.input('userId', sql.Int, userId);
    const bRes = await bReq.query(`
      SELECT id, user_id, initial_points, remaining_points, expires_at, status
      FROM loyalty_point_batches WITH (UPDLOCK, ROWLOCK)
      WHERE id = @batchId AND user_id = @userId
    `);

    if (bRes.recordset.length === 0) {
      await tx.commit();
      return { expired: false, skipped: true, reason: 'BATCH_NOT_FOUND' };
    }

    const batch = bRes.recordset[0];
    const batchExpiresAt = loyaltyCycle.toUtcDate(batch.expires_at, `batch#${batch.id}.expires_at`);

    if (batch.status !== 'ACTIVE' || batch.remaining_points <= 0 || batchExpiresAt.getTime() > nowTs.getTime()) {
      await tx.commit();
      return { expired: false, skipped: true, reason: `STATUS_${batch.status}` };
    }

    const idempotencyKey = `EXP_BATCH_${batch.id}`;
    const idemReq = new sql.Request(tx);
    idemReq.input('idem', sql.NVarChar(100), idempotencyKey);
    const idemRes = await idemReq.query('SELECT id FROM point_transactions WHERE idempotency_key = @idem');
    if (idemRes.recordset.length > 0) {
      // Batch somehow left ACTIVE after prior expiration tx? Report invariant breach instead of silent adjustment
      throw new Error(`[INVARIANT VIOLATION] Idempotency key ${idempotencyKey} already exists while batch #${batch.id} is still ACTIVE.`);
    }

    // Strict balance invariant: never deduct more than wallet.available_points
    if (wallet.available_points < batch.remaining_points) {
      throw new Error(
        `[INVARIANT VIOLATION] Batch #${batch.id} remaining (${batch.remaining_points}) exceeds wallet.available_points (${wallet.available_points}) for user_id=${userId}`
      );
    }

    const newAvailable = wallet.available_points - batch.remaining_points;

    // 1. Deduct ONLY available_points (never modify qualifying_points_cycle or tier_code)
    const upW = new sql.Request(tx);
    upW.input('userId', sql.Int, userId);
    upW.input('avail', sql.Int, newAvailable);
    upW.input('nowTs', sql.DateTime2, nowTs);
    await upW.query(`
      UPDATE user_points_wallets
      SET available_points = @avail,
          updated_at = @nowTs
      WHERE user_id = @userId
    `);

    // 2. Write immutable POINT_EXPIRATION ledger entry
    const insTx = new sql.Request(tx);
    insTx.input('userId', sql.Int, userId);
    insTx.input('type', sql.NVarChar(30), 'POINT_EXPIRATION');
    insTx.input('amount', sql.Int, -batch.remaining_points);
    insTx.input('bal', sql.Int, newAvailable);
    insTx.input('refType', sql.NVarChar(50), 'POINT_BATCH');
    insTx.input('refId', sql.NVarChar(100), String(batch.id));
    insTx.input('desc', sql.NVarChar(500), `Hết hạn ${batch.remaining_points.toLocaleString('vi-VN')} điểm từ lô điểm #${batch.id} sau 365 ngày`);
    insTx.input('idem', sql.NVarChar(100), idempotencyKey);
    insTx.input('nowTs', sql.DateTime2, nowTs);
    await insTx.query(`
      INSERT INTO point_transactions
      (user_id, transaction_type, amount, balance_after, reference_type, reference_id, description, idempotency_key, created_at)
      VALUES
      (@userId, @type, @amount, @bal, @refType, @refId, @desc, @idem, @nowTs)
    `);

    // 3. Mark batch EXPIRED with 0 remaining
    const upB = new sql.Request(tx);
    upB.input('batchId', sql.Int, batch.id);
    upB.input('nowTs', sql.DateTime2, nowTs);
    await upB.query(`
      UPDATE loyalty_point_batches
      SET remaining_points = 0,
          status = 'EXPIRED',
          updated_at = @nowTs
      WHERE id = @batchId
    `);

    await tx.commit();
    return { expired: true, skipped: false, batchId: batch.id, pointsExpired: batch.remaining_points };
  } catch (err) {
    try {
      await tx.rollback();
    } catch (_) {}
    throw err;
  }
}

async function processDueWalletCycle(pool, userId, nowTs) {
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const wReq = new sql.Request(tx);
    wReq.input('userId', sql.Int, userId);
    const wRes = await wReq.query(`
      SELECT user_id, available_points, tier_code, cycle_anchor_at, cycle_number, cycle_start_at, cycle_end_at, qualifying_points_cycle
      FROM user_points_wallets WITH (UPDLOCK, ROWLOCK)
      WHERE user_id = @userId
    `);

    if (wRes.recordset.length === 0) {
      await tx.commit();
      return { updated: false, cyclesProcessed: 0 };
    }

    const wallet = wRes.recordset[0];
    const rolled = loyaltyCycle.rolloverCyclesThroughTimestamp(wallet, nowTs);
    if (!rolled.changed) {
      await tx.commit();
      return { updated: false, cyclesProcessed: 0 };
    }

    // Update ONLY cycle & tier fields (preserve available_points, batches, and ledger)
    const upReq = new sql.Request(tx);
    upReq.input('userId', sql.Int, userId);
    upReq.input('tier', sql.NVarChar(20), rolled.tier_code);
    upReq.input('cycleNum', sql.Int, rolled.cycle_number);
    upReq.input('cycleStart', sql.DateTime2, rolled.cycle_start_at);
    upReq.input('cycleEnd', sql.DateTime2, rolled.cycle_end_at);
    upReq.input('qualifying', sql.Int, rolled.qualifying_points_cycle);
    upReq.input('nowTs', sql.DateTime2, nowTs);

    await upReq.query(`
      UPDATE user_points_wallets
      SET tier_code = @tier,
          cycle_number = @cycleNum,
          cycle_start_at = @cycleStart,
          cycle_end_at = @cycleEnd,
          qualifying_points_cycle = @qualifying,
          updated_at = @nowTs
      WHERE user_id = @userId
    `);

    await tx.commit();
    return {
      updated: true,
      userId,
      cyclesProcessed: rolled.cyclesProcessed,
      newTier: rolled.tier_code,
      newCycleNumber: rolled.cycle_number,
      history: rolled.history
    };
  } catch (err) {
    try {
      await tx.rollback();
    } catch (_) {}
    throw err;
  }
}

async function runLoyaltyCycleWorker(options = {}) {
  const lockTimeoutMs = options.lockTimeoutMs !== undefined ? options.lockTimeoutMs : 0;
  const lockState = await acquireSessionAppLock(lockTimeoutMs);

  if (!lockState.acquired) {
    return {
      skippedDueToLock: true,
      expiredBatches: 0,
      pointsExpiredTotal: 0,
      skippedBatches: 0,
      walletsRolledOver: 0,
      cyclesProcessedTotal: 0
    };
  }

  try {
    const pool = await getPool();
    const nowRes = await pool.request().query('SELECT GETDATE() AS db_now');
    const nowTs = options.nowOverride
      ? loyaltyCycle.toUtcDate(options.nowOverride, 'nowOverride')
      : loyaltyCycle.toUtcDate(nowRes.recordset[0].db_now, 'db_now');

    // Phase 1: Scan and expire due batches (365-day expiration)
    const dueBatchesReq = pool.request();
    dueBatchesReq.input('nowTs', sql.DateTime2, nowTs);
    const dueBatchesRes = await dueBatchesReq.query(`
      SELECT id, user_id
      FROM loyalty_point_batches
      WHERE status = 'ACTIVE'
        AND remaining_points > 0
        AND expires_at <= @nowTs
      ORDER BY expires_at ASC, id ASC
    `);

    let expiredBatches = 0;
    let pointsExpiredTotal = 0;
    let skippedBatches = 0;

    for (const row of dueBatchesRes.recordset) {
      if (options.testHooks && typeof options.testHooks.beforeExpireBatch === 'function') {
        await options.testHooks.beforeExpireBatch(row);
      }
      const res = await expireSingleBatch(pool, row.id, row.user_id, nowTs);
      if (res.expired) {
        expiredBatches++;
        pointsExpiredTotal += res.pointsExpired;
      } else if (res.skipped) {
        skippedBatches++;
      }
    }

    // Phase 2: Scan and roll over due 12-month tier cycles (with Soft Landing)
    const dueWalletsReq = pool.request();
    dueWalletsReq.input('nowTs', sql.DateTime2, nowTs);
    const dueWalletsRes = await dueWalletsReq.query(`
      SELECT user_id
      FROM user_points_wallets
      WHERE cycle_end_at IS NOT NULL
        AND cycle_end_at < @nowTs
      ORDER BY cycle_end_at ASC, user_id ASC
    `);

    let walletsRolledOver = 0;
    let cyclesProcessedTotal = 0;

    for (const row of dueWalletsRes.recordset) {
      const res = await processDueWalletCycle(pool, row.user_id, nowTs);
      if (res.updated) {
        walletsRolledOver++;
        cyclesProcessedTotal += res.cyclesProcessed;
      }
    }

    return {
      skippedDueToLock: false,
      processedAt: nowTs,
      expiredBatches,
      pointsExpiredTotal,
      skippedBatches,
      walletsRolledOver,
      cyclesProcessedTotal
    };
  } finally {
    await releaseSessionAppLock(lockState.lockPool);
  }
}

if (require.main === module) {
  runLoyaltyCycleWorker()
    .then(async (summary) => {
      console.log('[LOYALTY WORKER SUMMARY]', JSON.stringify(summary));
      process.exitCode = 0;
      await closePool();
    })
    .catch(async (err) => {
      console.error('[LOYALTY WORKER ERROR]', err);
      process.exitCode = 1;
      await closePool();
    });
}

module.exports = {
  APPLOCK_RESOURCE,
  acquireSessionAppLock,
  releaseSessionAppLock,
  expireSingleBatch,
  processDueWalletCycle,
  runLoyaltyCycleWorker
};
