-- =============================================================================
-- CƠ SỞ DỮ LIỆU: VAMOS STORE (E-COMMERCE FOOTWEAR SYSTEM)
-- Hệ quản trị CSDL: Microsoft SQL Server (T-SQL)
-- Bảng mã: Unicode (NVARCHAR / UTF-8)
-- Phiên bản: v1.2 Chuẩn hóa Bảo toàn Dữ liệu (18 Thực thể + Migrations, Không Phá Hủy)
-- =============================================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'vamos_store_db')
BEGIN
    CREATE DATABASE vamos_store_db;
END
GO

USE vamos_store_db;
GO

-- =============================================================================
-- 0. BẢNG schema_migrations: Nhật ký áp dụng migrations bảo toàn dữ liệu
-- =============================================================================
IF OBJECT_ID('schema_migrations', 'U') IS NULL
BEGIN
    CREATE TABLE schema_migrations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        version VARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(255) NOT NULL,
        applied_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- =============================================================================
-- 1. BẢNG users: Quản lý tài khoản người dùng hệ thống (ADMIN, CUSTOMER)
-- =============================================================================
IF OBJECT_ID('users', 'U') IS NULL
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        full_name NVARCHAR(100) NOT NULL,
        email NVARCHAR(150) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        phone NVARCHAR(20) NULL,
        role NVARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('ADMIN', 'CUSTOMER')),
        status NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked')),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- =============================================================================
-- 2. BẢNG categories: Danh mục sản phẩm (Sneaker, Thể thao, Sandal, Dép,...)
-- =============================================================================
IF OBJECT_ID('categories', 'U') IS NULL
BEGIN
    CREATE TABLE categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        slug NVARCHAR(120) NOT NULL UNIQUE,
        description NVARCHAR(MAX) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- =============================================================================
-- 3. BẢNG brands: Thương hiệu hoặc dòng bộ sưu tập của VAMOS
-- =============================================================================
IF OBJECT_ID('brands', 'U') IS NULL
BEGIN
    CREATE TABLE brands (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        slug NVARCHAR(120) NOT NULL UNIQUE,
        description NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- =============================================================================
-- 4. BẢNG sizes: Danh mục kích cỡ giày chuẩn hóa
-- =============================================================================
IF OBJECT_ID('sizes', 'U') IS NULL
BEGIN
    CREATE TABLE sizes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        size_name NVARCHAR(20) NOT NULL UNIQUE,
        display_order INT NOT NULL DEFAULT 0
    );
END
GO

-- =============================================================================
-- 5. BẢNG colors: Bảng màu sắc chi tiết của sản phẩm
-- =============================================================================
IF OBJECT_ID('colors', 'U') IS NULL
BEGIN
    CREATE TABLE colors (
        id INT IDENTITY(1,1) PRIMARY KEY,
        color_name NVARCHAR(50) NOT NULL UNIQUE,
        hex_code NVARCHAR(10) NULL
    );
END
GO

-- =============================================================================
-- 6. BẢNG vouchers: Mã giảm giá khuyến mãi
-- =============================================================================
IF OBJECT_ID('vouchers', 'U') IS NULL
BEGIN
    CREATE TABLE vouchers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,
        name NVARCHAR(100) NOT NULL,
        discount_type NVARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
        discount_value DECIMAL(12, 0) NOT NULL CHECK (discount_value > 0),
        min_order_value DECIMAL(12, 0) NOT NULL DEFAULT 0 CHECK (min_order_value >= 0),
        max_discount_amount DECIMAL(12, 0) NULL,
        start_date DATETIME2 NOT NULL,
        end_date DATETIME2 NOT NULL,
        usage_limit INT NOT NULL DEFAULT 0 CHECK (usage_limit >= 0),
        used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT chk_vouchers_dates CHECK (end_date >= start_date)
    );
END
GO

