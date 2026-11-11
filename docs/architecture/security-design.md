# THIẾT KẾ AN TOÀN THÔNG TIN & BẢO MẬT (SECURITY DESIGN) - VAMOS STORE

> **Hệ thống:** VAMOS STORE  
> **Tiêu chuẩn tham chiếu:** OWASP Top 10 Web Application Security Risks  
> **Phiên bản:** v1.1 Chuẩn hóa

---

## 1. TỔNG QUAN CHIẾN LƯỢC BẢO MẬT

Hệ thống VAMOS STORE áp dụng nguyên tắc **Bảo mật theo chiều sâu (Defense in Depth)** và **Đặc quyền tối thiểu (Least Privilege)**, bảo vệ ứng dụng ở mọi tầng từ Client, Middleware, Business Service, Repository đến Cơ sở dữ liệu.

---

## 2. MA TRẬN ĐỐI CHIẾU TIÊU CHUẨN OWASP TOP 10

| Mã OWASP     | Phân loại rủi ro                                                           | Cơ chế phòng thủ triển khai trong VAMOS STORE                                                                                                                                                                                                                                                                                                                                                          | Vị trí mã nguồn                                                                                                      |
| :----------- | :------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **A01:2021** | **Broken Access Control** (Lỗi kiểm soát truy cập)                         | - Middleware `requireAuth`, `requireAdmin`, `requireGuest`<br/>- Kiểm tra trạng thái khóa tài khoản (`status = 'locked'`) thời gian thực trong CSDL, hủy session ngay lập tức<br/>- Chặn Admin tự khóa tài khoản của chính mình<br/>- Ngăn chặn IDOR: Customer chỉ xem/hủy đơn hàng thuộc sở hữu của mình (`user_id = req.session.user.id`)                                                            | `src/middlewares/auth.middleware.js`<br/>`src/controllers/admin.controller.js`<br/>`src/services/order.service.js`   |
| **A02:2021** | **Cryptographic Failures** (Lỗi mật mã)                                    | - Mật khẩu người dùng được băm một chiều an toàn bằng thuật toán `bcrypt` với cost factor (salt rounds) = 10<br/>- Token khôi phục mật khẩu sinh bằng `crypto.randomBytes(32)` an toàn cao và lưu mã băm kèm thời hạn hết hạn                                                                                                                                                                          | `src/controllers/auth.controller.js`<br/>`database/mssql_schema.sql`                                                 |
| **A03:2021** | **Injection** (Lỗ hổng tiêm mã / SQLi)                                     | - 100% các câu truy vấn T-SQL đều dùng **Prepared Statements** với tham số kiểu rõ ràng (`sql.Int`, `sql.NVarChar`, v.v.) qua thư viện `mssql`<br/>- Tuyệt đối không ghép chuỗi SQL (No String Concatenation)                                                                                                                                                                                          | Toàn bộ `src/repositories/`<br/>`src/services/order.service.js`                                                      |
| **A04:2021** | **Insecure Design** (Thiết kế thiếu an toàn)                               | - Chống Overselling: Sử dụng T-SQL `WITH (UPDLOCK, ROWLOCK)` trong Transaction khi kiểm tra và trừ tồn kho<br/>- Ngăn chặn Double-Submit: JavaScript Client vô hiệu hóa nút submit checkout sau lần click đầu tiên<br/>- Đảm bảo tính Idempotent: Hủy đơn chỉ hoàn tồn kho đúng 1 lần duy nhất<br/>- Giới hạn Voucher (Q8): Bảng `voucher_usages` với ràng buộc duy nhất `UNIQUE(voucher_id, user_id)` | `src/services/order.service.js`<br/>`src/public/js/main.js`<br/>`database/migrations/003_voucher_customer_usage.sql` |
| **A05:2021** | **Security Misconfiguration** (Cấu hình sai bảo mật)                       | - Thiết lập cookie session với `httpOnly: true` (ngăn JavaScript đọc cookie) và `sameSite: 'lax'`<br/>- Tắt header `x-powered-by: Express` để ẩn dấu thông tin công nghệ máy chủ<br/>- Phân tách môi trường rõ ràng qua tệp `.env`                                                                                                                                                                     | `src/app.js`<br/>`src/config/session.config.js`                                                                      |
| **A06:2021** | **Vulnerable and Outdated Components** (Thành phần lỗi thời)               | - Định kỳ kiểm tra lỗ hổng bằng `npm audit`<br/>- Sử dụng các thư viện chuẩn, uy tín trong cộng đồng Node.js                                                                                                                                                                                                                                                                                           | `package.json`                                                                                                       |
| **A07:2021** | **Identification and Authentication Failures** (Lỗi định danh & xác thực)  | - Chống Session Fixation: Gọi `req.session.regenerate()` khi đăng nhập và đăng ký thành công<br/>- Hủy triệt để session trên máy chủ (`req.session.destroy()`) và xóa cookie phía Client (`res.clearCookie('vamos_sid')`) khi đăng xuất<br/>- Middleware `requireGuest`: Ngăn tài khoản đã đăng nhập gửi form đăng nhập lại mà không đăng xuất                                                         | `src/controllers/auth.controller.js`<br/>`src/middlewares/auth.middleware.js`                                        |
| **A08:2021** | **Software and Data Integrity Failures** (Lỗi toàn vẹn phần mềm & dữ liệu) | - Snapshot dữ liệu lịch sử đơn hàng (`order_items` lưu giá, tên, SKU, size, màu) bảo vệ tính toàn vẹn khi giá sản phẩm thay đổi (Q10)<br/>- Ràng buộc toàn vẹn khóa ngoại (FK) và CHECK constraints chặt chẽ trong CSDL                                                                                                                                                                                | `database/mssql_schema.sql`                                                                                          |
| **A09:2021** | **Security Logging and Monitoring Failures** (Lỗi ghi vết & giám sát)      | - Bảng `order_status_histories` ghi nhận mọi lượt đổi trạng thái đơn, người thực hiện (`changed_by`), lý do và dấu thời gian<br/>- Bảng `inventory_transactions` ghi nhận nhật ký kiểm toán mọi biến động tăng giảm kho                                                                                                                                                                                | `src/services/order.service.js`<br/>`src/controllers/admin.controller.js`                                            |
| **A10:2021** | **Server-Side Request Forgery** (SSRF)                                     | - Hệ thống không tiếp nhận hoặc thực hiện bất kỳ yêu cầu HTTP tùy ý nào từ phía người dùng đến các endpoint bên ngoài                                                                                                                                                                                                                                                                                  | Kiến trúc ứng dụng khép kín                                                                                          |

