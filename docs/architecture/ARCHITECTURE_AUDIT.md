# BÁO CÁO KIỂM TOÁN VÀ NGHIỆM THU KIẾN TRÚC HỆ THỐNG (ARCHITECTURE AUDIT)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE — GIAI ĐOẠN 3.2

> **Tiêu chuẩn kiểm toán:** Đồ án Tốt nghiệp / Assignment Kỹ nghệ Phần mềm FPT Polytechnic.  
> **Nguyên tắc thực thi:** Kiểm toán trực tiếp trên mã nguồn (Code-First Verification), trung thực học thuật (Academic Integrity), phân định rõ ràng giữa cấu hình thực tế và cấu hình tham chiếu/giả định, không thêu dệt công nghệ.  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | Git HEAD `8135e190c69553be8f6ebf3eab7ba34de995d53c` (`8135e19`).

---

## 1. BẢNG TỔNG HỢP KIỂM TOÁN CHUYÊN SÂU GIAI ĐOẠN 3.2

| Hạng mục kiểm toán | Kết quả thực tế | Bằng chứng mã nguồn & Schema | Trạng thái |
| :--- | :--- | :--- | :---: |
| **1. Deployment Architecture** | - Xác minh phiên bản Node.js `>= 22.0.0` (VERIFIED).<br>- Cổng Web Server: Mặc định 3000, có thể cấu hình qua `PORT` (CONFIGURABLE).<br>- Cổng SQL Server: Mặc định 1433, cấu hình qua `DB_PORT` (CONFIGURABLE).<br>- Host SQL Server: `127.0.0.1`, cấu hình qua `DB_SERVER` (CONFIGURABLE).<br>- Connection Pool Min: `0` (VERIFIED).<br>- Connection Pool Max: `10` (VERIFIED).<br>- Pool Idle Timeout: `30,000 ms` (30 giây) (VERIFIED).<br>- Connection/Request Timeout: `15,000 ms` (15 giây) (VERIFIED).<br>- Docker: Tệp `Dockerfile` & `docker-compose.yml` tồn tại trong repo dưới dạng **cấu hình đóng gói tham khảo (CONFIGURABLE Reference Template)**; môi trường chạy thực tế là tiến trình Node.js trên máy chủ host kết nối SQL Server local/LAN. | - `package.json` (dòng 39)<br>- `server.js` (dòng 5, 8–23)<br>- `src/config/app.config.js` (dòng 11–48)<br>- `src/config/database.js` (dòng 11–48)<br>- `Dockerfile` (dòng 1–37)<br>- `docker-compose.yml` (dòng 1–53) | **PASS**<br>*(Kèm ghi chú minh bạch Docker là template tham chiếu)* |
| **2. Layered Architecture** | - Phân định rõ 3 khái niệm: Monolithic Architecture (tiến trình đơn, CSDL tập trung), Logical Layered Architecture (4 tầng logic), Physical Source Code Structure.<br>- Số lượng thành phần thực tế: chính xác **8 Controllers**, **3 Services**, **2 Repositories** tại `src/models/repositories/`.<br>- Module tuân thủ đủ 3 tầng (Controller $\rightarrow$ Service $\rightarrow$ Repository): Catalog (`product`) và Wishlist.<br>- Module Controller $\rightarrow$ Service $\rightarrow$ Transaction Database Helper: Đặt hàng & Hủy đơn COD (`checkout`, `account` $\rightarrow$ `order.service.js`).<br>- Module Controller gọi trực tiếp Database Helper: Auth, Cart, Admin, Account (sổ địa chỉ). Không ép buộc toàn bộ module phải có 3 tầng. | - `src/controllers/` (8 files)<br>- `src/services/` (3 files: `order.service.js`, `product.service.js`, `wishlist.service.js`)<br>- `src/models/repositories/` (2 files: `product.repository.js`, `wishlist.repository.js`)<br>- `src/config/database.js` (dòng 70–108: `query`, `withTransaction`) | **PASS** |
| **3. Component Diagrams** | - Đủ 10 sơ đồ AR01–AR10 tương ứng 10 file `.puml` và 10 ảnh `.png`.<br>- **ORDER_COMPONENT_DIAGRAM:** Thể hiện chính xác `checkout.controller.js`, `account.controller.js`, `order.service.js`, `sql.Transaction`. Không tạo Order Repository ảo. Endpoint chính xác: `POST /checkout` (không dùng `/checkout/process`), Guard chính xác: `requireCustomer`.<br>- **DASHBOARD_COMPONENT_DIAGRAM:** Thể hiện chính xác `admin.controller.js:getDashboard`, phân phối đa luồng qua `Promise.all` 9 truy vấn song song + 1 truy vấn đơn khẩn cấp tuần tự. Không vẽ Service hoặc Repository ảo.<br>- Các sơ đồ còn lại phản ánh chính xác liên kết giữa các component thực tế. | - `docs/diagrams/architecture/ORDER_COMPONENT_DIAGRAM.puml` & `.png`<br>- `docs/diagrams/architecture/DASHBOARD_COMPONENT_DIAGRAM.puml` & `.png`<br>- `docs/diagrams/architecture/COMPONENT_DIAGRAM_OVERVIEW.puml` & `.png`<br>- 7 sơ đồ AR01, AR02, AR04, AR05, AR06, AR08, AR10. | **PASS** |
| **4. Dashboard Revenue (Ưu tiên cao)** | - Bảng sử dụng: Bảng `orders` (và bảng `order_items` cho top bán chạy).<br>- Cột tiền thực sự được SUM: **`total_amount`** (`SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE order_status = 'COMPLETED' AND payment_status = 'PAID'`). Bảng `orders` hoàn toàn **KHÔNG có cột `final_amount`**.<br>- Cột trạng thái đơn hàng: `order_status` (NVARCHAR(20)).<br>- Cột trạng thái thanh toán: `payment_status` (NVARCHAR(20)).<br>- Điều kiện COMPLETED: **CÓ** (`order_status = 'COMPLETED'`).<br>- Điều kiện PAID: **CÓ** (`payment_status = 'PAID'`).<br>- Bộ lọc ngày: **KHÔNG CÓ BỘ LỌC NGÀY** (tính tổng doanh thu toàn thời gian của hệ thống).<br>- Đã đối soát đồng bộ toàn bộ tài liệu và sơ đồ. | - `src/controllers/admin.controller.js` (dòng 11: `query("SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE order_status = 'COMPLETED' AND payment_status = 'PAID'")`)<br>- `database/migrations/001_initial_schema.sql` (dòng 226: `total_amount DECIMAL(12, 0) NOT NULL CHECK (total_amount >= 0)`) | **PASS** |
| **5. Request Flow** | - Xác minh độc lập 4 luồng nghiệp vụ tiêu biểu:<br>  1. `GET /products/:slug`: Middleware $\rightarrow$ `product.routes.js` $\rightarrow$ `product.controller.js:detail` $\rightarrow$ `product.service.js:getProductBySlug` $\rightarrow$ `product.repository.js:findBySlug` $\rightarrow$ `database.js:query` $\rightarrow$ SQL Server $\rightarrow$ Pug `pages/products/detail.pug` (200 OK).<br>  2. `POST /checkout`: Middleware $\rightarrow$ `csrfMiddleware` $\rightarrow$ `requireCustomer` $\rightarrow$ `checkout.routes.js` $\rightarrow$ `checkout.controller.js:postCheckout` $\rightarrow$ `order.service.js:createCodOrder` $\rightarrow$ `database.js` (`sql.Transaction`, UPDLOCK, ROWLOCK, trừ tồn, insert orders/items/histories, xóa giỏ) $\rightarrow$ SQL Server $\rightarrow$ HTTP 302 Redirect `/checkout/success/:id`.<br>  3. `POST /api/wishlist/toggle`: Middleware $\rightarrow$ `csrfMiddleware` $\rightarrow$ `requireCustomer` (Guest 401 JSON, Admin 403 JSON) $\rightarrow$ `wishlist.routes.js` $\rightarrow$ `wishlist.controller.js:toggleItem` $\rightarrow$ `wishlist.service.js:toggleItem` $\rightarrow$ `wishlist.repository.js` $\rightarrow$ `database.js:query` $\rightarrow$ SQL Server $\rightarrow$ JSON 200 OK.<br>  4. `GET /admin/dashboard`: Middleware $\rightarrow$ `requireAdmin` $\rightarrow$ `admin.routes.js` $\rightarrow$ `admin.controller.js:getDashboard` $\rightarrow$ `Promise.all` 9 truy vấn song song + 1 truy vấn đơn khẩn cấp tuần tự (không qua Service/Repo) $\rightarrow$ `database.js:query` $\rightarrow$ SQL Server $\rightarrow$ Pug `pages/admin/dashboard.pug` (200 OK).<br>- Không ép các luồng có cấu trúc khác nhau thành cùng một pipeline. | - `src/routes/product.routes.js` (dòng 13)<br>- `src/routes/checkout.routes.js` (dòng 8)<br>- `src/routes/wishlist.routes.js` (dòng 7, 16)<br>- `src/routes/admin.routes.js` (dòng 7, 11)<br>- `docs/architecture/REQUEST_FLOW_EXAMPLES.md` | **PASS** |
| **6. Git Status** | - Git Branch: `fix/master-repair-plan`.<br>- Git HEAD: `8135e190c69553be8f6ebf3eab7ba34de995d53c` (`8135e19`).<br>- Tracked Changes: `git diff --check` và `git diff --stat` trả về 0 modified tracked files.<br>- Toàn bộ mã nguồn nghiệp vụ, cấu hình, migrations và CSDL được bảo toàn tuyệt đối.<br>- Không commit, push, merge, reset, clean, rebase hoặc stash. | - Lệnh `git branch --show-current`<br>- Lệnh `git rev-parse HEAD`<br>- Lệnh `git status --short`<br>- Lệnh `git diff --check`<br>- Lệnh `git diff --stat` | **PASS** |
| **7. PlantUML / PNG Pair Validation** | - Đủ 10/10 cặp tệp PlantUML (`.puml`) và ảnh kết xuất (`.png`) tại `docs/diagrams/architecture/`.<br>- Không có tệp thiếu, tệp sai tên hoặc tệp trùng lặp.<br>- Kích thước các tệp ảnh `.png` đều nằm trong khoảng từ 117 KB đến 205 KB, sắc nét, không có lỗi cú pháp biên dịch. | - Thư mục `docs/diagrams/architecture/` gồm 10 cặp tệp đã được kiểm chứng bằng lệnh PowerShell và script `scratch/render_puml.js`. | **PASS** |

