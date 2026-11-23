# BÁO CÁO XÁC MINH DỰ ÁN VAMOS STORE TOÀN DIỆN
# (FINAL PROJECT VERIFICATION REPORT)

> **Dự án:** VAMOS STORE — Website Thương Mại Điện Tử Bán Giày Trực Tuyến  
> **Thời điểm xác minh:** 21/11/2026  
> **Hệ thống thực hiện:** Antigravity Engineering System  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | HEAD `eb822aba57d75a2ecad390123c188afb73db3cb8`  
> **Mục tiêu:** Báo cáo kiểm định toàn diện sau khi hoàn tất kiểm tra hình ảnh, đơn giản hóa 11 Activity Diagram, đồng bộ thiết kế Stitch, đối soát nghiệp vụ theo source code và chạy toàn bộ kiểm thử tự động.

---

## MỤC 1: TRẠNG THÁI GIT VÀ BẢO TOÀN LOCAL-ONLY ASSETS

### 1.1. Tình trạng Git Repository hiện tại
* **Git Branch:** `fix/master-repair-plan` (nhánh làm việc an toàn, tách biệt hoàn toàn khỏi `main`/`master`).
* **HEAD Commit:** `eb822aba57d75a2ecad390123c188afb73db3cb8` ("refactor: clean repository for github production and preserve local assets").
* **Remote Origin:** `https://github.com/TritueNT/do-an-JAV102-nhom1.git`.
* **Quy tắc bảo tồn đã tuân thủ nghiêm ngặt:**
  - Tuyệt đối **không chạy `git commit` hoặc `git push`** trong đợt kiểm tra và hoàn thiện này.
  - Tuyệt đối **không chạy `git reset`, `git clean` hay `git checkout` đè mã nguồn**.
  - Mọi thay đổi về hình ảnh và tài liệu được lưu trực tiếp trên working tree local để người dùng rà soát trước khi quyết định commit.

### 1.2. Phân định tài nguyên GitHub và Local-only
* **Trạng thái GitHub:** Toàn bộ 1.638 file Agent Skills, prompt logs, rule files và tài liệu nội bộ AI đã được dọn sạch khỏi Git tracking ở commit `eb822ab`. GitHub hiện tại chỉ chứa **697 file dự án thực thụ** (mã nguồn `src/`, database `database/`, báo cáo `report/`, tài liệu thiết kế `docs/`, kiểm thử `tests/`).
* **Trạng thái Local Drive:** Toàn bộ các tài nguyên hỗ trợ làm việc cục bộ vẫn được bảo toàn nguyên vẹn 100% tại local mà không bị mất mát:
  - `.agents/` (Chứa các skill và rule cục bộ hỗ trợ kỹ thuật).
  - `skills-lock.json` và `.mcp.json` (Cấu hình công cụ AI cục bộ).
  - `scratch/` (Chứa các script kiểm toán, render hình ảnh, dữ liệu kiểm thử).
  - `PROJECT_CONTEXT_FOR_AI.md` (Tài liệu ngữ cảnh hỗ trợ lập trình).

---

## MỤC 2: KẾT QUẢ KIỂM TRA VÀ ĐƠN GIẢN HÓA 11 ACTIVITY DIAGRAM

### 2.1. Vấn đề của phiên bản cũ và giải pháp khắc phục
* **Vấn đề trên phiên bản cũ (trước ngày 21/11):**
  - Sơ đồ hiển thị dày đặc dòng chữ xám xịt từ trên xuống dưới, các bước chi li (như một sớ văn bản dài), chữ nhỏ (11-12px) không thể đọc được khi thu nhỏ trên slide hoặc in ấn báo cáo.
  - Lỗi đảo ngược nhánh rẽ `Đúng / Sai` trong PlantUML do thiếu khai báo swimlane rõ ràng sau mệnh đề `else (Sai)`: Mũi tên "Đúng" chạy sang node lỗi ("Hủy giao dịch"), còn mũi tên "Sai" lại chạy sang node thành công ("Tạo đơn hàng").
  - Mũi tên cắt ngang qua các swimlane gây rối mắt và khó thuyết trình.
