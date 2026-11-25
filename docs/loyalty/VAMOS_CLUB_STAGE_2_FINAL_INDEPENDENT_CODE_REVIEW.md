# VAMOS CLUB STAGE 2 — FINAL INDEPENDENT CODE REVIEW & CI READINESS GATE

> **Repository:** `dungtttd01702-coder/vamos-store`
> **Branch:** `fix/master-repair-plan`
> **HEAD:** `c0e242435f8d507f2540e6b0ba305ffa1f08e8f5`
> **Đối chiếu từ:** [VAMOS_CLUB_STAGE_2_INDEPENDENT_CODE_REVIEW.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_STAGE_2_INDEPENDENT_CODE_REVIEW.md), [VAMOS_CLUB_STAGE_2_SECOND_INDEPENDENT_CODE_REVIEW.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_STAGE_2_SECOND_INDEPENDENT_CODE_REVIEW.md), [VAMOS_CLUB_STAGE_2_FINAL_FINDINGS_REMEDIATION_REPORT.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_STAGE_2_FINAL_FINDINGS_REMEDIATION_REPORT.md)
> **Chế độ thực hiện:** **READ-ONLY FINAL REVIEW** (không sửa source, test, migration hay tài liệu hiện có; không stage/commit/push/merge; không kết nối SQL Server local hoặc production).

---

## A. GIT STATE

- **Branch:** `fix/master-repair-plan`
- **HEAD:** `c0e242435f8d507f2540e6b0ba305ffa1f08e8f5` (0 staged, 0 commits mới, 0 pushes)
- **Tracked modified (12 files):**
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
- **Untracked trước khi tạo báo cáo này (11 files):**
  - `database/migrations/006_vamos_club_expiration_and_tier_cycle.sql`
  - `docs/loyalty/VAMOS_CLUB_CYCLE_EXPIRATION_IMPLEMENTATION_REPORT.md`
  - `docs/loyalty/VAMOS_CLUB_STAGE_2_BLOCKER_HIGH_REMEDIATION_REPORT.md`
  - `docs/loyalty/VAMOS_CLUB_STAGE_2_FINAL_FINDINGS_REMEDIATION_REPORT.md`
  - `docs/loyalty/VAMOS_CLUB_STAGE_2_INDEPENDENT_CODE_REVIEW.md`
  - `docs/loyalty/VAMOS_CLUB_STAGE_2_SECOND_INDEPENDENT_CODE_REVIEW.md`
  - `src/jobs/backfillLoyaltyHistory.js`
  - `src/jobs/processLoyaltyCycle.js`
  - `src/utils/loyaltyCycle.js`
  - `tests/helpers/loyalty-test-helpers.js`
  - `tests/test_loyalty_cycle_integration.js`
  - `tests/test_loyalty_cycle_unit.js` (12 untracked tổng cộng trước file báo cáo mới — đếm chính xác: 1 migration + 5 docs + 3 src + 3 tests = 12)

---

## B. VERIFICATION MATRIX (TOÀN BỘ FINDING TỪ 3 BÁO CÁO TRƯỚC)

