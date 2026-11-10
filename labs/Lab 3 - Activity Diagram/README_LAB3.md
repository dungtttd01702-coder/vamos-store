# LAB 3: THIẾT KẾ SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM)

> **Hệ thống:** VAMOS STORE - Website thương mại điện tử chuyên kinh doanh giày dép  
> **Sinh viên thực hiện:** [Họ và tên sinh viên]  
> **Giảng viên hướng dẫn:** [Họ và tên giảng viên]

---

## 1. MỤC TIÊU CỦA LAB 3

- Trực quan hóa dòng chảy dữ liệu (Data & Control Flow) của 5 quy trình nghiệp vụ trọng tâm trong hệ thống VAMOS STORE.
- Thể hiện rõ các swimlanes phân chia trách nhiệm giữa Người dùng (`Customer`, `Guest`, `Admin`) và Máy chủ hệ thống / Cơ sở dữ liệu.
- Làm rõ các nút điều kiện rẽ nhánh (Decision node), xử lý lỗi, rollback transaction và kết thúc luồng.

---

## 2. DANH MỤC FILE NỘP TRONG LAB 3

1. `ad-01-auth.puml`: Quy trình Đăng ký, Đăng nhập, Băm mật khẩu bcrypt và Cấp session máy chủ.
2. `ad-02-checkout-cod.puml`: Quy trình Đặt hàng COD, Khóa bi quan kiểm tra kho (`SELECT ... FOR UPDATE`), Trừ tồn kho và Lưu snapshot.
3. `ad-03-order-processing.puml`: Quy trình Máy trạng thái đơn hàng (`PENDING -> CONFIRMED -> PROCESSING -> SHIPPING -> COMPLETED`) và Ghi vết lịch sử.
4. `ad-04-order-cancellation.puml`: Quy trình Hủy đơn hàng và Hoàn trả tồn kho tự động (`ORDER_CANCELLED_RESTOCK`).
5. `ad-05-inventory-adjustment.puml`: Quy trình Admin kiểm kê và Điều chỉnh tồn kho thủ công kèm lý do kiểm toán.
