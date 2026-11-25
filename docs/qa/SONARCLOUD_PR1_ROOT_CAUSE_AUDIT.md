# BÁO CÁO ĐIỀU TRA NGUYÊN NHÂN GỐC — SONARCLOUD QUALITY GATE (PR #1)

**Dự án:** VAMOS STORE\
**Repository:** `dungtttd01702-coder/vamos-store`\
**Pull Request:** `#1 — feat: consolidate VAMOS STORE improvements and introduce VAMOS CLUB` (`fix/master-repair-plan` → `main`)\
**Chế độ thực hiện:** **STRICT READ-ONLY AUDIT** (chỉ tạo tài liệu báo cáo này; không sửa source code, không sửa workflow/Sonar config, không thao tác database, không commit/push, giữ nguyên PR `#1` ở trạng thái `Draft`).

---

## 1. Trạng thái Git và Commit được kiểm tra

* **Branch cục bộ hiện tại:** `fix/master-repair-plan`
* **Local `HEAD` SHA:** `3de0f615065cfe9f3ab7f173839fa25249c0c08a` (`fix(tests): clean up inventory transactions before loyalty fixtures`)
* **Remote `origin/fix/master-repair-plan`:** `3de0f615065cfe9f3ab7f173839fa25249c0c08a` (**trùng khớp 100%** với `HEAD`)
* **Remote `origin/main` (PR base):** `b5c65d20dfa81068d0ae355b788fa6852a5aa0ba`
* **Working tree trước khi xuất báo cáo:** Sạch (`0` modified, `0` staged, `0` untracked).
* **Commit được SonarCloud phân tích trên PR #1:** `3de0f615` (`3de0f615065cfe9f3ab7f173839fa25249c0c08a`), phân tích lúc `2026-11-25T04:33:17+0000` (`11:33:17 +07:00`).
* **Cấu hình SonarCloud trong repo:**
  * [.sonarcloud.properties](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/.sonarcloud.properties): `sonar.exclusions=docs/**/*,report/**/*,labs/**/*,scratch/**/*,coverage/**/*`
  * [sonar-project.properties](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/sonar-project.properties): `sonar.sources=src,database`, `sonar.tests=tests`, cùng danh sách `sonar.exclusions`.

---

## 2. Trạng thái Quality Gate (SonarCloud PR #1)

**URL:** `https://sonarcloud.io/summary/new_code?id=dungtttd01702-coder_vamos-store&pullRequest=1`\
**Kết luận tổng thể Quality Gate:** **FAILED** (`3 conditions failed`)\
**Quy mô New Code:** `5,189` New Lines of Code (`5.2k`), `6,808` New Lines (`6.8k`) trên `55` files được tính vào PR.

| Tiêu chí Quality Gate (New Code) | Giá trị đo được | Ngưỡng yêu cầu | Trạng thái | Ghi chú kỹ thuật |
|---|---:|---:|:---:|---|
| **Security Rating** | **C** | **A** | **FAILED** | Có `2` issues tác động Security ở mức **Medium** (legacy `VULNERABILITY` / `MAJOR`). Rating C xuất hiện khi có ít nhất 1 issue Security mức Medium. |
| **Reliability Rating** | **C** | **A** | **FAILED** | Có `9` issues tác động Reliability ở mức **Medium** (`8` legacy `BUG` + `1` legacy `CODE_SMELL`). Rating C xuất hiện khi có ít nhất 1 issue Reliability mức Medium. |
| **Duplications (%)** | **3.4%** (`3.3637%`) | **≤ 3.0%** | **FAILED** | `229` duplicated lines / `11` duplicated blocks trên `6,808` New Lines (`3.5% Estimated after merge`). |
| **Maintainability Rating** | **A** | **A** | **PASSED** | `1` issue (`2min` debt, `0.0%` debt ratio). |
| **Security Hotspots Reviewed** | **100.0%** | **100%** | **PASSED** | `0` Security Hotspots (Security Hotspots đã bị SonarCloud đánh dấu deprecated và chuyển 2 cảnh báo CI thành Security issues tag `former-hotspot`). |
| **Coverage** | *Chưa cấu hình* | Không đặt điều kiện | N/A | `new_lines_to_cover = 0`. |

* **Tổng số New Issues trên New Code:** `11` unique issues (`2h 12min` effort, `0` Accepted issues). *(Issue `javascript:S7773` có đồng thời 2 tác động: Reliability Medium và Maintainability Low, nên tổng tác động = `2 Security + 9 Reliability + 1 Maintainability = 12` từ `11` issues duy nhất.)*
* **Analysis Warning trên SonarCloud:** `"There are problems with file encoding in the source code. Please check the scanner logs for more details."`

---

## 3. Danh sách Security Issues (New Code — Tổng: 2 issues)

