const { query, getPool, sql } = require('../config/database');
const orderService = require('../services/order.service');

class AdminController {
  /**
   * Admin Dashboard with Key Metrics
   */
  async getDashboard(req, res, next) {
    try {
      const [revRes, orderRes, pendRes, prodRes, lowStockRes, recentOrdersRes] = await Promise.all([
        query("SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE order_status != 'CANCELLED'"),
        query("SELECT COUNT(*) AS total_orders FROM orders"),
        query("SELECT COUNT(*) AS pending_orders FROM orders WHERE order_status = 'PENDING'"),
        query("SELECT COUNT(*) AS total_products FROM products WHERE status = 'active'"),
        query(`
          SELECT TOP 5 pv.id, pv.sku, pv.stock_quantity, p.name AS product_name, s.size_name, c.color_name
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          JOIN sizes s ON pv.size_id = s.id
          JOIN colors c ON pv.color_id = c.id
          WHERE pv.stock_quantity <= 5
          ORDER BY pv.stock_quantity ASC
        `),
        query(`
          SELECT TOP 5 o.id, o.order_code, o.recipient_name_snapshot, o.total_amount, o.order_status, o.payment_status, o.created_at
          FROM orders o
          ORDER BY o.id DESC
        `),
      ]);

      res.render('pages/admin/dashboard', {
        title: 'Bảng Điều Khiển Quản Trị (Admin Dashboard) | VAMOS STORE',
        stats: {
          totalRevenue: revRes.recordset[0].total_revenue,
          totalOrders: orderRes.recordset[0].total_orders,
          pendingOrders: pendRes.recordset[0].pending_orders,
          totalProducts: prodRes.recordset[0].total_products,
        },
        lowStockItems: lowStockRes.recordset,
        recentOrders: recentOrdersRes.recordset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Orders List
   */
  async getOrders(req, res, next) {
    try {
      const { status, q } = req.query;
      let sqlWhere = 'WHERE 1=1';
      const params = {};

      if (status) {
        sqlWhere += ' AND o.order_status = @status';
        params.status = status;
      }

      if (q) {
        sqlWhere += ' AND (o.order_code LIKE @q OR o.recipient_name_snapshot LIKE @q OR o.recipient_phone_snapshot LIKE @q)';
        params.q = `%${q}%`;
      }

      const ordersRes = await query(`
        SELECT 
          o.id, o.order_code, o.recipient_name_snapshot, o.recipient_phone_snapshot,
          o.total_amount, o.order_status, o.payment_method, o.payment_status, o.created_at,
          (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
        FROM orders o
        ${sqlWhere}
        ORDER BY o.id DESC
      `, params);

      res.render('pages/admin/orders', {
        title: 'Quản Lý Đơn Hàng | VAMOS STORE',
        orders: ordersRes.recordset,
        selectedStatus: status || '',
        searchQuery: q || '',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Order Detail
   */
  async getOrderDetail(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderDetails(parseInt(id, 10));
      if (!order) {
        const err = new Error('Không tìm thấy đơn hàng này');
        err.status = 404;
        return next(err);
      }

      res.render('pages/admin/order-detail', {
        title: `Quản Trị Đơn Hàng #${order.order_code} | VAMOS STORE`,
        order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Update Order Status
   */
  async postUpdateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { new_status, note } = req.body;
      const adminUser = req.session.user;

      const orderId = parseInt(id, 10);
      const pool = await getPool();
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        const orderReq = new sql.Request(transaction);
        orderReq.input('orderId', orderId);
        const orderRes = await orderReq.query('SELECT * FROM orders WITH (UPDLOCK, ROWLOCK) WHERE id = @orderId');
        if (orderRes.recordset.length === 0) {
          throw new Error('Đơn hàng không tồn tại');
        }

        const currentOrder = orderRes.recordset[0];
        const oldStatus = currentOrder.order_status;

        // If status changed to CANCELLED and was not already cancelled, restore inventory!
        if (new_status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
          const itemsReq = new sql.Request(transaction);
          itemsReq.input('orderId', orderId);
          const itemsRes = await itemsReq.query('SELECT product_variant_id, quantity FROM order_items WHERE order_id = @orderId');
          for (const item of itemsRes.recordset) {
            const stockReq = new sql.Request(transaction);
            stockReq.input('varId', item.product_variant_id);
            stockReq.input('qty', item.quantity);
            await stockReq.query('UPDATE product_variants SET stock_quantity = stock_quantity + @qty, updated_at = GETDATE() WHERE id = @varId');
          }
        }

        // If delivered, mark payment_status = 'PAID' (COD cash received)
        let newPaymentStatus = currentOrder.payment_status;
        if (new_status === 'DELIVERED') {
          newPaymentStatus = 'PAID';
        }

        const updateReq = new sql.Request(transaction);
        updateReq.input('orderId', orderId);
        updateReq.input('newStatus', new_status);
        updateReq.input('payStatus', newPaymentStatus);
        await updateReq.query(`
          UPDATE orders 
          SET order_status = @newStatus, payment_status = @payStatus, updated_at = GETDATE() 
          WHERE id = @orderId
        `);

        // Record history
        const histReq = new sql.Request(transaction);
        histReq.input('orderId', orderId);
        histReq.input('adminId', adminUser.id);
        histReq.input('oldStatus', oldStatus);
        histReq.input('newStatus', new_status);
        histReq.input('histNote', note || `Admin cập nhật trạng thái đơn hàng từ ${oldStatus} sang ${new_status}`);
        await histReq.query(`
          INSERT INTO order_status_histories (order_id, changed_by, previous_status, new_status, note)
          VALUES (@orderId, @adminId, @oldStatus, @newStatus, @histNote)
        `);

        await transaction.commit();
        res.redirect(`/admin/orders/${orderId}?success=true`);
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();

