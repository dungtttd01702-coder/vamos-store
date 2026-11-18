# DANH MỤC VÀ MÔ TẢ SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM INDEX)

## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE

> **Tiêu chuẩn học thuật:** Chuẩn hóa theo UML 2.5 cho đồ án tốt nghiệp FPT Polytechnic / Assignment Phân tích Thiết kế Hệ thống.  
> **Nguyên tắc thiết kế:** Thể hiện trực quan theo các làn bơi (Swimlanes) phân định rõ ràng giữa **Tác nhân (Actor)**, **Ứng dụng Web (Web App Controller / Service)** và **Cơ sở Dữ liệu (SQL Server Engine / Transaction)**.  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | Git HEAD `8135e19`.

---

## 1. TỔNG QUAN HỆ THỐNG SƠ ĐỒ HOẠT ĐỘNG (16 ADs)

Hệ thống sơ đồ hoạt động của VAMOS STORE gồm **16 sơ đồ (AD01 – AD16)** được chia thành 3 nhóm nghiệp vụ chính:

| Nhóm nghiệp vụ                   | Mã sơ đồ      | Tên sơ đồ hoạt động                                     | Tác nhân chính           | Trạng thái thực tế trong Code                      |
| :------------------------------- | :------------ | :------------------------------------------------------ | :----------------------- | :------------------------------------------------- |
| **Nhóm A: Tài khoản & Xác thực** | [AD01](#ad01) | Đăng ký tài khoản (Register)                            | Guest                    | Đã cài đặt (Implemented)                           |
|                                  | [AD02](#ad02) | Đăng nhập & Hợp nhất giỏ hàng (Login & Cart Merge)      | Guest / Customer / Admin | Đã cài đặt (Implemented)                           |
|                                  | [AD03](#ad03) | Quên mật khẩu & Đặt lại mật khẩu (Password Reset)       | Guest / Customer         | **Chỉ thiết kế (Designed Only - Not Implemented)** |
|                                  | [AD04](#ad04) | Quản lý hồ sơ cá nhân & Sổ địa chỉ (Profile & Address)  | Customer                 | Đã cài đặt (Implemented)                           |
| **Nhóm B: Mua sắm & Đơn hàng**   | [AD05](#ad05) | Tìm kiếm, xem danh mục & Chi tiết sản phẩm              | Guest / Customer         | Đã cài đặt (Implemented)                           |
|                                  | [AD06](#ad06) | Quản lý giỏ hàng (Cart Management)                      | Guest / Customer         | Đã cài đặt (Implemented)                           |
|                                  | [AD07](#ad07) | Quản lý danh sách yêu thích (Wishlist Management)       | Customer (Guest 401)     | Đã cài đặt (Implemented)                           |
|                                  | [AD08](#ad08) | Đặt hàng thanh toán COD (Checkout COD)                  | Customer                 | Đã cài đặt (Implemented)                           |
|                                  | [AD09](#ad09) | Theo dõi đơn hàng & Lịch sử (Order Tracking)            | Customer                 | Đã cài đặt (Implemented)                           |
|                                  | [AD10](#ad10) | Hủy đơn hàng phía khách hàng (Cancel Order)             | Customer                 | Đã cài đặt (Implemented)                           |
| **Nhóm C: Quản trị hệ thống**    | [AD11](#ad11) | Xử lý & Cập nhật trạng thái đơn hàng (Order Processing) | Admin                    | Đã cài đặt (Implemented)                           |
|                                  | [AD12](#ad12) | Quản lý kho hàng & Điều chỉnh tồn kho (Inventory)       | Admin                    | Đã cài đặt (Implemented)                           |
|                                  | [AD13](#ad13) | Quản lý danh mục, sản phẩm & biến thể (Catalog)         | Admin                    | Đã cài đặt (Implemented)                           |
|                                  | [AD14](#ad14) | Quản lý khuyến mãi & Mã giảm giá (Vouchers)             | Admin                    | Đã cài đặt (Implemented)                           |
|                                  | [AD15](#ad15) | Báo cáo doanh thu & Dashboard (Revenue Report)          | Admin                    | Đã cài đặt (Implemented)                           |
|                                  | [AD16](#ad16) | Quản lý tài khoản khách hàng (Customer Management)      | Admin                    | Đã cài đặt (Implemented)                           |

---

## 2. CHI TIẾT CÁC SƠ ĐỒ HOẠT ĐỘNG

### NHÓM A: TÀI KHOẢN & XÁC THỰC

<a id="ad01"></a>

### AD01 — Đăng ký tài khoản (Register)

- **Tác nhân:** Guest.
- **Mục tiêu:** Cho phép khách vãng lai đăng ký tài khoản Customer mới để mua hàng, quản lý đơn hàng và tích lũy voucher.
- **Các làn bơi (Swimlanes):** `Khách vãng lai (Guest)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - Kiểm tra email đã tồn tại hay chưa bằng truy vấn kiểm tra `SELECT id FROM users WHERE email = @email`.
  - Băm mật khẩu một chiều an toàn bằng thư viện `bcrypt` (`saltRounds = 10`).
  - Mở **SQL Server Transaction**: Tạo bản ghi trong `users` (vai trò mặc định `CUSTOMER`, trạng thái `active`), khởi tạo giỏ hàng trống trong `carts`.
  - Tự động hợp nhất giỏ hàng tạm trong session (`req.session.guestCart`) vào tài khoản mới.
  - Tái tạo session ID (`req.session.regenerate`) để triệt tiêu lỗ hổng **Session Fixation (OWASP)**.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD01_REGISTER.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD01_REGISTER.puml)
  - Ảnh kết xuất: [AD01_REGISTER.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD01_REGISTER.png)

---

<a id="ad02"></a>

### AD02 — Đăng nhập & Hợp nhất giỏ hàng (Login & Cart Merge)

- **Tác nhân:** Guest, Customer, Admin.
- **Mục tiêu:** Xác thực danh tính người dùng, cấp phiên làm việc an toàn và đồng bộ giỏ hàng từ session vào cơ sở dữ liệu.
- **Các làn bơi (Swimlanes):** `Người dùng (User)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - Kiểm tra trạng thái tài khoản `status === 'locked'` $\rightarrow$ Lập tức từ chối với thông báo "Tài khoản của bạn đã bị khóa".
  - So sánh băm mật khẩu với `bcrypt.compare`.
  - Khởi tạo hoặc truy xuất giỏ hàng CSDL: `SELECT id FROM carts WHERE user_id = @userId`.
  - **Thuật toán Cart Merge:** Nếu có giỏ hàng khách tạm trong `req.session.guestCart`, duyệt từng món, kiểm tra tồn kho, dùng `UPSERT` (hoặc kiểm tra tồn tại rồi `UPDATE`/`INSERT`) vào bảng `cart_items`, sau đó dọn dẹp session cart (`delete req.session.guestCart`).
  - Gọi `req.session.regenerate` phòng chống Session Fixation.
  - Phân quyền điều hướng: `role === 'ADMIN'` $\rightarrow$ `/admin/dashboard`; `role === 'CUSTOMER'` $\rightarrow$ chuyển hướng về trang trước đó (`safeReturnUrl`) hoặc `/`.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD02_LOGIN.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD02_LOGIN.puml)
  - Ảnh kết xuất: [AD02_LOGIN.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD02_LOGIN.png)

---

<a id="ad03"></a>

### AD03 — Quên mật khẩu & Đặt lại mật khẩu (Password Reset)

- **Tác nhân:** Guest, Customer.
- **Trạng thái:** **Chỉ thiết kế (Designed Only — Not Implemented)**.
- **Bối cảnh học thuật & Kiến trúc:** Bảng cơ sở dữ liệu `password_reset_tokens` đã được định nghĩa đầy đủ trong cấu trúc CSDL với các ràng buộc khóa ngoại `FK_password_reset_tokens_users`, cờ `is_used` và thời gian hết hạn `expires_at`. Tuy nhiên, mã nguồn ứng dụng hiện tại **chưa cài đặt** route (`/auth/forgot-password`), controller và dịch vụ gửi mail (SMTP/Nodemailer). Sơ đồ AD03 phản ánh thiết kế chuẩn hóa cho đợt nâng cấp tiếp theo để bảo vệ trước hội đồng đồ án.
- **Các làn bơi (Swimlanes):** `Người dùng (User)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)` | `Dịch vụ Email (SMTP Service)`.
- **Điểm kỹ thuật cốt lõi:**
  - Tạo token ngẫu nhiên bảo mật cao bằng `crypto.randomBytes(32).toString('hex')`.
  - Hashing token bằng `SHA-256` trước khi lưu vào `password_reset_tokens` với thời hạn hiệu lực 15 phút.
  - Phản hồi bảo mật: Dù email có tồn tại hay không, giao diện người dùng vẫn hiển thị cùng thông báo "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi" để chống tấn công rà quét tài khoản (**Account Enumeration Attack**).
  - Xác thực token khi truy cập: kiểm tra `is_used = 0` và `expires_at > GETDATE()`.
  - Băm mật khẩu mới bằng `bcrypt`, cập nhật bảng `users`, đánh dấu `is_used = 1` trong `password_reset_tokens`.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD03_PASSWORD_RESET.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD03_PASSWORD_RESET.puml)
  - Ảnh kết xuất: [AD03_PASSWORD_RESET.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD03_PASSWORD_RESET.png)

---

<a id="ad04"></a>

### AD04 — Quản lý hồ sơ cá nhân & Sổ địa chỉ (Profile & Address)

- **Tác nhân:** Customer.
- **Mục tiêu:** Cập nhật họ tên, số điện thoại, đổi mật khẩu và quản lý nhiều địa chỉ nhận hàng có địa chỉ mặc định.
- **Mã nguồn thực tế:** `account.controller.js` (các hàm `getProfile`, `postProfile`, `getAddresses`, `postAddAddress`).
- **Các làn bơi (Swimlanes):** `Khách hàng (Customer)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - Xác thực phiên làm việc: Yêu cầu đăng nhập (`requireAuth` middleware).
  - Cập nhật hồ sơ (`/account/profile`): Validate họ tên không được rỗng, số điện thoại đúng định dạng chuẩn Việt Nam.
  - Thêm / Sửa địa chỉ (`/account/addresses`): Nếu khách hàng chọn `is_default = 1`, mở Transaction:
    - Bỏ cờ mặc định của tất cả địa chỉ cũ: `UPDATE addresses SET is_default = 0 WHERE user_id = @userId`.
    - Gán địa chỉ mới được chọn `is_default = 1`.
  - Đảm bảo tuân thủ nghiêm ngặt **Filtered Unique Index** `uq_user_default_address` trên SQL Server.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD04_PROFILE_ADDRESS.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD04_PROFILE_ADDRESS.puml)
  - Ảnh kết xuất: [AD04_PROFILE_ADDRESS.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD04_PROFILE_ADDRESS.png)

---

### NHÓM B: MUA SẮM & ĐƠN HÀNG

<a id="ad05"></a>

### AD05 — Tìm kiếm, xem danh mục & Chi tiết sản phẩm

- **Tác nhân:** Guest, Customer.
- **Mục tiêu:** Khám phá sản phẩm, lọc theo tiêu chí (giá, danh mục, thương hiệu, đối tượng) và xem thông tin tồn kho chi tiết theo size/màu.
- **Các làn bơi (Swimlanes):** `Khách truy cập (Guest / Customer)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - Tìm kiếm linh hoạt với mệnh đề `LIKE @q` và gom nhóm điều kiện an toàn, tránh SQL Injection bằng tham số hóa (Parameterized Query).
  - Lọc theo khoảng giá: `min_price` và `max_price`.
  - Truy vấn chi tiết sản phẩm: Tải thông tin sản phẩm cha (`products`), danh sách biến thể (`product_variants`), kích cỡ (`sizes`), màu sắc (`colors`) và album ảnh (`product_images`).
  - Giao diện động: Khi khách chọn Size và Màu, mã JavaScript client-side đối chiếu tồn kho `stock_quantity`, hiển thị nút "Thêm vào giỏ" hoặc vô hiệu hóa nếu "Hết hàng".
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD05_SEARCH_PRODUCT.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD05_SEARCH_PRODUCT.puml)
  - Ảnh kết xuất: [AD05_SEARCH_PRODUCT.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD05_SEARCH_PRODUCT.png)

---

<a id="ad06"></a>

### AD06 — Quản lý giỏ hàng (Cart Management)

- **Tác nhân:** Guest, Customer.
- **Mục tiêu:** Thêm, cập nhật số lượng, xóa sản phẩm trong giỏ hàng với giới hạn mua lẻ 1–10 đôi và đồng bộ tồn kho thực tế.
- **Các làn bơi (Swimlanes):** `Khách hàng (User)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - **Phân nhánh lưu trữ:**
    - Khách vãng lai (Guest): Thao tác trên mảng `req.session.guestCart`. Cơ chế **Live DB Sync** kiểm tra trực tiếp tồn kho từ SQL Server trước khi hiển thị; tự động xóa mặt hàng đã hết tồn và giới hạn số lượng tối đa bằng tồn kho thực tế.
    - Khách đã đăng nhập (Customer): Thao tác trực tiếp trên bảng `cart_items` liên kết với `carts`.
    - Quản trị viên (Admin): Bị chặn tuyệt đối không được sử dụng tính năng giỏ hàng mua hàng.
  - **Ràng buộc số lượng:** Kiểm tra nghiêm ngặt `1 <= quantity <= 10` (nguyên tắc bán lẻ chống đầu cơ) và `quantity <= stock_quantity`.
  - Phản hồi đa dạng: Hỗ trợ cả AJAX JSON (thông báo cập nhật giỏ hàng không reload trang) và form POST truyền thống.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD06_CART_MANAGEMENT.puml](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD06_CART_MANAGEMENT.puml)
  - Ảnh kết xuất: [AD06_CART_MANAGEMENT.png](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD06_CART_MANAGEMENT.png)

---

<a id="ad07"></a>

### AD07 — Quản lý danh sách yêu thích (Wishlist Management)

- **Tác nhân:** Customer.
- **Mục tiêu:** Lưu trữ các sản phẩm yêu thích và kích hoạt lại chỉ với 1 cú nhấp chuột (1-click toggle).
- **Mã nguồn thực tế:** `wishlist.controller.js` (hàm `toggleItem`), `wishlist.service.js` (hàm `toggleItem`), route `POST /api/wishlist/toggle`.
- **Các làn bơi (Swimlanes):** `Người dùng (User)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - Khách vãng lai (Guest): Hệ thống trả về `HTTP 401 Unauthorized` kèm JSON yêu cầu chuyển hướng đến `/auth/login`.
  - Quản trị viên (Admin): Hệ thống từ chối `HTTP 403 Forbidden`.
  - Khách hàng (Customer): Kiểm tra bảng `wishlist_items` theo cặp `(user_id, product_id)`:
    - Nếu đã có $\rightarrow$ Xóa khỏi danh sách (`DELETE FROM wishlist_items`).
    - Nếu chưa có $\rightarrow$ Thêm vào danh sách (`INSERT INTO wishlist_items`).
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD07_WISHLIST_MANAGEMENT.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD07_WISHLIST_MANAGEMENT.puml)
  - Ảnh kết xuất: [AD07_WISHLIST_MANAGEMENT.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD07_WISHLIST_MANAGEMENT.png)

---

<a id="ad08"></a>

### AD08 — Đặt hàng thanh toán COD (Checkout COD)

- **Tác nhân:** Customer.
- **Mục tiêu:** Thực hiện toàn bộ quy trình thanh toán COD khép kín với đầy đủ tính toán tài chính, kiểm tra voucher, trừ tồn kho và tạo đơn hàng an toàn.
- **Mã nguồn thực tế:** `checkout.controller.js` (hàm `postProcessOrder`), `order.service.js` (hàm `createCodOrder`).
- **Các làn bơi (Swimlanes):** `Khách hàng (Customer)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi (Trọng tâm phân tích hệ thống):**
  - **Khóa bi quan chống Over-selling (Pessimistic Locking):** Sử dụng mệnh đề `WITH (UPDLOCK, ROWLOCK)` khi khóa từng dòng biến thể trong `product_variants`.
  - **Ràng buộc bán lẻ:** Kiểm tra từng mặt hàng `1 <= quantity <= 10` và `stock_quantity >= quantity`.
  - **Tính phí vận chuyển:** Nếu `subtotal >= 500,000 VND` $\rightarrow$ Phí vận chuyển = 0 VND (Miễn phí giao hàng); ngược lại = 30,000 VND.
  - **Ràng buộc Voucher nghiêm ngặt:** Kiểm tra thời hạn hiệu lực, điều kiện đơn tối thiểu (`min_order_value`), giới hạn toàn hệ thống (`usage_limit > used_count`), và ràng buộc **mỗi khách hàng chỉ được dùng 1 lần duy nhất** bằng truy vấn bảng `voucher_usages`.
  - **Giao dịch SQL Server (ACID Transaction):**
    - Trừ tồn kho biến thể: `stock_quantity = stock_quantity - qty`.
    - Ghi log xuất kho: `INSERT INTO inventory_transactions` với `change_quantity = -qty`.
    - Chụp ảnh lịch sử (Point-in-Time Historical Snapshotting): Lưu bản sao tên người nhận, SĐT, địa chỉ đầy đủ vào `orders`; lưu tên sản phẩm, mã SKU, size, màu, đơn giá vào `order_items`.
    - Ghi nhận lịch sử trạng thái ban đầu: `INSERT INTO order_status_histories (new_status = 'PENDING')`.
    - Tăng `used_count` của voucher và ghi nhận vào `voucher_usages`.
    - Xóa sạch giỏ hàng: `DELETE FROM cart_items WHERE cart_id = @cartId`.
    - `COMMIT TRANSACTION` hoặc `ROLLBACK TRANSACTION` nếu có bất kỳ lỗi nào xảy ra.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD08_CHECKOUT_COD.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD08_CHECKOUT_COD.puml)
  - Ảnh kết xuất: [AD08_CHECKOUT_COD.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD08_CHECKOUT_COD.png)

---

<a id="ad09"></a>

### AD09 — Theo dõi đơn hàng & Lịch sử (Order Tracking)

- **Tác nhân:** Customer.
- **Mục tiêu:** Xem danh sách đơn hàng đã đặt, chi tiết từng đơn hàng và tiến trình thời gian (Timeline) thực tế của đơn hàng.
- **Mã nguồn thực tế:** `account.controller.js` (hàm `getOrders`, `getOrderDetail`), `order.service.js` (hàm `getOrdersByUser`, `getOrderDetails`).
- **Các làn bơi (Swimlanes):** `Khách hàng (Customer)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - **Kiểm soát quyền sở hữu đơn hàng (Ownership Authorization):** Mọi truy vấn chi tiết đơn hàng đều kèm điều kiện ràng buộc `WHERE id = @orderId AND user_id = @userId`. Ngăn chặn hoàn toàn lỗ hổng **IDOR (Insecure Direct Object References)**.
  - Truy vấn 3 bảng dữ liệu liên kết: thông tin đơn hàng (`orders`), danh sách món snapshot (`order_items`), tiến trình trạng thái (`order_status_histories`).
  - Hiển thị trực quan nút "Hủy đơn hàng" nếu trạng thái hiện tại là `PENDING`.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD09_ORDER_TRACKING.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD09_ORDER_TRACKING.puml)
  - Ảnh kết xuất: [AD09_ORDER_TRACKING.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD09_ORDER_TRACKING.png)

---

<a id="ad10"></a>

### AD10 — Hủy đơn hàng phía khách hàng (Cancel Order)

- **Tác nhân:** Customer.
- **Mục tiêu:** Cho phép khách hàng chủ động hủy đơn khi đơn hàng chưa được xác nhận, tự động hoàn trả tồn kho và giải phóng voucher.
- **Mã nguồn thực tế:** `account.controller.js` (hàm `postCancelOrder`), `order.service.js` (hàm `cancelOrder`, `_executeCancellation`), route `POST /account/orders/:id/cancel`.
- **Các làn bơi (Swimlanes):** `Khách hàng (Customer)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - **Quy tắc trạng thái hữu hạn (State Guard):** Khách hàng **chỉ được phép hủy** đơn hàng khi `order_status === 'PENDING'`. Nếu đơn đã sang `CONFIRMED`, `PROCESSING`, `SHIPPING` hoặc `COMPLETED`, hệ thống từ chối.
  - **Chống hủy trùng lặp:** Kiểm tra nếu đơn đã là `CANCELLED`, báo lỗi ngay.
  - **SQL Server Transaction hoàn nguyên tài nguyên:**
    - Khóa đơn hàng với `WITH (UPDLOCK, ROWLOCK)` theo cặp `(id = @orderId AND user_id = @userId)`.
    - Cập nhật trạng thái: `order_status = 'CANCELLED'`.
    - Ghi lịch sử: `INSERT INTO order_status_histories (old_status, new_status, note)`.
    - Duyệt từng mặt hàng trong `order_items`, khóa biến thể `WITH (UPDLOCK, ROWLOCK)`, hoàn trả tồn kho: `stock_quantity = stock_quantity + qty`.
    - Ghi log nhập lại kho: `INSERT INTO inventory_transactions` với `change_quantity = +qty`, lý do ghi rõ hoàn kho do hủy đơn.
    - Giải phóng voucher: Nếu đơn có voucher, xóa bản ghi trong `voucher_usages` theo đúng `WHERE order_id = @orderId` (không ảnh hưởng đơn khác) và giảm `vouchers.used_count` đi 1 để khách hàng có thể sử dụng lại mã.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD10_CUSTOMER_CANCEL_ORDER.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD10_CUSTOMER_CANCEL_ORDER.puml)
  - Ảnh kết xuất: [AD10_CUSTOMER_CANCEL_ORDER.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/AD10_CUSTOMER_CANCEL_ORDER.png)

---

### NHÓM C: QUẢN TRỊ HỆ THỐNG (ADMIN)

<a id="ad11"></a>

### AD11 — Xử lý & Cập nhật trạng thái đơn hàng (Order Processing)

- **Tác nhân:** Admin.
- **Mục tiêu:** Quản trị viên duyệt, chuyển giao trạng thái đơn hàng theo máy trạng thái tuần tự và thu tiền COD khi hoàn tất.
- **Các làn bơi (Swimlanes):** `Quản trị viên (Admin)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - Kiểm tra quyền quản trị: `requireAdmin` middleware.
  - **Máy trạng thái đơn hàng tuần tự (Order State Machine):**
    - `PENDING` $\rightarrow$ `CONFIRMED` hoặc `CANCELLED`
    - `CONFIRMED` $\rightarrow$ `PROCESSING` hoặc `CANCELLED`
    - `PROCESSING` $\rightarrow$ `SHIPPING`
    - `SHIPPING` $\rightarrow$ `COMPLETED`
  - Nếu Admin chuyển trạng thái sang `COMPLETED`: Tự động cập nhật `payment_status = 'PAID'` (ghi nhận thu tiền thành công đối với đơn COD).
  - **Bảo toàn kho khi hoàn tất:** Tuyệt đối không trừ tồn kho lần 2 (vì kho đã trừ ngay từ lúc Checkout COD).
  - Nếu Admin chuyển sang `CANCELLED`: Tự động kích hoạt cơ chế hoàn trả tồn kho và giải phóng voucher giống quy trình AD10.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD11_ADMIN_ORDER_PROCESSING.puml](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD11_ADMIN_ORDER_PROCESSING.puml)
  - Ảnh kết xuất: [AD11_ADMIN_ORDER_PROCESSING.png](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD11_ADMIN_ORDER_PROCESSING.png)

---

<a id="ad12"></a>

### AD12 — Quản lý kho hàng & Điều chỉnh tồn kho (Inventory Management)

- **Tác nhân:** Admin.
- **Mục tiêu:** Theo dõi mức tồn kho chi tiết từng SKU (size, màu), phát hiện hàng sắp hết và thực hiện điều chỉnh tồn kho thủ công kèm kiểm toán (Audit Trail).
- **Các làn bơi (Swimlanes):** `Quản trị viên (Admin)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - Lọc nhanh các mặt hàng có tồn kho nguy cấp: `stock_quantity <= 5`.
  - Xem lịch sử kiểm toán kho: `GET /admin/inventory/history` lấy 50 giao dịch gần nhất từ `inventory_transactions`.
  - **Quy trình điều chỉnh kho an toàn (SQL Server Transaction):**
    - Bắt buộc nhập lý do điều chỉnh (`reason`) phục vụ kiểm toán nội bộ.
    - Khóa dòng biến thể chống xung đột: `SELECT ... FROM product_variants WITH (UPDLOCK, ROWLOCK) WHERE id = @varId`.
    - Tính tồn kho mới: `newStock = currentStock + changeQty`.
    - Kiểm tra ràng buộc phi âm: Nếu `newStock < 0` $\rightarrow$ Rollback transaction và báo lỗi ngay.
    - Cập nhật số lượng mới trong `product_variants` và ghi nhận lịch sử vào `inventory_transactions` với tiền tố `[Admin #id] reason`.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD12_INVENTORY_MANAGEMENT.puml](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD12_INVENTORY_MANAGEMENT.puml)
  - Ảnh kết xuất: [AD12_INVENTORY_MANAGEMENT.png](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD12_INVENTORY_MANAGEMENT.png)

---

<a id="ad13"></a>

### AD13 — Quản lý danh mục, sản phẩm & biến thể (Catalog Management)

- **Tác nhân:** Admin.
- **Mục tiêu:** Thêm mới sản phẩm kèm biến thể ban đầu, chỉnh sửa thông tin, bật/tắt hiển thị sản phẩm và cấu hình danh mục/thương hiệu.
- **Các làn bơi (Swimlanes):** `Quản trị viên (Admin)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - Kiểm tra hợp lệ dữ liệu kinh doanh: `base_price > 0`, `sale_price <= base_price`, đầy đủ tên và mã sản phẩm.
  - Tự động sinh `slug` chuẩn hóa không dấu (URL-friendly).
  - **SQL Server Transaction khi tạo sản phẩm:**
    - Chèn dữ liệu vào bảng `products` và thu hồi ID bằng `OUTPUT INSERTED.id`.
    - Chèn ảnh đại diện vào `product_images` (`is_primary = 1`).
    - Khởi tạo biến thể đầu tiên vào `product_variants` với quy tắc sinh SKU tự động: `PRODUCTCODE-SIZE_ID-COLOR_ID`.
  - Hỗ trợ đổi trạng thái sản phẩm tức thời: `UPDATE products SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END`.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD13_CATALOG_MANAGEMENT.puml](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD13_CATALOG_MANAGEMENT.puml)
  - Ảnh kết xuất: [AD13_CATALOG_MANAGEMENT.png](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD13_CATALOG_MANAGEMENT.png)

---

<a id="ad14"></a>

### AD14 — Quản lý khuyến mãi & Mã giảm giá (Voucher Management)

- **Tác nhân:** Admin.
- **Mục tiêu:** Tạo mới các chương trình khuyến mãi mã giảm giá, kiểm soát thời hạn, giới hạn số lượt sử dụng và bật/tắt hiệu lực.
- **Các làn bơi (Swimlanes):** `Quản trị viên (Admin)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - Kiểm tra hợp lệ: Mã voucher tự động chuyển thành chữ HOA (`UPPER`), `discount_value > 0`.
  - Nếu loại giảm là phần trăm (`percentage`): Giá trị không được vượt quá 100%.
  - Kiểm tra khoảng thời gian: `end_date >= start_date`.
  - Khởi tạo `used_count = 0` và `is_active = 1`.
  - Thao tác đảo trạng thái hiệu lực nhanh: `UPDATE vouchers SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = @id`.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD14_VOUCHER_MANAGEMENT.puml](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD14_VOUCHER_MANAGEMENT.puml)
  - Ảnh kết xuất: [AD14_VOUCHER_MANAGEMENT.png](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD14_VOUCHER_MANAGEMENT.png)

---

<a id="ad15"></a>

### AD15 — Báo cáo doanh thu & Dashboard (Revenue Report)

- **Tác nhân:** Admin.
- **Mục tiêu:** Cung cấp bức tranh toàn cảnh về hoạt động kinh doanh, dòng tiền thực thu, hiệu quả bán hàng và cảnh báo vận hành.
- **Các làn bơi (Swimlanes):** `Quản trị viên (Admin)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - **Nguyên tắc kế toán thực thu (Realized Revenue):** Doanh thu chỉ được cộng dồn khi thỏa mãn đồng thời hai điều kiện: `order_status = 'COMPLETED'` VÀ `payment_status = 'PAID'`. Tuyệt đối loại trừ doanh thu từ các đơn hàng đã bị hủy hoặc đang xử lý dở dang.
  - Sử dụng cơ chế thực thi song song `Promise.all` để tối ưu hóa hiệu năng truy vấn SQL Server cho 8 chỉ số KPI cùng lúc:
    1. Tổng doanh thu thực thu (`SUM(total_amount)`).
    2. Tổng số đơn hàng & số đơn chờ xử lý (`PENDING`).
    3. Quy mô Catalog và biến thể SKU đang hoạt động (`active`).
    4. Cảnh báo hàng sắp hết kho (`stock_quantity <= 5`).
    5. Cơ cấu phân bổ đơn hàng theo máy trạng thái.
    6. Bảng xếp hạng sản phẩm bán chạy nhất (Top Sellers) kèm doanh số đóng góp.
    7. Danh sách các đơn hàng cần xử lý gấp.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD15_REVENUE_REPORT.puml](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD15_REVENUE_REPORT.puml)
  - Ảnh kết xuất: [AD15_REVENUE_REPORT.png](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD15_REVENUE_REPORT.png)

---

<a id="ad16"></a>

### AD16 — Quản lý tài khoản khách hàng (Customer Management)

- **Tác nhân:** Admin.
- **Mục tiêu:** Quản trị viên theo dõi danh sách khách hàng, xem chi tiết lịch sử mua sắm và thực hiện khóa/mở khóa tài khoản khi có dấu hiệu gian lận.
- **Các làn bơi (Swimlanes):** `Quản trị viên (Admin)` | `Hệ thống (Web App)` | `Cơ sở Dữ liệu (SQL Server)`.
- **Điểm kỹ thuật cốt lõi:**
  - Lọc tài khoản theo điều kiện `WHERE role = 'CUSTOMER'`, tìm kiếm theo tên, email, SĐT.
  - Xem chi tiết hồ sơ: Tải đồng thời thông tin cá nhân, danh sách sổ địa chỉ và toàn bộ lịch sử đơn hàng đã đặt.
  - **Cơ chế tự vệ an toàn hệ thống (Safety Guard):**
    - Kiểm tra vai trò của tài khoản mục tiêu trước khi thao tác.
    - Nếu tài khoản có `role === 'ADMIN'` $\rightarrow$ Hệ thống kích hoạt cơ chế phòng vệ, ném ngoại lệ bảo mật: _"Tuyệt đối không được khóa tài khoản Quản trị viên (ADMIN)"_.
    - Đối với tài khoản khách hàng: Thực hiện đảo trạng thái `status = CASE WHEN status = 'active' THEN 'locked' ELSE 'active' END`. Khi tài khoản ở trạng thái `locked`, mọi hành vi đăng nhập sẽ bị chặn đứng tại controller xác thực.
- **Tài liệu sơ đồ:**
  - File nguồn PlantUML: [AD16_CUSTOMER_MANAGEMENT.puml](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD16_CUSTOMER_MANAGEMENT.puml)
  - Ảnh kết xuất: [AD16_CUSTOMER_MANAGEMENT.png](file:///c:/Users/Admin/Desktop/dự án JAV/docs/diagrams/activity/AD16_CUSTOMER_MANAGEMENT.png)

---

_Tài liệu thuộc Giai đoạn 3.1 của Báo cáo Phân tích Thiết kế Hệ thống VAMOS STORE._
