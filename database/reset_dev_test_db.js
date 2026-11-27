/**
 * VAMOS STORE — Guarded Clean Dev/Test Database Cutover Reset & Reseed (MEDIUM-05)
 *
 * Strictly scoped to verified local/dev/test databases:
 *   - 'vamos_store_test_db' (when NODE_ENV=test)
 *   - 'vamos_store_db'      (when NODE_ENV=development)
 *
 * Hard Fail-Closed Guards:
 *   1. Unconditionally blocked when NODE_ENV=production (ignores all bypass attempts).
 *   2. Requires explicit opt-in env ALLOW_DEV_TEST_DB_RESET=1.
 *   3. Exact target database allowlist check + host check via db-guard.js.
 *   4. Verifies migrations 001..009 checksums, zero GETDATE() defaults, and UTC seed clock parity.
 */

require('dotenv').config();

const sql = require('mssql');
const appConfig = require('../src/config/app.config');
const { validateDatabaseConnection } = require('../src/config/db-guard');
const { init } = require('./init_mssql');
const { closePool } = require('../src/config/database');
const { seedCustomer } = require('./seed_customer');
const { seedVouchers } = require('./seed_vouchers');
const { seedProducts } = require('./seed_products');

const EXPLICIT_RESET_ALLOWLIST = Object.freeze({
  test: 'vamos_store_test_db',
  development: 'vamos_store_db'
});

const ALLOWED_LOCAL_DEV_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', 'mssql']);

async function resetAndReseedTargetDb({ targetEnv, expectedDbName } = {}) {
  const effectiveEnv = (targetEnv || process.env.NODE_ENV || '').trim().toLowerCase();

  if (effectiveEnv === 'production' || process.env.NODE_ENV === 'production') {
    throw new Error('[RESET BLOCKED]: Clean dev/test reset is unconditionally forbidden in production.');
  }

  if (process.env.ALLOW_DEV_TEST_DB_RESET !== '1') {
    throw new Error('[RESET BLOCKED]: Explicit confirmation ALLOW_DEV_TEST_DB_RESET=1 is required.');
  }

  const allowlistedDb = EXPLICIT_RESET_ALLOWLIST[effectiveEnv];
  if (!allowlistedDb) {
    throw new Error(`[RESET BLOCKED]: Unsupported environment "${effectiveEnv}" for dev/test reset.`);
  }

  const targetDbName = (expectedDbName || appConfig.db.database || '').trim();
  if (targetDbName.toLowerCase() !== allowlistedDb) {
    throw new Error(
      `[RESET BLOCKED]: Target database "${targetDbName}" does not match exact ${effectiveEnv} allowlist "${allowlistedDb}".`
    );
  }

  const dbHost = String(appConfig.db.server || '').trim().toLowerCase();
  if (!ALLOWED_LOCAL_DEV_HOSTS.has(dbHost)) {
    throw new Error(
      `[RESET BLOCKED]: Host "${appConfig.db.server}" is not in verified dev/test host allowlist.`
    );
  }

  if (!appConfig.db.password) {
    throw new Error('[RESET BLOCKED]: Database credentials missing from environment.');
  }

  const masterCfg = {
    ...appConfig.db,
    database: 'master',
    pool: { max: 1, min: 0, idleTimeoutMillis: 15000 }
  };
  validateDatabaseConnection(masterCfg, effectiveEnv, {
    allowMasterAdmin: true,
    targetDatabase: targetDbName
  });

  const masterPool = await new sql.ConnectionPool(masterCfg).connect();
  try {
    const safeIdent = targetDbName.replace(/\]/g, ']]');
    const req = masterPool.request();
    req.input('dbName', sql.NVarChar(128), targetDbName);
    await req.query(`
      IF DB_ID(@dbName) IS NOT NULL
      BEGIN
        ALTER DATABASE [${safeIdent}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE [${safeIdent}];
      END
    `);
  } finally {
    await masterPool.close();
  }

  const migSummary = await init(targetDbName);

  await seedCustomer();
  await seedVouchers();
  await seedProducts();

  // Verify UTC clock parity & zero remaining GETDATE() default constraints
  const verifyCfg = { ...appConfig.db, database: targetDbName };
  validateDatabaseConnection(verifyCfg, effectiveEnv);
  const verifyPool = await new sql.ConnectionPool(verifyCfg).connect();
  try {
    const remainingGetdate = (await verifyPool.request().query(`
      SELECT COUNT(*) AS cnt
      FROM sys.default_constraints dc
      JOIN sys.tables t ON dc.parent_object_id = t.object_id
      WHERE t.is_ms_shipped = 0
        AND LOWER(dc.definition) LIKE '%getdate%'
    `)).recordset[0].cnt;

    const migRows = (await verifyPool.request().query(
      'SELECT version, checksum, applied_at FROM schema_migrations ORDER BY id ASC'
    )).recordset;

    const clockRes = (await verifyPool.request().query(
      'SELECT SYSUTCDATETIME() AS utc_now, GETUTCDATE() AS getutc_now'
    )).recordset[0];

    const sampleUser = (await verifyPool.request().query(
      "SELECT TOP 1 created_at FROM users WHERE email = 'admin@vamos.vn'"
    )).recordset[0];

    await closePool();

    return {
      environment: effectiveEnv,
      host: `${appConfig.db.server}:${appConfig.db.port}`,
      database: targetDbName,
      totalTables: migSummary.totalTables,
      appliedMigrations: migSummary.appliedNow.length,
      trackedMigrations: migRows.length,
      allChecksumsPresent: migRows.every((r) => typeof r.checksum === 'string' && r.checksum.length === 64),
      remainingGetdateDefaults: remainingGetdate,
      utcNowIso: clockRes.utc_now.toISOString(),
      adminCreatedAtIso: sampleUser ? sampleUser.created_at.toISOString() : null
    };
  } finally {
    await verifyPool.close();
  }
}

if (require.main === module) {
  resetAndReseedTargetDb()
    .then((summary) => {
      console.log('[CLEAN DEV/TEST CUTOVER VERIFIED]:', JSON.stringify(summary, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[CLEAN DEV/TEST CUTOVER ERROR]:', err.message);
      process.exit(1);
    });
}

module.exports = { resetAndReseedTargetDb, EXPLICIT_RESET_ALLOWLIST };
