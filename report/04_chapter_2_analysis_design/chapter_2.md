# CHƯƠNG II: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG (SYSTEM ANALYSIS & DESIGN)

---

## 1. PHÂN TÍCH NGHIỆP VỤ HỆ THỐNG

### 1.1. Nghiệp vụ của Khách vãng lai (Guest)
Khách vãng lai là người truy cập website nhưng chưa đăng nhập hoặc chưa có tài khoản trên hệ thống:
* **Khám phá và tra cứu sản phẩm:** Xem trang chủ, xem các bộ sưu tập giày dép nổi bật, tìm kiếm sản phẩm theo từ khóa (tên sản phẩm, dòng sản phẩm, thương hiệu).
* **Lọc và phân loại nâng cao:** Sử dụng bộ lọc đa tiêu chí bên thanh điều hướng trái (Sidebar Filter) để lọc theo danh mục (Sneaker, Thể thao, Chạy bộ, Sandal, Dép), lọc theo đối tượng giới tính (Nam, Nữ, Trẻ em, Unisex), lọc theo kích cỡ giày (Size 36 đến 45), theo màu sắc và khoảng giá bán.
* **Xem thông tin chi tiết sản phẩm:** Xem bộ sưu tập hình ảnh góc chụp chi tiết, đọc mô tả tính năng công nghệ của đế và thân giày, bảng hướng dẫn chọn size chuẩn, kiểm tra tình trạng còn hàng theo từng cặp Size x Màu sắc.
* **Đăng ký tài khoản mới:** Cung cấp thông tin họ tên, email hợp lệ, số điện thoại, mật khẩu để tạo tài khoản thành viên `Customer`.
* **Đăng nhập và khôi phục mật khẩu:** Xác thực vào hệ thống hoặc gửi yêu cầu đặt lại mật khẩu khi quên.

### 1.2. Nghiệp vụ của Khách hàng thành viên (Customer)
Khách hàng thành viên là người đã đăng nhập tài khoản khách hàng trên hệ thống VAMOS STORE:
* **Quản lý giỏ hàng:** Chọn biến thể kích cỡ và màu sắc ưng ý, chỉ định số lượng và thêm vào giỏ hàng cá nhân. Khách hàng có thể tăng/giảm số lượng hoặc xóa dòng sản phẩm trong trang giỏ hàng.
* **Đặt hàng thanh toán COD:** Thực hiện quy trình đặt hàng: chọn địa chỉ giao nhận từ sổ địa chỉ có sẵn hoặc nhập địa chỉ mới; nhập mã voucher khuyến mãi (nếu có); xác nhận phương thức thanh toán tiền mặt khi nhận hàng (COD).
* **Quản lý sổ địa chỉ:** Thêm nhiều địa chỉ giao hàng cá nhân, chỉnh sửa thông tin người nhận và thiết lập một địa chỉ làm mặc định.
* **Theo dõi đơn hàng (Order Tracking):** Xem danh sách lịch sử mua hàng; xem chi tiết từng đơn hàng bao gồm danh sách sản phẩm snapshot, tổng tiền, mã vận đơn nội bộ và tiến trình trạng thái thời gian thực.
* **Chủ động hủy đơn hàng:** Được phép tự bấm nút "Hủy đơn hàng" và nhập lý do hủy DUY NHẤT khi đơn hàng đang ở trạng thái chờ xác nhận (`PENDING`). Khi đơn đã chuyển sang trạng thái đã xác nhận (`CONFIRMED`) hoặc đang chuẩn bị hàng (`PROCESSING`), nút hủy đơn sẽ tự động bị vô hiệu hóa.

### 1.3. Nghiệp vụ của Quản trị viên (Admin)
Quản trị viên là người vận hành và kiểm soát toàn bộ hoạt động kinh doanh trên hệ thống:
* **Quản lý Danh mục và Thương hiệu:** Thêm mới, cập nhật thông tin mô tả, cấu hình đường dẫn tĩnh (slug) và bật/tắt trạng thái hiển thị danh mục trên cửa hàng.
* **Quản lý Sản phẩm và Biến thể:** Tạo mới thông tin sản phẩm cha; tải lên bộ sưu tập hình ảnh chi tiết và chọn ảnh đại diện chính; cấu hình ma trận biến thể giày theo từng cặp Kích cỡ (Size) x Màu sắc (Color) gán kèm mã SKU duy nhất và số lượng nhập kho ban đầu.
* **Quản lý Tồn kho & Kiểm kê:** Xem danh sách cảnh báo các mặt hàng sắp hết (`stock_quantity <= 5`); thực hiện điều chỉnh tăng/giảm tồn kho thủ công khi kiểm kê kho thực tế; bắt buộc nhập lý do điều chỉnh để lưu vết kiểm toán vào `inventory_transactions`.
* **Vận hành Đơn hàng (Order Fulfillment):** Xem danh sách đơn hàng lọc theo trạng thái; xem chi tiết snapshot địa chỉ và sản phẩm; thực hiện chuyển đổi trạng thái đơn hàng theo đúng quy trình nghiệp vụ: `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`. Admin có quyền hủy đơn hàng ở trạng thái `PENDING` hoặc `CONFIRMED` kèm theo ghi chú lý do nội bộ, hệ thống sẽ tự động kích hoạt hoàn kho.
* **Quản lý Mã giảm giá (Vouchers):** Tạo mã khuyến mãi, thiết lập hình thức giảm (theo `%` hoặc trừ tiền cố định), giá trị giảm, hạn mức tối đa, giá trị đơn hàng tối thiểu và khung thời gian hiệu lực.
* **Báo cáo Doanh thu & Thống kê:** Bảng điều khiển trực quan thống kê tổng số đơn hàng, tổng sản phẩm đã bán và doanh thu thực tế (nguyên tắc: chỉ ghi nhận doanh thu từ các đơn hàng đã ở trạng thái `COMPLETED`).

---

## 2. THIẾT KẾ HỆ THỐNG

### 2.1. Sơ đồ Use Case (Use Case Diagrams)

