# BẢN ĐỒ ĐỐI CHIẾU CHỨNG CỨ — VAMOS STORE REPORT
**Mã tài liệu:** `REPORT_EVIDENCE_MAP.md`  
**Dự án:** Website bán giày dép VAMOS STORE  
**Chuẩn hóa:** Khớp nối 100% giữa Báo cáo Đồ án với Source Code, Database DDL và Sơ đồ UML

---

## 1. ĐỐI CHIẾU 14 USE CASE CHUẨN HÓA VỚI ROUTE & CONTROLLER

| Mã UC | Tên Use Case chuẩn | Tác nhân chính | Route URL | Controller Handler | Bằng chứng Source Code | Trạng thái hiện thực |
|:---:|:---|:---:|:---|:---|:---|:---:|
| **UC01** | Đăng ký tài khoản | Guest | `POST /auth/register` | `authController.postRegister` | `src/controllers/auth.controller.js:63-145` | Đã triển khai (Bcrypt hash + tự động tạo Cart 1:1) |
| **UC02** | Đăng nhập hệ thống | Guest, Customer, Admin | `POST /auth/login` | `authController.postLogin` | `src/controllers/auth.controller.js:150-205` | Đã triển khai (Session context + RBAC redirect) |
| **UC03** | Khôi phục mật khẩu (Thiết kế) | Guest | `POST /auth/forgot-password` (Thiết kế) | Thiết kế | `database/mssql_schema.sql:187-196` (bảng `password_reset_tokens`) | **Chưa triển khai** (Chức năng khôi phục mật khẩu đã được đưa vào thiết kế và có cấu trúc dữ liệu hỗ trợ, tuy nhiên quy trình xử lý hoàn chỉnh chưa được triển khai trong phiên bản hiện tại) |
| **UC04** | Quản lý hồ sơ & địa chỉ | Customer | `GET/POST /account/profile`<br>`GET/POST /account/addresses/*` | `accountController.*` | `src/controllers/account.controller.js:15-180` | Đã triển khai (Hồ sơ, đổi MK, sổ địa chỉ, filtered default) |
| **UC05** | Tìm kiếm & xem sản phẩm | Guest, Customer | `GET /products`<br>`GET /products/:slug`<br>`GET /api/products/search` | `productController.*` | `src/controllers/product.controller.js:8-120`<br>`src/services/product.service.js:10-95` | Đã triển khai (Lọc đa tiêu chí, chọn Size/Color, live search) |
| **UC06** | Quản lý giỏ hàng | Customer | `GET /cart`<br>`POST /cart/add`<br>`POST /cart/update`<br>`POST /cart/remove` | `cartController.*` | `src/controllers/cart.controller.js:12-185` | Đã triển khai (Kiểm tra tồn kho, giới hạn 10 đôi/mặt hàng) |
| **UC07** | Đặt hàng COD | Customer | `GET /checkout`<br>`POST /checkout/process` | `checkoutController.*`<br>`orderService.createCodOrder` | `src/controllers/checkout.controller.js:15-90`<br>`src/services/order.service.js:15-285` | Đã triển khai (Transaction T-SQL, UPDLOCK, trừ kho, voucher, snapshot) |
| **UC08** | Tra cứu & theo dõi đơn hàng | Customer | `GET /account/orders`<br>`GET /account/orders/:id` | `accountController.getOrders`<br>`accountController.getOrderDetail` | `src/controllers/account.controller.js:185-260` | Đã triển khai (Lịch sử đơn, snapshot chi tiết, timeline trạng thái) |
| **UC09** | Hủy đơn hàng | Customer | `POST /account/orders/:id/cancel` | `accountController.postCancelOrder`<br>`orderService.cancelOrder` | `src/controllers/account.controller.js:265-295`<br>`src/services/order.service.js:330-410` | Đã triển khai (Chỉ hủy khi PENDING, tự động hoàn kho và voucher) |
| **UC10** | Admin xử lý đơn hàng | Admin | `GET /admin/orders`<br>`GET /admin/orders/:id`<br>`POST /admin/orders/:id/status` | `adminController.*`<br>`orderService.updateOrderStatus` | `src/controllers/admin.controller.js:97-199`<br>`src/services/order.service.js:460-560` | Đã triển khai (Máy trạng thái 6 bước, hoàn kho khi hủy, audit log) |
| **UC11** | Quản lý tồn kho | Admin | `GET /admin/inventory`<br>`POST /admin/inventory/adjust`<br>`GET /admin/inventory/history` | `adminController.*` | `src/controllers/admin.controller.js:521-660` | Đã triển khai (Tra cứu SKU, điều chỉnh kho có lý do, thẻ kho) |
| **UC12** | Quản lý sản phẩm & danh mục | Admin | `GET/POST /admin/products/*`<br>`GET/POST /admin/categories/*`<br>`POST /admin/brands/create` | `adminController.*` | `src/controllers/admin.controller.js:204-517, 665-771` | Đã triển khai (CRUD sản phẩm, ma trận biến thể, danh mục, thương hiệu) |
| **UC13** | Quản lý mã giảm giá | Admin | `GET/POST /admin/vouchers/*` | `adminController.*` | `src/controllers/admin.controller.js:776-888` | Đã triển khai (Tạo voucher, kiểm tra điều kiện, toggle trạng thái) |
| **UC14** | Báo cáo doanh thu | Admin | `GET /admin/dashboard` | `adminController.getDashboard` | `src/controllers/admin.controller.js:8-92` | Đã triển khai (Tổng doanh thu đơn COMPLETED+PAID, Top 4 bán chạy) |

