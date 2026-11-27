# VAMOS STORE — PHASED REPAIR PLAN
## KẾ HOẠCH SỬA CHỮA HỆ THỐNG THEO GIAI ĐOẠN ĐỘC LẬP

> **Dự án:** VAMOS STORE E-Commerce (Sneaker & Thể thao)  
> **Nguyên tắc cốt lõi:**  
> 1. Không sửa tất cả cùng một lúc — Chia thành 8 giai đoạn độc lập.  
> 2. Bảo toàn kiến trúc hiện tại: Node.js, Express, Pug SSR, Tailwind CSS, Microsoft SQL Server, Controller $\to$ Service $\to$ Repository.  
> 3. Không dùng dữ liệu giả để làm đẹp giao diện.  
> 4. Mỗi giai đoạn có kiểm thử, báo cáo riêng và xác nhận không phát sinh regression trước khi chuyển giai đoạn kế tiếp.

---

## BẢN ĐỒ CÁC GIAI ĐOẠN (ROADMAP)

```
[Phase 0: Baseline Audit & Documentation]
                   │
                   ▼
[Phase 1: Role Separation & Admin Layout]
                   │
                   ▼
[Phase 2: Wishlist Engine (Guest & Customer)]
                   │
                   ▼
[Phase 3: Dark Mode / Light Mode Theme Engine]
                   │
                   ▼
[Phase 4: Internationalization (i18n VI / EN)]
                   │
                   ▼
[Phase 5: Full Functional & Button Audit]
                   │
                   ▼
[Phase 6: Admin Data Integrity & Telemetry]
                   │
                   ▼
[Phase 7: Browser Testing & Final Regression]
```

---

## CHI TIẾT TỪNG GIAI ĐOẠN

### GIAI ĐOẠN 0: BASELINE AUDIT & KIỂM KÊ HIỆN TRẠNG
- **Mục tiêu:** Kiểm kê kiến trúc, lập bảng ánh xạ chức năng theo 3 vai trò (Guest, Customer, Admin), tái hiện chính xác các lỗi đã báo cáo, thiết lập tài liệu quản lý.
- **Tài liệu bàn giao:**
  - `docs/qa/BUG_BACKLOG.md`
  - `docs/qa/PHASED_REPAIR_PLAN.md`
  - `docs/qa/phase-reports/PHASE_0_BASELINE.md`
- **Tiêu chí hoàn thành (Acceptance Criteria):**
  - [x] Tạo branch độc lập `fix/master-repair-plan` từ `main`.
  - [x] Lập bảng ma trận ánh xạ 18 chức năng theo 3 vai trò.
  - [x] Xác định root cause của từng lỗi được phản ánh.

---

### GIAI ĐOẠN 1: TÁCH BIỆT VAI TRÒ & ADMIN PORTAL
- **Mục tiêu:** Chấm dứt hoàn toàn tình trạng Admin nhìn thấy header mua sắm, giỏ hàng, wishlist và nút mua hàng của khách. Xây dựng layout quản trị chuyên biệt.
- **Phạm vi công việc:**
  1. Tạo `src/views/layouts/admin.pug` độc lập với header quản trị, breadcrumbs, sidebar navigation, admin footer.
  2. Chuyển toàn bộ 13 trang `src/views/pages/admin/**/*.pug` sang `extends ../../layouts/admin`.
  3. Xóa bỏ hoàn toàn việc include Storefront Header, Menu, Cart, Wishlist, Footer, và Wishlist Modal trong Admin.
  4. Cập nhật `src/controllers/auth.controller.js`:
     - Admin login $\to$ điều hướng về `/admin/dashboard`.
     - Admin truy cập `/auth/login` khi đã đăng nhập $\to$ chuyển về `/admin/dashboard`.
  5. Cập nhật `src/middlewares/auth.middleware.js`:
     - Bổ sung `requireCustomer` (chặn Admin không được truy cập `/account/*` và `/checkout/*`).
     - Bổ sung `requireAdmin` nghiêm ngặt cho toàn bộ `/admin/*`.
  6. Kiểm tra CSRF, phiên làm việc và responsive menu Admin.
- **Tài liệu bàn giao:** `docs/qa/phase-reports/PHASE_1_ROLE_ADMIN.md`
- **Tiêu chí nghiệm thu:**
  - Admin không còn thấy Storefront Header, Mega Menu, Giỏ hàng, Nút trái tim.
  - Admin login tự động vào `/admin/dashboard`.
  - Customer không vào được Admin routes.
  - Admin không vào được Customer routes (`/account/*`, `/checkout`).

---

