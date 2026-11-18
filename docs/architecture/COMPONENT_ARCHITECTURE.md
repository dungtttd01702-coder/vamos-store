# KIẾN TRÚC CÁC THÀNH PHẦN (COMPONENT ARCHITECTURE)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE

> **Tiêu chuẩn học thuật:** Đồ án Tốt nghiệp / Assignment Kỹ nghệ Phần mềm FPT Polytechnic.  
> **Nguyên tắc thiết kế:** Đặc tả theo chuẩn UML 2.5 Component Diagram, thể hiện chi tiết ranh giới thành phần (Component Boundaries), giao diện cung cấp/đòi hỏi (Provided/Required Interfaces) và mối quan hệ phụ thuộc giữa các hệ thống con.  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | Git HEAD `8135e19`.

---

## 1. MỤC TIÊU VÀ PHẠM VI TÀI LIỆU

Tài liệu này đặc tả cấu trúc mô-đun hóa của VAMOS STORE ở mức độ thành phần phần mềm (Software Components). Đây là phần quan trọng nhất trong báo cáo kiến trúc hệ thống, chỉ rõ cách các thành phần giao diện, thành phần điều khiển, thành phần nghiệp vụ và thành phần truy xuất dữ liệu phối hợp hoạt động với nhau.

Hệ thống được mô hình hóa qua **1 sơ đồ tổng quan toàn hệ thống** và **6 sơ đồ thành phần chi tiết** theo từng phân hệ nghiệp vụ cốt lõi.

---

## 2. SƠ ĐỒ THÀNH PHẦN TỔNG QUAN (COMPONENT DIAGRAM OVERVIEW)

![Sơ đồ thành phần tổng quan VAMOS STORE](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/COMPONENT_DIAGRAM_OVERVIEW.png)
*(Mã nguồn sơ đồ: [COMPONENT_DIAGRAM_OVERVIEW.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/COMPONENT_DIAGRAM_OVERVIEW.puml))*

### Phân tích mối quan hệ phụ thuộc tổng quan:
1. **Thành phần Giao diện $\rightarrow$ Máy chủ Express:** Khách hàng và Quản trị viên gửi HTTP/HTTPS requests thông qua trình duyệt đến `server.js` và `src/app.js`.
2. **Máy chủ Express $\rightarrow$ Chuỗi Middleware:** Yêu cầu đi qua tầng kiểm tra an ninh (Security Headers, CORS, Session, Anti-CSRF Token, i18n và Route Guards).
3. **Chuỗi Middleware $\rightarrow$ Bộ Định tuyến (Router Bus):** Yêu cầu hợp lệ được điều hướng đến đúng controller chức năng thông qua `src/routes/index.js`.
4. **Bộ Điều khiển $\rightarrow$ Dịch vụ & Kho Dữ liệu:** Các controller gọi trực tiếp dịch vụ nghiệp vụ (`OrderService`, `ProductService`, `WishlistService`) hoặc truy vấn trực tiếp qua `DbEngine` đối với các thao tác dữ liệu đơn giản.
5. **Dịch vụ $\rightarrow$ Kho Dữ liệu & Giao dịch:** `OrderService` điều phối giao dịch nguyên tử (ACID Transactions) và các chỉ dẫn khóa bi quan (`UPDLOCK`, `ROWLOCK`) trên `product_variants` và `orders`.
6. **Kho Dữ liệu $\rightarrow$ SQL Server:** Giao tiếp qua giao thức mạng TDS Protocol trên cổng TCP 1433 thông qua vùng kết nối dùng chung (Connection Pool 0–10 kết nối).

---

## 3. CHI TIẾT 6 PHÂN HỆ THÀNH PHẦN NGHIỆP VỤ (MODULE COMPONENTS)

---

### 3.1. Phân hệ Xác thực & Tài khoản (Authentication Component)

Phân hệ xác thực chịu trách nhiệm quản lý danh tính người dùng, cấp phát phiên làm việc và bảo vệ tài khoản khách hàng.

![Sơ đồ thành phần phân hệ Xác thực](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/AUTH_COMPONENT_DIAGRAM.png)
*(Mã nguồn sơ đồ: [AUTH_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/AUTH_COMPONENT_DIAGRAM.puml))*

