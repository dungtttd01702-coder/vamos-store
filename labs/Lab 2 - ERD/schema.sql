-- =============================================================================
-- CƠ SỞ DỮ LIỆU: VAMOS STORE (E-COMMERCE FOOTWEAR SYSTEM)
-- Hệ quản trị CSDL: MySQL 8.0+
-- Bảng mã: utf8mb4 / Đối chiếu: utf8mb4_unicode_ci
-- Phiên bản: v1.1 Chuẩn hóa (18 Thực thể, 3 Actors: Guest, Customer, Admin)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `vamos_store_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `vamos_store_db`;

-- Tạm thời tắt kiểm tra khóa ngoại khi khởi tạo để hỗ trợ nạp cấu trúc an toàn
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. BẢNG users: Quản lý tài khoản người dùng hệ thống (ADMIN, CUSTOMER)
-- =============================================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(100) NOT NULL COMMENT 'Họ và tên người dùng',
    `email` VARCHAR(150) NOT NULL COMMENT 'Email đăng nhập duy nhất',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Chuỗi băm mật khẩu bcrypt',
    `phone` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Số điện thoại liên lạc',
    `role` ENUM('ADMIN', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER' COMMENT 'Vai trò phân quyền',
    `status` ENUM('active', 'locked') NOT NULL DEFAULT 'active' COMMENT 'Trạng thái hoạt động',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_email` (`email`),
    INDEX `idx_users_role_status` (`role`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tài khoản người dùng hệ thống';

-- =============================================================================
-- 2. BẢNG categories: Danh mục sản phẩm (Sneaker, Thể thao, Sandal, Dép,...)
-- =============================================================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL COMMENT 'Tên hiển thị danh mục',
    `slug` VARCHAR(120) NOT NULL COMMENT 'Đường dẫn tĩnh SEO duy nhất',
    `description` TEXT NULL DEFAULT NULL COMMENT 'Mô tả chi tiết danh mục',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cờ trạng thái hiển thị (1: bật, 0: ẩn)',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_categories_slug` (`slug`),
    INDEX `idx_categories_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục sản phẩm';

-- =============================================================================
-- 3. BẢNG brands: Thương hiệu hoặc dòng bộ sưu tập của VAMOS
-- =============================================================================
DROP TABLE IF EXISTS `brands`;
CREATE TABLE `brands` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL COMMENT 'Tên thương hiệu / dòng sản phẩm',
    `slug` VARCHAR(120) NOT NULL COMMENT 'Đường dẫn tĩnh duy nhất',
    `description` TEXT NULL DEFAULT NULL COMMENT 'Mô tả giới thiệu',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_brands_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thương hiệu và bộ sưu tập';

-- =============================================================================
-- 4. BẢNG sizes: Danh mục kích cỡ giày chuẩn hóa
-- =============================================================================
DROP TABLE IF EXISTS `sizes`;
CREATE TABLE `sizes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `size_name` VARCHAR(20) NOT NULL COMMENT 'Tên kích cỡ chuẩn (38, 39, 40,...)',
    `display_order` INT NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị khi chọn',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_sizes_name` (`size_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục kích cỡ giày dép';

-- =============================================================================
-- 5. BẢNG colors: Danh mục màu sắc sản phẩm
-- =============================================================================
DROP TABLE IF EXISTS `colors`;
CREATE TABLE `colors` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `color_name` VARCHAR(50) NOT NULL COMMENT 'Tên hiển thị của màu sắc (Đen, Trắng,...)',
    `hex_code` VARCHAR(10) NULL DEFAULT NULL COMMENT 'Mã màu Hex CSS (#000000,...)',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_colors_name` (`color_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục màu sắc';

-- =============================================================================
-- 6. BẢNG vouchers: Mã giảm giá khuyến mãi
-- =============================================================================
DROP TABLE IF EXISTS `vouchers`;
CREATE TABLE `vouchers` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL COMMENT 'Mã voucher duy nhất',
    `name` VARCHAR(100) NOT NULL COMMENT 'Tên chương trình khuyến mãi',
    `discount_type` ENUM('percentage', 'fixed_amount') NOT NULL COMMENT 'Loại giảm giá',
    `discount_value` DECIMAL(12, 0) NOT NULL COMMENT 'Giá trị giảm (% hoặc số tiền VNĐ)',
    `min_order_value` DECIMAL(12, 0) NOT NULL DEFAULT 0 COMMENT 'Giá trị đơn hàng tối thiểu',
    `max_discount_amount` DECIMAL(12, 0) NULL DEFAULT NULL COMMENT 'Mức giảm tối đa (khi giảm theo %)',
    `start_date` DATETIME NOT NULL COMMENT 'Thời điểm bắt đầu áp dụng',
    `end_date` DATETIME NOT NULL COMMENT 'Thời điểm kết thúc áp dụng',
    `usage_limit` INT NOT NULL DEFAULT 0 COMMENT 'Giới hạn tổng số lượt dùng (0: không giới hạn)',
    `used_count` INT NOT NULL DEFAULT 0 COMMENT 'Số lượt đã sử dụng thực tế',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cờ kích hoạt khả dụng',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_vouchers_code` (`code`),
    INDEX `idx_vouchers_validation` (`code`, `is_active`, `start_date`, `end_date`),
    CONSTRAINT `chk_vouchers_discount_val` CHECK (`discount_value` > 0),
    CONSTRAINT `chk_vouchers_min_order` CHECK (`min_order_value` >= 0),
    CONSTRAINT `chk_vouchers_dates` CHECK (`end_date` >= `start_date`),
    CONSTRAINT `chk_vouchers_usage` CHECK (`usage_limit` >= 0 AND `used_count` >= 0 AND (`usage_limit` = 0 OR `used_count` <= `usage_limit`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mã giảm giá khuyến mãi';

-- =============================================================================
-- 7. BẢNG banners: Banner sự kiện, quảng cáo tại trang chủ
-- =============================================================================
DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(150) NOT NULL COMMENT 'Tiêu đề banner',
    `image_url` VARCHAR(255) NOT NULL COMMENT 'Đường dẫn ảnh banner',
    `link_url` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Đường dẫn chuyển hướng khi click',
    `display_order` INT NOT NULL DEFAULT 0 COMMENT 'Thứ tự ưu tiên trên slider',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái hiển thị',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_banners_display` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Banner quảng cáo trang chủ';

-- =============================================================================
-- 8. BẢNG addresses: Sổ địa chỉ nhận hàng của khách hàng
-- =============================================================================
DROP TABLE IF EXISTS `addresses`;
CREATE TABLE `addresses` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL COMMENT 'Tham chiếu đến users.id',
    `recipient_name` VARCHAR(100) NOT NULL COMMENT 'Họ tên người nhận hàng',
    `phone` VARCHAR(20) NOT NULL COMMENT 'Số điện thoại nhận hàng',
    `province` VARCHAR(100) NOT NULL COMMENT 'Tỉnh / Thành phố',
    `district` VARCHAR(100) NOT NULL COMMENT 'Quận / Huyện',
    `ward` VARCHAR(100) NOT NULL COMMENT 'Phường / Xã',
    `detail_address` VARCHAR(255) NOT NULL COMMENT 'Địa chỉ chi tiết số nhà, tên đường',
    `is_default` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đánh dấu địa chỉ mặc định',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_addresses_user_default` (`user_id`, `is_default`),
    CONSTRAINT `fk_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sổ địa chỉ nhận hàng của khách hàng';

-- =============================================================================
-- 9. BẢNG password_reset_tokens: Token khôi phục mật khẩu
-- =============================================================================
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL COMMENT 'Tham chiếu đến users.id',
    `token` VARCHAR(255) NOT NULL COMMENT 'Token khôi phục bảo mật duy nhất',
    `expires_at` DATETIME NOT NULL COMMENT 'Thời hạn hết hạn của token',
    `used_at` DATETIME NULL DEFAULT NULL COMMENT 'Thời điểm token đã được sử dụng',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_pwd_reset_token` (`token`),
    INDEX `idx_pwd_reset_lookup` (`user_id`, `expires_at`, `used_at`),
    CONSTRAINT `fk_pwd_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mã token khôi phục mật khẩu';

-- =============================================================================
-- 10. BẢNG carts: Giỏ hàng trực tuyến của khách hàng (1 User = 1 Cart)
-- =============================================================================
DROP TABLE IF EXISTS `carts`;
CREATE TABLE `carts` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL COMMENT 'Tham chiếu đến users.id (UNIQUE 1-1)',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_carts_user` (`user_id`),
    CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Giỏ hàng của người dùng';

-- =============================================================================
-- 11. BẢNG products: Thông tin sản phẩm cha
-- =============================================================================
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `category_id` INT NOT NULL COMMENT 'Tham chiếu categories.id',
    `brand_id` INT NULL DEFAULT NULL COMMENT 'Tham chiếu brands.id (tùy chọn)',
    `product_code` VARCHAR(50) NOT NULL COMMENT 'Mã sản phẩm duy nhất (VM-SNK-01)',
    `name` VARCHAR(200) NOT NULL COMMENT 'Tên đầy đủ của sản phẩm',
    `slug` VARCHAR(255) NOT NULL COMMENT 'Đường dẫn tĩnh duy nhất',
    `description` TEXT NULL DEFAULT NULL COMMENT 'Mô tả tính năng, công nghệ, chất liệu',
    `gender_target` ENUM('MEN', 'WOMEN', 'KIDS', 'UNISEX') NOT NULL DEFAULT 'UNISEX' COMMENT 'Đối tượng khách hàng',
    `base_price` DECIMAL(12, 0) NOT NULL COMMENT 'Giá bán niêm yết chính thức (VNĐ)',
    `sale_price` DECIMAL(12, 0) NULL DEFAULT NULL COMMENT 'Giá bán khuyến mãi ưu đãi (VNĐ)',
    `status` ENUM('active', 'inactive', 'draft') NOT NULL DEFAULT 'active' COMMENT 'Trạng thái sản phẩm',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_products_code` (`product_code`),
    UNIQUE KEY `uq_products_slug` (`slug`),
    INDEX `idx_products_search` (`category_id`, `gender_target`, `status`, `base_price`),
    CONSTRAINT `chk_products_base_price` CHECK (`base_price` >= 0),
    CONSTRAINT `chk_products_sale_price` CHECK (`sale_price` IS NULL OR (`sale_price` >= 0 AND `sale_price` < `base_price`)),
    CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sản phẩm cha';

-- =============================================================================
-- 12. BẢNG product_images: Bộ sưu tập hình ảnh chi tiết sản phẩm
-- =============================================================================
DROP TABLE IF EXISTS `product_images`;
CREATE TABLE `product_images` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `product_id` INT NOT NULL COMMENT 'Tham chiếu products.id',
    `image_url` VARCHAR(255) NOT NULL COMMENT 'Đường dẫn file ảnh trong storage',
    `is_primary` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Cờ ảnh đại diện chính (card sản phẩm)',
    `display_order` INT NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị trong gallery',
    PRIMARY KEY (`id`),
    INDEX `idx_product_images_order` (`product_id`, `is_primary`, `display_order`),
    CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hình ảnh sản phẩm';

-- =============================================================================
-- 13. BẢNG product_variants: Biến thể chi tiết sản phẩm (Size x Color x SKU)
-- =============================================================================
DROP TABLE IF EXISTS `product_variants`;
CREATE TABLE `product_variants` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `product_id` INT NOT NULL COMMENT 'Tham chiếu products.id',
    `size_id` INT NOT NULL COMMENT 'Tham chiếu sizes.id',
    `color_id` INT NOT NULL COMMENT 'Tham chiếu colors.id',
    `sku` VARCHAR(100) NOT NULL COMMENT 'Mã lưu kho biến thể duy nhất',
    `stock_quantity` INT NOT NULL DEFAULT 0 COMMENT 'Số lượng tồn kho khả dụng',
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT 'Trạng thái kinh doanh biến thể',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_variants_sku` (`sku`),
    UNIQUE KEY `uq_variants_combination` (`product_id`, `size_id`, `color_id`),
    INDEX `idx_variants_lookup` (`product_id`, `status`, `stock_quantity`),
    CONSTRAINT `chk_variants_stock` CHECK (`stock_quantity` >= 0),
    CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_variants_size` FOREIGN KEY (`size_id`) REFERENCES `sizes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_variants_color` FOREIGN KEY (`color_id`) REFERENCES `colors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Biến thể chi tiết sản phẩm (SKU, Size, Color, Tồn kho)';

-- =============================================================================
-- 14. BẢNG cart_items: Dòng chi tiết giỏ hàng (Cart x Variant)
-- =============================================================================
DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `cart_id` INT NOT NULL COMMENT 'Tham chiếu carts.id',
    `variant_id` INT NOT NULL COMMENT 'Tham chiếu product_variants.id',
    `quantity` INT NOT NULL DEFAULT 1 COMMENT 'Số lượng đặt mua',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_cart_variant` (`cart_id`, `variant_id`),
    CONSTRAINT `chk_cart_items_quantity` CHECK (`quantity` > 0),
    CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_cart_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Dòng sản phẩm trong giỏ hàng';

-- =============================================================================
-- 15. BẢNG orders: Đơn hàng & Snapshot thông tin thanh toán COD
-- =============================================================================
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `order_code` VARCHAR(50) NOT NULL COMMENT 'Mã đơn hàng duy nhất (ORD-...)',
    `user_id` INT NOT NULL COMMENT 'Tham chiếu users.id của khách đặt',
    `recipient_name_snapshot` VARCHAR(100) NOT NULL COMMENT 'Snapshot họ tên người nhận',
    `recipient_phone_snapshot` VARCHAR(20) NOT NULL COMMENT 'Snapshot số điện thoại người nhận',
    `delivery_address_snapshot` VARCHAR(500) NOT NULL COMMENT 'Snapshot địa chỉ giao hàng đầy đủ',
    `subtotal` DECIMAL(12, 0) NOT NULL COMMENT 'Tạm tính tiền hàng (tổng line_total)',
    `discount_amount` DECIMAL(12, 0) NOT NULL DEFAULT 0 COMMENT 'Số tiền được giảm giá',
    `shipping_fee` DECIMAL(12, 0) NOT NULL DEFAULT 0 COMMENT 'Phí vận chuyển COD',
    `total_amount` DECIMAL(12, 0) NOT NULL COMMENT 'Tổng số tiền COD phải thanh toán',
    `voucher_id` INT NULL DEFAULT NULL COMMENT 'Tham chiếu vouchers.id',
    `voucher_code_snapshot` VARCHAR(50) NULL DEFAULT NULL COMMENT 'Snapshot mã voucher tại lúc đặt',
    `payment_method` VARCHAR(20) NOT NULL DEFAULT 'COD' COMMENT 'Phương thức thanh toán',
    `payment_status` ENUM('UNPAID', 'PAID') NOT NULL DEFAULT 'UNPAID' COMMENT 'Trạng thái thu tiền COD',
    `order_status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT 'Vòng đời trạng thái đơn hàng',
    `customer_note` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Ghi chú của khách hàng',
    `admin_note` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Ghi chú vận hành của quản trị viên',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_orders_code` (`order_code`),
    INDEX `idx_orders_user_status` (`user_id`, `order_status`, `created_at`),
    CONSTRAINT `chk_orders_subtotal` CHECK (`subtotal` >= 0),
    CONSTRAINT `chk_orders_discount` CHECK (`discount_amount` >= 0),
    CONSTRAINT `chk_orders_shipping` CHECK (`shipping_fee` >= 0),
    CONSTRAINT `chk_orders_total` CHECK (`total_amount` >= 0),
    CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_orders_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đơn hàng và snapshot thanh toán COD';

-- =============================================================================
-- 16. BẢNG order_items: Chi tiết sản phẩm đơn hàng (Snapshot bất biến)
-- =============================================================================
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `order_id` INT NOT NULL COMMENT 'Tham chiếu orders.id',
    `product_variant_id` INT NOT NULL COMMENT 'Tham chiếu product_variants.id',
    `product_name_snapshot` VARCHAR(200) NOT NULL COMMENT 'Snapshot tên sản phẩm lúc mua',
    `sku_snapshot` VARCHAR(100) NOT NULL COMMENT 'Snapshot mã SKU lúc mua',
    `size_snapshot` VARCHAR(20) NOT NULL COMMENT 'Snapshot kích cỡ lúc mua',
    `color_snapshot` VARCHAR(50) NOT NULL COMMENT 'Snapshot màu sắc lúc mua',
    `unit_price` DECIMAL(12, 0) NOT NULL COMMENT 'Snapshot đơn giá bán tại thời điểm đặt',
    `quantity` INT NOT NULL COMMENT 'Số lượng đặt mua',
    `line_total` DECIMAL(12, 0) NOT NULL COMMENT 'Thành tiền = unit_price * quantity',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_order_items_variant` (`order_id`, `product_variant_id`),
    CONSTRAINT `chk_order_items_quantity` CHECK (`quantity` > 0),
    CONSTRAINT `chk_order_items_price` CHECK (`unit_price` >= 0),
    CONSTRAINT `chk_order_items_total` CHECK (`line_total` >= 0),
    CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết mặt hàng đơn hàng (Snapshot bất biến)';

-- =============================================================================
-- 17. BẢNG order_status_histories: Nhật ký lịch sử trạng thái đơn hàng
-- =============================================================================
DROP TABLE IF EXISTS `order_status_histories`;
CREATE TABLE `order_status_histories` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `order_id` INT NOT NULL COMMENT 'Tham chiếu orders.id',
    `changed_by` INT NOT NULL COMMENT 'Tham chiếu users.id người thực hiện thay đổi',
    `previous_status` VARCHAR(50) NULL DEFAULT NULL COMMENT 'Trạng thái trước khi đổi',
    `new_status` VARCHAR(50) NOT NULL COMMENT 'Trạng thái sau khi đổi',
    `note` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Ghi chú lý do chuyển trạng thái hoặc lý do hủy',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_order_histories_lookup` (`order_id`, `created_at`),
    CONSTRAINT `fk_order_histories_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_order_histories_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhật ký lịch sử trạng thái đơn hàng';

-- =============================================================================
-- 18. BẢNG inventory_transactions: Nhật ký kiểm toán biến động kho
-- =============================================================================
DROP TABLE IF EXISTS `inventory_transactions`;
CREATE TABLE `inventory_transactions` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `variant_id` INT NOT NULL COMMENT 'Tham chiếu product_variants.id',
    `user_id` INT NOT NULL COMMENT 'Tham chiếu users.id người thao tác',
    `old_quantity` INT NOT NULL COMMENT 'Số lượng tồn trước biến động',
    `new_quantity` INT NOT NULL COMMENT 'Số lượng tồn sau biến động',
    `change_quantity` INT NOT NULL COMMENT 'Số lượng biến động (+ tăng, - giảm)',
    `reason` VARCHAR(255) NOT NULL COMMENT 'Lý do (ORDER_PLACED, ORDER_CANCELLED_RESTOCK, ADMIN_ADJUSTMENT,...)',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_inv_trans_variant_date` (`variant_id`, `created_at`),
    CONSTRAINT `chk_inv_trans_old` CHECK (`old_quantity` >= 0),
    CONSTRAINT `chk_inv_trans_new` CHECK (`new_quantity` >= 0),
    CONSTRAINT `fk_inv_trans_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_inv_trans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhật ký kiểm toán biến động tồn kho';

-- Bật lại kiểm tra khóa ngoại sau khi hoàn tất nạp cấu trúc
SET FOREIGN_KEY_CHECKS = 1;

