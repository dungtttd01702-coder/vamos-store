# TỪ ĐIỂN DỮ LIỆU CƠ SỞ DỮ LIỆU VAMOS CLUB
## Data Dictionary: Loyalty, Review & Redemption Schema (Microsoft SQL Server 2022)

---

## 1. BẢNG `reviews` (Đánh Giá Sản Phẩm Khách Hàng)

| Tên Cột | Kiểu Dữ Liệu | Khóa | Ràng Buộc (Constraints) | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT IDENTITY(1,1)` | PK | NOT NULL | Khóa chính tự tăng định danh duy nhất bản ghi đánh giá. |
| `user_id` | `INT` | FK | NOT NULL, REFERENCES `users(id)` | Mã tài khoản khách hàng thực hiện đánh giá. |
| `order_id` | `INT` | FK | NOT NULL, REFERENCES `orders(id)` | Mã đơn hàng hợp lệ mà sản phẩm được mua. |
| `product_id` | `INT` | FK | NOT NULL, REFERENCES `products(id)` | Mã sản phẩm giày được đánh giá. |
| `rating` | `INT` | | NOT NULL, CHECK (1 <= rating <= 5) | Số sao đánh giá chất lượng (1 đến 5 sao). |
| `comment` | `NVARCHAR(2000)` | | NULL | Nội dung nhận xét chi tiết của khách hàng về sản phẩm. |
| `quick_tags` | `NVARCHAR(500)` | | NULL | Danh sách thẻ cảm nhận nhanh được chọn dưới dạng JSON array. |
| `points_earned` | `INT` | | NOT NULL, DEFAULT 100, CHECK (100 <= points_earned <= 300) | Số điểm VAMOS Club được cộng cho bài đánh giá này (100 đến 300 điểm). |
| `status` | `NVARCHAR(20)` | | NOT NULL, DEFAULT 'APPROVED', CHECK (IN ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN')) | Trạng thái kiểm duyệt bài đánh giá. |
| `created_at` | `DATETIME2` | | NOT NULL, DEFAULT GETDATE() | Thời điểm khách hàng gửi đánh giá. |
| `updated_at` | `DATETIME2` | | NOT NULL, DEFAULT GETDATE() | Thời điểm cập nhật đánh giá gần nhất. |

- **Ràng buộc duy nhất (Unique Constraint):** `uq_reviews_order_product (order_id, product_id)` — Ngăn chặn một khách hàng đánh giá nhận điểm nhiều lần cho cùng một sản phẩm trong một đơn hàng.
- **Chỉ mục (Indexes):**
  * `ix_reviews_product_status (product_id, status) INCLUDE (rating, created_at, points_earned)` — Tối ưu hóa truy vấn hiển thị đánh giá tại trang chi tiết sản phẩm.
  * `ix_reviews_user_id (user_id)` — Tối ưu hóa truy vấn lịch sử đánh giá của khách hàng.

---

## 2. BẢNG `review_media` (Tập Tin Đính Kèm Đánh Giá)

| Tên Cột | Kiểu Dữ Liệu | Khóa | Ràng Buộc (Constraints) | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT IDENTITY(1,1)` | PK | NOT NULL | Khóa chính tự tăng định danh tệp phương tiện. |
| `review_id` | `INT` | FK | NOT NULL, REFERENCES `reviews(id)` ON DELETE CASCADE | Mã bài đánh giá sở hữu tập tin này. |
| `media_type` | `NVARCHAR(20)` | | NOT NULL, DEFAULT 'IMAGE', CHECK (IN ('IMAGE', 'VIDEO')) | Phân loại tập tin đa phương tiện. |
| `media_url` | `NVARCHAR(500)` | | NOT NULL | Đường dẫn URL truy cập hình ảnh tĩnh trên máy chủ (`/uploads/reviews/...`). |
| `original_filename` | `NVARCHAR(255)` | | NULL | Tên gốc của tệp trước khi được băm ngẫu nhiên. |
| `file_size` | `INT` | | NOT NULL, CHECK (file_size > 0) | Kích thước tệp tin tính bằng bytes (tối đa 5MB). |
| `created_at` | `DATETIME2` | | NOT NULL, DEFAULT GETDATE() | Thời điểm tệp được tải lên và lưu trữ. |

