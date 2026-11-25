# VAMOS CLUB STAGE 2 — INDEPENDENT READ-ONLY CODE REVIEW REPORT

> **Repository:** `dungtttd01702-coder/vamos-store`
> **Branch:** `fix/master-repair-plan`
> **Base HEAD:** `c0e242435f8d507f2540e6b0ba305ffa1f08e8f5`
> **Loại kiểm toán:** Independent Read-Only Code Review (trước khi xem xét commit/push)
> **Trạng thái thao tác:** Chỉ đọc mã nguồn/diff/tài liệu và chạy kiểm tra thuần tĩnh / zero-DB; không chỉnh sửa bất kỳ tệp nguồn/test/migration nào ngoài báo cáo này; không stage/commit/push; không kết nối SQL Server local hoặc production.

---

## 1. GIT STATE VÀ DANH SÁCH FILE

- **Branch hiện tại:** `fix/master-repair-plan`
- **HEAD commit:** `c0e242435f8d507f2540e6b0ba305ffa1f08e8f5` (khớp Base HEAD dự kiến)
- **Modified tracked files (11 files):**
  1. [package.json](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/package.json)
  2. [src/services/loyalty.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js)
  3. [src/views/pages/account/rewards.pug](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/views/pages/account/rewards.pug)
  4. [tests/test_loyalty_module.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js)
  5. [docs/loyalty/VAMOS_CLUB_SPEC.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_SPEC.md)
  6. [docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md)
  7. [docs/loyalty/VAMOS_CLUB_TEST_PLAN.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_TEST_PLAN.md)
  8. [docs/database/DATA_DICTIONARY.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATA_DICTIONARY.md)
  9. [docs/database/DATABASE_OVERVIEW.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATABASE_OVERVIEW.md)
  10. [docs/diagrams/erd/PHYSICAL_ERD.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/erd/PHYSICAL_ERD.puml)
  11. [docs/diagrams/erd/vamos_store_erd.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/erd/vamos_store_erd.puml)
- **Untracked files trước khi tạo báo cáo (8 files):**
  1. [database/migrations/006_vamos_club_expiration_and_tier_cycle.sql](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql)
  2. [src/utils/loyaltyCycle.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js)
  3. [src/jobs/processLoyaltyCycle.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/processLoyaltyCycle.js)
  4. [src/jobs/backfillLoyaltyHistory.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js)
  5. [tests/helpers/loyalty-test-helpers.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/helpers/loyalty-test-helpers.js)
  6. [tests/test_loyalty_cycle_unit.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_unit.js)
  7. [tests/test_loyalty_cycle_integration.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js)
  8. [docs/loyalty/VAMOS_CLUB_CYCLE_EXPIRATION_IMPLEMENTATION_REPORT.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_CYCLE_EXPIRATION_IMPLEMENTATION_REPORT.md)

---

## 2. PHẠM VI REVIEW

Đã đọc và đối soát trực tiếp toàn bộ tệp thuộc phạm vi kiểm toán:
- **Database & Bootstrap:** [001_initial_schema.sql](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/001_initial_schema.sql), [005_vamos_club_loyalty_system.sql](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/005_vamos_club_loyalty_system.sql), [006_vamos_club_expiration_and_tier_cycle.sql](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql), [init_mssql.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/init_mssql.js), [setup_test_db.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/setup_test_db.js), [database.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/config/database.js).
- **Business Logic & CLI:** [loyaltyCycle.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js), [loyalty.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js), [loyalty.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/loyalty.controller.js), [review.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/review.service.js), [order.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/order.service.js), [processLoyaltyCycle.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/processLoyaltyCycle.js), [backfillLoyaltyHistory.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js).
- **UI & Config:** [rewards.pug](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/views/pages/account/rewards.pug), [package.json](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/package.json), [ci.yml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/.github/workflows/ci.yml).
- **Tests:** [loyalty-test-helpers.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/helpers/loyalty-test-helpers.js), [test_loyalty_cycle_unit.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_unit.js), [test_loyalty_cycle_integration.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js), [test_loyalty_module.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js), [regression_suite.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/regression_suite.js) (vùng order & teardown).
- **Docs & ERD:** [VAMOS_CLUB_CYCLE_EXPIRATION_IMPLEMENTATION_REPORT.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_CYCLE_EXPIRATION_IMPLEMENTATION_REPORT.md), [VAMOS_CLUB_SPEC.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_SPEC.md), [VAMOS_CLUB_DATA_DICTIONARY.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md), [VAMOS_CLUB_TEST_PLAN.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_TEST_PLAN.md), [VAMOS_CLUB_POLICY_IMPACT_AUDIT.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_POLICY_IMPACT_AUDIT.md), [DATA_DICTIONARY.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATA_DICTIONARY.md), [DATABASE_OVERVIEW.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATABASE_OVERVIEW.md), [PHYSICAL_ERD.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/erd/PHYSICAL_ERD.puml), [vamos_store_erd.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/erd/vamos_store_erd.puml).

