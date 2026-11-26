/**
 * Database Bootstrap & Hardened Migration Runner for VAMOS STORE
 * Target Database: Microsoft SQL Server (T-SQL)
 * Guarantees:
 * - Fail-closed environment isolation via src/config/db-guard.js
 * - Session-pinned sp_getapplock preventing concurrent multi-process migrations
 * - Per-migration SQL Server Transaction with SET XACT_ABORT ON + atomic tracking insert
 * - State-aware T-SQL GO batch parser
 * - Numeric migration version ordering, duplicate/orphan rejection, & SHA-256 checksum integrity
 */

const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const appConfig = require('../src/config/app.config');
const { validateDatabaseConnection } = require('../src/config/db-guard');
const { splitSqlBatches, discoverMigrationFiles } = require('./lib/tsqlBatchParser');

const baseConfig = appConfig.db;
const DEFAULT_MIGRATION_LOCK_TIMEOUT_MS = 30000;

const initialSeedsSql = `
-- Seed default Sizes
IF NOT EXISTS (SELECT 1 FROM sizes)
BEGIN
    INSERT INTO sizes (size_name, display_order) VALUES
    ('38', 1), ('39', 2), ('40', 3), ('41', 4), ('42', 5), ('43', 6), ('44', 7);
END

-- Seed default Colors
IF NOT EXISTS (SELECT 1 FROM colors)
BEGIN
    INSERT INTO colors (color_name, hex_code) VALUES
    (N'Đen', '#000000'), (N'Trắng', '#FFFFFF'), (N'Xanh Navy', '#000080'), (N'Xám', '#808080'), (N'Đỏ Đô', '#800000');
END

-- Seed default Categories
IF NOT EXISTS (SELECT 1 FROM categories)
BEGIN
    INSERT INTO categories (name, slug, description, is_active) VALUES
    (N'Sneaker Nam', 'sneaker-nam', N'Giày sneaker thời trang dành cho nam', 1),
    (N'Sneaker Nữ', 'sneaker-nu', N'Giày sneaker nữ trẻ trung, năng động', 1),
    (N'Giày Thể Thao', 'giay-the-thao', N'Giày chuyên chạy bộ và tập gym', 1),
    (N'Sandal & Dép', 'sandal-dep', N'Sandal quai dù và dép thời trang', 1);
END

-- Seed default Brands
IF NOT EXISTS (SELECT 1 FROM brands)
BEGIN
    INSERT INTO brands (name, slug, description) VALUES
    ('VAMOS Originals', 'vamos-originals', N'Dòng sneaker cổ điển mang tính biểu tượng'),
    ('VAMOS Sport', 'vamos-sport', N'Dòng giày thể thao hiệu năng cao'),
    ('VAMOS Active', 'vamos-active', N'Dòng sản phẩm sandal ngoài trời năng động');
END

-- Seed default Banner
IF NOT EXISTS (SELECT 1 FROM banners)
BEGIN
    INSERT INTO banners (title, image_url, link_url, display_order, is_active) VALUES
    (N'MOVE YOUR WAY - BỘ SƯU TẬP 2026', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1600&q=80', '/products', 1, 1);
END
`;

/**
 * Acquire an exclusive session-scoped SQL Server application lock on a pinned single-connection pool.
 */
async function acquireMigrationAppLock(pinnedPool, resourceName, lockTimeoutMs = DEFAULT_MIGRATION_LOCK_TIMEOUT_MS) {
  const timeout = Number.isSafeInteger(lockTimeoutMs) && lockTimeoutMs >= 0
    ? lockTimeoutMs
    : DEFAULT_MIGRATION_LOCK_TIMEOUT_MS;

  const req = pinnedPool.request();
  req.input('resource', sql.NVarChar(255), resourceName);
  req.input('timeoutMs', sql.Int, timeout);
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
    throw new Error(
      `[MIGRATION LOCK TIMEOUT]: Failed to acquire exclusive migration lock "${resourceName}" within ${timeout}ms (sp_getapplock code=${lockResult}).`
    );
  }
  return lockResult;
}

/**
 * Release the session-scoped application lock cleanly.
 */
async function releaseMigrationAppLock(pinnedPool, resourceName) {
  if (!pinnedPool) return;
  try {
    const req = pinnedPool.request();
    req.input('resource', sql.NVarChar(255), resourceName);
    await req.query(`
      IF APPLOCK_MODE('public', @resource, 'Session') <> 'NoLock'
      BEGIN
        EXEC sp_releaseapplock @Resource = @resource, @LockOwner = 'Session';
      END
    `);
  } catch (err) {
    console.warn('[MIGRATION LOCK RELEASE WARNING]:', err.message);
  }
}

