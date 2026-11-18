# KIẾN TRÚC VẬN HÀNH VÀ TRIỂN KHAI (DEPLOYMENT ARCHITECTURE)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE

> **Tiêu chuẩn học thuật:** Đồ án Tốt nghiệp / Assignment Kỹ nghệ Phần mềm FPT Polytechnic.  
> **Nguyên tắc thực thi:** Phản ánh chính xác cấu hình runtime và mô hình triển khai thực tế của mã nguồn dự án; phân định rạch ròi giữa Kiến trúc Thực thi (Runtime Architecture) và Mô hình Triển khai Tham chiếu (Reference Deployment Model); không tự vẽ thêm các công nghệ ảo (Docker, Kubernetes, Redis, Cloud Clusters) không có trong mã nguồn.  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | Git HEAD `8135e19`.

---

## 1. MỤC TIÊU VÀ PHẠM VI TÀI LIỆU

Tài liệu này mô tả cách các thành phần phần mềm của VAMOS STORE được phân bổ, kết nối và vận hành trên phần cứng hoặc máy chủ thực tế. Tài liệu trả lời các câu hỏi:
1. Khi ứng dụng chạy, các tiến trình (processes) phối hợp với nhau như thế nào?
2. Quá trình giao tiếp mạng giữa Client $\rightarrow$ Application Server $\rightarrow$ Database Server diễn ra qua các giao thức và cổng nào?
3. Hệ thống quản lý tài nguyên máy chủ (bộ nhớ, connection pool, kết thúc tiến trình an toàn) ra sao?

---

## 2. SƠ ĐỒ VẬN HÀNH VÀ TRIỂN KHAI (DEPLOYMENT ARCHITECTURE DIAGRAM)

![Sơ đồ kiến trúc vận hành và triển khai VAMOS STORE](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/DEPLOYMENT_ARCHITECTURE.png)
*(Mã nguồn sơ đồ: [DEPLOYMENT_ARCHITECTURE.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/DEPLOYMENT_ARCHITECTURE.puml))*

---

## 3. PHÂN TÍCH CHI TIẾT CÁC NÚT TRIỂN KHAI (DEPLOYMENT NODES)

### 3.1. Nút Thiết bị Khách hàng (Client Devices Node)
- **Môi trường:** Máy tính để bàn (Desktop), máy tính xách tay (Laptop), máy tính bảng (Tablet) hoặc điện thoại thông minh (Smartphones).
- **Phần mềm thực thi:** Trình duyệt Web hiện đại (Google Chrome, Mozilla Firefox, Microsoft Edge, Apple Safari).
- **Thành phần tải về máy khách:**
  - Cây phân cấp đối tượng tài liệu HTML5 (DOM) được tạo sẵn từ máy chủ.
  - Tệp bảng kiểu định dạng: `src/public/css/style.css` (Tailwind CSS rút gọn).
  - Tệp kịch bản phía máy khách: `src/public/js/main.js` (xử lý tương tác AJAX, DOM, Toast).
  - Cookie lưu trữ an toàn:
    - `vamos_sid`: Mã định danh phiên làm việc được ký bằng chuỗi bí mật `SESSION_SECRET`, thuộc tính `httpOnly: true` (chống XSS), `sameSite: 'lax'` (chống CSRF).
    - `vamos_locale`: Lưu ngôn ngữ người dùng lựa chọn (`vi` hoặc `en`), thời hạn 1 năm.

---

### 3.2. Nút Máy chủ Ứng dụng (Application Server Node)
- **Môi trường thực thi (Runtime):** **Node.js (v22+)** trên hệ điều hành Windows hoặc Linux Server.
- **Tiến trình chính:** Một tiến trình Node.js duy nhất khởi chạy từ tệp `server.js` thông qua lệnh `node server.js` (hoặc `nodemon server.js` ở môi trường phát triển).
- **Cấu hình mạng:**
  - Cổng mạng lắng nghe mặc định: **Port 3000** (có thể cấu hình linh hoạt qua biến môi trường `process.env.PORT`).
  - Giao thức tiếp nhận: HTTP (môi trường phát triển/kiểm thử) hoặc HTTPS (qua SSL/TLS Termination ở môi trường sản xuất).
