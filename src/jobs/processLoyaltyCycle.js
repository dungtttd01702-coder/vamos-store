/**
 * VAMOS CLUB Worker: 365-Day Point Expiration & 12-Month Tier Cycle Soft Landing
 *
 * Security & Concurrency:
 * - Enforces database-guard validation via src/config/database.js & db-guard.js
 * - Coordinates multi-worker runs via SQL Server sp_getapplock (Session-scoped on pinned connection)
 * - Verifies active session lock ownership before execution phases and during release
 * - Uses strict Lock Hierarchy: user_points_wallets FIRST -> loyalty_point_batches SECOND
 * - Isolates recoverable per-item invariant errors while aborting immediately on systemic failures
 * - Retries confirmed SQL Server deadlock victims (error 1205) with bounded backoff, never on uncertain commits
 * - Never auto-starts timers inside Express web requests or module import
 */

require('dotenv').config();
const crypto = require('node:crypto');
const os = require('node:os');
const sql = require('mssql');
const appConfig = require('../config/app.config');
const { validateDatabaseConnection } = require('../config/db-guard');
const { closePool } = require('../config/database');
const loyaltyCycle = require('../utils/loyaltyCycle');

const APPLOCK_RESOURCE = 'VAMOS_LOYALTY_CYCLE_WORKER_LOCK';
const JOB_NAME = 'loyalty-cycle-worker';
const DEADLOCK_SQL_ERROR_NUMBER = 1205;
const DEFAULT_DEADLOCK_MAX_RETRIES = 2;
const DEFAULT_DEADLOCK_BASE_DELAY_MS = 25;

const SYSTEMIC_ERROR_CODES = new Set([
  'ELOGIN',
  'ESOCKET',
  'ETIMEOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'ENETUNREACH',
  'EPIPE',
  'LOCK_SESSION_LOST',
  'DB_NOT_READY',
  'EAIR',
  'EREQUEST_TIMEOUT'
]);

const SYSTEMIC_SQL_NUMBERS = new Set([
  207,   // Invalid column name (schema mismatch)
  208,   // Invalid object name (migration incomplete)
  229,   // Permission denied
  2812,  // Stored procedure not found
  4060,  // Cannot open database
  18456, // Login failed
  18470, // Account disabled
  40197,
  40501,
  40613
]);

function getInstanceId() {
  return `${os.hostname()}:${process.pid}`;
}

function defaultLogEmitter(entry) {
  console.log(JSON.stringify(entry));
}

function sanitizeErrorSummary(err) {
  const raw = err && typeof err === 'object' ? (err.message || String(err)) : String(err || 'Unknown error');
  return raw
    .replace(/[^\s@]{1,64}@[^\s@.]{1,63}(?:\.[^\s@.]{1,63}){1,8}/g, '[REDACTED_EMAIL]')
    .replace(/(password|pwd|secret|token|authorization)[ \t]{0,8}=[ \t]{0,8}[^;\s]{1,256}/gi, '$1=[REDACTED]')
    .replace(/Bearer[ \t]{1,8}[A-Za-z0-9._-]{1,512}/gi, 'Bearer [REDACTED]')
    .slice(0, 240);
}

function getSqlErrorNumber(err) {
  if (!err || typeof err !== 'object') return null;
  if (typeof err.number === 'number') return err.number;
  if (err.originalError && err.originalError.info && typeof err.originalError.info.number === 'number') {
    return err.originalError.info.number;
  }
  if (Array.isArray(err.precedingErrors)) {
    const found = err.precedingErrors.find((e) => typeof e?.number === 'number');
    if (found) return found.number;
  }
  return null;
}

function isDeadlockError(err) {
  if (!err || typeof err !== 'object') return false;
  if (getSqlErrorNumber(err) === DEADLOCK_SQL_ERROR_NUMBER) return true;
  if (Array.isArray(err.precedingErrors)) {
    return err.precedingErrors.some((e) => getSqlErrorNumber(e) === DEADLOCK_SQL_ERROR_NUMBER);
  }
  return false;
}

