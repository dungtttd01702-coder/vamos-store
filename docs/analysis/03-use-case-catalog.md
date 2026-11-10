# 03. DANH MỤC USE CASE CHUẨN HÓA (USE CASE CATALOG v1.1)

> **Hệ thống:** VAMOS STORE  
> **Thương hiệu:** VAMOS  
> **Quy chuẩn:** Đã chuẩn hóa danh mục 14 Use Cases theo chuẩn thực hành Business Analysis (Thinhnotes), loại bỏ hoàn toàn các Use Case kỹ thuật vụn vặt và chồng chéo chức năng.

---

## 1. BẢNG DANH MỤC TOÀN BỘ 14 USE CASES HỆ THỐNG

| Mã UC | Tên Use Case | Actor chính | Mô tả nghiệp vụ | Mức độ ưu tiên |
| :--- | :--- | :--- | :--- | :---: |
| **UC-01** | **Đăng ký tài khoản** | Guest | Tạo tài khoản khách hàng mới với email độc nhất và mật khẩu mã hóa bcrypt. | High |
| **UC-02** | **Đăng nhập** | Guest, Customer, Admin | Xác thực danh tính và khởi tạo phiên làm việc (Session) an toàn cho người dùng. | High |
| **UC-03** | **Khôi phục mật khẩu** | Guest (phụ: Email Svc) | Yêu cầu và thiết lập lại mật khẩu mới thông qua mã token gửi qua email. | Medium |
| **UC-04** | **Quản lý hồ sơ & địa chỉ** | Customer | Xem, sửa thông tin cá nhân và quản lý danh sách các địa chỉ giao hàng. | High |
| **UC-05** | **Tìm kiếm & xem sản phẩm** | Guest, Customer | Duyệt danh mục, tìm kiếm theo tên/mã, lọc kết hợp (size, màu, giá) và xem chi tiết sản phẩm. | High |
| **UC-06** | **Quản lý giỏ hàng** | Customer | Xem giỏ hàng, thêm sản phẩm theo biến thể size/màu, thay đổi số lượng, xóa sản phẩm. | High |
| **UC-07** | **Đặt hàng COD** | Customer | Tiến hành checkout, chọn địa chỉ nhận, áp dụng voucher (`<<extend>>`), tạo đơn COD trong Transaction. | High |
| **UC-08** | **Tra cứu & theo dõi đơn hàng**| Customer | Xem lịch sử đơn hàng, xem chi tiết snapshot và dòng thời gian trạng thái đơn. | High |
| **UC-09** | **Hủy đơn hàng** | Customer | Hủy đơn hàng khi đơn còn ở trạng thái `PENDING` (`<<extend>>` từ UC-08); tự động hoàn kho. | High |
| **UC-10** | **Xử lý & cập nhật đơn hàng** | Admin | Xem danh sách đơn, xác nhận đơn, chuyển tiếp trạng thái đơn hàng và hủy đơn nội bộ kèm hoàn kho. | High |
| **UC-11** | **Quản lý tồn kho** | Admin | Theo dõi tồn kho theo SKU, xem cảnh báo sắp hết hàng và điều chỉnh tồn kho có ghi nhận lý do. | High |
| **UC-12** | **Quản lý sản phẩm & danh mục**| Admin | Quản lý danh mục, banner, thêm/sửa sản phẩm kèm biến thể (Size/Màu/SKU) và ảnh. | High |
| **UC-13** | **Quản lý mã giảm giá** | Admin | Tạo mới, cập nhật thông tin, điều kiện giá trị đơn tối thiểu và bật/tắt voucher. | Medium |
| **UC-14** | **Xem báo cáo doanh thu** | Admin | Xem dashboard tổng quan và báo cáo doanh thu thực tế (chỉ tính từ các đơn COMPLETED). | High |

---

## 2. PHÂN BỐ USE CASE THEO TỪNG PHÂN HỆ

### 2.1. Phân hệ Tài khoản & Xác thực (4 Use Cases)
- `UC-01: Đăng ký tài khoản`
- `UC-02: Đăng nhập`
- `UC-03: Khôi phục mật khẩu`
- `UC-04: Quản lý hồ sơ & địa chỉ`

### 2.2. Phân hệ Mua sắm & Đặt hàng (3 Use Cases)
- `UC-05: Tìm kiếm & xem sản phẩm`
- `UC-06: Quản lý giỏ hàng`
- `UC-07: Đặt hàng COD`
  - *Quan hệ <<include>> bắt buộc bên trong UC-07:* Chọn địa chỉ nhận hàng, Kiểm tra tồn kho biến thể, Xác nhận thanh toán COD.
  - *Quan hệ <<extend>> mở rộng tùy chọn:* Áp dụng mã giảm giá (Voucher).

### 2.3. Phân hệ Đơn hàng cá nhân (2 Use Cases)
- `UC-08: Tra cứu & theo dõi đơn hàng`
- `UC-09: Hủy đơn hàng` (`<<extend>>` từ UC-08 khi đơn là `PENDING`)

### 2.4. Phân hệ Quản trị & Vận hành (Admin) (5 Use Cases)
- `UC-10: Xử lý & cập nhật đơn hàng` (kèm nhánh `<<extend>>` Hủy đơn nội bộ)
- `UC-11: Quản lý tồn kho` (kèm nhánh `<<extend>>` Điều chỉnh tồn kho có lý do)
- `UC-12: Quản lý sản phẩm & danh mục` (`<<include>>` Biến thể size/màu và Hình ảnh)
- `UC-13: Quản lý mã giảm giá`
- `UC-14: Xem báo cáo doanh thu`

---

## 3. NGUYÊN TẮC RÀNG BUỘC UML ĐÃ ĐƯỢC KIỂM ĐỊNH

1. **Không phân rã chức năng (No Functional Decomposition):** Không tách "Lọc", "Sắp xếp", "Tìm kiếm", "Xem danh sách" thành 4 Use Case riêng mà gom thành `UC-05: Tìm kiếm & xem sản phẩm`.
2. **Không chi tiết hóa CRUD vụn vặt:** Không tạo hàng loạt oval Xem/Thêm/Sửa/Xóa riêng lẻ cho từng đối tượng, mà gom thành Use Case quản lý cấp cao.
3. **Mối quan hệ `<<include>>` và `<<extend>>` đúng chuẩn UML 2.5:**
   - Mũi tên nét đứt `<<include>>`: Trỏ từ Base Use Case tới Included Use Case (hành vi bắt buộc).
   - Mũi tên nét đứt `<<extend>>`: Trỏ từ Extension Use Case về Base Use Case (hành vi mở rộng tùy chọn có điều kiện).
