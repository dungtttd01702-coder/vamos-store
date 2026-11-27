-- Migration 008: Add SHA-256 Checksum Tracking Column to schema_migrations
-- Engine: Microsoft SQL Server (T-SQL)
-- Non-destructive & Idempotent:
--   1. Adds nullable checksum VARCHAR(64) NULL for SHA-256 hex digest integrity verification
--   2. Preserves NULL for pre-008 historical migrations (LEGACY_UNVERIFIED semantics)
--   3. Enforces 64-character hex length invariant when checksum IS NOT NULL

IF COL_LENGTH('schema_migrations', 'checksum') IS NULL
BEGIN
    ALTER TABLE schema_migrations
    ADD checksum VARCHAR(64) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'chk_schema_migrations_checksum'
      AND parent_object_id = OBJECT_ID('schema_migrations')
)
BEGIN
    ALTER TABLE schema_migrations
    ADD CONSTRAINT chk_schema_migrations_checksum
        CHECK (checksum IS NULL OR LEN(checksum) = 64);
END
GO
