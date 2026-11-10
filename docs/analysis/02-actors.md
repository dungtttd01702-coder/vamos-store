# 02. CHUẨN HÓA DANH SÁCH ACTOR VÀ PHÂN QUYỀN (ACTORS & PERMISSIONS)

> **Hệ thống:** VAMOS STORE  
> **Thương hiệu:** VAMOS  
> **Mục tiêu:** Chuẩn hóa 3 tác nhân chính và 1 tác nhân phụ, ranh giới trách nhiệm và ma trận phân quyền phục vụ thiết kế sơ đồ Use Case, Activity Diagram và phân quyền máy chủ.

---

## 1. DANH SÁCH TÁC NHÂN (ACTOR SPECIFICATION)

### 1.1. Bảng chuẩn hóa 3 Tác nhân chính (v1.1)

| Mã Actor | Tên Actor | Loại tác nhân | Mô tả & Vai trò | Phạm vi trách nhiệm chính |
| :--- | :--- | :--- | :--- | :--- |
| **ACT-01** | **Guest** (Khách vãng lai) | Human / Primary | Người dùng chưa đăng nhập vào hệ thống website VAMOS STORE. | Duyệt trang chủ, tìm kiếm, lọc, sắp xếp, xem chi tiết sản phẩm & biến thể kích cỡ/màu sắc; đăng ký tài khoản mới; đăng nhập; yêu cầu khôi phục mật khẩu. |
| **ACT-02** | **Customer** (Khách hàng) | Human / Primary | Khách hàng đã đăng nhập tài khoản. | Xem, tìm kiếm và lọc sản phẩm; quản lý hồ sơ cá nhân; quản lý sổ nhiều địa chỉ giao hàng; quản lý giỏ hàng; đặt hàng thanh toán COD; áp dụng voucher; theo dõi tiến trình đơn hàng; hủy đơn hàng khi đơn còn ở trạng thái `PENDING`. |
| **ACT-03** | **Admin** (Quản trị viên) | Human / Primary | Người quản trị và vận hành toàn bộ hệ thống bán hàng VAMOS STORE. | Toàn quyền kiểm soát hệ thống: Quản lý sản phẩm, danh mục, thương hiệu, banner, biến thể, hình ảnh; quản lý tồn kho và điều chỉnh tồn kho có ghi nhận lý do; tiếp nhận và cập nhật trạng thái đơn hàng; hủy đơn nội bộ kèm hoàn kho tự động; quản lý khách hàng; quản lý mã giảm giá voucher; xem Dashboard và báo cáo doanh thu thực tế. |
| **ACT-04** | **Email Service** | System / Secondary | Dịch vụ gửi thư điện tử bên ngoài (SMTP / SendGrid / NodeMailer). | Tiếp nhận yêu cầu từ hệ thống VAMOS STORE để gửi email chứa token đặt lại mật khẩu. Là Actor phụ (Secondary Actor). |

### 1.2. Tác nhân loại trừ khỏi phạm vi Version 1.0
- **Staff (Nhân viên vận hành):** Đã được hợp nhất vào `Admin` để tối giản kiến trúc phân quyền cho phiên bản v1.0.
- **Shipping Service (Hãng vận chuyển bên ngoài):** Không tích hợp API tự động trong phiên bản đầu tiên; khâu giao vận được Admin cập nhật thủ công theo lộ trình thực tế.

---

## 2. QUAN HỆ TÁC NHÂN TRONG HỆ THỐNG (ACTOR RELATIONSHIPS)

Trong mô hình UML Use Case chuẩn của VAMOS STORE:
```text
      [Khách vãng lai] (Guest)
             ▲
             │ (kế thừa hành vi duyệt sản phẩm)
      [Khách hàng] (Customer)
      
      [Quản trị viên] (Admin) ──────► Toàn quyền Quản trị & Vận hành
```

1. **Guest và Customer:**
   - `Customer` kế thừa (`generalization`) khả năng xem duyệt sản phẩm từ `Guest`.
   - Có thể liên kết trực tiếp từng Actor với Use Case để sơ đồ đạt độ trực quan cao nhất.
