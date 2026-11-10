# 05. QUY TẮC NGHIỆP VỤ HỆ THỐNG (BUSINESS RULES)

> **Hệ thống:** VAMOS STORE  
> **Thương hiệu:** VAMOS  
> **Mục tiêu:** Tập hợp và chuẩn hóa toàn bộ các ràng buộc, điều kiện hợp lệ và quy tắc xử lý nghiệp vụ để áp dụng xuyên suốt từ Use Case đến Cơ sở dữ liệu và Mã nguồn.

---

## 1. QUY TẮC VÒNG ĐỜI VÀ TRẠNG THÁI ĐƠN HÀNG (ORDER STATE RULES)

### BR-ORD-01: Máy trạng thái đơn hàng (Order State Machine)

Đơn hàng trong hệ thống VAMOS STORE tuân thủ nghiêm ngặt theo các trạng thái sau:

```
[ PENDING ] ────────► [ CONFIRMED ] ────────► [ PROCESSING ] ────────► [ SHIPPING ] ────────► [ COMPLETED ]
     │                      │
     ▼                      ▼
[ CANCELLED ]         [ CANCELLED ]
(Khách hoặc Nội bộ)     (Chỉ Nội bộ hủy)
```

1. **`PENDING` (Chờ xác nhận):** Trạng thái khởi tạo ngay sau khi Customer đặt hàng thành công. Tồn kho đã được trừ.
2. **`CONFIRMED` (Đã xác nhận):** Nhân viên (Staff/Admin) đã kiểm tra thông tin liên lạc và xác nhận đơn hợp lệ.
3. **`PROCESSING` (Đang chuẩn bị):** Đơn đang được lấy hàng trong kho và đóng gói.
4. **`SHIPPING` (Đang giao hàng):** Đơn đã được bàn giao cho bộ phận giao vận để đi giao đến khách hàng.
5. **`COMPLETED` (Hoàn thành):** Khách hàng đã nhận hàng và thanh toán đủ số tiền COD cho nhân viên giao hàng. (Doanh thu hệ thống chỉ được chính thức ghi nhận khi đơn ở trạng thái này).
6. **`CANCELLED` (Đã hủy):** Đơn bị hủy hợp lệ và dừng quy trình.

### BR-ORD-02: Điều kiện và quyền hạn hủy đơn hàng

- **Customer được phép tự hủy đơn:** DUY NHẤT khi đơn hàng đang ở trạng thái `PENDING`. Khi đã chuyển sang `CONFIRMED` hoặc các trạng thái sau, nút "Hủy đơn" trên giao diện khách hàng sẽ bị ẩn/vô hiệu hóa.
- **Staff / Admin được phép hủy đơn:** Khi đơn ở trạng thái `PENDING` hoặc `CONFIRMED`. Khi đơn đã ở trạng thái `PROCESSING`, `SHIPPING` hoặc `COMPLETED`, không cho phép hủy trực tiếp trên giao diện thông thường (phải liên hệ xử lý đặc thù ngoài hệ thống).
- Bắt buộc lưu **Lý do hủy đơn** vào trường ghi chú/lịch sử đơn hàng khi hủy nội bộ.

### BR-ORD-03: Ghi vết lịch sử trạng thái (Audit Trail)

Mỗi lần chuyển trạng thái đơn hàng (kể cả tạo mới và hủy), hệ thống bắt buộc ghi một bản ghi vào bảng `order_status_histories` gồm:

- `order_id`: Mã định danh đơn hàng.
- `previous_status`: Trạng thái trước khi đổi.
- `new_status`: Trạng thái mới.
- `changed_by`: ID người thực hiện (User ID của khách hàng hoặc nhân viên thao tác).
- `note`: Lý do hoặc ghi chú vận hành.
- `created_at`: Dấu thời gian chính xác (Timestamp).

---

## 2. QUY TẮC QUẢN LÝ TỒN KHO (INVENTORY RULES)

### BR-INV-01: Quản lý tồn kho theo biến thể chi tiết (Variant-level Inventory)

- Số lượng tồn kho (`stock_quantity`) được quản lý chặt chẽ theo từng biến thể sản phẩm cụ thể (**Product Variant = Kích cỡ + Màu sắc + SKU**), không quản lý gộp theo sản phẩm cha.
- Không cho phép số lượng tồn kho âm (`stock_quantity >= 0`).

### BR-INV-02: Cơ chế trừ kho và Race Condition

- **Giỏ hàng KHÔNG giữ chỗ tồn kho (No Cart Reservation):** Khách hàng đưa sản phẩm vào giỏ không làm giảm tồn kho trên hệ thống.
- **Trừ kho tại thời điểm Đặt hàng (Transaction-based Atomic Decrement):** Khi Customer bấm "Xác nhận đặt hàng", hệ thống phải kiểm tra số lượng tồn kho khả dụng và trừ kho ngay trong một **Database Transaction** với cơ chế khóa hàng (Pessimistic Locking `SELECT ... FOR UPDATE` hoặc Optimistic Versioning) nhằm đảm bảo không bao giờ xảy ra hiện tượng bán vượt quá tồn kho (Overselling).
- Nếu tại thời điểm commit transaction mà một trong các biến thể không đủ số lượng tồn, toàn bộ đơn hàng bị hủy bỏ (Rollback transaction) và thông báo rõ cho khách hàng.

