# BÁO CÁO KẾT QUẢ THỰC HIỆN PART B

# TÍCH HỢP WISHLIST PHÍA MÁY CHỦ SỬ DỤNG MICROSOFT SQL SERVER

**VAMOS STORE — SERVER-SIDE WISHLIST INTEGRATION**

---

## 1. SCHEMA DATABASE TRƯỚC VÀ SAU KHI THỰC HIỆN

### 1.1. Trước khi thực hiện (Baseline)

- Hệ thống có 20 bảng cơ sở dữ liệu (`users`, `products`, `carts`, `cart_items`, `orders`, `addresses`, `vouchers`, ...).
- **Hoàn toàn chưa có bảng lưu trữ Wishlist**.
- Danh sách yêu thích trước đây chỉ lưu tạm thời trên client-side thông qua `localStorage` (`vamos_guest_wishlist_v1` và `vamos_user_wishlist_${userId}`).
- Dữ liệu bị mất khi xóa bộ nhớ trình duyệt, đổi thiết bị hoặc chuyển máy, vi phạm tính toàn vẹn dữ liệu người dùng.

### 1.2. Sau khi thực hiện (Target Architecture)

- Hệ thống đã bổ sung bảng thứ 21: `wishlist_items` được thiết kế chuẩn mực quan hệ trên Microsoft SQL Server.
- Cấu trúc chi tiết:
  - `id INT IDENTITY(1,1) PRIMARY KEY`: Khóa chính tự tăng.
  - `user_id INT NOT NULL`: Khóa ngoại liên kết `users(id)` với hành vi `ON DELETE CASCADE`.
  - `product_id INT NOT NULL`: Khóa ngoại liên kết `products(id)` với hành vi `ON DELETE CASCADE`.
  - `created_at DATETIME2 NOT NULL DEFAULT GETDATE()`: Thời điểm lưu sản phẩm vào danh sách.
- Ràng buộc & Chỉ mục tối ưu hóa:
  - `CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id)`: Ngăn chặn tuyệt đối việc lưu trùng một sản phẩm trong cùng một tài khoản Customer.
  - `ix_wishlist_items_user_id`: Non-clustered index theo `user_id` tăng tốc độ truy vấn danh sách người dùng.
  - `ix_wishlist_items_product_id`: Non-clustered index theo `product_id` tối ưu khi kiểm tra hoặc thống kê theo sản phẩm.

---

## 2. MIGRATION ĐÃ TẠO

Đã tạo file migration:

- **Đường dẫn:** `database/migrations/004_create_wishlist_items.sql`
- **Đặc tính kỹ thuật:**
  - Viết bằng chuẩn T-SQL cho Microsoft SQL Server.
  - Idempotent & Non-destructive: Sử dụng `IF OBJECT_ID('wishlist_items', 'U') IS NULL` và `IF NOT EXISTS` cho index.
  - Đảm bảo an toàn 100%, có thể chạy lại nhiều lần mà không gây lỗi hoặc mất dữ liệu hiện hữu.
  - Đã tích hợp và tự động chạy qua migration runner `database/init_mssql.js`.

---

## 3. CÁC API ĐÃ TRIỂN KHAI

Tất cả các endpoint đều được đặt dưới tiền tố `/api/wishlist` và được bảo vệ nghiêm ngặt:

- **Authentication & RBAC:** Middleware `requireCustomer` đảm bảo chỉ Customer hợp lệ mới có thể truy cập; Guest nhận `401 Unauthorized`, Admin nhận `403 Forbidden`. `user_id` được trích xuất trực tiếp từ session server-side (`req.session.user.id`), client tuyệt đối không thể can thiệp hoặc giả mạo.
- **CSRF Defense:** Tất cả các mutating request (`POST`, `DELETE`) đều được bảo vệ bởi middleware CSRF (chấp nhận header `X-CSRF-Token` hoặc thuộc tính `_csrf` trong body).

