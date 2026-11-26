/**
 * VAMOS STORE - MEDIUM-04 Zero-DB Migration Runner & State-Aware GO Parser Unit Tests
 * Covers T-SQL lexical edge cases, numeric sorting, duplicate/missing file checks,
 * SHA-256 checksum enforcement, legacy NULL handling, transaction rollback, and sp_getapplock handling.
 */

require('./test_bootstrap');

const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sql = require('mssql');

const {
  splitSqlBatches,
  computeSha256,
  discoverMigrationFiles
} = require('../database/lib/tsqlBatchParser');
const {
  executeMigrationsOnSession,
  acquireMigrationAppLock
} = require('../database/init_mssql');
const { createSuiteRunner } = require('./helpers/loyalty-test-helpers');

function makeTempMigrationsDir(filesMap) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vamos_mig_unit_'));
  for (const [name, content] of Object.entries(filesMap)) {
    fs.writeFileSync(path.join(dir, name), content, 'utf8');
  }
  return dir;
}

async function runMockMigrationSession({
  migrationsDir,
  trackedRows = [],
  hasChecksumColumn = true,
  failOnQueryMatch = null,
  options = {}
}) {
  const state = {
    executedQueries: [],
    commits: 0,
    rollbacks: 0,
    insertedRows: []
  };

  const OrigTx = sql.Transaction;
  const OrigReq = sql.Request;

  const fakePool = {
    request() {
      return new sql.Request(fakePool);
    }
  };

  sql.Transaction = class {
    async begin() {
      // Mock begin
    }
    async commit() {
      state.commits++;
    }
    async rollback() {
      state.rollbacks++;
    }
  };

  sql.Request = class {
    constructor(target) {
      this.target = target;
      this.params = {};
    }
    input(k, t, v) {
      this.params[k] = v === undefined ? t : v;
      return this;
    }
    async query(sqlText) {
      const normalized = sqlText.replace(/\s+/g, ' ').trim();
      state.executedQueries.push(normalized);

      if (failOnQueryMatch && normalized.includes(failOnQueryMatch)) {
        throw new Error(`Simulated SQL error on: ${failOnQueryMatch}`);
      }
      if (normalized.includes("COL_LENGTH('schema_migrations', 'checksum')")) {
        return { recordset: [{ checksum_len: hasChecksumColumn ? 64 : null }] };
      }
      if (normalized.startsWith('SELECT id, version, description, applied_at')) {
        return { recordset: trackedRows };
      }
      if (normalized.startsWith('INSERT INTO schema_migrations')) {
        state.insertedRows.push({
          version: this.params.v,
          description: this.params.desc,
          checksum: this.params.checksum ?? null
        });
        return { recordset: [], rowsAffected: [1] };
      }
      return { recordset: [], rowsAffected: [1] };
    }
  };

  try {
    const res = await executeMigrationsOnSession(fakePool, { migrationsDir, ...options });
    return { result: res, state };
  } catch (error) {
    return { error, state };
  } finally {
    sql.Transaction = OrigTx;
    sql.Request = OrigReq;
  }
}

