# LAB 2: MÔ HÌNH THỰC THỂ QUAN HỆ (ERD) & THIẾT KẾ DATABASE MYSQL 8

> **Hệ thống:** VAMOS STORE - Website thương mại điện tử chuyên kinh doanh giày dép  
> **Sinh viên thực hiện:** [Họ và tên sinh viên]  
> **Giảng viên hướng dẫn:** [Họ và tên giảng viên]  
> **Quy mô CSDL:** 18 Thực thể quan hệ, chuẩn hóa MySQL 8.0 (InnoDB, `utf8mb4_unicode_ci`)

---

## 1. MỤC TIÊU CỦA LAB 2

- Thiết kế sơ đồ quan hệ thực thể (ERD) hoàn chỉnh với ký hiệu Crow's Foot chuẩn xác.
- Đảm bảo các nguyên tắc bất biến nghiệp vụ:
  - **Snapshot đơn hàng:** `order_items` lưu cứng tên sản phẩm, SKU, kích cỡ, màu sắc, đơn giá tại thời điểm mua; `orders` lưu snapshot địa chỉ và mã voucher.
  - **Quản lý biến thể giày:** Quản lý kho theo từng tổ hợp `Size` x `Color` x `SKU`, có ràng buộc `UNIQUE(product_id, size_id, color_id)`.
  - **Kiểm soát kho & Race Condition:** Ràng buộc `stock_quantity >= 0`, ghi nhật ký kiểm toán trong `inventory_transactions`.
  - **Ràng buộc toàn vẹn:** Bộ ràng buộc CHECK tài chính, UNIQUE email, UNIQUE sku, UNIQUE cart, và các hành vi khóa ngoại `ON DELETE RESTRICT` bảo vệ lịch sử giao dịch.

---

## 2. DANH MỤC FILE NỘP TRONG LAB 2

1. `vamos_store_erd.puml`: Sơ đồ ERD PlantUML chuẩn xác và duy nhất của dự án (18 bảng, đầy đủ PK, FK, UNIQUE, CHECK).
2. `schema.sql`: Mã nguồn SQL DDL tương thích 100% với MySQL 8.0, thứ tự tạo bảng chuẩn phụ thuộc, có đầy đủ comments nghiệp vụ.
3. `data-dictionary.md`: Từ điển dữ liệu chi tiết mô tả 18 bảng, danh sách từng cột, kiểu dữ liệu, nullability, default, khóa và ý nghĩa nghiệp vụ.
4. `database-design-review.md`: Bản thuyết minh kiến trúc cơ sở dữ liệu, giải pháp xử lý tranh chấp kho hàng, snapshot và đối chiếu ràng buộc.
