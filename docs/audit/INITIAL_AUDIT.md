# 🔍 BÁO CÁO KIỂM KÊ TOÀN DIỆN BAN ĐẦU (INITIAL AUDIT REPORT)
## DỰ ÁN VAMOS STORE — HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ GIÀY DÉP
**Môn học:** JAV102 — FPT Polytechnic Đà Nẵng  
**Ngày thực hiện kiểm kê:** 11/11/2026  
**Nhánh Git kiểm tra:** `fix/vamos-store-consistency`  
**Đơn vị thực hiện:** Nhóm Chuyên gia Kỹ thuật Phần mềm (Software Architect, Full-Stack, MSSQL DBA, QA, Tech Writer)

---

## 1. TỔNG QUAN DỰ ÁN VÀ CẤU TRÚC WORKSPACE

### 1.1. Hiện trạng Git và Môi trường
- **Git Branch:** `fix/vamos-store-consistency` (nhánh làm việc độc lập tạo từ `main`).
- **Git Status:** Sạch, không có file bị xóa nhầm, không tự ý push lên remote GitHub.
- **Node.js Runtime:** `v24.21.0` (Tương thích Node 18+).
- **Hệ điều hành:** Windows 10 Pro x64.
- **Hệ quản trị CSDL thực tế:** `Microsoft SQL Server 2025 (RTM) - 17.0.1000.7 (X64) Enterprise Developer Edition (64-bit)` kết nối tại `127.0.0.1:1433`, CSDL: `vamos_store_db`.

### 1.2. Thống Kê Số Lượng Tệp Tin Trọng Yếu
| Loại tệp | Số lượng | Vị trí chính | Ghi chú |
|---|---|---|---|
| **JavaScript (.js)** | 28 | `src/`, `database/`, `server.js` | Controllers, Routes, Services, Config, Repositories, Seeds |
| **Pug Templates (.pug)** | 21 | `src/views/` | Layouts, Partials, Pages (Auth, Cart, Checkout, Admin, Products, Info) |
| **CSS (.css)** | 3 | `src/public/css/` | `input.css`, `style.css` (biên dịch từ Tailwind) |
| **SQL (.sql)** | 2 | `database/` | `mssql_schema.sql` (chuẩn) và `schema.sql` (tồn dư MySQL) |
| **Tài liệu Markdown (.md)** | 32 | `docs/`, `report/`, `labs/`, root | SRS, Data Dictionary, Business Rules, Báo cáo 6 chương |
| **Sơ đồ PlantUML (.puml)** | 11 | `docs/diagrams/` | Use Case, Activity, ERD |
| **Container & Config** | 6 | Root | `Dockerfile`, `docker-compose.yml`, `package.json`, `.env.example`, `.gitignore`, `tailwind.config.js` |

---

## 2. HIỆN TRẠNG TÍNH NĂNG ĐỐI CHIẾU VỚI SRS

| Tính năng theo SRS | Hiện trạng Mã nguồn | Trạng thái kỹ thuật |
|---|---|---|
| **Trang chủ & Banner** | `home.controller.js`, `home.pug` | ✅ Hoạt động tốt |
| **Bộ lọc sản phẩm đa tiêu chí** | `product.controller.js`, `product.repository.js`, `products/index.pug` | ✅ Hoạt động tốt, tham số hóa SQL chuẩn |
| **Chi tiết sản phẩm & Biến thể** | `product.controller.js`, `products/detail.pug` | ✅ Hoạt động tốt, chọn Size x Màu mượt mà |
| **Xác thực Đăng ký / Đăng nhập** | `auth.controller.js`, `validator.js`, `auth/*.pug` | ✅ Đã bảo mật bcryptjs và validate email RFC |
| **Giỏ hàng trực tuyến (Cart)** | `cart.controller.js`, `cart/index.pug` | ⚠️ Cần bổ sung kiểm tra tồn kho khi tăng số lượng, thiếu cập nhật số lượng qua nút |
| **Khuyến mãi Voucher** | `order.service.js`, `checkout.controller.js` | ⚠️ Chưa kiểm tra hạn dùng và chưa cập nhật số lượt dùng (`used_count`) |
| **Thanh toán COD & Trừ kho** | `checkout.controller.js`, `order.service.js` | ✅ Đã có transaction và khóa dòng `UPDLOCK, ROWLOCK` |
| **Sổ địa chỉ người dùng** | `account.controller.js`, `addresses.pug` | ❌ Lỗi nghiêm trọng: Tên cột không khớp DB (`phone_number`/`address_line`) |
| **Khách hàng hủy đơn PENDING** | `account.controller.js`, `order.service.js` | ✅ Hoạt động chuẩn, có hoàn kho tự động |
| **Admin chuyển trạng thái đơn** | `admin.controller.js`, `admin/order-detail.pug` | ❌ Lỗi nghiêm trọng: Dùng `DELIVERED` gây vi phạm Check Constraint DB |
| **Admin hủy đơn & Hoàn kho** | `admin.controller.js` | ⚠️ Hủy đơn thiếu ghi nhật ký `inventory_transactions` |
| **Admin Dashboard Doanh thu** | `admin.controller.js`, `admin/dashboard.pug` | ❌ Lỗi nghiệp vụ: Tính toàn bộ đơn chưa hủy vào doanh thu thay vì chỉ đơn `COMPLETED` |
| **Đồng bộ Docker & CSDL** | `docker-compose.yml`, `package.json` | ❌ Lỗi: Docker chạy MySQL 8 và còn dependency `mysql2` |

