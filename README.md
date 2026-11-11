# 👟 VAMOS STORE — Website Thương Mại Điện Tử Giày Dép Hiện Đại

> **Dự án phần mềm thương mại điện tử chuyên ngành — VAMOS STORE v1.1**  
> Nền tảng bán lẻ giày sneaker, thể thao và phụ kiện với kiến trúc phân tầng MVC chuẩn mực, giao diện hiện đại (Modern Kinetic UI - Dark Charcoal & Vibrant Coral), hệ thống lưu trữ Microsoft SQL Server 2025 với cơ chế khóa dòng cấp CSDL `WITH (UPDLOCK, ROWLOCK)` chống overselling tuyệt đối.

[![Test Suite](https://img.shields.io/badge/tests-162%20passed-brightgreen.svg)]()
[![Database](https://img.shields.io/badge/database-MSSQL%202025-blue.svg)]()
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green.svg)]()
[![License](https://img.shields.io/badge/version-v1.1.0-orange.svg)]()

---

## 📌 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Công Nghệ Sử Dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
- [Kiến Trúc Dự Án (Architecture)](#-kiến-trúc-dự-án-architecture)
- [Tính Năng Chính Theo Phân Hệ](#-tính-năng-chính-theo-phân-hệ)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Hướng Dẫn Cài Đặt & Khởi Chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
- [Tài Khoản Thử Nghiệm (Demo Accounts)](#-tài-khoản-thử-nghiệm-demo-accounts)
- [Hệ Thống Kiểm Thử Tự Động (162 Tests)](#-hệ-thống-kiểm-thử-tự-động-162-tests)
- [Tài Liệu Kỹ Thuật Đầy Đủ](#-tài-liệu-kỹ-thuật-đầy-đủ)
- [Bản Quyền](#-bản-quyền)

---

## 📖 Giới Thiệu

**VAMOS STORE** là giải pháp website thương mại điện tử toàn diện dành cho thương hiệu giày dép VAMOS ("MOVE YOUR WAY."), tập trung vào phong cách tối giản, tốc độ vượt trội và quy trình quản lý bán hàng chuẩn mực:

- **Thanh toán COD & Giao dịch ACID:** Áp dụng phương thức COD (Cash on Delivery). Giao dịch đặt hàng, kiểm tra số lượng và trừ tồn kho chạy hoàn toàn trong Transaction bảo mật.
- **Quản lý kho Concurrency-Safe:** Sử dụng gợi ý khóa dòng T-SQL `WITH (UPDLOCK, ROWLOCK)` trong SQL Server, loại bỏ hoàn toàn tình trạng bán vượt quá tồn kho (Overselling) khi nhiều khách cùng thanh toán biến thể cuối cùng.
- **Snapshot dữ liệu bất biến:** Lưu trữ bản chụp giá bán, tên sản phẩm, SKU, kích cỡ và màu sắc trong `order_items` tại thời điểm mua, bảo vệ vĩnh viễn doanh thu và lịch sử đơn hàng cũ khi Admin thay đổi giá bán (Q10).
- **Giỏ hàng khách vãng lai & Tự động gộp (Q2):** Cho phép khách chưa đăng nhập thêm hàng vào Session (`guestCart`). Tự động gộp vào CSDL khi đăng nhập/đăng ký.
- **Voucher độc quyền khách hàng (Q8):** Quản lý qua bảng `voucher_usages`, mỗi khách chỉ được dùng 1 voucher đúng 1 lần; tự động hoàn trả quota khi đơn bị hủy.
- **Vô hiệu hóa phiên tức thì khi khóa tài khoản:** Khóa tài khoản khách hàng lập tức hủy Session trên máy chủ và xóa cookie ở request tiếp theo.
- **Thiết kế thương hiệu nhất quán:** Bảng màu 60-30-10: Dark Charcoal (`#151515`), Pure White (`#FFFFFF`), Light Gray (`#F8F9FA`) và Vibrant Coral (`#E94B35`).

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện | Phiên bản | Vai trò kỹ thuật |
| :--- | :--- | :---: | :--- |
| **Runtime** | Node.js (LTS) | v20.x | Môi trường thực thi JavaScript phía máy chủ |
| **Framework** | Express.js | v4.19.x | Định tuyến HTTP, Middleware pipeline, RESTful API |
| **Template Engine** | Pug (Jade) | v3.0.x | Server-Side Rendering (SSR) hiệu năng cao, zero layout shift |
| **Styling** | Tailwind CSS (JIT) | v3.4.x | Utility-first CSS biên dịch tối ưu theo Brand Design System |
| **Database** | Microsoft SQL Server | 2022 / 2025 | Hệ quản trị cơ sở dữ liệu quan hệ (T-SQL, 19 Bảng thực thể) |
| **DB Driver** | `mssql` (Tedious) | v10.x | Connection pooling, Prepared statements, T-SQL Transaction |
| **Authentication** | `bcryptjs` + `express-session` | v2.4.x / v1.18.x | Băm mật khẩu một chiều (salt=10), quản lý phiên làm việc bảo mật |
| **An ninh mạng** | OWASP Top 10 Standards | 2021 | Chống SQLi, Session Fixation, CSRF, IDOR, brute-force |

---

## 🏛 Kiến Trúc Dự Án (Architecture)

Dự án áp dụng mô hình phân tầng **Layered MVC + Repository Pattern** chuyên sâu:

```text
Browser (Desktop / Mobile Client)
      │  HTTP Requests / Responses
      ▼
Express Router (src/routes/)
      │  Middleware Pipeline: auth.middleware (requireAuth, requireAdmin, requireGuest, real-time lock check)
      ▼
Controllers (src/controllers/)
      │  Trích xuất dữ liệu, kiểm tra hợp lệ, điều phối luồng
      ▼
Services (src/services/)
      │  Logic nghiệp vụ: Transaction, Concurrency Locking (UPDLOCK/ROWLOCK), Restocking
      ▼
Repositories (src/repositories/)
      │  Truy xuất dữ liệu: 100% Prepared Statements qua Connection Pool
      ▼
Database (Microsoft SQL Server 2022/2025)
      │  19 Bảng thực thể quan hệ, Constraints, Triggers, Migrations
      ▼
Views (src/views/pages/)
      │  Pug SSR Templates kết hợp Tailwind CSS trả về HTML tĩnh
```

---

## ✨ Tính Năng Chính Theo Phân Hệ

### 1. Dành cho Khách Vãng Lai & Khách Hàng (Guest & Customer)
- **Trang chủ (`/`):** Slider banner chuyển động, danh mục nổi bật, sản phẩm mới nhất, sản phẩm bán chạy.
- **Khám phá sản phẩm (`/products`):** Bộ lọc đa tiêu chí (danh mục, giới tính, khoảng giá, size, màu sắc), thanh tìm kiếm nhanh, sắp xếp giá tăng/giảm, phân trang.
- **Chi tiết sản phẩm (`/products/:slug`):** Bộ sưu tập ảnh phóng to, chọn size & màu sắc thời gian thực, hiển thị tồn kho từng biến thể, mô tả chi tiết.
- **Giỏ hàng linh hoạt (`/cart`):** Lưu trữ trong Session đối với Guest, lưu trong CSDL đối với Customer; tự động gộp giỏ hàng khi đăng nhập (Q2); banner nhắc nhở đăng nhập để đặt hàng.
- **Thanh toán COD an toàn (`/checkout`):** Sổ địa chỉ nhận hàng, áp dụng mã voucher (giới hạn 1 lần/user), tóm tắt đơn hàng, chống bấm double submit.
- **Quản lý đơn hàng (`/orders`, `/orders/:id`):** Tra cứu lịch sử mua sắm, xem snapshot thông tin mặt hàng và giá cứng, theo dõi timeline trạng thái, tự hủy đơn khi trạng thái còn `PENDING` (hệ thống tự động hoàn tồn kho và hoàn quota voucher).
- **Tài khoản cá nhân:** Đăng ký thành viên, đăng nhập an toàn (chống Session Fixation), đổi mật khẩu, khôi phục mật khẩu qua token email.

### 2. Dành cho Quản Trị Viên (Admin Portal)
- **Bảng điều khiển trung tâm (`/admin/dashboard`):** Thống kê số lượng đơn theo 6 trạng thái, tổng doanh thu thực tế từ đơn `COMPLETED`, top 5 sản phẩm bán chạy nhất, danh sách đơn cần xử lý gấp.
- **Quản lý đơn hàng (`/admin/orders`, `/admin/orders/:id`):** Lọc theo trạng thái, chuyển tiếp trạng thái theo State Machine tuần tự (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`), hủy đơn nội bộ kèm lý do bắt buộc (tự động hoàn kho).
- **Quản lý sản phẩm (`/admin/products`, `/admin/products/create`, `/admin/products/:id/edit`):** Danh sách sản phẩm, tạo mới sản phẩm cha kèm bộ biến thể động (Size x Màu x SKU x Tồn kho ban đầu), bật/tắt hiển thị.
- **Quản lý tồn kho (`/admin/inventory`):** Quản lý tồn kho theo biến thể chi tiết, badge cảnh báo sắp hết hàng (`<= 5 đôi`), form điều chỉnh tăng/giảm tồn kho trực tiếp.
- **Nhật ký kiểm toán kho (`/admin/inventory/history`):** Xem lịch sử toàn bộ biến động kho: thời gian, mã SKU, số lượng cũ, mới, chênh lệch, lý do và người thực hiện.
- **Quản lý danh mục & Thương hiệu (`/admin/categories`):** Thêm mới danh mục, cấu hình slug chuẩn SEO, bật/tắt hiển thị, thêm thương hiệu / bộ sưu tập.
- **Quản lý Voucher (`/admin/vouchers`, `/admin/vouchers/create`):** Tạo mới mã giảm giá (% hoặc số tiền), giá trị đơn tối thiểu, thời hạn, bật/tắt hiệu lực, giới hạn 1 lần/khách hàng.
- **Quản lý khách hàng (`/admin/customers`, `/admin/customers/:id`):** Xem danh sách khách hàng, lịch sử mua sắm chi tiết, nút khóa/mở khóa tài khoản với hiệu lực vô hiệu hóa session tức thì (chặn Admin tự khóa chính mình).
- **Quản lý Banners (`/admin/banners`):** Danh sách banner slider trang chủ, thêm mới banner, bật/tắt hiển thị.

---

## 📂 Cấu Trúc Thư Mục

```text
vamos-store/
├── database/                   # Quản lý CSDL Microsoft SQL Server
│   ├── migrations/             # 3 bản migration phiên bản phi hủy diệt
│   │   ├── 001_core_indexes.sql
│   │   ├── 002_fix_order_cascade.sql
│   │   └── 003_voucher_customer_usage.sql
│   ├── seeds/                  # Kịch bản nạp dữ liệu mẫu
│   ├── mssql_schema.sql        # Cấu trúc 19 bảng thực thể chuẩn hóa T-SQL
│   └── run_migrations.js       # Script tự động thực thi migrations
├── docs/                       # Tài liệu kỹ thuật chi tiết
│   ├── analysis/               # Phạm vi, Actors, 14 UCs, Business Rules, Q1-Q10
│   ├── architecture/           # Kiến trúc hệ thống, cấu trúc thư mục, bảo mật OWASP
│   ├── database/               # Thiết kế database, từ điển dữ liệu, ràng buộc & index
│   ├── diagrams/               # Sơ đồ PlantUML (Use Case, Activity, ERD 19 bảng)
│   ├── testing/                # Kế hoạch, kịch bản (162 test cases) và báo cáo test
│   └── ui/                     # Design system (60-30-10) và đặc tả 35 màn hình
├── src/                        # Mã nguồn ứng dụng chính
│   ├── config/                 # Cấu hình CSDL và session
│   ├── controllers/            # Điều phối HTTP (Admin, Auth, Cart, Checkout, Order, Product)
│   ├── middlewares/            # Middleware kiểm soát quyền và an ninh
│   ├── repositories/           # Tầng truy xuất CSDL (Prepared Statements)
│   ├── routes/                 # Định tuyến URL
│   ├── services/               # Nghiệp vụ Transaction & Concurrency Locking
│   ├── views/                  # 35 Pug templates (SSR)
│   └── public/                 # Static assets (Tailwind CSS, Vanilla JS, Images)
├── tests/                      # Bộ kiểm thử tự động toàn diện
│   ├── validate_pug.js         # Kiểm thử biên dịch 35 file Pug
│   ├── validator.test.js       # 14 kiểm thử chuẩn hóa input
│   ├── test_auth_flow.js       # 10 kiểm thử luồng đăng nhập & session
│   └── regression_suite.js     # 103 kiểm thử hồi quy CSDL & nghiệp vụ
├── CHANGELOG_v1.1.md           # Nhật ký thay đổi phiên bản v1.1
├── PROJECT_REVIEW.md           # Báo cáo đánh giá tổng thể toàn bộ dự án
├── README.md                   # Hướng dẫn cài đặt và vận hành
└── server.js                   # Điểm khởi động ứng dụng
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu Cầu Môi Trường
- [Node.js](https://nodejs.org/) phiên bản LTS (v20.x trở lên).
- [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server) (bản 2019, 2022 hoặc 2025) và SQL Server Management Studio (SSMS).
- [Git](https://git-scm.com/).

### 2. Cài Đặt Thư Viện
Mở terminal trong thư mục dự án:
```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường (.env)
Tạo file `.env` từ file mẫu `.env.example`:
```bash
cp .env.example .env
```
Chỉnh sửa thông số kết nối SQL Server trong `.env`:
```env
PORT=3000
NODE_ENV=development
APP_NAME="VAMOS STORE"
APP_URL=http://localhost:3000

SESSION_SECRET=vamos_store_super_secure_session_secret_key_2026

DB_TYPE=mssql
DB_SERVER=127.0.0.1
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=your_strong_password
DB_NAME=vamos_store_db
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

### 4. Khởi Tạo Cơ Sở Dữ Liệu & Migrations
Chạy script migration tự động để tạo 19 bảng thực thể và áp dụng các bản vá bảo toàn dữ liệu:
```bash
node database/init_mssql.js
```
Nạp dữ liệu mẫu (sản phẩm, biến thể, tài khoản, voucher, banner):
```bash
node database/seed_products.js
node database/seed_vouchers.js
```

### 5. Biên Dịch CSS & Khởi Chạy Ứng Dụng
Biên dịch Tailwind CSS:
```bash
npm run build:css
```
Khởi chạy ứng dụng ở chế độ phát triển:
```bash
npm run dev
# Hoặc chạy trực tiếp:
node server.js
```
Mở trình duyệt truy cập: **`http://localhost:3000`**

---

## 👥 Tài Khoản Thử Nghiệm (Demo Accounts)

| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn và phạm vi truy cập |
| :--- | :--- | :---: | :--- |
| **Quản trị viên (Admin)** | `admin@vamos.vn` | `123456` | Toàn quyền Quản trị: Dashboard, Đơn hàng, Sản phẩm, Tồn kho, Voucher, Khách hàng, Banners |
| **Khách hàng mẫu (Customer)** | `khachhang@vamos.vn` | `123456` | Đặt hàng COD, giỏ hàng, áp dụng voucher, theo dõi và hủy đơn cá nhân |

---

## 🧪 Hệ Thống Kiểm Thử Tự Động (162 Tests)

Dự án sở hữu bộ kiểm thử tự động gồm **162 bài test**, chạy trên cơ sở dữ liệu kiểm thử riêng biệt `vamos_store_test_db`:

```bash
# Chạy toàn bộ 162 bài kiểm thử (100% Pass):
npm run test:all
```

Hoặc chạy từng bộ kiểm thử độc lập:
```bash
# 1. Kiểm thử biên dịch cú pháp 35 file Pug:
node tests/validate_pug.js

# 2. Kiểm thử chuẩn hóa dữ liệu Input (Email, SĐT):
node tests/validator.test.js

# 3. Kiểm thử luồng Đăng nhập, Session, Redirect:
node tests/test_auth_flow.js

# 4. Kiểm thử 103 ca hồi quy nghiệp vụ, Concurrency, Snapshot, Voucher Q8:
node tests/regression_suite.js
```

---

## 📑 Tài Liệu Kỹ Thuật Đầy Đủ

- **Đánh giá tổng thể dự án:** [`PROJECT_REVIEW.md`](PROJECT_REVIEW.md)
- **Nhật ký thay đổi v1.1:** [`CHANGELOG_v1.1.md`](CHANGELOG_v1.1.md)
- **Đặc tả yêu cầu & Phân tích nghiệp vụ:** [`docs/analysis/`](docs/analysis/)
- **Kiến trúc hệ thống & Thiết kế bảo mật:** [`docs/architecture/`](docs/architecture/)
- **Thiết kế cơ sở dữ liệu & Data Dictionary:** [`docs/database/`](docs/database/)
- **Kế hoạch & Báo cáo kiểm thử:** [`docs/testing/`](docs/testing/)
- **Hệ thống thiết kế UI & Wireframes:** [`docs/ui/`](docs/ui/)

---

## 📄 Bản Quyền & Giấy Phép

Dự án được xây dựng và phát triển độc lập theo định hướng phong cách thương hiệu VAMOS.  
Bản quyền thuộc về **VAMOS STORE Team © 2026**.
