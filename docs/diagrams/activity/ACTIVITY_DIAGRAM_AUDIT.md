# BÁO CÁO KIỂM TOÁN VÀ ĐỐI CHIẾU SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM AUDIT)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE — GIAI ĐOẠN 3.1
**Tiêu chuẩn nghiệm thu:** Đồ án Tốt nghiệp / Assignment Kỹ nghệ Phần mềm FPT Polytechnic  
**Branch hiện tại:** `fix/master-repair-plan` | **Git HEAD:** `8135e19`  
**Nguyên tắc thực thi:** Kiểm toán dựa trên mã nguồn thực tế (Code-First Verification), không che giấu lỗi, không tự tạo nghiệp vụ, bảo toàn 100% mã nguồn và cơ sở dữ liệu.

---

## I. KIỂM TOÁN CHUYÊN SÂU SÁU NGHIỆP VỤ QUAN TRỌNG

### 1. AD11 — Máy trạng thái đơn hàng (Order State Machine)
- **Vị trí mã nguồn:** `src/services/order.service.js` (dòng 8–17, 460–570) và `src/controllers/admin.controller.js` (dòng 97–200).
- **Ràng buộc CSDL:** Ràng buộc `chk_orders_status` kiểm tra:
  `order_status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED')`.
- **Ma trận chuyển trạng thái thực tế (`VALID_TRANSITIONS`):**
  - `PENDING` $\rightarrow$ `['CONFIRMED', 'CANCELLED']`
  - `CONFIRMED` $\rightarrow$ `['PROCESSING', 'CANCELLED']`
  - `PROCESSING` $\rightarrow$ `['SHIPPING']` *(Ghi chú mã nguồn: Ở phiên bản hiện tại, đơn hàng đang đóng gói không cho phép hủy trực tiếp)*
  - `SHIPPING` $\rightarrow$ `['COMPLETED']` *(Ghi chú mã nguồn: Đơn hàng đang trên đường giao không cho phép hủy trực tiếp)*
  - `COMPLETED` $\rightarrow$ `[]` *(Trạng thái kết thúc — Terminal State)*
  - `CANCELLED` $\rightarrow$ `[]` *(Trạng thái kết thúc — Terminal State)*
- **Xử lý hoàn tất đơn hàng (`COMPLETED`):**
  - Hệ thống tự động đặt `payment_status = 'PAID'` (ghi nhận đã thu tiền mặt COD từ shipper).
  - **Tuyệt đối không trừ tồn kho lần 2** vì số lượng đã được khấu trừ dứt điểm tại thời điểm tạo đơn COD.
- **Tính lũy thừa (Idempotency):** Nếu `oldStatus === newStatus`, hàm `updateOrderStatusByAdmin` trả về kết quả thành công ngay mà không thực hiện ghi đè hay cập nhật thừa.

---

### 2. AD10 và AD11 — Cơ chế hủy đơn và Chống hủy lặp (Anti-Double Restock)
- **Vị trí mã nguồn:** `src/services/order.service.js` (hàm `cancelOrder`, `_executeCancellation`) và `src/controllers/account.controller.js` (hàm `postCancelOrder`).
- **Kiểm tra quyền sở hữu:**
  - Đối với Khách hàng: Câu lệnh truy vấn bắt buộc điều kiện `WHERE id = @orderId AND user_id = @userId`. Khách hàng khác hoàn toàn không thể xem hoặc hủy đơn của người khác (Ngăn chặn triệt để lỗ hổng **IDOR**).
  - Đối với Admin: Kiểm tra vai trò `role === 'ADMIN'` và `status === 'active'` trước khi thao tác.
- **Kiểm tra trạng thái hợp lệ:**
  - Khách hàng chỉ được phép hủy khi `order_status === 'PENDING'`.
  - Admin được phép hủy khi đơn ở `PENDING` hoặc `CONFIRMED`.
