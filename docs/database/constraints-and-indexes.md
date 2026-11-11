# DANH MỤC RÀNG BUỘC VÀ CHỈ MỤC (CONSTRAINTS & INDEXES) - VAMOS STORE

> **Hệ quản trị CSDL:** Microsoft SQL Server 2022 / 2025  
> **Phiên bản:** v1.1 Chuẩn hóa  
> **Mục tiêu:** Tài liệu hóa toàn diện các ràng buộc toàn vẹn dữ liệu (Constraints) và chỉ mục hiệu năng (Non-Clustered Indexes) nhằm đảm bảo tốc độ truy vấn cao và dữ liệu nhất quán 100%.

---

## 1. DANH MỤC RÀNG BUỘC KHÓA CHÍNH (PRIMARY KEYS)

Toàn bộ 19 bảng đều sử dụng Khóa chính tự tăng kiểu `INT IDENTITY(1,1)` kết hợp Clustered Index mặc định của SQL Server:

| Bảng | Khóa chính | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- | :--- |
| `schema_migrations` | `id` | `INT IDENTITY(1,1)` | Định danh phiên bản migration |
| `users` | `id` | `INT IDENTITY(1,1)` | Định danh tài khoản người dùng |
| `categories` | `id` | `INT IDENTITY(1,1)` | Định danh danh mục sản phẩm |
| `brands` | `id` | `INT IDENTITY(1,1)` | Định danh thương hiệu |
| `sizes` | `id` | `INT IDENTITY(1,1)` | Định danh kích cỡ |
| `colors` | `id` | `INT IDENTITY(1,1)` | Định danh màu sắc |
| `products` | `id` | `INT IDENTITY(1,1)` | Định danh sản phẩm cha |
| `product_images` | `id` | `INT IDENTITY(1,1)` | Định danh ảnh minh họa |
| `product_variants` | `id` | `INT IDENTITY(1,1)` | Định danh biến thể |
| `addresses` | `id` | `INT IDENTITY(1,1)` | Định danh địa chỉ giao hàng |
| `password_reset_tokens`| `id` | `INT IDENTITY(1,1)` | Định danh token reset mật khẩu |
| `carts` | `id` | `INT IDENTITY(1,1)` | Định danh giỏ hàng |
| `cart_items` | `id` | `INT IDENTITY(1,1)` | Định danh mặt hàng trong giỏ |
| `vouchers` | `id` | `INT IDENTITY(1,1)` | Định danh mã giảm giá |
| `banners` | `id` | `INT IDENTITY(1,1)` | Định danh banner quảng bá |
| `orders` | `id` | `INT IDENTITY(1,1)` | Định danh đơn hàng |
| `order_items` | `id` | `INT IDENTITY(1,1)` | Định danh mặt hàng trong đơn |
| `order_status_histories`| `id` | `INT IDENTITY(1,1)` | Định danh lịch sử trạng thái |
| `inventory_transactions`| `id` | `INT IDENTITY(1,1)` | Định danh giao dịch biến động kho |
| `voucher_usages` | `id` | `INT IDENTITY(1,1)` | Định danh lượt sử dụng voucher của user |

---

## 2. DANH MỤC RÀNG BUỘC DUY NHẤT (UNIQUE CONSTRAINTS)

| Bảng | Tên ràng buộc / Cột | Mục đích nghiệp vụ |
| :--- | :--- | :--- |
| `schema_migrations` | `version` | Ngăn chặn áp dụng trùng lặp một bản vá migration |
| `users` | `email` | Đảm bảo mỗi địa chỉ email chỉ đăng ký 1 tài khoản |
| `categories` | `slug` | Định danh URL danh mục chuẩn SEO duy nhất |
| `brands` | `slug` | Định danh URL thương hiệu chuẩn SEO duy nhất |
| `sizes` | `size_name` | Không tạo trùng kích cỡ |
| `products` | `product_code` | Mã định danh quản lý sản phẩm duy nhất |
| `products` | `slug` | Đường dẫn chi tiết sản phẩm duy nhất |
| `product_variants` | `sku` | Mã quản lý tồn kho biến thể duy nhất (Stock Keeping Unit) |
| `password_reset_tokens`| `token_hash` | Mã token khôi phục mật khẩu duy nhất |
| `carts` | `user_id` | Mỗi tài khoản khách hàng chỉ có 01 giỏ hàng duy nhất |
| `cart_items` | `(cart_id, variant_id)` | Mỗi biến thể chỉ xuất hiện 1 dòng trong cùng 1 giỏ hàng |
| `vouchers` | `code` | Mã voucher khuyến mãi không được trùng lặp |
| `orders` | `order_code` | Mã đơn hàng tra cứu duy nhất |
| `voucher_usages` | `UQ_voucher_user_usage (voucher_id, user_id)` | **Quy tắc Q8:** Mỗi khách hàng chỉ được dùng 1 mã voucher đúng 1 lần |

