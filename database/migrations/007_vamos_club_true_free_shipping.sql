-- Migration 007: VAMOS CLUB MEDIUM-01 True Free Shipping
-- Engine: Microsoft SQL Server (T-SQL)
-- Non-destructive & Idempotent:
--   1. Extends vouchers.discount_type CHECK constraint to allow 'free_shipping'
--   2. Adds orders.shipping_discount_amount DECIMAL(12, 0) NOT NULL DEFAULT 0
--   3. Preserves all previously issued fixed_amount/percentage vouchers and historical orders untouched
--
-- Rollback guidance (ONLY if no 'free_shipping' vouchers or shipping_discount_amount > 0 rows exist,
-- or after archiving/preserving transaction history — NEVER drop historical financial data in production):
--   1. Back up orders and vouchers tables.
--   2. Inspect: SELECT COUNT(*) FROM vouchers WHERE discount_type = 'free_shipping';
--               SELECT COUNT(*) FROM orders WHERE shipping_discount_amount > 0;
--   3. Drop chk_orders_shipping_discount_cap, chk_orders_shipping_discount_non_negative,
--      df_orders_shipping_discount_amount, and column orders.shipping_discount_amount ONLY if count = 0.
--   4. Only if no 'free_shipping' rows exist in vouchers, replace chk_vouchers_discount_type with
--      CHECK (discount_type IN ('percentage', 'fixed_amount')).

-- ====================================================================
-- 1. MỞ RỘNG CHECK CONSTRAINT CHO VOUCHERS.DISCOUNT_TYPE
-- ====================================================================
IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('vouchers')
      AND name = 'chk_vouchers_discount_type'
      AND definition LIKE '%free_shipping%'
)
BEGIN
    DECLARE @dropVoucherCheckSql NVARCHAR(MAX) = N'';
    SELECT @dropVoucherCheckSql = @dropVoucherCheckSql +
        N'ALTER TABLE vouchers DROP CONSTRAINT [' + REPLACE(cc.name, N']', N']]') + N'];' + CHAR(10)
    FROM sys.check_constraints cc
    WHERE cc.parent_object_id = OBJECT_ID('vouchers')
      AND cc.definition LIKE '%discount_type%';

    IF LEN(@dropVoucherCheckSql) > 0
    BEGIN
        EXEC sp_executesql @dropVoucherCheckSql;
    END

    ALTER TABLE vouchers
    ADD CONSTRAINT chk_vouchers_discount_type
        CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping'));
END
GO

-- ====================================================================
-- 2. BỔ SUNG CỘT ORDERS.SHIPPING_DISCOUNT_AMOUNT (DEFAULT 0 CHO ĐƠN CŨ)
-- ====================================================================
IF COL_LENGTH('orders', 'shipping_discount_amount') IS NULL
BEGIN
    ALTER TABLE orders
    ADD shipping_discount_amount DECIMAL(12, 0) NOT NULL
        CONSTRAINT df_orders_shipping_discount_amount DEFAULT 0;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'chk_orders_shipping_discount_non_negative'
      AND parent_object_id = OBJECT_ID('orders')
)
BEGIN
    ALTER TABLE orders
    ADD CONSTRAINT chk_orders_shipping_discount_non_negative
        CHECK (shipping_discount_amount >= 0);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'chk_orders_shipping_discount_cap'
      AND parent_object_id = OBJECT_ID('orders')
)
BEGIN
    ALTER TABLE orders
    ADD CONSTRAINT chk_orders_shipping_discount_cap
        CHECK (shipping_discount_amount <= shipping_fee);
END
GO
