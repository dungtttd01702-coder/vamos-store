# VÍ DỤ VỀ CÁC LUỒNG XỬ LÝ YÊU CẦU TIÊU BIỂU (REQUEST FLOW EXAMPLES)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE

> **Tiêu chuẩn học thuật:** Đồ án Tốt nghiệp / Assignment Kỹ nghệ Phần mềm FPT Polytechnic.  
> **Nguyên tắc phân tích:** Minh họa chi tiết từng bước chuyển dịch dữ liệu (End-to-End Data Flow) xuyên suốt qua các tầng kiến trúc: từ sự kiện trên giao diện người dùng, qua hệ thống middleware, bộ điều khiển, dịch vụ nghiệp vụ (nếu có), kho dữ liệu hoặc database helper, đến cơ sở dữ liệu Microsoft SQL Server.  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | Git HEAD `8135e19`.

---

## 1. MỤC TIÊU VÀ DANH MỤC 4 LUỒNG XỬ LÝ TIÊU BIỂU

Hệ thống VAMOS STORE không áp đặt một pipeline duy nhất cho mọi yêu cầu, mà linh hoạt phân chia luồng xử lý tùy theo bản chất của từng tác vụ:
1. **Luồng 1 — Tra cứu & Xem chi tiết sản phẩm (`GET /products/:slug`):** Đại diện cho luồng **Đọc dữ liệu phức tạp nhiều bảng (Read-Heavy SSR)**, tuân thủ đầy đủ mô hình 3 tầng vật lý (Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ SQL Server).
2. **Luồng 2 — Đặt hàng thanh toán COD (`POST /checkout`):** Đại diện cho luồng **Ghi dữ liệu giao dịch cốt lõi (Write-Heavy Transaction)**, sử dụng Controller $\rightarrow$ Service $\rightarrow$ Transaction Database Helper với cơ chế khóa bi quan (UPDLOCK, ROWLOCK) bảo đảm toàn vẹn ACID.
3. **Luồng 3 — Thêm / Bỏ yêu thích sản phẩm qua AJAX (`POST /api/wishlist/toggle`):** Đại diện cho luồng **API RESTful không tải lại trang (Client Fetch / AJAX API)**, trả về JSON có kiểm soát quyền khách hàng và bảo vệ CSRF.
4. **Luồng 4 — Tải Bảng điều khiển Quản trị (`GET /admin/dashboard`):** Đại diện cho luồng **Tổng hợp báo cáo KPI song song (Analytics / Aggregation)**, do Controller trực tiếp điều phối qua `Promise.all` 9 truy vấn song song và 1 truy vấn khẩn cấp (không sử dụng Service/Repository trung gian).

---

## 2. LUỒNG 1: TRA CỨU & XEM CHI TIẾT SẢN PHẨM (`GET /products/:slug`)

### 2.1. Sơ đồ tuần tự các bước (Step-by-Step Flow)
```
[Trình duyệt]           [Express Middleware]           [product.routes.js]     [product.controller.js]     [product.service.js]     [product.repository.js]     [SQL Server Pool]
      │                           │                             │                         │                         │                        │                          │
      │ 1. GET /products/:slug    │                             │                         │                         │                        │                          │
      ├──────────────────────────>│                             │                         │                         │                        │                          │
      │                           │ 2. Security Headers, Morgan,│                         │                         │                        │                          │
      │                           │    Session, Context, i18n   │                         │                         │                        │                          │
      │                           ├────────────────────────────>│                         │                         │                        │                          │
      │                           │                             │ 3. router.get('/:slug') │                         │                        │                          │
      │                           │                             ├────────────────────────>│                         │                        │                          │
      │                           │                             │                         │ 4. getProductBySlug()   │                        │                          │
      │                           │                             │                         ├────────────────────────>│                        │                          │
      │                           │                             │                         │                         │ 5. findBySlug(slug)    │                          │
      │                           │                             │                         │                         ├───────────────────────>│                          │
      │                           │                             │                         │                         │                        │ 6. query(sqlStr, {slug}) │
      │                           │                             │                         │                         │                        ├─────────────────────────>│
      │                           │                             │                         │                         │                        │<─────────────────────────┤
      │                           │                             │                         │                         │<───────────────────────┤ (Recordset trả về)       │
      │                           │                             │                         │<────────────────────────┤ (Product Data)         │                          │
      │                           │                             │                         │ 7. Bóc tách ma trận     │                        │                          │
      │                           │                             │                         │    sizes & colors       │                        │                          │
      │                           │                             │                         │ 8. Lấy SP liên quan     │                        │                          │
      │                           │                             │                         │ 9. res.render('detail') │                        │                          │
      │ 10. Trả về HTML hoàn chỉnh│                             │                         │    (Pug SSR biên dịch)  │                        │                          │
      │<──────────────────────────────────────────────────────────────────────────────────┤                         │                        │                          │
```