- **Các thành phần lưu trữ trong bộ nhớ RAM của máy chủ:**
  - **Memory Session Store:** Quản lý bởi `express-session`, lưu trữ dữ liệu phiên của người dùng (thông tin đăng nhập `user`, số đếm giỏ hàng `cartCount`, mã bảo mật `csrfToken` và giỏ hàng tạm `guestCart` của khách vãng lai).
  - **Connection Pool Manager:** Quản lý bởi thư viện `mssql`, duy trì một bể kết nối mở sẵn đến SQL Server:
    - `pool.min = 0`: Giải phóng toàn bộ kết nối khi hệ thống nhàn rỗi để tiết kiệm tài nguyên máy chủ.
    - `pool.max = 10`: Giới hạn tối đa 10 kết nối đồng thời nhằm bảo vệ SQL Server không bị quá tải kết nối.
    - `pool.idleTimeoutMillis = 30000`: Đóng các kết nối không có hoạt động sau 30 giây.
    - `connectionTimeout = 15000` & `requestTimeout = 15000`: Ngắt kết nối sau 15 giây nếu máy chủ CSDL không phản hồi.
- **Cơ chế Tắt tiến trình An toàn (Graceful Shutdown):**
  Trong `server.js`, ứng dụng cài đặt bộ bắt tín hiệu hệ thống:
  ```javascript
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated.');
    });
  });
  ```
  Khi nhận tín hiệu dừng từ hệ điều hành, máy chủ ngừng tiếp nhận request mới và chờ các request đang xử lý dở dang hoàn tất trước khi giải phóng bộ nhớ và đóng tiến trình.

---

### 3.3. Nút Máy chủ Cơ sở Dữ liệu (Database Server Node)
- **Phần mềm thực thi:** **Microsoft SQL Server (2019 / 2022)** chạy dưới dạng một dịch vụ hệ điều hành độc lập (SQL Server Windows Service hoặc SQL Server on Linux).
- **Cơ sở dữ liệu:** `vamos_store_db`.
- **Cấu trúc lưu trữ vật lý:**
  - Tệp Dữ liệu Chính (**Primary Data File - `.mdf`**): Lưu trữ toàn bộ lược đồ quan hệ của 21 bảng, các chỉ mục gom cụm (Clustered Indexes), chỉ mục lọc duy nhất và dữ liệu bản ghi.
  - Tệp Nhật ký Giao dịch (**Transaction Log File - `.ldf`**): Lưu trữ nhật ký ghi trước (Write-Ahead Logging - WAL) phục vụ cơ chế hoàn nguyên giao dịch (Rollback) và đảm bảo tính bền vững (Durability) trong ACID.
- **Cấu hình mạng:**
  - Giao thức: **TDS Protocol (Tabular Data Stream)** qua cổng mạng TCP **1433**.
  - Kiểm soát truy cập: Xác thực qua tài khoản SQL Server Authentication (`sa` hoặc tài khoản dịch vụ riêng biệt với mật khẩu được bảo vệ trong biến môi trường `.env`).

---

## 4. BẢNG ĐỐI CHIẾU VÀ XÁC MINH CẤU HÌNH VẬN HÀNH THỰC TẾ

Dựa trên việc kiểm tra trực tiếp các tệp cấu hình nguồn (`package.json`, `server.js`, `src/config/app.config.js`, `src/config/database.js`, `.env.example`, `Dockerfile`, `docker-compose.yml`), trạng thái của từng tham số triển khai được phân loại minh bạch theo 4 nhóm:
- **VERIFIED:** Giá trị cố định được xác minh trực tiếp trong mã nguồn thực tế.
- **CONFIGURABLE:** Giá trị có thể cấu hình linh hoạt qua biến môi trường (`.env`), có giá trị mặc định rõ ràng trong mã nguồn.
- **ASSUMED:** Giả định kiến trúc mở rộng trong tương lai, chưa có mã nguồn hoặc hạ tầng hỗ trợ.
- **NOT VERIFIED:** Cấu hình lý thuyết hoặc môi trường chưa được kích hoạt/chạy kiểm thử trên máy chủ production thực tế.