#### A. Sơ đồ Use Case tổng quát toàn hệ thống
Hệ thống VAMOS STORE bao gồm 4 gói chức năng (Packages) được phân quyền cho 3 tác nhân chính (`Guest`, `Customer`, `Admin`):
* Gói 1: Quản lý tài khoản & Xác thực
* Gói 2: Mua sắm & Đặt hàng COD
* Gói 3: Quản lý đơn hàng cá nhân của Khách hàng
* Gói 4: Quản trị hệ thống dành cho Admin

<div align="center">
  <img src="images/hinh_05_use_case_tong_quat.png" alt="Hình 5: Sơ đồ Use Case tổng quát VAMOS STORE" style="max-width: 75%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 5: Sơ đồ Use Case tổng quát VAMOS STORE</strong></p>
</div>

---

#### B. Sơ đồ Use Case chi tiết phân hệ Đặt hàng COD & Giỏ hàng
* Ca sử dụng trung tâm là **"Đặt hàng COD"** (`UC07`) được thực hiện bởi `Customer`.
* Quan hệ `<<include>>`: Luồng đặt hàng bắt buộc phải bao gồm bước *"Chọn địa chỉ nhận hàng"* và *"Xác nhận thông tin đặt hàng"*.
* Quan hệ `<<extend>>`: Khách hàng có thể tùy chọn *"Áp dụng mã giảm giá"* (`UC08`) khi đơn hàng thỏa mãn điều kiện tối thiểu.

<div align="center">
  <img src="images/hinh_06_use_case_mua_hang.png" alt="Hình 6: Sơ đồ Use Case chi tiết Đặt hàng COD" style="max-width: 80%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 6: Sơ đồ Use Case chi tiết Đặt hàng COD</strong></p>
</div>

---

#### C. Sơ đồ Use Case chi tiết Quản lý đơn hàng khách hàng & Hủy đơn
* Khách hàng xem danh sách đơn hàng đã mua (`UC09`) và theo dõi tiến trình chuyển trạng thái theo thời gian thực.
* Chức năng *"Hủy đơn hàng"* (`UC10`) là điểm mở rộng (`<<extend>>`) gắn kèm điểm mở rộng (Extension Point) `condition: status == 'PENDING'`.

<div align="center">
  <img src="images/hinh_07_use_case_quan_ly.png" alt="Hình 7: Sơ đồ Use Case chi tiết Quản lý đơn hàng & Vận hành kho Admin" style="max-width: 80%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 7: Sơ đồ Use Case chi tiết Vận hành đơn hàng và Kho hàng Admin</strong></p>
</div>

---

### 2.2. Sơ đồ điều hướng màn hình (Sitemap)

Website VAMOS STORE được phân chia cấu trúc trang thành 3 phân vùng độc lập:
1. **Phân vùng công khai (Public Zone):** Trang chủ, Danh mục sản phẩm (Shop), Chi tiết sản phẩm, Giỏ hàng, Đăng nhập, Đăng ký, Quên mật khẩu, Chính sách bảo hành/đổi trả.
2. **Phân vùng Khách hàng (Customer Protected Zone):** Trang thanh toán đặt hàng COD (Checkout), Trang xác nhận đặt hàng thành công, Trang hồ sơ cá nhân, Sổ địa chỉ nhận hàng, Lịch sử và chi tiết đơn hàng.
3. **Phân vùng Quản trị (Admin Protected Zone):** Dashboard thống kê doanh thu, Quản lý sản phẩm & biến thể, Quản lý danh mục & thương hiệu, Quản lý tồn kho & nhật ký kho, Quản lý đơn hàng & chuyển trạng thái, Quản lý mã giảm giá (voucher), Quản lý banner slider.

<div align="center">
  <img src="images/hinh_08_sitemap.png" alt="Hình 8: Sơ đồ điều hướng màn hình Sitemap VAMOS STORE" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 8: Sơ đồ điều hướng màn hình (Sitemap) VAMOS STORE</strong></p>
</div>

---

### 2.3. Mô hình thực thể quan hệ - ERD (Entity-Relationship Diagram)

Hệ thống cơ sở dữ liệu VAMOS STORE được xây dựng chuẩn hóa gồm **18 thực thể** liên kết chặt chẽ trên hệ quản trị CSDL Microsoft SQL Server 2025:

<div align="center">
  <img src="images/hinh_09_erd.png" alt="Hình 9: Mô hình thực thể quan hệ (ERD 18 bảng) - VAMOS STORE" style="max-width: 95%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 9: Mô hình thực thể quan hệ (ERD 18 bảng) - VAMOS STORE</strong></p>
</div>

---

### 2.4. Từ điển dữ liệu chi tiết (Data Dictionary)

*(Theo phong cách trình bày chuẩn của đồ án FPT Polytechnic, mỗi thực thể được thể hiện bằng một bảng gồm: Thuộc tính, Kiểu dữ liệu, Bắt buộc, Ràng buộc, Mô tả).*

#### Bảng 2: Thực thể `users`
*Mục đích: Quản lý tài khoản người dùng hệ thống (`CUSTOMER`, `ADMIN`).*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh duy nhất của người dùng |
| `full_name` | `VARCHAR(100)` | Có | | Họ và tên đầy đủ của người dùng |
| `email` | `VARCHAR(150)` | Có | UNIQUE | Địa chỉ email đăng nhập hệ thống |
| `password_hash` | `VARCHAR(255)` | Có | | Chuỗi băm mật khẩu bảo mật (bcrypt) |
| `phone` | `VARCHAR(20)` | Không | NULL | Số điện thoại liên lạc |
| `role` | `ENUM('ADMIN','CUSTOMER')` | Có | Mặc định: 'CUSTOMER' | Vai trò phân quyền trên hệ thống |
| `status` | `ENUM('active','locked')` | Có | Mặc định: 'active' | Trạng thái hoạt động tài khoản |
| `created_at` | `TIMESTAMP` | Có | Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo tài khoản |
| `updated_at` | `TIMESTAMP` | Có | ON UPDATE CURRENT_TIMESTAMP | Thời điểm cập nhật thông tin |