### GIAI ĐOẠN 2: HOÀN THIỆN WISHLIST CHO GUEST & CUSTOMER
- **Mục tiêu:** Sửa dứt điểm lỗi nhấn trái tim, bảo đảm hoạt động mượt mà cho cả Guest và Customer, dữ liệu độc lập theo User ID.
- **Phạm vi công việc:**
  1. Kiểm tra và chuẩn hóa thuộc tính dataset trên toàn bộ nút `.btn-wishlist` tại:
     - `src/views/pages/home.pug`
     - `src/views/pages/products/index.pug`
     - `src/views/pages/products/detail.pug`
  2. Tối ưu hóa Event Delegation trên `document` trong `src/public/js/main.js` để bắt chính xác sự kiện click kể cả khi click vào SVG/path bên trong.
  3. Đảm bảo Wishlist cho Guest lưu bền vững vào `vamos_guest_wishlist_v1`.
  4. Đảm bảo Wishlist cho Customer lưu độc lập vào `vamos_user_wishlist_${userId}`.
  5. Khi Guest đăng nhập $\to$ tự động hợp nhất các sản phẩm đã lưu từ Guest vào Customer mà không làm mất hoặc nhân đôi sản phẩm.
  6. Đảm bảo PJAX pagination / filter trên trang catalog tự động gọi lại `syncWishlistUI()`.
- **Tài liệu bàn giao:** `docs/qa/phase-reports/PHASE_2_WISHLIST.md`
- **Tiêu chí nghiệm thu:**
  - Guest nhấn tim: chuyển đỏ, có Toast thông báo lưu tạm, mở modal thấy sản phẩm.
  - Guest nhấn lại: bỏ yêu thích, chuyển rỗng, có Toast.
  - Customer đăng nhập: lưu riêng biệt, đổi tài khoản không bị dính dữ liệu của nhau.
  - Catalog phân trang qua AJAX: nút tim vẫn hoạt động 100%.

---

### GIAI ĐOẠN 3: DARK MODE / LIGHT MODE THEME ENGINE
- **Mục tiêu:** Hỗ trợ giao diện Sáng / Tối thực thụ trên toàn bộ website (Storefront và Admin Portal).
- **Phạm vi công việc:**
  1. Thiết kế nút chuyển Theme (icon Mặt trời / Mặt trăng) trên Header Storefront và Header Admin.
  2. Bổ sung inline script chặn chớp màn hình (FOUC) ngay trong thẻ `<head>` của `layouts/main.pug` và `layouts/admin.pug`.
  3. Lập trình module toggle theme trong `main.js`:
     - Nhấn nút $\to$ toggle class `dark` trên thẻ `<html>`.
     - Lưu lựa chọn vào `localStorage.getItem('vamos_theme')`.
     - Tự động nhận diện `prefers-color-scheme: dark` nếu người dùng chưa chọn.
  4. Bổ sung style dark mode trong `src/public/css/input.css` và biên dịch Tailwind:
     - Nền: `bg-slate-900` / `bg-slate-950`
     - Chữ: `text-slate-100` / `text-slate-200`
     - Card, bảng, input, modal: màu tối với viền `border-slate-800` có độ tương phản cao, dễ đọc.
- **Tài liệu bàn giao:** `docs/qa/phase-reports/PHASE_3_THEME.md`
- **Tiêu chí nghiệm thu:**
  - Nhấp nút theme: giao diện đổi màu ngay lập tức.
  - Reload trang: giữ nguyên theme đã chọn, không bị nháy trắng.
  - Toàn bộ text, card, input, table trên cả trang Storefront và Admin đều rõ ràng, chuẩn độ tương phản WCAG.

---

### GIAI ĐOẠN 4: ĐA NGÔN NGỮ (INTERNATIONALIZATION - VI / EN)
- **Mục tiêu:** Chuyển đổi ngôn ngữ thực sự giữa Tiếng Việt và Tiếng Anh trên toàn hệ thống SSR.
- **Phạm vi công việc:**
  1. Xây dựng 2 bộ từ điển hoàn chỉnh:
     - `src/locales/vi.json` (Tiếng Việt chuẩn)
     - `src/locales/en.json` (English)
  2. Tạo middleware `src/middlewares/i18n.middleware.js`:
     - Đọc locale từ cookie `vamos_locale` (hoặc header `Accept-Language`, mặc định `vi`).
     - Khởi tạo hàm dịch `res.locals.t(key, params)` và biến `res.locals.currentLocale`.
  3. Tạo route chuyển ngôn ngữ an toàn `GET /set-locale/:lang`:
     - Whitelist chỉ chấp nhận `'vi'` hoặc `'en'`.
     - Chống Open Redirect: chỉ redirect về safe internal URL.
     - Thiết lập cookie `vamos_locale` với `SameSite: 'Lax'`, `HttpOnly: true`.
  4. Cập nhật giao diện `header.pug` và `admin.pug`:
     - Thay thế text tĩnh "VN / EN" bằng các liên kết/nút bấm kích hoạt route `/set-locale/...`.
     - Đánh dấu trạng thái active cho ngôn ngữ hiện tại.
  5. Áp dụng hàm `t()` cho các thành phần chính: navigation, footer, nút giỏ hàng, thông báo xác thực, trạng thái đơn hàng.
  6. Giữ nguyên đơn vị tiền tệ VND theo quy định nghiệp vụ.
