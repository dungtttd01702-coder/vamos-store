# BÁO CÁO THẨM ĐỊNH THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE DESIGN REVIEW)

> **Dự án:** VAMOS STORE -- Website thương mại điện tử chuyên kinh doanh giày dép  
> **Cơ sở dữ liệu:** Microsoft SQL Server 2025 / 2022  
> **Kiến trúc:** Layered MVC (Node.js + Express + Pug + Microsoft SQL Server)  
> **Tài liệu tham chiếu:** `plan.md` (v1.1), `docs/analysis/05-business-rules.md`, `docs/analysis/06-open-questions.md`

---

## 1. TỔNG QUAN VÀ MỤC TIÊU THẨM ĐỊNH

Tài liệu này thẩm định toàn diện mô hình dữ liệu quan hệ gồm **18 thực thể** của hệ thống VAMOS STORE. Bản thẩm định tập trung vào việc đảm bảo:

1. **Tính bất biến của lịch sử giao dịch (Transaction Immutability):** Đơn giá, địa chỉ giao hàng, thông tin sản phẩm tại thời điểm mua không bao giờ bị thay đổi khi dữ liệu gốc bị chỉnh sửa hoặc xóa.
2. **Tính toàn vẹn kho hàng (Inventory ACID Integrity):** Ngăn chặn triệt để tình trạng bán vượt tồn kho (Overselling) trong điều kiện nhiều người dùng cùng đặt một biến thể tại cùng một thời điểm.
3. **Phân quyền và bảo mật máy chủ (Server-side Enforcement):** Chuẩn hóa nghiêm ngặt 3 tác nhân (`Guest`, `Customer`, `Admin`), không để lọt vai trò `Staff` vào cơ sở dữ liệu nếu nghiệp vụ v1.0 chưa yêu cầu.
4. **Hiệu năng truy vấn (Query Optimization):** Thiết lập chỉ mục (Indexes) chiến lược cho các luồng tìm kiếm sản phẩm, lọc theo kích cỡ/màu sắc, kiểm tra trạng thái đơn và kiểm tra voucher.

---

## 2. ĐÁNH GIÁ KIẾN TRÚC 18 BẢNG DỮ LIỆU

Mô hình 18 bảng được phân bổ thành 6 phân hệ nghiệp vụ rõ ràng:

```
[ NHÓM TÀI KHOẢN & BẢO MẬT ]
  ├── users (Tài khoản người dùng: ADMIN, CUSTOMER)
  ├── addresses (Sổ địa chỉ nhận hàng)
  └── password_reset_tokens (Mã khôi phục mật khẩu)

[ NHÓM DANH MỤC & SẢN PHẨM GỐC ]
  ├── categories (Danh mục: Sneaker, Thể thao, Sandal,...)
  ├── brands (Thương hiệu / Bộ sưu tập VAMOS)
  ├── products (Sản phẩm cha: tên, slug, giá gốc, giá sale)
  └── product_images (Bộ sưu tập hình ảnh chi tiết)

[ NHÓM BIẾN THỂ & KHO HÀNG ]
  ├── sizes (Danh mục kích cỡ: 38, 39, 40,...)
  ├── colors (Danh mục màu sắc: Đen, Trắng,...)
  ├── product_variants (Tổ hợp Product x Size x Color x SKU x Tồn kho)
  └── inventory_transactions (Nhật ký biến động xuất/nhập/hoàn kho)

[ NHÓM GIỎ HÀNG ]
  ├── carts (Giỏ hàng người dùng: 1 Customer = 1 Cart)
  └── cart_items (Chi tiết mặt hàng: Cart x Variant x Số lượng)

[ NHÓM KHUYẾN MÃI & QUẢNG BÁ ]
  ├── vouchers (Mã ưu đãi, hạn mức, ngày bắt đầu/kết thúc)
  └── banners (Banner quảng cáo slider trang chủ)

[ NHÓM ĐƠN HÀNG & FULFILLMENT ]
  ├── orders (Đơn hàng, snapshot người nhận, tài chính COD)
  ├── order_items (Snapshot chi tiết mặt hàng: tên, SKU, size, màu, đơn giá)
  └── order_status_histories (Nhật ký chuyển đổi trạng thái đơn hàng)
```

---

## 3. PHÂN TÍCH CHUYÊN SÂU CÁC QUY TẮC NGHIỆP VỤ CỐT LÕI

