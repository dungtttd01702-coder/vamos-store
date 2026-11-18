# THIẾT KẾ KIẾN TRÚC PHÂN TẦNG (LAYERED ARCHITECTURE)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE

> **Tiêu chuẩn học thuật:** Đồ án Tốt nghiệp / Assignment Kỹ nghệ Phần mềm FPT Polytechnic.  
> **Nguyên tắc cốt lõi:** Mô hình 6 tầng phân lập trách nhiệm (Separation of Concerns), giảm độ phụ thuộc ghép nối (Low Coupling) và tăng cường khả năng bảo trì, mở rộng (High Cohesion).  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | Git HEAD `8135e19`.

---

## 1. MỤC TIÊU VÀ PHẠM VI TÀI LIỆU

Tài liệu này đi sâu vào việc mổ xẻ chi tiết từng tầng logic trong kiến trúc phần mềm VAMOS STORE, chỉ rõ trách nhiệm kỹ thuật, phạm vi quyền hạn và cách thức tương tác giữa các tầng: từ giao diện hiển thị phía client, tầng trung gian xử lý yêu cầu, tầng điều khiển nghiệp vụ, tầng dịch vụ, tầng truy xuất dữ liệu cho đến hệ quản trị cơ sở dữ liệu Microsoft SQL Server.

---

## 2. SƠ ĐỒ KIẾN TRÚC PHÂN TẦNG (LAYERED ARCHITECTURE DIAGRAM)

![Sơ đồ kiến trúc phân tầng VAMOS STORE](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/LAYERED_ARCHITECTURE.png)
*(Mã nguồn sơ đồ: [LAYERED_ARCHITECTURE.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/LAYERED_ARCHITECTURE.puml))*

---

## 3. PHÂN TÍCH CHI TIẾT 6 TẦNG KIẾN TRÚC

### TẦNG 1: TẦNG TRÌNH DIỄN (PRESENTATION LAYER)

Tầng trình diễn chịu trách nhiệm tương tác trực tiếp với người dùng cuối, thu thập dữ liệu nhập liệu và hiển thị kết quả xử lý.

#### 1.1. Động cơ Giao diện Máy chủ (Pug 3.0.3 Template Engine)
- **Cấu trúc thư mục:** Được tổ chức quy chuẩn tại `src/views/`:
  - `layouts/`: Chứa các khung layout gốc:
    - `main.pug`: Khung hiển thị chính dành cho khách hàng (header responsive, thanh tìm kiếm live, giỏ hàng, thông tin chân trang).
    - `admin.pug`: Khung giao diện quản trị chuyên biệt (thanh sidebar điều hướng, thanh trạng thái quản trị viên, thông báo hệ thống).
  - `partials/`: Chứa các khối giao diện tái sử dụng: `header.pug`, `footer.pug`, `admin-sidebar.pug`, `toast.pug`.
  - `pages/`: Các trang nghiệp vụ cụ thể chia theo module:
    - `home.pug`: Trang chủ thương hiệu, banner slider, sản phẩm mới, flash sale.
    - `products/`: Danh sách sản phẩm (`index.pug`) và chi tiết sản phẩm (`detail.pug`).
    - `cart/`: Xem và quản lý giỏ hàng (`index.pug`).
    - `checkout/`: Biểu mẫu thanh toán COD (`index.pug`) và thông báo thành công (`success.pug`).
    - `account/`: Hồ sơ cá nhân (`profile.pug`), sổ địa chỉ (`addresses.pug`), lịch sử đơn hàng (`orders.pug`, `order-detail.pug`).
    - `admin/`: Bảng điều khiển (`dashboard.pug`), quản lý đơn (`orders.pug`, `order-detail.pug`), quản lý kho (`inventory.pug`), quản lý sản phẩm (`products.pug`, `product-form.pug`), mã giảm giá (`vouchers.pug`), danh mục/thương hiệu/banner (`categories.pug`), khách hàng (`customers.pug`).
    - `errors/`: Trang lỗi tùy biến `404.pug` và `500.pug`.

