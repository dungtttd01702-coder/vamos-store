const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidFullName,
} = require('../utils/validator');

class AuthController {
  /**
   * Render Login Page
   */
  getLogin(req, res) {
    if (req.session?.user) {
      return res.redirect('/');
    }
    res.render('pages/auth/login', {
      title: 'Đăng Nhập Tài Khoản',
      returnUrl: req.query.returnUrl || '/',
    });
  }

  /**
   * Process Login
   */
  async postLogin(req, res, next) {
    try {
      const { email, password, returnUrl } = req.body;

      if (!email || !password) {
        return res.render('pages/auth/login', {
          title: 'Đăng Nhập Tài Khoản',
          error_msg: 'Vui lòng nhập đầy đủ email và mật khẩu.',
          email,
          returnUrl,
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Strict email format check
      if (!isValidEmail(normalizedEmail)) {
        return res.render('pages/auth/login', {
          title: 'Đăng Nhập Tài Khoản',
          error_msg: 'Địa chỉ email không đúng định dạng (ví dụ: user@example.com).',
          email,
          returnUrl,
        });
      }

      const userRes = await query('SELECT id, full_name, email, password_hash, role, status FROM users WHERE email = @email', { email: normalizedEmail });
      if (userRes.recordset.length === 0) {
        return res.render('pages/auth/login', {
          title: 'Đăng Nhập Tài Khoản',
          error_msg: 'Email hoặc mật khẩu không chính xác.',
          email,
          returnUrl,
        });
      }

      const user = userRes.recordset[0];
      if (user.status === 'locked') {
        return res.render('pages/auth/login', {
          title: 'Đăng Nhập Tài Khoản',
          error_msg: 'Tài khoản của bạn hiện đang bị tạm khóa. Vui lòng liên hệ bộ phận hỗ trợ.',
          email,
          returnUrl,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.render('pages/auth/login', {
          title: 'Đăng Nhập Tài Khoản',
          error_msg: 'Email hoặc mật khẩu không chính xác.',
          email,
          returnUrl,
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
      const cartCount = countRes.recordset[0]?.total_items || 0;

      // Set user session
      req.session.user = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        cartId,
      };
      req.session.cartCount = cartCount;

      req.session.save((err) => {
        if (err) return next(err);
        const redirectTarget = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/';
        res.redirect(redirectTarget);
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
   * Process Registration
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

      // 3. Strict Email Validation (domain + extension required)
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

      // 8. Hash password with bcrypt
      const passwordHash = await bcrypt.hash(password, 10);

      // 9. Insert User
      const userRes = await query(`
        INSERT INTO users (full_name, email, password_hash, phone, role, status)
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role
        VALUES (@fullName, @email, @hash, @phone, 'CUSTOMER', 'active')
      `, {
        fullName: full_name.trim(),
        email: normalizedEmail,
        hash: passwordHash,
        phone: cleanPhone,
      });

      const newUser = userRes.recordset[0];

      // Create persistent cart for new customer
      const cartRes = await query('INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@userId)', { userId: newUser.id });
      const cartId = cartRes.recordset[0].id;

      // Automatically authenticate in session
      req.session.user = {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        cartId,
      };
      req.session.cartCount = 0;

      req.session.save((err) => {
        if (err) return next(err);
        res.redirect('/');
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process Logout
   */
  postLogout(req, res) {
    req.session.destroy(() => {
      res.redirect('/');
    });
  }
}

module.exports = new AuthController();

