# VAMOS CLUB STAGE 2 — FINAL FINDINGS REMEDIATION REPORT

> **Repository:** `dungtttd01702-coder/vamos-store`
> **Branch:** `fix/master-repair-plan`
> **HEAD:** `c0e242435f8d507f2540e6b0ba305ffa1f08e8f5`
> **Nguồn đối chiếu:** [VAMOS_CLUB_STAGE_2_SECOND_INDEPENDENT_CODE_REVIEW.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_STAGE_2_SECOND_INDEPENDENT_CODE_REVIEW.md)
> **Giới hạn đã tuân thủ:** Không kết nối SQL Server local/production; không chạy migration, `loyalty:process`, `loyalty:backfill:dry`, `--apply` hay integration/regression suite; không stage/commit/push/merge.

---

## 1. GIT STATE TRƯỚC VÀ SAU

- **Branch & HEAD:** `fix/master-repair-plan` tại `c0e242435f8d507f2540e6b0ba305ffa1f08e8f5` (0 staged, 0 commits mới, 0 pushes).
- **Trước khi sửa (22 files trong working tree):**
  - 12 tracked modified (`DATABASE_OVERVIEW.md`, `DATA_DICTIONARY.md`, `PHYSICAL_ERD.puml`, `vamos_store_erd.puml`, `VAMOS_CLUB_DATA_DICTIONARY.md`, `VAMOS_CLUB_SPEC.md`, `VAMOS_CLUB_TEST_PLAN.md`, `package.json`, `loyalty.service.js`, `rewards.pug`, `regression_suite.js`, `test_loyalty_module.js`).
  - 10 untracked (`006_...sql`, `VAMOS_CLUB_CYCLE_EXPIRATION_IMPLEMENTATION_REPORT.md`, `VAMOS_CLUB_STAGE_2_BLOCKER_HIGH_REMEDIATION_REPORT.md`, `VAMOS_CLUB_STAGE_2_INDEPENDENT_CODE_REVIEW.md`, `VAMOS_CLUB_STAGE_2_SECOND_INDEPENDENT_CODE_REVIEW.md`, `backfillLoyaltyHistory.js`, `processLoyaltyCycle.js`, `loyaltyCycle.js`, `loyalty-test-helpers.js`, `test_loyalty_cycle_integration.js`, `test_loyalty_cycle_unit.js`). *(Lưu ý: tổng trước nhiệm vụ là 12 modified + 11 untracked = 23 tệp sau khi tính đủ 11 untracked gồm báo cáo review lần 2).*
- **Tệp chỉnh sửa trong đợt này (chỉ thuộc phạm vi 5 finding mục tiêu):**
  - [src/utils/loyaltyCycle.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js)
  - [src/services/loyalty.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js)
  - [src/views/pages/account/rewards.pug](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/views/pages/account/rewards.pug)
  - [src/jobs/backfillLoyaltyHistory.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js)
  - [docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md)
  - [tests/test_loyalty_cycle_integration.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js)
  - [tests/test_loyalty_cycle_unit.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_unit.js)
- **Tệp tạo mới duy nhất:** [VAMOS_CLUB_STAGE_2_FINAL_FINDINGS_REMEDIATION_REPORT.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_STAGE_2_FINAL_FINDINGS_REMEDIATION_REPORT.md).

---

## 2. TÓM TẮT REMEDIATION THEO TỪNG FINDING

