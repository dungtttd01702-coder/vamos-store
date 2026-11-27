/**
 * Test Environment Bootstrap for VAMOS STORE
 * Enforces strict test environment isolation before any application or database module is loaded.
 * 
 * Rules:
 * 1. NODE_ENV must be set to 'test'.
 * 2. If NODE_ENV is already set to development or production, it will abort immediately to prevent accidental data contamination.
 * 3. Sets process.env.NODE_ENV = 'test'.
 * 4. Sets process.env.DB_TEST_NAME = 'vamos_store_test_db'.
 */

if (process.env.NODE_ENV && process.env.NODE_ENV !== 'test') {
  throw new Error(
    `[SECURITY CRITICAL]: Test script executed in non-test environment ("${process.env.NODE_ENV}"). ` +
    `Aborting immediately to prevent accidental modification of development or production databases. ` +
    `Test scripts must strictly execute with NODE_ENV='test'.`
  );
}

process.env.NODE_ENV = 'test';
process.env.DB_TEST_NAME = 'vamos_store_test_db';

/**
 * Retrieve the Admin password configured via ADMIN_DEFAULT_PASSWORD environment variable.
 * Never falls back to a hardcoded password and never logs the secret value.
 * @returns {string}
 */
function getTestAdminPassword() {
  const raw = process.env.ADMIN_DEFAULT_PASSWORD;
  const adminPass = typeof raw === 'string' ? raw.trim() : '';
  if (!adminPass) {
    throw new Error(
      '[TEST CONFIG ERROR]: ADMIN_DEFAULT_PASSWORD environment variable is required to run Admin authentication tests.'
    );
  }
  return adminPass;
}

/**
 * Retrieve the standard Customer fixture credentials seeded by database/seed_customer.js.
 * @returns {{ email: string, password: string }}
 */
function getTestCustomerCredentials() {
  return {
    email: 'khachhang@vamos.vn',
    password: '123456'
  };
}

module.exports = {
  env: 'test',
  testDbName: 'vamos_store_test_db',
  getTestAdminPassword,
  getTestCustomerCredentials
};