| Finding cũ | Kết quả kiểm tra độc lập | Evidence (File/Line/Test) | Trạng thái |
| :--- | :--- | :--- | :---: |
| **BLOCKER-01** (`test_loyalty_cycle_integration.js` sai cột `users.is_active`, `VOUCHER_FIXED`, `min_order_value`) | Đã sửa khớp `001` & `005` | [test_loyalty_cycle_integration.js:16-41](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L16-L41); `node --check` exit `0` | **PASS (Static)** / Chờ CI DB |
| **BLOCKER-02** (`INT-01`, `INT-04`, `INT-05`, `INT-06` sai contract & assertion) | Đã sửa khớp `processLoyaltyCycle.js` & `backfillLoyaltyHistory.js` | [test_loyalty_cycle_integration.js:147-474](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L147-L474); `node --check` exit `0` | **PASS (Static)** / Chờ CI DB |
| **BLOCKER-03** (`regression_suite.js` teardown thiếu xóa `loyalty_point_batches`) | Đã thêm `DELETE FROM loyalty_point_batches` cho 4 user fixture trước `point_transactions` & `users` | [regression_suite.js:1093-1099](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/regression_suite.js#L1093-L1099) | **PASS (Static)** / Chờ CI DB |
| **HIGH-01** (`redeemVoucher()` không loại batch đã hết hạn 365 ngày) | Đã dùng chung `getUnexpiredActiveBatches`/`summarizeUsablePoints`, lọc `expires_at > @nowTs` cả khi `SELECT` & `UPDATE`, đồng nhất `@nowTs` | [loyaltyCycle.js:245-296](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js#L245-L296), [loyalty.service.js:491-540,573-581](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L491-L540); `EXP-05`, `SVC-04..06` PASS | **PASS (Unit/Mock)** / Chờ CI DB |
| **HIGH-02** (`backfillLoyaltyHistory.js` APPLY dùng snapshot cũ ngoài transaction) | `APPLY` khóa `acquireSessionAppLock`, mở `tx`, khóa `user_points_wallets WITH (UPDLOCK, HOLDLOCK)` rồi mới lấy `db_now`, đọc `point_transactions`/`batches WITH (HOLDLOCK)` và reconcile trong `tx` | [backfillLoyaltyHistory.js:139-275](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js#L139-L275); `BF-06`, `BF-07` PASS | **PASS (Unit/Mock)** / Chờ CI DB |
| **HIGH-03** (`chk_wallets_cycle_consistency` thiếu `qualifying_points_cycle = 0` khi `cycle_number = 0`) | Đã bổ sung `AND qualifying_points_cycle = 0` và drop/recreate idempotent | [006_vamos_club_expiration_and_tier_cycle.sql:63-86](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql#L63-L86) | **PASS (Static DDL)** / Chờ CI DB |
| **MEDIUM-01** (`setWalletBalanceFixture()` nâng tier bằng `ADMIN_ADJUSTMENT`) | Giữ nguyên `tier_code`, chỉ cập nhật `available_points` & `lifetime_earned_points` | [test_loyalty_module.js:170-182](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js#L170-L182) | **PASS (Static)** / Chờ CI DB |
| **MEDIUM-02** (Đồng bộ tài liệu `DATA_DICTIONARY`, `DATABASE_OVERVIEW`, `VAMOS_CLUB_*`) | Đã cập nhật số lượng 28 bảng và rule mới | [DATA_DICTIONARY.md:13](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATA_DICTIONARY.md#L13), [DATABASE_OVERVIEW.md:29-60,114](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATABASE_OVERVIEW.md#L29-L60), [VAMOS_CLUB_TEST_PLAN.md:19](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_TEST_PLAN.md#L19) | **PASS (Static Docs)** |
| **MEDIUM-03** (`awardOrderPurchasePoints(orderId)` standalone thiếu check `COMPLETED`/`PAID`) | Check tường minh `order_status !== 'COMPLETED' || payment_status !== 'PAID'` | [loyalty.service.js:371-390](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L371-L390); `SVC-07` PASS | **PASS (Unit/Mock)** / Chờ CI DB |
| **MEDIUM-NEW-01** (Rewards UI hiện `available_points` gồm điểm quá hạn) | Tính `usable_points` & `expired_pending_points` qua `summarizeUsablePoints` với `expires_at > @nowTs`; `rewards.pug` dùng `displayUsablePoints` không fallback sai khi = `0` | [loyalty.service.js:661-715](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L661-L715), [rewards.pug:4-5,54,88-93,193-195](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/views/pages/account/rewards.pug#L4-L5); `SVC-08..11` PASS (kèm HTML render) | **PASS (Unit/Mock)** / Chờ CI DB |
| **MEDIUM-NEW-02** (`VAMOS_CLUB_DATA_DICTIONARY.md:137` thiếu `AND qualifying_points_cycle = 0`) | Đã đồng bộ text constraint đúng DDL `006` | [VAMOS_CLUB_DATA_DICTIONARY.md:137](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md#L137) | **PASS (Static Docs)** |
| **MEDIUM-NEW-03** (Thiếu integration test `INT-07` cho `APPLIED`) | Đã bổ sung `INT-07` chạy đầu tiên với `uClean`, `uControl`, kiểm tra `APPLIED`, re-run `ABORTED_PREFLIGHT_FAILED` & cleanup trong `finally` | [test_loyalty_cycle_integration.js:47-142](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L47-L142) | **PASS (Static)** / Chờ CI DB |
| **LOW-NEW-01 (#1 & #2)** (`nowTs` trước `tx.begin()` trong backfill; comment `700 pts` ở `INT-05`) | `APPLY` lấy `SELECT GETDATE() AS db_now` 1 lần sau khi khóa wallet trong `tx`; sửa comment `750 pts` ở `INT-05` | [backfillLoyaltyHistory.js:171-180](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js#L171-L180), [test_loyalty_cycle_integration.js:411](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L411); `BF-06` PASS | **PASS (Unit/Mock)** |

---

## C. DEEP TECHNICAL REVIEW

### C.1. Wallet / Batch / Ledger Consistency & Expiration Eligibility
- **Phân định ngữ nghĩa 3 giá trị:**
  - `user_points_wallets.available_points`: Tổng điểm chưa bị khấu trừ/chưa bị sweep trong sổ cái ví.
  - `wallet.usable_points`: Tổng `remaining_points` của các lô thỏa đồng thời `status === 'ACTIVE'`, `remaining_points > 0`, `expires_at > @nowTs`, giới hạn không vượt `available_points` qua [summarizeUsablePoints()](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js#L267-L280).
  - `wallet.expired_pending_points`: Phần `Math.max(0, available_points - usable_points)` nằm trong lô đã quá hạn (`expires_at <= nowTs`) chờ worker quét.
- **Nhất quán helper & ranh giới thời gian:** Cả `planFefoDeduction()`, `redeemVoucher()`, và `getRewardsCenterData()` đều đi qua `getUnexpiredActiveBatches()` / `summarizeUsablePoints()` với điều kiện chặt `expires_at > nowTs` (nên `expires_at <= nowTs`, kể cả bằng đúng `nowTs`, đều bị loại). Toàn bộ truy vấn thời gian runtime lấy từ SQL Server `GETDATE()` (qua `DATETIME2` chuẩn UTC components của `mssql`), dùng một `nowTs` duy nhất trong mỗi transaction.
- **Worker expiration ([processLoyaltyCycle.js:74-183](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/processLoyaltyCycle.js#L74-L183)):** Giữ lock session `sp_getapplock` trên `lockPool` riêng (`max: 1, min: 1`), khóa `user_points_wallets` trước `loyalty_point_batches`, kiểm tra lại `status`, `remaining_points`, `expires_at <= nowTs` và `EXP_BATCH_{batch.id}`, trừ `available_points`, ghi `POINT_EXPIRATION` và set batch `EXPIRED`. *(Concurrency thật trên 2 OS process cần CI SQL Server xác minh).*

### C.2. Redemption FEFO & Concurrency ([loyalty.service.js:444-652](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L444-L652))
- Đúng đủ 10 bước: khóa rule -> khóa wallet (`getOrCreateWallet` `UPDLOCK, ROWLOCK`) -> khóa batch (`UPDLOCK, ROWLOCK` với `expires_at > @nowTs`, `ORDER BY expires_at ASC, id ASC`) -> `summarizeUsablePoints` -> chặn nếu `wallet.available_points < required || usableUnexpiredPoints < required` -> `planFefoDeduction` -> cập nhật từng batch kèm kiểm tra `rowsAffected[0] === 1` & `expires_at > @nowTs` -> tạo voucher (`@nowTs`) -> cập nhật wallet (`available_points`, `lifetime_redeemed_points`, giữ nguyên `qualifying_points_cycle`) -> ghi `VOUCHER_REDEMPTION` -> `commit()`, lỗi ở bất kỳ bước nào đều `rollback()` sạch.
- Thứ tự khóa `wallet -> batch` khớp hoàn toàn với `processLoyaltyCycle.js`, `_awardPointsWithBatch()` và `backfillLoyaltyHistory.js (APPLY)`.

### C.3. Rewards Center & Toàn bộ Usages ([loyalty.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/loyalty.controller.js), [rewards.pug](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/views/pages/account/rewards.pug))
- Rà soát toàn bộ `src/` và `src/views/`: chỉ có [rewards.pug](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/views/pages/account/rewards.pug) hiển thị số dư điểm ví cho người dùng.
- Tại [rewards.pug:4-5](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/views/pages/account/rewards.pug#L4-L5), `displayUsablePoints` kiểm tra tường minh `!== undefined && !== null` trước khi ép `Number(wallet.usable_points)`, nên khi tất cả batch hết hạn (`usable_points = 0`) giá trị hiển thị là **`0`** chứ không bị fallback sai về `rawWalletPoints`.
- Nếu `rawWalletPoints > displayUsablePoints`, UI ghi rõ `"Số dư sổ ví: X điểm (có Y điểm đã hết hạn chờ worker đối soát)"` và các nút đổi voucher dùng `displayUsablePoints` (`Thiếu ... điểm còn hạn`).
- **Đọc đồng thời trên `/account/rewards`:** `getRewardsCenterData()` không bọc các câu `SELECT` trong `SNAPSHOT` transaction; nếu có redemption/expiration commit đúng giữa 2 câu `SELECT`, trang chỉ có thể hiển thị lệch nhẹ tạm thời trong 1 lần tải trang (`Math.min` ngăn hiện vượt `available_points`), **không** ảnh hưởng tính đúng đắn ACID của `redeemVoucher()`. Không cần thêm lock đọc nặng.

### C.4. Backfill, Session Lock & Đối soát `INT-07` ([backfillLoyaltyHistory.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js), [test_loyalty_cycle_integration.js:47-142](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L47-L142))
- **Session lock & Writer sync:** `acquireSessionAppLock` (`sp_getapplock @LockOwner = 'Session'`) ghim `lockPool` (`max: 1, min: 1`) suốt thời gian `tx` chạy, giải phóng trong `finally`; nếu `!acquired` thì không mở `tx` và trả `ABORTED_LOCK_UNAVAILABLE`. Trong `tx`, khóa `user_points_wallets WITH (UPDLOCK, HOLDLOCK)` trước (ngăn cả phantom tạo ví mới vì `getOrCreateWallet` cũng lấy `UPDLOCK, HOLDLOCK` trên `user_points_wallets`), rồi mới lấy `db_now` và đọc `point_transactions` & `loyalty_point_batches WITH (HOLDLOCK)`, khớp thứ tự khóa `wallet -> tx/batches` của mọi writer trong app.
- **Tính tay số liệu `INT-07`:**
  - `uClean`: `1200` (`ORDER_PURCHASE`, `2026-01-10`) + `400` (`REVIEW_REWARD`, `2026-02-10`) - `500` (`VOUCHER_REDEMPTION`, `2026-03-01`). FEFO trừ `500` từ lô `1200` (`expires 2027-01-10 < 2027-02-10`) $\rightarrow$ Lô 1 còn `700` (`ACTIVE`), Lô 2 còn `400` (`ACTIVE`); tổng `700 + 400 = 1100 === available_points`; `qualifying = 1200 + 400 = 1600` $\rightarrow$ `SILVER`, `cycle_number = 1`, `cycle_anchor_at = 2026-01-10T00:00:00.000Z`; `uControl` giữ `0 / MEMBER / cycle_number = 0`. Khớp 100% với các assertion ở [L94-121](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L94-L121).
- **Lần chạy `APPLY` thứ hai (`L123-134`):**
  - Trả về `ABORTED_PREFLIGHT_FAILED` do `replayUserHistory()` ([loyaltyCycle.js:336-340](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js#L336-L340)) phát hiện `existingBatchesCount > 0` và gắn anomaly **`EXISTING_BATCHES_PRESENT`** (`"User X already has 2 batch records in loyalty_point_batches."`).
  - Đây là **thiết kế fail-closed có chủ đích**: công cụ backfill một lần từ chối ghi đè/trộn khi bảng lô đã có dữ liệu, rollback ngay trước mọi `INSERT`/`UPDATE`, nên dữ liệu lần 1 vẫn nguyên vẹn (`batchCntAfter === 2`, không duplicate). Cần lưu ý phân biệt rõ đây là fail-closed preflight block, không phải no-op idempotent return `status: 'APPLIED'`.

### C.5. Cycle, Soft Landing, Migration 006, Regression & CI Orchestration
- **Cycle & Soft Landing ([loyaltyCycle.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js)):** Đáp ứng đúng toàn bộ policy đã chốt (neo `cycle_anchor_at` từ `REVIEW_REWARD`/`ORDER_PURCHASE > 0`, chống trôi 29/02, ranh giới `<=` vs `>`, Soft Landing tối đa 1 bậc, reset `qualifying_points_cycle`, giữ `available_points`, hạn 365 ngày, 3% `(subtotal - discount_amount)` chỉ khi `COMPLETED` & `PAID`, mọi tier đổi được voucher).
- **Migration 006 ([006_vamos_club_expiration_and_tier_cycle.sql](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql)):** Tương thích SQL Server 2022, tách `GO` khớp [init_mssql.js:144](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/init_mssql.js#L144), idempotent khi chạy lại, không làm mất dữ liệu cũ.
- **CI Workflow ([.github/workflows/ci.yml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/.github/workflows/ci.yml) & [package.json](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/package.json)):** Service `mssql:2022-latest`, `NODE_ENV=test`, `DB_TEST_NAME=vamos_store_test_db`. Bước `setup_test_db.js` chạy `init('vamos_store_test_db')` áp dụng `001`–`006`; `npm run test:all` thực thi `validate_pug` -> `test_validator` -> `test_db_guard` -> `test_loyalty_cycle_unit` -> `setup_test_db` (kiểm chứng lại idempotency migration) -> `test_auth_flow` .. `test_audit_fixes` -> `test_loyalty_module` -> `test_loyalty_cycle_integration` (gồm `INT-07` trước `INT-01..06`) -> `regression_suite` (đã có `DELETE FROM loyalty_point_batches`).

---

## D. NEW FINDINGS

Không phát hiện `BLOCKER`, `HIGH`, hoặc `MEDIUM` mới. Chỉ ghi nhận 2 điểm `LOW` mang tính vận hành/phòng vệ (không bắt buộc chặn CI):

1. **LOW-FINAL-01** (`src/services/loyalty.service.js:371-394`, đã ghi nhận ở vòng 2): Khi caller gọi `awardOrderPurchasePoints({ orderId, userId, eligibleAmount })` (cung cấp sẵn đủ tham số), hàm bỏ qua bước re-query kiểm tra `order_status === 'COMPLETED' && payment_status === 'PAID'` và tin tưởng caller (`order.service.js:573-582` đang kiểm tra đúng). Không bắt buộc sửa trước CI.
2. **LOW-FINAL-02** (`tests/test_loyalty_cycle_integration.js:48-51` + `src/services/loyalty.service.js:661-710`):
   - `INT-07` yêu cầu DB test sạch (`preExistingBatches === 0 && preExistingTxs === 0`) ngay khi `test_loyalty_cycle_integration.js` bắt đầu; điều này phụ thuộc việc các script chạy trước trong `test:all` dọn sạch bảng loyalty (đã xác minh tĩnh là sạch, nhưng cần CI thực tế kiểm chứng).
   - `getRewardsCenterData()` đọc `wallet` và `loyalty_point_batches` qua hai câu `SELECT` rời không dùng `SNAPSHOT` transaction nên có thể lệch hiển thị thoáng qua trong đúng mili-giây worker/redemption chạy song song (vẫn an toàn tuyệt đối ở tầng giao dịch `redeemVoucher()`).

---

## E. TEST EVIDENCE

### E.1. Zero-DB & Unit/Mocked/Static Checks đã chạy trực tiếp ở vòng Review cuối
| Kiểm tra / Lệnh | Exit Code | Kết quả thực tế | Loại bằng chứng |
| :--- | :---: | :--- | :--- |
| `node tests/test_loyalty_cycle_unit.js` | `0` | **44 passed, 0 failed** | Pure unit (`CYC-01..20`, `EXP-01..05`, `BF-01..05`) + Mocked SQL/Pug (`SVC-01..11`, `WRK-01`, `BF-06..07`) |
| `node tests/test_db_guard.js` | `0` | **13/13 passed** | Pure Unit (Zero DB) |
| `node tests/test_validator.js` | `0` | **29 passed, 0 failed** | Pure Unit (Zero DB) |
| `node tests/validate_pug.js` | `0` | **41/41 Pug templates compiled** | Static Template Compilation |
| `node --check` 9 file JS Stage 2 & regression | `0` | **0 syntax errors** | Static JS Syntax |
| `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"` | `0` | `json:OK` | Static JSON |
| `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'...))"` | `0` | `YAML:OK` | Static YAML |
| `git diff --check` | `0` | **0 lỗi whitespace / conflict** | Static Git Diff |

### E.2. Các kiểm tra SQL Server 2022 & E2E CHƯA chạy (Bắt buộc xác minh trên CI)
- Thực thi `database/migrations/006_vamos_club_expiration_and_tier_cycle.sql` (lần đầu và chạy lại idempotency).
- Thực thi `tests/test_loyalty_module.js`.
- Thực thi `tests/test_loyalty_cycle_integration.js` (bao gồm `INT-07` và `INT-01..06`, khóa thật `UPDLOCK/HOLDLOCK`, `sp_getapplock` trên 2 session song song, race redemption vs expiration).
- Thực thi `tests/regression_suite.js` và `npm run test:all` (kèm Playwright Chromium).
- Thực thi thực tế `npm run loyalty:process` và `npm run loyalty:backfill:dry` / `--apply`.

---

## F. FINAL DECISION

**`APPROVED FOR CONTROLLED CI VALIDATION`**

- **Cơ sở kết luận:** Không còn **BLOCKER**, **HIGH**, hoặc **MEDIUM** sai dữ liệu/sai nghiệp vụ nào trên toàn bộ mã nguồn, migration, UI, tests và tài liệu Stage 2; toàn bộ kiểm tra zero-DB (`44/44` unit/mocked/Pug-render, `13/13` DB guard, `29/29` validator, `41/41` Pug, syntax/JSON/YAML/whitespace) đạt 100%.
- **Giới hạn minh bạch:** Kết luận này chỉ phê duyệt **đủ điều kiện đưa vào Controlled CI Validation trên SQL Server 2022**, **không** thay thế kết quả chạy CI và **không** tự thực hiện `git commit`/`push`/`merge`. Mọi hành vi runtime SQL Server 2022 và SonarCloud Quality Gate bắt buộc phải được xác minh sau khi người dùng phê duyệt riêng bước commit/push.
