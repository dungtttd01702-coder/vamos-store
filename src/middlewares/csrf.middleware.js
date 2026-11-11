/**
 * CSRF Protection Middleware for SSR & Express
 * Validates cryptographic anti-CSRF token on all state-mutating requests (POST, PUT, DELETE, PATCH)
 */

const crypto = require('crypto');

function csrfMiddleware(req, res, next) {
  if (!req.session) {
    return next();
  }

  // 1. Ensure session has a persistent CSRF token
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }

  // 2. Expose csrfToken to all Pug templates via res.locals
  res.locals.csrfToken = req.session.csrfToken;

  // 3. Read-only HTTP methods are exempt from CSRF checks
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // 4. In test environment, bypass CSRF verification unless explicitly testing CSRF enforcement
  if (process.env.NODE_ENV === 'test' && !req._testCsrfEnforce) {
    return next();
  }

  // 5. Verify submitted token from form body or header
  const submittedToken = req.body?._csrf || req.headers['x-csrf-token'] || req.headers['csrf-token'];

  if (!submittedToken || submittedToken !== req.session.csrfToken) {
    const err = new Error('Phiên bảo mật của biểu mẫu đã hết hạn hoặc không hợp lệ (CSRF verification failed). Vui lòng tải lại trang và thử lại.');
    err.status = 403;
    return next(err);
  }

  next();
}

module.exports = csrfMiddleware;
