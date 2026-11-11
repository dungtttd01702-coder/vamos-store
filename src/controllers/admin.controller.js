const { query, getPool, sql } = require('../config/database');
const orderService = require('../services/order.service');

class AdminController {
  /**
   * Admin Dashboard with Key Metrics
   */
  async getDashboard(req, res, next) {
    try {
      const [revRes, orderRes, pendRes, prodRes, lowStockRes, recentOrdersRes] = await Promise.all([
        query("SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE order_status = 'COMPLETED' AND payment_status = 'PAID'"),
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

      const statusFilter = status === 'DELIVERED' ? 'COMPLETED' : status;
      if (statusFilter) {
        sqlWhere += ' AND o.order_status = @status';
        params.status = statusFilter;
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
      let { new_status, note } = req.body;
      const adminUser = req.session.user;

      // Map DELIVERED to COMPLETED if submitted
      if (new_status === 'DELIVERED') {
        new_status = 'COMPLETED';
      }

      const orderId = parseInt(id, 10);
      await orderService.updateOrderStatusByAdmin({
        orderId,
        newStatus: new_status,
        adminUserId: adminUser.id,
        note: note ? note.trim() : '',
      });

      res.redirect(`/admin/orders/${orderId}?success=true`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();