---

## 3. CHI TIẾT CÁC CƠ CHẾ PHÒNG THỦ TRỌNG TÂM

### 3.1. Cơ chế Vô hiệu hóa Phiên thời gian thực khi Khóa Tài khoản

Trong các ứng dụng web thông thường sử dụng Session bộ nhớ hoặc Redis, khi quản trị viên khóa một tài khoản (`status = 'locked'`), người dùng đó vẫn có thể tiếp tục thao tác cho đến khi Session hết hạn.
Tại VAMOS STORE:

- Middleware `requireAuth` và `requireAdmin` truy vấn trực tiếp trạng thái tài khoản từ bảng `users` trong CSDL:

```javascript
const userCheck = await pool
  .request()
  .input("userId", sql.Int, req.session.user.id)
  .query("SELECT status, role FROM users WHERE id = @userId");

if (
  userCheck.recordset.length === 0 ||
  userCheck.recordset[0].status === "locked"
) {
  req.session.destroy(() => {
    res.clearCookie("vamos_sid");
    return res.redirect("/auth/login?error=account_locked");
  });
  return;
}
```

- Ngay khi bị khóa, request kế tiếp của người dùng sẽ lập tức bị hủy phiên, xóa cookie và chuyển hướng về trang đăng nhập với thông báo rõ ràng.

### 3.2. Cơ chế Phòng chống Tấn công Cố định Phiên (Session Fixation)

Khi người dùng chưa đăng nhập, một Session ID tạm thời có thể đã được gán. Kẻ tấn công có thể cố định Session ID này để chiếm quyền sau khi người dùng đăng nhập.
Tại VAMOS STORE:

- Sau khi xác thực mật khẩu chính xác qua `bcrypt.compare`:

```javascript
req.session.regenerate(async (err) => {
  if (err) return next(err);
  req.session.user = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  };
  req.session.save(() => {
    // Điều hướng an toàn
  });
});
```

- Việc gọi `regenerate()` cấp một mã Session ID hoàn toàn mới, vô hiệu hóa mọi nỗ lực chiếm quyền phiên trước đó.
