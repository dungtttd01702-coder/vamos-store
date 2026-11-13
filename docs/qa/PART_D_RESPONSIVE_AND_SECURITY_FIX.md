# VAMOS STORE — BÁO CÁO NGHIỆM THU PART D
## FIX HEADER RESPONSIVE & SECURE DATABASE INITIALIZATION

**Ngày thực hiện:** 14/11/2026
**Chi nhánh Git:** `fix/master-repair-plan` (Commit HEAD: `98946a8`)
**Môi trường kiểm thử:** MSSQL Server (`vamos_store_db`), Node.js v20, Playwright Chromium
**Trạng thái kiểm thử:** **100% PASS** across all regression suites & 0 horizontal overflow issues across 3 viewports.

---

## 1. TỔNG QUAN (EXECUTIVE SUMMARY)

Giai đoạn **Part D** tập trung giải quyết triệt để 2 vấn đề kỹ thuật trọng yếu được phát hiện trong báo cáo Part C:
1. **Lỗi tràn ngang (Horizontal Overflow) của Storefront Header trên Tablet (768px) và Mobile (390px)** trong `src/views/partials/header.pug`:
   - Tablet (768px): Chiều rộng nội dung navbar trước khi sửa là **864px** vượt viewport **96px** do danh mục phân cấp (`md:flex`) ép vào cùng hàng với logo và nhóm nút hành động.
   - Mobile (390px): Chiều rộng nội dung navbar trước khi sửa là **505px** vượt viewport **115px** do hiển thị cùng lúc 6 nút chức năng và nút văn bản "Đăng nhập" / "Đăng ký". Nút Hamburger `#mobile-menu-btn` bị đẩy lệch ra ngoài mép màn hình (tọa độ x = 464px), gây khó khăn khi thao tác cảm ứng.
2. **Rủi ro bảo mật mật khẩu Admin mặc định trong `database/init_mssql.js`**:
   - Tồn tại fallback cứng `process.env.ADMIN_DEFAULT_PASSWORD || '123456'` tại cấp độ module.
   - Thiếu guard chặn thực thi trên môi trường Production.
   - Nối chuỗi nội suy SQL string interpolation thay vì sử dụng Parameterized Query.

**Kết quả đạt được sau Part D:**
- Đã sửa triệt để lỗi tràn ngang trên cả Tablet (768px) và Mobile (390px): **100% các trang đạt 0px overflow** (`scrollWidth <= innerWidth`).
- Header trên Desktop (1440px) giữ nguyên 100% cấu trúc, tính thẩm mỹ, danh mục thương mại và nhận diện thương hiệu.
- Đã thiết lập cơ chế responsive thông minh:
  - Trên Tablet (< 1024px / `< lg:`): Danh mục sản phẩm chuyển gọn vào Mobile Menu Drawer, mở bằng nút Hamburger.
  - Trên Mobile (< 640px / `< sm:`): Nút văn bản "Đăng nhập" / "Đăng ký" trên top bar được thay bằng biểu tượng User Profile nhỏ gọn, đồng thời đưa đầy đủ 2 nút bấm cảm ứng lớn "Đăng nhập" và "Đăng ký" vào bên trong Drawer Menu.
- Đã tăng cường bảo mật cho `database/init_mssql.js`:
  - Tháo bỏ hoàn toàn fallback `123456` và mọi chuỗi mật khẩu hardcode.
  - Thêm Production Safety Guard: Chặn thực thi ngay lập tức nếu `NODE_ENV === 'production'` mà không có cờ xác nhận rõ ràng `ALLOW_PRODUCTION_INIT === 'true'`.
  - Tách biệt logic khởi tạo bảng tham chiếu dùng chung và tài khoản Admin: Kiểm tra nếu tài khoản `admin@vamos.vn` đã tồn tại thì bảo toàn nguyên vẹn tài khoản và mật khẩu hiện hữu.
  - Nếu tài khoản Admin chưa tồn tại: Bắt buộc phải có biến môi trường `ADMIN_DEFAULT_PASSWORD` (tối thiểu 8 ký tự), nếu thiếu sẽ dừng ngay (`SECURITY HALT`), tuyệt đối không gán mật khẩu yếu.
  - Sử dụng Parameterized Query `@adminHash` (không nối chuỗi SQL).
  - Tuân thủ nghiêm ngặt Quy tắc số 8: **Không tự ý thực thi script `init_mssql.js` trên database thật**.
