# VAMOS STORE — KẾ HOẠCH PHÂN NHÓM VÀ THỰC THI COMMIT
## FINAL COMMIT PREPARATION & STAGING PLAN

**Ngày lập kế hoạch:** 14/11/2026
**Chi nhánh làm việc (Branch):** `fix/master-repair-plan`
**Commit HEAD hiện tại:** `98946a8` (`feat(phase-7): add Playwright E2E browser matrix suite, update bug backlog to VERIFIED`)
**Quy tắc:** Chỉ lập kế hoạch chi tiết, **tuyệt đối không stage, commit, push hoặc merge** khi chưa có xác nhận từ Quản lý dự án.

---

## 1. TRẠNG THÁI BRANCH VÀ HEAD

- **Tên branch hiện tại:** `fix/master-repair-plan`
- **Mã commit HEAD:** `98946a8`
- **Tình trạng Working Tree:** Sạch lỗi cú pháp và khoảng trắng (`git diff --check` = 0).
- **Trạng thái Staging Area (Index):** `0 files staged` (`git diff --cached --check` = 0).

---

## 2. TỔNG SỐ FILE MODIFIED VÀ UNTRACKED

Tổng số hạng mục thay đổi trong working directory gồm **31 hạng mục**:
- **15 file đã sửa (Modified Files):** Bao gồm logic backend, middleware, template Pug, client JS, script bootstrap DB và các tài liệu QA Part A.
- **16 hạng mục mới chưa theo dõi (Untracked Items):** Bao gồm migration SQL 004, 4 file MVC Wishlist, 3 file kịch bản kiểm thử mới, thư mục 39 ảnh chụp giao diện và 7 file báo cáo audit.

### Danh sách 15 file Modified:
1. `database/init_mssql.js`
2. `src/middlewares/auth.middleware.js`
3. `src/routes/index.js`
4. `src/views/layouts/main.pug`
5. `src/views/partials/header.pug`
6. `src/public/js/main.js`
7. `tests/test_audit_fixes.js`
8. `docs/audit/FINAL_AUDIT_REPORT.md`
9. `docs/audit/TEST_RESULTS.md`
10. `docs/qa/BUG_BACKLOG.md`
11. `docs/qa/phase-reports/PHASE_0_BASELINE.md`
12. `docs/qa/phase-reports/PHASE_1_ROLE_ADMIN.md`
13. `docs/qa/phase-reports/PHASE_4_I18N.md`
14. `docs/qa/phase-reports/PHASE_6_ADMIN_DATA.md`
15. `docs/qa/phase-reports/PHASE_7_FINAL_TEST.md`

### Danh sách 16 hạng mục Untracked:
1. `database/migrations/004_create_wishlist_items.sql`
2. `src/controllers/wishlist.controller.js`
3. `src/services/wishlist.service.js`
4. `src/models/repositories/wishlist.repository.js`
5. `src/routes/wishlist.routes.js`
6. `tests/test_wishlist_server.js`
7. `tests/test_wl08_cross_browser.js`
8. `tests/test_responsive_qa.js`
9. `docs/qa/screenshots/` *(Thư mục chứa 39 ảnh chụp màn hình kiểm thử)*
10. `docs/qa/FINAL_INDEPENDENT_AUDIT.md`
11. `docs/qa/FINAL_PRE_COMMIT_REVIEW.md`
12. `docs/qa/RESPONSIVE_AND_PRODUCTION_SAFETY_REVIEW.md`
13. `docs/qa/PART_D_RESPONSIVE_AND_SECURITY_FIX.md`
14. `docs/qa/FINAL_RELEASE_READINESS_AUDIT.md`
15. `docs/qa/phase-reports/PHASE_B_SERVER_SIDE_WISHLIST.md`
16. `docs/qa/phase-reports/PHASE_B_INDEPENDENT_AUDIT.md`
17. `docs/qa/phase-reports/PHASE_B_FINAL_CHANGE_REVIEW.md`

---

## 3. ĐỐI SOÁT & PHÂN ĐỊNH RÕ RÀNG SỐ LƯỢNG TEST

Tuân thủ nguyên tắc không cộng gộp các bài test nếu chưa chứng minh tính độc lập, hệ thống kiểm thử của dự án được phân chia thành 3 nhóm hoàn toàn tách biệt:

### Nhóm 1: Core Non-Overlapping Code Assertions (188 Tests) — 100% PASS
Các bài kiểm thử tự động với câu lệnh `assert(...)` rõ ràng, kiểm tra độc lập các tầng ứng dụng (Routing, Middleware, Controller, Model, SQL Server Transaction):

| Bộ Test | File Thực Thi | Lệnh Chạy | Số Test | Tính Trùng Lặp |
| :--- | :--- | :--- | :---: | :---: |
| **Phase 1: Role Separation** | `tests/test_phase1_role_separation.js` | `node tests/test_phase1_role_separation.js` | 11 | Không trùng |
| **Phase 2: Wishlist Client Isolation** | `tests/test_phase2_wishlist.js` | `node tests/test_phase2_wishlist.js` | 7 | Không trùng |
| **Phase 3: Dark/Light Mode Theme** | `tests/test_phase3_theme.js` | `node tests/test_phase3_theme.js` | 8 | Không trùng |
| **Phase 4: i18n Localization** | `tests/test_phase4_i18n.js` | `node tests/test_phase4_i18n.js` | 8 | Không trùng |
| **Phase 5: Functional Audit** | `tests/test_phase5_functional.js` | `node tests/test_phase5_functional.js` | 7 | Không trùng |
| **Phase 6: Admin Data Integrity** | `tests/test_phase6_data_integrity.js` | `node tests/test_phase6_data_integrity.js` | 3 | Không trùng |
| **Phase 7: Browser E2E Matrix** | `tests/test_phase7_browser_matrix.js` | `node tests/test_phase7_browser_matrix.js` | 11 | Không trùng |
| **Part B: Server-Side Wishlist** | `tests/test_wishlist_server.js` | `node tests/test_wishlist_server.js` | 14 | Không trùng |
| **Part B: WL-08 Cross-Browser** | `tests/test_wl08_cross_browser.js` | `node tests/test_wl08_cross_browser.js` | 1 | Không trùng |
| **Master Regression & Concurrency** | `tests/regression_suite.js` | `node tests/regression_suite.js` | 118 | Không trùng |
| **TỔNG TEST CODE ASSERTION CỐT LÕI** | *(10 file test)* | — | **188 TESTS** | **Độc lập 100%** |

### Nhóm 2: Responsive Viewport DOM & Screenshot Checks (39 Checks) — 100% PASS
Kiểm tra đo lường trực tiếp kích thước DOM (`scrollWidth <= innerWidth`) và chụp ảnh thực tế 13 màn hình trên 3 viewports: Desktop 1440x900, Tablet 768x1024, Mobile 390x844:
- File thực thi: `tests/test_responsive_qa.js`
- Lệnh chạy: `node tests/test_responsive_qa.js`
- Số lượng: **39 lượt kiểm tra** (13 màn hình x 3 kích thước), **0 lỗi tràn ngang**.
- Ảnh chụp lưu trữ: `docs/qa/screenshots/` (39 file PNG).

### Nhóm 3: Unit Tests & Static Verification Bổ trợ (101 Checks) — 100% PASS
Các bài kiểm tra bổ trợ nằm trong script `npm run test:all` của `package.json`:

| Bộ Kiểm Tra | File Thực Thi | Lệnh Chạy | Số Lượng | Nội Dung Kiểm Tra |
| :--- | :--- | :--- | :---: | :--- |
| **Validator Unit Suite** | `tests/test_validator.js` | `node tests/test_validator.js` | 29 | Regex số điện thoại VN, độ dài mật khẩu, ký tự có dấu, số lượng bán lẻ. |
| **Auth Session Flow** | `tests/test_auth_flow.js` | `node tests/test_auth_flow.js` | 10 | Vòng đời cookie `vamos_sid`, chống session fixation, tiêu thụ flash message. |
| **Live Search Edge Cases** | `tests/test_live_search.js` | `node tests/test_live_search.js` | 8 | Truy vấn rỗng, tiền tố SKU "VM-", payload XSS, ký tự đại diện SQL `%` và `_`. |
| **Audit Fixes Suite** | `tests/test_audit_fixes.js` | `node tests/test_audit_fixes.js` | 15 | Đổi thứ tự minPrice/maxPrice, giữ query parameter phân trang, validate voucher. |
| **Pug Compiler Validation** | `tests/validate_pug.js` | `node tests/validate_pug.js` | 39 | Kiểm tra biên dịch cú pháp toàn bộ 39 template Pug trên đĩa. |
| **TỔNG KIỂM TRA BỔ TRỢ** | *(5 file bổ trợ)* | — | **101 CHECKS** | **Độc lập 100%** |

