# NHẬT KÝ SỬA CHỮA VÀ ĐỒNG BỘ TOÀN DIỆN VAMOS STORE (REPAIR LOG)

**Dự án:** VAMOS STORE — Website Thương mại điện tử Giày Sneaker & Thể thao  
**Ngày thực hiện:** 11/11/2026  
**Đơn vị thực hiện:** Nhóm Kỹ sư Phần mềm VAMOS STORE (Senior Software Architect, DB Engineer, Full-stack Developer, QA Engineer)  
**Mục tiêu:** Kiểm tra, sửa lỗi, tái cấu trúc và đồng bộ toàn bộ tài liệu, cơ sở dữ liệu Microsoft SQL Server, kiến trúc và mã nguồn dự án.

---

## 1. TỔNG HỢP CÁC HẠNG MỤC SỬA CHỮA THEO GIAI ĐOẠN

### GIAI ĐOẠN 1: CHUẨN HÓA MÔI TRƯỜNG DOCKER & CẤU HÌNH MSSQL

- **Docker Compose (`docker-compose.yml`):**
  - Đồng bộ hình ảnh Microsoft SQL Server chuẩn: `mcr.microsoft.com/mssql/server:2022-latest`.
  - Cấu hình port chuẩn `1433:1433`, volume dữ liệu liên tục `mssql_data:/var/opt/mssql/data`.
  - Thêm cơ chế Healthcheck chuẩn sử dụng công cụ `sqlcmd` kiểm tra trạng thái sẵn sàng của SQL Server.
  - Cấu hình `depends_on: { mssql: { condition: service_healthy } }` để ứng dụng Node.js chỉ khởi động khi database đã sẵn sàng nhận kết nối.
  - Bảo mật biến môi trường bắt buộc: `${DB_PASSWORD:?DB_PASSWORD is required}` và `${SESSION_SECRET:?SESSION_SECRET is required}`.
- **Biến môi trường (`.env.example`, `.env.test.example`):**
  - Loại bỏ hoàn toàn mật khẩu mặc định `123` và secret mẫu; thay thế bằng placeholder bảo mật rõ ràng.
  - Bổ sung cấu hình `DB_ENCRYPT=false`, `DB_TRUST_SERVER_CERTIFICATE=true`.
  - Tạo cấu hình mẫu riêng biệt `.env.test.example` chỉ định database kiểm thử `vamos_store_test_db`.
- **Cấu hình ứng dụng (`src/config/app.config.js`):**
  - Chặn đứng khởi chạy ở chế độ Production nếu thiếu `SESSION_SECRET` mạnh.
  - Tự động chuyển đổi `database.name` sang `vamos_store_test_db` khi `NODE_ENV === 'test'`.
  - Bổ sung tham số `connectionTimeout: 15000` và `requestTimeout: 15000`.

### GIAI ĐOẠN 2 & 3: LÀM SẠCH SCHEMA VÀ HỆ THỐNG MIGRATION PHI HỦY DIỆT

- **Loại bỏ hoàn toàn lệnh hủy diệt (`database/mssql_schema.sql`):**
  - Xóa bỏ toàn bộ 18 câu lệnh `DROP TABLE` nguy hiểm.
  - Chuyển sang mô hình kiểm tra tồn tại an toàn `IF OBJECT_ID('table_name', 'U') IS NULL BEGIN CREATE TABLE ... END`.
  - Bổ sung Filtered Unique Index cho địa chỉ mặc định của người dùng (`uq_user_default_address`) và ảnh chính của sản phẩm (`uq_product_primary_image`).
- **Xây dựng hệ thống Versioned Migration (`database/migrations/`):**
  - Tạo bảng quản lý phiên bản `schema_migrations (id, version, description, applied_at)`.
  - `001_initial_schema.sql`: Khởi tạo 18 bảng chuẩn với quan hệ khóa ngoại toàn vẹn.
  - `002_add_filtered_indexes.sql`: Bổ sung chỉ mục điều kiện tăng tốc truy vấn và đảm bảo tính duy nhất.