### 2.2. Chi tiết thực thi trong mã nguồn:
1. **Trình duyệt:** Khách hàng nhấp vào liên kết một sản phẩm, ví dụ `/products/nike-air-force-1-07`.
2. **Hệ thống Middleware (`src/app.js`):**
   - Thiết lập các tiêu đề an ninh HTTP (`nosniff`, `SAMEORIGIN`, `X-XSS-Protection`).
   - `express.static` kiểm tra không phải file tĩnh.
   - `session` nạp thông tin phiên làm việc từ cookie `vamos_sid`.
   - `sessionContextMiddleware` đẩy `user`, `cartCount` vào `res.locals`.
   - `i18nMiddleware` xác định ngôn ngữ từ cookie `vamos_locale` (`vi` hoặc `en`).
   - `csrfMiddleware` cấp mã `csrfToken` vào `res.locals`.
3. **Định tuyến (`src/routes/product.routes.js` dòng 13):**
   `router.get('/:slug', productController.detail);` tiếp nhận tham số `req.params.slug`.
4. **Bộ điều khiển (`src/controllers/product.controller.js`):**
   Gọi hàm `productService.getProductBySlug(slug)`.
5. **Dịch vụ (`src/services/product.service.js`):**
   Kiểm tra tham số slug và gọi hàm `productRepository.findBySlug(slug)`.
6. **Kho dữ liệu (`src/models/repositories/product.repository.js` dòng 105):**
   Thực thi câu truy vấn SQL kết nối nhiều bảng:
   ```sql
   SELECT p.*, c.name AS category_name, b.name AS brand_name,
          pv.id AS variant_id, pv.sku, pv.stock_quantity, pv.status AS variant_status,
          s.id AS size_id, s.size_name, s.display_order AS size_order,
          cl.id AS color_id, cl.color_name, cl.hex_code,
          pi.image_url, pi.is_primary
   FROM products p
   JOIN categories c ON p.category_id = c.id
   LEFT JOIN brands b ON p.brand_id = b.id
   LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.status = 'active'
   LEFT JOIN sizes s ON pv.size_id = s.id
   LEFT JOIN colors cl ON pv.color_id = cl.id
   LEFT JOIN product_images pi ON pi.product_id = p.id
   WHERE p.slug = @slug AND p.status = 'active'
   ```
7. **Xử lý dữ liệu:** Controller bóc tách danh sách kích cỡ (`availableSizes`) và màu sắc (`availableColors`) duy nhất từ tập biến thể.
8. **Dữ liệu bổ trợ:** Gọi `productService.getFlashSaleProducts(5)` lấy 4 sản phẩm gợi ý liên quan.
9. **Động cơ giao diện:** Gọi `res.render('pages/products/detail', { product, availableSizes, availableColors, relatedProducts })`. Động cơ Pug biên dịch mã HTML kèm nhúng thuộc tính `data-variants` vào DOM.
10. **Phản hồi:** Trình duyệt nhận mã HTML (HTTP 200 OK), kích hoạt script `src/public/js/main.js` để người dùng chọn size/màu và cập nhật nút mua hàng.

