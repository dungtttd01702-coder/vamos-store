# TỔNG QUAN KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE OVERVIEW)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE

> **Tiêu chuẩn học thuật:** Đồ án Tốt nghiệp / Assignment Kỹ nghệ Phần mềm FPT Polytechnic.  
> **Nguyên tắc thiết kế:** Kiến trúc phân lớp (Layered Architecture) kết hợp mô hình MVC và dịch vụ tập trung (Service Layer), đảm bảo tính module hóa, phân tách trách nhiệm (Separation of Concerns) và toàn vẹn dữ liệu giao dịch ACID.  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | Git HEAD `8135e19`.

---

## 1. MỤC TIÊU VÀ PHẠM VI KIẾN TRÚC

Tài liệu này đặc tả tổng quan cấu trúc vật lý và logic của toàn bộ hệ thống phần mềm VAMOS STORE — nền tảng thương mại điện tử chuyên kinh doanh giày sneaker và thể thao chính hãng. Bản thiết kế kiến trúc trả lời trực tiếp các câu hỏi cốt lõi:
1. Hệ thống VAMOS STORE được tổ chức theo mô hình kiến trúc nào?
2. Một yêu cầu (request) từ trình duyệt khách hàng đi qua những thành phần nào?
3. Trách nhiệm cụ thể của từng tầng (Presentation, Controller, Service, Repository, Database) là gì?
4. Hệ thống đảm bảo tính nhất quán, an toàn phiên làm việc và giao dịch tài chính như thế nào?

---

## 2. SƠ ĐỒ KIẾN TRÚC TỔNG QUAN (SYSTEM ARCHITECTURE OVERVIEW)

Kiến trúc VAMOS STORE được tổ chức theo mô hình phân tầng chặt chẽ từ máy khách đến cơ sở dữ liệu:

![Sơ đồ kiến trúc tổng quan VAMOS STORE](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/SYSTEM_ARCHITECTURE_OVERVIEW.png)
*(Mã nguồn sơ đồ: [SYSTEM_ARCHITECTURE_OVERVIEW.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/SYSTEM_ARCHITECTURE_OVERVIEW.puml))*

---

## 3. PHÂN TÍCH CÁC TẦNG KIẾN TRÚC (TIERS & LAYERS)

### 3.1. Tầng Trình duyệt Khách hàng (Client Tier)
- **Thiết bị truy cập:** Hỗ trợ đa nền tảng gồm máy tính cá nhân (PC/Laptop), máy tính bảng và điện thoại di động (Responsive Web Design).
- **Trình duyệt mục tiêu:** Google Chrome, Mozilla Firefox, Microsoft Edge, Apple Safari.
- **Thành phần giao diện client:**
  - Cấu trúc trang: **HTML5** chuẩn ngữ nghĩa được tạo thông qua cơ chế Server-side Rendering.
  - Định kiểu: **Tailwind CSS 3.4.17** biên dịch tinh gọn (`src/public/css/style.css`), tuân thủ tỷ lệ màu 60-30-10 và visual hierarchy hiện đại.
  - Kịch bản tương tác: **Vanilla JavaScript** (`src/public/js/main.js`), cung cấp khả năng tìm kiếm gợi ý thời gian thực (Live Search AJAX), chuyển đổi yêu thích (Wishlist 1-click toggle), bộ chọn size/màu động và thông báo Toast.

---

### 3.2. Tầng Máy chủ Ứng dụng (Application Server Tier)
Môi trường thực thi: **Node.js (v22+)** với framework web **Express.js 4.21.2**. Tầng ứng dụng chịu trách nhiệm toàn bộ luồng xử lý trung tâm, bao gồm:

#### A. Cổng nạp & Khởi tạo (HTTP Server & Lifecycle)
- Điểm khởi động (`server.js`): Lắng nghe tại cổng mạng mặc định `PORT 3000`, khởi tạo ứng dụng Express (`src/app.js`), kiểm tra tính sẵn sàng của kết nối CSDL (`testDbConnection()`), và lắng nghe sự kiện `SIGTERM` để đóng server an toàn (**Graceful Shutdown**).
- Ứng dụng Express Core (`src/app.js`): Tắt nhận diện máy chủ (`app.disable('x-powered-by')`) để che giấu dấu vết công nghệ, cấu hình thư mục view Pug (`src/views/`) và tài nguyên tĩnh (`src/public/`).