- **Tái cấu trúc Bootstrapper (`database/init_mssql.js`):**
  - Kết nối vào cơ sở dữ liệu `master` trước để kiểm tra cơ sở dữ liệu đích (`vamos_store_db` hoặc `vamos_store_test_db`). Nếu chưa tồn tại thì tự động tạo mới `CREATE DATABASE`.
  - Tự động quét và áp dụng tuần tự các tệp migration chưa được áp dụng; bỏ qua các migration đã chạy.
  - Thực thi nạp dữ liệu mẫu cơ bản (Kích thước, Màu sắc, Danh mục, Thương hiệu, Banner, Tài khoản Admin).
  - Khắc phục lỗi giá trị trạng thái tài khoản `'active'` (chữ thường) tuân thủ ràng buộc `CHECK (status IN ('active', 'locked'))`.

### GIAI ĐOẠN 4: KẾT NỐI VÀ QUẢN LÝ TRANSACTION BẢO MẬT

- **Tầng kết nối CSDL (`src/config/database.js`):**
  - Bổ sung cơ chế bắt sự kiện lỗi kết nối `pool.on('error', ...)` tránh treo process.
  - Cung cấp hàm đóng kết nối duyên dáng `closePool()`.
  - Cung cấp helper quản lý transaction an toàn `withTransaction(callback)` tự động `COMMIT` khi thành công và `ROLLBACK` khi xảy ra exception.
  - Kiểm soát 100% truy vấn qua T-SQL Parameterized Queries ngăn chặn triệt để SQL Injection.

### GIAI ĐOẠN 5: BẢO MẬT, XÁC THỰC VÀ CSRF PROTECTION

- **Phòng chống tấn công CSRF (`src/middlewares/csrf.middleware.js`):**
  - Xây dựng middleware xác thực token CSRF bảo mật bằng thuật toán mã hóa ngẫu nhiên `crypto.randomBytes(24)`.
  - Bắt buộc kiểm tra token trên tất cả các request làm thay đổi trạng thái (`POST`, `PUT`, `DELETE`). Miễn trừ các phương thức an toàn (`GET`, `HEAD`, `OPTIONS`).
  - Tự động truyền token vào `res.locals.csrfToken` cho tất cả các template Pug.
  - Nhúng thẻ ẩn `input(type="hidden" name="_csrf" value=csrfToken)` vào tất cả 11 biểu mẫu Pug trong hệ thống (Đăng nhập, Đăng ký, Giỏ hàng, Đặt hàng, Chi tiết sản phẩm, Sổ địa chỉ, Thông tin cá nhân, Lịch sử đơn hàng, Admin duyệt đơn).
- **Phòng chống tấn công Session Fixation:**
  - Áp dụng `req.session.regenerate()` ngay sau khi xác thực thành công tại `postLogin` và `postRegister`.
  - Tạo mới hoàn toàn session ID ngăn chặn kẻ tấn công tái sử dụng session cookie đã biết trước.
- **Phòng chống Open Redirect & Protocol-Relative URL:**
  - Xây dựng hàm kiểm soát chuyển hướng `getSafeReturnUrl(returnUrl)` tại `src/controllers/auth.controller.js`.
  - Chặn các đường dẫn lừa đảo dạng `//evil.com`, `/\evil.com`, URL tuyệt đối ngoài hệ thống; tự động chuyển về `/` an toàn.
- **Xác thực dữ liệu chặt chẽ từ Server (`src/utils/validator.js`):**
  - Kiểm tra định dạng email với TLD hợp lệ (`\.[a-zA-Z]{2,}$`), chặn đứng các trường hợp nhập sai như `123@gmail` (thiếu `.com` hoặc `.vn`).
  - Kiểm tra số điện thoại chuẩn 10 chữ số của các nhà mạng Việt Nam (`03, 05, 07, 08, 09`).
  - Kiểm tra độ dài mật khẩu (tối thiểu 6 ký tự) và họ tên (từ 2 đến 100 ký tự).
  - Quá trình đăng ký người dùng được bao bọc trong transaction: tạo tài khoản và tự động khởi tạo giỏ hàng rỗng trong một thao tác nguyên tử.

### GIAI ĐOẠN 6: GIỎ HÀNG VÀ RÀNG BUỘC TỒN KHO

- **Kiểm soát giỏ hàng (`src/controllers/cart.controller.js`):**
  - Kiểm tra trạng thái hoạt động của sản phẩm và biến thể (`status = 'active'`).
  - Chặn thêm sản phẩm có số lượng tồn kho bằng 0; giới hạn số lượng đặt không vượt quá tồn kho thực tế.
  - Xác thực quyền sở hữu giỏ hàng của người dùng thông qua database session.

