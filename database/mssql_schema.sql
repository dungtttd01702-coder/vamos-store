-- =============================================================================
-- CƠ SỞ DỮ LIỆU: VAMOS STORE (E-COMMERCE FOOTWEAR SYSTEM)
-- Hệ quản trị CSDL: Microsoft SQL Server (T-SQL)
-- Phiên bản Snapshot: Đồng bộ đầy đủ 28 bảng thực thể sau Migrations 001–008
-- =============================================================================
-- LƯU Ý KIẾN TRÚC QUAN TRỌNG:
-- - Nguồn chân lý (Single Source of Truth) để khởi tạo & nâng cấp DB là:
--     `node database/init_mssql.js` + `database/migrations/001..008_*.sql`
-- - File `database/mssql_schema.sql` là BẢN CHỤP SCHEMA CUỐI CÙNG (Canonical Snapshot)
--   dành cho tham chiếu cấu trúc và kiểm chứng Schema Parity tự động.
-- - File này KHÔNG hardcode `USE vamos_store_db` để có thể áp dụng trên bất kỳ
--   database đích hợp lệ nào, và ghi nhận baseline `schema_migrations` (`checksum = NULL`,
--   trạng thái LEGACY_UNVERIFIED) nhằm tránh runner chạy lặp lại `001–008`.
-- =============================================================================

-- =============================================================================
-- 0. BẢNG schema_migrations: Nhật ký áp dụng migrations (Migration 001 + 008)
-- =============================================================================
IF OBJECT_ID('schema_migrations', 'U') IS NULL
BEGIN
    CREATE TABLE schema_migrations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        version VARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(255) NOT NULL,
        applied_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        checksum VARCHAR(64) NULL,
        CONSTRAINT chk_schema_migrations_checksum CHECK (checksum IS NULL OR LEN(checksum) = 64)
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
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
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
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
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
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
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
-- 6. BẢNG vouchers: Mã giảm giá khuyến mãi (Migration 001 + 007)
-- =============================================================================
IF OBJECT_ID('vouchers', 'U') IS NULL
BEGIN
    CREATE TABLE vouchers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,
        name NVARCHAR(100) NOT NULL,
        discount_type NVARCHAR(20) NOT NULL CONSTRAINT chk_vouchers_discount_type CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping')),
        discount_value DECIMAL(12, 0) NOT NULL CHECK (discount_value > 0),
        min_order_value DECIMAL(12, 0) NOT NULL DEFAULT 0 CHECK (min_order_value >= 0),
        max_discount_amount DECIMAL(12, 0) NULL,
        start_date DATETIME2 NOT NULL,
        end_date DATETIME2 NOT NULL,
        usage_limit INT NOT NULL DEFAULT 0 CHECK (usage_limit >= 0),
        used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
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
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- =============================================================================
-- 8. BẢNG addresses: Sổ địa chỉ nhận hàng của khách hàng (Migration 001 + 002)
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
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_user_default_address' AND object_id = OBJECT_ID('addresses'))
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
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
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
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
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
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
        CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
        CONSTRAINT chk_products_sale_price CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price < base_price))
    );
END
GO

-- =============================================================================
-- 12. BẢNG product_images: Bộ sưu tập hình ảnh sản phẩm (Migration 001 + 002)
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

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_product_primary_image' AND object_id = OBJECT_ID('product_images'))
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
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
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
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT uq_cart_variant UNIQUE (cart_id, variant_id),
        CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    );
END
GO

-- =============================================================================
-- 15. BẢNG orders: Quản lý đơn hàng COD & Snapshot hóa đơn (Migration 001 + 007)
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
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        shipping_discount_amount DECIMAL(12, 0) NOT NULL CONSTRAINT df_orders_shipping_discount_amount DEFAULT 0,
        CONSTRAINT chk_orders_shipping_discount_non_negative CHECK (shipping_discount_amount >= 0),
        CONSTRAINT chk_orders_shipping_discount_cap CHECK (shipping_discount_amount <= shipping_fee),
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
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
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
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_inv_trans_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id),
        CONSTRAINT fk_inv_trans_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
END
GO

