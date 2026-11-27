# VAMOS STORE — BÁO CÁO AUDIT ĐỘC LẬP TOÀN DIỆN KẾT QUẢ MASTER REPAIR PLAN
*(INDEPENDENT QUALITY & ARCHITECTURE AUDIT REPORT)*

- **Thời điểm thực hiện:** 13/11/2026
- **Nhánh kiểm tra:** `fix/master-repair-plan`
- **Commit HEAD được kiểm tra:** `98946a8` (`feat(phase-7): add Playwright E2E browser matrix suite, update bug backlog to VERIFIED`)
- **Tư cách kiểm định:** Độc lập, khách quan, dựa trên bằng chứng mã nguồn, nhật ký thực thi thực tế và cơ sở dữ liệu.
- **Trạng thái mã nguồn hiện tại:** **ĐÃ ĐÓNG BĂNG 100% (FREEZE)** — Không thêm tính năng, không sửa code, không sửa test, không xóa file, không merge vào `main`.

---

## 1. HIỆN TRẠNG GIT VÀ THỐNG KÊ THAY ĐỔI

### 1.1. Trạng thái Git (`git status`)
- **Branch:** `fix/master-repair-plan` (phân nhánh từ `main` tại commit `b5c65d2`).
- **Unstaged Changes:** Có 12 file bị thay đổi ký tự xuống dòng / định dạng markdown (do trình soạn thảo) chưa được stage:
  - `docs/qa/PHASED_REPAIR_PLAN.md`
  - 8 file trong `docs/qa/phase-reports/`
  - `src/locales/en.json`, `src/locales/vi.json`
  - `src/views/layouts/admin.pug`
- **Số commit mới trên branch:** 7 commits:
  1. `413b35a`: `feat(phase-0-1): establish QA documentation and implement strict role separation and dedicated admin portal`
  2. `e4586a3`: `feat(phase-2): resolve wishlist guest-customer separation, click event overlay, and merge logic`
  3. `f1c55df`: `feat(phase-3): implement dark mode / light mode theme engine with anti-fouc inline script and persistent storage`
  4. `a909bb6`: `feat(phase-4): implement SSR i18n VI/EN engine, cookie switcher and test suite`
  5. `1ac9696`: `feat(phase-5): complete functional & button audit, fix pagination PJAX rebinding and test suite`
  6. `436851e`: `feat(phase-6): enforce admin database data integrity and remove fake telemetry`
  7. `98946a8`: `feat(phase-7): add Playwright E2E browser matrix suite, update bug backlog to VERIFIED`

### 1.2. Thống kê file thay đổi so với `main` (`git diff main...HEAD --stat`)
- **Tổng số file thay đổi:** 54 files (3.271 insertions, 220 deletions).
- **Phân loại file:**
  - **Mã nguồn ứng dụng & Views (Code):** 37 files.
  - **Kiểm thử tự động (Test suites):** 7 files mới (`tests/test_phase1` $\to$ `tests/test_phase7`).
  - **Tài liệu kiểm soát chất lượng (QA Docs):** 10 files (`BUG_BACKLOG.md`, `PHASED_REPAIR_PLAN.md`, và 8 phase reports).

---

## 2. PHÂN TÍCH LỊCH SỬ KIỂM THỬ: TẠI SAO CÓ TEST FAIL NHƯNG BÁO CÁO GHI 123/123 PASS?

Báo cáo trước đây ghi nhận con số "123/123 PASS" dựa trên việc cộng dồn tổng số assertions của lần chạy cuối cùng sau khi các kịch bản test đã được tinh chỉnh. Tuy nhiên, qua rà soát nhật ký thực thi thực tế, **đã có nhiều lần kiểm thử thất bại, một số test bị sửa đổi assertion và có 2 tác vụ bị treo (hanging) do lỗi thiếu lệnh kết thúc tiến trình Node.js**.

Dưới đây là chi tiết từng trường hợp:

