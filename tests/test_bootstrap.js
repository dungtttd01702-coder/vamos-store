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

module.exports = {
  env: 'test',
  testDbName: 'vamos_store_test_db'
};
