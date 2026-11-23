# BÁO CÁO KIỂM TOÁN AN TOÀN ĐỘC LẬP & NGHIỆM THU STAGE 1A
## VAMOS CLUB — DATABASE ISOLATION GUARD & TEST ISOLATION VERIFICATION

**Dự án:** VAMOS STORE — Ecommerce Platform  
**Phân hệ:** VAMOS CLUB (Loyalty, Review-to-Earn, Point Ledger, Voucher Lifecycle)  
**Giai đoạn:** STAGE 1A — Database Isolation Guard  
**Chế độ thực hiện:** STRICT READ-ONLY AUDIT (Không thay đổi mã nguồn, không chạy integration test, không ghi dữ liệu)  
**Thời điểm kiểm toán:** 2026-11-22  
**Trạng thái kiểm toán:** HOÀN THÀNH — ĐÁNH GIÁ ĐỘC LẬP  

---

## 1. GIT PREFLIGHT & POSTFLIGHT VERIFICATION

### 1.1. Mục đích
Xác minh tính bất biến của không gian làm việc (workspace integrity), đảm bảo cuộc kiểm toán không làm biến đổi bất kỳ file mã nguồn, cấu hình, dữ liệu hay tài liệu hiện có nào.

### 1.2. Git Preflight Check (Trước khi kiểm toán)
* Lệnh thực thi:
  ```powershell
  git status --porcelain=v1
  git diff --stat
  git diff --cached --stat
  ```
* **Kết quả đo lường Preflight:**
  * **Tracked Modified files (` M`):** 88 files (giữ nguyên không đổi).
    * Gồm 85 files được sửa đổi trong các task trước đó (diagrams PlantUML, view Pug, controller, service, báo cáo phân tích thiết kế).
    * Gồm 3 files cấu hình được sửa đổi trong Stage 1A:
      * `src/config/app.config.js` (+10 / -4 lines)
      * `src/config/database.js` (+4 / -0 lines)
      * `package.json` (+2 / -0 lines)
  * **Tracked Staged files:** 0 files (không có thay đổi nào trong staging index).
  * **Untracked entries (`??`):**
    * Khi gom nhóm thư mục (`git status --porcelain=v1`): 115 mục (gồm thư mục untracked `docs/loyalty/`, `src/public/images/products/`, các ảnh chụp màn hình UI, và các file Stage 1A: `src/config/db-guard.js`, `tests/test_db_guard.js`, `tests/test_loyalty_module.js`).
    * Khi liệt kê chi tiết từng file (`git status --porcelain=v1 -uall`): 124 files untracked trước khi tạo báo cáo kiểm toán này.
  * **Deleted files (` D`):** 0 files.
  * **Branch hiện tại:** `fix/master-repair-plan` | **HEAD:** `eb822aba57d75a2ecad390123c188afb73db3cb8`.

### 1.3. Phân biệt các nhóm file trong Workspace
1. **File đã thay đổi trước Stage 1A (85 files):**
   * Các biểu đồ hoạt động (`docs/diagrams/activity/*.puml`, `*.png`).
   * Các tài liệu báo cáo đồ án (`report/**`).
   * Các view Pug đơn hàng và wishlist (`src/views/pages/account/*.pug`, `products/detail.pug`).
   * Các service và controller (`src/services/order.service.js`, `src/controllers/product.controller.js`).