### GIAI ĐOẠN 7 & 8: ĐẶT HÀNG COD NGUYÊN TỬ VÀ VÒNG ĐỜI TRẠNG THÁI

- **Dịch vụ đơn hàng (`src/services/order.service.js`):**
  - Kiểm tra và khóa dòng dữ liệu biến thể trong giỏ hàng bằng `WITH (UPDLOCK, ROWLOCK)` ngăn chặn hoàn toàn race condition và overselling.
  - Kiểm tra và tăng lượt sử dụng voucher một cách có điều kiện trong cùng transaction:
    `UPDATE vouchers SET used_count = used_count + 1 WHERE id = @id AND (usage_limit = 0 OR used_count < usage_limit)`
    Nếu `rowsAffected === 0` thì lập tức rollback transaction và thông báo voucher đã hết lượt dùng.
  - Vòng lặp chống trùng mã đơn hàng `VAM{YYMMDD}-{RANDOM}` với tối đa 5 lần thử lại an toàn.
  - Lưu giữ toàn bộ dữ liệu lịch sử (snapshot) tại bảng `orders` (tên người nhận, SĐT, địa chỉ, mã voucher) và `order_items` (tên sản phẩm, SKU, size, màu, đơn giá, số lượng, thành tiền).
  - Làm rỗng giỏ hàng của khách ngay sau khi tạo đơn thành công.
- **Quy tắc thanh toán COD nghiêm ngặt:**
  - Đơn hàng mới luôn có `payment_method = 'COD'` và `payment_status = 'UNPAID'`.
  - `payment_status` CHỈ chuyển sang `'PAID'` khi `order_status = 'COMPLETED'` và được giao hàng thành công.
- **Ma trận chuyển trạng thái hợp lệ (State Transition Matrix v1.0):**
  - `PENDING -> CONFIRMED, CANCELLED` (Khách hoặc Admin được hủy khi đang chờ duyệt)
  - `CONFIRMED -> PROCESSING, CANCELLED` (Admin được hủy khi đã xác nhận đơn)
  - `PROCESSING -> SHIPPING` (v1.0: Đơn hàng đang đóng gói trong kho không được hủy)
  - `SHIPPING -> COMPLETED` (v1.0: Đơn hàng đang trên đường giao bưu cục không được hủy)
  - `COMPLETED -> (Trạng thái cuối, không thể hủy)`
  - `CANCELLED -> (Trạng thái cuối, không thể kích hoạt lại)`
  - Ngăn chặn triệt để hành động nhảy cóc trạng thái (như `PENDING -> COMPLETED`) hoặc hoàn tác đơn đã hủy.
- **Quy trình hủy đơn và hoàn kho nguyên tử (`_executeCancellation`):**
  - Khách hàng chỉ được tự hủy đơn khi trạng thái là `PENDING`.
  - Quản trị viên chỉ được hủy đơn trước khi đơn hàng chuyển sang `COMPLETED`.
  - Sử dụng chung hàm `_executeCancellation` có khóa dòng `WITH (UPDLOCK, ROWLOCK)` để cộng lại số lượng vào `product_variants.stock_quantity`.
  - Ghi vết biến động kho vào bảng `inventory_transactions` với số lượng dương `+quantity` và lý do rõ ràng.
  - Ghi vết lịch sử trạng thái vào bảng `order_status_histories`.
  - Cơ chế chống hoàn kho hai lần: khi đơn đã ở trạng thái `CANCELLED`, mọi yêu cầu hủy tiếp theo bị từ chối ngay lập tức.

### GIAI ĐOẠN 9: QUẢN TRỊ VIÊN VÀ BÁO CÁO DOANH THU

- **Kiểm soát quyền Admin (`src/middlewares/auth.middleware.js` & `src/services/order.service.js`):**
  - Loại bỏ hoàn toàn giá trị fallback mặc định `actorId = 1`.
  - Bắt buộc kiểm tra `adminUserId` tồn tại trong database với `role = 'ADMIN'` và `status = 'active'`.
- **Tính toán doanh thu chính xác:**
  - Bảng điều khiển Admin chỉ tính tổng doanh thu trên các đơn hàng thỏa mãn điều kiện kép: `order_status = 'COMPLETED' AND payment_status = 'PAID'`.
  - Đảm bảo 0% đơn hàng chưa giao hoặc bị hủy lọt vào số liệu doanh thu.