#### B. Chuỗi Middleware Bảo mật & Xử lý Yêu cầu (Middleware Pipeline)
Mọi request đi vào hệ thống đều phải đi qua chuỗi middleware tuần tự trước khi đến router:
1. **Security Headers Middleware:** Thiết lập các tiêu đề HTTP theo chuẩn OWASP:
   - `X-Content-Type-Options: nosniff` (chống MIME sniffing).
   - `X-Frame-Options: SAMEORIGIN` (chống Clickjacking).
   - `X-XSS-Protection: 1; mode=block` (chặn Cross-site Scripting).
   - `Referrer-Policy: strict-origin-when-cross-origin`.
2. **Body Parsers:** `express.json()` và `express.urlencoded({ extended: true })` để bóc tách tham số body.
3. **Session Middleware (`express-session`):** Quản lý phiên làm việc thông qua cookie có tên `vamos_sid`, thời hạn 7 ngày, thuộc tính `httpOnly: true`, `sameSite: 'lax'`.
4. **Context & State Middleware (`sessionContextMiddleware`):** Gắn thông tin người dùng (`user`), giỏ hàng (`cartCount`), thông báo flash và giao diện theme vào biến cục bộ `res.locals` phục vụ render Pug.
5. **Đa ngôn ngữ (`i18nMiddleware`):** Quản lý locale qua cookie `vamos_locale` (vi / en) và gắn hàm dịch ngữ cảnh `t()` vào template.
6. **Bảo vệ CSRF (`csrfMiddleware`):** Tự động cấp mã token ngẫu nhiên `crypto.randomBytes(24)` lưu trong session và bắt buộc kiểm tra `_csrf` trên tất cả các request làm thay đổi trạng thái (`POST`, `PUT`, `DELETE`, `PATCH`).
7. **Bảo vệ Phân quyền (Route Guards):** `requireAuth` (bắt buộc đăng nhập), `requireCustomer` (chặn Guest 401, chặn Admin 403), `requireAdmin` (chỉ cho phép ADMIN đang active).
8. **Xử lý Lỗi tập trung (`error.middleware.js`):** Bắt lỗi 404 (`notFoundHandler`) và lỗi 500 (`errorHandler`), render trang thông báo thân thiện mà không rò rỉ stack trace ở môi trường production.

#### C. Tầng Điều tuyến (Modular Routers)
Được tập hợp tại `src/routes/index.js`, phân tách thành 9 file router độc lập:
- `/` $\rightarrow$ `home.routes.js`, `info.routes.js`
- `/products` $\rightarrow$ `product.routes.js`
- `/auth` $\rightarrow$ `auth.routes.js`
- `/cart` $\rightarrow$ `cart.routes.js`
- `/checkout` $\rightarrow$ `checkout.routes.js`
- `/account` $\rightarrow$ `account.routes.js`
- `/admin` $\rightarrow$ `admin.routes.js`
- `/api/wishlist` $\rightarrow$ `wishlist.routes.js`
- `/api/products/search` $\rightarrow$ Endpoint tìm kiếm thời gian thực

#### D. Tầng Điều khiển (Controller Layer)
Bao gồm 8 bộ điều khiển chuyên trách:
- `home.controller.js`: Xử lý trang chủ, banner, sản phẩm mới, flash sale, chuyển đổi ngôn ngữ.
- `auth.controller.js`: Xử lý đăng ký, đăng nhập, băm mật khẩu `bcryptjs`, chống Session Fixation, hợp nhất giỏ session.
- `product.controller.js`: Xử lý lọc danh mục, khoảng giá, xem chi tiết và API Live Search.
- `cart.controller.js`: Quản lý giỏ hàng kép (Guest Session Cart vs Customer DB Cart), khống chế mua lẻ 1–10 đôi, kiểm tra Live DB Sync.
- `wishlist.controller.js`: Xử lý 1-click toggle sản phẩm yêu thích cho Customer.
- `checkout.controller.js`: Tiếp nhận đơn hàng COD, tính phí vận chuyển, ủy quyền xử lý đơn.
- `account.controller.js`: Quản lý hồ sơ cá nhân, sổ địa chỉ nhận hàng, tra cứu lịch sử và hủy đơn phía khách.
- `admin.controller.js`: Quản trị danh mục, kho hàng, đơn hàng, mã giảm giá, tài khoản khách hàng và báo cáo dashboard.