- **Các thành phần tham gia:**
  - `views/pages/auth/login.pug` & `register.pug`: Giao diện thu thập thông tin đăng nhập và đăng ký.
  - `src/routes/auth.routes.js`: Định tuyến tiếp nhận yêu cầu (`/auth/login`, `/auth/register`, `/auth/logout`).
  - `src/controllers/auth.controller.js`: Điều phối quy trình đăng ký, so sánh băm mật khẩu khi đăng nhập, kiểm tra tài khoản bị khóa (`status = 'locked'`).
  - `src/utils/validator.js`: Thư viện kiểm tra định dạng email chuẩn regex RFC 5322, số điện thoại 10 số nhà mạng VN, độ dài mật khẩu $\ge 6$ ký tự.
  - `bcryptjs`: Thư viện băm mật khẩu một chiều an toàn với hệ số muối 10 rounds.
  - `express-session`: Quản lý phiên, thực thi `req.session.regenerate()` để triệt tiêu hoàn toàn nguy cơ tấn công đánh cắp phiên (**Session Fixation**).
  - `CartController.mergeGuestCart`: Tự động hợp nhất các mặt hàng khách đã chọn tạm trong session (`req.session.guestCart`) vào giỏ hàng CSDL của tài khoản mới đăng nhập.
  - `src/config/database.js`: Mở Transaction tạo đồng thời người dùng trong bảng `users` và giỏ hàng rỗng trong bảng `carts`.
- **Ghi chú học thuật về chức năng Khôi phục Mật khẩu:**
  - Bảng CSDL `password_reset_tokens` đã được định nghĩa đầy đủ với các trường `token_hash`, `expires_at`, `is_used`.
  - Tuy nhiên, trong mã nguồn hiện tại, các route (`/auth/forgot-password`), controller và dịch vụ gửi mail (Nodemailer / SMTP Service) **chưa được triển khai**.
  - Phân hệ này được gắn nhãn minh bạch: **Designed Only / Not Implemented** phục vụ lộ trình mở rộng (Roadmap).

---

### 3.2. Phân hệ Danh mục & Sản phẩm (Product Catalog Component)

Phân hệ danh mục chịu trách nhiệm lập danh mục hàng hóa, thực hiện các thuật toán lọc đa tiêu chí, hiển thị chi tiết biến thể và hỗ trợ tìm kiếm gợi ý thời gian thực.

![Sơ đồ thành phần phân hệ Sản phẩm & Danh mục](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/CATALOG_COMPONENT_DIAGRAM.png)
*(Mã nguồn sơ đồ: [CATALOG_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/CATALOG_COMPONENT_DIAGRAM.puml))*

- **Các thành phần tham gia:**
  - `views/pages/home.pug`, `views/pages/products/index.pug`, `detail.pug`: Giao diện hiển thị danh sách dạng lưới (Grid), phân trang và chi tiết sản phẩm.
  - `src/public/js/main.js`: Lắng nghe sự kiện người dùng gõ từ khóa, gửi yêu cầu AJAX đến endpoint `/api/products/search` và cập nhật danh sách thả xuống; xử lý sự kiện nhấp chọn size/màu để kiểm tra tồn kho động.
  - `src/routes/home.routes.js` & `product.routes.js`: Định tuyến URL thân thiện SEO (`/products/:slug`).
  - `src/controllers/home.controller.js` & `product.controller.js`: Xử lý phân trang, làm sạch khoảng giá (`minPrice`, `maxPrice`), kiểm tra danh sách trắng giới tính (`MEN`, `WOMEN`, `UNISEX`).
  - `src/services/product.service.js`: Điều phối các hàm nghiệp vụ: `getCatalog()`, `getProductBySlug()`, `getAllCategories()`, `getHomeBanners()`, `getLatestProducts()`, `getFlashSaleProducts()`, `searchLive()`.
  - `src/models/repositories/product.repository.js`: Thực thi câu lệnh SQL phức tạp nối bảng giữa `products`, `categories`, `brands`, `product_variants`, `sizes`, `colors`, `product_images` và `banners`.

---

### 3.3. Phân hệ Giỏ hàng & Danh sách Yêu thích (Shopping Cart & Wishlist Component)

Phân hệ mua sắm chịu trách nhiệm quản lý giỏ hàng của người dùng theo mô hình giỏ hàng kép (Dual Cart) và danh sách sản phẩm yêu thích (Wishlist).

![Sơ đồ thành phần phân hệ Giỏ hàng & Yêu thích](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/SHOPPING_COMPONENT_DIAGRAM.png)
*(Mã nguồn sơ đồ: [SHOPPING_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/SHOPPING_COMPONENT_DIAGRAM.puml))*

