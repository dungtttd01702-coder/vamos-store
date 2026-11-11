const bcrypt = require('bcryptjs');
const { sql, getPool, query, withTransaction } = require('../config/database');
const CartController = require('./cart.controller');
const {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidFullName,
} = require('../utils/validator');

/**
 * Sanitize and validate internal redirect URL (prevents open redirects and protocol-relative URLs)
 * @param {string} returnUrl 
 * @returns {string}
 */
function getSafeReturnUrl(returnUrl) {
  if (!returnUrl || typeof returnUrl !== 'string') return '/';
  const trimmed = returnUrl.trim();
  // Must start with single / and not be followed by / or \ (blocks //evil.com or /\evil.com)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }
  return '/';
}

class AuthController {
  /**
   * Render Login Page
   */
  getLogin(req, res) {
    if (req.session?.user) {
      return res.redirect('/');
    }
    const returnUrl = getSafeReturnUrl(req.query.returnUrl);
    let error_msg = null;
    if (req.query.error === 'account_locked') {
      error_msg = 'Tài khoản của bạn đã bị tạm khóa bởi Quản trị viên. Phiên làm việc đã bị hủy.';
    }
    res.render('pages/auth/login', {
      title: 'Đăng Nhập Tài Khoản',
      returnUrl,
      error_msg,
    });
  }