- **Chỉ mục (Indexes):** `ix_review_media_review_id (review_id)` — Tăng tốc tải ảnh theo từng bài review.

---

## 3. BẢNG `user_points_wallets` (Ví Điểm Thưởng Khách Hàng)

| Tên Cột | Kiểu Dữ Liệu | Khóa | Ràng Buộc (Constraints) | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | `INT` | PK, FK | NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE | Mã tài khoản người dùng, đồng thời là khóa chính 1-1 của ví điểm. |
| `available_points` | `INT` | | NOT NULL, DEFAULT 0, CHECK (available_points >= 0) | Số dư điểm thưởng khả dụng để đổi voucher. Không bao giờ âm. |
| `lifetime_earned_points` | `INT` | | NOT NULL, DEFAULT 0, CHECK (lifetime_earned_points >= 0) | Tổng điểm tích lũy trọn đời từ mọi nguồn (dùng để tính cấp độ VIP). |
| `lifetime_redeemed_points`| `INT` | | NOT NULL, DEFAULT 0, CHECK (lifetime_redeemed_points >= 0) | Tổng số điểm đã tiêu dùng để đổi voucher hoặc quà tặng. |
| `tier_code` | `NVARCHAR(20)` | | NOT NULL, DEFAULT 'MEMBER', CHECK (IN ('MEMBER', 'SILVER', 'GOLD', 'VIP')) | Hạng thành viên hiện tại của khách hàng. |
| `created_at` | `DATETIME2` | | NOT NULL, DEFAULT GETDATE() | Thời điểm tạo ví điểm thành viên. |
| `updated_at` | `DATETIME2` | | NOT NULL, DEFAULT GETDATE() | Thời điểm số dư hoặc cấp độ được cập nhật gần nhất. |

---

## 4. BẢNG `point_transactions` (Sổ Cái Lịch Sử Biến Động Điểm)