---

## 3. LUỒNG 2: ĐẶT HÀNG THANH TOÁN COD (`POST /checkout`)

### 3.1. Sơ đồ tuần tự các bước (Step-by-Step Flow)
```
[Trình duyệt]              [Express Middleware]             [checkout.controller.js]            [order.service.js]                      [database.js / SQL Server Pool]
      │                              │                                 │                                 │                                             │
      │ 1. POST /checkout            │                                 │                                 │                                             │
      │ (_csrf, name, phone, addr...)│                                 │                                 │                                             │
      ├─────────────────────────────>│                                 │                                 │                                             │
      │                              │ 2. csrfMiddleware:              │                                 │                                             │
      │                              │    So khớp _csrf token          │                                 │                                             │
      │                              │ 3. requireCustomer:             │                                 │                                             │
      │                              │    Xác thực phiên & vai trò     │                                 │                                             │
      │                              ├────────────────────────────────>│                                 │                                             │
      │                              │                                 │ 4. Kiểm tra hợp lệ dữ liệu      │                                             │
      │                              │                                 │    isValidFullName, isValidPhone│                                             │
      │                              │                                 │ 5. createCodOrder(...)          │                                             │
      │                              │                                 ├────────────────────────────────>│                                             │
      │                              │                                 │                                 │ 6. Transaction.begin()                      │
      │                              │                                 │                                 ├────────────────────────────────────────────>│
      │                              │                                 │                                 │ 7. Khóa giỏ hàng WITH (UPDLOCK, ROWLOCK)    │
      │                              │                                 │                                 │ 8. Tính subtotal & shippingFee (500k -> 0đ) │
      │                              │                                 │                                 │ 9. Khóa & xác thực voucher WITH UPDLOCK     │
      │                              │                                 │                                 │ 10. Khóa product_variants WITH (UPDLOCK),   │
      │                              │                                 │                                 │     kiểm tra tồn kho & trừ tồn kho          │
      │                              │                                 │                                 │ 11. INSERT inventory_transactions (-qty)    │
      │                              │                                 │                                 │ 12. INSERT orders (snapshot, PENDING, UNPAID)│
      │                              │                                 │                                 │ 13. INSERT order_items (snapshots)          │
      │                              │                                 │                                 │ 14. INSERT order_status_histories ('PENDING')│
      │                              │                                 │                                 │ 15. DELETE FROM cart_items                  │
      │                              │                                 │                                 ├────────────────────────────────────────────>│
      │                              │                                 │                                 │ 16. Transaction.commit()                    │
      │                              │                                 │                                 ├────────────────────────────────────────────>│
      │                              │                                 │ 17. req.session.cartCount = 0   │                                             │
      │ 18. HTTP 302 Redirect        │                                 │                                 │                                             │
      │     /checkout/success/:id    │                                 │                                 │                                             │
      │<───────────────────────────────────────────────────────────────┤                                 │                                             │
```

### 3.2. Chi tiết thực thi trong mã nguồn:
1. **Trình duyệt:** Khách hàng xác nhận biểu mẫu thanh toán tại trang checkout và gửi request `POST /checkout`.
2. **`csrfMiddleware` (`src/middlewares/csrf.middleware.js`):**
   Kiểm tra `req.body._csrf` khớp với mã trong phiên làm việc. Nếu sai hoặc thiếu $\rightarrow$ ném lỗi HTTP 403 Forbidden.
3. **`requireCustomer` (`src/middlewares/auth.middleware.js`):**
   Kiểm tra `req.session.user` tồn tại và không phải là `ADMIN`. Nếu là Guest $\rightarrow$ chuyển hướng về `/auth/login?returnUrl=/checkout`; nếu là Admin $\rightarrow$ từ chối thao tác.