- **Các thành phần tham gia:**
  - `views/pages/cart/index.pug`: Giao diện bảng giỏ hàng, cập nhật số lượng, hiển thị tạm tính và phí ship.
  - `src/routes/cart.routes.js`: Định tuyến giỏ hàng (`/cart`, `/cart/add`, `/cart/update/:id`, `/cart/remove/:id`).
  - `src/controllers/cart.controller.js`:
    - **Khách vãng lai (Guest):** Thao tác trên mảng `req.session.guestCart`. Cơ chế **Live DB Sync** tự động truy vấn CSDL để loại bỏ các mặt hàng đã hết tồn và hạ số lượng nếu vượt quá tồn kho thực tế.
    - **Khách thành viên (Customer):** Thao tác trực tiếp trên bảng `cart_items` trong CSDL.
    - **Kiểm soát bán lẻ:** Luôn kiểm tra $1 \le quantity \le 10$ đôi giày cho mỗi mặt hàng. Chặn Quản trị viên sử dụng giỏ hàng mua sắm.
  - `src/routes/wishlist.routes.js` & `src/middlewares/auth.middleware.js`: Được bảo vệ bởi middleware `requireCustomer` (trả về JSON 401 nếu là Guest, chặn 403 nếu là Admin).
  - `src/controllers/wishlist.controller.js`: Tiếp nhận request AJAX `POST /api/wishlist/toggle`.
  - `src/services/wishlist.service.js`: Xử lý logic 1-click toggle và định dạng danh sách yêu thích.
  - `src/models/repositories/wishlist.repository.js`: Thao tác trực tiếp trên bảng `wishlist_items` với ràng buộc duy nhất `uq_wishlist_user_product`.

---

### 3.4. Phân hệ Đặt hàng COD & Theo dõi Đơn hàng (Order & Checkout Component)

Phân hệ quan trọng nhất đảm bảo dòng tiền kinh doanh và tính toàn vẹn tồn kho của hệ thống thương mại điện tử.

![Sơ đồ thành phần phân hệ Đặt hàng COD](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/ORDER_COMPONENT_DIAGRAM.png)
*(Mã nguồn sơ đồ: [ORDER_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/ORDER_COMPONENT_DIAGRAM.puml))*

- **Các thành phần tham gia:**
  - `views/pages/checkout/index.pug`, `success.pug`, `account/orders.pug`, `account/order-detail.pug`.
  - `src/routes/checkout.routes.js` & `account.routes.js`: Được bảo vệ bởi `requireAuth` và `csrfMiddleware`.
  - `src/controllers/checkout.controller.js` & `account.controller.js`: Tiếp nhận đơn hàng COD và yêu cầu hủy đơn từ khách hàng.
  - `src/services/order.service.js`:
    - `createCodOrder`: Mở giao dịch CSDL nguyên tử `sql.Transaction(pool)`. Sử dụng chỉ dẫn khóa cập nhật bi quan `WITH (UPDLOCK, ROWLOCK)` trên từng biến thể để chống bán quá tồn kho (**Over-selling**); kiểm tra voucher chỉ được dùng 1 lần/khách qua bảng `voucher_usages`; trừ tồn kho; ghi log `inventory_transactions` (`-qty`); chụp ảnh lịch sử (snapshot) thông tin người nhận vào `orders` và giá/size/màu vào `order_items`; ghi lịch sử `order_status_histories` (`PENDING`); xóa sạch giỏ hàng `DELETE FROM cart_items`.
    - `cancelOrder`: Khóa đơn hàng với `WITH (UPDLOCK, ROWLOCK)` theo cặp `(id = @orderId AND user_id = @userId)`, kiểm tra đơn đang ở `PENDING`, hoàn trả tồn kho (`+qty`), giải phóng mã voucher và cập nhật trạng thái `CANCELLED`.
  - `src/config/database.js`: Cung cấp kết nối và cơ chế Rollback toàn phần khi có bất kỳ ngoại lệ nào xảy ra trong chuỗi xử lý.

---

### 3.5. Phân hệ Quản trị Hệ thống (Admin Management Component)

Phân hệ quản trị cung cấp công cụ vận hành toàn diện cho Quản trị viên (Admin) để quản lý đơn hàng, danh mục, kho hàng, khuyến mãi và người dùng.

![Sơ đồ thành phần phân hệ Quản trị Admin](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/ADMIN_COMPONENT_DIAGRAM.png)
*(Mã nguồn sơ đồ: [ADMIN_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/ADMIN_COMPONENT_DIAGRAM.puml))*

