# CHƯƠNG I: CƠ SỞ LÝ THUYẾT (THEORETICAL FOUNDATION)

---

## 1. MÔ HÌNH CÔNG NGHỆ CLIENT - SERVER

### 1.1. Khái niệm và nguyên lý hoạt động

Mô hình Client - Server (Máy khách - Máy chủ) là một kiến trúc mạng máy tính phân tán, trong đó các tác vụ được phân chia rõ ràng giữa hai thành phần chính:

- **Client (Máy khách):** Là các thiết bị đầu cuối của người dùng (máy tính để bàn, laptop, máy tính bảng, điện thoại thông minh) chạy các trình duyệt web (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari). Client có nhiệm vụ gửi các yêu cầu dịch vụ (HTTP/HTTPS Requests) đến máy chủ và hiển thị kết quả (HTML/CSS/JavaScript) nhận về cho người dùng.
- **Server (Máy chủ):** Là hệ thống máy tính chuyên dụng có cấu hình mạnh, chạy liên tục và tiếp nhận các yêu cầu từ Client. Server đảm nhận các tác vụ xử lý logic nghiệp vụ, xác thực danh tính, truy xuất và lưu trữ dữ liệu vào Cơ sở dữ liệu, sau đó đóng gói phản hồi (HTTP Responses) gửi trả về cho Client.

<div align="center">
  <img src="images/hinh_01_client_server.png" alt="Hình 1: Mô hình Client - Server trong ứng dụng web" style="max-width: 65%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><em>Hình 1: Mô hình Client - Server trong ứng dụng web</em></p>
</div>

### 1.2. Ứng dụng trong hệ thống VAMOS STORE

Trong hệ thống VAMOS STORE, mô hình Client - Server được ứng dụng theo cơ chế **Server-Side Rendering (SSR)**:

- Khi khách hàng truy cập xem danh sách giày dép hoặc bấm đặt hàng, trình duyệt gửi request về Node.js Server.
- Server tiếp nhận request, gọi xuống Microsoft SQL Server 2022 để lấy dữ liệu sản phẩm, biến thể kho, sau đó sử dụng Template Engine Pug để biên dịch trực tiếp thành mã HTML hoàn chỉnh và trả về cho trình duyệt.
- **Ưu điểm áp dụng:** Giúp trang web tải nhanh, tối ưu hóa công cụ tìm kiếm (SEO) vượt trội cho các sản phẩm giày, đồng thời bảo mật tuyệt đối mã nguồn xử lý giá và logic kho phía máy chủ.

---

## 2. NGÔN NGỮ JAVASCRIPT VÀ NỀN TẢNG NODE.JS

### 2.1. Ngôn ngữ JavaScript (ES6+)

JavaScript là ngôn ngữ lập trình thông dịch bậc cao, hướng đối tượng dựa trên prototype, ban đầu được phát triển để tạo các hiệu ứng tương tác trên trình duyệt web. Cùng với sự phát triển mạnh mẽ của tiêu chuẩn ECMAScript (đặc biệt từ phiên bản ES6/ES2015 trở đi), JavaScript đã trang bị các tính năng ngôn ngữ hiện đại:

- Cú pháp `async/await` và `Promise` giúp xử lý các tác vụ bất đồng bộ một cách trực quan, tránh hiện tượng "Callback Hell".
- `Arrow functions`, `Destructuring assignment`, `Spread/Rest operator` giúp viết mã ngắn gọn, rõ ràng và dễ bảo trì.
- `Classes` và cú pháp module `import/export` hoặc `CommonJS` hỗ trợ lập trình hướng đối tượng và module hóa chuẩn mực.

### 2.2. Nền tảng Node.js

Node.js là một môi trường thực thi mã JavaScript đa nền tảng, mã nguồn mở, hoạt động bên ngoài trình duyệt web, được xây dựng trên nền tảng JavaScript Engine V8 của Google Chrome.

