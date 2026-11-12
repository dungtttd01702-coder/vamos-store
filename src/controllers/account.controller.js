const orderService = require('../services/order.service');
const { query } = require('../config/database');
const { isValidFullName, isValidPhone } = require('../utils/validator');

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

      const order = await orderService.getOrderDetails(id, user.id);
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

      const isNumeric = /^\d+$/.test(String(id).trim());
      let orderId = isNumeric ? parseInt(id, 10) : null;
      if (!orderId) {
        const oRes = await query('SELECT id FROM orders WHERE order_code = @code AND user_id = @userId', {
          code: String(id).trim(),
          userId: user.id,
        });
        if (oRes.recordset.length > 0) orderId = oRes.recordset[0].id;
      }

      if (!orderId) {
        throw new Error('Không tìm thấy đơn hàng cần hủy');
      }

      await orderService.cancelOrder(orderId, user.id);
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

      if (full_name && !isValidFullName(full_name)) {
        const err = new Error('Họ và tên phải có độ dài từ 2 đến 100 ký tự.');
        err.status = 400;
        return next(err);
      }

      if (phone && !isValidPhone(phone)) {
        const err = new Error('Số điện thoại không đúng định dạng di động Việt Nam (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09).');
        err.status = 400;
        return next(err);
      }

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
      if (full_name) req.session.user.full_name = full_name.trim();
      if (phone) req.session.user.phone = phone.trim();

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
      const { recipient_name, phone_number, phone, province, district, ward, address_line, detail_address, is_default } = req.body;

      const recipientPhone = (phone || phone_number || '').trim();
      const recipientDetail = (detail_address || address_line || '').trim();
      const recipientName = (recipient_name || '').trim();

      if (!recipientName || !recipientPhone || !recipientDetail) {
        const err = new Error('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ chi tiết.');
        err.status = 400;
        return next(err);
      }

      if (!isValidFullName(recipientName)) {
        const err = new Error('Họ và tên người nhận phải có độ dài từ 2 đến 100 ký tự.');
        err.status = 400;
        return next(err);
      }

      if (!isValidPhone(recipientPhone)) {
        const err = new Error('Số điện thoại người nhận không đúng định dạng di động Việt Nam (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09).');
        err.status = 400;
        return next(err);
      }

      const defBit = is_default ? 1 : 0;
      if (defBit === 1) {
        await query('UPDATE addresses SET is_default = 0 WHERE user_id = @userId', { userId: user.id });
      }

      await query(`
        INSERT INTO addresses (user_id, recipient_name, phone, province, district, ward, detail_address, is_default)
        VALUES (@userId, @name, @phone, @prov, @dist, @ward, @detail, @isDef)
      `, {
        userId: user.id,
        name: recipientName,
        phone: recipientPhone,
        prov: (province || '').trim(),
        dist: (district || '').trim(),
        ward: (ward || '').trim(),
        detail: recipientDetail,
        isDef: defBit,
      });

      res.redirect('/account/addresses');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AccountController();

