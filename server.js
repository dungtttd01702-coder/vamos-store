const app = require('./src/app');
const config = require('./src/config/app.config');
const { testDbConnection } = require('./src/config/database');

const PORT = config.app.port;

// Start Server
const server = app.listen(PORT, async () => {
  console.log('========================================================');
  console.log(`🚀 ${config.app.name} Server is running!`);
  console.log(`🌐 Local URL:   http://localhost:${PORT}`);
  console.log(`⚙️  Environment: ${config.app.env}`);
  console.log('========================================================');

  // Test Database Connection
  const isDbConnected = await testDbConnection();
  if (isDbConnected) {
    console.log(`✅ [Database] Connected successfully to Microsoft SQL Server (${config.db.server}:${config.db.port}/${config.db.database})`);
  } else {
    console.log(`ℹ️  [Database] Database server is not currently reachable (${config.db.server}:${config.db.port}).`);
    console.log(`   (Website UI and static routes function normally).`);
  }
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated.');
  });
});