* **Giải pháp khắc phục toàn diện:**
  - **Chuẩn hóa cấu trúc 2 Swimlane đối xứng:** Cột trái là **Người dùng** (hoặc Khách hàng / Quản trị viên), cột phải là **Hệ thống**.
  - **Khắc phục triệt để lỗi đảo ngược Đúng/Sai:** Đặt khai báo `|Hệ thống|` ngay sau `else (Sai)` đảm bảo nhánh Đúng đi thẳng xuống luồng xử lý thành công -> Người dùng nhận kết quả -> `stop`; nhánh Sai hiển thị thông báo lỗi -> Người dùng thao tác lại -> `stop`.
  - **Loại bỏ 100% thuật ngữ nội bộ backend:** Tuyệt đối không đề cập SQL query, Transaction isolation, controller, service, middleware hay token JWT.
  - **Nâng cấp độ phân giải và kiểu dáng:** Font Segoe UI 13-15px, swimlane rộng 380px, bo góc 10px, màu sắc độ tương phản cao, mũi tên xanh `#2563eb` vuông vắn, không giao nhau.

### 2.2. Bảng đối chiếu 11 sơ đồ hoạt động đã hoàn thiện

| Mã sơ đồ | Tên quy trình nghiệp vụ | Tệp PUML nguồn | Tệp PNG hồ sơ báo cáo | Kích thước ảnh | Tác nhân chính |
|:---:|---|---|---|:---:|---|
| **AD01** | Đăng ký tài khoản thành viên | `AD02_DANG_KY_TAI_KHOAN.puml` | `AD01_DANG_KY_TAI_KHOAN.png` | 1689 × 770 | Khách vãng lai ➔ Hệ thống |
| **AD02** | Đăng nhập hệ thống & phân quyền | `AD01_DANG_NHAP.puml` | `AD02_DANG_NHAP.png` | 1359 × 714 | Người dùng ➔ Hệ thống |
| **AD03** | Khôi phục mật khẩu qua email | `AD11_QUEN_MAT_KHAU.puml` | `AD03_QUEN_MAT_KHAU.png` | 1728 × 880 | Người dùng ➔ Hệ thống |
| **AD04** | Quản lý sổ địa chỉ nhận hàng | `AD10_QUAN_LY_SO_DIA_CHI.puml` | `AD04_QUAN_LY_SO_DIA_CHI.png` | 1678 × 883 | Khách hàng ➔ Hệ thống |
| **AD05** | Tìm kiếm & Lọc danh mục sản phẩm | `AD03_TIM_KIEM_LOC_SAN_PHAM.puml` | `AD05_TIM_KIEM_LOC_SAN_PHAM.png` | 1550 × 714 | Người dùng ➔ Hệ thống |
| **AD06** | Quản lý giỏ hàng trực tuyến | `AD04_QUAN_LY_GIO_HANG.puml` | `AD06_QUAN_LY_GIO_HANG.png` | 1624 × 659 | Khách hàng ➔ Hệ thống |
| **AD08** | Đặt hàng thanh toán COD nguyên tử | `AD05_DAT_HANG_COD.puml` | `AD08_DAT_HANG_COD.png` | 1765 × 880 | Khách hàng ➔ Hệ thống |
| **AD10** | Khách hàng hủy đơn hàng (PENDING) | `AD06_HUY_DON_HANG_KHACH_HANG.puml` | `AD10_HUY_DON_HANG_KHACH_HANG.png` | 1888 × 880 | Khách hàng ➔ Hệ thống |
| **AD11** | Admin xử lý đơn hàng theo FSM | `AD07_XU_LY_DON_HANG_ADMIN.puml` | `AD11_XU_LY_DON_HANG_ADMIN.png` | 2003 × 1001 | Quản trị viên ➔ Hệ thống |
| **AD12** | Quản lý kho hàng & ghi thẻ kho | `AD08_QUAN_LY_TON_KHO.puml` | `AD12_QUAN_LY_TON_KHO.png` | 1880 × 880 | Quản trị viên ➔ Hệ thống |
| **AD13** | Quản lý danh mục & thương hiệu | `AD09_QUAN_LY_DANH_MUC_SAN_PHAM.puml` | `AD13_QUAN_LY_DANH_MUC_SAN_PHAM.png` | 1778 × 714 | Quản trị viên ➔ Hệ thống |

