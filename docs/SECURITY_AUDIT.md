# BÁO CÁO KIỂM TOÁN AN TOÀN THÔNG TIN (SECURITY AUDIT) — VAMOS STORE

**Ngày lập:** 12/11/2026  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 (2021/2025) & Microsoft Security Best Practices  
**Hệ thống mục tiêu:** VAMOS STORE (Node.js / Express / MS SQL Server)

---

## 1. TỔNG QUAN VÀ MỤC TIÊU

Báo cáo kiểm toán bảo mật này đánh giá khả năng phòng thủ của hệ thống thương mại điện tử VAMOS STORE trước các mối đe dọa phổ biến trên môi trường web, bao gồm:

- Injection (SQLi, Command Injection).
- Broken Authentication & Session Management.
- Cross-Site Scripting (XSS).
- Cross-Site Request Forgery (CSRF).
- Broken Object Level Authorization (BOLA / IDOR).
- Security Misconfiguration & Information Disclosure.
- Concurrency Race Conditions & Business Logic Flaws.

---

## 2. KẾT QUẢ ĐÁNH GIÁ CHI TIẾT THEO CÁC HẠNG MỤC

### 2.1. Xác thực và Quản lý Phiên (Authentication & Session Security)

- **Cơ chế:** Quản lý phiên thông qua `express-session` với cookie session ID `vamos_sid`.
- **Cấu hình Cookie:**
  - `httpOnly: true` — Chống tấn công đánh cắp cookie session qua JavaScript (XSS Cookie Theft).
  - `sameSite: 'lax'` — Chống CSRF cookie injection từ bên ngoài.
  - `secure: isProduction` — Đảm bảo chỉ truyền cookie qua kênh mã hóa HTTPS ở môi trường production.
  - `maxAge: 7 ngày`.
- **Chống Session Fixation:** Sử dụng `req.session.regenerate()` ngay khi đăng nhập thành công.
- **Hủy phiên triệt để khi đăng xuất:** `req.session.destroy()` kết hợp lệnh xóa cookie phản hồi: `res.clearCookie('vamos_sid')`.
- **Chống khóa tài khoản ngầm:** Middleware `requireAuth` chủ động truy vấn trạng thái `users.status`. Nếu tài khoản bị Admin chuyển sang `locked`, phiên làm việc bị lập tức thu hồi và hủy bỏ ngay lập tức (Zero-Trust Session Invalidation).

### 2.2. Phân quyền và Kiểm soát Truy cập (Authorization & BOLA / IDOR Defense)

- **Phân định 3 nhóm người dùng rõ ràng:** `Guest`, `Customer`, `Admin`.
- **Bảo vệ API Quản trị:** Middleware `requireAdmin` chặn toàn bộ truy cập không có vai trò `ADMIN` ở tầng server.
- **Bảo vệ quyền sở hữu đơn hàng (Order Ownership):**
  - Mọi hàm truy vấn lịch sử hoặc chi tiết đơn hàng của Customer (`orderService.getOrderDetails`) đều bắt buộc kèm điều kiện:
    ```sql
    WHERE (o.id = @orderId OR o.order_code = @orderCode) AND o.user_id = @userId
    ```
  - Khách hàng tuyệt đối không thể xem, sửa hoặc hủy đơn hàng của khách hàng khác bằng cách thay đổi ID trên URL (chống IDOR).

### 2.3. Phòng chống tấn công CSRF (Cross-Site Request Forgery)

- **Middleware:** `csrfMiddleware` tại `src/middlewares/csrf.middleware.js`.
- **Quy tắc:**
  - Mọi phương thức thay đổi trạng thái (`POST`, `PUT`, `DELETE`, `PATCH`) bắt buộc phải gửi kèm token `_csrf` trùng khớp với token được lưu trong session (`crypto.randomBytes(24)`).
  - Các yêu cầu đọc (`GET`, `HEAD`, `OPTIONS`) là an toàn (safe methods) và không thay đổi trạng thái cơ sở dữ liệu.
  - Xử lý lỗi CSRF trả về HTTP 403 với thông báo rõ ràng, không làm gián đoạn hệ thống.