#### E. Tầng Dịch vụ Nghiệp vụ (Service Layer)
Đóng gói các quy tắc nghiệp vụ phức tạp, điều phối nhiều thành phần và quản lý giao dịch CSDL:
- `order.service.js`:
  - `createCodOrder`: Mở Transaction CSDL, khóa bi quan giỏ hàng `WITH (UPDLOCK, ROWLOCK)`, kiểm tra voucher 1 lần/khách qua bảng `voucher_usages`, kiểm tra tồn kho từng biến thể, trừ kho, lưu snapshot đơn hàng, lưu snapshot chi tiết món, ghi lịch sử trạng thái ban đầu `PENDING`, xóa giỏ hàng khi thành công.
  - `cancelOrder`: Khóa đơn hàng, kiểm tra quyền sở hữu và trạng thái `PENDING`, hoàn trả tồn kho (`change_quantity = +qty`), giải phóng hạn mức voucher, cập nhật trạng thái `CANCELLED`.
  - `updateOrderStatusByAdmin`: Thực thi máy trạng thái tuần tự (`VALID_TRANSITIONS`), ghi nhật ký chuyển trạng thái, tự động gán `payment_status = 'PAID'` khi hoàn tất (không trừ kho lần 2).
- `product.service.js`: Phối hợp các bộ lọc danh mục, giá, thương hiệu và ủy quyền cho `product.repository.js`.
- `wishlist.service.js`: Phối hợp kiểm tra sản phẩm, thực hiện toggle thêm/xóa trong `wishlist.repository.js` và định dạng dữ liệu trả về client.

#### F. Tầng Truy xuất Dữ liệu (Data Access Layer)
- **Mô hình Repository:**
  - `product.repository.js`: Chuyên trách truy vấn dữ liệu sản phẩm, danh mục, thương hiệu, banner, sản phẩm flash sale.
  - `wishlist.repository.js`: Chuyên trách truy vấn danh sách yêu thích của người dùng.
- **Mô-đun Kết nối CSDL (`src/config/database.js`):**
  - Quản lý **Connection Pool** của thư viện `mssql` (Cấu hình: tối thiểu 0, tối đa 10 kết nối, timeout 30 giây).
  - Cung cấp hàm tiện ích `query(queryStr, params)` thực thi truy vấn tham số hóa (Parameterized Queries) chống triệt để SQL Injection.
  - Cung cấp hàm `withTransaction(callback)` và `sql.Transaction(pool)` quản lý giao dịch ACID hoàn nguyên an toàn khi có ngoại lệ.

---

### 3.3. Tầng Cơ sở Dữ liệu (Database Tier)
Hệ quản trị cơ sở dữ liệu: **Microsoft SQL Server (2019 / 2022)**.
- **Tên cơ sở dữ liệu:** `vamos_store_db`.
- **Cấu trúc lưu trữ:** 21 bảng quan hệ (13 bảng thực thể cốt lõi và 8 bảng phụ trợ / lịch sử / hệ thống).
- **Cơ chế toàn vẹn:**
  - Khóa chính (Primary Key): Kiểu số nguyên tự tăng `INT IDENTITY(1,1)` đảm bảo hiệu năng ghi tuần tự trên B-Tree Clustered Index.
  - Khóa ngoại (Foreign Key): Ràng buộc quan hệ cha-con chặt chẽ (`ON DELETE NO ACTION` / `CASCADE` phù hợp).
  - Ràng buộc kiểm tra (Check Constraints): Ràng buộc giá trị hợp lệ (`price > 0`, `order_status IN (...)`, `payment_status IN (...)`).
  - Chỉ mục lọc duy nhất (Filtered Unique Indexes):
    - `uq_user_default_address`: Mỗi khách hàng chỉ có tối đa 1 địa chỉ mặc định (`WHERE is_default = 1`).
    - `uq_product_primary_image`: Mỗi sản phẩm chỉ có tối đa 1 ảnh đại diện (`WHERE is_primary = 1`).
- **Giao thức kết nối:** TDS Protocol (Tabular Data Stream) qua cổng mạng TCP `1433`.

---

## 4. LUỒNG XỬ LÝ YÊU CẦU TỔNG QUÁT (REQUEST PROCESSING PIPELINE)

Một yêu cầu gửi từ trình duyệt đến hệ thống VAMOS STORE được xử lý theo 2 luồng tùy thuộc vào loại phản hồi:

### 4.1. Luồng Giao diện Phía Máy chủ (Server-Side Rendering - SSR Flow)
```
[Trình duyệt Khách hàng]
         │ (HTTP GET/POST Request)
         ▼
[server.js (HTTP Server Port 3000)]
         ▼
[Express App & Chuỗi Middleware]
  ├── 1. Security Headers (nosniff, XSS, Frame)
  ├── 2. Body Parser (json, urlencoded)
  ├── 3. Session Middleware (Cookie: vamos_sid)
  ├── 4. Session Context Middleware (res.locals: user, cartCount)
  ├── 5. i18n Middleware (Ngôn ngữ: t())
  └── 6. CSRF Middleware (Xác thực _csrf trên POST)
         ▼
[Router Phân hệ (src/routes/*.routes.js)]
         ▼ (Route Guards: requireAuth / requireAdmin nếu có)
[Controller Chuyên trách (src/controllers/*.controller.js)]
         ▼
[Service Nghiệp vụ (src/services/*.service.js)]
         ▼
[Repository / Database Helper (src/config/database.js)]
         ▼
[Microsoft SQL Server (Connection Pool & Transaction)]
         ▲ (Trả về Recordsets)
         │
[Service format dữ liệu]
         │
[Controller nhận Dữ liệu Model]
         ▼
[Động cơ Pug 3.0.3 (src/views/pages/*.pug)]
         ▼
[Trả về HTML hoàn chỉnh cho Trình duyệt]
```

### 4.2. Luồng Dịch vụ API Dữ liệu (REST API / AJAX Flow)
Áp dụng cho các tính năng tương tác nhanh không làm tải lại trang (Live Search, Wishlist 1-click toggle):
- **Request:** Client gửi yêu cầu bất đồng bộ (`fetch('/api/products/search?q=...')` hoặc `fetch('/api/wishlist/toggle')`).
- **Xử lý:** Middleware kiểm tra token và phiên làm việc $\rightarrow$ Controller tiếp nhận $\rightarrow$ Service/Repository truy vấn $\rightarrow$ Controller phản hồi trực tiếp đối tượng **JSON** (`{ success: true, count: ..., data: [...] }`).
- **Client Render:** Mã JavaScript client (`src/public/js/main.js`) tiếp nhận JSON, cập nhật trực tiếp cây DOM, hiển thị thông báo Toast và cập nhật số đếm badge giỏ hàng / yêu thích.

---

## 5. CÁC ĐẶC TRƯNG KIẾN TRÚC CỐT LÕI

| Đặc trưng kiến trúc | Hiện trạng triển khai thực tế trong mã nguồn VAMOS STORE |
| :--- | :--- |
| **Phân tách Trách nhiệm (Separation of Concerns)** | Phân tách rành mạch: Router (định tuyến) $\rightarrow$ Controller (giao tiếp HTTP) $\rightarrow$ Service (nghiệp vụ & giao dịch) $\rightarrow$ Repository / DB Module (truy vấn SQL). |
| **Giao dịch Toàn vẹn (ACID Transactions)** | Mọi thao tác tài chính, trừ kho, tạo đơn và hoàn kho đều được bọc trong `sql.Transaction(pool)` với lệnh khóa dòng bi quan `WITH (UPDLOCK, ROWLOCK)`. |
| **Bảo vệ Phân tầng (Defense in Depth)** | Bảo mật nhiều lớp: Security headers ở gateway $\rightarrow$ Kiểm tra phiên session $\rightarrow$ Chống CSRF token $\rightarrow$ Kiểm tra quyền hạn RBAC $\rightarrow$ Tham số hóa SQL phòng SQL Injection. |
| **Kiểm soát Tồn kho Thời gian thực** | Cơ chế **Live DB Sync** kiểm tra tồn kho tức thời đối với giỏ hàng session của khách vãng lai, tự động loại bỏ món hết tồn trước khi render. |
| **Bảo lưu Lịch sử (Historical Snapshotting)** | Bảng `orders` và `order_items` lưu trữ bản sao dữ liệu tại thời điểm đặt (tên người nhận, SĐT, địa chỉ, đơn giá, tên sản phẩm) để bảo vệ số liệu kế toán không bị biến động khi danh mục thay đổi. |

---

*Tài liệu thuộc Phần 3.2.1 của Báo cáo Phân tích Thiết kế Hệ thống VAMOS STORE.*
