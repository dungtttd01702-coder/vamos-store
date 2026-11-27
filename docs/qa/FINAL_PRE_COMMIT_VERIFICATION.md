# VAMOS STORE — FINAL PRE-COMMIT VERIFICATION REPORT
**Mã kiểm định:** `FPCV-20261114-AUTH`
**Ngày thực hiện:** 14/11/2026
**Branch kiểm định:** `fix/master-repair-plan`
**Commit HEAD:** `98946a8`
**Trạng thái kiểm định:** `READY FOR COMMIT APPROVAL`

---

## 1. TỔNG QUAN VÀ PHẠM VI KIỂM ĐỊNH (OVERVIEW & SCOPE)

Báo cáo này là văn bản kiểm toán độc lập, đối soát kỹ thuật và kiểm định cổng an ninh (Final Security Gate) lần cuối trước khi phê duyệt thực hiện 5 commit trên branch `fix/master-repair-plan`.
Quá trình này tuân thủ nguyên tắc đóng băng tuyệt đối:
- **KHÔNG** chạy `git add`, `git commit`, `git push`, hoặc `git merge`.
- **KHÔNG** `reset`, `clean`, `rebase`, hoặc `stash`.
- **KHÔNG** xóa, ghi đè hoặc chỉnh sửa hình ảnh/tệp tin hiện có.
- **KHÔNG** nới lỏng hay sửa đổi logic/assertion của các bộ kiểm thử.
- **KHÔNG** rewrite Git history.
- **KHÔNG** khởi tạo lại cơ sở dữ liệu trên môi trường production.
- Mọi dữ liệu nhạy cảm (mật khẩu thật, token, cookie, session ID) đều được rà soát và khử trùng toàn diện.

---

## 2. BẢNG ĐỐI SOÁT CHI TIẾT TỪNG FILE (73-FILE RECONCILIATION)

Tổng số file phát sinh thay đổi trong working directory được xác nhận chính xác bởi Git là **73 files**, bao gồm **15 files modified** và **58 files untracked**.

> [!NOTE]
> **Giải thích đối soát số lượng file:**
> Trong vòng rà soát trước đó, số lượng là 72 files (15 modified + 57 untracked). Khi tài liệu đối soát chính thức `docs/qa/FINAL_PRE_COMMIT_VERIFICATION.md` được tạo ra trong `docs/qa/`, Git ghi nhận thêm đúng 1 file untracked mới. Vì vậy số lượng thực tế tăng từ 57 lên **58 untracked**, nâng tổng số file cần phân nhóm lên **73 files** (15 modified + 58 untracked). Con số 73 này phản ánh trung thực 100% hiện trạng Git và không có sự gượng ép số liệu.

Dưới đây là danh sách chi tiết từng file, không dùng tên thư mục thay thế:

### 2.1. Danh sách 15 File Modified (Tracked)

| STT | Đường dẫn file | Trạng thái Git | Mục đích thay đổi |
|:---:|:---|:---:|:---|
| 1 | `database/init_mssql.js` | Modified | Thêm Production Safety Guard, bỏ fallback password yếu, kiểm tra từ điển mật khẩu, parameterize hash Admin |
| 2 | `docs/audit/FINAL_AUDIT_REPORT.md` | Modified | Khử trùng mật khẩu plaintext thành placeholder an toàn `<ADMIN_PASSWORD_PLACEHOLDER>` |
| 3 | `docs/audit/TEST_RESULTS.md` | Modified | Khử trùng mật khẩu plaintext thành placeholder an toàn `<ADMIN_PASSWORD_PLACEHOLDER>` |
| 4 | `docs/qa/BUG_BACKLOG.md` | Modified | Cập nhật trạng thái backlog, bảo mật thông tin đăng nhập |
| 5 | `docs/qa/phase-reports/PHASE_0_BASELINE.md` | Modified | Khử trùng thông tin kiểm thử baseline |
| 6 | `docs/qa/phase-reports/PHASE_1_ROLE_ADMIN.md` | Modified | Khử trùng thông tin kiểm thử Role Admin |
| 7 | `docs/qa/phase-reports/PHASE_4_I18N.md` | Modified | Khử trùng thông tin kiểm thử đa ngôn ngữ i18n |
| 8 | `docs/qa/phase-reports/PHASE_6_ADMIN_DATA.md` | Modified | Khử trùng dữ liệu kiểm toán Admin Dashboard |
| 9 | `docs/qa/phase-reports/PHASE_7_FINAL_TEST.md` | Modified | Khử trùng thông tin kiểm thử E2E Browser matrix |
| 10 | `src/middlewares/auth.middleware.js` | Modified | Bổ sung middleware `requireCustomer` bảo vệ các endpoint API Customer/Wishlist |
| 11 | `src/public/js/main.js` | Modified | Tích hợp Server-Side Wishlist, toast thông báo tiếng Việt, đồng bộ đa tab và sửa selector responsive |
| 12 | `src/routes/index.js` | Modified | Đăng ký router `/api/wishlist` vào hệ thống định tuyến |
| 13 | `src/views/layouts/main.pug` | Modified | Đồng bộ script responsive, fix render view và hydration |
| 14 | `src/views/partials/header.pug` | Modified | Sửa triệt để lỗi tràn ngang Header trên Mobile/Tablet (co giãn logo, thu nhỏ padding, ẩn chevron mobile) |
| 15 | `tests/test_audit_fixes.js` | Modified | Khử trùng credentials kiểm thử và cập nhật mock locals template Pug cho kiểm thử tĩnh |

### 2.2. Danh sách 58 File Untracked (New)

