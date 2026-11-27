# VAMOS CLUB — INT-04 DOCUMENTATION AUDIT & REPOSITORY CLEANUP REVIEW

> **Repository:** `dungtttd01702-coder/vamos-store`
> **Branch:** `fix/master-repair-plan`
> **HEAD kiểm toán:** `2655814ce8dd899e81343b596c8018ca02b18f99`
> **Chế độ thực hiện:** **READ-ONLY AUDIT** (không sửa source, không sửa test, không sửa 2 báo cáo được kiểm toán, không stage/commit/push, không merge PR `#1`, không chạy migration/backfill).

---

## 1. GIT STATE VÀ COMMIT SHA

| Hạng mục | Giá trị thực tế quan sát | Phân loại |
| :--- | :--- | :---: |
| `git branch --show-current` | `fix/master-repair-plan` | **VERIFIED** |
| `git rev-parse HEAD` | `2655814ce8dd899e81343b596c8018ca02b18f99` | **VERIFIED** |
| `git ls-remote origin refs/heads/fix/master-repair-plan` | `2655814ce8dd899e81343b596c8018ca02b18f99` (khớp local HEAD) | **VERIFIED** |
| `git diff --check` | Exit code `0` (không có thay đổi tracked unstaged) | **VERIFIED** |
| `git diff --cached --check` | Exit code `0` (không có staged changes) | **VERIFIED** |
| Lịch sử 3 commit gần nhất | `2655814` (1 file `tests/test_loyalty_cycle_integration.js`, `+56/-2`) → `d7a8510` (25 files, `+4509/-237`) → `c0e2424` (9 files, `+450/-157`) | **VERIFIED** |
| Untracked files (`git status --short --untracked-files=all`) | Trước kiểm toán: `docs/loyalty/VAMOS_CLUB_STAGE_2_COMMIT_PUSH_CI_REPORT.md` và `docs/loyalty/VAMOS_CLUB_INT04_FIX_CI_REPORT.md`; sau khi tạo báo cáo này có thêm `docs/loyalty/VAMOS_CLUB_INT04_DOCUMENTATION_AUDIT.md`. | **VERIFIED** |
| PR `#1` state (GitHub API) | `state: open`, `draft: true`, `base: main`, `head_sha: 2655814ce8dd899e81343b596c8018ca02b18f99`, `mergeable: true`, `mergeable_state: clean` | **VERIFIED** |

---

## 2. PUSH CI VERIFICATION (`45667394348`)

- **Workflow:** `VAMOS STORE CI` (`run_number: 56`, `event: push`, `head_branch: fix/master-repair-plan`, `head_sha: 2655814ce8dd899e81343b596c8018ca02b18f99`)
- **Status / Conclusion:** `completed` / **`success`**
- **Jobs:**
  - `Build & Test (Node.js 24.x)` (`139393147222`, `head_sha: 2655814...`): `completed` / **`success`** (`17:41:28Z` → `17:43:12Z`, 1m 44s).
  - `Build & Test (Node.js 22.x)` (`139393147845`, `head_sha: 2655814...`): `completed` / **`success`** (`17:41:27Z` → `17:42:57Z`, 1m 30s).
- **Trạng thái kiểm chứng:** **VERIFIED** (cả GitHub Actions API lẫn trích đoạn stdout Step 14 của Job `139393147222` cho `test_loyalty_cycle_unit` `44/44`, `setup_test_db` `28` tables / migrations `001..006`, `test_phase7_browser_matrix` `11/11`, `test_loyalty_module` `29/29`, `test_loyalty_cycle_integration` `7/7` gồm `INT-04`, `regression_suite` `118/118`). Lưu ý riêng cho stdout bên trong Step 14 của Job `139393147845` (`Node.js 22.x`): xem mục 4 & mục 7.

---

## 3. PULL REQUEST CI VERIFICATION (`45667750226`)

- **Workflow:** `VAMOS STORE CI` (`run_number: 57`, `event: pull_request`, `PR #1`, `head_branch: fix/master-repair-plan`, `head_sha: 2655814ce8dd899e81343b596c8018ca02b18f99`)
- **Status / Conclusion:** `completed` / **`success`**
- **Jobs:**
  - `Build & Test (Node.js 22.x)` (`139394407629`, `head_sha: 2655814...`): `completed` / **`success`** (`17:43:31Z` → `17:45:12Z`, 1m 41s).
  - `Build & Test (Node.js 24.x)` (`139394408236`, `head_sha: 2655814...`): `completed` / **`success`** (`17:43:31Z` → `17:45:05Z`, 1m 34s).