---

## 3. KẾT QUẢ TỪNG NHÓM KIỂM TOÁN

| Nhóm kiểm toán | Đánh giá | Tóm tắt bằng chứng |
| :--- | :---: | :--- |
| **1. Atomicity Ví / Sổ cái / Lô điểm & Idempotency** | **PASS** (trên luồng ghi chính) | `review.service.js`, `order.service.js`, `_awardPointsWithBatch()` dùng chung SQL transaction + `UPDLOCK, ROWLOCK` trên wallet + `OUTPUT INSERTED.id` + `uq_reviews_order_product` + `uq_point_tx_idempotency`. |
| **2. FEFO & Concurrency (Redemption + Expiration Worker)** | **HIGH** | Lock hierarchy thống nhất (`wallet -> batch`), worker có idempotency `EXP_BATCH_{id}` và kiểm tra lại sau lock. **Tuy nhiên**, `redeemVoucher()` không lọc `expires_at > @nowTs`, cho phép tiêu điểm của batch đã quá hạn 365 ngày trước khi worker kịp chạy. |
| **3. `sp_getapplock` Session Lock** | **PASS (kèm lưu ý LOW)** | `acquireSessionAppLock` dùng riêng `new sql.ConnectionPool({ pool: { max: 1, min: 1 } })` nên `sp_getapplock` và `sp_releaseapplock` chạy trên cùng 1 TDS session tách biệt khỏi `getPool()` của app, luôn đóng trong `finally`. |
| **4. Chu kỳ 12 tháng, Năm nhuận 29/02 & Soft Landing** | **PASS** | `cycle_anchor_at` bất biến, tính từ `addYearsFromAnchor(anchor, cycleNumber - 1 / N)`, ranh giới `<= cycle_end_at` vs `>`, chỉ `REVIEW_REWARD`/`ORDER_PURCHASE` dương kích hoạt. Missed cycles reset `activeQualifying = 0` mỗi vòng (không dùng lại điểm chu kỳ cũ), nhưng phụ thuộc bất biến mọi earn đều đi qua service theo thời gian `GETDATE()`. |
| **5. Mua hàng 3% & Review** | **PASS (1 lưu ý nhỏ)** | `order.service.js` chỉ gọi khi `COMPLETED -> PAID`, công thức `FLOOR((subtotal - discount_amount) * 0.03)` không tính ship; hủy đơn hoàn `voucher_redemptions` về `AVAILABLE`; review lỗi dọn temp files. (Lưu ý nhỏ: gọi trực tiếp `awardOrderPurchasePoints(orderId)` không có guard check `order_status = COMPLETED` bên trong). |
| **6. Migration 006 & Runner** | **HIGH** | Idempotent đúng chuẩn `init_mssql.js`, bảo toàn `001`–`005` và dữ liệu cũ, `chk_point_tx_type` an toàn khi chạy lại. **Tuy nhiên**, `chk_wallets_cycle_consistency` thiếu ràng buộc `qualifying_points_cycle = 0` khi `cycle_number = 0`. |
| **7. Backfill Tool** | **HIGH** | `DRY_RUN` strictly read-only, không hardcode user ID, không bịa batch giả, chặn trước khi ghi nếu có bất kỳ anomaly nào. **Tuy nhiên**, `APPLY` mode thiếu transaction lock / `sp_getapplock` bao trùm từ lúc đọc đến lúc ghi (TOCTOU). |
| **8. Tests & CI (`test:all`)** | **BLOCKER** | `test_loyalty_cycle_unit.js` chạy 0-DB đạt 33/33 PASS. **Nhưng `test_loyalty_cycle_integration.js` có 6 lỗi chắc chắn crash/fail ngay trên CI**, và `tests/regression_suite.js` teardown chưa xóa `loyalty_point_batches` trước `point_transactions`/`users`. |
| **9. UI (`rewards.pug`)** | **LOW** | Hiển thị thông tin chu kỳ, lô sắp hết hạn và nhãn `POINT_EXPIRATION`; khi worker chưa kịp chạy sau hạn chót có thể hiện chu kỳ/lô cũ chưa cập nhật. |
| **10. Tài liệu & ERD** | **MEDIUM** | Migration 006 & ERD chính xác ở tầng bảng/cột mới, nhưng một số mục tổng quan cũ (`21 bảng`, `trọn đời`, 5 loại giao dịch cũ) chưa đồng bộ hết. |

---