- **Kiến trúc hướng sự kiện (Event-driven):** Node.js vận hành dựa trên cơ chế phát và lắng nghe sự kiện, giúp hệ thống phản hồi cực nhanh với các hành động của người dùng.
- **Cơ chế I/O bất đồng bộ, không phong tỏa (Non-blocking I/O) và Vòng lặp sự kiện (Event Loop):** Thay vì tạo ra một luồng (thread) mới cho mỗi request như kiến trúc truyền thống đa luồng (multi-threaded) của Java hay PHP, Node.js sử dụng một luồng đơn (Single Thread) để xử lý hàng ngàn kết nối đồng thời mà không bị nghẽn I/O trong lúc chờ truy vấn cơ sở dữ liệu.
- **Lý do lựa chọn cho VAMOS STORE:** Nền tảng Node.js cho phép đội ngũ phát triển sử dụng duy nhất một ngôn ngữ JavaScript xuyên suốt từ Backend đến Frontend, tốc độ thực thi I/O vượt trội, rất phù hợp với bài toán thương mại điện tử cần xử lý nhiều truy vấn duyệt sản phẩm và đặt hàng đồng thời.

---

## 3. FRAMEWORK EXPRESS.JS

### 3.1. Tổng quan về Express.js

Express.js là một web framework mã nguồn mở tối giản (minimalist), linh hoạt và phổ biến hàng đầu dành cho Node.js. Express.js cung cấp một tập hợp các tính năng cốt lõi mạnh mẽ để phát triển các ứng dụng web và API:

- **Hệ thống định tuyến (Routing):** Quản lý điều hướng URL request (GET, POST, PUT, DELETE) đến các controller xử lý tương ứng một cách mạch lạc.
- **Cơ chế Middleware:** Là các hàm trung gian có quyền truy cập vào đối tượng request (`req`), response (`res`) và hàm `next()` trong chu trình xử lý. Middleware được dùng để xác thực quyền đăng nhập, ghi log, phân tích dữ liệu form (`body-parser`), quản lý phiên và xử lý lỗi tập trung.
- **Tích hợp Template Engine linh hoạt:** Hỗ trợ kết nối liền mạch với Pug để kết xuất giao diện HTML phía máy chủ.

### 3.2. Vai trò trong dự án VAMOS STORE

Express.js đóng vai trò là "bộ xương sống" kết nối toàn bộ hệ thống VAMOS STORE:

- Phân tách mạch lạc giữa các route công khai cho khách hàng (`/products`, `/cart`, `/checkout`) và các route quản trị bảo mật (`/admin/products`, `/admin/orders`, `/admin/inventory`).
- Cung cấp các Middleware kiểm tra vai trò (`requireAdmin`, `sessionContextMiddleware`): ngăn chặn khách vãng lai chưa đăng nhập truy cập trang thanh toán, ngăn chặn khách hàng thông thường truy cập trái phép vào các trang quản trị của Admin.

---

## 4. MÔ HÌNH MVC VÀ KIẾN TRÚC THỰC THI (APPLICATION ARCHITECTURE)

### 4.1. Khái niệm Model - View - Controller (MVC)

Mô hình MVC là một mẫu kiến trúc phần mềm kinh điển trong công nghệ web, chia tách ứng dụng thành ba thành phần độc lập:

1. **Model (Mô hình dữ liệu):** Đại diện cho dữ liệu và các quy tắc nghiệp vụ lưu trữ. Model tương tác trực tiếp với hệ quản trị cơ sở dữ liệu để thực hiện các thao tác CRUD (Create, Read, Update, Delete).
2. **View (Giao diện hiển thị):** Chịu trách nhiệm trực quan hóa dữ liệu nhận được từ Controller thành giao diện HTML mà người dùng nhìn thấy trên trình duyệt.
3. **Controller (Bộ điều khiển):** Tiếp nhận yêu cầu từ View/Client, điều phối các thao tác xử lý nghiệp vụ, gọi Model để lấy dữ liệu và chỉ định View tương ứng để render kết quả trả về.

