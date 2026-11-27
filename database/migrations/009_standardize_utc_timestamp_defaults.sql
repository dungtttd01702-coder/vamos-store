-- Migration 009: Standardize All Default Timestamp Constraints to UTC (SYSUTCDATETIME)
-- Engine: Microsoft SQL Server (T-SQL)
-- Policy (MEDIUM-05 / Decision Q-01):
--   1. All DATETIME2 columns use UTC semantics.
--   2. Replaces every GETDATE() default constraint across all user tables (36 columns)
--      with SYSUTCDATETIME(), preserving explicit constraint names on loyalty_point_batches.
--   3. Idempotent, transactional under init_mssql.js, and verifies zero remaining GETDATE() defaults.

DECLARE @targets TABLE (
    seq INT IDENTITY(1,1) PRIMARY KEY,
    table_name SYSNAME NOT NULL,
    column_name SYSNAME NOT NULL,
    explicit_constraint SYSNAME NULL
);

INSERT INTO @targets (table_name, column_name, explicit_constraint) VALUES
('schema_migrations', 'applied_at', NULL),
('users', 'created_at', NULL),
('users', 'updated_at', NULL),
('addresses', 'created_at', NULL),
('addresses', 'updated_at', NULL),
('password_reset_tokens', 'created_at', NULL),
('categories', 'created_at', NULL),
('brands', 'created_at', NULL),
('products', 'created_at', NULL),
('products', 'updated_at', NULL),
('product_variants', 'created_at', NULL),
('product_variants', 'updated_at', NULL),
('banners', 'created_at', NULL),
('vouchers', 'created_at', NULL),
('voucher_usages', 'used_at', NULL),
('carts', 'created_at', NULL),
('carts', 'updated_at', NULL),
('cart_items', 'created_at', NULL),
('cart_items', 'updated_at', NULL),
('orders', 'created_at', NULL),
('orders', 'updated_at', NULL),
('order_status_histories', 'created_at', NULL),
('inventory_transactions', 'created_at', NULL),
('wishlist_items', 'created_at', NULL),
('reviews', 'created_at', NULL),
('reviews', 'updated_at', NULL),
('review_media', 'created_at', NULL),
('user_points_wallets', 'created_at', NULL),
('user_points_wallets', 'updated_at', NULL),
('point_transactions', 'created_at', NULL),
('point_reward_rules', 'created_at', NULL),
('point_reward_rules', 'updated_at', NULL),
('voucher_redemptions', 'redeemed_at', NULL),
('voucher_redemptions', 'created_at', NULL),
('loyalty_point_batches', 'created_at', 'df_point_batches_created'),
('loyalty_point_batches', 'updated_at', 'df_point_batches_updated');

DECLARE @idx INT = 1;
DECLARE @maxIdx INT = (SELECT MAX(seq) FROM @targets);
DECLARE @tbl SYSNAME;
DECLARE @col SYSNAME;
DECLARE @expName SYSNAME;
DECLARE @curName SYSNAME;
DECLARE @curDef NVARCHAR(MAX);
DECLARE @sql NVARCHAR(MAX);
DECLARE @needsAdd BIT;

WHILE @idx <= @maxIdx
BEGIN
    SELECT @tbl = table_name, @col = column_name, @expName = explicit_constraint
    FROM @targets
    WHERE seq = @idx;

    IF OBJECT_ID(@tbl, 'U') IS NOT NULL
       AND COL_LENGTH(@tbl, @col) IS NOT NULL
    BEGIN
        SET @curName = NULL;
        SET @curDef = NULL;
        SET @needsAdd = 0;

        SELECT @curName = dc.name, @curDef = dc.definition
        FROM sys.default_constraints dc
        WHERE dc.parent_object_id = OBJECT_ID(@tbl)
          AND COL_NAME(dc.parent_object_id, dc.parent_column_id) = @col;

        IF @curName IS NULL
        BEGIN
            SET @needsAdd = 1;
        END
        ELSE IF LOWER(@curDef) NOT LIKE '%sysutcdatetime%'
             OR (@expName IS NOT NULL AND @curName <> @expName)
        BEGIN
            SET @sql = N'ALTER TABLE ' + QUOTENAME(@tbl) + N' DROP CONSTRAINT ' + QUOTENAME(@curName) + N';';
            EXEC sp_executesql @sql;
            SET @needsAdd = 1;
        END

        IF @needsAdd = 1
        BEGIN
            IF @expName IS NOT NULL
                SET @sql = N'ALTER TABLE ' + QUOTENAME(@tbl) + N' ADD CONSTRAINT ' + QUOTENAME(@expName) + N' DEFAULT SYSUTCDATETIME() FOR ' + QUOTENAME(@col) + N';';
            ELSE
                SET @sql = N'ALTER TABLE ' + QUOTENAME(@tbl) + N' ADD DEFAULT SYSUTCDATETIME() FOR ' + QUOTENAME(@col) + N';';
            EXEC sp_executesql @sql;
        END
    END

    SET @idx = @idx + 1;
END

IF EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.tables t ON dc.parent_object_id = t.object_id
    WHERE t.is_ms_shipped = 0
      AND LOWER(dc.definition) LIKE '%getdate%'
)
BEGIN
    THROW 50009, 'Migration 009 failed: legacy GETDATE() default constraints still remain.', 1;
END
GO