| Phương thức | Endpoint                         | Chức năng                                     | Phản hồi chính                                                                 |
| ----------- | -------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| `GET`       | `/api/wishlist`                  | Lấy danh sách yêu thích của Customer hiện tại | `{ success: true, count: N, data: [...] }`                                     |
| `POST`      | `/api/wishlist/toggle`           | Chuyển đổi trạng thái lưu/bỏ lưu (1-click UX) | `{ success: true, action: 'added'\|'removed', inWishlist: boolean, count: N }` |
| `POST`      | `/api/wishlist/items`            | Thêm sản phẩm vào Wishlist (Idempotent)       | `{ success: true, action: 'added', inWishlist: true, count: N }`               |
| `DELETE`    | `/api/wishlist/items/:productId` | Xóa 1 sản phẩm khỏi Wishlist                  | `{ success: true, action: 'removed', inWishlist: false, count: N }`            |
| `DELETE`    | `/api/wishlist`                  | Xóa toàn bộ sản phẩm khỏi Wishlist            | `{ success: true, count: 0, message: '...' }`                                  |
| `POST`      | `/api/wishlist/migrate`          | Đồng bộ dữ liệu cũ an toàn cho Customer       | `{ success: true, migratedCount: N, count: N }`                                |

---

## 4. CONTROLLER, SERVICE, REPOSITORY ĐÃ TẠO VÀ SỬA

Tuân thủ kiến trúc phân tầng chuẩn mực: **Route → Controller → Service → Repository → SQL Server**:

1. **`src/models/repositories/wishlist.repository.js`:**
   - Thực thi các câu truy vấn T-SQL tham số hóa (`@userId`, `@productId`) chống 100% nguy cơ SQL Injection.
   - Hàm `findByUserId(userId)` kết hợp bảng `products` và `product_images` (lấy ảnh đại diện chính xác theo `is_primary DESC, display_order ASC`), lọc sản phẩm `status = 'active'`.
   - Các hàm: `findProductById`, `isInWishlist`, `addItem`, `removeItem`, `clearWishlist`, `countByUserId`.
2. **`src/services/wishlist.service.js`:**
   - Xử lý nghiệp vụ: kiểm tra tính hợp lệ của `productId`, kiểm tra sản phẩm có tồn tại và đang kinh doanh hay không (`status = 'active'`).
   - Tự động từ chối bằng mã lỗi `400 Bad Request` hoặc `404 Not Found`.
   - Đảm bảo tính nhất quán giữa bộ đếm `count` và dữ liệu thực tế.
3. **`src/controllers/wishlist.controller.js`:**
   - Tiếp nhận request, trích xuất `req.session.user.id`, chuyển giao cho Service.
   - Định dạng cấu trúc JSON trả về đồng bộ và bắt lỗi hệ thống trả về mã trạng thái HTTP chuẩn mực.
4. **`src/routes/wishlist.routes.js` & `src/routes/index.js`:**
   - Thiết lập tuyến đường và gắn middleware `requireCustomer`.
5. **`src/middlewares/auth.middleware.js`:**
   - Nâng cấp `requireCustomer`: Tự động nhận diện request dạng JSON/API để trả về JSON `403 Forbidden` khi tài khoản Quản trị viên (Admin) cố tình gọi API giao dịch khách hàng, thay vì chỉ redirect HTML.

---

## 5. TEMPLATE VÀ JAVASCRIPT ĐÃ SỬA

1. **`src/views/layouts/main.pug`:**
   - Cung cấp trạng thái ngữ cảnh toàn cục: `window.IS_ADMIN`, `window.IS_CUSTOMER`, `window.CSRF_TOKEN`.
   - Giữ nguyên bố cục Wishlist Modal chuẩn Stitch UI (`#vamos-wishlist-modal`, `#wishlist-guest-banner`, `#wishlist-empty-state`, `#wishlist-items-container`).
2. **`src/public/js/main.js`:**
   - **Xử lý Guest:** Khi Guest nhấn nút tim `.btn-wishlist`, hệ thống KHÔNG lưu vào bộ nhớ, KHÔNG ghi vào `localStorage`, KHÔNG tăng badge, KHÔNG đổi màu tim, và hiển thị Toast thông báo: _"Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích"_ kèm nút bấm chuyển hướng an toàn `[Đăng nhập ngay]` (`/auth/login?returnUrl=...`).
   - **Xử lý Customer:** Gửi API bất đồng bộ kèm CSRF token. Áp dụng cơ chế cập nhật giao diện chờ xác nhận từ server; nếu API gặp lỗi, lập tức khôi phục trạng thái ban đầu và hiển thị thông báo lỗi.
   - **Đồng bộ UI & Phân trang:** Khi tải lại trang hoặc khi người dùng chuyển trang/lọc danh mục bằng PJAX, hàm `window.syncWishlistUI()` tự động đồng bộ lại biểu tượng tim trên mọi thẻ sản phẩm dựa trên dữ liệu lấy từ SQL Server.

---

