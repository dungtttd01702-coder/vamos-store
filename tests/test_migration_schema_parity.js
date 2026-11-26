/**
 * VAMOS STORE - MEDIUM-04 SQL Server 2022 Migration Parity, Upgrade, Rollback & Lock Tests
 * Uses strictly allowlisted temporary test databases (`vamos_store_parity_test_db`,
 * `vamos_store_upgrade_test_db`) verified through `db-guard.js` before any CREATE/DROP.
 * NEVER touches development or production databases.
 */

require('./test_bootstrap');

const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const sql = require('mssql');

const appConfig = require('../src/config/app.config');
const { validateDatabaseConnection, ALLOWED_TEST_DATABASES } = require('../src/config/db-guard');
const { splitSqlBatches, computeSha256 } = require('../database/lib/tsqlBatchParser');
const {
  init,
  acquireMigrationAppLock,
  releaseMigrationAppLock
} = require('../database/init_mssql');
const { createSuiteRunner } = require('./helpers/loyalty-test-helpers');

const PARITY_DB = 'vamos_store_parity_test_db';
const UPGRADE_DB = 'vamos_store_upgrade_test_db';
const TEMP_TEST_DBS = [PARITY_DB, UPGRADE_DB];

function assertAuthorizedTempTestDb(dbName) {
  assert.ok(ALLOWED_TEST_DATABASES.has(dbName), `Refusing unauthorized database operation on "${dbName}"`);
  assert.notStrictEqual(dbName, 'vamos_store_test_db', 'Temp suite must not drop primary shared vamos_store_test_db');
  validateDatabaseConnection({ ...appConfig.db, database: 'master' }, 'test', {
    allowMasterAdmin: true,
    targetDatabase: dbName
  });
}

async function openTempPool(dbName) {
  const cfg = { ...appConfig.db, database: dbName, pool: { max: 2, min: 0, idleTimeoutMillis: 15000 } };
  validateDatabaseConnection(cfg, 'test');
  const p = await new sql.ConnectionPool(cfg).connect();
  const dbCheck = (await p.request().query('SELECT DB_NAME() AS current_db')).recordset[0]?.current_db;
  assert.strictEqual(dbCheck?.toLowerCase(), dbName.toLowerCase());
  return p;
}

async function dropDatabaseIfExists(masterPool, dbName) {
  assertAuthorizedTempTestDb(dbName);
  const safeIdent = dbName.replace(/\]/g, ']]');
  const req = masterPool.request();
  req.input('dbName', sql.NVarChar(128), dbName);
  await req.query(`
    IF DB_ID(@dbName) IS NOT NULL
    BEGIN
      ALTER DATABASE [${safeIdent}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      DROP DATABASE [${safeIdent}];
    END
  `);
}

async function createEmptyDatabase(masterPool, dbName) {
  await dropDatabaseIfExists(masterPool, dbName);
  const safeIdent = dbName.replace(/\]/g, ']]');
  await masterPool.request().query(`CREATE DATABASE [${safeIdent}] COLLATE SQL_Latin1_General_CP1_CI_AS;`);
}

