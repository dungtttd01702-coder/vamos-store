# VAMOS CLUB STAGE 2 — SECOND INDEPENDENT READ-ONLY CODE REVIEW

> **Repository:** `dungtttd01702-coder/vamos-store`
> **Branch:** `fix/master-repair-plan`
> **HEAD:** `c0e242435f8d507f2540e6b0ba305ffa1f08e8f5`
> **Đối chiếu từ:** [VAMOS_CLUB_STAGE_2_INDEPENDENT_CODE_REVIEW.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_STAGE_2_INDEPENDENT_CODE_REVIEW.md) & [VAMOS_CLUB_STAGE_2_BLOCKER_HIGH_REMEDIATION_REPORT.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_STAGE_2_BLOCKER_HIGH_REMEDIATION_REPORT.md)
> **Chế độ thực hiện:** **READ-ONLY REVIEW** (không sửa source/test/migration/docs hiện có, không stage/commit/push, không kết nối SQL Server local/production).

---

## A. GIT STATE

- **Branch:** `fix/master-repair-plan`
- **HEAD:** `c0e242435f8d507f2540e6b0ba305ffa1f08e8f5` (0 staged, 0 commits mới, 0 pushes)
- **Tracked modified files (12 files):**
  - `docs/database/DATABASE_OVERVIEW.md`
  - `docs/database/DATA_DICTIONARY.md`
  - `docs/diagrams/erd/PHYSICAL_ERD.puml`
  - `docs/diagrams/erd/vamos_store_erd.puml`
  - `docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md`
  - `docs/loyalty/VAMOS_CLUB_SPEC.md`
  - `docs/loyalty/VAMOS_CLUB_TEST_PLAN.md`
  - `package.json`
  - `src/services/loyalty.service.js`
  - `src/views/pages/account/rewards.pug`
  - `tests/regression_suite.js`
  - `tests/test_loyalty_module.js`
- **Untracked files trước khi tạo báo cáo này (10 files):**
  - `database/migrations/006_vamos_club_expiration_and_tier_cycle.sql`
  - `docs/loyalty/VAMOS_CLUB_CYCLE_EXPIRATION_IMPLEMENTATION_REPORT.md`
  - `docs/loyalty/VAMOS_CLUB_STAGE_2_BLOCKER_HIGH_REMEDIATION_REPORT.md`
  - `docs/loyalty/VAMOS_CLUB_STAGE_2_INDEPENDENT_CODE_REVIEW.md`
  - `src/jobs/backfillLoyaltyHistory.js`
  - `src/jobs/processLoyaltyCycle.js`
  - `src/utils/loyaltyCycle.js`
  - `tests/helpers/loyalty-test-helpers.js`
  - `tests/test_loyalty_cycle_integration.js`
  - `tests/test_loyalty_cycle_unit.js`

---

## B. REMEDIATION VERIFICATION

