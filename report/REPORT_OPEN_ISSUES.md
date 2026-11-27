# DANH SÁCH VẤN ĐỀ CẦN XÁC NHẬN — VAMOS STORE REPORT
**Mã tài liệu:** `REPORT_OPEN_ISSUES.md`  
**Dự án:** Website bán giày dép VAMOS STORE  
**Mục đích:** Ghi nhận minh bạch các điểm kỹ thuật cần người dùng / Hội đồng chấm điểm lưu ý hoặc xác nhận.

---

## 1. PHIÊN BẢN HỆ QUẢN TRỊ CSDL MICROSOFT SQL SERVER
- **Hiện trạng:**
  - Trong `docker-compose.yml`: Sử dụng Docker image chính thức `mcr.microsoft.com/mssql/server:2022-latest`.
  - Trong tài liệu cũ ghi: "Microsoft SQL Server 2025".
- **Hành động đã xử lý:** Đã chuẩn hóa toàn bộ báo cáo, từ điển dữ liệu, sơ đồ và tài liệu kiểm toán theo đúng phiên bản thực tế chạy trong Docker: **Microsoft SQL Server 2022**. Đã loại bỏ 100% các từ khóa nhắc đến "SQL Server 2025".
- **Cần người dùng xác nhận:** Nếu đề cương môn học của Giảng viên yêu cầu ghi tiêu đề "SQL Server 2022/2025", bạn có thể tùy chỉnh lại phần nhãn văn bản.

---

## 2. TÊN CỘT BẢNG `password_reset_tokens` (`token` vs `token_hash`)
- **Hiện trạng:**
  - Trong file DDL thực tế `database/mssql_schema.sql:190` và `database/migrations/001_initial_schema.sql:127`: Tên cột là `token_hash NVARCHAR(255) NOT NULL UNIQUE`.
  - Trong tài liệu Lab 2 cũ và một số bản nháp ghi: `token VARCHAR(255)`.
- **Hành động đã xử lý:** Trong Từ điển dữ liệu Chương II, hệ thống ghi rõ tên cột thực tế trong CSDL SQL Server là `token_hash`, đồng thời chú thích rõ đây là chuỗi băm token ngẫu nhiên bảo mật có ràng buộc UNIQUE.

---

## 3. ĐỘ DÀI TRƯỜNG `orders.delivery_address_snapshot` (255 vs 500)
- **Hiện trạng:**
  - File DDL `database/mssql_schema.sql:318` và migration 001 khai báo: `delivery_address_snapshot NVARCHAR(255) NOT NULL`.
  - Trong các sơ đồ lớp phân hệ Admin (`CD01`, `CD05`, `CD06A`, `CD06C`, `CLASS_MODEL_DISCOVERY.md`) ghi nhận độ dài mở rộng: `NVARCHAR(500)` để hỗ trợ địa chỉ chi tiết kèm 3 cấp hành chính (Tỉnh/Thành, Quận/Huyện, Phường/Xã).
- **Hành động đã xử lý:** Từ điển dữ liệu Chương II và Evidence Map ghi nhận chính xác `NVARCHAR(255)` theo DDL hiện hữu và ghi chú khuyến nghị mở rộng `NVARCHAR(500)` cho các phiên bản tiếp theo.

---

## 4. TÌNH TRẠNG HIỆN THỰC CA SỬ DỤNG UC03 (KHÔI PHỤC MẬT KHẨU)
- **Hiện trạng:**
  - Bảng CSDL `password_reset_tokens` đã được tạo sẵn trong SQL Server với cấu trúc: `id`, `user_id`, `token_hash`, `expires_at`, `used_at`, `created_at`.
  - Trong mã nguồn `src/` (bao gồm `auth.routes.js`, `auth.controller.js`), chưa có route, controller hay service xử lý tạo token, gửi mail và đặt lại mật khẩu.
- **Hành động đã xử lý:** Toàn bộ báo cáo (Introduction, Chapter 2 Use Case, Data Dictionary, Chapter 6 Hạn chế) thống nhất sử dụng định nghĩa chính xác:
  > *"Chức năng khôi phục mật khẩu đã được đưa vào thiết kế và có cấu trúc dữ liệu hỗ trợ, tuy nhiên quy trình xử lý hoàn chỉnh chưa được triển khai trong phiên bản hiện tại."*

---

## 5. MÔI TRƯỜNG VẬN HÀNH THỰC TẾ
- **Hiện trạng:**
  - Dự án hiện đã được kiểm chứng hoạt động trên môi trường **Localhost** và **Container hóa Docker Compose** (`Node.js 20-alpine` + `MSSQL Server 2022`).
  - Chưa có thông tin về hợp đồng thuê VPS hoặc tên miền thật đã trỏ IP.
- **Hành động đã xử lý:** Toàn bộ Chương V được định vị chuẩn xác là **"Kế hoạch triển khai và Hướng dẫn cài đặt"**, phân biệt rõ Kịch bản A (Local/Docker đã kiểm chứng) và Kịch bản B (Cloud VPS đề xuất cho tương lai). Loại bỏ toàn bộ các tuyên bố giả định về việc đã online trên Internet và loại bỏ mật khẩu thô trong tài liệu.

---

## 6. PHÂN BIỆT BẰNG CHỨNG KIỂM THỬ THỰC TẾ (CHƯƠNG IV)
- **Hiện trạng:**
  - Bộ kịch bản kiểm thử tự động gồm 5 suite độc lập trong `tests/` (`validate_pug.js`, `test_validator.js`, `test_audit_fixes.js`, `test_phase3_theme.js`, `test_phase4_i18n.js`) với tổng cộng **99 ca kiểm thử Pass 100%**.
  - 25 ca kiểm thử chức năng trong Chương IV đóng vai trò là bộ tiêu chí nghiệm thu người dùng (Acceptance Test Criteria).
- **Hành động đã xử lý:**
  - Báo cáo không tuyên bố 25/25 ca chức năng là Pass hoàn hảo mà ghi rõ: 24 ca đã xác minh logic đơn vị và tương tác, riêng Ca 23 (kiểm thử chịu tải đồng thời cao khi còn 1 sản phẩm) được ghi nhận là *"Chờ xác minh tải cao (Staging)"*.
  - Nhấn mạnh nguyên tắc học thuật: Không dùng kết quả biên dịch 39 template Pug để kết luận toàn bộ hệ thống đã chạy hoàn hảo.