4. **Bộ điều khiển (`src/controllers/checkout.controller.js` dòng 74 - `postCheckout`):**
   Trích xuất dữ liệu biểu mẫu: `recipient_name`, `recipient_phone`, `province`, `district`, `ward`, `detail_address`, `voucher_code`, `customer_note`.
   Kiểm tra tính hợp lệ qua tiện ích `src/utils/validator.js` (`isValidFullName`, `isValidPhone`).
5. **Dịch vụ (`src/services/order.service.js` dòng 24 - `createCodOrder`):**
   Bắt đầu giao dịch nguyên tử:
   ```javascript
   const pool = await getPool();
   const transaction = new sql.Transaction(pool);
   await transaction.begin();
   ```
6. **Khóa và đọc giỏ hàng CSDL:**
   Khóa bằng chỉ dẫn `WITH (UPDLOCK, ROWLOCK)` trên bảng `carts` và `cart_items` để ngăn chặn xung đột dữ liệu đa luồng. Nếu giỏ rỗng $\rightarrow$ ném lỗi, kích hoạt rollback.
7. **Tính toán số tiền:**
   Tính tổng tiền hàng (`subtotal`). Tính phí vận chuyển: `const shippingFee = subtotal >= 500000 ? 0 : 30000`.
8. **Khóa và áp dụng Voucher (nếu có):**
   Khóa bản ghi `vouchers WITH (UPDLOCK, ROWLOCK)`. Kiểm tra trạng thái kích hoạt, thời hạn, đơn tối thiểu, số lượt còn lại. Kiểm tra bảng `voucher_usages` để bảo đảm mỗi tài khoản khách hàng chỉ được dùng 1 lần duy nhất.
9. **Khóa biến thể và Trừ tồn kho:**
   Duyệt từng món hàng trong giỏ, áp dụng khóa `product_variants WITH (UPDLOCK, ROWLOCK)`. Kiểm tra số lượng tồn khả dụng `stock_quantity >= item.quantity`. Thực thi lệnh `UPDATE product_variants SET stock_quantity = stock_quantity - @qty`.
10. **Ghi nhật ký kho:** `INSERT INTO inventory_transactions` với `change_quantity = -item.quantity` và lý do ghi rõ xuất kho tạo đơn hàng.
11. **Tạo đơn hàng chính:** `INSERT INTO orders` lưu snapshot người nhận, số điện thoại, địa chỉ, tổng tiền `total_amount`, `payment_method = 'COD'`, `payment_status = 'UNPAID'`, `order_status = 'PENDING'`. Thu hồi `orderId` qua `OUTPUT INSERTED.id`.
12. **Tạo chi tiết đơn hàng:** `INSERT INTO order_items` lưu trữ bản sao cố định (snapshot) của tên sản phẩm, mã SKU, size, màu, đơn giá tại thời điểm đặt.
13. **Ghi nhận lịch sử trạng thái:** `INSERT INTO order_status_histories (order_id, changed_by, new_status = 'PENDING')`.
14. **Dọn dẹp giỏ hàng:** `DELETE FROM cart_items WHERE cart_id = @cartId`.
15. **Xác nhận giao dịch:** `await transaction.commit()`.
    *(Nếu có bất kỳ ngoại lệ nào xảy ra ở các bước trên, khối `catch` lập tức gọi `await transaction.rollback()`, dữ liệu hoàn nguyên 100%)*.
16. **Cập nhật Session & Điều hướng:** Đặt lại `req.session.cartCount = 0`, chuyển hướng người dùng sang trang `/checkout/success/${order.id}` (HTTP 302).

---

## 4. LUỒNG 3: THÊM / BỎ YÊU THÍCH QUA AJAX (`POST /api/wishlist/toggle`)

