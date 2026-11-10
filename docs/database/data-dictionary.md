# TỪ ĐIỂN DỮ LIỆU CHI TIẾT (DATA DICTIONARY) - VAMOS STORE

> **Dự án:** VAMOS STORE - Website thương mại điện tử chuyên kinh doanh giày dép  
> **Cơ sở dữ liệu:** MySQL 8.0 (InnoDB, `utf8mb4_unicode_ci`)  
> **Phiên bản tài liệu:** v1.1 Chuẩn hóa  
> **Quy mô:** 18 Thực thể, Chuẩn hóa 3 Actors (`Guest`, `Customer`, `Admin`)

---

## MỤC LỤC 18 BẢNG DỮ LIỆU

1. [Bảng `users` (Tài khoản người dùng)](#1-bảng-users)
2. [Bảng `addresses` (Sổ địa chỉ nhận hàng)](#2-bảng-addresses)
3. [Bảng `password_reset_tokens` (Mã khôi phục mật khẩu)](#3-bảng-password_reset_tokens)
4. [Bảng `categories` (Danh mục sản phẩm)](#4-bảng-categories)
5. [Bảng `brands` (Thương hiệu / Bộ sưu tập)](#5-bảng-brands)
6. [Bảng `products` (Sản phẩm gốc)](#6-bảng-products)
7. [Bảng `product_images` (Bộ sưu tập hình ảnh sản phẩm)](#7-bảng-product_images)
8. [Bảng `sizes` (Bảng kích cỡ giày dép)](#8-bảng-sizes)
9. [Bảng `colors` (Bảng màu sắc sản phẩm)](#9-bảng-colors)
10. [Bảng `product_variants` (Biến thể chi tiết Size x Color x SKU)](#10-bảng-product_variants)
11. [Bảng `inventory_transactions` (Nhật ký biến động tồn kho)](#11-bảng-inventory_transactions)
12. [Bảng `carts` (Giỏ hàng người dùng)](#12-bảng-carts)
13. [Bảng `cart_items` (Mặt hàng chi tiết trong giỏ)](#13-bảng-cart_items)
14. [Bảng `vouchers` (Mã giảm giá khuyến mãi)](#14-bảng-vouchers)
15. [Bảng `banners` (Banner quảng bá trang chủ)](#15-bảng-banners)
16. [Bảng `orders` (Đơn hàng & Snapshot thanh toán)](#16-bảng-orders)
17. [Bảng `order_items` (Chi tiết sản phẩm đơn hàng & Snapshot giá)](#17-bảng-order_items)
18. [Bảng `order_status_histories` (Nhật ký lịch sử trạng thái đơn hàng)](#18-bảng-order_status_histories)

---

## 1. Bảng `users`

* **Mục đích:** Quản lý thông tin định danh và tài khoản của người dùng hệ thống (`CUSTOMER` và `ADMIN`). Khách vãng lai (`Guest`) không lưu trữ trong bảng này.
* **Quy tắc bảo mật:** `password_hash` băm bằng bcrypt (salt rounds >= 10); không bao giờ lưu plaintext.

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh duy nhất của tài khoản người dùng |
| `full_name` | `VARCHAR(100)` | NO | | | | Họ và tên đầy đủ của người dùng |
| `email` | `VARCHAR(150)` | NO | | | **YES** | Địa chỉ email duy nhất (dùng đăng nhập hệ thống) |
| `password_hash` | `VARCHAR(255)` | NO | | | | Chuỗi băm mật khẩu bảo mật (bcrypt hash) |
| `phone` | `VARCHAR(20)` | YES | NULL | | | Số điện thoại liên hệ chính |
| `role` | `ENUM('ADMIN', 'CUSTOMER')` | NO | `'CUSTOMER'` | | | Vai trò phân quyền trên hệ thống |
| `status` | `ENUM('active', 'locked')` | NO | `'active'` | | | Trạng thái tài khoản (`active`: hoạt động, `locked`: bị khóa) |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm tạo tài khoản |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | | | Thời điểm cập nhật thông tin gần nhất |

* **Chỉ mục & Ràng buộc:**
  * `UNIQUE KEY uq_users_email (email)`
  * `INDEX idx_users_role_status (role, status)`

---

## 2. Bảng `addresses`

* **Mục đích:** Lưu trữ sổ địa chỉ nhận hàng của khách hàng. Khách hàng có thể lưu nhiều địa chỉ và chọn 1 địa chỉ mặc định.

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh duy nhất của bản ghi địa chỉ |
| `user_id` | `INT` | NO | | **FK** | | Tham chiếu đến `users(id)` của khách hàng |
| `recipient_name` | `VARCHAR(100)` | NO | | | | Họ tên người nhận hàng tại địa chỉ này |
| `phone` | `VARCHAR(20)` | NO | | | | Số điện thoại liên lạc người nhận |
| `province` | `VARCHAR(100)` | NO | | | | Tỉnh / Thành phố nhận hàng |
| `district` | `VARCHAR(100)` | NO | | | | Quận / Huyện nhận hàng |
| `ward` | `VARCHAR(100)` | NO | | | | Phường / Xã nhận hàng |
| `detail_address` | `VARCHAR(255)` | NO | | | | Số nhà, tên đường, thông tin chi tiết |
| `is_default` | `BOOLEAN` | NO | `FALSE` | | | Cờ đánh dấu địa chỉ mặc định (`1`: mặc định, `0`: phụ) |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm tạo địa chỉ |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | | | Thời điểm cập nhật địa chỉ |

* **Chỉ mục & Ràng buộc:**
  * `CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE`
  * `INDEX idx_addresses_user_default (user_id, is_default)`
  * *Nghiệp vụ ứng dụng:* Khi cập nhật một bản ghi thành `is_default = TRUE`, các địa chỉ còn lại của cùng `user_id` phải được reset về `FALSE`.

---

## 3. Bảng `password_reset_tokens`

* **Mục đích:** Quản lý token xác thực ngẫu nhiên dùng trong quy trình khôi phục mật khẩu qua email.

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh bản ghi token |
| `user_id` | `INT` | NO | | **FK** | | Tham chiếu đến tài khoản yêu cầu (`users.id`) |
| `token` | `VARCHAR(255)` | NO | | | **YES** | Chuỗi token bảo mật ngẫu nhiên (cryptographic token) |
| `expires_at` | `DATETIME` | NO | | | | Thời điểm hết hạn của token (thường sau 15-30 phút) |
| `used_at` | `DATETIME` | YES | NULL | | | Thời điểm token đã được sử dụng (ngăn dùng lại) |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm tạo yêu cầu reset |

* **Chỉ mục & Ràng buộc:**
  * `CONSTRAINT fk_pwd_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE`
  * `UNIQUE KEY uq_pwd_reset_token (token)`
  * `INDEX idx_pwd_reset_lookup (user_id, expires_at, used_at)`

---

## 4. Bảng `categories`

* **Mục đích:** Danh mục phân loại sản phẩm (ví dụ: Sneaker, Giày thể thao, Sandal, Dép, Phụ kiện).

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh duy nhất của danh mục |
| `name` | `VARCHAR(100)` | NO | | | | Tên hiển thị của danh mục |
| `slug` | `VARCHAR(120)` | NO | | | **YES** | Đường dẫn tĩnh thân thiện SEO (URL slug) |
| `description` | `TEXT` | YES | NULL | | | Mô tả chi tiết danh mục |
| `is_active` | `BOOLEAN` | NO | `TRUE` | | | Trạng thái hiển thị (`1`: hiển thị, `0`: ẩn) |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm khởi tạo danh mục |

* **Chỉ mục & Ràng buộc:**
  * `UNIQUE KEY uq_categories_slug (slug)`
  * `INDEX idx_categories_active (is_active)`

---

## 5. Bảng `brands`

* **Mục đích:** Phân loại theo thương hiệu hoặc các dòng bộ sưu tập của VAMOS (ví dụ: VAMOS Street, VAMOS Active, VAMOS Classic).

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh thương hiệu/bộ sưu tập |
| `name` | `VARCHAR(100)` | NO | | | | Tên thương hiệu/dòng sản phẩm |
| `slug` | `VARCHAR(120)` | NO | | | **YES** | Đường dẫn tĩnh thân thiện SEO |
| `description` | `TEXT` | YES | NULL | | | Giới thiệu về thương hiệu/bộ sưu tập |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm tạo bản ghi |

* **Chỉ mục & Ràng buộc:**
  * `UNIQUE KEY uq_brands_slug (slug)`

---

## 6. Bảng `products`

* **Mục đích:** Lưu trữ thông tin sản phẩm cha (tên sản phẩm, mã, giá niêm yết, giá khuyến mãi, trạng thái hiển thị).

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh sản phẩm |
| `category_id` | `INT` | NO | | **FK** | | Tham chiếu đến danh mục (`categories.id`) |
| `brand_id` | `INT` | YES | NULL | **FK** | | Tham chiếu thương hiệu (`brands.id`, tùy chọn) |
| `product_code`| `VARCHAR(50)` | NO | | | **YES** | Mã sản phẩm nội bộ duy nhất (ví dụ: `VM-SNK-01`) |
| `name` | `VARCHAR(200)` | NO | | | | Tên đầy đủ của sản phẩm |
| `slug` | `VARCHAR(255)` | NO | | | **YES** | Đường dẫn tĩnh sản phẩm (SEO friendly) |
| `description` | `TEXT` | YES | NULL | | | Bài viết mô tả tính năng, chất liệu, hướng dẫn size |
| `gender_target`| `ENUM('MEN','WOMEN','KIDS','UNISEX')` | NO | `'UNISEX'` | | | Đối tượng hướng tới phục vụ bộ lọc tìm kiếm |
| `base_price` | `DECIMAL(12,0)` | NO | | | | Giá bán niêm yết chính thức (VNĐ) |
| `sale_price` | `DECIMAL(12,0)` | YES | NULL | | | Giá bán ưu đãi/khuyến mãi (VNĐ) |
| `status` | `ENUM('active','inactive','draft')` | NO | `'active'` | | | Trạng thái hiển thị trên cửa hàng |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm đăng sản phẩm |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | | | Thời điểm chỉnh sửa sản phẩm |

* **Chỉ mục & Ràng buộc:**
  * `CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE`
  * `CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL ON UPDATE CASCADE`
  * `UNIQUE KEY uq_products_code (product_code)`
  * `UNIQUE KEY uq_products_slug (slug)`
  * `INDEX idx_products_search (category_id, gender_target, status, base_price)`
  * `CONSTRAINT chk_products_base_price CHECK (base_price >= 0)`
  * `CONSTRAINT chk_products_sale_price CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price < base_price))`

---

## 7. Bảng `product_images`

* **Mục đích:** Quản lý gallery hình ảnh của sản phẩm. Mỗi sản phẩm có nhiều ảnh, trong đó có đúng 1 ảnh đại diện chính (`is_primary = TRUE`).

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh ảnh sản phẩm |
| `product_id` | `INT` | NO | | **FK** | | Tham chiếu đến sản phẩm gốc (`products.id`) |
| `image_url` | `VARCHAR(255)` | NO | | | | Đường dẫn URL hoặc tên file ảnh trong storage |
| `is_primary` | `BOOLEAN` | NO | `FALSE` | | | Đánh dấu ảnh đại diện trên card sản phẩm |
| `display_order`| `INT` | NO | `0` | | | Thứ tự sắp xếp hiển thị ảnh trong slider |

* **Chỉ mục & Ràng buộc:**
  * `CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE`
  * `INDEX idx_product_images_order (product_id, is_primary, display_order)`

---

## 8. Bảng `sizes`

* **Mục đích:** Danh mục chuẩn kích cỡ giày dép (ví dụ: 36, 37, 38, 39, 40, 41, 42, 43, 44, 45).

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh kích cỡ |
| `size_name` | `VARCHAR(20)` | NO | | | **YES** | Tên kích cỡ chuẩn (ví dụ: `39`, `40`, `41`) |
| `display_order`| `INT` | NO | `0` | | | Thứ tự sắp xếp từ nhỏ đến lớn khi chọn size |

* **Chỉ mục & Ràng buộc:**
  * `UNIQUE KEY uq_sizes_name (size_name)`

---

## 9. Bảng `colors`

* **Mục đích:** Danh mục chuẩn màu sắc của sản phẩm (ví dụ: Đen, Trắng, Đỏ Coral, Xám Bạc).

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh màu sắc |
| `color_name` | `VARCHAR(50)` | NO | | | **YES** | Tên hiển thị của màu sắc (ví dụ: `Đen`, `Trắng`) |
| `hex_code` | `VARCHAR(10)` | YES | NULL | | | Mã màu thập lục phân CSS (ví dụ: `#000000`) |

* **Chỉ mục & Ràng buộc:**
  * `UNIQUE KEY uq_colors_name (color_name)`

---

## 10. Bảng `product_variants`

* **Mục đích:** Thực thể trọng tâm quản lý biến thể giày chi tiết theo từng tổ hợp: `Sản phẩm` x `Kích cỡ` x `Màu sắc`. Quản lý tồn kho thực tế và mã SKU riêng biệt.

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh biến thể sản phẩm |
| `product_id` | `INT` | NO | | **FK** | | Tham chiếu sản phẩm cha (`products.id`) |
| `size_id` | `INT` | NO | | **FK** | | Tham chiếu kích cỡ (`sizes.id`) |
| `color_id` | `INT` | NO | | **FK** | | Tham chiếu màu sắc (`colors.id`) |
| `sku` | `VARCHAR(100)` | NO | | | **YES** | Mã lưu kho duy nhất (ví dụ: `VM-SNK01-BLK-40`) |
| `stock_quantity`| `INT` | NO | `0` | | | Số lượng tồn kho khả dụng hiện tại (không âm) |
| `status` | `ENUM('active','inactive')` | NO | `'active'` | | | Trạng thái kinh doanh của biến thể |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm tạo biến thể |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | | | Thời điểm cập nhật số lượng/trạng thái |

* **Chỉ mục & Ràng buộc:**
  * `CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE`
  * `CONSTRAINT fk_variants_size FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE RESTRICT ON UPDATE CASCADE`
  * `CONSTRAINT fk_variants_color FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE RESTRICT ON UPDATE CASCADE`
  * `UNIQUE KEY uq_variants_sku (sku)`
  * `UNIQUE KEY uq_variants_combination (product_id, size_id, color_id)`
  * `CONSTRAINT chk_variants_stock CHECK (stock_quantity >= 0)`
  * `INDEX idx_variants_lookup (product_id, status, stock_quantity)`

---

## 11. Bảng `inventory_transactions`

* **Mục đích:** Nhật ký kiểm toán ghi vết biến động số lượng tồn kho (nhập hàng, bán hàng, hoàn kho khi hủy đơn, điều chỉnh kiểm kê).

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh giao dịch kho |
| `variant_id` | `INT` | NO | | **FK** | | Tham chiếu biến thể điều chỉnh (`product_variants.id`) |
| `user_id` | `INT` | NO | | **FK** | | Người thực hiện (Admin điều chỉnh hoặc Customer tạo đơn) |
| `old_quantity` | `INT` | NO | | | | Số lượng tồn trước khi biến động |
| `new_quantity` | `INT` | NO | | | | Số lượng tồn sau khi biến động |
| `change_quantity`| `INT` | NO | | | | Số lượng tăng dương (+) hoặc giảm âm (-) |
| `reason` | `VARCHAR(255)` | NO | | | | Lý do biến động (`ORDER_PLACED`, `ORDER_CANCELLED`, `ADMIN_ADJUSTMENT`,...) |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm ghi nhận giao dịch |

* **Chỉ mục & Ràng buộc:**
  * `CONSTRAINT fk_inv_trans_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT ON UPDATE CASCADE`
  * `CONSTRAINT fk_inv_trans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`
  * `CONSTRAINT chk_inv_trans_old CHECK (old_quantity >= 0)`
  * `CONSTRAINT chk_inv_trans_new CHECK (new_quantity >= 0)`
  * `INDEX idx_inv_trans_variant_date (variant_id, created_at)`

---

## 12. Bảng `carts`

* **Mục đích:** Quản lý giỏ hàng trực tuyến của khách hàng đã đăng nhập. Mỗi tài khoản `Customer` có đúng 1 giỏ hàng duy nhất.

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh giỏ hàng |
| `user_id` | `INT` | NO | | **FK** | **YES** | Tham chiếu duy nhất đến tài khoản khách hàng |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm khởi tạo giỏ hàng |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | | | Thời điểm cập nhật giỏ hàng gần nhất |

* **Chỉ mục & Ràng buộc:**
  * `CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE`
  * `UNIQUE KEY uq_carts_user (user_id)`

---

## 13. Bảng `cart_items`

* **Mục đích:** Dòng sản phẩm chi tiết trong giỏ hàng. Mỗi biến thể sản phẩm chỉ xuất hiện 1 dòng trong giỏ hàng (cộng dồn số lượng).

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh mục giỏ hàng |
| `cart_id` | `INT` | NO | | **FK** | | Tham chiếu giỏ hàng (`carts.id`) |
| `variant_id` | `INT` | NO | | **FK** | | Tham chiếu biến thể đặt mua (`product_variants.id`) |
| `quantity` | `INT` | NO | `1` | | | Số lượng đặt mua (phải > 0) |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm thêm vào giỏ |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | | | Thời điểm chỉnh sửa số lượng |

* **Chỉ mục & Ràng buộc:**
  * `CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE ON UPDATE CASCADE`
  * `CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE ON UPDATE CASCADE`
  * `UNIQUE KEY uq_cart_variant (cart_id, variant_id)`
  * `CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0)`

---

## 14. Bảng `vouchers`

* **Mục đích:** Quản lý danh sách mã giảm giá khuyến mãi kèm theo các điều kiện giá trị và thời gian hiệu lực.

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh mã giảm giá |
| `code` | `VARCHAR(50)` | NO | | | **YES** | Mã voucher nhập ở checkout (ví dụ: `VAMOS50K`) |
| `name` | `VARCHAR(100)` | NO | | | | Tên chương trình ưu đãi hiển thị |
| `discount_type` | `ENUM('percentage','fixed_amount')` | NO | | | | Hình thức giảm: theo `%` hoặc trừ tiền cố định |
| `discount_value`| `DECIMAL(12,0)` | NO | | | | Giá trị giảm (`%` từ 1-100 hoặc số tiền VNĐ) |
| `min_order_value`| `DECIMAL(12,0)`| NO | `0` | | | Giá trị tạm tính tối thiểu của đơn hàng để được áp dụng |
| `max_discount_amount`| `DECIMAL(12,0)`| YES | NULL | | | Mức giảm tối đa (áp dụng khi giảm theo `%`) |
| `start_date` | `DATETIME` | NO | | | | Thời điểm bắt đầu có hiệu lực |
| `end_date` | `DATETIME` | NO | | | | Thời điểm hết hạn hiệu lực |
| `usage_limit` | `INT` | NO | `0` | | | Giới hạn tổng số lượt sử dụng toàn hệ thống (`0`: không giới hạn) |
| `used_count` | `INT` | NO | `0` | | | Số lượt đã sử dụng thành công thực tế |
| `is_active` | `BOOLEAN` | NO | `TRUE` | | | Cờ kích hoạt (`1`: khả dụng, `0`: vô hiệu hóa) |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm tạo voucher |

* **Chỉ mục & Ràng buộc:**
  * `UNIQUE KEY uq_vouchers_code (code)`
  * `CONSTRAINT chk_vouchers_discount_val CHECK (discount_value > 0)`
  * `CONSTRAINT chk_vouchers_min_order CHECK (min_order_value >= 0)`
  * `CONSTRAINT chk_vouchers_dates CHECK (end_date >= start_date)`
  * `CONSTRAINT chk_vouchers_usage CHECK (usage_limit >= 0 AND used_count >= 0 AND (usage_limit = 0 OR used_count <= usage_limit))`
  * `INDEX idx_vouchers_validation (code, is_active, start_date, end_date)`

---

## 15. Bảng `banners`

* **Mục đích:** Quản lý banner hình ảnh quảng cáo, sự kiện hiển thị trên Slider trang chủ.

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh banner |
| `title` | `VARCHAR(150)` | NO | | | | Tiêu đề banner |
| `image_url` | `VARCHAR(255)` | NO | | | | Đường dẫn ảnh banner |
| `link_url` | `VARCHAR(255)` | YES | NULL | | | URL điều hướng khi khách hàng bấm vào banner |
| `display_order`| `INT` | NO | `0` | | | Thứ tự xuất hiện trên slider |
| `is_active` | `BOOLEAN` | NO | `TRUE` | | | Cờ bật/tắt hiển thị (`1`: hiển thị, `0`: ẩn) |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm tạo banner |

* **Chỉ mục & Ràng buộc:**
  * `INDEX idx_banners_display (is_active, display_order)`

---

## 16. Bảng `orders`

* **Mục đích:** Lưu trữ thông tin đơn hàng thanh toán COD. Chứa thông tin snapshot bất biến của người nhận và tài chính tại thời điểm đặt hàng.

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh đơn hàng |
| `order_code` | `VARCHAR(50)` | NO | | | **YES** | Mã đơn hàng công khai duy nhất (ví dụ: `ORD-20261110-XXXX`) |
| `user_id` | `INT` | NO | | **FK** | | Tham chiếu đến khách hàng đặt (`users.id`) |
| `recipient_name_snapshot` | `VARCHAR(100)` | NO | | | | Snapshot họ tên người nhận |
| `recipient_phone_snapshot` | `VARCHAR(20)` | NO | | | | Snapshot số điện thoại người nhận |
| `delivery_address_snapshot`| `VARCHAR(500)` | NO | | | | Snapshot địa chỉ giao hàng đầy đủ |
| `subtotal` | `DECIMAL(12,0)` | NO | | | | Tiền hàng tạm tính (tổng `line_total`) |
| `discount_amount` | `DECIMAL(12,0)` | NO | `0` | | | Số tiền được giảm giá qua voucher |
| `shipping_fee` | `DECIMAL(12,0)` | NO | `0` | | | Phí vận chuyển COD |
| `total_amount` | `DECIMAL(12,0)` | NO | | | | Tổng tiền phải thanh toán (`subtotal - discount + shipping`) |
| `voucher_id` | `INT` | YES | NULL | **FK** | | Tham chiếu voucher đã áp dụng (`vouchers.id`) |
| `voucher_code_snapshot` | `VARCHAR(50)` | YES | NULL | | | Snapshot mã voucher tại thời điểm đặt |
| `payment_method` | `VARCHAR(20)` | NO | `'COD'` | | | Phương thức thanh toán (v1.0 mặc định `'COD'`) |
| `payment_status` | `ENUM('UNPAID','PAID')`| NO | `'UNPAID'` | | | Trạng thái thanh toán tiền mặt COD |
| `order_status` | `ENUM('PENDING','CONFIRMED','PROCESSING','SHIPPING','COMPLETED','CANCELLED')` | NO | `'PENDING'` | | | Máy trạng thái vòng đời đơn hàng |
| `customer_note`| `VARCHAR(255)` | YES | NULL | | | Ghi chú yêu cầu của khách hàng |
| `admin_note` | `VARCHAR(255)` | YES | NULL | | | Ghi chú vận hành của quản trị viên |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm đặt hàng thành công |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | | | Thời điểm cập nhật đơn hàng gần nhất |

* **Chỉ mục & Ràng buộc:**
  * `CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`
  * `CONSTRAINT fk_orders_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL ON UPDATE CASCADE`
  * `UNIQUE KEY uq_orders_code (order_code)`
  * `INDEX idx_orders_user_status (user_id, order_status, created_at)`
  * `CONSTRAINT chk_orders_subtotal CHECK (subtotal >= 0)`
  * `CONSTRAINT chk_orders_discount CHECK (discount_amount >= 0)`
  * `CONSTRAINT chk_orders_shipping CHECK (shipping_fee >= 0)`
  * `CONSTRAINT chk_orders_total CHECK (total_amount >= 0)`

---

## 17. Bảng `order_items`

* **Mục đích:** Lưu trữ các mặt hàng chi tiết trong đơn hàng. **Áp dụng nguyên tắc Snapshot bất biến**: lưu cứng tên sản phẩm, mã SKU, kích cỡ, màu sắc và đơn giá tại thời điểm đặt để lịch sử giao dịch không bao giờ bị biến đổi.

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh dòng sản phẩm đơn hàng |
| `order_id` | `INT` | NO | | **FK** | | Tham chiếu đến đơn hàng cha (`orders.id`) |
| `product_variant_id`| `INT` | NO | | **FK** | | Tham chiếu đến biến thể (`product_variants.id`) |
| `product_name_snapshot` | `VARCHAR(200)`| NO | | | | Snapshot tên sản phẩm lúc mua |
| `sku_snapshot` | `VARCHAR(100)` | NO | | | | Snapshot mã SKU lúc mua |
| `size_snapshot` | `VARCHAR(20)` | NO | | | | Snapshot kích cỡ lúc mua (ví dụ: `41`) |
| `color_snapshot`| `VARCHAR(50)` | NO | | | | Snapshot màu sắc lúc mua (ví dụ: `Đen`) |
| `unit_price` | `DECIMAL(12,0)` | NO | | | | Snapshot đơn giá bán thực tế lúc mua |
| `quantity` | `INT` | NO | | | | Số lượng đặt mua (phải > 0) |
| `line_total` | `DECIMAL(12,0)` | NO | | | | Thành tiền dòng sản phẩm (`unit_price * quantity`) |

* **Chỉ mục & Ràng buộc:**
  * `CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE`
  * `CONSTRAINT fk_order_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT ON UPDATE CASCADE`
  * `UNIQUE KEY uq_order_items_variant (order_id, product_variant_id)`
  * `CONSTRAINT chk_order_items_quantity CHECK (quantity > 0)`
  * `CONSTRAINT chk_order_items_price CHECK (unit_price >= 0)`
  * `CONSTRAINT chk_order_items_total CHECK (line_total >= 0)`

---

## 18. Bảng `order_status_histories`

* **Mục đích:** Nhật ký kiểm toán lịch sử chuyển đổi trạng thái của đơn hàng từ khi tạo mới đến khi hoàn thành hoặc hủy bỏ.

| Tên cột | Kiểu dữ liệu | Null | Mặc định | Khóa | Unique | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `id` | `INT` | NO | Auto Increment | **PK** | YES | Định danh bản ghi lịch sử |
| `order_id` | `INT` | NO | | **FK** | | Tham chiếu đến đơn hàng (`orders.id`) |
| `changed_by` | `INT` | NO | | **FK** | | Người kích hoạt chuyển đổi trạng thái (`users.id`) |
| `previous_status` | `VARCHAR(50)` | YES | NULL | | | Trạng thái trước khi chuyển đổi (NULL khi tạo đơn) |
| `new_status` | `VARCHAR(50)` | NO | | | | Trạng thái sau khi chuyển đổi |
| `note` | `VARCHAR(255)` | YES | NULL | | | Ghi chú lý do chuyển trạng thái hoặc lý do hủy đơn |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | | | Thời điểm chuyển đổi trạng thái |

* **Chỉ mục & Ràng buộc:**
  * `CONSTRAINT fk_order_histories_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE`
  * `CONSTRAINT fk_order_histories_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`
  * `INDEX idx_order_histories_lookup (order_id, created_at)`

