# DANH MỤC VÀ PHÂN TÍCH HỆ THỐNG SƠ ĐỒ THIẾT KẾ VAMOS STORE

Tài liệu này tổng hợp và phân tích cấu trúc của toàn bộ hệ thống sơ đồ kỹ thuật trong đồ án **VAMOS STORE**, bao gồm Sơ đồ trường hợp sử dụng (Use Case Diagram), Sơ đồ thực thể liên kết (ERD) và Sơ đồ hoạt động (Activity Diagram).

---

## 1. PHÂN HỆ USE CASE DIAGRAM (SƠ ĐỒ TRƯỜNG HỢP SỬ DỤNG)

### 1.1. Bảng phân loại sơ đồ Use Case
| Mã sơ đồ | Tên sơ đồ | Tập tin lưu trữ | Phạm vi mô hình hóa |
|:---:|---|---|---|
| **UCD-01** | Sơ đồ Use Case tổng quan toàn hệ thống | `01_USE_CASE/01_USE_CASE_TONG_QUAT.png` | Bao quát toàn bộ 14 Use Case và 3 Tác nhân (`Guest`, `Customer`, `Admin`). |
| **UCD-02** | Sơ đồ Use Case chi tiết: Mua hàng COD | `01_USE_CASE/02_USE_CASE_MUA_HANG_COD.png` | Đi sâu vào luồng tương tác giữa Khách hàng với Giỏ hàng, Đặt hàng COD, Áp mã giảm giá và Hủy đơn hàng. |
| **UCD-03** | Sơ đồ Use Case chi tiết: Quản trị hệ thống | `01_USE_CASE/03_USE_CASE_QUAN_TRI_ADMIN.png` | Mô hình hóa quyền hạn nghiệp vụ của Quản trị viên: Quản lý danh mục, Quản lý SKU biến thể, Xử lý đơn hàng FSM, Quản lý kho và Báo cáo. |

### 1.2. Danh mục 14 Use Case nghiệp vụ chính thức
1. **UC01 — Đăng ký tài khoản (Register):** Tác nhân `Guest`. Tạo mới tài khoản người dùng, mã hóa mật khẩu bcrypt (salt=10), kiểm tra trùng lặp email/username.
2. **UC02 — Đăng nhập hệ thống (Login):** Tác nhân `Guest`. Xác thực thông tin người dùng, khởi tạo phiên làm việc bảo mật Express Session (`vamos_sid`).
3. **UC03 — Khôi phục mật khẩu (Password Reset):** Tác nhân `Guest` (phối hợp Actor kỹ thuật `Email Service`). *Lưu ý kỹ thuật: Hiện ở mức thiết kế cấu trúc dữ liệu bảng `password_reset_tokens`, chưa kích hoạt gateway gửi email thực tế*.
4. **UC04 — Quản lý hồ sơ & Sổ địa chỉ (Profile & Address):** Tác nhân `Customer`. Cập nhật thông tin cá nhân, quản lý sổ địa chỉ giao hàng với cơ chế địa chỉ mặc định được bảo vệ bởi Filtered Unique Index `uq_user_default_address`.
5. **UC05 — Tìm kiếm & Xem sản phẩm (Search & Browse):** Tác nhân `Guest`. Tìm kiếm theo từ khóa, lọc theo danh mục, thương hiệu, mức giá, kích cỡ và màu sắc.
6. **UC06 — Quản lý giỏ hàng trực tuyến (Cart Management):** Tác nhân `Customer`. Thêm sản phẩm theo biến thể (Size/Màu), cập nhật số lượng, xóa sản phẩm khỏi giỏ hàng lưu trữ bền vững trong CSDL.
7. **UC07 — Đặt hàng thanh toán COD (Checkout COD):** Tác nhân `Customer`. Chốt đơn hàng thanh toán khi nhận hàng, xác thực tồn kho tức thời, kiểm tra voucher hợp lệ, trừ tồn kho (`OUT_SALE`) trong MSSQL Transaction ACID.
8. **UC08 — Tra cứu & Theo dõi đơn hàng (Order Tracking):** Tác nhân `Customer`. Xem danh sách đơn hàng đã mua, theo dõi chi tiết trạng thái qua 6 bước FSM.
9. **UC09 — Hủy đơn hàng (Cancel Order):** Tác nhân `Customer`. Cho phép người mua tự hủy đơn khi đơn hàng đang ở trạng thái sơ khởi `PENDING`. Tự động hoàn lại tồn kho (`IN_CANCEL`) và phục hồi lượt dùng voucher.
10. **UC10 — Admin xử lý & Vận hành đơn hàng (Admin Order Processing):** Tác nhân `Admin`. Quản lý tiến trình đơn hàng tuần tự theo FSM: `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPING` -> `COMPLETED`, hoặc hủy đơn `CANCELLED`.
11. **UC11 — Quản lý tồn kho & Thẻ kho (Inventory Management):** Tác nhân `Admin`. Theo dõi số lượng khả dụng của từng biến thể SKU, ghi nhận nhật ký thẻ kho (`inventory_transactions`) theo từng loại nghiệp vụ (`IN_IMPORT`, `OUT_SALE`, `IN_CANCEL`, `ADJUST`).
12. **UC12 — Quản lý sản phẩm & Danh mục (Catalog Management):** Tác nhân `Admin`. Quản trị danh mục phân cấp, thương hiệu, sản phẩm và ma trận biến thể thuộc tính (Size x Color).
13. **UC13 — Quản lý mã giảm giá (Voucher Management):** Tác nhân `Admin`. Tạo và cấu hình mã voucher giảm giá (theo % hoặc số tiền cố định), thiết lập hạn mức chi tiêu tối thiểu, số lượng phát hành và thời hạn hiệu lực.
14. **UC14 — Báo cáo doanh thu & Thống kê (Revenue Reporting):** Tác nhân `Admin`. Tổng hợp doanh thu thực tế, số lượng đơn hàng hoàn tất, thống kê hàng tồn kho cảnh báo sắp hết và sản phẩm bán chạy.