- **Phân biệt Điều kiện kiểm tra thường vs Cơ chế bảo vệ đồng thời thực tế:**
  - *Kiểm tra thông thường (Application logic):* `if (order.order_status === 'CANCELLED') throw new Error(...)`.
  - *Cơ chế bảo vệ đồng thời thực tế (Database Concurrency Protection):*
    Hệ thống khởi tạo `sql.Transaction(pool)` và thực hiện câu lệnh:
    ```sql
    SELECT id, order_code, order_status, payment_status
    FROM orders WITH (UPDLOCK, ROWLOCK)
    WHERE id = @orderId AND user_id = @userId
    ```
    Chỉ dẫn `WITH (UPDLOCK, ROWLOCK)` khóa dòng đơn hàng ở mức độ cập nhật (Update Lock). Nếu có 2 request hủy gửi đến đồng thời trong cùng microsecond, request thứ 2 sẽ bị giữ chờ ở mức CSDL. Khi request thứ 1 commit trạng thái `CANCELLED`, request thứ 2 mới được đọc và ngay lập tức bắt gặp `order_status === 'CANCELLED'` $\rightarrow$ Bị chặn đứng và rollback ngay lập tức.
- **Khóa biến thể khi hoàn kho:**
  Mỗi mặt hàng trong `order_items` khi duyệt hoàn trả đều được khóa bằng:
  ```sql
  SELECT stock_quantity FROM product_variants WITH (UPDLOCK, ROWLOCK) WHERE id = @varId
  ```
  Sau đó thực hiện:
  - `UPDATE product_variants SET stock_quantity = stock_quantity + @qty`
  - `INSERT INTO inventory_transactions` với `change_quantity = +qty`, lý do ghi rõ *"Hoàn tồn kho do hủy đơn hàng #..."*.
- **Rollback toàn diện:** Mọi thao tác đều nằm trong khối `try...catch`. Bất kỳ ngoại lệ nào xảy ra đều kích hoạt `await transaction.rollback()`, đảm bảo tính toàn vẹn ACID.

---

### 3. AD10 — Cơ chế hoàn trả Voucher khi hủy đơn
- **Vị trí mã nguồn:** `src/services/order.service.js` (dòng 375–395 trong `_executeCancellation`).
- **Thao tác thực tế trong mã nguồn:**
  ```javascript
  const vouchRes = await vouchReq.query('SELECT voucher_id FROM orders WHERE id = @orderId');
  const appliedVoucherId = vouchRes.recordset[0]?.voucher_id;
  if (appliedVoucherId) {
    await delVuReq.query('DELETE FROM voucher_usages WHERE order_id = @orderId');
    await decVReq.query(`
      UPDATE vouchers
      SET used_count = CASE WHEN used_count > 0 THEN used_count - 1 ELSE 0 END
      WHERE id = @vouchId
    `);
  }
  ```
- **Kết quả kiểm toán đối chiếu:**
  1. *Có xóa bản ghi voucher_usages không?* **CÓ**: Thực hiện `DELETE FROM voucher_usages`.
  2. *Có giới hạn đúng `order_id` không?* **CÓ**: Mệnh đề `WHERE order_id = @orderId` bảo đảm chỉ xóa đúng lượt sử dụng của đơn hàng này.
  3. *Có cập nhật `used_count` không?* **CÓ**: Giảm `used_count` đi 1 (có kiểm tra `used_count > 0`).
  4. *Có ảnh hưởng đến khách hàng khác không?* **HOÀN TOÀN KHÔNG**: Do xóa theo `order_id`, các khách hàng khác và các đơn hàng khác không bị ảnh hưởng. Khách hàng này sau khi hủy đơn có thể áp dụng lại mã voucher đó cho đơn hàng tiếp theo.

---

