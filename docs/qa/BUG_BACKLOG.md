# VAMOS STORE — BUG BACKLOG & DEFECT TRACKING MATRIX

> **Tài liệu kiểm soát chất lượng & danh mục lỗi hệ thống VAMOS STORE**  
> **Repository:** https://github.com/dungtttd01702-coder/vamos-store  
> **Cập nhật:** 2026-11-13  
> **Trạng thái quy ước:** `OPEN` | `IN_PROGRESS` | `FIXED` | `VERIFIED` | `BLOCKED`

---

## 1. TỔNG QUAN DANH MỤC LỖI

| Bug ID | Tên chức năng | Vai trò | Mức độ | Trạng thái | File liên quan chính |
|---|---|---|---|---|---|
| **BUG-01** | Role Separation / Admin Storefront Leakage | Admin | High | FIXED | `src/views/layouts/main.pug`, `src/views/pages/admin/*.pug` |
| **BUG-02** | Role-Aware Auth Redirect & Route Guards | Admin, Customer | High | FIXED | `src/controllers/auth.controller.js`, `src/middlewares/auth.middleware.js` |
| **BUG-03** | Wishlist Event Binding & Cross-Session Storage | Guest, Customer | High | FIXED | `src/public/js/main.js`, `src/views/pages/products/index.pug` |
| **BUG-04** | Dark Mode / Light Mode Missing Implementation | All Roles | Medium | FIXED | `tailwind.config.js`, `src/public/css/input.css`, `header.pug` |
| **BUG-05** | Internationalization (i18n VI / EN) Missing | All Roles | Medium | FIXED | `src/views/partials/header.pug`, `src/locales/` |
| **BUG-06** | Admin Dashboard Hardcoded Stats / Fake Metrics | Admin | Medium | OPEN | `src/controllers/admin.controller.js`, `src/views/pages/admin/dashboard.pug` |
| **BUG-07** | Admin Banners Fake Telemetry (CTR, Clicks, Views) | Admin | Low | OPEN | `src/controllers/admin.controller.js`, `src/views/pages/admin/banners.pug` |
| **BUG-08** | Catalog PJAX Event Re-binding on Pagination | Guest, Customer | Medium | OPEN | `src/public/js/main.js`, `src/views/pages/products/index.pug` |

---

## 2. CHI TIẾT TỪNG DEFECT

### BUG-01: Admin kế thừa Storefront Layout (Lộ Header, Giỏ hàng, Yêu thích)
- **Bug ID:** `BUG-01`
- **Tên chức năng:** Giao diện Quản trị viên (Admin Portal Layout)
- **Vai trò gặp lỗi:** `Admin`
- **Các bước tái hiện:**
  1. Đăng nhập với tài khoản Admin (`admin@vamos.vn` / `123456`).
  2. Truy cập `/admin/dashboard` hoặc `/admin/products`.
  3. Quan sát đầu trang và cuối trang.
- **Expected Result:** Admin chỉ thấy Admin Portal (Sidebar/Header quản trị, Breadcrumb, nội dung quản lý, nút Đăng xuất). Không xuất hiện banner Flash Sale, Menu Sneaker Nam/Nữ, ô tìm kiếm sản phẩm, icon Giỏ hàng, icon Yêu thích, hay modal Wishlist.
- **Actual Result:** Admin pages kế thừa `layouts/main.pug` nên hiển thị đầy đủ Storefront Header, Menu sản phẩm, Giỏ hàng, Wishlist modal và Footer mua sắm.
- **Root Cause:** Toàn bộ 13 file Pug trong `src/views/pages/admin/*.pug` đều khai báo `extends ../../layouts/main` thay vì một layout quản trị chuyên biệt.
- **File liên quan:** `src/views/layouts/main.pug`, `src/views/layouts/admin.pug`, `src/views/pages/admin/**/*.pug`.
- **Mức độ ưu tiên:** HIGH (P1).
- **Trạng thái:** OPEN.
- **Kết quả xác minh:** Chưa sửa.

---

### BUG-02: Điều hướng đăng nhập & Phân quyền Route chưa triệt để
- **Bug ID:** `BUG-02`
- **Tên chức năng:** Role-Aware Redirect & Customer Route Guards
- **Vai trò gặp lỗi:** `Admin`, `Customer`, `Guest`
- **Các bước tái hiện:**
  1. Đăng nhập bằng tài khoản Admin.
  2. Hệ thống chuyển hướng về `/` (Storefront của khách hàng) thay vì `/admin/dashboard`.
  3. Admin gõ đường dẫn `/account/orders` hoặc `/checkout` vẫn truy cập được.
- **Expected Result:**
  - Admin login $\to$ điều hướng thẳng tới `/admin/dashboard`.
  - Admin đã login vào `/auth/login` $\to$ chuyển về `/admin/dashboard`.
  - Các route `/account/*` và `/checkout/*` chỉ dành riêng cho `Customer` (middleware `requireCustomer`). Admin bị chặn không được đặt hàng COD giả lập.