### 2.1. Danh sách các test từng THẤT BẠI (FAIL) và nguyên nhân:
1. **`tests/test_phase1_role_separation.js` (Lần 1 - FAIL):**
   - *Lỗi:* `AssertionError: !adminDash.body.includes('Sneaker Nam')` thất bại.
   - *Nguyên nhân:* Tác giả test giả định trang Admin Dashboard không được chứa chuỗi `"Sneaker Nam"`. Tuy nhiên, trong cơ sở dữ liệu bảng `orders`, có đơn hàng thực tế chứa sản phẩm tên *"Giày Sneaker Nam Vamos Air Wave V1"*. Khi trang Dashboard hiển thị bảng đơn hàng gần đây, chuỗi này xuất hiện trong DOM.
   - *Chỉnh sửa test:* Test được sửa assertion từ `!adminDash.body.includes('Sneaker Nam')` thành `!adminDash.body.includes('href="/products?cat=sneaker-nam"')` để nhắm chính xác vào thẻ liên kết danh mục Mega Menu của Storefront.
   - *Đánh giá:* Assertion ban đầu có phạm vi kiểm tra quá rộng và không thực tế với dữ liệu đơn hàng; việc sửa đổi assertion là phù hợp với mục tiêu kiểm tra phân tách layout, nhưng là sự thay đổi trực tiếp trong test file sau khi chạy thất bại.

2. **`tests/test_phase4_i18n.js` (Lần 1 - FAIL):**
   - *Lỗi:* `AssertionError: Must redirect back to internal referrer: '/' !== '/products'`.
   - *Nguyên nhân thực tế:* Trong `src/controllers/home.controller.js`, logic phòng thủ Open Redirect so sánh `parsed.host === req.get('host')`. Khi chạy test, cổng kiểm thử ngẫu nhiên (`127.0.0.1:54321`) khiến so sánh `host` bị lệch với `Referer: http://127.0.0.1/products`.
   - *Xử lý:* Lỗi được sửa tại **CODE** (`src/controllers/home.controller.js`), chuyển sang so sánh `parsed.hostname === req.hostname`. Đây là sửa lỗi mã nguồn thực tế.

3. **`tests/test_phase5_functional.js` (Lần 1 đến 4 - FAIL liên tiếp):**
   - *Lần 1 (FAIL):* `Search result must be an array`. Test giả định API `/api/products/search` trả về một mảng `[...]`, trong khi controller trả về `{ success: true, count, query, results: [...] }`. Test được sửa lại thành `assert.ok(Array.isArray(searchJson.results))`.
   - *Lần 2 (FAIL):* Test gọi `POST /cart/buy-now` trả về HTTP 403 (CSRF verification failed). Test ban đầu không gửi token CSRF.
   - *Lần 3 (FAIL):* Test cố gắng trích xuất cookie phiên nhưng giả định tên cookie là `connect.sid`, trong khi cấu hình chuẩn của ứng dụng là `vamos_sid`.
   - *Lần 4 (FAIL):* Test truy vấn SQL Server `SELECT status FROM vouchers` gặp lỗi `Invalid column name 'status'`. Tác giả test viết sai tên cột (cột thực tế trong schema là `is_active` kiểu bit).
   - *Đánh giá:* Cả 4 lỗi trên đều là do tác giả viết test sai giả định so với schema và cấu hình thực tế, sau đó chỉnh sửa lại file test để khớp với code hiện tại.

### 2.2. Các bài test bị Treo (Hanging) và bị Hủy (Canceled):
- **Tác vụ `task-8804` (`test_phase7_browser_matrix.js` - Lần 1):** Playwright Chromium đã chạy xong 11 kịch bản kiểm thử, in ra `11 PASSED, 0 FAILED`, nhưng tiến trình Node.js không thể tự thoát vì kết nối TCP trong pool MSSQL (`mssql` pool) vẫn mở nền. Tác vụ bị hủy cưỡng bức bằng `manage_task(kill)`.
- **Tác vụ `task-8828` (Chạy chuỗi hồi quy liên hoàn - Lần 1):** Lệnh bị dừng ngay sau Phase 1 vì `test_phase1_role_separation.js` cũng thiếu lệnh `process.exit(0)`, khiến Node.js tiếp tục giữ socket mở. Tác vụ bị hủy cưỡng bức.
- **Biện pháp xử lý:** Bổ sung `process.exit(failed > 0 ? 1 : 0)` vào cuối các file test để đóng tiến trình dứt khoát khi hoàn thành. Lần chạy sau đó (`task-8869`) mới thực sự chạy hoàn chỉnh từ đầu đến cuối.