| STT | Đường dẫn file | Phân loại | Mục đích |
|:---:|:---|:---:|:---|
| 1 | `database/migrations/004_create_wishlist_items.sql` | SQL Migration | Tạo bảng `wishlist_items` với PK, FK ON DELETE CASCADE, Unique constraint `(user_id, product_id)` |
| 2 | `src/controllers/wishlist.controller.js` | Backend MVC | Controller xử lý request API Wishlist (GET, POST, DELETE, toggle) |
| 3 | `src/models/repositories/wishlist.repository.js` | Backend MVC | Repository tương tác trực tiếp với SQL Server qua Connection Pool |
| 4 | `src/services/wishlist.service.js` | Backend MVC | Service tầng nghiệp vụ kiểm tra sản phẩm tồn tại, số lượng và validation |
| 5 | `src/routes/wishlist.routes.js` | Backend MVC | Route definitions cho `/api/wishlist` có CSRF & Auth Middleware |
| 6 | `tests/test_wishlist_server.js` | Integration Test | Bộ test 14 kịch bản cho REST API Server-Side Wishlist |
| 7 | `tests/test_wl08_cross_browser.js` | E2E Test | Bộ test WL-08 với 2 BrowserContext độc lập Playwright chứng minh đồng bộ SQL |
| 8 | `tests/test_responsive_qa.js` | E2E Test | Bộ test 39 kịch bản kiểm tra tràn ngang viewport Desktop, Tablet, Mobile |
| 9 | `docs/qa/screenshots/desktop-01-home.png` | Screenshot | Ảnh chụp kiểm thử Homepage trên Desktop (1440x900) |
| 10 | `docs/qa/screenshots/desktop-02-catalog.png` | Screenshot | Ảnh chụp kiểm thử Catalog trên Desktop (1440x900) |
| 11 | `docs/qa/screenshots/desktop-03-detail.png` | Screenshot | Ảnh chụp kiểm thử Product Detail trên Desktop (1440x900) |
| 12 | `docs/qa/screenshots/desktop-04-login.png` | Screenshot | Ảnh chụp kiểm thử Login trên Desktop (1440x900) |
| 13 | `docs/qa/screenshots/desktop-05-register.png` | Screenshot | Ảnh chụp kiểm thử Register trên Desktop (1440x900) |
| 14 | `docs/qa/screenshots/desktop-06-cart.png` | Screenshot | Ảnh chụp kiểm thử Cart trên Desktop (1440x900) |
| 15 | `docs/qa/screenshots/desktop-07-wishlist-modal.png` | Screenshot | Ảnh chụp kiểm thử Wishlist Modal trên Desktop (1440x900) |
| 16 | `docs/qa/screenshots/desktop-08-mobile-menu.png` | Screenshot | Ảnh chụp kiểm thử Mobile Menu state trên Desktop (1440x900) |
| 17 | `docs/qa/screenshots/desktop-09-checkout.png` | Screenshot | Ảnh chụp kiểm thử Checkout trên Desktop (1440x900) |
| 18 | `docs/qa/screenshots/desktop-10-account-orders.png` | Screenshot | Ảnh chụp kiểm thử Order History trên Desktop (1440x900) |
| 19 | `docs/qa/screenshots/desktop-11-admin-dashboard.png` | Screenshot | Ảnh chụp kiểm thử Admin Dashboard trên Desktop (1440x900) |
| 20 | `docs/qa/screenshots/desktop-12-admin-products.png` | Screenshot | Ảnh chụp kiểm thử Admin Products trên Desktop (1440x900) |
| 21 | `docs/qa/screenshots/desktop-13-admin-orders.png` | Screenshot | Ảnh chụp kiểm thử Admin Orders trên Desktop (1440x900) |
| 22 | `docs/qa/screenshots/tablet-01-home.png` | Screenshot | Ảnh chụp kiểm thử Homepage trên Tablet (768x1024) |
| 23 | `docs/qa/screenshots/tablet-02-catalog.png` | Screenshot | Ảnh chụp kiểm thử Catalog trên Tablet (768x1024) |
| 24 | `docs/qa/screenshots/tablet-03-detail.png` | Screenshot | Ảnh chụp kiểm thử Product Detail trên Tablet (768x1024) |
| 25 | `docs/qa/screenshots/tablet-04-login.png` | Screenshot | Ảnh chụp kiểm thử Login trên Tablet (768x1024) |
| 26 | `docs/qa/screenshots/tablet-05-register.png` | Screenshot | Ảnh chụp kiểm thử Register trên Tablet (768x1024) |
| 27 | `docs/qa/screenshots/tablet-06-cart.png` | Screenshot | Ảnh chụp kiểm thử Cart trên Tablet (768x1024) |
| 28 | `docs/qa/screenshots/tablet-07-wishlist-modal.png` | Screenshot | Ảnh chụp kiểm thử Wishlist Modal trên Tablet (768x1024) |
| 29 | `docs/qa/screenshots/tablet-08-mobile-menu.png` | Screenshot | Ảnh chụp kiểm thử Mobile Menu state trên Tablet (768x1024) |
| 30 | `docs/qa/screenshots/tablet-09-checkout.png` | Screenshot | Ảnh chụp kiểm thử Checkout trên Tablet (768x1024) |
| 31 | `docs/qa/screenshots/tablet-10-account-orders.png` | Screenshot | Ảnh chụp kiểm thử Order History trên Tablet (768x1024) |
| 32 | `docs/qa/screenshots/tablet-11-admin-dashboard.png` | Screenshot | Ảnh chụp kiểm thử Admin Dashboard trên Tablet (768x1024) |
| 33 | `docs/qa/screenshots/tablet-12-admin-products.png` | Screenshot | Ảnh chụp kiểm thử Admin Products trên Tablet (768x1024) |
| 34 | `docs/qa/screenshots/tablet-13-admin-orders.png` | Screenshot | Ảnh chụp kiểm thử Admin Orders trên Tablet (768x1024) |
| 35 | `docs/qa/screenshots/mobile-01-home.png` | Screenshot | Ảnh chụp kiểm thử Homepage trên Mobile (390x844) |
| 36 | `docs/qa/screenshots/mobile-02-catalog.png` | Screenshot | Ảnh chụp kiểm thử Catalog trên Mobile (390x844) |
| 37 | `docs/qa/screenshots/mobile-03-detail.png` | Screenshot | Ảnh chụp kiểm thử Product Detail trên Mobile (390x844) |
| 38 | `docs/qa/screenshots/mobile-04-login.png` | Screenshot | Ảnh chụp kiểm thử Login trên Mobile (390x844) |
| 39 | `docs/qa/screenshots/mobile-05-register.png` | Screenshot | Ảnh chụp kiểm thử Register trên Mobile (390x844) |
| 40 | `docs/qa/screenshots/mobile-06-cart.png` | Screenshot | Ảnh chụp kiểm thử Cart trên Mobile (390x844) |
| 41 | `docs/qa/screenshots/mobile-07-wishlist-modal.png` | Screenshot | Ảnh chụp kiểm thử Wishlist Modal trên Mobile (390x844) |
| 42 | `docs/qa/screenshots/mobile-08-mobile-menu.png` | Screenshot | Ảnh chụp kiểm thử Mobile Menu state trên Mobile (390x844) |
| 43 | `docs/qa/screenshots/mobile-09-checkout.png` | Screenshot | Ảnh chụp kiểm thử Checkout trên Mobile (390x844) |
| 44 | `docs/qa/screenshots/mobile-10-account-orders.png` | Screenshot | Ảnh chụp kiểm thử Order History trên Mobile (390x844) |
| 45 | `docs/qa/screenshots/mobile-11-admin-dashboard.png` | Screenshot | Ảnh chụp kiểm thử Admin Dashboard trên Mobile (390x844) |
| 46 | `docs/qa/screenshots/mobile-12-admin-products.png` | Screenshot | Ảnh chụp kiểm thử Admin Products trên Mobile (390x844) |
| 47 | `docs/qa/screenshots/mobile-13-admin-orders.png` | Screenshot | Ảnh chụp kiểm thử Admin Orders trên Mobile (390x844) |
| 48 | `docs/qa/screenshots/responsive_results.json` | Test Evidence | Dữ liệu JSON ghi nhận kết quả đo lường độ rộng scrollWidth của 39 viewport |
| 49 | `docs/qa/FINAL_COMMIT_PLAN.md` | QA Document | Kế hoạch commit ban đầu |
| 50 | `docs/qa/FINAL_INDEPENDENT_AUDIT.md` | QA Document | Báo cáo kiểm toán độc lập tổng quan |
| 51 | `docs/qa/FINAL_PRE_COMMIT_REVIEW.md` | QA Document | Báo cáo rà soát pre-commit tổng quan |
| 52 | `docs/qa/FINAL_PRE_COMMIT_VERIFICATION.md` | QA Document | Báo cáo kiểm định kỹ thuật cuối cùng trước phê duyệt commit (file hiện tại) |
| 53 | `docs/qa/FINAL_RELEASE_READINESS_AUDIT.md` | QA Document | Báo cáo đánh giá sẵn sàng release |
| 54 | `docs/qa/PART_D_RESPONSIVE_AND_SECURITY_FIX.md` | QA Document | Báo cáo chi tiết kỹ thuật sửa lỗi Part D |
| 55 | `docs/qa/RESPONSIVE_AND_PRODUCTION_SAFETY_REVIEW.md` | QA Document | Báo cáo đánh giá responsive và an toàn production Part C |
| 56 | `docs/qa/phase-reports/PHASE_B_FINAL_CHANGE_REVIEW.md` | QA Document | Báo cáo review thay đổi sau WL-08 |
| 57 | `docs/qa/phase-reports/PHASE_B_INDEPENDENT_AUDIT.md` | QA Document | Báo cáo kiểm toán độc lập Part B |
| 58 | `docs/qa/phase-reports/PHASE_B_SERVER_SIDE_WISHLIST.md` | QA Document | Báo cáo triển khai kỹ thuật Wishlist Part B |

