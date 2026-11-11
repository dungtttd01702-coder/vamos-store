-- Migration 003: Voucher One-Use Per Customer Enforcement
-- Enforces: Decision Q8 - Each customer can use a specific voucher at most once across non-cancelled orders

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
ELSE
BEGIN
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_voucher_usages_order')
    BEGIN
        ALTER TABLE voucher_usages DROP CONSTRAINT FK_voucher_usages_order;
        ALTER TABLE voucher_usages ADD CONSTRAINT FK_voucher_usages_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
    END
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_voucher_usages_user_id' AND object_id = OBJECT_ID('voucher_usages'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_voucher_usages_user_id ON voucher_usages(user_id);
END
GO

-- Backfill from existing non-cancelled orders (taking latest order per voucher + user)
;WITH RankedOrders AS (
    SELECT 
        o.voucher_id, 
        o.user_id, 
        o.id AS order_id, 
        o.created_at,
        ROW_NUMBER() OVER(PARTITION BY o.voucher_id, o.user_id ORDER BY o.id DESC) AS rn
    FROM orders o
    WHERE o.voucher_id IS NOT NULL AND o.order_status <> 'CANCELLED'
)
INSERT INTO voucher_usages (voucher_id, user_id, order_id, used_at)
SELECT voucher_id, user_id, order_id, created_at
FROM RankedOrders
WHERE rn = 1
  AND NOT EXISTS (
      SELECT 1 FROM voucher_usages vu WHERE vu.voucher_id = RankedOrders.voucher_id AND vu.user_id = RankedOrders.user_id
  );
GO