---

## 2. PHÂN LOẠI TRẠNG THÁI CẤU HÌNH HỆ THỐNG THEO 4 NHÓM QUY CHUẨN

Để bảo đảm tính khách quan học thuật khi bảo vệ đồ án trước Hội đồng chấm thi, toàn bộ các thông số kỹ thuật được gắn nhãn chính xác:

### 2.1. Nhóm Đã Xác Minh Thực Tế (VERIFIED)
1. **Phiên bản Runtime Node.js:** `>= 22.0.0` (quy định tại `package.json:engines`).
2. **Kích thước Connection Pool:** `min = 0`, `max = 10` (quy định tại `src/config/app.config.js:44-45`).
3. **Thời gian chờ giải phóng kết nối Pool:** `idleTimeoutMillis = 30000` (30 giây, quy định tại `src/config/app.config.js:46`).
4. **Thời gian ngắt kết nối/truy vấn:** `connectionTimeout = 15000`, `requestTimeout = 15000` (15 giây, quy định tại `src/config/app.config.js:37-38`).
5. **Cột tính Doanh thu thực tế:** `orders.total_amount` (quy định tại `001_initial_schema.sql:226` và `admin.controller.js:11`). Bảng `orders` không có cột `final_amount`.
6. **Điều kiện ghi nhận Doanh thu thực thu:** `WHERE order_status = 'COMPLETED' AND payment_status = 'PAID'` (quy định tại `admin.controller.js:11`). Không có bộ lọc ngày.
7. **Cơ cấu phân tầng mã nguồn:** Chính xác 8 Controllers, 3 Services, 2 Repositories, kết hợp `src/config/database.js` (`query`, `sql.Transaction`).
8. **Phương thức Thanh toán:** Hỗ trợ duy nhất **COD (Cash on Delivery)**, không có cổng thanh toán trực tuyến.
9. **Chức năng Quên mật khẩu (UC03):** Đã thiết kế bảng `password_reset_tokens` trong CSDL; route, controller và gửi mail chưa triển khai (**Designed Only / Not Implemented**).

