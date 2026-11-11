# 🛠 KẾ HOẠCH SỬA CHỮA VÀ ĐỒNG BỘ TOÀN DIỆN (REPAIR PLAN)
## DỰ ÁN VAMOS STORE — PHỤC HỒI TÍNH NHẤT QUÁN TOÀN HỆ THỐNG
**Môn học:** JAV102 — FPT Polytechnic Đà Nẵng  
**Ngày lập kế hoạch:** 11/11/2026  
**Nhánh Git áp dụng:** `fix/vamos-store-consistency`

---

## 1. NGUYÊN TẮC THI CÔNG SỬA CHỮA

1. **Tuyệt đối an toàn:** Không xóa dữ liệu CSDL hiện có, không chạy migration phá hủy, không reset Git.
2. **Thứ tự thực hiện:**
   - **Giai đoạn 1:** Cơ sở dữ liệu, Docker & Cấu hình môi trường.
   - **Giai đoạn 2:** Tầng Logic Backend (Database layer $\rightarrow$ Repository $\rightarrow$ Service $\rightarrow$ Middleware $\rightarrow$ Controller $\rightarrow$ Routes).
   - **Giai đoạn 3:** Tầng Giao diện Front-end (Pug Views, JavaScript, Tailwind CSS).
   - **Giai đoạn 4:** Tài liệu kỹ thuật, Sơ đồ và Báo cáo đồ án.
   - **Giai đoạn 5:** Kiểm thử tự động (Automated Regression Test Suite).
3. **Mỗi bước đều có kiểm chứng:** Thực thi kiểm tra ngay sau khi sửa.

---

## 2. MA TRẬN KẾ HOẠCH CHI TIẾT THEO TỪNG MÃ LỖI

### 1. `DB-001` — Sửa mâu thuẫn tên cột bảng `addresses`
- **Mức độ:** CRITICAL
- **Nguyên nhân:** Controller và View dùng `phone_number` và `address_line`, trong khi SQL Server schema và Data Dictionary dùng `phone` và `detail_address`.
- **Tệp tin ảnh hưởng:**
  - `src/controllers/account.controller.js`
  - `src/controllers/checkout.controller.js`
  - `src/views/pages/account/addresses.pug`
- **Phương án sửa chữa:**
  - Chuẩn hóa toàn bộ về `phone` và `detail_address`.
  - Trong `account.controller.js`: Cập nhật câu lệnh `INSERT INTO addresses (user_id, recipient_name, phone, province, district, ward, detail_address, is_default)`.
  - Trong `checkout.controller.js`: Đọc `defaultAddr.phone` và `defaultAddr.detail_address`.
  - Trong `addresses.pug`: Đổi input `name="phone"`, `name="detail_address"` và hiển thị `a.phone`, `a.detail_address`.
- **Rủi ro & Giảm thiểu:** Rất thấp. Cột trong DB đã có sẵn, chỉ cần sửa code cho khớp.
- **Cách kiểm chứng:** Chạy test thêm địa chỉ mới qua form và kiểm tra trực tiếp bản ghi trong SQL Server.

---

### 2. `DB-002` & `DB-003` — Đồng bộ Docker Compose & Loại bỏ MySQL
- **Mức độ:** CRITICAL & HIGH
- **Nguyên nhân:** `docker-compose.yml` vẫn cấu hình image MySQL 8, biến môi trường MySQL. Còn tồn tại file `database/schema.sql` (MySQL) và package `mysql2`.
- **Tệp tin ảnh hưởng:**
  - `docker-compose.yml`
  - `package.json`
  - `package-lock.json`
  - `database/schema.sql`
- **Phương án sửa chữa:**
  - Cập nhật `docker-compose.yml` chuyển sang image Microsoft SQL Server 2025 (`mcr.microsoft.com/mssql/server:2025-preview` hoặc bản ổn định), cấu hình `ACCEPT_EULA=Y`, `MSSQL_SA_PASSWORD`, port `1433:1433`, named volume `mssql_data`.
  - Cập nhật `app` service trong Docker Compose truyền các biến: `DB_TYPE=mssql`, `DB_SERVER=mssql`, `DB_PORT=1433`, `DB_USER=sa`, `DB_NAME=vamos_store_db`, `DB_TRUST_SERVER_CERTIFICATE=true`.
  - Xóa an toàn dependency `mysql2` khỏi `package.json` và cập nhật `package-lock.json` via `npm uninstall mysql2`.
  - Đổi tên hoặc lưu trữ `database/schema.sql` thành `database/archive_mysql_schema.sql.bak` để khẳng định `database/mssql_schema.sql` là nguồn chân lý duy nhất.
- **Rủi ro & Giảm thiểu:** Gỡ `mysql2` an toàn vì trong code `src/` không hề import `mysql2`.
- **Cách kiểm chứng:** `npm ls` sạch, `docker-compose config` hợp lệ, server khởi động không lỗi.

---

