# NHẬT KÝ THAY ĐỔI PHIÊN BẢN (CHANGELOG) - VAMOS STORE

Tất cả các thay đổi quan trọng của dự án VAMOS STORE được ghi nhận chi tiết tại tài liệu này.

---

## [v1.1.0] - 2026-11-11

### Chuẩn hóa Toàn diện, Sửa lỗi Nghiệp vụ & Hoàn thiện Hệ thống

Phiên bản v1.1 đánh dấu cột mốc hoàn thiện toàn diện dự án theo Kế hoạch v1.1 (Master Plan v1.1), bảo đảm 100% mã nguồn, cơ sở dữ liệu, giao diện và tài liệu kỹ thuật đồng bộ và vượt qua 162 bài kiểm thử tự động.

### 1. Chuẩn hóa Phân quyền & Tác nhân (Actors & RBAC)

- **Chuẩn hóa 3 Human Actors chính:** `Guest` (Khách vãng lai), `Customer` (Khách hàng), `Admin` (Quản trị viên kiêm vận hành).
- **Hợp nhất vai trò:** Loại bỏ phân tách vai trò `Staff` riêng biệt; toàn bộ quyền hạn vận hành đơn hàng, kho và sản phẩm được chuyển giao cho `Admin`.
- **Bổ sung Secondary Actor:** `Email Service` (dịch vụ gửi email thông báo mã khôi phục mật khẩu).
- **Khóa tài khoản thời gian thực (Real-time Session Invalidation):** Khi tài khoản bị Admin chuyển sang `'locked'`, middleware `requireAuth` kiểm tra trực tiếp trong CSDL, lập tức hủy Session trên máy chủ (`req.session.destroy`) và xóa cookie `vamos_sid`.
- **Bảo vệ quyền Admin:** Thêm chốt chặn không cho phép Admin tự khóa tài khoản của chính mình.

### 2. Cải tiến Giỏ hàng & Luồng Mua sắm (Guest Cart & Checkout - Q2)

- **Giỏ hàng Khách vãng lai (Session Cart):** Cho phép Guest duyệt hàng, chọn size/màu và lưu sản phẩm vào `req.session.guestCart` mà không bắt buộc đăng nhập ngay.
- **Tự động Gộp giỏ hàng (Auto-Merge Cart):** Khi Guest đăng nhập hoặc đăng ký tài khoản thành công, hàm `CartController.mergeGuestCart` tự động chuyển các mặt hàng từ Session vào CSDL (`cart_items`), cộng dồn số lượng và kiểm tra tồn kho khả dụng thời gian thực.
- **Trải nghiệm Giỏ hàng:** Bổ sung banner thông báo tại trang `/cart` nhắc nhở Guest đăng nhập để tiến hành đặt hàng COD.
- **Xử lý Lỗi Checkout An toàn:** Controller `/checkout` bắt lỗi xác thực và nghiệp vụ (thiếu địa chỉ, số điện thoại không hợp lệ, biến thể hết hàng) và re-render giao diện kèm thông báo lỗi rõ ràng và giữ lại dữ liệu form, không làm sập trang thành mã lỗi 500.
- **Chống Submit trùng lặp (Double-Click Protection):** Bổ sung JavaScript vô hiệu hóa nút đặt hàng sau lần bấm đầu tiên.

### 3. Quy tắc Mã Giảm giá Độc quyền Khách hàng (Voucher Usage - Q8)

- **Bảng CSDL mới `voucher_usages`:** Tạo bảng thứ 19 lưu trữ lịch sử áp dụng voucher theo từng tài khoản với ràng buộc duy nhất `UNIQUE(voucher_id, user_id)`.
- **Chặn dùng lại:** Mỗi khách hàng chỉ được phép sử dụng một mã voucher tối đa 01 lần duy nhất trong toàn hệ thống.
- **Phục hồi Quota khi Hủy đơn:** Khi khách hàng hoặc Admin hủy đơn hàng (`CANCELLED`), hệ thống tự động xóa bản ghi trong `voucher_usages` và giảm `used_count` của voucher, cho phép khách hàng sử dụng lại ưu đãi cho đơn hàng sau.

### 4. Hoàn thiện Toàn diện Phân hệ Quản trị (Admin Portal)

