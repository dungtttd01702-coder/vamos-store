# VAMOS CLUB — INT-04 FIX & CI RE-RUN REPORT

> **Repository:** `dungtttd01702-coder/vamos-store`
> **Branch:** `fix/master-repair-plan`
> **PR:** `#1` (`Draft`, không merge, không thay đổi cấu hình/trạng thái PR)
> **Thời điểm chụp trạng thái Git ban đầu:** `2026-11-26 01:16 UTC+7` | **Cập nhật xác minh full raw log:** `2026-11-26 01:35 UTC+7`

---

## A. GIT

- **Branch:** `fix/master-repair-plan`
- **HEAD trước sửa:** `d7a851047913155148acafa1061482c92730f994`
- **Commit mới:** `2655814ce8dd899e81343b596c8018ca02b18f99` (`2655814`) — `test(loyalty): correct INT-04 soft landing expectations`
- **Phạm vi commit:** Duy nhất `tests/test_loyalty_cycle_integration.js` (`1 file changed, 56 insertions(+), 2 deletions(-)`); không chỉnh sửa `src/utils/loyaltyCycle.js`, `src/jobs/processLoyaltyCycle.js` hay business policy.
- **Push status (tại `2026-11-26 00:41 UTC+7`):** Thành công (`d7a8510..2655814 fix/master-repair-plan -> fix/master-repair-plan`, push thường không `--force`).
- **Remote SHA (xác minh lại lúc `2026-11-26 01:29 UTC+7`):** `2655814ce8dd899e81343b596c8018ca02b18f99` (`refs/heads/fix/master-repair-plan`).
- **Working tree (snapshot lúc `2026-11-26 01:16 UTC+7` trước khi bổ sung audit doc):** `0` modified, `0` staged, `2` file báo cáo CI untracked (`VAMOS_CLUB_STAGE_2_COMMIT_PUSH_CI_REPORT.md`, `VAMOS_CLUB_INT04_FIX_CI_REPORT.md`). *(Snapshot lúc `2026-11-26 01:29 UTC+7` có thêm file thứ 3 là `VAMOS_CLUB_INT04_DOCUMENTATION_AUDIT.md` trước khi tạo commit tài liệu).*

---

## B. INT-04

- **Expected tier trước sửa (tại `2026-06-01`):** `'SILVER'` (sai vì giả định Cycle 1 đạt 6.000 điểm nhưng cuối Cycle 1 lại bị tụt xuống `'GOLD'`).
- **Expected tier sau sửa (tại `2026-06-01`):** `'GOLD'` (Cycle 1 `2024-01-01..2025-01-01` đạt `6.000` điểm -> giữ `VIP` sang Cycle 2; Cycle 2 `2025-01-01..2026-01-01` có `0` điểm -> Soft Landing `VIP -> GOLD` sang Cycle 3).
- **Kết quả tại `2026-06-01` (đã xác minh `PASS INT-04` trên SQL Server 2022 CI):**
  - `tier_code`: `'GOLD'`
  - `cycle_number`: `3`
  - `cycle_anchor_at`: `'2024-01-01T00:00:00.000Z'`
  - `cycle_start_at`: `'2026-01-01T00:00:00.000Z'`
  - `cycle_end_at`: `'2027-01-01T00:00:00.000Z'`
  - `qualifying_points_cycle`: `0`
  - `available_points`: `0` (cả 2 lô Jan 2024 đã hết hạn 365 ngày; `POINT_EXPIRATION` ghi đúng `2` bản ghi)
- **Kết quả tại `2027-06-01` (kiểm thử chu kỳ tiếp theo trong `INT-04`, đã xác minh `PASS INT-04`):**
  - `tier_code`: `'SILVER'` (Cycle 3 có `0` điểm -> Soft Landing `GOLD -> SILVER` sang Cycle 4)
  - `cycle_number`: `4`
  - `cycle_anchor_at`: `'2024-01-01T00:00:00.000Z'` (bất biến)
  - `cycle_start_at`: `'2027-01-01T00:00:00.000Z'`
  - `cycle_end_at`: `'2028-01-01T00:00:00.000Z'`
  - `qualifying_points_cycle`: `0`
  - `available_points`: `0` (bằng `w.available_points`, không bị xóa hay thay đổi khi rollover)
  - `loyalty_point_batches`: giữ nguyên `2` bản ghi (`EXPIRED`, `remaining_points = 0`)
  - `point_transactions`: giữ nguyên `4` bản ghi (`2` `ORDER_PURCHASE` + `2` `POINT_EXPIRATION`), không phát sinh giao dịch thừa khi rollover
- **Bằng chứng chống rollover lặp tại cùng mốc `2027-06-01`:**
  - Chạy lại `runLoyaltyCycleWorker({ nowOverride: utc('2027-06-01T00:00:00Z') })` trả về `skippedDueToLock = false`, `expiredBatches = 0`, `walletsRolledOver = 0`, `cyclesProcessedTotal = 0`; ví giữ nguyên `tier_code = 'SILVER'`, `cycle_number = 4`, `qualifying_points_cycle = 0`, `available_points = 0` và nguyên bộ mốc `2024-01-01` / `2027-01-01` / `2028-01-01`.

---

## C. CI (ĐỐI CHIẾU CÙNG COMMIT `2655814ce8dd899e81343b596c8018ca02b18f99`)