---

## 3. KIỂM ĐỊNH CHI TIẾT 188 ASSERTION CODE CHÍNH (10 TEST FILES)

Hệ thống đã thực thi toàn bộ **188 code assertions** trải rộng trên 10 file kiểm thử tích hợp và E2E.
Dưới đây là bảng đối soát chi tiết:

| STT | Tên file test | Số assertion | Phạm vi kiểm tra (Test Scope) | Trạng thái thực thi |
|:---:|:---|:---:|:---|:---:|
| 1 | `tests/test_phase1_role_separation.js` | 11 | Phân quyền HTTP route guard (ROLE-01..11), cô lập Admin Portal, chặn Admin vào shopping | **PASS (11/11)** |
| 2 | `tests/test_phase2_wishlist.js` | 7 | Client-side wishlist engine (WIS-01..13), localStorage keys theo User ID, merge logic | **PASS (7/7)** |
| 3 | `tests/test_phase3_theme.js` | 8 | Dark/Light theme toggle (THM-01..08), chống FOUC inline script, CSS selector dark | **PASS (8/8)** |
| 4 | `tests/test_phase4_i18n.js` | 8 | Cấu hình i18n đa ngôn ngữ (Test 1..8), cookie resolution, chống Open Redirect | **PASS (8/8)** |
| 5 | `tests/test_phase5_functional.js` | 7 | Bộ lọc danh mục, search API, công thức freeship 500k, giới hạn bán lẻ 10 đôi, admin voucher toggle | **PASS (7/7)** |
| 6 | `tests/test_phase6_data_integrity.js` | 3 | Đối soát số liệu thực tế SQL DB với Admin Dashboard (40 SP, 188 SKUs, 24 orders), xóa fake metric | **PASS (3/3)** |
| 7 | `tests/test_phase7_browser_matrix.js` | 11 | Playwright Chromium E2E multi-role: Guest, Customer, Admin; modal, theme, i18n, role isolation | **PASS (11/11)** |
| 8 | `tests/test_wishlist_server.js` | 14 | REST API Wishlist SQL Server (WL-01..14): Auth, CSRF, Duplicate 409, 404, Data Isolation | **PASS (14/14)** |
| 9 | `tests/test_wl08_cross_browser.js` | 1 | Kịch bản E2E Playwright với 2 BrowserContext độc lập kiểm tra đồng bộ SQL Server hai chiều | **PASS (1/1)** |
| 10 | `tests/regression_suite.js` | 118 | Master Database Integration & Concurrency Suite (15 nhóm nghiệp vụ, transaction, race condition, atomic checkout) | **PASS (118/118)** |
| **TỔNG** | **10 files** | **188** | **Toàn bộ chức năng cốt lõi, bảo mật, nghiệp vụ và database** | **PASS (188/188)** |