#### Bảng 3: Thực thể `addresses`
*Mục đích: Sổ địa chỉ nhận hàng của khách hàng.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh bản ghi địa chỉ |
| `user_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `users(id)` | Tham chiếu tài khoản khách hàng sở hữu |
| `recipient_name` | `VARCHAR(100)` | Có | | Họ tên người nhận hàng |
| `phone` | `VARCHAR(20)` | Có | | Số điện thoại người nhận hàng |
| `province` | `VARCHAR(100)` | Có | | Tỉnh / Thành phố giao hàng |
| `district` | `VARCHAR(100)` | Có | | Quận / Huyện giao hàng |
| `ward` | `VARCHAR(100)` | Có | | Phường / Xã giao hàng |
| `detail_address` | `VARCHAR(255)` | Có | | Số nhà, tên đường, địa chỉ chi tiết |
| `is_default` | `BOOLEAN` | Có | Mặc định: FALSE | Cờ đánh dấu địa chỉ mặc định (1: có, 0: không) |
| `created_at` | `TIMESTAMP` | Có | Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo bản ghi |
| `updated_at` | `TIMESTAMP` | Có | ON UPDATE CURRENT_TIMESTAMP | Thời điểm cập nhật địa chỉ |

#### Bảng 4: Thực thể `password_reset_tokens`
*Mục đích: Token xác thực khôi phục mật khẩu (chỉ lưu dạng hash bảo mật).*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Mã định danh token |
| `user_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `users(id)` | Tài khoản yêu cầu khôi phục |
| `token_hash` | `NVARCHAR(255)` | Có | UNIQUE | Chuỗi băm token bảo mật (không lưu plaintext) |
| `expires_at` | `DATETIME2` | Có | | Thời điểm hết hạn của token |
| `used_at` | `DATETIME2` | Không | NULL | Thời điểm token đã được sử dụng |
| `created_at` | `DATETIME2` | Có | Mặc định: GETDATE() | Thời điểm tạo yêu cầu reset |

#### Bảng 5: Thực thể `categories`
*Mục đích: Danh mục phân loại sản phẩm.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh danh mục |
| `name` | `VARCHAR(100)` | Có | | Tên danh mục (Sneaker, Thể thao, Sandal,...) |
| `slug` | `VARCHAR(120)` | Có | UNIQUE | Đường dẫn tĩnh SEO duy nhất |
| `description` | `TEXT` | Không | NULL | Mô tả chi tiết danh mục |
| `is_active` | `BOOLEAN` | Có | Mặc định: TRUE | Cờ hiển thị (1: bật, 0: ẩn) |
| `created_at` | `TIMESTAMP` | Có | Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo danh mục |

#### Bảng 6: Thực thể `brands`
*Mục đích: Thương hiệu / Dòng bộ sưu tập nội bộ VAMOS.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh thương hiệu/bộ sưu tập |
| `name` | `VARCHAR(100)` | Có | | Tên bộ sưu tập (VAMOS Street, Sport...) |
| `slug` | `VARCHAR(120)` | Có | UNIQUE | Đường dẫn tĩnh duy nhất |
| `description` | `TEXT` | Không | NULL | Giới thiệu về bộ sưu tập |
| `created_at` | `TIMESTAMP` | Có | Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo bản ghi |

#### Bảng 7: Thực thể `products`
*Mục đích: Thông tin sản phẩm cha.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh sản phẩm |
| `category_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `categories(id)` | Danh mục phân loại của sản phẩm |
| `brand_id` | `INT` | Không | Khóa ngoại $\rightarrow$ `brands(id)` | Bộ sưu tập (tùy chọn) |
| `product_code`| `VARCHAR(50)` | Có | UNIQUE | Mã sản phẩm nội bộ (ví dụ: VM-SNK-01) |
| `name` | `VARCHAR(200)` | Có | | Tên hiển thị đầy đủ của sản phẩm |
| `slug` | `VARCHAR(255)` | Có | UNIQUE | Đường dẫn tĩnh chi tiết sản phẩm |
| `description` | `TEXT` | Không | NULL | Mô tả chất liệu, tính năng, hướng dẫn size |
| `gender_target`| `ENUM('MEN','WOMEN','KIDS','UNISEX')` | Có | Mặc định: 'UNISEX' | Đối tượng khách hàng mục tiêu |
| `base_price` | `DECIMAL(12,0)` | Có | CHECK `base_price >= 0` | Giá bán niêm yết chính thức (VNĐ) |
| `sale_price` | `DECIMAL(12,0)` | Không | CHECK `< base_price` | Giá bán ưu đãi khuyến mãi (VNĐ) |
| `status` | `ENUM('active','inactive','draft')` | Có | Mặc định: 'active' | Trạng thái hiển thị trên cửa hàng |
| `created_at` | `TIMESTAMP` | Có | Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo sản phẩm |
| `updated_at` | `TIMESTAMP` | Có | ON UPDATE CURRENT_TIMESTAMP | Thời điểm cập nhật sản phẩm |

#### Bảng 8: Thực thể `product_images`
*Mục đích: Bộ sưu tập hình ảnh chi tiết của sản phẩm.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh ảnh |
| `product_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `products(id)` | Tham chiếu sản phẩm gốc |
| `image_url` | `VARCHAR(255)` | Có | | Đường dẫn URL file ảnh trong storage |
| `is_primary` | `BOOLEAN` | Có | Mặc định: FALSE | Cờ đánh dấu ảnh đại diện chính |
| `display_order`| `INT` | Có | Mặc định: 0 | Thứ tự sắp xếp trong gallery slider |

#### Bảng 9: Thực thể `sizes`
*Mục đích: Danh mục chuẩn kích cỡ giày dép.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh kích cỡ |
| `size_name` | `VARCHAR(20)` | Có | UNIQUE | Tên kích cỡ chuẩn (38, 39, 40, 41,...) |
| `display_order`| `INT` | Có | Mặc định: 0 | Thứ tự hiển thị khi chọn size |