---

## 3. DANH SÁCH LỖI VÀ VẤN ĐỀ PHÁT HIỆN (DEFECT INVENTORY)

Dưới đây là danh mục chi tiết các lỗi được phân loại theo mức độ nghiêm trọng (**CRITICAL, HIGH, MEDIUM, LOW**) kèm mã định danh:

### Nhóm Cơ sở dữ liệu & Cấu hình (Database & Config)
- **`DB-001` [CRITICAL] Mâu thuẫn tên cột bảng `addresses`:**
  - *Mô tả:* CSDL MSSQL và Data Dictionary định nghĩa cột `phone` và `detail_address`. Tuy nhiên, `account.controller.js` (dòng 131, 139) lại chèn `phone_number` và `address_line`. Tương tự, `checkout.controller.js` và `addresses.pug` đọc `a.phone_number` và `a.address_line`.
  - *Hậu quả:* Người dùng bấm "Thêm địa chỉ" sẽ bị lỗi Runtime SQL Server crash: `Invalid column name 'phone_number'`, không lưu được địa chỉ.
- **`DB-002` [CRITICAL] Docker Compose cấu hình sai hệ quản trị CSDL (MySQL 8 thay vì MSSQL 2025):**
  - *Mô tả:* `docker-compose.yml` đang khai báo image `mysql:8.0`, biến `DB_HOST=mysql`, `MYSQL_DATABASE=vamos_store_db` và ánh xạ `./database/schema.sql`.
  - *Hậu quả:* Môi trường Docker không thể chạy được với backend Node.js đang kết nối driver `mssql`.
- **`DB-003` [HIGH] Tồn dư file schema và dependency MySQL:**
  - *Mô tả:* File `database/schema.sql` (MySQL 8) tồn tại song song với `database/mssql_schema.sql` (MSSQL). Trong `package.json` vẫn khai báo `"mysql2": "^3.12.0"` và từ khóa `"mysql8"`.
  - *Hậu quả:* Gây nhầm lẫn về nguồn dữ liệu chính thức, vi phạm nguyên tắc "chỉ duy nhất 1 CSDL MSSQL".
- **`DB-004` [MEDIUM] Hardcode tài khoản mặc định và thiếu biến mã hóa:**
  - *Mô tả:* `src/config/app.config.js` và `database/init_mssql.js` hardcode mật khẩu `sa` / `123`. `app.config.js` chưa đọc biến `DB_ENCRYPT`.

### Nhóm Nghiệp vụ & Đơn hàng (Business Logic & Orders)
- **`ORDER-001` [CRITICAL] Admin hủy đơn hàng không ghi `inventory_transactions`:**
  - *Mô tả:* Trong `admin.controller.js` (dòng 135-145), khi Admin chuyển trạng thái sang `CANCELLED`, code tự chạy truy vấn cộng lại kho nhưng hoàn toàn không ghi log vào bảng `inventory_transactions`, đồng thời không gọi qua `order.service.js`.
  - *Hậu quả:* Sai lệch sổ kiểm toán kho hàng, không tuân thủ tính nhất quán giữa luồng Khách hủy và Admin hủy.
