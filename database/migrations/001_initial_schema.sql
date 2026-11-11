-- Migration 001: Initial 18 Tables for VAMOS STORE
-- Engine: Microsoft SQL Server (T-SQL)
-- Non-destructive: IF OBJECT_ID(...) IS NULL

IF OBJECT_ID('schema_migrations', 'U') IS NULL
BEGIN
    CREATE TABLE schema_migrations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        version VARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(255) NOT NULL,
        applied_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;

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
END;

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
END;

IF OBJECT_ID('brands', 'U') IS NULL
BEGIN
    CREATE TABLE brands (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        slug NVARCHAR(120) NOT NULL UNIQUE,
        description NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;

IF OBJECT_ID('sizes', 'U') IS NULL
BEGIN
    CREATE TABLE sizes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        size_name NVARCHAR(20) NOT NULL UNIQUE,
        display_order INT NOT NULL DEFAULT 0
    );
END;

IF OBJECT_ID('colors', 'U') IS NULL
BEGIN
    CREATE TABLE colors (
        id INT IDENTITY(1,1) PRIMARY KEY,
        color_name NVARCHAR(50) NOT NULL UNIQUE,
        hex_code NVARCHAR(10) NULL
    );
END;

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
END;

IF OBJECT_ID('banners', 'U') IS NULL
BEGIN
    CREATE TABLE banners (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(150) NOT NULL,
        image_url NVARCHAR(255) NOT NULL,
        link_url NVARCHAR(255) NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;

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
END;

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
END;

IF OBJECT_ID('carts', 'U') IS NULL
BEGIN
    CREATE TABLE carts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END;

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
END;

IF OBJECT_ID('product_images', 'U') IS NULL
BEGIN
    CREATE TABLE product_images (
        id INT IDENTITY(1,1) PRIMARY KEY,
        product_id INT NOT NULL,
        image_url NVARCHAR(255) NOT NULL,
        is_primary BIT NOT NULL DEFAULT 0,
        display_order INT NOT NULL DEFAULT 0,
        CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
END;

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
END;

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
END;

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
END;

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
END;

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
END;

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
END;
