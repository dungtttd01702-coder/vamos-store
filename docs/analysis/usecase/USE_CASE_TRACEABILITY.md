# MA TRẬN TRUY VẾT USE CASE (USE CASE TRACEABILITY MATRIX)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ BÁN GIÀY VAMOS STORE

> **Dự án:** VAMOS STORE — Website Thương mại điện tử Bán giày chuyên nghiệp  
> **Phiên bản:** v2.1 (Kiểm toán & Đối soát chi tiết từng Route, Controller, Service và Bảng CSDL)  
> **Cập nhật ngày:** 14/11/2026  
> **Đặc điểm kiến trúc:** Kiến trúc MVC hướng dịch vụ (Express Controllers + Domain Services cho các giao dịch phức tạp + SQL Server Database Helper `config/database.js`).

---

## 1. Ý nghĩa các cột trong Ma trận Truy vết

- **Mã UC:** Định danh duy nhất từ `UC01` đến `UC16`.
- **Tên nghiệp vụ:** Tên gọi chuẩn hóa thống nhất trên toàn bộ hồ sơ.
- **Tác nhân (Actor):** Phân quyền truy cập (`Guest`, `Customer`, `Admin`).
- **Đường dẫn HTTP (Route Endpoint):** Tuyến đường và phương thức HTTP tiếp nhận.
- **Bộ điều khiển (Controller & Method):** Tập tin và phương thức xử lý request.
- **Tầng nghiệp vụ & CSDL (Service / DB Logic):** Lớp xử lý nghiệp vụ, giao dịch ACID hoặc truy vấn trực tiếp.
- **Bảng CSDL liên quan (Database Tables):** Danh sách các bảng dữ liệu được thao tác.
- **Trạng thái triển khai (Implementation Status):**
  - `Implemented` (Đã hoàn thiện 100% trong mã nguồn và cơ sở dữ liệu).
  - `Designed Only / Not Implemented` (Đã thiết kế trong tài liệu và cấu trúc DB nhưng mã nguồn backend chưa kích hoạt do thiếu dịch vụ ngoài).
- **Minh chứng kiểm thử (Verification & Test Evidence):** Các bộ test tự động và kịch bản QA xác thực.

---

## 2. Bảng Ma trận Truy vết Toàn diện (Traceability Matrix)