/**
 * Ensure schema_migrations tracking table exists (with checksum column on fresh installations).
 */
async function ensureSchemaMigrationsTable(pinnedPool) {
  await pinnedPool.request().query(`
    IF OBJECT_ID('schema_migrations', 'U') IS NULL
    BEGIN
      CREATE TABLE schema_migrations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        version VARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(255) NOT NULL,
        applied_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        checksum VARCHAR(64) NULL,
        CONSTRAINT chk_schema_migrations_checksum CHECK (checksum IS NULL OR LEN(checksum) = 64)
      );
    END
  `);
}

/**
 * Load applied migration records, supporting both pre-008 (no checksum column) and post-008 schemas.
 */
async function loadExistingMigrations(pinnedPool) {
  const colRes = await pinnedPool.request().query(`
    SELECT COL_LENGTH('schema_migrations', 'checksum') AS checksum_len
  `);
  const hasChecksumColumn = colRes.recordset[0]?.checksum_len !== null;

  const querySql = hasChecksumColumn
    ? 'SELECT id, version, description, applied_at, checksum FROM schema_migrations ORDER BY id ASC'
    : 'SELECT id, version, description, applied_at FROM schema_migrations ORDER BY id ASC';

  const rows = await pinnedPool.request().query(querySql);
  const trackedMap = new Map();
  for (const row of rows.recordset) {
    trackedMap.set(row.version, {
      ...row,
      checksum: hasChecksumColumn ? row.checksum : null
    });
  }
  return { hasChecksumColumn, trackedMap };
}

/**
 * Execute one pending migration file inside a single atomic SQL Server transaction (with SET XACT_ABORT ON)
 * and record its tracking entry inside the exact same transaction.
 */
async function applySingleMigration(pinnedPool, migration, options = {}) {
  const sqlContent = fs.readFileSync(migration.fullPath, 'utf8');
  const batches = splitSqlBatches(sqlContent);
  if (batches.length === 0) {
    throw new Error(`[MIGRATION EMPTY]: Migration file "${migration.file}" contains no executable SQL batches.`);
  }

  const tx = new sql.Transaction(pinnedPool);
  await tx.begin();

  try {
    await new sql.Request(tx).query('SET XACT_ABORT ON;');

    for (let idx = 0; idx < batches.length; idx++) {
      if (process.env.NODE_ENV === 'test' && typeof options._testFailHook === 'function') {
        await options._testFailHook({
          stage: 'before_batch',
          version: migration.version,
          file: migration.file,
          batchIndex: idx,
          totalBatches: batches.length,
          tx
        });
      }
      try {
        await new sql.Request(tx).query(batches[idx]);
      } catch (batchErr) {
        throw new Error(
          `[MIGRATION BATCH FAILED] ${migration.file} at batch ${idx + 1}/${batches.length}: ${batchErr.message}`
        );
      }
    }

    if (process.env.NODE_ENV === 'test' && typeof options._testFailHook === 'function') {
      await options._testFailHook({
        stage: 'before_tracking_insert',
        version: migration.version,
        file: migration.file,
        totalBatches: batches.length,
        tx
      });
    }

    const txColRes = await new sql.Request(tx).query(`
      SELECT COL_LENGTH('schema_migrations', 'checksum') AS checksum_len
    `);
    const txHasChecksum = txColRes.recordset[0]?.checksum_len !== null;

    const logMig = new sql.Request(tx);
    logMig.input('v', sql.VarChar(50), migration.version);
    logMig.input('desc', sql.NVarChar(255), `Migration applied from ${migration.file}`);

    if (txHasChecksum) {
      logMig.input('checksum', sql.VarChar(64), migration.checksum);
      await logMig.query(
        'INSERT INTO schema_migrations (version, description, checksum) VALUES (@v, @desc, @checksum)'
      );
    } else {
      await logMig.query(
        'INSERT INTO schema_migrations (version, description) VALUES (@v, @desc)'
      );
    }

    await tx.commit();
  } catch (err) {
    try {
      await tx.rollback();
    } catch (rbErr) {
      console.error(`[MIGRATION ROLLBACK ERROR] ${migration.file}:`, rbErr.message);
    }
    throw err;
  }
}

/**
 * Run version discovery, tracking validation, checksum checks, and transactional migrations on pinnedPool.
 */