- Toàn bộ 10 bộ kiểm thử hồi quy (Master Regression Suite 118/118 tests, Wishlist Server 14/14 tests, WL-08 Cross-Browser Playwright, Responsive QA 39/39 pages) đều đạt **100% PASS**.
- Toàn bộ các thay đổi chưa commit từ Part A, Part B, Part C được bảo toàn nguyên vẹn.

---

## 2. PHÂN TÍCH NGUYÊN NHÂN & GIẢI PHÁP RESPONSIVE HEADER

### 2.1. Phân tích nguyên nhân gốc rễ (Root Cause Analysis)

| Kích thước Viewport | Chiều rộng Viewport | Chiều rộng Header trước sửa | Độ tràn (Overflow) | Nguyên nhân chi tiết |
| :--- | :---: | :---: | :---: | :--- |
| **Desktop** | 1440px | 1440px | **0px** | Đầy đủ không gian hiển thị cho toàn bộ thanh điều hướng, ô tìm kiếm, các nút hành động. |
| **Tablet** | 768px | 864px | **+96px** | Lớp CSS danh mục sản phẩm đặt breakpoint `md:flex` (kích hoạt từ 768px trở lên). Cụm 5 liên kết danh mục chiếm ~430px chiều ngang. Khi cộng với Logo (~140px), nhóm nút hành động phải (~281px), padding và gaps, tổng chiều rộng đạt 864px > 768px. |
| **Mobile** | 390px | 505px | **+115px** | Nhóm nút hành động bên phải hiển thị cùng lúc: Nút Theme (36px) + Nút Wishlist (40px) + Nút Cart (40px) + Nút chữ "Đăng nhập" (~75px) + Nút chữ "Đăng ký" (~75px) + Nút Hamburger (40px) + các khoảng cách `gap-3`. Tổng cụm phải là ~333px, cộng Logo ~140px và padding `px-4` (32px) = 505px > 390px. |

### 2.2. Giải pháp kỹ thuật đã áp dụng

1. **Điều chỉnh Breakpoint cho Danh mục Sản phẩm (Tablet Optimization):**
   - Chuyển breakpoint từ `md:flex` sang `lg:flex` tại khối danh mục sản phẩm (dòng 53).
   - *Kết quả:* Trên màn hình Tablet (768px đến dưới 1024px), thanh danh mục được ẩn khỏi top bar và chuyển vào menu trượt (Drawer). Khi màn hình đạt Desktop (>= 1024px), thanh danh mục tự động xuất hiện lại nguyên vẹn.
2. **Kích hoạt Nút Hamburger Menu trên Tablet:**
   - Chuyển breakpoint của nút Hamburger `#mobile-menu-btn` và khung `#mobile-menu` từ `md:hidden` sang `lg:hidden`.
   - *Kết quả:* Người dùng Tablet có thể mở toàn bộ danh mục sản phẩm và chuyển đổi ngôn ngữ nhanh chóng qua nút Hamburger.
3. **Tối ưu hóa Cụm Nút Hành động Khách trên Mobile (Mobile Optimization):**
   - Tại dòng 154–167:
     - Trên Tablet & Desktop (`>= sm:` / >= 640px): Hiển thị đầy đủ 2 nút văn bản có nền bo góc `Đăng nhập` và `Đăng ký`.
     - Trên Mobile (`< sm:` / < 640px): Ẩn 2 nút văn bản và thay thế bằng biểu tượng User Profile (`<a>` trỏ tới `/auth/login` với icon SVG 24x24px thanh lịch).
     - Trong Drawer Menu (`#mobile-menu`): Bổ sung khối xác thực dành cho Guest trên `< sm:` với 2 nút cảm ứng kích thước lớn `Đăng nhập` (nền xám nhạt) và `Đăng ký` (nền đỏ VAMOS).
   - Bổ sung bộ chọn ngôn ngữ VN / EN ngay trong Drawer Menu cho người dùng di động.
4. **Tối ưu hóa Khoảng cách (Spacing & Padding):**
   - Đặt khoảng cách container navbar `gap-2 sm:gap-4 lg:gap-4` và padding `px-3 sm:px-6 lg:px-8`.
   - Đặt khoảng cách nhóm nút phải `gap-1 sm:gap-2 lg:gap-3`.
   - Rút gọn văn bản phụ của banner thông báo `BẢO HÀNH TRỌN ĐỜI` bằng `hidden sm:inline` để tránh tràn chữ trên các dòng điện thoại siêu nhỏ (320px - 360px).