### 3.1. Cơ chế Quản lý & Trừ tồn kho (Inventory Management)

- **Thời điểm trừ tồn kho:** Hệ thống trừ tồn kho ngay khi Customer nhấn "Xác nhận đặt hàng" thành công (đơn ở trạng thái `PENDING`). Điều này đảm bảo số lượng tồn kho khả dụng phản ánh đúng cam kết giữ hàng cho khách.
- **Xử lý tranh chấp đồng thời (Concurrency Control):**
  - Khi 2 khách hàng cùng đặt 1 đôi giày cuối cùng (`stock_quantity = 1`), nếu dùng lệnh `UPDATE` đơn giản hoặc đọc trước kiểm tra sau ở tầng ứng dụng sẽ dẫn đến Race Condition.
  - **Giải pháp chuẩn hóa:** Bắt buộc sử dụng SQL Server Database Transaction kết hợp khóa dòng bi quan (**Pessimistic Row Lock**):

    ```sql
    -- Trong transaction mssql:
    -- Khóa bản ghi biến thể bằng UPDLOCK, ROWLOCK để ngăn các giao dịch khác đọc sai số lượng
    SELECT stock_quantity FROM product_variants WITH (UPDLOCK, ROWLOCK)
    WHERE id = @variant_id;

    -- Kiểm tra: nếu stock_quantity < order_quantity -> ROLLBACK và ném lỗi hết hàng
    -- Nếu thỏa mãn:
    UPDATE product_variants
    SET stock_quantity = stock_quantity - @order_quantity, updated_at = GETDATE()
    WHERE id = @variant_id;

    -- Ghi nhật ký kiểm toán
    INSERT INTO inventory_transactions (variant_id, user_id, old_quantity, new_quantity, change_quantity, reason)
    VALUES (:variant_id, :user_id, :old_qty, :new_qty, -:order_quantity, 'ORDER_PLACED');

    COMMIT;
    ```

- **Hoàn kho khi hủy đơn (Restock on Cancellation):**
  - Khi đơn hàng bị hủy ở trạng thái `PENDING` (khách tự hủy hoặc admin hủy) hoặc `CONFIRMED` (admin hủy), toàn bộ số lượng trong `order_items` sẽ được hoàn trả lại cho `product_variants`.
  - Ghi bản ghi đối ứng vào `inventory_transactions` với `change_quantity > 0` và `reason = 'ORDER_CANCELLED_RESTOCK'`.
  - Nếu đơn đã ở trạng thái `SHIPPING` hoặc `COMPLETED`, không hoàn kho tự động mà phải xử lý qua nghiệp vụ đổi trả ngoại tuyến.
- **Điều chỉnh kho thủ công bởi Admin:**
  - Admin được phép điều chỉnh tồn kho trong màn hình Quản lý tồn kho. Mỗi lần điều chỉnh bắt buộc nhập lý do (`ADMIN_ADJUSTMENT`, `IMPORT_PURCHASE`, `DEFECT_DAMAGE`, `AUDIT_CORRECTION`) và ghi nhận vào `inventory_transactions`.

---

### 3.2. Tính Bất biến của Lịch sử Đơn hàng (Order Snapshot Pattern)

- **Vấn đề thực tế:** Nếu bảng `order_items` chỉ lưu khóa ngoại `product_variant_id` và lấy tên/giá bằng phép `JOIN` sang bảng `products`:
  - Khi Admin tăng giá từ 600,000đ lên 750,000đ, doanh thu và giá trị các đơn hàng cũ trong quá khứ sẽ bị sai lệch.
  - Khi một biến thể hoặc sản phẩm bị ngừng kinh doanh hoặc thay đổi tên, lịch sử đơn hàng của khách hàng sẽ bị vỡ.
- **Giải pháp trong mô hình:** Bảng `order_items` lưu trữ đầy đủ các cột Snapshot độc lập:
  - `product_name_snapshot`: Tên sản phẩm tại thời điểm mua.
  - `sku_snapshot`: Mã SKU tại thời điểm mua.
  - `size_snapshot`: Tên kích cỡ tại thời điểm mua.
  - `color_snapshot`: Tên màu sắc tại thời điểm mua.
  - `unit_price`: Đơn giá bán thực tế tại thời điểm mua.
  - `line_total`: Thành tiền tính theo `unit_price * quantity`.
