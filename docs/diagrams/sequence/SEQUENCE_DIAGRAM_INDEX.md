# MỤC LỤC VÀ DANH MỤC SƠ ĐỒ TUẦN TỰ HỆ THỐNG (SEQUENCE DIAGRAM INDEX)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE — GIAI ĐOẠN 3.3.1

> **Tiêu chuẩn học thuật:** Chuẩn hóa theo UML 2.5 cho đồ án tốt nghiệp FPT Polytechnic / Assignment Phân tích Thiết kế Hệ thống.  
> **Nguyên tắc đối soát:** Mỗi sơ đồ tuần tự được trích xuất và đối chiếu trực tiếp từ mã nguồn thực tế (Express.js Controllers, Services, Repositories, Database Helper và SQL Server Database) tại Git commit `8135e19`.  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | Git HEAD `8135e19`.

---

## 1. BẢNG TỔNG HỢP TOÀN BỘ 16 SƠ ĐỒ TUẦN TỰ (SD01 – SD16)

| STT | Mã Sơ Đồ | Tên Sơ Đồ Tuần Tự | Mã Use Case | Tác Nhân Chính | Trạng Thái Triển Khai | File PlantUML (`.puml`) | File Render (`.png`) |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | **SD01** | Đăng ký tài khoản mới | UC01 | Guest | **Đã cài đặt (Implemented)** | [SD01_REGISTER.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD01_REGISTER.puml) | [SD01_REGISTER.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD01_REGISTER.png) |
| 2 | **SD02** | Đăng nhập & Hợp nhất giỏ hàng | UC02 | Guest / Customer / Admin | **Đã cài đặt (Implemented)** | [SD02_LOGIN.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD02_LOGIN.puml) | [SD02_LOGIN.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD02_LOGIN.png) |
| 3 | **SD03** | Khôi phục mật khẩu | UC03 | Guest / Customer | **Chỉ thiết kế (Designed Only)** | [SD03_PASSWORD_RESET_DESIGNED_ONLY.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD03_PASSWORD_RESET_DESIGNED_ONLY.puml) | [SD03_PASSWORD_RESET_DESIGNED_ONLY.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD03_PASSWORD_RESET_DESIGNED_ONLY.png) |
| 4 | **SD04** | Quản lý hồ sơ & Sổ địa chỉ | UC04 | Customer | **Đã cài đặt (Implemented)** | [SD04_PROFILE_ADDRESS.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD04_PROFILE_ADDRESS.puml) | [SD04_PROFILE_ADDRESS.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD04_PROFILE_ADDRESS.png) |
| 5 | **SD05** | Tìm kiếm, xem danh mục & Chi tiết SP | UC05 | Guest / Customer | **Đã cài đặt (Implemented)** | [SD05_PRODUCT_BROWSING.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD05_PRODUCT_BROWSING.puml) | [SD05_PRODUCT_BROWSING.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD05_PRODUCT_BROWSING.png) |
| 6 | **SD06** | Quản lý giỏ hàng | UC06 | Guest / Customer | **Đã cài đặt (Implemented)** | [SD06_CART.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD06_CART.puml) | [SD06_CART.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD06_CART.png) |
| 7 | **SD07** | Đặt hàng thanh toán COD | UC07 | Customer | **Đã cài đặt (Implemented)** | [SD07_CHECKOUT_COD.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD07_CHECKOUT_COD.puml) | [SD07_CHECKOUT_COD.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD07_CHECKOUT_COD.png) |
| 8 | **SD08** | Tra cứu và theo dõi đơn hàng | UC08 | Customer | **Đã cài đặt (Implemented)** | [SD08_ORDER_TRACKING.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD08_ORDER_TRACKING.puml) | [SD08_ORDER_TRACKING.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD08_ORDER_TRACKING.png) |
| 9 | **SD09** | Hủy đơn hàng phía khách hàng | UC09 | Customer | **Đã cài đặt (Implemented)** | [SD09_CANCEL_ORDER.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD09_CANCEL_ORDER.puml) | [SD09_CANCEL_ORDER.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD09_CANCEL_ORDER.png) |
| 10 | **SD10** | Admin xử lý & Cập nhật đơn hàng | UC10 | Admin | **Đã cài đặt (Implemented)** | [SD10_ADMIN_ORDER_PROCESSING.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD10_ADMIN_ORDER_PROCESSING.puml) | [SD10_ADMIN_ORDER_PROCESSING.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD10_ADMIN_ORDER_PROCESSING.png) |
| 11 | **SD11** | Quản lý kho hàng & Điều chỉnh tồn kho | UC11 | Admin | **Đã cài đặt (Implemented)** | [SD11_INVENTORY_MANAGEMENT.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD11_INVENTORY_MANAGEMENT.puml) | [SD11_INVENTORY_MANAGEMENT.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD11_INVENTORY_MANAGEMENT.png) |
| 12 | **SD12** | Quản lý danh mục, sản phẩm & biến thể | UC12 | Admin | **Đã cài đặt (Implemented)** | [SD12_CATALOG_MANAGEMENT.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD12_CATALOG_MANAGEMENT.puml) | [SD12_CATALOG_MANAGEMENT.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD12_CATALOG_MANAGEMENT.png) |
| 13 | **SD13** | Quản lý mã giảm giá | UC13 | Admin | **Đã cài đặt (Implemented)** | [SD13_VOUCHER_MANAGEMENT.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD13_VOUCHER_MANAGEMENT.puml) | [SD13_VOUCHER_MANAGEMENT.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD13_VOUCHER_MANAGEMENT.png) |
| 14 | **SD14** | Báo cáo doanh thu & Dashboard | UC14 | Admin | **Đã cài đặt (Implemented)** | [SD14_REVENUE_REPORT.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD14_REVENUE_REPORT.puml) | [SD14_REVENUE_REPORT.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD14_REVENUE_REPORT.png) |
| 15 | **SD15** | Quản lý danh sách yêu thích | UC15 | Customer (Guest 401, Admin 403) | **Đã cài đặt (Implemented)** | [SD15_WISHLIST.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD15_WISHLIST.puml) | [SD15_WISHLIST.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD15_WISHLIST.png) |
| 16 | **SD16** | Quản lý tài khoản khách hàng | UC16 | Admin | **Đã cài đặt (Implemented)** | [SD16_CUSTOMER_MANAGEMENT.puml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD16_CUSTOMER_MANAGEMENT.puml) | [SD16_CUSTOMER_MANAGEMENT.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/diagrams/sequence/SD16_CUSTOMER_MANAGEMENT.png) |

