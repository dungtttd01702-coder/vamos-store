/**
 * Automated Test Database Initializer for VAMOS STORE
 * Creates and migrates `vamos_store_test_db` on MSSQL
 */

process.env.NODE_ENV = 'test';

const { init } = require('../database/init_mssql');
const { closePool } = require('../src/config/database');
const { seedCustomer } = require('../database/seed_customer');
const { seedVouchers } = require('../database/seed_vouchers');
const { seedProducts } = require('../database/seed_products');

async function setupTestDb() {
  console.log('\n[TEST DB BOOTSTRAP] Initializing dedicated test database: vamos_store_test_db...');
  
  // 1. Run migrations and base seeds
  await init('vamos_store_test_db');

  // 2. Run domain seeds
  try {
    await seedCustomer();
    await seedVouchers();
    await seedProducts();
    console.log('[TEST DB BOOTSTRAP] ✅ Database bootstrap & test seeds completed successfully.\n');
  } catch (err) {
    console.warn('[TEST DB BOOTSTRAP] Seed notice:', err.message);
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  setupTestDb()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[TEST DB BOOTSTRAP ERROR]:', err);
      process.exit(1);
    });
}

module.exports = { setupTestDb };