*Tất cả 11 sơ đồ đã được cập nhật đồng bộ vào 3 vị trí:*
1. `docs/diagrams/activity/`
2. `report/analysis_design_images/`
3. `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/02_HINH_ANH_BAO_CAO/03_ACTIVITY_DIAGRAM/`

---

## MỤC 3: ĐỐI SOÁT NGHIỆP VỤ VỚI SOURCE CODE THỰC TẾ

### 3.1. Nghiệp vụ Hủy đơn hàng (Order Cancellation)
* **Khách hàng (`Customer`):**
  - **Quy tắc:** Chỉ được phép hủy đơn khi đơn hàng đang ở trạng thái `PENDING` (Chờ xử lý).
  - **Chứng cứ mã nguồn:** `src/services/order.service.js` (dòng 440-442):
    ```javascript
    if (order.order_status !== 'PENDING') {
      throw new Error(`Đơn hàng hiện đang ở trạng thái "${order.order_status}". Quý khách chỉ được hủy khi đơn hàng ở trạng thái "Chờ xử lý" (PENDING). Vui lòng liên hệ hotline 1900 2126 để được hỗ trợ.`);
    }
    ```
  - **Tác động khi hủy:** Hoàn trả số lượng tồn kho `product_variants.stock`, ghi bút toán hoàn kho vào thẻ kho `inventory_transactions`, phục hồi lượt dùng voucher trong `voucher_usages`.
* **Quản trị viên (`Admin`):**
  - **Quy tắc:** Được phép chuyển trạng thái đơn sang `CANCELLED` khi đơn đang ở `PENDING` hoặc `CONFIRMED`.
  - **Chứng cứ mã nguồn:** `VALID_TRANSITIONS` trong `src/services/order.service.js` (dòng 17-24):
    - `PENDING ➔ ['CONFIRMED', 'CANCELLED']`
    - `CONFIRMED ➔ ['PROCESSING', 'CANCELLED']`
    - Khi đơn đã chuyển sang `PROCESSING` hoặc `SHIPPING`, Admin không thể hủy trực tiếp trên phần mềm mà phải liên hệ bưu tá/đối tác vận chuyển để hoàn đơn.

### 3.2. Nghiệp vụ Quản lý Danh mục & Thương hiệu (Catalog Management)
* **Chứng cứ mã nguồn:** `src/controllers/admin.controller.js` (dòng 230-310) và `src/routes/admin.routes.js`:
  - `getCategories`: Xem danh sách danh mục và thương hiệu.
  - `postCreateCategory`: Thêm mới danh mục với các trường `name`, `slug`, `description`, `gender_target`.
  - `postToggleCategory`: Bật/tắt trạng thái hiển thị (`status = 'active' | 'inactive'`).
  - `postCreateBrand`: Thêm mới thương hiệu cung ứng.
* **Hiện trạng chức năng:** Hệ thống hiện không cung cấp chức năng chỉnh sửa thông tin hoặc xóa cứng (Hard Delete) danh mục. Khi không kinh doanh danh mục đó nữa, Admin chuyển trạng thái sang `inactive`. Thao tác xóa cứng không được hỗ trợ trong mã nguồn hiện tại.

### 3.3. Nghiệp vụ Admin Dashboard & Báo cáo Doanh thu
* **Công thức tính Doanh thu thực tế:**
  - **Quy tắc:** Chỉ ghi nhận doanh thu từ các đơn hàng đã giao thành công và đã thu tiền COD.
  - **Chứng cứ mã nguồn:** `src/controllers/admin.controller.js` (dòng 11):
    ```sql
    SELECT COALESCE(SUM(total_amount), 0) AS total_revenue 
    FROM orders 
    WHERE order_status = 'COMPLETED' AND payment_status = 'PAID'
    ```
  - Các đơn `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPING` hoặc `CANCELLED` tuyệt đối không được ghi nhận doanh thu.
* **Bảng xếp hạng Top 4 sản phẩm bán chạy nhất:**
  - **Quy tắc:** Sắp xếp theo **tổng số lượng sản phẩm bán ra** (`total_sold`), không sắp xếp theo doanh thu.
  - **Chứng cứ mã nguồn:** `src/controllers/admin.controller.js` (dòng 35-48):
    ```sql
    SELECT TOP 4 
      oi.product_name_snapshot, 
      SUM(oi.quantity) AS total_sold, 
      SUM(oi.line_total) AS total_revenue,
      ...
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.order_status = 'COMPLETED'
    GROUP BY oi.product_name_snapshot
    ORDER BY total_sold DESC
    ```

