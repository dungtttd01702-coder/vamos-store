# CHƯƠNG III: TRIỂN KHAI MÃ NGUỒN (SYSTEM IMPLEMENTATION)

---

## 1. CẤU TRÚC MÃ NGUỒN DỰ ÁN

Hệ thống VAMOS STORE được tổ chức theo mô hình **Kiến trúc phân lớp chuẩn (Layered Architecture)** kết hợp với mô hình MVC của Node.js/Express, đảm bảo tính phân tách trách nhiệm (Separation of Concerns) và khả năng mở rộng cao:

```
vamos-store/
├── src/
│   ├── app.js                   # Khởi tạo Express server, cấu hình middlewares & template engine
│   ├── config/
│   │   ├── database.js          # Cấu hình MSSQL Connection Pool (mssql)
│   │   ├── session.js           # Cấu hình express-session & Cookie bảo mật
│   │   └── constants.js         # Các hằng số hệ thống (Mã trạng thái đơn, quy tắc kho)
│   ├── routes/
│   │   ├── storefront/          # Tuyến đường công khai cho khách hàng (home, shop, cart, checkout)
│   │   ├── auth/                # Tuyến đường đăng ký, đăng nhập, khôi phục mật khẩu
│   │   └── admin/               # Tuyến đường bảo mật phân hệ quản trị (dashboard, products, orders, inventory)
│   ├── controllers/
│   │   ├── AuthController.js    # Tiếp nhận request xác thực & điều hướng session
│   │   ├── ProductController.js # Xử lý hiển thị danh sách, bộ lọc & chi tiết sản phẩm
│   │   ├── CartController.js    # Xử lý thêm, sửa, xóa giỏ hàng
│   │   ├── OrderController.js   # Xử lý đặt hàng COD & theo dõi tiến trình đơn
│   │   └── admin/
│   │       ├── AdminProductController.js   # Quản trị sản phẩm & biến thể Size/Color
│   │       ├── AdminOrderController.js     # Vận hành đơn & chuyển trạng thái
│   │       └── AdminInventoryController.js # Quản trị kho & kiểm kê
│   ├── services/
│   │   ├── AuthService.js       # Nghiệp vụ băm mật khẩu bcrypt, kiểm tra đăng nhập
│   │   ├── OrderService.js      # Nghiệp vụ Transaction đặt hàng COD, khóa bi quan, trừ kho
│   │   ├── InventoryService.js  # Nghiệp vụ hoàn kho khi hủy đơn, nhật ký kiểm toán kho
│   │   └── VoucherService.js    # Nghiệp vụ thẩm định điều kiện voucher
│   ├── repositories/
│   │   ├── UserRepository.js    # Thao tác CSDL bảng users & addresses
│   │   ├── ProductRepository.js # Thao tác CSDL bảng products, product_variants, sizes, colors
│   │   ├── CartRepository.js    # Thao tác CSDL bảng carts & cart_items
│   │   └── OrderRepository.js   # Thao tác CSDL bảng orders, order_items, order_status_histories
│   ├── middlewares/
│   │   ├── authMiddleware.js    # Kiểm tra session đăng nhập khách hàng
│   │   ├── adminMiddleware.js   # Kiểm tra quyền quản trị viên Admin (Server-side Enforcement)
│   │   └── validationMiddleware.js # Kiểm tra tính hợp lệ dữ liệu đầu vào (Joi / Validator)
│   └── views/                   # Template Engine Pug
│       ├── layouts/             # Khung layout chính (main.pug, admin.pug)
│       ├── partials/            # Các thành phần giao diện dùng chung (header, footer, sidebar)
│       ├── storefront/          # Giao diện khách hàng (home.pug, shop.pug, product-detail.pug, cart.pug, checkout.pug)
│       └── admin/               # Giao diện quản trị (dashboard.pug, products.pug, orders.pug, inventory.pug)
├── public/                      # Static assets đã biên dịch
│   ├── css/style.css            # Stylesheet xuất từ Tailwind CSS
│   ├── js/                      # JavaScript tương tác phía client (Alpine.js / Vanilla JS)
│   └── images/                  # Hình ảnh sản phẩm, logo, banner
├── database/
│   ├── mssql_schema.sql         # Kịch bản DDL Microsoft SQL Server 2025 khởi tạo 18 bảng
│   └── seeds.sql                # Dữ liệu mẫu kích cỡ, màu sắc, tài khoản admin mặc định
├── Dockerfile                   # Cấu hình container cho ứng dụng Node.js
├── docker-compose.yml           # Điều phối đa container (App + SQL Server)
├── package.json                 # Khai báo dependencies và scripts
└── .env.example                 # Mẫu cấu hình biến môi trường
```