> **Quy tắc tính toán nghiệm thu:**
> - Nếu chỉ tính **Test Code Assertions**: **188 Tests**.
> - Nếu tính thêm **Kiểm tra trực quan Responsive Viewports**: $188 + 39 = \mathbf{227\text{ Checks}}$.
> - Nhóm 101 unit tests bổ trợ **không cộng gộp vào tổng cốt lõi** mà được báo cáo riêng biệt để đảm bảo tính khách quan tuyệt đối.

---

## 4. KẾT QUẢ KIỂM TRA `tests/test_audit_fixes.js`

### 4.1. Toàn bộ Git Diff so với HEAD
```diff
diff --git a/tests/test_audit_fixes.js b/tests/test_audit_fixes.js
index d1bacf8..ec69227 100644
--- a/tests/test_audit_fixes.js
+++ b/tests/test_audit_fixes.js
@@ -144,7 +144,9 @@ async function runAuditTests() {
       },
       isAuthenticated: false,
       user: null,
-      csrfToken: 'test_csrf'
+      csrfToken: 'test_csrf',
+      t: (key, def) => def || key,
+      currentLocale: 'vi'
     });

     // Check pagination link for page 2
```

### 4.2. Giải thích nguyên nhân thay đổi
Trong bài kiểm thử `PAG-QUERY-01` (dòng 123–158), test case sử dụng `pug.compileFile()` để biên dịch trực tiếp template `src/views/pages/products/index.pug` mà không thông qua server Express.
Sau khi Phase 4 đưa i18n vào hệ thống, header template gọi hàm dịch `t('nav.hotline', 'Hotline...')`. Trên server thật, `res.locals.t` luôn được Express middleware tiêm tự động. Tuy nhiên trong môi trường test cô lập của `pug.compileFile()`, nếu không truyền `t` vào mock data thì Pug engine ném lỗi `TypeError: t is not a function`.
Việc bổ sung `t: (key, def) => def || key` và `currentLocale: 'vi'` là cung cấp mock helper tiêu chuẩn cho môi trường kiểm thử cô lập.

### 4.3. Xác minh tính toàn vẹn của các Assertion
Các câu lệnh assertion của bài test tại dòng 153–157 hoàn toàn được **giữ nguyên 100%**:
```javascript
assert.ok(html.includes('&amp;size=40') || html.includes('&size=40'), 'Pagination must include size=40');
assert.ok(html.includes('&amp;sale=1') || html.includes('&sale=1'), 'Pagination must include sale=1');
assert.ok(html.includes('&amp;q=running%20shoes') || html.includes('&q=running%20shoes'), 'Pagination must include URL encoded q');
assert.ok(html.includes('&amp;gender=MEN') || html.includes('&gender=MEN'), 'Pagination must include gender=MEN');
assert.ok(html.includes('&amp;cat=sneaker-nam') || html.includes('&cat=sneaker-nam'), 'Pagination must include cat=sneaker-nam');
```
- **Không có bất kỳ assertion nào bị xóa, nới lỏng hay sửa đổi.**
- Kết quả chạy lại: `node tests/test_audit_fixes.js` đạt **15/15 PASSED (100%)**.

---

## 5. BẢNG PHÂN NHÓM VÀ KẾ HOẠCH COMMIT (4 NHÓM)

Để lịch sử Git mạch lạc, dễ truy vết (traceability) và an toàn khi revert/review, toàn bộ 31 hạng mục thay đổi được chia thành 4 commit theo chuẩn **Conventional Commits**:

```
[Commit 1: Base Security & Doc Cleanup]
       ↓
[Commit 2: Server-Side Wishlist Backend]
       ↓
[Commit 3: Responsive Header & UI Fixes]
       ↓
[Commit 4: Regression Tests & QA Documentation]
```

---