### 2.3. Đánh giá tính xác thực của `test_phase7_browser_matrix.js`:
- **Xác minh công nghệ:** File `tests/test_phase7_browser_matrix.js` **thực sự sử dụng Playwright Chromium thật** (khởi chạy qua `@playwright/test` với browser engine Chromium ở chế độ headless, mở trang, click button, đọc DOM thực tế).
- **Tuy nhiên, phạm vi kiểm thử Playwright BỊ GIỚI HẠN:**
  - Script Playwright chỉ kiểm tra **5 URL cụ thể**: `/` (Trang chủ), `/auth/login`, `/account/orders`, `/admin/dashboard`, và `/checkout`.
  - Script **CHƯA KIỂM THỬ** bằng Playwright trên các trang: `/products` (Catalog sản phẩm với bộ lọc), `/products/:slug` (Chi tiết sản phẩm), `/cart` (Trang giỏ hàng), và toàn bộ các trang con trong Admin (`/admin/products`, `/admin/orders`, `/admin/banners`, v.v.).
  - **Kết luận:** Kiểm thử Playwright là **CÓ THẬT** nhưng **CHỈ PHẢN ÁNH MỘT PHẦN HỆ THỐNG (PARTIALLY VERIFIED)**, không đại diện cho 100% website.

---

## 3. AUDIT CHI TIẾT TÍNH NĂNG WISHLIST (DANH SÁCH YÊU THÍCH)

### Đối chiếu yêu cầu kỹ thuật & nghiệp vụ:
| Tiêu chí yêu cầu | Hiện trạng triển khai trong mã nguồn | Đánh giá |
|---|---|:---:|
| **Guest nhấn tim phản hồi rõ ràng** | Nhấn tim hiện Toast thông báo, cập nhật số lượng trên Header badge | **VERIFIED** |
| **Guest phải hiển thị yêu cầu đăng nhập, không tự ý lưu nếu chưa cho phép** | Hiện tại code tự động lưu ngay vào `localStorage.getItem('vamos_guest_wishlist_v1')` và hiển thị thông báo. Không mở modal bắt buộc đăng nhập để chặn lưu. | **PARTIALLY VERIFIED (LỆCH NGHIỆP VỤ YÊU CẦU)** |
| **Customer thêm / xóa Wishlist hoạt động** | Hoạt động trơn tru trên trình duyệt thông qua sự kiện click và cập nhật UI tức thì | **VERIFIED** |
| **Lưu trữ dữ liệu gắn liền với tài khoản** | Phân tách key lưu trữ client: `vamos_user_wishlist_${userId}` | **PARTIALLY VERIFIED** |
| **SQL Server là nguồn lưu trữ chính cho Wishlist** | **HOÀN TOÀN KHÔNG CÓ BẢNG DATABASE**. Trong SQL Server chỉ có bảng `carts`, `cart_items`... hoàn toàn KHÔNG tồn tại bảng `wishlists` hay `wishlist_items`. | **FAILED / NOT IMPLEMENTED** |
| **Đăng nhập trên trình duyệt khác/máy khác vẫn lấy được Wishlist** | **KHÔNG THỂ**. Do Wishlist chỉ nằm ở `localStorage` của trình duyệt hiện tại, nếu người dùng đổi máy tính hoặc mở trình duyệt khác, toàn bộ Wishlist sẽ bị mất trắng. | **FAILED / NOT IMPLEMENTED** |
| **Hai tài khoản không nhìn thấy dữ liệu của nhau** | Có logic phân tách theo `${userId}` trên cùng một trình duyệt | **VERIFIED (Client-only)** |

> **KẾT LUẬN VỀ WISHLIST:**
> Chức năng Wishlist hiện tại chỉ là **Client-side LocalStorage Engine**. Yêu cầu cốt lõi về việc lưu trữ vào **SQL Server** để đồng bộ xuyên thiết bị cho tài khoản Customer là **CHƯA ĐƯỢC XÂY DỰNG** (Thiếu Database Table, thiếu Route/API backend, thiếu Service và Repository).

---

## 4. AUDIT CHI TIẾT HỆ THỐNG PHÂN QUYỀN & BẢO VỆ ROUTE

