# CHƯƠNG III: TRIỂN KHAI MÃ NGUỒN (SYSTEM IMPLEMENTATION)

---

## 1. CẤU TRÚC MÃ NGUỒN DỰ ÁN

Hệ thống VAMOS STORE được tổ chức mã nguồn chuẩn mực trên nền tảng Node.js và framework Express.js, kết hợp giữa mô hình phân lớp doanh nghiệp (Service / Repository) cho các giao dịch phức tạp và mô hình trực tiếp (Two-Tier Direct Controller - Database) cho các phân hệ quản trị CRUD:

```
vamos-store/
├── server.js                      # Điểm khởi chạy tiến trình HTTP và kiểm tra kết nối DB
├── package.json                   # Khai báo phụ thuộc (Node >=22, Express, mssql, pug, bcryptjs)
├── docker-compose.yml             # Cấu hình đa container (Node.js App + MSSQL Server 2022)
├── Dockerfile                     # Multi-stage Dockerfile tối ưu kích thước image
├── src/
│   ├── app.js                     # Cấu hình ứng dụng Express, Middleware bảo mật, Session, CSRF, i18n
│   ├── config/
│   │   ├── app.config.js          # Quản lý biến môi trường, cổng, session và MSSQL connection pool
│   │   └── database.js            # MSSQL Connection Pool & Query API an toàn
│   ├── routes/
│   │   ├── index.js               # Điểm gắn kết định tuyến trung tâm (/admin, /products, /auth,...)
│   │   ├── admin.routes.js        # Tuyến đường phân hệ quản trị Admin (28 endpoints bảo vệ bằng requireAdmin)
│   │   ├── auth.routes.js         # Tuyến đường xác thực (đăng nhập, đăng ký, đăng xuất)
│   │   ├── product.routes.js      # Tuyến đường duyệt và tìm kiếm sản phẩm cửa hàng
│   │   ├── cart.routes.js         # Tuyến đường quản lý giỏ hàng trực tuyến
│   │   ├── checkout.routes.js     # Tuyến đường đặt hàng thanh toán COD
│   │   ├── account.routes.js      # Tuyến đường hồ sơ cá nhân, sổ địa chỉ và lịch sử đơn hàng
│   │   ├── home.routes.js         # Tuyến đường trang chủ, danh mục nổi bật, banner
│   │   ├── info.routes.js         # Tuyến đường thông tin giới thiệu, chính sách, khuyến mãi
│   │   └── wishlist.routes.js     # Tuyến đường API danh sách sản phẩm yêu thích
│   ├── controllers/
│   │   ├── admin.controller.js    # Quản trị viên: Dashboard KPI, SP, Kho, Đơn, Voucher, Khách, Banner (Two-Tier)
│   │   ├── auth.controller.js     # Xử lý đăng ký (bcryptjs + cấp Cart), đăng nhập, session
│   │   ├── product.controller.js  # Duyệt danh mục, bộ lọc đa tiêu chí, chi tiết sản phẩm, live search
│   │   ├── cart.controller.js     # Quản lý giỏ hàng trực tuyến (Two-Tier Direct DB)
│   │   ├── checkout.controller.js # Điều phối giao diện đặt hàng COD
│   │   ├── account.controller.js  # Hồ sơ, đổi mật khẩu, sổ địa chỉ, lịch sử đơn, hủy đơn
│   │   ├── home.controller.js     # Trang chủ, slider banner, sản phẩm mới, top bán chạy
│   │   └── wishlist.controller.js # Thao tác danh sách yêu thích
│   ├── services/
│   │   ├── order.service.js       # Transaction đặt hàng COD, khóa bi quan, trừ kho, voucher, hoàn hủy
│   │   ├── product.service.js     # Nghiệp vụ lọc sản phẩm, định dạng hiển thị
│   │   └── wishlist.service.js    # Nghiệp vụ quản lý danh sách yêu thích
│   ├── models/
│   │   └── repositories/
│   │       ├── product.repository.js  # Thao tác CSDL danh mục và sản phẩm
│   │       └── wishlist.repository.js # Thao tác CSDL bảng wishlist_items
│   ├── middlewares/
│   │   ├── auth.middleware.js     # requireAuth, requireAdmin (RBAC), sessionContextMiddleware
│   │   ├── csrf.middleware.js     # Bảo vệ chống tấn công CSRF (Double Submit Cookie / Header)
│   │   ├── error.middleware.js    # Bắt và xử lý lỗi tập trung, giao diện 404/500
│   │   └── i18n.middleware.js     # Hỗ trợ đa ngôn ngữ Server-Side Rendering
│   ├── utils/
│   │   └── validator.js           # Bộ tiền kiểm tra dữ liệu đầu vào (email, phone, password, quantity)
│   ├── views/                     # Template Engine Pug
│   │   ├── layouts/               # Layout dùng chung (main.pug, admin.pug, customer.pug)
│   │   ├── pages/                 # Giao diện các trang nghiệp vụ
│   │   └── partials/              # Header, footer, admin-nav
│   └── public/                    # Static assets
│       ├── css/style.css          # Stylesheet biên dịch từ Tailwind CSS
│       └── js/main.js             # JavaScript tương tác client (live search, modal, filter)
└── database/
    ├── mssql_schema.sql           # Kịch bản DDL Microsoft SQL Server 2022
    └── migrations/                # Các migration tăng cường tính toàn vẹn (001 - 004)
```