| Finding ID | Nguyên nhân | File / Line thay đổi | Cách sửa chi tiết |
| :--- | :--- | :--- | :--- |
| **MEDIUM-NEW-01** | `getRewardsCenterData()` trả về `wallet.available_points` tổng và `rewards.pug` dùng trực tiếp `wallet.available_points` cho badge, số điểm chính và nút đổi quà, dẫn đến hiển thị cả điểm hết hạn trước khi CLI worker quét | [loyaltyCycle.js:245-296](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js#L245-L296), [loyalty.service.js:504-514, 661-715](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L661-L715), [rewards.pug:4-6, 54, 88-96, 193-195](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/views/pages/account/rewards.pug#L88-L96) | Tách helper dùng chung `getUnexpiredActiveBatches()` & `summarizeUsablePoints()` trong `loyaltyCycle.js` (dùng chung cho cả `redeemVoucher()` và `getRewardsCenterData()`). `getRewardsCenterData()` dùng 1 mốc `nowTs` duy nhất, lọc `status = 'ACTIVE' AND remaining_points > 0 AND expires_at > @nowTs`, trả thêm `wallet.usable_points` (`usablePoints`), `expired_pending_points`, `nextExpiringBatch` mà **không** sửa cột `wallet.available_points` hay sổ cái. `rewards.pug` dùng `displayUsablePoints` cho badge, hero (`ĐIỂM CÒN HẠN SỬ DỤNG`), và kiểm tra nút đổi quà (`Thiếu ... điểm còn hạn`), đồng thời hiện chú thích minh bạch nếu `rawWalletPoints > displayUsablePoints`. |
| **MEDIUM-NEW-02** | Mô tả `chk_wallets_cycle_consistency` tại dòng 137 thiếu điều kiện `AND qualifying_points_cycle = 0` khi `cycle_number = 0` | [VAMOS_CLUB_DATA_DICTIONARY.md:137](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md#L137) | Cập nhật đúng đoạn mô tả `chk_wallets_cycle_consistency` khớp 100% DDL trong [006_vamos_club_expiration_and_tier_cycle.sql:80-84](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql#L80-L84). |
| **MEDIUM-NEW-03** | Chưa có integration test cho nhánh backfill `APPLY` thành công (`status === 'APPLIED'`) | [test_loyalty_cycle_integration.js:43-145](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L43-L145) | Thêm `INT-07` chạy **đầu tiên** (trước `INT-01..06`, trên `vamos_store_test_db` sạch chưa có batch/ledger), tạo 2 user cô lập (`uClean` có 2 earn + 1 redeem hợp lệ chưa có batch, `uControl` không giao dịch), xác nhận `DRY_RUN_READY` -> `APPLIED` (`insertedBatches = 2`, FEFO `1200 -> 700` & `400 -> 400`, `available_points = 1100` giữ nguyên, `tier_code = SILVER`, `cycle_number = 1`, `qualifying_points_cycle = 1600`, `uControl` không đổi) -> chạy lại `APPLY` trả `ABORTED_PREFLIGHT_FAILED` không trùng lặp -> tự dọn `uClean`/`uControl` trong `finally`. |
| **LOW (#1)** | `nowTs` trong `backfillLoyaltyHistory.js` được lấy trước `tx.begin()` | [backfillLoyaltyHistory.js:84-96, 171-180](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js#L171-L180) | Giữ `DRY_RUN` đọc `SELECT GETDATE()` trước read-only query; chuyển `SELECT GETDATE() AS db_now` của mode `APPLY` vào **sau** `tx.begin()` và sau khi khóa `user_points_wallets WITH (UPDLOCK, HOLDLOCK)` (lấy đúng 1 lần duy nhất cho toàn lượt `APPLY`). |
| **LOW (#2)** | Comment dòng 411 trong `INT-05` Case B ghi `700 pts` trong khi `25000 * 0.03 = 750 pts` | [test_loyalty_cycle_integration.js:411](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L411) | Sửa comment thành `// Unexpired batch of 750 pts -> 2 concurrent redeemVoucher calls (700 pts) -> strictly 1 succeeds, 1 rejects, balance 50`. |

---

## 3. TEST COVERAGE MỚI ĐÃ BỔ SUNG

1. **4 test mocked service + Pug HTML rendering trong [test_loyalty_cycle_unit.js:1058-1178](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_unit.js#L1058-L1178):**
   - `SVC-08` (Trường hợp 1): Ví `1000`, batch hết hạn `400` + batch còn hạn `600` (worker chưa chạy) -> `usable_points === 600`, `expired_pending_points === 400`, UI render `600`, nút voucher `700` hiện `Thiếu 100 điểm còn hạn`, không hiện `1.000 ĐIỂM KHẢ DỤNG`.
   - `SVC-09` (Trường hợp 2): Tất cả batch hết hạn (`400` quá hạn + `600` đúng biên `expires_at === nowTs`), ví vẫn `1000` -> `usable_points === 0`, `nextExpiringBatch === null`, UI hiện `Thiếu 700 điểm còn hạn`.
   - `SVC-10` (Trường hợp 3): Nhiều batch còn hạn (`300` + `500`) -> `usable_points === 800`, nút đổi voucher 700 điểm khả dụng (`ĐỔI VOUCHER NGAY`).
   - `SVC-11` (Trường hợp 4): Worker đã chạy (`EXPIRED` + `available_points = 600`, batch còn hạn `600`) -> `usable_points === 600`, `expired_pending_points === 0` (không trừ 2 lần).
2. **Kiểm tra thứ tự clock trong `BF-06` ([test_loyalty_cycle_unit.js:948-1015](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_unit.js#L948-L1015)):** Xác nhận `backfillLoyaltyHistory APPLY` gọi `SELECT GETDATE() AS db_now` **sau** khi giữ `UPDLOCK, HOLDLOCK` trên `user_points_wallets`.
3. **Integration test mới `INT-07` ([test_loyalty_cycle_integration.js:43-145](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L43-L145)):** Bổ sung mã kiểm thử trên CI `vamos_store_test_db` cho nhánh `APPLIED` & re-run idempotency. *(Chưa chạy tại local).*

---

## 4. ZERO-DB TEST EVIDENCE (THỰC THI TRỰC TIẾP SAU LẦN SỬA CUỐI)

| Lệnh chính xác | Exit Code | Kết quả thực tế |
| :--- | :---: | :--- |
| `node tests/test_loyalty_cycle_unit.js` | `0` | **44 passed, 0 failed** (0 kết nối SQL Server) |
| `node tests/test_db_guard.js` | `0` | **13/13 passed** |
| `node tests/test_validator.js` | `0` | **29 passed, 0 failed** |
| `node tests/validate_pug.js` | `0` | **41/41 Pug templates passed** |
| `node --check` trên 7 tệp JS liên quan (`loyaltyCycle.js`, `loyalty.service.js`, `loyalty.controller.js`, `backfillLoyaltyHistory.js`, `processLoyaltyCycle.js`, `test_loyalty_cycle_unit.js`, `test_loyalty_cycle_integration.js`) | `0` | **0 syntax errors** |
| `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"` | `0` | `json:OK` |
| `git diff --check` | `0` | **0 lỗi whitespace / conflict** |

---

## 5. CÁC TEST SQL SERVER CHƯA CHẠY TẠI LOCAL

Do tuân thủ giới hạn zero-DB tại local, các bước sau **chưa được thực thi** và cần chạy trên GitHub Actions CI (`vamos_store_test_db`):
- Migration `006_vamos_club_expiration_and_tier_cycle.sql`.
- `tests/test_loyalty_module.js`.
- `tests/test_loyalty_cycle_integration.js` (bao gồm `INT-07` mới và `INT-01..INT-06`).
- `tests/regression_suite.js` và `npm run test:all` (bao gồm Playwright Chromium).
- `npm run loyalty:process`, `npm run loyalty:backfill:dry`, hoặc `--apply`.

---

## 6. RỦI RO CÒN LẠI

- Nếu một kịch bản test nào trong `npm run test:all` chạy **trước** `test_loyalty_cycle_integration.js` để sót dữ liệu trong `point_transactions` hoặc `loyalty_point_batches`, assertion `preExistingBatches === 0 && preExistingTxs === 0` trong `INT-07` sẽ báo lỗi rõ ràng thay vì chạy sai trên DB bẩn (kiểm tra tĩnh hiện tại cho thấy các test đứng trước đều sạch hoặc tự dọn trong teardown).
- Toàn bộ hành vi SQL Server 2022 (Migration `006`, khóa thật `UPDLOCK/HOLDLOCK`, `sp_getapplock`, FEFO concurrency và `INT-07`) chưa được kiểm chứng thực thi cho tới khi CI chạy sau khi commit/push được phê duyệt.

---

## 7. KẾT LUẬN

**`READY FOR FINAL INDEPENDENT REVIEW`**

Working tree giữ nguyên chưa stage/commit/push, không kết nối database, mọi finding còn lại từ vòng review lần 2 đều đã được khắc phục và kiểm chứng bằng `44/44` unit/mocked/Pug-render tests (0 kết nối DB). Stage 2 **chưa hoàn tất end-to-end** cho tới khi hoàn thành vòng review độc lập cuối cùng và xác minh trên GitHub Actions CI SQL Server 2022.