| Tiêu chí phân quyền | Hiện trạng kiểm tra trực tiếp | Đánh giá |
|---|---|:---:|
| **Guest không thể truy cập Admin** | Truy cập `/admin/*` bị `requireAdmin` chặn và chuyển hướng về `/auth/login` | **VERIFIED** |
| **Customer không thể truy cập Admin** | Truy cập `/admin/*` bị `requireAdmin` từ chối với mã HTTP 403 Forbidden | **VERIFIED** |
| **Admin có Layout riêng biệt** | `src/views/layouts/admin.pug` tách biệt 100% khỏi `layouts/main.pug` | **VERIFIED** |
| **Admin không thấy chức năng mua hàng** | Đã loại bỏ Storefront Mega Menu, icon giỏ hàng, nút yêu thích, modal yêu thích khỏi toàn bộ 13 trang Admin | **VERIFIED** |
| **Admin không thể đặt hàng COD** | Middleware `requireCustomer` chặn Admin truy cập `/checkout`, tự động điều hướng về `/admin/dashboard`. Controller `cartController.buyNow` chặn Admin đặt hàng. | **VERIFIED** |
| **Customer sử dụng mua hàng bình thường** | Khách hàng đăng nhập mua hàng, xem giỏ, thanh toán COD bình thường | **VERIFIED** |
| **Hành vi Giỏ hàng của Guest không bị chặn nhầm** | `src/routes/cart.routes.js` không dùng `requireCustomer`. Guest vẫn xem được `/cart` và thêm sản phẩm vào `req.session.guestCart`. Khi bấm thanh toán mới yêu cầu đăng nhập. | **VERIFIED** |

---

## 5. AUDIT CHI TIẾT DARK MODE & ĐA NGÔN NGỮ (i18n)

### 5.1. Chế độ Giao diện Sáng / Tối (Dark Mode)
- **Cơ chế cốt lõi:**
  - Script inline chống chớp sáng (Anti-FOUC) trong `<head>` hoạt động tốt (**VERIFIED**).
  - Nút chuyển đổi trên Header và Admin Nav có lưu `localStorage.getItem('vamos_theme')` (**VERIFIED**).
- **Hạn chế thực tế về mặt giao diện:**
  - Các class `dark:*` mới chỉ được gắn ở `body`, thông báo alert và một số icon.
  - Hầu hết các thẻ card, bảng biểu (table), input form trên 13 trang Admin và các trang Customer (`/products`, `/cart`, `/checkout`, `/account/*`) sử dụng class nền tĩnh `.bg-white`, `.border-slate-200`.
  - Mặc dù file `input.css` có rule tổng quát `.dark .bg-white`, nhưng các biểu đồ SVG (như Kinetic SVG Chart trong Dashboard), dropdown menu phức tạp và các phần tử mang màu inline vẫn có hiện tượng hiển thị chưa tối ưu hoặc lệch độ tương phản.
  - **Đánh giá:** **PARTIALLY VERIFIED** (Đã có động cơ chuyển đổi, nhưng chưa đạt độ phủ CSS toàn diện trên từng component).

### 5.2. Đa ngôn ngữ (i18n VI / EN)
- **Cơ chế cốt lõi:**
  - Middleware `i18n.middleware.js`, bộ từ điển `vi.json`, `en.json`, cookie `vamos_locale` 1 năm và route `/set-locale/:lang` hoạt động tốt (**VERIFIED**).
- **Hạn chế nghiêm trọng về độ phủ (Coverage):**
  - Hàm `t(...)` hiện tại **CHỈ MỚI ĐƯỢC ÁP DỤNG TRÊN HEADER VÀ MODAL WISHLIST** (khoảng ~10% văn bản toàn web).
  - **90% thành phần còn lại vẫn đang hardcode Tiếng Việt 100%:**
    - Footer (`src/views/partials/footer.pug`): Khám Phá, Hỗ Trợ, Liên Hệ, chính sách... đều là Tiếng Việt tĩnh.
    - Trang chủ (`src/views/pages/home.pug`): Banner, tiêu đề mục, nút Xem tất cả... là Tiếng Việt tĩnh.
    - Catalog (`src/views/pages/products/index.pug`): Tên bộ lọc, tùy chọn sắp xếp... là Tiếng Việt tĩnh.
    - Chi tiết sản phẩm (`detail.pug`): Thêm vào giỏ, Mua ngay, Chọn kích cỡ... là Tiếng Việt tĩnh.
    - Giỏ hàng & Thanh toán (`cart/index.pug`, `checkout/index.pug`): Toàn bộ form và nút bấm là Tiếng Việt tĩnh.
    - Toàn bộ 13 trang Quản trị Admin: Tiêu đề cột, nút bấm CRUD, form nhập liệu là Tiếng Việt tĩnh.
    - Thông báo lỗi và Toast từ JavaScript: Hardcode Tiếng Việt.
  - **Đánh giá:** **PARTIALLY VERIFIED (SURFACE LEVEL ONLY)** — Động cơ i18n đã sẵn sàng nhưng chưa được áp dụng cho nội dung website.