2. **File Stage 1A đã sửa đổi (3 files):**
   * [app.config.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/config/app.config.js#L10-L45): Chuyển cấu hình `database`, `isTest`, `isProduction`, `env` sang Dynamic Getters.
   * [database.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/config/database.js#L1-L25): Tích hợp `validateDatabaseConnection()` trước `sql.connect()`.
   * [package.json](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/package.json#L20-L24): Thêm npm script `"test:guard": "node tests/test_db_guard.js"`.
3. **File Stage 1A đã tạo (3 files):**
   * [src/config/db-guard.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/config/db-guard.js): Module Guard bảo vệ kết nối CSDL.
   * [tests/test_db_guard.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_db_guard.js): Unit test Guard 9 kịch bản in-memory.
   * [tests/test_loyalty_module.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js): Fixture isolation & transaction helper cho Loyalty.
4. **File untracked có từ trước (112 files):** Toàn bộ ảnh chụp màn hình kiểm thử UI trong `docs/maintenance/screenshots/`.

---

## 2. DANH SÁCH MỌI ĐƯỜNG KẾT NỐI DATABASE TRONG TOÀN BỘ REPOSITORY

Để xác định Guard có bảo vệ toàn diện hay không, kiểm toán đã quét toàn bộ repository để tìm mọi cú pháp mở kết nối SQL Server: `sql.connect`, `new sql.ConnectionPool`, `getPool`, `query`.

### Bảng phân loại các vị trí kết nối:

| STT | File & Vị trí | Lệnh kết nối / Hàm sử dụng | Phân loại | Đi qua Database Guard? | Đánh giá rủi ro |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | [src/config/database.js#L22](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/config/database.js#L22) | `pool = await sql.connect(config.db)` | Centralized Connection Pool | **CÓ (ĐƯỢC BẢO VỆ)** | Guard được gọi ở dòng 18 ngay trước khi connect. An toàn. |
| 2 | [src/controllers/admin.controller.js#L287](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/admin.controller.js#L287), [L564](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/admin.controller.js#L564) | `await getPool()` / `query()` | Controller Layer | **CÓ (ĐƯỢC BẢO VỆ)** | Thông qua `src/config/database.js`. |
| 3 | [src/controllers/auth.controller.js#L253](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/auth.controller.js#L253) | `await getPool()` / `withTransaction()` | Controller Layer | **CÓ (ĐƯỢC BẢO VỆ)** | Thông qua `src/config/database.js`. |
| 4 | [src/controllers/cart.controller.js#L280](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/cart.controller.js#L280), [L466](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/cart.controller.js#L466), [L691](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/cart.controller.js#L691) | `await getPool()` / `query()` | Controller Layer | **CÓ (ĐƯỢC BẢO VỆ)** | Thông qua `src/config/database.js`. |
| 5 | [src/services/order.service.js#L36](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/order.service.js#L36), [L451](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/order.service.js#L451), [L513](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/order.service.js#L513) | `await getPool()` / `query()` | Service Layer | **CÓ (ĐƯỢC BẢO VỆ)** | Thông qua `src/config/database.js`. |
| 6 | [database/init_mssql.js#L79](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/init_mssql.js#L79) | `masterPool = await sql.connect(masterConfig)` | Migration/Setup Script | **KHÔNG QUA GUARD** | **RỦI RO CAO:** Kết nối trực tiếp database `master` qua `mssql` gốc, bypass hoàn toàn Guard. |
| 7 | [database/init_mssql.js#L100](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/init_mssql.js#L100) | `targetPool = await sql.connect(targetConfig)` | Migration/Setup Script | **KHÔNG QUA GUARD** | **RỦI RO CAO:** Kết nối trực tiếp database đích mà không qua hàm kiểm tra Guard. |
| 8 | [database/seed_products.js#L818](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/seed_products.js#L818) | `pool = await sql.connect(config.db)` | Seed Script | **KHÔNG QUA GUARD** | **RỦI RO CAO:** Tự gọi `sql.connect(config.db)` thay vì dùng `getPool()`. |
| 9 | [database/seed_customer.js#L11](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/seed_customer.js#L11) | `await query(...)` | Seed Script | **CÓ (ĐƯỢC BẢO VỆ)** | Nạp `query` từ `src/config/database.js`. |
| 10 | [database/seed_vouchers.js#L47](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/seed_vouchers.js#L47) | `await query(...)` | Seed Script | **CÓ (ĐƯỢC BẢO VỆ)** | Nạp `query` từ `src/config/database.js`. |

> **KẾT LUẬN MỤC 2:** Không thể khẳng định "mọi kết nối đều được bảo vệ". Hiện tại vẫn còn **3 vị trí kết nối trực tiếp** qua `sql.connect` tại `database/init_mssql.js` (dòng 79, 100) và `database/seed_products.js` (dòng 818) hoàn toàn đi vòng qua Guard!

---

## 3. KẾT QUẢ KIỂM TRA ALLOWLIST / BLOCKLIST CỦA DATABASE GUARD

Kiểm toán phân tích trực tiếp mã nguồn [src/config/db-guard.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/config/db-guard.js) và [tests/test_db_guard.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_db_guard.js):

### 3.1. Blocklist đối với môi trường TEST
* **Quy tắc tại dòng 10-19:**
  ```javascript
  const BLOCKED_IN_TEST = new Set([
    'vamos_store_db',
    'vamos_store_prod',
    'vamos_store_prod_db',
    'vamos_store_production',
    'master', 'model', 'msdb', 'tempdb'
  ]);
  ```
* **Quy tắc tại dòng 48-49:**
  ```javascript
  const devDbConfigured = (process.env.DB_NAME || 'vamos_store_db').trim().toLowerCase();
  if (BLOCKED_IN_TEST.has(dbName) || dbName === devDbConfigured) { ... throw BLOCKED ... }
  ```
* **Đánh giá:**
  * Nếu `NODE_ENV === 'test'`, nỗ lực kết nối vào `vamos_store_db` hoặc các CSDL hệ thống bị chặn đứng 100%. Đã được kiểm chứng thực tế qua test case `GUARD-02` và `GUARD-03`.
  * **Lỗ hổng tiềm ẩn:** Nếu tên CSDL sản xuất trong thực tế không nằm trong danh sách tĩnh (ví dụ: `vamos_prod_live`, `vamos_production_asia`), và không có tiền tố/hậu tố trong danh sách, blocklist tĩnh sẽ không nhận diện được.

### 3.2. Allowlist đối với môi trường TEST và Đánh giá Wildcard
* **Quy tắc tại dòng 60-63 [db-guard.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/config/db-guard.js#L60-L63):**
  ```javascript
  const customTestDb = (process.env.DB_TEST_NAME || '').trim().toLowerCase();
  const isExplicitlyAllowed = ALLOWED_TEST_DATABASES.has(dbName) || (customTestDb && dbName === customTestDb);
  const hasTestSuffixOrPrefix = dbName.endsWith('_test_db') || dbName.endsWith('_test') || dbName.startsWith('test_');
  ```
* **ĐÁNH GIÁ NGUY HIỂM VỀ WILDCARD (Critical Finding):**
  1. Việc cho phép wildcard `dbName.endsWith('_test_db') || dbName.endsWith('_test') || dbName.startsWith('test_')` là **QUÁ RỘNG**.
  2. Bất kỳ database nào trên cùng SQL Server instance mang tên như:
     - `customer_billing_test`
     - `company_payroll_test_db`
     - `test_user_credentials`
     đều được Guard cấp quyền kết nối khi chạy test!
  3. Nếu ai đó cấu hình biến môi trường `DB_TEST_NAME=other_test_db`, Guard cũng cho phép kết nối ngay cả khi nó không thuộc dự án VAMOS STORE.
* **Đề xuất chính sách Allowlist chuẩn hóa:**
  * Chỉ cho phép duy nhất một giá trị mặc định: `vamos_store_test_db`.
  * Nếu sử dụng `DB_TEST_NAME`, giá trị đó **bắt buộc phải khớp mẫu chuẩn**: `^vamos_store_.*_test_db$` hoặc `^vamos_store_test_db$`. Loại bỏ hoàn toàn wildcard tự do `*_test` và `test_*`.

### 3.3. Xử lý khoảng trắng, chữ hoa/thường và dữ liệu cấu hình sai
* **Chữ hoa / chữ thường / khoảng trắng:**
  * Dòng 43: `const dbName = rawDbName.trim().toLowerCase();`.
  * Dòng 48: `devDbConfigured.trim().toLowerCase()`.
  * Dòng 60: `customTestDb.trim().toLowerCase()`.
  * $\rightarrow$ **Xác nhận:** Xử lý nhất quán, triệt để loại bỏ khoảng trắng thừa và chuẩn hóa về lowercase. Đã kiểm chứng qua test case `GUARD-01b`.
* **Database rỗng, null, undefined:**
  * Dòng 33-41: Chặn đứng `null`, `undefined`, chuỗi rỗng `''`, chuỗi khoảng trắng `'   '` và ném lỗi `[DATABASE GUARD REJECTED]`. Đã kiểm chứng qua test case `GUARD-04`.
* **Bảo vệ rò rỉ credential (Data Leakage):**
  * Thông báo lỗi chỉ trích xuất `rawDbName` và `currentEnv`. Tuyệt đối không serialize `dbConfig` (không in `password`, `user`, `options`). Đã kiểm chứng qua test case `GUARD-06c`.

---

## 4. CÁC TRƯỜNG HỢP CÓ THỂ BYPASS DATABASE GUARD

Qua phân tích kiến trúc, phát hiện **5 kịch bản có thể bypass Guard**:

```mermaid
flowchart TD
    subgraph "Các điểm Bypass Guard phát hiện được"
        BP1["Bypass 1: Chạy test thiếu NODE_ENV=test<br>(14 test script khác ngoài loyalty)"] -->|Guard coi là Dev| DEV_DB["Kết nối và ghi vào vamos_store_db!"]
        BP2["Bypass 2: Gọi trực tiếp sql.connect()<br>(database/init_mssql.js & seed_products.js)"] -->|Không qua getPool()| BYPASS_GUARD["Bypass Guard hoàn toàn!"]
        BP3["Bypass 3: Wildcard cho phép DB lạ<br>(dbName chứa *_test hoặc test_*)"] -->|Khớp hasTestSuffixOrPrefix| UNINTENDED_DB["Ghi vào DB khác trên cùng Server!"]
        BP4["Bypass 4: DB_TEST_NAME trỏ DB prod không có trong Blocklist"] -->|customTestDb khớp dbName| PROD_ACCIDENT["Nguy cơ ghi nhầm Production!"]
        BP5["Bypass 5: Pool Caching<br>(Chỉ validate lần đầu khi pool == null)"] -->|Nếu runtime đổi env sau đó| STALE_POOL["Không re-validate lại connection!"]
    end
```

1. **Bypass 1 (Nghiêm trọng nhất): Chạy test script mà không thiết lập `NODE_ENV=test`:**
   * Khi developer hoặc CI chạy `node tests/test_audit_fixes.js` hoặc `npm run test:audit`, vì file test không có `process.env.NODE_ENV = 'test'`, `app.config.js` trả về `vamos_store_db`.
   * Khi `getPool()` gọi `validateDatabaseConnection(dbConfig, undefined)`, hàm Guard thấy `env` rỗng nên chỉ kiểm tra CSDL hệ thống rồi trả về `true`.
   * **Hệ quả:** Test script kết nối và ghi thẳng vào `vamos_store_db` mà Guard không hề cảnh báo!
2. **Bypass 2: Kết nối trực tiếp qua `sql.connect`:**
   * Tại `database/seed_products.js` dòng 818: `await sql.connect(config.db)`.
   * Tại `database/init_mssql.js` dòng 79 & 100: `await sql.connect(masterConfig)` và `await sql.connect(targetConfig)`.
   * Các đoạn code này không gọi qua `src/config/database.js` nên Guard hoàn toàn bị vô hiệu hóa.
3. **Bypass 3: Wildcard tên database quá lỏng lẻo:**
   * Dòng 62 `src/config/db-guard.js`: Chấp nhận mọi database có tiền tố `test_` hoặc hậu tố `_test` / `_test_db`.
4. **Bypass 4: Biến môi trường `DB_TEST_NAME` vượt mặt Allowlist tĩnh:**
   * Dòng 61: `(customTestDb && dbName === customTestDb)`. Nếu biến môi trường `DB_TEST_NAME` bị gán nhầm vào một database thật không có tên trong danh sách 4 tên production tĩnh của `BLOCKED_IN_TEST`, Guard sẽ chấp thuận cho phép test kết nối.
5. **Bypass 5: Cơ chế cache Singleton Pool không re-validate:**
   * Guard chỉ chạy trong khối `if (!pool) { ... }` tại `src/config/database.js#L17`. Sau khi pool đã khởi tạo, các lần gọi `getPool()` hoặc `query()` tiếp theo không kiểm tra lại.

---

## 5. THỨ TỰ KHỞI TẠO `NODE_ENV` VÀ NẠP CONFIG

### 5.1. Phân tích `src/config/app.config.js`
* Trong phiên bản trước Stage 1A, `app.config.js` gán biến tĩnh tại thời điểm nạp file:
  `const isTest = process.env.NODE_ENV === 'test';`
  `database: isTest ? ... : ...`
  Nếu một file test nạp bất kỳ module nào require `app.config.js` trước khi gán `process.env.NODE_ENV = 'test'`, giá trị `database` sẽ bị đóng băng vĩnh viễn là `vamos_store_db`.
* **Khắc phục trong Stage 1A:**
  Đã chuyển thành Dynamic Getters tại dòng 13, 17, 21, 41:
  ```javascript
  get env() { return process.env.NODE_ENV || 'development'; },
  get isProduction() { return process.env.NODE_ENV === 'production'; },
  get isTest() { return process.env.NODE_ENV === 'test'; },
  get database() {
    const isTestEnv = process.env.NODE_ENV === 'test';
    return isTestEnv ? (process.env.DB_TEST_NAME || 'vamos_store_test_db') : (process.env.DB_NAME || 'vamos_store_db');
  }
  ```
  Nhờ Dynamic Getters, bất kỳ khi nào `process.env.NODE_ENV` thay đổi, `config.db.database` đọc ra sẽ lập tức thay đổi tương ứng.

### 5.2. Thứ tự trong `tests/test_loyalty_module.js`
* Tại dòng 16 [test_loyalty_module.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js#L16):
  `process.env.NODE_ENV = 'test';` được đặt trước tất cả các lệnh `require('../src/config/database')`, `loyaltyService`, `orderService`.
* Tại dòng 59-65: Có thêm Assertion lớp 2:
  ```javascript
  const dbCheck = await query('SELECT DB_NAME() AS current_db');
  const currentDb = dbCheck.recordset[0]?.current_db;
  if (!currentDb || !currentDb.toLowerCase().includes('test')) {
    throw new Error(`[CRITICAL TEST ABORT] test_loyalty_module must run against a test database! Connected to: ${currentDb}`);
  }
  ```
* **Đánh giá:** Thứ tự trong `test_loyalty_module.js` là **HOÀN TOÀN CHÍNH XÁC VÀ AN TOÀN**.

---

## 6. ĐÁNH GIÁ CÔ LẬP FIXTURE TRONG `tests/test_loyalty_module.js`

Kiểm toán đã phân tích 10 tiêu chí cô lập dữ liệu kiểm thử trong [tests/test_loyalty_module.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js):

| STT | Tiêu chí kiểm tra | Bằng chứng mã nguồn | Đánh giá |
| :---: | :--- | :--- | :---: |
| 1 | **Tạo mới test user cho từng lần chạy?** | Dòng 43-45: Tạo `testRunId = 'loyalty_' + Date.now() + '_' + rand`. Dòng 252-273: `INSERT INTO users` tạo `user1` và `user2` mới hoàn toàn. | **ĐẠT** |
| 2 | **Tránh xung đột email và dữ liệu fixture?** | Email: `loyalty_u1_${testRunId}@vamos.test`. Order code: `'ORD-TEST-' + @runId`. Voucher code: 16 bytes crypto hex (`VAMOSCLUB-[0-9A-F]{32}`). Không thể xung đột. | **ĐẠT** |
| 3 | **Fixture được theo dõi ngay sau khi tạo?** | `trackedFixtures.userIds.push(...)` (L261, L272), `orderIds.push(...)` (L296, L372, L625), `reviewIds.push(...)` (L407), `voucherIds.push(...)` (L505, L563). | **ĐẠT** |
| 4 | **Lỗi giữa setup có cleanup không?** | Toàn bộ từ setup đến test case nằm trọn trong khối `try` (L137-L784). Khối cleanup nằm trong `finally` (L786-L890). Khi bất kỳ assertion nào ném lỗi, `finally` vẫn được kích hoạt. | **ĐẠT** |
| 5 | **Thứ tự cleanup theo Foreign Key?** | Thứ tự xóa trong `finally`: `voucher_usages` $\rightarrow$ `voucher_redemptions` $\rightarrow$ `review_media` $\rightarrow$ `reviews` $\rightarrow$ `order_items`/`order_status_histories`/`orders` $\rightarrow$ `vouchers` $\rightarrow$ `point_transactions`/`user_points_wallets` $\rightarrow$ `cart_items`/`carts` $\rightarrow$ `users`. Hoàn toàn đúng ràng buộc FK. | **ĐẠT** |
| 6 | **Báo lỗi khi cleanup thất bại?** | Dòng 883-885: `catch (cleanupErr) { console.error(' ✖ [WARN] Error during fixture teardown:', cleanupErr.message); }`. Báo lỗi rõ ràng ra console. | **ĐẠT** (Có lưu ý) |
| 7 | **Nguy cơ xóa nhầm dữ liệu ngoài fixture?** | Câu lệnh `DELETE` luôn có điều kiện `WHERE id IN (...)` hoặc `WHERE user_id IN (...)` dựa trên ID cụ thể trong `trackedFixtures`. Nếu mảng rỗng thì bỏ qua câu lệnh. Không có lệnh xóa tràn. | **ĐẠT** |
| 8 | **Chấm dứt UPDATE ví trực tiếp không ledger?** | Tất cả 4 vị trí cũ (L374, L397, L428, L459) đã được thay thế 100% bằng helper `setWalletBalanceFixture(userId, targetPoints, reason)`. | **ĐẠT** |
| 9 | **`ADMIN_ADJUSTMENT` cùng transaction với ví?** | Hàm `setWalletBalanceFixture` (L67-L135): Mở `new sql.Transaction(conn)`, thực hiện `INSERT point_transactions` và `UPDATE user_points_wallets` trên cùng transaction trước khi `tx.commit()`. | **ĐẠT** |
| 10 | **Tính nguyên tử ACID giữa ví và ledger?** | Cả hai lệnh thực thi trong cùng transaction, nếu một lệnh lỗi thì `tx.rollback()` hủy toàn bộ. Không bao giờ xảy ra tình trạng lệch số dư với sổ cái. | **ĐẠT** |

---

## 7. KIỂM TRA HIỆN TRẠNG CỦA CÁC TEST SCRIPT KHÁC TRONG REPO

Kiểm toán đã quét toàn bộ 20 file script trong thư mục `tests/`.

### Bảng đối chiếu hiện trạng thiết lập môi trường:

| STT | File Test Script | Có thiết lập `process.env.NODE_ENV = 'test'`? | Nguy cơ kết nối nhầm `vamos_store_db` |
| :---: | :--- | :---: | :--- |
| 1 | `tests/regression_suite.js` | **CÓ (Dòng 7)** | Thấp (Đã bảo vệ) |
| 2 | `tests/setup_test_db.js` | **CÓ (Dòng 6)** | Thấp (Đã bảo vệ) |
| 3 | `tests/test_loyalty_module.js` | **CÓ (Dòng 16)** | Thấp (Đã bảo vệ) |
| 4 | `tests/test_audit_fixes.js` | **KHÔNG CÓ** | **CỰC KỲ CAO:** Chạy lệnh `query()` trực tiếp vào `vamos_store_db`! |
| 5 | `tests/test_auth_flow.js` | **KHÔNG CÓ** | **CỰC KỲ CAO:** Khởi tạo server và insert user vào `vamos_store_db`! |
| 6 | `tests/test_phase1_role_separation.js` | **KHÔNG CÓ** | **CỰC KỲ CAO:** Query và test trên `vamos_store_db`! |
| 7 | `tests/test_phase2_wishlist.js` | **KHÔNG CÓ** | **CỰC KỲ CAO:** Ghi wishlist items vào `vamos_store_db`! |
| 8 | `tests/test_phase3_theme.js` | **KHÔNG CÓ** | Trung bình (Chủ yếu test UI/Session) |
| 9 | `tests/test_phase4_i18n.js` | **KHÔNG CÓ** | Trung bình (Chủ yếu test i18n/Session) |
| 10 | `tests/test_phase5_functional.js` | **KHÔNG CÓ** | **CỰC KỲ CAO:** Cập nhật voucher, category trong `vamos_store_db`! |
| 11 | `tests/test_phase6_data_integrity.js` | **KHÔNG CÓ** | **CỰC KỲ CAO:** Query đếm dữ liệu từ `vamos_store_db`! |
| 12 | `tests/test_phase7_browser_matrix.js` | **KHÔNG CÓ** | Cao |
| 13 | `tests/test_live_search.js` | **KHÔNG CÓ** | Cao |
| 14 | `tests/test_wishlist_server.js` | **KHÔNG CÓ** | **CỰC KỲ CAO:** Ghi dữ liệu wishlist vào `vamos_store_db`! |
| 15 | `tests/test_wl08_cross_browser.js` | **KHÔNG CÓ** | **CỰC KỲ CAO:** Ghi/xóa wishlist trên `vamos_store_db`! |
| 16 | `tests/test_email_matrix.js` | **KHÔNG CÓ** | Trung bình |
| 17 | `tests/test_responsive_qa.js` | **KHÔNG CÓ** | Trung bình |
| 18 | `tests/test_validator.js` | **KHÔNG CÓ** | Thấp (Pure unit test, không DB) |
| 19 | `tests/validate_pug.js` | **KHÔNG CÓ** | Thấp (Pug compiler test, không DB) |
| 20 | `tests/test_db_guard.js` | **KHÔNG CÓ** | Thấp (Pure unit test, mock config) |

### Phân tích lỗ hổng của script `npm run test:all`:
Trong `package.json` dòng 24:
```json
"test:all": "node tests/validate_pug.js && node tests/test_validator.js && node tests/setup_test_db.js && node tests/test_auth_flow.js && node tests/test_phase1_role_separation.js && ..."
```
* Bước `setup_test_db.js` chạy xong và đóng process.
* Bước kế tiếp `node tests/test_auth_flow.js` được chạy trong một process Node.js mới tinh.
* Do không có biến môi trường `NODE_ENV=test` được truyền từ shell, `test_auth_flow.js` và toàn bộ các test phase sau đó **đều kết nối và ghi đè dữ liệu vào `vamos_store_db`**!
* **Đây chính là lời giải thích khoa học cho việc tại sao trong quá khứ `vamos_store_db` lại xuất hiện các đơn hàng test và giao dịch điểm bất thường của `user_id = 2`!**

---

## 8. CÁC LỖ HỔNG VÀ ĐIỂM CHƯA ĐỦ BẰNG CHỨNG (NOT VERIFIED)

1. **Chưa có bằng chứng chạy thực nghiệm `test_loyalty_module.js` trên `vamos_store_test_db` (`NOT VERIFIED`):**
   * Tuân thủ quy định READ-ONLY, trong vòng audit này chưa chạy tích hợp thực tế với CSDL. Toàn bộ tính năng xóa fixture theo FK và tạo ledger của `test_loyalty_module.js` mới chỉ được kiểm chứng ở mức phân tích cú pháp tĩnh và logic code.
2. **Khối teardown trong `test_loyalty_module.js` nuốt exception (`catch (cleanupErr)`):**
   * Nếu SQL Server gặp deadlock hoặc timeout khi đang xóa dữ liệu dọn dẹp, lỗi chỉ được log warning ra màn hình mà process không exit với code 1. Điều này có thể khiến CI/CD hiểu nhầm là test suite đã dọn dẹp thành công 100%.
3. **Chưa có kiểm tra đối chiếu runtime `SELECT DB_NAME()` ở cấp độ `src/config/database.js`:**
   * Guard hiện tại chỉ kiểm tra chuỗi `config.db.database` trước khi gọi `sql.connect()`. Nếu user SQL Server có default database là `master` hoặc `vamos_store_db`, và chuỗi kết nối gặp lỗi fallback ngầm định, Guard tầng JS không phát hiện được.

---

## 9. KHUYẾN NGHỊ SỬA CHỮA THEO MỨC ĐỘ ƯU TIÊN

### 9.1. Mức độ CRITICAL (Nghiêm trọng — Bắt buộc xử lý trước khi chạy test suite bất kỳ)
1. **Đồng bộ hóa `process.env.NODE_ENV = 'test'` cho toàn bộ 14 test script:**
   Bổ sung dòng `process.env.NODE_ENV = 'test';` ngay đầu file (trước mọi `require`) cho tất cả các file:
   `test_auth_flow.js`, `test_audit_fixes.js`, `test_phase1` đến `test_phase7`, `test_live_search.js`, `test_wishlist_server.js`, `test_wl08_cross_browser.js`.
2. **Cập nhật script trong `package.json`:**
   Sửa lại các script kiểm thử để thiết lập tường minh biến môi trường ở cấp độ process:
   ```json
   "test:auth-flow": "node -e \"process.env.NODE_ENV='test'; require('./tests/test_auth_flow.js')\"",
   ```
   Hoặc nạp một file bootstrap chung `tests/bootstrap.js` có chứa `process.env.NODE_ENV = 'test'`.

### 9.2. Mức độ HIGH (Cao — Cần xử lý để hoàn thiện Stage 1A)
1. **Thu hẹp Allowlist trong `src/config/db-guard.js`:**
   Xóa bỏ wildcard `dbName.endsWith('_test_db') || dbName.endsWith('_test') || dbName.startsWith('test_')`.
   Chỉ cho phép duy nhất: `vamos_store_test_db` hoặc nếu dùng `DB_TEST_NAME` thì phải khớp Regex `^vamos_store_.*_test_db$`.
2. **Bảo vệ các script trong `database/`:**
   * Chuyển `database/seed_products.js` sang sử dụng `getPool()` của `src/config/database.js`.
   * Thêm Guard kiểm tra vào `database/init_mssql.js` để ngăn chạy nhầm script migrator vào database sản xuất.

### 9.3. Mức độ MEDIUM (Trung bình)
1. **Thêm cơ chế Runtime Assertion trong `src/config/database.js`:**
   Sau khi `sql.connect()` thành công, thực thi một query nhanh:
   `SELECT DB_NAME() AS actual_db;`
   Nếu `actual_db !== config.db.database`, ném Exception ngắt kết nối ngay lập tức.
2. **Không nuốt lỗi teardown trong `tests/test_loyalty_module.js`:**
   Ghi nhận cờ lỗi trong teardown để đảm bảo nếu dọn dẹp thất bại, quá trình test phải báo FAIL.

---

## 10. KẾT LUẬN KIỂM TOÁN STAGE 1A

Căn cứ vào toàn bộ bằng chứng phân tích mã nguồn và kiểm tra hệ thống:

### ĐÁNH GIÁ: **CONDITIONAL PASS (ĐẠT CÓ ĐIỀU KIỆN)**

* **Phần ĐẠT:**
  1. `src/config/app.config.js` đã giải quyết triệt để lỗi gán cứng cấu hình nhờ Dynamic Getters.
  2. `src/config/db-guard.js` hoạt động chính xác theo đúng 9 kịch bản kiểm thử in-memory, chặn đứng hoàn toàn `vamos_store_db` khi `NODE_ENV === 'test'`.
  3. `tests/test_loyalty_module.js` đã được tái cấu trúc xuất sắc: tài khoản test độc lập theo runId ngẫu nhiên, helper `setWalletBalanceFixture` bảo vệ sổ cái `ADMIN_ADJUSTMENT` trong transaction ACID, và cơ chế dọn dẹp fixture theo đúng thứ tự ràng buộc khóa ngoại.
* **ĐIỀU KIỆN BẮT BUỘC TRƯỚC KHI CHUYỂN BƯỚC:**
  1. **TUYỆT ĐỐI KHÔNG CHẠY `npm test`, `npm run test:all` hoặc các file test script cũ** vì 14 file test đó chưa được thiết lập `NODE_ENV = 'test'` và có thể ghi đè vào `vamos_store_db`.
  2. Cần phê duyệt việc thu hẹp allowlist của Guard (loại bỏ wildcard `*_test*`) và bổ sung `NODE_ENV = 'test'` cho toàn bộ thư mục `tests/`.

---

## 11. GIT POSTFLIGHT CHECK (Sau khi tạo báo cáo)

* Lệnh thực thi:
  ```powershell
  git status --porcelain=v1 -uall
  git diff --stat
  ```
* **Kết quả đo lường Postflight:**
  * Tracked Modified files: **88 files** (Hoàn toàn giữ nguyên, không đổi).
  * Untracked files (-uall): **125 files** (Tăng đúng 1 file duy nhất là bản báo cáo kiểm toán này: `docs/loyalty/VAMOS_CLUB_STAGE_1A_INDEPENDENT_AUDIT.md`).
  * Staged files: **0 files**.
  * Deleted files: **0 files**.
* Không có bất kỳ lệnh DDL/DML nào được thực thi trên database thật. Không có sự thay đổi dữ liệu nào phát sinh.

---
*Báo cáo được lập bởi Antigravity Agentic Auditor — Chế độ Read-Only hoàn tất, dừng lại chờ xem xét và phê duyệt của người dùng.*
