-- Migration 005: VAMOS CLUB Loyalty System (Review-to-Earn & Points-to-Voucher)
-- Engine: Microsoft SQL Server (T-SQL)
-- Non-destructive: IF OBJECT_ID(...) IS NULL

-- ====================================================================
-- 1. BẢNG REVIEWS: Lưu đánh giá sản phẩm của khách hàng đã mua
-- ====================================================================
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
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
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

-- ====================================================================
-- 2. BẢNG REVIEW_MEDIA: Lưu hình ảnh minh chứng đính kèm đánh giá
-- ====================================================================
IF OBJECT_ID('review_media', 'U') IS NULL
BEGIN
    CREATE TABLE review_media (
        id INT IDENTITY(1,1) PRIMARY KEY,
        review_id INT NOT NULL,
        media_type NVARCHAR(20) NOT NULL DEFAULT 'IMAGE',
        media_url NVARCHAR(500) NOT NULL,
        original_filename NVARCHAR(255) NULL,
        file_size INT NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
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

-- ====================================================================
-- 3. BẢNG USER_POINTS_WALLETS: Quản lý số dư và cấp độ thành viên
-- ====================================================================
IF OBJECT_ID('user_points_wallets', 'U') IS NULL
BEGIN
    CREATE TABLE user_points_wallets (
        user_id INT PRIMARY KEY,
        available_points INT NOT NULL DEFAULT 0,
        lifetime_earned_points INT NOT NULL DEFAULT 0,
        lifetime_redeemed_points INT NOT NULL DEFAULT 0,
        tier_code NVARCHAR(20) NOT NULL DEFAULT 'MEMBER',
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_points_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_wallets_available CHECK (available_points >= 0),
        CONSTRAINT chk_wallets_lifetime_earned CHECK (lifetime_earned_points >= 0),
        CONSTRAINT chk_wallets_lifetime_redeemed CHECK (lifetime_redeemed_points >= 0),
        CONSTRAINT chk_wallets_tier CHECK (tier_code IN ('MEMBER', 'SILVER', 'GOLD', 'VIP'))
    );
END
GO

-- ====================================================================
-- 4. BẢNG POINT_TRANSACTIONS: Sổ cái lịch sử thay đổi điểm (Immutable Ledger)
-- ====================================================================
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
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_point_transactions_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT chk_point_tx_type CHECK (transaction_type IN ('REVIEW_REWARD', 'ORDER_PURCHASE', 'VOUCHER_REDEMPTION', 'REWARD_REVERSAL', 'ADMIN_ADJUSTMENT')),
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

-- ====================================================================
-- 5. BẢNG POINT_REWARD_RULES: Danh mục cấu hình đổi thưởng
-- ====================================================================
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
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
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

-- ====================================================================
-- 6. BẢNG VOUCHER_REDEMPTIONS: Quản lý voucher cá nhân từ đổi điểm
-- ====================================================================
IF OBJECT_ID('voucher_redemptions', 'U') IS NULL
BEGIN
    CREATE TABLE voucher_redemptions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        reward_rule_id INT NOT NULL,
        voucher_id INT NOT NULL,
        points_spent INT NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
        redeemed_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        used_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
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

-- ====================================================================
-- 7. SEED DỮ LIỆU BAN ĐẦU CHO POINT_REWARD_RULES
-- ====================================================================
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