---

## MỤC 4: KẾT QUẢ KIỂM THỬ GIAO DIỆN VÀ CHỨC NĂNG TỰ ĐỘNG

### 4.1. Kiểm thử biên dịch giao diện Pug SSR (`npm run test:pug`)
* **Tổng số template kiểm tra:** 40/40 templates.
* **Kết quả:** **100% PASS** — Không có bất kỳ lỗi cú pháp Pug, thụt lề sai hay biến template không xác định.

### 4.2. Kiểm thử hồi quy và logic nghiệp vụ (`npm test`)
* **Môi trường:** Database `vamos_store_test_db`, Node.js v24.21.0.
* **Tổng số test cases:** 118 test cases thuộc 15 phân hệ:
  - Phân hệ 1: Xác thực, regex email/SĐT, CSRF, Password bcrypt (24/24 PASS).
  - Phân hệ 2: Danh mục sản phẩm, bộ lọc giới tính/size/giá (4/4 PASS).
  - Phân hệ 3: Giỏ hàng, chặn trần tồn kho (2/2 PASS).
  - Phân hệ 4: Voucher, giá trị đơn tối thiểu (5/5 PASS).
  - Phân hệ 5: Đặt hàng COD, Transaction khóa dòng (6/6 PASS).
  - Phân hệ 6: Khách hàng hủy đơn, hoàn kho, khôi phục voucher (7/7 PASS).
  - Phân hệ 7: Quản trị đơn hàng FSM, cập nhật PAID khi COMPLETED (9/9 PASS).
  - Phân hệ 8: Admin hủy đơn, phục hồi tồn kho (3/3 PASS).
  - Phân hệ 9: Concurrency chống Overselling (3/3 PASS).
  - Phân hệ 10: Concurrency giới hạn voucher (3/3 PASS).
  - Phân hệ 11: Đồng bộ giỏ hàng vãng lai sau đăng nhập (3/3 PASS).
  - Phân hệ 12: Voucher 1 lần/khách hàng Q8 (6/6 PASS).
  - Phân hệ 13: Admin điều chỉnh kho và ghi nhật ký kiểm toán (2/2 PASS).
  - Phân hệ 14: Khóa/mở khóa tài khoản khách hàng (4/4 PASS).
  - Phân hệ 15: Giới hạn bán lẻ 10 đôi, bảo mật IDOR, SQLi (17/17 PASS).
* **Kết luận:** **118 PASSED, 0 FAILED**.

### 4.3. Kiểm thử giao diện Responsive tự động (Playwright/Puppeteer Matrix)
Đã chạy kiểm thử giao diện thực tế trên 18 routes với 3 chế độ màn hình:
* **Desktop:** 1440 × 900
* **Tablet:** 768 × 1024
* **Mobile:** 390 × 844

| Nhóm người dùng | Các route đã kiểm thử | Desktop (1440) | Tablet (768) | Mobile (390) | Lỗi tràn ngang |
|---|---|:---:|:---:|:---:|:---:|
| **Guest (Khách vãng lai)** | `/`, `/products`, `/auth/login`, `/auth/register`, `/cart` | 200 OK | 200 OK | 200 OK | 0 |
| **Customer (Khách hàng)** | `/account/orders`, `/account/wishlist`, `/account/profile`, `/account/addresses`, `/checkout` | 200 OK | 200 OK | 200 OK | 0 |
| **Admin (Quản trị viên)** | `/admin/dashboard`, `/admin/products`, `/admin/orders`, `/admin/inventory`, `/admin/categories`, `/admin/vouchers`, `/admin/customers`, `/admin/banners` | 200 OK | 200 OK | 200 OK | 0 |

* **Tổng số kịch bản kiểm thử visual:** 54 kịch bản.
* **Lỗi HTTP (≥ 400):** **ZERO (0)**.
* **Lỗi tràn thanh cuộn ngang (Horizontal Overflow):** **0 (Không có bất kỳ màn hình nào bị tràn)**.
* **Toàn bộ 54 ảnh chụp màn hình kiểm định:** Đã được lưu vào thư mục `docs/maintenance/screenshots/`.

