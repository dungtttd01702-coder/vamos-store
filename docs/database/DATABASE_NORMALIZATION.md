# BÁO CÁO PHÂN TÍCH CHUẨN HÓA DỮ LIỆU (DATABASE NORMALIZATION ANALYSIS)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ BÁN GIÀY VAMOS STORE

> **Hệ quản trị CSDL:** Microsoft SQL Server (T-SQL)  
> **Cơ sở dữ liệu:** `vamos_store_db`  
> **Phiên bản tài liệu:** v2.2 (Chuẩn hóa học thuật — Phân tích chi tiết theo Phụ thuộc hàm & Lưu trữ Dữ liệu Lịch sử Giao dịch)  
> **Cập nhật ngày:** 14/11/2026

---

## 1. Cơ sở Lý thuyết Chuẩn hóa Cơ sở Dữ liệu Quan hệ

Chuẩn hóa dữ liệu (Database Normalization) là kỹ thuật phân rã và cấu trúc bảng trong mô hình dữ liệu quan hệ (Codd, 1970) nhằm:
- **Tối thiểu hóa dư thừa dữ liệu (Data Redundancy):** Tránh lưu trữ lặp lại thông tin không cần thiết.
- **Triệt tiêu các bất thường khi thao tác dữ liệu (Data Anomalies):**
  - *Bất thường khi chèn (Insertion Anomaly):* Không thể ghi nhận một sự kiện nếu thiếu thông tin chưa liên quan.
  - *Bất thường khi xóa (Deletion Anomaly):* Xóa một thực thể phụ vô tình làm mất thông tin của thực thể chính.
  - *Bất thường khi cập nhật (Update Anomaly):* Sửa đổi dữ liệu tại một nơi nhưng để sót ở nơi khác, gây mâu thuẫn dữ liệu.
- **Bảo toàn các phụ thuộc hàm (Functional Dependencies — FD):** Biểu diễn chính xác mối quan hệ ngữ nghĩa giữa các thuộc tính.

---

## 2. Tiêu chuẩn Định nghĩa Ba Dạng Chuẩn Cốt lõi (1NF, 2NF, 3NF)

### 2.1. Dạng chuẩn 1 (1NF — First Normal Form)
Một quan hệ $R$ đạt Dạng chuẩn 1 khi và chỉ khi:
1. Tồn tại một khóa chính (Primary Key) xác định duy nhất từng bản ghi.
2. **Tính nguyên tử (Atomicity):** Mọi thuộc tính (cột) chỉ chứa một giá trị đơn tính từ miền giá trị nguyên tố. Tuyệt đối không chứa mảng giá trị, danh sách phân tách bằng dấu phẩy, hoặc các nhóm lặp thuộc tính (Repeating Groups).

