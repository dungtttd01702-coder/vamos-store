const config = require('../config/app.config');

const PUBLIC_500_MSG = 'Đã có lỗi xảy ra trên hệ thống.';
const PUBLIC_503_MSG = 'Hệ thống đang tạm thời gián đoạn. Vui lòng thử lại sau ít phút.';

function expectsJsonResponse(req) {
  const pathOnly = req.originalUrl ? String(req.originalUrl).split('?')[0] : '';
  return Boolean(
    req.xhr ||
    req.headers?.accept?.includes('application/json') ||
    (req.baseUrl && req.baseUrl.startsWith('/api')) ||
    pathOnly.startsWith('/api')
  );
}

/**
 * Handle 404 - Resource Not Found
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Trang bạn yêu cầu không tồn tại: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

/**
 * Centralized Error Handler
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  const isDev = config.app.env === 'development';

  const safeMethod = String(req.method || '').replace(/[\r\n]/g, '');
  const safeUrl = String(req.originalUrl || '').replace(/[\r\n]/g, '');
  const safeMsg = String(err.message || '')
    .replace(/[\r\n]/g, '')
    .replace(/[^\s@]{1,64}@[^\s@.]{1,63}(?:\.[^\s@.]{1,63}){1,8}/g, '[REDACTED_EMAIL]')
    .replace(/(password|pwd|secret|token|authorization)[ \t]{0,8}=[ \t]{0,8}[^;\s]{1,256}/gi, '$1=[REDACTED]')
    .replace(/Bearer[ \t]{1,8}[A-Za-z0-9._-]{1,512}/gi, 'Bearer [REDACTED]')
    .slice(0, 300);

  console.error(`[Error ${statusCode}] ${safeMethod} ${safeUrl} - ${safeMsg}`);
  if (isDev && statusCode === 500 && err.stack) {
    console.error(err.stack);
  }

  // Set response status
  res.status(statusCode);

  // If request expects JSON (API/AJAX)
  if (expectsJsonResponse(req)) {
    let publicMessage = err.message || PUBLIC_500_MSG;
    if (statusCode === 503) {
      publicMessage = PUBLIC_503_MSG;
    } else if (!isDev && statusCode >= 500 && !err.expose) {
      publicMessage = PUBLIC_500_MSG;
    }

    return res.json({
      success: false,
      status: statusCode,
      message: publicMessage,
      ...(err.errors ? { errors: err.errors } : {})
    });
  }

  // Handle Client Business & Validation Errors (400, 409, 422)
  if (statusCode === 400 || statusCode === 409 || statusCode === 422) {
    const referer = req.get('Referrer');
    if (referer) {
      try {
        const refUrl = new URL(referer);
        const hostHeader = req.get('host');
        if (refUrl.host === hostHeader && refUrl.pathname !== req.originalUrl) {
          if (req.flash) req.flash('warning', err.message);
          return res.redirect(refUrl.pathname + refUrl.search);
        }
      } catch (_) {}
    }
    if (req.flash) req.flash('warning', err.message);
    if (req.originalUrl.startsWith('/checkout')) {
      return res.redirect('/checkout');
    }
    return res.redirect('/cart');
  }

  // Handle Unauthorized (401)
  if (statusCode === 401) {
    if (req.flash) req.flash('error', 'Vui lòng đăng nhập để tiếp tục.');
    return res.redirect(`/auth/login?returnUrl=${encodeURIComponent(req.originalUrl)}`);
  }

  // Handle Forbidden (403)
  if (statusCode === 403) {
    return res.render('pages/errors/403', {
      title: 'Không Có Quyền Truy Cập - 403',
      message: err.message || 'Bạn không có quyền truy cập vào khu vực này.',
    });
  }

  // Handle 404 Not Found
  if (statusCode === 404) {
    return res.render('pages/errors/404', {
      title: 'Không tìm thấy trang - 404',
      currentUrl: req.originalUrl,
    });
  }

  // Handle Service Unavailable (503)
  if (statusCode === 503) {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', '30');
    }
    return res.render('pages/errors/503', {
      title: 'Dịch Vụ Tạm Thời Gián Đoạn - 503',
      message: PUBLIC_503_MSG
    });
  }

  // Handle 500 Internal Server Error (and other unhandled 5xx)
  return res.render('pages/errors/500', {
    title: 'Lỗi hệ thống - 500',
    message: isDev ? err.message : 'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau.'
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