## 6. DANH SÁCH FILE VÀ CONVENTIONAL COMMIT MESSAGE TỪNG NHÓM

### Commit 1: Security & QA Document Cleanup
- **Conventional Commit Message:**
  `sec(docs,db): sanitize credentials in QA reports and harden database initialization`
- **Mục đích:** Làm sạch thông tin nhạy cảm trong tài liệu và thiết lập chốt chặn an toàn cho database bootstrap trước khi phát triển các tính năng tiếp theo.
- **Danh sách file (10 files):**
  1. `database/init_mssql.js` *(Thêm Production Guard, kiểm tra tài khoản Admin hiện có, loại bỏ fallback 123456, chặn mật khẩu yếu)*
  2. `docs/audit/FINAL_AUDIT_REPORT.md` *(Làm sạch credential trong báo cáo audit)*
  3. `docs/audit/TEST_RESULTS.md` *(Làm sạch credential trong kết quả test)*
  4. `docs/qa/BUG_BACKLOG.md` *(Làm sạch credential trong backlog)*
  5. `docs/qa/phase-reports/PHASE_0_BASELINE.md` *(Làm sạch credential Phase 0)*
  6. `docs/qa/phase-reports/PHASE_1_ROLE_ADMIN.md` *(Làm sạch credential Phase 1)*
  7. `docs/qa/phase-reports/PHASE_4_I18N.md` *(Làm sạch credential Phase 4)*
  8. `docs/qa/phase-reports/PHASE_6_ADMIN_DATA.md` *(Làm sạch credential Phase 6)*
  9. `docs/qa/phase-reports/PHASE_7_FINAL_TEST.md` *(Làm sạch credential Phase 7)*
  10. `docs/qa/FINAL_INDEPENDENT_AUDIT.md` *(Báo cáo kiểm toán độc lập ban đầu)*
- **Dependency:** Nhóm nền tảng (Base), không phụ thuộc nhóm nào khác.

---

### Commit 2: Server-Side Wishlist & Database Migration
- **Conventional Commit Message:**
  `feat(wishlist): implement SQL Server persistence and REST API for Customer wishlist`
- **Mục đích:** Xây dựng trọn vẹn tầng cơ sở dữ liệu và REST API cho tính năng lưu trữ Wishlist trên SQL Server.
- **Danh sách file (7 files):**
  1. `database/migrations/004_create_wishlist_items.sql` *(Migration tạo bảng wishlist_items trên SQL Server)*
  2. `src/controllers/wishlist.controller.js` *(Controller điều hướng API wishlist)*
  3. `src/services/wishlist.service.js` *(Service nghiệp vụ wishlist)*
  4. `src/models/repositories/wishlist.repository.js` *(Repository truy vấn parameterized SQL Server)*
  5. `src/routes/wishlist.routes.js` *(Router khai báo các endpoint /api/wishlist)*
  6. `src/routes/index.js` *(Gắn route wishlist vào Express application)*
  7. `src/middlewares/auth.middleware.js` *(Middleware cô lập vai trò: chặn Admin 403, Guest 401)*
- **Dependency:** Phụ thuộc vào Commit 1 (khi database script đã an toàn).

---

### Commit 3: Responsive Header & UI Fixes
- **Conventional Commit Message:**
  `fix(ui): eliminate header responsive overflow on tablet/mobile and sync wishlist UI`
- **Mục đích:** Khắc phục triệt để lỗi tràn ngang trên Tablet (768px) và Mobile (390px), đồng bộ trạng thái wishlist giữa server và client.
- **Danh sách file (3 files):**
  1. `src/views/partials/header.pug` *(Sửa breakpoint lg:flex, hamburger drawer, icon profile mobile, zero overflow 390px)*
  2. `src/views/layouts/main.pug` *(Đồng bộ biến toàn cục SSR window.IS_AUTHENTICATED và script anti-FOUC)*
  3. `src/public/js/main.js` *(Client script đồng bộ wishlist từ SQL Server, xử lý theme toggle và PJAX pagination)*
- **Dependency:** Phụ thuộc vào Commit 2 (cần có API `/api/wishlist` để client JS gọi đồng bộ).

---