<div align="center">
  <img src="images/hinh_02_mvc.png" alt="Hình 2: Mô hình kiến trúc MVC phân lớp" style="max-width: 70%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><em>Hình 2: Mô hình kiến trúc MVC phân lớp</em></p>
</div>

<div align="center">
  <img src="images/hinh_03_mvc_flow.png" alt="Hình 3: Luồng xử lý một Request trong kiến trúc phân lớp" style="max-width: 85%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><em>Hình 3: Luồng xử lý một Request trong kiến trúc phân lớp</em></p>
</div>

### 4.2. Hiện thực Kiến trúc thực tế trong VAMOS STORE

Để vừa đảm bảo tính module hóa cao vừa tối ưu hóa hiệu năng, hệ thống VAMOS STORE áp dụng mô hình kiến trúc thực thi kết hợp linh hoạt, phù hợp với từng phân hệ nghiệp vụ:

- **Mô hình Ba tầng (Three-Tier Service / Repository Pattern):** Được áp dụng cho các phân hệ nghiệp vụ phức tạp đòi hỏi xử lý giao dịch nguyên tử (ACID Transaction) và quản lý dữ liệu lớn:
  - *Phân hệ Đặt hàng & Hủy đơn:* `OrderService` (`src/services/order.service.js`) quản lý Transaction nguyên tử, khóa bi quan trừ kho, kiểm tra Rule Q8 voucher, tính toán snapshot và kích hoạt hoàn kho.
  - *Phân hệ Danh mục & Sản phẩm:* `ProductService` và `ProductRepository` phụ trách truy vấn dữ liệu sản phẩm, phân trang, lọc đa tiêu chí.
  - *Phân hệ Danh sách yêu thích:* `WishlistService` và `WishlistRepository` quản lý lưu trữ bền vững phía máy chủ.
- **Mô hình Hai tầng trực tiếp (Two-Tier Direct Controller - Database Pattern):** Được áp dụng cho phân hệ Quản trị (`AdminController`) và Giỏ hàng (`CartController`). Bộ điều khiển trực tiếp thực thi các câu lệnh T-SQL tham số hóa thông qua Database Helper (`src/config/database.js`). Mô hình này giúp loại bỏ các lớp bọc (wrapper) trung gian không cần thiết, tăng tốc độ truy vấn và đơn giản hóa việc bảo trì mã nguồn cho các thao tác CRUD quản trị viên.

<div align="center">
  <img src="images/hinh_04_mvc_layers.png" alt="Hình 4: Chi tiết cấu trúc tầng trong kiến trúc phân lớp VAMOS STORE" style="max-width: 85%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><em>Hình 4: Chi tiết cấu trúc tầng trong kiến trúc phân lớp VAMOS STORE</em></p>
</div>

---

## 5. TEMPLATE ENGINE PUG (JADE)

### 5.1. Khái niệm và đặc điểm

Pug (trước đây có tên là Jade) là một công cụ tạo mẫu (Template Engine) hiệu năng cao dành cho Node.js:

- **Cú pháp tối giản dựa trên thụt lề (Indentation-based):** Pug loại bỏ hoàn toàn các thẻ đóng `</...>` và dấu ngoặc nhọn `< >` rườm rà của HTML truyền thống, giúp mã nguồn giao diện gọn gàng hơn từ 30% đến 50%.
- **Kế thừa giao diện (Template Inheritance):** Hỗ trợ cơ chế kế thừa thông qua từ khóa `extends` và ghi đè nội dung theo từng vùng bằng `block`. Điều này cho phép xây dựng một layout khung chuẩn (`layout.pug`) chứa Header, Navigation, Footer dùng chung, các trang con chỉ cần chèn nội dung đặc thù.
- **Tính năng Mixin:** Cho phép đóng gói các đoạn giao diện lặp lại (như Card sản phẩm, Badge trạng thái đơn hàng, Hộp thoại xác nhận) thành các hàm tái sử dụng linh hoạt.