---

## 2. KẾT NỐI VÀ QUẢN TRỊ CƠ SỞ DỮ LIỆU MICROSOFT SQL SERVER 2025

### 2.1. Cấu hình MSSQL Connection Pool

Để tối ưu hóa hiệu năng và quản lý tài nguyên máy chủ, hệ thống sử dụng thư viện `mssql` (Tedious) với cơ chế Connection Pool. Thay vì mỗi request mở một kết nối vật lý mới gây tiêu tốn tài nguyên CPU và RAM, Connection Pool duy trì sẵn một nhóm kết nối sẵn sàng tái sử dụng.

```javascript
// src/config/database.js
const sql = require("mssql");
const config = require("./app.config");

let pool = null;

// Khởi tạo MSSQL Connection Pool
async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(config.db);
    } catch (err) {
      console.error("[MSSQL Pool Error]:", err.message);
      throw err;
    }
  }
  return pool;
}

// Hàm thực thi truy vấn tham số hóa (Parameterized Query) an toàn
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

## 3. TRIỂN KHAI CÁC CHỨC NĂNG CỐT LÕI

### 3.1. Chức năng Đăng ký tài khoản và Băm mật khẩu Bcrypt

- **Mô tả xử lý:** Hệ thống tiếp nhận form đăng ký, chuẩn hóa email về chữ thường, kiểm tra email chưa từng tồn tại trong CSDL, sau đó áp dụng hàm băm `bcrypt.hash` với chi phí `saltRounds = 10` trước khi lưu vào bảng `users`.

```javascript
// src/services/AuthService.js (Trích đoạn Đăng ký tài khoản)
const bcrypt = require("bcryptjs");
const UserRepository = require("../repositories/UserRepository");

class AuthService {
  async registerUser({ fullName, email, password, phone }) {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Kiểm tra email đã được đăng ký trước đó chưa
    const existingUser = await UserRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error(
        "Địa chỉ email này đã được sử dụng. Vui lòng chọn email khác!",
      );
    }

    // 2. Băm mật khẩu bằng bcrypt (Salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Tạo bản ghi tài khoản mới với vai trò CUSTOMER mặc định
    const newUserId = await UserRepository.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone ? phone.trim() : null,
      role: "CUSTOMER",
      status: "active",
    });

    // 4. Khởi tạo giỏ hàng trống mặc định cho khách hàng (1 User = 1 Cart)
    await UserRepository.createCartForUser(newUserId);

    return { userId: newUserId, email: normalizedEmail };
  }
}

module.exports = new AuthService();
```

---

### 3.2. Middleware phân quyền quản trị máy chủ (Server-side Authorization)

- **Mô tả xử lý:** Đảm bảo nguyên tắc an toàn máy chủ (Server-side Enforcement), middleware chặn đứng mọi request từ các tài khoản không có quyền `ADMIN` hoặc tài khoản bị khóa.

```javascript
// src/middlewares/adminMiddleware.js
function requireAdmin(req, res, next) {
  // 1. Kiểm tra session đăng nhập của người dùng
  if (!req.session || !req.session.user) {
    req.flash("errorMessage", "Vui lòng đăng nhập để tiếp tục.");
    return res.redirect(
      "/auth/login?redirect=" + encodeURIComponent(req.originalUrl),
    );
  }

  // 2. Kiểm tra vai trò quyền hạn (Role) và trạng thái tài khoản
  const currentUser = req.session.user;
  if (currentUser.role !== "ADMIN" || currentUser.status === "locked") {
    // Ghi log cảnh báo truy cập trái phép
    console.warn(
      `[SECURITY ALERT] Truy cập trái phép trang Admin từ User ID: ${currentUser.id}`,
    );
    return res.status(403).render("errors/403.pug", {
      title: "403 - Quyền truy cập bị từ chối",
    });
  }

  // 3. Hợp lệ, cho phép đi tiếp vào Controller quản trị
  next();
}

