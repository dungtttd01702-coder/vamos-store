/**
 * Database Isolation & Connection Guard for VAMOS STORE
 * Enforces strict environment separation, fail-closed security, and zero-wildcard allowlisting.
 */

const VALID_ENVIRONMENTS = new Set([
  'test',
  'development',
  'production'
]);

const ALLOWED_TEST_DATABASES = new Set([
  'vamos_store_test_db'
]);

const BLOCKED_IN_TEST = new Set([
  'vamos_store_db',
  'vamos_store_prod',
  'vamos_store_prod_db',
  'vamos_store_production',
  'master',
  'model',
  'msdb',
  'tempdb'
]);

const ALLOWED_DEV_DATABASES = new Set([
  'vamos_store_db'
]);

const BLOCKED_IN_DEV = new Set([
  'vamos_store_test_db',
  'vamos_store_prod',
  'vamos_store_prod_db',
  'vamos_store_production',
  'master',
  'model',
  'msdb',
  'tempdb'
]);

const ALLOWED_PROD_DATABASES = new Set([
  'vamos_store_prod_db',
  'vamos_store_prod',
  'vamos_store_production'
]);

/**
 * Validate database connection target against current runtime environment
 * @param {object} dbConfig - Database configuration object containing database name
 * @param {string} env - Environment string (e.g. 'test', 'development', 'production')
 * @param {object} options - Optional validation options
 * @param {boolean} options.allowMasterAdmin - Whether to allow master connection for admin bootstrap
 * @param {string} options.targetDatabase - Target database name being bootstrapped (required if allowMasterAdmin is true)
 * @returns {boolean} true if connection is permitted
 * @throws {Error} if connection is prohibited or misconfigured
 */
