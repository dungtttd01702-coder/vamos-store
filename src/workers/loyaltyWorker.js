/**
 * VAMOS STORE — Dedicated Loyalty Cycle Worker Entrypoint
 * Runs completely independent of Express HTTP server (server.js / src/app.js).
 *
 * Security & Lifecycle:
 * - Validates DB environment via src/config/db-guard.js
 * - Maintains dedicated DB readiness check & closes worker connections on shutdown
 * - Runs controlled startup catch-up + hourly :05 UTC schedule
 * - Exposes internal loopback health server (/health, /health/live, /health/ready)
 * - NEVER triggers backfillLoyaltyHistory.js or migrations
 * - Safe to import in tests (only auto-starts when require.main === module)
 */

require('dotenv').config();
const sql = require('mssql');
const appConfig = require('../config/app.config');
const { validateDatabaseConnection } = require('../config/db-guard');
const { runLoyaltyCycleWorker, sanitizeErrorSummary } = require('../jobs/processLoyaltyCycle');
const { createLoyaltyScheduler } = require('../services/loyaltyScheduler.service');
const { createWorkerHealthServer } = require('./healthServer');

async function checkWorkerDatabaseReady() {
  validateDatabaseConnection(appConfig.db, process.env.NODE_ENV);
  const probePool = new sql.ConnectionPool({
    ...appConfig.db,
    pool: { max: 1, min: 0, idleTimeoutMillis: 5000 }
  });
  try {
    await probePool.connect();
    const res = await probePool.request().query('SELECT SYSUTCDATETIME() AS utc_now, OBJECT_ID(\'loyalty_point_batches\', \'U\') AS batches_tbl');
    const row = res.recordset[0];
    return Boolean(row && row.utc_now && row.batches_tbl !== null);
  } finally {
    try {
      await probePool.close();
    } catch (_) {}
  }
}

function createDedicatedLoyaltyWorkerRuntime(overrides = {}) {
  const healthHost = overrides.healthHost || process.env.WORKER_HEALTH_HOST || '127.0.0.1';
  const healthPort = overrides.healthPort !== undefined
    ? overrides.healthPort
    : (Number.parseInt(process.env.WORKER_HEALTH_PORT, 10) || 3100);
  const gracePeriodMs = overrides.gracePeriodMs !== undefined
    ? overrides.gracePeriodMs
    : (Number.parseInt(process.env.WORKER_SHUTDOWN_GRACE_MS, 10) || 20000);
  const enableHealthServer = overrides.enableHealthServer !== false;

  let healthServer = null;
  let scheduler = null;
  let shuttingDown = false;
  let exitTriggered = false;

  const exitFn = typeof overrides.exitFn === 'function' ? overrides.exitFn : (code) => process.exit(code);
  const dbCheckFn = typeof overrides.checkDbReady === 'function' ? overrides.checkDbReady : checkWorkerDatabaseReady;
  const runJobFn = typeof overrides.runJob === 'function' ? overrides.runJob : runLoyaltyCycleWorker;

  async function shutdown(signalOrReason, exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(JSON.stringify({
      event: 'loyalty_worker_stopping',
      reason: signalOrReason,
      timestampUtc: new Date().toISOString()
    }));

    let graceful = true;
    try {
      if (scheduler) {
        const stopRes = await scheduler.stop(gracePeriodMs);
        graceful = stopRes.graceful;
      }
      if (healthServer) {
        await healthServer.close();
      }
    } catch (err) {
      console.error(JSON.stringify({
        event: 'loyalty_worker_shutdown_error',
        errorSummary: sanitizeErrorSummary(err),
        timestampUtc: new Date().toISOString()
      }));
      graceful = false;
    }

    if (!exitTriggered) {
      exitTriggered = true;
      exitFn(graceful ? exitCode : 1);
    }
  }

  scheduler = createLoyaltyScheduler({
    checkDbReady: dbCheckFn,
    runJob: runJobFn,
    gracePeriodMs,
    ...overrides.schedulerOptions,
    onFatal: async (err) => {
      console.error(JSON.stringify({
        event: 'loyalty_worker_fatal',
        errorSummary: sanitizeErrorSummary(err),
        timestampUtc: new Date().toISOString()
      }));
      await shutdown('fatal_systemic_error', 1);
    }
  });

  if (enableHealthServer) {
    healthServer = createWorkerHealthServer({
      getHealthSnapshot: () => scheduler.getHealthSnapshot(),
      host: healthHost,
      port: healthPort
    });
  }

  async function start() {
    if (process.env.NODE_ENV === 'test' && overrides.allowInTest !== true) {
      throw new Error('[WORKER GUARD]: Dedicated loyalty worker auto-start is disabled in NODE_ENV=test.');
    }

    let boundHealth = null;
    if (healthServer) {
      boundHealth = await healthServer.start();
    }

    const startRes = await scheduler.start();
    return {
      healthAddress: boundHealth,
      scheduler: startRes
    };
  }

  return {
    start,
    shutdown,
    getHealthSnapshot: () => scheduler.getHealthSnapshot(),
    getScheduler: () => scheduler
  };
}

if (require.main === module) {
  const runtime = createDedicatedLoyaltyWorkerRuntime();

  process.on('SIGTERM', () => {
    void runtime.shutdown('SIGTERM', 0).catch(() => process.exit(1));
  });
  process.on('SIGINT', () => {
    void runtime.shutdown('SIGINT', 0).catch(() => process.exit(1));
  });
  process.on('unhandledRejection', (reason) => {
    console.error(JSON.stringify({
      event: 'loyalty_worker_unhandled_rejection',
      errorSummary: sanitizeErrorSummary(reason instanceof Error ? reason : new Error(String(reason))),
      timestampUtc: new Date().toISOString()
    }));
    void runtime.shutdown('unhandledRejection', 1).catch(() => process.exit(1));
  });
  process.on('uncaughtException', (err) => {
    console.error(JSON.stringify({
      event: 'loyalty_worker_uncaught_exception',
      errorSummary: sanitizeErrorSummary(err),
      timestampUtc: new Date().toISOString()
    }));
    void runtime.shutdown('uncaughtException', 1).catch(() => process.exit(1));
  });

  runtime.start().catch((err) => {
    console.error(JSON.stringify({
      event: 'loyalty_worker_boot_failed',
      errorSummary: sanitizeErrorSummary(err),
      timestampUtc: new Date().toISOString()
    }));
    return runtime.shutdown('boot_failed', 1).catch(() => process.exit(1));
  });
}

module.exports = {
  checkWorkerDatabaseReady,
  createDedicatedLoyaltyWorkerRuntime
};