- **Trạng thái kiểm chứng:** **VERIFIED** (GitHub Actions API xác nhận cả 2 job `completed / success` trên đúng SHA `2655814ce8dd899e81343b596c8018ca02b18f99`; trích đoạn stdout Step 14 của Job `139394408236` xác nhận `test_loyalty_cycle_integration` `7/7` PASS và `regression_suite` `118/118` PASS).

---

## 4. KIỂM TRA ĐẦY ĐỦ CÁC STEPS CỦA TỪNG JOB & GIẢI THÍCH `15..25`

### 4.1. Thống kê Steps trực tiếp từ GitHub Actions Jobs API

| Run / Commit | Job (Node.js) | Tổng Steps trong API | Số thứ tự tồn tại | `success` | `failure` | `skipped` | `cancelled` | `timed_out` | Phân loại |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `45661600384` (`d7a8510`, push) | `139372608896` (24.x) | `18` | `1..14`, `26..29` | `16` | `1` (Step 14) | `1` (Step 26) | `0` | `0` | **VERIFIED** |
| `45661600384` (`d7a8510`, push) | `139372609568` (22.x) | `18` | `1..14`, `26..29` | `16` | `1` (Step 14) | `1` (Step 26) | `0` | `0` | **VERIFIED** |
| `45661632011` (`d7a8510`, PR) | `139372712531` (24.x) | `18` | `1..14`, `26..29` | `16` | `1` (Step 14) | `1` (Step 26) | `0` | `0` | **VERIFIED** |
| `45661632011` (`d7a8510`, PR) | `139372713187` (22.x) | `18` | `1..14`, `26..29` | `16` | `1` (Step 14) | `1` (Step 26) | `0` | `0` | **VERIFIED** |
| `45667394348` (`2655814`, push) | `139393147222` (24.x) | `18` | `1..14`, `26..29` | **`18`** | `0` | `0` | `0` | `0` | **VERIFIED** |
| `45667394348` (`2655814`, push) | `139393147845` (22.x) | `18` | `1..14`, `26..29` | **`18`** | `0` | `0` | `0` | `0` | **VERIFIED** |
| `45667750226` (`2655814`, PR) | `139394407629` (22.x) | `18` | `1..14`, `26..29` | **`18`** | `0` | `0` | `0` | `0` | **VERIFIED** |
| `45667750226` (`2655814`, PR) | `139394408236` (24.x) | `18` | `1..14`, `26..29` | **`18`** | `0` | `0` | `0` | `0` | **VERIFIED** |

### 4.2. Danh sách nguyên văn 18 Steps của từng Job trên `45667394348` & `45667750226`
1. `Set up job` — `completed / success`
2. `Initialize containers` — `completed / success`
3. `Checkout repository` — `completed / success`
4. `Setup Node.js <22.x|24.x>` — `completed / success`
5. `Install dependencies` — `completed / success`
6. `Install Playwright Chromium browser` — `completed / success`
7. `Verify Pug template compilation` — `completed / success`
8. `Build Tailwind CSS` — `completed / success`
9. `Run Validator Unit Tests` — `completed / success`
10. `Bootstrap Test Database & Seed Fixtures` — `completed / success`
11. `Run Auth Flow & Session Verification Tests` — `completed / success`
12. `Run Real-time Live Search & Security API Tests` — `completed / success`
13. `Run Full Regression & Integration Test Suite` — `completed / success`
14. `Run Complete Test Suite Unified Check (npm run test:all)` — `completed / success`
26. `Post Setup Node.js <22.x|24.x>` — `completed / success`
27. `Post Checkout repository` — `completed / success`
28. `Stop containers` — `completed / success`
29. `Complete job` — `completed / success`