```pug
//- Ví dụ cú pháp Pug kế thừa layout trong VAMOS STORE
extends ../layouts/main.pug

block content
  div(class="container mx-auto px-4 py-8")
    h1(class="text-2xl font-bold text-gray-900") Danh sách giày Sneaker
    div(class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6")
      each product in products
        +productCard(product)
```

---

## 6. CSS FRAMEWORK TAILWIND CSS

### 6.1. Triết lý Utility-first CSS

Khác với các CSS framework truyền thống cung cấp sẵn các component cố định (như Bootstrap hay Semantic UI với các class `.btn`, `.card` bị đóng khung phong cách), Tailwind CSS là một framework theo định hướng **Utility-first**:

- Cung cấp hàng ngàn class tiện ích cấp thấp (low-level utility classes) phản ánh trực tiếp các thuộc tính CSS như khoảng cách (`p-4`, `m-2`), căn chỉnh bố cục Flexbox/Grid (`flex`, `grid-cols-4`), màu sắc (`bg-coral-500`, `text-charcoal-900`), và trạng thái hover/focus (`hover:bg-coral-600`).
- **Khả năng Responsive vượt trội:** Tích hợp sẵn các tiền tố breakpoint (`sm:`, `md:`, `lg:`, `xl:`) giúp điều chỉnh bố cục website mượt mà trên mọi kích thước màn hình mà không cần viết media query thủ công.
- **Tối ưu hóa dung lượng (PurgeCSS / JIT Mode):** Bộ biên dịch Just-In-Time (JIT) của Tailwind chỉ xuất ra các class CSS thực sự được sử dụng trong mã nguồn Pug, giúp file stylesheet production cực nhẹ (thường dưới 20KB), tăng tốc độ tải trang đáng kể.

---

## 7. HỆ QUẢN TRỊ CƠ SỞ DỮ LIỆU MICROSOFT SQL SERVER 2022

### 7.1. Tổng quan về Microsoft SQL Server 2022

Microsoft SQL Server 2022 là hệ quản trị cơ sở dữ liệu quan hệ doanh nghiệp (Enterprise RDBMS) hàng đầu thế giới được phát triển bởi tập đoàn Microsoft, được triển khai chính thức trong dự án qua Docker image `mcr.microsoft.com/mssql/server:2022-latest`:

- **Chuẩn hóa giao dịch ACID toàn diện:** Hỗ trợ đầy đủ các đặc tính toàn vẹn giao dịch **ACID** (Atomicity, Consistency, Isolation, Durability) qua các giao dịch T-SQL an toàn.
- **Khóa bi quan cấp dòng với gợi ý bảng (Table Hints):** Hỗ trợ cú pháp `SELECT ... WITH (UPDLOCK, ROWLOCK)`, cho phép khóa một dòng dữ liệu biến thể trong suốt quá trình giao dịch, ngăn chặn tình trạng hai phiên làm việc đọc cùng một số lượng tồn và dẫn đến Race Condition (bán vượt tồn kho).
- **Thực thi nghiêm ngặt ràng buộc CHECK & FOREIGN KEY:** SQL Server kiểm tra và thực thi chặt chẽ các biểu thức logic `CHECK` (giá tiền không âm, số lượng đặt hàng lớn hơn 0, ngày kết thúc lớn hơn ngày bắt đầu) và ràng buộc toàn vẹn tham chiếu.
- **Bảng mã Unicode `NVARCHAR`:** Hỗ trợ lưu trữ hoàn hảo văn bản tiếng Việt có dấu và bộ ký tự quốc tế.
- **Chỉ mục có điều kiện (Filtered Unique Indexes):** Cho phép tạo ràng buộc duy nhất trên tập con dữ liệu, ví dụ bảo đảm mỗi người dùng chỉ có tối đa một địa chỉ giao hàng mặc định (`WHERE is_default = 1`).

