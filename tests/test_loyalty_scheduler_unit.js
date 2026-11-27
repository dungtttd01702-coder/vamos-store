/**
 * VAMOS STORE — HIGH-01 Loyalty Scheduler, Lock, Error Isolation & Health Unit Tests (Zero-DB)
 * Covers: TC01-TC34 (UTC :05 schedule, TZ independence, overlap coalescing, lock session/release,
 *         per-item error isolation, systemic fail-fast, bounded 1205 deadlock retry,
 *         uncertain-commit no-retry, graceful SIGTERM shutdown, health states, backfill/web separation).
 */

require('./test_bootstrap');

const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const sql = require('mssql');

const workerJob = require('../src/jobs/processLoyaltyCycle');
const { computeNextHourlyTickUtc, createLoyaltyScheduler } = require('../src/services/loyaltyScheduler.service');
const { createWorkerHealthServer } = require('../src/workers/healthServer');
const { createDedicatedLoyaltyWorkerRuntime } = require('../src/workers/loyaltyWorker');
const { createSuiteRunner } = require('./helpers/loyalty-test-helpers');

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(body) });
      });
    }).on('error', reject);
  });
}

async function main() {
  const { test, asyncTest, assertSummary } = createSuiteRunner('VAMOS STORE - HIGH-01 LOYALTY SCHEDULER & WORKER UNIT TESTS');

  // --- TC01 & TC02: Next :05 UTC tick & TZ independence ---
  test('TC01-TC02: computeNextHourlyTickUtc aligns strictly to HH:05:00.000Z regardless of process.env.TZ', () => {
    assert.strictEqual(
      new Date(computeNextHourlyTickUtc(Date.parse('2026-11-26T00:04:59.999Z'))).toISOString(),
      '2026-11-26T00:05:00.000Z'
    );
    assert.strictEqual(
      new Date(computeNextHourlyTickUtc(Date.parse('2026-11-26T00:05:00.000Z'))).toISOString(),
      '2026-11-26T01:05:00.000Z'
    );
    assert.strictEqual(
      new Date(computeNextHourlyTickUtc(Date.parse('2026-11-26T23:30:00.000Z'))).toISOString(),
      '2026-11-27T00:05:00.000Z'
    );

    const script = [
      "const { computeNextHourlyTickUtc } = require('./src/services/loyaltyScheduler.service');",
      "console.log(new Date(computeNextHourlyTickUtc(Date.parse('2026-11-26T16:59:00.000Z'))).toISOString());"
    ].join('\n');

    const runInTz = (tz) => execFileSync(process.execPath, ['-e', script], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, TZ: tz },
      encoding: 'utf8'
    }).trim();

    assert.strictEqual(runInTz('UTC'), '2026-11-26T17:05:00.000Z');
    assert.strictEqual(runInTz('Asia/Ho_Chi_Minh'), '2026-11-26T17:05:00.000Z');
    assert.strictEqual(runInTz('America/New_York'), '2026-11-26T17:05:00.000Z');
  });

  // --- TC03-TC08: Startup catch-up, non-overlap, max 1 pending catch-up, degraded vs systemic ---
  await asyncTest('TC03-TC06: Startup catch-up runs once, prevents overlap, and coalesces multiple missed ticks into 1 pending catch-up', async () => {
    const triggers = [];
    const logs = [];
    let releaseFirstRun = null;
    const firstStarted = new Promise((res) => { releaseFirstRun = res; });

    let finishRunGate = null;
    const holdFirstRun = new Promise((res) => { finishRunGate = res; });

    let fakeNowMs = Date.parse('2026-11-26T10:00:00.000Z');
    const scheduledTimers = [];

    const scheduler = createLoyaltyScheduler({
      nowFn: () => fakeNowMs,
      setTimeoutFn: (fn, delay) => {
        const handle = { fn, delay, cancelled: false };
        scheduledTimers.push(handle);
        return handle;
      },
      clearTimeoutFn: (handle) => { if (handle) handle.cancelled = true; },
      sleepFn: async () => {},
      onLog: (e) => logs.push(e),
      checkDbReady: async () => true,
      runJob: async ({ trigger }) => {
        triggers.push(trigger);
        if (triggers.length === 1) {
          releaseFirstRun();
          await holdFirstRun;
        }
        return { outcome: 'success', failedRecords: 0, skippedDueToLock: false };
      }
    });

    const startPromise = scheduler.start();
    await firstStarted;

    // Trigger 3 overlapping hourly ticks while startup_catchup is still running
    const r1 = await scheduler.triggerHourlyTick();
    const r2 = await scheduler.triggerHourlyTick();
    const r3 = await scheduler.triggerHourlyTick();
    assert.strictEqual(r1.coalesced, true);
    assert.strictEqual(r2.coalesced, true);
    assert.strictEqual(r3.coalesced, true);

    finishRunGate();
    await startPromise;

    assert.deepStrictEqual(triggers, ['startup_catchup', 'hourly'], 'Must run startup_catchup once plus at most ONE pending catch-up');
    assert.strictEqual(scheduler.getHealthSnapshot().status, 'ready');
    assert.strictEqual(scheduler.getHealthSnapshot().nextTickAtUtc, '2026-11-26T10:05:00.000Z');
    assert.ok(logs.some((l) => l.event === 'loyalty_scheduler_overlap_coalesced'));
    await scheduler.stop();
  });

  await asyncTest('TC07-TC08: Scheduler remains active in degraded state after item errors, halts cleanly to fatal on systemic failure', async () => {
    let runMode = 'degraded';
    let fatalCalled = 0;

    const scheduler = createLoyaltyScheduler({
      nowFn: () => Date.parse('2026-11-26T10:00:00.000Z'),
      setTimeoutFn: () => ({}),
      clearTimeoutFn: () => {},
      sleepFn: async () => {},
      onLog: () => {},
      checkDbReady: async () => true,
      onFatal: async () => { fatalCalled++; },
      runJob: async () => {
        if (runMode === 'degraded') {
          return { outcome: 'degraded', failedRecords: 1, errorSummary: 'POINT_BATCH#99:invariant', skippedDueToLock: false };
        }
        const sysErr = new Error('Connection lost');
        sysErr.code = 'ECONNRESET';
        throw sysErr;
      }
    });

    await scheduler.start();
    const snapDeg = scheduler.getHealthSnapshot();
    assert.strictEqual(snapDeg.status, 'degraded');
    assert.strictEqual(snapDeg.liveness, true);
    assert.strictEqual(snapDeg.readiness, true);
    assert.ok(snapDeg.nextTickAtUtc !== null, 'Scheduler must stay scheduled when degraded');

    runMode = 'systemic';
    await assert.rejects(() => scheduler.triggerHourlyTick(), /Connection lost/);
    const snapFatal = scheduler.getHealthSnapshot();
    assert.strictEqual(snapFatal.status, 'fatal');
    assert.strictEqual(snapFatal.liveness, false);
    assert.strictEqual(snapFatal.readiness, false);
    assert.strictEqual(snapFatal.nextTickAtUtc, null);
    assert.strictEqual(fatalCalled, 1);
  });

  // --- TC09-TC13: Distributed Lock verification, release & lost-session checks ---
  await asyncTest('TC09-TC13: Lock negative rc, lost-session detection, APPLOCK_MODE pre-release check & skip behavior work safely', async () => {
    const emittedLogs = [];
    const skippedSummary = await workerJob.runLoyaltyCycleWorker({
      emitStructuredLogs: true,
      logger: (e) => emittedLogs.push(e),
      acquireLockFn: async () => ({ acquired: false, lockResult: -1, lockPool: null, sessionState: { lockLost: false } })
    });
    assert.strictEqual(skippedSummary.skippedDueToLock, true);
    assert.strictEqual(skippedSummary.lockStatus, 'not_acquired');
    assert.ok(emittedLogs.some((e) => e.event === 'loyalty_lock_not_acquired'));

    // Lost session detected cleanly by verifySessionLockHeld
    await assert.rejects(
      () => workerJob.verifySessionLockHeld({
        lockPool: {
          connected: true,
          request: () => ({
            input() { return this; },
            async query() { return { recordset: [{ lock_mode: 'NoLock' }] }; }
          })
        },
        sessionState: { lockLost: false }
      }),
      /no longer holds VAMOS_LOYALTY_CYCLE_WORKER_LOCK/
    );

    // releaseSessionAppLock safely closes pool without throwing when session lost or NoLock
    let closedLost = false;
    const relLost = await workerJob.releaseSessionAppLock({
      connected: true,
      request: () => ({
        input() { return this; },
        async query() { return { recordset: [{ lock_mode: 'NoLock' }] }; }
      }),
      async close() { closedLost = true; }
    }, { logger: (e) => emittedLogs.push(e) });
    assert.strictEqual(relLost.released, false);
    assert.strictEqual(relLost.reason, 'lock_not_held_by_session');
    assert.strictEqual(closedLost, true);
    assert.ok(emittedLogs.some((e) => e.event === 'loyalty_lock_release_failed'));

    // Normal release executes sp_releaseapplock cleanly
    let releaseSqlRan = false;
    let closedOk = false;
    const relOk = await workerJob.releaseSessionAppLock({
      connected: true,
      request: () => ({
        input() { return this; },
        async query(q) {
          if (q.includes('SELECT APPLOCK_MODE')) return { recordset: [{ lock_mode: 'Exclusive' }] };
          if (q.includes('sp_releaseapplock')) {
            releaseSqlRan = true;
            return { recordset: [{ release_result: 0 }] };
          }
          return { recordset: [] };
        }
      }),
      async close() { closedOk = true; }
    }, { logger: (e) => emittedLogs.push(e) });
    assert.strictEqual(relOk.released, true);
    assert.strictEqual(releaseSqlRan, true);
    assert.strictEqual(closedOk, true);
    assert.ok(emittedLogs.some((e) => e.event === 'loyalty_lock_released'));
  });

  // --- TC15-TC20: Per-item error isolation, systemic fail-fast, bounded 1205 deadlock retry & uncertain commit no-retry ---
  await asyncTest('TC15-TC20: Per-item invariant errors isolate without PII; systemic errors abort; 1205 retries cleanly; uncertain commit never retries', async () => {
    const jsonLogs = [];
    let released = false;

    const fakeLockPool = {
      connected: true,
      request: () => ({
        input() { return this; },
        async query(sqlText) {
          if (sqlText.includes('SELECT SYSUTCDATETIME()')) return { recordset: [{ db_now: new Date('2026-11-26T10:05:00.000Z') }] };
          if (sqlText.includes('FROM loyalty_point_batches')) {
            return { recordset: [{ id: 101, user_id: 11 }, { id: 102, user_id: 12 }] };
          }
          if (sqlText.includes('FROM user_points_wallets')) {
            return { recordset: [{ user_id: 21 }, { user_id: 22 }] };
          }
          return { recordset: [] };
        }
      })
    };

    let batch102Attempts = 0;
    const summary = await workerJob.runLoyaltyCycleWorker({
      trigger: 'hourly',
      emitStructuredLogs: true,
      logger: (e) => jsonLogs.push(e),
      acquireLockFn: async () => ({ acquired: true, lockResult: 0, lockPool: fakeLockPool, sessionState: { lockLost: false } }),
      verifyLockFn: async () => 'Exclusive',
      releaseLockFn: async () => { released = true; return { released: true }; },
      retryOptions: { maxRetries: 2, baseDelayMs: 0, sleep: async () => {} },
      expireBatchFn: async (_pool, batchId) => {
        if (batchId === 101) {
          throw new Error('[INVARIANT VIOLATION] user secret@customer.vn balance mismatch');
        }
        batch102Attempts++;
        if (batch102Attempts === 1) {
          const dl = new Error('Transaction was deadlocked');
          dl.number = 1205;
          throw dl;
        }
        return { expired: true, skipped: false, batchId, pointsExpired: 400 };
      },
      processWalletFn: async (_pool, userId) => {
        if (userId === 21) {
          throw new Error('[INVARIANT VIOLATION] Corrupt wallet state for password=mysecret');
        }
        return { updated: true, userId, cyclesProcessed: 1 };
      }
    });

    assert.strictEqual(released, true);
    assert.strictEqual(summary.expiredBatches, 1);
    assert.strictEqual(summary.pointsExpiredTotal, 400);
    assert.strictEqual(summary.walletsRolledOver, 1);
    assert.strictEqual(summary.cyclesProcessedTotal, 1);
    assert.strictEqual(summary.failedRecords, 2);
    assert.strictEqual(summary.outcome, 'degraded');
    assert.strictEqual(batch102Attempts, 2, '1205 deadlock must retry once cleanly');

    const logDump = JSON.stringify(jsonLogs);
    assert.ok(!logDump.includes('secret@customer.vn'), 'Logs must redact email PII');
    assert.ok(!logDump.includes('mysecret'), 'Logs must redact sensitive credentials');
    assert.ok(jsonLogs.some((e) => e.event === 'loyalty_job_started'));
    assert.ok(jsonLogs.some((e) => e.event === 'loyalty_job_completed' && e.outcome === 'degraded'));

    // TC17: Systemic DB failure stops worker immediately without processing batch 102
    let batch102CalledAfterSystemic = false;
    await assert.rejects(
      () => workerJob.runLoyaltyCycleWorker({
        emitStructuredLogs: true,
        logger: (e) => jsonLogs.push(e),
        acquireLockFn: async () => ({ acquired: true, lockResult: 0, lockPool: fakeLockPool, sessionState: { lockLost: false } }),
        verifyLockFn: async () => 'Exclusive',
        releaseLockFn: async () => ({ released: true }),
        expireBatchFn: async (_pool, batchId) => {
          if (batchId === 101) {
            const err = new Error('Invalid object name dbo.loyalty_point_batches');
            err.number = 208;
            throw err;
          }
          batch102CalledAfterSystemic = true;
          return { expired: true, pointsExpired: 100 };
        }
      }),
      /Invalid object name/
    );
    assert.strictEqual(batch102CalledAfterSystemic, false);
    assert.ok(jsonLogs.some((e) => e.event === 'loyalty_job_failed'));

    // TC18 & TC19: Deadlock bounded retries & NEVER retry if commit outcome uncertain
    let dlAttempts = 0;
    await assert.rejects(
      () => workerJob.executeWithDeadlockRetry(async () => {
        dlAttempts++;
        const err = new Error('Deadlocked again');
        err.number = 1205;
        throw err;
      }, { maxRetries: 2, baseDelayMs: 0, sleep: async () => {} }),
      /Deadlocked again/
    );
    assert.strictEqual(dlAttempts, 3, 'Initial attempt + 2 retries = 3 total max');

    const OrigTx = sql.Transaction;
    const OrigReq = sql.Request;
    let commitCallCount = 0;
    sql.Transaction = class {
      async begin() {}
      async commit() {
        commitCallCount++;
        const err = new Error('Deadlock or connection drop during commit');
        err.number = 1205;
        throw err;
      }
      async rollback() {}
    };
    sql.Request = class {
      input() { return this; }
      async query(q) {
        if (q.includes('FROM user_points_wallets')) return { recordset: [{ user_id: 1, available_points: 500 }] };
        if (q.includes('FROM loyalty_point_batches')) {
          return { recordset: [{ id: 5, user_id: 1, remaining_points: 100, status: 'ACTIVE', expires_at: new Date('2025-01-01T00:00:00Z') }] };
        }
        return { recordset: [] };
      }
    };
    try {
      await assert.rejects(
        () => workerJob.executeWithDeadlockRetry(
          () => workerJob.expireSingleBatch({}, 5, 1, new Date('2026-01-01T00:00:00Z')),
          { maxRetries: 2, baseDelayMs: 0, sleep: async () => {} }
        ),
        /Deadlock or connection drop during commit/
      );
      assert.strictEqual(commitCallCount, 1, 'Uncertain commit failure MUST NOT retry');
    } finally {
      sql.Transaction = OrigTx;
      sql.Request = OrigReq;
    }
  });

  // --- TC21-TC31: Lifecycle, DB readiness wait, SIGTERM grace shutdown, Health endpoints & Web separation ---
  await asyncTest('TC21-TC31: Worker waits for DB readiness, exposes accurate live/ready health endpoints, and shuts down gracefully on SIGTERM', async () => {
    let dbProbeCount = 0;
    let cleanupCalled = false;
    let exitCodeSeen = null;
    let jobRelease = null;
    const jobRunningGate = new Promise((res) => { jobRelease = res; });

    const runtime = createDedicatedLoyaltyWorkerRuntime({
      allowInTest: true,
      healthPort: 0,
      gracePeriodMs: 1000,
      exitFn: (code) => { exitCodeSeen = code; },
      checkDbReady: async () => {
        dbProbeCount++;
        return dbProbeCount >= 2;
      },
      runJob: async ({ trigger }) => {
        if (trigger === 'startup_catchup') {
          await jobRunningGate;
        }
        return { outcome: 'success', failedRecords: 0, skippedDueToLock: false };
      },
      schedulerOptions: {
        dbReadyRetryMs: 5,
        sleepFn: (ms) => new Promise((r) => setTimeout(r, Math.min(ms, 10))),
        onCleanup: async () => { cleanupCalled = true; },
        onLog: () => {}
      }
    });

    // While starting, let's launch start() asynchronously and poll health endpoint
    const startPromise = runtime.start();
    await new Promise((r) => setTimeout(r, 40));

    // Check health snapshot while job running
    const snapRunning = runtime.getHealthSnapshot();
    assert.strictEqual(snapRunning.status, 'running');
    assert.strictEqual(snapRunning.liveness, true);
    assert.strictEqual(snapRunning.readiness, true);

    // Finish startup job so runtime transitions ready and exposes port cleanly
    jobRelease();
    const booted = await startPromise;
    assert.ok(dbProbeCount >= 2, 'Worker must retry DB readiness probe before startup catch-up');
    const port = booted.healthAddress.port;

    const liveRes = await httpGetJson(`http://127.0.0.1:${port}/health/live`);
    const readyRes = await httpGetJson(`http://127.0.0.1:${port}/health/ready`);
    assert.strictEqual(liveRes.status, 200);
    assert.strictEqual(readyRes.status, 200);
    assert.strictEqual(liveRes.body.status, 'ready');
    assert.ok(!('password' in liveRes.body) && !('email' in liveRes.body));

    await runtime.shutdown('SIGTERM', 0);
    assert.strictEqual(cleanupCalled, true);
    assert.strictEqual(exitCodeSeen, 0);

    // Health server test for starting/stopping/fatal 503 readiness
    let mockSnap = { status: 'starting', liveness: true, readiness: false };
    const hSrv = createWorkerHealthServer({ getHealthSnapshot: () => mockSnap, port: 0 });
    const hAddr = await hSrv.start();
    try {
      const startLive = await httpGetJson(`http://127.0.0.1:${hAddr.port}/health/live`);
      const startReady = await httpGetJson(`http://127.0.0.1:${hAddr.port}/health/ready`);
      assert.strictEqual(startLive.status, 200);
      assert.strictEqual(startReady.status, 503);

      mockSnap = { status: 'degraded', liveness: true, readiness: true };
      const degReady = await httpGetJson(`http://127.0.0.1:${hAddr.port}/health/ready`);
      assert.strictEqual(degReady.status, 200);

      mockSnap = { status: 'fatal', liveness: false, readiness: false };
      const fatLive = await httpGetJson(`http://127.0.0.1:${hAddr.port}/health/live`);
      const fatReady = await httpGetJson(`http://127.0.0.1:${hAddr.port}/health/ready`);
      assert.strictEqual(fatLive.status, 503);
      assert.strictEqual(fatReady.status, 503);
    } finally {
      await hSrv.close();
    }
  });

  // --- TC25, TC32-TC34 & Compose Separation Guards ---
  test('TC25 & TC32-TC34: Express server never imports worker; worker never imports backfill or init_mssql; Compose profile isolated', () => {
    const serverSrc = fs.readFileSync(path.resolve(__dirname, '../server.js'), 'utf8');
    const appSrc = fs.readFileSync(path.resolve(__dirname, '../src/app.js'), 'utf8');
    const workerSrc = fs.readFileSync(path.resolve(__dirname, '../src/workers/loyaltyWorker.js'), 'utf8');
    const schedulerSrc = fs.readFileSync(path.resolve(__dirname, '../src/services/loyaltyScheduler.service.js'), 'utf8');
    const jobSrc = fs.readFileSync(path.resolve(__dirname, '../src/jobs/processLoyaltyCycle.js'), 'utf8');
    const composeSrc = fs.readFileSync(path.resolve(__dirname, '../docker-compose.yml'), 'utf8');

    assert.ok(!/loyaltyWorker|loyaltyScheduler|processLoyaltyCycle/.test(serverSrc), 'server.js must not import worker/scheduler');
    assert.ok(!/loyaltyWorker|loyaltyScheduler|processLoyaltyCycle/.test(appSrc), 'src/app.js must not import worker/scheduler');

    for (const s of [workerSrc, schedulerSrc, jobSrc]) {
      assert.ok(!/require\([^)]*backfillLoyaltyHistory/i.test(s), 'Worker/scheduler must NEVER import backfillLoyaltyHistory');
      assert.ok(!/--apply|--confirm-apply/.test(s), 'Worker/scheduler must NEVER invoke backfill apply flags');
      assert.ok(!/require\([^)]*init_mssql/i.test(s), 'Worker/scheduler must NEVER import init_mssql');
    }

    assert.ok(/loyalty-worker:/.test(composeSrc), 'docker-compose.yml must define loyalty-worker service');
    assert.ok(/profiles:\s*\["loyalty-worker"\]/.test(composeSrc), 'loyalty-worker must stay opt-in under Compose profile');
    assert.ok(/command:\s*\["npm",\s*"run",\s*"loyalty:worker"\]/.test(composeSrc));
    assert.ok(/init:\s*true/.test(composeSrc));
    assert.ok(/stop_grace_period:/.test(composeSrc));
  });

  assertSummary();
}

main().catch((err) => {
  console.error('[FATAL SCHEDULER UNIT SUITE ERROR]:', err);
  process.exitCode = 1;
});
