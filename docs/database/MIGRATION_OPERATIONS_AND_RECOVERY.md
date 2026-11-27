# VAMOS STORE — HƯỚNG DẪN VẬN HÀNH & PHỤC HỒI DATABASE MIGRATION (001–008)

Tài liệu này chuẩn hóa quy trình vận hành, xác minh và phục hồi cho chuỗi migration SQL Server `001`–`008` thực thi qua [database/init_mssql.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/database/init_mssql.js), cùng bản chụp đồng bộ 28 bảng tại [database/mssql_schema.sql](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/database/mssql_schema.sql).

---

## 1. BẢNG ĐẶC TẢ TỪNG MIGRATION (001–008)

| Version | Mục đích | Phụ thuộc | Transaction Behavior | Chạy lại (Idempotent) | Khả năng Rollback |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `001_initial_schema` | Khởi tạo 19 bảng lõi (`schema_migrations` + 18 bảng e-commerce) | Không | 1 `sql.Transaction` + `XACT_ABORT ON` | Có (`IF OBJECT_ID IS NULL`) | Chỉ qua restore backup nếu đã có dữ liệu |
| `002_add_filtered_indexes` | Tạo `uq_user_default_address`, `uq_product_primary_image` | `001` | 1 `sql.Transaction` + `XACT_ABORT ON` | Có (`IF NOT EXISTS sys.indexes`) | Có thể `DROP INDEX` thủ công nếu không cần |
| `003_voucher_customer_usage` | Tạo `voucher_usages` + backfill từ đơn cũ không `CANCELLED` | `001` | 1 `sql.Transaction` + `XACT_ABORT ON` | Có (`IF OBJECT_ID`, `WHERE NOT EXISTS`) | Có thể export/xóa bảng nếu chưa dùng Q8 |
| `004_create_wishlist_items` | Tạo bảng `wishlist_items` & 2 indexes | `001` | 1 `sql.Transaction` + `XACT_ABORT ON` | Có (`IF OBJECT_ID`, `IF NOT EXISTS`) | Chỉ xóa nếu chấp nhận mất wishlist người dùng |
| `005_vamos_club_loyalty_system` | Tạo 6 bảng VAMOS CLUB + 6 seed `point_reward_rules` | `001` | 1 `sql.Transaction` + `XACT_ABORT ON` | Có (`IF OBJECT_ID`, `IF NOT EXISTS`) | **KHÔNG xóa** khi đã có giao dịch điểm/ví/đánh giá |
| `006_vamos_club_expiration_and_tier_cycle` | Thêm 5 cột chu kỳ trên `user_points_wallets`, bảng `loyalty_point_batches`, mở rộng `chk_point_tx_type` | `005`, `001` | 1 `sql.Transaction` + `XACT_ABORT ON` | Có (`COL_LENGTH`, `definition NOT LIKE`) | **KHÔNG xóa** khi đã sinh batch FEFO/`POINT_EXPIRATION` |
| `007_vamos_club_true_free_shipping` | Mở rộng `vouchers.discount_type` (`free_shipping`), thêm `orders.shipping_discount_amount` | `001` | 1 `sql.Transaction` + `XACT_ABORT ON` | Có (`COL_LENGTH`, `definition NOT LIKE`) | Chỉ hạ cấp nếu **0** voucher `free_shipping` và **0** đơn `shipping_discount_amount > 0` |
| `008_add_schema_migration_checksum` | Thêm `schema_migrations.checksum VARCHAR(64) NULL` + `chk_schema_migrations_checksum` | `001` | 1 `sql.Transaction` + `XACT_ABORT ON` | Có (`COL_LENGTH`, `IF NOT EXISTS`) | Có thể `DROP CONSTRAINT` + `DROP COLUMN checksum` nếu quay về runner cũ |

---

## 2. PHÂN BIỆT 4 CƠ CHẾ PHỤC HỒI SỰ CỐ

1. **SQL Rollback tự động (Trong quá trình chạy migration):**
   - Mỗi file migration chạy toàn bộ các batch `GO` và `INSERT INTO schema_migrations` trong **cùng 1 `sql.Transaction`** với `SET XACT_ABORT ON` và session lock `sp_getapplock`.
   - Nếu lỗi ở bất kỳ batch nào hoặc bước ghi `schema_migrations`, SQL Server tự rollback trọn vẹn migration hiện tại; các migration đã commit trước đó vẫn giữ nguyên. Runner ném lỗi để chặn deploy chạy tiếp.
2. **Manual Recovery (Khi sự cố xảy ra sau khi migration đã commit một phần ở công cụ ngoài):**
   - Dùng SSMS/sqlcmd kiểm tra `SELECT * FROM schema_migrations ORDER BY id` và đối chiếu `sys.tables` / `COL_LENGTH`.
   - Tuyệt đối không xóa dữ liệu lịch sử (`users`, `orders`, `order_items`, `point_transactions`, `user_points_wallets`, `loyalty_point_batches`, `voucher_redemptions`).
   - Nếu lỗi do `MIGRATION CHECKSUM MISMATCH`: so sánh diff giữa file `.sql` hiện tại và commit đã deploy trước đó; **không sửa tay `schema_migrations.checksum` để che giấu sai khác**. Tạo migration mới tăng số thứ tự (`009_...`) để sửa đổi bổ sung.
   - Nếu lỗi do thiếu file trên đĩa (`MIGRATION FILE MISSING`): khôi phục đúng file đã deploy vào `database/migrations/` rồi chạy lại.
3. **Rollback Application Deployment:**
   - Vì các migration `001`–`008` được thiết kế mở rộng phi phá hủy (additive/DEFAULT 0/NULL backward-compatible), rollback mã nguồn ứng dụng về phiên bản liền trước vẫn vận hành an toàn mà không cần drop cột/bảng vừa thêm — ngoại trừ khi ứng dụng cũ chưa biết xử lý dữ liệu mới (`discount_type = 'free_shipping'`).
4. **Restore Database Backup (Sự cố dữ liệu / Schema nghiêm trọng):**
   - Bắt buộc sao lưu full backup production trước khi chạy `ALLOW_PRODUCTION_INIT=true NODE_ENV=production node database/init_mssql.js`. Nếu phải hạ cấp cấu trúc đã phát sinh dữ liệu tài chính/loyalty, sử dụng point-in-time restore từ backup.

---

## 3. LỆNH XÁC MINH SCHEMA SAU MIGRATION

1. Kiểm tra số bảng và tracking:
   ```sql
   SELECT COUNT(*) AS total_tables FROM sys.tables WHERE is_ms_shipped = 0; -- Kỳ vọng: 28
   SELECT id, version, applied_at, checksum FROM schema_migrations ORDER BY id;
   ```
   - Với DB nâng cấp từ phiên bản cũ: các bản ghi `001`–`007` giữ `checksum IS NULL` (`LEGACY_UNVERIFIED`), từ `008` trở đi có chuỗi SHA-256 64 ký tự hex.
   - Với DB cài mới hoàn toàn: toàn bộ `001`–`008` có SHA-256 64 ký tự.
2. Kiểm tra đối chiếu Parity & Guard tự động trên môi trường test:
   ```bash
   npm run test:guard
   npm run test:migrations:unit
   npm run test:migrations:parity
   ```
