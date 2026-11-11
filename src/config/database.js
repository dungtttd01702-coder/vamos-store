const sql = require('mssql');
const config = require('./app.config');

let pool = null;
let isClosing = false;

/**
 * Get or create the MSSQL Connection Pool
 * @returns {Promise<sql.ConnectionPool>}
 */
async function getPool() {
  if (isClosing) {
    throw new Error('[MSSQL Pool]: Cannot acquire connection, pool is closing.');
  }

  if (!pool) {
    try {
      pool = await sql.connect(config.db);
      pool.on('error', (err) => {
        console.error('[MSSQL Pool Internal Error]:', err.message);
        pool = null;
      });
    } catch (err) {
      console.error('[MSSQL Pool Connect Error]:', err.message);
      pool = null;
      throw err;
    }
  }
  return pool;
}

/**
 * Close Connection Pool cleanly
 * @returns {Promise<void>}
 */
async function closePool() {
  if (pool) {
    isClosing = true;
    try {
      await pool.close();
      console.log('[MSSQL Pool]: Connection pool closed gracefully.');
    } catch (err) {
      console.error('[MSSQL Pool Close Error]:', err.message);
    } finally {
      pool = null;
      isClosing = false;
    }
  }
}

/**
 * Test Database Connection
 * @returns {Promise<boolean>}
 */
async function testDbConnection() {
  try {
    const currentPool = await getPool();
    const result = await currentPool.request().query('SELECT @@VERSION AS version, DB_NAME() AS current_db');
    if (result && result.recordset && result.recordset.length > 0) {
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`[Database Connection Warning]: Cannot connect to Microsoft SQL Server at ${config.db.server}:${config.db.port} (${err.message})`);
    return false;
  }
}

/**
 * Execute a SQL query helper with parameters
 * @param {string} queryStr 
 * @param {object} params 
 * @returns {Promise<sql.IResult<any>>}
 */
async function query(queryStr, params = {}) {
  const currentPool = await getPool();
  const request = currentPool.request();
  
  for (const [key, val] of Object.entries(params)) {
    request.input(key, val);
  }
  
  return request.query(queryStr);
}

/**
 * Execute an atomic transaction helper
 * @param {Function} callback (transaction, request) => Promise<any>
 * @returns {Promise<any>}
 */
async function withTransaction(callback) {
  const currentPool = await getPool();
  const transaction = new sql.Transaction(currentPool);
  await transaction.begin();

  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (rbErr) {
      console.error('[Transaction Rollback Error]:', rbErr.message);
    }
    throw err;
  }
}

module.exports = {
  sql,
  getPool,
  closePool,
  testDbConnection,
  query,
  withTransaction,
};