## 4. DANH SÁCH PHÁT HIỆN (BLOCKER / HIGH / MEDIUM / LOW)

### BLOCKER-01: `test_loyalty_cycle_integration.js` dùng sai tên cột `users` và sai enum `point_reward_rules`, chắc chắn lỗi SQL khi khởi tạo fixture trên CI
- **File & dòng:** [tests/test_loyalty_cycle_integration.js:18-22](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L18-L22), [tests/test_loyalty_cycle_integration.js:35-40](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L35-L40)
- **Mô tả lỗi:**
  1. `createIsolatedUser()` chèn `INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES (..., 'customer', 1)`. Bảng `users` ([001_initial_schema.sql:17-27](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/001_initial_schema.sql#L17-L27)) **không có cột `is_active`** (chỉ có `status NVARCHAR(20)` với giá trị `'active'/'locked'`), và `role` quy chuẩn `'CUSTOMER'`.
  2. Setup chèn `point_reward_rules` với `reward_type = 'VOUCHER_FIXED'`. Ràng buộc `chk_reward_rules_type` ([005_vamos_club_loyalty_system.sql:159](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/005_vamos_club_loyalty_system.sql#L159)) chỉ cho phép `('VOUCHER', 'PHYSICAL_GIFT', 'FREE_SHIPPING')`.
- **Scenario tái hiện:** Chạy `npm run test:loyalty:cycle` hoặc `npm run test:all` trên CI SQL Server 2022 -> lỗi `CHECK constraint "chk_reward_rules_type"` ngay dòng 35, sau đó `createIsolatedUser` lỗi `Invalid column name 'is_active'` và chuỗi cleanup dùng `users`.
- **Tác động:** CI GitHub Actions (`npm run test:all`) fail 100%, không thể chạy bất kỳ integration test Stage 2 nào.
- **Hướng sửa đề xuất:** Đổi `createIsolatedUser()` sang `(full_name, email, password_hash, role, status)` với `('CUSTOMER', 'active')`; đổi `reward_type` trong fixture thành `'VOUCHER'`, `discount_type = 'fixed_amount'`.

---

### BLOCKER-02: `test_loyalty_cycle_integration.js` sai lệch contract & assertion ở 4 test cases (`INT-01`, `INT-04`, `INT-05`, `INT-06`), chắc chắn FAIL trên CI
- **File & dòng:** [tests/test_loyalty_cycle_integration.js:65-72](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L65-L72), [L223-238](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L223-L238), [L260-261](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L260-L261), [L301-314](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L301-L314)
- **Mô tả lỗi:**
  1. `INT-01` (`L65-72`): Chạy `UPDATE user_points_wallets SET cycle_number = 0, qualifying_points_cycle = 10` và mong đợi `chk_wallets_cycle_consistency` từ chối. Thực tế `006:69-73` không kiểm tra `qualifying_points_cycle = 0` khi `cycle_number = 0`, nên câu lệnh SQL thành công và `assert.rejects` FAIL.
  2. `INT-04` (`L223-228`): Hook `beforeExpireBatch: (batchId, idx) => { if (!failedOnce && idx === 1) throw ... }` mong 2 tham số, trong khi [processLoyaltyCycle.js:288](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/processLoyaltyCycle.js#L288) chỉ gọi `beforeExpireBatch(row)` (1 tham số) nên `idx` luôn là `undefined`, không bao giờ throw -> `assert.rejects` FAIL.
  3. `INT-04` (`L238`) & `INT-05` (`L261`): Kiểm tra `summary.locked === true` và `secondWorker.locked === false`, trong khi [processLoyaltyCycle.js:253,322](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/processLoyaltyCycle.js#L253) trả về `skippedDueToLock` (không có trường `.locked`).
  4. `INT-06` (`L303`, `L311-314`): Kiểm tra `dry.totalWallets >= 1` (`backfillLoyaltyHistory.js:115-123` trả về `reconciledAccounts`/`failedAccounts`, không có `totalWallets`), và dùng `assert.rejects(..., /BACKFILL ABORTED/)` trong khi [backfillLoyaltyHistory.js:102-112](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js#L102-L112) trả về object `{ status: 'ABORTED_PREFLIGHT_FAILED', applied: false }` thay vì throw Error.
- **Tác động:** Mọi CI run đều thất bại tại `test_loyalty_cycle_integration.js`.
- **Hướng sửa đề xuất:** Sửa `006` (xem HIGH-03) và sửa các assertion/hook của `test_loyalty_cycle_integration.js` khớp đúng return contract của `processLoyaltyCycle.js` và `backfillLoyaltyHistory.js`.

---

### BLOCKER-03: `tests/regression_suite.js` teardown xóa `point_transactions` & `users` nhưng KHÔNG xóa `loyalty_point_batches` trước, gây lỗi FK trên `vamos_store_test_db`
- **File & dòng:** [tests/regression_suite.js:445-451](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/regression_suite.js#L445-L451), [tests/regression_suite.js:1094-1101](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/regression_suite.js#L1094-L1101)
- **Mô tả lỗi:** Trong `regression_suite.js`, `ADMIN-06` chuyển đơn của `testUserId` sang `COMPLETED` (`L445`), kích hoạt `loyaltyService.awardOrderPurchasePoints()`, tạo bản ghi trong `point_transactions` và `loyalty_point_batches` (FK `fk_point_batches_tx` và `fk_point_batches_user` đều là `ON DELETE NO ACTION`). Ở cuối file (`L1094-1098`), teardown chỉ xóa `point_transactions`, `reviews`, `voucher_redemptions`, `user_points_wallets`, `users` mà **thiếu `DELETE FROM loyalty_point_batches WHERE user_id IN (...)`**, rồi nuốt lỗi trong `catch (cleanupErr) { console.warn(...) }`.
- **Scenario tái hiện:** Chạy `npm run test:all` với Migration `006` đã áp dụng -> teardown `regression_suite.js` vướng lỗi FK `fk_point_batches_tx` / `fk_point_batches_user`, bỏ sót dữ liệu test rác trong `vamos_store_test_db`.
- **Tác động:** Rò rỉ dữ liệu test trong DB kiểm thử, làm sai lệch số lượng ví/batch nếu có bước chạy worker hoặc backfill sau regression suite.
- **Hướng sửa đề xuất:** Thêm `await query("DELETE FROM loyalty_point_batches WHERE user_id IN (@u1, @u2, @tu, @gu)", ...)` ngay trước dòng `1094` trong `tests/regression_suite.js`.

---

### HIGH-01: `redeemVoucher()` không kiểm tra `expires_at > @nowTs`, cho phép đổi voucher bằng điểm đã hết hạn 365 ngày trước khi worker chạy
- **File & dòng:** [src/services/loyalty.service.js:495-505](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L495-L505), [src/utils/loyaltyCycle.js:249-260](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js#L249-L260)
- **Mô tả lỗi:** Khi `redeemVoucher()` truy vấn và khóa lô điểm bằng `WITH (UPDLOCK, ROWLOCK)`:
  ```sql
  WHERE user_id = @userId AND status = 'ACTIVE' AND remaining_points > 0
  ORDER BY expires_at ASC, id ASC
  ```
  truy vấn không lọc `AND expires_at > @nowTs`, và `planFefoDeduction(batches, pointsRequired)` cũng không loại trừ các lô có `expires_at <= nowTs`.
- **Scenario tái hiện:** Khách hàng có lô điểm 500 điểm hết hạn lúc `00:00:00Z`. Lúc `00:10:00Z` cùng ngày (khi cron worker `npm run loyalty:process` chưa chạy), batch vẫn có `status = 'ACTIVE'` và `available_points = 500`. Khách hàng bấm đổi voucher 500 điểm -> `redeemVoucher()` tiêu thụ lô đã hết hạn để cấp voucher. Hoặc nếu có 1 lô quá hạn và 1 lô còn hạn, FEFO ưu tiên trừ lô quá hạn trước. (Lưu ý thêm: kịch bản `INT-05` trong [test_loyalty_cycle_integration.js:275-287](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L275-L287) cũng cần cập nhật nếu sửa lỗi này vì `INT-05` đang gọi `redeemVoucher` tại thời điểm sau `expires_at`).
- **Tác động:** Khách hàng dùng điểm đã hết hạn sau 365 ngày để đổi voucher giảm giá, làm sai lệch ý nghĩa chính sách hết hạn 365 ngày.
- **Hướng sửa đề xuất:** Trong `redeemVoucher()`, thêm điều kiện SQL `AND expires_at > @nowTs` (và tùy chọn truyền `nowTs` vào `planFefoDeduction()` để phòng vệ hai lớp), đồng thời cập nhật kiểm tra ở [loyalty.service.js:679](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L679) để `nextExpiringBatch` không hiển thị batch đã quá hạn trước khi worker dọn.

---

### HIGH-02: `backfillLoyaltyHistory.js` chế độ `APPLY` thiếu khóa đồng bộ (TOCTOU) giữa pha đọc và pha ghi
- **File & dòng:** [src/jobs/backfillLoyaltyHistory.js:23-60](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js#L23-L60), [L127-177](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js#L127-L177)
- **Mô tả lỗi:** Ở chế độ `APPLY`, toàn bộ bảng `user_points_wallets`, `point_transactions` và `loyalty_point_batches` được đọc rời ngoài transaction (`L30-47`), sau đó mới mở `new sql.Transaction(pool)` (`L128`) để `INSERT` batches và `UPDATE` chu kỳ ví, mà không giữ `sp_getapplock` hay khóa giao dịch bao trùm.
- **Scenario tái hiện:** Nếu có giao dịch tích điểm/đổi điểm hoặc worker chạy xen giữa bước đọc (`L30`) và bước ghi (`L164`), `backfillLoyaltyHistory` sẽ ghi đè `cycle_anchor_at`/`qualifying_points_cycle` theo snapshot cũ hoặc xung đột `uq_point_batches_transaction`.
- **Tác động:** Rủi ro race condition nếu quên dừng traffic/worker khi chạy `--apply`.
- **Hướng sửa đề xuất:** Yêu cầu `acquireSessionAppLock` trước khi đọc trong mode `APPLY`, đồng thời đưa cả pha kiểm tra lại count hoặc chạy dưới `SERIALIZABLE` / kiểm tra `@@ROWCOUNT` trước khi commit; khuyến cáo rõ trong runbook chỉ chạy `APPLY` trong maintenance window.

---

### HIGH-03: Ràng buộc `chk_wallets_cycle_consistency` trong Migration `006` cho phép `cycle_number = 0` nhưng `qualifying_points_cycle > 0`
- **File & dòng:** [database/migrations/006_vamos_club_expiration_and_tier_cycle.sql:68-73](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql#L68-L73)
- **Mô tả lỗi:** Ràng buộc hiện tại:
  ```sql
  (cycle_number = 0 AND cycle_anchor_at IS NULL AND cycle_start_at IS NULL AND cycle_end_at IS NULL)
  OR
  (cycle_number >= 1 AND cycle_anchor_at IS NOT NULL AND cycle_start_at IS NOT NULL AND cycle_end_at IS NOT NULL AND cycle_end_at > cycle_start_at)
  ```
  không ràng buộc `AND qualifying_points_cycle = 0` ở nhánh `cycle_number = 0`.
- **Scenario tái hiện:** Thao tác cập nhật sai làm `cycle_number = 0` nhưng `qualifying_points_cycle = 500` vẫn lọt qua tầng SQL Server (chính `INT-01` của Stage 2 đã kỳ vọng DB phải chặn trạng thái này).
- **Tác động:** Giảm độ chặt bất biến dữ liệu chu kỳ ở tầng SQL Server.
- **Hướng sửa đề xuất:** Bổ sung `AND qualifying_points_cycle = 0` vào nhánh `cycle_number = 0` (và thả/tạo lại constraint theo đúng pattern idempotent `definition NOT LIKE '%qualifying_points_cycle%'` nếu đã từng chạy).

---

### MEDIUM-01: `test_loyalty_module.js` fixture `setWalletBalanceFixture()` nâng `tier_code` theo `ADMIN_ADJUSTMENT` không kích hoạt chu kỳ, làm lệch mô hình Stage 2
- **File & dòng:** [tests/test_loyalty_module.js:171-185](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js#L171-L185)
- **Mô tả lỗi:** `setWalletBalanceFixture()` chèn giao dịch `ADMIN_ADJUSTMENT`, giữ `cycle_number = 0`, `qualifying_points_cycle = 0`, nhưng lại cập nhật `tier_code = loyaltyService.calculateTier(newLifetime)`. Sau Stage 2, `ADMIN_ADJUSTMENT` không được tăng hạng thành viên.
- **Tác động:** Hiện các test `RED-*`/`CHK-*` trong `test_loyalty_module.js` không fail vì mọi hạng đều được đổi voucher, nhưng fixture tạo dữ liệu ví không hợp lệ theo quy tắc nghiệp vụ mới (`cycle_number = 0` nhưng `tier_code = 'SILVER'`/`'GOLD'`).
- **Hướng sửa đề xuất:** Giữ nguyên `tier_code` khi dùng `ADMIN_ADJUSTMENT` trong fixture test (chỉ nạp `available_points` + batch), hoặc tạo helper riêng nếu test cần nâng hạng qua `ORDER_PURCHASE`.

---

### MEDIUM-02: Một số tài liệu chưa đồng bộ hoàn toàn các phần cũ với Stage 2
- **File & dòng:**
  - [docs/database/DATABASE_OVERVIEW.md:29-60, 114](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATABASE_OVERVIEW.md#L29-L60) (vẫn ghi `21 bảng` / `4 migrations`, trong khi mục 5 đã liệt kê `005` và `006` tạo bảng thứ `28`).
  - [docs/database/DATA_DICTIONARY.md:13](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATA_DICTIONARY.md#L13) (tiêu đề mục lục vẫn ghi `(21 BẢNG)` trong khi header ghi `28 bảng`).
  - [docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md:51, 65](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md#L51) (mục 3 và mục 4 mô tả bảng `005` cũ vẫn ghi `lifetime_earned_points` dùng tính VIP và `CHECK` 5 loại giao dịch trước khi mở rộng ở mục 7).
  - [docs/loyalty/VAMOS_CLUB_TEST_PLAN.md:19](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_TEST_PLAN.md#L19) (`TIER-01` vẫn mô tả "điểm trọn đời").
- **Tác động:** Gây hiểu nhầm nếu chỉ đọc phần đầu tài liệu; không ảnh hưởng thực thi code.
- **Hướng sửa đề xuất:** Đồng bộ số lượng bảng/migrations và ghi chú chuyển tiếp sang mục 7 / quy tắc chu kỳ 12 tháng nhất quán trong các file tài liệu trên.

---

### MEDIUM-03: `awardOrderPurchasePoints(orderId)` khi gọi độc lập theo 1 tham số không kiểm tra `order_status = 'COMPLETED'` & `payment_status = 'PAID'`
- **File & dòng:** [src/services/loyalty.service.js:371-383](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L371-L383)
- **Mô tả:** `order.service.js` luôn gọi đúng bên trong nhánh `newStatus === 'COMPLETED'` ([order.service.js:573-582](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/order.service.js#L573-L582)), nhưng chính hàm `awardOrderPurchasePoints(orderId)` ở `loyalty.service.js` tuy SELECT `order_status` ở dòng 374 lại không kiểm tra điều kiện `COMPLETED` (và `payment_status = 'PAID'`).
- **Tác động:** Caller mới gọi sai API độc lập với đơn `PENDING` sẽ cộng điểm sớm.
- **Hướng sửa đề xuất:** Khi gọi ở nhánh standalone (`shouldManageTx === true`), SELECT thêm `payment_status` và từ chối nếu chưa `COMPLETED` / `PAID`.

---

### LOW-01: `getRewardsCenterData()` đọc trực tiếp ví và batch chưa quá hạn trước khi worker chạy
- **File & dòng:** [src/services/loyalty.service.js:647-688](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L647-L688)
- **Mô tả:** Nếu `cycle_end_at < GETDATE()` hoặc có batch `expires_at <= GETDATE()` trong khoảng trễ trước khi CLI worker chạy, trang `/account/rewards` vẫn hiện điểm/hạng chu kỳ vừa kết thúc và lô điểm với ngày hết hạn đã qua.
- **Hướng sửa đề xuất:** Lọc `expires_at > GETDATE()` cho `nextExpiringBatch` và tùy chọn tính view-only `rolloverCyclesThroughTimestamp(wallet, now)` khi render UI.

---

### LOW-02: `processLoyaltyCycle.js` cấu hình `idleTimeoutMillis: 30000` trên `lockPool` (`max: 1, min: 1`) & `redeemVoucher()` dùng `GETDATE()` cho `vouchers.end_date`
- **File & dòng:** [src/jobs/processLoyaltyCycle.js:22-25](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/processLoyaltyCycle.js#L22-L25), [src/services/loyalty.service.js:566](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L566)
- **Mô tả:** `lockPool` ghim `min: 1, max: 1` giữ đúng 1 session cho `sp_getapplock`/`sp_releaseapplock`; nếu job chạy lâu hơn 30 giây trong khi `lockPool` đứng yên, nên đặt `idleTimeoutMillis` lớn hoặc ping định kỳ tránh rủi ro pool/firewall cắt kết nối nhàn rỗi (dù nếu đứt kết nối, SQL Server vẫn tự thu hồi `Session` lock chứ không treo vĩnh viễn). Ngoài ra `redeemVoucher()` dùng `GETDATE()` cho `vouchers.start_date/end_date` thay vì `@nowTs`.

---

## 5. BẰNG CHỨNG FILE/LINE CHO CÁC MỤC ĐẠT CHUẨN (`PASS`)

- **Atomicity & Lock Hierarchy (`wallet -> batch`):**
  - [review.service.js:165-230](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/review.service.js#L165-L230): Mở `sql.Transaction`, khóa `reviews WITH (UPDLOCK, ROWLOCK)`, `INSERT` review + media, gọi `loyaltyService.awardReviewPoints(transaction, ...)`, `commit()` sau cùng, `rollback()` + `cleanupUploadedFiles()` trong `catch`.
  - [order.service.js:514-613](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/order.service.js#L514-L613): Khóa `orders WITH (UPDLOCK, ROWLOCK)`, chuyển `COMPLETED` + `PAID`, tính `eligibleAmount = Math.max(0, subtotal - discount_amount)` (không tính `shipping_fee`), gọi `awardOrderPurchasePoints(transaction, ...)` trước `commit()`.
  - [loyalty.service.js:198-298](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L198-L298): `_awardPointsWithBatch` lấy `UPDLOCK, ROWLOCK` trên wallet via `getOrCreateWallet()`, `INSERT point_transactions OUTPUT INSERTED.id`, tạo batch 365 ngày từ `transactionId` vừa nhận, cập nhật wallet trong cùng transaction.
  - [processLoyaltyCycle.js:78-176](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/processLoyaltyCycle.js#L78-L176): `expireSingleBatch` khóa `user_points_wallets` (`L84`) trước `loyalty_point_batches` (`L98`) giống `redeemVoucher()` (`L484`, `L497`); re-verify trạng thái batch + `idempotency_key = EXP_BATCH_{id}` sau khi khóa.
- **Chu kỳ 12 tháng, Năm nhuận 29/02 & Soft Landing:**
  - [loyaltyCycle.js:51-86, 111-243](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js#L51-L86): `addYearsFromAnchor` tính trực tiếp từ `cycle_anchor_at` gốc và `cycleNumber` (clamping `Math.min(anchorDay, maxDayInTargetMonth)`), xử lý chuẩn `2024-02-29 -> 2025-02-28 -> 2028-02-29`; ranh giới `asOf.getTime() > bounds.cycle_end_at.getTime()` đảm bảo `<= cycle_end_at` thuộc chu kỳ cũ; `ELIGIBLE_CYCLE_EARN_TYPES` chỉ gồm `REVIEW_REWARD` và `ORDER_PURCHASE` (`amount > 0`); `evaluateCycleEndTier` hạ tối đa 1 bậc; `rolloverCyclesThroughTimestamp` reset `activeQualifying = 0` sau mỗi chu kỳ khép lại. *(Lưu ý điều kiện giả định: dữ liệu production chỉ ghi nhận tích điểm qua `_awardPointsWithBatch` theo thời gian tuần tự `GETDATE()`, vì schema không lưu ảnh chụp điểm từng chu kỳ cũ trên ví ngoài lịch sử thô `point_transactions`)*.
- **Backfill Guard & Pure Engine Replay:**
  - [backfillLoyaltyHistory.js:16-21, 102-124](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js#L16-L21): Yêu cầu cả `--apply` và `--confirm-apply`; `DRY_RUN` không có lệnh ghi; có bất kỳ anomaly (`ORPHAN_LEDGER_WITHOUT_WALLET`, `WALLET_REPLAY_MISMATCH`, `NEGATIVE_TX_INSUFFICIENT_BATCHES`, `EXISTING_BATCHES_PRESENT`, `DUPLICATE_IDEMPOTENCY_KEY`, `MISSING_REFERENCE`) là dừng fail-closed trước khi mở transaction ghi DB.
- **Database Guard & Migration Runner:**
  - [init_mssql.js:128-161](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/init_mssql.js#L128-L161) và [setup_test_db.js:18](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/setup_test_db.js#L18): Tự động đọc `database/migrations/*.sql` sắp xếp lexicographical (`006_...sql`), tách batch theo `GO`, ghi `schema_migrations`, áp dụng cho `vamos_store_test_db` trước mọi test tích hợp qua `test_bootstrap.js`.

---

## 6. KẾT QUẢ ZERO-DB TESTS (ĐÃ THỰC THI TRỰC TIẾP TRONG VÒNG AUDIT)

Tất cả các lệnh bên dưới đã chạy hoàn toàn offline (0 kết nối SQL Server):

| Lệnh kiểm tra | Exit Code | Kết quả quan sát |
| :--- | :---: | :--- |
| `node tests/test_loyalty_cycle_unit.js` | `0` | **33 passed, 0 failed** (chỉ mock `src/config/database.js` trong `require.cache`, 0 kết nối DB) |
| `node tests/test_db_guard.js` | `0` | **13/13 passed** |
| `node tests/test_validator.js` | `0` | **29 passed, 0 failed** |
| `node tests/validate_pug.js` | `0` | **41/41 Pug templates compiled, 0 syntax errors** |
| `node --check` trên 8 tệp JS Stage 2 | `0` | **0 syntax errors** |
| `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"` | `0` | **`package.json:OK`** |
| `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'...))"` | `0` | **`YAML:OK`** |
| `git diff --check` | `0` | **0 lỗi whitespace / conflict marker** |

---

## 7. CÁC PHẦN CHƯA KIỂM CHỨNG ĐƯỢC (DO GIỚI HẠN READ-ONLY / ZERO-DB)

- Thực thi thực tế `database/migrations/006_vamos_club_expiration_and_tier_cycle.sql` trên SQL Server 2022 (lần đầu và chạy lại lần 2).
- Thực thi `tests/test_loyalty_module.js`, `tests/test_loyalty_cycle_integration.js`, `tests/regression_suite.js` và `npm run test:all` (bao gồm Playwright Chromium).
- Thực thi thực tế `sp_getapplock` giữa 2 OS processes song song và deadlock/race test giữa `redeemVoucher()` và `processLoyaltyCycle.js` trên SQL Server 2022.
- Chạy `npm run loyalty:backfill:dry` trên dữ liệu DB thử nghiệm thực tế.
- Kết quả phân tích SonarCloud sau khi sửa và push commit.

---

## 8. ĐIỀU KIỆN CẦN SỬA TRƯỚC KHI COMMIT

1. **[BLOCKER-01]** Sửa [tests/test_loyalty_cycle_integration.js:19-40](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L19-L40): bỏ cột `is_active`, dùng `role = 'CUSTOMER'`, `status = 'active'` theo `001`; đổi `reward_type` từ `'VOUCHER_FIXED'` sang `'VOUCHER'` với `discount_type = 'fixed_amount'` theo `005`.
2. **[BLOCKER-02]** Sửa các assertion/hook lỗi trong [tests/test_loyalty_cycle_integration.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js) (`INT-01`, `INT-04` callback `beforeExpireBatch` + `skippedDueToLock`, `INT-05` `skippedDueToLock` + batch chưa hết hạn cho race test, `INT-06` `reconciledAccounts`/`ABORTED_PREFLIGHT_FAILED`).
3. **[BLOCKER-03]** Cập nhật teardown trong [tests/regression_suite.js:1094](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/regression_suite.js#L1094) để xóa `loyalty_point_batches` trước `point_transactions` và `users`.
4. **[HIGH-01]** Thêm điều kiện `AND expires_at > @nowTs` trong `redeemVoucher()` tại [src/services/loyalty.service.js:498-501](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L498-L501) (và `planFefoDeduction()` nếu cần + `getRewardsCenterData()` ở dòng `679`), bổ sung unit + integration test cho trường hợp batch đã quá hạn 365 ngày nhưng worker chưa kịp chạy.
5. **[HIGH-03]** Bổ sung `AND qualifying_points_cycle = 0` vào nhánh `cycle_number = 0` của `chk_wallets_cycle_consistency` trong [006_vamos_club_expiration_and_tier_cycle.sql:69-73](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql#L69-L73).
6. **[HIGH-02 & MEDIUM]** Gắn `acquireSessionAppLock` bảo vệ chế độ `APPLY` trong [backfillLoyaltyHistory.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js), cân nhắc kiểm tra `COMPLETED` / `PAID` ở nhánh standalone của `awardOrderPurchasePoints()`, cập nhật fixture `setWalletBalanceFixture()` và đồng bộ các đoạn tài liệu cũ ở mục đầu `DATA_DICTIONARY.md`, `DATABASE_OVERVIEW.md`, `VAMOS_CLUB_DATA_DICTIONARY.md`, `VAMOS_CLUB_TEST_PLAN.md`.

---

## 9. ĐIỀU KIỆN CẦN XÁC MINH TRÊN GITHUB ACTIONS

Sau khi khắc phục các mục ở Section 8 và được phê duyệt commit/push:
1. Workflow `build-and-test` trên cả **Node.js 22.x** và **Node.js 24.x** đối với SQL Server 2022 phải PASS toàn bộ, đặc biệt `node tests/setup_test_db.js` (Migration `006`), `node tests/test_loyalty_module.js`, `node tests/test_loyalty_cycle_integration.js`, `node tests/regression_suite.js`, và `npm run test:all`.
2. Kiểm tra bước teardown của `regression_suite.js` và `test_loyalty_module.js` / `test_loyalty_cycle_integration.js` không in warning lỗi FK.
3. Chạy kiểm tra idempotency của `init_mssql.js` (chạy Migration `006` lại lần 2 không lỗi).
4. SonarCloud Quality Gate trên PR `#1` giữ nguyên trạng thái PASS (`Duplication <= 3%`, `Security = A`, `Reliability = A`).

---

## 10. KẾT LUẬN TỔNG THỂ

**CONDITIONAL — FIX REQUIRED**

Không phê duyệt commit/push ở trạng thái working tree hiện tại. Cần sửa toàn bộ 3 **BLOCKER** (`test_loyalty_cycle_integration.js` schema/assertions và `regression_suite.js` FK teardown) cùng các lỗi **HIGH** (`redeemVoucher()` cho phép tiêu batch đã quá hạn `expires_at <= @nowTs`, ràng buộc `qualifying_points_cycle = 0` trong Migration `006`, khóa `APPLY` trong `backfillLoyaltyHistory.js`), rồi kiểm tra lại trước khi commit/push lên `fix/master-repair-plan`.