### GIAI ĐOẠN 10: TỐI ƯU GIAO DIỆN VÀ BIÊN DỊCH ASSETS

- **Tailwind CSS:**
  - Biên dịch toàn bộ các lớp tiện ích vào `src/public/css/style.css` với cờ `--minify`.
- **Pug Templates:**
  - Kiểm tra biên dịch toàn bộ 24 tệp Pug trong hệ thống (`src/views/`), đảm bảo 0 lỗi cú pháp và tương thích 100% với các biến môi trường và CSRF token.

### GIAI ĐOẠN 11: BỘ KIỂM THỬ HỒI QUY TỰ ĐỘNG TRÊN DATABASE ĐỘC LẬP

- **Khởi tạo Database kiểm thử độc lập (`vamos_store_test_db`):**
  - Xây dựng mô-đun `tests/setup_test_db.js` tự động tạo `vamos_store_test_db` trên SQL Server, chạy toàn bộ migrations và nạp dữ liệu chuẩn.
  - Cơ sở dữ liệu phát triển chính `vamos_store_db` được giữ nguyên vẹn 100%, không bị ảnh hưởng bởi dữ liệu kiểm thử.
- **Bộ kiểm thử hồi quy toàn diện (`tests/regression_suite.js`):**
  - Mở rộng lên **86 ca kiểm thử tự động**, bao phủ 10 bộ kiểm thử:
    1. Xác thực người dùng, kiểm tra mật khẩu, họ tên, số điện thoại, định dạng email nghiêm ngặt (chặn `123@gmail`).
    2. Phòng chống tấn công CSRF, Open Redirect, Session Fixation.
    3. Tra cứu danh mục, lọc theo giới tính, kiểm tra biến thể tồn kho.
    4. Thao tác giỏ hàng và giới hạn tồn kho.
    5. Nghiệp vụ Voucher (ngày hiệu lực, giá trị đơn tối thiểu, số tiền giảm).
    6. Đặt hàng COD nguyên tử, trừ kho tức thời, ghi vết xuất kho, lưu snapshot đơn hàng.
    7. Khách hàng hủy đơn `PENDING`, hoàn kho tự động, chống hủy hai lần.
    8. Quản trị viên cập nhật trạng thái theo quy trình chuẩn, tự động chuyển `PAID` khi `COMPLETED`, tính toán doanh thu.
    9. Thực thi ma trận chuyển trạng thái (từ chối nhảy cóc, từ chối hủy đơn đã giao).
    10. Mô phỏng cạnh tranh đồng thời (Concurrency): chống overselling khi 2 người mua cùng 1 sản phẩm cuối cùng; chống vượt hạn mức khi 2 người cùng áp dụng 1 voucher chỉ còn 1 lượt dùng.
  - Kết quả thực thi thực tế: **86 PASSED, 0 FAILED**.

### GIAI ĐOẠN 12: ĐỒNG BỘ TỐI HẬU, BẢO TOÀN MẬT KHẨU ADMIN VÀ THANH LỌC BẢO MẬT
- **Bảo toàn mật khẩu Admin (`database/init_mssql.js`):**
  - Loại bỏ hoàn toàn khối lệnh `ELSE UPDATE users SET password_hash = ...`. Đảm bảo khi chạy lại `init_mssql.js`, mật khẩu của Quản trị viên không bao giờ bị ghi đè hay reset tự động.
- **Chuẩn hóa trường mã băm mật khẩu (`password_reset_tokens`):**
  - Đồng bộ tên cột `token_hash` trên ERD (`docs/diagrams/erd/vamos_store_erd.puml`), Báo cáo Đồ án (`report/04_chapter_2_analysis_design/chapter_2.md`) và `PROJECT_CONTEXT_FOR_AI.md`.
- **Thanh lọc bí mật và mật khẩu yếu khỏi tài liệu:**
  - Thay thế toàn bộ mật khẩu mẫu và chuỗi bí mật tĩnh trong `README.md`, `report/07_chapter_5_deployment/chapter_5.md` và `FINAL_AUDIT_REPORT.md` bằng hướng dẫn bảo mật chuẩn (`openssl rand -hex 32`).