---

## 2. PHÂN HỆ ENTITY RELATIONSHIP DIAGRAM (ERD CƠ SỞ DỮ LIỆU)

### 2.1. Bảng phân loại sơ đồ ERD
| Mã sơ đồ | Tên sơ đồ | Tập tin lưu trữ | Phạm vi mô hình hóa |
|:---:|---|---|---|
| **ERD-01** | Sơ đồ ERD tổng quan 20 bảng nghiệp vụ | `02_ERD/01_ERD_TONG_QUAT_20_BANG.png` | Toàn bộ 20 bảng nghiệp vụ, thể hiện tất cả các mối quan hệ 1-N, N-N, khóa chính và khóa ngoại trong hệ thống. |
| **ERD-02** | Sơ đồ ERD phân hệ Người dùng & Sổ địa chỉ | `02_ERD/02_ERD_NGUOI_DUNG_DIA_CHI.png` | Mô hình hóa 3 bảng: `users`, `addresses`, `password_reset_tokens`. |
| **ERD-03** | Sơ đồ ERD phân hệ Danh mục, Sản phẩm & Biến thể | `02_ERD/03_ERD_DANH_MUC_SAN_PHAM.png` | Mô hình hóa 6 bảng: `categories`, `brands`, `products`, `product_images`, `sizes`, `colors`, `product_variants`. |
| **ERD-04** | Sơ đồ ERD phân hệ Giỏ hàng & Tồn kho | `02_ERD/04_ERD_GIO_HANG_BIEN_THE.png` | Mô hình hóa 4 bảng: `carts`, `cart_items`, `wishlist_items`, `inventory_transactions`. |
| **ERD-05** | Sơ đồ ERD phân hệ Đơn hàng & Tiếp thị | `02_ERD/05_ERD_DON_HANG_LICH_SU.png` | Mô hình hóa 5 bảng: `orders`, `order_items`, `order_status_histories`, `vouchers`, `voucher_usages`, `banners`. |

