const path = require('path');
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const cors = require('cors');

const config = require('./config/app.config');
const { sessionContextMiddleware } = require('./middlewares/auth.middleware');
const csrfMiddleware = require('./middlewares/csrf.middleware');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const routes = require('./routes');

const app = express();

// Disable x-powered-by banner
app.disable('x-powered-by');

// Security Headers (OWASP Recommended Defaults)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Set View Engine (Pug)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Request Logging
if (config.app.env === 'development') {
  app.use(morgan('dev'));
}

// Security & Restricted Cross-origin (SSR application)
if (config.app.isProduction) {
  app.use(cors({ origin: config.app.url, credentials: true }));
} else {
  app.use(cors({ origin: true, credentials: true }));
}

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Assets
app.use(express.static(path.join(__dirname, 'public')));

// Session Middleware
app.use(session(config.session));

// Context & User State Middleware for Pug Views
app.use(sessionContextMiddleware);

// CSRF Protection Middleware
app.use(csrfMiddleware);

// Mount Modular Application Routes
app.use('/', routes);

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;

