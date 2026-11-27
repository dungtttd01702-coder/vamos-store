-- Migration 004: Create Wishlist Items Table
-- Enforces: Server-side Wishlist for authenticated Customers
-- Idempotent and non-destructive: Safe to run repeatedly

IF OBJECT_ID('wishlist_items', 'U') IS NULL
BEGIN
    CREATE TABLE wishlist_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_wishlist_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_wishlist_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_wishlist_items_user_id' AND object_id = OBJECT_ID('wishlist_items'))
BEGIN
    CREATE NONCLUSTERED INDEX ix_wishlist_items_user_id ON wishlist_items(user_id);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_wishlist_items_product_id' AND object_id = OBJECT_ID('wishlist_items'))
BEGIN
    CREATE NONCLUSTERED INDEX ix_wishlist_items_product_id ON wishlist_items(product_id);
END;
GO