### 2.2. Danh sách 20 bảng nghiệp vụ chuẩn xác (MSSQL Server 2022)
1. `users`: Tài khoản người dùng (ID, username, email, password_hash, role: CUSTOMER/ADMIN, status: ACTIVE/LOCKED, created_at, updated_at).
2. `addresses`: Sổ địa chỉ khách hàng (ID, user_id, recipient_name, phone_number, street_address, ward, district, city, is_default).
3. `password_reset_tokens`: Token khôi phục mật khẩu (ID, user_id, token_hash NVARCHAR(255) UNIQUE, expires_at, used_at).
4. `categories`: Danh mục sản phẩm (ID, category_name, slug UNIQUE, description, is_active).
5. `brands`: Thương hiệu sản phẩm (ID, brand_name, slug UNIQUE, logo_url, is_active).
6. `products`: Sản phẩm gốc (ID, category_id, brand_id, product_name, slug UNIQUE, base_price, description, status).
7. `product_images`: Bộ sưu tập ảnh sản phẩm (ID, product_id, image_url, is_primary, display_order).
8. `sizes`: Danh mục kích cỡ giày (ID, size_value, description).
9. `colors`: Danh mục màu sắc giày (ID, color_name, hex_code).
10. `product_variants`: Biến thể SKU độc lập (ID, product_id, size_id, color_id, sku UNIQUE, price, stock_quantity, is_active).
11. `inventory_transactions`: Thẻ kho nhật ký xuất nhập tồn (ID, variant_id, transaction_type: IN_IMPORT/OUT_SALE/IN_CANCEL/ADJUST, quantity, reference_id, note, created_at).
12. `carts`: Giỏ hàng của người dùng (ID, user_id UNIQUE, updated_at).
13. `cart_items`: Chi tiết mục hàng trong giỏ (ID, cart_id, variant_id, quantity, created_at).
14. `wishlist_items`: Danh sách sản phẩm yêu thích (ID, user_id, product_id, created_at).
15. `vouchers`: Mã giảm giá tiếp thị (ID, code UNIQUE, discount_type: PERCENT/FIXED, discount_value, min_order_value, max_discount, usage_limit, used_count, start_date, end_date, is_active).
16. `voucher_usages`: Nhật ký áp dụng voucher theo khách hàng (ID, voucher_id, user_id, order_id, used_at).
17. `banners`: Banner truyền thông quảng cáo (ID, title, image_url, target_url, display_order, is_active).
18. `orders`: Đơn hàng mua sắm (ID, order_code UNIQUE, user_id, total_amount, shipping_fee, discount_amount, final_amount, payment_method: COD, order_status: PENDING/CONFIRMED/PROCESSING/SHIPPING/COMPLETED/CANCELLED, delivery_address_snapshot NVARCHAR(255), recipient_name, recipient_phone, notes, created_at, updated_at).
19. `order_items`: Chi tiết dòng hàng đã chốt (ID, order_id, product_variant_id, quantity, unit_price, total_line_amount).
20. `order_status_histories`: Nhật ký kiểm toán chuyển đổi trạng thái đơn hàng (ID, order_id, previous_status, new_status, changed_by, change_reason, created_at).

*(Ghi chú: Bảng `schema_migrations` là bảng hạ tầng kỹ thuật của cơ chế Migration, không thuộc miền dữ liệu nghiệp vụ của hệ thống).*

---

## 3. PHÂN HỆ ACTIVITY DIAGRAM (SƠ ĐỒ HOẠT ĐỘNG NGHIỆP VỤ)