---

## 3. DANH MỤC RÀNG BUỘC KHÓA NGOẠI (FOREIGN KEY CONSTRAINTS)

| Bảng con | Khóa ngoại | Bảng cha tham chiếu | Hành vi Xóa (ON DELETE) | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :---: | :--- |
| `products` | `category_id` | `categories(id)` | NO ACTION | Bảo vệ toàn vẹn danh mục cha |
| `products` | `brand_id` | `brands(id)` | SET NULL / NO ACTION | Cho phép sản phẩm không gắn thương hiệu |
| `product_images` | `product_id` | `products(id)` | **CASCADE** | Xóa sản phẩm tự động dọn sạch bộ ảnh |
| `product_variants` | `product_id` | `products(id)` | **CASCADE** | Xóa sản phẩm tự động xóa các biến thể |
| `product_variants` | `size_id` | `sizes(id)` | NO ACTION | Ngăn xóa kích cỡ đang được sử dụng |
| `product_variants` | `color_id` | `colors(id)` | NO ACTION | Ngăn xóa màu sắc đang được sử dụng |
| `addresses` | `user_id` | `users(id)` | **CASCADE** | Xóa người dùng tự động dọn sổ địa chỉ |
| `password_reset_tokens`| `user_id` | `users(id)` | **CASCADE** | Dọn dẹp token khi xóa người dùng |
| `carts` | `user_id` | `users(id)` | **CASCADE** | Dọn giỏ hàng khi người dùng bị xóa |
| `cart_items` | `cart_id` | `carts(id)` | **CASCADE** | Dọn mặt hàng khi xóa giỏ |
| `cart_items` | `variant_id` | `product_variants(id)` | NO ACTION | Ngăn xóa biến thể đang có trong giỏ |
| `orders` | `user_id` | `users(id)` | NO ACTION | Bảo toàn lịch sử đơn hàng của người dùng |
| `orders` | `voucher_id` | `vouchers(id)` | SET NULL | Giữ nguyên đơn hàng nếu voucher bị xóa |
| `order_items` | `order_id` | `orders(id)` | **CASCADE** | Xóa đơn hàng tự động dọn sạch các dòng chi tiết |
| `order_items` | `product_variant_id`| `product_variants(id)`| NO ACTION | Giữ snapshot đơn hàng dù biến thể bị ẩn |
| `order_status_histories`| `order_id`| `orders(id)` | **CASCADE** | Dọn dẹp lịch sử khi xóa đơn test |
| `order_status_histories`| `changed_by`| `users(id)` | NO ACTION | Lưu người thực hiện thay đổi |
| `inventory_transactions`| `variant_id`| `product_variants(id)`| NO ACTION | Lưu nhật ký kiểm toán kho |
| `inventory_transactions`| `user_id` | `users(id)` | NO ACTION | Lưu người thực hiện kiểm toán kho |
| `voucher_usages` | `voucher_id` | `vouchers(id)` | NO ACTION | Giữ lịch sử dùng voucher |
| `voucher_usages` | `user_id` | `users(id)` | NO ACTION | Giữ lịch sử khách hàng đã dùng |
| `voucher_usages` | `order_id` | `orders(id)` | **CASCADE** | Hủy/xóa đơn giải phóng quyền dùng voucher |

---

## 4. DANH MỤC RÀNG BUỘC KIỂM TRA (CHECK CONSTRAINTS)