### 4. AD08 — Trình tự quy trình Đặt hàng COD (Checkout COD)
- **Vị trí mã nguồn:** `src/services/order.service.js` (hàm `createCodOrder`, dòng 26–310) và `src/controllers/checkout.controller.js`.
- **Trình tự các bước thực tế trong mã nguồn:**
  1. **Xác thực dữ liệu đầu vào:** Kiểm tra `userId`, `recipientName`, `recipientPhone`, `deliveryAddress`.
  2. **Khởi tạo Transaction:** `const transaction = new sql.Transaction(pool); await transaction.begin();`.
  3. **Đọc và khóa giỏ hàng (Cart Items Lock):**
     - `carts WITH (UPDLOCK, ROWLOCK)`
     - `cart_items WITH (UPDLOCK, HOLDLOCK)`
     - Kiểm tra giỏ hàng rỗng. Nếu rỗng $\rightarrow$ Throw error $\rightarrow$ Rollback.
  4. **Tính toán chi phí:**
     - `subtotal = SUM(unit_price * quantity)`
     - `shippingFee = subtotal >= 500000 ? 0 : 30000` (Miễn phí từ 500k, dưới 500k tính 30k).
  5. **Khóa và kiểm tra Voucher (nếu có nhập mã):**
     - Khóa voucher: `vouchers WITH (UPDLOCK, ROWLOCK) WHERE code = @code AND is_active = 1`.
     - Kiểm tra hạn sử dụng: `start_date <= GETDATE() AND end_date >= GETDATE()`.
     - Kiểm tra đơn tối thiểu: `subtotal >= min_order_value`.
     - Kiểm tra lượt dùng toàn hệ thống: `used_count < usage_limit`.
     - Kiểm tra quy tắc 1 lần/khách (Q8):
       `SELECT 1 FROM voucher_usages WITH (UPDLOCK, ROWLOCK) WHERE voucher_id = @vouchId AND user_id = @userId`.
       Nếu đã dùng $\rightarrow$ Báo lỗi và Rollback.
     - Tính tiền giảm giá (cố định hoặc phần trăm có trần).
     - Cập nhật số lượt dùng voucher nguyên tử: `UPDATE vouchers SET used_count = used_count + 1 WHERE id = @vouchId ...`.
  6. **Tính tổng thanh toán:** `totalAmount = Math.max(0, subtotal - discountAmount + shippingFee)`.
  7. **Sinh mã đơn hàng duy nhất:** Thử sinh mã `VAMYYMMDD-XXXX` tối đa 5 lần kiểm tra trùng lặp.
  8. **Khóa biến thể, kiểm tra hạn mức bán lẻ và trừ tồn kho:**
     - Kiểm tra $1 \le quantity \le 10$ (Quy tắc bán lẻ).
     - Khóa dòng biến thể: `SELECT stock_quantity FROM product_variants WITH (UPDLOCK, ROWLOCK) WHERE id = @varId`.
     - Kiểm tra tồn: `currentStock >= quantity`.
     - Trừ tồn kho: `UPDATE product_variants SET stock_quantity = stock_quantity - @qty`.
     - Ghi log: `INSERT INTO inventory_transactions` với `change_quantity = -item.quantity`.
  9. **Tạo đơn hàng chính (`orders`):** Lưu trữ đầy đủ snapshot thông tin người nhận, địa chỉ, tổng tiền, mã voucher, `payment_method = 'COD'`, `payment_status = 'UNPAID'`, `order_status = 'PENDING'`.
  10. **Ghi nhận sử dụng voucher (`voucher_usages`):** Nếu có voucher, lưu `(voucher_id, user_id, order_id, used_at)`.
  11. **Tạo chi tiết đơn hàng (`order_items`):** Lưu trữ snapshot tên sản phẩm, SKU, size, màu, đơn giá, số lượng, `line_total`.
  12. **Ghi nhận lịch sử trạng thái ban đầu (`order_status_histories`):** `new_status = 'PENDING'`, ghi chú khách đặt COD qua website.
  13. **Xóa giỏ hàng người dùng (`cart_items`):**
      `DELETE FROM cart_items WHERE cart_id = @cartId`.
  14. **Hoàn tất giao dịch:** `await transaction.commit()`.
- **Khẳng định kiểm toán:** Việc xóa `cart_items` nằm ở **bước 13**, chỉ xảy ra khi toàn bộ các bước kiểm tra, trừ kho, tạo đơn, lưu order_items và ghi lịch sử trạng thái thành công 100%. Nếu có bất kỳ lỗi nào ở các bước trước, luồng nhảy ngay vào `catch (err) { await transaction.rollback(); }`, giỏ hàng của khách hàng được bảo toàn nguyên vẹn.

---