### 4.3. Kết luận về Steps `15..25`
- **Steps `15..25` KHÔNG tồn tại** trong dữ liệu Job của GitHub Actions API (`steps.length = 18`, không có bất kỳ đối tượng nào mang `number` từ `15` đến `25`), và cũng **không tồn tại** trong `.github/workflows/ci.yml` (workflow chỉ có đúng 12 step người dùng từ `Checkout repository` ở #3 đến `npm run test:all` ở #14).
- Khoảng nhảy từ `#14` sang `#26` là cơ chế đánh số nội bộ của GitHub Actions Runner (dành trước slot cho các post-action/lifecycle ứng với chuỗi bước trong job trước khi đánh số `Post Setup Node.js` ở `#26`). Không có bước nào bị ẩn, bị lược bỏ khi báo cáo, hoặc bị skip âm thầm. (**VERIFIED**)

---

## 5. SONARCLOUD VERIFICATION

- **GitHub Check Run (`2655814ce8dd899e81343b596c8018ca02b18f99`):** ID `139393798648`, `SonarCloud Code Analysis` (`app: sonarqubecloud`), `status: completed`, `conclusion: success`, `head_sha: 2655814ce8dd899e81343b596c8018ca02b18f99` (`17:41:44Z` → `17:42:29Z`). (**VERIFIED**)
- **SonarCloud API (`qualitygates/project_status?pullRequest=1`):** `status: OK` với 5 điều kiện đều `OK`:
  - `new_reliability_rating`: `1` (ngưỡng `<= 1`)
  - `new_security_rating`: `1` (ngưỡng `<= 1`)
  - `new_maintainability_rating`: `1` (ngưỡng `<= 1`)
  - `new_duplicated_lines_density`: `2.0%` (ngưỡng `<= 3.0%`)
  - `new_security_hotspots_reviewed`: `100.0%` (ngưỡng `100%`)
- **SonarCloud PR `#1` (`project_pull_requests/list`):** `commit.sha = 2655814ce8dd899e81343b596c8018ca02b18f99`, `bugs: 0`, `vulnerabilities: 0`, `codeSmells: 0`, `issues/search?pullRequest=1&resolved=false` → `total: 0`. (**VERIFIED**)

---

## 6. KIỂM TOÁN BÁO CÁO STAGE 2 (`VAMOS_CLUB_STAGE_2_COMMIT_PUSH_CI_REPORT.md`)

| Mục trong báo cáo Stage 2 | Đối chiếu thực tế | Phân loại |
| :--- | :--- | :---: |
| **A. GIT** (`L11-16`): Branch, HEAD trước (`c0e2424`), Commit `d7a851047913155148acafa1061482c92730f994`, `25 files`, `+4509/-237`, Remote SHA `d7a8510` | Khớp 100% `git log` tại thời điểm `d7a8510`. | **VERIFIED** |
| **A. GIT** (`L17`): Working tree sau push có 1 untracked | Chính xác tại thời điểm viết báo cáo (`d7a8510`), nhưng là **ảnh chụp lịch sử**; hiện tại repository đã lên `2655814` và có thêm báo cáo sau. | **VERIFIED (lịch sử)** / **NEEDS CORRECTION** nếu đọc như trạng thái hiện hành |
| **B. COMMIT SCOPE** (`L21-56`): Liệt kê 25 files | Khớp chính xác 25 files của commit `d7a8510`. | **VERIFIED** |
| **C. PUSH** (`L62-64`): Fast-forward `c0e2424..d7a8510`, Commit URL | Khớp Git history và GitHub. | **VERIFIED** |
| **D. GITHUB ACTIONS** (`L72-86`): Run `45661600384`, `45661632011`, 4 Jobs `failure`, Step 14 `FAIL INT-04` (`'GOLD' !== 'SILVER'`) | Run IDs, Job IDs, và phân tích toán học `INT-04` đều đúng. | **VERIFIED** |
| **D. Chi tiết Step 14** (`L80-86`): Liệt kê PASS chi tiết của mọi script bên trong Step 14 (`validate_pug` .. `test_loyalty_module`, `INT-07..06`) cho `"cả 4 job"` | **Chưa tách phạm vi đọc stdout:** raw stdout Step 14 chỉ được đọc trực tiếp trên `139372608896` (Push 24.x), `139372609568` (Push 22.x) và `139372712531` (PR 24.x); Job `139372713187` (PR 22.x) chỉ xác nhận qua status/annotation `#step:14:494`. | **NEEDS CORRECTION** |
| **E. SONARCLOUD** (`L101-109`): Check `139373533658` (`OK`, `0` issues, `2.0%` duplication, PR `#1`) | Khớp dữ liệu SonarCloud của commit `d7a8510`. Cần chú thích rõ truy vấn `resolved=false` (mục `L106`) phản ánh kết quả trả về cho default component query & PR `#1`, và ở thời điểm hiện tại PR `#1` đã chuyển sang đánh giá commit `2655814`. | **NEEDS CORRECTION** (bổ sung phạm vi query) |
| **F. CHƯA XÁC MINH** (`L117`): Ghi `loyalty:backfill --apply` | **Sai tên npm script:** [package.json:25-26](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/package.json#L25-L26) chỉ có `loyalty:process` và `loyalty:backfill:dry`, không có script `loyalty:backfill` (cờ `--apply` chạy trực tiếp qua `node src/jobs/backfillLoyaltyHistory.js --apply`). | **NEEDS CORRECTION** |
| **G. KẾT LUẬN** (`L123`): `COMMITTED_AND_PUSHED — CI FAILED` | Phản ánh đúng trạng thái của commit `d7a8510` (không nhầm với production). | **VERIFIED (lịch sử `d7a8510`)** |

---

## 7. KIỂM TOÁN BÁO CÁO INT-04 (`VAMOS_CLUB_INT04_FIX_CI_REPORT.md`)

| Mục trong báo cáo INT-04 | Đối chiếu thực tế | Phân loại |
| :--- | :--- | :---: |
| **A. GIT** (`L11-16`): Branch, HEAD trước `d7a8510`, Commit `2655814`, 1 file `+56/-2`, Remote SHA `2655814` | Khớp 100% `git rev-parse`, `git ls-remote`, `git log`. | **VERIFIED** |
| **A. GIT** (`L17`): Working tree ghi có `2` file untracked | Đúng trước khi tạo báo cáo kiểm toán này; hiện tại có `3` file untracked trong `docs/loyalty/`. | **VERIFIED (tại thời điểm tạo)** / **NEEDS CORRECTION** (cập nhật khi chốt) |
| **B. INT-04** (`L23-44`): Chi tiết assertion `2026-06-01` (`GOLD`, cycle 3), `2027-06-01` (`SILVER`, cycle 4), `available_points = 0`, anti-repeat rollover | Code test ở [test_loyalty_cycle_integration.js:347-420](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L347-L420) chứa đúng toàn bộ các assertion này và runner CI in `PASS INT-04`. Tuy nhiên log stdout CI không in từng field riêng lẻ ra màn hình, mà chứng minh gián tiếp bằng kết quả toàn bộ assertion trong `INT-04` đều pass. | **VERIFIED** (qua assertion code + `PASS INT-04` thực tế) |
| **C. Bảng CI** (`L50-54`): Run `45667394348`, `45667750226`, 4 Jobs `success`, SonarCloud `139393798648` `OK`, thời lượng từng job | Khớp 100% API GitHub Actions (`1m 44s`, `1m 30s`, `1m 41s`, `1m 34s`) và SonarCloud API. | **VERIFIED** |
| **C. Bảng CI** (`L52-53`): Ghi `"toàn bộ Steps 1..14 + 26..29 đều completed / success"` | Đúng số liệu nhưng **chưa giải thích lý do vắng `15..25`** (dễ gây hiểu nhầm bỏ qua 11 step). | **NEEDS CORRECTION** |
| **C. Chi tiết nhóm kiểm thử** (`L62-66`): Liệt kê `44/44`, `28 tables`, `11/11`, `29/29`, `7/7`, `118/118` | **Cần minh bạch nguồn log theo từng Job:** Các dòng stdout chi tiết này được trích từ `Node.js 24.x` (Push Job `139393147222` đọc toàn Step 14; PR Job `139394408236` đọc phần `7/7` integration & `118/118` regression). Đối với 2 job `Node.js 22.x` (`139393147845` & `139394407629`), mới xác minh `18/18` steps đều `completed / success` (kể cả Step 13 & 14) qua API + UI checkmark, **chưa đọc raw stdout riêng** (nên phần số dòng stdout chi tiết riêng của 2 job `22.x` xếp loại **UNVERIFIED ở mức log text**, dù trạng thái job & exit code Step 14 = `success` là **VERIFIED**). | **NEEDS CORRECTION** |
| **C. Dòng Playwright** (`L63`): Ghi `"Playwright Chromium (test_phase7_browser_matrix.js & regression_suite.js): 11 PASSED, 0 FAILED"` | **Gộp tên dễ hiểu nhầm:** `11 PASSED, 0 FAILED` chỉ là kết quả của `test_phase7_browser_matrix.js`; `regression_suite.js` có `118 PASSED, 0 FAILED` (tách ở dòng 66). | **NEEDS CORRECTION** |
| **C. Ranh giới an toàn** (`L67`) & **D. Kết luận** (`L73`) | Ranh giới PR Draft / không DB thật / `INT04_FIXED — CI PASS` đều chính xác và không đánh đồng với production deploy. | **VERIFIED** |

---

## 8. TỔNG HỢP ĐIỂM KHÔNG NHẤT QUÁN & ĐỀ XUẤT CHỈNH SỬA (CHƯA TỰ SỬA FILE)

1. **`VAMOS_CLUB_STAGE_2_COMMIT_PUSH_CI_REPORT.md` — `L117`:** Đổi `` `loyalty:backfill --apply` `` thành `` `node src/jobs/backfillLoyaltyHistory.js --apply` `` để khớp tên script trong [package.json:25-26](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/package.json#L25-L26).
2. **`VAMOS_CLUB_STAGE_2_COMMIT_PUSH_CI_REPORT.md` — `L80-86` & `L106`:** Ghi rõ Step 14 stdout chi tiết đã đọc ở 3 job (`139372608896`, `139372609568`, `139372712531`), còn Job `139372713187` xác minh qua annotation/failure `#step:14:494`; đồng thời ghi rõ truy vấn SonarCloud thuộc commit lịch sử `d7a8510` (mặc định component + `pullRequest=1`).
3. **`VAMOS_CLUB_INT04_FIX_CI_REPORT.md` — `L52-53`:** Bổ sung chú thích giải thích khoảng trống số step `15..25` không tồn tại trong GitHub Actions API (`steps.length = 18`: 12 step YAML `#3..#14` + 6 step runner `#1..#2`, `#26..#29`).
4. **`VAMOS_CLUB_INT04_FIX_CI_REPORT.md` — `L62-66`:** Tách rõ: (a) tách dòng `test_phase7_browser_matrix.js` (`11 PASSED, 0 FAILED`) khỏi `regression_suite.js` (`118 PASSED, 0 FAILED`); (b) ghi rõ các số liệu stdout Step 14 được đọc trực tiếp trên 2 job `Node.js 24.x` (`139393147222` & `139394408236`), còn 2 job `Node.js 22.x` (`139393147845` & `139394407629`) được xác minh qua trạng thái `18/18` step `completed / success` trên API + UI.
5. **Trạng thái lịch sử working tree ở cả 2 báo cáo:** Nếu chỉnh sửa và giữ các file báo cáo trong repo, ghi rõ thời điểm chụp working tree của từng báo cáo để không mâu thuẫn với số lượng file untracked sau này.

---

## 9. ĐỀ XUẤT XỬ LÝ HAI FILE UNTRACKED (VÀ FILE AUDIT MỚI)

Hiện tại cả 2 báo cáo cũ (`VAMOS_CLUB_STAGE_2_COMMIT_PUSH_CI_REPORT.md`, `VAMOS_CLUB_INT04_FIX_CI_REPORT.md`) và file kiểm toán này (`VAMOS_CLUB_INT04_DOCUMENTATION_AUDIT.md`) đều đang ở trạng thái **untracked**, còn commit HEAD `2655814` đang giữ đầy đủ dấu tích xanh của GitHub Actions + SonarCloud. Đề xuất 2 phương án để bạn lựa chọn:

- **Phương án A (Khuyến nghị nếu lưu hồ sơ audit trong PR `#1` như 6 báo cáo Stage 2 trước):**
  1. Áp dụng 5 chỉnh sửa mục 8 vào 2 báo cáo (giữ nguyên `VAMOS_CLUB_INT04_DOCUMENTATION_AUDIT.md` làm biên bản đối chiếu hoặc cập nhật ghi chú đã khắc phục).
  2. Chỉ stage 3 file `docs/loyalty/*.md` trong 1 commit tài liệu duy nhất (`docs(loyalty): finalize Stage 2 & INT-04 CI audit reports`), sau đó push và chờ GitHub Actions xác nhận xanh cho commit cuối (lưu ý: theo `.github/workflows/ci.yml`, mọi push lên `fix/**` đều chạy lại full CI, còn SonarCloud bỏ qua `docs/**/*`).
- **Phương án B (Khuyến nghị nếu muốn giữ nguyên `2655814` làm head của PR `#1`):**
  - Không commit các biên bản CI run post-push vào nhánh PR `#1` (tránh vòng lặp "commit báo cáo CI mới -> tạo Run ID mới -> báo cáo lại lệch với HEAD mới"); giữ các file báo cáo này làm tài liệu đối chiếu cục bộ/archive hoặc xóa khỏi workspace sau khi bạn đã nghiệm thu xong.

---

## 10. KẾT LUẬN KIỂM TOÁN BAN ĐẦU (AUDIT TRAIL)

- **Kết quả Git, Commit SHA, Push CI (`45667394348`), PR CI (`45667750226`), Jobs Node.js `22.x`/`24.x` (`18/18 success` mỗi job), Steps `15..25` (không tồn tại trong API/YAML), và SonarCloud (`139393798648`, `OK`):** **VERIFIED**.
- **Chi tiết stdout riêng lẻ bên trong Step 14 của 2 job `Node.js 22.x` (`139393147845`, `139394407629`) và Job `139372713187` (lần fail trước) tại thời điểm audit ban đầu:** **UNVERIFIED ở mức raw text** (chỉ đã xác minh ở mức API conclusion + UI checkmark/annotation — đã được bổ sung xác minh full raw log ở Mục 11 bên dưới).
- **Tính chính xác & trình bày của 2 báo cáo Markdown tại thời điểm audit ban đầu:** **NEEDS CORRECTION** (1 lỗi tên script `loyalty:backfill --apply`, 1 chỗ gộp tên `test_phase7` với `regression_suite` ở `L63`, thiếu giải thích bước nhảy `15..25`, và chưa tách rõ job nào đã đọc stdout vs job nào mới kiểm tra API status).

---

## 11. CẬP NHẬT RE-AUDIT SAU KHI XÁC MINH FULL RAW LOG & CHỈNH SỬA TÀI LIỆU (`2026-11-26 01:35 UTC+7`)

> Mục này bổ sung hồ sơ kiểm chứng tiếp theo (giữ nguyên toàn bộ lịch sử Mục 1–10 ở trên làm audit trail) sau khi truy xuất trực tiếp **View raw logs** trên GitHub cho đủ cả 5 Job được yêu cầu và hiệu chỉnh 2 báo cáo trước khi tạo commit chỉ chứa tài liệu.

### 11.1. Kết quả đối chiếu Raw Logs Step 14 (`npm run test:all`) theo từng Job

| Run / Sự kiện | Job ID | Node.js | Commit SHA trong log / header | Raw stdout đã đọc trực tiếp | Kết quả xác minh |
| :--- | :--- | :---: | :--- | :--- | :--- |
| Push Run `45667394348` (#56) | `139393147845` | `22.x` | `2655814ce8dd899e81343b596c8018ca02b18f99` | Full raw log (2,165 dòng, Step 14 = 1,205 dòng) | **VERIFIED** (`41` pug, `29/29` validator, `13/13` guard, `44/44` unit, `28` tables, `10` auth, `11/7/8/8/7/3/11` phases 1–7, `8` search, `15` audit, `29/29` loyalty, `7/7` cycle integration gồm `INT-04`, `118/118` regression) |
| Push Run `45667394348` (#56) | `139393147222` | `24.x` | `2655814ce8dd899e81343b596c8018ca02b18f99` | Full raw log (2,184 dòng, Step 14 = 1,205 dòng) | **VERIFIED** (đầy đủ toàn bộ 18 script PASS giống `139393147845`, `7/7` cycle integration, `118/118` regression) |
| PR #1 Run `45667750226` (#57) | `139394407629` | `22.x` | Merge `743642e` (`2655814` vào `b5c65d2`) | Full raw log (2,181 dòng, Step 14 = 1,205 dòng) | **VERIFIED** (đầy đủ toàn bộ 18 script PASS, `7/7` cycle integration, `118/118` regression) |
| PR #1 Run `45667750226` (#57) | `139394408236` | `24.x` | Merge `743642e` (`2655814` vào `b5c65d2`) | Full raw log (2,199 dòng) | **VERIFIED** (đầy đủ toàn bộ 18 script PASS, `7/7` cycle integration, `118/118` regression) |
| Historical PR Run `45661632011` (#55) | `139372713187` | `22.x` | Merge `1a1aee4` (`d7a8510` vào `b5c65d2`) | Full raw log (2,005 dòng, Step 14 = 1,028 dòng) | **VERIFIED** (`41` pug .. `29/29` loyalty PASS; `6 passed, 1 failed` với `FAIL INT-04: 'GOLD' !== 'SILVER'`; `regression_suite.js` trong Step 14 không chạy) |
| Historical Push Run `45661600384` (#54) | `139372608896` | `24.x` | `d7a851047913155148acafa1061482c92730f994` | Step 14 stdout (`16` script PASS + error `INT-04`) | **VERIFIED** (`Summary: 6 passed, 1 failed`, `INT-04` FAIL `'GOLD' !== 'SILVER'`) |
| Historical Push `45661600384` / PR `45661632011` | `139372609568` (22.x) & `139372712531` (24.x) | `22.x` / `24.x` | `d7a851047913155148acafa1061482c92730f994` | API `failure` tại Step 14 + tail `INT-04` FAIL; chưa tải full phần đầu Step 14 | **API-CONFIRMED** + Partial stdout (`INT-04` FAIL); phần đầu Step 14 riêng 2 job lịch sử này giữ trạng thái **UNVERIFIED ở mức full raw stdout** |

### 11.2. Giải quyết mâu thuẫn audit trước & Trạng thái các sai lệch đã sửa
- **Giải quyết mâu thuẫn:** Mục 10 trước đây đánh dấu `Node.js 22.x` (`139393147845`, `139394407629`) và Job `139372713187` là `UNVERIFIED` ở mức raw stdout. Sau Bước 2 kiểm tra trực tiếp `/commit/<sha>/checks/<job_id>/logs`, cả 4 Job của commit `2655814` và Job `139372713187` của commit `d7a8510` đều **đã có full raw log xác minh (`VERIFIED`)**. Chỉ còn phần đầu Step 14 của 2 job lịch sử `139372609568` & `139372712531` (`d7a8510`) là giữ trung thực ở mức `API-CONFIRMED` + Partial stdout (`UNVERIFIED` full stdout đầu Step 14).
- **Những sai lệch đã sửa trong `VAMOS_CLUB_STAGE_2_COMMIT_PUSH_CI_REPORT.md`:**
  1. Đổi tham chiếu sai `` `loyalty:backfill --apply` `` thành `` `npm run loyalty:backfill:dry` `` và lệnh trực tiếp `` `node src/jobs/backfillLoyaltyHistory.js --apply` `` (kèm `--confirm-apply` khi ghi DB cô lập theo `src/jobs/backfillLoyaltyHistory.js:281-285`).
  2. Thêm bảng phân tách từng Job (`Run | Job | Node.js | Commit SHA | Raw stdout | Kết quả`) dùng đúng nhãn `VERIFIED` / `API-CONFIRMED`.
  3. Ghi rõ SonarCloud Check `139373533658` thuộc lịch sử `d7a8510`, tách biệt với commit `2655814`.
  4. Gắn timestamp rõ ràng cho ảnh chụp working tree lúc `2026-11-26 00:15 UTC+7`.
- **Những sai lệch đã sửa trong `VAMOS_CLUB_INT04_FIX_CI_REPORT.md`:**
  1. Bổ sung giải thích 18 Step objects (`1..14` và `26..29`), `15..25` không tồn tại trong API/YAML, `0` skipped, không gọi là 29 Steps.
  2. Tách riêng `test_phase7_browser_matrix.js` (`11 PASSED, 0 FAILED`), `regression_suite.js` (`118 PASSED, 0 FAILED`) và `test_loyalty_cycle_integration.js` (`7 PASSED, 0 FAILED`).
  3. Phân tách bảng bằng chứng theo từng Job (`139393147845`, `139393147222`, `139394407629`, `139394408236`) đều **VERIFIED PASS** với raw stdout và commit SHA tương ứng.
  4. Ghi rõ timestamp chụp Git & trạng thái PR `#1` (`Open`, `Draft`), commit `INT-04` (`2655814ce8dd899e81343b596c8018ca02b18f99`) giữ nguyên vẹn, toàn bộ chỉnh sửa chỉ thuộc tài liệu.

### 11.3. Trạng thái sẵn sàng cho Docs-Only Commit
- Chỉ có đúng 3 file Markdown trong `docs/loyalty/` được phép đưa vào commit tài liệu (`VAMOS_CLUB_STAGE_2_COMMIT_PUSH_CI_REPORT.md`, `VAMOS_CLUB_INT04_FIX_CI_REPORT.md`, `VAMOS_CLUB_INT04_DOCUMENTATION_AUDIT.md`). Source code, test logic, migration và database không thay đổi.
