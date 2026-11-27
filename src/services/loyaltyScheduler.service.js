/**
 * Hourly UTC Scheduler Engine for VAMOS CLUB Loyalty Cycle Worker
 *
 * Design Guarantees (HIGH-01):
 * - Runs strictly at minute :05 UTC each hour (recalculated from UTC clock, never OS TZ or +7h offset)
 * - Performs one controlled catch-up run on startup after DB readiness confirmation
 * - Coalesces overlapping ticks into at most ONE pending catch-up execution (no unbounded queue)
 * - Keeps running on per-item degraded outcomes, halts cleanly to 'fatal' on systemic errors
 * - Injects clock/timer dependencies for deterministic unit testing without real 60-minute sleeps
 * - Never triggers backfillLoyaltyHistory.js or migrations
 */

const crypto = require('node:crypto');
const os = require('node:os');

const HOURLY_MINUTE_UTC = 5;
const ONE_HOUR_MS = 60 * 60 * 1000;
const DEFAULT_DB_READY_RETRY_MS = 5000;
const DEFAULT_MAX_LONG_RUN_MS = 10 * 60 * 1000;
const DEFAULT_GRACE_PERIOD_MS = 20000;

/**
 * Compute next hourly tick timestamp (ms epoch) strictly in the future at HH:05:00.000 UTC.
 * Independent of process.env.TZ / OS local timezone.
 * @param {number} [nowMs]
 * @returns {number}
 */
function computeNextHourlyTickUtc(nowMs = Date.now()) {
  const now = new Date(nowMs);
  if (Number.isNaN(now.getTime())) {
    throw new Error(`Invalid timestamp passed to computeNextHourlyTickUtc: ${nowMs}`);
  }

  let candidateMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    HOURLY_MINUTE_UTC,
    0,
    0
  );

  if (candidateMs <= nowMs) {
    candidateMs += ONE_HOUR_MS;
  }
  return candidateMs;
}