- **`ORDER-002` [CRITICAL] Sử dụng trạng thái `DELIVERED` không tồn tại trong CSDL MSSQL:**
  - *Mô tả:* Trong `admin.controller.js` (dòng 149), `admin/order-detail.pug` (dòng 110), `admin/orders.pug` và `account/orders.pug`, trạng thái giao hàng thành công được gán là `DELIVERED`. Tuy nhiên, ràng buộc Check Constraint trong MSSQL là: `CHECK (order_status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'))`.
  - *Hậu quả:* Khi Admin chọn trạng thái này, SQL Server bắn lỗi `The UPDATE statement conflicted with the CHECK constraint "chk_orders_order_status"`. Trạng thái thanh toán không chuyển sang `PAID`.
- **`ORDER-003` [CRITICAL] Doanh thu Dashboard tính sai nguyên tắc COD:**
  - *Mô tả:* Câu lệnh SQL tại `admin.controller.js` (dòng 11) tính tổng tiền của tất cả các đơn `order_status != 'CANCELLED'`. Tức là các đơn COD mới tạo (`PENDING`), chưa thanh toán tiền mặt cũng bị tính vào tổng doanh thu.
  - *Hậu quả:* Số liệu tài chính bị phóng đại sai lệch, vi phạm trực tiếp đặc tả đồ án (doanh thu chỉ tính trên đơn `COMPLETED` và `PAID`).

### Nhóm Khuyến mãi & Giỏ hàng (Voucher & Cart)
- **`VOUCH-001` [HIGH] Chưa kiểm tra thời hạn và giới hạn lượt dùng voucher:**
  - *Mô tả:* Khi kiểm tra voucher tại `order.service.js`, truy vấn chỉ lọc `is_active = 1` mà bỏ qua điều kiện ngày tháng (`start_date <= GETDATE() AND end_date >= GETDATE()`) và số lượt dùng (`usage_limit > 0 AND used_count >= usage_limit`). Khi đặt hàng thành công, hệ thống không tăng `used_count`. Thiếu voucher `FREESHIP` trong dữ liệu seed.
  - *Hậu quả:* Voucher hết hạn vẫn dùng được, voucher giới hạn lượt vẫn dùng được vô hạn lần.
- **`CART-001` [HIGH] Không kiểm tra số lượng tồn kho khi cộng dồn giỏ hàng:**
  - *Mô tả:* Tại `cart.controller.js` (dòng 119), khi người dùng thêm sản phẩm đã có trong giỏ, code cộng thẳng `quantity + qty` mà không so khớp với `stock_quantity`. Thiếu endpoint cập nhật số lượng qua nút (+/-) và làm rỗng giỏ hàng.

### Nhóm Điều hướng & Giao diện (Routes & UI)
- **`ROUT-001` [MEDIUM] Đường dẫn `/admin` bị lỗi 404:**
  - *Mô tả:* `admin.routes.js` chỉ định nghĩa `/dashboard` mà không có route `/` dẫn đến Dashboard.
- **`ROUT-002` [LOW] Lỗi đường dẫn chính sách tại Footer:**
  - *Mô tả:* Footer liên kết tới `/policies/return`, nhưng `info.routes.js` chỉ bắt `returns`. Thiếu route tổng `/policy`.

### Nhóm Tài liệu & Đồ án (Documentation)
- **`DOC-001` [HIGH] Báo cáo đồ án và ERD mô tả sai hệ quản trị CSDL:**
  - *Mô tả:* Báo cáo tốt nghiệp (`report/BAO_CAO_DATN_VAMOS_STORE.md`, các chương trong `report/`) và sơ đồ `docs/diagrams/erd/vamos_store_erd.puml` vẫn viết về MySQL 8.0, InnoDB, `mysql2`, `SELECT ... FOR UPDATE` thay vì Microsoft SQL Server 2025, T-SQL và `WITH (UPDLOCK, ROWLOCK)`.

### Nhóm Kiểm thử (Testing)
- **`TEST-001` [HIGH] Thiếu bộ kịch bản kiểm thử hồi quy tự động:**
  - *Mô tả:* Chưa có kịch bản test tự động bao phủ các ca kiểm thử then chốt (Auth validation, Catalog filtering, Cart stock limits, Voucher bounds, Checkout transaction atomicity, Order status transitions, Cancellation inventory returns, Anti-overselling concurrency).

---

## 4. KẾT LUẬN VÀ BƯỚC TIẾP THEO

Tất cả các vấn đề trên đều đã được xác minh trực tiếp trên mã nguồn và cơ sở dữ liệu thực tế. Bước tiếp theo là lập kế hoạch sửa chữa chi tiết (**`docs/audit/REPAIR_PLAN.md`**) và tiến hành sửa chữa dứt điểm từng hạng mục theo đúng lộ trình đã đề ra.