async function executeMigrationsOnSession(pinnedPool, options = {}) {
  const migrationsDir = options.migrationsDir || path.join(__dirname, 'migrations');
  const { files, sequenceGaps } = discoverMigrationFiles(migrationsDir);

  if (sequenceGaps.length > 0) {
    console.warn(`[MIGRATION SEQUENCE WARNING] Missing sequence number(s): ${sequenceGaps.join(', ')}`);
  }

  const { trackedMap } = await loadExistingMigrations(pinnedPool);
  const discoveredVersions = new Set(files.map((m) => m.version));

  for (const trackedVersion of trackedMap.keys()) {
    if (!discoveredVersions.has(trackedVersion)) {
      throw new Error(
        `[MIGRATION FILE MISSING]: Tracked migration "${trackedVersion}" exists in schema_migrations but its SQL file is missing from "${migrationsDir}".`
      );
    }
  }

  const maxVersionNum = Number.isSafeInteger(options.maxVersionNum) ? options.maxVersionNum : Infinity;
  const legacyUnverified = [];
  const appliedNow = [];

  for (const migration of files) {
    if (migration.versionNum > maxVersionNum) {
      continue;
    }

    const existing = trackedMap.get(migration.version);
    if (existing) {
      if (existing.checksum === null || existing.checksum === undefined) {
        legacyUnverified.push(migration.version);
        console.log(`Migration ${migration.file} already applied (LEGACY_UNVERIFIED — checksum NULL preserved). Skipping.`);
      } else if (existing.checksum !== migration.checksum) {
        throw new Error(
          `[MIGRATION CHECKSUM MISMATCH]: "${migration.file}" SHA-256 changed after execution (recorded=${existing.checksum}, actual=${migration.checksum}).`
        );
      } else {
        console.log(`Migration ${migration.file} already applied. Skipping.`);
      }
      continue;
    }

    console.log(`Applying migration: ${migration.file}...`);
    await applySingleMigration(pinnedPool, migration, options);
    appliedNow.push(migration.version);
    console.log(`✅ Applied migration: ${migration.file}`);
  }

  return { appliedNow, legacyUnverified, sequenceGaps };
}

async function seedReferenceAndAdminData(pinnedPool) {
  console.log('\n3. Running initial master data seeds (if not already seeded)...');
  await pinnedPool.request().query(initialSeedsSql);
  console.log('✅ Initial master data seeds verified.');

  console.log('Verifying Admin account...');
  const adminCheck = await pinnedPool.request().query("SELECT id, email, role FROM users WHERE email = 'admin@vamos.vn'");
  if (adminCheck.recordset.length > 0) {
    console.log('Admin account (admin@vamos.vn) already exists. Preserving existing account and credentials.');
    return;
  }

  const adminPass = process.env.ADMIN_DEFAULT_PASSWORD ? process.env.ADMIN_DEFAULT_PASSWORD.trim() : '';
  const weakPasswords = ['12345678', 'password', 'admin123', 'admin1234', 'admin12345', 'qwerty123', 'root1234', 'vamos123'];
  if (!adminPass || adminPass.length < 8) {
    throw new Error('SECURITY HALT: Seeding a new Admin account requires ADMIN_DEFAULT_PASSWORD environment variable with at least 8 characters. Please configure ADMIN_DEFAULT_PASSWORD before running initial bootstrap.');
  }
  if (weakPasswords.includes(adminPass.toLowerCase())) {
    throw new Error('SECURITY HALT: Provided ADMIN_DEFAULT_PASSWORD is too weak (common dictionary phrase). Please configure a strong, unique administrator password.');
  }
  const adminHash = bcrypt.hashSync(adminPass, 10);
  const seedAdminReq = pinnedPool.request();
  seedAdminReq.input('adminHash', sql.NVarChar, adminHash);
  await seedAdminReq.query(`
    INSERT INTO users (full_name, email, password_hash, phone, role, status)
    VALUES (N'Quản Trị Viên VAMOS', 'admin@vamos.vn', @adminHash, '0905123456', 'ADMIN', 'active');
  `);
  console.log('✅ Admin account seeded securely with parameterized query.');
}