### 4.1. Sơ đồ tuần tự các bước (Step-by-Step Flow)
```
[Trình duyệt (Vanilla JS)]     [Express Middleware]             [wishlist.controller.js]     [wishlist.service.js]     [wishlist.repository.js]     [SQL Server Pool]
            │                            │                                  │                          │                         │                          │
            │ 1. POST /api/wishlist/toggle│                                 │                          │                         │                          │
            │    { productId, _csrf }    │                                  │                          │                         │                          │
            ├───────────────────────────>│                                  │                          │                         │                          │
            │                            │ 2. csrfMiddleware:               │                          │                         │                          │
            │                            │    Kiểm tra _csrf hoặc header    │                          │                         │                          │
            │                            │ 3. requireCustomer Guard:        │                          │                         │                          │
            │                            │    Chặn Guest (401 JSON)         │                          │                         │                          │
            │                            │    Chặn Admin (403 JSON)         │                          │                         │                          │
            │                            ├─────────────────────────────────>│                          │                         │                          │
            │                            │                                  │ 4. toggleItem(user, prod)│                         │                          │
            │                            │                                  ├─────────────────────────>│                         │                          │
            │                            │                                  │                          │ 5. findProductById()    │                          │
            │                            │                                  │                          ├────────────────────────>│                          │
            │                            │                                  │                          │                         │ 6. query(products)       │
            │                            │                                  │                          │                         ├─────────────────────────>│
            │                            │                                  │                          │                         │<─────────────────────────┤
            │                            │                                  │                          │ 7. isInWishlist(u, p)   │                          │
            │                            │                                  │                          ├────────────────────────>│                          │
            │                            │                                  │                          │                         │ 8. query(wishlist_items) │
            │                            │                                  │                          │                         ├─────────────────────────>│
            │                            │                                  │                          │                         │<─────────────────────────┤
            │                            │                                  │                          │ 9. Nếu có -> removeItem│                          │
            │                            │                                  │                          │    Nếu chưa -> addItem  │                          │
            │                            │                                  │                          ├────────────────────────>│                          │
            │                            │                                  │                          │                         │ 10. INSERT / DELETE      │
            │                            │                                  │                          │                         ├─────────────────────────>│
            │                            │                                  │                          │                         │<─────────────────────────┤
            │                            │                                  │                          │ 11. countByUser(userId) │                          │
            │                            │                                  │                          ├────────────────────────>│                          │
            │                            │                                  │                          │                         │ 12. SELECT COUNT(*)      │
            │                            │                                  │                          │                         ├─────────────────────────>│
            │                            │                                  │                          │                         │<─────────────────────────┤
            │                            │                                  │                          │<────────────────────────┤                          │
            │                            │                                  │<─────────────────────────┤                          │                          │
            │ 13. Phản hồi JSON 200 OK   │                                  │                          │                          │                          │
            │     { success, action, inWishlist, count, product, message }  │                          │                          │                          │
            │<──────────────────────────────────────────────────────────────┤                          │                          │                          │
            │ 14. JS đổi màu Trái tim    │                                  │                          │                          │                          │
            │     & cập nhật Badge đếm   │                                  │                          │                          │                          │
```

### 4.2. Chi tiết thực thi trong mã nguồn:
1. **Trình duyệt:** Khách hàng nhấp vào icon Trái tim trên thẻ sản phẩm hoặc trang chi tiết. Script `src/public/js/main.js` gửi `fetch('/api/wishlist/toggle', { method: 'POST', body: JSON.stringify({ productId, _csrf }) })`.
2. **`csrfMiddleware` (`src/middlewares/csrf.middleware.js`):**
   Xác thực token bảo vệ CSRF truyền qua body JSON hoặc header `X-CSRF-Token`.
3. **`requireCustomer` Guard (`src/routes/wishlist.routes.js` dòng 7):**
   - Nếu là **Guest (chưa đăng nhập):** Trả về HTTP 401 Unauthorized kèm JSON:
     `{ success: false, message: 'Vui lòng đăng nhập để lưu sản phẩm yêu thích.', redirectUrl: '/auth/login?returnUrl=...' }`.
   - Nếu là **Admin:** Trả về HTTP 403 Forbidden kèm JSON:
     `{ success: false, message: 'Tài khoản Quản trị viên không thể thực hiện chức năng mua sắm này.' }`.
