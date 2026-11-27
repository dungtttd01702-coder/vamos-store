const {
  formatVietnameseDate,
  formatVietnameseDateTime,
  formatVietnameseVoucherEnd,
  toUtcISOString
} = require('../utils/dateTime');

// Non-transient auth/TDS/config/schema errors MUST fail closed as HTTP 500 (never masked as 503).
const NON_TRANSIENT_DB_ERROR_CODES = new Set([
  'ELOGIN',
  'EFEDAUTH',
  'ETDS',
  'EINTERFACENOTSUPP',
  'EENCRYPT',
  'EARGS',
  'EPARAM',
  'ENAME',
  'EJSON'
]);

const NON_TRANSIENT_SQL_ERROR_NUMBERS = new Set([
  102,   // Incorrect syntax
  207,   // Invalid column name
  208,   // Invalid object name
  229,   // Permission denied
  547,   // Constraint conflict
  2812,  // Stored procedure not found
  4060,  // Cannot open database requested by login (non-transient per project policy)
  18456, // Login failed
  18470  // Login disabled
]);

// Verified mssql/tedious/Node transient socket, timeout, pool-lifecycle, deadlock, and Azure/SQL service errors -> HTTP 503.
const TRANSIENT_DB_ERROR_CODES = new Set([
  'ESOCKET',
  'ETIMEOUT',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ECONNABORTED',
  'EPIPE',
  'ENOTFOUND',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'ECLOSE',
  'EINSTLOOKUP',
  'EINVALIDSTATE',
  'ECANCEL',
  'ENET',
  'ENOTOPEN'
]);

const TRANSIENT_SQL_ERROR_NUMBERS = new Set([
  -2,
  1205,
  10928,
  10929,
  40197,
  40501,
  40613
]);

function collectErrorMetadata(rootErr) {
  const codes = [];
  const sqlNumbers = [];
  const visited = new Set();

  function walk(node, depth) {
    if (!node || typeof node !== 'object' || depth > 4 || visited.has(node)) {
      return;
    }
    visited.add(node);

    if (typeof node.code === 'string' && node.code.trim()) {
      codes.push(node.code.trim().toUpperCase());
    }
    if (typeof node.number === 'number') {
      sqlNumbers.push(node.number);
    }
    if (typeof node.info?.number === 'number') {
      sqlNumbers.push(node.info.number);
    }

    if (node.originalError) walk(node.originalError, depth + 1);
    if (node.cause) walk(node.cause, depth + 1);
    if (Array.isArray(node.precedingErrors)) {
      for (const pe of node.precedingErrors) walk(pe, depth + 1);
    }
    if (Array.isArray(node.errors)) {
      for (const nested of node.errors) walk(nested, depth + 1);
    }
  }

  walk(rootErr, 0);
  return { codes, sqlNumbers };
}

/**
 * Classify verified mssql/tedious/Node network/timeout/deadlock errors as transient unavailability (HTTP 503).
 * Checks explicit non-transient SQL/driver codes BEFORE transient codes and never treats generic ConnectionError as 503.
 */
function isTransientDbError(err) {
  if (!err || typeof err !== 'object') return false;
  const { codes, sqlNumbers } = collectErrorMetadata(err);

  for (const num of sqlNumbers) {
    if (NON_TRANSIENT_SQL_ERROR_NUMBERS.has(num)) return false;
  }
  for (const code of codes) {
    if (NON_TRANSIENT_DB_ERROR_CODES.has(code)) return false;
  }
  for (const num of sqlNumbers) {
    if (TRANSIENT_SQL_ERROR_NUMBERS.has(num)) return true;
  }
  for (const code of codes) {
    if (TRANSIENT_DB_ERROR_CODES.has(code)) return true;
  }
  return false;
}

function isApiRequest(req) {
  const pathOnly = req.originalUrl ? String(req.originalUrl).split('?')[0] : '';
  return Boolean(
    req.xhr ||
    req.headers?.accept?.includes('application/json') ||
    (req.baseUrl && req.baseUrl.startsWith('/api')) ||
    (req.path && req.path.startsWith('/api')) ||
    pathOnly.startsWith('/api')
  );
}