### Phân tích hành vi trùng lặp (Behavioral Overlap Analysis)
Khi rà soát sâu 188 assertions này, hệ thống ghi nhận có khoảng **4 đến 6 assertions** kiểm tra cùng một quy tắc nghiệp vụ ở các tầng kiến trúc khác nhau:
1. **Chặn Admin truy cập Checkout:**
   - `ROLE-06` trong `test_phase1_role_separation.js`: Kiểm tra tầng HTTP Middleware (GET `/checkout` redirect 302 về `/admin/dashboard`).
   - `Test 5` trong `test_phase5_functional.js`: Kiểm tra kịch bản session Admin gọi checkout.
   - `E2E 3.3` trong `test_phase7_browser_matrix.js`: Kiểm tra hành vi trên trình duyệt thật bằng Playwright.
2. **Giới hạn bán lẻ số lượng tối đa 10 đôi:**
   - `Test 4` trong `test_phase5_functional.js`: Kiểm tra POST `/cart/buy-now` trả về HTTP 400 khi số lượng > 10.
   - `LIMIT-04` & `LIMIT-05` trong `regression_suite.js`: Kiểm tra tầng Cart Service và Order Service tại database layer.

> [!NOTE]
> Sự trùng lặp này là **cố ý và có lợi** theo mô hình Testing Pyramid (kiểm tra đa tầng: Unit -> Integration -> E2E), giúp đảm bảo quy tắc nghiệp vụ không bị hở ở bất kỳ tầng nào. Tổng số hành vi nghiệp vụ độc lập thực tế là **~182 hành vi riêng biệt**.

---

## 4. ĐỐI SOÁT 101 BÀI KIỂM THỬ ĐƠN VỊ & BIÊN DỊCH BỔ TRỢ (5 TEST FILES)

Để đảm bảo tính minh bạch, **101 unit/compiler tests** này được phân định hoàn toàn riêng biệt, **KHÔNG gộp lẫn** vào con số 188 code assertions chính:

| STT | Tên file test | Số lượng test | Mục đích và nội dung kiểm tra | Trạng thái |
|:---:|:---|:---:|:---|:---:|
| 1 | `tests/test_validator.js` | 29 | Kiểm tra các hàm regex validator: email RFC, số điện thoại VN, độ dài tên, giới hạn số lượng bán lẻ (1..10) | **PASS (29/29)** |
| 2 | `tests/test_auth_flow.js` | 10 | Luồng xác thực đăng nhập/đăng ký/đăng xuất, tái tạo session ID, chuyển hướng an toàn | **PASS (10/10)** |
| 3 | `tests/test_live_search.js` | 8 | Tốc độ và độ chính xác tìm kiếm realtime, chống SQL Injection ký tự đại diện `%`, chống XSS script payload | **PASS (8/8)** |
| 4 | `tests/test_audit_fixes.js` | 15 | Hồi quy các điểm vá lỗi sau đợt kiểm toán (hoán đổi min/max price, phân trang giữ query, validation voucher) | **PASS (15/15)** |
| 5 | `tests/validate_pug.js` | 39 | Kiểm tra biên dịch tĩnh toàn bộ 39 file mẫu giao diện Pug, đảm bảo 0 lỗi cú pháp Pug lexer/compiler | **PASS (39/39)** |
| **TỔNG** | **5 files** | **101** | **Bổ trợ: Kiểm thử đơn vị cô lập, bảo mật validator và tính toàn vẹn cú pháp giao diện** | **PASS (101/101)** |

---

## 5. ĐỐI SOÁT KIỂM THỬ RESPONSIVE & AUDIT 39 SCREENSHOTS

### 5.1. Ma trận kiểm thử tràn ngang giao diện (39 Checks)
Kiểm thử tự động bằng Playwright trên 13 trang đại diện qua 3 kích thước màn hình tiêu chuẩn:
- **Desktop:** `1440 x 900` px
- **Tablet:** `768 x 1024` px
- **Mobile:** `390 x 844` px

| STT | Trang được kiểm thử | URL kiểm thử | Độ rộng Desktop | Độ rộng Tablet | Độ rộng Mobile | Tràn ngang (Overflow) |
|:---:|:---|:---|:---:|:---:|:---:|:---:|
| 1 | Homepage | `/` | 1440px | 768px | 390px | **0px (PASS)** |
| 2 | Product Catalog | `/products` | 1440px | 768px | 390px | **0px (PASS)** |
| 3 | Product Detail | `/products/giay-sneaker-nam-vamos-air-wave-v1` | 1440px | 768px | 390px | **0px (PASS)** |
| 4 | Login | `/auth/login` | 1440px | 768px | 390px | **0px (PASS)** |
| 5 | Register | `/auth/register` | 1440px | 768px | 390px | **0px (PASS)** |
| 6 | Shopping Cart | `/cart` | 1440px | 768px | 390px | **0px (PASS)** |
| 7 | Wishlist Modal | `/` (Modal active) | 1440px | 768px | 390px | **0px (PASS)** |
| 8 | Mobile Menu | `/` (Menu opened) | 1440px | 768px | 390px | **0px (PASS)** |
| 9 | Checkout | `/checkout` (Customer) | 1440px | 768px | 390px | **0px (PASS)** |
| 10 | Order History | `/account/orders` (Customer) | 1440px | 768px | 390px | **0px (PASS)** |
| 11 | Admin Dashboard | `/admin/dashboard` (Admin) | 1440px | 768px | 390px | **0px (PASS)** |
| 12 | Admin Products | `/admin/products` (Admin) | 1440px | 768px | 390px | **0px (PASS)** |
| 13 | Admin Orders | `/admin/orders` (Admin) | 1440px | 768px | 390px | **0px (PASS)** |