-- =============================================================================
-- 19. BẢNG voucher_usages: Giới hạn sử dụng voucher theo Customer (Migration 003)
-- =============================================================================
IF OBJECT_ID('voucher_usages', 'U') IS NULL
BEGIN
    CREATE TABLE voucher_usages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        voucher_id INT NOT NULL CONSTRAINT FK_voucher_usages_voucher REFERENCES vouchers(id),
        user_id INT NOT NULL CONSTRAINT FK_voucher_usages_user REFERENCES users(id),
        order_id INT NOT NULL CONSTRAINT FK_voucher_usages_order REFERENCES orders(id) ON DELETE CASCADE,
        used_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_voucher_user_usage UNIQUE (voucher_id, user_id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_voucher_usages_user_id' AND object_id = OBJECT_ID('voucher_usages'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_voucher_usages_user_id ON voucher_usages(user_id);
END
GO

-- =============================================================================
-- 20. BẢNG wishlist_items: Danh sách yêu thích sản phẩm (Migration 004)
-- =============================================================================
IF OBJECT_ID('wishlist_items', 'U') IS NULL
BEGIN
    CREATE TABLE wishlist_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_wishlist_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_wishlist_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_wishlist_items_user_id' AND object_id = OBJECT_ID('wishlist_items'))
BEGIN
    CREATE NONCLUSTERED INDEX ix_wishlist_items_user_id ON wishlist_items(user_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_wishlist_items_product_id' AND object_id = OBJECT_ID('wishlist_items'))
BEGIN
    CREATE NONCLUSTERED INDEX ix_wishlist_items_product_id ON wishlist_items(product_id);
END
GO

-- =============================================================================
-- 21. BẢNG reviews: Đánh giá sản phẩm VAMOS CLUB (Migration 005)
-- =============================================================================
IF OBJECT_ID('reviews', 'U') IS NULL
BEGIN
    CREATE TABLE reviews (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        rating INT NOT NULL,
        comment NVARCHAR(2000) NULL,
        quick_tags NVARCHAR(500) NULL,
        points_earned INT NOT NULL DEFAULT 100,
        status NVARCHAR(20) NOT NULL DEFAULT 'APPROVED',
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id),
        CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id),
        CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5),
        CONSTRAINT chk_reviews_points CHECK (points_earned >= 100 AND points_earned <= 300),
        CONSTRAINT chk_reviews_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN')),
        CONSTRAINT uq_reviews_order_product UNIQUE (order_id, product_id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_reviews_product_status' AND object_id = OBJECT_ID('reviews'))
BEGIN
    CREATE NONCLUSTERED INDEX ix_reviews_product_status
    ON reviews (product_id, status)
    INCLUDE (rating, created_at, points_earned);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_reviews_user_id' AND object_id = OBJECT_ID('reviews'))
BEGIN
    CREATE NONCLUSTERED INDEX ix_reviews_user_id
    ON reviews (user_id);
END
GO

-- =============================================================================
-- 22. BẢNG review_media: Ảnh minh chứng đánh giá sản phẩm (Migration 005)
-- =============================================================================
IF OBJECT_ID('review_media', 'U') IS NULL
BEGIN
    CREATE TABLE review_media (
        id INT IDENTITY(1,1) PRIMARY KEY,
        review_id INT NOT NULL,
        media_type NVARCHAR(20) NOT NULL DEFAULT 'IMAGE',
        media_url NVARCHAR(500) NOT NULL,
        original_filename NVARCHAR(255) NULL,
        file_size INT NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_review_media_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
        CONSTRAINT chk_review_media_type CHECK (media_type IN ('IMAGE', 'VIDEO')),
        CONSTRAINT chk_review_media_size CHECK (file_size > 0)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_review_media_review_id' AND object_id = OBJECT_ID('review_media'))
BEGIN
    CREATE NONCLUSTERED INDEX ix_review_media_review_id
    ON review_media (review_id);
END
GO

-- =============================================================================
-- 23. BẢNG user_points_wallets: Ví điểm & chu kỳ hạng (Migration 005 + 006)
-- =============================================================================
IF OBJECT_ID('user_points_wallets', 'U') IS NULL
BEGIN
    CREATE TABLE user_points_wallets (
        user_id INT PRIMARY KEY,
        available_points INT NOT NULL DEFAULT 0,
        lifetime_earned_points INT NOT NULL DEFAULT 0,
        lifetime_redeemed_points INT NOT NULL DEFAULT 0,
        tier_code NVARCHAR(20) NOT NULL DEFAULT 'MEMBER',
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        cycle_anchor_at DATETIME2 NULL,
        cycle_number INT NOT NULL CONSTRAINT df_wallets_cycle_number DEFAULT 0,
        cycle_start_at DATETIME2 NULL,
        cycle_end_at DATETIME2 NULL,
        qualifying_points_cycle INT NOT NULL CONSTRAINT df_wallets_qualifying_points DEFAULT 0,
        CONSTRAINT fk_points_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_wallets_available CHECK (available_points >= 0),
        CONSTRAINT chk_wallets_lifetime_earned CHECK (lifetime_earned_points >= 0),
        CONSTRAINT chk_wallets_lifetime_redeemed CHECK (lifetime_redeemed_points >= 0),
        CONSTRAINT chk_wallets_tier CHECK (tier_code IN ('MEMBER', 'SILVER', 'GOLD', 'VIP')),
        CONSTRAINT chk_wallets_cycle_number CHECK (cycle_number >= 0),
        CONSTRAINT chk_wallets_qualifying_points CHECK (qualifying_points_cycle >= 0),
        CONSTRAINT chk_wallets_cycle_consistency CHECK (
            (cycle_number = 0 AND cycle_anchor_at IS NULL AND cycle_start_at IS NULL AND cycle_end_at IS NULL AND qualifying_points_cycle = 0)
            OR
            (cycle_number >= 1 AND cycle_anchor_at IS NOT NULL AND cycle_start_at IS NOT NULL AND cycle_end_at IS NOT NULL AND cycle_end_at > cycle_start_at)
        )
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_wallets_cycle_due' AND object_id = OBJECT_ID('user_points_wallets'))
BEGIN
    CREATE NONCLUSTERED INDEX ix_wallets_cycle_due
    ON user_points_wallets (cycle_end_at ASC)
    INCLUDE (tier_code, cycle_anchor_at, cycle_number, cycle_start_at, qualifying_points_cycle)
    WHERE cycle_end_at IS NOT NULL;
END
GO

-- =============================================================================
-- 24. BẢNG point_transactions: Sổ cái biến động điểm (Migration 005 + 006)
-- =============================================================================
IF OBJECT_ID('point_transactions', 'U') IS NULL
BEGIN
    CREATE TABLE point_transactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        transaction_type NVARCHAR(30) NOT NULL,
        amount INT NOT NULL,
        balance_after INT NOT NULL,
        reference_type NVARCHAR(50) NULL,
        reference_id NVARCHAR(100) NULL,
        description NVARCHAR(500) NOT NULL,
        idempotency_key NVARCHAR(100) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_point_transactions_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT chk_point_tx_type CHECK (
            transaction_type IN (
                'REVIEW_REWARD',
                'ORDER_PURCHASE',
                'VOUCHER_REDEMPTION',
                'REWARD_REVERSAL',
                'ADMIN_ADJUSTMENT',
                'POINT_EXPIRATION'
            )
        ),
        CONSTRAINT chk_point_tx_amount CHECK (amount <> 0),
        CONSTRAINT chk_point_tx_balance CHECK (balance_after >= 0)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_point_tx_idempotency' AND object_id = OBJECT_ID('point_transactions'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX uq_point_tx_idempotency
    ON point_transactions (idempotency_key)
    WHERE idempotency_key IS NOT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_point_tx_user_created' AND object_id = OBJECT_ID('point_transactions'))
BEGIN
    CREATE NONCLUSTERED INDEX ix_point_tx_user_created
    ON point_transactions (user_id, created_at DESC);
END
GO

-- =============================================================================
-- 25. BẢNG point_reward_rules: Danh mục quy đổi điểm thưởng (Migration 005)
-- =============================================================================
IF OBJECT_ID('point_reward_rules', 'U') IS NULL
BEGIN
    CREATE TABLE point_reward_rules (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(200) NOT NULL,
        description NVARCHAR(500) NULL,
        reward_type NVARCHAR(30) NOT NULL DEFAULT 'VOUCHER',
        points_required INT NOT NULL,
        discount_type NVARCHAR(20) NOT NULL DEFAULT 'fixed_amount',
        discount_value DECIMAL(12, 0) NOT NULL DEFAULT 0,
        min_order_amount DECIMAL(12, 0) NOT NULL DEFAULT 0,
        max_discount_amount DECIMAL(12, 0) NULL,
        target_product_id INT NULL,
        voucher_valid_days INT NOT NULL DEFAULT 30,
        stock_quantity INT NOT NULL DEFAULT 0,
        is_active BIT NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_reward_rules_product FOREIGN KEY (target_product_id) REFERENCES products(id),
        CONSTRAINT chk_reward_rules_type CHECK (reward_type IN ('VOUCHER', 'PHYSICAL_GIFT', 'FREE_SHIPPING')),
        CONSTRAINT chk_reward_rules_points CHECK (points_required > 0),
        CONSTRAINT chk_reward_rules_disc_type CHECK (discount_type IN ('fixed_amount', 'percentage', 'free_shipping')),
        CONSTRAINT chk_reward_rules_disc_val CHECK (discount_value >= 0),
        CONSTRAINT chk_reward_rules_min_order CHECK (min_order_amount >= 0),
        CONSTRAINT chk_reward_rules_valid_days CHECK (voucher_valid_days > 0),
        CONSTRAINT chk_reward_rules_stock CHECK (stock_quantity >= 0)
    );
END
GO

-- =============================================================================
-- 26. BẢNG voucher_redemptions: Lượt đổi voucher cá nhân (Migration 005)
-- =============================================================================
IF OBJECT_ID('voucher_redemptions', 'U') IS NULL
BEGIN
    CREATE TABLE voucher_redemptions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        reward_rule_id INT NOT NULL,
        voucher_id INT NOT NULL,
        points_spent INT NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
        redeemed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        used_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_redemptions_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_redemptions_rule FOREIGN KEY (reward_rule_id) REFERENCES point_reward_rules(id),
        CONSTRAINT fk_redemptions_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
        CONSTRAINT chk_redemptions_points CHECK (points_spent > 0),
        CONSTRAINT chk_redemptions_status CHECK (status IN ('AVAILABLE', 'USED', 'EXPIRED', 'REVOKED'))
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_redemptions_voucher' AND object_id = OBJECT_ID('voucher_redemptions'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX uq_redemptions_voucher
    ON voucher_redemptions (voucher_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_redemptions_user_status' AND object_id = OBJECT_ID('voucher_redemptions'))
BEGIN
    CREATE NONCLUSTERED INDEX ix_redemptions_user_status
    ON voucher_redemptions (user_id, status);
END
GO

-- =============================================================================
-- 27. BẢNG loyalty_point_batches: Lô điểm hết hạn 365 ngày & FEFO (Migration 006)
-- =============================================================================
IF OBJECT_ID('loyalty_point_batches', 'U') IS NULL
BEGIN
    CREATE TABLE loyalty_point_batches (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        transaction_id INT NOT NULL,
        initial_points INT NOT NULL,
        remaining_points INT NOT NULL,
        expires_at DATETIME2 NOT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT df_point_batches_status DEFAULT 'ACTIVE',
        created_at DATETIME2 NOT NULL CONSTRAINT df_point_batches_created DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT df_point_batches_updated DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_point_batches_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_point_batches_tx FOREIGN KEY (transaction_id) REFERENCES point_transactions(id),
        CONSTRAINT uq_point_batches_transaction UNIQUE (transaction_id),
        CONSTRAINT chk_point_batches_initial CHECK (initial_points > 0),
        CONSTRAINT chk_point_batches_remaining CHECK (remaining_points >= 0 AND remaining_points <= initial_points),
        CONSTRAINT chk_point_batches_status CHECK (status IN ('ACTIVE', 'EXHAUSTED', 'EXPIRED')),
        CONSTRAINT chk_point_batches_status_remaining CHECK (
            (status = 'ACTIVE' AND remaining_points > 0)
            OR
            (status IN ('EXHAUSTED', 'EXPIRED') AND remaining_points = 0)
        )
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_point_batches_fefo' AND object_id = OBJECT_ID('loyalty_point_batches'))
BEGIN
    CREATE NONCLUSTERED INDEX ix_point_batches_fefo
    ON loyalty_point_batches (user_id, expires_at ASC, id ASC)
    INCLUDE (remaining_points)
    WHERE status = 'ACTIVE';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_point_batches_exp_due' AND object_id = OBJECT_ID('loyalty_point_batches'))
BEGIN
    CREATE NONCLUSTERED INDEX ix_point_batches_exp_due
    ON loyalty_point_batches (expires_at ASC, user_id, id)
    INCLUDE (remaining_points)
    WHERE status = 'ACTIVE';
END
GO

-- =============================================================================
-- 28. SEED DỮ LIỆU CHUẨN (POINT_REWARD_RULES & BASELINE SCHEMA_MIGRATIONS)
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM point_reward_rules)
BEGIN
    INSERT INTO point_reward_rules
    (title, description, reward_type, points_required, discount_type, discount_value, min_order_amount, max_discount_amount, voucher_valid_days, stock_quantity, is_active, sort_order)
    VALUES
    (N'Voucher Giảm 30.000đ', N'Áp dụng cho mọi đơn hàng từ 300.000đ trở lên', 'VOUCHER', 500, 'fixed_amount', 30000, 300000, 30000, 30, 9999, 1, 1),
    (N'Voucher Giảm 70.000đ', N'Áp dụng cho mọi đơn hàng từ 600.000đ trở lên', 'VOUCHER', 1000, 'fixed_amount', 70000, 600000, 70000, 30, 9999, 1, 2),
    (N'Voucher Giảm 150.000đ', N'Áp dụng cho đơn hàng cao cấp từ 1.200.000đ trở lên', 'VOUCHER', 1500, 'fixed_amount', 150000, 1200000, 150000, 30, 9999, 1, 3),
    (N'Voucher Miễn Phí Vận Chuyển', N'Giảm tối đa 40.000đ phí giao hàng toàn quốc', 'FREE_SHIPPING', 300, 'free_shipping', 40000, 200000, 40000, 15, 9999, 1, 4),
    (N'Voucher Giảm 20% Dòng Giày Hunter', N'Ưu đãi đặc biệt giảm 20% giá trị sản phẩm Hunter (Tối đa 200.000đ)', 'VOUCHER', 1200, 'percentage', 20, 500000, 200000, 30, 9999, 1, 5),
    (N'Vớ Kháng Khuẩn Nano Bạc VAMOS', N'Quà tặng vật lý công nghệ dệt ion bạc khử mùi (Sắp mở đổi quà)', 'PHYSICAL_GIFT', 800, 'fixed_amount', 0, 0, 0, 30, 0, 0, 6);
END
GO

-- Ghi nhận baseline snapshot với checksum = NULL (LEGACY_UNVERIFIED) nếu áp dụng trên DB mới từ snapshot,
-- tránh runner chạy lặp lại 001..008 và không tự giả lập hash lịch sử.
;WITH SnapshotVersions AS (
    SELECT '001_initial_schema' AS version, N'Baseline snapshot synced to 001_initial_schema.sql' AS description
    UNION ALL SELECT '002_add_filtered_indexes', N'Baseline snapshot synced to 002_add_filtered_indexes.sql'
    UNION ALL SELECT '003_voucher_customer_usage', N'Baseline snapshot synced to 003_voucher_customer_usage.sql'
    UNION ALL SELECT '004_create_wishlist_items', N'Baseline snapshot synced to 004_create_wishlist_items.sql'
    UNION ALL SELECT '005_vamos_club_loyalty_system', N'Baseline snapshot synced to 005_vamos_club_loyalty_system.sql'
    UNION ALL SELECT '006_vamos_club_expiration_and_tier_cycle', N'Baseline snapshot synced to 006_vamos_club_expiration_and_tier_cycle.sql'
    UNION ALL SELECT '007_vamos_club_true_free_shipping', N'Baseline snapshot synced to 007_vamos_club_true_free_shipping.sql'
    UNION ALL SELECT '008_add_schema_migration_checksum', N'Baseline snapshot synced to 008_add_schema_migration_checksum.sql'
    UNION ALL SELECT '009_standardize_utc_timestamp_defaults', N'Baseline snapshot synced to 009_standardize_utc_timestamp_defaults.sql'
)
INSERT INTO schema_migrations (version, description, checksum)
SELECT sv.version, sv.description, NULL
FROM SnapshotVersions sv
WHERE NOT EXISTS (
    SELECT 1 FROM schema_migrations sm WHERE sm.version = sv.version
);
GO
