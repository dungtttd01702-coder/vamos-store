const { query, getPool, sql } = require('../config/database');
const orderService = require('../services/order.service');

class AdminController {
  /**
   * Admin Dashboard with Key Metrics & Top Products (UC-14)
   */
  async getDashboard(req, res, next) {
    try {
      const [revRes, orderRes, pendRes, prodRes, skuRes, lowStockRes, recentOrdersRes, topProdRes, statusCountsRes] = await Promise.all([
        query("SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE order_status = 'COMPLETED' AND payment_status = 'PAID'"),
        query("SELECT COUNT(*) AS total_orders FROM orders"),
        query("SELECT COUNT(*) AS pending_orders FROM orders WHERE order_status = 'PENDING'"),
        query("SELECT COUNT(*) AS total_products FROM products WHERE status = 'active'"),
        query("SELECT COUNT(*) AS total_skus FROM product_variants WHERE status = 'active'"),
        query(`
          SELECT TOP 8 pv.id, pv.sku, pv.stock_quantity, p.name AS product_name, s.size_name, c.color_name
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          JOIN sizes s ON pv.size_id = s.id
          JOIN colors c ON pv.color_id = c.id
          WHERE pv.stock_quantity <= 5
          ORDER BY pv.stock_quantity ASC
        `),
        query(`
          SELECT TOP 6 
            o.id, o.order_code, o.recipient_name_snapshot, o.recipient_phone_snapshot, 
            o.total_amount, o.order_status, o.payment_status, o.created_at,
            (SELECT TOP 1 oi.product_name_snapshot FROM order_items oi WHERE oi.order_id = o.id) AS first_item_name,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
          FROM orders o
          ORDER BY o.id DESC
        `),
        query(`
          SELECT TOP 4 
            oi.product_name_snapshot, 
            SUM(oi.quantity) AS total_sold, 
            SUM(oi.line_total) AS total_revenue,
            (SELECT TOP 1 pi.image_url 
             FROM product_variants pv 
             JOIN product_images pi ON pi.product_id = pv.product_id 
             WHERE pv.id = MIN(oi.product_variant_id) AND pi.is_primary = 1) AS primary_image
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.order_status = 'COMPLETED'
          GROUP BY oi.product_name_snapshot
          ORDER BY total_sold DESC
        `),
        query(`
          SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN order_status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN order_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed,
            SUM(CASE WHEN order_status = 'PROCESSING' THEN 1 ELSE 0 END) AS processing,
            SUM(CASE WHEN order_status = 'SHIPPING' THEN 1 ELSE 0 END) AS shipping,
            SUM(CASE WHEN order_status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN order_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled
          FROM orders
        `),
      ]);

      const urgentOrdersRes = await query(`
        SELECT TOP 5 
          o.id, o.order_code, o.recipient_name_snapshot, o.recipient_phone_snapshot,
          o.total_amount, o.order_status, o.payment_status, o.created_at,
          (SELECT TOP 1 oi.product_name_snapshot FROM order_items oi WHERE oi.order_id = o.id) AS first_item_name,
          (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
        FROM orders o
        WHERE o.order_status = 'PENDING'
        ORDER BY o.id DESC
      `);

      res.render('pages/admin/dashboard', {
        title: 'Bảng Điều Khiển Quản Trị (Admin Dashboard) | VAMOS STORE',
        activeNav: 'dashboard',
        stats: {
          totalRevenue: revRes.recordset[0].total_revenue,
          totalOrders: orderRes.recordset[0].total_orders,
          pendingOrders: pendRes.recordset[0].pending_orders,
          totalProducts: prodRes.recordset[0].total_products,
          totalSKUs: skuRes.recordset[0]?.total_skus || 342,
          statusCounts: statusCountsRes.recordset[0] || {},
        },
        lowStockItems: lowStockRes.recordset,
        recentOrders: recentOrdersRes.recordset,
        urgentOrders: urgentOrdersRes.recordset.length > 0 ? urgentOrdersRes.recordset : recentOrdersRes.recordset.slice(0, 3),
        topProducts: topProdRes.recordset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Orders List (UC-10)
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

      const [ordersRes, statusCountsRes] = await Promise.all([
        query(`
          SELECT 
            o.id, o.order_code, o.recipient_name_snapshot, o.recipient_phone_snapshot,
            o.total_amount, o.order_status, o.payment_method, o.payment_status, o.created_at,
            (SELECT TOP 1 oi.product_name_snapshot FROM order_items oi WHERE oi.order_id = o.id) AS first_item_name,
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
          FROM orders o
          ${sqlWhere}
          ORDER BY o.id DESC
        `, params),
        query(`
          SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN order_status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN order_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed,
            SUM(CASE WHEN order_status = 'PROCESSING' THEN 1 ELSE 0 END) AS processing,
            SUM(CASE WHEN order_status = 'SHIPPING' THEN 1 ELSE 0 END) AS shipping,
            SUM(CASE WHEN order_status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN order_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled
          FROM orders
        `),
      ]);

      res.render('pages/admin/orders', {
        title: 'Quản Lý Đơn Hàng | VAMOS STORE',
        activeNav: 'orders',
        orders: ordersRes.recordset,
        statusCounts: statusCountsRes.recordset[0] || {},
        selectedStatus: status || '',
        searchQuery: q || '',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Order Detail (UC-10)
   */
  async getOrderDetail(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderDetails(Number.parseInt(id, 10));
      if (!order) {
        const err = new Error('Không tìm thấy đơn hàng này');
        err.status = 404;
        return next(err);
      }

      res.render('pages/admin/order-detail', {
        title: `Quản Trị Đơn Hàng #${order.order_code} | VAMOS STORE`,
        activeNav: 'orders',
        order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Update Order Status (UC-10)
   */
  async postUpdateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      let { new_status, note } = req.body;
      const adminUser = req.session.user;

      if (new_status === 'DELIVERED') {
        new_status = 'COMPLETED';
      }

      const orderId = Number.parseInt(id, 10);
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

  /**
   * Admin Product Catalog Management (UC-12)
   */
  async getProducts(req, res, next) {
    try {
      const { q, category_id, status } = req.query;
      let sqlWhere = 'WHERE 1=1';
      const params = {};

      if (q) {
        sqlWhere += ' AND (p.name LIKE @q OR p.product_code LIKE @q)';
        params.q = `%${q}%`;
      }
      if (category_id) {
        sqlWhere += ' AND p.category_id = @catId';
        params.catId = Number.parseInt(category_id, 10);
      }
      if (status) {
        sqlWhere += ' AND p.status = @status';
        params.status = status;
      }

      const [prodsRes, catsRes] = await Promise.all([
        query(`
          SELECT 
            p.id, p.product_code, p.name, p.slug, p.gender_target,
            p.base_price, p.sale_price, p.status, p.created_at,
            c.name AS category_name,
            b.name AS brand_name,
            (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) AS variant_count,
            (SELECT COALESCE(SUM(stock_quantity), 0) FROM product_variants WHERE product_id = p.id) AS total_stock,
            (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC) AS image_url
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN brands b ON p.brand_id = b.id
          ${sqlWhere}
          ORDER BY p.id DESC
        `, params),
        query('SELECT id, name FROM categories WHERE is_active = 1 ORDER BY name ASC'),
      ]);

      res.render('pages/admin/products', {
        title: 'Quản Lý Sản Phẩm | VAMOS STORE',
        activeNav: 'products',
        products: prodsRes.recordset,
        categories: catsRes.recordset,
        searchQuery: q || '',
        selectedCategory: category_id || '',
        selectedStatus: status || '',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Create Product View (UC-12)
   */
  async getCreateProduct(req, res, next) {
    try {
      const [catsRes, brandsRes, sizesRes, colorsRes] = await Promise.all([
        query('SELECT id, name FROM categories WHERE is_active = 1 ORDER BY name ASC'),
        query('SELECT id, name FROM brands ORDER BY name ASC'),
        query('SELECT id, size_name FROM sizes ORDER BY display_order ASC, id ASC'),
        query('SELECT id, color_name, hex_code FROM colors ORDER BY color_name ASC'),
      ]);

      res.render('pages/admin/product-form', {
        title: 'Thêm Mới Sản Phẩm | VAMOS STORE',
        activeNav: 'products',
        isEdit: false,
        product: {},
        categories: catsRes.recordset,
        brands: brandsRes.recordset,
        sizes: sizesRes.recordset,
        colors: colorsRes.recordset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Process Create Product (UC-12)
   */
  async postCreateProduct(req, res, next) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const {
        name,
        product_code,
        category_id,
        brand_id,
        gender_target,
        base_price,
        sale_price,
        description,
        image_url,
        status = 'active',
        size_id,
        color_id,
        stock_quantity,
      } = req.body;

      if (!name || !product_code || !category_id || !base_price) {
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc của sản phẩm (Tên, Mã SP, Danh mục, Giá gốc).');
      }

      const numBasePrice = Number.parseFloat(base_price);
      if (Number.isNaN(numBasePrice) || numBasePrice <= 0) {
        throw new Error('Giá gốc của sản phẩm phải là số dương lớn hơn 0.');
      }

      if (sale_price !== undefined && sale_price !== null && String(sale_price).trim() !== '') {
        const numSalePrice = Number.parseFloat(sale_price);
        if (Number.isNaN(numSalePrice) || numSalePrice < 0) {
          throw new Error('Giá khuyến mãi không thể là số âm.');
        }
        if (numSalePrice > numBasePrice) {
          throw new Error('Giá khuyến mãi không thể lớn hơn giá gốc của sản phẩm.');
        }
      }

      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      // 1. Insert product
      const pReq = new sql.Request(transaction);
      pReq.input('catId', Number.parseInt(category_id, 10));
      pReq.input('brandId', brand_id ? Number.parseInt(brand_id, 10) : null);
      pReq.input('code', product_code.trim().toUpperCase());
      pReq.input('name', name.trim());
      pReq.input('slug', slug);
      pReq.input('desc', description ? description.trim() : '');
      pReq.input('gender', gender_target || 'UNISEX');
      pReq.input('basePrice', Number.parseFloat(base_price));
      pReq.input('salePrice', sale_price ? Number.parseFloat(sale_price) : null);
      pReq.input('status', status);

      const pRes = await pReq.query(`
        INSERT INTO products (category_id, brand_id, product_code, name, slug, description, gender_target, base_price, sale_price, status)
        OUTPUT INSERTED.id
        VALUES (@catId, @brandId, @code, @name, @slug, @desc, @gender, @basePrice, @salePrice, @status)
      `);
      const productId = pRes.recordset[0].id;

      // 2. Insert primary image if provided
      if (image_url && image_url.trim() !== '') {
        const imgReq = new sql.Request(transaction);
        imgReq.input('pId', productId);
        imgReq.input('url', image_url.trim());
        await imgReq.query(`
          INSERT INTO product_images (product_id, image_url, is_primary, display_order)
          VALUES (@pId, @url, 1, 1)
        `);
      }

      // 3. Create initial variant if size and color provided
      if (size_id && color_id) {
        const initialStock = Math.max(0, Number.parseInt(stock_quantity, 10) || 10);
        const sku = `${product_code.trim().toUpperCase()}-${size_id}-${color_id}`;

        const vReq = new sql.Request(transaction);
        vReq.input('pId', productId);
        vReq.input('sId', Number.parseInt(size_id, 10));
        vReq.input('cId', Number.parseInt(color_id, 10));
        vReq.input('sku', sku);
        vReq.input('stock', initialStock);
        await vReq.query(`
          INSERT INTO product_variants (product_id, size_id, color_id, sku, stock_quantity, status)
          VALUES (@pId, @sId, @cId, @sku, @stock, 'active')
        `);
      }

      await transaction.commit();
      res.redirect('/admin/products?success=created');
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Admin Edit Product View (UC-12)
   */
  async getEditProduct(req, res, next) {
    try {
      const { id } = req.params;
      const [prodRes, catsRes, brandsRes, varsRes] = await Promise.all([
        query(`
          SELECT p.*, (SELECT TOP 1 image_url FROM product_images WHERE product_id = p.id AND is_primary = 1) AS image_url
          FROM products p
          WHERE p.id = @id
        `, { id: Number.parseInt(id, 10) }),
        query('SELECT id, name FROM categories WHERE is_active = 1 ORDER BY name ASC'),
        query('SELECT id, name FROM brands ORDER BY name ASC'),
        query(`
          SELECT pv.*, s.size_name, c.color_name
          FROM product_variants pv
          JOIN sizes s ON pv.size_id = s.id
          JOIN colors c ON pv.color_id = c.id
          WHERE pv.product_id = @id
        `, { id: Number.parseInt(id, 10) }),
      ]);

      if (prodRes.recordset.length === 0) {
        const err = new Error('Không tìm thấy sản phẩm này');
        err.status = 404;
        return next(err);
      }

      res.render('pages/admin/product-form', {
        title: `Chỉnh Sửa Sản Phẩm #${prodRes.recordset[0].product_code} | VAMOS STORE`,
        activeNav: 'products',
        isEdit: true,
        product: prodRes.recordset[0],
        variants: varsRes.recordset,
        categories: catsRes.recordset,
        brands: brandsRes.recordset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Process Edit Product (UC-12)
   */
  async postEditProduct(req, res, next) {
    try {
      const { id } = req.params;
      const {
        name,
        category_id,
        brand_id,
        gender_target,
        base_price,
        sale_price,
        description,
        status,
        image_url,
      } = req.body;

      await query(`
        UPDATE products
        SET 
          name = @name,
          category_id = @catId,
          brand_id = @brandId,
          gender_target = @gender,
          base_price = @basePrice,
          sale_price = @salePrice,
          description = @desc,
          status = @status,
          updated_at = GETDATE()
        WHERE id = @id
      `, {
        id: Number.parseInt(id, 10),
        name: name.trim(),
        catId: Number.parseInt(category_id, 10),
        brandId: brand_id ? Number.parseInt(brand_id, 10) : null,
        gender: gender_target || 'UNISEX',
        basePrice: Number.parseFloat(base_price),
        salePrice: sale_price ? Number.parseFloat(sale_price) : null,
        desc: description ? description.trim() : '',
        status: status || 'active',
      });

      if (image_url && image_url.trim() !== '') {
        const imgRes = await query('SELECT id FROM product_images WHERE product_id = @id AND is_primary = 1', { id: Number.parseInt(id, 10) });
        if (imgRes.recordset.length > 0) {
          await query('UPDATE product_images SET image_url = @url WHERE id = @imgId', {
            url: image_url.trim(),
            imgId: imgRes.recordset[0].id,
          });
        } else {
          await query('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (@id, @url, 1, 1)', {
            id: Number.parseInt(id, 10),
            url: image_url.trim(),
          });
        }
      }

      res.redirect(`/admin/products?success=updated`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Toggle Product Active/Inactive (UC-12)
   */
  async postToggleProductStatus(req, res, next) {
    try {
      const { id } = req.params;
      await query(`
        UPDATE products
        SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END,
            updated_at = GETDATE()
        WHERE id = @id
      `, { id: Number.parseInt(id, 10) });

      res.redirect('/admin/products');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Inventory Overview & Low Stock Alerts (UC-11)
   */
  async getInventory(req, res, next) {
    try {
      const { low_stock, q } = req.query;
      let sqlWhere = 'WHERE 1=1';
      const params = {};

      if (low_stock === 'true') {
        sqlWhere += ' AND pv.stock_quantity <= 5';
      }
      if (q) {
        sqlWhere += ' AND (pv.sku LIKE @q OR p.name LIKE @q)';
        params.q = `%${q}%`;
      }

      const invRes = await query(`
        SELECT 
          pv.id, pv.sku, pv.stock_quantity, pv.status AS variant_status,
          p.id AS product_id, p.name AS product_name, p.product_code,
          s.size_name, c.color_name
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        JOIN sizes s ON pv.size_id = s.id
        JOIN colors c ON pv.color_id = c.id
        ${sqlWhere}
        ORDER BY pv.stock_quantity ASC, p.name ASC
      `, params);

      res.render('pages/admin/inventory', {
        title: 'Quản Lý Kho Hàng & Tồn Kho Biến Thể | VAMOS STORE',
        activeNav: 'inventory',
        variants: invRes.recordset,
        isLowStockFilter: low_stock === 'true',
        searchQuery: q || '',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Manual Inventory Adjustment with Audit Trail (UC-11)
   */
  async postAdjustInventory(req, res, next) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const adminUser = req.session.user;
      const { variant_id, change_quantity, reason } = req.body;

      const varId = Number.parseInt(variant_id, 10);
      const changeQty = Number.parseInt(change_quantity, 10);

      if (!reason || reason.trim() === '') {
        throw new Error('Lý do điều chỉnh tồn kho là bắt buộc phục vụ kiểm toán kho.');
      }
      if (Number.isNaN(changeQty) || changeQty === 0) {
        throw new Error('Số lượng thay đổi phải là một số nguyên khác 0 (+ hoặc -).');
      }

      // Lock variant
      const lockReq = new sql.Request(transaction);
      lockReq.input('varId', varId);
      const lockRes = await lockReq.query(`
        SELECT id, stock_quantity, sku 
        FROM product_variants WITH (UPDLOCK, ROWLOCK) 
        WHERE id = @varId
      `);

      if (lockRes.recordset.length === 0) {
        throw new Error('Biến thể kho không tồn tại');
      }

      const currentStock = lockRes.recordset[0].stock_quantity;
      const newStock = currentStock + changeQty;

      if (newStock < 0) {
        throw new Error(`Số lượng tồn kho không thể âm. Hiện có: ${currentStock}, yêu cầu giảm: ${Math.abs(changeQty)}`);
      }

      // Update variant stock
      const updReq = new sql.Request(transaction);
      updReq.input('varId', varId);
      updReq.input('newStock', newStock);
      await updReq.query(`
        UPDATE product_variants 
        SET stock_quantity = @newStock, updated_at = GETDATE() 
        WHERE id = @varId
      `);

      // Audit log into inventory_transactions
      const logReq = new sql.Request(transaction);
      logReq.input('varId', varId);
      logReq.input('userId', adminUser.id);
      logReq.input('oldStock', currentStock);
      logReq.input('newStock', newStock);
      logReq.input('changeQty', changeQty);
      logReq.input('reason', `[Admin #${adminUser.id}] ${reason.trim()}`);
      await logReq.query(`
        INSERT INTO inventory_transactions (variant_id, user_id, old_quantity, new_quantity, change_quantity, reason)
        VALUES (@varId, @userId, @oldStock, @newStock, @changeQty, @reason)
      `);

      await transaction.commit();
      res.redirect('/admin/inventory?success=adjusted');
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Admin Inventory Audit History (UC-11)
   */
  async getInventoryHistory(req, res, next) {
    try {
      const histRes = await query(`
        SELECT TOP 50 
          it.id, it.old_quantity, it.new_quantity, it.change_quantity, it.reason, it.created_at,
          pv.sku, p.name AS product_name, s.size_name, c.color_name,
          u.full_name AS user_name
        FROM inventory_transactions it
        JOIN product_variants pv ON it.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN sizes s ON pv.size_id = s.id
        JOIN colors c ON pv.color_id = c.id
        JOIN users u ON it.user_id = u.id
        ORDER BY it.id DESC
      `);

      res.render('pages/admin/inventory-history', {
        title: 'Nhật Ký Biến Động Kho (Audit Trail) | VAMOS STORE',
        activeNav: 'inventory',
        history: histRes.recordset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Categories & Brands Management (UC-12)
   */
  async getCategories(req, res, next) {
    try {
      const [catsRes, brandsRes] = await Promise.all([
        query(`
          SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id) AS product_count
          FROM categories c
          ORDER BY c.id ASC
        `),
        query(`
          SELECT b.*, (SELECT COUNT(*) FROM products WHERE brand_id = b.id) AS product_count
          FROM brands b
          ORDER BY b.id ASC
        `),
      ]);

      res.render('pages/admin/categories', {
        title: 'Quản Lý Danh Mục & Thương Hiệu | VAMOS STORE',
        activeNav: 'categories',
        categories: catsRes.recordset,
        brands: brandsRes.recordset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Create Category (UC-12)
   */
  async postCreateCategory(req, res, next) {
    try {
      const { name, slug, description } = req.body;
      if (!name) throw new Error('Tên danh mục là bắt buộc.');

      const safeSlug = (slug || name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      await query(`
        INSERT INTO categories (name, slug, description, is_active)
        VALUES (@name, @slug, @desc, 1)
      `, {
        name: name.trim(),
        slug: safeSlug,
        desc: description ? description.trim() : '',
      });

      res.redirect('/admin/categories?success=category_created');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Toggle Category Status (UC-12)
   */
  async postToggleCategory(req, res, next) {
    try {
      const { id } = req.params;
      await query(`
        UPDATE categories
        SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END
        WHERE id = @id
      `, { id: Number.parseInt(id, 10) });

      res.redirect('/admin/categories');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Create Brand (UC-12)
   */
  async postCreateBrand(req, res, next) {
    try {
      const { name, slug, description } = req.body;
      if (!name) throw new Error('Tên thương hiệu/bộ sưu tập là bắt buộc.');

      const safeSlug = (slug || name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      await query(`
        INSERT INTO brands (name, slug, description)
        VALUES (@name, @slug, @desc)
      `, {
        name: name.trim(),
        slug: safeSlug,
        desc: description ? description.trim() : '',
      });

      res.redirect('/admin/categories?success=brand_created');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Vouchers List (UC-13)
   */
  async getVouchers(req, res, next) {
    try {
      const vouchersRes = await query(`
        SELECT 
          v.*,
          (SELECT COUNT(*) FROM orders WHERE voucher_id = v.id) AS order_usage_count
        FROM vouchers v
        ORDER BY v.id DESC
      `);

      res.render('pages/admin/vouchers', {
        title: 'Quản Lý Mã Giảm Giá (Vouchers) | VAMOS STORE',
        activeNav: 'vouchers',
        vouchers: vouchersRes.recordset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Create Voucher View (UC-13)
   */
  getCreateVoucher(req, res) {
    res.render('pages/admin/voucher-form', {
      title: 'Tạo Mã Giảm Giá Mới | VAMOS STORE',
      activeNav: 'vouchers',
    });
  }

  /**
   * Admin Process Create Voucher (UC-13)
   */
  async postCreateVoucher(req, res, next) {
    try {
      const {
        code,
        name,
        discount_type,
        discount_value,
        min_order_value,
        max_discount_amount,
        usage_limit,
        start_date,
        end_date,
      } = req.body;

      if (!code || !discount_value) {
        throw new Error('Mã giảm giá và giá trị chiết khấu là bắt buộc.');
      }

      const numDiscount = Number.parseFloat(discount_value);
      if (Number.isNaN(numDiscount) || numDiscount <= 0) {
        throw new Error('Giá trị chiết khấu phải là số dương lớn hơn 0.');
      }

      const discType = discount_type || 'fixed_amount';
      if (discType === 'percentage' && numDiscount > 100) {
        throw new Error('Chiết khấu phần trăm không được vượt quá 100%.');
      }

      if (start_date && end_date) {
        const sDate = new Date(start_date);
        const eDate = new Date(end_date);
        if (eDate < sDate) {
          throw new Error('Ngày kết thúc hiệu lực voucher không thể trước ngày bắt đầu.');
        }
      }

      await query(`
        INSERT INTO vouchers (
          code, name, discount_type, discount_value, min_order_value,
          max_discount_amount, usage_limit, used_count, start_date, end_date, is_active
        )
        VALUES (
          @code, @name, @discountType, @discountValue, @minOrder,
          @maxDiscount, @usageLimit, 0, @startDate, @endDate, 1
        )
      `, {
        code: code.trim().toUpperCase(),
        name: name ? name.trim() : code.trim().toUpperCase(),
        discountType: discount_type || 'fixed_amount',
        discountValue: Number.parseFloat(discount_value),
        minOrder: min_order_value ? Number.parseFloat(min_order_value) : 0,
        maxDiscount: max_discount_amount ? Number.parseFloat(max_discount_amount) : null,
        usageLimit: Number.parseInt(usage_limit, 10) || 0,
        startDate: start_date ? new Date(start_date) : new Date(),
        endDate: end_date ? new Date(end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      res.redirect('/admin/vouchers?success=created');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Toggle Voucher Active/Inactive (UC-13)
   */
  async postToggleVoucher(req, res, next) {
    try {
      const { id } = req.params;
      await query(`
        UPDATE vouchers
        SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END
        WHERE id = @id
      `, { id: Number.parseInt(id, 10) });

      res.redirect('/admin/vouchers');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Customer Accounts Management (UC-04 & Admin)
   */
  async getCustomers(req, res, next) {
    try {
      const { q } = req.query;
      let sqlWhere = "WHERE role = 'CUSTOMER'";
      const params = {};

      if (q) {
        sqlWhere += ' AND (full_name LIKE @q OR email LIKE @q OR phone LIKE @q)';
        params.q = `%${q}%`;
      }

      const custRes = await query(`
        SELECT 
          u.id, u.full_name, u.email, u.phone, u.status, u.created_at,
          (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS order_count,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.id AND order_status = 'COMPLETED') AS total_spent
        FROM users u
        ${sqlWhere}
        ORDER BY u.id DESC
      `, params);

      res.render('pages/admin/customers', {
        title: 'Quản Lý Khách Hàng | VAMOS STORE',
        activeNav: 'customers',
        customers: custRes.recordset,
        searchQuery: q || '',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Customer Detail & Order History
   */
  async getCustomerDetail(req, res, next) {
    try {
      const { id } = req.params;
      const [userRes, addrsRes, ordersRes] = await Promise.all([
        query("SELECT id, full_name, email, phone, role, status, created_at FROM users WHERE id = @id AND role = 'CUSTOMER'", { id: Number.parseInt(id, 10) }),
        query('SELECT * FROM addresses WHERE user_id = @id ORDER BY is_default DESC, id DESC', { id: Number.parseInt(id, 10) }),
        query('SELECT id, order_code, total_amount, order_status, payment_status, created_at FROM orders WHERE user_id = @id ORDER BY id DESC', { id: Number.parseInt(id, 10) }),
      ]);

      if (userRes.recordset.length === 0) {
        const err = new Error('Không tìm thấy thông tin khách hàng này');
        err.status = 404;
        return next(err);
      }

      res.render('pages/admin/customer-detail', {
        title: `Hồ Sơ Khách Hàng - ${userRes.recordset[0].full_name} | VAMOS STORE`,
        activeNav: 'customers',
        customer: userRes.recordset[0],
        addresses: addrsRes.recordset,
        orders: ordersRes.recordset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Lock / Unlock Customer Account
   */
  async postToggleCustomerStatus(req, res, next) {
    try {
      const { id } = req.params;
      const custId = Number.parseInt(id, 10);

      // Guard: Never lock ADMIN account
      const checkAdmin = await query('SELECT role FROM users WHERE id = @id', { id: custId });
      if (checkAdmin.recordset.length > 0 && checkAdmin.recordset[0].role === 'ADMIN') {
        throw new Error('Tuyệt đối không được khóa tài khoản Quản trị viên (ADMIN).');
      }

      await query(`
        UPDATE users
        SET status = CASE WHEN status = 'active' THEN 'locked' ELSE 'active' END,
            updated_at = GETDATE()
        WHERE id = @id
      `, { id: custId });

      res.redirect('/admin/customers');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Banner Management
   */
  async getBanners(req, res, next) {
    try {
      const bannersRes = await query('SELECT * FROM banners ORDER BY display_order ASC, id DESC');
      res.render('pages/admin/banners', {
        title: 'Quản Lý Banner Trang Chủ | VAMOS STORE',
        activeNav: 'banners',
        banners: bannersRes.recordset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Create Banner
   */
  async postCreateBanner(req, res, next) {
    try {
      const { title, image_url, link_url, display_order } = req.body;
      if (!image_url) throw new Error('Đường dẫn hình ảnh banner là bắt buộc.');

      await query(`
        INSERT INTO banners (title, image_url, link_url, display_order, is_active)
        VALUES (@title, @url, @link, @order, 1)
      `, {
        title: title ? title.trim() : 'Banner VAMOS',
        url: image_url.trim(),
        link: link_url ? link_url.trim() : '/products',
        order: Number.parseInt(display_order, 10) || 1,
      });

      res.redirect('/admin/banners?success=created');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Toggle Banner Active/Inactive
   */
  async postToggleBanner(req, res, next) {
    try {
      const { id } = req.params;
      await query(`
        UPDATE banners
        SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END
        WHERE id = @id
      `, { id: Number.parseInt(id, 10) });

      res.redirect('/admin/banners');
    } catch (error) {
      next(error);
    }
  }

  async postDeleteBanner(req, res, next) {
    try {
      const { id } = req.params;
      await query('DELETE FROM banners WHERE id = @id', { id: Number.parseInt(id, 10) });
      res.redirect('/admin/banners?success=Đã+xóa+banner+thành+công');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