2. **Admin:**
   - Đóng vai trò quản trị viên tối cao kiêm nhân sự vận hành đơn hàng, tập trung quyền lực xử lý tại màn hình Admin Portal.

---

## 3. MA TRẬN PHÂN QUYỀN HỆ THỐNG (ROLE-PERMISSION MATRIX)

| Nhóm nghiệp vụ | Chức năng chi tiết | Guest | Customer | Admin | Ghi chú kiểm soát phía Server |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Tài khoản** | Đăng ký tài khoản mới | **X** | - | - | Chỉ cho phép khi chưa đăng nhập |
| | Đăng nhập hệ thống | **X** | **X** | **X** | Xác thực email + hashed password |
| | Đăng xuất | - | **X** | **X** | Hủy session trên Server |
| | Khôi phục mật khẩu (Token) | **X** | - | - | Token an toàn có thời hạn |
| | Đổi mật khẩu cá nhân | - | **X** | **X** | Yêu cầu mật khẩu cũ chính xác |
| | Quản lý thông tin hồ sơ | - | **X** | - | Chỉ sửa hồ sơ của chính mình |
| | Quản lý sổ địa chỉ giao hàng | - | **X** | - | CRUD địa chỉ gắn với `user_id` |
| **Sản phẩm** | Xem trang chủ, slider banner | **X** | **X** | **X** | Dữ liệu public |
| | Xem danh sách SP, Tìm kiếm | **X** | **X** | **X** | Chỉ hiển thị sản phẩm `active` |
| | Lọc sản phẩm (size, màu, giá) | **X** | **X** | **X** | Query server-side |
| | Xem chi tiết sản phẩm & biến thể| **X** | **X** | **X** | Hiển thị tồn kho từng biến thể |
| **Giỏ hàng** | Xem giỏ hàng cá nhân | - | **X** | - | Quản lý theo `user_id` session |
| | Thêm sản phẩm theo biến thể | - | **X** | - | Chặn vượt quá tồn kho khả dụng |
| | Cập nhật số lượng / Xóa khỏi giỏ | - | **X** | - | Cập nhật thành tiền tức thời |
| **Đặt hàng** | Áp dụng mã giảm giá (Voucher) | - | **X** | - | Tối đa 1 voucher thỏa mãn điều kiện |
| | Đặt hàng thanh toán COD | - | **X** | - | Database Transaction trừ tồn kho |
| **Đơn hàng** | Tra cứu lịch sử đơn hàng | - | **X** | - | Lọc theo `user_id` session |
| | Xem chi tiết đơn hàng (Snapshot)| - | **X** | - | Hiển thị bản chụp dữ liệu mua |
| | Theo dõi tiến trình đơn hàng | - | **X** | - | Timeline lịch sử chuyển trạng thái |
| | Hủy đơn hàng | - | **X** | - | Chỉ cho phép khi đơn là `PENDING` |
| **Quản trị** | Dashboard & Thống kê doanh thu | - | - | **X** | Chỉ tính doanh thu đơn `COMPLETED` |
| | Quản lý danh mục & banner | - | - | **X** | CRUD danh mục và slider banner |
| | Quản lý sản phẩm & biến thể | - | - | **X** | Cấu hình Size x Màu x SKU x Ảnh |
| | Quản lý kho & Điều chỉnh tồn | - | - | **X** | Bắt buộc ghi nhận lý do kiểm kê |
| | Xử lý & Cập nhật đơn hàng | - | - | **X** | Vận hành tuần tự theo State Machine |
| | Hủy đơn hàng nội bộ | - | - | **X** | Bắt buộc nhập lý do & tự động hoàn kho |
| | Quản lý khách hàng | - | - | **X** | Xem lịch sử mua, khóa/mở tài khoản |
| | Quản lý mã giảm giá (Voucher) | - | - | **X** | Cấu hình hạn mức, thời hạn, bật/tắt |
