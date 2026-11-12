/**
 * Database Bootstrap & Migration Runner for VAMOS STORE
 * Target Database: Microsoft SQL Server (T-SQL)
 * Non-destructive: Never drops existing tables or data
 */

const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const appConfig = require('../src/config/app.config');

const baseConfig = appConfig.db;
const targetDbName = baseConfig.database || 'vamos_store_db';
const defaultAdminHash = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD || '123456', 10);

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

-- Seed default Admin account (Password: 123456 -> bcrypt hash)
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@vamos.vn')
BEGIN
    INSERT INTO users (full_name, email, password_hash, phone, role, status) VALUES
    (N'Quản Trị Viên VAMOS', 'admin@vamos.vn', '${defaultAdminHash}', '0905123456', 'ADMIN', 'active');
END
`;

async function init(dbNameOverride) {
  let masterPool = null;
  let targetPool = null;
  const targetDbName = dbNameOverride || baseConfig.database || 'vamos_store_db';
  const targetConfig = { ...baseConfig, database: targetDbName };

  try {
    console.log('===============================================================');
    console.log('   VAMOS STORE - DATABASE BOOTSTRAP & NON-DESTRUCTIVE MIGRATOR');
    console.log(`   Target Server: ${baseConfig.server}:${baseConfig.port}`);
    console.log(`   Target Database: ${targetDbName}`);
    console.log('===============================================================\n');

    // 1. Connect to 'master' to ensure target database exists
    console.log('1. Connecting to master database to verify target database...');
    const masterConfig = { ...baseConfig, database: 'master' };
    masterPool = await sql.connect(masterConfig);

    const checkDbReq = masterPool.request();
    checkDbReq.input('dbName', targetDbName);
    const dbRes = await checkDbReq.query('SELECT database_id FROM sys.databases WHERE name = @dbName');

    if (dbRes.recordset.length === 0) {
      console.log(`Target database "${targetDbName}" not found. Creating database...`);
      // Escape bracket for safe identifier creation
      const safeDbName = targetDbName.replace(/\]/g, ']]');
      await masterPool.request().query(`CREATE DATABASE [${safeDbName}] COLLATE SQL_Latin1_General_CP1_CI_AS;`);
      console.log(`✅ Created database "${targetDbName}" successfully.`);
    } else {
      console.log(`Database "${targetDbName}" already exists. Proceeding without dropping.`);
    }

    await masterPool.close();
    masterPool = null;

    // 2. Connect to the target database
    console.log(`\n2. Connecting to "${targetDbName}" to run versioned migrations...`);
    targetPool = await sql.connect(targetConfig);

    // 3. Ensure schema_migrations table exists
    await targetPool.request().query(`
      IF OBJECT_ID('schema_migrations', 'U') IS NULL
      BEGIN
        CREATE TABLE schema_migrations (
          id INT IDENTITY(1,1) PRIMARY KEY,
          version VARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(255) NOT NULL,
          applied_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
      END
    `);

    // 4. Read migration files from database/migrations/
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      for (const file of files) {
        const version = file.replace(/\.sql$/, '');
        const checkMig = targetPool.request();
        checkMig.input('v', version);
        const migRes = await checkMig.query('SELECT id FROM schema_migrations WHERE version = @v');

        if (migRes.recordset.length === 0) {
          console.log(`Applying migration: ${file}...`);
          const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

          // Execute migration batches
          // Split by GO if present, otherwise run as single script
          const batches = sqlContent
            .split(/^GO\s*$/gim)
            .map(b => b.trim())
            .filter(b => b.length > 0);

          for (const batch of batches) {
            await targetPool.request().query(batch);
          }

          // Record in schema_migrations
          const logMig = targetPool.request();
          logMig.input('v', version);
          logMig.input('desc', `Migration applied from ${file}`);
          await logMig.query('INSERT INTO schema_migrations (version, description) VALUES (@v, @desc)');
          console.log(`✅ Applied migration: ${file}`);
        } else {
          console.log(`Migration ${file} already applied. Skipping.`);
        }
      }
    }

    // 5. Run idempotent seed sql
    console.log('\n3. Running initial seeds (if not already seeded)...');
    await targetPool.request().query(initialSeedsSql);
    console.log('✅ Initial seeds verified.');

    // 6. Check tables count
    const countRes = await targetPool.request().query('SELECT COUNT(*) AS total_tables FROM sys.tables');
    console.log(`\n🎉 Success! Total tables in "${targetDbName}": ${countRes.recordset[0].total_tables}`);

    await targetPool.close();
    targetPool = null;
    if (require.main === module) {
      process.exit(0);
    }
  } catch (err) {
    console.error('\n❌ [DATABASE INIT ERROR]:', err.message);
    if (masterPool) {
      try { await masterPool.close(); } catch (_) {}
    }
    if (targetPool) {
      try { await targetPool.close(); } catch (_) {}
    }
    if (require.main === module) {
      process.exit(1);
    } else {
      throw err;
    }
  }
}

if (require.main === module) {
  init().catch(err => {
    console.error('Database bootstrap error:', err);
    process.exit(1);
  });
}

module.exports = { init };