function isSystemicError(err) {
  if (!err || typeof err !== 'object') return false;
  if (err.isSystemic === true || err.isCommitOutcomeUncertain === true) return true;
  if (err.code && SYSTEMIC_ERROR_CODES.has(String(err.code))) return true;
  if (err.name === 'ConnectionError') return true;

  const sqlNum = getSqlErrorNumber(err);
  if (sqlNum !== null && SYSTEMIC_SQL_NUMBERS.has(sqlNum)) return true;

  const msg = String(err.message || '');
  return /pool is closing|connection is closed|failed to connect|cannot open database|login failed|invalid object name|invalid column name|lock session/i.test(msg);
}

function createSystemicError(code, message) {
  const err = new Error(message);
  err.code = code;
  err.isSystemic = true;
  return err;
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeWithDeadlockRetry(fn, options = {}) {
  const maxRetries = Number.isInteger(options.maxRetries) && options.maxRetries >= 0
    ? options.maxRetries
    : DEFAULT_DEADLOCK_MAX_RETRIES;
  const baseDelayMs = Number.isFinite(options.baseDelayMs) && options.baseDelayMs >= 0
    ? options.baseDelayMs
    : DEFAULT_DEADLOCK_BASE_DELAY_MS;
  const sleep = typeof options.sleep === 'function' ? options.sleep : defaultSleep;

  let attempt = 0;
  while (true) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (err?.isCommitOutcomeUncertain || !isDeadlockError(err) || attempt >= maxRetries) {
        throw err;
      }
      attempt++;
      const jitter = crypto.randomInt(0, 15);
      const delayMs = baseDelayMs * (2 ** (attempt - 1)) + jitter;
      await sleep(delayMs);
    }
  }
}

async function acquireSessionAppLock(lockTimeoutMs = 0, options = {}) {
  validateDatabaseConnection(appConfig.db, process.env.NODE_ENV);
  const log = typeof options.logger === 'function' ? options.logger : null;
  const sessionState = {
    lockLost: false,
    lastError: null
  };

  const lockPool = new sql.ConnectionPool({
    ...appConfig.db,
    pool: { max: 1, min: 1, idleTimeoutMillis: 30000 }
  });

  if (typeof lockPool.on === 'function') {
    lockPool.on('error', (err) => {
      sessionState.lockLost = true;
      sessionState.lastError = sanitizeErrorSummary(err);
      if (log) {
        log({
          event: 'loyalty_lock_session_error',
          executionId: options.executionId || null,
          errorCode: err.code || 'LOCK_POOL_ERROR',
          errorSummary: sessionState.lastError,
          timestampUtc: new Date().toISOString()
        });
      }
    });
  }

  await lockPool.connect();

  try {
    const req = lockPool.request();
    req.input('resource', sql.NVarChar(255), APPLOCK_RESOURCE);
    req.input('timeoutMs', sql.Int, Number.isSafeInteger(lockTimeoutMs) && lockTimeoutMs >= 0 ? lockTimeoutMs : 0);
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
      return { acquired: false, lockResult, lockPool: null, sessionState };
    }
    return { acquired: true, lockResult, lockPool, sessionState };
  } catch (err) {
    try {
      await lockPool.close();
    } catch (_) {}
    throw err;
  }
}

async function verifySessionLockHeld(lockState) {
  if (!lockState || !lockState.lockPool || lockState.sessionState?.lockLost) {
    throw createSystemicError('LOCK_SESSION_LOST', 'Distributed worker lock session is missing or lost.');
  }
  if (lockState.lockPool.connected === false) {
    throw createSystemicError('LOCK_SESSION_LOST', 'Distributed worker lock connection is closed.');
  }

  try {
    const req = lockState.lockPool.request();
    req.input('resource', sql.NVarChar(255), APPLOCK_RESOURCE);
    const res = await req.query("SELECT APPLOCK_MODE('public', @resource, 'Session') AS lock_mode");
    const mode = res.recordset[0]?.lock_mode;
    if (!mode || mode === 'NoLock') {
      lockState.sessionState.lockLost = true;
      throw createSystemicError('LOCK_SESSION_LOST', 'SQL Server session no longer holds VAMOS_LOYALTY_CYCLE_WORKER_LOCK.');
    }
    return mode;
  } catch (err) {
    if (isSystemicError(err)) throw err;
    lockState.sessionState.lockLost = true;
    throw createSystemicError('LOCK_SESSION_LOST', `Failed to verify session lock: ${sanitizeErrorSummary(err)}`);
  }
}