| Mã UC | Tên nghiệp vụ chuẩn hóa | Tác nhân | Đường dẫn (Route Endpoint) | Controller & Method | Tầng nghiệp vụ / Xử lý CSDL | Bảng CSDL liên quan | Trạng thái | Minh chứng kiểm thử |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **UC01** | Đăng ký tài khoản | Guest | `GET /auth/register`<br>`POST /auth/register` | `auth.controller.js`<br>- `getRegister`<br>- `postRegister` | - Validation & Bcrypt hash<br>- Atomic Transaction: User + Cart<br>- `CartController.mergeGuestCart` | `users`<br>`carts`<br>`cart_items` | **Implemented** | `test/auth.test.js`<br>`test_audit_fixes.js` |
| **UC02** | Đăng nhập hệ thống | Guest<br>Customer<br>Admin | `GET /auth/login`<br>`POST /auth/login`<br>`POST /auth/logout` | `auth.controller.js`<br>- `getLogin`<br>- `postLogin`<br>- `postLogout` | - Bcrypt verify & Status check<br>- Session regeneration (anti-fixation)<br>- Auto-merge `req.session.guestCart` | `users`<br>`carts`<br>`cart_items` | **Implemented** | `test/auth.test.js`<br>`test_audit_fixes.js` |
| **UC03** | Khôi phục mật khẩu | Guest<br>*(Email Svc dự kiến)* | `GET /auth/forgot-password`<br>`POST /auth/forgot-password`<br>*(Chưa có route)* | *Chưa triển khai controller method* | *Chưa triển khai service gửi mail (chưa cấu hình thư viện SMTP)* | `users`<br>`password_reset_tokens` | **Designed Only / Not Implemented** | UI link `login.pug:37`<br>DB table `mssql_schema.sql:187` |
| **UC04** | Quản lý hồ sơ & sổ địa chỉ | Customer | `GET/POST /account/profile`<br>`GET/POST /account/addresses` | `account.controller.js`<br>- `getProfile`<br>- `postProfile`<br>- `getAddresses`<br>- `postAddAddress` | - Cập nhật thông tin cá nhân & SĐT<br>- Đổi mật khẩu với bcrypt compare<br>- Quản lý địa chỉ & reset `is_default` | `users`<br>`addresses` | **Implemented** | `test/account.test.js`<br>`test_audit_fixes.js` |
| **UC05** | Tìm kiếm & xem sản phẩm | Guest<br>Customer | `GET /products`<br>`GET /products/:slug`<br>`GET /api/products/search` | `product.controller.js`<br>- `index`<br>- `detail`<br>- `liveSearch` | - Phân trang SQL Server (`OFFSET/FETCH`)<br>- Lọc đa tiêu chí & Live search API<br>- Ma trận biến thể Kích cỡ x Màu sắc | `products`<br>`product_variants`<br>`colors`, `sizes`<br>`product_images`<br>`categories`, `brands` | **Implemented** | `test/catalog.test.js`<br>`test_audit_fixes.js` |
| **UC06** | Quản lý giỏ hàng | Guest<br>Customer | `GET /cart`<br>`POST /cart/add`<br>`POST /cart/update`<br>`POST /cart/remove`<br>`POST /cart/clear`<br>`POST /cart/buy-now` | `cart.controller.js`<br>- `index`<br>- `addItem`<br>- `updateItem`<br>- `removeItem`<br>- `clearCart`<br>- `buyNow`<br>- `mergeGuestCart` | - **Guest:** Lưu session `guestCart`, Live DB Sync giá & tồn kho<br>- **Customer:** Lưu CSDL `carts`, `cart_items`<br>- Giới hạn bán lẻ 1-10 đôi/mẫu<br>- Giỏ hàng KHÔNG giữ chỗ tồn kho | `carts`<br>`cart_items`<br>`product_variants`<br>`products` | **Implemented** | `test/cart.test.js`<br>`test_audit_fixes.js` |
| **UC07** | Đặt hàng COD | Customer | `GET /checkout`<br>`POST /checkout`<br>`GET /checkout/success/:id` | `checkout.controller.js`<br>- `getCheckout`<br>- `postCheckout`<br>- `getSuccess` | `order.service.js`<br>- `createOrder()`<br>- Transaction khóa bi quan (`UPDLOCK, ROWLOCK`)<br>- **Trừ kho ngay lúc tạo đơn**<br>- Lưu snapshot bất biến vào `order_items`<br>- Voucher 1 lần/khách qua `voucher_usages` | `orders`<br>`order_items`<br>`product_variants`<br>`inventory_transactions`<br>`order_status_histories`<br>`vouchers`, `voucher_usages`<br>`cart_items`, `addresses` | **Implemented** | `test/checkout.test.js`<br>`test_audit_fixes.js` |
| **UC08** | Tra cứu & theo dõi đơn hàng | Customer | `GET /account/orders`<br>`GET /account/orders/:id` | `account.controller.js`<br>- `getOrders`<br>- `getOrderDetail` | - Lọc đơn hàng theo `user_id`<br>- Hiển thị Timeline trạng thái 5 mốc<br>- Tải snapshot sản phẩm và địa chỉ | `orders`<br>`order_items`<br>`order_status_histories` | **Implemented** | `test/order.test.js`<br>`test_audit_fixes.js` |
| **UC09** | Hủy đơn hàng tự phục vụ | Customer | `POST /account/orders/:id/cancel` | `account.controller.js`<br>- `postCancelOrder` | `order.service.js`<br>- `cancelOrderByCustomer()`<br>- Điều kiện: chỉ hủy khi `PENDING`<br>- Transaction hoàn trả tồn kho tự động<br>- Chống hoàn kho lặp (Anti-double restitution) | `orders`<br>`order_items`<br>`product_variants`<br>`inventory_transactions`<br>`order_status_histories` | **Implemented** | `test/order.test.js`<br>`test_audit_fixes.js` |
| **UC10** | Xử lý & cập nhật đơn hàng | Admin | `GET /admin/orders`<br>`GET /admin/orders/:id`<br>`POST /admin/orders/:id/status` | `admin.controller.js`<br>- `getOrders`<br>- `getOrderDetail`<br>- `postUpdateOrderStatus` | `order.service.js`<br>- `updateOrderStatus()`<br>- Kiểm soát State Machine hợp lệ<br>- **Tự động đổi PAID khi COMPLETED (Không trừ kho lại)**<br>- Hủy nội bộ hoàn kho (nhập lý do bắt buộc) | `orders`<br>`order_items`<br>`order_status_histories`<br>`product_variants`<br>`inventory_transactions` | **Implemented** | `test/admin.test.js`<br>`test_audit_fixes.js` |
| **UC11** | Quản lý tồn kho | Admin | `GET /admin/inventory`<br>`POST /admin/inventory/adjust`<br>`GET /admin/inventory/history` | `admin.controller.js`<br>- `getInventory`<br>- `postAdjustInventory`<br>- `getInventoryHistory` | - Cảnh báo hàng tồn thấp (`stock <= 5`)<br>- Điều chỉnh tồn có lý do bắt buộc<br>- Ghi audit `inventory_transactions`<br>- Khóa biến thể `WITH (UPDLOCK, ROWLOCK)` | `product_variants`<br>`inventory_transactions`<br>`products` | **Implemented** | `test/inventory.test.js`<br>`test_audit_fixes.js` |
| **UC12** | Quản lý danh mục, thương hiệu, sản phẩm & banner | Admin | `GET/POST /admin/categories/*`<br>`POST /admin/brands/create`<br>`GET/POST /admin/products/*`<br>`GET/POST /admin/banners/*` | `admin.controller.js`<br>- Categories: CRUD & toggle<br>- Brands: create brand & count SP<br>- Products: CRUD, ma trận biến thể, ảnh<br>- Banners: get, create, toggle, delete | - **Categories:** `categories`<br>- **Brands:** `brands`<br>- **Products:** `products`, `product_variants`, `product_images`<br>- **Banners:** `banners` | `categories`<br>`brands`<br>`products`<br>`product_variants`<br>`product_images`<br>`banners` | **Implemented** | `test/admin.test.js`<br>`test_audit_fixes.js` |
| **UC13** | Quản lý mã giảm giá | Admin | `GET /admin/vouchers`<br>`GET/POST /admin/vouchers/create`<br>`POST /admin/vouchers/:id/toggle` | `admin.controller.js`<br>- `getVouchers`<br>- `getCreateVoucher`<br>- `postCreateVoucher`<br>- `postToggleVoucher` | - Cấu hình voucher (% hoặc tiền mặt)<br>- Ràng buộc hạn dùng, min order, giới hạn lượt<br>- Bật/tắt kích hoạt voucher | `vouchers`<br>`voucher_usages` | **Implemented** | `test/voucher.test.js`<br>`test_audit_fixes.js` |
| **UC14** | Báo cáo doanh thu & KPI Dashboard | Admin | `GET /admin/dashboard` | `admin.controller.js`<br>- `getDashboard` | - Doanh thu thực tế: `SUM(total_amount)` **CHỈ TÍNH đơn COMPLETED + PAID**<br>- Thống kê đơn theo trạng thái<br>- Top 5 sản phẩm bán chạy nhất<br>- Cảnh báo tồn thấp | `orders`<br>`order_items`<br>`product_variants`<br>`users` | **Implemented** | `test/admin.test.js`<br>`test_audit_fixes.js` |
| **UC15** | Quản lý danh sách yêu thích (Wishlist) | Customer | `GET /api/wishlist`<br>`POST /api/wishlist/toggle`<br>`POST /api/wishlist/items`<br>`DELETE /api/wishlist/items/:id`<br>`DELETE /api/wishlist` | `wishlist.controller.js`<br>- `getWishlist`<br>- `toggleItem`<br>- `addItem`<br>- `removeItem`<br>- `clearWishlist` | `wishlist.service.js`<br>- Thao tác 1-click Toggle<br>- Ràng buộc unique (user_id, product_id)<br>- Guest: trả về 401 JSON<br>- Admin: trả về 403 JSON | `wishlist_items`<br>`products`<br>`product_images` | **Implemented** | `test_audit_fixes.js`<br>(14 test cases WL-01 đến WL-14) |
| **UC16** | Quản lý tài khoản khách hàng | Admin | `GET /admin/customers`<br>`GET /admin/customers/:id`<br>`POST /admin/customers/:id/toggle-status` | `admin.controller.js`<br>- `getCustomers`<br>- `getCustomerDetail`<br>- `postToggleCustomerStatus` | - Xem danh sách & lịch sử mua sắm<br>- Khóa / Mở khóa tài khoản khách<br>- **Cơ chế chống tự khóa tài khoản Admin**<br>- Thu hồi phiên làm việc tức thì khi bị khóa | `users`<br>`orders` | **Implemented** | `test/admin.test.js`<br>`test_audit_fixes.js` |

---

## 3. Tổng kết Mức độ Sẵn sàng Triển khai

- **Tổng số Use Case:** 16 Use Case.
- **Số lượng đã hoàn thành (Implemented):** 15 / 16 Use Case (**93.75%**).
- **Số lượng ở trạng thái Thiết kế (Designed Only / Not Implemented):** 01 / 16 Use Case (**6.25%** - `UC03: Khôi phục mật khẩu` do chưa kết nối dịch vụ SMTP ngoài).
- **Số lượng chưa thiết kế (Not Implemented):** 0 / 16 Use Case (**0%**).
- Toàn bộ 16 Use Case đều có định danh duy nhất, không trùng lặp, khớp 100% tên gọi và nội dung trên tất cả các tài liệu và sơ đồ PlantUML.