| Tham số triển khai | Giá trị mã nguồn / Mặc định | Bằng chứng từ tệp mã nguồn | Trạng thái xác minh | Ghi chú kỹ thuật |
| :--- | :--- | :--- | :---: | :--- |
| **Node.js Version** | `>= 22.0.0` | `package.json` (dòng 39: `"engines": { "node": ">=22.0.0" }`) | **VERIFIED** | Môi trường runtime yêu cầu Node.js v22 trở lên. *(Lưu ý: tệp `Dockerfile` dòng 2 khai báo `node:20-alpine` làm build template tham khảo)* |
| **Web Server Port** | `3000` | `src/config/app.config.js` (dòng 13: `process.env.PORT \|\| 3000`) | **CONFIGURABLE** | Mặc định lắng nghe cổng 3000, có thể cấu hình qua biến `PORT` trong `.env`. |
| **SQL Server Host** | `127.0.0.1` | `src/config/app.config.js` (dòng 32: `process.env.DB_SERVER \|\| '127.0.0.1'`) | **CONFIGURABLE** | Có thể trỏ sang máy chủ CSDL từ xa hoặc Docker service `mssql`. |
| **SQL Server Port** | `1433` | `src/config/app.config.js` (dòng 33: `process.env.DB_PORT \|\| 1433`) | **CONFIGURABLE** | Cổng giao tiếp chuẩn giao thức TDS TCP của Microsoft SQL Server. |
| **Database Name** | `vamos_store_db` | `src/config/app.config.js` (dòng 36: `process.env.DB_NAME \|\| 'vamos_store_db'`) | **CONFIGURABLE** | Tự động chuyển sang `vamos_store_test_db` khi chạy script test (`NODE_ENV=test`). |
| **Connection Pool Min** | `0` | `src/config/app.config.js` (dòng 45: `min: 0`) | **VERIFIED** | Giải phóng toàn bộ kết nối nhàn rỗi về 0 để tiết kiệm RAM SQL Server. |
| **Connection Pool Max** | `10` | `src/config/app.config.js` (dòng 44: `max: 10`) | **VERIFIED** | Khống chế tối đa 10 kết nối đồng thời, ngăn cạn kiệt tài nguyên CSDL. |
| **Pool Idle Timeout** | `30,000 ms` (30 giây) | `src/config/app.config.js` (dòng 46: `idleTimeoutMillis: 30000`) | **VERIFIED** | Đóng kết nối nhàn rỗi sau 30 giây không phát sinh truy vấn. |
| **Connection Timeout** | `15,000 ms` (15 giây) | `src/config/app.config.js` (dòng 37: `connectionTimeout: 15000`) | **VERIFIED** | Ngắt kết nối nếu máy chủ CSDL không phản hồi bắt tay trong 15s. |
| **Request Timeout** | `15,000 ms` (15 giây) | `src/config/app.config.js` (dòng 38: `requestTimeout: 15000`) | **VERIFIED** | Hủy bỏ truy vấn nếu thời gian thực thi vượt quá 15s để tránh nghẽn thread. |
| **Docker Configuration** | `Dockerfile` & `docker-compose.yml` | Thư mục gốc dự án (`Dockerfile`, `docker-compose.yml`, `.dockerignore`) | **CONFIGURABLE (Tham chiếu)** | Đã có sẵn template Docker Compose định nghĩa 2 container (`app` và `mssql:2022`). Tuy nhiên trong thực tế phát triển/chấm đồ án, ứng dụng chạy trực tiếp trên máy chủ host (`node server.js`) kết nối SQL Server nội bộ. Docker là phương án đóng gói tham chiếu, không phải môi trường bắt buộc đang kích hoạt. |
| **LAN / Network Config** | Localhost / Mạng nội bộ | `server.js` (dòng 11: `http://localhost:${PORT}`) | **VERIFIED** | Giao tiếp cục bộ qua loopback IP hoặc mạng LAN nội bộ. |
| **Nginx Reverse Proxy / SSL** | Cổng 80/443 | Chưa có tệp cấu hình `nginx.conf` | **ASSUMED** | Thuộc lộ trình mở rộng sản xuất; hiện tại Express phục vụ trực tiếp qua HTTP. |
| **Production SSL Certs** | Chứng chỉ HTTPS | Chưa có cấu hình cert thực tế | **NOT VERIFIED** | Đã sẵn sàng cờ `cookie.secure: isProduction` nhưng chưa kiểm thử với domain có chứng chỉ SSL thực. |