#### 1.2. Định kiểu và Kịch bản Phía Máy khách (Frontend CSS & JavaScript)
- **Tailwind CSS 3.4.17:** Được biên dịch tự động qua PostCSS từ `src/public/css/input.css` ra `src/public/css/style.css`, tối ưu hóa dung lượng (minified) và áp dụng triệt để hệ thống thiết kế nhất quán (Design System: phông chữ Sans-serif, bảng màu Slate, Red Accent, bo góc chuẩn, bóng đổ mượt mà).
- **Vanilla JavaScript (`src/public/js/main.js`):**
  - **Live Search AJAX:** Lắng nghe sự kiện `input` trên thanh tìm kiếm, gửi yêu cầu `fetch('/api/products/search?q=...')`, bóc tách JSON và cập nhật trực tiếp danh sách gợi ý kèm ảnh đại diện và tồn kho.
  - **Wishlist 1-Click Toggle:** Lắng nghe cú nhấp vào biểu tượng Trái tim, gửi `POST /api/wishlist/toggle`, tự động đổi màu biểu tượng (Đỏ = Yêu thích, Trắng = Bỏ lưu) và cập nhật số lượng yêu thích trên header badge mà không tải lại trang.
  - **Dynamic Variant Picker:** Lắng nghe thay đổi Kích cỡ (Size) và Màu sắc (Color) trên trang chi tiết sản phẩm, đối chiếu ma trận biến thể khả dụng, cập nhật tồn kho tức thì và kích hoạt/vô hiệu hóa nút "Thêm vào giỏ".
  - **Toast Notifications:** Hàm `window.showToast(message, type)` hiển thị thông báo popup nổi góc dưới màn hình cho các phản hồi thêm giỏ hàng, sao chép voucher, cập nhật yêu thích.

---

### TẦNG 2: TẦNG ĐIỀU TUYẾN VÀ TRUNG GIAN (ROUTING & MIDDLEWARE LAYER)

Tầng trung gian đóng vai trò "người gác cổng" (Gatekeeper), xử lý các mối quan tâm xuyên suốt (Cross-cutting Concerns) như bảo mật, kiểm soát phiên, xác thực và bảo vệ toàn vẹn dữ liệu trước khi chuyển giao cho các bộ điều khiển.

#### 2.1. Chuỗi Pipeline Middleware Tuần tự (Sequential Middleware Pipeline)
Khi một HTTP request đi vào `src/app.js`, nó được xử lý tuần tự qua 8 bước:
1. **Security Headers (`app.use`):** Bổ sung các tiêu đề chống tấn công web chuẩn OWASP (`nosniff`, `SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy`).
2. **CORS & Body Parsers:** Giải mã payload JSON (`express.json()`) và form URL-encoded (`express.urlencoded({ extended: true })`).
3. **Session Middleware (`express-session`):**
   - Định danh phiên: Cookie `vamos_sid`.
   - Cấu hình an toàn: `httpOnly: true` (ngăn JavaScript độc hại đọc cookie qua XSS), `sameSite: 'lax'` (chống tấn công CSRF điều hướng), thời hạn 7 ngày.
4. **Context & State Middleware (`sessionContextMiddleware`):**
   - Đọc dữ liệu từ `req.session.user` và gắn vào `res.locals.user`.
   - Đồng bộ số lượng mặt hàng trong giỏ (`res.locals.cartCount`).
   - Cung cấp hàm hiển thị thông báo flash tạm thời (`req.flash`).
5. **Đa ngôn ngữ (`i18nMiddleware`):**
   - Đọc ngôn ngữ người dùng từ cookie `vamos_locale` (mặc định: `vi`, tùy chọn: `en`).
   - Gắn hàm dịch thuật `t(key)` vào template context để dịch các nhãn tiêu đề, nút bấm.
6. **Bảo vệ Chống giả mạo Yêu cầu CSRF (`csrfMiddleware`):**
   - Sinh token ngẫu nhiên `crypto.randomBytes(24).toString('hex')` lưu trong session.
   - Gắn `res.locals.csrfToken` vào tất cả biểu mẫu Pug dưới dạng `<input type="hidden" name="_csrf" value=csrfToken>`.
   - Với các phương thức thay đổi trạng thái (`POST`, `PUT`, `DELETE`, `PATCH`): So khớp mã gửi lên (`req.body._csrf` hoặc header `x-csrf-token`) với mã lưu trong session. Nếu không khớp $\rightarrow$ Trả về mã lỗi HTTP 403 Forbidden.