---

## 2. ĐỐI CHIẾU 20 BẢNG CƠ SỞ DỮ LIỆU SQL SERVER

| STT | Tên bảng CSDL | Mục đích nghiệp vụ | Vị trí định nghĩa DDL | Khóa chính (PK) | Khóa ngoại (FK) | Ràng buộc duy nhất & Index |
|:---:|:---|:---|:---|:---|:---|:---|
| 1 | `users` | Tài khoản người dùng | `mssql_schema.sql:39-49` | `id INT IDENTITY` | Không | `UNIQUE(email)` |
| 2 | `categories` | Danh mục giày | `mssql_schema.sql:55-65` | `id INT IDENTITY` | Không | `UNIQUE(slug)` |
| 3 | `brands` | Thương hiệu sản phẩm | `mssql_schema.sql:71-79` | `id INT IDENTITY` | Không | `UNIQUE(slug)` |
| 4 | `sizes` | Kích cỡ giày sneaker | `mssql_schema.sql:85-90` | `id INT IDENTITY` | Không | `UNIQUE(size_name)` |
| 5 | `colors` | Màu sắc giày | `mssql_schema.sql:96-101` | `id INT IDENTITY` | Không | `UNIQUE(color_name)` |
| 6 | `vouchers` | Mã giảm giá khuyến mãi | `mssql_schema.sql:107-124` | `id INT IDENTITY` | Không | `UNIQUE(code)`, `CHECK(end_date >= start_date)` |
| 7 | `banners` | Banner quảng bá trang chủ | `mssql_schema.sql:139-147` | `id INT IDENTITY` | Không | Không |
| 8 | `addresses` | Sổ địa chỉ giao hàng | `mssql_schema.sql:156-169` | `id INT IDENTITY` | `user_id` $\rightarrow$ `users(id)` (CASCADE) | Filtered Index: `UNIQUE(user_id) WHERE is_default = 1` |
| 9 | `password_reset_tokens` | Token đặt lại mật khẩu | `mssql_schema.sql:187-196` | `id INT IDENTITY` | `user_id` $\rightarrow$ `users(id)` (CASCADE) | `UNIQUE(token_hash)` |
| 10 | `carts` | Giỏ hàng người dùng | `mssql_schema.sql:202-210` | `id INT IDENTITY` | `user_id` $\rightarrow$ `users(id)` (CASCADE) | `UNIQUE(user_id)` (Quan hệ 1:1) |
| 11 | `products` | Sản phẩm giày gốc | `mssql_schema.sql:216-235` | `id INT IDENTITY` | `category_id`, `brand_id` (SET NULL) | `UNIQUE(product_code)`, `UNIQUE(slug)` |
| 12 | `product_images` | Bộ sưu tập ảnh sản phẩm | `mssql_schema.sql:241-249` | `id INT IDENTITY` | `product_id` (CASCADE) | Filtered Index: `uq_product_primary_image` (WHERE `is_primary = 1`) |
| 13 | `product_variants` | Biến thể Size x Màu x SKU | `mssql_schema.sql:255-271` | `id INT IDENTITY` | `product_id` (CASCADE), `size_id`, `color_id` | `UNIQUE(sku)`, `UNIQUE(product_id, size_id, color_id)` |
| 14 | `cart_items` | Dòng mặt hàng trong giỏ | `mssql_schema.sql:277-287` | `id INT IDENTITY` | `cart_id` (CASCADE), `variant_id` | `UNIQUE(cart_id, variant_id)` |
| 15 | `orders` | Đơn hàng tổng quát | `mssql_schema.sql:293-318` | `id INT IDENTITY` | `user_id`, `voucher_id` (SET NULL) | `UNIQUE(order_code)` |
| 16 | `order_items` | Snapshot chi tiết món đặt | `mssql_schema.sql:324-340` | `id INT IDENTITY` | `order_id` (CASCADE), `product_variant_id` | Không (Unique tổ hợp theo logic ứng dụng) |
| 17 | `order_status_histories` | Nhật ký đổi trạng thái đơn | `mssql_schema.sql:346-357` | `id INT IDENTITY` | `order_id` (CASCADE), `changed_by` | Không |
| 18 | `inventory_transactions` | Lịch sử biến động thẻ kho | `mssql_schema.sql:363-375` | `id INT IDENTITY` | `variant_id`, `user_id` | Không |
| 19 | `voucher_usages` | Lịch sử sử dụng voucher | `mssql_schema.sql:381-391` | `id INT IDENTITY` | `voucher_id`, `user_id`, `order_id` (CASCADE) | `UNIQUE(voucher_id, user_id)` (Quy tắc Q8: 1 lần/User) |
| 20 | `wishlist_items` | Danh sách sản phẩm yêu thích | `migrations/004:7-15` | `id INT IDENTITY` | `user_id` (CASCADE), `product_id` (CASCADE) | `UNIQUE(user_id, product_id)` |