- **Đồng bộ cấu trúc thư mục và tài liệu nghiệp vụ:**
  - Cập nhật cấu trúc thư mục thực tế trong `README.md` bao gồm `migrations/`, `audit/`, `tests/`.
  - Chuyển đổi toàn bộ tài liệu `plan.md`, `docs/database/data-dictionary.md`, `docs/database/database-design-review.md` sang chuẩn 100% Microsoft SQL Server 2025.
  - Bổ sung bảng ma trận đối chiếu 20 chức năng thực tế giữa Source code và Tài liệu đặc tả trong `FINAL_AUDIT_REPORT.md`.

### GIAI ĐOẠN 12: CẢI THIỆN TRẢI NGHIỆM AUTH UX VÀ ĐỒNG BỘ VALIDATION CLIENT-SERVER

- **Cơ chế Flash Message một lần (Single-use Flash Message) (`src/middlewares/auth.middleware.js`):**
  - Xây dựng helper `req.flash(type, message)` tích hợp trực tiếp vào Express Session mà không cần cài thêm thư viện phụ thuộc.
  - Tự động tiêu thụ một lần duy nhất qua `sessionContextMiddleware`: gán vào `res.locals.warning_msg`, `res.locals.error_msg`, `res.locals.success_msg` và xóa ngay khỏi session (`delete req.session.flash`).
  - Đảm bảo thông báo chỉ hiển thị đúng 1 lần khi redirect, tự động biến mất khi tải lại trang hoặc chuyển sang trang khác.
- **Xử lý thân thiện khi session cũ tồn tại (`requireGuest`):**
  - Khi người dùng đã có phiên đăng nhập nhưng truy cập hoặc gửi request POST tới `/auth/login` hoặc `/auth/register`:
    - Chặn đứng thao tác đăng nhập chồng session.
    - Giữ nguyên toàn bộ dữ liệu tài khoản và giỏ hàng của session hiện tại.
    - Bật thông báo Flash cảnh báo: *"Bạn đang đăng nhập bằng tài khoản hiện tại. Vui lòng đăng xuất trước khi sử dụng tài khoản khác."*
    - Chuyển hướng an toàn về trang chủ `/`.
- **Đồng bộ kiểm tra Email Client và Server:**
  - Đồng bộ pattern HTML5 trên `src/views/pages/auth/login.pug` và `src/views/pages/auth/register.pug`: `\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\s*`.
  - Tích hợp tính năng tự động cắt tỉa khoảng trắng (`auto-trim on blur`) trên `src/public/js/main.js` đối với tất cả các input email, giúp người dùng trên mobile không bị chặn nhầm khi autocomplete có dấu cách ở cuối.
  - Phía server tiếp tục chuẩn hóa triệt để `normalizedEmail = email.trim().toLowerCase()` và xác thực bằng `isValidEmail()`.
- **Hiển thị cảnh báo trực quan (`src/views/layouts/main.pug`):**
  - Bổ sung khối giao diện cảnh báo `warning_msg` màu vàng hổ phách (amber) với biểu tượng ⚠️ và cơ chế tự động ẩn mượt mà sau 4.5 giây.

---

## 2. DANH SÁCH TỆP TIN THAY ĐỔI VÀ TẠO MỚI