### 5. AD15 — Báo cáo doanh thu (Revenue Report)
- **Vị trí mã nguồn:** `src/controllers/admin.controller.js` (hàm `getDashboard`, dòng 8–90).
- **Truy vấn doanh thu thực tế trong mã nguồn:**
  ```sql
  SELECT COALESCE(SUM(total_amount), 0) AS total_revenue 
  FROM orders 
  WHERE order_status = 'COMPLETED' AND payment_status = 'PAID'
  ```
- **Kết quả kiểm toán đối chiếu:**
  1. *Điều kiện trạng thái đơn hàng:* `order_status = 'COMPLETED'` (Chỉ tính các đơn đã hoàn thành giao hàng).
  2. *Điều kiện trạng thái thanh toán:* `payment_status = 'PAID'` (Chỉ tính các đơn đã thực thu tiền).
  3. *Lọc khoảng thời gian:* Trong hàm `getDashboard`, truy vấn hiện tại **không có tham số lọc ngày** (tính tổng doanh thu tích lũy toàn thời gian của các đơn hoàn tất). Sơ đồ AD15 thể hiện đúng truy vấn này mà không bịa thêm bộ lọc ngày.
  4. *Loại bỏ đơn hủy và đơn dở dang:* Nhờ điều kiện kép `order_status = 'COMPLETED' AND payment_status = 'PAID'`, 100% đơn `CANCELLED`, `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPING` đều bị loại trừ khỏi doanh thu thực thu.

---

### 6. AD01–AD16 — Đối soát toàn bộ các sơ đồ còn lại và Hiệu chỉnh đường dẫn
Trong đợt kiểm tra này, toàn bộ mã nguồn của các sơ đồ còn lại đã được rà soát và phát hiện các điểm cần chuẩn hóa:
- **Chuẩn hóa đường dẫn Controller:**
  - *Trước đây:* Một số báo cáo cũ ghi nhận `profile.controller.js` và `order.controller.js`.
  - *Thực tế trong mã nguồn:* Trong thư mục `src/controllers/` **không tồn tại** `profile.controller.js` hay `order.controller.js`. Toàn bộ các chức năng Hồ sơ cá nhân (`getProfile`, `postProfile`), Sổ địa chỉ (`getAddresses`, `postAddAddress`), Xem lịch sử đơn (`getOrders`, `getOrderDetail`) và Khách hàng hủy đơn (`postCancelOrder`) đều nằm trong **`src/controllers/account.controller.js`** và gọi sang **`src/services/order.service.js`**.
  - *Đã hiệu chỉnh:* Đã cập nhật lại toàn bộ bảng đối chiếu ma trận và mô tả trong mục lục để phản ánh chính xác 100% tên tệp `account.controller.js`.
- **Chuẩn hóa đường dẫn Wishlist Toggle:**
  - Trong `src/routes/index.js` và `src/routes/wishlist.routes.js`, endpoint là `POST /api/wishlist/toggle` và phương thức service là `wishlistService.toggleItem`.
  - Đã hiệu chỉnh `AD07_WISHLIST_MANAGEMENT.puml` và kết xuất lại `AD07_WISHLIST_MANAGEMENT.png`.
- **Minh bạch hóa UC03 / AD03 (Password Reset):**
  - Giữ vững phân loại **Designed Only / Not Implemented**. Bảng CSDL `password_reset_tokens` có sẵn, nhưng route, controller và SMTP service chưa triển khai.

---

## II. BẢNG MA TRẬN ĐỐI CHIẾU NGHIỆP VỤ (CROSS-REFERENCE MATRIX)

