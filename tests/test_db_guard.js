/**
 * Automated Unit Test Suite for Hardened Database Isolation Guard
 * Pure in-memory unit tests: Zero network or database operations.
 * Covers all 13 critical security scenarios.
 */

const assert = require('assert');
const {
  validateDatabaseConnection,
  ALLOWED_TEST_DATABASES,
  BLOCKED_IN_TEST,
  ALLOWED_DEV_DATABASES,
  BLOCKED_IN_DEV
} = require('../src/config/db-guard');

console.log('===============================================================');
console.log('   VAMOS STORE - HARDENED DATABASE GUARD UNIT TEST SUITE');
console.log('   Mode: Pure Unit Test (Zero Database Connection)');
console.log('===============================================================');

let total = 0;
let passed = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${name}`);
    passed++;
  } catch (err) {
    console.error(`  \x1b[31m✖ [FAIL]\x1b[0m ${name}:`, err.message);
    throw err;
  }
}

// 1. NODE_ENV undefined
test('GUARD-01: NODE_ENV undefined is strictly rejected (Fail-closed)', () => {
  assert.throws(
    () => validateDatabaseConnection({ database: 'vamos_store_db' }, undefined),
    /Missing NODE_ENV runtime environment/
  );
});

// 2. NODE_ENV empty string
test('GUARD-02: NODE_ENV empty string is strictly rejected (Fail-closed)', () => {
  assert.throws(
    () => validateDatabaseConnection({ database: 'vamos_store_db' }, ''),
    /Missing NODE_ENV runtime environment/
  );
  assert.throws(
    () => validateDatabaseConnection({ database: 'vamos_store_db' }, '   '),
    /Missing NODE_ENV runtime environment/
  );
});

// 3. NODE_ENV không hợp lệ
test('GUARD-03: Invalid or unrecognized NODE_ENV is strictly rejected', () => {
  const invalidEnvs = ['staging', 'invalid', 'local', 'test_env', 'qa'];
  for (const env of invalidEnvs) {
    assert.throws(
      () => validateDatabaseConnection({ database: 'vamos_store_db' }, env),
      /Unrecognized NODE_ENV/
    );
  }
});

// 4. NODE_ENV=test và database đúng
test('GUARD-04: NODE_ENV=test with approved test DB "vamos_store_test_db" is permitted', () => {
  const res1 = validateDatabaseConnection({ database: 'vamos_store_test_db' }, 'test');
  assert.strictEqual(res1, true);

  // Case-insensitive check
  const res2 = validateDatabaseConnection({ database: 'VAMOS_STORE_TEST_DB' }, 'test');
  assert.strictEqual(res2, true);
});

// 5. NODE_ENV=test và database development
test('GUARD-05: NODE_ENV=test with development DB "vamos_store_db" is strictly blocked', () => {
  assert.throws(
    () => validateDatabaseConnection({ database: 'vamos_store_db' }, 'test'),
    (err) => {
      assert.ok(err.message.includes('[DATABASE GUARD BLOCKED]'));
      assert.ok(err.message.includes('vamos_store_db'));
      assert.ok(err.message.includes('strictly forbidden in TEST environment'));
      return true;
    }
  );
});

// 6. NODE_ENV=test và database production
test('GUARD-06: NODE_ENV=test with production databases is strictly blocked', () => {
  const prodDbs = ['vamos_store_prod', 'vamos_store_prod_db', 'vamos_store_production', 'master'];
  for (const db of prodDbs) {
    assert.throws(
      () => validateDatabaseConnection({ database: db }, 'test'),
      /strictly forbidden in TEST environment/
    );
  }
});

// 7. NODE_ENV=test và database có chữ test nhưng không nằm trong allowlist (Zero Wildcards)
test('GUARD-07: NODE_ENV=test rejects arbitrary databases containing "test" (Zero Wildcards)', () => {
  const arbitraryTestDbs = ['arbitrary_test_db', 'hr_test', 'test_payroll', 'vamos_test', 'my_test_db', 'customer_test'];
  for (const db of arbitraryTestDbs) {
    assert.throws(
      () => validateDatabaseConnection({ database: db }, 'test'),
      (err) => {
        assert.ok(err.message.includes('[DATABASE GUARD REJECTED]'));
        assert.ok(err.message.includes('not in the approved test database allowlist'));
        return true;
      }
    );
  }
});

// 8. DB_TEST_NAME cố ghi đè database không được phê duyệt
test('GUARD-08: DB_TEST_NAME attempting to override with unapproved database is rejected', () => {
  const oldEnv = process.env.DB_TEST_NAME;
  try {
    process.env.DB_TEST_NAME = 'unapproved_custom_test_db';
    assert.throws(
      () => validateDatabaseConnection({ database: 'vamos_store_test_db' }, 'test'),
      /DB_TEST_NAME override "unapproved_custom_test_db" is not in the approved test allowlist/
    );
  } finally {
    if (oldEnv !== undefined) {
      process.env.DB_TEST_NAME = oldEnv;
    } else {
      delete process.env.DB_TEST_NAME;
    }
  }
});

// 9. Database name undefined
test('GUARD-09: Database name undefined, null, or missing is rejected (Fail-fast)', () => {
  const invalidConfigs = [
    { database: undefined },
    { database: null },
    {}
  ];
  for (const cfg of invalidConfigs) {
    assert.throws(
      () => validateDatabaseConnection(cfg, 'test'),
      /Target database name is empty, null, or undefined/
    );
  }
});

// 10. Database name empty
test('GUARD-10: Database name empty string or whitespace is rejected (Fail-fast)', () => {
  const emptyConfigs = [
    { database: '' },
    { database: '   ' }
  ];
  for (const cfg of emptyConfigs) {
    assert.throws(
      () => validateDatabaseConnection(cfg, 'development'),
      /Target database name is empty, null, or undefined/
    );
  }
});

// 11. NODE_ENV=development với cấu hình hợp lệ
test('GUARD-11: NODE_ENV=development permits "vamos_store_db" and rejects test or prod databases', () => {
  // Permitted
  const devRes = validateDatabaseConnection({ database: 'vamos_store_db' }, 'development');
  assert.strictEqual(devRes, true);

  // Rejected in dev
  assert.throws(
    () => validateDatabaseConnection({ database: 'vamos_store_test_db' }, 'development'),
    /forbidden in DEVELOPMENT environment/
  );
  assert.throws(
    () => validateDatabaseConnection({ database: 'vamos_store_prod_db' }, 'development'),
    /forbidden in DEVELOPMENT environment/
  );
  assert.throws(
    () => validateDatabaseConnection({ database: 'random_db' }, 'development'),
    /not in the approved development database allowlist/
  );
});

// 12. Không rò rỉ credential trong error message
test('GUARD-12: Error messages never leak passwords, tokens, or credentials', () => {
  const sensitiveConfig = {
    database: 'vamos_store_db',
    user: 'super_admin',
    password: 'super_secret_cleartext_password_999',
    token: 'jwt_auth_secret_token_xyz',
    options: { secretKey: 'top_secret' }
  };

  try {
    validateDatabaseConnection(sensitiveConfig, 'test');
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(!err.message.includes('super_secret_cleartext_password_999'), 'Must not leak password');
    assert.ok(!err.message.includes('jwt_auth_secret_token_xyz'), 'Must not leak token');
    assert.ok(!err.message.includes('top_secret'), 'Must not leak secretKey');
    assert.ok(err.message.includes('[DATABASE GUARD BLOCKED]'));
  }
});

// 13. Mọi đường kết nối được bảo vệ trước khi mở pool (Admin master bootstrap security)
test('GUARD-13: Admin master connection strictly requires authorized targetDatabase and allowMasterAdmin option', () => {
  const masterConfig = { database: 'master' };

  // Attempting to connect to master directly without allowMasterAdmin is rejected
  assert.throws(
    () => validateDatabaseConnection(masterConfig, 'test'),
    /strictly forbidden in TEST environment/
  );
  assert.throws(
    () => validateDatabaseConnection(masterConfig, 'development'),
    /Connection to restricted database "master" is forbidden in DEVELOPMENT environment/
  );

  // Admin bootstrap with unauthorized target in test is blocked
  assert.throws(
    () => validateDatabaseConnection(masterConfig, 'test', {
      allowMasterAdmin: true,
      targetDatabase: 'vamos_store_db' // Cannot target dev DB while in test!
    }),
    /Admin master connection rejected in TEST environment/
  );

  // Admin bootstrap with authorized target in test is permitted
  const testAdminPermitted = validateDatabaseConnection(masterConfig, 'test', {
    allowMasterAdmin: true,
    targetDatabase: 'vamos_store_test_db'
  });
  assert.strictEqual(testAdminPermitted, true);

  // Admin bootstrap with authorized target in development is permitted
  const devAdminPermitted = validateDatabaseConnection(masterConfig, 'development', {
    allowMasterAdmin: true,
    targetDatabase: 'vamos_store_db'
  });
  assert.strictEqual(devAdminPermitted, true);
});

console.log('\n===============================================================');
console.log(`[DATABASE GUARD TEST SUITE]: ALL ${passed}/${total} TESTS PASSED PERFECTLY!`);
console.log('===============================================================\n');

if (require.main === module) {
  process.exit(0);
}

module.exports = { passed, total };