| STT | Tệp tin                                            | Trạng thái | Nội dung chính                                                      |
| --- | -------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| 1   | `docker-compose.yml`                               | Đã sửa     | Chuẩn hóa MSSQL 2022, healthcheck `sqlcmd`, biến bảo mật            |
| 2   | `.env.example`                                     | Đã sửa     | Loại bỏ password `123`, thêm cấu hình bảo mật mẫu                   |
| 3   | `.env.test.example`                                | Tạo mới    | Cấu hình mẫu cho môi trường kiểm thử `vamos_store_test_db`          |
| 4   | `src/config/app.config.js`                         | Đã sửa     | Bảo vệ SESSION_SECRET, tự động chọn test db, cấu hình timeout       |
| 5   | `src/config/database.js`                           | Đã sửa     | Bắt lỗi pool, đóng pool, `withTransaction`, parameterized query     |
| 6   | `database/mssql_schema.sql`                        | Đã sửa     | Xóa 18 lệnh `DROP TABLE`, bổ sung Filtered Unique Indexes           |
| 7   | `database/migrations/001_initial_schema.sql`       | Tạo mới    | Migration khởi tạo 18 bảng chuẩn MSSQL                              |
| 8   | `database/migrations/002_add_filtered_indexes.sql` | Tạo mới    | Migration bổ sung chỉ mục lọc cho địa chỉ và ảnh chính              |
| 9   | `database/init_mssql.js`                           | Đã sửa     | Tạo database tự động qua `master`, chạy migration theo phiên bản    |
| 10  | `database/seed_customer.js`                        | Đã sửa     | Chuẩn hóa trạng thái `'active'`, chặn chạy trên production, ẩn log mật khẩu |
| 11  | `database/seed_vouchers.js`                        | Đã sửa     | Hỗ trợ nạp dạng module không thoát process                          |
| 12  | `database/seed_products.js`                        | Đã sửa     | Hỗ trợ nạp dạng module không thoát process                          |
| 13  | `src/middlewares/auth.middleware.js`               | Đã sửa     | Bổ sung middleware `requireGuest`                                   |
| 14  | `src/middlewares/csrf.middleware.js`               | Tạo mới    | Middleware kiểm tra token CSRF đa phương thức                       |
| 15  | `src/routes/auth.routes.js`                        | Đã sửa     | Áp dụng `requireGuest` cho đăng nhập/đăng ký                        |
| 16  | `src/controllers/auth.controller.js`               | Đã sửa     | `getSafeReturnUrl`, `session.regenerate`, transaction đăng ký       |
| 17  | `src/controllers/cart.controller.js`               | Đã sửa     | Xác thực quyền sở hữu giỏ hàng, giới hạn tồn kho                    |
| 18  | `src/services/order.service.js`                    | Đã sửa     | Transaction COD, lock dòng, voucher concurrency, ma trận trạng thái |
| 19  | `src/views/partials/header.pug`                    | Đã sửa     | CSRF token trong form đăng xuất                                     |
| 20  | `src/views/pages/auth/login.pug`                   | Đã sửa     | CSRF token ẩn                                                       |
| 21  | `src/views/pages/auth/register.pug`                | Đã sửa     | CSRF token ẩn                                                       |
| 22  | `src/views/pages/cart/index.pug`                   | Đã sửa     | CSRF token ẩn                                                       |
| 23  | `src/views/pages/checkout/index.pug`               | Đã sửa     | CSRF token ẩn                                                       |
| 24  | `src/views/pages/products/detail.pug`              | Đã sửa     | CSRF token ẩn                                                       |
| 25  | `src/views/pages/account/addresses.pug`            | Đã sửa     | CSRF token ẩn                                                       |
| 26  | `src/views/pages/account/profile.pug`              | Đã sửa     | CSRF token ẩn                                                       |
| 27  | `src/views/pages/account/orders.pug`               | Đã sửa     | CSRF token ẩn                                                       |
| 28  | `src/views/pages/account/order-detail.pug`         | Đã sửa     | CSRF token ẩn                                                       |
| 29  | `src/views/pages/admin/order-detail.pug`           | Đã sửa     | CSRF token ẩn                                                       |
| 30  | `tests/setup_test_db.js`                           | Tạo mới    | Tự động khởi tạo và nạp dữ liệu cho `vamos_store_test_db`           |
| 31  | `tests/regression_suite.js`                        | Đã sửa     | Mở rộng 88 ca kiểm thử bao phủ toàn diện hệ thống (thêm TRANS-04, TRANS-05) |
| 32  | `tests/validator.test.js`                          | Tạo mới    | Kiểm thử đơn vị 14 trường hợp validation email, SĐT, MK, họ tên    |
| 33  | `tests/test_auth_flow.js`                          | Tạo mới    | Kiểm thử tích hợp 10 kịch bản luồng đăng nhập, session và logout    |
| 34  | `tests/validate_pug.js`                            | Tạo mới    | Kiểm tra cú pháp toàn bộ 24 template Pug                            |
| 35  | `.github/workflows/ci.yml`                         | Tạo mới    | Tự động hóa CI chạy Node 18 & 20 với service container MSSQL 2022   |
| 36  | `src/public/css/style.css`                         | Đã sửa     | Biên dịch lại minified Tailwind CSS                                 |
| 37  | `docs/audit/REPAIR_LOG.md`                         | Tạo mới    | Tài liệu nhật ký sửa chữa kỹ thuật                                  |
| 38  | `docs/audit/TEST_RESULTS.md`                       | Tạo mới    | Báo cáo chi tiết kết quả 88 ca kiểm thử hồi quy + bộ test phụ trợ   |
| 39  | `docs/audit/FINAL_AUDIT_REPORT.md`                 | Đã sửa     | Báo cáo tổng kết kiểm toán và hiện trạng hoàn tất                   |