---

## 2. KẾT NỐI VÀ QUẢN TRỊ CƠ SỞ DỮ LIỆU MICROSOFT SQL SERVER 2022

### 2.1. Cấu hình MSSQL Connection Pool & Tham số hóa truy vấn

Hệ thống sử dụng trình điều khiển chính thức `mssql` (Tedious) để kết nối với Microsoft SQL Server 2022. Connection Pool duy trì sẵn tối đa 10 kết nối thường trực, hỗ trợ tự động tái sử dụng và kiểm soát thời gian chờ (timeout):

```javascript
// Trích đoạn: src/config/database.js:1-117
const sql = require('mssql');
const config = require('./app.config');

let pool = null;

async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(config.db);
      console.log('✓ [MSSQL]: Kết nối cơ sở dữ liệu Microsoft SQL Server thành công.');
    } catch (err) {
      console.error('✗ [MSSQL Pool Error]:', err.message);
      throw err;
    }
  }
  return pool;
}

// Hàm query tham số hóa T-SQL bảo vệ chống SQL Injection tuyệt đối
async function query(queryStr, params = {}) {
  const currentPool = await getPool();
  const request = currentPool.request();
  for (const [key, val] of Object.entries(params)) {
    request.input(key, val);
  }
  return request.query(queryStr);
}

module.exports = { sql, getPool, query };
```

---

## 3. TRIỂN KHAI CÁC MODULE NGHIỆP VỤ CỐT LÕI

### 3.1. Phân hệ Xác thực & Khởi tạo Giỏ hàng (UC01 - Register)

Khi khách hàng đăng ký tài khoản thành viên mới, mã nguồn băm mật khẩu an toàn với thư viện `bcryptjs` (salt rounds = 10) và tự động khởi tạo ngay một giỏ hàng cá nhân (`carts`) trong CSDL, bảo đảm quan hệ 1:1 bất biến:

```javascript
// Trích đoạn: src/controllers/auth.controller.js:63-145
async postRegister(req, res, next) {
  try {
    const { fullName, email, password, phone } = req.body;
    
    // 1. Kiểm tra email đã tồn tại trong CSDL
    const existing = await query('SELECT id FROM users WHERE email = @email', { email });
    if (existing.recordset.length > 0) {
      return res.render('pages/auth/register', { error: 'Email này đã được sử dụng.' });
    }

    // 2. Băm mật khẩu bằng bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Thêm tài khoản mới vào bảng users
    const userRes = await query(`
      INSERT INTO users (full_name, email, password_hash, phone, role, status)
      OUTPUT INSERTED.id
      VALUES (@fullName, @email, @passwordHash, @phone, 'CUSTOMER', 'active')
    `, { fullName, email, passwordHash, phone: phone || null });

    const newUserId = userRes.recordset[0].id;

    // 4. Tự động khởi tạo giỏ hàng cá nhân (1 User = 1 Cart)
    await query('INSERT INTO carts (user_id) VALUES (@userId)', { userId: newUserId });

    res.redirect('/auth/login?registered=true');
  } catch (error) {
    next(error);
  }
}
```

---

### 3.2. Phân hệ Đặt hàng COD nguyên tử (UC07 - Checkout Transaction)