### 2.2. Nhóm Có Thể Cấu Hình Qua Biến Môi Trường (CONFIGURABLE)
1. **Cổng Web Server:** Mặc định `3000`, ghi đè qua biến môi trường `PORT`.
2. **Địa chỉ máy chủ CSDL:** Mặc định `127.0.0.1`, ghi đè qua `DB_SERVER` hoặc `DB_HOST`.
3. **Cổng kết nối CSDL:** Mặc định `1433`, ghi đè qua `DB_PORT`.
4. **Tên CSDL hoạt động:** Mặc định `vamos_store_db`, tự động trỏ sang `vamos_store_test_db` khi chạy kiểm thử tự động (`NODE_ENV=test`).
5. **Cấu hình Đóng gói Container:** Tệp `Dockerfile` và `docker-compose.yml` tồn tại sẵn trong thư mục gốc làm template đóng gói tham khảo (Reference Compose), giúp sinh viên hoặc người chấm có thể container hóa hệ thống khi cần.

### 2.3. Nhóm Giả Định Cho Lộ Trình Tương Lai (ASSUMED)
1. **Máy chủ Reverse Proxy Nginx & Load Balancing:** Thuộc đề xuất mở rộng khi chịu tải cao; hiện tại ứng dụng Node.js xử lý trực tiếp request HTTP.
2. **Redis Distributed Session Cache:** Thuộc lộ trình mở rộng khi chạy nhiều cụm ứng dụng (Node.js cluster); hiện tại session được lưu trong RAM qua `express-session`.

