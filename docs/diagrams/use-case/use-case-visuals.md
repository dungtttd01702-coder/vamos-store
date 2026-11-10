# BẢN VẼ SƠ ĐỒ USE CASE CHUẨN MỰC - VAMOS STORE (v1.1)

Tài liệu này tổng hợp toàn bộ các sơ đồ Use Case của hệ thống **VAMOS STORE** đã được chuẩn hóa thống nhất theo mã định danh từ **`UC-01` đến `UC-14`**, 3 Actors chính và tuân thủ các nguyên tắc thiết kế chuyên nghiệp của Thầy và Thinhnotes.

---

## 1. SƠ ĐỒ USE CASE TỔNG QUAN (SYSTEM OVERVIEW)
* **File PlantUML:** [uc-00-overview.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/use-case/uc-00-overview.puml)
* **Mô tả:** 3 Actors chính: `Khách vãng lai` (Guest), `Khách hàng` (Customer kế thừa Guest) và `Quản trị viên` (Admin). Tổng cộng 14 Use Cases phân bổ theo 4 phân hệ cân xứng, không có đường cắt chéo.

```mermaid
flowchart LR
    classDef actorStyle fill:#F8F9FA,stroke:#212529,stroke-width:2px,color:#212529,font-weight:bold
    classDef ucStyle fill:#FFFFFF,stroke:#212529,stroke-width:1.5px,color:#212529

    subgraph ActorsLeft ["Phía Khách hàng"]
        Guest["Khách vãng lai\n(Guest)"]:::actorStyle
        Customer["Khách hàng\n(Customer)"]:::actorStyle
    end

    subgraph SystemBoundary ["VAMOS STORE - Hệ thống Website bán giày"]
        subgraph PkgAuth ["Tài khoản & Xác thực"]
            UC01(["UC-01: Đăng ký tài khoản"]):::ucStyle
            UC02(["UC-02: Đăng nhập"]):::ucStyle
            UC03(["UC-03: Khôi phục mật khẩu"]):::ucStyle
            UC04(["UC-04: Quản lý hồ sơ & địa chỉ"]):::ucStyle
        end

        subgraph PkgShopping ["Mua sắm & Đặt hàng"]
            UC05(["UC-05: Tìm kiếm & xem sản phẩm"]):::ucStyle
            UC06(["UC-06: Quản lý giỏ hàng"]):::ucStyle
            UC07(["UC-07: Đặt hàng COD"]):::ucStyle
        end

        subgraph PkgOrders ["Đơn hàng cá nhân"]
            UC08(["UC-08: Tra cứu & theo dõi đơn hàng"]):::ucStyle
            UC09(["UC-09: Hủy đơn hàng"]):::ucStyle
        end

        subgraph PkgAdmin ["Quản trị & Vận hành (Admin)"]
            UC10(["UC-10: Xử lý & cập nhật đơn hàng"]):::ucStyle
            UC11(["UC-11: Quản lý tồn kho"]):::ucStyle
            UC12(["UC-12: Quản lý sản phẩm & danh mục"]):::ucStyle
            UC13(["UC-13: Quản lý mã giảm giá"]):::ucStyle
            UC14(["UC-14: Xem báo cáo doanh thu"]):::ucStyle
        end
    end

    subgraph ActorsRight ["Phía Quản trị"]
        Admin["Quản trị viên\n(Admin)"]:::actorStyle
    end

    Customer -.->|kế thừa| Guest

    Guest --- UC01
    Guest --- UC02
    Guest --- UC03
    Guest --- UC05

    Customer --- UC04
    Customer --- UC06
    Customer --- UC07
    Customer --- UC08

    UC09 -.->|"<<extend>>\n[đơn PENDING]"| UC08

    Admin --- UC10
    Admin --- UC11
    Admin --- UC12
    Admin --- UC13
    Admin --- UC14
```

---

## 2. CHI TIẾT 1: PHÂN HỆ ĐẶT HÀNG COD (UC-07)
* **File PlantUML:** [uc-01-checkout-detail.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/use-case/uc-01-checkout-detail.puml)
* **Mô hình tương đồng 100% với ví dụ Đặt xe Grab của Thầy:**
  * `UC-07: Đặt hàng COD` bắt buộc `<<include>>`: *Chọn địa chỉ giao hàng*, *Kiểm tra tồn kho biến thể*, *Xác nhận thanh toán COD*.
  * `Áp dụng mã giảm giá` là nhánh `<<extend>>` tùy chọn vào `Đặt hàng`.

```mermaid
flowchart LR
    classDef actorStyle fill:#EBF5FF,stroke:#212529,stroke-width:2px,color:#212529,font-weight:bold
    classDef ucStyle fill:#FFFFFF,stroke:#212529,stroke-width:1.5px,color:#212529

    Customer["Khách hàng"]:::actorStyle

    subgraph BoundaryOrder ["VAMOS STORE - Phân hệ Đặt hàng COD"]
        UC06(["UC-06: Quản lý giỏ hàng"]):::ucStyle
        UC07(["UC-07: Đặt hàng COD"]):::ucStyle
        UC_Voucher(["Áp dụng mã giảm giá"]):::ucStyle

        UC_Address(["Chọn địa chỉ giao hàng"]):::ucStyle
        UC_StockCheck(["Kiểm tra tồn kho biến thể"]):::ucStyle
        UC_COD(["Xác nhận thanh toán COD"]):::ucStyle
    end

    Customer --- UC06
    Customer --- UC07
    Customer --- UC_Voucher

    UC07 -.->|"<<include>>"| UC_Address
    UC07 -.->|"<<include>>"| UC_StockCheck
    UC07 -.->|"<<include>>"| UC_COD

    UC_Voucher -.->|"<<extend>>"| UC07
```