---

## 5. BẢNG TỔNG HỢP CÁC GIAO THỨC VÀ CỔNG KẾT NỐI

| Tuyến kết nối | Điểm xuất phát | Điểm tiếp nhận | Giao thức truyền thông | Cổng mạng (Port) | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Client $\rightarrow$ Server** | Trình duyệt Web | Máy chủ Express | HTTP / HTTPS | 3000 (Dev) / 80, 443 | Tải trang HTML, gửi form POST, gọi Live Search & Wishlist AJAX |
| **Server $\rightarrow$ Client** | Máy chủ Express | Trình duyệt Web | HTTP Response | - | Trả về trang Pug đã render hoặc chuỗi JSON |
| **Server $\rightarrow$ Database** | `mssql` Connection Pool | Microsoft SQL Server | TDS Protocol (TCP) | 1433 | Gửi truy vấn SQL tham số hóa, mở Transaction và khóa bi quan |
| **Database $\rightarrow$ Server** | Microsoft SQL Server | `mssql` Connection Pool | TDS Protocol (TCP) | - | Trả về các tập bản ghi (Recordsets), số dòng bị ảnh hưởng |

---

## 6. TÍNH MINH BẠCH HỌC THUẬT: HIỆN TRẠNG TRIỂN KHAI VÀ LỘ TRÌNH NÂNG CẤP

Trong báo cáo đồ án tốt nghiệp, sinh viên cần trình bày trung thực hiện trạng hạ tầng của dự án:
1. **Hiện trạng thực tế:** Hệ thống hiện đang được thiết kế và kiểm thử tối ưu theo mô hình **Đơn khối (Monolithic Architecture)** trên 1 máy chủ ứng dụng Node.js kết nối trực tiếp đến 1 máy chủ Microsoft SQL Server. Mô hình này hoàn toàn phù hợp và đáp ứng xuất sắc quy mô tải của đồ án tốt nghiệp và các cửa hàng thời trang vừa/nhỏ.
2. **Vai trò của cấu hình Docker trong dự án:** Tệp `Dockerfile` và `docker-compose.yml` tồn tại trong mã nguồn đóng vai trò là **cấu hình đóng gói container tham khảo (Containerization Template)** giúp người chấm có thể dựng nhanh môi trường cô lập khi cần; nhưng trong quá trình phát triển và kiểm thử tự động, hệ thống chạy trực tiếp trên môi trường máy chủ cục bộ (Host Execution).
3. **Những thành phần không tồn tại:** Dự án **không sử dụng** Redis Cache (sử dụng in-memory session của express-session), không sử dụng Kubernetes container orchestration, không sử dụng kiến trúc Microservices và không có API Gateway riêng biệt.
4. **Lộ trình nâng cấp mở rộng (Scalability Roadmap):**
   - Khi lượng người dùng tăng đột biến, hệ thống có thể nâng cấp Session Store từ in-memory sang `connect-redis` hoặc lưu session trong bảng SQL Server (`connect-mssql`).
   - Đặt máy chủ Nginx làm Reverse Proxy phía trước để quản lý SSL/TLS và cân bằng tải (Load Balancer) cho nhiều tiến trình Node.js chạy song song (Node.js Cluster hoặc PM2).

---

*Tài liệu thuộc Phần 3.2.5 của Báo cáo Phân tích Thiết kế Hệ thống VAMOS STORE.*