  /**
   * Process Login with Session Regeneration
   */
  async postLogin(req, res, next) {
    try {
      const { email, password, returnUrl } = req.body;
      const safeReturnUrl = getSafeReturnUrl(returnUrl);

      if (!email || !password) {
        return res.render('pages/auth/login', {
          title: 'Đăng Nhập Tài Khoản',
          error_msg: 'Vui lòng nhập đầy đủ email và mật khẩu.',
          email,
          returnUrl: safeReturnUrl,
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Strict email format check
      if (!isValidEmail(normalizedEmail)) {
        return res.render('pages/auth/login', {
          title: 'Đăng Nhập Tài Khoản',
          error_msg: 'Địa chỉ email không đúng định dạng (ví dụ: user@example.com).',
          email,
          returnUrl: safeReturnUrl,
        });
      }

      const userRes = await query('SELECT id, full_name, email, password_hash, role, status FROM users WHERE email = @email', { email: normalizedEmail });
      if (userRes.recordset.length === 0) {
        return res.render('pages/auth/login', {
          title: 'Đăng Nhập Tài Khoản',
          error_msg: 'Email hoặc mật khẩu không chính xác.',
          email,
          returnUrl: safeReturnUrl,
        });
      }

      const user = userRes.recordset[0];
      if (user.status === 'locked') {
        return res.render('pages/auth/login', {
          title: 'Đăng Nhập Tài Khoản',
          error_msg: 'Tài khoản của bạn hiện đang bị tạm khóa. Vui lòng liên hệ bộ phận hỗ trợ.',
          email,
          returnUrl: safeReturnUrl,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.render('pages/auth/login', {
          title: 'Đăng Nhập Tài Khoản',
          error_msg: 'Email hoặc mật khẩu không chính xác.',
          email,
          returnUrl: safeReturnUrl,
        });
      }

      // Ensure customer has a cart created in database
      const cartRes = await query('SELECT id FROM carts WHERE user_id = @userId', { userId: user.id });
      let cartId;
      if (cartRes.recordset.length === 0) {
        const newCart = await query('INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@userId)', { userId: user.id });
        cartId = newCart.recordset[0].id;
      } else {
        cartId = cartRes.recordset[0].id;
      }

      // Count items in cart
      const countRes = await query('SELECT SUM(quantity) AS total_items FROM cart_items WHERE cart_id = @cartId', { cartId });
      let cartCount = countRes.recordset[0]?.total_items || 0;

      // Preserve and merge guest session cart if present (Decision Q2)
      const guestCart = req.session?.guestCart || [];
      if (guestCart.length > 0) {
        cartCount = await CartController.constructor.mergeGuestCart(cartId, guestCart);
      }

      // Regenerate session to protect against Session Fixation attacks
      req.session.regenerate((regenErr) => {
        if (regenErr) return next(regenErr);

        req.session.user = {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          cartId,
        };
        req.session.cartCount = cartCount;
        req.session.guestCart = [];

        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          res.redirect(safeReturnUrl);
        });
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Render Register Page
   */
  getRegister(req, res) {
    if (req.session?.user) {
      return res.redirect('/');
    }
    res.render('pages/auth/register', {
      title: 'Đăng Ký Tài Khoản Mới',
    });
  }

  /**
   * Process Registration in Atomic Database Transaction
   */
  async postRegister(req, res, next) {
    try {
      const { full_name, email, phone, password, confirm_password } = req.body;

      // 1. Check required fields
      if (!full_name || !email || !password) {
        return res.render('pages/auth/register', {
          title: 'Đăng Ký Tài Khoản Mới',
          error_msg: 'Vui lòng điền đầy đủ các thông tin bắt buộc.',
          formData: req.body,
        });
      }

      // 2. Validate Full Name
      if (!isValidFullName(full_name)) {
        return res.render('pages/auth/register', {
          title: 'Đăng Ký Tài Khoản Mới',
          error_msg: 'Họ và tên phải có độ dài từ 2 đến 100 ký tự.',
          formData: req.body,
        });
      }

      // 3. Strict Email Validation
      const normalizedEmail = email.trim().toLowerCase();
      if (!isValidEmail(normalizedEmail)) {
        return res.render('pages/auth/register', {
          title: 'Đăng Ký Tài Khoản Mới',
          error_msg: 'Địa chỉ email không đúng định dạng. Email phải có phần mở rộng tên miền hợp lệ (ví dụ: tenban@gmail.com).',
          formData: req.body,
        });
      }

      // 4. Validate Phone Number (if provided)
      const cleanPhone = phone ? phone.trim() : null;
      if (cleanPhone && !isValidPhone(cleanPhone)) {
        return res.render('pages/auth/register', {
          title: 'Đăng Ký Tài Khoản Mới',
          error_msg: 'Số điện thoại không đúng định dạng Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09).',
          formData: req.body,
        });
      }

      // 5. Validate Password
      if (!isValidPassword(password)) {
        return res.render('pages/auth/register', {
          title: 'Đăng Ký Tài Khoản Mới',
          error_msg: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.',
          formData: req.body,
        });
      }

      // 6. Confirm Password Match
      if (password !== confirm_password) {
        return res.render('pages/auth/register', {
          title: 'Đăng Ký Tài Khoản Mới',
          error_msg: 'Mật khẩu xác nhận không khớp.',
          formData: req.body,
        });
      }

      // 7. Check existing email in DB
      const existRes = await query('SELECT id FROM users WHERE email = @email', { email: normalizedEmail });
      if (existRes.recordset.length > 0) {
        return res.render('pages/auth/register', {
          title: 'Đăng Ký Tài Khoản Mới',
          error_msg: 'Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.',
          formData: req.body,
        });
      }

      // 8. Hash password with bcrypt (10 salt rounds)
      const passwordHash = await bcrypt.hash(password, 10);

      // 9. Atomic Transaction: Create User + Cart
      const pool = await getPool();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      let newUser;
      let cartId;

      try {
        const userReq = new sql.Request(transaction);
        userReq.input('fullName', full_name.trim());
        userReq.input('email', normalizedEmail);
        userReq.input('hash', passwordHash);
        userReq.input('phone', cleanPhone);
        const insertUserRes = await userReq.query(`
          INSERT INTO users (full_name, email, password_hash, phone, role, status)
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role
          VALUES (@fullName, @email, @hash, @phone, 'CUSTOMER', 'active')
        `);
        newUser = insertUserRes.recordset[0];

        const cartReq = new sql.Request(transaction);
        cartReq.input('userId', newUser.id);
        const insertCartRes = await cartReq.query(`
          INSERT INTO carts (user_id)
          OUTPUT INSERTED.id
          VALUES (@userId)
        `);
        cartId = insertCartRes.recordset[0].id;

        await transaction.commit();
      } catch (txErr) {
        await transaction.rollback();
        throw txErr;
      }

      // 10. Preserve and merge guest session cart if present (Decision Q2)
      const guestCart = req.session?.guestCart || [];
      let registeredCartCount = 0;
      if (guestCart.length > 0) {
        registeredCartCount = await CartController.constructor.mergeGuestCart(cartId, guestCart);
      }

      // 11. Automatically authenticate in session with regeneration
      req.session.regenerate((regenErr) => {
        if (regenErr) return next(regenErr);

        req.session.user = {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          cartId,
        };
        req.session.cartCount = registeredCartCount;
        req.session.guestCart = [];

        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          res.redirect('/');
        });
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process Logout
   */
  postLogout(req, res, next) {
    req.session.destroy((err) => {
      if (err) {
        console.error('[Session Destroy Warning]:', err.message);
      }
      res.clearCookie('vamos_sid');
      res.redirect('/');
    });
  }
}

const authController = new AuthController();
authController.getSafeReturnUrl = getSafeReturnUrl;

module.exports = authController;