| Tên Cột | Kiểu Dữ Liệu | Khóa | Ràng Buộc (Constraints) | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT IDENTITY(1,1)` | PK | NOT NULL | Khóa chính tự tăng định danh bút toán sổ cái. |
| `user_id` | `INT` | FK | NOT NULL, REFERENCES `users(id)` | Mã tài khoản khách hàng thực hiện giao dịch. |
| `transaction_type` | `NVARCHAR(30)` | | NOT NULL, CHECK (IN ('REVIEW_REWARD', 'ORDER_PURCHASE', 'VOUCHER_REDEMPTION', 'REWARD_REVERSAL', 'ADMIN_ADJUSTMENT')) | Loại giao dịch biến động điểm. |
| `amount` | `INT` | | NOT NULL, CHECK (amount <> 0) | Số điểm biến động (+ là cộng, - là trừ). Không được bằng 0. |
| `balance_after` | `INT` | | NOT NULL, CHECK (balance_after >= 0) | Số dư khả dụng của ví điểm ngay sau khi áp dụng giao dịch này. |
| `reference_type` | `NVARCHAR(50)` | | NULL | Loại đối tượng liên quan (`REVIEW`, `ORDER`, `VOUCHER_REDEMPTION`). |
| `reference_id` | `NVARCHAR(100)`| | NULL | Khóa ngoại mềm định danh đối tượng gốc. |
| `description` | `NVARCHAR(500)`| | NOT NULL | Diễn giải chi tiết lý do biến động điểm để khách hàng đối soát. |
| `idempotency_key` | `NVARCHAR(100)`| | NULL | Khóa chống trùng lặp giao dịch (Idempotent Key). |
| `created_at` | `DATETIME2` | | NOT NULL, DEFAULT GETDATE() | Thời điểm ghi sổ giao dịch bất biến. |

- **Chỉ mục (Indexes):**
  * `uq_point_tx_idempotency (idempotency_key) WHERE idempotency_key IS NOT NULL` — Filtered Unique Index ngăn chặn ghi trùng giao dịch do retry mạng.
  * `ix_point_tx_user_created (user_id, created_at DESC)` — Tối ưu hóa hiển thị lịch sử biến động điểm theo dòng thời gian.

---

## 5. BẢNG `point_reward_rules` (Cấu Hình Quy Tắc Đổi Thưởng)

| Tên Cột | Kiểu Dữ Liệu | Khóa | Ràng Buộc (Constraints) | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT IDENTITY(1,1)` | PK | NOT NULL | Khóa chính tự tăng của quy tắc đổi thưởng. |
| `title` | `NVARCHAR(200)`| | NOT NULL | Tiêu đề phần thưởng hiển thị trên giao diện Đổi Quà. |
| `description` | `NVARCHAR(500)`| | NULL | Điều kiện áp dụng của phần thưởng. |
| `reward_type` | `NVARCHAR(30)` | | NOT NULL, DEFAULT 'VOUCHER', CHECK (IN ('VOUCHER', 'PHYSICAL_GIFT', 'FREE_SHIPPING')) | Phân loại phần thưởng. |
| `points_required` | `INT` | | NOT NULL, CHECK (points_required > 0) | Số điểm cần tiêu tốn để đổi được phần thưởng này. |
| `discount_type` | `NVARCHAR(20)` | | NOT NULL, DEFAULT 'fixed_amount', CHECK (IN ('fixed_amount', 'percentage', 'free_shipping')) | Kiểu giảm giá của voucher được phát hành. |
| `discount_value` | `DECIMAL(12,0)`| | NOT NULL, DEFAULT 0, CHECK (discount_value >= 0) | Giá trị giảm (số tiền hoặc %). |
| `min_order_amount` | `DECIMAL(12,0)`| | NOT NULL, DEFAULT 0, CHECK (min_order_amount >= 0) | Giá trị đơn hàng tối thiểu để áp dụng voucher. |
| `max_discount_amount`| `DECIMAL(12,0)`| | NULL | Mức giảm tối đa (đối với voucher % giảm giá). |
| `target_product_id` | `INT` | FK | NULL, REFERENCES `products(id)` | Khóa ngoại tới sản phẩm áp dụng riêng (nếu có). |
| `voucher_valid_days` | `INT` | | NOT NULL, DEFAULT 30, CHECK (voucher_valid_days > 0) | Số ngày hiệu lực của voucher kể từ ngày đổi. |
| `stock_quantity` | `INT` | | NOT NULL, DEFAULT 0, CHECK (stock_quantity >= 0) | Số lượng phần thưởng trong kho. |
| `is_active` | `BIT` | | NOT NULL, DEFAULT 1 | Cờ kích hoạt quy tắc đổi thưởng. |
| `sort_order` | `INT` | | NOT NULL, DEFAULT 0 | Thứ tự sắp xếp hiển thị trên giao diện Đổi Quà. |
| `created_at` | `DATETIME2` | | NOT NULL, DEFAULT GETDATE() | Thời điểm tạo quy tắc. |
| `updated_at` | `DATETIME2` | | NOT NULL, DEFAULT GETDATE() | Thời điểm cập nhật quy tắc gần nhất. |

---

## 6. BẢNG `voucher_redemptions` (Quản Lý Voucher Cá Nhân Đã Đổi)

