/**
 * Attach authentication state from session to res.locals for view templates
 * and provide lightweight, single-use Flash message support
 */
function sessionContextMiddleware(req, res, next) {
  res.locals.user = req.session?.user || null;
  res.locals.isAuthenticated = !!req.session?.user;
  res.locals.isAdmin = req.session?.user?.role === 'ADMIN';
  res.locals.cartCount = req.session?.cartCount || 0;
  res.locals.currentPath = req.path;

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
function requireAuth(req, res, next) {
  if (!req.session?.user) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục' });
    }
    return res.redirect(`/auth/login?returnUrl=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
}

/**
 * Ensure user is a Guest (not logged in)
 * If an active session already exists, prevent re-authentication, preserve current session,
 * flash a clear user-friendly warning message, and safely redirect to home page.
 */
function requireGuest(req, res, next) {
  if (req.session?.user) {
    if (typeof req.flash === 'function') {
      req.flash(
        'warning',
        'Bạn đang đăng nhập bằng tài khoản hiện tại. Vui lòng đăng xuất trước khi sử dụng tài khoản khác.'
      );
    }
    return res.redirect('/');
  }
  next();
}

/**
 * Ensure user is an Admin
 */
function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    return res.redirect(`/auth/login?returnUrl=${encodeURIComponent(req.originalUrl)}`);
  }
  if (req.session.user.role !== 'ADMIN') {
    const error = new Error('Bạn không có quyền truy cập khu vực quản trị');
    error.status = 403;
    return next(error);
  }
  next();
}

module.exports = {
  sessionContextMiddleware,
  requireAuth,
  requireGuest,
  requireAdmin,
};