## 6. PHƯƠNG ÁN XỬ LÝ DỮ LIỆU WISHLIST LEGACY

- **Dữ liệu Guest (`vamos_guest_wishlist_v1`):** Ngừng hoàn toàn việc ghi mới dữ liệu vào key này. Không tự động nhập dữ liệu rác của Guest vào tài khoản khách hàng để tuân thủ nguyên tắc người dùng phải chủ động đăng nhập.
- **Dữ liệu Customer cũ (`vamos_user_wishlist_${userId}`):** Khi Customer đăng nhập, client kiểm tra nếu tồn tại dữ liệu legacy trong `localStorage`, client sẽ gọi API `/api/wishlist/migrate` gửi danh sách product ID. Phía server xác thực từng ID hợp lệ rồi lưu vào SQL Server. **Chỉ khi server phản hồi thành công (`success: true`), client mới thực hiện xóa key legacy này.**
- Từ thời điểm này, **Microsoft SQL Server là nguồn dữ liệu duy nhất (Single Source of Truth) cho Wishlist**.

---

## 7. KẾT QUẢ KIỂM THỬ THỰC TẾ

Đã xây dựng và thực thi bộ kiểm thử tích hợp chuyên biệt: `tests/test_wishlist_server.js` bao gồm đủ 14 ca kiểm thử từ `WL-01` đến `WL-14`:

|  Mã Test  | Tình huống kiểm thử                               | Kết quả thực tế | Ghi chú kỹ thuật                                                                                |
| :-------: | ------------------------------------------------- | :-------------: | ----------------------------------------------------------------------------------------------- |
| **WL-01** | Guest nhấn biểu tượng tim trên sản phẩm           |    **PASS**     | Giao diện hiển thị toast yêu cầu đăng nhập kèm link CTA; không lưu storage, badge giữ 0         |
| **WL-02** | Guest gọi `GET /api/wishlist`                     |    **PASS**     | Bị từ chối với HTTP 401 Unauthorized                                                            |
| **WL-03** | Guest gọi `POST /api/wishlist/toggle`             |    **PASS**     | Bị từ chối với HTTP 401 (khi có CSRF) hoặc 403 (khi thiếu CSRF)                                 |
| **WL-04** | Customer thêm sản phẩm vào Wishlist               |    **PASS**     | Phản hồi 200 OK; xác minh trực tiếp câu lệnh SQL thấy 1 bản ghi mới trong bảng `wishlist_items` |
| **WL-05** | Customer xóa sản phẩm khỏi Wishlist               |    **PASS**     | Phản hồi 200 OK; xác minh trực tiếp SQL thấy bản ghi đã được xóa hoàn toàn                      |
| **WL-06** | Customer tải lại trang (Page Reload)              |    **PASS**     | Gọi lại `GET /api/wishlist` trong session trả về đầy đủ sản phẩm đã lưu từ SQL Server           |
| **WL-07** | Customer đăng xuất rồi đăng nhập lại              |    **PASS**     | Tạo phiên làm việc mới hoàn toàn, dữ liệu Wishlist vẫn được nạp nguyên vẹn từ CSDL              |
| **WL-08** | Customer truy cập từ thiết bị / User-Agent khác   |    **PASS**     | Khởi tạo client mới với User-Agent di động, lấy thành công toàn bộ danh sách                    |
| **WL-09** | Tài khoản Customer 2 truy cập                     |    **PASS**     | Customer 2 có danh sách độc lập (0 món); SQL xác nhận không có tình trạng rò rỉ chéo dữ liệu    |
| **WL-10** | Thêm sản phẩm trùng lặp nhiều lần                 |    **PASS**     | Ràng buộc UNIQUE constraint giữ đúng 1 bản ghi duy nhất, không phát sinh trùng lặp              |
| **WL-11** | Gọi API với Product ID không tồn tại (`999999`)   |    **PASS**     | Bị từ chối với HTTP 404 Not Found kèm thông báo rõ ràng                                         |
| **WL-12** | Tài khoản Quản trị viên (Admin) gọi API Wishlist  |    **PASS**     | Bị từ chối với HTTP 403 Forbidden cho cả GET và POST                                            |
| **WL-13** | Mutating request không có hoặc sai CSRF token     |    **PASS**     | Bị từ chối với HTTP 403 Forbidden theo tiêu chuẩn bảo mật OWASP                                 |
| **WL-14** | Xử lý lỗi đầu vào không hợp lệ (chuỗi thay vì số) |    **PASS**     | Phản hồi HTTP 400 Bad Request một cách an toàn, không gây crash ứng dụng                        |