| STT | Use Case | Activity Diagram | Tác nhân | Điều kiện bắt đầu | Luồng xử lý chính | Luồng rẽ nhánh / Ngoại lệ | File mã nguồn chứng minh thực tế | Trạng thái triển khai |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | **UC01** | **AD01_REGISTER** | Guest | Chưa đăng nhập; truy cập `/auth/register` | Validate dữ liệu $\rightarrow$ Kiểm tra trùng email $\rightarrow$ Băm bcrypt $\rightarrow$ Transaction tạo `users` + `carts` $\rightarrow$ Merge giỏ session $\rightarrow$ Regenerate session | Email đã dùng (400); Dữ liệu sai định dạng; Mật khẩu xác nhận không khớp | [auth.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/auth.controller.js#L176-L315) | **Đã cài đặt** |
| 2 | **UC02** | **AD02_LOGIN** | Guest, Customer, Admin | Truy cập `/auth/login` | So khớp bcrypt $\rightarrow$ Kiểm tra locked $\rightarrow$ Khởi tạo/Lấy CSDL Cart $\rightarrow$ Merge guest cart $\rightarrow$ Regenerate session $\rightarrow$ Chuyển hướng theo vai trò | Tài khẩu bị khóa (`locked`); Sai email/mật khẩu; Admin $\rightarrow$ `/admin/dashboard`, Customer $\rightarrow$ `safeReturnUrl` | [auth.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/auth.controller.js#L52-L158) | **Đã cài đặt** |
| 3 | **UC03** | **AD03_PASSWORD_RESET** | Guest, Customer | Quên mật khẩu | Nhập email $\rightarrow$ Sinh token crypto $\rightarrow$ Lưu `password_reset_tokens` (15p) $\rightarrow$ Gửi email liên kết $\rightarrow$ Xác thực token $\rightarrow$ Cập nhật mật khẩu mới | Email không tồn tại (vẫn thông báo thành công chống dò quét); Token hết hạn hoặc đã dùng | Bảng `password_reset_tokens` (CSDL có sẵn; Route/Service: Chưa cài đặt) | **Chỉ thiết kế (Designed Only)** |
| 4 | **UC04** | **AD04_PROFILE_ADDRESS** | Customer | Đã đăng nhập Customer | Cập nhật Họ tên, SĐT (`/account/profile`); Thêm địa chỉ mới (`/account/addresses`), nếu chọn mặc định thì hạ cờ cũ để tuân thủ `uq_user_default_address` | SĐT không đúng định dạng VN; Họ tên không hợp lệ; Thao tác ngoài quyền sở hữu | [account.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/account.controller.js#L76-L205) | **Đã cài đặt** |
| 5 | **UC05** | **AD05_SEARCH_PRODUCT** | Guest, Customer | Truy cập Storefront `/products` | Tìm kiếm tham số hóa `LIKE @q`, lọc danh mục/thương hiệu/giá $\rightarrow$ Xem chi tiết `/products/:slug` $\rightarrow$ Tải album ảnh và biến thể size/màu $\rightarrow$ Kiểm tra tồn kho | Không có sản phẩm phù hợp; Biến thể hết hàng $\rightarrow$ Nút chọn hiển thị Disabled | [product.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/product.controller.js) | **Đã cài đặt** |
| 6 | **UC06** | **AD06_CART_MANAGEMENT** | Guest, Customer | Chọn mua sản phẩm | Thêm/Sửa/Xóa giỏ hàng $\rightarrow$ Kiểm tra hạn mức $1 \le qty \le 10$ $\rightarrow$ Guest lưu session có Live DB Sync; Customer lưu bảng `cart_items` trong CSDL | Vượt quá tồn kho khả dụng; Vượt hạn mức bán lẻ (> 10); Chặn tài khoản ADMIN mua hàng | [cart.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/cart.controller.js) | **Đã cài đặt** |
| 7 | **UC07** | **AD07_WISHLIST_MANAGEMENT** | Customer | Nhấp biểu tượng Trái tim trên sản phẩm | Khách hàng đã đăng nhập nhấn yêu thích $\rightarrow$ Kiểm tra `wishlist_items` $\rightarrow$ Thực hiện 1-click toggle (`INSERT` hoặc `DELETE`) | Guest $\rightarrow$ Trả về HTTP 401 JSON redirect login; Admin $\rightarrow$ Bị chặn HTTP 403 Forbidden | [wishlist.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/wishlist.controller.js)<br>[wishlist.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/wishlist.service.js#L72-L120) | **Đã cài đặt** |
| 8 | **UC08** | **AD08_CHECKOUT_COD** | Customer | Giỏ hàng có sản phẩm, có địa chỉ nhận | Xác nhận địa chỉ $\rightarrow$ Kiểm tra voucher $\rightarrow$ Tính ship $\rightarrow$ Transaction khóa dòng `UPDLOCK, ROWLOCK` $\rightarrow$ Trừ tồn $\rightarrow$ Tạo `orders`, `order_items`, `order_status_histories` $\rightarrow$ Xóa giỏ | Giỏ rỗng $\rightarrow$ Chặn; Hết tồn kho trong microsecond $\rightarrow$ Rollback; Voucher hết hạn hoặc đã từng dùng $\rightarrow$ Báo lỗi | [checkout.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/checkout.controller.js)<br>[order.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/order.service.js#L26-L310) | **Đã cài đặt** |
| 9 | **UC09** | **AD09_ORDER_TRACKING** | Customer | Đã đăng nhập Customer | Xem danh sách đơn `/account/orders` $\rightarrow$ Xem chi tiết `/account/orders/:id` $\rightarrow$ Kiểm tra `user_id = @userId` chống IDOR $\rightarrow$ Hiển thị timeline lịch sử | Xem đơn của tài khoản khác $\rightarrow$ Trả về HTTP 404 Not Found; Đơn không tồn tại | [account.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/account.controller.js#L6-L46)<br>[order.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/order.service.js#L574-L640) | **Đã cài đặt** |
| 10 | **UC10** | **AD10_CUSTOMER_CANCEL_ORDER** | Customer | Đơn hàng đang ở trạng thái `PENDING` | Khách gửi POST `/account/orders/:id/cancel` $\rightarrow$ Transaction khóa dòng `orders` và `product_variants` $\rightarrow$ Hoàn trả kho (`change_quantity = +qty`) $\rightarrow$ Giải phóng voucher $\rightarrow$ Ghi log | Đơn đã sang `CONFIRMED` $\rightarrow$ Bị từ chối; Đơn đã hủy từ trước $\rightarrow$ Bị chặn chống hoàn kho lặp | [account.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/account.controller.js#L48-L74)<br>[order.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/order.service.js#L320-L450) | **Đã cài đặt** |
| 11 | **UC11** | **AD11_ADMIN_ORDER_PROCESSING** | Admin | Đã đăng nhập tài khoản ADMIN | Xem danh sách `/admin/orders` $\rightarrow$ Xem chi tiết $\rightarrow$ Cập nhật trạng thái theo State Machine $\rightarrow$ Ghi `order_status_histories` $\rightarrow$ Chuyển `COMPLETED` đặt `PAID` (không trừ kho lần 2) | Chuyển trạng thái nhảy cóc trái ma trận $\rightarrow$ Báo lỗi; Chọn hủy $\rightarrow$ Tự động hoàn kho và giải phóng voucher | [admin.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/admin.controller.js#L97-L200)<br>[order.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/order.service.js#L460-L570) | **Đã cài đặt** |
| 12 | **UC12** | **AD12_INVENTORY_MANAGEMENT** | Admin | Đã đăng nhập tài khoản ADMIN | Xem tồn kho biến thể `/admin/inventory` $\rightarrow$ Lọc hàng sắp hết ($\le 5$) $\rightarrow$ Xem lịch sử `/admin/inventory/history` $\rightarrow$ Điều chỉnh kho: Transaction khóa dòng, kiểm tra phi âm, ghi `inventory_transactions` | Lý do điều chỉnh rỗng $\rightarrow$ Báo lỗi; Số lượng sau điều chỉnh âm (`newStock < 0`) $\rightarrow$ Rollback | [admin.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/admin.controller.js#L520-L650) | **Đã cài đặt** |
| 13 | **UC13** | **AD13_CATALOG_MANAGEMENT** | Admin | Đã đăng nhập tài khoản ADMIN | Quản lý sản phẩm `/admin/products` $\rightarrow$ Thêm mới: Transaction tạo `products` (OUTPUT ID), `product_images`, `product_variants` $\rightarrow$ Chỉnh sửa $\rightarrow$ Bật/Tắt active $\rightarrow$ Quản lý categories, brands | Giá gốc $\le 0$ $\rightarrow$ Báo lỗi; Giá khuyến mãi > Giá gốc $\rightarrow$ Báo lỗi; Thiếu trường bắt buộc | [admin.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/admin.controller.js#L204-L510) | **Đã cài đặt** |
| 14 | **UC14** | **AD14_VOUCHER_MANAGEMENT** | Admin | Đã đăng nhập tài khoản ADMIN | Xem danh sách `/admin/vouchers` $\rightarrow$ Tạo mới: Mã (UPPER), loại giảm (tiền mặt / %), đơn tối thiểu, hạn mức tối đa, thời hạn $\rightarrow$ Bật/Tắt trạng thái | Mã rỗng/giá trị $\le 0$ $\rightarrow$ Báo lỗi; Loại % mà giá trị > 100% $\rightarrow$ Báo lỗi; Ngày kết thúc < Ngày bắt đầu $\rightarrow$ Báo lỗi | [admin.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/admin.controller.js#L776-L885) | **Đã cài đặt** |
| 15 | **UC15** | **AD15_REVENUE_REPORT** | Admin | Đã đăng nhập tài khoản ADMIN | Truy cập `/admin/dashboard` $\rightarrow$ Thực thi song song `Promise.all` tính Doanh thu thực thu (`COMPLETED` + `PAID`), phân bổ trạng thái, cảnh báo kho thấp ($\le 5$), Top sellers | Không có quyền Admin $\rightarrow$ 403; Loại trừ 100% đơn hủy, đơn chờ, đơn đang giao khỏi doanh thu | [admin.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/admin.controller.js#L8-L90) | **Đã cài đặt** |
| 16 | **UC16** | **AD16_CUSTOMER_MANAGEMENT** | Admin | Đã đăng nhập tài khoản ADMIN | Xem danh sách khách hàng `/admin/customers` $\rightarrow$ Tìm kiếm theo tên/email/SĐT $\rightarrow$ Xem hồ sơ chi tiết (địa chỉ, đơn hàng) $\rightarrow$ Khóa / Mở khóa tài khoản | Thao tác trên tài khoản ADMIN $\rightarrow$ Kích hoạt Safety Guard ném lỗi bảo mật; Khách bị khóa $\rightarrow$ Chặn đăng nhập | [admin.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/admin.controller.js#L893-L980) | **Đã cài đặt** |

---

## III. BẢNG KIỂM TOÁN TỆP VÀ BẰNG CHỨNG HÌNH ẢNH (16/16 SƠ ĐỒ)

Tất cả 16 sơ đồ đều đã được kiểm tra trực tiếp trên hệ thống tệp tại `docs/diagrams/activity/`. Các tệp `.png` đều tồn tại thực tế, kích thước lớn hơn 120 KB, kết xuất đầy đủ các làn bơi và không bị lỗi cú pháp PlantUML:

| STT | Tên tệp PlantUML (.puml) | Dung lượng PUML | Tên tệp hình ảnh (.png) | Dung lượng PNG | Trạng thái đồng bộ |
| :---: | :--- | :---: | :--- | :---: | :---: |
| 1 | `AD01_REGISTER.puml` | 3,201 bytes | `AD01_REGISTER.png` | 129,804 bytes | **100% Đồng bộ** |
| 2 | `AD02_LOGIN.puml` | 3,687 bytes | `AD02_LOGIN.png` | 129,467 bytes | **100% Đồng bộ** |
| 3 | `AD03_PASSWORD_RESET.puml` | 3,978 bytes | `AD03_PASSWORD_RESET.png` | 154,608 bytes | **100% Đồng bộ (Designed Only)** |
| 4 | `AD04_PROFILE_ADDRESS.puml` | 3,602 bytes | `AD04_PROFILE_ADDRESS.png` | 135,683 bytes | **100% Đồng bộ** |
| 5 | `AD05_SEARCH_PRODUCT.puml` | 3,151 bytes | `AD05_SEARCH_PRODUCT.png` | 132,079 bytes | **100% Đồng bộ** |
| 6 | `AD06_CART_MANAGEMENT.puml` | 4,776 bytes | `AD06_CART_MANAGEMENT.png` | 163,815 bytes | **100% Đồng bộ** |
| 7 | `AD07_WISHLIST_MANAGEMENT.puml` | 3,511 bytes | `AD07_WISHLIST_MANAGEMENT.png` | 131,970 bytes | **100% Đồng bộ (Đã re-render)** |
| 8 | `AD08_CHECKOUT_COD.puml` | 7,479 bytes | `AD08_CHECKOUT_COD.png` | 222,314 bytes | **100% Đồng bộ** |
| 9 | `AD09_ORDER_TRACKING.puml` | 3,030 bytes | `AD09_ORDER_TRACKING.png` | 131,509 bytes | **100% Đồng bộ** |
| 10 | `AD10_CUSTOMER_CANCEL_ORDER.puml` | 4,362 bytes | `AD10_CUSTOMER_CANCEL_ORDER.png` | 160,977 bytes | **100% Đồng bộ** |
| 11 | `AD11_ADMIN_ORDER_PROCESSING.puml` | 5,467 bytes | `AD11_ADMIN_ORDER_PROCESSING.png` | 185,355 bytes | **100% Đồng bộ** |
| 12 | `AD12_INVENTORY_MANAGEMENT.puml` | 3,654 bytes | `AD12_INVENTORY_MANAGEMENT.png` | 147,972 bytes | **100% Đồng bộ** |
| 13 | `AD13_CATALOG_MANAGEMENT.puml` | 4,591 bytes | `AD13_CATALOG_MANAGEMENT.png` | 161,257 bytes | **100% Đồng bộ** |
| 14 | `AD14_VOUCHER_MANAGEMENT.puml` | 3,588 bytes | `AD14_VOUCHER_MANAGEMENT.png` | 146,141 bytes | **100% Đồng bộ** |
| 15 | `AD15_REVENUE_REPORT.puml` | 3,366 bytes | `AD15_REVENUE_REPORT.png` | 142,217 bytes | **100% Đồng bộ** |
| 16 | `AD16_CUSTOMER_MANAGEMENT.puml` | 3,364 bytes | `AD16_CUSTOMER_MANAGEMENT.png` | 143,723 bytes | **100% Đồng bộ** |

---

## IV. BÁO CÁO HIỆN TRẠNG KIỂM SOÁT PHIÊN BẢN (GIT STATUS AUDIT)

1. **Git Commit Hash hiện tại:** `8135e190c69553be8f6ebf3eab7ba34de995d53c` (viết gọn: `8135e19`).
2. **Git Branch hiện tại:** `fix/master-repair-plan`.
3. **Kiểm tra Tracked Modified Files (`git diff --check` và `git status --short`):**
   - **0 modified tracked files** (Không có bất kỳ file tracked nào bị sửa đổi).
   - Mã nguồn nghiệp vụ (`src/`), cấu hình (`config/`), cơ sở dữ liệu (`database/`), migration đều được **đóng băng 100% (Freeze)**.
4. **Phân loại tệp trong Working Tree:**
   - **Tracked Files:** Nguyên vẹn tại HEAD `8135e19`.
   - **Untracked Files:** Chỉ gồm các tài liệu đặc tả và sơ đồ đồ họa được tạo mới trong quá trình thực hiện đồ án tại thư mục `docs/` (Use Case, Database ERD, Activity Diagrams).
   - **Ignored Files:** Được quản lý chặt chẽ theo `.gitignore` (`node_modules/`, `.env`, session data).
5. **Tuyệt đối tuân thủ cam kết:**
   - Không chạy `git add`, không chạy `git commit`.
   - Không chạy `git push`, không chạy `git merge`.
   - Không chạy `git reset`, `git clean`, `git rebase` hay `git stash`.

---

## V. KẾT LUẬN VÀ TRẠNG THÁI DỪNG HỆ THỐNG

Giai đoạn 3.1: Sơ đồ Hoạt động (Activity Diagrams) đã hoàn tất kiểm toán toàn diện, đối soát chuẩn xác 100% với từng dòng mã nguồn Express.js và câu lệnh SQL Server thực tế.

Theo đúng **Quy tắc dừng (Rule VI)**:
- **DỪNG LẠI HOÀN TOÀN TẠI ĐÂY.**
- **Không** tự ý chuyển sang Giai đoạn 3.2 (System Architecture / Component Diagrams).
- **Không** tự ý chuyển sang Giai đoạn 3.3.
- Báo cáo kết quả và chờ ý kiến phê duyệt chính thức từ Quản trị viên/Giảng viên hướng dẫn.
