/**
 * VAMOS STORE — HIGH-01 Real SQL Server Loyalty Worker, Distributed Lock & Lifecycle Integration Tests
 * Uses strictly isolated `vamos_store_test_db` verified via db-guard.js.
 *
 * Covers:
 * 1. Two independent OS processes competing for SQL Server sp_getapplock across two real DB sessions
 * 2. Real DB per-item error isolation (corrupt wallet invariant isolated cleanly while valid batches/cycles complete)
 *    + clean retry after data fix without duplicate POINT_EXPIRATION ledger entries
 * 3. Dedicated worker runtime DB readiness check, startup catch-up, live HTTP /health/live & /health/ready,
 *    SIGTERM graceful shutdown & verification that SQL Server session lock is completely released
 */

require('./test_bootstrap');

const assert = require('node:assert');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const http = require('node:http');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const sql = require('mssql');

const { query, getPool, closePool } = require('../src/config/database');
const loyaltyService = require('../src/services/loyalty.service');
const { runLoyaltyCycleWorker, APPLOCK_RESOURCE } = require('../src/jobs/processLoyaltyCycle');
const { createDedicatedLoyaltyWorkerRuntime } = require('../src/workers/loyaltyWorker');
const { utc, createSuiteRunner } = require('./helpers/loyalty-test-helpers');

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    }).on('error', reject);
  });
}