async function main() {
  const { test, asyncTest, assertSummary } = createSuiteRunner('VAMOS STORE - MEDIUM-04 GO PARSER & MIGRATION RUNNER UNIT TESTS');

  // --- PART 1: GO BATCH PARSER UNIT TESTS ---
  test('GO-01: Standard GO, LF & CRLF, indentation, and inline -- / /* */ comments split accurately', () => {
    const script = [
      '  SELECT 1;\r',
      '   go   -- end batch 1\r',
      'SELECT 2;\n',
      'GO /* inline block */\n',
      'SELECT 3;\r\n',
      'GO\r\n'
    ].join('\n');
    assert.deepStrictEqual(splitSqlBatches(script), ['SELECT 1;', 'SELECT 2;', 'SELECT 3;']);
  });

  test('GO-02: UTF-8 BOM stripped cleanly and empty trailing GO produces no empty batch', () => {
    const script = '\uFEFFSELECT 10;\nGO\n   \nGO\n';
    assert.deepStrictEqual(splitSqlBatches(script), ['SELECT 10;']);
  });

  test('GO-03: GO <count> repeats batch safely within limit and rejects invalid counts', () => {
    const valid = 'INSERT INTO t VALUES (1);\nGO 3\nSELECT 1;\nGO';
    assert.deepStrictEqual(splitSqlBatches(valid), [
      'INSERT INTO t VALUES (1);',
      'INSERT INTO t VALUES (1);',
      'INSERT INTO t VALUES (1);',
      'SELECT 1;'
    ]);

    assert.throws(() => splitSqlBatches('SELECT 1;\nGO 0'), /Invalid GO batch directive/);
    assert.throws(() => splitSqlBatches('SELECT 1;\nGO -2'), /Invalid GO batch directive/);
    assert.throws(() => splitSqlBatches('SELECT 1;\nGO abc'), /Invalid GO batch directive/);
    assert.throws(() => splitSqlBatches('SELECT 1;\nGO 101'), /Unsupported GO repeat count/);
    assert.throws(() => splitSqlBatches('SELECT 1;\nGO 2 SELECT 2'), /Unexpected trailing SQL token/);
    assert.throws(() => splitSqlBatches('SELECT 1;\nGO /* unclosed\ncomment */'), /Unsupported multiline block comment/);
  });

  test('GO-04: GO inside single-quoted string and escaped single quotes is NEVER treated as separator', () => {
    const script = [
      "SELECT N'Hello\nGO\nWorld''s\nGO\nEnd';",
      'GO',
      "SELECT 'After';",
      'GO'
    ].join('\n');
    assert.deepStrictEqual(splitSqlBatches(script), [
      "SELECT N'Hello\nGO\nWorld''s\nGO\nEnd';",
      "SELECT 'After';"
    ]);
  });

  test('GO-05: GO inside double-quoted identifier and bracketed identifier is NEVER split', () => {
    const script = [
      'SELECT "Col\nGO\nName", [Tbl\nGO\n]]Name] FROM t;',
      'GO'
    ].join('\n');
    assert.deepStrictEqual(splitSqlBatches(script), [
      'SELECT "Col\nGO\nName", [Tbl\nGO\n]]Name] FROM t;'
    ]);
  });

  test('GO-06: GO inside line comment, multiline block comment, and NESTED block comment is NEVER split', () => {
    const script = [
      '-- GO comment at start',
      'SELECT 1; -- GO at end',
      '/* outer comment',
      'GO',
      '   /* nested inner comment',
      'GO',
      '   */',
      'still in outer comment',
      'GO',
      '*/',
      'SELECT GOOD, GO_ID FROM users;',
      'GO',
      'SELECT 2;'
    ].join('\n');
    const batches = splitSqlBatches(script);
    assert.strictEqual(batches.length, 2);
    assert.ok(batches[0].includes('SELECT GOOD, GO_ID FROM users;'));
    assert.strictEqual(batches[1], 'SELECT 2;');
  });

  test('GO-07: Real project migrations 001..009 all parse cleanly with zero batch syntax errors', () => {
    const migDir = path.resolve(__dirname, '../database/migrations');
    const { files, sequenceGaps } = discoverMigrationFiles(migDir);
    assert.strictEqual(files.length, 9);
    assert.strictEqual(sequenceGaps.length, 0);
    for (const m of files) {
      const sqlText = fs.readFileSync(m.fullPath, 'utf8');
      const batches = splitSqlBatches(sqlText);
      assert.ok(batches.length >= 1, `${m.file} must yield at least 1 batch`);
    }
  });

  // --- PART 2: DISCOVERY, ORDERING & CHECKSUM VALIDATION ---
  test('RUN-01: Numeric sorting puts 002 before 10, rejects invalid names and duplicate version numbers', () => {
    const dirOrder = makeTempMigrationsDir({
      '10_tenth.sql': 'SELECT 10;',
      '2_second.sql': 'SELECT 2;',
      '001_first.sql': 'SELECT 1;'
    });
    const dirDup = makeTempMigrationsDir({
      '002_a.sql': 'SELECT 1;',
      '2_b.sql': 'SELECT 2;'
    });
    const dirBad = makeTempMigrationsDir({
      'bad_migration.sql': 'SELECT 1;'
    });
    try {
      const { files, sequenceGaps } = discoverMigrationFiles(dirOrder);
      assert.deepStrictEqual(files.map((f) => f.versionNum), [1, 2, 10]);
      assert.ok(sequenceGaps.includes(3) && sequenceGaps.includes(9));

      assert.throws(() => discoverMigrationFiles(dirDup), /Duplicate migration version number 2/);
      assert.throws(() => discoverMigrationFiles(dirBad), /Invalid migration filename/);
    } finally {
      fs.rmSync(dirOrder, { recursive: true, force: true });
      fs.rmSync(dirDup, { recursive: true, force: true });
      fs.rmSync(dirBad, { recursive: true, force: true });
    }
  });

  await asyncTest('RUN-02: Legacy NULL checksum warns & skips without altering NULL; valid SHA-256 skips; mismatch aborts', async () => {
    const dir = makeTempMigrationsDir({
      '001_init.sql': 'SELECT 1;',
      '002_next.sql': 'SELECT 2;'
    });
    try {
      const hash2 = computeSha256(fs.readFileSync(path.join(dir, '002_next.sql')));

      // Legacy NULL + valid hash2 -> skips cleanly
      const okOut = await runMockMigrationSession({
        migrationsDir: dir,
        hasChecksumColumn: true,
        trackedRows: [
          { id: 1, version: '001_init', description: 'legacy', checksum: null },
          { id: 2, version: '002_next', description: 'hashed', checksum: hash2 }
        ]
      });
      assert.ok(!okOut.error, okOut.error?.message);
      assert.deepStrictEqual(okOut.result.legacyUnverified, ['001_init']);
      assert.strictEqual(okOut.result.appliedNow.length, 0);
      assert.strictEqual(okOut.state.commits, 0);

      // Mismatch on 002 -> fail closed
      const badOut = await runMockMigrationSession({
        migrationsDir: dir,
        hasChecksumColumn: true,
        trackedRows: [
          { id: 1, version: '001_init', description: 'legacy', checksum: null },
          { id: 2, version: '002_next', description: 'tampered', checksum: 'a'.repeat(64) }
        ]
      });
      assert.ok(badOut.error && /MIGRATION CHECKSUM MISMATCH/.test(badOut.error.message));
      assert.strictEqual(badOut.state.commits, 0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await asyncTest('RUN-03: Tracked migration missing on disk aborts fail-closed', async () => {
    const dir = makeTempMigrationsDir({ '001_init.sql': 'SELECT 1;' });
    try {
      const out = await runMockMigrationSession({
        migrationsDir: dir,
        hasChecksumColumn: true,
        trackedRows: [
          { id: 1, version: '001_init', description: 'ok', checksum: null },
          { id: 2, version: '002_deleted_file', description: 'orphan', checksum: null }
        ]
      });
      assert.ok(out.error && /MIGRATION FILE MISSING/.test(out.error.message));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await asyncTest('RUN-04: Batch failure rolls back transaction, preserves prior migrations, and retry commits checksum', async () => {
    const dir = makeTempMigrationsDir({
      '001_init.sql': 'CREATE TABLE t1 (id INT);',
      '002_multi.sql': 'CREATE TABLE t2 (id INT);\nGO\nSELECT FAIL_MARKER;'
    });
    try {
      const hash1 = computeSha256(fs.readFileSync(path.join(dir, '001_init.sql')));
      const hash2 = computeSha256(fs.readFileSync(path.join(dir, '002_multi.sql')));

      // Batch 2 failure rolls back 002 without touching 001
      const failOut = await runMockMigrationSession({
        migrationsDir: dir,
        hasChecksumColumn: true,
        trackedRows: [{ id: 1, version: '001_init', description: 'ok', checksum: hash1 }],
        failOnQueryMatch: 'FAIL_MARKER'
      });
      assert.ok(failOut.error && /002_multi\.sql at batch 2\/2/.test(failOut.error.message));
      assert.strictEqual(failOut.state.rollbacks, 1);
      assert.strictEqual(failOut.state.commits, 0);
      assert.strictEqual(failOut.state.insertedRows.length, 0);

      // Retry without error succeeds and stores SHA-256
      const retryOut = await runMockMigrationSession({
        migrationsDir: dir,
        hasChecksumColumn: true,
        trackedRows: [{ id: 1, version: '001_init', description: 'ok', checksum: hash1 }]
      });
      assert.ok(!retryOut.error, retryOut.error?.message);
      assert.strictEqual(retryOut.state.commits, 1);
      assert.strictEqual(retryOut.state.insertedRows[0].version, '002_multi');
      assert.strictEqual(retryOut.state.insertedRows[0].checksum, hash2);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await asyncTest('RUN-05: sp_getapplock negative code rejects timeout and _testFailHook is blocked in production', async () => {
    const fakeLockTimeoutPool = {
      request() {
        return {
          input() { return this; },
          async query() { return { recordset: [{ lock_result: -1 }] }; }
        };
      }
    };
    await assert.rejects(
      () => acquireMigrationAppLock(fakeLockTimeoutPool, 'VAMOS_LOCK_TEST', 100),
      /MIGRATION LOCK TIMEOUT/
    );

    const dir = makeTempMigrationsDir({ '001_init.sql': 'SELECT 1;' });
    const origEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const out = await runMockMigrationSession({
        migrationsDir: dir,
        hasChecksumColumn: true,
        options: {
          _testFailHook: async () => {
            throw new Error('Should never run in production');
          }
        }
      });
      assert.ok(!out.error, '_testFailHook must never execute when NODE_ENV=production');
      assert.strictEqual(out.state.commits, 1);
    } finally {
      process.env.NODE_ENV = origEnv;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  assertSummary();
}

main().catch((err) => {
  console.error('[FATAL MIGRATION UNIT TEST ERROR]:', err);
  process.exitCode = 1;
});