async function fetchSchemaCatalog(pool) {
  const tablesRes = await pool.request().query(`
    SELECT t.name AS table_name
    FROM sys.tables t
    WHERE t.is_ms_shipped = 0
    ORDER BY t.name
  `);

  const columnsRes = await pool.request().query(`
    SELECT OBJECT_NAME(c.object_id) AS table_name,
           c.column_id,
           c.name AS column_name,
           TYPE_NAME(c.user_type_id) AS data_type,
           c.max_length,
           c.precision,
           c.scale,
           c.is_nullable
    FROM sys.columns c
    JOIN sys.tables t ON c.object_id = t.object_id
    WHERE t.is_ms_shipped = 0
    ORDER BY OBJECT_NAME(c.object_id), c.column_id
  `);

  const defaultsRes = await pool.request().query(`
    SELECT OBJECT_NAME(dc.parent_object_id) AS table_name,
           COL_NAME(dc.parent_object_id, dc.parent_column_id) AS column_name,
           dc.name AS constraint_name,
           dc.is_system_named,
           dc.definition
    FROM sys.default_constraints dc
    JOIN sys.tables t ON dc.parent_object_id = t.object_id
    WHERE t.is_ms_shipped = 0
    ORDER BY table_name, column_name
  `);

  const checksRes = await pool.request().query(`
    SELECT OBJECT_NAME(cc.parent_object_id) AS table_name,
           cc.name AS constraint_name,
           cc.is_system_named,
           cc.definition
    FROM sys.check_constraints cc
    JOIN sys.tables t ON cc.parent_object_id = t.object_id
    WHERE t.is_ms_shipped = 0
    ORDER BY table_name, cc.is_system_named, constraint_name, cc.definition
  `);

  const uniquesRes = await pool.request().query(`
    SELECT OBJECT_NAME(kc.parent_object_id) AS table_name,
           kc.name AS constraint_name,
           kc.type_desc,
           kc.is_system_named,
           STRING_AGG(COL_NAME(ic.object_id, ic.column_id), ',') WITHIN GROUP (ORDER BY ic.key_ordinal) AS cols
    FROM sys.key_constraints kc
    JOIN sys.tables t ON kc.parent_object_id = t.object_id
    JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
    WHERE t.is_ms_shipped = 0
    GROUP BY kc.parent_object_id, kc.name, kc.type_desc, kc.is_system_named
    ORDER BY table_name, kc.type_desc, cols
  `);

  const fksRes = await pool.request().query(`
    SELECT fk.name AS fk_name,
           OBJECT_NAME(fk.parent_object_id) AS from_table,
           OBJECT_NAME(fk.referenced_object_id) AS to_table,
           fk.delete_referential_action_desc AS on_delete,
           STRING_AGG(
             COL_NAME(fkc.parent_object_id, fkc.parent_column_id) + '->' + COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id),
             ','
           ) WITHIN GROUP (ORDER BY fkc.constraint_column_id) AS col_map
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    GROUP BY fk.name, fk.parent_object_id, fk.referenced_object_id, fk.delete_referential_action_desc
    ORDER BY from_table, fk.name
  `);

  const indexesRes = await pool.request().query(`
    SELECT OBJECT_NAME(i.object_id) AS table_name,
           CASE WHEN i.is_unique_constraint = 1 OR i.is_primary_key = 1 THEN NULL ELSE i.name END AS index_name,
           i.type_desc,
           i.is_unique,
           i.is_primary_key,
           i.is_unique_constraint,
           COALESCE(i.filter_definition, '') AS filter_definition,
           STRING_AGG(
             COL_NAME(ic.object_id, ic.column_id) + ':' + CAST(ic.is_descending_key AS VARCHAR(1)) + ':' + CAST(ic.is_included_column AS VARCHAR(1)),
             ','
           ) WITHIN GROUP (ORDER BY ic.is_included_column, ic.key_ordinal, ic.index_column_id) AS cols
    FROM sys.indexes i
    JOIN sys.tables t ON i.object_id = t.object_id
    JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    WHERE t.is_ms_shipped = 0 AND i.type > 0
    GROUP BY i.object_id, i.name, i.type_desc, i.is_unique, i.is_primary_key, i.is_unique_constraint, i.filter_definition
    ORDER BY table_name, i.is_primary_key DESC, i.is_unique DESC, index_name, cols
  `);

  return {
    tables: tablesRes.recordset.map((r) => r.table_name),
    columns: columnsRes.recordset,
    defaults: defaultsRes.recordset.map((d) => ({
      table_name: d.table_name,
      column_name: d.column_name,
      constraint_name: d.is_system_named ? '<SYS_DEFAULT>' : d.constraint_name,
      definition: d.definition
    })),
    checks: checksRes.recordset.map((c) => ({
      table_name: c.table_name,
      constraint_name: c.is_system_named ? '<SYS_CHECK>' : c.constraint_name,
      definition: c.definition
    })),
    uniques: uniquesRes.recordset.map((u) => ({
      table_name: u.table_name,
      constraint_name: u.is_system_named ? '<SYS_KEY>' : u.constraint_name,
      type_desc: u.type_desc,
      cols: u.cols
    })),
    fks: fksRes.recordset,
    indexes: indexesRes.recordset
  };
}

