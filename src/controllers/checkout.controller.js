const orderService = require('../services/order.service');
const { query } = require('../config/database');
const { isValidFullName, isValidPhone } = require('../utils/validator');

class CheckoutController {
  /**
   * Display Checkout Form
   */
  async getCheckout(req, res, next) {
    try {
      const user = req.session?.user;
      if (!user) {
        return res.redirect('/auth/login?returnUrl=/checkout');
      }

      // Fetch cart items
      const cartRes = await query(`
        SELECT 
          ci.id AS cart_item_id, ci.quantity,
          p.name AS product_name, p.slug AS product_slug,
          COALESCE(p.sale_price, p.base_price) AS unit_price,
          (COALESCE(p.sale_price, p.base_price) * ci.quantity) AS line_total,
          s.size_name,
          c.color_name,
          (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC) AS image_url
        FROM cart_items ci
        JOIN carts ct ON ci.cart_id = ct.id
        JOIN product_variants pv ON ci.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN sizes s ON pv.size_id = s.id
        JOIN colors c ON pv.color_id = c.id
        WHERE ct.user_id = @userId
      `, { userId: user.id });

      const items = cartRes.recordset;
      if (!items || items.length === 0) {
        return res.redirect('/cart');
      }

      const subtotal = items.reduce((sum, item) => sum + Number(item.line_total), 0);
      const shippingFee = subtotal >= 500000 ? 0 : 30000;
      const totalAmount = subtotal + shippingFee;

      // Fetch saved addresses if any
      const addrRes = await query(`
        SELECT * FROM addresses WHERE user_id = @userId ORDER BY is_default DESC, id DESC
      `, { userId: user.id });

      const addresses = addrRes.recordset;
      const defaultAddr = addresses.find(a => a.is_default) || (addresses.length > 0 ? addresses[0] : null);

      res.render('pages/checkout/index', {
        title: 'Thanh Toán Đơn Hàng COD | VAMOS STORE',
        items,
        subtotal,
        shippingFee,
        totalAmount,
        addresses,
        defaultAddr,
        formData: {
          recipientName: defaultAddr ? defaultAddr.recipient_name : (user.full_name || ''),
          recipientPhone: defaultAddr ? (defaultAddr.phone || defaultAddr.phone_number) : (user.phone || ''),
          deliveryAddress: defaultAddr ? `${defaultAddr.detail_address || defaultAddr.address_line}, ${defaultAddr.ward}, ${defaultAddr.district}, ${defaultAddr.province}` : '',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process COD Order
   */
  async postCheckout(req, res, next) {
    try {
      const user = req.session?.user;
      if (!user) {
        return res.redirect('/auth/login?returnUrl=/checkout');
      }

      const {
        recipient_name,
        recipient_phone,
        province,
        district,
        ward,
        address_line,
        detail_address,
        full_address,
        customer_note,
        voucher_code,
      } = req.body;

      // Construct address
      let deliveryAddress = full_address ? full_address.trim() : '';
      const specificLine = detail_address || address_line;
      if (!deliveryAddress && specificLine) {
        deliveryAddress = [specificLine, ward, district, province].filter(Boolean).join(', ');
      }

      if (!recipient_name || !recipient_phone || !deliveryAddress) {
        throw new Error('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng nhận COD.');
      }

      if (!isValidFullName(recipient_name)) {
        throw new Error('Họ và tên người nhận phải có độ dài từ 2 đến 100 ký tự.');
      }

      if (!isValidPhone(recipient_phone)) {
        throw new Error('Số điện thoại người nhận không đúng định dạng di động Việt Nam (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09).');
      }

      // Execute transaction
      const order = await orderService.createCodOrder({
        userId: user.id,
        recipientName: recipient_name.trim(),
        recipientPhone: recipient_phone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        customerNote: customer_note ? customer_note.trim() : '',
        voucherCode: voucher_code ? voucher_code.trim() : null,
      });

      // Clear session cart count
      req.session.cartCount = 0;

      res.redirect(`/checkout/success/${order.id}`);
    } catch (error) {
      try {
        const user = req.session?.user;
        const cartRes = await query(`
          SELECT 
            ci.id AS cart_item_id, ci.quantity,
            p.name AS product_name, p.slug AS product_slug,
            COALESCE(p.sale_price, p.base_price) AS unit_price,
            (COALESCE(p.sale_price, p.base_price) * ci.quantity) AS line_total,
            s.size_name,
            c.color_name,
            (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC) AS image_url
          FROM cart_items ci
          JOIN carts ct ON ci.cart_id = ct.id
          JOIN product_variants pv ON ci.variant_id = pv.id
          JOIN products p ON pv.product_id = p.id
          JOIN sizes s ON pv.size_id = s.id
          JOIN colors c ON pv.color_id = c.id
          WHERE ct.user_id = @userId
        `, { userId: user ? user.id : 0 });

        const items = cartRes.recordset || [];
        const subtotal = items.reduce((sum, item) => sum + Number(item.line_total), 0);
        const shippingFee = subtotal >= 500000 ? 0 : 30000;
        const totalAmount = subtotal + shippingFee;

        const addrRes = await query(`
          SELECT * FROM addresses WHERE user_id = @userId ORDER BY is_default DESC, id DESC
        `, { userId: user ? user.id : 0 });
        const addresses = addrRes.recordset || [];

        return res.render('pages/checkout/index', {
          title: 'Thanh Toán Đơn Hàng COD | VAMOS STORE',
          items,
          subtotal,
          shippingFee,
          totalAmount,
          addresses,
          error_msg: error.message || 'Đã có lỗi xảy ra trong quá trình xử lý đơn hàng.',
          formData: {
            recipientName: req.body?.recipient_name || '',
            recipientPhone: req.body?.recipient_phone || '',
            deliveryAddress: req.body?.full_address || req.body?.detail_address || '',
            voucherCode: req.body?.voucher_code || '',
            customerNote: req.body?.customer_note || '',
          },
        });
      } catch (innerErr) {
        next(error);
      }
    }
  }

  /**
   * Order Success Confirmation Page
   */
  async getSuccess(req, res, next) {
    try {
      const user = req.session?.user;
      const { orderId } = req.params;

      const order = await orderService.getOrderDetails(Number.parseInt(orderId, 10), user ? user.id : null);
      if (!order) {
        const err = new Error('Không tìm thấy thông tin đơn hàng này.');
        err.status = 404;
        return next(err);
      }

      res.render('pages/checkout/success', {
        title: `Đặt Hàng Thành Công - #${order.order_code} | VAMOS STORE`,
        order,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CheckoutController();