| Finding cũ | Cách remediation xử lý | Bằng chứng thực tế từ source & diff | Kết luận |
| :--- | :--- | :--- | :---: |
| **BLOCKER-01** (`test_loyalty_cycle_integration.js` fixture `users.is_active`, `VOUCHER_FIXED`, `min_order_value`) | Đổi `createIsolatedUser()` sang `users (full_name, email, password_hash, role, status)` với `'CUSTOMER', 'active'`; đổi `point_reward_rules` sang `reward_type = 'VOUCHER'`, `discount_type = 'fixed_amount'`, `min_order_amount`, `stock_quantity = 999` | [test_loyalty_cycle_integration.js:16-41](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L16-L41) khớp cột & `CHECK` của [001_initial_schema.sql:17-26](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/001_initial_schema.sql#L17-L26) và [005_vamos_club_loyalty_system.sql:140-167](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/005_vamos_club_loyalty_system.sql#L140-L167); teardown xóa theo `trackedUserIds`/`trackedVoucherIds`/`trackedRuleIds` | **PASS (Static)** / **NOT VERIFIED ON DB** |
| **BLOCKER-02** (`INT-01`, `INT-04`, `INT-05`, `INT-06` sai contract & assertion) | Cập nhật `INT-01` (2 cases vi phạm `chk_wallets_cycle_consistency`); `INT-04` dùng `beforeExpireBatch(row)` 1 tham số & kiểm tra `summary.skippedDueToLock === false`; `INT-05` kiểm tra `secondWorker.skippedDueToLock === true` + tách Case A (expired batch bị reject) & Case B (2 concurrent `redeemVoucher`); `INT-06` kiểm tra `reconciledAccounts + failedAccounts`, `ABORTED_PREFLIGHT_FAILED` & DB batch count = `0` | Khớp trực tiếp contract của [processLoyaltyCycle.js:252-261,287-289,321-329](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/processLoyaltyCycle.js#L252-L261) và [backfillLoyaltyHistory.js:116-136,189-200](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js#L116-L136) *(lưu ý test coverage `INT-06` ở mục D)* | **PASS (Static)** / **NOT VERIFIED ON DB** |
| **BLOCKER-03** (`regression_suite.js` teardown thiếu xóa `loyalty_point_batches`) | Thêm `DELETE FROM loyalty_point_batches WHERE user_id IN (@u1, @u2, @tu, @gu)` trước `DELETE FROM point_transactions` & `users` | [regression_suite.js:1093-1099](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/regression_suite.js#L1093-L1099) nằm trong khối cleanup chung cuối suite (`try` bao vòng chạy + `catch`), chỉ xóa 4 user fixture (`@u1, @u2, @tu, @gu`), đứng trước `point_transactions` (`fk_point_batches_tx`) và `users` (`fk_point_batches_user`). *(Xem thêm lưu ý luồng lỗi giữa chừng ở mục C.5)* | **PASS (Static)** / **NOT VERIFIED ON DB** |
| **HIGH-01** (`redeemVoucher()` tiêu thụ batch đã hết hạn 365 ngày) | Lọc `expires_at > @nowTs` trong `SELECT ... WITH (UPDLOCK, ROWLOCK)` và `UPDATE loyalty_point_batches`; cộng `usableUnexpiredPoints` từ các lô đã khóa để kiểm tra đủ điểm còn hạn; truyền `{ now: nowTs }` vào `planFefoDeduction()`; dùng `@nowTs` cho `vouchers`; lọc `expires_at > GETDATE()` ở `getRewardsCenterData()` | [loyalty.service.js:487-543,573-581,690-699](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L487-L543) & [loyaltyCycle.js:249-275](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js#L249-L275). Unit/mocked tests `EXP-05`, `SVC-04..06` PASS | **PASS (Unit/Mock)** / **NOT VERIFIED ON DB** |
| **HIGH-02** (`backfillLoyaltyHistory.js` APPLY đọc snapshot ngoài transaction) | Tách riêng `DRY_RUN` và `APPLY`; trong `APPLY` lấy `acquireSessionAppLock`, mở `sql.Transaction`, khóa `user_points_wallets WITH (UPDLOCK, HOLDLOCK)` trước khi đọc `point_transactions WITH (HOLDLOCK)` và `loyalty_point_batches WITH (HOLDLOCK)`, chạy `reconcileSnapshot()` ngay trong `tx` | [backfillLoyaltyHistory.js:139-269](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js#L139-L269). Mocked tests `BF-06`, `BF-07` PASS *(lưu ý timestamp `nowTs` trước `tx` ở mục D)* | **PASS (Unit/Mock)** / **NOT VERIFIED ON DB** |
| **HIGH-03** (`chk_wallets_cycle_consistency` thiếu `qualifying_points_cycle = 0` khi `cycle_number = 0`) | Bổ sung `AND qualifying_points_cycle = 0` vào nhánh `cycle_number = 0` + logic drop/recreate idempotent khi definition chưa có `qualifying_points_cycle` | [006_vamos_club_expiration_and_tier_cycle.sql:63-86](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql#L63-L86) | **PASS (Static DDL)** / **NOT VERIFIED ON DB** |
| **MEDIUM-01** (`setWalletBalanceFixture()` nâng `tier_code` bằng `ADMIN_ADJUSTMENT`) | Giữ nguyên `tier_code` khi cập nhật ví trong fixture | [test_loyalty_module.js:170-182](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js#L170-L182) | **PASS (Static)** / **NOT VERIFIED ON DB** |
| **MEDIUM-02** (Tài liệu chưa đồng bộ số bảng / rule mới) | Cập nhật `DATA_DICTIONARY.md`, `DATABASE_OVERVIEW.md`, `VAMOS_CLUB_DATA_DICTIONARY.md` (Mục 3 & 4), `VAMOS_CLUB_TEST_PLAN.md` | Còn sót 1 dòng mô tả `chk_wallets_cycle_consistency` ở [VAMOS_CLUB_DATA_DICTIONARY.md:137](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md#L137) chưa cập nhật thêm `AND qualifying_points_cycle = 0` (xem mục D) | **PARTIAL (Static Docs)** |
| **MEDIUM-03** (`awardOrderPurchasePoints(orderId)` standalone thiếu check `COMPLETED`/`PAID`) | Lấy thêm `payment_status` và rollback + throw nếu `order_status !== 'COMPLETED' || payment_status !== 'PAID'` | [loyalty.service.js:371-390](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L371-L390) + test `SVC-07` PASS *(lưu ý nhánh caller truyền `{ orderId, userId, eligibleAmount }` ở mục D)* | **PASS (Unit/Mock)** / **NOT VERIFIED ON DB** |

---

## C. DEEP-DIVE PHÂN TÍCH CHUYÊN SÂU

### C.1. Redemption & Expired Batches ([loyalty.service.js:487-582](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L487-L582))
- **Expiration eligibility:** `redeemVoucher()` tính một mốc `nowTs` duy nhất tại đầu transaction ([L460](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L460)), dùng chung cho `SELECT loyalty_point_batches WITH (UPDLOCK, ROWLOCK)` (`AND expires_at > @nowTs`, `AND status = 'ACTIVE'`, `AND remaining_points > 0`), cho `planFefoDeduction(..., { now: nowTs })` ([L504](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L504)), cho mỗi câu `UPDATE loyalty_point_batches` (`AND expires_at > @nowTs`, kiểm tra `rowsAffected[0] === 1`), và cho `INSERT INTO vouchers` / `voucher_redemptions` / `point_transactions`. Batch có `expires_at <= @nowTs` (worker chưa kịp chạy) hoặc `remaining_points = 0` hoặc `status !== 'ACTIVE'` bị loại tuyệt đối.
- **Tình huống ví `1.000` (gồm `400` hết hạn + `600` còn hạn), đổi `700`:** `usableUnexpiredPoints` cộng từ tập batch đã khóa bằng `600`. Điều kiện `wallet.available_points < 700 || usableUnexpiredPoints < 700` ([L505](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L505)) chặn ngay và ném lỗi `Số dư điểm không đủ (hoặc điểm đã quá hạn 365 ngày). Điểm khả dụng còn hạn hiện có 600 điểm...`, rollback sạch transaction.
- **FEFO & Concurrency:** Luôn sắp `ORDER BY expires_at ASC, id ASC`, trừ hết lô gần hết hạn trước (`newRemaining = 0 -> 'EXHAUSTED'`), khóa `user_points_wallets` (`L484`) trước `loyalty_point_batches` (`L496`) — cùng thứ tự với `processLoyaltyCycle.js`.
- **Phạm vi kiểm chứng:** Hành vi rollback/FEFO/reject đã được chứng minh qua **mocked service tests** (`SVC-03..06` trong `test_loyalty_cycle_unit.js`); concurrency & lock thật trên SQL Server 2022 **chưa chạy**.

### C.2. Wallet / Batch / Ledger Consistency & UI
- Không có đường cộng điểm nào ngoài `_awardPointsWithBatch()` ([loyalty.service.js:198-298](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L198-L298)), và không có đường trừ `available_points` nào ngoài `redeemVoucher()` (có FEFO) và `expireSingleBatch()` (trên batch hết hạn).
- **Lưu ý hiển thị UI (xem Finding `MEDIUM-NEW-01` ở mục D):** Khi có batch đã quá hạn 365 ngày nhưng CLI worker chưa chạy, `getRewardsCenterData()` vẫn trả về `wallet.available_points` tổng (ví dụ `1.000`) trong khi `nextExpiringBatch` lọc `expires_at > GETDATE()` (`600`), khiến người dùng trên `/account/rewards` có thể thấy `1.000` nhưng bị `redeemVoucher()` báo chỉ có `600` điểm còn hạn.

### C.3. Backfill Session Lock, Transaction Lock & Writer Synchronization ([backfillLoyaltyHistory.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js))
1. **Session ownership của `sp_getapplock`:**
   - `acquireSessionAppLock()` ([processLoyaltyCycle.js:20-53](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/processLoyaltyCycle.js#L20-L53)) mở `lockPool` riêng (`max: 1, min: 1`) và chạy `sp_getapplock @LockOwner = 'Session'`. `tx` của backfill chạy trên `pool` từ `getPool()` (kết nối khác). `sp_getapplock` chỉ serialize giữa `backfill APPLY` và `processLoyaltyCycle.js` (hoặc một backfill instance khác), được giải phóng đúng trên `lockPool` trong `finally` ([backfillLoyaltyHistory.js:267](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js#L267)), và nếu acquire thất bại (`L142`) thì không mở transaction và trả `ABORTED_LOCK_UNAVAILABLE`. *(Rủi ro nhỏ đã biết từ vòng 1: `idleTimeoutMillis: 30000` nếu job kéo dài >30s).*
2. **Bảng đồng bộ toàn bộ đường ghi:**

| Luồng ghi | Khóa `user_points_wallets` | Khóa `loyalty_point_batches` / `point_transactions` | Thứ tự khóa | Transaction |
| :--- | :--- | :--- | :--- | :---: |
| `awardOrderPurchasePoints` -> `_awardPointsWithBatch` | `UPDLOCK, ROWLOCK` (hoặc `UPDLOCK, HOLDLOCK` khi khởi tạo mới) | `INSERT` `point_transactions` -> `INSERT` `loyalty_point_batches` | `orders` (nếu từ `order.service`) -> `wallet` -> `tx` -> `batch` | Có (`tx` caller hoặc tự mở) |
| `awardReviewPoints` -> `_awardPointsWithBatch` | `UPDLOCK, ROWLOCK` (hoặc `UPDLOCK, HOLDLOCK` khi khởi tạo mới) | `INSERT` `point_transactions` -> `INSERT` `loyalty_point_batches` | `reviews` -> `wallet` -> `tx` -> `batch` | Có (`review.service`) |
| `redeemVoucher` | `UPDLOCK, ROWLOCK` (hoặc `UPDLOCK, HOLDLOCK` khi khởi tạo mới) | `UPDLOCK, ROWLOCK` trên `loyalty_point_batches` -> `INSERT` `point_transactions` | `point_reward_rules` -> `wallet` -> `batches` -> `vouchers`/`redemptions`/`tx` | Có |
| `processLoyaltyCycle` (`expireSingleBatch` / `processDueWalletCycle`) | `UPDLOCK, ROWLOCK` | `UPDLOCK, ROWLOCK` trên `loyalty_point_batches` -> `INSERT` `point_transactions` | `sp_getapplock` -> `wallet` -> `batch` -> `tx` | Có |
| `backfillLoyaltyHistory` (`APPLY`) | `UPDLOCK, HOLDLOCK` (toàn bảng, `ORDER BY user_id ASC`) | `HOLDLOCK` khi đọc `point_transactions` & `loyalty_point_batches` -> `INSERT` `batches` -> `UPDATE` `wallet` | `sp_getapplock` -> `wallets` -> `tx`/`batches` -> `batches` (`INSERT`) -> `wallets` (`UPDATE`) | Có |
| `setWalletBalanceFixture` (chỉ trong test) | `UPDLOCK, ROWLOCK` (hoặc `HOLDLOCK` khi tạo mới) | `INSERT` `point_transactions` -> `UPDLOCK, ROWLOCK` `batches` | `wallet` -> `tx` -> `batches` | Có |

3. **Đánh giá phantom & TOCTOU:**
   - Trong `APPLY`, không có snapshot nào được đọc trước `tx.begin()`. `SELECT ... FROM user_points_wallets WITH (UPDLOCK, HOLDLOCK)` khóa dải Serializably toàn bộ `user_points_wallets` (chặn cả `INSERT` ví mới từ `getOrCreateWallet` dùng `WITH (UPDLOCK, HOLDLOCK)`). Tất cả đường ghi thông thường trong app/worker đều phải khóa `user_points_wallets` **trước** khi ghi `point_transactions` hoặc `loyalty_point_batches`, nên theo đúng thứ tự khóa `wallet -> tx/batches` sẽ xếp hàng sạch sau `APPLY` mà không deadlock ngược chiều.
   - `nowTs` được lấy bằng `SELECT GETDATE()` ở dòng `85` trước `acquireSessionAppLock` / `tx.begin()` (chỉ ảnh hưởng tối đa vài mili-giây/giây lệch timestamp so với thời điểm trong `tx`, ghi nhận mức `LOW`).

### C.4. Migration 006 Constraints & Idempotency ([006_vamos_club_expiration_and_tier_cycle.sql](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql))
- Kiểm tra đủ `chk_wallets_cycle_number` (`>= 0`), `chk_wallets_qualifying_points` (`>= 0`), `chk_wallets_cycle_consistency`:
  - `cycle_number = 0`: `cycle_anchor_at IS NULL AND cycle_start_at IS NULL AND cycle_end_at IS NULL AND qualifying_points_cycle = 0`.
  - `cycle_number >= 1`: 3 mốc thời gian `NOT NULL` và `cycle_end_at > cycle_start_at`.
- Drop-and-recreate có điều kiện `definition NOT LIKE '%qualifying_points_cycle%'` chạy an toàn cả khi chưa có constraint lẫn khi nâng cấp từ bản 006 nháp trước đó; toàn bộ lệnh `ADD COLUMN` / `CREATE TABLE` / `CREATE INDEX` / `DROP & ADD CONSTRAINT` đều phân tách bằng `GO` khớp `init_mssql.js:144` và không làm mất dữ liệu cũ.

### C.5. Regression Teardown & Integration Test Contract
- Trong [tests/regression_suite.js:1094](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/regression_suite.js#L1094), câu lệnh `DELETE FROM loyalty_point_batches WHERE user_id IN (@u1, @u2, @tu, @gu)` đứng trước `DELETE FROM point_transactions` và `users`, đúng quan hệ FK `005`/`006`.
- Nếu `regression_suite.js` ném lỗi ở giữa `try` (`L1107-1113`), luồng sẽ nhảy thẳng tới `catch (error) { process.exit(1); }` và **bỏ qua** khối cleanup ở `L1076-1101` (nhược điểm cấu trúc cũ có sẵn từ trước Stage 2, không do Stage 2 gây ra).

---

## D. FINDINGS MỚI PHÁT HIỆN TRONG VÒNG REVIEW LẦN 2

> **Không có BLOCKER mới và không có HIGH mới gây mất điểm / sai sổ cái / gãy CI.** Các phát hiện mới đều ở mức `MEDIUM` hoặc `LOW`:

1. **MEDIUM-NEW-01 — Giao diện `/account/rewards` có thể hiển thị số dư tổng bao gồm điểm đã quá hạn trong khi `nextExpiringBatch` và `redeemVoucher()` đã loại trừ điểm quá hạn**
   - **File & dòng:** [src/services/loyalty.service.js:660-699](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L660-L699), [src/views/pages/account/rewards.pug:86-97](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/views/pages/account/rewards.pug#L86-L97)
   - **Mô tả:** Khi có lô điểm `expires_at <= GETDATE()` nhưng worker chưa kịp chạy, `getRewardsCenterData()` trả `wallet.available_points` (vẫn tính cả lô quá hạn) đồng thời trả `nextExpiringBatch` chỉ tính `expires_at > GETDATE()`. Trên UI hiện đủ điểm tổng, nhưng bấm đổi thưởng bị `redeemVoucher()` từ chối vì `usableUnexpiredPoints` thấp hơn.
   - **Kịch bản tái hiện:** Ví `available_points = 1.000` (400 điểm quá hạn chưa quét + 600 điểm còn hạn). UI vẫn hiện `1.000 ĐIỂM KHẢ DỤNG`, khách hàng bấm đổi voucher 700 điểm và bị từ chối.
   - **Tác động:** Sai lệch hiển thị tạm thời trước giờ worker chạy (không mất tiền/điểm và không cho đổi vượt điểm còn hạn).
   - **Khuyến nghị sửa:** Tính thêm `usableAvailablePoints` (hoặc hiển thị cảnh báo số điểm chờ hết hạn) trong `getRewardsCenterData()` / `rewards.pug`.

2. **MEDIUM-NEW-02 — Tài liệu `VAMOS_CLUB_DATA_DICTIONARY.md` dòng 137 chưa cập nhật `AND qualifying_points_cycle = 0` sau khi sửa `HIGH-03`**
   - **File & dòng:** [docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md:137](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md#L137) vs [database/migrations/006_vamos_club_expiration_and_tier_cycle.sql:81](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql#L81)
   - **Mô tả:** Phần mô tả `chk_wallets_cycle_consistency` ở tài liệu vẫn thiếu mệnh đề `AND qualifying_points_cycle = 0`.
   - **Khuyến nghị sửa:** Đồng bộ text constraint trong lần cập nhật tài liệu kế tiếp.

3. **MEDIUM-NEW-03 — `INT-06` chỉ kiểm chứng được nhánh abort (`ABORTED_PREFLIGHT_FAILED`) của `backfillLoyaltyHistory`, chưa kiểm chứng nhánh commit thành công (`APPLIED`) trên SQL Server thật**
   - **File & dòng:** [tests/test_loyalty_cycle_integration.js:348-374](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L348-L374)
   - **Mô tả:** Do `INT-02..INT-05` đã tạo bản ghi trong `loyalty_point_batches` trước đó trên `vamos_store_test_db`, `INT-06` khi chạy `runLoyaltyBackfill({ apply: true, confirmApply: true })` chỉ test nhánh fail-closed abort, chưa có integration test xác minh một CSDL sạch chưa có batch nào có thể backfill sang `status === 'APPLIED'` thành công.
   - **Khuyến nghị sửa:** Có thể thêm một integration test dùng transaction cô lập / hoặc verify bằng script tách biệt trên CI trước khi kết thúc Stage 2 nếu cần.

4. **LOW-NEW-01 — Nhỏ trong comment `INT-05` Case B, `nowTs` trước `tx` ở `backfillLoyaltyHistory.js`, và nhánh `{ orderId, userId, eligibleAmount }` trong `awardOrderPurchasePoints`**
   - **File & dòng:**
     - [tests/test_loyalty_cycle_integration.js:311-320](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L311-L320): comment ghi `700 pts` trong khi `25000 * 0.03 = 750 pts` (assertion `50` ở dòng 342 là đúng theo `750 - 700 = 50`).
     - [src/jobs/backfillLoyaltyHistory.js:85-88](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js#L85-L88): `nowTs` lấy trước `acquireSessionAppLock`/`tx.begin()` (thay vì sau khi giữ khóa).
     - [src/services/loyalty.service.js:371-390](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L371-L390): khi caller truyền sẵn `{ orderId, userId, eligibleAmount }` thay vì chỉ truyền `orderId`, `awardOrderPurchasePoints` tin tưởng caller mà không re-query `orders.order_status/payment_status`. (Caller hiện hữu duy nhất là `order.service.js:573-582` đã kiểm tra `COMPLETED -> PAID`).

---

## E. TEST EVIDENCE

### E.1. Các kiểm tra Zero-DB đã chạy trực tiếp ở vòng Review lần 2
| Lệnh chính xác | Đã chạy | Exit Code | Kết quả thực tế | Phạm vi chứng minh & giới hạn |
| :--- | :---: | :---: | :--- | :--- |
| `node tests/test_loyalty_cycle_unit.js` | Có | `0` | **40 passed, 0 failed** | Chứng minh pure domain logic (20 kịch bản chu kỳ, leap year 29/02, FEFO có cutoff `now`, replay engine) + mocked `sql.Request`/`Transaction`/`ConnectionPool` cho `SVC-01..07`, `WRK-01`, `BF-06..07`. **Không** chứng minh SQL syntax, khóa SQL Server thật hay concurrency thật. |
| `node tests/test_db_guard.js` | Có | `0` | **13/13 passed** | Chứng minh logic fail-closed của `db-guard.js` (0 DB). |
| `node tests/test_validator.js` | Có | `0` | **29 passed, 0 failed** | Chứng minh logic `validator.js` (0 DB). |
| `node tests/validate_pug.js` | Có | `0` | **41/41 Pug templates passed** | Chứng minh biên dịch template Pug hợp lệ (gồm `rewards.pug`). |
| `node --check` trên 8 tệp JS (`loyaltyCycle.js`, `loyalty.service.js`, `backfillLoyaltyHistory.js`, `processLoyaltyCycle.js`, `test_loyalty_cycle_unit.js`, `test_loyalty_cycle_integration.js`, `test_loyalty_module.js`, `regression_suite.js`) | Có | `0` | **0 syntax errors** | Chứng minh cú pháp JS hợp lệ; không chứng minh runtime SQL. |
| `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"` | Có | `0` | `json:OK` | `package.json` hợp lệ. |
| `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml','r',encoding='utf-8')); print('YAML:OK')"` | Có | `0` | `YAML:OK` | `.github/workflows/ci.yml` hợp lệ YAML. |
| `git diff --check` | Có | `0` | **0 lỗi** | Không có trailing whitespace lỗi hoặc conflict marker trên tracked diffs. |

### E.2. Các kiểm tra CHƯA thực hiện tại local (Cần GitHub Actions CI & SQL Server 2022)
- Migration `006_vamos_club_expiration_and_tier_cycle.sql` (chạy lần 1 và chạy lại idempotency trên SQL Server 2022).
- `tests/test_loyalty_module.js` (trên `vamos_store_test_db`).
- `tests/test_loyalty_cycle_integration.js` (trên `vamos_store_test_db` — khóa `UPDLOCK/HOLDLOCK`, `sp_getapplock`, concurrency `redeemVoucher` vs `processLoyaltyCycle`).
- `tests/regression_suite.js` và `npm run test:all` (bao gồm Playwright Chromium).
- `npm run loyalty:process` và `npm run loyalty:backfill:dry` / `--apply`.

---

## F. KẾT LUẬN

**`APPROVED FOR CONTROLLED CI VALIDATION`**

**Giải thích:**
- Toàn bộ **3 BLOCKER** và **3 HIGH** từ vòng review lần 1 đã được sửa đúng hướng về mặt kỹ thuật, nghiệp vụ và locking hierarchy; không phát hiện **BLOCKER** hay **HIGH** mới nào trong source code, migration hoặc test contract.
- Toàn bộ các kiểm tra zero-DB đều pass (`40/40` unit/mocked tests, `13/13` DB guard, `29/29` validator, `41/41` Pug, `0` lỗi syntax/JSON/YAML/whitespace).
- Các phát hiện mới chỉ ở mức `MEDIUM`/`LOW` (`MEDIUM-NEW-01..03`, `LOW-NEW-01`), không làm sai số dư ví, không tiêu thụ điểm hết hạn và không chặn CI.
- **Điều kiện bắt buộc tiếp theo (không được bỏ qua):** Vẫn **CHƯA** khẳng định Stage 2 đã pass end-to-end; mọi hành vi SQL Server 2022 (Migration `006`, `test_loyalty_module.js`, `test_loyalty_cycle_integration.js`, `regression_suite.js`, `npm run test:all` và SonarCloud Quality Gate) **bắt buộc phải được xác minh thực tế trên GitHub Actions CI** sau khi người dùng phê duyệt riêng bước commit/push.
