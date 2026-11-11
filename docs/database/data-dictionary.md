# TỪ ĐIỂN DỮ LIỆU CHI TIẾT (DATA DICTIONARY) - VAMOS STORE

> **Dự án:** VAMOS STORE - Website thương mại điện tử chuyên kinh doanh giày dép & phụ kiện  
> **Cơ sở dữ liệu:** Microsoft SQL Server 2022 / 2025 (T-SQL, Collation: `SQL_Latin1_General_CP1_CI_AS`)  
> **Phiên bản:** v1.1 Chuẩn hóa  
> **Quy mô:** 19 Bảng thực thể, Chuẩn hóa 3 Human Actors (`Guest`, `Customer`, `Admin`)

---

## MỤC LỤC 19 BẢNG DỮ LIỆU

1. [Bảng `schema_migrations` (Nhật ký migration CSDL)](#0-bảng-schema_migrations)
2. [Bảng `users` (Tài khoản người dùng)](#1-bảng-users)
3. [Bảng `categories` (Danh mục sản phẩm)](#2-bảng-categories)
4. [Bảng `brands` (Thương hiệu / Bộ sưu tập)](#3-bảng-brands)
5. [Bảng `sizes` (Kích cỡ giày)](#4-bảng-sizes)
6. [Bảng `colors` (Màu sắc sản phẩm)](#5-bảng-colors)
7. [Bảng `products` (Sản phẩm gốc)](#6-bảng-products)
8. [Bảng `product_images` (Bộ sưu tập hình ảnh sản phẩm)](#7-bảng-product_images)
9. [Bảng `product_variants` (Biến thể Size x Color x SKU)](#8-bảng-product_variants)
10. [Bảng `addresses` (Sổ địa chỉ nhận hàng)](#9-bảng-addresses)
11. [Bảng `password_reset_tokens` (Mã khôi phục mật khẩu)](#10-bảng-password_reset_tokens)
12. [Bảng `carts` (Giỏ hàng người dùng)](#11-bảng-carts)
13. [Bảng `cart_items` (Mặt hàng chi tiết trong giỏ)](#12-bảng-cart_items)
14. [Bảng `vouchers` (Mã giảm giá khuyến mãi)](#13-bảng-vouchers)
15. [Bảng `banners` (Banner quảng bá trang chủ)](#14-bảng-banners)
16. [Bảng `orders` (Đơn hàng & Snapshot thanh toán)](#15-bảng-orders)
17. [Bảng `order_items` (Chi tiết đơn hàng & Snapshot giá)](#16-bảng-order_items)
18. [Bảng `order_status_histories` (Nhật ký trạng thái đơn hàng)](#17-bảng-order_status_histories)
19. [Bảng `inventory_transactions` (Nhật ký kiểm toán biến động kho)](#18-bảng-inventory_transactions)
20. [Bảng `voucher_usages` (Nhật ký giới hạn voucher theo tài khoản)](#19-bảng-voucher_usages)

---

## 0. Bảng `schema_migrations`
* **Mục đích:** Quản lý lịch sử thực thi các bản vá migration để bảo đảm tính idempotent và không phá hủy CSDL.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh dòng |
| `version` | `VARCHAR(50)` | NO | | **UQ** | Mã định danh phiên bản migration (VD: `001_core_indexes`) |
| `description` | `NVARCHAR(255)` | NO | | | Mô tả nội dung migration |
| `applied_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm thực thi migration |

---

## 1. Bảng `users`
* **Mục đích:** Quản lý thông tin định danh và tài khoản của người dùng hệ thống (`CUSTOMER` và `ADMIN`). Khách vãng lai (`Guest`) không lưu trữ trong bảng này.
* **Quy tắc bảo mật:** `password_hash` băm bằng bcrypt (salt rounds >= 10); không lưu plaintext.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh duy nhất của tài khoản |
| `full_name` | `NVARCHAR(100)` | NO | | | Họ và tên đầy đủ |
| `email` | `NVARCHAR(150)` | NO | | **UQ** | Địa chỉ email duy nhất (dùng đăng nhập) |
| `password_hash` | `NVARCHAR(255)` | NO | | | Chuỗi băm mật khẩu bảo mật (bcrypt) |
| `phone` | `NVARCHAR(20)` | YES | NULL | | Số điện thoại liên hệ chính |
| `role` | `NVARCHAR(20)` | NO | `'CUSTOMER'` | `CHECK IN ('ADMIN', 'CUSTOMER')` | Vai trò phân quyền trên hệ thống |
| `status` | `NVARCHAR(20)` | NO | `'active'` | `CHECK IN ('active', 'locked')` | Trạng thái tài khoản |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm tạo tài khoản |
| `updated_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm cập nhật thông tin |

---

## 2. Bảng `categories`
* **Mục đích:** Phân loại sản phẩm theo dòng giày dép (Sneaker, Thể thao, Sandal, Dép, v.v.).

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh danh mục |
| `name` | `NVARCHAR(100)` | NO | | | Tên danh mục hiển thị |
| `slug` | `NVARCHAR(120)` | NO | | **UQ** | Đường dẫn thân thiện SEO |
| `description` | `NVARCHAR(MAX)` | YES | NULL | | Mô tả danh mục |
| `is_active` | `BIT` | NO | `1` | | Trạng thái hiển thị (`1`: Hiện, `0`: Ẩn) |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm tạo danh mục |

---

## 3. Bảng `brands`
* **Mục đích:** Thương hiệu hoặc dòng bộ sưu tập sản phẩm nội bộ VAMOS.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh thương hiệu |
| `name` | `NVARCHAR(100)` | NO | | | Tên thương hiệu |
| `slug` | `NVARCHAR(120)` | NO | | **UQ** | Slug thân thiện |
| `description` | `NVARCHAR(MAX)` | YES | NULL | | Mô tả chi tiết |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm tạo |

---

## 4. Bảng `sizes`
* **Mục đích:** Danh mục kích cỡ giày chuẩn hóa (38, 39, 40, 41, 42, 43, v.v.).

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh size |
| `size_name` | `NVARCHAR(20)` | NO | | **UQ** | Tên size giày |
| `display_order` | `INT` | NO | `0` | | Thứ tự sắp xếp hiển thị |

---

## 5. Bảng `colors`
* **Mục đích:** Danh mục màu sắc sản phẩm kèm mã màu hex phục vụ UI.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh màu sắc |
| `color_name` | `NVARCHAR(50)` | NO | | | Tên màu sắc (Đen, Trắng, Đỏ, v.v.) |
| `color_code` | `NVARCHAR(20)` | YES | NULL | | Mã màu Hex (VD: `#151515`) |

---

## 6. Bảng `products`
* **Mục đích:** Lưu trữ thông tin sản phẩm cha (tên, mã code, danh mục, thương hiệu, giá niêm yết, giá khuyến mãi).

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh sản phẩm |
| `category_id` | `INT` | NO | | **FK** $\rightarrow$ `categories(id)` | Danh mục cha |
| `brand_id` | `INT` | YES | NULL | **FK** $\rightarrow$ `brands(id)` | Thương hiệu |
| `product_code` | `NVARCHAR(50)` | NO | | **UQ** | Mã sản phẩm nội bộ (VD: `VMS-SNK-01`) |
| `name` | `NVARCHAR(200)` | NO | | | Tên thương mại của sản phẩm |
| `slug` | `NVARCHAR(255)` | NO | | **UQ** | Slug thân thiện URL |
| `description` | `NVARCHAR(MAX)` | YES | NULL | | Mô tả chi tiết sản phẩm |
| `gender_target`| `NVARCHAR(20)` | NO | `'UNISEX'` | `CHECK IN ('MEN','WOMEN','KIDS','UNISEX')` | Đối tượng sử dụng |
| `base_price` | `DECIMAL(12,0)` | NO | | `CHECK (base_price >= 0)` | Giá bán niêm yết |
| `sale_price` | `DECIMAL(12,0)` | YES | NULL | `CHECK (NULL OR (>=0 AND <base_price))` | Giá bán khuyến mãi |
| `status` | `NVARCHAR(20)` | NO | `'active'` | `CHECK IN ('active','inactive','draft')` | Trạng thái kinh doanh |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm tạo sản phẩm |
| `updated_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm cập nhật sản phẩm |

---

## 7. Bảng `product_images`
* **Mục đích:** Lưu trữ danh sách ảnh minh họa của sản phẩm.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh ảnh |
| `product_id` | `INT` | NO | | **FK** $\rightarrow$ `products(id)` ON DELETE CASCADE | Sản phẩm sở hữu ảnh |
| `image_url` | `NVARCHAR(255)` | NO | | | Đường dẫn ảnh hoặc tên file |
| `is_primary` | `BIT` | NO | `0` | | Cờ đánh dấu ảnh đại diện |
| `display_order`| `INT` | NO | `0` | | Thứ tự hiển thị trong bộ ảnh |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm tạo ảnh |

---

## 8. Bảng `product_variants`
* **Mục đích:** Quản lý biến thể bán hàng cụ thể theo kích cỡ, màu sắc và số lượng tồn kho thực tế.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh biến thể |
| `product_id` | `INT` | NO | | **FK** $\rightarrow$ `products(id)` ON DELETE CASCADE | Sản phẩm cha |
| `size_id` | `INT` | NO | | **FK** $\rightarrow$ `sizes(id)` | Kích cỡ |
| `color_id` | `INT` | NO | | **FK** $\rightarrow$ `colors(id)` | Màu sắc |
| `sku` | `NVARCHAR(100)` | NO | | **UQ** | Mã định danh tồn kho duy nhất |
| `stock_quantity`| `INT` | NO | `0` | `CHECK (stock_quantity >= 0)` | Tồn kho thực tế (không âm) |
| `status` | `NVARCHAR(20)` | NO | `'active'` | `CHECK IN ('active','inactive')` | Trạng thái bán của biến thể |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm tạo biến thể |
| `updated_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm cập nhật biến thể |

---

## 9. Bảng `addresses`
* **Mục đích:** Sổ địa chỉ giao hàng của khách hàng (`Customer`).

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh địa chỉ |
| `user_id` | `INT` | NO | | **FK** $\rightarrow$ `users(id)` ON DELETE CASCADE | Người dùng sở hữu |
| `recipient_name`| `NVARCHAR(100)`| NO | | | Họ tên người nhận hàng |
| `phone` | `NVARCHAR(20)` | NO | | | Điện thoại người nhận hàng |
| `province` | `NVARCHAR(100)` | NO | | | Tỉnh / Thành phố |
| `district` | `NVARCHAR(100)` | NO | | | Quận / Huyện |
| `ward` | `NVARCHAR(100)` | NO | | | Phường / Xã |
| `detail_address`| `NVARCHAR(255)`| NO | | | Số nhà, tên đường chi tiết |
| `is_default` | `BIT` | NO | `0` | | Cờ địa chỉ mặc định |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm tạo |
| `updated_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm cập nhật |

---

## 10. Bảng `password_reset_tokens`
* **Mục đích:** Quản lý token xác thực khôi phục mật khẩu tài khoản qua email.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh token |
| `user_id` | `INT` | NO | | **FK** $\rightarrow$ `users(id)` ON DELETE CASCADE | Người dùng yêu cầu reset |
| `token_hash` | `NVARCHAR(255)` | NO | | **UQ** | Chuỗi băm token bảo mật |
| `expires_at` | `DATETIME2` | NO | | | Thời điểm hết hạn token |
| `used_at` | `DATETIME2` | YES | NULL | | Thời điểm đã sử dụng |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm tạo token |

---

## 11. Bảng `carts`
* **Mục đích:** Giỏ hàng của người dùng đã đăng nhập (1-1 với `users`).

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh giỏ hàng |
| `user_id` | `INT` | NO | | **FK** $\rightarrow$ `users(id)` ON DELETE CASCADE, **UQ** | Người dùng sở hữu giỏ |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm tạo giỏ |
| `updated_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm cập nhật giỏ |

---

## 12. Bảng `cart_items`
* **Mục đích:** Các mặt hàng biến thể được thêm vào giỏ hàng.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh dòng giỏ hàng |
| `cart_id` | `INT` | NO | | **FK** $\rightarrow$ `carts(id)` ON DELETE CASCADE | Giỏ hàng cha |
| `variant_id` | `INT` | NO | | **FK** $\rightarrow$ `product_variants(id)` | Biến thể sản phẩm |
| `quantity` | `INT` | NO | `1` | `CHECK (quantity > 0)` | Số lượng chọn |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm thêm vào |
| `updated_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm cập nhật |
| | | | | **UQ(`cart_id`, `variant_id`)** | Ngăn trùng dòng trong giỏ |

---

## 13. Bảng `vouchers`
* **Mục đích:** Quản lý mã giảm giá khuyến mãi.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh voucher |
| `code` | `NVARCHAR(50)` | NO | | **UQ** | Mã voucher áp dụng (VD: `VAMOS10`) |
| `name` | `NVARCHAR(100)` | NO | | | Tên chương trình ưu đãi |
| `discount_type` | `NVARCHAR(20)` | NO | | `CHECK IN ('percentage','fixed_amount')` | Loại giảm (% hoặc số tiền) |
| `discount_value`| `DECIMAL(12,0)`| NO | | `CHECK (discount_value > 0)` | Giá trị giảm |
| `min_order_value`| `DECIMAL(12,0)`| NO | `0` | `CHECK (min_order_value >= 0)` | Giá trị đơn tối thiểu để áp dụng |
| `max_discount_amount`| `DECIMAL(12,0)`| YES | NULL | | Mức giảm tối đa cho % |
| `start_date` | `DATETIME2` | NO | | | Ngày bắt đầu áp dụng |
| `end_date` | `DATETIME2` | NO | | `CHECK (end_date >= start_date)` | Ngày kết thúc áp dụng |
| `usage_limit` | `INT` | NO | `0` | `CHECK (usage_limit >= 0)` | Giới hạn tổng số lượt dùng (0 = vô hạn) |
| `used_count` | `INT` | NO | `0` | `CHECK (used_count >= 0)` | Số lượt đã sử dụng thực tế |
| `is_active` | `BIT` | NO | `1` | | Trạng thái hiệu lực |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm tạo |

---

## 14. Bảng `banners`
* **Mục đích:** Quản lý slider banner hiển thị tại trang chủ.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh banner |
| `title` | `NVARCHAR(150)` | NO | | | Tiêu đề banner |
| `image_url` | `NVARCHAR(255)` | NO | | | Đường dẫn ảnh banner |
| `link_url` | `NVARCHAR(255)` | YES | NULL | | Liên kết khi nhấp vào banner |
| `display_order`| `INT` | NO | `0` | | Thứ tự hiển thị |
| `is_active` | `BIT` | NO | `1` | | Trạng thái hiển thị (`1`: Hiện, `0`: Ẩn) |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm tạo banner |

---

## 15. Bảng `orders`
* **Mục đích:** Quản lý đơn hàng, snapshot địa chỉ nhận hàng, phương thức thanh toán COD và trạng thái xử lý.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh đơn hàng |
| `order_code` | `NVARCHAR(50)` | NO | | **UQ** | Mã đơn hàng duy nhất (VD: `VMS-ORD-...`) |
| `user_id` | `INT` | NO | | **FK** $\rightarrow$ `users(id)` | Khách hàng đặt mua |
| `recipient_name_snapshot` | `NVARCHAR(100)` | NO | | | Snapshot họ tên người nhận |
| `recipient_phone_snapshot` | `NVARCHAR(20)` | NO | | | Snapshot số điện thoại người nhận |
| `delivery_address_snapshot` | `NVARCHAR(500)` | NO | | | Snapshot địa chỉ nhận đầy đủ |
| `subtotal` | `DECIMAL(12,0)` | NO | | `CHECK (subtotal >= 0)` | Tổng tiền hàng tạm tính |
| `discount_amount` | `DECIMAL(12,0)` | NO | `0` | `CHECK (discount_amount >= 0)` | Số tiền giảm giá voucher |
| `shipping_fee` | `DECIMAL(12,0)` | NO | `0` | `CHECK (shipping_fee >= 0)` | Phí vận chuyển (cố định 30,000 đ) |
| `total_amount` | `DECIMAL(12,0)` | NO | | `CHECK (total_amount >= 0)` | Tổng thanh toán COD |
| `voucher_id` | `INT` | YES | NULL | **FK** $\rightarrow$ `vouchers(id)` | Voucher áp dụng (nếu có) |
| `voucher_code_snapshot` | `NVARCHAR(50)` | YES | NULL | | Snapshot mã voucher |
| `payment_method` | `NVARCHAR(20)` | NO | `'COD'` | | Phương thức thanh toán (COD) |
| `payment_status` | `NVARCHAR(20)` | NO | `'UNPAID'` | `CHECK IN ('UNPAID','PAID')` | Trạng thái thanh toán tiền mặt |
| `order_status` | `NVARCHAR(20)` | NO | `'PENDING'` | `CHECK IN ('PENDING','CONFIRMED','PROCESSING','SHIPPING','COMPLETED','CANCELLED')` | Trạng thái vòng đời đơn hàng |
| `customer_note` | `NVARCHAR(255)` | YES | NULL | | Ghi chú của khách hàng |
| `admin_note` | `NVARCHAR(255)` | YES | NULL | | Ghi chú xử lý của Admin |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm tạo đơn |
| `updated_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm cập nhật đơn |

---

## 16. Bảng `order_items`
* **Mục đích:** Lưu trữ snapshot bất biến của từng mặt hàng sản phẩm trong đơn hàng tại thời điểm đặt mua.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh dòng đơn hàng |
| `order_id` | `INT` | NO | | **FK** $\rightarrow$ `orders(id)` ON DELETE CASCADE | Đơn hàng sở hữu |
| `product_variant_id` | `INT` | NO | | **FK** $\rightarrow$ `product_variants(id)` | Biến thể sản phẩm |
| `product_name_snapshot` | `NVARCHAR(200)` | NO | | | Snapshot tên sản phẩm |
| `sku_snapshot` | `NVARCHAR(100)` | NO | | | Snapshot mã SKU |
| `size_snapshot` | `NVARCHAR(20)` | NO | | | Snapshot kích cỡ đã mua |
| `color_snapshot` | `NVARCHAR(50)` | NO | | | Snapshot màu sắc đã mua |
| `unit_price` | `DECIMAL(12,0)` | NO | | `CHECK (unit_price >= 0)` | Snapshot đơn giá bán thực tế |
| `quantity` | `INT` | NO | | `CHECK (quantity > 0)` | Số lượng mua |
| `line_total` | `DECIMAL(12,0)` | NO | | `CHECK (line_total >= 0)` | Thành tiền dòng = unit_price * quantity |

---

## 17. Bảng `order_status_histories`
* **Mục đích:** Ghi nhận lịch sử chuyển đổi máy trạng thái của đơn hàng phục vụ kiểm toán và hiển thị timeline.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh lịch sử |
| `order_id` | `INT` | NO | | **FK** $\rightarrow$ `orders(id)` ON DELETE CASCADE | Đơn hàng |
| `changed_by` | `INT` | NO | | **FK** $\rightarrow$ `users(id)` | Người thực hiện chuyển đổi |
| `previous_status` | `NVARCHAR(50)` | YES | NULL | | Trạng thái trước khi đổi |
| `new_status` | `NVARCHAR(50)` | NO | | | Trạng thái mới chuyển sang |
| `note` | `NVARCHAR(255)` | YES | NULL | | Lý do hoặc ghi chú |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm chuyển trạng thái |

---

## 18. Bảng `inventory_transactions`
* **Mục đích:** Ghi nhận nhật ký kiểm toán (Audit Log) mọi biến động tăng/giảm tồn kho của biến thể sản phẩm.

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh giao dịch kho |
| `variant_id` | `INT` | NO | | **FK** $\rightarrow$ `product_variants(id)` | Biến thể thay đổi tồn kho |
| `user_id` | `INT` | NO | | **FK** $\rightarrow$ `users(id)` | Người thực hiện (Khách đặt/Admin chỉnh) |
| `old_quantity` | `INT` | NO | | `CHECK (old_quantity >= 0)` | Tồn kho trước khi đổi |
| `new_quantity` | `INT` | NO | | `CHECK (new_quantity >= 0)` | Tồn kho sau khi đổi |
| `change_quantity`| `INT` | NO | | | Số lượng biến động (+ hoặc -) |
| `reason` | `NVARCHAR(255)` | NO | | | Lý do biến động (ORDER_PLACED, ORDER_CANCELLED, ADMIN_ADJUSTMENT) |
| `created_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm biến động kho |

---

## 19. Bảng `voucher_usages`
* **Mục đích:** Quản lý giới hạn sử dụng voucher theo từng khách hàng (Decision Q8: Mỗi khách hàng chỉ được dùng 1 voucher tối đa 01 lần).

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Khóa / Ràng buộc | Mô tả |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT IDENTITY(1,1)` | NO | Auto | **PK** | Định danh lượt sử dụng |
| `voucher_id` | `INT` | NO | | **FK** $\rightarrow$ `vouchers(id)` | Voucher được áp dụng |
| `user_id` | `INT` | NO | | **FK** $\rightarrow$ `users(id)` | Khách hàng sử dụng |
| `order_id` | `INT` | NO | | **FK** $\rightarrow$ `orders(id)` ON DELETE CASCADE | Đơn hàng gắn với lần dùng voucher |
| `used_at` | `DATETIME2` | NO | `GETDATE()` | | Thời điểm áp dụng voucher |
| | | | | **UQ(`voucher_id`, `user_id`)** | Ràng buộc duy nhất 1 lần/khách hàng |