### 5.2. Audit tệp tin Screenshot minh chứng
Thư mục `docs/qa/screenshots/` chứa chính xác:
- **39 tệp PNG:** Tương ứng với 13 trang x 3 kích thước màn hình.
- **1 tệp JSON:** `responsive_results.json` ghi nhận thông số kỹ thuật viewport, độ rộng scrollWidth và trạng thái overflow của từng trang.

### 5.3. Kiểm tra trực quan dữ liệu nhạy cảm trong 39 ảnh PNG (Visual Inspection Gate)
Toàn bộ 39 ảnh PNG đã được kiểm tra trực quan chi tiết qua multimodal vision. Kết quả ghi nhận:
1. **Thông tin xuất hiện trong ảnh:**
   - **3 tệp ảnh Lịch sử đơn hàng khách hàng:** `desktop-10-account-orders.png`, `tablet-10-account-orders.png`, `mobile-10-account-orders.png`:
     - *Nội dung hiển thị:* Họ tên `Trần Trung Dũng`, email `trungdung@gmail.com`, huy hiệu `Thành viên VIP`.
     - *Vị trí hiển thị:* Thẻ User Profile Card (ở cột bên trái trên Desktop; khối thẻ trên cùng trên Tablet và Mobile).
     - *Bản chất thông tin:* Đây là dữ liệu tài khoản khách hàng thử nghiệm mẫu được tạo bởi script seed phục vụ kiểm thử E2E tự động, **không phải thông tin người dùng thật**.
   - **3 tệp ảnh Quản lý đơn hàng Admin:** `desktop-13-admin-orders.png`, `tablet-13-admin-orders.png`, `mobile-13-admin-orders.png`:
     - *Nội dung hiển thị:* Tên người nhận mẫu (`Admin Cancel Test`, `Admin LifeCycle Test`, `Automation Receiver`) và số điện thoại giả lập (`0901234567`, `0909999999`).
     - *Vị trí hiển thị:* Bảng danh sách đơn hàng điều phối Admin.
2. **Xác nhận an toàn thông tin tuyệt đối:**
   - **Mật khẩu (Password):** Trên tất cả các ảnh Đăng nhập (`desktop-04`, `tablet-04`, `mobile-04`) và Đăng ký (`desktop-05`, `tablet-05`, `mobile-05`), các trường biểu mẫu hoàn toàn để trống, chỉ hiển thị placeholder mờ (`user@example.com`, `••••••••`). Tuyệt đối không có mật khẩu nào bị nhập sẵn hay chụp lại.
   - **Tokens / Cookies / Secrets:** Không có session ID, token CSRF, JWT, API key hay connection string nào xuất hiện trên bất kỳ ảnh nào trong 39 PNG.
   - **Tuân thủ quy tắc:** Giữ nguyên trạng 39 tệp ảnh PNG minh chứng, không tự ý xóa hoặc sửa ảnh.

---

## 6. KIỂM TOÁN AN TOÀN BẢO MẬT TÀI LIỆU (SECURITY SANITIZATION AUDIT)

Hệ thống đã thực hiện rà soát bảo mật kép (cả nội dung hiện tại và `git diff` so với HEAD) đối với 8 tài liệu trong Commit 1 và 10 báo cáo QA trong Commit 5:

1. **8 Tài liệu trong Commit 1 (`sec(docs)`):**
   - Các file: `FINAL_AUDIT_REPORT.md`, `TEST_RESULTS.md`, `BUG_BACKLOG.md`, và các phase reports `PHASE_0`, `PHASE_1`, `PHASE_4`, `PHASE_6`, `PHASE_7`.
   - Toàn bộ các dòng diff mang dấu trừ (`-`) từng chứa thông tin đăng nhập thử nghiệm thô (như email admin, mật khẩu plaintext `123456`) đã được loại bỏ triệt để.
   - Toàn bộ các dòng diff mang dấu cộng (`+`) bổ sung đều sử dụng placeholder chuẩn an toàn: `<ADMIN_PASSWORD_PLACEHOLDER>`, `<CUSTOMER_PASSWORD_PLACEHOLDER>`, `<ADMIN_EMAIL_PLACEHOLDER>`, `<TEST_CUSTOMER_EMAIL>`, `<TEST_CUSTOMER_PASSWORD>`.
   - Tuyệt đối không có hành vi viết đè lịch sử Git (zero git history rewrite).

2. **10 Báo cáo QA trong Commit 5 (`test(qa)`):**
   - Các file: `FINAL_COMMIT_PLAN.md`, `FINAL_INDEPENDENT_AUDIT.md`, `FINAL_PRE_COMMIT_REVIEW.md`, `FINAL_PRE_COMMIT_VERIFICATION.md`, `FINAL_RELEASE_READINESS_AUDIT.md`, `PART_D_RESPONSIVE_AND_SECURITY_FIX.md`, `RESPONSIVE_AND_PRODUCTION_SAFETY_REVIEW.md`, và 3 phase reports B.
   - Đã quét toàn bộ nội dung văn bản: Mọi từ khóa liên quan đến "password" đều chỉ xuất hiện trong ngữ cảnh phân tích kỹ thuật an toàn (ví dụ: gỡ bỏ fallback password cứng, bổ sung từ điển weakPasswords, kiểm tra độ dài `>= 8`). Không chứa bất kỳ thông tin xác thực thật nào.