Đây là quy trình nghiệp vụ quan trọng nhất của hệ thống, đòi hỏi tính toàn vẹn giao dịch tuyệt đối (ACID Integrity). Toàn bộ luồng được thực thi bên trong một `sql.Transaction`, áp dụng Table Hint khóa dòng bi quan `WITH (UPDLOCK, ROWLOCK)` của Microsoft SQL Server để loại bỏ hoàn toàn nguy cơ bán vượt tồn kho (Overselling):

```javascript
// Trích đoạn: src/services/order.service.js:15-285
async createCodOrder({ userId, recipientName, recipientPhone, deliveryAddress, customerNote, voucherCode }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin(); // BẮT ĐẦU GIAO DỊCH NGUYÊN TỬ T-SQL

  try {
    // 1. Đọc và khóa các mặt hàng trong giỏ của khách hàng
    const cartReq = new sql.Request(transaction);
    cartReq.input('userId', userId);
    const cartItems = await cartReq.query(`
      SELECT ci.id AS cart_item_id, ci.quantity, ci.variant_id,
             p.name AS product_name, pv.sku, s.size_name, c.color_name,
             p.base_price, p.sale_price
      FROM cart_items ci
      JOIN carts ct ON ci.cart_id = ct.id
      JOIN product_variants pv ON ci.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN sizes s ON pv.size_id = s.id
      JOIN colors c ON pv.color_id = c.id
      WHERE ct.user_id = @userId
    `);

    if (cartItems.recordset.length === 0) {
      throw new Error('Giỏ hàng của bạn đang trống.');
    }

    // 2. Tính toán tổng tiền tạm tính (Subtotal)
    let subtotal = 0;
    for (const item of cartItems.recordset) {
      const price = item.sale_price !== null ? item.sale_price : item.base_price;
      subtotal += price * item.quantity;
    }

    // 3. Khóa và thẩm định mã giảm giá Voucher (nếu có)
    let voucherId = null, discountAmount = 0, voucherCodeSnapshot = null;
    if (voucherCode) {
      const vouchReq = new sql.Request(transaction);
      vouchReq.input('code', voucherCode.trim().toUpperCase());
      const vouchRes = await vouchReq.query(`
        SELECT * FROM vouchers WITH (UPDLOCK, ROWLOCK)
        WHERE code = @code AND is_active = 1 AND start_date <= GETDATE() AND end_date >= GETDATE()
      `);
      
      const voucher = vouchRes.recordset[0];
      if (voucher && subtotal >= voucher.min_order_value && (voucher.usage_limit === 0 || voucher.used_count < voucher.usage_limit)) {
        // Thực thi Quy tắc Q8: Mỗi khách hàng chỉ được dùng 1 lần duy nhất
        const usageReq = new sql.Request(transaction);
        usageReq.input('vId', voucher.id);
        usageReq.input('uId', userId);
        const usedCheck = await usageReq.query(`
          SELECT 1 FROM voucher_usages WITH (UPDLOCK, ROWLOCK) WHERE voucher_id = @vId AND user_id = @uId
        `);
        if (usedCheck.recordset.length === 0) {
          voucherId = voucher.id;
          voucherCodeSnapshot = voucher.code;
          discountAmount = voucher.discount_type === 'percentage'
            ? Math.min((subtotal * voucher.discount_value) / 100, voucher.max_discount_amount || Infinity)
            : Math.min(voucher.discount_value, subtotal);
          
          // Cập nhật số lượt đã dùng của voucher
          const updateVouch = new sql.Request(transaction);
          updateVouch.input('vId', voucher.id);
          await updateVouch.query('UPDATE vouchers SET used_count = used_count + 1 WHERE id = @vId');
        }
      }
    }

    // 4. Khóa dòng kiểm tra tồn kho và trừ kho từng biến thể
    for (const item of cartItems.recordset) {
      const stockReq = new sql.Request(transaction);
      stockReq.input('vId', item.variant_id);
      const stockRes = await stockReq.query(`
        SELECT stock_quantity FROM product_variants WITH (UPDLOCK, ROWLOCK) WHERE id = @vId
      `);
      const currentStock = stockRes.recordset[0]?.stock_quantity || 0;
      if (currentStock < item.quantity) {
        throw new Error(`Sản phẩm "${item.product_name}" (SKU: ${item.sku}) không đủ tồn kho.`);
      }

      // Trừ kho và ghi nhật ký thẻ kho
      const deductReq = new sql.Request(transaction);
      deductReq.input('vId', item.variant_id);
      deductReq.input('qty', item.quantity);
      await deductReq.query('UPDATE product_variants SET stock_quantity = stock_quantity - @qty WHERE id = @vId');
    }

    // 5. Tạo đơn hàng tổng quát và lưu snapshot
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const orderCode = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderReq = new sql.Request(transaction);
    orderReq.input('orderCode', orderCode);
    orderReq.input('userId', userId);
    orderReq.input('name', recipientName);
    orderReq.input('phone', recipientPhone);
    orderReq.input('addr', deliveryAddress);
    orderReq.input('subtotal', subtotal);
    orderReq.input('discount', discountAmount);
    orderReq.input('total', totalAmount);
    orderReq.input('vouchId', voucherId);
    orderReq.input('vouchCode', voucherCodeSnapshot);
    orderReq.input('note', customerNote);

    const orderRes = await orderReq.query(`
      INSERT INTO orders (order_code, user_id, recipient_name_snapshot, recipient_phone_snapshot,
                          delivery_address_snapshot, subtotal, discount_amount, total_amount,
                          voucher_id, voucher_code_snapshot, payment_method, payment_status, order_status, customer_note)
      OUTPUT INSERTED.id
      VALUES (@orderCode, @userId, @name, @phone, @addr, @subtotal, @discount, @total, @vouchId, @vouchCode, 'COD', 'UNPAID', 'PENDING', @note)
    `);
    const newOrderId = orderRes.recordset[0].id;

    // 6. Lưu snapshot chi tiết sản phẩm vào order_items & xóa giỏ hàng
    for (const item of cartItems.recordset) {
      const itemPrice = item.sale_price !== null ? item.sale_price : item.base_price;
      const itemReq = new sql.Request(transaction);
      itemReq.input('oId', newOrderId);
      itemReq.input('pvId', item.variant_id);
      itemReq.input('name', item.product_name);
      itemReq.input('sku', item.sku);
      itemReq.input('size', item.size_name);
      itemReq.input('color', item.color_name);
      itemReq.input('price', itemPrice);
      itemReq.input('qty', item.quantity);
      itemReq.input('lineTotal', itemPrice * item.quantity);
      await itemReq.query(`
        INSERT INTO order_items (order_id, product_variant_id, product_name_snapshot, sku_snapshot, size_snapshot, color_snapshot, unit_price, quantity, line_total)
        VALUES (@oId, @pvId, @name, @sku, @size, @color, @price, @qty, @lineTotal)
      `);
    }

    if (voucherId) {
      const recUsageReq = new sql.Request(transaction);
      recUsageReq.input('vId', voucherId);
      recUsageReq.input('uId', userId);
      recUsageReq.input('oId', newOrderId);
      await recUsageReq.query('INSERT INTO voucher_usages (voucher_id, user_id, order_id) VALUES (@vId, @uId, @oId)');
    }

    // Làm trống giỏ hàng
    const cleanCart = new sql.Request(transaction);
    cleanCart.input('userId', userId);
    await cleanCart.query('DELETE ci FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE c.user_id = @userId');

    await transaction.commit(); // COMMIT THÀNH CÔNG GIAO DỊCH NGUYÊN TỬ
    return { orderId: newOrderId, orderCode };
  } catch (err) {
    await transaction.rollback(); // ROLLBACK TOÀN BỘ NẾU CÓ LỖI
    throw err;
  }
}
```

