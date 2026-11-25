# TỪ ĐIỂN DỮ LIỆU CƠ SỞ DỮ LIỆU (DATA DICTIONARY)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ BÁN GIÀY VAMOS STORE

> **Dự án:** VAMOS STORE — Website Thương mại điện tử Bán giày chuyên nghiệp  
> **Hệ quản trị CSDL:** Microsoft SQL Server 2019 / 2022 (T-SQL)  
> **Tên CSDL:** `vamos_store_db`  
> **Tổng số bảng:** 28 bảng (21 bảng nền tảng `001`–`004` + 6 bảng VAMOS CLUB `005` + 1 bảng `loyalty_point_batches` trong `006` — lưu ý Migration `006` mới tạo trong mã nguồn, **chưa chạy DDL trên SQL Server runtime**)
> **Phiên bản tài liệu:** v2.0 (Trích xuất và kiểm chứng 100% từ cấu trúc CSDL thực tế)  
> **Cập nhật ngày:** 14/11/2026  

---

## MỤC LỤC TỪ ĐIỂN DỮ LIỆU (28 BẢNG TỪ `001`–`006`)

### Phân nhóm 1: Người dùng & Phân quyền
1. [`users` — Tài khoản người dùng](#1-bang-users--tai-khoan-nguoi-dung)
2. [`addresses` — Sổ địa chỉ giao hàng](#2-bang-addresses--so-dia-chi-giao-hang)
3. [`password_reset_tokens` — Mã xác thực đặt lại mật khẩu](#3-bang-password_reset_tokens--ma-xac-thuc-dat-lai-mat-khau)

### Phân nhóm 2: Sản phẩm & Ma trận Biến thể
4. [`categories` — Danh mục sản phẩm](#4-bang-categories--danh-muc-san-pham)
5. [`brands` — Thương hiệu / Bộ sưu tập](#5-bang-brands--thuong-hieu--bo-suu-tap)
6. [`sizes` — Bảng kích cỡ giày](#6-bang-sizes--bang-kich-co-giay)
7. [`colors` — Bảng màu sắc giày](#7-bang-colors--bang-mau-sac-giay)
8. [`products` — Sản phẩm giày dép](#8-bang-products--san-pham-giay-dep)
9. [`product_images` — Bộ sưu tập hình ảnh sản phẩm](#9-bang-product_images--bo-suu-tap-hinh-anh-san-pham)
10. [`product_variants` — Biến thể sản phẩm (SKU chi tiết)](#10-bang-product_variants--bien-the-san-pham-sku-chi-tiet)

### Phân nhóm 3: Tồn kho & Kiểm kê
11. [`inventory_transactions` — Nhật ký biến động tồn kho](#11-bang-inventory_transactions--nhat-ky-bien-dong-ton-kho)

### Phân nhóm 4: Khách hàng, Giỏ hàng & Yêu thích
12. [`carts` — Giỏ hàng thành viên](#12-bang-carts--gio-hang-thanh-vien)
13. [`cart_items` — Chi tiết mặt hàng trong giỏ](#13-bang-cart_items--chi-tiet-mat-hang-trong-gio)
14. [`wishlist_items` — Danh sách sản phẩm yêu thích (Wishlist)](#14-bang-wishlist_items--danh-sach-san-pham-yeu-thich-wishlist)

### Phân nhóm 5: Khuyến mãi, Đơn hàng & Vận hành Cửa hàng
15. [`vouchers` — Mã giảm giá khuyến mãi](#15-bang-vouchers--ma-giam-gia-khuyen-mai)
16. [`voucher_usages` — Lịch sử sử dụng voucher theo khách hàng](#16-bang-voucher_usages--lich-su-su-dung-voucher-theo-khach-hang)
17. [`orders` — Đơn hàng mua sắm](#17-bang-orders--don-hang-mua-sam)
18. [`order_items` — Chi tiết mặt hàng trong đơn hàng](#18-bang-order_items--chi-tiet-mat-hang-trong-don-hang)
19. [`order_status_histories` — Lịch sử trạng thái đơn hàng (Audit Trail)](#19-bang-order_status_histories--lich-su-trang-thai-don-hang-audit-trail)
20. [`banners` — Banner quảng cáo trang chủ](#20-bang-banners--banner-quang-cao-trang-chu)

### Phân nhóm 6: Quản lý Hệ thống
21. [`schema_migrations` — Bảng hệ thống quản lý di chuyển CSDL](#21-bang-schema_migrations--bang-he-thong-quan-ly-di-chuyen-csdl)

### Phân nhóm 7: VAMOS CLUB — Đánh giá & Điểm thưởng (`005` & `006`)
- Chi tiết 6 bảng `005` (`reviews`, `review_media`, `user_points_wallets`, `point_transactions`, `point_reward_rules`, `voucher_redemptions`) và phần mở rộng `006` (`cycle_anchor_at`, `cycle_number`, `cycle_start_at`, `cycle_end_at`, `qualifying_points_cycle`, bảng `loyalty_point_batches`, loại `POINT_EXPIRATION`) được tài liệu hóa đầy đủ tại [VAMOS_CLUB_DATA_DICTIONARY.md](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md).

---

### 1. BẢNG `users` — TÀI KHOẢN NGƯỜI DÙNG

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `users`
- **Tên nghiệp vụ:** Tài khoản người dùng
- **Mục đích sử dụng:** Lưu trữ thông tin định danh, xác thực và phân quyền của toàn bộ người dùng trong hệ thống (Khách hàng và Quản trị viên).
- **Chức năng nghiệp vụ liên quan:** UC01 (Đăng ký), UC02 (Đăng nhập), UC04 (Quản lý hồ sơ), UC16 (Quản lý tài khoản khách hàng).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh người dùng |
| 2 | `full_name` | `NVARCHAR(100)` | 100 | - | - | NO | - | Họ và tên đầy đủ của người dùng |
| 3 | `email` | `NVARCHAR(150)` | 150 | - | - | NO | - | Địa chỉ thư điện tử dùng để đăng nhập và nhận thông báo (duy nhất) |
| 4 | `password_hash` | `NVARCHAR(255)` | 255 | - | - | NO | - | Chuỗi băm mật khẩu bảo mật một chiều tạo bởi bcrypt (salt rounds = 10) |
| 5 | `phone` | `NVARCHAR(20)` | 20 | - | - | YES | - | Số điện thoại liên lạc của người dùng (10 chữ số) |
| 6 | `role` | `NVARCHAR(20)` | 20 | - | - | NO | `('CUSTOMER')` | Vai trò phân quyền trong hệ thống: CUSTOMER (Khách hàng) hoặc ADMIN (Quản trị viên) |
| 7 | `status` | `NVARCHAR(20)` | 20 | - | - | NO | `('active')` | Trạng thái hoạt động của tài khoản: active (Bình thường) hoặc locked (Bị khóa) |
| 8 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian tài khoản được khởi tạo |
| 9 | `updated_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian cập nhật thông tin gần nhất |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__users__3213E83FC37607E2` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):** Không có (Bảng độc lập / Master Reference Table)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `UQ__users__AB6E6164650D83F1` trên cột `(email)`
- **Ràng buộc kiểm tra miền giá trị (Check Constraints):**
  + `CK__users__role__4CA06362`: `([role]='CUSTOMER' OR [role]='ADMIN')`
  + `CK__users__status__4E88ABD4`: `([status]='locked' OR [status]='active')`

---

### 2. BẢNG `addresses` — SỔ ĐỊA CHỈ GIAO HÀNG

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `addresses`
- **Tên nghiệp vụ:** Sổ địa chỉ giao hàng
- **Mục đích sử dụng:** Lưu trữ danh sách các địa chỉ nhận hàng của khách hàng thành viên phục vụ giao dịch đặt hàng nhanh chóng.
- **Chức năng nghiệp vụ liên quan:** UC04 (Quản lý sổ địa chỉ), UC07 (Đặt hàng COD).
- **Tệp Migration tạo lập:** `001_initial_schema.sql, 002_add_filtered_indexes.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh địa chỉ |
| 2 | `user_id` | `INT` | - | - | ✓ (users) | NO | - | Khóa ngoại tham chiếu đến bảng users(id) |
| 3 | `recipient_name` | `NVARCHAR(100)` | 100 | - | - | NO | - | Họ và tên của người nhận hàng tại địa chỉ này |
| 4 | `phone` | `NVARCHAR(20)` | 20 | - | - | NO | - | Số điện thoại người nhận hàng |
| 5 | `province` | `NVARCHAR(100)` | 100 | - | - | NO | - | Tỉnh hoặc Thành phố trực thuộc trung ương |
| 6 | `district` | `NVARCHAR(100)` | 100 | - | - | NO | - | Quận, Huyện hoặc Thị xã |
| 7 | `ward` | `NVARCHAR(100)` | 100 | - | - | NO | - | Phường, Xã hoặc Thị trấn |
| 8 | `detail_address` | `NVARCHAR(255)` | 255 | - | - | NO | - | Số nhà, tên đường, tòa nhà hoặc ngõ xóm chi tiết |
| 9 | `is_default` | `BIT` | - | - | - | NO | `((0))` | Cờ đánh dấu địa chỉ giao hàng mặc định (1 = Mặc định, 0 = Phụ) |
| 10 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian tạo địa chỉ |
| 11 | `updated_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian cập nhật địa chỉ |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__addresse__3213E83FAC6D3FC2` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):**
  + `fk_addresses_user`: `addresses.user_id` $\rightarrow$ `users.id` (ON DELETE: `CASCADE`, ON UPDATE: `NO_ACTION`)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `uq_user_default_address` trên cột `(user_id)` *(Filtered Index: `([is_default]=(1))`)*
- **Ràng buộc kiểm tra (Check Constraints):** Không có

---

### 3. BẢNG `password_reset_tokens` — MÃ XÁC THỰC ĐẶT LẠI MẬT KHẨU

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `password_reset_tokens`
- **Tên nghiệp vụ:** Mã xác thực đặt lại mật khẩu
- **Mục đích sử dụng:** Lưu trữ các mã token bảo mật phục vụ quy trình khôi phục mật khẩu khi người dùng quên mật khẩu (Cấu trúc DB đã sẵn sàng).
- **Chức năng nghiệp vụ liên quan:** UC03 (Khôi phục mật khẩu - Bản thiết kế / Designed Only).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh bản ghi token |
| 2 | `user_id` | `INT` | - | - | ✓ (users) | NO | - | Khóa ngoại tham chiếu đến tài khoản người dùng users(id) |
| 3 | `token` | `NVARCHAR(255)` | 255 | - | - | NO | - | Chuỗi token ngẫu nhiên bảo mật dùng để xác thực quyền đổi mật khẩu (Unique) |
| 4 | `expires_at` | `DATETIME2` | - | - | - | NO | - | Mốc thời gian hết hạn của token xác thực |
| 5 | `used_at` | `DATETIME2` | - | - | - | YES | - | Mốc thời gian token đã được sử dụng (NULL nếu chưa dùng) |
| 6 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian sinh token |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__password__3213E83FF40122E3` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):**
  + `fk_pwd_reset_user`: `password_reset_tokens.user_id` $\rightarrow$ `users.id` (ON DELETE: `CASCADE`, ON UPDATE: `NO_ACTION`)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `UQ__password__CA90DA7A029F320E` trên cột `(token)`
- **Ràng buộc kiểm tra (Check Constraints):** Không có

---

### 4. BẢNG `categories` — DANH MỤC SẢN PHẨM

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `categories`
- **Tên nghiệp vụ:** Danh mục sản phẩm
- **Mục đích sử dụng:** Phân loại các nhóm sản phẩm giày dép trong cửa hàng để phục vụ việc điều hướng và lọc sản phẩm.
- **Chức năng nghiệp vụ liên quan:** UC05 (Tìm kiếm & xem sản phẩm), UC12 (Quản lý danh mục sản phẩm).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh danh mục |
| 2 | `name` | `NVARCHAR(100)` | 100 | - | - | NO | - | Tên danh mục sản phẩm (ví dụ: Sneaker Nam, Giày Thể Thao) |
| 3 | `slug` | `NVARCHAR(120)` | 120 | - | - | NO | - | Chuỗi định danh URL thân thiện cho SEO (duy nhất) |
| 4 | `description` | `NVARCHAR(MAX)` | MAX | - | - | YES | - | Mô tả chi tiết về nhóm sản phẩm trong danh mục |
| 5 | `is_active` | `BIT` | - | - | - | NO | `((1))` | Cờ kích hoạt hiển thị danh mục trên storefront (1 = Hiện, 0 = Ẩn) |
| 6 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian tạo danh mục |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__categori__3213E83F147EE36C` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):** Không có (Bảng độc lập / Master Reference Table)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `UQ__categori__32DD1E4CB45D923E` trên cột `(slug)`
- **Ràng buộc kiểm tra (Check Constraints):** Không có

---

### 5. BẢNG `brands` — THƯƠNG HIỆU / BỘ SƯU TẬP

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `brands`
- **Tên nghiệp vụ:** Thương hiệu / Bộ sưu tập
- **Mục đích sử dụng:** Quản lý các nhãn hiệu hoặc dòng bộ sưu tập của sản phẩm giày (VAMOS Originals, VAMOS Sport, VAMOS Active).
- **Chức năng nghiệp vụ liên quan:** UC05 (Lọc sản phẩm theo thương hiệu), UC12 (Quản lý thương hiệu).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh thương hiệu |
| 2 | `name` | `NVARCHAR(100)` | 100 | - | - | NO | - | Tên thương hiệu hoặc dòng bộ sưu tập (duy nhất) |
| 3 | `slug` | `NVARCHAR(120)` | 120 | - | - | NO | - | Chuỗi định danh URL thân thiện cho SEO (duy nhất) |
| 4 | `description` | `NVARCHAR(MAX)` | MAX | - | - | YES | - | Mô tả thông điệp và phong cách của thương hiệu |
| 5 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian tạo thương hiệu |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__brands__3213E83F95956B87` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):** Không có (Bảng độc lập / Master Reference Table)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `UQ__brands__32DD1E4CBC635641` trên cột `(slug)`
- **Ràng buộc kiểm tra (Check Constraints):** Không có

---

### 6. BẢNG `sizes` — BẢNG KÍCH CỠ GIÀY

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `sizes`
- **Tên nghiệp vụ:** Bảng kích cỡ giày
- **Mục đích sử dụng:** Danh mục chuẩn hóa các cỡ giày dép phục vụ việc tạo ma trận biến thể sản phẩm.
- **Chức năng nghiệp vụ liên quan:** UC05 (Lọc theo cỡ giày), UC06 (Chọn cỡ vào giỏ), UC12 (Cấu hình biến thể).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh kích cỡ |
| 2 | `size_name` | `NVARCHAR(20)` | 20 | - | - | NO | - | Tên kích cỡ chuẩn hóa (ví dụ: 38, 39, 40, 41, 42, 43, 44) |
| 3 | `display_order` | `INT` | - | - | - | NO | `((0))` | Thứ tự ưu tiên hiển thị trên danh sách lựa chọn |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__sizes__3213E83FDEE648AB` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):** Không có (Bảng độc lập / Master Reference Table)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `UQ__sizes__75FCE556AA696792` trên cột `(size_name)`
- **Ràng buộc kiểm tra (Check Constraints):** Không có

---

### 7. BẢNG `colors` — BẢNG MÀU SẮC GIÀY

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `colors`
- **Tên nghiệp vụ:** Bảng màu sắc giày
- **Mục đích sử dụng:** Danh mục chuẩn hóa các màu sắc sản phẩm kèm mã màu Hex phục vụ hiển thị trực quan.
- **Chức năng nghiệp vụ liên quan:** UC05 (Lọc theo màu), UC06 (Chọn màu vào giỏ), UC12 (Cấu hình biến thể).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh màu sắc |
| 2 | `color_name` | `NVARCHAR(50)` | 50 | - | - | NO | - | Tên gọi của màu sắc (ví dụ: Đen, Trắng, Xanh Navy, Xám, Đỏ Đô) |
| 3 | `hex_code` | `NVARCHAR(10)` | 10 | - | - | YES | - | Mã màu Hex dạng #RRGGBB phục vụ hiển thị ô màu trực quan |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__colors__3213E83FFC7A18A0` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):** Không có (Bảng độc lập / Master Reference Table)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `UQ__colors__2F423AB8DBA1B0E6` trên cột `(color_name)`
- **Ràng buộc kiểm tra (Check Constraints):** Không có

---

### 8. BẢNG `products` — SẢN PHẨM GIÀY DÉP

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `products`
- **Tên nghiệp vụ:** Sản phẩm giày dép
- **Mục đích sử dụng:** Lưu trữ thông tin chung gốc của các mẫu giày dép được bày bán trong hệ thống.
- **Chức năng nghiệp vụ liên quan:** UC05 (Tìm kiếm, xem sản phẩm), UC12 (Quản lý sản phẩm), UC14 (Top bán chạy).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh sản phẩm |
| 2 | `category_id` | `INT` | - | - | ✓ (categories) | NO | - | Khóa ngoại tham chiếu đến danh mục categories(id) |
| 3 | `brand_id` | `INT` | - | - | ✓ (brands) | YES | - | Khóa ngoại tham chiếu đến thương hiệu brands(id) (ON DELETE SET NULL) |
| 4 | `product_code` | `NVARCHAR(50)` | 50 | - | - | NO | - | Mã định danh sản phẩm nội bộ (ví dụ: SP001, VMS-SNK-01 - duy nhất) |
| 5 | `name` | `NVARCHAR(200)` | 200 | - | - | NO | - | Tên thương mại của sản phẩm giày dép |
| 6 | `slug` | `NVARCHAR(255)` | 255 | - | - | NO | - | Chuỗi định danh URL thân thiện cho SEO (duy nhất) |
| 7 | `description` | `NVARCHAR(MAX)` | MAX | - | - | YES | - | Mô tả chi tiết về chất liệu, thiết kế và công nghệ của giày |
| 8 | `gender_target` | `NVARCHAR(20)` | 20 | - | - | NO | `('UNISEX')` | Phân loại đối tượng phục vụ: MEN, WOMEN, KIDS, UNISEX |
| 9 | `base_price` | `DECIMAL(12, 0)` | 12,0 | - | - | NO | - | Giá bán niêm yết gốc của sản phẩm (VNĐ) |
| 10 | `sale_price` | `DECIMAL(12, 0)` | 12,0 | - | - | YES | - | Giá bán khuyến mãi (nếu có, bắt buộc 0 <= sale_price < base_price) |
| 11 | `status` | `NVARCHAR(20)` | 20 | - | - | NO | `('active')` | Trạng thái kinh doanh sản phẩm: active (Đang bán), inactive (Ngừng bán), draft (Bản nháp) |
| 12 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian tạo sản phẩm |
| 13 | `updated_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian cập nhật thông tin sản phẩm |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__products__3213E83FF70C7DCB` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):**
  + `fk_products_category`: `products.category_id` $\rightarrow$ `categories.id` (ON DELETE: `NO_ACTION`, ON UPDATE: `NO_ACTION`)
  + `fk_products_brand`: `products.brand_id` $\rightarrow$ `brands.id` (ON DELETE: `SET_NULL`, ON UPDATE: `NO_ACTION`)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `UQ__products__32DD1E4C2AADCC66` trên cột `(slug)`
  + `UQ__products__AE1A8CC42851502C` trên cột `(product_code)`
- **Ràng buộc kiểm tra miền giá trị (Check Constraints):**
  + `CK__products__gender__07C12930`: `([gender_target]='UNISEX' OR [gender_target]='KIDS' OR [gender_target]='WOMEN' OR [gender_target]='MEN')`
  + `CK__products__base_p__08B54D69`: `([base_price]>=(0))`
  + `CK__products__status__0A9D95DB`: `([status]='draft' OR [status]='inactive' OR [status]='active')`
  + `chk_products_sale_price`: `([sale_price] IS NULL OR [sale_price]>=(0) AND [sale_price]<[base_price])`

---

### 9. BẢNG `product_images` — BỘ SƯU TẬP HÌNH ẢNH SẢN PHẨM

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `product_images`
- **Tên nghiệp vụ:** Bộ sưu tập hình ảnh sản phẩm
- **Mục đích sử dụng:** Lưu trữ các liên kết hình ảnh chi tiết của sản phẩm để trình chiếu gallery trên storefront.
- **Chức năng nghiệp vụ liên quan:** UC05 (Xem ảnh sản phẩm), UC12 (Tải lên và sắp xếp ảnh).
- **Tệp Migration tạo lập:** `001_initial_schema.sql, 002_add_filtered_indexes.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh hình ảnh |
| 2 | `product_id` | `INT` | - | - | ✓ (products) | NO | - | Khóa ngoại tham chiếu đến bảng products(id) (ON DELETE CASCADE) |
| 3 | `image_url` | `NVARCHAR(1000)` | 1000 | - | - | NO | - | Đường dẫn URL hình ảnh sản phẩm (CDN hoặc thư mục tĩnh) |
| 4 | `is_primary` | `BIT` | - | - | - | NO | `((0))` | Cờ đánh dấu ảnh đại diện chính của sản phẩm (tối đa 1 ảnh primary qua Filtered Index) |
| 5 | `display_order` | `INT` | - | - | - | NO | `((0))` | Thứ tự ưu tiên hiển thị trong album ảnh |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__product___3213E83F23409C94` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):**
  + `fk_product_images_product`: `product_images.product_id` $\rightarrow$ `products.id` (ON DELETE: `CASCADE`, ON UPDATE: `NO_ACTION`)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `uq_product_primary_image` trên cột `(product_id)` *(Filtered Index: `([is_primary]=(1))`)*
- **Ràng buộc kiểm tra (Check Constraints):** Không có

---

### 10. BẢNG `product_variants` — BIẾN THỂ SẢN PHẨM (SKU CHI TIẾT)

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `product_variants`
- **Tên nghiệp vụ:** Biến thể sản phẩm (SKU chi tiết)
- **Mục đích sử dụng:** Quản lý tổ hợp Kích cỡ x Màu sắc chi tiết của sản phẩm kèm số lượng tồn kho khả dụng.
- **Chức năng nghiệp vụ liên quan:** UC05 (Xem tồn biến thể), UC06 (Thêm giỏ), UC07 (Trừ tồn kho), UC09 (Hoàn kho), UC11 (Kiểm kê kho).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh biến thể SKU |
| 2 | `product_id` | `INT` | - | - | ✓ (products) | NO | - | Khóa ngoại tham chiếu đến sản phẩm cha products(id) (ON DELETE CASCADE) |
| 3 | `size_id` | `INT` | - | - | ✓ (sizes) | NO | - | Khóa ngoại tham chiếu đến kích cỡ sizes(id) |
| 4 | `color_id` | `INT` | - | - | ✓ (colors) | NO | - | Khóa ngoại tham chiếu đến màu sắc colors(id) |
| 5 | `sku` | `NVARCHAR(100)` | 100 | - | - | NO | - | Mã đơn vị lưu kho duy nhất của từng biến thể (ví dụ: VMS-SNK01-BLK-42) |
| 6 | `stock_quantity` | `INT` | - | - | - | NO | `((0))` | Số lượng tồn kho thực tế khả dụng (không được âm) |
| 7 | `status` | `NVARCHAR(20)` | 20 | - | - | NO | `('active')` | Trạng thái hoạt động của biến thể: active hoặc inactive |
| 8 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian tạo biến thể |
| 9 | `updated_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian cập nhật số lượng tồn hoặc thông tin biến thể |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__product___3213E83F745269CC` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):**
  + `fk_variants_product`: `product_variants.product_id` $\rightarrow$ `products.id` (ON DELETE: `CASCADE`, ON UPDATE: `NO_ACTION`)
  + `fk_variants_size`: `product_variants.size_id` $\rightarrow$ `sizes.id` (ON DELETE: `NO_ACTION`, ON UPDATE: `NO_ACTION`)
  + `fk_variants_color`: `product_variants.color_id` $\rightarrow$ `colors.id` (ON DELETE: `NO_ACTION`, ON UPDATE: `NO_ACTION`)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `UQ__product___DDDF4BE74366123F` trên cột `(sku)`
  + `uq_variants_combination` trên cột `(product_id, size_id, color_id)`
- **Ràng buộc kiểm tra miền giá trị (Check Constraints):**
  + `CK__product_v__stock__19DFD96B`: `([stock_quantity]>=(0))`
  + `CK__product_v__statu__1BC821DD`: `([status]='inactive' OR [status]='active')`

---

### 11. BẢNG `inventory_transactions` — NHẬT KÝ BIẾN ĐỘNG TỒN KHO

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `inventory_transactions`
- **Tên nghiệp vụ:** Nhật ký biến động tồn kho
- **Mục đích sử dụng:** Lưu vết kiểm toán bất biến mọi giao dịch làm thay đổi số lượng tồn kho của từng biến thể SKU.
- **Chức năng nghiệp vụ liên quan:** UC07 (Xuất kho bán hàng), UC09/10 (Hoàn kho khi hủy đơn), UC11 (Điều chỉnh tồn thủ công).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh giao dịch kho |
| 2 | `variant_id` | `INT` | - | - | ✓ (product_variants) | NO | - | Khóa ngoại tham chiếu đến biến thể product_variants(id) |
| 3 | `user_id` | `INT` | - | - | ✓ (users) | NO | - | Khóa ngoại tham chiếu đến người thực hiện users(id) (Khách mua hoặc Admin kiểm kê) |
| 4 | `old_quantity` | `INT` | - | - | - | NO | - | Số lượng tồn kho trước khi thay đổi (>= 0) |
| 5 | `new_quantity` | `INT` | - | - | - | NO | - | Số lượng tồn kho sau khi thay đổi (>= 0) |
| 6 | `change_quantity` | `INT` | - | - | - | NO | - | Độ biến động tồn kho (số dương là nhập/hoàn, số âm là xuất) |
| 7 | `reason` | `NVARCHAR(255)` | 255 | - | - | NO | - | Lý do bắt buộc giải thích cho biến động kho |
| 8 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian phát sinh giao dịch xuất nhập kho |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__inventor__3213E83FB660BB74` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):**
  + `fk_inv_trans_variant`: `inventory_transactions.variant_id` $\rightarrow$ `product_variants.id` (ON DELETE: `NO_ACTION`, ON UPDATE: `NO_ACTION`)
  + `fk_inv_trans_user`: `inventory_transactions.user_id` $\rightarrow$ `users.id` (ON DELETE: `NO_ACTION`, ON UPDATE: `NO_ACTION`)
- **Ràng buộc duy nhất (Unique Constraints):** Không có
- **Ràng buộc kiểm tra miền giá trị (Check Constraints):**
  + `CK__inventory__old_q__498EEC8D`: `([old_quantity]>=(0))`
  + `CK__inventory__new_q__4A8310C6`: `([new_quantity]>=(0))`

---

### 12. BẢNG `carts` — GIỎ HÀNG THÀNH VIÊN

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `carts`
- **Tên nghiệp vụ:** Giỏ hàng thành viên
- **Mục đích sử dụng:** Quản lý giỏ hàng lưu trữ bền vững trên CSDL của khách hàng thành viên (Quan hệ 1-1 với users).
- **Chức năng nghiệp vụ liên quan:** UC01/02 (Khởi tạo & gộp giỏ hàng), UC06 (Quản lý giỏ hàng thành viên).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh giỏ hàng |
| 2 | `user_id` | `INT` | - | - | ✓ (users) | NO | - | Khóa ngoại tham chiếu duy nhất đến tài khoản khách hàng users(id) (ON DELETE CASCADE) |
| 3 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian khởi tạo giỏ hàng |
| 4 | `updated_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian giỏ hàng được cập nhật gần nhất |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__carts__3213E83FBEEBC15D` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):**
  + `fk_carts_user`: `carts.user_id` $\rightarrow$ `users.id` (ON DELETE: `CASCADE`, ON UPDATE: `NO_ACTION`)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `UQ__carts__B9BE370EFEB24BD8` trên cột `(user_id)`
- **Ràng buộc kiểm tra (Check Constraints):** Không có

---

### 13. BẢNG `cart_items` — CHI TIẾT MẶT HÀNG TRONG GIỎ

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `cart_items`
- **Tên nghiệp vụ:** Chi tiết mặt hàng trong giỏ
- **Mục đích sử dụng:** Lưu trữ các dòng sản phẩm biến thể mà khách hàng thành viên đang dự định mua.
- **Chức năng nghiệp vụ liên quan:** UC06 (Thêm, sửa, xóa giỏ hàng), UC07 (Dọn sạch giỏ sau khi đặt hàng thành công).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh dòng giỏ hàng |
| 2 | `cart_id` | `INT` | - | - | ✓ (carts) | NO | - | Khóa ngoại tham chiếu đến giỏ hàng carts(id) (ON DELETE CASCADE) |
| 3 | `variant_id` | `INT` | - | - | ✓ (product_variants) | NO | - | Khóa ngoại tham chiếu đến biến thể product_variants(id) |
| 4 | `quantity` | `INT` | - | - | - | NO | `((1))` | Số lượng mặt hàng dự định mua (ràng buộc > 0, tối đa 10 đôi theo giới hạn bán lẻ) |
| 5 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian thêm mặt hàng vào giỏ |
| 6 | `updated_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian cập nhật số lượng |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__cart_ite__3213E83FF0ABEC3F` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):**
  + `fk_cart_items_cart`: `cart_items.cart_id` $\rightarrow$ `carts.id` (ON DELETE: `CASCADE`, ON UPDATE: `NO_ACTION`)
  + `fk_cart_items_variant`: `cart_items.variant_id` $\rightarrow$ `product_variants.id` (ON DELETE: `NO_ACTION`, ON UPDATE: `NO_ACTION`)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `uq_cart_variant` trên cột `(cart_id, variant_id)`
- **Ràng buộc kiểm tra miền giá trị (Check Constraints):**
  + `CK__cart_item__quant__25518C17`: `([quantity]>(0))`

---

### 14. BẢNG `wishlist_items` — DANH SÁCH SẢN PHẨM YÊU THÍCH (WISHLIST)

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `wishlist_items`
- **Tên nghiệp vụ:** Danh sách sản phẩm yêu thích (Wishlist)
- **Mục đích sử dụng:** Lưu trữ bền vững danh sách các sản phẩm mà khách hàng thành viên bấm thích (Thao tác 1-Click Toggle).
- **Chức năng nghiệp vụ liên quan:** UC15 (Quản lý danh sách yêu thích).
- **Tệp Migration tạo lập:** `004_create_wishlist_items.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh bản ghi yêu thích |
| 2 | `user_id` | `INT` | - | - | ✓ (users) | NO | - | Khóa ngoại tham chiếu đến tài khoản khách hàng users(id) (ON DELETE CASCADE) |
| 3 | `product_id` | `INT` | - | - | ✓ (products) | NO | - | Khóa ngoại tham chiếu đến sản phẩm products(id) (ON DELETE CASCADE) |
| 4 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian khách hàng bấm lưu sản phẩm vào danh sách yêu thích |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__wishlist__3213E83F0330F2F5` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):**
  + `fk_wishlist_items_user`: `wishlist_items.user_id` $\rightarrow$ `users.id` (ON DELETE: `CASCADE`, ON UPDATE: `NO_ACTION`)
  + `fk_wishlist_items_product`: `wishlist_items.product_id` $\rightarrow$ `products.id` (ON DELETE: `CASCADE`, ON UPDATE: `NO_ACTION`)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `uq_wishlist_user_product` trên cột `(user_id, product_id)`
- **Ràng buộc kiểm tra (Check Constraints):** Không có
- **Chỉ mục hiệu năng bổ sung (Performance Indexes):**
  + `ix_wishlist_items_product_id` (NONCLUSTERED) trên cột `(product_id)`
  + `ix_wishlist_items_user_id` (NONCLUSTERED) trên cột `(user_id)`

---

### 15. BẢNG `vouchers` — MÃ GIẢM GIÁ KHUYẾN MÃI

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `vouchers`
- **Tên nghiệp vụ:** Mã giảm giá khuyến mãi
- **Mục đích sử dụng:** Cấu hình các chương trình ưu đãi giảm giá bằng voucher do quản trị viên thiết lập.
- **Chức năng nghiệp vụ liên quan:** UC07 (Áp dụng giảm giá khi checkout), UC13 (Quản trị voucher).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh voucher |
| 2 | `code` | `NVARCHAR(50)` | 50 | - | - | NO | - | Mã ký tự voucher khuyến mãi (viết hoa, ví dụ: VAMOS50K - duy nhất) |
| 3 | `name` | `NVARCHAR(100)` | 100 | - | - | NO | - | Tên hoặc tiêu đề của chương trình khuyến mãi |
| 4 | `discount_type` | `NVARCHAR(20)` | 20 | - | - | NO | - | Hình thức giảm giá: percentage (Theo phần trăm) hoặc fixed_amount (Số tiền cố định) |
| 5 | `discount_value` | `DECIMAL(12, 0)` | 12,0 | - | - | NO | - | Giá trị giảm giá (> 0, nếu là % thì tối đa 100, nếu là tiền thì số VNĐ) |
| 6 | `min_order_value` | `DECIMAL(12, 0)` | 12,0 | - | - | NO | `((0))` | Giá trị đơn hàng tối thiểu để được áp dụng voucher (VNĐ) |
| 7 | `max_discount_amount` | `DECIMAL(12, 0)` | 12,0 | - | - | YES | - | Số tiền giảm giá tối đa áp dụng cho hình thức giảm theo phần trăm (VNĐ) |
| 8 | `start_date` | `DATETIME2` | - | - | - | NO | - | Mốc thời gian bắt đầu có hiệu lực của voucher |
| 9 | `end_date` | `DATETIME2` | - | - | - | NO | - | Mốc thời gian kết thúc hiệu lực của voucher (bắt buộc end_date >= start_date) |
| 10 | `usage_limit` | `INT` | - | - | - | NO | `((0))` | Tổng số lượt sử dụng tối đa của voucher trên toàn hệ thống (0 = không giới hạn) |
| 11 | `used_count` | `INT` | - | - | - | NO | `((0))` | Tổng số lượt thực tế voucher đã được khách hàng sử dụng thành công |
| 12 | `is_active` | `BIT` | - | - | - | NO | `((1))` | Cờ trạng thái kích hoạt voucher (1 = Đang áp dụng, 0 = Tạm dừng) |
| 13 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian tạo voucher |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__vouchers__3213E83F63F62903` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):** Không có (Bảng độc lập / Master Reference Table)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `UQ__vouchers__357D4CF9318F2BBA` trên cột `(code)`
- **Ràng buộc kiểm tra miền giá trị (Check Constraints):**
  + `CK__vouchers__discou__6383C8BA`: `([discount_type]='fixed_amount' OR [discount_type]='percentage')`
  + `CK__vouchers__discou__6477ECF3`: `([discount_value]>(0))`
  + `CK__vouchers__min_or__66603565`: `([min_order_value]>=(0))`
  + `CK__vouchers__usage___68487DD7`: `([usage_limit]>=(0))`
  + `CK__vouchers__used_c__6A30C649`: `([used_count]>=(0))`
  + `chk_vouchers_dates`: `([end_date]>=[start_date])`

---

### 16. BẢNG `voucher_usages` — LỊCH SỬ SỬ DỤNG VOUCHER THEO KHÁCH HÀNG

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `voucher_usages`
- **Tên nghiệp vụ:** Lịch sử sử dụng voucher theo khách hàng
- **Mục đích sử dụng:** Ràng buộc duy nhất UQ_voucher_user_usage đảm bảo mỗi khách hàng chỉ được dùng 1 mã voucher đúng 1 lần.
- **Chức năng nghiệp vụ liên quan:** UC07 (Kiểm tra và ghi nhận lượt dùng voucher khi tạo đơn hàng COD).
- **Tệp Migration tạo lập:** `003_voucher_customer_usage.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh lượt sử dụng |
| 2 | `voucher_id` | `INT` | - | - | ✓ (vouchers) | NO | - | Khóa ngoại tham chiếu đến mã giảm giá vouchers(id) |
| 3 | `user_id` | `INT` | - | - | ✓ (users) | NO | - | Khóa ngoại tham chiếu đến khách hàng users(id) |
| 4 | `order_id` | `INT` | - | - | ✓ (orders) | NO | - | Khóa ngoại tham chiếu đến đơn hàng được áp dụng orders(id) (ON DELETE CASCADE) |
| 5 | `used_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian khách hàng áp dụng voucher thành công |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__voucher___3213E83FA6BBB05E` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):**
  + `FK_voucher_usages_voucher`: `voucher_usages.voucher_id` $\rightarrow$ `vouchers.id` (ON DELETE: `NO_ACTION`, ON UPDATE: `NO_ACTION`)
  + `FK_voucher_usages_user`: `voucher_usages.user_id` $\rightarrow$ `users.id` (ON DELETE: `NO_ACTION`, ON UPDATE: `NO_ACTION`)
  + `FK_voucher_usages_order`: `voucher_usages.order_id` $\rightarrow$ `orders.id` (ON DELETE: `CASCADE`, ON UPDATE: `NO_ACTION`)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `UQ_voucher_user_usage` trên cột `(voucher_id, user_id)`
- **Ràng buộc kiểm tra (Check Constraints):** Không có
- **Chỉ mục hiệu năng bổ sung (Performance Indexes):**
  + `IX_voucher_usages_user_id` (NONCLUSTERED) trên cột `(user_id)`

---

### 17. BẢNG `orders` — ĐƠN HÀNG MUA SẮM

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `orders`
- **Tên nghiệp vụ:** Đơn hàng mua sắm
- **Mục đích sử dụng:** Lưu trữ thông tin chính thức của các đơn hàng đặt mua, snapshot địa chỉ người nhận và trạng thái giao dịch.
- **Chức năng nghiệp vụ liên quan:** UC07 (Tạo đơn hàng COD), UC08 (Tra cứu đơn), UC09 (Khách hủy đơn), UC10 (Admin xử lý đơn), UC14 (Báo cáo doanh thu).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh đơn hàng |
| 2 | `order_code` | `NVARCHAR(50)` | 50 | - | - | NO | - | Mã đơn hàng duy nhất hiển thị cho khách và kế toán (ví dụ: ORD-261114-X7K9) |
| 3 | `user_id` | `INT` | - | - | ✓ (users) | NO | - | Khóa ngoại tham chiếu đến tài khoản người đặt hàng users(id) |
| 4 | `recipient_name_snapshot` | `NVARCHAR(100)` | 100 | - | - | NO | - | Snapshot họ tên người nhận hàng tại thời điểm đặt |
| 5 | `recipient_phone_snapshot` | `NVARCHAR(20)` | 20 | - | - | NO | - | Snapshot số điện thoại người nhận hàng |
| 6 | `delivery_address_snapshot` | `NVARCHAR(500)` | 500 | - | - | NO | - | Snapshot địa chỉ giao hàng chi tiết tại thời điểm đặt |
| 7 | `subtotal` | `DECIMAL(12, 0)` | 12,0 | - | - | NO | - | Tổng tiền hàng tạm tính trước khi áp dụng giảm giá và phí ship (VNĐ) |
| 8 | `discount_amount` | `DECIMAL(12, 0)` | 12,0 | - | - | NO | `((0))` | Số tiền được giảm giá thông qua voucher khuyến mãi (VNĐ) |
| 9 | `shipping_fee` | `DECIMAL(12, 0)` | 12,0 | - | - | NO | `((0))` | Phí giao hàng (0 VNĐ nếu đơn >= 500k; 30,000 VNĐ nếu đơn dưới 500k) |
| 10 | `total_amount` | `DECIMAL(12, 0)` | 12,0 | - | - | NO | - | Tổng số tiền cuối cùng khách hàng phải thanh toán khi nhận hàng COD (VNĐ) |
| 11 | `voucher_id` | `INT` | - | - | ✓ (vouchers) | YES | - | Khóa ngoại tham chiếu đến voucher được áp dụng vouchers(id) (ON DELETE SET NULL) |
| 12 | `voucher_code_snapshot` | `NVARCHAR(50)` | 50 | - | - | YES | - | Snapshot mã voucher đã áp dụng tại thời điểm đặt |
| 13 | `payment_method` | `NVARCHAR(20)` | 20 | - | - | NO | `('COD')` | Phương thức thanh toán: COD (Thanh toán tiền mặt khi nhận hàng) |
| 14 | `payment_status` | `NVARCHAR(20)` | 20 | - | - | NO | `('UNPAID')` | Trạng thái thanh toán: UNPAID (Chưa thu tiền) hoặc PAID (Đã thu tiền khi COMPLETED) |
| 15 | `order_status` | `NVARCHAR(20)` | 20 | - | - | NO | `('PENDING')` | Trạng thái vòng đời đơn: PENDING, CONFIRMED, PROCESSING, SHIPPING, COMPLETED, CANCELLED |
| 16 | `customer_note` | `NVARCHAR(255)` | 255 | - | - | YES | - | Ghi chú thêm của khách hàng khi đặt đơn |
| 17 | `admin_note` | `NVARCHAR(255)` | 255 | - | - | YES | - | Ghi chú vận hành của ban quản trị |
| 18 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian tạo đơn hàng |
| 19 | `updated_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian cập nhật đơn hàng gần nhất |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__orders__3213E83FA72089B4` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):**
  + `fk_orders_user`: `orders.user_id` $\rightarrow$ `users.id` (ON DELETE: `NO_ACTION`, ON UPDATE: `NO_ACTION`)
  + `fk_orders_voucher`: `orders.voucher_id` $\rightarrow$ `vouchers.id` (ON DELETE: `SET_NULL`, ON UPDATE: `NO_ACTION`)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `UQ__orders__99D12D3F73035B11` trên cột `(order_code)`
- **Ràng buộc kiểm tra miền giá trị (Check Constraints):**
  + `CK__orders__subtotal__2CF2ADDF`: `([subtotal]>=(0))`
  + `CK__orders__discount__2EDAF651`: `([discount_amount]>=(0))`
  + `CK__orders__shipping__30C33EC3`: `([shipping_fee]>=(0))`
  + `CK__orders__total_am__31B762FC`: `([total_amount]>=(0))`
  + `CK__orders__payment___3493CFA7`: `([payment_status]='PAID' OR [payment_status]='UNPAID')`
  + `CK__orders__order_st__367C1819`: `([order_status]='CANCELLED' OR [order_status]='COMPLETED' OR [order_status]='SHIPPING' OR [order_status]='PROCESSING' OR [order_status]='CONFIRMED' OR [order_status]='PENDING')`

---

### 18. BẢNG `order_items` — CHI TIẾT MẶT HÀNG TRONG ĐƠN HÀNG

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `order_items`
- **Tên nghiệp vụ:** Chi tiết mặt hàng trong đơn hàng
- **Mục đích sử dụng:** Lưu snapshot bất biến của từng mặt hàng được mua tại thời điểm đặt để bảo vệ tính toàn vẹn hóa đơn kế toán.
- **Chức năng nghiệp vụ liên quan:** UC07 (Tạo snapshot mặt hàng), UC08 (Xem chi tiết đơn), UC10 (Xem chi tiết admin), UC14 (Top bán chạy).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh dòng đơn hàng |
| 2 | `order_id` | `INT` | - | - | ✓ (orders) | NO | - | Khóa ngoại tham chiếu đến đơn hàng cha orders(id) (ON DELETE CASCADE) |
| 3 | `product_variant_id` | `INT` | - | - | ✓ (product_variants) | NO | - | Khóa ngoại tham chiếu đến biến thể sản phẩm product_variants(id) |
| 4 | `product_name_snapshot` | `NVARCHAR(200)` | 200 | - | - | NO | - | Snapshot tên sản phẩm tại thời điểm đặt hàng |
| 5 | `sku_snapshot` | `NVARCHAR(100)` | 100 | - | - | NO | - | Snapshot mã SKU biến thể tại thời điểm đặt hàng |
| 6 | `size_snapshot` | `NVARCHAR(20)` | 20 | - | - | NO | - | Snapshot tên kích cỡ giày tại thời điểm đặt hàng |
| 7 | `color_snapshot` | `NVARCHAR(50)` | 50 | - | - | NO | - | Snapshot tên màu sắc giày tại thời điểm đặt hàng |
| 8 | `unit_price` | `DECIMAL(12, 0)` | 12,0 | - | - | NO | - | Snapshot đơn giá bán thực tế của một đôi giày tại thời điểm đặt (VNĐ) |
| 9 | `quantity` | `INT` | - | - | - | NO | - | Số lượng đôi giày đặt mua (> 0) |
| 10 | `line_total` | `DECIMAL(12, 0)` | 12,0 | - | - | NO | - | Thành tiền của dòng sản phẩm (= unit_price * quantity) |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__order_it__3213E83F41DCECBA` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):**
  + `fk_order_items_order`: `order_items.order_id` $\rightarrow$ `orders.id` (ON DELETE: `CASCADE`, ON UPDATE: `NO_ACTION`)
  + `fk_order_items_variant`: `order_items.product_variant_id` $\rightarrow$ `product_variants.id` (ON DELETE: `NO_ACTION`, ON UPDATE: `NO_ACTION`)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `uq_order_items_variant` trên cột `(order_id, product_variant_id)`
- **Ràng buộc kiểm tra miền giá trị (Check Constraints):**
  + `CK__order_ite__unit___3E1D39E1`: `([unit_price]>=(0))`
  + `CK__order_ite__quant__3F115E1A`: `([quantity]>(0))`
  + `CK__order_ite__line___40058253`: `([line_total]>=(0))`

---

### 19. BẢNG `order_status_histories` — LỊCH SỬ TRẠNG THÁI ĐƠN HÀNG (AUDIT TRAIL)

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `order_status_histories`
- **Tên nghiệp vụ:** Lịch sử trạng thái đơn hàng (Audit Trail)
- **Mục đích sử dụng:** Lưu vết kiểm toán toàn bộ các bước chuyển trạng thái trong vòng đời đơn hàng phục vụ tra cứu timeline và kiểm toán.
- **Chức năng nghiệp vụ liên quan:** UC07 (Ghi nhận trạng thái ban đầu PENDING), UC08 (Hiển thị timeline), UC09 (Ghi nhận hủy), UC10 (Admin chuyển trạng thái).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh bản ghi lịch sử |
| 2 | `order_id` | `INT` | - | - | ✓ (orders) | NO | - | Khóa ngoại tham chiếu đến đơn hàng orders(id) (ON DELETE CASCADE) |
| 3 | `changed_by` | `INT` | - | - | ✓ (users) | NO | - | Khóa ngoại tham chiếu đến người thực hiện thay đổi users(id) (Khách hủy hoặc Admin duyệt) |
| 4 | `previous_status` | `NVARCHAR(50)` | 50 | - | - | YES | - | Trạng thái của đơn hàng trước khi thay đổi (NULL nếu là bước tạo mới) |
| 5 | `new_status` | `NVARCHAR(50)` | 50 | - | - | NO | - | Trạng thái mới được chuyển sang |
| 6 | `note` | `NVARCHAR(255)` | 255 | - | - | YES | - | Lý do thay đổi trạng thái hoặc ghi chú vận hành |
| 7 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian chính xác phát sinh sự kiện chuyển trạng thái |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__order_st__3213E83F16A463F3` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):**
  + `fk_order_histories_order`: `order_status_histories.order_id` $\rightarrow$ `orders.id` (ON DELETE: `CASCADE`, ON UPDATE: `NO_ACTION`)
  + `fk_order_histories_user`: `order_status_histories.changed_by` $\rightarrow$ `users.id` (ON DELETE: `NO_ACTION`, ON UPDATE: `NO_ACTION`)
- **Ràng buộc duy nhất (Unique Constraints):** Không có
- **Ràng buộc kiểm tra (Check Constraints):** Không có

---

### 20. BẢNG `banners` — BANNER QUẢNG CÁO TRANG CHỦ

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `banners`
- **Tên nghiệp vụ:** Banner quảng cáo trang chủ
- **Mục đích sử dụng:** Quản lý hình ảnh và liên kết của các slider banner quảng cáo trên trang chủ storefront.
- **Chức năng nghiệp vụ liên quan:** UC05 (Hiển thị banner trang chủ), UC12 (Quản lý banner quảng cáo).
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh banner |
| 2 | `title` | `NVARCHAR(150)` | 150 | - | - | NO | - | Tiêu đề biểu ngữ quảng cáo |
| 3 | `image_url` | `NVARCHAR(255)` | 255 | - | - | NO | - | Đường dẫn liên kết hình ảnh banner |
| 4 | `link_url` | `NVARCHAR(255)` | 255 | - | - | YES | - | Đường dẫn trang đích khi người dùng nhấp vào banner |
| 5 | `display_order` | `INT` | - | - | - | NO | `((0))` | Thứ tự ưu tiên trình chiếu slider |
| 6 | `is_active` | `BIT` | - | - | - | NO | `((1))` | Cờ kích hoạt hiển thị banner (1 = Đang chiếu, 0 = Ẩn) |
| 7 | `created_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian tạo banner |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__banners__3213E83FA372E37B` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):** Không có (Bảng độc lập / Master Reference Table)
- **Ràng buộc duy nhất (Unique Constraints):** Không có
- **Ràng buộc kiểm tra (Check Constraints):** Không có

---

### 21. BẢNG `schema_migrations` — BẢNG HỆ THỐNG QUẢN LÝ DI CHUYỂN CSDL

#### 4.1. Thông tin Bảng
- **Tên bảng vật lý:** `schema_migrations`
- **Tên nghiệp vụ:** Bảng hệ thống quản lý di chuyển CSDL
- **Mục đích sử dụng:** Ghi nhận lịch sử các tập tin di chuyển (migrations) đã được thực thi thành công trên CSDL.
- **Chức năng nghiệp vụ liên quan:** Quản trị hệ thống, bootstrap CSDL tự động qua init_mssql.js.
- **Tệp Migration tạo lập:** `001_initial_schema.sql`

#### 4.2. Cấu trúc Các Cột Dữ liệu

| STT | Tên cột | Kiểu dữ liệu SQL Server | Độ dài | PK | FK | Cho phép NULL | Giá trị mặc định (DEFAULT) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `id` | `INT` | - | ✓ (PK) | - | NO | IDENTITY(1,1) | Khóa chính tự tăng định danh bản ghi migration |
| 2 | `version` | `VARCHAR(50)` | 50 | - | - | NO | - | Phiên bản hoặc tên tập tin migration (duy nhất) |
| 3 | `description` | `NVARCHAR(255)` | 255 | - | - | NO | - | Mô tả tóm tắt nội dung migration |
| 4 | `applied_at` | `DATETIME2` | - | - | - | NO | `(getdate())` | Dấu thời gian migration được thực thi vào CSDL |

#### 4.3. Ràng buộc và Chỉ mục Dữ liệu (Constraints & Indexes)

- **Khóa chính (Primary Key):** `PK__schema_m__3213E83F732072DD` trên cột `(id)`
- **Khóa ngoại (Foreign Keys):** Không có (Bảng độc lập / Master Reference Table)
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  + `UQ__schema_m__79B5C94D4F6597A8` trên cột `(version)`
- **Ràng buộc kiểm tra (Check Constraints):** Không có

---