module.exports = requireAdmin;
```

---

### 3.3. Chức năng Đặt hàng COD với Database Transaction và Khóa bi quan

- **Mô tả xử lý:** Đây là nghiệp vụ trọng tâm nhất của hệ thống. Để chống bán vượt tồn kho (Anti-Overselling), toàn bộ quá trình: Khóa dòng kiểm tra kho $\rightarrow$ Trừ tồn kho $\rightarrow$ Tạo đơn `orders` $\rightarrow$ Lưu snapshot `order_items` $\rightarrow$ Xóa giỏ hàng được đặt trọn vẹn trong một **MSSQL Database Transaction (T-SQL)**.

```javascript
// src/services/order.service.js (Trích đoạn Đặt hàng COD an toàn ACID với UPDLOCK, ROWLOCK)
const { pool } = require("../config/database");

class OrderService {
  async checkoutCOD({
    userId,
    recipientName,
    phone,
    deliveryAddress,
    voucherCode,
    customerNote,
  }) {
    const connection = await pool.getConnection();
    try {
      // BẮT ĐẦU GIAO DỊCH DATABASE (ACID TRANSACTION)
      await connection.beginTransaction();

      // 1. Lấy danh sách sản phẩm trong giỏ hàng của khách
      const [cartRows] = await connection.execute(
        `SELECT ci.variant_id, ci.quantity, pv.stock_quantity, pv.sku,
                        p.name as product_name, p.base_price, p.sale_price,
                        s.size_name, c.color_name
                 FROM cart_items ci
                 JOIN carts ct ON ci.cart_id = ct.id
                 JOIN product_variants pv ON ci.variant_id = pv.id
                 JOIN products p ON pv.product_id = p.id
                 JOIN sizes s ON pv.size_id = s.id
                 JOIN colors c ON pv.color_id = c.id
                 WHERE ct.user_id = ?`,
        [userId],
      );

      if (cartRows.length === 0) {
        throw new Error("Giỏ hàng của bạn đang trống.");
      }

      // 2. KHÓA BI QUAN VÀ KIỂM TRA TỒN KHO THỜI GIAN THỰC (SELECT ... WITH (UPDLOCK, ROWLOCK))
      let subtotal = 0;
      const orderItemsData = [];

      for (const item of cartRows) {
        const [lockedRows] = await connection.execute(
          `SELECT stock_quantity FROM product_variants WHERE id = ? WITH (UPDLOCK, ROWLOCK)`,
          [item.variant_id],
        );

        const currentStock = lockedRows[0].stock_quantity;
        if (currentStock < item.quantity) {
          throw new Error(
            `Sản phẩm "${item.product_name}" (Cỡ: ${item.size_name}, Màu: ${item.color_name}) chỉ còn ${currentStock} đôi trong kho. Vui lòng điều chỉnh lại số lượng!`,
          );
        }

        // Xác định đơn giá thực tế tại thời điểm mua (ưu tiên sale_price)
        const unitPrice =
          item.sale_price !== null ? item.sale_price : item.base_price;
        const lineTotal = Number(unitPrice) * item.quantity;
        subtotal += lineTotal;

        orderItemsData.push({
          variantId: item.variant_id,
          productName: item.product_name,
          sku: item.sku,
          size: item.size_name,
          color: item.color_name,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
          oldStock: currentStock,
        });
      }

      // 3. Xử lý Voucher giảm giá nếu có
      let discountAmount = 0;
      let voucherId = null;
      let voucherCodeSnapshot = null;

      if (voucherCode) {
        const [vouchers] = await connection.execute(
          `SELECT * FROM vouchers 
                     WHERE code = ? AND is_active = TRUE 
                       AND NOW() BETWEEN start_date AND end_date
                       AND (usage_limit = 0 OR used_count < usage_limit)
                       AND min_order_value <= ? WITH (UPDLOCK, ROWLOCK)`,
          [voucherCode.trim().toUpperCase(), subtotal],
        );

        if (vouchers.length > 0) {
          const voucher = vouchers[0];
          voucherId = voucher.id;
          voucherCodeSnapshot = voucher.code;

          if (voucher.discount_type === "percentage") {
            discountAmount = Math.round(
              (subtotal * Number(voucher.discount_value)) / 100,
            );
            if (
              voucher.max_discount_amount &&
              discountAmount > Number(voucher.max_discount_amount)
            ) {
              discountAmount = Number(voucher.max_discount_amount);
            }
          } else {
            discountAmount = Number(voucher.discount_value);
          }

          // Tăng số lượt đã sử dụng của voucher
          await connection.execute(
            `UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?`,
            [voucher.id],
          );
        }
      }

      const shippingFee = subtotal >= 500000 ? 0 : 30000; // Miễn phí ship cho đơn từ 500k
      const totalAmount = subtotal - discountAmount + shippingFee;
      const orderCode =
        "ORD-" +
        Date.now().toString().slice(-8) +
        Math.floor(1000 + Math.random() * 9000);

      // 4. Lưu bản ghi đơn hàng chính orders (trạng thái PENDING)
      const [orderResult] = await connection.execute(
        `INSERT INTO orders 
                 (order_code, user_id, recipient_name_snapshot, recipient_phone_snapshot, 
                  delivery_address_snapshot, subtotal, discount_amount, shipping_fee, total_amount, 
                  voucher_id, voucher_code_snapshot, payment_method, payment_status, order_status, customer_note)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COD', 'UNPAID', 'PENDING', ?)`,
        [
          orderCode,
          userId,
          recipientName,
          phone,
          deliveryAddress,
          subtotal,
          discountAmount,
          shippingFee,
          totalAmount,
          voucherId,
          voucherCodeSnapshot,
          customerNote || null,
        ],
      );

      const orderId = orderResult.insertId;

      // 5. Lưu Snapshot chi tiết từng mặt hàng và trừ tồn kho
      for (const item of orderItemsData) {
        // Lưu snapshot bất biến vào order_items
        await connection.execute(
          `INSERT INTO order_items 
                     (order_id, product_variant_id, product_name_snapshot, sku_snapshot, 
                      size_snapshot, color_snapshot, unit_price, quantity, line_total)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.variantId,
            item.productName,
            item.sku,
            item.size,
            item.color,
            item.unitPrice,
            item.quantity,
            item.lineTotal,
          ],
        );

        // Trừ số lượng tồn kho khả dụng
        const newStock = item.oldStock - item.quantity;
        await connection.execute(
          `UPDATE product_variants SET stock_quantity = ? WHERE id = ?`,
          [newStock, item.variantId],
        );

        // Ghi nhật ký kiểm toán biến động kho
        await connection.execute(
          `INSERT INTO inventory_transactions 
                     (variant_id, user_id, old_quantity, new_quantity, change_quantity, reason)
                     VALUES (?, ?, ?, ?, ?, 'ORDER_PLACED')`,
          [item.variantId, userId, item.oldStock, newStock, -item.quantity],
        );
      }

      // 6. Ghi nhật ký lịch sử trạng thái ban đầu của đơn hàng
      await connection.execute(
        `INSERT INTO order_status_histories (order_id, changed_by, previous_status, new_status, note)
                 VALUES (?, ?, NULL, 'PENDING', 'Khách hàng hoàn tất đặt đơn COD thành công')`,
        [orderId, userId],
      );

      // 7. Làm rỗng giỏ hàng của khách sau khi đã đặt thành công
      await connection.execute(
        `DELETE ci FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE c.user_id = ?`,
        [userId],
      );

      // XÁC NHẬN GIAO DỊCH THÀNH CÔNG (COMMIT)
      await connection.commit();
      return { orderId, orderCode, totalAmount };
    } catch (error) {
      // NẾU CÓ BẤT KỲ LỖI NÀO -> HỦY TOÀN BỘ THAO TÁC (ROLLBACK)
      await connection.rollback();
      throw error;
    } finally {
      // Giải phóng kết nối trả về cho Connection Pool
      connection.release();
    }
  }
}

module.exports = new OrderService();
```

---

### 3.4. Chức năng Tự động Hoàn kho khi Hủy đơn hàng

- **Mô tả xử lý:** Khi đơn hàng bị hủy hợp lệ ở trạng thái `PENDING` hoặc `CONFIRMED`, hệ thống chạy Transaction để phục hồi lại số lượng tồn kho cho các biến thể và ghi nhận lý do kiểm toán `ORDER_CANCELLED_RESTOCK`.

```javascript
// src/services/InventoryService.js (Trích đoạn Hoàn kho khi Hủy đơn)
const { pool } = require("../config/database");

class InventoryService {
  async restockCancelledOrder(orderId, operatorUserId, cancelReason) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Kiểm tra đơn hàng có đủ điều kiện hủy không (PENDING hoặc CONFIRMED)
      const [orders] = await connection.execute(
        `SELECT id, order_status, voucher_id FROM orders WHERE id = ? WITH (UPDLOCK, ROWLOCK)`,
        [orderId],
      );

      if (orders.length === 0) throw new Error("Không tìm thấy đơn hàng.");
      const order = orders[0];

      if (!["PENDING", "CONFIRMED"].includes(order.order_status)) {
        throw new Error(
          `Đơn hàng đang ở trạng thái "${order.order_status}", không được phép hủy.`,
        );
      }

      // 2. Chuyển trạng thái đơn sang CANCELLED
      await connection.execute(
        `UPDATE orders SET order_status = 'CANCELLED' WHERE id = ?`,
        [orderId],
      );

      // 3. Lấy danh sách sản phẩm và số lượng cần hoàn trả
      const [items] = await connection.execute(
        `SELECT product_variant_id, quantity FROM order_items WHERE order_id = ?`,
        [orderId],
      );

      for (const item of items) {
        const [variants] = await connection.execute(
          `SELECT stock_quantity FROM product_variants WHERE id = ? WITH (UPDLOCK, ROWLOCK)`,
          [item.product_variant_id],
        );

        const currentStock = variants[0].stock_quantity;
        const restoredStock = currentStock + item.quantity;

        // Cộng hoàn lại số lượng tồn kho
        await connection.execute(
          `UPDATE product_variants SET stock_quantity = ? WHERE id = ?`,
          [restoredStock, item.product_variant_id],
        );

        // Ghi vết nhật ký hoàn kho kiểm toán
        await connection.execute(
          `INSERT INTO inventory_transactions 
                     (variant_id, user_id, old_quantity, new_quantity, change_quantity, reason)
                     VALUES (?, ?, ?, ?, ?, 'ORDER_CANCELLED_RESTOCK')`,
          [
            item.product_variant_id,
            operatorUserId,
            currentStock,
            restoredStock,
            item.quantity,
          ],
        );
      }

      // 4. Hoàn lại 1 lượt dùng cho voucher nếu đơn có sử dụng mã
      if (order.voucher_id) {
        await connection.execute(
          `UPDATE vouchers SET used_count = GREATEST(0, used_count - 1) WHERE id = ?`,
          [order.voucher_id],
        );
      }

      // 5. Ghi nhật ký chuyển trạng thái
      await connection.execute(
        `INSERT INTO order_status_histories (order_id, changed_by, previous_status, new_status, note)
                 VALUES (?, ?, ?, 'CANCELLED', ?)`,
        [
          orderId,
          operatorUserId,
          order.order_status,
          cancelReason || "Hủy đơn hàng và hoàn trả tồn kho",
        ],
      );

      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new InventoryService();
```
