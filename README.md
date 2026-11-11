# 👟 VAMOS STORE — Website Thương Mại Điện Tử Giày Dép Hiện Đại

> **Đồ án môn học / Dự án phần mềm (JAV102) — FPT Polytechnic Đà Nẵng**  
> Dự án xây dựng nền tảng thương mại điện tử chuyên kinh doanh giày sneaker, thể thao và phụ kiện với kiến trúc phân tầng MVC chuẩn mực, giao diện hiện đại (Modern Kinetic UI) và hệ thống lưu trữ Microsoft SQL Server.

---

## 📌 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Công Nghệ Sử Dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
- [Kiến Trúc Dự Án (Architecture)](#-kiến-trúc-dự-án-architecture)
- [Tính Năng Chính](#-tính-năng-chính)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Hướng Dẫn Cài Đặt & Khởi Chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
- [Tài Khoản Thử Nghiệm (Demo Accounts)](#-tài-khoản-thử-nghiệm-demo-accounts)
- [Tài Liệu Đồ Án & Báo Cáo](#-tài-liệu-đồ-án--báo-cáo)
- [Bản Quyền](#-bản-quyền)

---

## 📖 Giới Thiệu

**VAMOS STORE** là giải pháp website bán lẻ giày trực tuyến tập trung vào trải nghiệm khách hàng trẻ trung, năng động và quy trình quản lý bán hàng chuẩn mực:

- **Thanh toán linh hoạt & an toàn:** Áp dụng phương thức COD (Cash on Delivery - Thanh toán khi nhận hàng) phù hợp với tâm lý mua sắm trực tuyến tại Việt Nam.
- **Quản lý kho thời gian thực:** Cơ chế khóa dòng `WITH (UPDLOCK, ROWLOCK)` trong SQL Server ngăn chặn tuyệt đối tình trạng overselling (bán quá số lượng tồn kho).
- **Thiết kế thương hiệu nhất quán:** Tông màu chủ đạo Đỏ Vamos (`#E11B22`) & Đen Dark Slate (`#0B0F19`), font chữ Space Grotesk kết hợp Inter.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

| Thành phần          | Công nghệ / Thư viện                   | Vai trò                                               |
| ------------------- | -------------------------------------- | ----------------------------------------------------- |
| **Runtime**         | Node.js (v18+)                         | Môi trường thực thi JavaScript phía máy chủ           |
| **Framework**       | Express.js v4                          | Xây dựng RESTful routing và xử lý Middleware          |
| **Template Engine** | Pug (Jade)                             | Render giao diện HTML từ server (SSR)                 |
| **Styling**         | Tailwind CSS v3                        | Framework CSS utility-first biên dịch tối ưu          |
| **Database**        | Microsoft SQL Server 2025              | Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS)             |
| **DB Driver**       | `mssql` (Node.js Tedious)              | Kết nối và thực thi transaction với SQL Server        |
| **Authentication**  | `bcryptjs` + `express-session`         | Mã hóa mật khẩu 1-way hash và quản lý phiên đăng nhập |
| **Validation**      | Regex RFC 5322 + Vietnamese Phone Spec | Kiểm tra hợp lệ dữ liệu đa tầng (Client & Server)     |

---

## 🏛 Kiến Trúc Dự Án (Architecture)

Dự án áp dụng mô hình phân tầng **Layered MVC (Model-View-Controller)** đảm bảo tính tách biệt trách nhiệm (_Separation of Concerns_):

```
Client (Browser)
      │  HTTP Requests / Responses
      ▼
Express Router (src/routes/)
      │  Middleware: Auth, Session, Flash, Roles
      ▼
Controllers (src/controllers/)
      │  Nhận request, validate dữ liệu, điều phối luồng
      ▼
Services (src/services/)
      │  Xử lý logic nghiệp vụ, tính toán đơn hàng, kho
      ▼
Repositories / Database (src/config/database.js)
      │  Truy vấn SQL Parameterized, Transaction, Lock dòng
      ▼
Views (src/views/pages/)
      │  Render giao diện Pug SSR trả về cho người dùng
```

---

## ✨ Tính Năng Chính

### 1. Dành cho Khách Hàng (Customer & Guest)

- **Trang chủ (Home):** Hero banner chuyển động, danh mục nổi bật, sản phẩm bán chạy, chiến dịch thương hiệu.
- **Bộ lọc sản phẩm (Catalog):** Lọc theo Danh mục (Sneaker Nam, Nữ, Thể Thao, Sandal), Giới tính, Khoảng giá, Sắp xếp giá tăng/giảm.
- **Chi tiết sản phẩm (Product Detail):** Chọn màu sắc, chọn size giày thời gian thực, hiển thị số lượng tồn kho còn lại, hướng dẫn chọn size.
- **Giỏ hàng (Shopping Cart):** Giỏ hàng lưu trữ liên tục (persistent cart) theo tài khoản trong SQL Server, tính tổng tiền tự động.
- **Thanh toán (Checkout):** Áp dụng mã Voucher giảm giá (`VAMOS50K`, `VAMOS100`, `FREESHIP`), điền địa chỉ nhận hàng, phương thức COD.
- **Quản lý đơn hàng:** Xem lịch sử đơn hàng, chi tiết đơn mua, trạng thái vận chuyển, hủy đơn hàng khi trạng thái còn `PENDING` (hệ thống tự động hoàn lại tồn kho).
- **Bảo mật xác thực:** Đăng ký thành viên, đăng nhập an toàn, xác thực định dạng email, mật khẩu và số điện thoại nghiêm ngặt.

### 2. Dành cho Quản Trị Viên (Admin)

- **Bảng điều khiển (Dashboard):** Thống kê tổng doanh thu thực tế, số lượng đơn hàng, số khách hàng và sản phẩm.
- **Quản lý đơn hàng (Orders):** Xem danh sách tất cả đơn hàng, chuyển đổi trạng thái (Chờ xác nhận $\rightarrow$ Đã xác nhận $\rightarrow$ Đang giao $\rightarrow$ Hoàn tất / Đã hủy). Đơn COD chỉ chuyển thành `PAID` khi giao hàng thành công.

---

## 📂 Cấu Trúc Thư Mục

```
vamos-store/
├── database/                   # Kịch bản cơ sở dữ liệu
│   ├── migrations/             # Thư mục Migration phiên bản phi hủy diệt
│   │   ├── 001_initial_schema.sql
│   │   └── 002_add_filtered_indexes.sql
│   ├── mssql_schema.sql        # Cấu trúc bảng SQL Server 2025 (chuẩn T-SQL)
│   ├── init_mssql.js           # Script tự động kiểm tra CSDL và chạy migration
│   ├── seed_products.js        # Script nạp dữ liệu sản phẩm và biến thể mẫu
│   ├── seed_vouchers.js        # Script nạp mã voucher mẫu (VAMOS50K, FREESHIP,...)
│   └── seed_customer.js        # Script tạo tài khoản khách hàng mẫu
├── docs/                       # Tài liệu phân tích và thiết kế
│   ├── analysis/               # Đặc tả yêu cầu phần mềm (SRS & Use Cases)
│   ├── audit/                  # Hồ sơ kiểm toán toàn diện & kết quả kiểm thử
│   │   ├── INITIAL_AUDIT.md
│   │   ├── REPAIR_PLAN.md
│   │   ├── REPAIR_LOG.md
│   │   ├── TEST_RESULTS.md
│   │   └── FINAL_AUDIT_REPORT.md
│   ├── database/               # Thiết kế CSDL và Data Dictionary
│   ├── diagrams/               # Sơ đồ Use-case, ERD, Activity, Sequence
│   └── ui/                     # Thiết kế Wireframe giao diện
├── labs/                       # 4 bài Lab môn học (FPT Polytechnic)
├── report/                     # Báo cáo đồ án chính thức (6 chương)
├── src/                        # Mã nguồn chính ứng dụng
│   ├── config/                 # Cấu hình hệ thống và kết nối MSSQL Pool
│   ├── controllers/            # Tầng Controller (Auth, Product, Cart, Order, Admin)
│   ├── middlewares/            # Middleware (auth, role, anti-CSRF token)
│   ├── public/                 # Static assets (CSS Tailwind, JS, Images, Icons)
│   ├── routes/                 # Định tuyến URL theo từng module
│   ├── services/               # Tầng Service xử lý logic đơn hàng & kho
│   ├── utils/                  # Tiện ích kiểm tra (Validator)
│   └── views/                  # Giao diện Pug templates (SSR)
├── tests/                      # Bộ kiểm thử hồi quy & tích hợp tự động
│   ├── setup_test_db.js        # Khởi tạo và nạp dữ liệu test DB riêng biệt
│   └── regression_suite.js     # 86 ca kiểm thử hồi quy tự động
├── .env.example                # Mẫu biến môi trường phát triển
├── .env.test.example           # Mẫu biến môi trường kiểm thử độc lập
├── .gitignore                  # Cấu hình loại trừ file rác / nhạy cảm
├── docker-compose.yml          # Triển khai container MSSQL Server 2022
├── Dockerfile                  # Container hóa ứng dụng Node.js
├── package.json                # Danh sách thư viện phụ thuộc & scripts
├── PROJECT_CONTEXT_FOR_AI.md   # Tài liệu tổng hợp toàn diện bối cảnh cho AI
├── server.js                   # Điểm khởi động ứng dụng (Entry point)
└── tailwind.config.js          # Cấu hình Tailwind CSS v3
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu Cầu Hệ Thống

- [Node.js](https://nodejs.org/) phiên bản 18.x trở lên.
- [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server) (bản 2019, 2022 hoặc 2025) và SQL Server Management Studio (SSMS).

### 2. Cài Đặt Thư Viện

Mở terminal trong thư mục dự án và chạy:

```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường (.env)

Tạo file `.env` từ file mẫu `.env.example`:

```bash
cp .env.example .env
```

Chỉnh sửa thông số kết nối SQL Server trong `.env` cho phù hợp với máy của bạn:

```env
PORT=3000
NODE_ENV=development
APP_NAME="VAMOS STORE"
APP_URL=http://localhost:3000

SESSION_SECRET=replace_with_a_secure_random_session_secret_at_least_32_characters

DB_TYPE=mssql
DB_SERVER=127.0.0.1
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=replace_with_your_strong_sql_server_password
DB_NAME=vamos_store_db
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

### 4. Khởi Tạo Cơ Sở Dữ Liệu

Hệ thống sử dụng cơ chế **Migration theo phiên bản phi hủy diệt** (`database/migrations/`) và tự động kiểm tra database qua `master`:

```bash
# Khởi tạo hoặc cập nhật database vamos_store_db:
node database/init_mssql.js

# Nạp dữ liệu mẫu (sản phẩm, tài khoản, voucher):
node database/seed_products.js
node database/seed_vouchers.js
```

> **Gợi ý chạy qua Docker:** Bạn cũng có thể khởi chạy nhanh bằng Docker Compose:
> ```bash
> docker compose up -d
> ```

### 5. Biên Dịch CSS (Tailwind) & Chạy Server

Biên dịch CSS:

```bash
npm run build:css
```

Khởi chạy ứng dụng:

```bash
npm run dev
# Hoặc chạy trực tiếp:
node server.js
```

Truy cập trình duyệt tại: **`http://localhost:3000`**

### 6. Chạy Bộ Kiểm Thử Hồi Quy Tự Động (Regression Tests)

Hệ thống tích hợp **86 kịch bản kiểm thử tự động** chạy trên cơ sở dữ liệu kiểm thử độc lập `vamos_store_test_db` (không làm ô nhiễm `vamos_store_db`):

```bash
npm test
# Hoặc chạy trực tiếp:
node tests/regression_suite.js
```

---

## 👥 Tài Khoản Thử Nghiệm (Demo Accounts)

| Vai trò                       | Email đăng nhập      | Mật khẩu | Quyền truy cập                                      |
| ----------------------------- | -------------------- | -------- | --------------------------------------------------- |
| **Quản trị viên (Admin)**     | `admin@vamos.vn`     | `123456` | Toàn quyền trang Admin (`/admin`), quản lý đơn hàng |
| **Khách hàng mẫu (Customer)** | `khachhang@vamos.vn` | `123456` | Đặt hàng, giỏ hàng, xem lịch sử đơn hàng cá nhân    |

---

## 📑 Tài Liệu Đồ Án & Báo Cáo

- Báo cáo đồ án chi tiết đầy đủ 6 chương nằm trong thư mục [`report/BAO_CAO_DATN_VAMOS_STORE.md`](report/BAO_CAO_DATN_VAMOS_STORE.md).
- Bản in báo cáo định dạng chuẩn trình bày tại [`report/BAO_CAO_VAMOS_STORE_PRINT.html`](report/BAO_CAO_VAMOS_STORE_PRINT.html).
- Toàn bộ hồ sơ 4 bài Lab môn học (Usecase, ERD, Activity, Wireframe) được lưu trữ đầy đủ trong thư mục [`labs/`](labs/).

---

## 📄 Bản Quyền

Dự án được xây dựng và phát triển bởi Nhóm sinh viên chuyên ngành Phát triển phần mềm — **FPT Polytechnic Đà Nẵng**.  
Bản quyền thuộc về **VAMOS STORE Team © 2026**.