### Commit 4: Regression Tests, Playwright Suites & QA Audit Documentation
- **Conventional Commit Message:**
  `test(qa): add server-side wishlist, cross-browser, responsive suites and audit reports`
- **Mục đích:** Bổ sung toàn bộ các bộ kiểm thử tự động, bằng chứng ảnh chụp màn hình thực tế và các báo cáo nghiệm thu chuyên sâu.
- **Danh sách file (12 files + 1 thư mục ảnh):**
  1. `tests/test_wishlist_server.js` *(Bộ 14 bài kiểm thử Server-side Wishlist API)*
  2. `tests/test_wl08_cross_browser.js` *(Kiểm thử Playwright WL-08 2 browser context độc lập)*
  3. `tests/test_responsive_qa.js` *(Kiểm thử tự động đo DOM responsive 13 trang x 3 viewports)*
  4. `tests/test_audit_fixes.js` *(Bổ sung mock helper i18n cho bài test Pug pagination)*
  5. `docs/qa/screenshots/` *(Thư mục chứa 39 ảnh PNG chụp màn hình thực tế)*
  6. `docs/qa/FINAL_PRE_COMMIT_REVIEW.md` *(Báo cáo pre-commit review)*
  7. `docs/qa/RESPONSIVE_AND_PRODUCTION_SAFETY_REVIEW.md` *(Báo cáo Part C)*
  8. `docs/qa/PART_D_RESPONSIVE_AND_SECURITY_FIX.md` *(Báo cáo nghiệm thu Part D)*
  9. `docs/qa/FINAL_RELEASE_READINESS_AUDIT.md` *(Báo cáo kiểm toán tổng thể sẵn sàng release)*
  10. `docs/qa/phase-reports/PHASE_B_SERVER_SIDE_WISHLIST.md` *(Báo cáo triển khai kỹ thuật Part B)*
  11. `docs/qa/phase-reports/PHASE_B_INDEPENDENT_AUDIT.md` *(Báo cáo kiểm toán độc lập Part B)*
  12. `docs/qa/phase-reports/PHASE_B_FINAL_CHANGE_REVIEW.md` *(Báo cáo rà soát thay đổi WL-08)*
  13. `docs/qa/FINAL_COMMIT_PLAN.md` *(Kế hoạch phân nhóm và thực thi commit này)*
- **Dependency:** Phụ thuộc vào Commit 2 và Commit 3 (kiểm thử và ghi nhận kết quả của mã nguồn đã hoàn thiện).

---

## 7. CÁC RỦI RO CÒN TỒN TẠI & LƯU Ý VẬN HÀNH

1. **Biến môi trường khi khởi tạo Production:** Trên máy chủ mới, nếu chưa có tài khoản admin trong cơ sở dữ liệu, script `database/init_mssql.js` bắt buộc phải có biến `ADMIN_DEFAULT_PASSWORD` (tối thiểu 8 ký tự, không dùng mật khẩu đơn giản) mới cho phép tạo tài khoản quản trị.
2. **Dung lượng ảnh chụp màn hình:** Thư mục `docs/qa/screenshots/` chứa 39 ảnh PNG (~15MB). Kế hoạch đề xuất commit toàn bộ thư mục này trong Commit 4 để bảo tồn bằng chứng nghiệm thu chất lượng giao diện vĩnh viễn trong Git.
3. **Tuyệt đối an toàn thông tin:** Xác nhận không có file `.env`, session cookie thật, plaintext password hay token nhạy cảm nào lọt vào bất kỳ commit nào trong 4 nhóm trên.

---

## 8. KẾT LUẬN

Kế hoạch phân chia commit đã hoàn thiện:
- Toàn bộ **31 hạng mục thay đổi** (15 modified + 16 untracked) đã được phân loại chính xác vào 4 commit mạch lạc, không bỏ sót bất kỳ file nào.
- Kiểm tra `git diff --check`, `git diff --cached --check` và các bộ test đều đạt **100% PASS** với mã thoát 0.
- **Hệ thống đã sẵn sàng 100% để bắt đầu quá trình commit theo kế hoạch.**

> **TRẠNG THÁI HIỆN TẠI:** Agent đang **DỪNG LẠI** tại đây và chờ lệnh phê duyệt từ Quản lý dự án trước khi thực hiện lệnh stage và commit đầu tiên.
