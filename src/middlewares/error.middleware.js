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
  const statusCode = err.status || 500;
  const isDev = config.app.env === 'development';

  console.error(`[Error ${statusCode}] ${req.method} ${req.originalUrl} - ${err.message}`);
  if (isDev && statusCode === 500 && err.stack) {
    console.error(err.stack);
  }

  // Set response status
  res.status(statusCode);

  // If request expects JSON (API/AJAX)
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({
      success: false,
      status: statusCode,
      message: err.message || 'Đã có lỗi xảy ra trên hệ thống',
      ...(isDev ? { stack: err.stack } : {}),
    });
  }

  // Render error view for browser navigation
  if (statusCode === 404) {
    return res.render('pages/errors/404', {
      title: 'Không tìm thấy trang - 404',
      currentUrl: req.originalUrl,
    });
  }

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