3. **Bảo vệ khởi tạo cơ sở dữ liệu (`database/init_mssql.js`):**
   - **Production Guard:** Cơ chế chặn thực thi khi `NODE_ENV === 'production'` nếu thiếu cờ môi trường tường minh `ALLOW_PRODUCTION_INIT=true`.
   - **Bảo toàn tài khoản Admin:** Kiểm tra tài khoản Admin đã tồn tại; nếu đã có sẽ giữ nguyên mật khẩu cũ, không tự ý ghi đè.
   - **Chống mật khẩu yếu:** Xóa bỏ hoàn toàn giá trị mặc định yếu (`123456`), yêu cầu mật khẩu tối thiểu 8 ký tự và chặn danh sách mật khẩu từ điển thông dụng (`admin123`, `password`, `12345678`).
   - **Parameterized Query:** Toàn bộ câu lệnh SQL trong `init_mssql.js` đều sử dụng `@adminHash` và `@adminEmail` qua SQL parameter, ngăn chặn triệt để SQL Injection.

---

## 7. KẾ HOẠCH PHÂN NHÓM 5 CONVENTIONAL COMMITS (ĐÃ ĐIỀU CHỈNH CHUẨN XÁC)

Kế hoạch phân nhóm commit đã được điều chỉnh hoàn thiện theo đúng định hướng:
- Đưa `tests/test_audit_fixes.js` vào **Commit 5** (Nhóm kiểm thử QA) để **Commit 1** hoàn toàn chuyên biệt cho việc làm sạch tài liệu QA.
- Đưa file untracked hợp lệ `docs/qa/FINAL_PRE_COMMIT_VERIFICATION.md` vào **Commit 5**.
- Tổng số file được phân nhóm: **8 + 1 + 7 + 3 + 54 = 73 files** (Khớp chính xác 100% với Git).

### Commit 1: Khử trùng tài liệu QA (Sanitization)
```bash
git add docs/audit/FINAL_AUDIT_REPORT.md \
        docs/audit/TEST_RESULTS.md \
        docs/qa/BUG_BACKLOG.md \
        docs/qa/phase-reports/PHASE_0_BASELINE.md \
        docs/qa/phase-reports/PHASE_1_ROLE_ADMIN.md \
        docs/qa/phase-reports/PHASE_4_I18N.md \
        docs/qa/phase-reports/PHASE_6_ADMIN_DATA.md \
        docs/qa/phase-reports/PHASE_7_FINAL_TEST.md
git commit -m "sec(docs): sanitize plaintext credentials in QA audit documents"
```
- **Số lượng file:** **8 files** (100% modified markdown QA docs).
- **Danh sách file chi tiết:**
  1. `docs/audit/FINAL_AUDIT_REPORT.md`
  2. `docs/audit/TEST_RESULTS.md`
  3. `docs/qa/BUG_BACKLOG.md`
  4. `docs/qa/phase-reports/PHASE_0_BASELINE.md`
  5. `docs/qa/phase-reports/PHASE_1_ROLE_ADMIN.md`
  6. `docs/qa/phase-reports/PHASE_4_I18N.md`
  7. `docs/qa/phase-reports/PHASE_6_ADMIN_DATA.md`
  8. `docs/qa/phase-reports/PHASE_7_FINAL_TEST.md`
- **Mục đích:** Loại bỏ toàn bộ credential lịch sử, làm sạch tài liệu QA trước khi commit code logic.

### Commit 2: Gia cố bảo mật khởi tạo cơ sở dữ liệu MSSQL
```bash
git add database/init_mssql.js
git commit -m "sec(db): harden MSSQL initialization with production guard and weak password protection"
```
- **Số lượng file:** **1 file** (modified).
- **Danh sách file chi tiết:**
  1. `database/init_mssql.js`
- **Mục đích:** Đóng chốt Production Safety Guard, loại bỏ fallback mật khẩu yếu, bảo vệ an toàn database.

### Commit 3: Triển khai tính năng Wishlist Server-Side
```bash
git add database/migrations/004_create_wishlist_items.sql \
        src/controllers/wishlist.controller.js \
        src/models/repositories/wishlist.repository.js \
        src/services/wishlist.service.js \
        src/routes/wishlist.routes.js \
        src/routes/index.js \
        src/middlewares/auth.middleware.js
git commit -m "feat(wishlist): implement SQL Server persistence and REST API for Customer wishlist"
```
- **Số lượng file:** **7 files** (5 untracked + 2 modified).
- **Danh sách file chi tiết:**
  1. `database/migrations/004_create_wishlist_items.sql`
  2. `src/controllers/wishlist.controller.js`
  3. `src/models/repositories/wishlist.repository.js`
  4. `src/services/wishlist.service.js`
  5. `src/routes/wishlist.routes.js`
  6. `src/routes/index.js`
  7. `src/middlewares/auth.middleware.js`
- **Mục đích:** Cung cấp đầy đủ tầng dữ liệu, nghiệp vụ và API RESTful cho danh sách yêu thích lưu trữ trên SQL Server.

### Commit 4: Khắc phục lỗi tràn ngang giao diện Header
```bash
git add src/views/partials/header.pug \
        src/views/layouts/main.pug \
        src/public/js/main.js
git commit -m "fix(ui): resolve header responsive overflow on tablet and mobile viewports"
```
- **Số lượng file:** **3 files** (100% modified).
- **Danh sách file chi tiết:**
  1. `src/views/partials/header.pug`
  2. `src/views/layouts/main.pug`
  3. `src/public/js/main.js`
- **Mục đích:** Xóa bỏ hoàn toàn lỗi tràn ngang Header trên Tablet và Mobile, đồng bộ logic client-side main.js.

