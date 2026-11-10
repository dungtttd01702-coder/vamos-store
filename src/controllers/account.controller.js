const orderService = require('../services/order.service');
const { query } = require('../config/database');

class AccountController {
  /**
   * Order History List
   */
  async getOrders(req, res, next) {
    try {
      const user = req.session.user;
      const orders = await orderService.getCustomerOrders(user.id);

      res.render('pages/account/orders', {
        title: 'Lịch Sử Đơn Hàng | VAMOS STORE',
        orders,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Order Detail View
   */
  async getOrderDetail(req, res, next) {
    try {
      const user = req.session.user;
      const { id } = req.params;

      const order = await orderService.getOrderDetails(parseInt(id, 10), user.id);
      if (!order) {
        const err = new Error('Không tìm thấy đơn hàng này');
        err.status = 404;
        return next(err);
      }

      res.render('pages/account/order-detail', {
        title: `Chi Tiết Đơn Hàng #${order.order_code} | VAMOS STORE`,
        order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel Order (Only permitted when order_status = 'PENDING')
   */
  async postCancelOrder(req, res, next) {
    try {
      const user = req.session.user;
      const { id } = req.params;

      await orderService.cancelOrder(parseInt(id, 10), user.id);
      res.redirect(`/account/orders/${id}?cancelled=true`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Personal Profile
   */
  async getProfile(req, res, next) {
    try {
      const user = req.session.user;
      const userRes = await query('SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = @id', { id: user.id });
      
      res.render('pages/account/profile', {
        title: 'Thông Tin Tài Khoản | VAMOS STORE',
        profile: userRes.recordset[0],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Profile
   */
  async postProfile(req, res, next) {
    try {
      const user = req.session.user;
      const { full_name, phone } = req.body;

      await query(`
        UPDATE users 
        SET full_name = @fullName, phone = @phone, updated_at = GETDATE()
        WHERE id = @id
      `, {
        fullName: full_name ? full_name.trim() : null,
        phone: phone ? phone.trim() : null,
        id: user.id,
      });

      // Update session user
      req.session.user.full_name = full_name;
      req.session.user.phone = phone;

      res.redirect('/account/profile?success=true');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Saved Addresses List
   */
  async getAddresses(req, res, next) {
    try {
      const user = req.session.user;
      const addrRes = await query(`
        SELECT * FROM addresses WHERE user_id = @userId ORDER BY is_default DESC, id DESC
      `, { userId: user.id });

      res.render('pages/account/addresses', {
        title: 'Sổ Địa Chỉ Giao Hàng | VAMOS STORE',
        addresses: addrRes.recordset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add New Address
   */
  async postAddAddress(req, res, next) {
    try {
      const user = req.session.user;
      const { recipient_name, phone_number, province, district, ward, address_line, is_default } = req.body;

      const defBit = is_default ? 1 : 0;
      if (defBit === 1) {
        await query('UPDATE addresses SET is_default = 0 WHERE user_id = @userId', { userId: user.id });
      }

      await query(`
        INSERT INTO addresses (user_id, recipient_name, phone_number, province, district, ward, address_line, is_default)
        VALUES (@userId, @name, @phone, @prov, @dist, @ward, @line, @isDef)
      `, {
        userId: user.id,
        name: recipient_name.trim(),
        phone: phone_number.trim(),
        prov: province.trim(),
        dist: district.trim(),
        ward: ward.trim(),
        line: address_line.trim(),
        isDef: defBit,
      });

      res.redirect('/account/addresses');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AccountController();

