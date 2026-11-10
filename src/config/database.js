const sql = require('mssql');
const config = require('./app.config');

let pool = null;

/**
 * Get or create the MSSQL Connection Pool
 * @returns {Promise<sql.ConnectionPool>}
 */
async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(config.db);
    } catch (err) {
      console.error('[MSSQL Pool Error]:', err.message);
      throw err;
    }
  }
  return pool;
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
 * Execute a SQL query helper
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

module.exports = {
  sql,
  getPool,
  testDbConnection,
  query,
};