---

## 8. CƠ CHẾ XÁC THỰC VÀ QUẢN LÝ PHIÊN (AUTHENTICATION & SECURITY)

### 8.1. Quản lý phiên làm việc máy chủ (Session-based Authentication)

Hệ thống VAMOS STORE sử dụng thư viện `express-session` để duy trì trạng thái đăng nhập của người dùng:

- Khi người dùng đăng nhập thành công với email và mật khẩu đúng, server khởi tạo một bản ghi session trong bộ nhớ máy chủ (MemoryStore) và cấp một mã định danh phiên ngẫu nhiên (Session ID mang tên cookie `vamos_sid`).
- Session ID được mã hóa và gửi về trình duyệt qua cookie mang cờ `HttpOnly: true` (ngăn chặn mã độc JavaScript phía client đánh cắp cookie qua tấn công XSS) và `SameSite: 'lax'` (cân bằng giữa trải nghiệm điều hướng và bảo vệ chống tấn công giả mạo yêu cầu CSRF).
- Mọi request tiếp theo từ trình duyệt tự động gửi kèm cookie này; middleware phía server (`sessionContextMiddleware`) sẽ đối soát phiên để trích xuất quyền hạn (`req.session.user.role`).

### 8.2. Kỹ thuật băm mật khẩu một chiều với Bcryptjs

- **Nguyên tắc an toàn:** Tuyệt đối không lưu mật khẩu của người dùng dưới dạng văn bản thuần (plaintext) trong cơ sở dữ liệu.
- **Thuật toán Bcrypt:** Là hàm băm mật khẩu thích ứng (adaptive hash function), tích hợp cơ chế tự động sinh chuỗi muối ngẫu nhiên (Salt) và cấu hình chi phí tính toán (Work factor / Salt rounds >= 10). Thuật toán này có khả năng làm chậm tốc độ tính toán của máy tính kẻ tấn công, vô hiệu hóa hoàn toàn các kỹ thuật tấn công tra cứu bảng cầu vồng (Rainbow Table) hoặc tấn công vét cạn (Brute-force).

---

## 9. CÔNG NGHỆ CONTAINER HÓA DOCKER VÀ DOCKER COMPOSE

### 9.1. Khái niệm Container và Docker

Docker là nền tảng ảo hóa mức hệ điều hành (Containerization) cho phép đóng gói toàn bộ mã nguồn ứng dụng, môi trường thực thi Node.js, các gói phụ thuộc (npm dependencies) và cấu hình hệ thống vào một đơn vị độc lập gọi là **Container**.

- Khác với máy ảo truyền thống (Virtual Machine) đòi hỏi cả một hệ điều hành khách (Guest OS) nặng nề, Docker Container chia sẻ chung nhân hệ điều hành máy chủ (Host OS Kernel), giúp khởi động tức thì chỉ trong vài giây và tiêu tốn rất ít tài nguyên phần cứng.

### 9.2. Docker Compose trong VAMOS STORE

Docker Compose là công cụ giúp định nghĩa và vận hành ứng dụng đa container (Multi-container applications) thông qua file cấu hình `docker-compose.yml`:

- **Web Service (`vamos_store_app`):** Container chạy ứng dụng Node.js/Express, kết nối cổng 3000 ra môi trường ngoài.
- **Database Service (`vamos_store_mssql`):** Container chạy hệ quản trị CSDL Microsoft SQL Server 2022 (`mcr.microsoft.com/mssql/server:2022-latest`), cấu hình ổ cứng gắn ngoài (Docker Volume `mssql_data`) để lưu trữ dữ liệu bền vững ngay cả khi container bị khởi động lại.
- **Lợi ích ứng dụng:** Đảm bảo tính nhất quán tuyệt đối của môi trường chạy ứng dụng giữa các máy tính của các thành viên trong nhóm phát triển và máy chủ triển khai ("Build once, run anywhere").