---

## 3. ĐỐI CHIẾU BỘ SƠ ĐỒ UML ĐÃ NGHIỆM THU

| Nhóm sơ đồ | File sơ đồ nguồn | File ảnh render | Vai trò đối chiếu trong Báo cáo | Trạng thái |
|:---|:---|:---|:---|:---:|
| **Use Case tổng quát** | `docs/diagrams/use-case/USE_CASE_OVERVIEW.puml` | `USE_CASE_OVERVIEW.png` | Hình 5: Sơ đồ Use Case tổng quát VAMOS STORE | PASS |
| **Use Case Đặt hàng** | `docs/diagrams/use-case/uc-02-shopping.puml` | `uc-02-shopping.png` | Hình 6: Sơ đồ Use Case chi tiết Mua sắm & Đặt hàng COD | PASS |
| **Use Case Quản trị** | `docs/diagrams/use-case/uc-04-admin.puml` | `uc-04-admin.png` | Hình 7: Sơ đồ Use Case chi tiết Quản lý đơn hàng & Kho Admin | PASS |
| **Sitemap** | `docs/architecture/folder-structure.md` | `hinh_08_sitemap.png` | Hình 8: Cây điều hướng màn hình hệ thống | PASS |
| **Physical ERD** | `docs/diagrams/erd/PHYSICAL_ERD.puml` | `PHYSICAL_ERD.png` | Hình 9: Mô hình thực thể quan hệ ERD 20 bảng | PASS |
| **Activity Auth** | `docs/diagrams/activity/AD01_REGISTER.puml`, `AD02` | `AD01_REGISTER.png`, `AD02` | Hình 10: Quy trình Đăng ký & Đăng nhập | PASS |
| **Activity Checkout**| `docs/diagrams/activity/AD08_CHECKOUT_COD.puml` | `AD08_CHECKOUT_COD.png` | Hình 11: Mua hàng & Đặt hàng COD nguyên tử | PASS |
| **Activity Order State**| `docs/diagrams/activity/AD11_ADMIN_ORDER_PROCESSING.puml`| `AD11_ADMIN_ORDER_PROCESSING.png` | Hình 12: Máy trạng thái xử lý đơn hàng | PASS |
| **Activity Cancel** | `docs/diagrams/activity/AD10_CUSTOMER_CANCEL_ORDER.puml` | `AD10_CUSTOMER_CANCEL_ORDER.png` | Hình 13: Hủy đơn hàng và Hoàn kho tự động | PASS |
| **Activity Inventory** | `docs/diagrams/activity/AD12_INVENTORY_MANAGEMENT.puml` | `AD12_INVENTORY_MANAGEMENT.png` | Hình 14: Admin kiểm kê và điều chỉnh tồn kho | PASS |
| **Class Domain Model** | `docs/diagrams/class/CD01_DOMAIN_MODEL.puml` | `CD01_DOMAIN_MODEL.png` | Đối chiếu thực thể miền dữ liệu | PASS |
| **Class Admin Subsystems** | `CD06A`, `CD06B`, `CD06C`, `CD06D` | Các file `.png` tương ứng | Đối chiếu phương thức và quan hệ Controller/Service | PASS |