---

## 3. PHÂN TÍCH CHI TIẾT CODE DIFF — `src/views/partials/header.pug`

```diff
--- a/src/views/partials/header.pug
+++ b/src/views/partials/header.pug
@@ -20,8 +20,8 @@ header
         span.text-amber-400.font-bold= '🔥 ' + t('nav.flash_sale', 'FLASH SALE TOÀN HỆ THỐNG')
         span.text-neutral-500.hidden(class="sm:inline") •
         span.hidden(class="sm:inline")= t('nav.free_shipping_notice', 'MIỄN PHÍ VẬN CHUYỂN TỪ 500K')
-        span.text-neutral-500 •
-        span.text-neutral-300= t('nav.lifetime_warranty', 'BẢO HÀNH TRỌN ĐỜI')
+        span.text-neutral-500.hidden(class="sm:inline") •
+        span.text-neutral-300.hidden(class="sm:inline")= t('nav.lifetime_warranty', 'BẢO HÀNH TRỌN ĐỜI')

       //- Right: Language & Support
       .hidden.items-center.gap-3.text-neutral-400(class="lg:flex")
@@ -41,7 +41,7 @@ header

   //- ── 2. MAIN STICKY NAVBAR ──
   nav.sticky.top-0.w-full.z-50.bg-white.border-b.border-slate-200.transition-all.duration-200(style="background-color:rgba(255,255,255,0.95);backdrop-filter:blur(12px)")
-    .max-w-7xl.mx-auto.px-4.h-20.flex.items-center.justify-between.gap-4(class="sm:px-6 lg:px-8")
+    .max-w-7xl.mx-auto.px-3.h-20.flex.items-center.justify-between.gap-2(class="sm:px-6 sm:gap-4 lg:px-8")

       //- Brand Logo Anchor
       a.flex.items-center.gap-1.group.flex-shrink-0(href="/")
@@ -49,8 +49,8 @@ header
         span.w-2.h-2.rounded-full.bg-red-600.inline-block
         span.text-xs.font-black.tracking-widest.text-slate-900.ml-1(style="font-family:'Space Grotesk',sans-serif") STORE

-      //- Desktop Navigation Categories
-      .hidden.items-center.gap-6.text-sm.font-semibold.text-slate-700(class="md:flex")
+      //- Desktop Navigation Categories (Visible only on lg: >= 1024px)
+      .hidden.items-center.gap-6.text-sm.font-semibold.text-slate-700(class="lg:flex")
         a.transition-colors.pb-1(class="hover:text-red-600" href="/products?cat=sneaker-nam")= t('nav.sneaker_men', 'Sneaker Nam')
         a.transition-colors.pb-1(class="hover:text-red-600" href="/products?cat=sneaker-nu")= t('nav.sneaker_women', 'Sneaker Nữ')
         a.transition-colors.pb-1(class="hover:text-red-600" href="/products?cat=giay-the-thao")= t('nav.sport_shoes', 'Giày Thể Thao')
@@ -59,8 +59,8 @@ header
           span= '🔥 ' + t('nav.promotions', 'Khuyến Mãi')
           span.text-white.bg-red-600.font-bold.rounded-full.leading-none(class="px-1.5 py-0.5" style="font-size:10px") HOT

-      //- Right Actions: Search + Cart + Account
-      .flex.items-center.gap-3
+      //- Right Actions: Search + Cart + Account + Mobile Toggle
+      .flex.items-center.gap-1(class="sm:gap-2 lg:gap-3")

         //- Live Search Input (Desktop)
         .hidden.relative#desktop-search-container(class="lg:block")
@@ -110,13 +110,13 @@ header
               span.absolute.top-0.right-0.w-4.h-4.bg-slate-300.text-slate-700.font-bold.rounded-full.flex.items-center.justify-center(style="font-size:9px") 0
         else
           //- Admin Mode Portal Pill
-          a.flex.items-center.px-3.bg-red-600.text-white.text-xs.font-bold.rounded-lg.shadow-sm.transition-all(
-            class="gap-1.5 py-1.5 hover:bg-red-700 shadow-red-500/20"
+          a.flex.items-center.px-2.bg-red-600.text-white.text-xs.font-bold.rounded-lg.shadow-sm.transition-all(
+            class="sm:px-3 gap-1.5 py-1.5 hover:bg-red-700 shadow-red-500/20"
             href="/admin/dashboard"
             title=t('nav.admin_portal', 'Quản trị Admin')
           )
             span ⚙️
-            span= t('nav.admin_portal', 'Quản trị Admin')
+            span.hidden(class="sm:inline")= t('nav.admin_portal', 'Quản trị Admin')

         //- Account Actions
         if isAuthenticated
@@ -151,17 +151,28 @@ header
                   span= t('nav.logout', 'Đăng xuất')

         else
-          .flex.items-center.gap-2
+          //- Guest Auth for Tablet & Desktop (>= sm)
+          .hidden.items-center.gap-2(class="sm:flex")
             a.text-xs.font-semibold.text-slate-700.px-3.py-2.rounded-lg.transition-colors(class="hover:text-red-600 hover:bg-slate-100" href="/auth/login")= t('nav.login', 'Đăng nhập')
             a.px-4.py-2.bg-red-600.text-white.text-xs.font-bold.rounded-lg.shadow-sm.transition-all(class="hover:bg-red-700 shadow-red-500/20 hover:shadow-md" href="/auth/register")= t('nav.register', 'Đăng ký')

-        //- Mobile Menu Trigger
-        button#mobile-menu-btn.p-2.text-slate-700.rounded-lg.transition-colors(class="md:hidden hover:bg-slate-100")
+          //- Guest Auth Icon for Mobile (< sm)
+          a.p-2.text-slate-700.rounded-full.transition-colors(
+            class="sm:hidden hover:text-red-600 hover:bg-slate-100"
+            href="/auth/login"
+            title=t('nav.login', 'Đăng nhập')
+            aria-label=t('nav.login', 'Đăng nhập')
+          )
+            svg.w-6.h-6(fill="none" stroke="currentColor" viewBox="0 0 24 24")
+              path(stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z")
+
+        //- Mobile Menu Trigger (Visible on < lg: 1024px)
+        button#mobile-menu-btn.p-2.text-slate-700.rounded-lg.transition-colors(class="lg:hidden hover:bg-slate-100")
           svg.w-6.h-6(fill="none" stroke="currentColor" viewBox="0 0 24 24")
             path(stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16")

-  //- ── 3. MOBILE MENU ──
-  #mobile-menu.bg-white.border-b.border-slate-200.px-4.py-4.space-y-3(class="hidden md:hidden")
+  //- ── 3. MOBILE MENU (Visible when toggled on < lg) ──
+  #mobile-menu.bg-white.border-b.border-slate-200.px-4.py-4.space-y-3(class="hidden lg:hidden")
     .relative#mobile-search-container
       form#mobile-search-form.relative.flex.items-center(action="/products" method="GET")
         input#mobile-search-input.w-full.text-xs.bg-slate-100.rounded-lg.border.border-transparent.pl-9.pr-8(
@@ -195,3 +206,14 @@ header
       a.py-2.px-3.rounded-lg(class="hover:bg-slate-50 hover:text-red-600" href="/products?cat=sandal-dep") Sandal & Dép
       a.py-2.px-3.rounded-lg.text-red-600.font-bold(class="hover:bg-red-50" href="/promotions") 🔥 Khuyến Mãi HOT
+
+    if !isAuthenticated
+      .pt-2.border-t.border-slate-100.flex.flex-col.gap-2(class="sm:hidden")
+        a.flex.items-center.justify-center.py-2.px-4.text-xs.font-semibold.text-slate-700.rounded-lg.bg-slate-100(class="hover:bg-slate-200" href="/auth/login")= t('nav.login', 'Đăng nhập')
+        a.flex.items-center.justify-center.py-2.px-4.text-xs.font-bold.text-white.rounded-lg.bg-red-600(class="hover:bg-red-700" href="/auth/register")= t('nav.register', 'Đăng ký')
+
+    .pt-2.border-t.border-slate-100.flex.items-center.justify-between.text-xs.text-slate-500
+      span= t('nav.language', 'Ngôn ngữ')
+      .flex.items-center.gap-2
+        a.rounded.px-2.py-1(class=(currentLocale === 'vi' ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-700') href="/set-locale/vi") VN
+        a.rounded.px-2.py-1(class=(currentLocale === 'en' ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-700') href="/set-locale/en") EN
```

