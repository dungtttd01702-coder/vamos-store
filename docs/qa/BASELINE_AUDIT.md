# VAMOS STORE — BASELINE AUDIT REPORT
**Dự án:** VAMOS STORE E-Commerce Platform  
**Ngày thực hiện:** 12/11/2026  
**Phiên bản kiểm toán:** v1.0.0-baseline  
**Mục đích:** Khảo sát, kiểm kê và đo lường toàn diện hệ thống mã nguồn, cơ sở dữ liệu, bộ test và tài nguyên Google Stitch trước khi thực hiện tái cấu trúc giao diện theo tiêu chuẩn Stitch.

---

## 1. THÔNG TIN HỆ THỐNG & TRẠNG THÁI GIT

| Thuộc tính | Giá trị kiểm định thực tế |
|---|---|
| **Git Branch** | `main` (Synchronized with `origin/main`) |
| **Commit SHA Baseline** | `212317eaeb1155a527bc8dc66ad55477b7b5617b` |
| **Working Tree** | Clean (`nothing to commit, working tree clean`) |
| **Runtime Environment** | Node.js v24.21.0 / Windows 10/11 x64 |
| **Core Frameworks** | Express.js 4.21.2, Pug 3.0.3, Tailwind CSS 3.4.17 |
| **Database Engine** | Microsoft SQL Server (MSSQL Driver `mssql` v12.7.14) |
| **Architecture** | MVC / Layered: Controller → Service → Repository |

---

## 2. KIỂM KÊ CƠ SỞ DỮ LIỆU & INTEGRITY RÀNG BUỘC

Hệ thống hoạt động trên 2 database SQL Server biệt lập:
1. `vamos_store_db` (Môi trường Development & Local Server)
2. `vamos_store_test_db` (Môi trường Automated Regression Test Suite)