-- =============================================================================
-- 7. BẢNG banners: Banner quảng cáo trang chủ
-- =============================================================================
IF OBJECT_ID('banners', 'U') IS NULL
BEGIN
    CREATE TABLE banners (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(150) NOT NULL,
        image_url NVARCHAR(1000) NOT NULL,
        link_url NVARCHAR(255) NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- =============================================================================
-- 8. BẢNG addresses: Sổ địa chỉ nhận hàng của khách hàng
-- =============================================================================
IF OBJECT_ID('addresses', 'U') IS NULL
BEGIN
    CREATE TABLE addresses (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        recipient_name NVARCHAR(100) NOT NULL,
        phone NVARCHAR(20) NOT NULL,
        province NVARCHAR(100) NOT NULL,
        district NVARCHAR(100) NOT NULL,
        ward NVARCHAR(100) NOT NULL,
        detail_address NVARCHAR(255) NOT NULL,
        is_default BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Filtered Index: Bảo đảm mỗi khách hàng chỉ có tối đa một địa chỉ mặc định
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'uq_user_default_address' AND object_id = OBJECT_ID('addresses'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX uq_user_default_address
    ON addresses (user_id)
    WHERE is_default = 1;
END
GO

-- =============================================================================
-- 9. BẢNG password_reset_tokens: Token khôi phục mật khẩu an toàn
-- =============================================================================
IF OBJECT_ID('password_reset_tokens', 'U') IS NULL
BEGIN
    CREATE TABLE password_reset_tokens (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash NVARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME2 NOT NULL,
        used_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_pwd_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- =============================================================================
-- 10. BẢNG carts: Giỏ hàng trực tuyến của khách hàng (1 User = 1 Cart)
-- =============================================================================
IF OBJECT_ID('carts', 'U') IS NULL
BEGIN
    CREATE TABLE carts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- =============================================================================
-- 11. BẢNG products: Thông tin sản phẩm cha
-- =============================================================================
IF OBJECT_ID('products', 'U') IS NULL
BEGIN
    CREATE TABLE products (
        id INT IDENTITY(1,1) PRIMARY KEY,
        category_id INT NOT NULL,
        brand_id INT NULL,
        product_code NVARCHAR(50) NOT NULL UNIQUE,
        name NVARCHAR(200) NOT NULL,
        slug NVARCHAR(255) NOT NULL UNIQUE,
        description NVARCHAR(MAX) NULL,
        gender_target NVARCHAR(20) NOT NULL DEFAULT 'UNISEX' CHECK (gender_target IN ('MEN', 'WOMEN', 'KIDS', 'UNISEX')),
        base_price DECIMAL(12, 0) NOT NULL CHECK (base_price >= 0),
        sale_price DECIMAL(12, 0) NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
        CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
        CONSTRAINT chk_products_sale_price CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price < base_price))
    );
END
GO

-- =============================================================================
-- 12. BẢNG product_images: Bộ sưu tập hình ảnh chi tiết sản phẩm
-- =============================================================================
IF OBJECT_ID('product_images', 'U') IS NULL
BEGIN
    CREATE TABLE product_images (
        id INT IDENTITY(1,1) PRIMARY KEY,
        product_id INT NOT NULL,
        image_url NVARCHAR(1000) NOT NULL,
        is_primary BIT NOT NULL DEFAULT 0,
        display_order INT NOT NULL DEFAULT 0,
        CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
END
GO

-- Filtered Index: Bảo đảm mỗi sản phẩm chỉ có tối đa một ảnh chính (primary image)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'uq_product_primary_image' AND object_id = OBJECT_ID('product_images'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX uq_product_primary_image
    ON product_images (product_id)
    WHERE is_primary = 1;
END
GO

-- =============================================================================
-- 13. BẢNG product_variants: Biến thể chi tiết sản phẩm (SKU x Size x Color)
-- =============================================================================
IF OBJECT_ID('product_variants', 'U') IS NULL
BEGIN
    CREATE TABLE product_variants (
        id INT IDENTITY(1,1) PRIMARY KEY,
        product_id INT NOT NULL,
        size_id INT NOT NULL,
        color_id INT NOT NULL,
        sku NVARCHAR(100) NOT NULL UNIQUE,
        stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
        status NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT uq_variants_combination UNIQUE (product_id, size_id, color_id),
        CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        CONSTRAINT fk_variants_size FOREIGN KEY (size_id) REFERENCES sizes(id),
        CONSTRAINT fk_variants_color FOREIGN KEY (color_id) REFERENCES colors(id)
    );
END
GO

-- =============================================================================
-- 14. BẢNG cart_items: Dòng chi tiết giỏ hàng (Cart x Variant)
-- =============================================================================
IF OBJECT_ID('cart_items', 'U') IS NULL
BEGIN
    CREATE TABLE cart_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        cart_id INT NOT NULL,
        variant_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT uq_cart_variant UNIQUE (cart_id, variant_id),
        CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    );
END
GO

-- =============================================================================
-- 15. BẢNG orders: Quản lý đơn hàng mua sắm COD & Snapshot hóa đơn
-- =============================================================================
IF OBJECT_ID('orders', 'U') IS NULL
BEGIN
    CREATE TABLE orders (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_code NVARCHAR(50) NOT NULL UNIQUE,
        user_id INT NOT NULL,
        recipient_name_snapshot NVARCHAR(100) NOT NULL,
        recipient_phone_snapshot NVARCHAR(20) NOT NULL,
        delivery_address_snapshot NVARCHAR(255) NOT NULL,
        subtotal DECIMAL(12, 0) NOT NULL CHECK (subtotal >= 0),
        discount_amount DECIMAL(12, 0) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
        shipping_fee DECIMAL(12, 0) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
        total_amount DECIMAL(12, 0) NOT NULL CHECK (total_amount >= 0),
        voucher_id INT NULL,
        voucher_code_snapshot NVARCHAR(50) NULL,
        payment_method NVARCHAR(20) NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD')),
        payment_status NVARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),
        order_status NVARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (order_status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED')),
        customer_note NVARCHAR(500) NULL,
        admin_note NVARCHAR(500) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_orders_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL
    );
END
GO

-- =============================================================================
-- 16. BẢNG order_items: Chi tiết các mặt hàng trong đơn & Snapshot giá/tên
-- =============================================================================
IF OBJECT_ID('order_items', 'U') IS NULL
BEGIN
    CREATE TABLE order_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        product_variant_id INT NOT NULL,
        product_name_snapshot NVARCHAR(200) NOT NULL,
        sku_snapshot NVARCHAR(100) NOT NULL,
        size_snapshot NVARCHAR(20) NOT NULL,
        color_snapshot NVARCHAR(50) NOT NULL,
        unit_price DECIMAL(12, 0) NOT NULL CHECK (unit_price >= 0),
        quantity INT NOT NULL CHECK (quantity > 0),
        line_total DECIMAL(12, 0) NOT NULL CHECK (line_total >= 0),
        CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_order_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
    );
END
GO

-- =============================================================================
-- 17. BẢNG order_status_histories: Lịch sử máy trạng thái đơn hàng
-- =============================================================================
IF OBJECT_ID('order_status_histories', 'U') IS NULL
BEGIN
    CREATE TABLE order_status_histories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        changed_by INT NOT NULL,
        previous_status NVARCHAR(50) NULL,
        new_status NVARCHAR(50) NOT NULL,
        note NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_order_histories_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_order_histories_user FOREIGN KEY (changed_by) REFERENCES users(id)
    );
END
GO

-- =============================================================================
-- 18. BẢNG inventory_transactions: Nhật ký kiểm toán biến động kho
-- =============================================================================
IF OBJECT_ID('inventory_transactions', 'U') IS NULL
BEGIN
    CREATE TABLE inventory_transactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        variant_id INT NOT NULL,
        user_id INT NOT NULL,
        old_quantity INT NOT NULL CHECK (old_quantity >= 0),
        new_quantity INT NOT NULL CHECK (new_quantity >= 0),
        change_quantity INT NOT NULL,
        reason NVARCHAR(255) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_inv_trans_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id),
        CONSTRAINT fk_inv_trans_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
END
GO

-- =============================================================================
-- 19. BẢNG voucher_usages: Quản lý giới hạn sử dụng voucher theo Customer (Q8)
-- =============================================================================
IF OBJECT_ID('voucher_usages', 'U') IS NULL
BEGIN
    CREATE TABLE voucher_usages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        voucher_id INT NOT NULL CONSTRAINT FK_voucher_usages_voucher REFERENCES vouchers(id),
        user_id INT NOT NULL CONSTRAINT FK_voucher_usages_user REFERENCES users(id),
        order_id INT NOT NULL CONSTRAINT FK_voucher_usages_order REFERENCES orders(id) ON DELETE CASCADE,
        used_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_voucher_user_usage UNIQUE (voucher_id, user_id)
    );
END
GO