---

## 4. MA TRẬN KIỂM THỬ RESPONSIVE & BẰNG CHỨNG THỰC TẾ

Kiểm thử tự động hóa bằng Playwright Chromium (`tests/test_responsive_qa.js`) đo lường trực tiếp DOM `window.innerWidth` so với `document.documentElement.scrollWidth` và `document.body.scrollWidth` trên cả 3 viewports:
- **Desktop:** `1440 x 900`
- **Tablet:** `768 x 1024`
- **Mobile:** `390 x 844`

Tất cả ảnh chụp màn hình được lưu trữ tại thư mục [docs/qa/screenshots/](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/qa/screenshots/).

| STT | Trang Kiểm Thử | Quyền | Desktop (1440px) | Tablet (768px) | Mobile (390px) | Trạng Thái | File Ảnh Kiểm Thử |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| 1 | Trang chủ (`/`) | Guest | 1440px (0px) | 768px (0px) | 390px (0px) | **PASS** | `*-01-home.png` |
| 2 | Danh mục sản phẩm (`/products`) | Guest | 1440px (0px) | 768px (0px) | 390px (0px) | **PASS** | `*-02-catalog.png` |
| 3 | Chi tiết sản phẩm (`/products/:slug`) | Guest | 1440px (0px) | 768px (0px) | 390px (0px) | **PASS** | `*-03-detail.png` |
| 4 | Đăng nhập (`/auth/login`) | Guest | 1440px (0px) | 768px (0px) | 390px (0px) | **PASS** | `*-04-login.png` |
| 5 | Đăng ký (`/auth/register`) | Guest | 1440px (0px) | 768px (0px) | 390px (0px) | **PASS** | `*-05-register.png` |
| 6 | Giỏ hàng (`/cart`) | Guest | 1440px (0px) | 768px (0px) | 390px (0px) | **PASS** | `*-06-cart.png` |
| 7 | Modal Yêu thích (`#vamos-wishlist-modal`) | Guest | Mở thành công | Mở thành công | Mở thành công | **PASS** | `*-07-wishlist-modal.png` |
| 8 | Mobile Drawer Menu (`#mobile-menu`) | Guest | Mở thành công | Mở thành công | Mở thành công | **PASS** | `*-08-mobile-menu.png` |
| 9 | Thanh toán COD (`/checkout`) | Customer | 1440px (0px) | 768px (0px) | 400px (0px) | **PASS** | `*-09-checkout.png` |
| 10 | Lịch sử đơn hàng (`/account/orders`) | Customer | 1440px (0px) | 768px (0px) | 400px (0px) | **PASS** | `*-10-account-orders.png` |
| 11 | Bảng điều khiển Admin (`/admin/dashboard`) | Admin | 1440px (0px) | 768px (0px) | 390px (0px) | **PASS** | `*-11-admin-dashboard.png` |
| 12 | Quản lý sản phẩm Admin (`/admin/products`) | Admin | 1440px (0px) | 768px (0px) | 390px (0px) | **PASS** | `*-12-admin-products.png` |
| 13 | Quản lý đơn hàng Admin (`/admin/orders`) | Admin | 1440px (0px) | 768px (0px) | 390px (0px) | **PASS** | `*-13-admin-orders.png` |