- **Các thành phần tham gia:**
  - `views/layouts/admin.pug` và các trang quản trị chuyên biệt trong `views/pages/admin/`.
  - `src/routes/admin.routes.js`: Được bảo vệ bởi middleware `requireAdmin` (kiểm tra tài khoản có vai trò `ADMIN` và đang ở trạng thái `active`).
  - `src/controllers/admin.controller.js`:
    - **Xử lý Đơn hàng:** Gọi `orderService.updateOrderStatusByAdmin` thực thi máy trạng thái tuần tự (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`). Khi hoàn tất tự động đặt `payment_status = 'PAID'` (không trừ kho lần 2). Nếu chọn hủy đơn sẽ hoàn kho và giải phóng voucher.
    - **Quản lý Kho hàng:** Cung cấp chức năng điều chỉnh tồn kho thủ công (`postAdjustInventory`), bắt buộc nhập lý do kiểm toán, khóa dòng biến thể, kiểm tra điều kiện tồn kho không được âm (`newStock >= 0`) và ghi log vào `inventory_transactions`.
    - **Quản lý Sản phẩm & Danh mục:** Mở Transaction tạo sản phẩm mới, tự động sinh slug chuẩn SEO, chèn ảnh đại diện (`product_images`) và biến thể khởi tạo (`product_variants`); quản lý bật/tắt hiển thị sản phẩm và tạo danh mục, thương hiệu.
    - **Quản lý Khuyến mãi:** Tạo mã voucher, kiểm tra tỷ lệ chiết khấu $\le 100\%$, kiểm tra thời hạn và bật/tắt hiệu lực.
    - **Quản lý Khách hàng:** Xem hồ sơ, địa chỉ, lịch sử đơn hàng. **Cơ chế Safety Guard:** Tuyệt đối ngăn chặn việc khóa tài khoản ADMIN (`role === 'ADMIN'`), bảo vệ hệ thống khỏi rủi ro tự khóa quản trị viên.

---

### 3.6. Phân hệ Bảng điều khiển & Báo cáo Doanh thu (Dashboard Component)

Phân hệ cung cấp các chỉ số kinh doanh then chốt (KPI) và cảnh báo vận hành cho ban quản trị.

![Sơ đồ thành phần phân hệ Dashboard](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/DASHBOARD_COMPONENT_DIAGRAM.png)
*(Mã nguồn sơ đồ: [DASHBOARD_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/DASHBOARD_COMPONENT_DIAGRAM.puml))*

- **Các thành phần tham gia:**
  - `views/pages/admin/dashboard.pug`: Giao diện hiển thị trực quan các thẻ KPI, danh sách hàng sắp hết kho, biểu đồ trạng thái đơn hàng, top sản phẩm bán chạy và danh sách đơn hàng gấp cần duyệt.
  - `src/routes/admin.routes.js`: Định tuyến `GET /admin/dashboard`.
  - `src/controllers/admin.controller.js` (hàm `getDashboard`):
    - **Tối ưu hóa Truy vấn Song song & Tuần tự:** Sử dụng cấu trúc `Promise.all` kích hoạt đồng thời **9 truy vấn SQL Server song song** (doanh thu, tổng đơn, đơn chờ, tổng SP active, tổng SKU active, cảnh báo tồn kho <= 5, 6 đơn gần nhất, top 4 sản phẩm bán chạy, cơ cấu trạng thái đơn), kết hợp thêm **1 truy vấn danh sách 5 đơn hàng khẩn cấp cần duyệt** (tổng cộng 10 truy vấn cơ sở dữ liệu) mà không gây nghẽn I/O.
    - **Nguyên tắc Doanh thu Thực thu (Realized Revenue):** Doanh thu được tính từ cột tiền `total_amount` trong bảng `orders` (bảng `orders` không có cột `final_amount`) và chỉ được cộng dồn từ các đơn hàng thỏa mãn:
      ```sql
      SELECT COALESCE(SUM(total_amount), 0) AS total_revenue 
      FROM orders 
      WHERE order_status = 'COMPLETED' AND payment_status = 'PAID'
      ```
      *(Không áp dụng bộ lọc ngày, tính tổng doanh thu toàn thời gian của hệ thống; loại bỏ hoàn toàn các đơn đang chờ duyệt, đang giao hoặc đã hủy khỏi số liệu tài chính thực tế)*.
    - **Cảnh báo Tồn kho Thấp:** Lọc tự động các SKU có tồn kho $\le 5$ để thủ kho kịp thời nhập hàng.
    - **Bảng xếp hạng Top Sellers:** Gom nhóm theo `product_name_snapshot` trên các đơn hàng đã hoàn thành, xếp hạng theo số lượng đã bán (`total_sold`) và doanh thu đóng góp.

---

*Tài liệu thuộc Phần 3.2.3 & 3.2.4 của Báo cáo Phân tích Thiết kế Hệ thống VAMOS STORE.*