---

## 6. AUDIT DASHBOARD, SỐ LIỆU VÀ BẢO MẬT (SECURITY)

### 6.1. Dữ liệu Dashboard & Telemetry Admin
- **Số liệu thống kê:**
  - Đã loại bỏ hoàn toàn fallback `|| 342` trong `src/controllers/admin.controller.js`. Chỉ số SKU hiện đếm trực tiếp từ SQL Server: **188 SKU đang bán** (**VERIFIED**).
  - Các số liệu Tổng sản phẩm (40), Đơn hàng (24) đọc từ bảng thật trong SQL Server (**VERIFIED**).
  - Tỷ lệ hoàn thành COD trên Dashboard được tính động từ số đơn `COMPLETED` và `CANCELLED` (**VERIFIED**).
- **Loại bỏ Telemetry giả lập:**
  - Đã xóa bỏ các số liệu giả trong `src/views/pages/admin/banners.pug` (182.400 view, 8.420 click, 18.2% CTR, các chiến dịch không có thật).
  - Chuyển các cột chưa có hệ thống theo dõi sang trạng thái `N/A (Chưa kích hoạt module đo lường)` và hiển thị danh sách banner thực tế từ cơ sở dữ liệu (**VERIFIED**).

### 6.2. Kiểm tra An toàn Bảo mật & Rò rỉ Thông tin trong Tài liệu QA
- **Bảo mật hệ thống:**
  - Bảo vệ CSRF: Hoạt động nghiêm ngặt trên mọi thao tác state-changing (**VERIFIED**).
  - Chống Open Redirect: Đã có regex/hostname whitelist trong `home.controller.js` (**VERIFIED**).
  - Hash mật khẩu: Sử dụng `bcryptjs` trong database (**VERIFIED**).
- **VI PHẠM BẢO MẬT TRONG TÀI LIỆU QA (SECURITY DEFECT):**
  - **Phát hiện nghiêm trọng:** Trong các tài liệu QA trước đó (`docs/qa/BUG_BACKLOG.md`, `PHASE_1_ROLE_ADMIN.md`, `PHASE_7_FINAL_TEST.md`) và trong tin nhắn phản hồi, thông tin tài khoản thử nghiệm của Quản trị viên và Khách hàng đã bị ghi rõ dạng văn bản thô (plaintext email và password).
  - **Quy tắc tuân thủ:** Báo cáo này đã tuân thủ nghiêm ngặt yêu cầu không xuất lại bất kỳ mật khẩu hoặc secret nào. Cần thực hiện làm sạch (redact) các tài liệu QA trên trước khi bàn giao dự án.

---

## 7. BẢNG PHÂN LOẠI ĐÁNH GIÁ CHẤT LƯỢNG HỆ THỐNG