function defaultEmitLog(entry) {
  console.log(JSON.stringify(entry));
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createLoyaltyScheduler(deps = {}) {
  if (typeof deps.runJob !== 'function') {
    throw new Error('createLoyaltyScheduler requires a runJob function');
  }
  if (typeof deps.checkDbReady !== 'function') {
    throw new Error('createLoyaltyScheduler requires a checkDbReady function');
  }

  const runJob = deps.runJob;
  const checkDbReady = deps.checkDbReady;
  const nowFn = typeof deps.nowFn === 'function' ? deps.nowFn : () => Date.now();
  const setTimeoutFn = typeof deps.setTimeoutFn === 'function' ? deps.setTimeoutFn : setTimeout;
  const clearTimeoutFn = typeof deps.clearTimeoutFn === 'function' ? deps.clearTimeoutFn : clearTimeout;
  const sleepFn = typeof deps.sleepFn === 'function' ? deps.sleepFn : defaultSleep;
  const emitLog = typeof deps.onLog === 'function' ? deps.onLog : defaultEmitLog;
  const onFatal = typeof deps.onFatal === 'function' ? deps.onFatal : null;
  const onCleanup = typeof deps.onCleanup === 'function' ? deps.onCleanup : null;

  const instanceId = deps.instanceId || `${os.hostname()}:${process.pid}`;
  const dbReadyRetryMs = Number.isFinite(deps.dbReadyRetryMs) && deps.dbReadyRetryMs >= 0
    ? deps.dbReadyRetryMs
    : DEFAULT_DB_READY_RETRY_MS;
  const dbReadyMaxAttempts = Number.isInteger(deps.dbReadyMaxAttempts) && deps.dbReadyMaxAttempts > 0
    ? deps.dbReadyMaxAttempts
    : 0; // 0 = wait cleanly until DB ready or stop()
  const maxLongRunMs = Number.isFinite(deps.maxLongRunMs) && deps.maxLongRunMs > 0
    ? deps.maxLongRunMs
    : DEFAULT_MAX_LONG_RUN_MS;
  const defaultGracePeriodMs = Number.isFinite(deps.gracePeriodMs) && deps.gracePeriodMs > 0
    ? deps.gracePeriodMs
    : DEFAULT_GRACE_PERIOD_MS;

  let status = 'starting';
  let shuttingDown = false;
  let stopped = false;
  let schedulerActive = false;
  let timerHandle = null;
  let nextTickAtUtc = null;

  let activeExecutionPromise = null;
  let activeExecutionId = null;
  let activeRunStartedAtMs = null;
  let pendingCatchUp = false;

  let lastRunAtUtc = null;
  let lastSuccessAtUtc = null;
  let lastDurationMs = null;
  let lastOutcome = null;
  let lastFailedRecords = 0;
  let lastErrorSummary = null;
  let consecutiveFailures = 0;

  function clearScheduledTimer() {
    if (timerHandle !== null) {
      clearTimeoutFn(timerHandle);
      timerHandle = null;
    }
    nextTickAtUtc = null;
  }

  function scheduleNextTick() {
    if (shuttingDown || stopped || status === 'fatal') {
      return null;
    }
    clearScheduledTimer();
    const nowMs = nowFn();
    const targetMs = computeNextHourlyTickUtc(nowMs);
    const delayMs = Math.max(0, targetMs - nowMs);
    nextTickAtUtc = new Date(targetMs).toISOString();

    timerHandle = setTimeoutFn(() => {
      timerHandle = null;
      handleTrigger('hourly').catch((err) => {
        handleSystemicFailure(err);
      });
    }, delayMs);

    return nextTickAtUtc;
  }

  function handleSystemicFailure(err) {
    status = 'fatal';
    consecutiveFailures++;
    clearScheduledTimer();
    pendingCatchUp = false;
    lastOutcome = 'failed';
    lastErrorSummary = err && err.message ? String(err.message).slice(0, 240) : 'Systemic failure';

    if (onFatal) {
      Promise.resolve(onFatal(err)).catch(() => {});
    }
  }

  async function executeSingleCycle(trigger) {
    if (shuttingDown || stopped || status === 'fatal') {
      return null;
    }

    const executionId = crypto.randomUUID();
    activeExecutionId = executionId;
    activeRunStartedAtMs = nowFn();
    status = 'running';

    const runPromise = (async () => {
      try {
        const result = await runJob({
          executionId,
          instanceId,
          trigger,
          emitStructuredLogs: true,
          logger: emitLog,
          shouldAbort: () => shuttingDown || stopped
        });

        const endedMs = nowFn();
        lastRunAtUtc = result?.finishedAtUtc || new Date(endedMs).toISOString();
        lastDurationMs = result?.durationMs !== undefined
          ? result.durationMs
          : Math.max(0, endedMs - activeRunStartedAtMs);
        lastFailedRecords = Number(result?.failedRecords || 0);
        lastOutcome = result?.outcome || (result?.skippedDueToLock ? 'skipped' : 'success');

        if (result?.abortedDueToShutdown) {
          lastErrorSummary = 'Aborted due to graceful shutdown';
        } else if (lastFailedRecords > 0) {
          status = 'degraded';
          lastErrorSummary = result?.errorSummary || `${lastFailedRecords} item failure(s)`;
          consecutiveFailures = 0;
        } else {
          if (!shuttingDown && !stopped) {
            status = 'ready';
          }
          lastErrorSummary = null;
          consecutiveFailures = 0;
          if (!result?.skippedDueToLock) {
            lastSuccessAtUtc = lastRunAtUtc;
          }
        }

        return result;
      } catch (err) {
        const endedMs = nowFn();
        lastRunAtUtc = new Date(endedMs).toISOString();
        lastDurationMs = Math.max(0, endedMs - activeRunStartedAtMs);
        handleSystemicFailure(err);
        throw err;
      } finally {
        activeExecutionId = null;
        activeRunStartedAtMs = null;
      }
    })();

    activeExecutionPromise = runPromise;
    try {
      return await runPromise;
    } finally {
      if (activeExecutionPromise === runPromise) {
        activeExecutionPromise = null;
      }
    }
  }

  async function handleTrigger(trigger) {
    if (shuttingDown || stopped || status === 'fatal') {
      return { skipped: true, reason: status };
    }

    if (activeExecutionPromise) {
      // Coalesce overlapping ticks to at most ONE pending catch-up execution
      pendingCatchUp = true;
      emitLog({
        event: 'loyalty_scheduler_overlap_coalesced',
        jobName: 'loyalty-cycle-worker',
        trigger,
        instanceId,
        activeExecutionId,
        pendingCatchUp: true,
        timestampUtc: new Date(nowFn()).toISOString()
      });
      return { coalesced: true };
    }

    const firstResult = await executeSingleCycle(trigger);

    // Process at most ONE pending catch-up after finishing the in-flight execution
    if (pendingCatchUp && !shuttingDown && !stopped && status !== 'fatal') {
      pendingCatchUp = false;
      await executeSingleCycle('hourly');
    }

    if (!shuttingDown && !stopped && status !== 'fatal') {
      scheduleNextTick();
    }

    return firstResult;
  }

  async function waitForDatabaseReady() {
    let attempt = 0;
    while (!shuttingDown && !stopped) {
      attempt++;
      let ready = false;
      try {
        ready = Boolean(await checkDbReady());
      } catch (err) {
        ready = false;
        lastErrorSummary = err && err.message ? String(err.message).slice(0, 240) : 'Database check failed';
      }

      if (ready) {
        return true;
      }

      if (dbReadyMaxAttempts > 0 && attempt >= dbReadyMaxAttempts) {
        const err = new Error(`Database not ready after ${attempt} attempts`);
        err.code = 'DB_NOT_READY';
        err.isSystemic = true;
        handleSystemicFailure(err);
        throw err;
      }

      emitLog({
        event: 'loyalty_worker_waiting_db',
        jobName: 'loyalty-cycle-worker',
        attempt,
        retryDelayMs: dbReadyRetryMs,
        instanceId,
        timestampUtc: new Date(nowFn()).toISOString()
      });

      await sleepFn(dbReadyRetryMs);
    }
    return false;
  }

  async function start() {
    if (stopped || shuttingDown) {
      return { started: false, reason: 'stopped' };
    }
    status = 'starting';
    schedulerActive = true;

    const dbReady = await waitForDatabaseReady();
    if (!dbReady || shuttingDown || stopped) {
      return { started: false, reason: 'aborted_before_ready' };
    }

    status = 'ready';
    emitLog({
      event: 'loyalty_worker_ready',
      jobName: 'loyalty-cycle-worker',
      instanceId,
      schedule: '05 * * * * (UTC)',
      timestampUtc: new Date(nowFn()).toISOString()
    });

    await handleTrigger('startup_catchup');
    return { started: status !== 'fatal', status, nextTickAtUtc };
  }

  async function stop(gracePeriodMs = defaultGracePeriodMs) {
    if (stopped) {
      return { graceful: true, alreadyStopped: true };
    }

    shuttingDown = true;
    status = 'stopping';
    schedulerActive = false;
    pendingCatchUp = false;
    clearScheduledTimer();

    let graceful = true;
    if (activeExecutionPromise) {
      const waitTimeoutMs = Number.isFinite(gracePeriodMs) && gracePeriodMs >= 0 ? gracePeriodMs : defaultGracePeriodMs;
      const completedInTime = await Promise.race([
        activeExecutionPromise.then(() => true, () => true),
        sleepFn(waitTimeoutMs).then(() => false)
      ]);
      if (!completedInTime) {
        graceful = false;
        emitLog({
          event: 'loyalty_worker_shutdown_timeout',
          jobName: 'loyalty-cycle-worker',
          gracePeriodMs: waitTimeoutMs,
          activeExecutionId,
          instanceId,
          timestampUtc: new Date(nowFn()).toISOString()
        });
      }
    }

    if (onCleanup) {
      await onCleanup();
    }

    stopped = true;
    return { graceful };
  }

  function getHealthSnapshot() {
    const currentMs = nowFn();
    const runningDurationMs = activeRunStartedAtMs !== null ? Math.max(0, currentMs - activeRunStartedAtMs) : 0;
    const isLongRunning = status === 'running' && runningDurationMs > maxLongRunMs;
    const isAlive = status !== 'fatal' && !stopped;
    const isReady = status === 'ready' || status === 'running' || status === 'degraded';

    return {
      service: 'vamos-loyalty-worker',
      status,
      liveness: isAlive,
      readiness: isReady,
      schedulerActive,
      pendingCatchUp,
      isLongRunning,
      runningDurationMs,
      lastRunAtUtc,
      lastSuccessAtUtc,
      lastDurationMs,
      lastOutcome,
      lastFailedRecords,
      consecutiveFailures,
      lastErrorSummary,
      nextTickAtUtc,
      timestampUtc: new Date(currentMs).toISOString()
    };
  }

  return {
    start,
    stop,
    triggerHourlyTick: () => handleTrigger('hourly'),
    getHealthSnapshot,
    getStatus: () => status
  };
}

module.exports = {
  HOURLY_MINUTE_UTC,
  ONE_HOUR_MS,
  computeNextHourlyTickUtc,
  createLoyaltyScheduler
};