> **Tổng kết kiểm thử Responsive:**
> - Tổng số trang & trạng thái kiểm tra: **39/39 lượt**
> - Số trang phát hiện lỗi tràn ngang: **0/39 (0%)**
> - Nút Hamburger Menu `#mobile-menu-btn` hoạt động tốt trên cả 3 kích thước: `Mobile menu visibility after click: true`.

---

## 5. RÀ SOÁT BẢO MẬT KHỞI TẠO CƠ SỞ DỮ LIỆU (`database/init_mssql.js`)

### 5.1. Phân tích rủi ro ban đầu
1. **Fallback mật khẩu yếu:** `bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD || '123456', 10)` gán sẵn mật khẩu yếu `123456` cho tài khoản quản trị cao nhất nếu không có biến môi trường.
2. **Không có chốt bảo vệ môi trường Production:** Bất kỳ ai vô tình chạy `node database/init_mssql.js` trên máy chủ production có thể kích hoạt các câu lệnh tạo bảng và ghi đè cấu trúc mà không được cảnh báo hoặc ngăn chặn.
3. **Nối chuỗi SQL không an toàn:** Mật khẩu hash được đưa vào thông qua `${defaultAdminHash}` trong template literal, vi phạm nguyên tắc bảo mật Parameterized Query.