7. **Bảo vệ Phân quyền (Route Guards):**
   - `requireAuth`: Kiểm tra sự tồn tại của `req.session.user`. Nếu chưa đăng nhập $\rightarrow$ chuyển hướng về `/auth/login?returnUrl=...`.
   - `requireCustomer`: Yêu cầu đăng nhập và vai trò không phải ADMIN. Nếu là Guest truy cập API $\rightarrow$ trả về JSON HTTP 401; nếu là Admin truy cập $\rightarrow$ chặn HTTP 403 hoặc chuyển hướng về `/admin/dashboard`.
   - `requireAdmin`: Kiểm tra `req.session.user.role === 'ADMIN'` và trạng thái tài khoản `active`. Nếu không hợp lệ $\rightarrow$ từ chối truy cập HTTP 403.
   - `requireGuest`: Chặn người dùng đã đăng nhập truy cập lại trang login/register.
8. **Xử lý Lỗi tập trung (`error.middleware.js`):**
   - `notFoundHandler`: Bắt tất cả các URL không tồn tại, trả về HTTP 404 kèm giao diện `pages/errors/404.pug`.
   - `errorHandler`: Bắt mọi lỗi runtime chưa xử lý trong ứng dụng, log lỗi ra console và render `pages/errors/500.pug`.

#### 2.2. Đăng ký Điều tuyến Phân hệ (Modular Route Registration)
Toàn bộ đường dẫn ứng dụng được cấu hình module hóa tại `src/routes/`:
- `home.routes.js`: Định tuyến trang chủ `/` và chuyển đổi ngôn ngữ `/lang/:lang`.
- `product.routes.js`: Định tuyến danh mục `/products`, xem chi tiết `/products/:slug`, tìm kiếm thời gian thực `/products/live-search`.
- `auth.routes.js`: Định tuyến `/auth/login`, `/auth/register`, `/auth/logout`.
- `cart.routes.js`: Định tuyến giỏ hàng `/cart`, `/cart/add`, `/cart/update/:id`, `/cart/remove/:id`, `/cart/clear`.
- `checkout.routes.js`: Định tuyến đặt hàng COD `/checkout` (GET nạp form thanh toán, POST xử lý đặt hàng), `/checkout/success/:orderId`.
- `account.routes.js`: Định tuyến hồ sơ cá nhân `/account/profile`, sổ địa chỉ `/account/addresses`, lịch sử đơn hàng `/account/orders`, chi tiết đơn `/account/orders/:id`, hủy đơn `/account/orders/:id/cancel`.
- `admin.routes.js`: Định tuyến toàn bộ phân hệ quản trị `/admin/*` (dashboard, orders, products, inventory, vouchers, customers, categories, brands, banners).
- `wishlist.routes.js`: Định tuyến API danh sách yêu thích `/api/wishlist/*` (`/items`, `/toggle`, `/migrate`).

---

### TẦNG 3: TẦNG ĐIỀU KHIỂN NGHIỆP VỤ (CONTROLLER LAYER)

Tầng điều khiển đóng vai trò cầu nối trung gian giữa giao thức HTTP và các dịch vụ xử lý nghiệp vụ:
- **Trách nhiệm chính:**
  1. Tiếp nhận HTTP Request (`req.params`, `req.query`, `req.body`, `req.session`).
  2. Kiểm tra tính hợp lệ dữ liệu cơ bản ở mức controller bằng thư viện tiện ích `src/utils/validator.js` (kiểm tra định dạng email regex, độ dài số điện thoại 10 số mạng VN, độ dài tên, mật khẩu tối thiểu 6 ký tự).
  3. Ủy quyền xử lý nghiệp vụ cho các Service hoặc Repository tương ứng.
  4. Quyết định định dạng phản hồi: Render trang HTML qua động cơ Pug (`res.render`) hoặc trả về dữ liệu cấu trúc JSON (`res.json`) cho các cuộc gọi AJAX.
  5. Bắt các ngoại lệ kỹ thuật và chuyển tiếp cho Middleware xử lý lỗi (`next(error)`).
- **Danh sách 8 Controller trong hệ thống:**
  - `home.controller.js`
  - `auth.controller.js`
  - `product.controller.js`
  - `cart.controller.js`
  - `wishlist.controller.js`
  - `checkout.controller.js`
  - `account.controller.js`
  - `admin.controller.js`

---

### TẦNG 4: TẦNG DỊCH VỤ NGHIỆP VỤ (SERVICE LAYER)

Tầng dịch vụ là "trái tim" của kiến trúc, nơi chứa toàn bộ logic nghiệp vụ kinh doanh của VAMOS STORE. Tầng dịch vụ hoàn toàn độc lập với giao thức HTTP (không truy cập trực tiếp `req` hay `res`), cho phép tái sử dụng tối đa và bảo vệ tính toàn vẹn của hệ thống:

#### 4.1. Dịch vụ Đơn hàng & Kho (`src/services/order.service.js`)
- **Quản lý quy trình Đặt hàng COD (`createCodOrder`):**
  - Mở giao dịch CSDL nguyên tử: `const transaction = new sql.Transaction(pool); await transaction.begin();`.
  - Khóa giỏ hàng CSDL: `carts WITH (UPDLOCK, ROWLOCK)` và `cart_items WITH (UPDLOCK, HOLDLOCK)`.
  - Tính phí giao hàng: Miễn phí nếu giá trị hàng $\ge 500,000$ VNĐ; dưới 500,000 VNĐ tính phí cố định 30,000 VNĐ.
  - Kiểm tra và khóa mã giảm giá: Ràng buộc thời hạn, đơn tối thiểu, giới hạn sử dụng toàn hệ thống và ràng buộc **mỗi tài khoản khách hàng chỉ được dùng 1 lần duy nhất** qua bảng `voucher_usages`.
  - Khóa từng biến thể giày bằng chỉ dẫn `WITH (UPDLOCK, ROWLOCK)`, kiểm tra hạn mức bán lẻ (tối thiểu 1, tối đa 10 đôi), kiểm tra tồn khả dụng, trừ tồn kho và ghi log vào `inventory_transactions` (`change_quantity = -qty`).
  - Lưu thông tin đơn hàng `orders` kèm snapshot thông tin giao hàng.
  - Lưu chi tiết món `order_items` kèm snapshot tên sản phẩm, SKU, size, màu, đơn giá tại thời điểm đặt.
  - Ghi lịch sử trạng thái ban đầu `order_status_histories` (`new_status = 'PENDING'`).
  - Xóa sạch giỏ hàng `DELETE FROM cart_items WHERE cart_id = @cartId`.
  - Commit giao dịch hoặc Rollback toàn phần nếu có bất kỳ lỗi nào.
- **Quản lý Khách hàng Hủy đơn (`cancelOrder`):**
  - Khóa đơn hàng với `WITH (UPDLOCK, ROWLOCK)` kèm điều kiện sở hữu `WHERE id = @orderId AND user_id = @userId`.
  - Chỉ cho phép hủy khi `order_status === 'PENDING'`, chặn hủy lặp lại nếu đơn đã `CANCELLED`.
  - Hoàn trả số lượng tồn kho từng mặt hàng vào `product_variants` và ghi log `inventory_transactions` (`change_quantity = +qty`).
  - Giải phóng mã giảm giá trong `voucher_usages` và giảm `used_count` để khách hàng được dùng lại mã.
- **Quản trị viên Cập nhật Trạng thái (`updateOrderStatusByAdmin`):**
  - Kiểm tra và thực thi máy trạng thái tuần tự (`VALID_TRANSITIONS`):
    `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`.
  - Khi Admin chọn `COMPLETED`: Tự động cập nhật `payment_status = 'PAID'` (ghi nhận đã thu tiền COD). Tuyệt đối không trừ tồn kho lần 2.
  - Khi Admin chọn `CANCELLED`: Kích hoạt cơ chế hoàn kho và giải phóng voucher.

#### 4.2. Dịch vụ Sản phẩm (`src/services/product.service.js`)
- Điều phối các tiêu chí tìm kiếm và lọc nâng cao: lọc theo slug danh mục, giới tính (MEN / WOMEN / UNISEX), kích cỡ giày, cờ khuyến mãi, khoảng giá (`minPrice` - `maxPrice`), sắp xếp giá và phân trang.
- Ủy quyền truy vấn dữ liệu cho `product.repository.js`.

#### 4.3. Dịch vụ Danh sách Yêu thích (`src/services/wishlist.service.js`)
- Cung cấp hàm `toggleItem(userId, productId)`: Kiểm tra nếu sản phẩm đã có thì xóa (`DELETE`), nếu chưa có thì thêm (`INSERT`).
- Định dạng dữ liệu hiển thị danh sách yêu thích, hỗ trợ đồng bộ dữ liệu cũ (`migrateLegacyWishlist`).

---

### TẦNG 5: TẦNG TRUY XUẤT DỮ LIỆU & REPOSITORY (DATA ACCESS LAYER)

Tầng truy xuất dữ liệu chịu trách nhiệm chuyển đổi giữa các đối tượng dữ liệu trong bộ nhớ Node.js và các bảng cơ sở dữ liệu quan hệ trong SQL Server:

