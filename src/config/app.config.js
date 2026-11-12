require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.includes('fallback') || process.env.SESSION_SECRET.includes('replace_with'))) {
  throw new Error('[SECURITY CRITICAL]: SESSION_SECRET must be configured with a strong random secret in production mode.');
}

const config = {
  app: {
    name: process.env.APP_NAME || 'VAMOS STORE',
    port: Number.parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
    url: process.env.APP_URL || 'http://localhost:3000',
    isProduction,
    isTest,
  },
  session: {
    secret: process.env.SESSION_SECRET || 'vamos_default_dev_session_secret_2026',
    name: 'vamos_sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    },
  },
  db: {
    server: process.env.DB_SERVER || process.env.DB_HOST || '127.0.0.1',
    port: Number.parseInt(process.env.DB_PORT, 10) || 1433,
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    database: isTest ? (process.env.DB_TEST_NAME || 'vamos_store_test_db') : (process.env.DB_NAME || 'vamos_store_db'),
    connectionTimeout: 15000,
    requestTimeout: 15000,
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },
};

module.exports = config;