#### Bảng 10: Thực thể `colors`
*Mục đích: Danh mục màu sắc sản phẩm.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh màu sắc |
| `color_name` | `VARCHAR(50)` | Có | UNIQUE | Tên màu (Đen, Trắng, Đỏ Coral,...) |
| `hex_code` | `VARCHAR(10)` | Không | NULL | Mã màu thập lục phân CSS (#000000) |

#### Bảng 11: Thực thể `product_variants`
*Mục đích: Biến thể chi tiết Size x Color x SKU x Tồn kho.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh biến thể |
| `product_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `products(id)` | Sản phẩm cha |
| `size_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `sizes(id)` | Kích cỡ biến thể |
| `color_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `colors(id)` | Màu sắc biến thể |
| `sku` | `VARCHAR(100)` | Có | UNIQUE | Mã SKU lưu kho duy nhất |
| `stock_quantity`| `INT` | Có | CHECK `>= 0` | Số lượng tồn kho khả dụng hiện tại |
| `status` | `ENUM('active','inactive')` | Có | Mặc định: 'active' | Trạng thái kinh doanh của biến thể |
| `created_at` | `TIMESTAMP` | Có | Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo biến thể |
| `updated_at` | `TIMESTAMP` | Có | ON UPDATE CURRENT_TIMESTAMP | Thời điểm cập nhật số lượng kho |
| **Ràng buộc tổ hợp** | | | `UNIQUE(product_id, size_id, color_id)` | Ngăn chặn tạo trùng cặp Size/Màu trên cùng 1 sản phẩm |

#### Bảng 12: Thực thể `inventory_transactions`
*Mục đích: Nhật ký kiểm toán biến động kho.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh giao dịch kho |
| `variant_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `product_variants(id)` | Biến thể bị biến động |
| `user_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `users(id)` | Người thực hiện (Admin chỉnh hoặc Khách đặt đơn) |
| `old_quantity` | `INT` | Có | CHECK `>= 0` | Số lượng tồn trước biến động |
| `new_quantity` | `INT` | Có | CHECK `>= 0` | Số lượng tồn sau biến động |
| `change_quantity`| `INT` | Có | | Số lượng thay đổi (+ nhập/hoàn, - bán) |
| `reason` | `VARCHAR(255)` | Có | | Lý do biến động (ORDER_PLACED, RESTOCK,...) |
| `created_at` | `TIMESTAMP` | Có | Mặc định: CURRENT_TIMESTAMP | Thời điểm ghi nhận giao dịch |

#### Bảng 13: Thực thể `carts`
*Mục đích: Giỏ hàng khách hàng.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh giỏ hàng |
| `user_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `users(id)`, UNIQUE | Khách hàng sở hữu (Mỗi user chỉ có 1 giỏ) |
| `created_at` | `TIMESTAMP` | Có | Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo giỏ hàng |
| `updated_at` | `TIMESTAMP` | Có | ON UPDATE CURRENT_TIMESTAMP | Thời điểm cập nhật giỏ |

#### Bảng 14: Thực thể `cart_items`
*Mục đích: Chi tiết mặt hàng trong giỏ.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh dòng giỏ hàng |
| `cart_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `carts(id)` | Giỏ hàng cha |
| `variant_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `product_variants(id)` | Biến thể đặt mua |
| `quantity` | `INT` | Có | CHECK `quantity > 0` | Số lượng đặt mua |
| `created_at` | `TIMESTAMP` | Có | Mặc định: CURRENT_TIMESTAMP | Thời điểm thêm vào giỏ |
| `updated_at` | `TIMESTAMP` | Có | ON UPDATE CURRENT_TIMESTAMP | Thời điểm chỉnh sửa số lượng |
| **Ràng buộc tổ hợp** | | | `UNIQUE(cart_id, variant_id)` | Ngăn chặn trùng lặp cùng 1 biến thể trong giỏ |

#### Bảng 15: Thực thể `vouchers`
*Mục đích: Mã giảm giá khuyến mãi.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh voucher |
| `code` | `VARCHAR(50)` | Có | UNIQUE | Mã ưu đãi nhập khi thanh toán |
| `name` | `VARCHAR(100)` | Có | | Tên chương trình ưu đãi |
| `discount_type`| `ENUM('percentage','fixed_amount')` | Có | | Hình thức giảm: theo % hoặc trừ tiền cố định |
| `discount_value`| `DECIMAL(12,0)`| Có | CHECK `> 0` | Mức giảm (% hoặc số tiền VNĐ) |
| `min_order_value`| `DECIMAL(12,0)`| Có | CHECK `>= 0` | Giá trị đơn hàng tối thiểu |
| `max_discount_amount`| `DECIMAL(12,0)`| Không | NULL | Mức giảm tối đa (khi giảm theo %) |
| `start_date` | `DATETIME` | Có | | Thời điểm bắt đầu hiệu lực |
| `end_date` | `DATETIME` | Có | CHECK `end_date >= start_date` | Thời điểm kết thúc hiệu lực |
| `usage_limit` | `INT` | Có | CHECK `>= 0` | Giới hạn tổng số lượt dùng (0: vô hạn) |
| `used_count` | `INT` | Có | CHECK `<= usage_limit` | Số lượt đã sử dụng thực tế |
| `is_active` | `BOOLEAN` | Có | Mặc định: TRUE | Cờ kích hoạt khả dụng |
| `created_at` | `TIMESTAMP` | Có | Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo voucher |

#### Bảng 16: Thực thể `banners`
*Mục đích: Banner quảng bá slider trang chủ.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh banner |
| `title` | `VARCHAR(150)` | Có | | Tiêu đề banner |
| `image_url` | `VARCHAR(255)` | Có | | Đường dẫn ảnh banner |
| `link_url` | `VARCHAR(255)` | Không | NULL | Đường dẫn khi người dùng bấm vào banner |
| `display_order`| `INT` | Có | Mặc định: 0 | Thứ tự hiển thị trên slider |
| `is_active` | `BOOLEAN` | Có | Mặc định: TRUE | Trạng thái hiển thị |
| `created_at` | `TIMESTAMP` | Có | Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo banner |

#### Bảng 17: Thực thể `orders`
*Mục đích: Đơn hàng và Snapshot thanh toán COD.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh đơn hàng |
| `order_code` | `VARCHAR(50)` | Có | UNIQUE | Mã đơn hàng công khai (ORD-...) |
| `user_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `users(id)` (RESTRICT) | Khách hàng đặt mua |
| `recipient_name_snapshot` | `VARCHAR(100)` | Có | | Snapshot họ tên người nhận hàng lúc đặt |
| `recipient_phone_snapshot`| `VARCHAR(20)` | Có | | Snapshot số điện thoại người nhận lúc đặt |
| `delivery_address_snapshot`| `VARCHAR(500)`| Có | | Snapshot địa chỉ giao hàng đầy đủ lúc đặt |
| `subtotal` | `DECIMAL(12,0)` | Có | CHECK `>= 0` | Tạm tính tiền hàng (tổng line_total) |
| `discount_amount`| `DECIMAL(12,0)`| Có | CHECK `>= 0` | Số tiền được giảm giá qua voucher |
| `shipping_fee` | `DECIMAL(12,0)` | Có | CHECK `>= 0` | Phí vận chuyển COD |
| `total_amount` | `DECIMAL(12,0)` | Có | CHECK `>= 0` | Tổng tiền COD phải trả = subtotal - discount + ship |
| `voucher_id` | `INT` | Không | Khóa ngoại $\rightarrow$ `vouchers(id)` (SET NULL) | Tham chiếu voucher áp dụng |
| `voucher_code_snapshot` | `VARCHAR(50)` | Không | NULL | Snapshot mã voucher tại thời điểm đặt |
| `payment_method`| `VARCHAR(20)` | Có | Mặc định: 'COD' | Phương thức thanh toán tiền mặt khi nhận |
| `payment_status`| `ENUM('UNPAID','PAID')`| Có | Mặc định: 'UNPAID' | Trạng thái thu tiền COD |
| `order_status` | `ENUM(...)` | Có | Mặc định: 'PENDING' | Vòng đời: PENDING, CONFIRMED, PROCESSING, SHIPPING, COMPLETED, CANCELLED |
| `customer_note`| `VARCHAR(255)` | Không | NULL | Ghi chú yêu cầu của khách hàng |
| `admin_note` | `VARCHAR(255)` | Không | NULL | Ghi chú vận hành của quản trị viên |
| `created_at` | `TIMESTAMP` | Có | Mặc định: CURRENT_TIMESTAMP | Thời điểm đặt hàng thành công |
| `updated_at` | `TIMESTAMP` | Có | ON UPDATE CURRENT_TIMESTAMP | Thời điểm cập nhật đơn hàng |

#### Bảng 18: Thực thể `order_items`
*Mục đích: Chi tiết mặt hàng đơn hàng (Snapshot bất biến).*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh dòng sản phẩm đơn hàng |
| `order_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `orders(id)` (CASCADE) | Đơn hàng cha |
| `product_variant_id`| `INT` | Có | Khóa ngoại $\rightarrow$ `product_variants(id)` (RESTRICT) | Biến thể sản phẩm lúc đặt |
| `product_name_snapshot` | `VARCHAR(200)`| Có | | Snapshot tên sản phẩm lúc mua |
| `sku_snapshot` | `VARCHAR(100)` | Có | | Snapshot mã SKU lúc mua |
| `size_snapshot` | `VARCHAR(20)` | Có | | Snapshot kích cỡ lúc mua (ví dụ: 40) |
| `color_snapshot`| `VARCHAR(50)` | Có | | Snapshot màu sắc lúc mua (ví dụ: Đen) |
| `unit_price` | `DECIMAL(12,0)` | Có | CHECK `>= 0` | Snapshot đơn giá bán thực tế lúc mua |
| `quantity` | `INT` | Có | CHECK `quantity > 0` | Số lượng đặt mua |
| `line_total` | `DECIMAL(12,0)` | Có | CHECK `>= 0` | Thành tiền dòng = unit_price * quantity |
| **Ràng buộc tổ hợp** | | | `UNIQUE(order_id, product_variant_id)` | Mỗi biến thể chỉ có đúng 1 dòng trong cùng đơn |

#### Bảng 19: Thực thể `order_status_histories`
*Mục đích: Nhật ký lịch sử chuyển trạng thái đơn hàng.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | Có | Khóa chính, Auto Increment | Mã định danh bản ghi lịch sử |
| `order_id` | `INT` | Có | Khóa ngoại $\rightarrow$ `orders(id)` (CASCADE) | Đơn hàng cha |
| `changed_by` | `INT` | Có | Khóa ngoại $\rightarrow$ `users(id)` (RESTRICT) | Người kích hoạt (Khách hàng hoặc Admin) |
| `previous_status`| `VARCHAR(50)` | Không | NULL | Trạng thái trước khi chuyển đổi |
| `new_status` | `VARCHAR(50)` | Có | | Trạng thái mới sau khi chuyển |
| `note` | `VARCHAR(255)` | Không | NULL | Ghi chú lý do chuyển hoặc lý do hủy đơn |
| `created_at` | `TIMESTAMP` | Có | Mặc định: CURRENT_TIMESTAMP | Thời điểm chuyển đổi trạng thái |

---

### 2.5. Sơ đồ hoạt động (Activity Diagrams)

*(5 Sơ đồ hoạt động cốt lõi trực quan hóa luồng dữ liệu và điều kiện rẽ nhánh theo chuẩn UML).*

#### A. Activity Đăng ký & Đăng nhập (`ad-01-auth.puml`)
<div align="center">
  <img src="images/hinh_10_activity_auth.png" alt="Hình 10: Sơ đồ hoạt động - Quy trình Đăng ký & Đăng nhập" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 10: Sơ đồ hoạt động - Quy trình Đăng ký & Đăng nhập</strong></p>
</div>
* Khách nhập form đăng ký $\rightarrow$ Server kiểm tra dữ liệu bắt buộc $\rightarrow$ Kiểm tra email duy nhất $\rightarrow$ Băm mật khẩu bcrypt $\rightarrow$ Lưu bản ghi `users` với `status = 'active'`.
* Khi đăng nhập: Server kiểm tra email $\rightarrow$ Kiểm tra tài khoản không bị khóa (`status != 'locked'`) $\rightarrow$ So khớp `bcrypt.compare` $\rightarrow$ Khởi tạo session máy chủ (`req.session.user`) và cấp Session ID cookie.

#### B. Activity Mua sắm & Đặt hàng COD (`ad-02-checkout-cod.puml`)
<div align="center">
  <img src="images/hinh_11_activity_checkout.png" alt="Hình 11: Sơ đồ hoạt động - Mua hàng & Đặt hàng COD" style="max-width: 80%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 11: Sơ đồ hoạt động - Mua hàng & Đặt hàng COD</strong></p>
</div>
* Khách hàng chọn địa chỉ nhận hàng, nhập voucher $\rightarrow$ Bấm xác nhận đặt hàng COD.
* Server khởi tạo Database Transaction $\rightarrow$ Khóa bi quan kiểm tra kho `SELECT stock_quantity FROM product_variants WHERE id = :id FOR UPDATE`.
* Nếu tồn kho đủ: trừ `stock_quantity`, ghi nhật ký `inventory_transactions`, tạo bản ghi `orders` (trạng thái `PENDING`), tạo các dòng snapshot `order_items`, tăng `used_count` của voucher, xóa giỏ hàng $\rightarrow$ Commit Transaction. Nếu thiếu kho: Rollback và thông báo lỗi.

#### C. Activity Máy trạng thái đơn hàng (`ad-03-order-processing.puml`)
<div align="center">
  <img src="images/hinh_12_activity_order_processing.png" alt="Hình 12: Sơ đồ hoạt động - Máy trạng thái xử lý đơn hàng" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 12: Sơ đồ hoạt động - Máy trạng thái xử lý đơn hàng</strong></p>
</div>
* Vòng đời đơn hàng tuân thủ quy trình tuần tự:
  1. `PENDING`: Đơn mới tạo, tồn kho đã trừ.
  2. `CONFIRMED`: Admin liên hệ xác nhận size giày và địa chỉ.
  3. `PROCESSING`: Đơn đang lấy hàng trong kho và đóng gói.
  4. `SHIPPING`: Bàn giao đơn vị giao vận.
  5. `COMPLETED`: Giao hàng thành công và thu đủ tiền COD (ghi nhận doanh thu).
* Mỗi bước chuyển đổi đều kích hoạt ghi bản ghi vào `order_status_histories`.

#### D. Activity Hủy đơn hàng và Hoàn kho tự động (`ad-04-order-cancellation.puml`)
<div align="center">
  <img src="images/hinh_13_activity_order_cancel.png" alt="Hình 13: Sơ đồ hoạt động - Hủy đơn hàng và Hoàn kho tự động" style="max-width: 85%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 13: Sơ đồ hoạt động - Hủy đơn hàng và Hoàn kho tự động</strong></p>
</div>
* Khách hàng bấm hủy đơn khi `order_status == 'PENDING'` hoặc Admin bấm hủy đơn khi đơn ở `PENDING`/`CONFIRMED`.
* Server khởi tạo Transaction: Chuyển `order_status = 'CANCELLED'` $\rightarrow$ Lấy danh sách số lượng từ `order_items` $\rightarrow$ Cộng trả lại `stock_quantity` cho `product_variants` $\rightarrow$ Ghi nhật ký `inventory_transactions` với `reason = 'ORDER_CANCELLED_RESTOCK'` $\rightarrow$ Giảm `used_count` voucher (nếu có) $\rightarrow$ Commit.

#### E. Activity Admin kiểm kê và Điều chỉnh kho (`ad-05-inventory-adjustment.puml`)
<div align="center">
  <img src="images/hinh_14_activity_inventory.png" alt="Hình 14: Sơ đồ hoạt động - Admin kiểm kê và điều chỉnh kho" style="max-width: 80%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 14: Sơ đồ hoạt động - Admin kiểm kê và điều chỉnh kho</strong></p>
</div>
* Admin tra cứu biến thể cần điều chỉnh $\rightarrow$ Nhập số lượng mới và lý do (`ADMIN_ADJUSTMENT`, `IMPORT_PURCHASE`, `DEFECT_DAMAGE`) $\rightarrow$ Server cập nhật `stock_quantity` và lưu vết vào `inventory_transactions`.

---

### 2.6. Thiết kế giao diện và đặc tả màn hình (Wireframe & UI Specifications)

*(Trình bày theo đúng cấu trúc mẫu báo cáo tốt nghiệp: Hình vẽ khung Wireframe layout $\rightarrow$ Bảng đặc tả component gồm: Mục, Loại component, Mô tả).*

#### Giao diện 1: Trang chủ (Home Page)
<div align="center">
  <img src="images/hinh_17_giao_dien_trang_chu.png" alt="Hình 17: Giao diện Trang chủ (Home Page)" style="max-width: 65%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 17: Giao diện Trang chủ (Home Page)</strong></p>
</div>
* **Truy cập:** `Guest`, `Customer`
* **Mục đích:** Cửa sổ giới thiệu thương hiệu VAMOS, banner sự kiện, danh mục nổi bật và sản phẩm mới nhất.
* **Bảng đặc tả giao diện Trang chủ:**

| Mục | Loại Component | Mô tả và tương tác |
| :--- | :--- | :--- |
| `Header Bar` | Navigation Container | Logo VAMOS, thanh tìm kiếm nhanh, menu danh mục, icon giỏ hàng kèm số lượng (badge), icon đăng nhập/tài khoản. |
| `Hero Slider` | Image Carousel | Hiển thị các banner quảng bá sự kiện lấy từ bảng `banners`. |
| `Category Grid` | Grid Container | Thẻ đại diện danh mục (Sneaker, Thể thao, Sandal, Dép); bấm vào để chuyển đến trang danh mục tương ứng. |
| `Product List` | Product Card Grid | Hiển thị danh sách sản phẩm mới nhất (ảnh đại diện, nhãn sale, tên sản phẩm, giá bán, nút xem chi tiết). |
| `Footer` | Information Block | Địa chỉ showroom VAMOS, thông tin liên hệ, chính sách đổi trả, liên kết mạng xã hội. |

#### Giao diện 2: Cửa hàng & Bộ lọc đa tiêu chí (Shop & Filter)
<div align="center">
  <img src="images/hinh_18_giao_dien_cua_hang.png" alt="Hình 18: Giao diện Cửa hàng & Bộ lọc đa tiêu chí" style="max-width: 65%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 18: Giao diện Cửa hàng & Bộ lọc đa tiêu chí</strong></p>
</div>
* **Truy cập:** `Guest`, `Customer`
* **Mục đích:** Khám phá sản phẩm với bộ lọc bên trái (Sidebar Filter).
* **Bảng đặc tả giao diện Cửa hàng:**

| Mục | Loại Component | Mô tả và tương tác |
| :--- | :--- | :--- |
| `Gender Filter` | Checkbox Group | Lọc sản phẩm theo giới tính (`Nam`, `Nữ`, `Unisex`). |
| `Price Range` | Input Textbox | Lọc theo khoảng giá tối thiểu và tối đa (VNĐ). |
| `Size Selector` | Button Pill Group | Lọc các sản phẩm có biến thể kích cỡ còn hàng (`Size 36 - 45`). |
| `Color Filter` | Color Palette Box | Lọc theo màu sắc trực quan (Đen, Trắng, Đỏ,...). |
| `Sort Dropdown` | Select Box | Sắp xếp: Giá tăng dần, Giá giảm dần, Mới nhất, Tên A-Z. |
| `Product Grid` | Dynamic Grid | Hiển thị danh sách sản phẩm thỏa mãn điều kiện lọc kèm phân trang (12 sản phẩm/trang). |

#### Giao diện 3: Chi tiết sản phẩm & Chọn Size/Màu (Product Detail)
<div align="center">
  <img src="images/hinh_19_giao_dien_chi_tiet_san_pham.png" alt="Hình 19: Giao diện Chi tiết sản phẩm & Chọn Size/Màu" style="max-width: 65%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 19: Giao diện Chi tiết sản phẩm & Chọn Size/Màu</strong></p>
</div>
* **Truy cập:** `Guest`, `Customer`
* **Mục đích:** Xem thông số kỹ thuật, bộ ảnh chi tiết và chọn biến thể thêm giỏ/mua ngay.
* **Bảng đặc tả giao diện Chi tiết sản phẩm:**

| Mục | Loại Component | Mô tả và tương tác |
| :--- | :--- | :--- |
| `Image Gallery` | Thumbnail + Main View | Xem ảnh lớn và chuyển đổi các góc chụp chi tiết. |
| `Color Picker` | Radio Button Pill | Chọn màu sắc mong muốn. |
| `Size Selector` | Radio Button Box | Chọn kích cỡ giày. Tự động làm mờ (disable) các size đã hết hàng (`stock == 0`). |
| `Quantity Input` | Stepper Number Input | Tăng/giảm số lượng mua (từ 1 đến số lượng tồn kho khả dụng). |
| `Add To Cart` | Button Primary | Thêm biến thể vào giỏ hàng. |
| `Buy Now` | Button Secondary | Chuyển hướng thẳng đến màn hình thanh toán COD. |

#### Giao diện 4: Giỏ hàng trực tuyến (Shopping Cart)
<div align="center">
  <img src="images/hinh_20_giao_dien_gio_hang.png" alt="Hình 20: Giao diện Giỏ hàng trực tuyến" style="max-width: 80%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 20: Giao diện Giỏ hàng trực tuyến</strong></p>
</div>
* **Truy cập:** `Customer`
* **Mục đích:** Quản lý danh sách sản phẩm dự định mua.
* **Bảng đặc tả giao diện Giỏ hàng:**

| Mục | Loại Component | Mô tả và tương tác |
| :--- | :--- | :--- |
| `Cart Item Row` | Table Row Data | Hiển thị ảnh, tên sản phẩm, size, màu, đơn giá, số lượng và thành tiền. |
| `Quantity Stepper`| Dynamic Stepper | Tăng giảm số lượng; tự động gửi Ajax cập nhật `cart_items` và tính lại tạm tính. |
| `Remove Button` | Icon Button | Xóa một dòng mặt hàng khỏi giỏ hàng sau khi xác nhận. |
| `Checkout Button`| Primary Action Button | Chuyển sang màn hình Đặt hàng COD. |

#### Giao diện 5: Đặt hàng thanh toán COD (Checkout)
<div align="center">
  <img src="images/hinh_21_giao_dien_dat_hang_cod.png" alt="Hình 21: Giao diện Đặt hàng COD (Checkout)" style="max-width: 80%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 21: Giao diện Đặt hàng COD (Checkout)</strong></p>
</div>
* **Truy cập:** `Customer` (đã đăng nhập và giỏ hàng có sản phẩm)
* **Mục đích:** Xác nhận thông tin giao nhận và hoàn tất đơn hàng thanh toán tiền mặt.
* **Bảng đặc tả giao diện Đặt hàng COD:**

| Mục | Loại Component | Mô tả và tương tác |
| :--- | :--- | :--- |
| `Address Selector`| Radio Form | Chọn địa chỉ từ sổ địa chỉ có sẵn hoặc nhập địa chỉ giao nhận mới. |
| `Voucher Input` | Textbox + Button | Nhập mã voucher ưu đãi; hệ thống kiểm tra và trừ tiền giảm trực tiếp vào tổng đơn. |
| `Payment Method` | Radio Selection | Mặc định cố định `COD` (Thanh toán tiền mặt khi nhận hàng). |
| `Order Note` | Textarea | Nhập ghi chú giao nhận hàng của khách. |
| `Submit Button` | Primary Action Button | Kích hoạt Database Transaction tạo đơn hàng, trừ tồn kho và làm rỗng giỏ. |


#### Giao diện 6: Đăng ký / Đăng nhập tài khoản
<div align="center">
  <img src="images/hinh_22_giao_dien_dang_nhap.png" alt="Hình 22: Giao diện Đăng ký / Đăng nhập tài khoản" style="max-width: 80%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 22: Giao diện Đăng ký / Đăng nhập tài khoản</strong></p>
</div>

* **Truy cập:** `Guest`
* **Mục đích:** Cung cấp biểu mẫu xác thực tài khoản an toàn với mã hóa mật khẩu bcrypt và phiên đăng nhập Session.
* **Bảng đặc tả giao diện Đăng ký / Đăng nhập:**

| Mục | Loại Component | Mô tả và tương tác |
| :--- | :--- | :--- |
| `Form Toggle` | Tab Button | Chuyển đổi linh hoạt giữa giao diện Đăng nhập và Đăng ký tài khoản mới. |
| `Email Input` | Email Field | Nhập địa chỉ email hợp lệ (kiểm tra định dạng Regex trên server). |
| `Password Input` | Password Field | Nhập mật khẩu bí mật (tối thiểu 6 ký tự, ẩn ký tự khi nhập). |
| `Remember Me` | Checkbox | Duy trì phiên đăng nhập lâu dài thông qua cookie an toàn (`httpOnly`). |
| `Submit Button` | Primary Button | Gửi request xác thực về AuthService, cấp session và chuyển hướng về trang chủ. |

---

#### Giao diện 7: Lịch sử và chi tiết đơn hàng của khách
<div align="center">
  <img src="images/hinh_23_giao_dien_lich_su_don_hang.png" alt="Hình 23: Giao diện Lịch sử đơn hàng của khách" style="max-width: 80%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 23: Giao diện Lịch sử đơn hàng của khách</strong></p>
</div>

* **Truy cập:** `Customer` (đã đăng nhập)
* **Mục đích:** Cho phép khách hàng tra cứu tiến độ xử lý đơn hàng, xem snapshot sản phẩm và tự hủy đơn khi ở trạng thái `PENDING`.
* **Bảng đặc tả giao diện Lịch sử đơn hàng:**

| Mục | Loại Component | Mô tả và tương tác |
| :--- | :--- | :--- |
| `Order Code` | Text / Link | Mã định danh đơn hàng (VD: `ORD-20261110-001`), bấm vào xem chi tiết toàn bộ đơn. |
| `Status Badge` | Colored Tag | Hiển thị trạng thái đơn hàng (`PENDING` vàng, `CONFIRMED` xanh dương, `SHIPPING` tím, `COMPLETED` xanh lá, `CANCELLED` xám). |
| `Product Items` | List Group | Hiển thị tên giày, hình ảnh snapshot, size, màu sắc, đơn giá và số lượng đặt. |
| `Total Summary` | Money Summary | Tạm tính tiền hàng, phí giao hàng, mức voucher giảm giá và tổng tiền phải trả COD. |
| `Cancel Button` | Secondary Button | Nút bấm hủy đơn; chỉ hiển thị khi đơn ở trạng thái `PENDING`, tự động hoàn kho. |

---

#### Giao diện 8: Admin Dashboard tổng quan
<div align="center">
  <img src="images/hinh_24_giao_dien_admin_dashboard.png" alt="Hình 24: Giao diện Admin Dashboard tổng quan" style="max-width: 80%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 24: Giao diện Admin Dashboard tổng quan</strong></p>
</div>

* **Truy cập:** `Admin`
* **Mục đích:** Bảng điều khiển trung tâm giúp quản trị viên theo dõi nhanh doanh thu thực tế, số lượng đơn hàng cần xử lý và cảnh báo tồn kho.
* **Bảng đặc tả giao diện Admin Dashboard:**

| Mục | Loại Component | Mô tả và tương tác |
| :--- | :--- | :--- |
| `Metric Cards` | Stat Box | Thống kê tổng doanh thu (chỉ tính đơn `COMPLETED`), tổng số đơn, số khách hàng mới. |
| `Pending Alert` | Notification Box | Số lượng đơn hàng mới đang ở trạng thái `PENDING` cần được gọi điện xác nhận ngay. |
| `Low Stock Warning` | Warning Table | Danh sách các biến thể giày (SKU) có tồn kho nhỏ hơn mức cảnh báo tối thiểu (dưới 5 đôi). |
| `Quick Navigation` | Sidebar Menu | Liên kết nhanh đến các phân hệ: Sản phẩm, Đơn hàng, Kho hàng, Khuyến mãi. |

---

#### Giao diện 9: Admin Quản lý sản phẩm & Biến thể
<div align="center">
  <img src="images/hinh_25_giao_dien_admin_san_pham.png" alt="Hình 25: Giao diện Admin Quản lý sản phẩm & Biến thể" style="max-width: 80%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 25: Giao diện Admin Quản lý sản phẩm & Biến thể</strong></p>
</div>

* **Truy cập:** `Admin`
* **Mục đích:** Quản lý danh mục giày dép, thêm mới sản phẩm và cấu hình từng tổ hợp biến thể (Size - Màu sắc - Tồn kho - SKU).
* **Bảng đặc tả giao diện Quản lý sản phẩm:**

| Mục | Loại Component | Mô tả và tương tác |
| :--- | :--- | :--- |
| `Product Table` | Data Table | Danh sách sản phẩm gồm mã ID, ảnh đại diện chính, tên giày, thương hiệu, danh mục, giá cơ sở. |
| `Variant Matrix` | Matrix Table | Bảng quản lý chi tiết từng biến thể (Size, Color, Mã SKU, Giá phụ thu `price_adjustment`, Tồn kho `stock_quantity`). |
| `Search & Filter` | Filter Bar | Lọc danh sách sản phẩm theo Thương hiệu (Nike, Adidas, Puma...), Danh mục hoặc trạng thái hoạt động. |
| `Action Controls` | Action Buttons | Nút Chỉnh sửa thông tin, Quản lý bộ sưu tập ảnh và Bật/Tắt trạng thái hoạt động sản phẩm. |

---

#### Giao diện 10: Admin Vận hành đơn hàng & Chuyển trạng thái
<div align="center">
  <img src="images/hinh_26_giao_dien_admin_don_hang.png" alt="Hình 26: Giao diện Admin Vận hành đơn hàng" style="max-width: 65%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 26: Giao diện Admin Vận hành đơn hàng</strong></p>
</div>

* **Truy cập:** `Admin`
* **Mục đích:** Xử lý toàn bộ vòng đời đơn hàng theo đúng máy trạng thái (PENDING -> CONFIRMED -> PROCESSING -> SHIPPING -> COMPLETED), in phiếu giao hàng và theo dõi dòng tiền COD.
* **Bảng đặc tả giao diện Vận hành đơn hàng:**

| Mục | Loại Component | Mô tả và tương tác |
| :--- | :--- | :--- |
| `Status Tabs` | Tab Navigation | Lọc đơn theo từng bước xử lý: Chờ xác nhận, Đã xác nhận, Đang đóng gói, Đang giao, Đã giao, Đã hủy. |
| `Order Details` | Modal / Drawer | Xem chi tiết địa chỉ giao hàng, số điện thoại, ghi chú của khách và lịch sử thay đổi trạng thái (`order_status_histories`). |
| `Transition Button` | Status Action Button | Nút bấm chuyển trạng thái kế tiếp hợp lệ; tự động lưu vết nhân sự thao tác và thời gian. |
| `Cancel & Restock` | Danger Action | Nút hủy đơn khẩn cấp (kèm nhập lý do); kích hoạt Transaction tự động hoàn tồn kho về biến thể ban đầu. |