- Tương tự, bảng `orders` lưu `recipient_name_snapshot`, `recipient_phone_snapshot`, `delivery_address_snapshot` để dù khách hàng có sửa đổi sổ địa chỉ cá nhân thì đơn hàng đã đặt vẫn được giao đến đúng địa chỉ đăng ký ban đầu.

---

### 3.3. Cơ chế Khuyến mãi & Voucher (Voucher Validation)

- **Quy tắc kiểm tra hợp lệ tại Checkout:**
  1. `is_active = TRUE`
  2. `NOW() BETWEEN start_date AND end_date`
  3. `usage_limit = 0 OR used_count < usage_limit`
  4. `subtotal >= min_order_value`
- **Thời điểm tăng `used_count`:**
  - `used_count` được tăng thêm 1 trong cùng Database Transaction lúc đơn hàng `PENDING` được tạo thành công.
- **Xử lý khi đơn hàng bị hủy:**
  - Khi đơn hủy hợp lệ, hệ thống hoàn lại 1 lượt dùng cho voucher:
    ```sql
    UPDATE vouchers SET used_count = GREATEST(0, used_count - 1) WHERE id = :voucher_id;
    ```
- **Đánh giá bảng `voucher_usages`:**
  - _Nghiệp vụ v1.0:_ Người dùng yêu cầu không tự ý thêm bảng nếu chưa có căn cứ nghiệp vụ. Trong v1.0, việc kiểm tra khách đã dùng mã hay chưa có thể thực hiện thông qua truy vấn:
    ```sql
    SELECT COUNT(*) FROM orders WHERE user_id = :user_id AND voucher_id = :voucher_id AND order_status != 'CANCELLED';
    ```
  - Do đó, cấu trúc 18 bảng hiện tại hoàn toàn đáp ứng được logic giới hạn 1 voucher / 1 khách hàng mà không cần tạo thêm bảng phụ gây phức tạp hóa mô hình dữ liệu. Đề xuất này đã được đưa vào danh mục theo dõi mở rộng.

---

### 3.4. Ràng buộc Khóa ngoại & Chiến lược Xóa dữ liệu (Referential Actions)

Để bảo vệ an toàn dữ liệu, các hành vi `ON DELETE` được cấu hình phân lớp nghiêm ngặt:

| Bảng cha           | Bảng con           | Khóa ngoại           |  ON DELETE   | Lý do kiến trúc                                                                                     |
| :----------------- | :----------------- | :------------------- | :----------: | :-------------------------------------------------------------------------------------------------- |
| `users`            | `addresses`        | `user_id`            | **CASCADE**  | Xóa user (nếu có) sẽ xóa toàn bộ sổ địa chỉ kèm theo                                                |
| `users`            | `carts`            | `user_id`            | **CASCADE**  | Xóa user thì giỏ hàng cá nhân bị hủy                                                                |
| `users`            | `orders`           | `user_id`            | **RESTRICT** | **Tuyệt đối không cho xóa** tài khoản đã từng phát sinh đơn hàng lịch sử                            |
| `products`         | `product_images`   | `product_id`         | **CASCADE**  | Xóa sản phẩm gốc sẽ xóa bộ ảnh tương ứng                                                            |
| `products`         | `product_variants` | `product_id`         | **CASCADE**  | Xóa sản phẩm cha sẽ kéo theo xóa các biến thể dự thảo                                               |
| `product_variants` | `order_items`      | `product_variant_id` | **RESTRICT** | **Tuyệt đối không cho xóa** biến thể đã có đơn hàng trong quá khứ                                   |
| `orders`           | `order_items`      | `order_id`           | **CASCADE**  | Xóa đơn (chỉ trong môi trường test/dev) sẽ dọn sạch các dòng chi tiết                               |
| `vouchers`         | `orders`           | `voucher_id`         | **SET NULL** | Nếu xóa chương trình voucher, đơn hàng cũ vẫn giữ nguyên thông tin snapshot `voucher_code_snapshot` |

---

## 4. BẢNG ĐỐI CHIẾU 14 RÀNG BUỘC CỐT LÕI & GIẢI PHÁP MICROSOFT SQL SERVER 2025

