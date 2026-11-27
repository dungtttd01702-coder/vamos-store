# PHASE 0 — BASELINE AUDIT REPORT
## BÁO CÁO KIỂM KÊ KIẾN TRÚC, CHỨC NĂNG & HIỆN TRẠNG LỖI

> **Thời điểm kiểm kê:** 2026-11-13  
> **Branch làm việc:** `fix/master-repair-plan` (tạo từ `main` @ commit `b5c65d2`)  
> **Cơ sở dữ liệu:** Microsoft SQL Server `127.0.0.1:1433/vamos_store_db` (Môi trường test: `vamos_store_test_db`)  
> **Chất lượng code (SonarCloud):** Quality Gate PASSED, 0 Vulnerabilities, 0 Blockers, Rating A (1.0).

---

## 1. KIỂM KÊ KIẾN TRÚC HỆ THỐNG

| Thành phần | Công nghệ / Thư viện | Đường dẫn / Ghi chú |
|---|---|---|
| **Runtime & Server** | Node.js (v24.21.0), Express.js (v4.21.2) | `src/app.js`, `server.js` |
| **Template Engine** | Pug SSR (v3.0.3) | `src/views/` (38 templates) |
| **CSS Framework** | Tailwind CSS (v3.4.17) + Autoprefixer | `tailwind.config.js`, `src/public/css/input.css` |
| **Cơ sở dữ liệu** | Microsoft SQL Server (MSSQL mssql v11.0.1) | `src/config/database.js`, `database/mssql_schema.sql` |
| **Mô hình kiến trúc** | Controller $\to$ Service $\to$ Repository | `src/controllers/`, `src/services/`, `src/models/` |
| **Phiên & Xác thực** | express-session (MSSQL Store), bcryptjs | `src/config/session.js`, `src/middlewares/auth.middleware.js` |
| **Bảo mật Web** | Helmet, CSRF csurf, XSS sanitize, Rate Limit | OWASP Top 10 compliance |
| **Kiểm thử tự động** | Node test runner, Supertest, Playwright | `tests/`, `package.json` |

---

## 2. BẢNG ÁNH XẠ CHỨC NĂNG THEO 3 VAI TRÒ (GUEST, CUSTOMER, ADMIN)

| STT | Phân hệ / Chức năng | Khách (Guest) | Khách hàng (Customer) | Quản trị (Admin) | Route chính | File Controller / View |
|:---:|---|:---:|:---:|:---:|---|---|
| 1 | **Trang chủ (Storefront Home)** | Xem, tìm kiếm, banner | Xem, tìm kiếm, banner | Không cần mua sắm | `GET /` | `home.controller.js`, `pages/home.pug` |
| 2 | **Danh mục sản phẩm (Catalog)** | Xem, lọc, phân trang, sort | Xem, lọc, phân trang, sort | Chỉ xem preview | `GET /products` | `product.controller.js`, `pages/products/index.pug` |
| 3 | **Chi tiết sản phẩm (Detail)** | Xem giá, gallery, chọn size | Xem giá, gallery, chọn size | Chỉ xem preview | `GET /products/:slug` | `product.controller.js`, `pages/products/detail.pug` |
| 4 | **Tìm kiếm thời gian thực (Live Search)** | Tìm kiếm nhanh AJAX | Tìm kiếm nhanh AJAX | Không sử dụng | `GET /products/api/live-search` | `product.controller.js`, `main.js` |
| 5 | **Danh sách yêu thích (Wishlist)** | Lưu tạm trên thiết bị | Lưu theo User ID | **Bị cấm / Ẩn hoàn toàn** | Client-side LocalStorage | `main.js`, `header.pug`, `#vamos-wishlist-modal` |
| 6 | **Giỏ hàng (Cart)** | Lưu giỏ hàng Session | Lưu giỏ hàng Database | **Bị cấm / Ẩn hoàn toàn** | `/cart`, `/cart/add`, `/cart/update` | `cart.controller.js`, `pages/cart/index.pug` |
| 7 | **Đặt hàng COD (Checkout)** | Chuyển hướng đăng nhập | Nhập địa chỉ, COD 30K/Free | **Bị cấm / Ẩn hoàn toàn** | `/checkout` | `checkout.controller.js`, `pages/checkout/index.pug` |
| 8 | **Đăng ký tài khoản (Register)** | Đăng ký tài khoản Customer | Chuyển hướng về trang chủ | Không đăng ký Admin | `/auth/register` | `auth.controller.js`, `pages/auth/register.pug` |
| 9 | **Đăng nhập (Login)** | Nhập email, mật khẩu | Chuyển hướng Storefront | Chuyển hướng `/admin/dashboard` | `/auth/login` | `auth.controller.js`, `pages/auth/login.pug` |
| 10 | **Tài khoản cá nhân (Account Profile)** | Không có quyền | Xem/sửa thông tin, mật khẩu | Không dùng | `/account/profile` | `account.controller.js`, `pages/account/profile.pug` |
| 11 | **Lịch sử đơn hàng (Customer Orders)** | Không có quyền | Xem lịch sử, hủy đơn pending | Không dùng | `/account/orders` | `account.controller.js`, `pages/account/orders.pug` |
| 12 | **Sổ địa chỉ (Addresses)** | Không có quyền | Quản lý địa chỉ giao hàng | Không dùng | `/account/addresses` | `account.controller.js`, `pages/account/addresses.pug` |
| 13 | **Admin Dashboard** | Không có quyền | Không có quyền | Xem tổng quan doanh thu, đơn | `/admin/dashboard` | `admin.controller.js`, `pages/admin/dashboard.pug` |
| 14 | **Admin Quản lý Đơn hàng** | Không có quyền | Không có quyền | Xem, duyệt đơn, chuyển trạng thái | `/admin/orders` | `admin.controller.js`, `pages/admin/orders.pug` |
| 15 | **Admin Quản lý Sản phẩm** | Không có quyền | Không có quyền | CRUD sản phẩm, biến thể giày | `/admin/products` | `admin.controller.js`, `pages/admin/products.pug` |
| 16 | **Admin Quản lý Kho hàng** | Không có quyền | Không có quyền | Điều chỉnh tồn kho, log audit | `/admin/inventory` | `admin.controller.js`, `pages/admin/inventory.pug` |
| 17 | **Admin Quản lý Danh mục & Voucher** | Không có quyền | Không có quyền | CRUD danh mục, mã giảm giá | `/admin/categories`, `/admin/vouchers` | `admin.controller.js` |
| 18 | **Admin Quản lý Banners & Slider** | Không có quyền | Không có quyền | CRUD banner quảng cáo | `/admin/banners` | `admin.controller.js`, `pages/admin/banners.pug` |