---

## 3. CHI TIẾT 2: PHÂN HỆ ĐƠN HÀNG CÁ NHÂN (UC-08 & UC-09)
* **File PlantUML:** [uc-02-customer-orders-detail.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/use-case/uc-02-customer-orders-detail.puml)
* **Logic:** `UC-08: Tra cứu & theo dõi đơn hàng` bao gồm `<<include>>` lịch sử đơn hàng. `UC-09: Hủy đơn hàng` là mở rộng `<<extend>>` có điều kiện (*chỉ khi đơn ở trạng thái PENDING*).

```mermaid
flowchart LR
    classDef actorStyle fill:#EBF5FF,stroke:#212529,stroke-width:2px,color:#212529,font-weight:bold
    classDef ucStyle fill:#FFFFFF,stroke:#212529,stroke-width:1.5px,color:#212529

    Customer["Khách hàng"]:::actorStyle

    subgraph BoundaryOrders ["VAMOS STORE - Đơn hàng cá nhân"]
        UC_OrderList(["Xem lịch sử đơn hàng"]):::ucStyle
        UC08(["UC-08: Tra cứu & theo dõi đơn hàng"]):::ucStyle
        UC09(["UC-09: Hủy đơn hàng"]):::ucStyle
    end

    Customer --- UC_OrderList
    Customer --- UC08
    Customer --- UC09

    UC08 -.->|"<<include>>"| UC_OrderList
    UC09 -.->|"<<extend>>\n[chỉ khi đơn là PENDING]"| UC08
```

---

## 4. CHI TIẾT 3: PHÂN HỆ XỬ LÝ ĐƠN HÀNG ADMIN (UC-10)
* **File PlantUML:** [uc-03-order-operations-detail.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/use-case/uc-03-order-operations-detail.puml)
* **Logic:** `UC-10: Xử lý & cập nhật đơn hàng` bắt buộc `<<include>>`: *Tra cứu thông tin người nhận* và *Cập nhật trạng thái đơn*. Nhánh *Hủy đơn nội bộ* là `<<extend>>` khi có sự cố đơn ảo hoặc khách báo hủy.

```mermaid
flowchart LR
    classDef adminStyle fill:#FFF9E6,stroke:#212529,stroke-width:2px,color:#212529,font-weight:bold
    classDef ucStyle fill:#FFFFFF,stroke:#212529,stroke-width:1.5px,color:#212529

    Admin["Quản trị viên"]:::adminStyle

    subgraph BoundaryOps ["VAMOS STORE - Xử lý Đơn hàng"]
        UC10(["UC-10: Xử lý & cập nhật đơn hàng"]):::ucStyle
        UC_CustomerInfo(["Tra cứu thông tin người nhận"]):::ucStyle
        UC_UpdateStatus(["Cập nhật trạng thái đơn"]):::ucStyle
        UC_CancelInternal(["Hủy đơn hàng nội bộ"]):::ucStyle
    end

    Admin --- UC10
    Admin --- UC_CancelInternal

    UC10 -.->|"<<include>>"| UC_CustomerInfo
    UC10 -.->|"<<include>>"| UC_UpdateStatus
    UC_CancelInternal -.->|"<<extend>>\n[đơn PENDING/CONFIRMED;\nhoàn kho tự động]"| UC_UpdateStatus
```

---

## 5. CHI TIẾT 4: PHÂN HỆ QUẢN TRỊ SẢN PHẨM & TỒN KHO (UC-11 & UC-12)
* **File PlantUML:** [uc-04-catalog-inventory-detail.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/use-case/uc-04-catalog-inventory-detail.puml)
* **Logic:** `UC-12: Quản lý sản phẩm & danh mục` bắt buộc `<<include>>`: *Biến thể size/màu* và *Hình ảnh*. `Điều chỉnh tồn kho` mở rộng `<<extend>>` từ `UC-11: Quản lý tồn kho` khi kiểm kê chênh lệch.

```mermaid
flowchart LR
    classDef adminStyle fill:#E8F8F5,stroke:#212529,stroke-width:2px,color:#212529,font-weight:bold
    classDef ucStyle fill:#FFFFFF,stroke:#212529,stroke-width:1.5px,color:#212529

    Admin["Quản trị viên"]:::adminStyle

    subgraph BoundaryCatalog ["VAMOS STORE - Quản trị Sản phẩm & Kho"]
        UC12(["UC-12: Quản lý sản phẩm & danh mục"]):::ucStyle
        UC_VariantMgmt(["Quản lý biến thể size/màu"]):::ucStyle
        UC_ImageMgmt(["Quản lý hình ảnh sản phẩm"]):::ucStyle
        
        UC11(["UC-11: Quản lý tồn kho"]):::ucStyle
        UC_AdjustStock(["Điều chỉnh tồn kho"]):::ucStyle
    end

    Admin --- UC12
    Admin --- UC11
    Admin --- UC_AdjustStock

    UC12 -.->|"<<include>>"| UC_VariantMgmt
    UC12 -.->|"<<include>>"| UC_ImageMgmt
    UC_AdjustStock -.->|"<<extend>>\n[kiểm kê lệch kho;\nbắt buộc lý do]"| UC11
```