### 2.4. Phòng chống SQL Injection (SQLi)

- **Nguyên tắc:** 100% các truy vấn cơ sở dữ liệu đều sử dụng **Parameterized Queries** thông qua driver `mssql` (`sql.Request.input(name, type, value)` và hàm tiện ích `query(sqlStr, params)`).
- **Bộ lọc & Sắp xếp (Sorting & Whitelisting):**
  - Trong `ProductRepository.findAll`, tham số `sort` được đối chiếu theo danh sách trắng (whitelist): chỉ chấp nhận `price_asc`, `price_desc`, `name_asc`; mọi giá trị khác tự động fallback về `ORDER BY p.id DESC`.
  - Tham số tìm kiếm `search` được truyền dưới dạng `@search` kết hợp `%${search}%`, không bao giờ nối chuỗi trực tiếp vào câu lệnh SQL.

### 2.5. Phòng chống Cross-Site Scripting (XSS)

- **Tầng Server (Pug Template Engine):** Mặc định Pug tự động encode HTML entities cho cú pháp `#{variable}`.
- **Tầng Client (Live Search Engine):**
  - Loại bỏ hoàn toàn việc gán chuỗi động vào `innerHTML`.
  - Toàn bộ dropdown tìm kiếm sử dụng DOM API chuẩn: `document.createElement`, `document.createTextNode`, `textContent`.
  - Hàm làm nổi bật từ khóa `safeAppendHighlightedText` chia tách chuỗi và tạo các text nodes kết hợp thẻ `span`, đảm bảo bất kỳ mã độc nào (ví dụ `<script>`, `<img onerror=alert(1)>`) đều chỉ được hiển thị dưới dạng văn bản thường, không thể thực thi.
  - Xác thực đường dẫn ảnh (`getSafeImageUrl`) chỉ cho phép giao thức `http:`, `https:` hoặc đường dẫn nội bộ `/images/`, ngăn chặn triệt để giao thức giả mạo `javascript:`.

### 2.6. Xử lý Tranh chấp Tồn kho và Tính nhất quán Dữ liệu (Concurrency & Race Conditions)

- **Cơ chế Khóa dòng trong Giao dịch ACID:**
  - Trong `order.service.js`, quy trình đặt hàng COD được bao bọc trong `sql.Transaction`.
  - Áp dụng gợi ý khóa `WITH (UPDLOCK, ROWLOCK)` khi đọc giỏ hàng, đọc voucher và đọc biến thể sản phẩm.
  - Trừ tồn kho có điều kiện: kiểm tra `currentStock >= quantity` trước khi thực thi `UPDATE product_variants SET stock_quantity = stock_quantity - @qty`.
  - Đảm bảo `ROLLBACK` toàn bộ nếu có bất kỳ sản phẩm nào không đủ tồn kho hoặc voucher bị cạnh tranh hết lượt sử dụng.

### 2.7. Cấu hình HTTP Security Headers

- Ứng dụng Express đã vô hiệu hóa cờ `X-Powered-By` (`app.disable('x-powered-by')`).
- Tích hợp các tiêu đề bảo mật chuẩn OWASP:
  - `X-Content-Type-Options: nosniff` — Chặn MIME-sniffing.
  - `X-Frame-Options: SAMEORIGIN` — Chống Clickjacking.
  - `X-XSS-Protection: 1; mode=block` — Kích hoạt bộ lọc XSS của trình duyệt.
  - `Referrer-Policy: strict-origin-when-cross-origin` — Bảo vệ URL referrer.

---

## 3. KẾT LUẬN KIỂM TOÁN

Hệ thống VAMOS STORE đáp ứng các tiêu chuẩn bảo mật khắt khe của ứng dụng thương mại điện tử hiện đại. Không còn lỗ hổng nghiêm trọng ở tầng Client hay Server.