function destroySessionAndReject(req, res, { isApi, redirectUrl, apiStatus, apiMessage }) {
  const finish = () => {
    if (typeof res.clearCookie === 'function') {
      res.clearCookie('vamos_sid');
    }
    if (isApi) {
      return res.status(apiStatus).json({
        success: false,
        status: apiStatus,
        message: apiMessage
      });
    }
    return res.redirect(redirectUrl);
  };

  if (req.session && typeof req.session.destroy === 'function') {
    req.session.destroy(() => finish());
    return;
  }
  finish();
}

async function verifyAccountStatusOrFailClosed(req, res, next, options) {
  try {
    const { query } = require('../config/database');
    const uRes = await query(options.statusQuery, { id: req.session.user.id });
    const row = uRes?.recordset?.[0];

    if (options.isInvalid(row)) {
      return destroySessionAndReject(req, res, {
        isApi: options.isApi,
        redirectUrl: options.invalidRedirect,
        apiStatus: options.invalidApiStatus,
        apiMessage: options.invalidApiMessage
      });
    }

    return next();
  } catch (err) {
    const { codes, sqlNumbers } = collectErrorMetadata(err);
    const code = codes[0] || null;
    const sqlNum = sqlNumbers.length > 0 ? sqlNumbers[0] : null;
    console.error(`[Auth Status Verification Error] ${options.logTag}: code=${code || 'NONE'} sql=${sqlNum ?? 'NONE'}`);

    if (isTransientDbError(err)) {
      const dbErr = new Error('Hệ thống đang tạm thời gián đoạn khi xác minh trạng thái tài khoản. Vui lòng thử lại sau.');
      dbErr.status = 503;
      dbErr.code = 'AUTH_DB_UNAVAILABLE';
      return next(dbErr);
    }

    if (!err.status) {
      err.status = 500;
    }
    return next(err);
  }
}

/**
 * Attach authentication state from session to res.locals for view templates
 * and provide lightweight, single-use Flash message support
 */
function sessionContextMiddleware(req, res, next) {
  res.locals.user = req.session?.user || null;
  res.locals.isAuthenticated = !!req.session?.user;
  res.locals.isAdmin = req.session?.user?.role === 'ADMIN';
  res.locals.isCustomer = req.session?.user?.role === 'CUSTOMER';
  res.locals.cartCount = req.session?.cartCount || 0;
  res.locals.currentPath = req.path;
  res.locals.formatVnDate = formatVietnameseDate;
  res.locals.formatVnDateTime = formatVietnameseDateTime;
  res.locals.formatVnVoucherEnd = formatVietnameseVoucherEnd;
  res.locals.toUtcISOString = toUtcISOString;

  // Flash message support: consume once from session and expose to res.locals
  if (req.session?.flash) {
    res.locals.success_msg = req.session.flash.success_msg || null;
    res.locals.error_msg = req.session.flash.error_msg || null;
    res.locals.warning_msg = req.session.flash.warning_msg || null;
    delete req.session.flash; // Single-use consumption ensures message is shown only once
  } else {
    res.locals.success_msg = null;
    res.locals.error_msg = null;
    res.locals.warning_msg = null;
  }

  // Helper method on req to set single-use flash messages
  req.flash = function(type, message) {
    if (!req.session) return;
    if (!req.session.flash) {
      req.session.flash = {};
    }
    req.session.flash[`${type}_msg`] = message;
  };

  next();
}

/**
 * Ensure user is logged in
 */