function validateDatabaseConnection(dbConfig, env = process.env.NODE_ENV, options = {}) {
  // 1. Fail-closed on missing, empty, or invalid NODE_ENV
  if (!env || typeof env !== 'string' || env.trim() === '') {
    throw new Error(
      `[DATABASE GUARD REJECTED]: Missing NODE_ENV runtime environment. ` +
      `Environment must be explicitly specified as 'test', 'development', or 'production'. ` +
      `Reason: Fail-closed policy blocks unauthenticated environment execution.`
    );
  }

  const currentEnv = env.trim().toLowerCase();
  if (!VALID_ENVIRONMENTS.has(currentEnv)) {
    throw new Error(
      `[DATABASE GUARD REJECTED]: Unrecognized NODE_ENV "${env}". ` +
      `Permitted environments: 'test', 'development', 'production'. ` +
      `Reason: Unknown environment is treated as untrusted and blocked.`
    );
  }

  // 2. Fail-closed on missing or invalid database configuration object
  if (!dbConfig || typeof dbConfig !== 'object') {
    throw new Error(
      `[DATABASE GUARD REJECTED]: Missing or invalid database configuration object. ` +
      `Environment: "${currentEnv}". ` +
      `Reason: Database configuration must be a valid object.`
    );
  }

  const rawDbName = dbConfig.database;
  if (!rawDbName || typeof rawDbName !== 'string' || rawDbName.trim() === '') {
    throw new Error(
      `[DATABASE GUARD REJECTED]: Target database name is empty, null, or undefined. ` +
      `Environment: "${currentEnv}". ` +
      `Reason: Database name cannot be empty.`
    );
  }

  const dbName = rawDbName.trim().toLowerCase();

  // 3. Admin Bootstrap special handling (e.g. init_mssql creating target DB from master)
  if (options.allowMasterAdmin === true) {
    if (dbName !== 'master') {
      throw new Error(
        `[DATABASE GUARD REJECTED]: Admin master connection option was enabled, but target database is "${rawDbName}". ` +
        `Expected: "master".`
      );
    }

    const targetDb = (options.targetDatabase || '').trim().toLowerCase();
    if (!targetDb) {
      throw new Error(
        `[DATABASE GUARD BLOCKED]: Admin master connection rejected. ` +
        `Reason: Target database name must be explicitly specified in options.targetDatabase.`
      );
    }

    // Verify that the target database being created/bootstrapped is authorized for currentEnv
    if (currentEnv === 'test') {
      if (!ALLOWED_TEST_DATABASES.has(targetDb)) {
        throw new Error(
          `[DATABASE GUARD BLOCKED]: Admin master connection rejected in TEST environment. ` +
          `Target database "${options.targetDatabase}" is not in the approved test allowlist ("vamos_store_test_db").`
        );
      }
    } else if (currentEnv === 'development') {
      if (!ALLOWED_DEV_DATABASES.has(targetDb)) {
        throw new Error(
          `[DATABASE GUARD BLOCKED]: Admin master connection rejected in DEVELOPMENT environment. ` +
          `Target database "${options.targetDatabase}" is not in the approved dev allowlist ("vamos_store_db").`
        );
      }
    } else if (currentEnv === 'production') {
      if (process.env.ALLOW_PRODUCTION_INIT !== 'true') {
        throw new Error(
          `[DATABASE GUARD BLOCKED]: Admin master connection rejected in PRODUCTION environment. ` +
          `ALLOW_PRODUCTION_INIT=true is required.`
        );
      }
    }

    return true;
  }

  // 4. Strict validation for TEST environment
  if (currentEnv === 'test') {
    // 4a. Explicit blocklist check: NEVER connect to dev/prod/system DB in test mode
    const devDbConfigured = (process.env.DB_NAME || 'vamos_store_db').trim().toLowerCase();
    if (BLOCKED_IN_TEST.has(dbName) || dbName === devDbConfigured) {
      throw new Error(
        `[DATABASE GUARD BLOCKED]: Connection to non-test database "${rawDbName}" is strictly forbidden in TEST environment. ` +
        `Environment: "test". ` +
        `Expected: Dedicated test database ("vamos_store_test_db"). ` +
        `Actual: "${rawDbName}". ` +
        `Reason: Development or production database cannot be used during test execution.`
      );
    }

    // 4b. Explicit check against DB_TEST_NAME override attempt
    if (process.env.DB_TEST_NAME) {
      const customTestDb = process.env.DB_TEST_NAME.trim().toLowerCase();
      if (!ALLOWED_TEST_DATABASES.has(customTestDb)) {
        throw new Error(
          `[DATABASE GUARD REJECTED]: DB_TEST_NAME override "${process.env.DB_TEST_NAME}" is not in the approved test allowlist. ` +
          `Environment: "test". ` +
          `Reason: Arbitrary database override via DB_TEST_NAME is prohibited.`
        );
      }
    }

    // 4c. Strict allowlist check: ONLY 'vamos_store_test_db' is permitted (NO wildcards)
    if (!ALLOWED_TEST_DATABASES.has(dbName)) {
      throw new Error(
        `[DATABASE GUARD REJECTED]: Database "${rawDbName}" is not in the approved test database allowlist. ` +
        `Environment: "test". ` +
        `Expected: "vamos_store_test_db". ` +
        `Actual: "${rawDbName}". ` +
        `Reason: Target database is not authorized for testing. Wildcards and unapproved databases are rejected.`
      );
    }

    return true;
  }

  // 5. Strict validation for DEVELOPMENT environment
  if (currentEnv === 'development') {
    if (BLOCKED_IN_DEV.has(dbName)) {
      throw new Error(
        `[DATABASE GUARD BLOCKED]: Connection to restricted database "${rawDbName}" is forbidden in DEVELOPMENT environment. ` +
        `Environment: "development". ` +
        `Expected: "vamos_store_db". ` +
        `Actual: "${rawDbName}". ` +
        `Reason: Test, production, and system databases are blocked in development.`
      );
    }

    if (!ALLOWED_DEV_DATABASES.has(dbName)) {
      throw new Error(
        `[DATABASE GUARD REJECTED]: Database "${rawDbName}" is not in the approved development database allowlist. ` +
        `Environment: "development". ` +
        `Expected: "vamos_store_db". ` +
        `Actual: "${rawDbName}". ` +
        `Reason: Target database is not authorized for development.`
      );
    }

    return true;
  }

  // 6. Strict validation for PRODUCTION environment
  if (currentEnv === 'production') {
    if (dbName.includes('test') || dbName === 'vamos_store_db') {
      throw new Error(
        `[DATABASE GUARD REJECTED]: Cannot connect to test or development database "${rawDbName}" in PRODUCTION environment. ` +
        `Environment: "production". ` +
        `Actual: "${rawDbName}". ` +
        `Reason: Test and development databases cannot be targeted in production mode.`
      );
    }

    if (dbName === 'master' || dbName === 'model' || dbName === 'msdb' || dbName === 'tempdb') {
      throw new Error(
        `[DATABASE GUARD REJECTED]: Cannot connect to system database "${rawDbName}" in PRODUCTION environment. ` +
        `Environment: "production". ` +
        `Reason: System databases are restricted in production.`
      );
    }

    // Check configured production DB if set
    if (process.env.DB_PROD_NAME) {
      const prodDbConfigured = process.env.DB_PROD_NAME.trim().toLowerCase();
      if (dbName !== prodDbConfigured) {
        throw new Error(
          `[DATABASE GUARD REJECTED]: Database "${rawDbName}" does not match configured DB_PROD_NAME. ` +
          `Environment: "production".`
        );
      }
    }

    return true;
  }

  // Unhandled environment fallback (defense-in-depth)
  throw new Error(
    `[DATABASE GUARD REJECTED]: Access denied for unhandled environment "${currentEnv}".`
  );
}

module.exports = {
  validateDatabaseConnection,
  VALID_ENVIRONMENTS,
  ALLOWED_TEST_DATABASES,
  BLOCKED_IN_TEST,
  ALLOWED_DEV_DATABASES,
  BLOCKED_IN_DEV,
  ALLOWED_PROD_DATABASES
};