async function releaseSessionAppLock(lockPool, options = {}) {
  if (!lockPool) return { released: false, reason: 'no_pool' };
  const log = typeof options.logger === 'function' ? options.logger : null;

  try {
    if (lockPool.connected === false) {
      if (log) {
        log({
          event: 'loyalty_lock_release_failed',
          executionId: options.executionId || null,
          reason: 'session_disconnected',
          timestampUtc: new Date().toISOString()
        });
      }
      return { released: false, reason: 'session_disconnected' };
    }

    const modeReq = lockPool.request();
    modeReq.input('resource', sql.NVarChar(255), APPLOCK_RESOURCE);
    const modeRes = await modeReq.query("SELECT APPLOCK_MODE('public', @resource, 'Session') AS lock_mode");
    const mode = modeRes.recordset[0]?.lock_mode;

    if (!mode || mode === 'NoLock') {
      if (log) {
        log({
          event: 'loyalty_lock_release_failed',
          executionId: options.executionId || null,
          reason: 'lock_not_held_by_session',
          timestampUtc: new Date().toISOString()
        });
      }
      return { released: false, reason: 'lock_not_held_by_session' };
    }

    const relReq = lockPool.request();
    relReq.input('resource', sql.NVarChar(255), APPLOCK_RESOURCE);
    const relRes = await relReq.query(`
      DECLARE @rc INT;
      EXEC @rc = sp_releaseapplock
        @Resource = @resource,
        @LockOwner = 'Session';
      SELECT @rc AS release_result;
    `);
    const rc = relRes.recordset[0]?.release_result;
    if (rc === undefined || rc < 0) {
      if (log) {
        log({
          event: 'loyalty_lock_release_failed',
          executionId: options.executionId || null,
          reason: `sp_releaseapplock_rc_${rc}`,
          timestampUtc: new Date().toISOString()
        });
      }
      return { released: false, releaseResult: rc };
    }

    if (log) {
      log({
        event: 'loyalty_lock_released',
        executionId: options.executionId || null,
        releaseResult: rc,
        timestampUtc: new Date().toISOString()
      });
    }
    return { released: true, releaseResult: rc };
  } catch (err) {
    if (log) {
      log({
        event: 'loyalty_lock_release_failed',
        executionId: options.executionId || null,
        errorSummary: sanitizeErrorSummary(err),
        timestampUtc: new Date().toISOString()
      });
    } else {
      console.warn('[LOYALTY WORKER] sp_releaseapplock warning:', sanitizeErrorSummary(err));
    }
    return { released: false, error: sanitizeErrorSummary(err) };
  } finally {
    try {
      await lockPool.close();
    } catch (_) {}
  }
}

async function expireSingleBatch(pool, batchId, userId, nowTs) {
  const tx = new sql.Transaction(pool);
  await tx.begin();
  let commitAttempted = false;

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
      commitAttempted = true;
      await tx.commit();
      return { expired: false, skipped: true, reason: 'BATCH_NOT_FOUND' };
    }

    const batch = bRes.recordset[0];
    const batchExpiresAt = loyaltyCycle.toUtcDate(batch.expires_at, `batch#${batch.id}.expires_at`);

    if (batch.status !== 'ACTIVE' || batch.remaining_points <= 0 || batchExpiresAt.getTime() > nowTs.getTime()) {
      commitAttempted = true;
      await tx.commit();
      return { expired: false, skipped: true, reason: `STATUS_${batch.status}` };
    }

    const idempotencyKey = `EXP_BATCH_${batch.id}`;
    const idemReq = new sql.Request(tx);
    idemReq.input('idem', sql.NVarChar(100), idempotencyKey);
    const idemRes = await idemReq.query('SELECT id FROM point_transactions WHERE idempotency_key = @idem');
    if (idemRes.recordset.length > 0) {
      throw new Error(`[INVARIANT VIOLATION] Idempotency key ${idempotencyKey} already exists while batch #${batch.id} is still ACTIVE.`);
    }

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

    commitAttempted = true;
    await tx.commit();
    return { expired: true, skipped: false, batchId: batch.id, pointsExpired: batch.remaining_points };
  } catch (err) {
    if (commitAttempted) {
      err.isCommitOutcomeUncertain = true;
      err.isSystemic = true;
    } else {
      try {
        await tx.rollback();
      } catch (_) {}
    }
    throw err;
  }
}