- **Actual Result:** `auth.controller.js` mặc định redirect về `/`, middleware chỉ kiểm tra `requireAuth` chung chung.
- **Root Cause:** Thiếu logic phân nhánh vai trò trong `postLogin`, `getLogin`, `requireGuest` và thiếu middleware `requireCustomer`.
- **File liên quan:** `src/controllers/auth.controller.js`, `src/middlewares/auth.middleware.js`, `src/routes/account.routes.js`, `src/routes/checkout.routes.js`.
- **Mức độ ưu tiên:** HIGH (P1).
- **Trạng thái:** OPEN.
- **Kết quả xác minh:** Chưa sửa.

---

### BUG-03: Trái tim Wishlist không phản hồi hoặc không lưu độc lập theo User
- **Bug ID:** `BUG-03`
- **Tên chức năng:** Danh mục yêu thích (Wishlist Engine)
- **Vai trò gặp lỗi:** `Guest`, `Customer`
- **Các bước tái hiện:**
  1. Guest hoặc Customer nhấn vào icon trái tim trên card sản phẩm hoặc trang chi tiết.
  2. Quan sát phản hồi UI (trái tim đổi màu, toast thông báo, badge trên header).
  3. Đăng xuất tài khoản A và đăng nhập tài khoản B trên cùng trình duyệt.
- **Expected Result:**
  - Guest nhấn tim: Trái tim chuyển đỏ, có Toast thông báo lưu tạm trên thiết bị, badge header tăng. Nhấn lần nữa: bỏ lưu, trái tim về rỗng, toast thông báo.
  - Customer nhấn tim: Lưu theo key độc lập `vamos_user_wishlist_${userId}`. Khi đổi tài khoản, wishlist không bị lẫn lộn giữa User A và User B.
  - Đăng nhập từ Guest: Tự động hợp nhất danh sách yêu thích của Guest vào Customer hiện tại.
- **Actual Result:** Người dùng phản ánh Guest bấm tim không có phản hồi; Customer bấm tim không thêm/bỏ yêu thích được; chưa có cơ chế kiểm tra triệt để trên mọi trang và PJAX reload.
- **Root Cause:** Event listener có thể bị ảnh hưởng khi PJAX thay đổi DOM, hoặc dữ liệu dataset trên card sản phẩm bị thiếu trường, hoặc modal chưa cập nhật đúng key.
- **File liên quan:** `src/public/js/main.js`, `src/views/partials/header.pug`, `src/views/pages/products/index.pug`, `src/views/pages/products/detail.pug`.
- **Mức độ ưu tiên:** HIGH (P1).
- **Trạng thái:** OPEN.
- **Kết quả xác minh:** Đang trong quy trình kiểm tra tái hiện.

---

### BUG-04: Chuyển đổi Dark Mode / Light Mode chưa hoạt động
- **Bug ID:** `BUG-04`
- **Tên chức năng:** Giao diện Sáng / Tối (Theme Toggle Engine)
- **Vai trò gặp lỗi:** `Guest`, `Customer`, `Admin`
- **Các bước tái hiện:**
  1. Tìm nút chuyển Theme trên giao diện Header.
  2. Nút chuyển đổi chưa tồn tại hoặc không có sự kiện click.
- **Expected Result:**
  - Có nút chuyển đổi Light/Dark trực quan (icon Mặt Trời / Mặt Trăng) trên Header cả Storefront và Admin Portal.
  - Nhấp nút: chuyển ngay lập tức class `dark` trên `<html>`, đổi màu nền và màu chữ toàn bộ trang mà không bị chớp nháy (FOUC).
  - Lựa chọn được lưu bền vững vào `localStorage` (`vamos_theme`).
- **Actual Result:** `tailwind.config.js` có `darkMode: 'class'`, nhưng không có nút bấm, không có inline script khởi tạo, không có CSS dark theme áp dụng cho các thành phần.
- **Root Cause:** Chưa lập trình module Theme Toggle trên frontend.
- **File liên quan:** `tailwind.config.js`, `src/public/css/input.css`, `src/views/partials/header.pug`, `src/views/layouts/main.pug`, `src/views/layouts/admin.pug`, `src/public/js/main.js`.
- **Mức độ ưu tiên:** MEDIUM (P2).
- **Trạng thái:** OPEN.
- **Kết quả xác minh:** Chưa sửa.

---

### BUG-05: Chức năng chuyển đổi ngôn ngữ VN / EN chưa hoạt động
- **Bug ID:** `BUG-05`
- **Tên chức năng:** Đa ngôn ngữ (Internationalization - i18n)
- **Vai trò gặp lỗi:** Tất cả người dùng
- **Các bước tái hiện:**
  1. Nhấp vào chữ "VN" hoặc "EN" trên Top Header Bar.
  2. Không có hành động nào xảy ra, trang không đổi ngôn ngữ.