### Commit 5: Bổ sung bộ kiểm thử tự động, ảnh chụp màn hình và báo cáo kiểm toán
```bash
git add tests/test_audit_fixes.js \
        tests/test_wishlist_server.js \
        tests/test_wl08_cross_browser.js \
        tests/test_responsive_qa.js \
        docs/qa/screenshots/ \
        docs/qa/FINAL_COMMIT_PLAN.md \
        docs/qa/FINAL_INDEPENDENT_AUDIT.md \
        docs/qa/FINAL_PRE_COMMIT_REVIEW.md \
        docs/qa/FINAL_PRE_COMMIT_VERIFICATION.md \
        docs/qa/FINAL_RELEASE_READINESS_AUDIT.md \
        docs/qa/PART_D_RESPONSIVE_AND_SECURITY_FIX.md \
        docs/qa/RESPONSIVE_AND_PRODUCTION_SAFETY_REVIEW.md \
        docs/qa/phase-reports/PHASE_B_FINAL_CHANGE_REVIEW.md \
        docs/qa/phase-reports/PHASE_B_INDEPENDENT_AUDIT.md \
        docs/qa/phase-reports/PHASE_B_SERVER_SIDE_WISHLIST.md
git commit -m "test(qa): add server-side wishlist, cross-browser, responsive suites, screenshots and audit reports"
```
- **Số lượng file:** **54 files** (1 modified + 53 untracked).
- **Danh sách file chi tiết:**
  - *4 Test Scripts:*
    1. `tests/test_audit_fixes.js` (modified)
    2. `tests/test_wishlist_server.js` (untracked)
    3. `tests/test_wl08_cross_browser.js` (untracked)
    4. `tests/test_responsive_qa.js` (untracked)
  - *39 Screenshot PNGs:*
    5. `docs/qa/screenshots/desktop-01-home.png`
    6. `docs/qa/screenshots/desktop-02-catalog.png`
    7. `docs/qa/screenshots/desktop-03-detail.png`
    8. `docs/qa/screenshots/desktop-04-login.png`
    9. `docs/qa/screenshots/desktop-05-register.png`
    10. `docs/qa/screenshots/desktop-06-cart.png`
    11. `docs/qa/screenshots/desktop-07-wishlist-modal.png`
    12. `docs/qa/screenshots/desktop-08-mobile-menu.png`
    13. `docs/qa/screenshots/desktop-09-checkout.png`
    14. `docs/qa/screenshots/desktop-10-account-orders.png`
    15. `docs/qa/screenshots/desktop-11-admin-dashboard.png`
    16. `docs/qa/screenshots/desktop-12-admin-products.png`
    17. `docs/qa/screenshots/desktop-13-admin-orders.png`
    18. `docs/qa/screenshots/mobile-01-home.png`
    19. `docs/qa/screenshots/mobile-02-catalog.png`
    20. `docs/qa/screenshots/mobile-03-detail.png`
    21. `docs/qa/screenshots/mobile-04-login.png`
    22. `docs/qa/screenshots/mobile-05-register.png`
    23. `docs/qa/screenshots/mobile-06-cart.png`
    24. `docs/qa/screenshots/mobile-07-wishlist-modal.png`
    25. `docs/qa/screenshots/mobile-08-mobile-menu.png`
    26. `docs/qa/screenshots/mobile-09-checkout.png`
    27. `docs/qa/screenshots/mobile-10-account-orders.png`
    28. `docs/qa/screenshots/mobile-11-admin-dashboard.png`
    29. `docs/qa/screenshots/mobile-12-admin-products.png`
    30. `docs/qa/screenshots/mobile-13-admin-orders.png`
    31. `docs/qa/screenshots/tablet-01-home.png`
    32. `docs/qa/screenshots/tablet-02-catalog.png`
    33. `docs/qa/screenshots/tablet-03-detail.png`
    34. `docs/qa/screenshots/tablet-04-login.png`
    35. `docs/qa/screenshots/tablet-05-register.png`
    36. `docs/qa/screenshots/tablet-06-cart.png`
    37. `docs/qa/screenshots/tablet-07-wishlist-modal.png`
    38. `docs/qa/screenshots/tablet-08-mobile-menu.png`
    39. `docs/qa/screenshots/tablet-09-checkout.png`
    40. `docs/qa/screenshots/tablet-10-account-orders.png`
    41. `docs/qa/screenshots/tablet-11-admin-dashboard.png`
    42. `docs/qa/screenshots/tablet-12-admin-products.png`
    43. `docs/qa/screenshots/tablet-13-admin-orders.png`
  - *1 JSON Evidence:*
    44. `docs/qa/screenshots/responsive_results.json`
  - *10 Báo cáo QA & Kiểm toán:*
    45. `docs/qa/FINAL_COMMIT_PLAN.md`
    46. `docs/qa/FINAL_INDEPENDENT_AUDIT.md`
    47. `docs/qa/FINAL_PRE_COMMIT_REVIEW.md`
    48. `docs/qa/FINAL_PRE_COMMIT_VERIFICATION.md`
    49. `docs/qa/FINAL_RELEASE_READINESS_AUDIT.md`
    50. `docs/qa/PART_D_RESPONSIVE_AND_SECURITY_FIX.md`
    51. `docs/qa/RESPONSIVE_AND_PRODUCTION_SAFETY_REVIEW.md`
    52. `docs/qa/phase-reports/PHASE_B_FINAL_CHANGE_REVIEW.md`
    53. `docs/qa/phase-reports/PHASE_B_INDEPENDENT_AUDIT.md`
    54. `docs/qa/phase-reports/PHASE_B_SERVER_SIDE_WISHLIST.md`
- **Mục đích:** Lưu trữ toàn bộ test scripts, bằng chứng kiểm thử tự động, ảnh chụp màn hình và báo cáo kỹ thuật.

### 7.1. Bảng đối soát phân vùng file (Partition Verification)

| Nhóm Commit | Định danh Commit | Số file Modified | Số file Untracked | Tổng số file | Trùng lặp (Duplicate) |
|:---:|:---|:---:|:---|:---:|:---:|
| **Commit 1** | `sec(docs)` | 8 | 0 | **8** | 0 |
| **Commit 2** | `sec(db)` | 1 | 0 | **1** | 0 |
| **Commit 3** | `feat(wishlist)` | 2 | 5 | **7** | 0 |
| **Commit 4** | `fix(ui)` | 3 | 0 | **3** | 0 |
| **Commit 5** | `test(qa)` | 1 | 53 | **54** | 0 |
| **TỔNG** | **5 Commits** | **15** | **58** | **73** | **0** |