#### 5.1. Các Kho Lưu trữ Chuyên biệt (Repositories)
- `src/models/repositories/product.repository.js`: Chứa các hàm truy vấn SQL chuyên sâu: `findAll()`, `findBySlug()`, `getCategories()`, `getBanners()`, `getLatestProducts()`, `getFlashSaleProducts()`, `searchLive()`.
- `src/models/repositories/wishlist.repository.js`: Chứa các hàm thao tác bảng `wishlist_items`: `findByUserId()`, `findProductById()`, `isInWishlist()`, `addItem()`, `removeItem()`, `clearWishlist()`, `countByUserId()`.

#### 5.2. Mô-đun Quản lý Kết nối CSDL (`src/config/database.js`)
- **Quản lý Connection Pool:** Sử dụng lớp `sql.ConnectionPool` của thư viện `mssql`, khởi tạo một vùng kết nối duy nhất (Singleton Pool) chia sẻ cho toàn ứng dụng:
  - `pool.max = 10`: Tối đa 10 kết nối đồng thời.
  - `pool.min = 0`: Tối thiểu 0 kết nối khi nhàn rỗi.
  - `pool.idleTimeoutMillis = 30000`: Tự động thu hồi kết nối sau 30 giây không hoạt động.
- **Hàm `query(queryStr, params)`:** Tự động gắn các tham số đầu vào vào đối tượng `request.input()`, đảm bảo mọi câu lệnh SQL gửi đến SQL Server đều là **Prepared Statements**, loại bỏ hoàn toàn nguy cơ tấn công SQL Injection.
- **Hàm `withTransaction(callback)`:** Tự động bắt đầu `transaction.begin()`, thực thi callback và `transaction.commit()`, hoặc tự động `transaction.rollback()` nếu xảy ra lỗi.

---

### TẦNG 6: TẦNG CƠ SỞ DỮ LIỆU (DATABASE LAYER)

Cơ sở dữ liệu Microsoft SQL Server lưu trữ toàn bộ thực thể kinh doanh của VAMOS STORE được tổ chức thành **21 bảng** phân chia theo 5 nhóm module dữ liệu:
1. **Phân hệ Người dùng & Phân quyền:** `users`, `roles`, `addresses`.
2. **Phân hệ Danh mục & Sản phẩm:** `products`, `categories`, `brands`, `product_variants`, `sizes`, `colors`, `product_images`.
3. **Phân hệ Đơn hàng & Thanh toán:** `orders`, `order_items`, `order_status_histories`.
4. **Phân hệ Mua sắm & Khuyến mãi:** `carts`, `cart_items`, `wishlist_items`, `vouchers`, `voucher_usages`.
5. **Phân hệ Kiểm toán & Vận hành:** `inventory_transactions`, `banners`, `system_logs`, `password_reset_tokens`.

Các cơ chế toàn vẹn dữ liệu được thực thi nghiêm ngặt tại tầng CSDL:
- **B-Tree Clustered Primary Keys:** Tối ưu hóa truy vấn tìm kiếm theo khóa chính và chèn dữ liệu tuần tự.
- **Filtered Unique Indexes:** Đảm bảo tính duy nhất có điều kiện (`uq_user_default_address`, `uq_product_primary_image`).
- **Check Constraints:** Ngăn chặn việc ghi các giá trị trạng thái hoặc số tiền sai lệch.
- **Foreign Keys:** Bảo đảm tính toàn vẹn tham chiếu giữa các thực thể cha-con.

---

## 4. PHÂN ĐỊNH HỌC THUẬT: MONOLITHIC, LOGICAL LAYERS VÀ PHYSICAL SOURCE CODE STRUCTURE

Trong báo cáo đồ án phần mềm chuẩn FPT Polytechnic, sinh viên cần phân định rõ ràng giữa ba khái niệm kiến trúc:

### 4.1. Kiến trúc Triển khai Đơn khối (Monolithic Architecture)
Toàn bộ hệ thống VAMOS STORE (Presentation, Business Logic, Data Access) được đóng gói và vận hành trong **một tiến trình Node.js duy nhất** (`server.js`), lắng nghe trên cổng 3000 và kết nối vào một CSDL Microsoft SQL Server tập trung.
- **Ưu điểm:** Triển khai đơn giản, không phát sinh chi phí truyền thông mạng nội bộ, bảo đảm tính toàn vẹn giao dịch ACID mà không cần cơ chế Distributed Transactions / 2-Phase Commit.
- **Phân định:** Không phải là kiến trúc phân tán Microservices.