function runWorkerChildProcess(code, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['-e', code], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'test', DB_TEST_NAME: 'vamos_store_test_db' }
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Child process timeout after ${timeoutMs}ms. stderr=${stderr}`));
    }, timeoutMs);

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('exit', (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode, stdout, stderr, child });
    });
  });
}

async function main() {
  const { asyncTest, assertSummary } = createSuiteRunner('VAMOS STORE - HIGH-01 SQL SERVER WORKER & SCHEDULER INTEGRATION TESTS');
  const runId = `${Date.now()}_${crypto.randomInt(100, 999)}`;
  const trackedUserIds = [];

  async function createIsolatedUser(tag) {
    const email = `h01_${tag}_${runId}_${crypto.randomInt(1000, 9999)}@vamos.test`;
    const hash = await bcrypt.hash(crypto.randomBytes(12).toString('hex'), 4);
    const uRes = await query(`
      INSERT INTO users (full_name, email, password_hash, phone, role, status)
      OUTPUT INSERTED.id
      VALUES (@name, @email, @hash, '0901234567', 'CUSTOMER', 'active')
    `, { name: `HIGH01 ${tag}`, email, hash });
    const uid = uRes.recordset[0].id;
    trackedUserIds.push(uid);
    await loyaltyService.getOrCreateWallet(uid);
    return uid;
  }

  try {
    // --- TEST 1: Two independent OS processes competing for real SQL Server sp_getapplock ---
    await asyncTest('INT-H01-01: Two separate OS processes share SQL sp_getapplock; second process sees not_acquired without overlapping updates', async () => {
      const uid = await createIsolatedUser('lock_proc');
      const pool = await getPool();
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        await loyaltyService.awardOrderPurchasePoints(tx, {
          orderId: 950000000 + uid,
          userId: uid,
          eligibleAmount: 20000, // 600 pts
          txTimeOverride: utc('2024-01-01T00:00:00.000Z')
        });
        await tx.commit();
      } catch (e) {
        await tx.rollback();
        throw e;
      }

      // Child 1 acquires lock, signals HOLDER_LOCKED, holds until parent sends RELEASE on stdin
      const holderReadyPromise = new Promise((resolve, reject) => {
        const holder = spawn(process.execPath, ['-e', `
          require('./tests/test_bootstrap');
          const { acquireSessionAppLock, releaseSessionAppLock } = require('./src/jobs/processLoyaltyCycle');
          (async () => {
            const st = await acquireSessionAppLock(0);
            if (!st.acquired) process.exit(2);
            console.log('HOLDER_LOCKED');
            await new Promise((resRelease) => {
              process.stdin.resume();
              process.stdin.on('data', (chunk) => {
                if (chunk.toString().includes('RELEASE')) resRelease();
              });
              process.stdin.on('end', resRelease);
            });
            await releaseSessionAppLock(st.lockPool);
            console.log('HOLDER_RELEASED');
            process.exit(0);
          })().catch((e) => { console.error(e); process.exit(3); });
        `], {
          cwd: path.resolve(__dirname, '..'),
          env: { ...process.env, NODE_ENV: 'test', DB_TEST_NAME: 'vamos_store_test_db' },
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let out = '';
        let err = '';
        let resolved = false;
        holder.stdout.on('data', (d) => {
          out += d.toString();
          if (!resolved && out.includes('HOLDER_LOCKED')) {
            resolved = true;
            resolve({
              holder,
              releaseAndWait: () => new Promise((resExit) => {
                holder.on('exit', (code) => resExit({ code, out, err }));
                holder.stdin.write('RELEASE\n');
                holder.stdin.end();
              })
            });
          }
        });
        holder.stderr.on('data', (d) => { err += d.toString(); });
        holder.on('exit', (code) => {
          if (!resolved) reject(new Error(`Holder exited early code=${code} err=${err}`));
        });
      });

      const holderHandle = await holderReadyPromise;

      let holderDone;
      try {
        const competitor = await runWorkerChildProcess(`
          require('./tests/test_bootstrap');
          const { runLoyaltyCycleWorker } = require('./src/jobs/processLoyaltyCycle');
          (async () => {
            const sum = await runLoyaltyCycleWorker({ lockTimeoutMs: 0, emitStructuredLogs: true });
            console.log('COMPETITOR_RESULT=' + JSON.stringify(sum));
          })();
        `);
        assert.strictEqual(competitor.exitCode, 0, competitor.stderr);
        const match = competitor.stdout.match(/COMPETITOR_RESULT=(.+)/);
        assert.ok(match, `Expected COMPETITOR_RESULT in stdout: ${competitor.stdout}`);
        const competitorSum = JSON.parse(match[1]);
        assert.strictEqual(competitorSum.skippedDueToLock, true);
        assert.strictEqual(competitorSum.lockStatus, 'not_acquired');
      } finally {
        holderDone = await holderHandle.releaseAndWait();
      }
      assert.strictEqual(holderDone.code, 0);

      // Now lock is released -> worker runs and expires uid batch cleanly once
      const finalSum = await runLoyaltyCycleWorker({ nowOverride: utc('2026-06-01T00:00:00.000Z') });
      assert.strictEqual(finalSum.skippedDueToLock, false);
      assert.ok(finalSum.expiredBatches >= 1);
    });

    // --- TEST 2: Real DB per-item error isolation & safe retry ---
    await asyncTest('INT-H01-02: Per-item invariant failure on one wallet/batch does not block valid batches/cycles, and reruns cleanly after fix', async () => {
      const badUid = await createIsolatedUser('bad_inv');
      const goodUid = await createIsolatedUser('good_item');
      const pool = await getPool();

      for (const targetUid of [badUid, goodUid]) {
        const tx = new sql.Transaction(pool);
        await tx.begin();
        try {
          await loyaltyService.awardOrderPurchasePoints(tx, {
            orderId: 951000000 + targetUid,
            userId: targetUid,
            eligibleAmount: 50000, // 1500 pts -> SILVER
            txTimeOverride: utc('2024-01-01T00:00:00.000Z')
          });
          await tx.commit();
        } catch (e) {
          await tx.rollback();
          throw e;
        }
      }

      // Intentionally corrupt badUid wallet balance below its 1500-pt batch to trigger [INVARIANT VIOLATION]
      await query('UPDATE user_points_wallets SET available_points = 100 WHERE user_id = @uid', { uid: badUid });

      const jsonLogs = [];
      const resDegraded = await runLoyaltyCycleWorker({
        nowOverride: utc('2026-06-01T00:00:00.000Z'),
        trigger: 'hourly',
        emitStructuredLogs: true,
        logger: (e) => jsonLogs.push(e)
      });

      assert.strictEqual(resDegraded.outcome, 'degraded');
      assert.ok(resDegraded.failedRecords >= 1);
      assert.ok(resDegraded.failedDetails.some((d) => d.userId === badUid && d.entityType === 'POINT_BATCH'));
      assert.ok(resDegraded.expiredBatches >= 1, 'Valid user batch must still be expired');
      assert.ok(resDegraded.walletsRolledOver >= 2, 'Cycle rollovers (Phase 2) must still proceed cleanly');

      const goodWallet = (await query('SELECT available_points, tier_code, cycle_number FROM user_points_wallets WHERE user_id = @uid', { uid: goodUid })).recordset[0];
      assert.strictEqual(goodWallet.available_points, 0);
      assert.strictEqual(goodWallet.cycle_number, 3);

      const goodExpCount = (await query("SELECT COUNT(*) AS cnt FROM point_transactions WHERE user_id = @uid AND transaction_type = 'POINT_EXPIRATION'", { uid: goodUid })).recordset[0].cnt;
      assert.strictEqual(goodExpCount, 1);

      // Repair badUid invariant & retry worker -> badUid batch expires, goodUid is untouched (zero duplicates)
      await query('UPDATE user_points_wallets SET available_points = 1500 WHERE user_id = @uid', { uid: badUid });
      const resRecovered = await runLoyaltyCycleWorker({
        nowOverride: utc('2026-06-01T00:00:00.000Z'),
        emitStructuredLogs: true,
        logger: (e) => jsonLogs.push(e)
      });
      assert.strictEqual(resRecovered.outcome, 'success');
      assert.strictEqual(resRecovered.failedRecords, 0);

      const badWalletAfter = (await query('SELECT available_points FROM user_points_wallets WHERE user_id = @uid', { uid: badUid })).recordset[0];
      assert.strictEqual(badWalletAfter.available_points, 0);
      const goodExpCountAfter = (await query("SELECT COUNT(*) AS cnt FROM point_transactions WHERE user_id = @uid AND transaction_type = 'POINT_EXPIRATION'", { uid: goodUid })).recordset[0].cnt;
      assert.strictEqual(goodExpCountAfter, 1, 'Must never duplicate POINT_EXPIRATION tx after retry');
    });

    // --- TEST 3: Live dedicated worker runtime (DB readiness + health server + SIGTERM graceful shutdown + lock release) ---
    await asyncTest('INT-H01-03: Dedicated worker boots cleanly against live SQL Server, serves /health, and releases lock on shutdown', async () => {
      let exitSeen = null;
      const runtime = createDedicatedLoyaltyWorkerRuntime({
        allowInTest: true,
        healthPort: 0,
        gracePeriodMs: 10000,
        exitFn: (code) => { exitSeen = code; },
        schedulerOptions: { onLog: () => {} }
      });

      const booted = await runtime.start();
      assert.strictEqual(booted.scheduler.started, true);
      const port = booted.healthAddress.port;

      const live = await httpGetJson(`http://127.0.0.1:${port}/health/live`);
      const ready = await httpGetJson(`http://127.0.0.1:${port}/health/ready`);
      assert.strictEqual(live.status, 200);
      assert.strictEqual(ready.status, 200);
      assert.ok(ready.body.lastSuccessAtUtc);
      assert.ok(ready.body.nextTickAtUtc);

      await runtime.shutdown('SIGTERM', 0);
      assert.strictEqual(exitSeen, 0);

      // Verify SQL Server distributed lock is completely free after shutdown
      const pool = await getPool();
      const lockOwnerRes = await pool.request()
        .input('res', sql.NVarChar(255), APPLOCK_RESOURCE)
        .query("SELECT APPLOCK_MODE('public', @res, 'Session') AS mode");
      assert.strictEqual(lockOwnerRes.recordset[0].mode, 'NoLock');
    });

    assertSummary();
  } finally {
    try {
      for (const uid of trackedUserIds) {
        await query('DELETE FROM loyalty_point_batches WHERE user_id = @uid', { uid });
        await query('DELETE FROM point_transactions WHERE user_id = @uid', { uid });
        await query('DELETE FROM user_points_wallets WHERE user_id = @uid', { uid });
        await query('DELETE FROM users WHERE id = @uid', { uid });
      }
    } catch (cleanErr) {
      console.warn('[HIGH01 TEST CLEANUP WARNING]:', cleanErr.message);
    }
    await closePool();
  }
}

main().catch((err) => {
  console.error('[FATAL SCHEDULER INTEGRATION SUITE ERROR]:', err);
  process.exitCode = 1;
});