### 3.1. Bảng danh mục sơ đồ hoạt động
| Mã sơ đồ | Tên sơ đồ hoạt động | Tập tin lưu trữ | Các phân làn (Swimlanes) tham gia |
|:---:|---|---|---|
| **AD-01** | Quy trình Đăng ký tài khoản mới | `03_ACTIVITY_DIAGRAM/AD01_DANG_KY_TAI_KHOAN.png` | `Khách vãng lai (Guest)` -> `Hệ thống Web (Server)` -> `Cơ sở dữ liệu (Database)` |
| **AD-02** | Quy trình Đăng nhập hệ thống | `03_ACTIVITY_DIAGRAM/AD02_DANG_NHAP.png` | `Người dùng (User)` -> `Hệ thống Web (Server)` -> `Cơ sở dữ liệu (Database)` |
| **AD-03** | Quy trình Khôi phục mật khẩu (Mở rộng) | `03_ACTIVITY_DIAGRAM/AD03_QUEN_MAT_KHAU.png` | `Khách hàng` -> `Hệ thống Web` -> `Email Service` -> `Database` |
| **AD-04** | Quy trình Quản lý sổ địa chỉ (Mở rộng) | `03_ACTIVITY_DIAGRAM/AD04_QUAN_LY_SO_DIA_CHI.png` | `Khách hàng` -> `Hệ thống Web` -> `Database` |
| **AD-05** | Quy trình Tìm kiếm & Lọc sản phẩm | `03_ACTIVITY_DIAGRAM/AD05_TIM_KIEM_LOC_SAN_PHAM.png` | `Khách vãng lai` -> `Hệ thống Web` -> `Database` |
| **AD-06** | Quy trình Quản lý giỏ hàng trực tuyến | `03_ACTIVITY_DIAGRAM/AD06_QUAN_LY_GIO_HANG.png` | `Khách hàng` -> `Hệ thống Web` -> `Database` |
| **AD-08** | Quy trình Đặt hàng & Thanh toán COD | `03_ACTIVITY_DIAGRAM/AD08_DAT_HANG_COD.png` | `Khách hàng` -> `Hệ thống Web` -> `Database (ACID Transaction)` |
| **AD-10** | Quy trình Khách hàng hủy đơn hàng | `03_ACTIVITY_DIAGRAM/AD10_HUY_DON_HANG_KHACH_HANG.png` | `Khách hàng` -> `Hệ thống Web` -> `Database (Hoàn tồn kho)` |
| **AD-11** | Quy trình Admin xử lý & Vận hành đơn | `03_ACTIVITY_DIAGRAM/AD11_XU_LY_DON_HANG_ADMIN.png` | `Quản trị viên (Admin)` -> `Hệ thống Web` -> `Database (FSM)` |
| **AD-12** | Quy trình Quản lý kho & Thẻ kho | `03_ACTIVITY_DIAGRAM/AD12_QUAN_LY_TON_KHO.png` | `Quản trị viên` -> `Hệ thống Web` -> `Database` |
| **AD-13** | Quy trình Quản lý danh mục & Sản phẩm | `03_ACTIVITY_DIAGRAM/AD13_QUAN_LY_DANH_MUC_SAN_PHAM.png` | `Quản trị viên` -> `Hệ thống Web` -> `Database` |

### 3.2. Nguyên lý máy trạng thái đơn hàng (Order FSM)
Mọi quy trình liên quan đến đơn hàng trong hệ thống đều tuân thủ chặt chẽ vòng đời 6 trạng thái hữu hạn:
```text
[Khách đặt hàng] 
       │
       ▼
  (PENDING) ──────────[Khách hàng hoặc Admin Hủy]──────────► (CANCELLED)
       │                                                         ▲
       ▼                                                         │
  (CONFIRMED) ──────────────[Admin Hủy đơn]───────────────────────┘
       │
       ▼
 (PROCESSING) ──► (SHIPPING) ──► (COMPLETED)
```
- **Quy tắc trừ kho:** Trừ tức thời (`OUT_SALE`) ngay tại thời điểm đơn hàng được tạo lập thành công (`PENDING`) nhằm chống tình trạng Overselling khi nhiều khách cùng mua.
- **Quy tắc hoàn kho:** Tự động ghi nhận giao dịch nhập hoàn kho (`IN_CANCEL`) và cộng ngược số lượng khả dụng vào `product_variants.stock_quantity` khi đơn bị hủy từ `PENDING` hoặc `CONFIRMED`.
- **Tuyệt đối không có trạng thái lạ:** Không tồn tại `SHIPPED` hay `DELIVERED` ngoài 6 trạng thái đã quy định trong DDL và mã nguồn backend.