4. **Bộ điều khiển (`src/controllers/wishlist.controller.js` dòng 56 - `toggleItem`):**
   Trích xuất `userId = req.session.user.id` và `productId = req.body.productId`. Gọi hàm `wishlistService.toggleItem(userId, productId)`.
5. **Dịch vụ (`src/services/wishlist.service.js` dòng 72):**
   - Kiểm tra `productId` là số nguyên dương hợp lệ.
   - Gọi `wishlistRepository.findProductById(parsedId)` xác nhận sản phẩm đang tồn tại và có trạng thái `active`.
   - Gọi `wishlistRepository.isInWishlist(userId, parsedId)`:
     - Nếu đã có trong danh sách $\rightarrow$ gọi `wishlistRepository.removeItem(userId, parsedId)` (thực hiện `DELETE FROM wishlist_items`).
     - Nếu chưa có $\rightarrow$ gọi `wishlistRepository.addItem(userId, parsedId)` (thực hiện `INSERT INTO wishlist_items`).
   - Gọi `wishlistRepository.countByUser(userId)` để lấy tổng số lượng sản phẩm yêu thích hiện tại.
6. **Kho dữ liệu (`src/models/repositories/wishlist.repository.js`):**
   Thực thi các câu lệnh SQL tham số hóa qua `database.js:query`.
7. **Phản hồi:** Controller gửi chuỗi JSON (HTTP 200 OK):
   ```json
   {
     "success": true,
     "action": "added",
     "inWishlist": true,
     "count": 3,
     "product": { "id": 12, "name": "Nike Air Force 1 '07" },
     "message": "Đã thêm sản phẩm vào danh sách yêu thích"
   }
   ```
8. **Phía máy khách:** `main.js` nhận kết quả, cập nhật class CSS của icon Trái tim (đổi sang màu đỏ hoặc màu viền xám), cập nhật số đếm trên thanh điều hướng header và hiển thị thông báo nổi Toast mà hoàn toàn không tải lại trang.

---

## 5. LUỒNG 4: TẢI BẢNG ĐIỀU KHIỂN QUẢN TRỊ (`GET /admin/dashboard`)

### 5.1. Sơ đồ tuần tự các bước (Step-by-Step Flow)
```
[Trình duyệt Quản trị]         [Express Middleware]             [admin.controller.js:getDashboard]                   [database.js:query / SQL Server Pool]
          │                              │                                       │                                                   │
          │ 1. GET /admin/dashboard      │                                       │                                                   │
          ├─────────────────────────────>│                                       │                                                   │
          │                              │ 2. requireAdmin Guard:                │                                                   │
          │                              │    Kiểm tra session.user.role=='ADMIN'│                                                   │
          │                              │    và trạng thái 'active'             │                                                   │
          │                              ├──────────────────────────────────────>│                                                   │
          │                              │                                       │ 3. Promise.all kích hoạt đồng thời 9 truy vấn:    │
          │                              │                                       │    Q1: SUM(total_amount) (COMPLETED & PAID)       │
          │                              │                                       │    Q2: COUNT(*) total_orders                      │
          │                              │                                       │    Q3: COUNT(*) pending_orders                    │
          │                              │                                       │    Q4: COUNT(*) active products                   │
          │                              │                                       │    Q5: COUNT(*) active SKUs                       │
          │                              │                                       │    Q6: TOP 8 low-stock SKUs (<= 5)                │
          │                              │                                       │    Q7: TOP 6 recent orders                        │
          │                              │                                       │    Q8: TOP 4 best-selling items                   │
          │                              │                                       │    Q9: Order status breakdown counts              │
          │                              │                                       ├──────────────────────────────────────────────────>│
          │                              │                                       │<──────────────────────────────────────────────────┤
          │                              │                                       │    (Nhận kết quả 9 truy vấn song song)            │
          │                              │                                       │ 4. Thực thi truy vấn tuần tự thứ 10:              │
          │                              │                                       │    Q10: TOP 5 urgent pending orders               │
          │                              │                                       ├──────────────────────────────────────────────────>│
          │                              │                                       │<──────────────────────────────────────────────────┤
          │                              │                                       │ 5. Chuẩn bị đối tượng Model `stats`, `urgentOrders│
          │                              │                                       │ 6. res.render('pages/admin/dashboard')            │
          │ 7. Trả về HTML Dashboard     │                                       │    (Pug SSR biên dịch giao diện quản trị)         │
          │<─────────────────────────────────────────────────────────────────────┤                                                   │