- **Tài liệu bàn giao:** `docs/qa/phase-reports/PHASE_4_I18N.md`
- **Tiêu chí nghiệm thu:**
  - Nhấn EN: Giao diện chuyển sang tiếng Anh, lưu cookie.
  - Nhấn VN: Giao diện quay lại tiếng Việt.
  - Chuyển trang/reload: giữ nguyên ngôn ngữ đã chọn.

---

### GIAI ĐOẠN 5: TOÀN DIỆN KIỂM TRA NÚT BẤM VÀ NGHIỆP VỤ
- **Mục tiêu:** Rà soát và kiểm thử tất cả các thao tác tương tác trên toàn website.
- **Phạm vi công việc:**
  1. Header & Navigation (tìm kiếm live search, menu mobile, danh mục).
  2. Product Catalog (bộ lọc category, brand, size, price, sort, pagination, clear filters).
  3. Product Detail (thumbnail gallery, chọn màu, chọn size, validation tồn kho, Add to Cart, Buy Now).
  4. Cart (thay đổi số lượng, xóa sản phẩm, tính toán phí ship 30.000₫, miễn phí từ 500.000₫, áp dụng voucher).
  5. Checkout COD (nhập địa chỉ, xác nhận đơn hàng, chống click đúp, ghi nhận đơn vào SQL Server).
  6. Admin CRUD (tạo/sửa sản phẩm, cập nhật trạng thái đơn hàng, chỉnh sửa danh mục, voucher, banner).
- **Tài liệu bàn giao:** `docs/qa/phase-reports/PHASE_5_FUNCTIONAL_AUDIT.md`
- **Tiêu chí nghiệm thu:** Không còn bất kỳ nút bấm hoặc form nào không có xử lý thực tế.

---

### GIAI ĐOẠN 6: ADMIN DATA INTEGRITY & LOẠI BỎ TELEMETRY GIẢ
- **Mục tiêu:** Đảm bảo toàn bộ số liệu báo cáo trong Admin đến từ cơ sở dữ liệu thật, không có số liệu bịa đặt.
- **Phạm vi công việc:**
  1. Rà soát `src/controllers/admin.controller.js`:
     - Loại bỏ mọi giá trị fallback tĩnh như `342` SKU.
     - Truy vấn đếm SKU và tồn kho thật từ bảng `product_variants`.
     - Chỉ tính doanh thu từ đơn hàng trạng thái hợp lệ.
  2. Rà soát `src/views/pages/admin/dashboard.pug` và `banners.pug`:
     - Thay thế các chỉ số CTR, Impression, Click giả lập bằng trạng thái `N/A` hoặc ẩn đi cho đến khi có module đo lường thực tế.
- **Tài liệu bàn giao:** `docs/qa/phase-reports/PHASE_6_ADMIN_DATA.md`
- **Tiêu chí nghiệm thu:** 100% số liệu hiển thị trên trang Admin có nguồn gốc từ SQL Server.

---

### GIAI ĐOẠN 7: BROWSER TESTING & KIỂM THỬ HỒI QUY TỔNG THỂ
- **Mục tiêu:** Xác minh tự động và trực quan trên trình duyệt cho toàn bộ 3 vai trò (Guest, Customer, Admin).
- **Phạm vi công việc:**
  1. Viết script kiểm thử trình duyệt tự động (Playwright E2E test).
  2. Kiểm tra Role Test Matrix:
     - Guest: Xem sản phẩm, bấm yêu thích có toast, thêm vào giỏ.
     - Customer: Đăng nhập, giỏ hàng, đặt hàng COD, xem lịch sử đơn.
     - Admin: Đăng nhập vào Admin Portal, thao tác quản trị, không thấy giao diện mua sắm.
  3. Kiểm tra hiển thị responsive trên các độ phân giải: Mobile (390px, 360px), Tablet (768px), Desktop (1366px, 1440px).
  4. Chạy toàn bộ test suites (`test:all`, `live_full_check.js`, Playwright E2E).
- **Tài liệu bàn giao:** `docs/qa/phase-reports/PHASE_7_FINAL_TEST.md`
- **Tiêu chí nghiệm thu:** Tất cả test suites PASS 100%, không có lỗi hồi quy.