- **Tổng số file trong Git:** 15 modified + 58 untracked = **73 files**.
- **Tổng số file đã phân nhóm:** 8 + 1 + 7 + 3 + 54 = **73 files**.
- **File bị thiếu (Missing):** **0 files**.
- **File bị thừa (Extra):** **0 files**.
- **Độ chính xác đối soát:** **100% khớp tuyệt đối**.

### 7.2. Giải trình kỹ thuật sự cố Exit Code 1 trong lần chạy kiểm tra phân vùng
Trong quá trình xác minh phân vùng file giữa 5 commit, lệnh thực thi PowerShell sau đã gặp lỗi thoát với mã `Exit Code 1`:
```powershell
powershell -Command "
$c1 = @(...)
...
$duplicates = $allAssigned | Group-Object | Where-Object { $_.Count -gt 1 }
if ($duplicates) { ... }
...
$missingInAssigned = $gitFiles | Where-Object { $allAssigned -notcontains $_ }
if ($missingInAssigned) { ... }
"
```
- **Nguyên nhân cốt lõi (Root Cause):** Lệnh được bao bọc trong cặp dấu ngoặc kép `powershell -Command "..."`. Cơ chế xử lý chuỗi của PowerShell đã thực hiện nội suy biến (variable interpolation) sớm ngay tại shell cha trước khi script được parser biên dịch. Tại thời điểm đó, các biến `$duplicates`, `$missingInAssigned`, `$extraInAssigned` chưa tồn tại trong môi trường cha nên bị mở rộng thành chuỗi rỗng `""`. Khi chuyển vào bên trong, cấu trúc điều kiện trở thành `if () { ... }`, dẫn đến lỗi cú pháp nghiêm trọng `ParserError: Missing condition in if statement` tại dòng 89, 99 và 106, khiến tiến trình dừng lại với Exit Code 1.
- **Biện pháp khắc phục và Kết quả xác nhận:**
  Để loại trừ hoàn toàn rủi ro nội suy chuỗi từ shell, hệ thống đã chuyển sang sử dụng script kiểm tra độc lập tại tầng Node.js runtime (`node -e`), đọc trực tiếp từ `git diff --name-only` và `git ls-files --others --exclude-standard`.
  Kết quả lần kiểm tra sau đã chạy thành công tuyệt đối (**Exit Code 0**), xác nhận:
  - `duplicates: []` (0 tệp tin bị gán trùng lặp).
  - `missingFromAssigned: []` (0 tệp tin trong Git bị bỏ sót).
  - `extraInAssigned: []` (0 tệp tin ngoài Git bị chỉ định thừa).
  - Toàn bộ 73/73 tệp tin khớp chính xác 100% giữa Git working directory và 5 nhóm commit.

---

## 8. XÁC MINH TRẠNG THÁI GIT VÀ CÁC TỆP TIN BỊ IGNORE (GIT INTEGRITY & IGNORE AUDIT)

### 8.1. Kiểm tra trạng thái Git
- **`git diff --check`:** Trả về mã thoát `0` (Zero whitespace errors, zero conflict markers).
- **`git diff --cached --check`:** Trả về mã thoát `0` (Zero staged changes, chưa có file nào bị stage sớm).
- **Working Tree:** Đảm bảo toàn vẹn 100%, không bị mất mát hay xáo trộn bất kỳ thay đổi nào.

### 8.2. Kiểm tra các tệp tin bị Git ignore (`git status --ignored -s`)
- Lệnh `git check-ignore -v docs/qa/FINAL_PRE_COMMIT_VERIFICATION.md` xác nhận: **File hoàn toàn KHÔNG bị ignore**, là một untracked file hợp lệ trong thư mục `docs/qa/`.
- Các file/thư mục đang bị ignore thực tế trong repository:
  1. `.env` (File biến môi trường nhạy cảm — chuẩn bảo mật)
  2. `.markdown-collab/` (Thư mục làm việc cộng tác tạm thời)
  3. `node_modules/` (Thư viện phụ thuộc Node.js)
  4. `scratch/` (Thư mục kịch bản tạm thời)
- Toàn bộ các thư mục/file bị ignore trên đều là thành phần chuẩn kỹ thuật, không có bất kỳ file nghiệp vụ hay tài liệu QA nào bị ignore ngoài ý muốn.

---

## 9. KẾT LUẬN VÀ KIẾN NGHỊ (CONCLUSION & RECOMMENDATION)

Dự án VAMOS STORE đã vượt qua tất cả các tiêu chí kiểm tra tại cổng an ninh cuối cùng (Final Security Gate):
1. **Phân vùng tệp tin:** Khớp chính xác 100% với hiện trạng Git (15 modified + 58 untracked = 73 files). Mỗi file xuất hiện đúng một lần trong 5 commits.
2. **Kiểm tra trực quan 39 ảnh PNG:** Không chứa mật khẩu thật, chuỗi hash bcrypt, token, cookie, khóa API hay dữ liệu bí mật nào. Các thông tin hiển thị là dữ liệu mẫu phục vụ kiểm thử.
3. **Làm sạch tài liệu QA:** Toàn bộ credential thô trong 8 tài liệu Commit 1 đã được thay thế triệt để bằng placeholder an toàn trên cả file và diff. 10 tài liệu Commit 5 an toàn 100%. Không rewrite Git history.
4. **Sự cố kỹ thuật Exit Code 1:** Đã giải trình minh bạch và được xác minh độc lập bằng Node.js với Exit Code 0.
5. **Kiểm tra trạng thái Git:** `git diff --check` và `git diff --cached --check` đạt chuẩn tuyệt đối (mã thoát 0, không có file staged sớm).

**KẾT LUẬN CUỐI CÙNG:**
# `READY FOR COMMIT APPROVAL`