```

### 5.2. Chi tiết thực thi trong mã nguồn:
1. **Trình duyệt Quản trị:** Admin truy cập đường dẫn `/admin/dashboard`.
2. **`requireAdmin` Guard (`src/middlewares/auth.middleware.js`):**
   Kiểm tra `req.session.user` tồn tại, có `role === 'ADMIN'` và trạng thái `active`.
   - Nếu chưa đăng nhập $\rightarrow$ chuyển hướng sang `/auth/login?returnUrl=/admin/dashboard`.
   - Nếu đã đăng nhập nhưng là `CUSTOMER` $\rightarrow$ trả về mã lỗi HTTP 403 Forbidden kèm giao diện `pages/errors/403.pug`.
3. **Bộ điều khiển (`src/controllers/admin.controller.js` dòng 8 - `getDashboard`):**
   - **Đặc trưng kiến trúc:** Phân hệ Dashboard **không thông qua Service hay Repository trung gian** mà gọi trực tiếp hàm `query()` từ `src/config/database.js` để tối ưu hóa độ trễ truy vấn và giải phóng tài nguyên CPU.
   - **Tối ưu hóa đa luồng qua `Promise.all`:** Kích hoạt đồng thời **9 truy vấn song song** trên Connection Pool:
     - **Truy vấn 1 (Doanh thu thực thu):**
       ```sql
       SELECT COALESCE(SUM(total_amount), 0) AS total_revenue 
       FROM orders 
       WHERE order_status = 'COMPLETED' AND payment_status = 'PAID'
       ```
       *(Sử dụng chính xác cột tiền `total_amount` từ bảng `orders`; bảng `orders` không có cột `final_amount`; không có bộ lọc ngày)*.
     - **Truy vấn 2 (Tổng đơn):** `SELECT COUNT(*) AS total_orders FROM orders`.
     - **Truy vấn 3 (Đơn chờ xử lý):** `SELECT COUNT(*) AS pending_orders FROM orders WHERE order_status = 'PENDING'`.
     - **Truy vấn 4 (Tổng sản phẩm):** `SELECT COUNT(*) AS total_products FROM products WHERE status = 'active'`.
     - **Truy vấn 5 (Tổng SKU biến thể):** `SELECT COUNT(*) AS total_skus FROM product_variants WHERE status = 'active'`.
     - **Truy vấn 6 (Cảnh báo tồn kho thấp):** `SELECT TOP 8 pv.id, pv.sku, pv.stock_quantity, p.name AS product_name, s.size_name, c.color_name FROM product_variants pv JOIN products p ON pv.product_id = p.id JOIN sizes s ON pv.size_id = s.id JOIN colors c ON pv.color_id = c.id WHERE pv.stock_quantity <= 5 ORDER BY pv.stock_quantity ASC`.
     - **Truy vấn 7 (Đơn hàng gần đây):** `SELECT TOP 6 o.id, o.order_code, o.recipient_name_snapshot, o.recipient_phone_snapshot, o.total_amount, o.order_status, o.payment_status, o.created_at, ... FROM orders o ORDER BY o.id DESC`.
     - **Truy vấn 8 (Top 4 sản phẩm bán chạy):** `SELECT TOP 4 oi.product_name_snapshot, SUM(oi.quantity) AS total_sold, SUM(oi.line_total) AS total_revenue ... FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.order_status = 'COMPLETED' GROUP BY oi.product_name_snapshot ORDER BY total_sold DESC`.
     - **Truy vấn 9 (Cơ cấu trạng thái đơn):** `SELECT COUNT(*) AS total, SUM(CASE WHEN order_status = 'PENDING' THEN 1 ELSE 0 END) AS pending, ... FROM orders`.
4. **Truy vấn bổ trợ thứ 10:** Thực thi truy vấn danh sách 5 đơn hàng khẩn cấp cần duyệt:
   ```sql
   SELECT TOP 5 o.id, o.order_code, o.recipient_name_snapshot, o.recipient_phone_snapshot,
          o.total_amount, o.order_status, o.payment_status, o.created_at, ...
   FROM orders o WHERE o.order_status = 'PENDING' ORDER BY o.id DESC
   ```
5. **Động cơ giao diện Pug:** Controller tổng hợp đối tượng `stats` và truyền vào view:
   `res.render('pages/admin/dashboard', { title, activeNav: 'dashboard', stats, lowStockItems, recentOrders, urgentOrders, topProducts })`.
6. **Phản hồi:** Trình duyệt nhận trang HTML bảng điều khiển hoàn chỉnh (HTTP 200 OK) với đầy đủ biểu đồ, thẻ thống kê số liệu tài chính thực tế và danh sách cảnh báo tồn kho.

---

## 6. LUỒNG BỔ TRỢ NỀN TẢNG: ĐĂNG NHẬP VÀ HỢP NHẤT GIỎ HÀNG (`POST /auth/login`)

Để cung cấp góc nhìn toàn diện về cơ chế bảo mật phiên và quyền hạn (RBAC), quy trình đăng nhập được thực hiện như sau:
1. Khách hàng gửi biểu mẫu đăng nhập qua phương thức POST tới `/auth/login` kèm `email`, `password`, `_csrf`, `returnUrl`.
2. `csrfMiddleware` kiểm tra token CSRF hợp lệ.
3. `auth.controller.js:postLogin` chuẩn hóa email (`email.trim().toLowerCase()`) và kiểm tra định dạng qua `isValidEmail`.
4. Gửi câu truy vấn tham số hóa:
   ```sql
   SELECT id, full_name, email, password_hash, role, status 
   FROM users WHERE email = @email
   ```
5. Kiểm tra trạng thái tài khoản: Nếu `status === 'locked'` $\rightarrow$ hiển thị thông báo tài khoản bị tạm khóa.
6. So khớp mật khẩu băm qua thư viện `bcryptjs`: `await bcrypt.compare(password, user.password_hash)`.
7. Lấy mã giỏ hàng lưu trữ: `SELECT id FROM carts WHERE user_id = @userId`.
8. **Hợp nhất giỏ hàng tạm (Cart Merge):** Nếu trong phiên có mảng `req.session.guestCart`, hệ thống gọi hàm `cartController.mergeGuestCart(cartId, guestCart)`: mở Transaction, kiểm tra tồn kho từng món, chèn hoặc cộng dồn vào bảng `cart_items` (khống chế tối đa 10 đôi).
9. **Chống tấn công Session Fixation:** Gọi `req.session.regenerate()` để hủy bỏ Session ID cũ và cấp Session ID hoàn toàn mới cho người dùng đã đăng nhập.
10. Lưu thông tin xác thực vào phiên: `req.session.user = { id, email, full_name, role, cartId }`.
11. Dọn dẹp session cart: `req.session.guestCart = []`.
12. **Điều hướng an toàn:** Nếu vai trò là `ADMIN` $\rightarrow$ chuyển hướng đến `/admin/dashboard`; nếu là `CUSTOMER` $\rightarrow$ chuyển hướng an toàn về trang trước đó qua hàm bảo vệ mở chuyển hướng `getSafeReturnUrl(returnUrl)`.

---

*Tài liệu thuộc Phần 3.2.6 của Báo cáo Phân tích Thiết kế Hệ thống VAMOS STORE.*
