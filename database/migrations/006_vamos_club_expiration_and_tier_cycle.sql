-- Migration 006: VAMOS CLUB 12-Month Tier Cycle & 365-Day Point Expiration
-- Engine: Microsoft SQL Server (T-SQL)
-- Non-destructive & Idempotent: Preserves Migrations 001-005 and all existing data/balances

-- ====================================================================
-- 1. MỞ RỘNG BẢNG USER_POINTS_WALLETS CHO CHU KỲ XÉT HẠNG 12 THÁNG
-- ====================================================================
IF COL_LENGTH('user_points_wallets', 'cycle_anchor_at') IS NULL
BEGIN
    ALTER TABLE user_points_wallets
    ADD cycle_anchor_at DATETIME2 NULL;
END
GO

IF COL_LENGTH('user_points_wallets', 'cycle_number') IS NULL
BEGIN
    ALTER TABLE user_points_wallets
    ADD cycle_number INT NOT NULL CONSTRAINT df_wallets_cycle_number DEFAULT 0;
END
GO

IF COL_LENGTH('user_points_wallets', 'cycle_start_at') IS NULL
BEGIN
    ALTER TABLE user_points_wallets
    ADD cycle_start_at DATETIME2 NULL;
END
GO

IF COL_LENGTH('user_points_wallets', 'cycle_end_at') IS NULL
BEGIN
    ALTER TABLE user_points_wallets
    ADD cycle_end_at DATETIME2 NULL;
END
GO

IF COL_LENGTH('user_points_wallets', 'qualifying_points_cycle') IS NULL
BEGIN
    ALTER TABLE user_points_wallets
    ADD qualifying_points_cycle INT NOT NULL CONSTRAINT df_wallets_qualifying_points DEFAULT 0;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'chk_wallets_cycle_number' AND parent_object_id = OBJECT_ID('user_points_wallets')
)
BEGIN
    ALTER TABLE user_points_wallets
    ADD CONSTRAINT chk_wallets_cycle_number CHECK (cycle_number >= 0);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'chk_wallets_qualifying_points' AND parent_object_id = OBJECT_ID('user_points_wallets')
)
BEGIN
    ALTER TABLE user_points_wallets
    ADD CONSTRAINT chk_wallets_qualifying_points CHECK (qualifying_points_cycle >= 0);
END
GO

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'chk_wallets_cycle_consistency'
      AND parent_object_id = OBJECT_ID('user_points_wallets')
      AND definition NOT LIKE '%qualifying_points_cycle%'
)
BEGIN
    ALTER TABLE user_points_wallets DROP CONSTRAINT chk_wallets_cycle_consistency;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'chk_wallets_cycle_consistency' AND parent_object_id = OBJECT_ID('user_points_wallets')
)
BEGIN
    ALTER TABLE user_points_wallets
    ADD CONSTRAINT chk_wallets_cycle_consistency CHECK (
        (cycle_number = 0 AND cycle_anchor_at IS NULL AND cycle_start_at IS NULL AND cycle_end_at IS NULL AND qualifying_points_cycle = 0)
        OR
        (cycle_number >= 1 AND cycle_anchor_at IS NOT NULL AND cycle_start_at IS NOT NULL AND cycle_end_at IS NOT NULL AND cycle_end_at > cycle_start_at)
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ix_wallets_cycle_due' AND object_id = OBJECT_ID('user_points_wallets')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_wallets_cycle_due
    ON user_points_wallets (cycle_end_at ASC)
    INCLUDE (tier_code, cycle_anchor_at, cycle_number, cycle_start_at, qualifying_points_cycle)
    WHERE cycle_end_at IS NOT NULL;
END
GO

-- ====================================================================
-- 2. TẠO BẢNG LOYALTY_POINT_BATCHES (LÔ ĐIỂM HẾT HẠN 365 NGÀY & FEFO)
-- ====================================================================
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
        created_at DATETIME2 NOT NULL CONSTRAINT df_point_batches_created DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL CONSTRAINT df_point_batches_updated DEFAULT GETDATE(),
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

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ix_point_batches_fefo' AND object_id = OBJECT_ID('loyalty_point_batches')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_point_batches_fefo
    ON loyalty_point_batches (user_id, expires_at ASC, id ASC)
    INCLUDE (remaining_points)
    WHERE status = 'ACTIVE';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ix_point_batches_exp_due' AND object_id = OBJECT_ID('loyalty_point_batches')
)
BEGIN
    CREATE NONCLUSTERED INDEX ix_point_batches_exp_due
    ON loyalty_point_batches (expires_at ASC, user_id, id)
    INCLUDE (remaining_points)
    WHERE status = 'ACTIVE';
END
GO

-- ====================================================================
-- 3. MỞ RỘNG LOẠI GIAO DỊCH POINT_EXPIRATION TRONG POINT_TRANSACTIONS
-- ====================================================================
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'chk_point_tx_type'
      AND parent_object_id = OBJECT_ID('point_transactions')
      AND definition NOT LIKE '%POINT_EXPIRATION%'
)
BEGIN
    ALTER TABLE point_transactions DROP CONSTRAINT chk_point_tx_type;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'chk_point_tx_type'
      AND parent_object_id = OBJECT_ID('point_transactions')
)
BEGIN
    ALTER TABLE point_transactions
    ADD CONSTRAINT chk_point_tx_type CHECK (
        transaction_type IN (
            'REVIEW_REWARD',
            'ORDER_PURCHASE',
            'VOUCHER_REDEMPTION',
            'REWARD_REVERSAL',
            'ADMIN_ADJUSTMENT',
            'POINT_EXPIRATION'
        )
    );
END
GO