| STT | Ràng buộc nghiệp vụ yêu cầu             | Giải pháp triển khai trong Microsoft SQL Server                                                   |   Trạng thái   |
| :-: | :-------------------------------------- | :------------------------------------------------------------------------------------------------ | :------------: |
|  1  | `UNIQUE(product_id, size_id, color_id)` | Khai báo `CONSTRAINT uq_variants_combination UNIQUE (product_id, size_id, color_id)` trong bảng `product_variants`. | **Đã cài đặt** |
|  2  | `UNIQUE(cart_id, variant_id)`           | Khai báo `CONSTRAINT uq_cart_variant UNIQUE (cart_id, variant_id)` trong bảng `cart_items`.        | **Đã cài đặt** |
|  3  | Mã SKU duy nhất                         | Cột `sku NVARCHAR(100) NOT NULL UNIQUE` trong `product_variants`.                                  | **Đã cài đặt** |
|  4  | Email tài khoản duy nhất                | Cột `email NVARCHAR(150) NOT NULL UNIQUE` trong bảng `users`.                                      | **Đã cài đặt** |
|  5  | Slug sản phẩm & danh mục duy nhất       | Ràng buộc `UNIQUE` cho các cột `slug` trong `products`, `categories`, `brands`.                   | **Đã cài đặt** |
|  6  | Số lượng tồn kho không âm               | `CONSTRAINT chk_variants_stock CHECK (stock_quantity >= 0)`.                                      | **Đã cài đặt** |
|  7  | Số lượng đặt hàng lớn hơn 0             | `CHECK (quantity > 0)` trong `cart_items` và `order_items`.                                       | **Đã cài đặt** |
|  8  | Giá tiền không âm                       | `CHECK (base_price >= 0)` và các check giá trong `orders`.                                        | **Đã cài đặt** |
|  9  | `sale_price` hợp lệ so với `base_price` | `CONSTRAINT chk_products_sale_price CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price < base_price))`. | **Đã cài đặt** |
| 10  | 1 khách hàng chỉ có 1 giỏ hàng          | Cột `user_id INT NOT NULL UNIQUE` trong bảng `carts`.                                             | **Đã cài đặt** |
| 11  | Mã đơn hàng công khai duy nhất          | Cột `order_code NVARCHAR(50) NOT NULL UNIQUE` trong bảng `orders`.                                | **Đã cài đặt** |
| 12  | Mã voucher duy nhất                     | Cột `code NVARCHAR(50) NOT NULL UNIQUE` trong bảng `vouchers`.                                    | **Đã cài đặt** |
| 13  | Thời gian voucher hợp lệ                | `CONSTRAINT chk_vouchers_dates CHECK (end_date >= start_date)`.                                   | **Đã cài đặt** |
| 14  | Snapshot đơn hàng bất biến              | Lưu snapshot tên, SKU, size, color, đơn giá trong `order_items` và snapshot địa chỉ trong `orders`. | **Đã cài đặt** |

---

## 5. TỐI ƯU HÓA ĐẶC THÙ VỚI MICROSOFT SQL SERVER

1. **Ràng buộc duy nhất 1 địa chỉ mặc định (`is_default = 1`):**
   - Áp dụng thành công **Filtered Unique Index** trong SQL Server:
     ```sql
     CREATE UNIQUE NONCLUSTERED INDEX uq_user_default_address
     ON addresses (user_id)
     WHERE is_default = 1;
     ```
   - Đảm bảo mỗi khách hàng chỉ có duy nhất 1 địa chỉ mặc định ở tầng cơ sở dữ liệu.
2. **Ràng buộc duy nhất 1 ảnh đại diện chính (`is_primary = 1`):**
   - Áp dụng **Filtered Unique Index**:
     ```sql
     CREATE UNIQUE NONCLUSTERED INDEX uq_product_primary_image
     ON product_images (product_id)
     WHERE is_primary = 1;
     ```
3. **Mã khôi phục mật khẩu (`password_reset_tokens`):**
   - Cột `token_hash NVARCHAR(255) NOT NULL UNIQUE` chỉ lưu chuỗi băm an toàn (SHA-256 hoặc bcrypt), không lưu token dạng bản rõ (plaintext).
4. **Mở rộng bảng `voucher_usages`:**
   - Trong tương lai, nếu hệ thống có các chương trình khuyến mãi nâng cao (mã dùng N lần/khách, mã VIP), bảng `voucher_usages (id, voucher_id, user_id, order_id, used_at)` có thể được bổ sung qua migration. Hiện tại v1.0, cơ chế conditional update `UPDATE vouchers SET used_count = used_count + 1 WHERE id = @id AND (usage_limit = 0 OR used_count < usage_limit)` đã giải quyết triệt để race condition.