> **Ghi nhận quan trọng theo vùng nghiệp vụ:** SonarCloud **không phát hiện bất kỳ Security Issue hay Security Hotspot nào** trong các module ứng dụng thuộc `src/` và `database/` (Authentication, Authorization, Session Management, SQL Parameter Binding, Input Validation, Upload hình ảnh, Voucher Redemption, Loyalty Wallet & Ledger, Order & Inventory, API Admin/Customer). Cả `2/2` Security issues đều nằm trên **cùng 1 dòng lệnh CI** trong `.github/workflows/ci.yml`.

### SEC-SC-01 — `githubactions:S6505`
* **Rule ID / Name:** `githubactions:S6505` — *Unrestricted JavaScript package manager scripts should not be executed during installation*
* **Severity:** Software Quality `Security` — **Medium** (Legacy: `VULNERABILITY` / `MAJOR`, tag `cwe`, `former-hotspot`)
* **File & Dòng:** [.github/workflows/ci.yml#L62](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/.github/workflows/ci.yml#L62)
* **Nội dung issue:** `"npx" can install packages on-demand and run their lifecycle scripts.` (highlight token: `npx playwright`)
* **Code thực tế tại `HEAD`:**
  ```yaml
  61:       - name: Install Playwright Chromium browser
  62:         run: npx playwright install --with-deps chromium
  ```
* **Nguyên nhân kỹ thuật:** Dùng `npx playwright ...` không chặn tải gói từ registry (`--no` / binary nội bộ) khiến `npx` về mặt ngữ nghĩa có thể tải package ngoài ý muốn và chạy lifecycle scripts (`preinstall`/`postinstall`), dù bước trước đó tại [.github/workflows/ci.yml#L59](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/.github/workflows/ci.yml#L59) đã chạy `npm ci --ignore-scripts`.
* **New code hay Old code:** **New Code** (thêm ở commit `6a3ba27`).
* **False positive hay thật?** **Không phải false positive thuần túy — là cảnh báo supply-chain hardening hợp lệ cho CI.** Thực tế [package-lock.json](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/package-lock.json) đã khóa `@playwright/test: 1.65.0` và `playwright: 1.65.0`, nên sau `npm ci --ignore-scripts` thì `npx` sẽ dùng bản local trong `node_modules/.bin/playwright`; tuy nhiên cú pháp `npx playwright` vẫn vi phạm quy tắc static analysis.
* **Tác động thực tế tới ứng dụng VAMOS STORE:** Không ảnh hưởng runtime production của website, nhưng khiến CI thiếu khóa cứng nguồn thực thi binary và làm `Security Rating = C`.
* **Hướng xử lý đề xuất:** Thay `npx playwright install --with-deps chromium` bằng gọi trực tiếp binary đã cài từ `npm ci --ignore-scripts`: `./node_modules/.bin/playwright install --with-deps chromium`.

### SEC-SC-02 — `githubactions:S8543`
* **Rule ID / Name:** `githubactions:S8543` — *JavaScript dependencies should be locked to verified versions*
* **Severity:** Software Quality `Security` — **Medium** (Legacy: `VULNERABILITY` / `MAJOR`)
* **File & Dòng:** [.github/workflows/ci.yml#L62](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/.github/workflows/ci.yml#L62)
* **Nội dung issue:** `Define exact package version to avoid installing unverified releases.` (highlight token: `npx playwright`)
* **Nguyên nhân kỹ thuật:** Gọi `npx playwright` không gắn `@<exact_version>` nên bộ phân tích GitHub Actions của SonarCloud coi đây là lời gọi package chưa ghim phiên bản.
* **New code hay Old code:** **New Code** (thêm ở commit `6a3ba27`).
* **False positive hay thật?** **Cảnh báo hợp lệ ở mức static analysis CI.**
* **Tác động thực tế:** Tương tự `SEC-SC-01`, không ảnh hưởng runtime app, nhưng đánh rớt Security Rating xuống `C`.
* **Hướng xử lý đề xuất:** Sử dụng `./node_modules/.bin/playwright install --with-deps chromium` (đã đối chiếu cục bộ: `node_modules/.bin/playwright` tồn tại sau cài đặt từ `package-lock.json` phiên bản `1.65.0`), giải quyết đồng thời cả `S6505` và `S8543` mà không phụ thuộc `npx`.

---

## 4. Danh sách Reliability Issues (New Code — Tổng: 9 issues)

> Tất cả `9/9` issues đều có tác động Reliability ở mức **Medium** (`8` legacy `BUG` + `1` legacy `CODE_SMELL`), tập trung tại `src/public/js/main.js` (`5` issues) và `tests/test_phase4..7` (`4` issues).

### REL-SC-01 — `javascript:S7773` (`src/public/js/main.js:1356`)
* **Rule ID / Severity:** `javascript:S7773` — Reliability **Medium**, Maintainability **Low** (`CODE_SMELL` / `MINOR`)
* **Vị trí & Code thực tế:** [src/public/js/main.js#L1354-L1357](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/public/js/main.js#L1354-L1357)
  ```js
  const legacyItems = JSON.parse(raw);
  if (Array.isArray(legacyItems) && legacyItems.length > 0) {
    const productIds = legacyItems.map(i => i.id).filter(id => id && !isNaN(id));
  ```
* **Điều kiện kích hoạt:** `localStorage` cũ chứa item có `i.id` là chuỗi khoảng trắng `"   "`, boolean `true`, hoặc chuỗi số thập phân `"1.5"` -> hàm global `isNaN()` ép kiểu ngầm khiến `"   "` và `true` cho `isNaN(...) === false` và lọt qua bộ lọc! *(Lưu ý phản chiếu khi sửa: `Number.isNaN("abc")` lại trả về `false`, nên nếu thay máy móc `!isNaN(id)` thành `!Number.isNaN(id)` sẽ làm lọt chuỗi `"abc"`!)*
* **Hậu quả:** Gửi payload `productIds` không hợp lệ lên `POST /api/wishlist/migrate` (dù server có `wishlistService.migrateLegacyWishlist` bảo vệ).
* **Khả năng tái hiện:** Cao nếu dữ liệu `localStorage` legacy bị chỉnh sửa hoặc lưu kiểu chuỗi/khoảng trắng.
* **Hướng khắc phục an toàn:** Chuẩn hóa số nguyên dương rõ ràng:
  ```js
  const productIds = legacyItems
    .map(i => Number(i && i.id))
    .filter(id => Number.isInteger(id) && id > 0);
  ```
  (Nếu `i.id` là `"12"` → `12` hợp lệ; `"abc"`, `"   "`, `null`, `0`, `-1`, `1.5`, `NaN` đều bị loại, đồng thời bỏ hẳn `isNaN`.)

### REL-SC-02 — `javascript:S9383` (`src/public/js/main.js:1713`)
* **Rule ID / Severity:** `javascript:S9383` — *Promises should not be left unhandled* — Reliability **Medium** (`BUG` / `MAJOR`)
* **Vị trí & Code thực tế:** [src/public/js/main.js#L1709-L1715](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/public/js/main.js#L1709-L1715): gọi `removeWishlistItem(pid);` bên trong click listener đồng bộ.
* **Điều kiện kích hoạt & Hậu quả:** Hàm `async function removeWishlistItem(productId)` ([src/public/js/main.js#L1613-L1644](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/public/js/main.js#L1613-L1644)) đã bọc toàn bộ thân hàm trong `try/catch`, nên ở trạng thái hiện tại ít khả năng throw `unhandledrejection`. Tuy nhiên, nếu sau này có logic thêm trước khối `try` hoặc refactor lại hàm, Promise trả về không có `.catch()` sẽ gây `UnhandledPromiseRejection` âm thầm trên trình duyệt.
* **Khả năng tái hiện:** Thấp ở runtime hiện tại (do có `try/catch` nội bộ), **100%** kích hoạt cảnh báo `S9383` ở static analysis.
* **Hướng khắc phục an toàn:** Gắn handler tại call site: `removeWishlistItem(pid).catch(err => console.error('[Wishlist Remove Error]:', err));` (tường minh và an toàn hơn `void`).

### REL-SC-03 — `javascript:S9383` (`src/public/js/main.js:1720`)
* **Rule ID / Severity:** `javascript:S9383` — Reliability **Medium** (`BUG` / `MAJOR`)
* **Vị trí & Code thực tế:** [src/public/js/main.js#L1718-L1722](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/public/js/main.js#L1718-L1722): gọi `clearAllWishlist();` trong click listener.
* **Đánh giá:** Tương tự `REL-SC-02`, hàm `clearAllWishlist()` ([src/public/js/main.js#L1647-L1677](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/public/js/main.js#L1647-L1677)) có `try/catch` nội bộ, nhưng call site thiếu `.catch(...)`.
* **Hướng khắc phục an toàn:** `clearAllWishlist().catch(err => console.error('[Wishlist Clear Error]:', err));`.

### REL-SC-04 & REL-SC-05 — `javascript:S9383` (`src/public/js/main.js:1744–1746` & `:1745`)
* **Rule ID / Severity:** `javascript:S9383` — Reliability **Medium** (`BUG` / `MAJOR`) × `2` issues
* **Vị trí & Code thực tế:** [src/public/js/main.js#L1743-L1749](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/public/js/main.js#L1743-L1749)
  ```js
  if (window.IS_AUTHENTICATED && window.IS_CUSTOMER) {
    checkAndMigrateLegacyCustomerItems().then(() => {
      fetchServerWishlist();
    });
  }
  ```
* **Điều kiện kích hoạt & Hậu quả:**
  1. Dòng `1745`: `fetchServerWishlist()` trả Promise nhưng **không `return`** khỏi `.then(...)` nên chain không theo dõi được tiến trình hoàn tất của `fetchServerWishlist()`.
  2. Dòng `1744–1746`: Chuỗi `.then(...)` không có `.catch(...)`. Dù cả 2 hàm hiện có `try/catch`, bất kỳ lỗi nào phát sinh trong callback `.then()` hoặc nếu một trong hai hàm bị sửa thiếu `try/catch` đều trở thành `UnhandledPromiseRejection`.
* **Khả năng tái hiện:** Thấp ở runtime hiện tại, nhưng sai cấu trúc Promise chaining.
* **Hướng khắc phục an toàn:**
  ```js
  checkAndMigrateLegacyCustomerItems()
    .then(() => fetchServerWishlist())
    .catch((err) => console.warn('[Wishlist] Initial sync error:', err));
  ```

### REL-SC-06, REL-SC-07, REL-SC-08, REL-SC-09 — `javascript:S9383` (`tests/test_phase4..7`)
* **Rule ID / Severity:** `javascript:S9383` — Reliability **Medium** (`BUG` / `MAJOR`) × `4` issues
* **Danh sách vị trí chính xác:**
  1. `REL-SC-06`: [tests/test_phase4_i18n.js#L170](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase4_i18n.js#L170) — `runTests();`
  2. `REL-SC-07`: [tests/test_phase5_functional.js#L258](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase5_functional.js#L258) — `runTests();`
  3. `REL-SC-08`: [tests/test_phase6_data_integrity.js#L167](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase6_data_integrity.js#L167) — `runTests();`
  4. `REL-SC-09`: [tests/test_phase7_browser_matrix.js#L203](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase7_browser_matrix.js#L203) — `runBrowserMatrix();`
* **Điều kiện kích hoạt lỗi thực tế:** Cả 4 hàm đều thực hiện thao tác bất đồng bộ **trước khối `try/catch`** (`await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))` ở Phase 4/5/6/7, `await chromium.launch(...)` và `await browser.newContext(...)` ở [tests/test_phase7_browser_matrix.js#L34-L42](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase7_browser_matrix.js#L34-L42), hoặc `server.close` trong `finally`). Nếu cổng/socket hoặc Chromium launch thất bại trước `try`, hoặc `loginUser` / `server.close` ném lỗi ở ngoài `try`, Promise trả về bị **unhandled rejection** thay vì log sạch và thoát mã `1`.
* **Khả năng tái hiện:** Cao nếu môi trường thiếu Chromium binary hoặc gặp lỗi khởi tạo server trước `try`.
* **Hướng khắc phục an toàn:** Gắn `.catch(...)` cho lời gọi top-level ở cả 4 file:
  ```js
  runTests().catch((err) => {
    console.error('❌ Fatal test runner error:', err);
    process.exit(1);
  });
  ```
  (Và tương ứng `runBrowserMatrix().catch(...)` cho Phase 7.)

---

## 5. Danh sách Duplicated Blocks (New Code: `3.4%` — `229` lines / `11` blocks)

### Bảng tổng hợp 7 file đóng góp `229` New Duplicated Lines (`6,808` New Lines)

| File | New Duplicated Lines | Blocks | Tỷ lệ trên file | Nguồn trùng lặp |
|---|---:|---:|---:|---|
| [src/controllers/cart.controller.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/cart.controller.js) | **14** | 2 | **70.0%** | Tự trùng giữa `addItem()` và `buyNow()` |
| [tests/test_loyalty_module.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_loyalty_module.js) | **54** | 3 | **5.8%** | `test_audit_fixes.js` (30 dòng) + tự trùng `CLEANUP-01`/`02` (24 dòng) |
| [tests/test_phase1_role_separation.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase1_role_separation.js) | **43** | 2 | **24.0%** | `test_wishlist_server.js` (22 dòng) + `test_auth_flow.js` (21 dòng) |
| [tests/test_phase4_i18n.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase4_i18n.js) | **32** | 1 | **18.7%** | Nhóm 3-way clone `makeRequest()` với Phase 5 & Phase 6 |
| [tests/test_phase5_functional.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase5_functional.js) | **32** | 1 | **12.4%** | Nhóm 3-way clone `makeRequest()` với Phase 4 & Phase 6 |
| [tests/test_phase6_data_integrity.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase6_data_integrity.js) | **32** | 1 | **19.0%** | Nhóm 3-way clone `makeRequest()` với Phase 4 & Phase 5 |
| [tests/test_wishlist_server.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_wishlist_server.js) | **22** | 1 | **6.2%** | Clone phần setup server + helper `pass`/`fail` với Phase 1 |
| **Tổng cộng New Code** | **229** | **11** | **3.4%** | *(Vượt ngưỡng 3.0% đúng 25 dòng: ngưỡng tối đa là `204` dòng)* |

### Chi tiết từng cặp Duplicated Block

1. **DUP-01 (Production Code) — `CartController.addItem` ↔ `CartController.buyNow` (`14` New Duplicated Lines / ~`69` lines clone)**
   * **File 1:** [src/controllers/cart.controller.js#L170-L238](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/cart.controller.js#L170-L238) (`new lines`: `172–178`)
   * **File 2:** [src/controllers/cart.controller.js#L373-L439](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/cart.controller.js#L373-L439) (`new lines`: `375–381`)
   * **Nội dung bị lặp:** Kiểm tra chặn `ADMIN` (JSON 403 hoặc flash warning + redirect `/admin/dashboard`), `validateCartQuantity(quantity)`, truy vấn SQL `product_variants JOIN products JOIN sizes JOIN colors` tìm biến thể `active`, kiểm tra không tồn tại (400), và kiểm tra `stock_quantity <= 0` (400).
   * **Nguyên nhân lặp:** Hai method `addItem()` và `buyNow()` vốn copy-paste đoạn đầu từ trước; PR #1 thêm nhánh chặn `ADMIN` vào đầu cả hai method nên `7 + 7 = 14` dòng mới rơi ngay vào block trùng lặp.
   * **Có thể dùng helper chung không?** **Có.** Tách thành 1 method helper dùng chung trong `CartController` (ví dụ `resolveBuyableVariant(req, res, next)`). Lưu ý kiểm tra kỹ khác biệt xử lý lỗi XHR/HTML ở nhánh không tìm thấy/hết hàng để giữ nguyên status code và redirect/next(err).
   * **Rủi ro nếu refactor:** Trung bình — cần đảm bảo giữ nguyên khác biệt giữa XHR JSON (`403`/`400`) và form submit (`flash` + `redirect`/`next(err)`) và chạy lại regression tests giỏ hàng + role separation (`ROLE-*`, `CHECK-*`).

2. **DUP-02 (3-way Test Clone) — `makeRequest()` trong Phase 4, Phase 5, Phase 6 (`32 × 3 = 96` New Duplicated Lines)**
   * **File 1:** [tests/test_phase4_i18n.js#L21-L52](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase4_i18n.js#L21-L52) (`32` dòng)
   * **File 2:** [tests/test_phase5_functional.js#L26-L57](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase5_functional.js#L26-L57) (`32` dòng)
   * **File 3:** [tests/test_phase6_data_integrity.js#L22-L53](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase6_data_integrity.js#L22-L53) (`32` dòng)
   * **Nội dung bị lặp:** Hàm `makeRequest(server, path, options = {})` bọc `http.request` y hệt nhau từng ký tự ở cả 3 file.
   * **Có thể dùng helper chung không?** **Có, rất sạch.** Đưa `makeRequest` (hoặc tái sử dụng 1 helper dùng chung trong `tests/test_bootstrap.js` hoặc 1 module `tests/test_http_helpers.js`) để xóa trực tiếp `~64–96` dòng trùng lặp.
   * **Rủi ro nếu refactor:** Rất thấp — `makeRequest` ở 3 file giống hệt nhau về chữ ký và return shape `{ status, headers, body }`.

3. **DUP-03 (Test Clone) — Server Bootstrap + `pass`/`fail` + `req()` trong Phase 1, `test_wishlist_server.js`, `test_auth_flow.js` (`43 + 22 = 65` New Duplicated Lines)**
   * **Cặp A (`22 × 2 = 44` New Lines):** [tests/test_phase1_role_separation.js#L15-L36](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase1_role_separation.js#L15-L36) ↔ [tests/test_wishlist_server.js#L15-L36](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_wishlist_server.js#L15-L36) (khởi tạo `http.createServer(app)`, lắng nghe `0`, định nghĩa `pass(id, msg)` và `fail(id, msg, err)`).
   * **Cặp B (`21` New Lines):** [tests/test_phase1_role_separation.js#L39-L59](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase1_role_separation.js#L39-L59) ↔ [tests/test_auth_flow.js#L16-L36](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_auth_flow.js#L16-L36) (hàm `req` / `request` dùng `fetch(..., { redirect: 'manual' })` với `application/x-www-form-urlencoded`).
   * **Có thể dùng helper chung không?** Có — có thể gộp vào helper test HTTP chung (tuy nhiên cần giữ `Content-Type` chính xác giữa `req` form-urlencoded của Phase 1/Auth Flow và `apiReq` JSON của Wishlist Server).

4. **DUP-04 (Test Clone) — Test runner boilerplate trong `test_loyalty_module.js` ↔ `test_audit_fixes.js` (`30` New Duplicated Lines)**
   * **File 1:** [tests/test_loyalty_module.js#L30-L59](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_loyalty_module.js#L30-L59) (`30` dòng)
   * **File 2:** [tests/test_audit_fixes.js#L21-L50](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_audit_fixes.js#L21-L50) (`30` dòng; thuộc Old Code trên PR này nên không bị tính vào 229 dòng của `test_audit_fixes.js`).
   * **Nội dung bị lặp:** In banner và định nghĩa `test(name, fn)` / `asyncTest(name, fn)` tăng `total`/`passed`.

5. **DUP-05 (Self-duplication) — `CLEANUP-01` ↔ `CLEANUP-02` trong `test_loyalty_module.js` (`24` New Duplicated Lines)**
   * **Khối 1:** [tests/test_loyalty_module.js#L688-L699](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_loyalty_module.js#L688-L699) (`12` dòng)
   * **Khối 2:** [tests/test_loyalty_module.js#L711-L722](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_loyalty_module.js#L711-L722) (`12` dòng)
   * **Nội dung bị lặp:** Tạo file JPEG giả trong `uploadDir`, assert tồn tại, gọi `assert.rejects(() => reviewService.createReview(...))`, rồi kiểm tra file tạm bị xóa.
   * **Có thể dùng helper chung không?** **Có, rất dễ:** Viết một helper cục bộ `assertReviewRejectionCleansTempFile(...)` ngay trong `runLoyaltyTests()` giúp xóa `24` dòng tự trùng chỉ trong 1 file mà không ảnh hưởng bất kỳ file nào khác.

*(Lưu ý phụ: Ngoài 229 dòng trên New Code, SonarCloud cũng ghi nhận một số duplicated blocks thuộc phần Old Code của 4 file chạm tới trong PR là `src/controllers/admin.controller.js:695-721 ↔ 745-771`, `database/seed_products.js:205-226 ↔ 463-480`, `tests/test_audit_fixes.js:21-50`, `tests/test_auth_flow.js:16-36`, và `cart.controller.js:270-324 ↔ 457-509` — các block Old Code này đóng góp `0` vào chỉ số Duplication on New Code.)*

---

## 6. Phân tích nguyên nhân gốc

1. **Tại sao Security Rating = C (yêu cầu A)?**
   * SonarCloud coi dòng `run: npx playwright install --with-deps chromium` tại [.github/workflows/ci.yml#L62](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/.github/workflows/ci.yml#L62) vi phạm cùng lúc `S6505` (không nên gọi `npx` để tránh thực thi script/install không kiểm soát) và `S8543` (không ghim phiên bản trong lệnh `npx`). Chỉ `1` dòng này sinh ra `2` Security issues mức Medium, kéo Security Rating từ A xuống C.
2. **Tại sao Reliability Rating = C (yêu cầu A)?**
   * Các module mới viết ở frontend wishlist ([src/public/js/main.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/public/js/main.js)) và nhóm test mới Phase 4–7 ([tests/test_phase4_i18n.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase4_i18n.js) – [tests/test_phase7_browser_matrix.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase7_browser_matrix.js)) gọi hàm `async` tại event handler / top-level mà không gắn `.catch(...)` (`8` issues `S9383`), kèm `1` chỗ dùng `isNaN()` thay vì `Number.isNaN()`/`Number.isInteger()` tại `src/public/js/main.js:1356` (`S7773`). Một issue Reliability mức Medium đã đủ đẩy Reliability Rating xuống C.
3. **Tại sao Duplication on New Code = 3.4% (yêu cầu ≤ 3.0%)?**
   * Hai nguyên nhân cộng hưởng:
     1. Trong cấu hình [sonar-project.properties](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/sonar-project.properties), SonarCloud phân tích cả `tests/` (`sonar.tests=tests`), và bộ suite `tests/test_phase*`, `tests/test_wishlist_server.js`, `tests/test_loyalty_module.js` mới thêm vào PR copy-paste nguyên khối các hàm HTTP/test-runner boilerplate (`215` trên tổng số `229` dòng trùng lặp nằm ở `tests/`!).
     2. Ở code production, `src/controllers/cart.controller.js` chèn kiểm tra chặn `ADMIN` vào đầu 2 method vốn copy-paste từ trước (`addItem` và `buyNow`), đóng góp thêm `14` dòng trùng lặp.
   * Tổng cộng `229 / 6,808 = 3.36%` (làm tròn `3.4%`), chỉ vượt trần `3.0%` (`204` dòng) đúng `25` dòng.

---

## 7. Mức độ ưu tiên xử lý

* **P0 (Critical Security hoặc Data Integrity):** **0 issues.** Không có lỗ hổng SQL injection, bypass xác thực/phân quyền, rò rỉ secret hay lỗi toàn vẹn số dư/tồn kho nào từ kết quả SonarCloud.
* **P1 (High Security/Reliability — trực tiếp đánh rớt Quality Gate xuống Rating C):**
  1. `SEC-SC-01` & `SEC-SC-02` ([.github/workflows/ci.yml#L62](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/.github/workflows/ci.yml#L62)): Gọi trực tiếp `./node_modules/.bin/playwright` thay cho `npx playwright`.
  2. `REL-SC-06..09` (`tests/test_phase4..7`): Gắn `.catch(...)` cho top-level `runTests()` / `runBrowserMatrix()` (cũng chặn thật tình trạng unhandled rejection khi setup/launch lỗi trước `try`).
  3. `REL-SC-01..05` ([src/public/js/main.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/public/js/main.js)): Sửa `isNaN` an toàn với kiểu số nguyên + chuẩn hóa Promise chaining/handling ở wishlist.
* **P2 (Medium — đánh rớt Duplication on New Code 3.4% > 3.0%):**
  1. Hợp nhất `makeRequest()` ở `tests/test_phase4_i18n.js`, `tests/test_phase5_functional.js`, `tests/test_phase6_data_integrity.js` (xóa trực tiếp ~`64–96` dòng trùng lặp, đưa tỷ lệ Duplication xuống ~`2.0%–2.4%`, thấp hơn rõ rệt ngưỡng `3.0%`).
  2. Refactor helper dùng chung cho `CartController.addItem()` & `CartController.buyNow()` trong [src/controllers/cart.controller.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/cart.controller.js) (xóa `14` New Duplicated Lines + ~`60` dòng lặp trong controller production).
* **P3 (Low / Dọn dẹp bổ sung — không bắt buộc ngay nếu không muốn chạm nhiều file):**
  * Tách helper `assertReviewRejectionCleansTempFile` cho `CLEANUP-01`/`CLEANUP-02` trong [tests/test_loyalty_module.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_loyalty_module.js) (giảm thêm `~12–24` dòng).
  * Hợp nhất helper `req` / `createTestRunner` giữa `test_phase1_role_separation.js`, `test_wishlist_server.js`, `test_loyalty_module.js` (chỉ làm nếu thấy cần, tránh tạo abstraction rườm rà).

---

## 8. Phương án sửa cụ thể cho từng nhóm issue

1. **Sửa Security Rating (`C → A`) — [.github/workflows/ci.yml#L62](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/.github/workflows/ci.yml#L62):**
   * Thay:
     `run: npx playwright install --with-deps chromium`
   * Thành:
     `run: ./node_modules/.bin/playwright install --with-deps chromium`
   * *Lý do:* Không gọi `npx` (`S6505`) và thực thi đúng binary Playwright `1.65.0` đã khóa trong `package-lock.json` và cài từ bước `npm ci --ignore-scripts` (`S8543`).

2. **Sửa Reliability Rating (`C → A`) — [src/public/js/main.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/public/js/main.js) và `tests/test_phase4..7`:**
   * `src/public/js/main.js:1356`: Đổi `.map(i => i.id).filter(id => id && !isNaN(id))` thành `.map(i => Number(i && i.id)).filter(id => Number.isInteger(id) && id > 0)` (an toàn cho string IDs, không dùng `isNaN`, tránh bẫy `Number.isNaN("abc") === false`).
   * `src/public/js/main.js:1713`: `removeWishlistItem(pid).catch(err => console.error('[Wishlist Remove Error]:', err));`
   * `src/public/js/main.js:1720`: `clearAllWishlist().catch(err => console.error('[Wishlist Clear Error]:', err));`
   * `src/public/js/main.js:1744–1746`: `checkAndMigrateLegacyCustomerItems().then(() => fetchServerWishlist()).catch(err => console.warn('[Wishlist] Initial sync error:', err));`
   * `tests/test_phase4_i18n.js:170`, `tests/test_phase5_functional.js:258`, `tests/test_phase6_data_integrity.js:167`, `tests/test_phase7_browser_matrix.js:203`: Bổ sung `.catch((err) => { console.error('❌ Fatal test error:', err); process.exit(1); })`.

3. **Sửa Code Duplication (`3.4% → ~1.5%–2.2%`, đạt `≤ 3.0%`) theo hướng tối giản, không over-engineer:**
   * **Mục tiêu 1 (Production):** Trong [src/controllers/cart.controller.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/cart.controller.js), trích 1 helper nội bộ `async _prepareCustomerCartAction(req, res, next)` dùng chung cho `addItem()` và `buyNow()` (trả về `{ user, qty, variant }` hoặc đã gửi response/gọi `next(err)` và trả `null`). Giữ nguyên 100% logic nhánh Guest vs Customer và thông điệp lỗi.
   * **Mục tiêu 2 (Test HTTP Helper):** Xuất `makeRequest` dùng chung từ 1 helper gọn nhẹ (ví dụ thêm vào [tests/test_bootstrap.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_bootstrap.js) hoặc 1 file `tests/http_test_helper.js`) và import vào `tests/test_phase4_i18n.js`, `tests/test_phase5_functional.js`, `tests/test_phase6_data_integrity.js` -> xóa ngay `96` New Duplicated Lines.
   * **Mục tiêu 3 (Tùy chọn trong cùng file):** Gộp logic lặp `CLEANUP-01`/`CLEANUP-02` trong `tests/test_loyalty_module.js` thành helper nội bộ `assertTempUploadCleanedOnError(...)` -> giảm thêm `24` dòng tự trùng.
   * **Dự kiến kết quả:** `229 - 14 - 96 (- 24) = ~95–119` lines trên ~`6,700` New Lines → **~1.4%–1.8%** (dưới ngưỡng `3.0%` với biên an toàn lớn).

---

## 9. Danh sách file dự kiến cần sửa (khi được phê duyệt)

* **Tối thiểu đề xuất (8–9 files):**
  1. [.github/workflows/ci.yml](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/.github/workflows/ci.yml)
  2. [src/public/js/main.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/public/js/main.js)
  3. [src/controllers/cart.controller.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/cart.controller.js)
  4. [tests/test_bootstrap.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_bootstrap.js) *(hoặc 1 file helper riêng cho `makeRequest` nếu muốn tách `test_bootstrap.js` thuần env/credentials)*
  5. [tests/test_phase4_i18n.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase4_i18n.js)
  6. [tests/test_phase5_functional.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase5_functional.js)
  7. [tests/test_phase6_data_integrity.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase6_data_integrity.js)
  8. [tests/test_phase7_browser_matrix.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_phase7_browser_matrix.js)
  9. *(Tùy chọn)* [tests/test_loyalty_module.js](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/tests/test_loyalty_module.js)

---

## 10. Kiểm thử cần bổ sung hoặc chạy lại sau khi sửa

1. **Offline / In-memory checks:**
   * `node --check` trên tất cả file JS đã sửa (`main.js`, `cart.controller.js`, `test_bootstrap.js`, `test_phase4..7`, `test_loyalty_module.js`).
   * Kiểm tra unit logic lọc `productIds` với các đầu vào `["12", "0", "-3", "1.5", "abc", "   ", null, undefined, 45]` -> chỉ giữ `[12, 45]`.
   * Kiểm tra YAML syntax của `.github/workflows/ci.yml` và `git diff --check`.
   * Kiểm tra cô lập `runTests().catch(...)` trả exit code `1` khi `server.listen` lỗi.
2. **Integration & E2E trên GitHub Actions CI (`npm run test:all`, Node.js 22.x & 24.x):**
   * Xác minh bước `./node_modules/.bin/playwright install --with-deps chromium` chạy thành công trên Ubuntu runner sau `npm ci --ignore-scripts`.
   * Xác minh toàn bộ `test_phase4_i18n.js`, `test_phase5_functional.js`, `test_phase6_data_integrity.js`, `test_phase7_browser_matrix.js`, `test_loyalty_module.js`, và `regression_suite.js` (`CART-*`, `ROLE-*`, `CHECK-*`) PASS.
3. **SonarCloud PR #1:**
   * Chờ phân tích commit mới và xác nhận cả 3 điều kiện đều chuyển sang **PASSED** (`Security = A`, `Reliability = A`, `Duplications <= 3.0%`).

---

## 11. Rủi ro regression

1. **Lệnh `./node_modules/.bin/playwright install --with-deps chromium` trên CI:** Dù `node_modules/.bin/playwright` đã được tạo từ `npm ci --ignore-scripts`, cần xác nhận trực tiếp trên GitHub Actions rằng lời gọi không qua `npx` tương thích 100% với bước `--with-deps chromium` và làm sạch cả `S6505` lẫn `S8543` trên SonarCloud.
2. **Thay `isNaN(id)` trong `src/public/js/main.js:1356`:** Tuyệt đối tránh đổi thành `!Number.isNaN(id)` trực tiếp vì `id` có thể là chuỗi `"abc"` (khi đó `Number.isNaN("abc")` là `false`); dùng `Number(id)` + `Number.isInteger(...) && ... > 0` sẽ an toàn, nhưng cần lưu ý nếu trước đây có legacy ID dạng chuỗi số có khoảng trắng `" 12 "` (`Number(" 12 ") === 12` vẫn được chấp nhận).
3. **Refactor `CartController.addItem` & `buyNow`:** Hai method có nhánh response khác nhau khi `user` là Guest hay Customer và khi XHR vs HTML submit (`res.status(400).json(...)` vs `req.flash` + `next(err)`). Cần giữ nguyên từng nhánh status code/message khi gom đoạn đầu vào helper.
4. **Sửa `tests/test_phase4..7`:** Gắn `.catch(...)` ở top-level là an toàn vì bản thân `runTests()` và `runBrowserMatrix()` vẫn tự `process.exit(...)` ở cuối hàm như hiện tại; `.catch(...)` chỉ bắt ngoại lệ thoát ra khỏi hàm nếu có lỗi trước/sau `try`.

---

## 12. Những vấn đề chưa thể xác minh trong phạm vi Read-only

1. **Chi tiết cảnh báo encoding của SonarCloud Scanner:** UI công khai của SonarCloud chỉ hiển thị cảnh báo `"There are problems with file encoding in the source code. Please check the scanner logs for more details."` và không công khai raw scanner console log để biết file nào bị warning encoding.
2. **Code Coverage (`new_lines_to_cover = 0`):** Dự án chưa cấu hình sinh báo cáo LCOV cho SonarCloud; hiện điều kiện Quality Gate không yêu cầu Coverage nên không làm PR fail.
3. **Phản ứng chính xác của SonarCloud sau patch:** Đặc biệt đối với `./node_modules/.bin/playwright` (liệu SonarCloud analyzer cho `githubactions` có chấp nhận hoàn toàn không còn `S6505`/`S8543`) và con số Duplication % sau khi re-scan chỉ có thể xác nhận sau khi commit sửa lỗi được phê duyệt và SonarCloud phân tích lại PR #1.