function assertCatalogParity(migCat, snapCat) {
  assert.deepStrictEqual(snapCat.tables, migCat.tables, 'Table lists must match across migration chain and snapshot');
  assert.strictEqual(migCat.tables.length, 28, 'Schema must contain exactly 28 user tables after Migrations 001-008');

  assert.deepStrictEqual(snapCat.columns, migCat.columns, 'All columns (type, length, precision, scale, nullability) must match');
  assert.deepStrictEqual(snapCat.defaults, migCat.defaults, 'All default constraints must match');
  assert.deepStrictEqual(snapCat.checks, migCat.checks, 'All check constraints must match without duplicate or missing names');
  assert.deepStrictEqual(snapCat.uniques, migCat.uniques, 'All primary keys and unique constraints must match');
  assert.deepStrictEqual(snapCat.fks, migCat.fks, 'All foreign keys and ON DELETE behaviors must match');
  assert.deepStrictEqual(snapCat.indexes, migCat.indexes, 'All indexes, included columns, and filter definitions must match');
}

async function main() {
  const { asyncTest, assertSummary } = createSuiteRunner('VAMOS STORE - MEDIUM-04 SQL SERVER PARITY, UPGRADE & CONCURRENCY SUITE');

  const origAdminPass = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!origAdminPass || origAdminPass.trim().length < 8) {
    process.env.ADMIN_DEFAULT_PASSWORD = `VamosTestMig_${crypto.randomBytes(8).toString('hex')}!`;
  }

  const masterCfg = { ...appConfig.db, database: 'master', pool: { max: 2, min: 0, idleTimeoutMillis: 15000 } };
  validateDatabaseConnection(masterCfg, 'test', { allowMasterAdmin: true, targetDatabase: PARITY_DB });
  const masterPool = await new sql.ConnectionPool(masterCfg).connect();

  const tempDirs = [];

  try {
    // 1. Fresh Install vs mssql_schema.sql Parity
    await asyncTest('PARITY-01: Fresh 001-008 migration chain matches 28-table mssql_schema.sql snapshot identically', async () => {
      await dropDatabaseIfExists(masterPool, PARITY_DB);
      await createEmptyDatabase(masterPool, UPGRADE_DB);

      // Build DB1 strictly via migration runner (001..008)
      const migResult = await init(PARITY_DB);
      assert.strictEqual(migResult.totalTables, 28);
      assert.strictEqual(migResult.appliedNow.length, 8);

      // Build DB2 strictly via mssql_schema.sql snapshot
      const snapPool = await openTempPool(UPGRADE_DB);
      try {
        const snapSql = fs.readFileSync(path.resolve(__dirname, '../database/mssql_schema.sql'), 'utf8');
        const snapBatches = splitSqlBatches(snapSql);
        for (const b of snapBatches) {
          await snapPool.request().query(b);
        }

        const migPool = await openTempPool(PARITY_DB);
        try {
          const migCat = await fetchSchemaCatalog(migPool);
          const snapCat = await fetchSchemaCatalog(snapPool);
          assertCatalogParity(migCat, snapCat);

          // Compare seeded point_reward_rules
          const rulesA = (await migPool.request().query('SELECT title, reward_type, points_required, discount_type, discount_value, min_order_amount, max_discount_amount, voucher_valid_days, stock_quantity, is_active, sort_order FROM point_reward_rules ORDER BY sort_order')).recordset;
          const rulesB = (await snapPool.request().query('SELECT title, reward_type, points_required, discount_type, discount_value, min_order_amount, max_discount_amount, voucher_valid_days, stock_quantity, is_active, sort_order FROM point_reward_rules ORDER BY sort_order')).recordset;
          assert.deepStrictEqual(rulesB, rulesA, 'Seeded point_reward_rules must match identically');
          assert.strictEqual(rulesA.length, 6);

          // Verify fresh DB recorded 8 non-null SHA-256 checksums, while snapshot recorded 8 NULL baseline entries
          const migRows = (await migPool.request().query('SELECT version, checksum FROM schema_migrations ORDER BY id')).recordset;
          const snapRows = (await snapPool.request().query('SELECT version, checksum FROM schema_migrations ORDER BY id')).recordset;
          assert.strictEqual(migRows.length, 8);
          assert.strictEqual(snapRows.length, 8);
          assert.ok(migRows.every((r) => typeof r.checksum === 'string' && r.checksum.length === 64));
          assert.ok(snapRows.every((r) => r.checksum === null));
        } finally {
          await migPool.close();
        }
      } finally {
        await snapPool.close();
      }

      // Running init() on snapshot-seeded DB skips 001..008 without re-applying or erroring
      const postSnapInit = await init(UPGRADE_DB);
      assert.strictEqual(postSnapInit.appliedNow.length, 0);
      assert.strictEqual(postSnapInit.legacyUnverified.length, 8);
    });

    // 2. Existing Pre-008 Upgrade Simulation (003 -> 004..008) & Data Preservation
    await asyncTest('UPG-01: Legacy pre-008 DB frozen at 003 upgrades cleanly through 008 preserving data and LEGACY_UNVERIFIED NULLs', async () => {
      await createEmptyDatabase(masterPool, UPGRADE_DB);
      const upgPool = await openTempPool(UPGRADE_DB);

      try {
        // Simulate legacy schema_migrations WITHOUT checksum column (pre-008 format) and apply 001..003
        const migDir = path.resolve(__dirname, '../database/migrations');
        for (const f of ['001_initial_schema.sql', '002_add_filtered_indexes.sql', '003_voucher_customer_usage.sql']) {
          const batches = splitSqlBatches(fs.readFileSync(path.join(migDir, f), 'utf8'));
          for (const b of batches) {
            await upgPool.request().query(b);
          }
          const ver = f.replace(/\.sql$/, '');
          await upgPool.request()
            .input('v', sql.VarChar(50), ver)
            .input('d', sql.NVarChar(255), `Legacy pre-008 ${f}`)
            .query('INSERT INTO schema_migrations (version, description) VALUES (@v, @d)');
        }

        // Seed existing pre-upgrade customer, voucher, and historical order
        const legacyHash = await bcrypt.hash(crypto.randomBytes(12).toString('hex'), 4);
        const uRes = await upgPool.request()
          .input('hash', sql.NVarChar(255), legacyHash)
          .query(`
            INSERT INTO users (full_name, email, password_hash, role, status)
            OUTPUT INSERTED.id
            VALUES (N'Legacy User', 'legacy.upg@vamos.test', @hash, 'CUSTOMER', 'active')
          `);
        const vRes = await upgPool.request().query(`
          INSERT INTO vouchers (code, name, discount_type, discount_value, start_date, end_date)
          OUTPUT INSERTED.id
          VALUES ('LEGACY30', N'Legacy Voucher', 'fixed_amount', 30000, '2026-01-01', '2027-01-01')
        `);
        await upgPool.request()
          .input('uid', sql.Int, uRes.recordset[0].id)
          .input('vid', sql.Int, vRes.recordset[0].id)
          .query(`
            INSERT INTO orders (order_code, user_id, recipient_name_snapshot, recipient_phone_snapshot, delivery_address_snapshot, subtotal, discount_amount, shipping_fee, total_amount, voucher_id)
            VALUES ('VAM-LEG-001', @uid, N'Legacy User', '0901234567', N'Hà Nội', 500000, 30000, 30000, 500000, @vid)
          `);
      } finally {
        await upgPool.close();
      }

      // Upgrade via hardened init()
      const upgRes = await init(UPGRADE_DB);
      assert.deepStrictEqual(upgRes.legacyUnverified, [
        '001_initial_schema',
        '002_add_filtered_indexes',
        '003_voucher_customer_usage'
      ]);
      assert.deepStrictEqual(upgRes.appliedNow, [
        '004_create_wishlist_items',
        '005_vamos_club_loyalty_system',
        '006_vamos_club_expiration_and_tier_cycle',
        '007_vamos_club_true_free_shipping',
        '008_add_schema_migration_checksum'
      ]);

      // Verify data preservation, tracking states (001..007 NULL legacy/pre-008, 008 SHA-256), and final parity against PARITY_DB
      const postUpgPool = await openTempPool(UPGRADE_DB);
      const parityPool = await openTempPool(PARITY_DB);
      try {
        const legacyOrder = (await postUpgPool.request().query("SELECT total_amount, shipping_discount_amount FROM orders WHERE order_code = 'VAM-LEG-001'")).recordset[0];
        assert.strictEqual(Number(legacyOrder.total_amount), 500000);
        assert.strictEqual(Number(legacyOrder.shipping_discount_amount), 0);

        const rows = (await postUpgPool.request().query('SELECT version, checksum FROM schema_migrations ORDER BY id')).recordset;
        assert.strictEqual(rows.length, 8);
        for (const r of rows.slice(0, 7)) {
          assert.strictEqual(r.checksum, null, `${r.version} executed before 008 must preserve NULL checksum`);
        }
        const expected008Hash = computeSha256(
          fs.readFileSync(path.resolve(__dirname, '../database/migrations/008_add_schema_migration_checksum.sql'))
        );
        assert.strictEqual(rows[7].version, '008_add_schema_migration_checksum');
        assert.strictEqual(rows[7].checksum, expected008Hash);

        const catPar = await fetchSchemaCatalog(parityPool);
        const catUpg = await fetchSchemaCatalog(postUpgPool);
        assertCatalogParity(catPar, catUpg);
      } finally {
        await postUpgPool.close();
        await parityPool.close();
      }

      // Second run must be strict no-op
      const rerun = await init(UPGRADE_DB);
      assert.strictEqual(rerun.appliedNow.length, 0);
    });

    // 3. Failure Injection Rollback at Batch 0, Mid, Last & Tracking Insert + Recovery + Tamper Detection
    await asyncTest('ROLLBACK-01: SQL Server DDL failure injection rolls back partial tables/tracking cleanly and detects tampering', async () => {
      const tempMigDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vamos_sql_rb_'));
      tempDirs.push(tempMigDir);

      const srcMigDir = path.resolve(__dirname, '../database/migrations');
      for (const f of fs.readdirSync(srcMigDir).filter((x) => x.endsWith('.sql'))) {
        fs.copyFileSync(path.join(srcMigDir, f), path.join(tempMigDir, f));
      }

      const mig009Path = path.join(tempMigDir, '009_temp_tx_rollback.sql');
      fs.writeFileSync(mig009Path, [
        'CREATE TABLE temp_mig_step1 (id INT PRIMARY KEY);',
        'GO',
        'CREATE TABLE temp_mig_step2 (id INT PRIMARY KEY, step1_id INT NOT NULL);',
        'GO',
        'CREATE NONCLUSTERED INDEX ix_temp_mig_s2 ON temp_mig_step2(step1_id);',
        'GO'
      ].join('\n'), 'utf8');

      for (const targetFailStage of [
        { stage: 'before_batch', batchIndex: 0 },
        { stage: 'before_batch', batchIndex: 1 },
        { stage: 'before_batch', batchIndex: 2 },
        { stage: 'before_tracking_insert', batchIndex: undefined }
      ]) {
        await assert.rejects(
          () => init(UPGRADE_DB, {
            migrationsDir: tempMigDir,
            skipSeeds: true,
            _testFailHook: async (ctx) => {
              if (ctx.version === '009_temp_tx_rollback' && ctx.stage === targetFailStage.stage && (targetFailStage.batchIndex === undefined || ctx.batchIndex === targetFailStage.batchIndex)) {
                throw new Error(`Injected failure at ${targetFailStage.stage}:${targetFailStage.batchIndex ?? 'track'}`);
              }
            }
          }),
          /Injected failure/
        );

        const checkPool = await openTempPool(UPGRADE_DB);
        try {
          const checkRes = await checkPool.request().query(`
            SELECT OBJECT_ID('temp_mig_step1', 'U') AS t1,
                   OBJECT_ID('temp_mig_step2', 'U') AS t2,
                   (SELECT COUNT(*) FROM schema_migrations WHERE version = '009_temp_tx_rollback') AS tracked
          `);
          assert.strictEqual(checkRes.recordset[0].t1, null, 'Step 1 table must be rolled back');
          assert.strictEqual(checkRes.recordset[0].t2, null, 'Step 2 table must be rolled back');
          assert.strictEqual(checkRes.recordset[0].tracked, 0, 'Tracking row must be rolled back');
        } finally {
          await checkPool.close();
        }
      }

      // Retry cleanly without failure injection -> commits 009 + checksum
      const okRes = await init(UPGRADE_DB, { migrationsDir: tempMigDir, skipSeeds: true });
      assert.deepStrictEqual(okRes.appliedNow, ['009_temp_tx_rollback']);

      // Tampering committed 009 file must trigger fail-closed checksum mismatch
      fs.appendFileSync(mig009Path, '\n-- tampered\n', 'utf8');
      await assert.rejects(
        () => init(UPGRADE_DB, { migrationsDir: tempMigDir, skipSeeds: true }),
        /MIGRATION CHECKSUM MISMATCH/
      );
    });

    // 4. Concurrent Initialization & Explicit sp_getapplock Timeout
    await asyncTest('CONCUR-01: Concurrent init() calls serialize safely via sp_getapplock and explicit lock contention times out cleanly', async () => {
      await dropDatabaseIfExists(masterPool, UPGRADE_DB);

      const settled = await Promise.allSettled([
        init(UPGRADE_DB),
        init(UPGRADE_DB)
      ]);
      for (const item of settled) {
        assert.strictEqual(item.status, 'fulfilled', item.status === 'rejected' ? item.reason?.message : '');
      }
      const res1 = settled[0].value;
      const res2 = settled[1].value;

      const totalApplied = res1.appliedNow.length + res2.appliedNow.length;
      assert.strictEqual(totalApplied, 8, 'Across concurrent runners, exactly 8 migrations apply once total');
      assert.strictEqual(res1.totalTables, 28);
      assert.strictEqual(res2.totalTables, 28);

      // Hold exclusive session lock on UPGRADE_DB and verify second runner times out cleanly
      const lockHolderPool = await openTempPool(UPGRADE_DB);
      const lockResource = `VAMOS_MIGRATION_LOCK_${UPGRADE_DB.toLowerCase()}`;
      try {
        await acquireMigrationAppLock(lockHolderPool, lockResource, 5000);
        await assert.rejects(
          () => init(UPGRADE_DB, { lockTimeoutMs: 150, skipSeeds: true }),
          /MIGRATION LOCK TIMEOUT/
        );
      } finally {
        await releaseMigrationAppLock(lockHolderPool, lockResource);
        await lockHolderPool.close();
      }
    });

    assertSummary();
  } finally {
    if (origAdminPass === undefined) {
      delete process.env.ADMIN_DEFAULT_PASSWORD;
    } else {
      process.env.ADMIN_DEFAULT_PASSWORD = origAdminPass;
    }
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    for (const dbName of TEMP_TEST_DBS) {
      try {
        await dropDatabaseIfExists(masterPool, dbName);
      } catch (dropErr) {
        console.warn(`[TEMP DB CLEANUP WARNING] ${dbName}:`, dropErr.message);
      }
    }
    await masterPool.close();
  }
}

main().catch((err) => {
  console.error('[FATAL MIGRATION PARITY SUITE ERROR]:', err);
  process.exitCode = 1;
});
