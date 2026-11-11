# CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT FOLDER STRUCTURE) - VAMOS STORE

> **Dự án:** VAMOS STORE - E-commerce Footwear System  
> **Phiên bản:** v1.1 Chuẩn hóa

---

## 1. CÂY THƯ MỤC TỔNG QUAN

```text
vamos-store/
├── database/                   # Quản lý CSDL Microsoft SQL Server
│   ├── migrations/             # Các tệp vá cấu trúc CSDL theo phiên bản
│   │   ├── 001_core_indexes.sql
│   │   ├── 002_fix_order_cascade.sql
│   │   └── 003_voucher_customer_usage.sql
│   ├── seeds/                  # Dữ liệu mẫu (Tài khoản, Danh mục, Sản phẩm, Biến thể)
│   │   └── seed_data.sql
│   ├── mssql_schema.sql        # Toàn bộ schema T-SQL 19 bảng thực thể chuẩn hóa
│   └── run_migrations.js       # Script Node.js tự động áp dụng migration
│
├── docs/                       # Toàn bộ tài liệu phân tích, kiến trúc, kiểm thử
│   ├── analysis/               # Phân tích nghiệp vụ, phạm vi, actors, use cases
│   │   ├── 01-project-scope.md
│   │   ├── 02-actors.md
│   │   ├── 03-use-case-catalog.md
│   │   ├── 04-use-case-specifications.md
│   │   ├── 05-business-rules.md
│   │   └── 06-open-questions.md
│   ├── architecture/           # Thiết kế kiến trúc, cấu trúc thư mục, bảo mật
│   │   ├── system-architecture.md
│   │   ├── folder-structure.md
│   │   └── security-design.md
│   ├── database/               # Thiết kế database, từ điển dữ liệu, ràng buộc
│   │   ├── database-design.md
│   │   ├── data-dictionary.md
│   │   ├── constraints-and-indexes.md
│   │   └── database-design-review.md
│   ├── diagrams/               # Sơ đồ PlantUML (Use Case, Activity, ERD)
│   │   ├── activity/           # Sơ đồ hoạt động các luồng quan trọng
│   │   ├── erd/                # Sơ đồ quan hệ thực thể (ERD 19 bảng)
│   │   └── use-case/           # Sơ đồ phân rã Use Case theo phân hệ
│   ├── testing/                # Kế hoạch, kịch bản và báo cáo kiểm thử
│   │   ├── test-plan.md
│   │   ├── test-cases.md
│   │   └── test-report.md
│   └── ui/                     # Đặc tả giao diện, design system, wireframe
│       ├── design-system.md
│       ├── page-specifications.md
│       └── wireframe_specifications.md
│
├── src/                        # Mã nguồn ứng dụng chính (Backend & Frontend SSR)
│   ├── config/                 # Cấu hình CSDL, môi trường, session
│   │   ├── db.config.js        # Cấu hình kết nối mssql connection pool
│   │   └── session.config.js   # Cấu hình express-session cookie
│   ├── controllers/            # Tầng điều phối yêu cầu HTTP
│   │   ├── admin.controller.js # Quản trị Dashboard, SP, Kho, Đơn, Voucher, KH, Banner
│   │   ├── auth.controller.js  # Đăng ký, Đăng nhập, Đăng xuất, Quên MK, Gộp giỏ khách
│   │   ├── cart.controller.js  # Giỏ hàng Session & CSDL, thêm/sửa/xóa, merge logic
│   │   ├── checkout.controller.js # Đặt hàng COD, áp dụng voucher, xử lý lỗi an toàn
│   │   ├── home.controller.js  # Trang chủ, banner slider, danh mục nổi bật
│   │   ├── order.controller.js # Tra cứu đơn hàng, chi tiết đơn, khách tự hủy đơn
│   │   └── product.controller.js # Duyệt danh mục, tìm kiếm, lọc size/màu, chi tiết SP
│   ├── middlewares/            # Middleware pipeline
│   │   ├── auth.middleware.js  # requireAuth, requireAdmin, requireGuest, real-time lock
│   │   ├── error.middleware.js # Bắt lỗi toàn cục (Global Exception Handler)
│   │   └── validate.middleware.js # Kiểm tra dữ liệu đầu vào phía Server
│   ├── models/                 # Định nghĩa các model đối tượng (nếu có)
│   ├── repositories/           # Tầng truy xuất CSDL thuần túy (T-SQL Prepared Statements)
│   │   ├── admin.repository.js
│   │   ├── auth.repository.js
│   │   ├── cart.repository.js
│   │   ├── order.repository.js
│   │   ├── product.repository.js
│   │   └── user.repository.js
│   ├── routes/                 # Định tuyến URL
│   │   ├── admin.routes.js     # /admin/* (Dashboard, Products, Orders, Inventory, etc.)
│   │   ├── auth.routes.js      # /auth/* (login, register, logout, forgot-password)
│   │   ├── cart.routes.js      # /cart/* (view, add, update, remove)
│   │   ├── checkout.routes.js  # /checkout/* (view form, submit COD order)
│   │   ├── home.routes.js      # / (trang chủ)
│   │   ├── order.routes.js     # /orders/* (lịch sử, chi tiết, hủy đơn)
│   │   └── product.routes.js   # /products/* (danh sách, tìm kiếm, chi tiết)
│   ├── services/               # Tầng nghiệp vụ xử lý giao dịch & quy tắc nghiệp vụ
│   │   └── order.service.js    # Tạo đơn COD, khóa tồn kho, hoàn kho khi hủy, voucher
│   ├── utils/                  # Tiện ích bổ trợ (format tiền tệ, slug generator, logger)
│   ├── views/                  # Giao diện Pug Templates (35 templates)
│   │   ├── layouts/            # Layout khung chính (main-layout.pug, admin-layout.pug)
│   │   ├── pages/              # Màn hình chi tiết các phân hệ
│   │   │   ├── admin/          # 10 màn hình Admin Portal
│   │   │   ├── auth/           # Màn hình login, register, forgot-password, reset
│   │   │   ├── cart/           # Màn hình giỏ hàng
│   │   │   ├── checkout/       # Màn hình thanh toán COD & hoàn tất
│   │   │   ├── home/           # Màn hình trang chủ
│   │   │   ├── orders/         # Màn hình lịch sử & chi tiết đơn hàng cá nhân
│   │   │   └── products/       # Màn hình danh sách & chi tiết sản phẩm
│   │   └── partials/           # Thành phần dùng chung (header, footer, admin-nav, alerts)
│   ├── public/                 # Static assets phục vụ trình duyệt
│   │   ├── css/                # style.css (được build từ Tailwind CSS)
│   │   ├── js/                 # main.js (ngăn double click form, tương tác modal)
│   │   └── images/             # Ảnh logo, placeholder sản phẩm
│   └── app.js                  # Điểm khởi động ứng dụng Express (Express Application Entry)
│
├── tests/                      # Bộ kiểm thử tự động toàn diện (162 automated tests)
│   ├── regression_suite.js     # 103 kịch bản kiểm thử hồi quy nghiệp vụ (14 suites)
│   ├── test_auth_flow.js       # 10 kiểm thử luồng đăng nhập, session, redirect
│   ├── validate_pug.js         # 35 kiểm thử biên dịch cú pháp tất cả file Pug
│   └── validator.test.js       # 14 kiểm thử chuẩn hóa dữ liệu email, số điện thoại
│
├── .env.example                # File mẫu biến môi trường
├── CHANGELOG_v1.1.md           # Nhật ký thay đổi phiên bản v1.1
├── PROJECT_REVIEW.md           # Báo cáo đánh giá tổng thể toàn bộ dự án
├── README.md                   # Tài liệu hướng dẫn cài đặt và vận hành hệ thống
├── package.json                # Quản lý dependencies và scripts chạy lệnh
└── tailwind.config.js          # Cấu hình Tailwind CSS và bảng màu thương hiệu
```
