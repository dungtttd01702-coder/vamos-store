-- Migration 002: Add Filtered Unique Indexes
-- Enforces: Max 1 default address per user, Max 1 primary image per product

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'uq_user_default_address' AND object_id = OBJECT_ID('addresses'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX uq_user_default_address
    ON addresses (user_id)
    WHERE is_default = 1;
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'uq_product_primary_image' AND object_id = OBJECT_ID('product_images'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX uq_product_primary_image
    ON product_images (product_id)
    WHERE is_primary = 1;
END;

