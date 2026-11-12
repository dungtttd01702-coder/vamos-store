const config = require('../config/app.config');

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

  console.error(`[Error ${statusCode}] ${req.method} ${req.originalUrl} - ${err.message}`);
  if (isDev && statusCode === 500 && err.stack) {
    console.error(err.stack);
  }

  // Set response status
  res.status(statusCode);

  // If request expects JSON (API/AJAX)
  if (req.xhr || req.headers?.accept?.includes('application/json')) {
    return res.json({
      success: false,
      status: statusCode,
      message: err.message || 'Đã có lỗi xảy ra trên hệ thống.',
      ...(err.errors ? { errors: err.errors } : {}),
      ...(isDev ? { stack: err.stack } : {}),
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

  // Handle 500 Internal Server Error (and other unhandled 5xx)
  return res.render('pages/errors/500', {
    title: 'Lỗi hệ thống - 500',
    message: isDev ? err.message : 'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau.',
    stack: isDev ? err.stack : null,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