async function processDueWalletCycle(pool, userId, nowTs) {
  const tx = new sql.Transaction(pool);
  await tx.begin();
  let commitAttempted = false;

  try {
    const wReq = new sql.Request(tx);
    wReq.input('userId', sql.Int, userId);
    const wRes = await wReq.query(`
      SELECT user_id, available_points, tier_code, cycle_anchor_at, cycle_number, cycle_start_at, cycle_end_at, qualifying_points_cycle
      FROM user_points_wallets WITH (UPDLOCK, ROWLOCK)
      WHERE user_id = @userId
    `);

    if (wRes.recordset.length === 0) {
      commitAttempted = true;
      await tx.commit();
      return { updated: false, cyclesProcessed: 0 };
    }

    const wallet = wRes.recordset[0];
    const rolled = loyaltyCycle.rolloverCyclesThroughTimestamp(wallet, nowTs);
    if (!rolled.changed) {
      commitAttempted = true;
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

    commitAttempted = true;
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
    if (commitAttempted) {
      err.isCommitOutcomeUncertain = true;
      err.isSystemic = true;
    } else {
      try {
        await tx.rollback();
      } catch (_) {}
    }
    throw err;
  }
}

async function runLoyaltyCycleWorker(options = {}) {
  const executionId = options.executionId || crypto.randomUUID();
  const instanceId = options.instanceId || getInstanceId();
  const trigger = options.trigger || 'manual';
  const startedAtMs = Date.now();
  const startedAtUtc = new Date(startedAtMs).toISOString();
  const emitLog = typeof options.logger === 'function' ? options.logger : defaultLogEmitter;
  const shouldEmitLogs = options.emitStructuredLogs === true;

  const lockTimeoutMs = options.lockTimeoutMs !== undefined ? options.lockTimeoutMs : 0;
  const acquireFn = typeof options.acquireLockFn === 'function' ? options.acquireLockFn : acquireSessionAppLock;
  const verifyFn = typeof options.verifyLockFn === 'function' ? options.verifyLockFn : verifySessionLockHeld;
  const releaseFn = typeof options.releaseLockFn === 'function' ? options.releaseLockFn : releaseSessionAppLock;
  const expireBatchFn = typeof options.expireBatchFn === 'function' ? options.expireBatchFn : expireSingleBatch;
  const processWalletFn = typeof options.processWalletFn === 'function' ? options.processWalletFn : processDueWalletCycle;

  const lockState = await acquireFn(lockTimeoutMs, {
    executionId,
    logger: shouldEmitLogs ? emitLog : null
  });

  if (!lockState.acquired) {
    const finishedAtUtc = new Date().toISOString();
    if (shouldEmitLogs) {
      emitLog({
        event: 'loyalty_lock_not_acquired',
        executionId,
        jobName: JOB_NAME,
        trigger,
        instanceId,
        lockStatus: 'not_acquired',
        lockResult: lockState.lockResult ?? -1,
        timestampUtc: finishedAtUtc
      });
    }
    return {
      executionId,
      jobName: JOB_NAME,
      trigger,
      instanceId,
      startedAtUtc,
      finishedAtUtc,
      durationMs: Math.max(0, Date.now() - startedAtMs),
      skippedDueToLock: true,
      lockStatus: 'not_acquired',
      processedAccounts: 0,
      processedCycles: 0,
      expiredBatches: 0,
      pointsExpiredTotal: 0,
      skippedBatches: 0,
      skippedRecords: 0,
      failedRecords: 0,
      failedDetails: [],
      errorSummary: null,
      walletsRolledOver: 0,
      cyclesProcessedTotal: 0,
      outcome: 'skipped'
    };
  }

  if (shouldEmitLogs) {
    emitLog({
      event: 'loyalty_lock_acquired',
      executionId,
      jobName: JOB_NAME,
      instanceId,
      lockResult: lockState.lockResult ?? 0,
      timestampUtc: new Date().toISOString()
    });
    emitLog({
      event: 'loyalty_job_started',
      executionId,
      jobName: JOB_NAME,
      startedAtUtc,
      instanceId,
      trigger,
      lockStatus: 'acquired'
    });
  }

  try {
    // Execute worker queries & transactions on the same pinned lock session pool unless overridden
    const workPool = options.workPool || lockState.lockPool;
    await verifyFn(lockState);

    const nowRes = await workPool.request().query('SELECT SYSUTCDATETIME() AS db_now');
    const nowTs = options.nowOverride
      ? loyaltyCycle.toUtcDate(options.nowOverride, 'nowOverride')
      : loyaltyCycle.toUtcDate(nowRes.recordset[0].db_now, 'db_now');

    const touchedUserIds = new Set();
    const failedDetails = [];
    let expiredBatches = 0;
    let pointsExpiredTotal = 0;
    let skippedBatches = 0;
    let walletsRolledOver = 0;
    let cyclesProcessedTotal = 0;
    let abortedDueToShutdown = false;

    // Phase 1: Scan and expire due batches (365-day expiration)
    const dueBatchesReq = workPool.request();
    dueBatchesReq.input('nowTs', sql.DateTime2, nowTs);
    const dueBatchesRes = await dueBatchesReq.query(`
      SELECT id, user_id
      FROM loyalty_point_batches
      WHERE status = 'ACTIVE'
        AND remaining_points > 0
        AND expires_at <= @nowTs
      ORDER BY expires_at ASC, id ASC
    `);

    for (const row of dueBatchesRes.recordset) {
      if (typeof options.shouldAbort === 'function' && options.shouldAbort()) {
        abortedDueToShutdown = true;
        break;
      }
      await verifyFn(lockState);

      if (options.testHooks && typeof options.testHooks.beforeExpireBatch === 'function') {
        await options.testHooks.beforeExpireBatch(row);
      }

      try {
        const res = await executeWithDeadlockRetry(
          () => expireBatchFn(workPool, row.id, row.user_id, nowTs),
          options.retryOptions
        );
        touchedUserIds.add(row.user_id);
        if (res.expired) {
          expiredBatches++;
          pointsExpiredTotal += res.pointsExpired;
        } else if (res.skipped) {
          skippedBatches++;
        }
      } catch (itemErr) {
        if (isSystemicError(itemErr)) {
          throw itemErr;
        }
        failedDetails.push({
          entityType: 'POINT_BATCH',
          entityId: row.id,
          userId: row.user_id,
          errorCode: itemErr.code || `SQL_${getSqlErrorNumber(itemErr) || 'ITEM_ERROR'}`,
          errorSummary: sanitizeErrorSummary(itemErr)
        });
      }
    }

    // Phase 2: Scan and roll over due 12-month tier cycles (with Soft Landing)
    if (!abortedDueToShutdown) {
      await verifyFn(lockState);

      const dueWalletsReq = workPool.request();
      dueWalletsReq.input('nowTs', sql.DateTime2, nowTs);
      const dueWalletsRes = await dueWalletsReq.query(`
        SELECT user_id
        FROM user_points_wallets
        WHERE cycle_end_at IS NOT NULL
          AND cycle_end_at < @nowTs
        ORDER BY cycle_end_at ASC, user_id ASC
      `);

      for (const row of dueWalletsRes.recordset) {
        if (typeof options.shouldAbort === 'function' && options.shouldAbort()) {
          abortedDueToShutdown = true;
          break;
        }
        await verifyFn(lockState);

        try {
          const res = await executeWithDeadlockRetry(
            () => processWalletFn(workPool, row.user_id, nowTs),
            options.retryOptions
          );
          touchedUserIds.add(row.user_id);
          if (res.updated) {
            walletsRolledOver++;
            cyclesProcessedTotal += res.cyclesProcessed;
          }
        } catch (itemErr) {
          if (isSystemicError(itemErr)) {
            throw itemErr;
          }
          failedDetails.push({
            entityType: 'WALLET',
            entityId: row.user_id,
            userId: row.user_id,
            errorCode: itemErr.code || `SQL_${getSqlErrorNumber(itemErr) || 'ITEM_ERROR'}`,
            errorSummary: sanitizeErrorSummary(itemErr)
          });
        }
      }
    }

    const finishedAtUtc = new Date().toISOString();
    const durationMs = Math.max(0, Date.now() - startedAtMs);
    const failedRecords = failedDetails.length;
    const outcome = abortedDueToShutdown
      ? 'aborted_shutdown'
      : (failedRecords > 0 ? 'degraded' : 'success');
    const errorSummary = failedRecords > 0
      ? failedDetails.slice(0, 5).map((f) => `${f.entityType}#${f.entityId}:${f.errorSummary}`).join(' | ')
      : null;

    if (shouldEmitLogs) {
      emitLog({
        event: 'loyalty_job_completed',
        executionId,
        jobName: JOB_NAME,
        finishedAtUtc,
        durationMs,
        instanceId,
        processedAccounts: touchedUserIds.size,
        processedCycles: cyclesProcessedTotal,
        expiredBatches,
        skippedRecords: skippedBatches,
        failedRecords,
        errorSummary,
        outcome
      });
    }

    return {
      executionId,
      jobName: JOB_NAME,
      trigger,
      instanceId,
      startedAtUtc,
      finishedAtUtc,
      durationMs,
      skippedDueToLock: false,
      lockStatus: 'acquired',
      processedAt: nowTs,
      processedAccounts: touchedUserIds.size,
      processedCycles: cyclesProcessedTotal,
      expiredBatches,
      pointsExpiredTotal,
      skippedBatches,
      skippedRecords: skippedBatches,
      failedRecords,
      failedDetails,
      errorSummary,
      walletsRolledOver,
      cyclesProcessedTotal,
      abortedDueToShutdown,
      outcome
    };
  } catch (err) {
    const finishedAtUtc = new Date().toISOString();
    const durationMs = Math.max(0, Date.now() - startedAtMs);
    if (shouldEmitLogs) {
      emitLog({
        event: 'loyalty_job_failed',
        executionId,
        jobName: JOB_NAME,
        instanceId,
        errorCode: err.code || `SQL_${getSqlErrorNumber(err) || 'WORKER_FAILED'}`,
        errorSummary: sanitizeErrorSummary(err),
        finishedAtUtc,
        durationMs
      });
    }
    throw err;
  } finally {
    await releaseFn(lockState.lockPool, {
      executionId,
      logger: shouldEmitLogs ? emitLog : null
    });
  }
}

if (require.main === module) {
  runLoyaltyCycleWorker({ trigger: 'cli', emitStructuredLogs: true })
    .then(async (summary) => {
      process.exitCode = summary.failedRecords > 0 ? 1 : 0;
      await closePool();
    })
    .catch(async (err) => {
      console.error('[LOYALTY WORKER ERROR]', sanitizeErrorSummary(err));
      process.exitCode = 1;
      await closePool();
    });
}

module.exports = {
  APPLOCK_RESOURCE,
  JOB_NAME,
  DEADLOCK_SQL_ERROR_NUMBER,
  DEFAULT_DEADLOCK_MAX_RETRIES,
  acquireSessionAppLock,
  verifySessionLockHeld,
  releaseSessionAppLock,
  expireSingleBatch,
  processDueWalletCycle,
  runLoyaltyCycleWorker,
  executeWithDeadlockRetry,
  isDeadlockError,
  isSystemicError,
  sanitizeErrorSummary
};