### 2.2. Dạng chuẩn 2 (2NF — Second Normal Form)
Một quan hệ $R$ đạt Dạng chuẩn 2 khi và chỉ khi:
1. Đã đạt Dạng chuẩn 1 (1NF).
2. **Không tồn tại phụ thuộc hàm bộ phận (No Partial Functional Dependency):** Mọi thuộc tính không khóa phải phụ thuộc hàm đầy đủ (Full Functional Dependency) vào toàn bộ khóa chính:
   $$\forall A \notin PK, \quad PK \rightarrow A \quad \text{và} \quad \nexists PK' \subset PK: PK' \rightarrow A$$
   *(Hệ quả: Nếu khóa chính là khóa đơn — chỉ gồm 1 cột — thì quan hệ nghiễm nhiên đạt 2NF do không thể tồn tại tập con thực sự $PK'$)*.

### 2.3. Dạng chuẩn 3 (3NF — Third Normal Form)
Một quan hệ $R$ đạt Dạng chuẩn 3 khi và chỉ khi:
1. Đã đạt Dạng chuẩn 2 (2NF).
2. **Không tồn tại phụ thuộc hàm bắc cầu (No Transitive Functional Dependency):** Mọi thuộc tính không khóa phải phụ thuộc trực tiếp vào khóa chính, không phụ thuộc thông qua một thuộc tính không khóa khác.
   Nói cách khác, với mọi phụ thuộc hàm không tầm thường $X \rightarrow A$, điều kiện bắt buộc là:
   - $X$ phải là một siêu khóa (Superkey), **HOẶC**
   - $A$ phải là một thuộc tính khóa (Prime Attribute — thuộc về một khóa ứng viên nào đó).

---

## 3. Phân biệt Dữ liệu Danh mục (Master Data) và Lưu trữ Dữ liệu Giao dịch (Transaction Data)

Trong kỹ thuật phần mềm và hệ thống thông tin kế toán thương mại điện tử, việc thiết kế cơ sở dữ liệu đòi hỏi sự phân định rạch ròi giữa hai nhóm dữ liệu:

1. **Dữ liệu Danh mục và Cấu hình (Master / Reference Data):**
   - Đại diện cho các đối tượng nghiệp vụ ở trạng thái hiện hành: `users`, `products`, `product_variants`, `categories`, `brands`, `sizes`, `colors`, `vouchers`...
   - **Mục tiêu:** Áp dụng triệt để **3NF thuần túy** để chống trùng lặp dữ liệu và bảo đảm tính nhất quán khi quản trị viên cập nhật thông tin (`UPDATE`).
2. **Lưu trữ Dữ liệu Giao dịch và Chứng từ Lịch sử (Transaction Ledger / Historical Data):**
   - Đại diện cho sự kiện kinh tế đã diễn ra tại một thời điểm xác định ($t_0$): `orders`, `order_items`, `order_status_histories`, `inventory_transactions`.
   - **Đặc trưng:** Dữ liệu có tính bất biến (Append-only / Immutable). Đơn hàng sau khi đặt thành công sẽ trở thành chứng từ pháp lý và kế toán.
   - **Kỹ thuật Chụp ảnh Lịch sử (Point-in-Time Historical Snapshotting):**
     + *Lưu ý học thuật:* **Không tồn tại khái niệm chính thức gọi là "Temporal 3NF"** trong lý thuyết cơ sở dữ liệu quan hệ chuẩn mực. Về bản chất lý thuyết quan hệ cổ điển, việc lưu lại tên sản phẩm hay đơn giá tại thời điểm đặt hàng trông có vẻ giống phụ thuộc bắc cầu, nhưng trong ngữ cảnh thời gian, đây là việc **lưu trữ trạng thái lịch sử có chủ đích (Deliberate Historical Snapshotting)** để bảo vệ tính toàn vẹn của chứng từ kế toán.
     + Nếu không chụp lại snapshot mà chỉ tham chiếu tới bảng danh mục hiện tại, khi Admin đổi giá hoặc đổi tên sản phẩm ở thời điểm $t_1$, toàn bộ các hóa đơn đã giao trong quá khứ ($t_0$) sẽ bị thay đổi doanh thu, gây sai lệch báo cáo tài chính nghiêm trọng.

---

## 4. Phân tích Chi tiết 13 Bảng Nghiệp vụ Trọng yếu

Dưới đây là phân tích chi tiết phụ thuộc hàm, khóa ứng viên, tính nguyên tử và mức độ chuẩn hóa của 13 bảng trung tâm:

---

### 4.1. Bảng `users` (Tài khoản Người dùng)
- **Tập thuộc tính:** `(id, full_name, email, password_hash, phone, role, status, created_at, updated_at)`
- **Khóa chính (PK):** `id` | **Khóa ứng viên (Candidate Key):** `email`
- **Phụ thuộc hàm chính:**
  - $id \rightarrow \{full\_name, email, password\_hash, phone, role, status, created\_at, updated\_at\}$
  - $email \rightarrow \{id, full\_name, password\_hash, phone, role, status, created\_at, updated\_at\}$
- **Đánh giá chuẩn hóa:**
  - **1NF:** ĐẠT. Cột `phone`, `email` lưu giá trị chuỗi đơn nguyên tử.
  - **2NF:** ĐẠT. Khóa chính đơn `id`, không có phụ thuộc bộ phận.
  - **3NF:** ĐẠT. Không có phụ thuộc bắc cầu giữa các thuộc tính không khóa.

---

### 4.2. Bảng `addresses` (Sổ Địa chỉ Giao hàng)
- **Tập thuộc tính:** `(id, user_id, recipient_name, phone, province, district, ward, detail_address, is_default, created_at, updated_at)`
- **Khóa chính (PK):** `id` | **Khóa ngoại (FK):** `user_id` $\rightarrow$ `users(id)`
- **Phụ thuộc hàm chính:**
  - $id \rightarrow \{user\_id, recipient\_name, phone, province, district, ward, detail\_address, is\_default, created\_at, updated\_at\}$
- **Đánh giá chuẩn hóa:**
  - **1NF:** ĐẠT. Địa chỉ được phân rã thành các cấp hành chính nguyên tử (`province`, `district`, `ward`, `detail_address`).
  - **2NF:** ĐẠT. Khóa chính đơn `id`.
  - **3NF:** ĐẠT. `recipient_name` và `phone` là thông tin liên hệ riêng của địa chỉ này, phụ thuộc trực tiếp vào `id` địa chỉ.

---

### 4.3. Bảng `products` (Sản phẩm Chính)
- **Tập thuộc tính:** `(id, category_id, brand_id, product_code, name, slug, description, gender_target, base_price, sale_price, status, created_at, updated_at)`
- **Khóa chính (PK):** `id` | **Khóa ứng viên:** `product_code`, `slug`
- **Khóa ngoại (FK):** `category_id` $\rightarrow$ `categories(id)`, `brand_id` $\rightarrow$ `brands(id)`
- **Phụ thuộc hàm chính:**
  - $id \rightarrow \{category\_id, brand\_id, product\_code, name, slug, description, gender\_target, base\_price, sale\_price, status, created\_at, updated\_at\}$
  - $product\_code \rightarrow \{id, \dots\}$
  - $slug \rightarrow \{id, \dots\}$
- **Đánh giá chuẩn hóa:**
  - **1NF:** ĐẠT. Không lưu mảng các kích cỡ hay màu sắc; các thuộc tính phân loại được chuẩn hóa sang các bảng liên quan.
  - **2NF:** ĐẠT. Khóa chính đơn `id`.
  - **3NF:** ĐẠT. Bảng chỉ lưu `category_id` và `brand_id`. Tên danh mục hay mô tả thương hiệu không bị nhân bản vào `products`, loại bỏ phụ thuộc bắc cầu.

---

### 4.4. Bảng `product_variants` (Biến thể SKU Giày)
- **Tập thuộc tính:** `(id, product_id, size_id, color_id, sku, stock_quantity, status, created_at, updated_at)`
- **Khóa chính (PK):** `id` | **Khóa ứng viên:** `sku`, `(product_id, size_id, color_id)`
- **Khóa ngoại (FK):** `product_id` $\rightarrow$ `products(id)`, `size_id` $\rightarrow$ `sizes(id)`, `color_id` $\rightarrow$ `colors(id)`
- **Phụ thuộc hàm chính:**
  - $id \rightarrow \{product\_id, size\_id, color\_id, sku, stock\_quantity, status, created\_at, updated\_at\}$
  - $sku \rightarrow \{id, product\_id, size\_id, color\_id, stock\_quantity, status\}$
  - $(product\_id, size\_id, color\_id) \rightarrow \{id, sku, stock\_quantity, status\}$
- **Đánh giá chuẩn hóa:**
  - **1NF:** ĐẠT. Mỗi bản ghi đại diện cho đúng một tổ hợp duy nhất gồm 1 cỡ giày và 1 màu sắc.
  - **2NF:** ĐẠT. Xét theo khóa ứng viên ghép $(product\_id, size\_id, color\_id)$, số lượng tồn `stock_quantity` phụ thuộc đầy đủ vào cả 3 thành phần (tồn kho của cỡ 42 màu Đen thuộc sản phẩm X).
  - **3NF:** ĐẠT. Tên kích cỡ (`size_name`) và tên màu (`color_name`, `hex_code`) không được lưu lặp lại tại đây mà truy xuất qua `JOIN`.

---

### 4.5. Bảng `carts` (Giỏ hàng Người dùng)
- **Tập thuộc tính:** `(id, user_id, created_at, updated_at)`
- **Khóa chính (PK):** `id` | **Khóa ứng viên / Khóa ngoại:** `user_id` $\rightarrow$ `users(id)` (Quan hệ 1-1 qua ràng buộc Unique `user_id`)
- **Phụ thuộc hàm chính:**
  - $id \leftrightarrow user\_id \rightarrow \{created\_at, updated\_at\}$
- **Đánh giá chuẩn hóa:** ĐẠT 1NF, 2NF, 3NF thuần túy.

---

### 4.6. Bảng `cart_items` (Chi tiết Mặt hàng trong Giỏ)
- **Tập thuộc tính:** `(id, cart_id, variant_id, quantity, created_at, updated_at)`
- **Khóa chính (PK):** `id` | **Khóa ứng viên:** `(cart_id, variant_id)`
- **Khóa ngoại (FK):** `cart_id` $\rightarrow$ `carts(id)`, `variant_id` $\rightarrow$ `product_variants(id)`
- **Phụ thuộc hàm chính:**
  - $id \rightarrow \{cart\_id, variant\_id, quantity, created\_at, updated\_at\}$
  - $(cart\_id, variant\_id) \rightarrow \{id, quantity, created\_at, updated\_at\}$
- **Đánh giá chuẩn hóa:**
  - **1NF, 2NF:** ĐẠT. Số lượng `quantity` phụ thuộc vào tổ hợp giỏ hàng và biến thể sản phẩm.
  - **3NF:** ĐẠT. Bảng `cart_items` **không lưu trữ giá bán** (`price`). Giá bán hiển thị trên giao diện giỏ hàng được truy vấn động qua `JOIN` sang bảng sản phẩm để khách hàng luôn nhìn thấy giá cập nhật tại thời điểm xem.

---

### 4.7. Bảng `wishlist_items` (Danh sách Yêu thích Máy chủ)
- **Tập thuộc tính:** `(id, user_id, product_id, created_at)`
- **Khóa chính (PK):** `id` | **Khóa ứng viên:** `(user_id, product_id)`
- **Khóa ngoại (FK):** `user_id` $\rightarrow$ `users(id)`, `product_id` $\rightarrow$ `products(id)`
- **Phụ thuộc hàm chính:**
  - $id \leftrightarrow (user\_id, product\_id) \rightarrow \{created\_at\}$
- **Đánh giá chuẩn hóa:** ĐẠT 1NF, 2NF, 3NF. Bảng liên kết nhiều - nhiều chuẩn mực.

---

### 4.8. Bảng `vouchers` (Mã Khuyến mãi Giảm giá)
- **Tập thuộc tính:** `(id, code, name, discount_type, discount_value, min_order_value, max_discount_amount, start_date, end_date, usage_limit, used_count, is_active, created_at)`
- **Khóa chính (PK):** `id` | **Khóa ứng viên:** `code`
- **Phụ thuộc hàm chính:**
  - $id \leftrightarrow code \rightarrow \{name, discount\_type, discount\_value, min\_order\_value, max\_discount\_amount, start\_date, end\_date, usage\_limit, used\_count, is\_active, created\_at\}$
- **Đánh giá chuẩn hóa:** ĐẠT 1NF, 2NF, 3NF. Toàn bộ các quy tắc giảm giá phụ thuộc trực tiếp vào mã voucher.

---

### 4.9. Bảng `voucher_usages` (Kiểm soát Sử dụng Khuyến mãi)
- **Tập thuộc tính:** `(id, voucher_id, user_id, order_id, used_at)`
- **Khóa chính (PK):** `id` | **Khóa ứng viên:** `(voucher_id, user_id)` (Ràng buộc `UQ_voucher_user_usage`)
- **Khóa ngoại (FK):** `voucher_id` $\rightarrow$ `vouchers(id)`, `user_id` $\rightarrow$ `users(id)`, `order_id` $\rightarrow$ `orders(id)`
- **Phụ thuộc hàm chính:**
  - $id \rightarrow \{voucher\_id, user\_id, order\_id, used\_at\}$
  - $(voucher\_id, user\_id) \rightarrow \{id, order\_id, used\_at\}$
- **Đánh giá chuẩn hóa:** ĐẠT 1NF, 2NF, 3NF. Ghi nhận sự kiện một khách hàng sử dụng mã voucher trong một đơn hàng.

---

### 4.10. Bảng `orders` (Đơn hàng Giao dịch)
- **Tập thuộc tính:** `(id, order_code, user_id, recipient_name_snapshot, recipient_phone_snapshot, delivery_address_snapshot, subtotal, discount_amount, shipping_fee, total_amount, voucher_id, voucher_code_snapshot, payment_method, payment_status, order_status, customer_note, admin_note, created_at, updated_at)`
- **Khóa chính (PK):** `id` | **Khóa ứng viên:** `order_code`
- **Khóa ngoại (FK):** `user_id` $\rightarrow$ `users(id)`, `voucher_id` $\rightarrow$ `vouchers(id)` (cho phép NULL)
- **Giải thích các trường Snapshot:**
  - `recipient_name_snapshot`: Tên người nhận hàng tại thời điểm đặt.
  - `recipient_phone_snapshot`: Số điện thoại nhận hàng tại thời điểm đặt.
  - `delivery_address_snapshot`: Địa chỉ giao hàng đầy đủ tại thời điểm đặt.
  - `voucher_code_snapshot`: Mã chữ voucher đã áp dụng tại thời điểm đặt (ví dụ: `"SUMMER2026"`).
- **Luận giải Kỹ thuật Lưu trữ Snapshot Lịch sử:**
  - *Dưới góc nhìn mô hình dữ liệu tĩnh:* Việc lưu địa chỉ và tên người nhận trong `orders` có thể bị coi là dư thừa vì đã có `user_id` trỏ sang `users` và `addresses`.
  - *Thực tế giao dịch thương mại:* Thông tin nhận hàng của đơn hàng là **dữ liệu lịch sử có chủ đích (Point-in-Time Historical Snapshot)**. Khách hàng có thể chuyển nhà, đổi số điện thoại sau khi đặt hàng; đơn hàng đã ký hợp đồng mua bán với bưu tá không được phép thay đổi địa chỉ theo thông tin mới của khách. Tương tự, nếu voucher hết hạn hoặc bị xóa khỏi CSDL (`orders.voucher_id` chuyển thành `NULL` do `SET NULL`), `voucher_code_snapshot` vẫn lưu giữ mã giảm giá ban đầu phục vụ xuất hóa đơn và đối soát kế toán.
  - **Kết luận:** Bảng `orders` áp dụng kỹ thuật **Lưu trữ Snapshot Lịch sử Giao dịch** để bảo toàn tính toàn vẹn chứng từ kế toán.

---

### 4.11. Bảng `order_items` (Chi tiết Dòng Đơn hàng)
- **Tập thuộc tính:** `(id, order_id, product_variant_id, product_name_snapshot, sku_snapshot, size_snapshot, color_snapshot, unit_price, quantity, line_total)`
- **Khóa chính (PK):** `id` | **Khóa ứng viên:** `(order_id, product_variant_id)`
- **Khóa ngoại (FK):** `order_id` $\rightarrow$ `orders(id)`, `product_variant_id` $\rightarrow$ `product_variants(id)`
- **Giải thích các trường Snapshot:**
  - `product_name_snapshot`: Tên sản phẩm tại thời điểm giao dịch.
  - `sku_snapshot`: Mã SKU của biến thể tại thời điểm giao dịch.
  - `size_snapshot`: Tên kích cỡ tại thời điểm giao dịch (ví dụ: `"42"`).
  - `color_snapshot`: Tên màu sắc tại thời điểm giao dịch (ví dụ: `"Đen"`).
  - `unit_price`: Đơn giá thực tế thanh toán tại thời điểm đặt hàng.
- **Giải thích trường Dữ liệu Tính toán `line_total` (Phi chuẩn hóa có chủ đích):**
  - Cột `line_total` về mặt đại số quan hệ có thể tính trực tiếp bằng biểu thức: $\text{line\_total} = \text{unit\_price} \times \text{quantity}$.
  - Đây là một trường hợp **Phi chuẩn hóa có chủ đích (Deliberate Denormalization)**. Cột này được lưu cứng để phục vụ truy vấn xuất hóa đơn tức thì, tính tổng doanh thu và kết xuất báo cáo nhanh chóng mà không phải tính toán lại từng dòng hàng triệu bản ghi trong cơ sở dữ liệu.
  - **Yêu cầu Nhất quán Dữ liệu:** Tính toàn vẹn của `line_total` phải được kiểm soát chặt chẽ:
    1. Ở tầng CSDL: Ràng buộc `CHECK (line_total >= 0)`.
    2. Ở tầng ứng dụng: Trong `src/services/order.service.js`, hệ thống tính toán chính xác giá trị này trước khi thực thi lệnh `INSERT` trong transaction ACID.
- **Kết luận:** Bảng `order_items` áp dụng kỹ thuật **Lưu trữ Snapshot Lịch sử Giao dịch** kết hợp **Phi chuẩn hóa có chủ đích (`line_total`)**.

---

### 4.12. Bảng `order_status_histories` (Nhật ký Thay đổi Trạng thái Đơn hàng)
- **Tập thuộc tính:** `(id, order_id, changed_by, previous_status, new_status, note, created_at)`
- **Khóa chính (PK):** `id` | **Khóa ngoại (FK):** `order_id` $\rightarrow$ `orders(id)`, `changed_by` $\rightarrow$ `users(id)`
- **Đánh giá chuẩn hóa:** ĐẠT 1NF, 2NF, 3NF. Bảng nhật ký kiểm toán bất biến (Append-only Audit Log), mỗi bản ghi là một sự kiện chuyển trạng thái đơn hàng độc lập.

---

### 4.13. Bảng `inventory_transactions` (Sổ Kiểm kê Biến động Kho)
- **Tập thuộc tính:** `(id, variant_id, user_id, transaction_type, old_quantity, new_quantity, change_quantity, reason, reference_id, created_at)`
- **Khóa chính (PK):** `id` | **Khóa ngoại (FK):** `variant_id` $\rightarrow$ `product_variants(id)`, `user_id` $\rightarrow$ `users(id)`
- **Đánh giá chuẩn hóa:** ĐẠT 1NF, 2NF, 3NF. Bảng sổ cái kiểm toán kho (Double-entry Inventory Ledger), mỗi bản ghi ghi nhận một biến động kho với nguyên nhân và dấu vết rõ ràng.

---

## 5. Đánh giá Phạm vi Chuẩn hóa 8 Bảng Dữ liệu Còn lại

Để đảm bảo tính khoa học và minh bạch, nhóm kiểm toán đánh giá ngắn gọn phạm vi chuẩn hóa của 7 bảng nghiệp vụ còn lại và 1 bảng hệ thống:

| STT | Bảng dữ liệu | Khóa chính (PK) | Khóa ứng viên / Khóa ngoại | Đánh giá Chuẩn hóa & Bản chất Nghiệp vụ |
| :-: | :--- | :---: | :--- | :--- |
| 14 | `categories` | `id` | `slug` [UQ] | **Đạt 3NF thuần túy.** Bảng danh mục phân loại chuẩn, không có thuộc tính đa trị, không phụ thuộc bắc cầu. |
| 15 | `brands` | `id` | `slug` [UQ] | **Đạt 3NF thuần túy.** Danh mục thương hiệu/bộ sưu tập độc lập. |
| 16 | `sizes` | `id` | `size_name` [UQ] | **Đạt 3NF thuần túy.** Danh mục kích cỡ chuẩn hóa (chuỗi ký tự đơn, thứ tự hiển thị). |
| 17 | `colors` | `id` | `color_name` [UQ] | **Đạt 3NF thuần túy.** Danh mục màu sắc chuẩn hóa (tên màu, mã hex). |
| 18 | `product_images` | `id` | FK `product_id` | **Đạt 3NF thuần túy.** Bảng lưu trữ album ảnh sản phẩm (quan hệ 1-n), mỗi dòng chứa 1 URL ảnh nguyên tử. |
| 19 | `password_reset_tokens` | `id` | `token` [UQ], FK `user_id` | **Đạt 3NF thuần túy.** Bảng token bảo mật vòng đời ngắn phục vụ khôi phục mật khẩu. |
| 20 | `banners` | `id` | Không có UQ ngoài PK | **Đạt 3NF thuần túy.** Bảng cấu hình giao diện trình chiếu trên trang chủ storefront. |
| 21 | `schema_migrations` | `id` | `version` [UQ] | **Bảng hệ thống.** Quản lý lịch sử các tệp di chuyển cấu trúc CSDL. |

---

## 6. Bảng Tổng kết Đánh giá Mức độ Chuẩn hóa Toàn Hệ thống

| Nhóm dữ liệu | Danh sách Bảng | 1NF | 2NF | 3NF / Bản chất Lưu trữ | Ghi chú Phân tích Kỹ thuật |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Dữ liệu Danh mục & Cấu hình** | `users`, `addresses`, `products`, `product_variants`, `categories`, `brands`, `sizes`, `colors`, `product_images`, `carts`, `cart_items`, `wishlist_items`, `vouchers`, `voucher_usages`, `password_reset_tokens`, `banners` | **ĐẠT** | **ĐẠT** | **ĐẠT 3NF thuần túy** | 16 bảng nghiệp vụ danh mục đạt 3NF thuần túy, triệt tiêu hoàn toàn bất thường cập nhật. |
| **Dữ liệu Giao dịch Đơn hàng** | `orders` | **ĐẠT** | **ĐẠT** | **Lưu trữ Snapshot Lịch sử** | Lưu snapshot địa chỉ, tên người nhận và mã voucher để bảo vệ chứng từ kế toán và pháp lý. |
| **Dữ liệu Dòng hàng Đơn hàng** | `order_items` | **ĐẠT** | **ĐẠT** | **Snapshot Lịch sử + Phi chuẩn hóa `line_total`** | Lưu snapshot giá bán, SKU, size, màu; phi chuẩn hóa có chủ đích trường tính sẵn `line_total` để tăng tốc độ báo cáo. |
| **Dữ liệu Nhật ký Kiểm toán** | `order_status_histories`, `inventory_transactions` | **ĐẠT** | **ĐẠT** | **ĐẠT 3NF thuần túy (Audit Ledger)** | Bảng sự kiện lịch sử bất biến (Append-only). |
| **Bảng Hệ thống** | `schema_migrations` | **ĐẠT** | **ĐẠT** | **ĐẠT** | Bảng hệ thống quản lý phiên bản migration. |

> **KẾT LUẬN CHUẨN HÓA DỮ LIỆU:**  
> - **100% các bảng danh mục và cấu hình (16/20 bảng nghiệp vụ)** đạt Dạng chuẩn 3 (3NF) thuần túy.  
> - **Các bảng giao dịch tài chính (`orders`, `order_items`)** áp dụng kỹ thuật **Lưu trữ Snapshot Lịch sử Giao dịch** để bảo đảm tính toàn vẹn của chứng từ kế toán theo thông lệ tiêu chuẩn của ngành Thương mại điện tử. Riêng trường `line_total` là trường hợp **Phi chuẩn hóa có chủ đích** được kiểm soát tính nhất quán chặt chẽ giữa logic ứng dụng và ràng buộc CSDL.