---

### 3.3. Quy trình Hủy đơn & Tự động Hoàn kho (UC09 / UC10 Cancellation)

Hệ thống cung cấp logic dùng chung tại `OrderService._executeCancellation` đảm bảo khi đơn hàng bị hủy (khách hàng tự hủy khi `PENDING` hoặc Admin hủy đơn), toàn bộ số lượng tồn kho của các biến thể được hoàn lại nguyên vẹn và quyền sử dụng voucher được phục hồi:

```javascript
// Trích đoạn: src/services/order.service.js:340-408
async _executeCancellation(transaction, orderId, orderCode, actorId, previousStatus, cancelReason, note) {
  // 1. Đọc danh sách sản phẩm trong đơn để hoàn tồn kho
  const itemsReq = new sql.Request(transaction);
  itemsReq.input('orderId', orderId);
  const itemsRes = await itemsReq.query('SELECT product_variant_id, quantity FROM order_items WHERE order_id = @orderId');

  // 2. Hoàn lại số lượng tồn kho và ghi nhật ký thẻ kho
  for (const item of itemsRes.recordset) {
    const restoreReq = new sql.Request(transaction);
    restoreReq.input('varId', item.product_variant_id);
    restoreReq.input('qty', item.quantity);
    await restoreReq.query('UPDATE product_variants SET stock_quantity = stock_quantity + @qty WHERE id = @varId');

    const invReq = new sql.Request(transaction);
    invReq.input('varId', item.product_variant_id);
    invReq.input('userId', actorId);
    invReq.input('qty', item.quantity);
    invReq.input('reason', cancelReason || `Hoàn tồn kho do hủy đơn hàng #${orderCode}`);
    await invReq.query(`
      INSERT INTO inventory_transactions (variant_id, user_id, old_quantity, new_quantity, change_quantity, reason)
      VALUES (@varId, @userId, 0, @qty, @qty, @reason)
    `);
  }

  // 3. Cập nhật trạng thái đơn thành CANCELLED
  const updateReq = new sql.Request(transaction);
  updateReq.input('orderId', orderId);
  await updateReq.query("UPDATE orders SET order_status = 'CANCELLED', updated_at = GETDATE() WHERE id = @orderId");

  // 4. Giải phóng lượt dùng voucher và xóa bản ghi voucher_usages (khách có thể dùng lại)
  const vouchReq = new sql.Request(transaction);
  vouchReq.input('orderId', orderId);
  const vouchRes = await vouchReq.query('SELECT voucher_id FROM orders WHERE id = @orderId');
  const appliedVoucherId = vouchRes.recordset[0]?.voucher_id;
  if (appliedVoucherId) {
    const delVu = new sql.Request(transaction);
    delVu.input('orderId', orderId);
    await delVu.query('DELETE FROM voucher_usages WHERE order_id = @orderId');

    const decVouch = new sql.Request(transaction);
    decVouch.input('vId', appliedVoucherId);
    await decVouch.query('UPDATE vouchers SET used_count = CASE WHEN used_count > 0 THEN used_count - 1 ELSE 0 END WHERE id = @vId');
  }

  // 5. Ghi nhận nhật ký trạng thái kiểm toán
  const histReq = new sql.Request(transaction);
  histReq.input('orderId', orderId);
  histReq.input('userId', actorId);
  histReq.input('prevStatus', previousStatus);
  histReq.input('note', note || `Hủy đơn hàng #${orderCode}. Đã hoàn tồn kho tự động.`);
  await histReq.query(`
    INSERT INTO order_status_histories (order_id, changed_by, previous_status, new_status, note)
    VALUES (@orderId, @userId, @prevStatus, 'CANCELLED', @note)
  `);
}
```

---

### 3.4. Mô hình Hai tầng Phân hệ Quản trị (Admin Two-Tier Architecture)

Trong phân hệ quản trị Admin, `AdminController` trực tiếp thực thi các câu lệnh T-SQL thông qua Database Helper `query()`, loại bỏ tầng trung gian không cần thiết:

```javascript
// Trích đoạn: src/controllers/admin.controller.js:8-48 (Doanh thu Dashboard & Top 4 bán chạy)
async getDashboard(req, res, next) {
  try {
    const [revRes, topSoldRes, statusCountsRes] = await Promise.all([
      // Doanh thu thực tế: Đòi hỏi đồng thời 2 điều kiện COMPLETED và PAID
      query(`
        SELECT COALESCE(SUM(total_amount), 0) AS total_revenue 
        FROM orders 
        WHERE order_status = 'COMPLETED' AND payment_status = 'PAID'
      `),
      // Top 4 sản phẩm bán chạy nhất: Xếp hạng theo tổng số lượng bán (total_sold DESC)
      query(`
        SELECT TOP 4 oi.product_name_snapshot,
               SUM(oi.quantity) AS total_sold,
               SUM(oi.line_total) AS total_revenue,
               (SELECT TOP 1 pi.image_url FROM product_variants pv JOIN product_images pi ON pi.product_id = pv.product_id
                WHERE pv.id = MIN(oi.product_variant_id) AND pi.is_primary = 1) AS primary_image
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.order_status = 'COMPLETED'
        GROUP BY oi.product_name_snapshot
        ORDER BY total_sold DESC
      `),
      query('SELECT order_status, COUNT(*) AS count FROM orders GROUP BY order_status')
    ]);

    res.render('pages/admin/dashboard', {
      totalRevenue: revRes.recordset[0].total_revenue,
      topProducts: topSoldRes.recordset,
      statusCounts: statusCountsRes.recordset
    });
  } catch (error) {
    next(error);
  }
}
```