- Triển khai đầy đủ 10 màn hình và 22 route quản trị bảo vệ bởi `requireAdmin`:
  - **Dashboard (`/admin/dashboard`):** Thống kê số lượng đơn theo 6 trạng thái, doanh thu thực tế từ đơn `COMPLETED`, danh sách 5 sản phẩm bán chạy nhất.
  - **Quản lý Đơn hàng (`/admin/orders`, `/admin/orders/:id`):** Lọc đơn theo trạng thái, cập nhật trạng thái theo State Machine, hủy đơn nội bộ kèm lý do bắt buộc.
  - **Quản lý Sản phẩm (`/admin/products`, `/admin/products/create`, `/admin/products/:id/edit`):** Danh sách sản phẩm, tạo mới và chỉnh sửa thông tin cha kèm bộ biến thể Size x Màu x SKU x Giá x Ảnh.
  - **Quản lý Tồn kho (`/admin/inventory`):** Hiển thị danh sách tồn kho theo từng biến thể, hiển thị badge cảnh báo tồn kho thấp (`<= 5`), form điều chỉnh tăng/giảm kho trực tiếp.
  - **Nhật ký Kiểm toán Kho (`/admin/inventory/history`):** Xem lịch sử toàn bộ biến động kho với đầy đủ lý do và người thực hiện.
  - **Quản lý Danh mục & Thương hiệu (`/admin/categories`):** Thêm mới danh mục, cấu hình slug, bật/tắt hiển thị, thêm mới thương hiệu / bộ sưu tập.
  - **Quản lý Voucher (`/admin/vouchers`, `/admin/vouchers/create`):** Bảng danh sách voucher, tạo mới voucher (giảm %, giảm tiền, đơn tối thiểu, thời hạn), bật/tắt kích hoạt.
  - **Quản lý Khách hàng (`/admin/customers`, `/admin/customers/:id`):** Danh sách khách hàng, xem chi tiết lịch sử mua sắm và sổ địa chỉ, nút khóa/mở khóa tài khoản với hiệu lực tức thì.
  - **Quản lý Banners (`/admin/banners`):** Danh sách banner slider trang chủ, thêm mới banner, bật/tắt hiển thị.
  - **Thanh điều hướng Quản trị (`partials/admin-nav.pug`):** Tích hợp thanh tab chuyển đổi mượt mà giữa tất cả các phân hệ quản trị.

### 5. Cơ sở Dữ liệu & Migrations (Microsoft SQL Server)

- **Tệp Migration `003_voucher_customer_usage.sql`:** Tạo bảng `voucher_usages` có kiểm tra tồn tại và `ON DELETE CASCADE` với `orders(id)`.
- **Cập nhật `mssql_schema.sql`:** Chuẩn hóa toàn bộ 19 bảng thực thể theo chuẩn T-SQL Microsoft SQL Server.
- **Chuẩn hóa Từ điển Dữ liệu (`data-dictionary.md`):** Chuyển đổi toàn bộ định dạng bảng từ MySQL sang Microsoft SQL Server (`NVARCHAR`, `DATETIME2`, `DECIMAL(12,0)`, `BIT`, `INT IDENTITY(1,1)`).

### 6. Kiểm thử Tự động (Automated Testing QA)

- Mở rộng bộ kiểm thử lên **162 bài kiểm thử tự động**, đạt tỷ lệ **100% PASSED**:
  - `tests/validate_pug.js`: 35/35 templates biên dịch không lỗi cú pháp.
  - `tests/validator.test.js`: 14/14 kiểm thử chuẩn hóa input.
  - `tests/test_auth_flow.js`: 10/10 kiểm thử luồng đăng nhập, session fixation, requireGuest.
  - `tests/regression_suite.js`: 103/103 kiểm thử hồi quy bao gồm 4 suites mới:
    - Suite 11: `GCART-01..03` (Giỏ hàng session và merge giỏ khi đăng nhập).
    - Suite 12: `Q8-01..06` (Giới hạn voucher 1 lần/user và hoàn quota khi hủy đơn).
    - Suite 13: `INV-01..02` (Admin điều chỉnh tồn kho và ghi log kiểm toán).
    - Suite 14: `LOCK-01..04` (Khóa tài khoản real-time invalidation và bảo vệ Admin self-lock).

### 7. Đồng bộ Tài liệu Kỹ thuật & Sơ đồ Thiết kế

- Cập nhật toàn bộ tài liệu trong thư mục `docs/`:
  - `docs/analysis/` (01 đến 06): Đóng tất cả các câu hỏi Q1–Q10 sang trạng thái ĐÃ GIẢI QUYẾT.
  - `docs/diagrams/`: Cập nhật ERD (19 bảng), Use Case Diagram tổng quan, Activity Diagrams (Auth flow, Checkout COD, Order cancellation).
  - `docs/database/`: Bổ sung `database-design.md`, `constraints-and-indexes.md`, cập nhật `data-dictionary.md`.
  - `docs/architecture/`: Bổ sung `system-architecture.md`, `folder-structure.md`, `security-design.md`.
  - `docs/testing/`: Bổ sung `test-plan.md`, `test-cases.md`, `test-report.md`.
  - `docs/ui/`: Bổ sung `design-system.md`, `page-specifications.md`.
- Tạo mới `PROJECT_REVIEW.md` tổng hợp toàn diện dự án.
- Cập nhật `README.md` chính.