### 2.1. 18 Thực thể Dữ liệu Chuẩn hóa
1. `users` (Quản lý Admin & Customer, mật khẩu mã hóa bcrypt)
2. `addresses` (Sổ địa chỉ giao nhận khách hàng)
3. `password_reset_tokens` (Mã khôi phục mật khẩu có hạn dùng)
4. `categories` (Danh mục sản phẩm: Sneaker, Sandal, Phụ kiện...)
5. `brands` (Thương hiệu sản phẩm: Vamos Active, Biti's Hunter, Gosto...)
6. `products` (Sản phẩm giày, giá niêm yết, giá khuyến mãi, target gender)
7. `product_images` (Bộ sưu tập ảnh studio sản phẩm, thứ tự hiển thị)
8. `sizes` (Bảng size chuẩn EU: 38, 39, 40, 41, 42, 43, 44)
9. `colors` (Bảng màu sắc kèm mã HEX)
10. `product_variants` (Ma trận biến thể [Product x Size x Color], SKU độc nhất, tồn kho)
11. `inventory_transactions` (Nhật ký kiểm toán biến động tồn kho)
12. `carts` (Giỏ hàng liên kết 1-1 với user)
13. `cart_items` (Chi tiết mặt hàng trong giỏ, ràng buộc số lượng <= tồn kho, cap bán lẻ <= 10)
14. `vouchers` (Mã giảm giá, loại giảm %, số tiền cố định, min_order_value, hạn mức)
15. `voucher_usages` (Kiểm soát 1 voucher chỉ dùng 1 lần / khách hàng)
16. `orders` (Đơn hàng, mã VAMxxxxxx, snapshot thông tin giao hàng, COD, State Machine)
17. `order_items` (Snapshot chi tiết giá, tên, SKU, size, màu tại thời điểm đặt hàng)
18. `order_status_history` (Nhật ký chuyển dịch 6 trạng thái State Machine có audit trail)
19. `banners` (Banner chiến dịch marketing, link điều hướng, hiển thị storefront)

---

## 3. KIỂM KÊ BỘ ROUTE & CÁC CHỨC NĂNG BACKEND ĐANG HOẠT ĐỘNG

| Nhóm Phân Hệ | Route Prefix | Files Route & Controller | Chức năng Đang Hoạt Động |
|---|---|---|---|
| **Storefront** | `/` | `home.routes.js`, `home.controller.js` | Banner hero slider, Top selling, Sản phẩm mới, Danh mục nổi bật |
| **Catalog & Search** | `/products` | `product.routes.js`, `product.controller.js` | Lọc đa tiêu chí (danh mục, thương hiệu, size, màu, khoảng giá, gender), Tìm kiếm debounce real-time, Phân trang URL query |
| **Product Detail** | `/products/:slug` | `product.routes.js`, `product.controller.js` | Chọn size/màu phản hồi tồn kho tức thời, gallery ảnh, Mua Ngay, Thêm Giỏ |
| **Shopping Cart** | `/cart` | `cart.routes.js`, `cart.controller.js` | Đồng bộ Giỏ khách vãng lai (Session) & Giỏ thành viên (DB), kiểm tra tồn kho, áp dụng mã voucher, cap tối đa 10 đôi |
| **Checkout (COD)** | `/checkout` | `checkout.routes.js`, `checkout.controller.js` | Chọn/thêm địa chỉ, áp voucher Q8, tính phí ship (30k, freeship >= 500k), COD atomicity transaction |
| **Authentication** | `/auth` | `auth.routes.js`, `auth.controller.js` | Đăng nhập, Đăng ký, Đăng xuất, Khôi phục mật khẩu, Token verification |
| **Customer Portal** | `/account` | `account.routes.js`, `account.controller.js` | Hồ sơ cá nhân, Sổ địa chỉ, Lịch sử đơn hàng, Chi tiết đơn, Hủy đơn khi còn PENDING |
| **Admin Operations** | `/admin` | `admin.routes.js`, `admin.controller.js` | Dashboard KPI doanh thu thật, Quản lý đơn hàng (State Machine 6 bước), Sản phẩm & Biến thể, Tồn kho & Audit, Danh mục, Vouchers, Khách hàng, Banners |

---

## 4. KẾT QUẢ KIỂM THỬ BASELINE TRƯỚC KHI TÁI CẤU TRÚC

- **Automated Regression Suite (`tests/regression_suite.js`):**
  - **118 / 118 Tests PASSED** (0 Failed).
  - Bao gồm: Auth, Validation, SQL Injection, CSRF, Concurrency Overselling, Guest Cart Merge, Voucher One-Use, State Machine Transitions, Locked Accounts.
- **Pug Template Validator (`tests/validate_pug.js`):**
  - **38 / 38 Templates PASSED** (Zero syntax / indentation errors).
- **Tailwind Production CSS Build (`npm.cmd run build:css`):**
  - **SUCCESS** (Compiled in 1159ms with zero errors).

---

## 5. KIỂM KÊ TÀI NGUYÊN GOOGLE STITCH CUNG CẤP

- **Project Title:** vamos Store E-Commerce Plan
- **Stitch Project ID:** `5716866424895331560`
- **Số lượng màn hình Desktop hoàn chỉnh:** 16 Màn hình
- **Vị trí lưu trữ tài nguyên:**
  - File HTML Stitch: `docs/stitch/html/` (16 files)
  - File PNG Stitch (2560px High-Res): `docs/stitch/images/` (16 files)
  - Wireframe Lab 4 images: `labs/Lab 4 - Thiet ke giao dien (Wireframe)/images/ui-01-home.png` đến `ui-16-register.png`.

---

## 6. KẾT LUẬN & CAM KẾT BASELINE
Toàn bộ mã nguồn, logic nghiệp vụ, cơ sở dữ liệu và bộ test đều ở trạng thái ổn định 100%. Quá trình tái cấu trúc theo Stitch sẽ tuân thủ tuyệt đối:
1. Giao diện bám sát chuẩn thiết kế Stitch (DOM structure, tokens, colors, layout).
2. Bảo toàn 100% chức năng thực tế của VAMOS STORE.
3. Không sử dụng dữ liệu giả, không phá vỡ transaction và database integrity.

