/**
 * Attach authentication state from session to res.locals for view templates
 */
function sessionContextMiddleware(req, res, next) {
  res.locals.user = req.session?.user || null;
  res.locals.isAuthenticated = !!req.session?.user;
  res.locals.isAdmin = req.session?.user?.role === 'ADMIN';
  res.locals.cartCount = req.session?.cartCount || 0;
  res.locals.currentPath = req.path;
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
  requireAdmin,
};