| Kiểm tra | Run / Job ID | Commit SHA kiểm tra trong log | Bằng chứng & Số liệu thực tế | Kết quả |
| :--- | :--- | :--- | :--- | :---: |
| **Push CI #56 (`Node.js 22.x`)** | `45667394348` / `139393147845` | `2655814ce8dd899e81343b596c8018ca02b18f99` | API `18/18` steps `success` (`1m 30s`) + **Full raw log (2,165 dòng, Step 14 = 1,205 dòng)** | **VERIFIED PASS** |
| **Push CI #56 (`Node.js 24.x`)** | `45667394348` / `139393147222` | `2655814ce8dd899e81343b596c8018ca02b18f99` | API `18/18` steps `success` (`1m 44s`) + **Full raw log (2,184 dòng, Step 14 = 1,205 dòng)** | **VERIFIED PASS** |
| **PR #1 CI #57 (`Node.js 22.x`)** | `45667750226` / `139394407629` | Merge `743642e` (`2655814` vào `b5c65d2`) | API `18/18` steps `success` (`1m 41s`) + **Full raw log (2,181 dòng, Step 14 = 1,205 dòng)** | **VERIFIED PASS** |
| **PR #1 CI #57 (`Node.js 24.x`)** | `45667750226` / `139394408236` | Merge `743642e` (`2655814` vào `b5c65d2`) | API `18/18` steps `success` (`1m 34s`) + **Full raw log (2,199 dòng)** | **VERIFIED PASS** |
| **SonarCloud Code Analysis (PR `#1`)** | Check `139393798648` | `2655814ce8dd899e81343b596c8018ca02b18f99` | Check Run API + SonarCloud API (`Quality Gate passed`, `0` issues, `0` hotspots, `2.0%` duplication) | **VERIFIED PASS** |

### Giải thích cấu trúc Steps trong GitHub Actions Jobs API
- Mỗi Job trong 4 Job trên trả về đúng **18 Step objects** từ GitHub Actions API (`0` failed, `0` skipped, `0` cancelled, `0` timed out) — không gọi 18 steps này là 29 steps.
- Các số thứ tự tồn tại thực tế là **`1..14`** (`Set up job`, `Initialize containers`, 12 workflow steps từ `Checkout repository` tới `Run Complete Test Suite Unified Check (npm run test:all)`) và **`26..29`** (`Post Setup Node.js`, `Post Checkout repository`, `Stop containers`, `Complete job`).
- **Steps `15..25` không tồn tại** trong dữ liệu API của 4 Job hay trong `.github/workflows/ci.yml`; đây chỉ là khoảng trống đánh số slot nội bộ của GitHub Actions Runner, không phải bước bị skip hoặc bỏ sót.

### Chi tiết từng nhóm kiểm thử đã xác minh (từ Zero-DB + Raw Stdout Step 14 của cả 4 Job)
- **Zero-DB validation (trực tiếp local trước push `2655814`):**
  - `node --check tests/test_loyalty_cycle_integration.js`: exit `0`
  - `node tests/test_loyalty_cycle_unit.js`: `44 passed, 0 failed`
  - `node tests/test_db_guard.js`: `13/13 TESTS PASSED`
  - `git diff --check`: exit `0`
- **Raw stdout Step 14 (`npm run test:all`) khớp đồng nhất trên cả 4 Job (`139393147845`, `139393147222`, `139394407629`, `139394408236`) trên SQL Server 2022 (`vamos_store_test_db`):**
  - `validate_pug.js`: `All 41 templates compiled successfully with zero syntax errors.`
  - `test_validator.js`: `29 PASSED, 0 FAILED`
  - `test_db_guard.js`: `ALL 13/13 TESTS PASSED PERFECTLY!`
  - `test_loyalty_cycle_unit.js`: `Summary: 44 passed, 0 failed`
  - `setup_test_db.js` (Migrations `001`–`006` + idempotency + 40 sản phẩm mẫu): `Total tables in "vamos_store_test_db": 28`
  - `test_auth_flow.js`: `ALL 10 TESTS COMPLETED SUCCESSFULLY`
  - `test_phase1..6`: `11 PASSED`, `7 PASSED`, `8 PASSED`, `8 PASSED`, `7 PASSED`, `3 PASSED` (0 FAILED)
  - `test_phase7_browser_matrix.js` (Playwright Chromium): **`11 PASSED, 0 FAILED`**
  - `test_live_search.js`: `8 PASSED, 0 FAILED`
  - `test_audit_fixes.js`: `15 PASSED, 0 FAILED`
  - `test_loyalty_module.js`: **`ALL 29/29 TESTS PASSED PERFECTLY!`**
  - `test_loyalty_cycle_integration.js`: **`Summary: 7 passed, 0 failed`** (`INT-07`, `INT-01`, `INT-02`, `INT-03`, **`INT-04`**, `INT-05`, `INT-06` đều `PASS`)
  - `regression_suite.js`: **`TEST EXECUTION SUMMARY: 118 PASSED, 0 FAILED`**
- **Ranh giới an toàn:** Không merge PR `#1` (vẫn `Draft`), không deploy production, không chạy migration/backfill/worker trên DB thật hoặc production.

---

## D. KẾT LUẬN

**`INT04_FIXED — CI PASS`**