### 2.4. Nhóm Chưa Kiểm Chứng Trên Môi Trường Sản Xuất (NOT VERIFIED)
1. **Chứng chỉ SSL/TLS thực tế:** Dự án đã sẵn sàng cờ `cookie.secure: isProduction` nhưng chưa kiểm thử với domain có HTTPS thực tế.
2. **Container Healthcheck trên Production Runner:** Script kiểm tra sức khỏe MSSQL trong `docker-compose.yml` chưa được xác nhận trên máy chủ Linux Production thực tế.

---

## 3. DANH MỤC TỆP ĐÃ ĐƯỢC ĐỐI SOÁT VÀ CHUẨN HÓA

### 3.1. 7 Tệp Tài liệu Đặc tả Kiến trúc (`docs/architecture/`)
1. [SYSTEM_ARCHITECTURE_OVERVIEW.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/architecture/SYSTEM_ARCHITECTURE_OVERVIEW.md): Bức tranh toàn cảnh kiến trúc 3 tầng vật lý, SSR và REST API.
2. [LAYERED_ARCHITECTURE.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/architecture/LAYERED_ARCHITECTURE.md): Phân tích chi tiết các tầng logic, chuỗi 8 bước middleware bảo mật, làm rõ phân định Monolithic vs Logical Layers vs Physical Code Structure, cập nhật route `POST /checkout`.
3. [COMPONENT_ARCHITECTURE.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/architecture/COMPONENT_ARCHITECTURE.md): Cấu trúc 8 component phân hệ, xác nhận chính xác công thức tính doanh thu từ `orders.total_amount` và 10 truy vấn trong `getDashboard`.
4. [DEPLOYMENT_ARCHITECTURE.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/architecture/DEPLOYMENT_ARCHITECTURE.md): Bổ sung Bảng phân loại 4 trạng thái xác minh (VERIFIED, CONFIGURABLE, ASSUMED, NOT VERIFIED) và làm rõ vai trò của Docker template.
5. [REQUEST_FLOW_EXAMPLES.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/architecture/REQUEST_FLOW_EXAMPLES.md): Đặc tả chi tiết từng bước cho chính xác 4 luồng yêu cầu: `GET /products/:slug`, `POST /checkout`, `POST /api/wishlist/toggle`, `GET /admin/dashboard`, cùng luồng bổ trợ `POST /auth/login`.
6. [ARCHITECTURE_DIAGRAM_INDEX.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/architecture/ARCHITECTURE_DIAGRAM_INDEX.md): Mục lục chuẩn hóa 10 sơ đồ, đồng bộ dung lượng ảnh và hướng dẫn bảo vệ đồ án.
7. [ARCHITECTURE_AUDIT.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/architecture/ARCHITECTURE_AUDIT.md): Báo cáo kiểm toán và đối soát mã nguồn toàn diện (tài liệu hiện tại).