| Nhóm chức năng | Trạng thái thẩm định | Lý do & Minh chứng |
|---|:---:|---|
| **Phân tách vai trò & Admin Portal** | **VERIFIED** | Layout Admin độc lập; Admin bị chặn mua hàng và checkout; Customer không vào được Admin. |
| **Toàn vẹn số liệu Admin Dashboard** | **VERIFIED** | Đã xóa bỏ 342 SKU; 100% số liệu lấy từ bảng `product_variants`, `products`, `orders`. |
| **Loại bỏ Telemetry giả trong Banner** | **VERIFIED** | Các số liệu giả lập bị xóa; gắn nhãn N/A minh bạch; render banner thật từ SQL Server. |
| **Bảo vệ CSRF & Chống Open Redirect** | **VERIFIED** | CSRF middleware bảo vệ form POST; kiểm tra hostname ngăn chặn redirect ngoại vi. |
| **Động cơ phân trang & Lọc Catalog (PJAX)** | **VERIFIED** | Đã gắn class phân trang PJAX; sự kiện không bị mất sau khi chuyển trang. |
| **Giỏ hàng & Công thức phí vận chuyển** | **VERIFIED** | Áp dụng đúng công thức: dưới 500k phí 30k; từ 500k trở lên miễn phí ship. |
| **Động cơ Giao diện Sáng / Tối (Theme Engine)** | **PARTIALLY VERIFIED** | Động cơ toggle và anti-FOUC hoạt động tốt, nhưng độ phủ CSS dark mode trên các component nội dung chuyên sâu chưa hoàn thiện. |
| **Hệ thống Đa ngôn ngữ (i18n)** | **PARTIALLY VERIFIED** | Động cơ từ điển và cookie hoạt động tốt, nhưng mới chỉ áp dụng cho Header và Wishlist (~10% trang web). 90% còn lại vẫn hardcode Tiếng Việt. |
| **Wishlist Client-Side** | **PARTIALLY VERIFIED** | Lưu trữ trên LocalStorage hoạt động mượt mà, nhưng tự lưu ngay khi Guest bấm tim thay vì bắt buộc đăng nhập như yêu cầu. |
| **Wishlist Server-Side (SQL Server)** | **FAILED / NOT IMPLEMENTED** | Chưa có bảng `wishlists` trong database; không có API backend; không thể đồng bộ xuyên thiết bị cho Customer. |
| **Kiểm thử E2E Playwright toàn diện** | **PARTIALLY VERIFIED** | Đã chạy Playwright thật trên 5 kịch bản chính, nhưng chưa bao phủ toàn bộ luồng mua hàng và các trang quản trị còn lại. |
| **Bảo mật tài liệu bàn giao** | **FAILED (CẦN KHẮC PHỤC)** | Các tài liệu QA cũ để lộ thông tin đăng nhập dạng plaintext, cần làm sạch. |

---

## 8. CÁC TỒN TẠI VÀ ĐỀ XUẤT XỬ LÝ TRƯỚC KHI MERGE VÀO MAIN

Tuyệt đối **KHÔNG NÊN MERGE NGAY** vào nhánh `main` cho đến khi xử lý dứt điểm các điểm sau:

1. **Xử lý tài liệu QA (Khẩn cấp):**
   - Rà soát và xóa bỏ toàn bộ mật khẩu thử nghiệm xuất hiện trong `docs/qa/BUG_BACKLOG.md` và các báo cáo phase trước đó, thay thế bằng biến môi trường hoặc hướng dẫn tạo tài khoản hạt giống (seed).
2. **Quyết định kiến trúc Wishlist:**
   - *Phương án A (Giữ nguyên Client-only):* Cập nhật lại tài liệu đặc tả, chấp nhận Wishlist chỉ lưu trên thiết bị của người dùng, không đồng bộ xuyên thiết bị qua server.
   - *Phương án B (Hoàn thiện theo đúng chuẩn SQL Server):* Tạo bảng `wishlists` trong cơ sở dữ liệu MSSQL, xây dựng API `GET /api/wishlist`, `POST /api/wishlist/toggle` để đồng bộ thực sự vào tài khoản Customer.
3. **Mở rộng độ phủ đa ngôn ngữ (i18n):**
   - Nếu dự án yêu cầu chuẩn song ngữ thực sự, cần tiếp tục gắn `t(...)` vào `footer.pug`, `home.pug`, `products/index.pug`, `products/detail.pug`, `cart/index.pug`, và `checkout/index.pug`.
4. **Kiểm thử hồi quy mở rộng:**
   - Mở rộng script Playwright để đi hết một vòng đời hoàn chỉnh: Khách chọn sản phẩm trên Catalog $\to$ Xem chi tiết $\to$ Thêm vào giỏ $\to$ Nhập địa chỉ $\to$ Đặt hàng COD thành công $\to$ Admin vào duyệt đơn.

---

> **TRẠNG THÁI CUỐI CÙNG:** Báo cáo audit độc lập đã hoàn tất. Toàn bộ mã nguồn trên nhánh `fix/master-repair-plan` được giữ nguyên vẹn, không có commit mới ngoài báo cáo audit này. Đang dừng lại và chờ chỉ đạo tiếp theo từ bạn.