async function ensureTargetDatabaseExists(masterConfig, targetDbName, lockTimeoutMs) {
  const createLockResource = `VAMOS_DB_CREATE_${targetDbName.toLowerCase()}`;
  let masterPool = null;
  let createLockAcquired = false;
  try {
    masterPool = await new sql.ConnectionPool(masterConfig).connect();
    await acquireMigrationAppLock(masterPool, createLockResource, lockTimeoutMs);
    createLockAcquired = true;

    const checkDbReq = masterPool.request();
    checkDbReq.input('dbName', targetDbName);
    const dbRes = await checkDbReq.query('SELECT database_id FROM sys.databases WHERE name = @dbName');

    if (dbRes.recordset.length === 0) {
      console.log(`Target database "${targetDbName}" not found. Creating database...`);
      const safeDbName = targetDbName.replace(/\]/g, ']]');
      await masterPool.request().query(`CREATE DATABASE [${safeDbName}] COLLATE SQL_Latin1_General_CP1_CI_AS;`);
      console.log(`✅ Created database "${targetDbName}" successfully.`);
    } else {
      console.log(`Database "${targetDbName}" already exists. Proceeding without dropping.`);
    }
  } finally {
    if (masterPool && createLockAcquired) {
      await releaseMigrationAppLock(masterPool, createLockResource);
    }
    if (masterPool) {
      try { await masterPool.close(); } catch (closeErr) { console.warn('[MASTER POOL CLOSE WARNING]:', closeErr.message); }
    }
  }
}

async function init(dbNameOverride, options = {}) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_INIT !== 'true') {
    throw new Error('PRODUCTION SAFETY GUARD: Running database init in PRODUCTION is blocked. Set ALLOW_PRODUCTION_INIT=true if explicitly intended.');
  }

  let targetPool = null;
  const targetDbName = dbNameOverride || baseConfig.database || 'vamos_store_db';
  const targetConfig = {
    ...baseConfig,
    database: targetDbName,
    pool: { max: 1, min: 1, idleTimeoutMillis: 30000 }
  };
  const lockResource = `VAMOS_MIGRATION_LOCK_${targetDbName.toLowerCase()}`;
  let lockAcquired = false;

  try {
    console.log('===============================================================');
    console.log('   VAMOS STORE - DATABASE BOOTSTRAP & NON-DESTRUCTIVE MIGRATOR');
    console.log(`   Target Server: ${baseConfig.server}:${baseConfig.port}`);
    console.log(`   Target Database: ${targetDbName}`);
    console.log('===============================================================\n');

    // 1. Connect to 'master' via dedicated pool + sp_getapplock to ensure target database exists safely
    console.log('1. Connecting to master database to verify target database...');
    const masterConfig = { ...baseConfig, database: 'master', pool: { max: 1, min: 1, idleTimeoutMillis: 15000 } };
    validateDatabaseConnection(masterConfig, process.env.NODE_ENV, {
      allowMasterAdmin: true,
      targetDatabase: targetDbName
    });
    await ensureTargetDatabaseExists(masterConfig, targetDbName, options.lockTimeoutMs);

    // 2. Connect to target database on a single pinned session so sp_getapplock & all migration transactions share @@SPID
    console.log(`\n2. Connecting to "${targetDbName}" to run versioned migrations...`);
    validateDatabaseConnection(targetConfig, process.env.NODE_ENV);
    targetPool = await new sql.ConnectionPool(targetConfig).connect();

    await acquireMigrationAppLock(targetPool, lockResource, options.lockTimeoutMs);
    lockAcquired = true;

    await ensureSchemaMigrationsTable(targetPool);
    const migSummary = await executeMigrationsOnSession(targetPool, options);

    if (!options.skipSeeds) {
      await seedReferenceAndAdminData(targetPool);
    }

    const countRes = await targetPool.request().query('SELECT COUNT(*) AS total_tables FROM sys.tables');
    console.log(`\n🎉 Success! Total tables in "${targetDbName}": ${countRes.recordset[0].total_tables}`);

    return {
      database: targetDbName,
      totalTables: countRes.recordset[0].total_tables,
      ...migSummary
    };
  } catch (err) {
    console.error('\n❌ [DATABASE INIT ERROR]:', err.message);
    throw err;
  } finally {
    if (targetPool && lockAcquired) {
      await releaseMigrationAppLock(targetPool, lockResource);
    }
    if (targetPool) {
      try { await targetPool.close(); } catch (closeErr) { console.warn('[TARGET POOL CLOSE WARNING]:', closeErr.message); }
    }
  }
}

if (require.main === module) {
  init()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Database bootstrap error:', err);
      process.exit(1);
    });
}

module.exports = {
  init,
  acquireMigrationAppLock,
  releaseMigrationAppLock,
  ensureSchemaMigrationsTable,
  loadExistingMigrations,
  applySingleMigration,
  executeMigrationsOnSession
};