| Bảng | Ràng buộc CHECK | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- |
| `users` | `role IN ('ADMIN', 'CUSTOMER')` | Chỉ chấp nhận 2 vai trò chuẩn hóa trong CSDL |
| `users` | `status IN ('active', 'locked')` | Trạng thái tài khoản hợp lệ |
| `products` | `gender_target IN ('MEN','WOMEN','KIDS','UNISEX')` | Giới tính mục tiêu hợp lệ |
| `products` | `base_price >= 0` | Giá niêm yết không được âm |
| `products` | `sale_price IS NULL OR (sale_price >= 0 AND sale_price < base_price)` | Giá khuyến mãi phải nhỏ hơn giá gốc |
| `products` | `status IN ('active','inactive','draft')` | Trạng thái sản phẩm |
| `product_variants` | `stock_quantity >= 0` | Tồn kho không bao giờ được âm |
| `product_variants` | `status IN ('active','inactive')` | Trạng thái biến thể |
| `cart_items` | `quantity > 0` | Số lượng trong giỏ phải lớn hơn 0 |
| `vouchers` | `discount_type IN ('percentage','fixed_amount')` | Loại hình chiết khấu hợp lệ |
| `vouchers` | `discount_value > 0` | Giá trị giảm giá phải dương |
| `vouchers` | `min_order_value >= 0` | Giá trị đơn tối thiểu không âm |
| `vouchers` | `end_date >= start_date` | Ngày kết thúc phải sau hoặc bằng ngày bắt đầu |
| `vouchers` | `usage_limit >= 0 AND used_count >= 0` | Lượt dùng không âm |
| `orders` | `payment_status IN ('UNPAID','PAID')` | Trạng thái thanh toán tiền mặt COD |
| `orders` | `order_status IN ('PENDING','CONFIRMED','PROCESSING','SHIPPING','COMPLETED','CANCELLED')` | Máy trạng thái vòng đời đơn hàng |
| `orders` | `subtotal >= 0 AND discount_amount >= 0 AND shipping_fee >= 0 AND total_amount >= 0` | Toàn bộ tiền tệ không âm |
| `order_items` | `unit_price >= 0 AND quantity > 0 AND line_total >= 0` | Giá trị dòng chi tiết hợp lệ |
| `inventory_transactions` | `old_quantity >= 0 AND new_quantity >= 0` | Số liệu kiểm kê kho không âm |

---

## 5. DANH MỤC CHỈ MỤC TỐI ƯU HIỆU NĂNG (NON-CLUSTERED INDEXES)

Hệ thống đã triển khai các chỉ mục Non-Clustered chuyên biệt nhằm phục vụ tối ưu các truy vấn đọc phổ biến và triệt tiêu Table Scan:

| Bảng | Tên Index | Các cột được lập chỉ mục | Mục đích tối ưu hóa |
| :--- | :--- | :--- | :--- |
| `users` | `idx_users_role_status` | `(role, status)` | Lọc nhanh danh sách khách hàng và kiểm tra quyền Admin |
| `products` | `idx_products_cat_status`| `(category_id, status)` | Duyệt danh mục sản phẩm hiển thị trên trang chủ và shop |
| `products` | `idx_products_slug` | `(slug)` | Truy vấn nhanh trang chi tiết sản phẩm theo URL SEO |
| `product_variants` | `idx_variants_product` | `(product_id, status)` | Lấy tất cả biến thể Size & Màu của sản phẩm đang mở |
| `product_variants` | `idx_variants_sku` | `(sku)` | Quét nhanh mã vạch tồn kho |
| `cart_items` | `idx_cart_items_cart` | `(cart_id)` | Tải toàn bộ giỏ hàng của người dùng đang duyệt web |
| `orders` | `idx_orders_user_created`| `(user_id, created_at DESC)`| Hiển thị lịch sử đơn hàng của Customer theo thứ tự mới nhất |
| `orders` | `idx_orders_status` | `(order_status)` | Admin lọc nhanh các đơn `PENDING` cần xử lý gấp |
| `order_items` | `idx_order_items_order`| `(order_id)` | Tải chi tiết các mặt hàng của đơn hàng |
| `voucher_usages` | `idx_voucher_user_usage`| `(voucher_id, user_id)` | Kiểm tra quyền dùng voucher trong thời gian dưới 1ms |
| `inventory_transactions`| `idx_inv_trans_variant`| `(variant_id, created_at DESC)`| Xem lịch sử biến động kho theo thứ tự thời gian |