### 3. `DB-004` — Đồng bộ Cấu hình Biến Môi Trường (.env)
- **Mức độ:** MEDIUM
- **Nguyên nhân:** `src/config/app.config.js` và `database/init_mssql.js` hardcode mật khẩu, chưa đọc `DB_ENCRYPT`.
- **Tệp tin ảnh hưởng:**
  - `src/config/app.config.js`
  - `database/init_mssql.js`
  - `.env.example`
- **Phương án sửa chữa:**
  - `app.config.js`: Đọc `process.env.DB_ENCRYPT === 'true'`, không hardcode fallback password trong code.
  - `database/init_mssql.js`: Tái sử dụng `require('../src/config/app.config').db` để đồng nhất cấu hình kết nối.
  - `.env.example`: Đảm bảo đầy đủ các biến `DB_SERVER`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_ENCRYPT`, `DB_TRUST_SERVER_CERTIFICATE`.
- **Cách kiểm chứng:** Chạy kiểm tra kết nối với cấu hình nạp từ `.env`.

---

### 4. `ORDER-001` & `ORDER-002` — Chuẩn hóa Trạng thái `COMPLETED` và Hợp nhất Dịch vụ Hủy Đơn
- **Mức độ:** CRITICAL
- **Nguyên nhân:** Admin dùng trạng thái `DELIVERED` không có trong Check Constraint CSDL. Admin hủy đơn tự viết SQL trong Controller và thiếu ghi `inventory_transactions`.
- **Tệp tin ảnh hưởng:**
  - `src/services/order.service.js`
  - `src/controllers/admin.controller.js`
  - `src/views/pages/admin/order-detail.pug`
  - `src/views/pages/admin/orders.pug`
  - `src/views/pages/account/orders.pug`
- **Phương án sửa chữa:**
  - Xây dựng phương thức hợp nhất trong `order.service.js`: `updateOrderStatusByAdmin({ orderId, newStatus, adminUserId, note })`.
  - Toàn bộ trạng thái chuẩn hóa thành: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `COMPLETED`, `CANCELLED`. Loại bỏ 100% từ khóa `DELIVERED`.
  - Khi chuyển sang `COMPLETED`: Tự động cập nhật `payment_status = 'PAID'` (thu tiền COD thành công).
  - Khi chuyển sang `CANCELLED`: Kiểm tra nếu đơn chưa từng bị hủy $\rightarrow$ Khóa dòng biến thể $\rightarrow$ Hoàn tồn kho $\rightarrow$ Ghi nhật ký vào `inventory_transactions` $\rightarrow$ Ghi nhật ký `order_status_histories`. Đảm bảo trong 1 Transaction duy nhất!
  - Cập nhật các dropdown select và badge trong các file Pug thành `COMPLETED` ("Giao thành công / Đã nhận hàng").
- **Cách kiểm chứng:** Chạy test Admin chuyển trạng thái từ `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`, kiểm tra `payment_status` đổi sang `PAID`. Test Admin hủy đơn kiểm tra tồn kho tăng và có log trong `inventory_transactions`.

---

### 5. `ORDER-003` — Sửa Công Thức Doanh Thu Dashboard Chuẩn COD
- **Mức độ:** CRITICAL
- **Nguyên nhân:** Query tính doanh thu cộng cả các đơn `PENDING` chưa giao và chưa thanh toán.
- **Tệp tin ảnh hưởng:**
  - `src/controllers/admin.controller.js`
- **Phương án sửa chữa:**
  - Sửa câu lệnh SQL:
    ```sql
    SELECT COALESCE(SUM(total_amount), 0) AS total_revenue 
    FROM orders 
    WHERE order_status = 'COMPLETED' AND payment_status = 'PAID'
    ```
- **Cách kiểm chứng:** Kiểm tra số liệu doanh thu trên Dashboard chỉ phản ánh đúng các đơn đã hoàn thành.

---

### 6. `VOUCH-001` — Hoàn thiện Kiểm tra & Cập nhật Lượt Dùng Voucher
- **Mức độ:** HIGH
- **Nguyên nhân:** Không kiểm tra hạn dùng, không kiểm tra `usage_limit`, không tăng `used_count`, thiếu mã `FREESHIP`.
- **Tệp tin ảnh hưởng:**
  - `src/services/order.service.js`
  - `database/seed_vouchers.js`
- **Phương án sửa chữa:**
  - Kiểm tra voucher: Thêm điều kiện `GETDATE() BETWEEN start_date AND end_date` và `(usage_limit = 0 OR used_count < usage_limit)`.
  - Trong transaction tạo đơn `createCodOrder`: Nếu có áp dụng voucher, thực thi `UPDATE vouchers SET used_count = used_count + 1 WHERE id = @voucherId`.
  - Bổ sung voucher `FREESHIP` (giảm 30.000đ cho đơn từ 300.000đ) vào `database/seed_vouchers.js`.
- **Cách kiểm chứng:** Test tạo đơn với voucher, kiểm tra `used_count` trong DB tăng lên 1. Test voucher hết hạn hoặc hết lượt bị từ chối.

---

### 7. `CART-001` — Kiểm tra Tồn Kho và Bổ sung Thao tác Giỏ Hàng
- **Mức độ:** HIGH
- **Nguyên nhân:** Thêm dồn sản phẩm không kiểm tra tồn kho. Thiếu nút cập nhật số lượng và xóa giỏ.
- **Tệp tin ảnh hưởng:**
  - `src/controllers/cart.controller.js`
  - `src/routes/cart.routes.js`
  - `src/views/pages/cart/index.pug`
- **Phương án sửa chữa:**
  - Trong `addItem`: Kiểm tra `currentQty + addQty <= variant.stock_quantity`. Nếu vượt, báo lỗi rõ ràng hoặc giới hạn về mức tối đa.
  - Thêm phương thức `updateItem`: Cập nhật số lượng trực tiếp kèm kiểm tra tồn kho.
  - Thêm phương thức `clearCart`: Làm rỗng toàn bộ giỏ hàng của người dùng.
  - Bổ sung routes: `POST /cart/update`, `POST /cart/clear`.
  - Cập nhật giao diện `cart/index.pug`: Hỗ trợ form cập nhật số lượng (+ / -) và nút dọn giỏ hàng.
- **Cách kiểm chứng:** Test thêm sản phẩm vượt tồn kho bị chặn; test nút cập nhật số lượng hoạt động trơn tru.

---

### 8. `ROUT-001` & `ROUT-002` — Hoàn thiện Định Tuyến URL
- **Mức độ:** MEDIUM & LOW
- **Nguyên nhân:** `/admin` 404, `/policies/return` 404.
- **Tệp tin ảnh hưởng:**
  - `src/routes/admin.routes.js`
  - `src/routes/info.routes.js`
  - `src/views/partials/footer.pug`
- **Phương án sửa chữa:**
  - `admin.routes.js`: Thêm `router.get('/', (req, res) => res.redirect('/admin/dashboard'))`.
  - `info.routes.js`: Hỗ trợ cả `return` và `returns`, thêm route `router.get('/policy', ...)`.
- **Cách kiểm chứng:** Truy cập `/admin`, `/policies/return`, `/policy` trả về HTTP 200/302 hợp lệ.

---

### 9. `DOC-001` — Đồng bộ Tài Liệu, Sơ Đồ ERD & Báo Cáo sang MSSQL 2025
- **Mức độ:** HIGH
- **Nguyên nhân:** Báo cáo đồ án và sơ đồ ERD còn mang tàn dư MySQL 8.
- **Tệp tin ảnh hưởng:**
  - `docs/diagrams/erd/vamos_store_erd.puml`
  - `report/BAO_CAO_DATN_VAMOS_STORE.md`
  - Các file chương trong `report/`
  - `README.md`
- **Phương án sửa chữa:**
  - Cập nhật `vamos_store_erd.puml`: Tiêu đề Microsoft SQL Server 2025, kiểu dữ liệu T-SQL (`NVARCHAR`, `DATETIME2`, `BIT`, `INT IDENTITY`).
  - Cập nhật các chương báo cáo: Đồng bộ công nghệ sang Microsoft SQL Server 2025, driver `mssql`, transaction và khóa bi quan T-SQL `WITH (UPDLOCK, ROWLOCK)`.
- **Cách kiểm chứng:** Tìm kiếm không còn văn bản nào mâu thuẫn về hệ quản trị CSDL.

---

### 10. `TEST-001` — Xây dựng Bộ Kiểm thử Hồi quy Toàn diện
- **Mức độ:** HIGH
- **Phương án:** Tạo script kiểm thử tự động `tests/regression_suite.js` thực thi trực tiếp các ca kiểm thử:
  1. `AUTH`: Đăng ký, đăng nhập, validate email RFC, mật khẩu, chặn tài khoản khóa.
  2. `PRODUCT`: Lọc danh mục, tìm kiếm, chi tiết biến thể.
  3. `CART`: Thêm vào giỏ, chặn số lượng vượt tồn kho, cập nhật số lượng, xóa item.
  4. `VOUCHER`: Kiểm tra hạn dùng, ngưỡng tối thiểu, khấu trừ hợp lệ, tăng `used_count`.
  5. `CHECKOUT`: Giao dịch đặt hàng COD, trừ kho tức thì, ghi snapshot `order_items`, ghi `inventory_transactions`.
  6. `ORDER`: Khách hủy đơn `PENDING` hoàn kho; Admin chuyển trạng thái sang `COMPLETED` đổi `PAID`; Admin hủy đơn hoàn kho có kiểm toán.
  7. `CONCURRENCY`: Khóa dòng `WITH (UPDLOCK, ROWLOCK)` ngăn chặn bán vượt tồn kho (*Anti-Overselling*).
- **Cách kiểm chứng:** Chạy script và ghi nhận kết quả thực tế đạt 100% PASS.

