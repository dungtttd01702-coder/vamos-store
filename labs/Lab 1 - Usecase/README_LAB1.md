# LAB 1: THIẾT KẾ USE CASE DIAGRAM & ĐẶC TẢ USE CASE

> **Hệ thống:** VAMOS STORE - Website thương mại điện tử chuyên kinh doanh giày dép  
> **Sinh viên thực hiện:** [Họ và tên sinh viên]  
> **Giảng viên hướng dẫn:** [Họ và tên giảng viên]  
> **Chuẩn hóa tác nhân:** 3 Actors chính (`Guest`, `Customer`, `Admin`)

---

## 1. MỤC TIÊU CỦA LAB 1
- Xác định chính xác phạm vi ranh giới hệ thống (System Boundary) và phân quyền 3 tác nhân.
- Xây dựng sơ đồ Use Case tổng quát (`uc-00-overview.puml`) bao quát 4 gói phân hệ:
  1. Quản lý tài khoản & Xác thực (`Guest`, `Customer`)
  2. Mua sắm & Đặt hàng COD (`Guest`, `Customer`)
  3. Theo dõi & Quản lý đơn hàng cá nhân (`Customer`)
  4. Quản trị hệ thống (`Admin`)
- Xây dựng 4 sơ đồ Use Case chi tiết có áp dụng quan hệ `<<include>>` và `<<extend>>` đúng chuẩn UML:
  - `uc-01-checkout-detail.puml`: Quy trình đặt hàng COD và áp dụng mã giảm giá.
  - `uc-02-customer-orders-detail.puml`: Quản lý đơn hàng của khách và hủy đơn theo điều kiện `PENDING`.
  - `uc-03-order-operations-detail.puml`: Vận hành đơn hàng và chuyển trạng thái của Admin.
  - `uc-04-catalog-inventory-detail.puml`: Quản lý danh mục, sản phẩm, biến thể size/màu và kiểm kê kho.
- Cung cấp danh mục bảng Use Case (`03-use-case-catalog.md`) và bản đặc tả kịch bản (`04-use-case-specifications.md`).

---

## 2. DANH MỤC FILE NỘP TRONG LAB 1
1. `uc-00-overview.puml`: Sơ đồ Use Case tổng quát toàn hệ thống.
2. `uc-01-checkout-detail.puml`: Sơ đồ Use Case chi tiết Đặt hàng COD & Giỏ hàng.
3. `uc-02-customer-orders-detail.puml`: Sơ đồ Use Case chi tiết Lịch sử đơn & Hủy đơn.
4. `uc-03-order-operations-detail.puml`: Sơ đồ Use Case chi tiết Vận hành đơn hàng Admin.
5. `uc-04-catalog-inventory-detail.puml`: Sơ đồ Use Case chi tiết Quản lý kho & Danh mục.
6. `03-use-case-catalog.md`: Bảng danh mục 14 Use Case cốt lõi.
7. `04-use-case-specifications.md`: Bản đặc tả chi tiết tiền điều kiện, hậu điều kiện, luồng chính và ngoại lệ.