| Tên Cột | Kiểu Dữ Liệu | Khóa | Ràng Buộc (Constraints) | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT IDENTITY(1,1)` | PK | NOT NULL | Khóa chính tự tăng của lượt đổi thưởng. |
| `user_id` | `INT` | FK | NOT NULL, REFERENCES `users(id)` | Mã tài khoản sở hữu voucher cá nhân này. |
| `reward_rule_id` | `INT` | FK | NOT NULL, REFERENCES `point_reward_rules(id)` | Mã quy tắc đổi thưởng gốc. |
| `voucher_id` | `INT` | FK | NOT NULL, REFERENCES `vouchers(id)` | Mã voucher được phát hành trong hệ thống. |
| `points_spent` | `INT` | | NOT NULL, CHECK (points_spent > 0) | Số điểm đã tiêu tốn cho lượt đổi này. |
| `status` | `NVARCHAR(20)` | | NOT NULL, DEFAULT 'AVAILABLE', CHECK (IN ('AVAILABLE', 'USED', 'EXPIRED', 'REVOKED')) | Trạng thái khả dụng của voucher cá nhân. |
| `redeemed_at` | `DATETIME2` | | NOT NULL, DEFAULT GETDATE() | Thời điểm đổi voucher. |
| `used_at` | `DATETIME2` | | NULL | Thời điểm voucher được áp dụng cho đơn hàng COD thành công. |
| `created_at` | `DATETIME2` | | NOT NULL, DEFAULT GETDATE() | Thời điểm tạo bản ghi. |

- **Chỉ mục (Indexes):**
  * `uq_redemptions_voucher (voucher_id)` — Ràng buộc 1-1 mỗi voucher đổi điểm chỉ có duy nhất một bản ghi quản lý quyền sở hữu.
  * `ix_redemptions_user_status (user_id, status)` — Tối ưu hóa truy vấn hiển thị danh sách voucher cá nhân khả dụng của khách hàng.

---

## 7. MÔ HÌNH DỰ KIẾN CHO MIGRATION 006 [THIẾT KẾ ĐỀ XUẤT - CHƯA TRIỂN KHAI]

> [!WARNING]
> **TRẠNG THÁI: [THIẾT KẾ ĐỀ XUẤT - CHƯA ÁP DỤNG / NOT APPLIED]**  
> Phần này mô tả thiết kế kỹ thuật dự kiến nhằm phục vụ 3 chính sách đã chốt (Chu kỳ 12 tháng, Điểm hết hạn 365 ngày, Soft Landing). Chưa tạo file migration và chưa chạy DDL vào cơ sở dữ liệu.

### 7.1. Cột Dự Kiến Bổ Sung Cho Bảng `user_points_wallets`
| Tên Cột | Kiểu Dữ Liệu | Cho Phép NULL | Mặc Định | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :--- | :--- |
| `cycle_start_at` | `DATETIME2` | YES | `NULL` | Thời điểm bắt đầu chu kỳ 12 tháng (kích hoạt tại giao dịch tích điểm hợp lệ đầu tiên). |
| `cycle_end_at` | `DATETIME2` | YES | `NULL` | Thời điểm kết thúc chu kỳ (`DATEADD(year, 1, cycle_start_at)`). |
| `qualifying_points_cycle` | `INT` | NO | `0` | Tổng điểm xét hạng trong chu kỳ 12 tháng hiện tại. Reset về 0 khi sang chu kỳ mới. |

### 7.2. Bảng Mới Dự Kiến: `loyalty_point_batches` (Quản Lý Lô Điểm & Hạn 365 Ngày)
- **Tên bảng vật lý:** `loyalty_point_batches`
- **Mục đích:** Theo dõi thời hạn 365 ngày của từng đợt tích điểm và hỗ trợ giải thuật trừ điểm FEFO mà không phá vỡ tính bất biến của sổ cái `point_transactions`.

| Tên Cột | Kiểu Dữ Liệu | Khóa | Ràng Buộc (Constraints) | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `INT IDENTITY(1,1)` | PK | NOT NULL | Khóa chính tự tăng của lô điểm |
| `user_id` | `INT` | FK | NOT NULL, REFERENCES `users(id)` | Khách hàng sở hữu lô điểm |
| `transaction_id` | `INT` | FK | NOT NULL, REFERENCES `point_transactions(id)` | Giao dịch tích điểm gốc sinh ra lô này |
| `initial_points` | `INT` | | NOT NULL, CHECK (initial_points > 0) | Số điểm ban đầu của lô điểm |
| `remaining_points` | `INT` | | NOT NULL, CHECK (remaining_points >= 0 AND remaining_points <= initial_points) | Số điểm khả dụng còn lại của lô |
| `expires_at` | `DATETIME2` | | NOT NULL | Thời điểm hết hạn sau 365 ngày (`DATEADD(day, 365, created_at)`) |
| `status` | `NVARCHAR(20)` | | NOT NULL, DEFAULT 'ACTIVE', CHECK (IN ('ACTIVE', 'EXHAUSTED', 'EXPIRED')) | Trạng thái lô điểm |
| `created_at` | `DATETIME2` | | NOT NULL, DEFAULT GETDATE() | Thời điểm tạo lô |
| `updated_at` | `DATETIME2` | | NOT NULL, DEFAULT GETDATE() | Thời điểm cập nhật cuối cùng |

- **Chỉ mục tối ưu FEFO:**
  `CREATE NONCLUSTERED INDEX ix_batches_fefo ON loyalty_point_batches (user_id, status, expires_at ASC) INCLUDE (remaining_points) WHERE status = 'ACTIVE';`

### 7.3. Mở Rộng Ràng Buộc `point_transactions.transaction_type`
- Bổ sung loại giao dịch: `'POINT_EXPIRATION'` (ghi nhận khi một lô điểm đến hạn 365 ngày bị thu hồi).