### 4.2. Kiến trúc Phân tầng Logic (Logical Layered Architecture)
Về mặt quan niệm thiết kế hệ thống (System Design Concept), hệ thống phân tách trách nhiệm theo 4 phân tầng logic chuẩn:
1. **Presentation Layer:** Xử lý hiển thị UI (Pug Templates, CSS Tailwind, Client JS).
2. **Business Logic Layer:** Tiếp nhận yêu cầu, kiểm tra ràng buộc nghiệp vụ, tính toán tiền tệ, xử lý tồn kho.
3. **Data Access Layer:** Thực thi các câu lệnh SQL tham số hóa, quản lý kết nối và giao dịch.
4. **Database Persistence Layer:** Lưu trữ dữ liệu thực thể trên 21 bảng SQL Server.

### 4.3. Cấu trúc Mã nguồn Vật lý Thực tế (Physical Source Code Structure)
Trong cấu trúc tệp mã nguồn thực tế của dự án VAMOS STORE tại commit `8135e19`, **không phải tất cả mọi module đều được chia máy móc thành đủ 3 tầng riêng biệt (Controller $\rightarrow$ Service $\rightarrow$ Repository)**:

| Nhóm phân loại trong mã nguồn | Module thực tế | Đường dẫn mã nguồn | Luồng xử lý kỹ thuật | Lý do thiết kế trong dự án |
| :--- | :--- | :--- | :--- | :--- |
| **Nhóm 1: Tuân thủ đầy đủ 3 tầng (Controller $\rightarrow$ Service $\rightarrow$ Repository)** | Sản phẩm & Danh mục (Catalog), Danh sách Yêu thích (Wishlist) | `src/controllers/product.controller.js`<br>`src/services/product.service.js`<br>`src/models/repositories/product.repository.js`<br>---<br>`src/controllers/wishlist.controller.js`<br>`src/services/wishlist.service.js`<br>`src/models/repositories/wishlist.repository.js` | Controller nhận request $\rightarrow$ Service xử lý nghiệp vụ/bộ lọc $\rightarrow$ Repository đóng gói câu truy vấn SQL $\rightarrow$ `database.js` (`query`) | Các phân hệ này có logic tái sử dụng cao ở nhiều nơi (Trang chủ, Trang danh mục, API Live Search, API Wishlist Toggle). |
| **Nhóm 2: Controller $\rightarrow$ Service $\rightarrow$ Database Helper (Không có Repository riêng)** | Đặt hàng & Hủy đơn COD (Orders & Checkout) | `src/controllers/checkout.controller.js`<br>`src/controllers/account.controller.js`<br>`src/services/order.service.js`<br>`src/config/database.js` | Controller nhận request $\rightarrow$ `orderService.createCodOrder` / `cancelOrder` trực tiếp mở `sql.Transaction`, thực thi các lệnh khóa bi quan `WITH (UPDLOCK, ROWLOCK)` | Phân hệ Đơn hàng cần tính toàn vẹn ACID tối đa; việc mở transaction trên nhiều bảng (`orders`, `order_items`, `vouchers`, `product_variants`, `cart_items`) được gom tập trung trong `order.service.js` để tránh chia nhỏ transaction qua nhiều repository rời rạc. |
| **Nhóm 3: Controller gọi trực tiếp Database Helper (Không qua Service, Không có Repository)** | Xác thực (Auth), Giỏ hàng (Cart), Quản trị (Admin CRUD), Dashboard | `src/controllers/auth.controller.js`<br>`src/controllers/cart.controller.js`<br>`src/controllers/admin.controller.js`<br>`src/controllers/account.controller.js` (phần sổ địa chỉ)<br>`src/config/database.js` | Controller kiểm tra dữ liệu bằng `validator.js`, sau đó gọi trực tiếp `query()` hoặc `sql.Transaction` trong `database.js` | Các tác vụ CRUD cơ bản hoặc truy vấn phân trang/thống kê nhiều bảng (như 9 truy vấn song song của Dashboard) được thực thi trực tiếp tại Controller nhằm giảm thiểu overhead, tránh tạo các lớp bọc (wrappers) rỗng không cần thiết theo nguyên tắc thực dụng YAGNI. |

---

*Tài liệu thuộc Phần 3.2.2 của Báo cáo Phân tích Thiết kế Hệ thống VAMOS STORE.*