async function requireAuth(req, res, next) {
  const isApi = isApiRequest(req);
  if (!req.session?.user) {
    if (isApi) {
      return res.status(401).json({ success: false, status: 401, message: 'Vui lòng đăng nhập để tiếp tục' });
    }
    return res.redirect(`/auth/login?returnUrl=${encodeURIComponent(req.originalUrl)}`);
  }

  return verifyAccountStatusOrFailClosed(req, res, next, {
    statusQuery: 'SELECT status FROM users WHERE id = @id',
    isInvalid: (row) => !row || row.status === 'locked',
    isApi,
    invalidRedirect: '/auth/login?error=account_locked',
    invalidApiStatus: 401,
    invalidApiMessage: 'Phiên đăng nhập không còn hiệu lực hoặc tài khoản đã bị khóa.',
    logTag: 'requireAuth'
  });
}

/**
 * Ensure user is a Guest (not logged in)
 * If an active session already exists, prevent re-authentication, preserve current session,
 * flash a clear user-friendly warning message, and safely redirect to home page or admin portal.
 */
function requireGuest(req, res, next) {
  if (req.session?.user) {
    if (typeof req.flash === 'function') {
      req.flash(
        'warning',
        'Bạn đang đăng nhập bằng tài khoản hiện tại. Vui lòng đăng xuất trước khi sử dụng tài khoản khác.'
      );
    }
    if (req.session.user.role === 'ADMIN') {
      return res.redirect('/admin/dashboard');
    }
    return res.redirect('/');
  }
  next();
}

/**
 * Ensure user is a Customer
 * Strictly blocks Admin from shopping actions, placing orders, or accessing customer account.
 */
async function requireCustomer(req, res, next) {
  const isApi = isApiRequest(req);

  if (!req.session?.user) {
    if (isApi) {
      return res.status(401).json({ success: false, status: 401, message: 'Vui lòng đăng nhập để tiếp tục' });
    }
    return res.redirect(`/auth/login?returnUrl=${encodeURIComponent(req.originalUrl)}`);
  }

  if (req.session.user.role === 'ADMIN') {
    if (isApi) {
      return res.status(403).json({ success: false, status: 403, message: 'Tài khoản Quản trị viên không thể thực hiện thao tác này' });
    }
    if (typeof req.flash === 'function') {
      req.flash('warning', 'Tài khoản Quản trị viên không thực hiện giao dịch của Khách hàng.');
    }
    return res.redirect('/admin/dashboard');
  }

  return verifyAccountStatusOrFailClosed(req, res, next, {
    statusQuery: 'SELECT status FROM users WHERE id = @id',
    isInvalid: (row) => !row || row.status === 'locked',
    isApi,
    invalidRedirect: '/auth/login?error=account_locked',
    invalidApiStatus: 401,
    invalidApiMessage: 'Tài khoản của bạn không còn hiệu lực hoặc đã bị khóa.',
    logTag: 'requireCustomer'
  });
}

/**
 * Ensure user is an Admin
 */
async function requireAdmin(req, res, next) {
  const isApi = isApiRequest(req);
  if (!req.session?.user) {
    if (isApi) {
      return res.status(401).json({ success: false, status: 401, message: 'Vui lòng đăng nhập bằng tài khoản Quản trị viên.' });
    }
    return res.redirect(`/auth/login?returnUrl=${encodeURIComponent(req.originalUrl)}`);
  }
  if (req.session.user.role !== 'ADMIN') {
    const error = new Error('Bạn không có quyền truy cập khu vực quản trị');
    error.status = 403;
    return next(error);
  }

  return verifyAccountStatusOrFailClosed(req, res, next, {
    statusQuery: 'SELECT status, role FROM users WHERE id = @id',
    isInvalid: (row) => !row || row.status !== 'active' || row.role !== 'ADMIN',
    isApi,
    invalidRedirect: '/auth/login',
    invalidApiStatus: 403,
    invalidApiMessage: 'Tài khoản Quản trị viên không còn quyền hoặc đã bị vô hiệu hóa.',
    logTag: 'requireAdmin'
  });
}

module.exports = {
  sessionContextMiddleware,
  requireAuth,
  requireGuest,
  requireCustomer,
  requireAdmin,
  isTransientDbError,
  isApiRequest
};