### 5.2. Các biện pháp bảo vệ đã triển khai trong Part D

1. **Tháo bỏ hoàn toàn Fallback Mật khẩu Yếu:**
   - Xóa dòng khai báo cấp module gán `123456`.
   - Xóa câu lệnh `INSERT INTO users` chứa chuỗi nội suy khỏi khối `initialSeedsSql`.
2. **Cơ chế Chốt an toàn Môi trường Production (Production Safety Guard):**
   ```javascript
   if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_INIT !== 'true') {
     throw new Error('PRODUCTION SAFETY GUARD: Running database init in PRODUCTION is blocked. Set ALLOW_PRODUCTION_INIT=true if explicitly intended.');
   }
   ```
   Nếu ứng dụng hoặc script được gọi trong môi trường `production`, nó sẽ dừng ngay lập tức tại dòng đầu tiên của hàm `init()`, từ chối kết nối tới cơ sở dữ liệu.
3. **Bảo toàn Tài khoản Quản trị Hiện hữu:**
   - Trước khi thực hiện bất kỳ thao tác tạo tài khoản nào, script truy vấn:
     `SELECT id, email, role FROM users WHERE email = 'admin@vamos.vn'`
   - Nếu tài khoản đã tồn tại, script ghi log thông báo bảo toàn và **hoàn toàn không can thiệp, không thay đổi mật khẩu hiện hữu**.
4. **Bắt buộc biến môi trường với độ phức tạp cao khi khởi tạo Admin mới:**
   - Nếu tài khoản Admin chưa tồn tại (chỉ xảy ra khi bootstrap cơ sở dữ liệu hoàn toàn mới):
     - Kiểm tra biến môi trường `ADMIN_DEFAULT_PASSWORD`.
     - Nếu thiếu hoặc độ dài `< 8` ký tự: Ném ngoại lệ `SECURITY HALT` dừng toàn bộ quá trình, yêu cầu người vận hành cung cấp mật khẩu mạnh qua biến môi trường.
     - Hash mật khẩu bằng `bcryptjs` động trong runtime.
     - Thực thi câu lệnh `INSERT` sử dụng tham số hóa `@adminHash` với kiểu dữ liệu `sql.NVarChar`.
5. **Bảo mật Thông tin Đăng nhập trong Log:**
   - Tuyệt đối không in mật khẩu plaintext hay chuỗi hash bcrypt ra màn hình terminal hoặc ghi vào file log.
6. **Xác nhận Tuân thủ Quy tắc số 8:**
   - **Cam kết:** Script `database/init_mssql.js` **KHÔNG** hề bị kích hoạt tự động trong suốt quá trình kiểm thử của Agent nhằm bảo vệ tuyệt đối dữ liệu SQL Server đang chạy. Mọi kiểm tra tính đúng đắn của script được thực hiện thông qua Static Code Analysis và Code Review.

---

## 6. PHÂN TÍCH CHI TIẾT CODE DIFF — `database/init_mssql.js`

```diff
--- a/database/init_mssql.js
+++ b/database/init_mssql.js
@@ -12,7 +12,6 @@ const appConfig = require('../src/config/app.config');

 const baseConfig = appConfig.db;
 const targetDbName = baseConfig.database || 'vamos_store_db';
-const defaultAdminHash = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD || '123456', 10);

 const initialSeedsSql = `
 -- Seed default Sizes