---

## 2. HƯỚNG DẪN TRÌNH BÀY BẢO VỆ ĐỒ ÁN TRƯỚC HỘI ĐỒNG (DEFENSE GUIDE)

Khi sinh viên trình bày phần Thiết kế Động (Dynamic Design) trước Hội đồng Giảng viên:
1. **Phân tích Luồng Đặt hàng COD (SD07):**
   - Giải thích cơ chế giao dịch nguyên tử (ACID Transaction) sử dụng `sql.Transaction`.
   - Nhấn mạnh chỉ dẫn khóa dòng bi quan `WITH (UPDLOCK, ROWLOCK)` ngăn chặn xung đột tranh chấp tồn kho khi nhiều khách đặt cùng một sản phẩm cùng thời điểm (Race Condition).
   - Chứng minh các bước nghiệp vụ tuân thủ tuần tự nghiêm ngặt: Kiểm tra giỏ $\rightarrow$ Khóa voucher $\rightarrow$ Kiểm tra tồn khả dụng $\rightarrow$ Trừ kho $\rightarrow$ Tạo đơn $\rightarrow$ Tạo chi tiết đơn snapshot $\rightarrow$ Xóa giỏ hàng $\rightarrow$ Commit.
2. **Phân tích Luồng Hủy đơn hàng và Hoàn kho (SD09 & SD10):**
   - Chứng minh cơ chế chống hoàn kho kép (Anti-Double Restitution): chặn hủy nếu đơn đã `CANCELLED`.
   - Chỉ cho phép khách hàng hủy khi đơn đang ở trạng thái `PENDING`.
   - Khi hủy đơn, hệ thống tự động hoàn lại tồn kho cho các biến thể và giải phóng mã giảm giá (`DELETE FROM voucher_usages` và giảm `used_count`).
3. **Phân tích Ma trận Trạng thái Đơn hàng (SD10):**
   - Giải thích tính bất biến của máy trạng thái: `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`.
   - Nhấn mạnh quy tắc thanh toán COD: `payment_status` chỉ được chuyển sang `'PAID'` khi `order_status` đạt `'COMPLETED'`, và tuyệt đối không trừ tồn kho lần 2.
4. **Phân tích Luồng Báo cáo Doanh thu & Dashboard (SD14):**
   - Giải thích nguyên tắc kế toán tài chính: Doanh thu thực thu chỉ tính trên các đơn thỏa mãn đồng thời:
     `order_status = 'COMPLETED' AND payment_status = 'PAID'`.
   - Giải thích kỹ thuật phân phối bất đồng bộ `Promise.all` kích hoạt 9 truy vấn song song để đạt hiệu năng tải trang cao nhất mà không làm nghẽn Event Loop.
5. **Tính trung thực học thuật đối với Chức năng Quên mật khẩu (SD03):**
   - Sinh viên thẳng thắn trình bày rằng bảng CSDL `password_reset_tokens` đã được tạo sẵn trong schema; tuy nhiên trong mã nguồn Express, route/controller/email chưa được cài đặt. Sơ đồ SD03 là tài liệu thiết kế đặc tả tham chiếu cho lộ trình phát triển tiếp theo.

---

*Tài liệu thuộc Phần 3.3.1 của Báo cáo Phân tích Thiết kế Hệ thống VAMOS STORE.*