### BR-INV-03: Cơ chế hoàn kho khi hủy đơn (Restocking Idempotency)

- Khi đơn hàng bị hủy (`CANCELLED`) sau khi đã trừ kho thành công:
  - Hệ thống tự động cộng hoàn trả lại số lượng từng biến thể về kho.
  - Quá trình hoàn kho phải được đánh dấu (Flag/Audit) để đảm bảo **chỉ hoàn kho đúng 1 lần duy nhất** (Idempotent), tránh lỗi nhân đôi tồn kho.

### BR-INV-04: Điều chỉnh tồn kho thủ công (Manual Adjustment)

- Chỉ Actor **Admin** mới có quyền điều chỉnh tăng/giảm tồn kho trực tiếp trên trang quản trị.
- Mọi thao tác điều chỉnh thủ công bắt buộc lưu vào `inventory_transactions` với đầy đủ: `variant_id`, `old_quantity`, `new_quantity`, `change_quantity`, `reason` (lý do nhập hàng/hỏng rách/kiểm kê) và `user_id` người thực hiện.

---

## 3. QUY TẮC GIÁ VÀ KHUYẾN MÃI (PRICING & PROMOTION RULES)

### BR-PRC-01: Ràng buộc giá sản phẩm

- Giá niêm yết (`base_price`) và giá khuyến mãi (`sale_price`) phải là số nguyên không âm (`>= 0`).
- Nếu sản phẩm có áp dụng giá khuyến mãi, bắt buộc `0 <= sale_price < base_price`.

### BR-PRC-02: Bất biến dữ liệu lịch sử đơn hàng (Order Snapshot Integrity)

- Thông tin sản phẩm bao gồm: Tên sản phẩm, Mã SKU, Tên màu sắc, Kích cỡ và Đơn giá bán tại thời điểm đặt hàng phải được sao chép và lưu cứng (Snapshot) vào từng dòng `order_items`.
- Mọi thay đổi sau đó của Admin về tên sản phẩm, giá bán, hoặc khi biến thể bị xóa/ẩn **tuyệt đối không làm thay đổi dữ liệu của các đơn hàng đã tạo trong quá khứ**.

### BR-PRC-03: Điều kiện áp dụng mã giảm giá (Voucher Validation)

Một mã giảm giá chỉ được chấp nhận khi thỏa mãn toàn bộ các điều kiện:

1. Mã tồn tại và đang ở trạng thái hoạt động (`is_active = true`).
2. Thời điểm đặt hàng nằm trong khung thời gian hiệu lực (`start_date <= current_time <= end_date`).
3. Tổng số lượt đã sử dụng chưa vượt quá giới hạn tối đa (`used_count < usage_limit`).
4. Tổng tiền hàng tạm tính (`subtotal`) phải lớn hơn hoặc bằng giá trị đơn hàng tối thiểu (`min_order_value`).
5. **Quy tắc 1 voucher:** Mỗi đơn hàng chỉ được áp dụng tối đa **01 mã giảm giá duy nhất**.
6. **Giới hạn số tiền giảm:** Số tiền giảm giá (`discount_amount`) không được vượt quá tổng tiền hàng (`discount_amount <= subtotal`).

### BR-PRC-04: Phí vận chuyển (Shipping Fee)

- Phiên bản 1.0 sử dụng cấu hình mức phí vận chuyển cố định (Flat-rate shipping fee), ví dụ: 30,000 VNĐ cho mỗi đơn hàng (hoặc miễn phí theo cấu hình hệ thống).
- Không gọi API tính phí động từ các đối tác vận chuyển bên ngoài.

---

## 4. QUY TẮC TÀI KHOẢN VÀ BẢO MẬT (SECURITY & AUTH RULES)

### BR-SEC-01: Tính duy nhất của danh tính (Identity Uniqueness)

- Địa chỉ `email` là định danh tài khoản duy nhất trên toàn hệ thống VAMOS STORE (không phân biệt hoa/thường). Không được có hai tài khoản trùng email.

### BR-SEC-02: Mã hóa mật khẩu (Password Hashing)

- Tuyệt đối không lưu trữ mật khẩu dưới dạng văn bản rõ (Plaintext). Mật khẩu phải được băm an toàn bằng thuật toán mã hóa mạnh (bcrypt salt rounds >= 10 hoặc Argon2).

### BR-SEC-03: Trạng thái tài khoản (Account Locking)

- Tài khoản có cờ `status = 'locked'` ngay lập tức bị từ chối đăng nhập. Nếu session đang tồn tại, middleware phải chặn truy cập và hủy session ngay tại request tiếp theo.

### BR-SEC-04: Phân quyền máy chủ (Server-side Enforcement)

- Không bao giờ tin tưởng quyền hạn (Role) hay User ID được gửi lên từ phía Client (Form/Query param/Local storage).
- Quyền hạn của người dùng được xác thực nghiêm ngặt dựa trên Session phía máy chủ (`req.session.user`) và đối soát trong cơ sở dữ liệu.
- Nhân viên vận hành (`Staff`) bị chặn truy cập tuyệt đối vào các màn hình quản trị người dùng, cấu hình quyền, quản trị voucher và báo cáo tài chính.