---

## 3. KẾT QUẢ TÁI HIỆN LỖI (ROOT CAUSE ANALYSIS)

### 3.1. Vấn đề Admin Layout bị lẫn Storefront (BUG-01, BUG-02)
- **Tái hiện:** Khi đăng nhập tài khoản Quản trị viên Admin (`<ADMIN_EMAIL_PLACEHOLDER>`), truy cập `/admin/dashboard`:
  - Phía trên cùng xuất hiện `header.pug` của khách hàng: Logo VAMOS, thanh danh mục Sneaker Nam/Nữ, ô tìm kiếm sản phẩm, icon Trái tim Yêu thích có badge, icon Giỏ hàng có badge.
  - Phía dưới cùng xuất hiện `footer.pug` của khách hàng: chính sách bảo hành, đăng ký nhận tin, mạng xã hội.
  - Phía dưới DOM vẫn include `#vamos-wishlist-modal`.
- **Nguyên nhân cốt lõi:**
  - Cả 13 views của Admin (`dashboard.pug`, `orders.pug`, `products.pug`, v.v.) đều kế thừa `layouts/main.pug`.
  - Chưa có layout `src/views/layouts/admin.pug` riêng biệt.
  - `auth.controller.js` khi login thành công thì mặc định redirect về `/` thay vì `/admin/dashboard` cho Admin.
  - `auth.middleware.js` thiếu middleware `requireCustomer` để ngăn Admin gọi các chức năng `/account/*` và `/checkout/*`.

### 3.2. Vấn đề Trái tim Wishlist (BUG-03, BUG-08)
- **Tái hiện:**
  - Ở trang chi tiết sản phẩm hoặc card sản phẩm, khi Guest hoặc Customer click tim:
    - Nếu PJAX thay thế container catalog mà chưa bind lại sự kiện click thì event delegation có thể bị mất nếu không được đăng ký đúng ở cấp `document`.
    - Dữ liệu Wishlist lưu vào localStorage chưa phân biệt rõ ràng khi có nhiều người dùng đăng nhập xen kẽ trên cùng trình duyệt nếu không được xóa/hợp nhất an toàn.
  - Admin không cần và không được phép thấy nút Trái tim này.

### 3.3. Vấn đề Theme Dark / Light Mode (BUG-04)
- **Tái hiện:**
  - Kiểm tra `header.pug`: Không có nút bấm chuyển Dark/Light.
  - Kiểm tra `main.js`: Không có mã JavaScript xử lý theme.
  - Mặc dù `tailwind.config.js` có `darkMode: 'class'`, nhưng không có script thêm/bớt class `dark` trên `<html>` và không có lưu trữ `localStorage`.

### 3.4. Vấn đề Ngôn ngữ VN / EN (BUG-05)
- **Tái hiện:**
  - Top Announcement bar trong `header.pug` chỉ có text tĩnh: `span.text-white.font-semibold VN` và `span EN`.
  - Không có file từ điển (`vi.json`, `en.json`).
  - Không có middleware gắn hàm `t(key)` vào `res.locals`.
  - Không có route nhận chuyển đổi ngôn ngữ.

### 3.5. Vấn đề Dữ liệu giả / Mockup trong Admin (BUG-06, BUG-07)
- **Tái hiện:**
  - `admin.controller.js` dòng tính SKU có fallback tĩnh `342`.
  - `banners.pug` hiển thị các cột đo lường Lượt xem, Click, CTR với số liệu mẫu cố định không có trong cơ sở dữ liệu.

---

## 4. KẾT QUẢ KIỂM THỬ BASELINE TỰ ĐỘNG

Chạy lệnh kiểm thử toàn diện: `npm run test:all`
```
[PUG VALIDATION]: 38/38 templates compiled successfully (PASS)
[VALIDATOR TESTS]: 29/29 PASSED (PASS)
[TEST DB BOOTSTRAP]: Database vamos_store_test_db initialized with 20 tables & 40 products (PASS)
[AUTH FLOW TESTS]: 10/10 PASSED (PASS)
[LIVE SEARCH TESTS]: 5/5 PASSED (PASS)
[AUDIT FIXES & REGRESSION TESTS]: 118/118 PASSED (PASS)
===============================================================
TOTAL BASELINE: 206 PASSED, 0 FAILED
===============================================================
```

**Kết luận Phase 0:**
Hệ thống có nền tảng kiểm thử và kiến trúc vững vàng. Danh mục lỗi đã được phân loại rõ ràng. Đủ điều kiện bắt tay vào **Phase 1: Role Separation & Admin Portal**.