---

## MỤC 5: HIỆN TRẠNG THƯƠNG HIỆU VAMOS STORE VÀ TÀI NGUYÊN THIẾT KẾ

### 5.1. Nhận diện thương hiệu VAMOS STORE
* **Kiểm tra mã nguồn `src/`:** Xác nhận **100% không còn từ khóa thương hiệu ngoài (Biti's, Gosto)** xuất hiện trên giao diện sản phẩm.
* **Hệ thống logo và biểu tượng tĩnh (`src/public/images/`):**
  - `logo.svg` & `logo.png`: Logo chữ V bo góc sắc nét chuẩn thương hiệu VAMOS STORE.
  - `favicon.ico`: Biểu tượng tab trình duyệt đa kích thước, hiển thị chữ V đỏ nền đen.
  - `cod-trust-badge.png`: Huy hiệu cam kết đồng kiểm hàng trước khi thanh toán COD trích xuất từ thiết kế Stitch #19.
  - `placeholder-shoe.png`: Ảnh dự phòng vector dáng giày sneaker VAMOS.

### 5.2. Xử lý triệt để tệp `04_SAN_PHAM_YEU_THICH.png`
* **Nguyên nhân lỗi cũ (ngày 17/11):** Bản chụp cũ bị dính nền mờ của modal trang chủ và thiếu ảnh sneaker thật.
* **Xử lý hoàn tất (ngày 21/11):**
  - Trích xuất 3 hình ảnh sneaker chụp studio thực tế có logo V và chữ "VAMOS" dập nổi từ tài nguyên thiết kế của Stitch:
    1. `vamos-stride-x1.png` (Dòng Thể Thao Đen Đỏ Chuyên Nghiệp - VAMOS PERFORMANCE).
    2. `vamos-air-wave-v1.png` (Dòng Sneaker Xám Xanh Công Nghệ - VAMOS ORIGINALS).
    3. `vamos-retro-classic-1988.png` (Dòng Sneaker Cổ Điển Đế Gum - VAMOS HERITAGE).
  - Lưu trữ 3 ảnh sản phẩm chuẩn vào `src/public/images/products/`.
  - Re-render ảnh `04_SAN_PHAM_YEU_THICH.png` với kích thước chuẩn 2560px, hiển thị danh sách 3 đôi sneaker thực thụ, đầy đủ giá niêm yết, nhãn giảm giá, nút Mua ngay và Xem chi tiết.
  - Cập nhật đồng bộ vào `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/02_HINH_ANH_BAO_CAO/05_UI_CUSTOMER/04_SAN_PHAM_YEU_THICH.png` và `report/analysis_design_images/ui_cust_04_wishlist.png`.

### 5.3. Trạng thái 16 màn hình Stitch
* 16 màn hình thiết kế Stitch bản gốc được lưu trữ nguyên vẹn tại `docs/stitch/images/` để làm căn cứ đối chiếu thiết kế.
* Tệp `docs/design/reference/stitch_hero_mockup_crop.png` được lưu trữ riêng làm tài liệu tham khảo nội bộ, không phục vụ trên static web.
* 17 ảnh chụp giao diện trong hồ sơ báo cáo (`04_UI_GUEST`, `05_UI_CUSTOMER`, `06_UI_ADMIN`) đã hoàn toàn đồng nhất về phong cách, độ phân giải cao và chuẩn mực nhận diện thương hiệu VAMOS STORE.

---

## KẾT LUẬN VÀ KIẾN NGHỊ

1. Toàn bộ các yêu cầu của giảng viên và người dùng đã được giải quyết triệt để 100%: 11 sơ đồ Activity Diagram đã được đơn giản hóa chuẩn 2 swimlane; logic hủy đơn, danh mục và dashboard đã khớp hoàn toàn với source code; lỗi ảnh Wishlist và các hình ảnh giao diện đã được thay thế bằng hình ảnh sneaker VAMOS chính hãng sắc nét.
2. Hệ thống kiểm thử tự động (Pug 40/40, Regression 118/118, Visual 54/54) đều đạt tỷ lệ thành công tuyệt đối 100%.
3. Dự án VAMOS STORE đã ở trạng thái hoàn thiện cao nhất, sẵn sàng phục vụ báo cáo bảo vệ đồ án và triển khai thực tế.