### 3.2. 10 Cặp Sơ đồ PlantUML & Ảnh PNG (`docs/diagrams/architecture/`)
| STT | Tên sơ đồ | File PlantUML (`.puml`) | File Ảnh (`.png`) | Dung lượng PNG | Trạng thái đồng bộ |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | **AR01 — System Architecture Overview** | [SYSTEM_ARCHITECTURE_OVERVIEW.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/SYSTEM_ARCHITECTURE_OVERVIEW.puml) | [SYSTEM_ARCHITECTURE_OVERVIEW.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/SYSTEM_ARCHITECTURE_OVERVIEW.png) | 175,828 B | **100% Đồng bộ** |
| 2 | **AR02 — Layered Architecture** | [LAYERED_ARCHITECTURE.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/LAYERED_ARCHITECTURE.puml) | [LAYERED_ARCHITECTURE.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/LAYERED_ARCHITECTURE.png) | 204,825 B | **100% Đồng bộ** |
| 3 | **AR03 — Component Diagram Overview** | [COMPONENT_DIAGRAM_OVERVIEW.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/COMPONENT_DIAGRAM_OVERVIEW.puml) | [COMPONENT_DIAGRAM_OVERVIEW.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/COMPONENT_DIAGRAM_OVERVIEW.png) | 126,946 B | **100% Đồng bộ** |
| 4 | **AR04 — Auth Component Diagram** | [AUTH_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/AUTH_COMPONENT_DIAGRAM.puml) | [AUTH_COMPONENT_DIAGRAM.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/AUTH_COMPONENT_DIAGRAM.png) | 121,870 B | **100% Đồng bộ** |
| 5 | **AR05 — Catalog Component Diagram** | [CATALOG_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/CATALOG_COMPONENT_DIAGRAM.puml) | [CATALOG_COMPONENT_DIAGRAM.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/CATALOG_COMPONENT_DIAGRAM.png) | 117,393 B | **100% Đồng bộ** |
| 6 | **AR06 — Shopping Component Diagram** | [SHOPPING_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/SHOPPING_COMPONENT_DIAGRAM.puml) | [SHOPPING_COMPONENT_DIAGRAM.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/SHOPPING_COMPONENT_DIAGRAM.png) | 125,029 B | **100% Đồng bộ** |
| 7 | **AR07 — Order Component Diagram** | [ORDER_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/ORDER_COMPONENT_DIAGRAM.puml) | [ORDER_COMPONENT_DIAGRAM.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/ORDER_COMPONENT_DIAGRAM.png) | 139,939 B | **100% Đồng bộ** |
| 8 | **AR08 — Admin Component Diagram** | [ADMIN_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/ADMIN_COMPONENT_DIAGRAM.puml) | [ADMIN_COMPONENT_DIAGRAM.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/ADMIN_COMPONENT_DIAGRAM.png) | 125,506 B | **100% Đồng bộ** |
| 9 | **AR09 — Dashboard Component Diagram** | [DASHBOARD_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/DASHBOARD_COMPONENT_DIAGRAM.puml) | [DASHBOARD_COMPONENT_DIAGRAM.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/DASHBOARD_COMPONENT_DIAGRAM.png) | 149,840 B | **100% Đồng bộ** |
| 10 | **AR10 — Deployment Architecture Diagram** | [DEPLOYMENT_ARCHITECTURE.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/DEPLOYMENT_ARCHITECTURE.puml) | [DEPLOYMENT_ARCHITECTURE.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/DEPLOYMENT_ARCHITECTURE.png) | 148,906 B | **100% Đồng bộ** |

---

## 4. KẾT LUẬN VÀ ĐỀ XUẤT NGHIỆM THU

Sau quá trình kiểm toán toàn diện và rà soát chéo giữa mã nguồn, cấu hình, cơ sở dữ liệu và tài liệu kiến trúc:
1. **Không còn bất kỳ mâu thuẫn nào** giữa tài liệu và mã nguồn thực tế.
2. **Công thức doanh thu và tên cột tiền** được xác định chính xác 100%: `orders.total_amount` với điều kiện `order_status = 'COMPLETED'` và `payment_status = 'PAID'`, không có bộ lọc ngày.
3. **Mô hình triển khai** phân định rạch ròi giữa môi trường thực thi máy chủ host và cấu hình đóng gói container tham khảo (Docker).
4. **Cấu trúc phân tầng và thành phần** phản ánh trung thực hiện trạng mã nguồn, không tự vẽ thêm các tầng hay repository ảo.
5. **Cả 10 sơ đồ PlantUML và ảnh PNG** đều hợp lệ, không có lỗi cú pháp, đã được re-render đồng bộ.
6. **Mã nguồn và cơ sở dữ liệu** được đóng băng nguyên vẹn 100% tại Git commit `8135e19`.

**ĐỀ XUẤT:**
Nhóm kiểm toán **đề xuất chính thức PHÊ DUYỆT HOÀN TẤT GIAI ĐOẠN 3.2 (SYSTEM ARCHITECTURE & COMPONENT DIAGRAMS)** để chuẩn bị bước sang Giai đoạn 3.3.

---

## 5. BẢO LƯU QUY TẮC DỪNG BẮT BUỘC (MANDATORY STOP)

Theo quy định nghiêm ngặt của dự án:
> **DỪNG LẠI HOÀN TOÀN TẠI ĐÂY.**
> **Không** tự ý chuyển sang Giai đoạn 3.3 (Sequence Diagrams / Class Diagrams / Detailed Design).
> **Không** thực hiện bất kỳ lệnh commit, push hay thay đổi mã nguồn nào.
> Chờ ý kiến phản hồi và quyết định phê duyệt chính thức từ Quản trị viên/Chủ nhiệm dự án.