- **Expected Result:**
  - Nhấp "EN": Giao diện chuyển sang tiếng Anh, lưu cookie `vamos_locale=en`.
  - Nhấp "VN": Giao diện chuyển sang tiếng Việt, lưu cookie `vamos_locale=vi`.
  - Giữ nguyên URL hiện tại và query parameters.
  - Các nhãn điều hướng, nút bấm, thông báo, modal được dịch chuẩn xác. Giữ nguyên đơn vị tiền tệ VND theo quy định nghiệp vụ.
- **Actual Result:** "VN / EN" chỉ là chuỗi văn bản tĩnh trong thẻ `span` của `header.pug`. Chưa có hệ thống từ điển hoặc middleware i18n.
- **Root Cause:** Chưa xây dựng middleware phân giải locale, chưa có từ điển `vi.json` / `en.json` và route xử lý chuyển locale.
- **File liên quan:** `src/locales/vi.json`, `src/locales/en.json`, `src/middlewares/i18n.middleware.js`, `src/views/partials/header.pug`, `src/routes/home.routes.js`.
- **Mức độ ưu tiên:** MEDIUM (P2).
- **Trạng thái:** OPEN.
- **Kết quả xác minh:** Chưa sửa.

---

### BUG-06: Số liệu thống kê Dashboard Admin có fallback/hardcode
- **Bug ID:** `BUG-06`
- **Tên chức năng:** Thống kê Báo cáo Quản trị (Admin Dashboard Metrics)
- **Vai trò gặp lỗi:** `Admin`
- **Các bước tái hiện:**
  1. Truy cập `/admin/dashboard`.
  2. Quan sát các chỉ số SKU, KPI, tỷ lệ tăng trưởng.
- **Expected Result:** Mọi số liệu phản ánh trung thực dữ liệu trong database SQL Server. Nếu chưa có đơn hàng hoặc dữ liệu rỗng, hiển thị `0` hoặc "Chưa có dữ liệu", tuyệt đối không dùng số giả lập.
- **Actual Result:** Code trong controller có fallback hardcode (ví dụ `342` SKU hoặc tỷ lệ phần trăm mẫu).
- **Root Cause:** Tồn đọng dữ liệu mockup từ giai đoạn dựng template ban đầu.
- **File liên quan:** `src/controllers/admin.controller.js`, `src/views/pages/admin/dashboard.pug`.
- **Mức độ ưu tiên:** MEDIUM (P2).
- **Trạng thái:** OPEN.
- **Kết quả xác minh:** Chưa sửa.

---

### BUG-07: Banner Admin có số liệu CTR, View, Click giả
- **Bug ID:** `BUG-07`
- **Tên chức năng:** Quản lý Banner Quảng cáo (Admin Banners)
- **Vai trò gặp lỗi:** `Admin`
- **Các bước tái hiện:**
  1. Truy cập `/admin/banners`.
  2. Quan sát cột Lượt xem, Click, CTR.
- **Expected Result:** Nếu hệ thống chưa xây dựng hệ thống telemetry theo dõi lượt click/view thật, phải hiển thị trạng thái `N/A` hoặc ẩn các cột đo lường chưa tồn tại.
- **Actual Result:** Hiển thị số liệu giả lập tạo cảm giác tính năng đã hoàn thiện nhưng không có cơ sở dữ liệu.
- **Root Cause:** Dữ liệu mockup tĩnh trong view và controller.
- **File liên quan:** `src/controllers/admin.controller.js`, `src/views/pages/admin/banners.pug`.
- **Mức độ ưu tiên:** LOW (P3).
- **Trạng thái:** OPEN.
- **Kết quả xác minh:** Chưa sửa.

---

### BUG-08: Catalog PJAX Reload làm mất sự kiện hoặc không đồng bộ
- **Bug ID:** `BUG-08`
- **Tên chức năng:** Bộ lọc Sản phẩm Tự động (Catalog Instant Filter)
- **Vai trò gặp lỗi:** `Guest`, `Customer`
- **Các bước tái hiện:**
  1. Truy cập `/products`.
  2. Chọn bộ lọc hoặc chuyển trang phân trang qua PJAX.
  3. Nhấn vào nút tim trên sản phẩm vừa được nạp mới.
- **Expected Result:** Nút tim vẫn phản hồi tức thì, cập nhật đúng danh sách yêu thích và đổi màu.
- **Actual Result:** Cần bảo đảm `initAutomaticCatalogFiltering` và `syncWishlistUI` được gọi chuẩn xác sau mỗi lần thay thế DOM container.
- **Root Cause:** DOM container bị thay thế bằng `innerHTML` cần đảm bảo event delegation gắn ở cấp document không bị can thiệp.
- **File liên quan:** `src/public/js/main.js`.
- **Mức độ ưu tiên:** MEDIUM (P2).
- **Trạng thái:** OPEN.
- **Kết quả xác minh:** Đang kiểm tra.