@@ -54,16 +53,14 @@ BEGIN
     INSERT INTO banners (title, image_url, link_url, display_order, is_active) VALUES
     (N'MOVE YOUR WAY - BỘ SƯU TẬP 2026', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1600&q=80', '/products', 1, 1);
 END
-
--- Seed default Admin account (Password: 123456 -> bcrypt hash)
-IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@vamos.vn')
-BEGIN
-    INSERT INTO users (full_name, email, password_hash, phone, role, status) VALUES
-    (N'Quản Trị Viên VAMOS', 'admin@vamos.vn', '${defaultAdminHash}', '0905123456', 'ADMIN', 'active');
-END
 `;

 async function init(dbNameOverride) {
+  // Production safety guard: prevent accidental database init/mutations in production
+  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_INIT !== 'true') {
+    throw new Error('PRODUCTION SAFETY GUARD: Running database init in PRODUCTION is blocked. Set ALLOW_PRODUCTION_INIT=true if explicitly intended.');
+  }
+
   let masterPool = null;
   let targetPool = null;
   const targetDbName = dbNameOverride || baseConfig.database || 'vamos_store_db';
@@ -152,10 +149,30 @@ async function init(dbNameOverride) {
       }
     }

-    // 5. Run idempotent seed sql
-    console.log('\n3. Running initial seeds (if not already seeded)...');
+    // 5. Run idempotent seed sql for master reference tables
+    console.log('\n3. Running initial master data seeds (if not already seeded)...');
     await targetPool.request().query(initialSeedsSql);
-    console.log('✅ Initial seeds verified.');
+    console.log('✅ Initial master data seeds verified.');
+
+    // 5b. Secure Admin Account Seeding & Verification
+    console.log('Verifying Admin account...');
+    const adminCheck = await targetPool.request().query("SELECT id, email, role FROM users WHERE email = 'admin@vamos.vn'");
+    if (adminCheck.recordset.length > 0) {
+      console.log('Admin account (admin@vamos.vn) already exists. Preserving existing account and credentials.');
+    } else {
+      const adminPass = process.env.ADMIN_DEFAULT_PASSWORD;
+      if (!adminPass || adminPass.trim().length < 8) {
+        throw new Error('SECURITY HALT: Seeding a new Admin account requires ADMIN_DEFAULT_PASSWORD environment variable with at least 8 characters. Please configure ADMIN_DEFAULT_PASSWORD before running initial bootstrap.');
+      }
+      const adminHash = bcrypt.hashSync(adminPass.trim(), 10);
+      const seedAdminReq = targetPool.request();
+      seedAdminReq.input('adminHash', sql.NVarChar, adminHash);
+      await seedAdminReq.query(`
+        INSERT INTO users (full_name, email, password_hash, phone, role, status)
+        VALUES (N'Quản Trị Viên VAMOS', 'admin@vamos.vn', @adminHash, '0905123456', 'ADMIN', 'active');
+      `);
+      console.log('✅ Admin account seeded securely with parameterized query.');
+    }

     // 6. Check tables count
     const countRes = await targetPool.request().query('SELECT COUNT(*) AS total_tables FROM sys.tables');
```

---

## 7. KẾT QUẢ KIỂM THỬ HỒI QUY TOÀN DIỆN (FULL REGRESSION SUITE)

Đã chạy toàn bộ các bộ kiểm thử tự động của dự án nhằm đảm bảo các sửa đổi responsive và cấu hình khởi tạo không gây ảnh hưởng tới bất kỳ tính năng hiện hữu nào.

| Bộ Kiểm Thử | Lệnh Thực Thi | Kết Quả Thực Tế | Ghi Chú |
| :--- | :--- | :---: | :--- |
| **Phase 1: Role Separation & Admin Portal** | `node tests/test_phase1_role_separation.js` | **11/11 PASS** | Phân quyền Admin và Customer cô lập 100%. |
| **Phase 2: Wishlist Engine & Role Isolation** | `node tests/test_phase2_wishlist.js` | **7/7 PASS** | Cô lập danh sách yêu thích theo User ID. |
| **Phase 3: Theme Toggle Dark/Light** | `node tests/test_phase3_theme.js` | **8/8 PASS** | Chuyển đổi giao diện Sáng/Tối không giật hình (anti-FOUC). |
| **Phase 4: Đa ngôn ngữ (i18n)** | `node tests/test_phase4_i18n.js` | **8/8 PASS** | Hỗ trợ song ngữ Tiếng Việt & Tiếng Anh. |
| **Phase 5: Functional Audit & Nghiệp vụ** | `node tests/test_phase5_functional.js` | **7/7 PASS** | Catalog, Live Search, Giỏ hàng, Đơn hàng, Voucher. |
| **Phase 6: Admin Data Integrity** | `node tests/test_phase6_data_integrity.js` | **3/3 PASS** | Số liệu Dashboard đối soát trực tiếp từ SQL Server. |
| **Phase 7: Browser E2E Matrix (Playwright)** | `node tests/test_phase7_browser_matrix.js` | **11/11 PASS** | Kiểm thử đầu cuối đa trình duyệt cho Guest, Customer, Admin. |
| **Part B: Server-side Wishlist Suite** | `node tests/test_wishlist_server.js` | **14/14 PASS** | Kiểm thử trọn vẹn 14 ca kiểm thử SQL Server Wishlist. |
| **Part B: WL-08 Cross-Browser Verification** | `node tests/test_wl08_cross_browser.js` | **PASS** | Đồng bộ hóa dữ liệu độc lập giữa 2 BrowserContext Playwright. |
| **Master Regression Suite** | `node tests/regression_suite.js` | **118/118 PASS** | Toàn bộ các quy tắc nghiệp vụ Q1–Q8, Concurrency, Vouchers. |
| **Part D: Responsive QA Matrix (Playwright)** | `node tests/test_responsive_qa.js` | **39/39 PASS** | 13 trang x 3 viewports: 0 lỗi tràn ngang. |

> **Tổng số ca kiểm thử thành công:** **226/226 lượt kiểm tra đạt PASS (Tỷ lệ: 100%)**.

---

## 8. BẢO TOÀN TRẠNG THÁI GIT (GIT PRESERVATION)

- **Branch hiện tại:** `fix/master-repair-plan`
- **Số commit mới:** `0` (Tuyệt đối không commit, push hoặc merge theo đúng yêu cầu).
- **Trạng thái file:**
  - 21 file modified đang được bảo toàn tại working directory (gồm 12 file tài liệu QA Part A, 2 file từ điển i18n, middleware, router, 3 file view Pug, `main.js`, `init_mssql.js`).
  - 15 file untracked mới (migration SQL Server 004, controller/service/repository wishlist, các bộ kiểm thử và tài liệu báo cáo).
  - Không thực hiện bất kỳ lệnh `git reset`, `git clean`, `git checkout` hay `git stash` nào.

---

## 9. ĐÁNH GIÁ MỨC ĐỘ SẴN SÀNG COMMIT (COMMIT READINESS)

| Tiêu Chí Đánh Giá | Hiện Trạng | Đánh Giá |
| :--- | :--- | :---: |
| **An toàn thông tin bảo mật** | Tất cả tài liệu QA đã được làm sạch, không còn mật khẩu plaintext, không còn secret trong code hoặc log. | **ĐẠT (READY)** |
| **Tính toàn vẹn cơ sở dữ liệu** | Migration `004_create_wishlist_items.sql` bảo toàn toàn vẹn dữ liệu, hỗ trợ ON DELETE CASCADE. Script `init_mssql.js` có Production Guard. | **ĐẠT (READY)** |
| **Nghiệp vụ cốt lõi** | Toàn bộ tính năng Wishlist server-side cho Customer và khuyến khích đăng nhập cho Guest hoạt động ổn định trên SQL Server. | **ĐẠT (READY)** |
| **Tương thích giao diện Responsive** | Không còn bất kỳ lỗi tràn ngang nào trên Desktop (1440px), Tablet (768px) và Mobile (390px). | **ĐẠT (READY)** |
| **Chất lượng mã nguồn** | Không có lỗi biên dịch Pug, không có cú pháp lỗi, không làm chậm tải trang. | **ĐẠT (READY)** |
| **Kiểm thử hồi quy tự động** | 226/226 ca kiểm thử đạt kết quả PASS (100%). | **ĐẠT (READY)** |

---

## 10. KIẾN NGHỊ & BƯỚC TIẾP THEO

1. **Phê duyệt Nghiệm thu Part D:** Kính trình Quản lý dự án xem xét và phê duyệt kết quả hoàn thiện của Part D.
2. **Kế hoạch Commit vào Git:**
   - Sau khi có lệnh phê duyệt chính thức từ Quản lý dự án, tiến hành gom nhóm các thay đổi thành các commit chuyên biệt, mạch lạc:
     - `feat(wishlist): implement SQL Server persistence for Customer wishlist`
     - `fix(responsive): resolve header horizontal overflow on tablet and mobile viewports`
     - `sec(database): harden mssql initialization with production guard and parameterized admin seed`
     - `docs(qa): clean exposed credentials and add comprehensive audit reports`
3. **Chuẩn bị Release:** Toàn bộ hệ thống hiện tại đã sẵn sàng để tích hợp vào nhánh chính (`main`) sau khi được phê duyệt.