---

## 8. BẰNG CHỨNG LƯU TRỮ VÀ CÔ LẬP DỮ LIỆU SQL SERVER

Truy vấn kiểm tra trực tiếp trên Microsoft SQL Server:

```sql
-- Kiểm tra cấu trúc ràng buộc bảng wishlist_items
SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_NAME = 'wishlist_items';
-- Kết quả:
-- 1. PK__wishlist__3213E83F0330F2F5 (PRIMARY KEY)
-- 2. uq_wishlist_user_product (UNIQUE)
-- 3. fk_wishlist_items_user (FOREIGN KEY)
-- 4. fk_wishlist_items_product (FOREIGN KEY)
```

Kiểm tra cô lập dữ liệu giữa 2 tài khoản:

```sql
-- Dữ liệu Customer 1 (user_id = 3)
SELECT COUNT(*) FROM wishlist_items WHERE user_id = 3; --> Trả về dữ liệu thực tế đã lưu

-- Dữ liệu Customer 2 (user_id = 2)
SELECT COUNT(*) FROM wishlist_items WHERE user_id = 2; --> Trả về 0 (hoàn toàn độc lập)
```

---

## 9. KIỂM TRA HỒI QUY TOÀN BỘ HỆ THỐNG (REGRESSION MATRIX)

Đã chạy lại toàn bộ các test suite hiện hữu của dự án để đảm bảo không có bất kỳ chức năng cũ nào bị ảnh hưởng:

- **`tests/test_phase1_role_separation.js`:** 11/11 PASSED (100%)
- **`tests/test_phase2_wishlist.js`:** 7/7 PASSED (100%)
- **`tests/test_phase3_theme.js`:** 8/8 PASSED (100%)
- **`tests/test_phase4_i18n.js`:** 8/8 PASSED (100%)
- **`tests/test_phase5_functional.js`:** 7/7 PASSED (100%)
- **`tests/test_phase6_data_integrity.js`:** 3/3 PASSED (100%)
- **`tests/test_phase7_browser_matrix.js` (Playwright E2E):** 11/11 PASSED (100%)
- **`tests/test_wishlist_server.js` (Wishlist Suite mới):** 14/14 PASSED (100%)

👉 **TỔNG CỘNG:** **69/69 KIỂM THỬ THỰC TẾ PASSED (0 FAIL, 0 NOT RUN, 0 CANCELED).**

---

## 10. TRẠNG THÁI GIT HIỆN TẠI

```text
On branch fix/master-repair-plan
Changes not staged for commit:
	modified:   docs/audit/FINAL_AUDIT_REPORT.md
	modified:   docs/audit/TEST_RESULTS.md
	modified:   docs/qa/BUG_BACKLOG.md
	modified:   docs/qa/PHASED_REPAIR_PLAN.md
	modified:   docs/qa/phase-reports/PHASE_0_BASELINE.md
	modified:   docs/qa/phase-reports/PHASE_1_ROLE_ADMIN.md
	modified:   docs/qa/phase-reports/PHASE_2_WISHLIST.md
	modified:   docs/qa/phase-reports/PHASE_3_THEME.md
	modified:   docs/qa/phase-reports/PHASE_4_I18N.md
	modified:   docs/qa/phase-reports/PHASE_5_FUNCTIONAL_AUDIT.md
	modified:   docs/qa/phase-reports/PHASE_6_ADMIN_DATA.md
	modified:   docs/qa/phase-reports/PHASE_7_FINAL_TEST.md
	modified:   src/locales/en.json
	modified:   src/locales/vi.json
	modified:   src/middlewares/auth.middleware.js
	modified:   src/public/js/main.js
	modified:   src/routes/index.js
	modified:   src/views/layouts/admin.pug
	modified:   src/views/layouts/main.pug

Untracked files:
	database/migrations/004_create_wishlist_items.sql
	docs/qa/FINAL_INDEPENDENT_AUDIT.md
	docs/qa/phase-reports/PHASE_B_SERVER_SIDE_WISHLIST.md
	src/controllers/wishlist.controller.js
	src/models/repositories/wishlist.repository.js
	src/routes/wishlist.routes.js
	src/services/wishlist.service.js
	tests/test_wishlist_server.js

no changes added to commit (use "git add" and/or "git commit -a")
```

- Không stage, không commit, không push, không merge.
- Toàn bộ 15 file của Part A được bảo toàn nguyên vẹn.
