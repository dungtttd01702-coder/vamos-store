# ĐẶC TẢ CHI TIẾT CÁC USE CASE (USE CASE SPECIFICATIONS)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ BÁN GIÀY VAMOS STORE

> **Dự án:** VAMOS STORE — Website Thương mại điện tử Bán giày chuyên nghiệp  
> **Phiên bản:** v2.1 (Kiểm toán toàn diện & Đối soát trực tiếp mã nguồn thực thi)  
> **Đối tượng sử dụng:** Đồ án tốt nghiệp / Assignment môn Phân tích Thiết kế Hệ thống CNTT  
> **Cập nhật ngày:** 14/11/2026  

---

## MỤC LỤC 16 USE CASE
- [UC01: Đăng ký tài khoản](#uc01-đăng-ký-tài-khoản)
- [UC02: Đăng nhập hệ thống](#uc02-đăng-nhập-hệ-thống)
- [UC03: Khôi phục mật khẩu (Bản thiết kế)](#uc03-khôi-phục-mật-khẩu-bản-thiết-kế)
- [UC04: Quản lý hồ sơ & sổ địa chỉ](#uc04-quản-lý-hồ-sơ--sổ-địa-chỉ)
- [UC05: Tìm kiếm & xem sản phẩm](#uc05-tìm-kiếm--xem-sản-phẩm)
- [UC06: Quản lý giỏ hàng](#uc06-quản-lý-giỏ-hàng)
- [UC07: Đặt hàng COD](#uc07-đặt-hàng-cod)
- [UC08: Tra cứu & theo dõi đơn hàng](#uc08-tra-cứu--theo-dõi-đơn-hàng)
- [UC09: Hủy đơn hàng tự phục vụ](#uc09-hủy-đơn-hàng-tự-phục-vụ)
- [UC10: Xử lý & cập nhật đơn hàng (Admin)](#uc10-xử-lý--cập-nhật-đơn-hàng-admin)
- [UC11: Quản lý tồn kho (Admin)](#uc11-quản-lý-tồn-kho-admin)
- [UC12: Quản lý danh mục, thương hiệu, sản phẩm & banner (Admin)](#uc12-quản-lý-danh-mục-thương-hiệu-sản-phẩm--banner-admin)
- [UC13: Quản lý mã giảm giá (Admin)](#uc13-quản-lý-mã-giảm-giá-admin)
- [UC14: Báo cáo doanh thu & KPI Dashboard (Admin)](#uc14-báo-cáo-doanh-thu--kpi-dashboard-admin)
- [UC15: Quản lý danh sách yêu thích (Wishlist)](#uc15-quản-lý-danh-sách-yêu-thích-wishlist)
- [UC16: Quản lý tài khoản khách hàng (Admin)](#uc16-quản-lý-tài-khoản-khách-hàng-admin)

---

### UC01: Đăng ký tài khoản

1. **Mã Use Case:** UC01
2. **Tên Use Case:** Đăng ký tài khoản khách hàng mới
3. **Tác nhân chính (Primary Actor):** Khách vãng lai (Guest)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Cho phép khách vãng lai đăng ký một tài khoản thành viên mới trong hệ thống để tham gia mua hàng, quản lý đơn hàng, lưu danh sách yêu thích và sổ địa chỉ giao hàng. Hệ thống tự động tạo giỏ hàng CSDL và tự động gộp giỏ hàng phiên của khách nếu có.
6. **Điều kiện kích hoạt (Trigger):** Khách vãng lai nhấp vào nút "Đăng ký" trên Header hoặc trang Đăng nhập.
7. **Tiền điều kiện (Preconditions):** Người dùng chưa đăng nhập hệ thống (`req.session.user` là null). Nếu đã đăng nhập, middleware `requireGuest` sẽ chuyển hướng về trang chủ hoặc dashboard.
8. **Hậu điều kiện (Postconditions):** 
   - Một bản ghi người dùng mới được thêm vào bảng `users` với `role = 'CUSTOMER'`, `status = 'active'`, `created_at = GETDATE()`.
   - Một giỏ hàng mới được tạo trong bảng `carts (user_id)`.
   - Nếu có giỏ hàng khách tạm thời (`req.session.guestCart`), các mặt hàng tự động được gộp vào bảng `cart_items`.
   - Mật khẩu được mã hóa an toàn bằng bcrypt (salt rounds = 10).
   - Tự động đăng nhập vào session và chuyển hướng về trang chủ `/`.
9. **Luồng sự kiện chính (Main Success Flow):**
   - **Bước 1 (Actor):** Guest truy cập biểu mẫu đăng ký tại `/auth/register`.
   - **Bước 2 (System):** Hệ thống hiển thị form nhập liệu gồm: Họ tên, Email, Số điện thoại, Mật khẩu và Xác nhận mật khẩu.
   - **Bước 3 (Actor):** Guest điền đầy đủ các thông tin và nhấn nút "Đăng ký tài khoản".
   - **Bước 4 (System):** Hệ thống kiểm tra tính hợp lệ dữ liệu đầu vào phía Server (`src/controllers/auth.controller.js:210-245`):
     - Các trường bắt buộc không được để trống.
     - Email đúng định dạng regex tiêu chuẩn.
     - Mật khẩu có độ dài tối thiểu 8 ký tự.
     - Mật khẩu và Xác nhận mật khẩu trùng khớp nhau.
     - Số điện thoại đúng định dạng số di động Việt Nam (10 chữ số).
   - **Bước 5 (System):** Hệ thống truy vấn CSDL kiểm tra tính duy nhất của Email (`SELECT id FROM users WHERE email = @email`).
   - **Bước 6 (System):** Hệ thống băm mật khẩu bằng hàm `bcrypt.hash(password, 10)` (`src/controllers/auth.controller.js:250`).
   - **Bước 7 (System - Transaction Tạo User + Cart):**
     - Mở Transaction SQL Server (`src/controllers/auth.controller.js:254-286`).
     - INSERT thông tin người dùng vào bảng `users` với `OUTPUT INSERTED.id` (`role = 'CUSTOMER'`).
     - INSERT tạo giỏ hàng mới vào bảng `carts (user_id)` với `OUTPUT INSERTED.id`.
     - Commit Transaction.
   - **Bước 8 (System - Gộp giỏ hàng khách):** Nếu có `req.session.guestCart`, hệ thống gọi `CartController.mergeGuestCart(cartId, guestCart)` để chèn sản phẩm vào `cart_items` (`src/controllers/auth.controller.js:288-293`).
   - **Bước 9 (System - Tự động đăng nhập & Chống Session Fixation):** Hệ thống tái tạo phiên làm việc `req.session.regenerate()`, lưu thông tin `user` và `cartId`, xóa giỏ hàng tạm, và chuyển hướng về `/` (`src/controllers/auth.controller.js:296-312`).
10. **Luồng sự kiện thay thế:** Không có.
11. **Luồng sự kiện ngoại lệ:**
    - **E1 - Dữ liệu không hợp lệ:** Thiếu trường hoặc mật khẩu dưới 8 ký tự -> Hiển thị thông báo lỗi chi tiết.
    - **E2 - Trùng lặp Email:** Email đã tồn tại -> Thông báo: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác." (`src/controllers/auth.controller.js:246-248`).
12. **Quy tắc nghiệp vụ:**
    - **BR-AUTH-01:** Mật khẩu bắt buộc có tối thiểu 8 ký tự và bắt buộc mã hóa bcrypt (salt rounds = 10).
    - **BR-AUTH-02:** Email là định danh duy nhất (Unique Constraint) trong toàn hệ thống.
13. **Dữ liệu đầu vào:** Họ tên, Email, SĐT, Mật khẩu, Xác nhận mật khẩu.
14. **Dữ liệu đầu ra:** Tài khoản `users`, giỏ hàng `carts`, session người dùng.
15. **Mức độ ưu tiên:** Cao (High).
16. **Quan hệ với Use Case khác:**
    - `<<include>>`: Kiểm tra trùng email, Băm mật khẩu bcrypt, Tạo giỏ hàng CSDL mặc định.
    - `<..`: Gộp giỏ hàng khách vãng lai (`<<extend>>`).

---

### UC02: Đăng nhập hệ thống

1. **Mã Use Case:** UC02
2. **Tên Use Case:** Đăng nhập và Cấp quyền truy cập hệ thống
3. **Tác nhân chính (Primary Actor):** Khách vãng lai (Guest), Khách hàng (Customer), Quản trị viên (Admin)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Xác thực danh tính người dùng bằng email và mật khẩu, cấp phiên làm việc máy chủ an toàn (`req.session.user`), tự động gộp giỏ hàng phiên của khách vào CSDL và điều hướng người dùng về đúng khu vực chức năng theo vai trò (`CUSTOMER` hoặc `ADMIN`).
6. **Điều kiện kích hoạt (Trigger):** Người dùng nhấp nút "Đăng nhập" trên Header hoặc bị chuyển hướng từ một chức năng yêu cầu xác thực.
7. **Tiền điều kiện (Preconditions):** Tài khoản đã được đăng ký và không ở trạng thái bị khóa (`status != 'locked'`).
8. **Hậu điều kiện (Postconditions):** 
   - Session được khởi tạo và cookie định danh phiên an toàn `vamos_sid` (HttpOnly, SameSite=Lax) được gửi về trình duyệt.
   - Nếu có giỏ hàng khách tạm trong phiên, tự động gộp vào bảng `cart_items`.
   - Customer được chuyển hướng về trang chủ hoặc trang yêu cầu trước đó (`returnUrl`). Admin được chuyển hướng về `/admin/dashboard`.
9. **Luồng sự kiện chính (Main Success Flow):**
   - **Bước 1 (Actor):** Người dùng mở trang đăng nhập tại `/auth/login`.
   - **Bước 2 (System):** Hệ thống hiển thị biểu mẫu đăng nhập (Email, Mật khẩu).
   - **Bước 3 (Actor):** Người dùng nhập Email, Mật khẩu và nhấn "Đăng nhập".
   - **Bước 4 (System):** Hệ thống kiểm tra các trường bắt buộc không để trống (`src/controllers/auth.controller.js:70-76`).
   - **Bước 5 (System):** Hệ thống truy vấn thông tin tài khoản: `SELECT id, full_name, email, password_hash, role, status FROM users WHERE email = @email` (`src/controllers/auth.controller.js:82-87`).
   - **Bước 6 (System):** Kiểm tra trạng thái tài khoản: Nếu `status === 'locked'`, từ chối và báo lỗi tài khoản bị khóa (`src/controllers/auth.controller.js:97-100`).
   - **Bước 7 (System):** So sánh mật khẩu bằng `bcrypt.compare(password, password_hash)` (`src/controllers/auth.controller.js:101-105`).
   - **Bước 8 (System - Quản lý Giỏ hàng thành viên):** Đảm bảo khách hàng có giỏ hàng trong bảng `carts` (`src/controllers/auth.controller.js:108-116`).
   - **Bước 9 (System - Gộp giỏ hàng khách):** Nếu có `req.session.guestCart`, gọi `CartController.mergeGuestCart(cartId, guestCart)` để gộp sản phẩm vào CSDL (`src/controllers/auth.controller.js:122-126`).
   - **Bước 10 (System - Cấp Session an toàn):** Tái tạo session `req.session.regenerate()` (chống Session Fixation), lưu `req.session.user = { id, email, full_name, role, cartId }`, xóa `guestCart = []` (`src/controllers/auth.controller.js:129-140`).
   - **Bước 11 (System):** Điều hướng:
     - Nếu `role === 'ADMIN'` -> Điều hướng đến `/admin/dashboard` (`src/controllers/auth.controller.js:144-149`).
     - Nếu `role === 'CUSTOMER'` -> Điều hướng đến `returnUrl` (nếu hợp lệ) hoặc trang chủ `/` (`src/controllers/auth.controller.js:151-158`).
10. **Luồng sự kiện thay thế:** Đăng nhập từ trang Checkout -> chuyển hướng ngay về `/checkout`.
11. **Luồng sự kiện ngoại lệ:**
    - **E1 - Sai thông tin xác thực:** Email không tồn tại hoặc sai mật khẩu -> Báo lỗi bảo mật trung lập: "Email hoặc mật khẩu không chính xác." (`src/controllers/auth.controller.js:89-95`).
    - **E2 - Tài khoản bị khóa:** `status === 'locked'` -> Thông báo: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị..." (`src/controllers/auth.controller.js:97-100`).
12. **Quy tắc nghiệp vụ:**
    - **BR-AUTH-03:** Phân quyền vai trò RBAC (`CUSTOMER` / `ADMIN`).
    - **BR-SEC-01:** Chống User Enumeration (lỗi chung không phân biệt email/mật khẩu).
13. **Dữ liệu đầu vào:** Email, Mật khẩu, returnUrl (tùy chọn).
14. **Dữ liệu đầu ra:** Phiên làm việc hợp lệ (`req.session.user`), cookie `vamos_sid`.
15. **Mức độ ưu tiên:** Cao (High).
16. **Quan hệ với Use Case khác:**
    - `<<include>>`: Xác thực mật khẩu bcrypt, Cấp Session & Phân quyền RBAC.
    - `<..`: Tự động gộp giỏ hàng khách vãng lai (`<<extend>>`).

---

### UC03: Khôi phục mật khẩu (Bản thiết kế)

1. **Mã Use Case:** UC03
2. **Tên Use Case:** Khôi phục mật khẩu tài khoản qua thư điện tử
3. **Tác nhân chính (Primary Actor):** Khách vãng lai (Guest)
4. **Tác nhân phụ (Secondary Actor):** Dịch vụ Email (Email Service) *(Dự kiến trong thiết kế)*
5. **Mô tả tóm tắt:** Quy trình khôi phục mật khẩu tài khoản người dùng qua mã token xác thực tạm thời gửi đến hòm thư điện tử.
6. **Điều kiện kích hoạt (Trigger):** Người dùng bấm liên kết "Quên mật khẩu?" tại trang Đăng nhập (`src/views/pages/auth/login.pug:37`).
7. **Tiền điều kiện (Preconditions):** Tài khoản đã đăng ký trong hệ thống.
8. **Hậu điều kiện (Postconditions):** Mật khẩu mới được cập nhật vào bảng `users`; bản ghi token trong `password_reset_tokens` bị đánh dấu đã dùng (`used_at = GETDATE()`).
9. **Luồng sự kiện chính (Main Success Flow - Thiết kế quy chuẩn):**
   - **Bước 1 (Actor):** Người dùng bấm "Quên mật khẩu?" tại trang login.
   - **Bước 2 (System):** Hiển thị form nhập email tài khoản.
   - **Bước 3 (Actor):** Người dùng nhập email và bấm gửi.
   - **Bước 4 (System):** Kiểm tra email trong bảng `users`.
   - **Bước 5 (System):** Sinh chuỗi token ngẫu nhiên an toàn (Crypto Random), băm token (`token_hash`), tính hạn sử dụng (`expires_at`).
   - **Bước 6 (System):** Lưu bản ghi vào bảng `password_reset_tokens (user_id, token_hash, expires_at, created_at)`.
   - **Bước 7 (System - Tác nhân phụ):** Gọi Email Service gửi thư chứa liên kết xác thực kèm token.
   - **Bước 8 (Actor):** Người dùng mở email, nhấp liên kết xác thực.
   - **Bước 9 (System):** Xác thực token: Kiểm tra token tồn tại, `used_at IS NULL` và `expires_at > GETDATE()`.
   - **Bước 10 (Actor):** Người dùng nhập mật khẩu mới và xác nhận.
   - **Bước 11 (System):** Băm mật khẩu mới bằng bcrypt, cập nhật vào `users`, cập nhật `used_at = GETDATE()`.
   - **Bước 12 (System):** Thông báo thành công và chuyển hướng về trang đăng nhập.
10. **Luồng sự kiện thay thế / ngoại lệ:** Token hết hạn hoặc đã sử dụng -> Báo lỗi token không hợp lệ.
11. **Quy tắc nghiệp vụ:** Token chỉ sử dụng đúng 1 lần và có hạn thời gian quy chuẩn.
12. **Dữ liệu đầu vào:** Email, token, mật khẩu mới.
13. **Dữ liệu đầu ra:** Bản ghi token, mật khẩu cập nhật.
14. **Mức độ ưu tiên:** Trung bình (Medium).
15. **Quan hệ với Use Case khác:** `<<interact>>` Dịch vụ Email (dự kiến).
16. **XÁC MINH HIỆN TRẠNG TRIỂN KHAI THỰC TẾ (CRITICAL AUDIT NOTE):**
    - **Trạng thái chính thức:** **`Designed Only / Not Implemented`** (Chưa triển khai trong mã nguồn thực thi).
    - **Giao diện (UI):** Đã có liên kết `a(href="/auth/forgot-password") Quên mật khẩu?` tại `src/views/pages/auth/login.pug:37`.
    - **Cơ sở dữ liệu (Database):** Bảng `password_reset_tokens` đã được tạo trong `database/mssql_schema.sql:187-196` với các cột `id, user_id, token_hash, expires_at, used_at, created_at`.
    - **Mã nguồn Backend:** Chưa có route `/auth/forgot-password` trong `src/routes/auth.routes.js` (truy cập trả về HTTP 404); chưa có controller method trong `src/controllers/auth.controller.js`; chưa cấu hình thư viện gửi mail (Nodemailer / SMTP).
    - **Tác nhân Email Service:** Chỉ là tác nhân dự kiến trong thiết kế kiến trúc, chưa phải là tích hợp đang hoạt động.
    - **Thời hạn token:** Cột `expires_at DATETIME2` trong CSDL lưu mốc thời gian hết hạn; thông số thời hạn 30 phút là quy chuẩn trong tài liệu thiết kế.

---

### UC04: Quản lý hồ sơ & sổ địa chỉ

1. **Mã Use Case:** UC04
2. **Tên Use Case:** Quản lý thông tin hồ sơ cá nhân và sổ địa chỉ giao hàng
3. **Tác nhân chính (Primary Actor):** Khách hàng (Customer)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Cho phép khách hàng xem và chỉnh sửa thông tin cá nhân (họ tên, số điện thoại), đổi mật khẩu tài khoản và quản lý danh sách nhiều địa chỉ giao hàng (thêm mới, sửa, xóa, đặt địa chỉ mặc định).
6. **Điều kiện kích hoạt (Trigger):** Customer nhấp vào mục "Tài khoản của tôi" hoặc "Sổ địa chỉ" trên menu tài khoản.
7. **Tiền điều kiện (Preconditions):** Customer đã đăng nhập tài khoản (`requireCustomer`). Khách vãng lai bị redirect 302 sang login; Admin bị redirect 302 về Dashboard kèm cảnh báo.
8. **Hậu điều kiện (Postconditions):** 
   - Thông tin cá nhân hoặc mật khẩu mới được cập nhật trong bảng `users`.
   - Danh sách địa chỉ được thêm mới, cập nhật hoặc xóa trong bảng `addresses`. Nếu một địa chỉ được chọn làm mặc định (`is_default = 1`), các địa chỉ khác của người dùng tự động chuyển về `is_default = 0`.
9. **Luồng sự kiện chính (Main Success Flow):**
   - **Bước 1 (Actor):** Customer truy cập `/account/profile` hoặc `/account/addresses`.
   - **Bước 2 (System):** Hệ thống tải và hiển thị thông tin hồ sơ và sổ địa chỉ (`src/controllers/account.controller.js:14-45`).
   - **Bước 3 (Nhánh A - Cập nhật hồ sơ):** Customer sửa Họ tên, SĐT -> Hệ thống thực thi `UPDATE users SET full_name = @fullName, phone = @phone WHERE id = @userId` (`src/controllers/account.controller.js:52-78`).
   - **Bước 4 (Nhánh B - Đổi mật khẩu):** Customer nhập mật khẩu cũ, mật khẩu mới -> Hệ thống xác thực qua `bcrypt.compare`, băm mật khẩu mới và cập nhật CSDL (`src/controllers/account.controller.js:80-118`).
   - **Bước 5 (Nhánh C - Quản lý sổ địa chỉ):** Customer thêm địa chỉ mới -> Hệ thống lưu vào bảng `addresses`. Nếu chọn mặc định, chạy lệnh reset địa chỉ cũ về `is_default = 0` (`src/controllers/account.controller.js:125-180`).
10. **Luồng sự kiện ngoại lệ:** Sai mật khẩu hiện tại -> Báo lỗi mật khẩu cũ không đúng.
11. **Quy tắc nghiệp vụ:**
    - **BR-USR-01:** Mỗi khách hàng chỉ có duy nhất **01 địa chỉ giao hàng mặc định** tại một thời điểm.
12. **Dữ liệu đầu vào:** Họ tên, SĐT, mật khẩu cũ/mới, thông tin địa chỉ giao hàng.
13. **Dữ liệu đầu ra:** Bản ghi `users` và `addresses` cập nhật.
14. **Mức độ ưu tiên:** Cao (High).
15. **Quan hệ với Use Case khác:** Cung cấp địa chỉ giao hàng cho `UC07: Đặt hàng COD`.

---

### UC05: Tìm kiếm & xem sản phẩm

1. **Mã Use Case:** UC05
2. **Tên Use Case:** Khám phá, Tìm kiếm và Xem chi tiết sản phẩm
3. **Tác nhân chính (Primary Actor):** Khách vãng lai (Guest), Khách hàng (Customer)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Người dùng tìm kiếm sản phẩm qua công cụ Live Search API hoặc bộ lọc đa tiêu chí (danh mục, giới tính, kích cỡ, màu sắc, khoảng giá), duyệt danh sách phân trang và xem chi tiết ma trận biến thể Kích cỡ x Màu sắc cùng số lượng tồn kho khả dụng.
6. **Điều kiện kích hoạt (Trigger):** Người dùng nhập từ khóa vào ô tìm kiếm hoặc bấm duyệt danh mục sản phẩm.
7. **Tiền điều kiện (Preconditions):** Tuyến công khai, không yêu cầu xác thực.
8. **Hậu điều kiện (Postconditions):** Danh sách sản phẩm hoặc chi tiết biến thể hiển thị đầy đủ, chính xác.
9. **Luồng sự kiện chính (Main Success Flow):**
   - **Bước 1 (Actor):** Người dùng duyệt `/products` hoặc gõ từ khóa trên header.
   - **Bước 2 (System - Live Search API):** Gõ từ 2 ký tự, gửi ajax đến `GET /api/products/search?q=...`, hệ thống truy vấn và trả về kết quả gợi ý tức thì (`src/controllers/product.controller.js:143-176`).
   - **Bước 3 (Actor):** Áp dụng bộ lọc: Danh mục, Giới tính, Size, Màu sắc, Khoảng giá, Sắp xếp (`src/controllers/product.controller.js:15-50`).
   - **Bước 4 (System):** Thực thi truy vấn phân trang SQL Server, chỉ hiển thị sản phẩm `status = 'active'`.
   - **Bước 5 (Actor):** Bấm chọn sản phẩm -> Điều hướng đến `/products/:slug`.
   - **Bước 6 (System):** Tải chi tiết sản phẩm, ảnh gallery từ `product_images`, danh mục, thương hiệu, giá gốc, giá sale (`src/controllers/product.controller.js:52-120`).
   - **Bước 7 (System):** Truy vấn bảng `product_variants`, kết hợp `colors` và `sizes`, hiển thị ma trận tùy chọn Kích cỡ x Màu sắc.
   - **Bước 8 (Actor):** Chọn Màu và Size -> Hệ thống hiển thị mã SKU và số lượng tồn kho thực tế (`stock_quantity`).
10. **Luồng sự kiện thay thế:** Không tìm thấy sản phẩm -> Hiển thị thông báo rỗng kèm nút xóa bộ lọc.
11. **Quy tắc nghiệp vụ:**
    - **BR-PRD-01:** Chỉ hiển thị sản phẩm có `status = 'active'` trên storefront.
    - **BR-PRD-02:** Mỗi biến thể được định danh duy nhất bởi cặp `(size_id, color_id)`, có mã `sku` và số tồn `stock_quantity`.
12. **Dữ liệu đầu vào:** Từ khóa tìm kiếm, tiêu chí lọc, slug sản phẩm.
13. **Dữ liệu đầu ra:** Danh sách sản phẩm, gợi ý tìm kiếm, trang chi tiết sản phẩm.
14. **Mức độ ưu tiên:** Cao (High).
15. **Quan hệ với Use Case khác:**
    - `<..`: Tìm kiếm nhanh Live Search (`<<extend>>`).
    - Dẫn đến: `UC06: Quản lý giỏ hàng` và `UC15: Quản lý danh sách yêu thích`.

---

### UC06: Quản lý giỏ hàng

1. **Mã Use Case:** UC06
2. **Tên Use Case:** Quản lý giỏ hàng mua sắm (Guest Session Cart & Customer DB Cart)
3. **Tác nhân chính (Primary Actor):** Khách vãng lai (Guest), Khách hàng (Customer)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Cho phép người dùng thêm sản phẩm giày với kích cỡ và màu sắc đã chọn vào giỏ hàng, xem chi tiết giỏ hàng, thay đổi số lượng mua, xóa từng mặt hàng hoặc xóa toàn bộ giỏ. Hỗ trợ hai luồng lưu trữ song song: giỏ hàng tạm trong Session cho Khách vãng lai (không bắt buộc đăng nhập) và giỏ hàng bền vững trên CSDL SQL Server cho Khách hàng thành viên, kèm cơ chế tự động gộp giỏ hàng khi đăng nhập hoặc đăng ký.
6. **Điều kiện kích hoạt (Trigger):** Người dùng bấm "Thêm vào giỏ hàng" hoặc "Mua ngay" tại trang chi tiết sản phẩm hoặc nhấp biểu tượng Giỏ hàng trên Header.
7. **Tiền điều kiện (Preconditions):** Người dùng đã chọn đầy đủ Màu sắc và Kích cỡ sản phẩm.
8. **Hậu điều kiện (Postconditions):** 
   - Sản phẩm được thêm mới hoặc cập nhật số lượng trong giỏ hàng.
   - Đối với Khách vãng lai: Dữ liệu được lưu trong `req.session.guestCart`.
   - Đối với Khách hàng thành viên: Dữ liệu được lưu trong bảng `carts` và `cart_items` trên CSDL.
   - **Tồn kho hệ thống KHÔNG bị trừ (Giỏ hàng không giữ chỗ tồn kho).**
9. **Luồng sự kiện chính (Main Success Flow - Hai Luồng Độc Lập):**
   - **Bước 1 (Actor):** Tại trang chi tiết `/products/:slug`, người dùng chọn Màu, Size, Số lượng (1-10) và nhấn "Thêm vào giỏ hàng" (`POST /cart/add`).
   - **Bước 2 (System - Kiểm tra tính hợp lệ & Tồn kho):** Hệ thống kiểm tra biến thể tồn tại, `status = 'active'`, kiểm tra số lượng nằm trong giới hạn bán lẻ (1-10 đôi) và không vượt quá `stock_quantity` hiện có (`src/controllers/cart.controller.js:169-220`).
   - **Bước 3 (System - Phân định Lưu trữ theo Vai trò):**
     - **Luồng Khách vãng lai (Guest):** Khách **KHÔNG bắt buộc đăng nhập**. Hệ thống lưu mặt hàng vào mảng `req.session.guestCart` và cập nhật `req.session.cartCount` (`src/controllers/cart.controller.js:235-265`).
     - **Luồng Khách hàng thành viên (Customer):** Hệ thống tìm hoặc tạo giỏ hàng trong bảng `carts`, sau đó chèn mới hoặc tăng số lượng dòng sản phẩm trong bảng `cart_items` (`src/controllers/cart.controller.js:268-315`).
   - **Bước 4 (Actor):** Người dùng mở trang giỏ hàng tại `/cart` (`GET /cart`).
   - **Bước 5 (System - Hiển thị & Live DB Sync):**
     - Nếu là Guest: Hệ thống đọc `req.session.guestCart`, thực hiện Live DB Sync để cập nhật giá bán mới nhất và kiểm tra tồn kho thời gian thực; render view với `isGuest: true` (`src/controllers/cart.controller.js:42-121`).
     - Nếu là Customer: Hệ thống truy vấn CSDL từ `carts` và `cart_items`; render view với `isGuest: false` (`src/controllers/cart.controller.js:126-160`).
     - Nếu là Admin: Flash cảnh báo và redirect 302 về `/admin/dashboard` (`src/controllers/cart.controller.js:34-39`).
   - **Bước 6 (Actor):** Người dùng có thể điều chỉnh số lượng (+/-) hoặc xóa mặt hàng:
     - Tăng/giảm số lượng: Gửi `POST /cart/update` (`src/controllers/cart.controller.js:520-620`).
     - Xóa một mặt hàng: Gửi `POST /cart/remove` (`src/controllers/cart.controller.js:650-680`).
     - Xóa toàn bộ giỏ: Gửi `POST /cart/clear` (`src/controllers/cart.controller.js:626-646`).
   - **Bước 7 (System - Luồng Gộp Giỏ hàng khi Đăng nhập/Đăng ký):**
     - Khi Guest có hàng trong `req.session.guestCart` và tiến hành Đăng nhập (`POST /auth/login`, `src/controllers/auth.controller.js:122-126`) hoặc Đăng ký (`POST /auth/register`, `src/controllers/auth.controller.js:288-293`).
     - Hệ thống gọi hàm tĩnh `CartController.mergeGuestCart(cartId, guestCart)` (`src/controllers/cart.controller.js:686-745`):
       + Duyệt từng mặt hàng từ `guestCart`.
       + Nếu biến thể đã tồn tại trong giỏ CSDL: Cộng dồn số lượng (ràng buộc tối đa 10 đôi).
       + Nếu biến thể chưa có: INSERT bản ghi mới vào bảng `cart_items`.
       + Xóa sạch giỏ hàng tạm: `req.session.guestCart = []`.
       + Cập nhật lại số lượng tổng `req.session.cartCount`.
10. **Luồng sự kiện thay thế (Alternative Flows):**
    - **A1 - Mua ngay (Buy Now):** Bấm "Mua ngay" tại trang chi tiết -> Thêm sản phẩm vào giỏ và tự động redirect thẳng sang `/cart` (`src/controllers/cart.controller.js:470-515`).
11. **Luồng sự kiện ngoại lệ (Exception Flows):**
    - **E1 - Số lượng vượt quá tồn kho:** Hệ thống báo lỗi: "Số lượng trong kho không đủ (chỉ còn X sản phẩm khả dụng)."
    - **E2 - Vi phạm giới hạn bán lẻ:** Nhập > 10 đôi -> Hệ thống giới hạn tối đa 10 sản phẩm/mẫu.
12. **Quy tắc nghiệp vụ (Business Rules):**
    - **BR-CRT-01 (No Reservation in Cart):** Giỏ hàng tuyệt đối không giữ chỗ tồn kho. Tồn kho chỉ bị trừ khi hoàn tất đặt hàng COD (`UC07`).
    - **BR-CRT-02 (Retail Quantity Limit):** Giới hạn số lượng mua cho mỗi biến thể sản phẩm trong giỏ hàng là từ 1 đến 10 đôi.
    - **BR-CRT-03 (Guest Access Freedom):** Khách vãng lai hoàn toàn có quyền sử dụng giỏ hàng phiên mà không cần đăng nhập.
13. **Dữ liệu đầu vào:** `variant_id`, `quantity`.
14. **Dữ liệu đầu ra:** Giỏ hàng session hoặc CSDL, badge số lượng trên header, tổng tiền tạm tính.
15. **Mức độ ưu tiên:** Cao (High).
16. **Quan hệ với Use Case khác:** Cung cấp mặt hàng cho `UC07: Đặt hàng COD`. Được mở rộng bởi `UC02` khi đăng nhập.

---

### UC07: Đặt hàng COD

1. **Mã Use Case:** UC07
2. **Tên Use Case:** Đặt hàng thanh toán khi nhận hàng (Cash On Delivery - COD)
3. **Tác nhân chính (Primary Actor):** Khách hàng (Customer)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Khách hàng xác nhận đặt hàng với phương thức COD. Hệ thống thực hiện kiểm tra tồn kho thời gian thực với khóa bi quan (`UPDLOCK, ROWLOCK`), trừ tồn kho biến thể ngay trong Database Transaction, tạo bản sao snapshot thông tin sản phẩm và địa chỉ vào đơn hàng, áp dụng mã voucher (kiểm soát 1 lần dùng) và xóa sạch các sản phẩm đã đặt khỏi giỏ hàng.
6. **Điều kiện kích hoạt (Trigger):** Customer nhấn nút "Tiến hành thanh toán" từ trang giỏ hàng `/cart`.
7. **Tiền điều kiện (Preconditions):** 
   - Người dùng đã đăng nhập tài khoản Customer (`requireCustomer`). Khách vãng lai bị redirect 302 sang login; Admin bị redirect 302 về Dashboard kèm flash cảnh báo.
   - Giỏ hàng của khách hàng có ít nhất một sản phẩm hợp lệ.
8. **Hậu điều kiện (Postconditions):** 
   - Bản ghi đơn hàng mới được tạo trong bảng `orders` ở trạng thái `order_status = 'PENDING'`, `payment_status = 'UNPAID'`, `payment_method = 'COD'`.
   - Các mặt hàng được lưu snapshot bất biến vào bảng `order_items`.
   - **Tồn kho các biến thể trong bảng `product_variants` bị trừ chính xác ngay lập tức trong Transaction.**
   - Giao dịch xuất kho được ghi nhận vào `inventory_transactions` (`transaction_type = 'EXPORT'`).
   - Lịch sử trạng thái ban đầu được ghi vào `order_status_histories`.
   - Toàn bộ sản phẩm đã đặt bị xóa khỏi bảng `cart_items`.
   - Nếu áp dụng voucher: `used_count` tăng thêm 1 và ghi nhận vào bảng `voucher_usages` để chặn dùng lần 2.
9. **Luồng sự kiện chính (Main Success Flow - ACID Database Transaction):**
   - **Bước 1 (Actor):** Customer truy cập màn hình thanh toán tại `/checkout`.
   - **Bước 2 (System):** Tải danh sách sản phẩm trong giỏ và địa chỉ mặc định từ sổ địa chỉ của khách hàng.
   - **Bước 3 (Actor):** Customer chọn địa chỉ nhận hàng có sẵn hoặc điền địa chỉ giao hàng mới.
   - **Bước 4 (Actor - Kích hoạt mở rộng UC13):** Customer nhập mã voucher và bấm "Áp dụng".
   - **Bước 5 (System):** Kiểm tra điều kiện voucher: Còn hạn, chưa vượt giới hạn dùng, đạt giá trị đơn tối thiểu, và khách hàng chưa từng dùng mã này (`src/services/order.service.js:80-108`).
   - **Bước 6 (System):** Hiển thị tóm tắt: Tạm tính, Tiền giảm giá voucher, Phí vận chuyển (Miễn phí nếu tổng tiền >= 500k; ngược lại tính 30k), Tổng thanh toán cuối cùng và phương thức mặc định: **Thanh toán tiền mặt khi nhận hàng (COD)**.
   - **Bước 7 (Actor):** Customer nhập ghi chú đơn hàng và nhấn **"XÁC NHẬN ĐẶT HÀNG"**.
   - **Bước 8 (System - Bắt đầu Transaction CSDL An toàn Cấp độ Cao):**
     - Mở Transaction SQL Server (`src/services/order.service.js:36-41`).
     - Khóa dòng giỏ hàng: `SELECT ... FROM carts ct WITH (UPDLOCK, ROWLOCK) JOIN cart_items ci WITH (UPDLOCK, HOLDLOCK) ON ci.cart_id = ct.id` (`line 53-54`).
     - Khóa dòng kiểm tra tồn kho từng biến thể: `SELECT id, stock_quantity, sku FROM product_variants WITH (UPDLOCK, ROWLOCK) WHERE id = @varId` (`line 174-175`).
     - So sánh số lượng yêu cầu với `stock_quantity`. Toàn bộ đều đủ tồn kho (`line 184`).
     - Sinh mã đơn hàng duy nhất (ví dụ: `ORD-261114-X7K9`).
     - INSERT vào bảng `orders` lưu snapshot thông tin nhận hàng, tổng tiền, mã voucher, phí ship, trạng thái `PENDING`.
     - Duyệt từng sản phẩm:
       + INSERT vào `order_items` lưu snapshot tên SP, SKU, Size, Màu, đơn giá tại thời điểm mua, số lượng, thành tiền.
       + **Trừ tồn kho trực tiếp:** `UPDATE product_variants SET stock_quantity = stock_quantity - @qty, updated_at = GETDATE() WHERE id = @varId` (`line 193-195`).
       + INSERT vào `inventory_transactions` ghi nhận xuất kho (`line 202-211`).
     - Nếu có mã voucher: Khóa dòng voucher `WITH (UPDLOCK, ROWLOCK)`, tăng `used_count = used_count + 1` và INSERT vào `voucher_usages` (`line 214-230`).
     - Ghi nhận vào `order_status_histories`: `previous_status = NULL, new_status = 'PENDING', changed_by = userId, note = 'Khách hàng đặt hàng COD'` (`line 233-241`).
     - Xóa các mặt hàng đã đặt trong bảng `cart_items` (`line 244-247`).
     - Thực thi Commit Transaction (`line 250`).
   - **Bước 9 (System):** Chuyển hướng khách hàng sang màn hình thành công `/checkout/success/:orderId`.
10. **Luồng sự kiện ngoại lệ:**
    - **E1 - Hết hàng hoặc tồn kho không đủ tại thời điểm đặt (Race Condition):** Hệ thống ROLLBACK TRANSACTION, không tạo đơn, không trừ kho, và thông báo lỗi rõ ràng (`src/services/order.service.js:184-187`).
    - **E2 - Voucher đã từng sử dụng:** Báo lỗi: "Bạn đã sử dụng mã giảm giá này trước đây. Mỗi khách hàng chỉ được dùng 1 lần." (`src/services/order.service.js:106-107`).
11. **Quy tắc nghiệp vụ:**
    - **BR-ORD-04 (Atomic Inventory Deduction):** Tồn kho bắt buộc phải bị trừ ngay tại thời điểm Đặt hàng trong Transaction với khóa bi quan (`UPDLOCK, ROWLOCK`).
    - **BR-SHP-01 (Freeship Policy):** Đơn hàng có `subtotal >= 500,000 VNĐ` được miễn phí vận chuyển. Đơn dưới 500k tính phí 30,000 VNĐ.
    - **BR-PRC-05 (Order Snapshot):** Mọi thông tin giá bán và tên biến thể tại thời điểm đặt hàng được đóng băng vĩnh viễn trong `order_items`.
    - **BR-VOU-01 (Single-use Voucher):** Mỗi khách hàng chỉ được dùng một voucher tối đa 1 lần duy nhất (`voucher_usages`).
12. **Dữ liệu đầu vào:** Thông tin người nhận, địa chỉ giao hàng, ghi chú, mã voucher (tùy chọn).
13. **Dữ liệu đầu ra:** Đơn hàng `orders`, bản ghi `order_items`, xuất kho `inventory_transactions`.
14. **Mức độ ưu tiên:** Cốt lõi (Critical).
15. **Quan hệ với Use Case khác:**
    - `<<include>>`: Chọn địa chỉ nhận hàng, Khóa bi quan & Trừ tồn kho biến thể, Tạo Snapshot thông tin đơn hàng, Xác nhận phương thức COD.
    - `<..`: Áp dụng mã giảm giá (`<<extend>>`).

---

### UC08: Tra cứu & theo dõi đơn hàng

1. **Mã Use Case:** UC08
2. **Tên Use Case:** Tra cứu lịch sử và theo dõi tiến trình đơn hàng
3. **Tác nhân chính (Primary Actor):** Khách hàng (Customer)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Khách hàng xem danh sách các đơn hàng đã đặt trong quá khứ, tra cứu chi tiết từng đơn hàng bao gồm danh sách sản phẩm snapshot, địa chỉ giao hàng, tổng tiền, phương thức COD và dòng thời gian xử lý vận chuyển trực quan (Order Status Timeline).
6. **Điều kiện kích hoạt (Trigger):** Customer nhấp chọn mục "Đơn hàng của tôi" tại menu quản lý tài khoản.
7. **Tiền điều kiện (Preconditions):** Customer đã đăng nhập tài khoản (`requireCustomer`). Khách vãng lai bị redirect sang login; Admin bị redirect về Dashboard.
8. **Hậu điều kiện (Postconditions):** Hệ thống hiển thị thông tin đơn hàng chính xác thuộc quyền sở hữu của Customer; kích hoạt nút "Hủy đơn" nếu đơn đang ở trạng thái `PENDING`.
9. **Luồng sự kiện chính (Main Success Flow):**
   - **Bước 1 (Actor):** Customer truy cập `/account/orders`.
   - **Bước 2 (System):** Hệ thống truy vấn CSDL lấy danh sách đơn hàng của khách (`WHERE user_id = @currentUserId`) (`src/controllers/account.controller.js:185-215`).
   - **Bước 3 (System):** Hiển thị danh sách đơn: Mã đơn, Ngày đặt, Tổng tiền, Trạng thái đơn, Trạng thái thanh toán.
   - **Bước 4 (Actor):** Customer nhấp xem chi tiết đơn hàng tại `/account/orders/:id`.
   - **Bước 5 (System):** Kiểm tra quyền sở hữu (`orders.user_id === currentUserId`), tải snapshot mặt hàng từ `order_items` và lịch sử trạng thái từ `order_status_histories` (`src/controllers/account.controller.js:220-270`).
   - **Bước 6 (System):** Kết xuất Timeline trực quan: `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPING` -> `COMPLETED`.
   - **Bước 7 (System - Kích hoạt mở rộng UC09):** Nếu đơn hàng đang ở trạng thái `PENDING`, hiển thị nút "Hủy đơn hàng".
10. **Luồng sự kiện ngoại lệ:** Truy cập đơn hàng của người khác -> Chặn truy cập (403 Forbidden).
11. **Quy tắc nghiệp vụ:** Khách hàng chỉ được xem đơn hàng do chính mình sở hữu.
12. **Dữ liệu đầu vào:** `orderId`.
13. **Dữ liệu đầu ra:** Danh sách đơn hàng, trang chi tiết đơn hàng, timeline trạng thái.
14. **Mức độ ưu tiên:** Cao (High).
15. **Quan hệ với Use Case khác:**
    - `<<include>>`: Xem Timeline tiến trình đơn hàng, Xem Snapshot mặt hàng & địa chỉ.
    - Được mở rộng bởi: `UC09: Hủy đơn hàng tự phục vụ` (`<<extend>>`).

---

### UC09: Hủy đơn hàng tự phục vụ

1. **Mã Use Case:** UC09
2. **Tên Use Case:** Hủy đơn hàng tự phục vụ phía khách hàng
3. **Tác nhân chính (Primary Actor):** Khách hàng (Customer)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Cho phép khách hàng chủ động hủy đơn hàng đã đặt khi đơn còn đang ở trạng thái Chờ xác nhận (`PENDING`). Hệ thống tự động hoàn trả số lượng tồn kho cho các biến thể sản phẩm trong Database Transaction với cơ chế chống hoàn kho lặp và ghi nhận lịch sử kiểm toán.
6. **Điều kiện kích hoạt (Trigger):** Customer nhấp nút "Hủy đơn hàng" tại màn hình chi tiết đơn hàng đang `PENDING`.
7. **Tiền điều kiện (Preconditions):** Customer đã đăng nhập tài khoản và sở hữu đơn hàng; đơn hàng đang ở trạng thái duy nhất: `PENDING`.
8. **Hậu điều kiện (Postconditions):** Trạng thái đơn chuyển thành `CANCELLED`; tồn kho các biến thể được cộng hoàn trả tự động vào `product_variants`; ghi nhận lịch sử vào `inventory_transactions` và `order_status_histories`.
9. **Luồng sự kiện chính (Main Success Flow - ACID Database Transaction):**
   - **Bước 1 (Actor):** Tại chi tiết đơn hàng đang `PENDING`, Customer nhấn nút "Hủy đơn hàng".
   - **Bước 2 (System):** Hệ thống hiển thị hộp thoại xác nhận hủy đơn.
   - **Bước 3 (Actor):** Customer xác nhận đồng ý hủy (`POST /account/orders/:id/cancel`).
   - **Bước 4 (System - Mở Database Transaction):**
     - Mở Transaction SQL Server (`src/services/order.service.js:419-422`).
     - Khóa dòng đơn hàng: `SELECT id, order_code, order_status, payment_status FROM orders WITH (UPDLOCK, ROWLOCK) WHERE id = @orderId AND user_id = @userId` (`line 425-427`).
     - **Kiểm tra chống hoàn kho lặp (Anti-double Restitution):** `if (order.order_status === 'CANCELLED') throw new Error(...)` (`line 435-438`).
     - Kiểm tra trạng thái đơn: `if (order.order_status !== 'PENDING') throw new Error(...)` (`line 439-441`).
     - Gọi `_executeCancellation` (`line 444`):
       + Khóa dòng biến thể: `SELECT stock_quantity FROM product_variants WITH (UPDLOCK, ROWLOCK) WHERE id = @varId` (`line 338-340`).
       + **Cộng hoàn trả tồn kho:** `UPDATE product_variants SET stock_quantity = @newStock, updated_at = GETDATE() WHERE id = @varId` (`line 351-353`).
       + INSERT vào `inventory_transactions` ghi nhận nhập hoàn kho (`line 357-364`).
       + Cập nhật đơn hàng: `UPDATE orders SET order_status = 'CANCELLED', updated_at = GETDATE() WHERE id = @orderId` (`line 374-376`).
       + INSERT vào `order_status_histories`: `previous_status = 'PENDING', new_status = 'CANCELLED', changed_by = userId, note = 'Khách hàng tự hủy đơn hàng'` (`line 404-407`).
     - Commit Transaction (`line 454`).
   - **Bước 5 (System):** Tải lại trang chi tiết đơn với trạng thái ĐÃ HỦY và thông báo thành công.
10. **Luồng sự kiện ngoại lệ:** Đơn hàng đã chuyển sang `CONFIRMED` -> Transaction báo lỗi không thể tự hủy.
11. **Quy tắc nghiệp vụ:**
    - **BR-ORD-02:** Khách hàng chỉ có quyền tự hủy đơn duy nhất khi đơn đang ở trạng thái `PENDING`.
    - **BR-INV-03:** Hoàn trả tồn kho phải đảm bảo tính lũy thừa (chỉ hoàn trả đúng 1 lần duy nhất).
12. **Dữ liệu đầu vào:** `orderId`, xác nhận hủy.
13. **Dữ liệu đầu ra:** Trạng thái `CANCELLED`, tồn kho biến thể được cộng lại, bản ghi lịch sử.
14. **Mức độ ưu tiên:** Cao (High).
15. **Quan hệ với Use Case khác:** Là nhánh mở rộng của `UC08` (`<<extend>>`).

---

### UC10: Xử lý & cập nhật đơn hàng (Admin)

1. **Mã Use Case:** UC10
2. **Tên Use Case:** Tiếp nhận, Xử lý và Cập nhật trạng thái đơn hàng
3. **Tác nhân chính (Primary Actor):** Quản trị viên (Admin)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Quản trị viên quản lý danh sách đơn hàng toàn hệ thống, tiếp nhận đơn mới, chuyển đổi trạng thái đơn hàng theo đúng máy trạng thái nghiệp vụ (State Machine) hoặc thực hiện hủy đơn nội bộ kèm lý do bắt buộc và tự động hoàn trả tồn kho.
6. **Điều kiện kích hoạt (Trigger):** Admin mở mục "Quản lý đơn hàng" trong Cổng quản trị `/admin/orders`.
7. **Tiền điều kiện (Preconditions):** Admin đã đăng nhập hệ thống (`requireAdmin`).
8. **Hậu điều kiện (Postconditions):** 
   - Trạng thái `order_status` của đơn hàng được cập nhật sang bước tiếp theo hợp lệ.
   - Nếu chuyển sang `COMPLETED`: Tự động cập nhật `payment_status = 'PAID'`. **Tuyệt đối không trừ kho lần thứ hai.**
   - Nếu chuyển sang `CANCELLED`: Tự động hoàn trả tồn kho trong Transaction.
   - Mọi thao tác đều được lưu vết kiểm toán vào `order_status_histories`.
9. **Luồng sự kiện chính (Main Success Flow - State Machine Flow):**
   - **Bước 1 (Actor):** Admin truy cập `/admin/orders`, lọc danh sách theo trạng thái hoặc tìm kiếm theo mã đơn / số điện thoại.
   - **Bước 2 (Actor):** Admin xem chi tiết đơn hàng tại `/admin/orders/:id`.
   - **Bước 3 (System):** Hệ thống hiển thị toàn bộ thông tin đơn, snapshot sản phẩm, ghi chú và lịch sử trạng thái.
   - **Bước 4 (Actor):** Admin chọn trạng thái tiếp theo hợp lệ từ từ điển chuyển đổi:
     - `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPING` -> `COMPLETED`.
   - **Bước 5 (Actor):** Admin nhập ghi chú vận hành và nhấn "Cập nhật trạng thái" (`POST /admin/orders/:id/status`).
   - **Bước 6 (System - Xử lý chuyển trạng thái):**
     - Mở Transaction SQL Server (`src/services/order.service.js:490`).
     - Khóa dòng kiểm tra trạng thái hiện tại: `SELECT order_status, payment_status FROM orders WITH (UPDLOCK, ROWLOCK) WHERE id = @orderId` (`line 496`).
     - Đối chiếu với từ điển chuyển trạng thái hợp lệ (`VALID_TRANSITIONS`, `src/services/order.service.js:8-13`): Cấm nhảy cóc trạng thái.
     - **Xử lý khi chuyển sang `COMPLETED`:**
       + Cập nhật `order_status = 'COMPLETED'` (`line 541-544`).
       + Tự động cập nhật: `payment_status = 'PAID'` (`line 536-537`).
       + **Lưu ý kiến trúc cốt lõi:** Tuyệt đối KHÔNG có thao tác trừ kho vì tồn kho đã bị trừ tại thời điểm tạo đơn (`UC07`).
     - Ghi nhận bản ghi kiểm toán vào bảng `order_status_histories` (`line 546-548`).
     - Commit Transaction (`line 551`).
   - **Bước 7 (System):** Tải lại trang chi tiết đơn với trạng thái mới và thông báo thành công.
10. **Luồng sự kiện thay thế (Hủy đơn nội bộ):**
    - Khi đơn ở `PENDING` hoặc `CONFIRMED`, Admin chọn chuyển sang `CANCELLED` và **bắt buộc nhập lý do hủy**. Hệ thống thực thi `_executeCancellation` hoàn trả tồn kho tự động trong Transaction (`src/services/order.service.js:519-532`).
11. **Luồng sự kiện ngoại lệ:** Chuyển trạng thái trái quy tắc máy trạng thái -> Báo lỗi: "Không thể chuyển trạng thái từ X sang Y."
12. **Quy tắc nghiệp vụ:**
    - **BR-ORD-01:** Máy trạng thái tuân thủ chu trình đơn hướng: `PENDING -> CONFIRMED -> PROCESSING -> SHIPPING -> COMPLETED`. `COMPLETED` và `CANCELLED` là trạng thái kết thúc (Terminal States).
    - **BR-ORD-05:** Thanh toán COD tự động đổi sang `PAID` duy nhất khi đơn hàng đạt trạng thái `COMPLETED`.
    - **BR-INV-05:** Khi đơn `COMPLETED`, **tuyệt đối không trừ tồn kho lần thứ hai**.
13. **Dữ liệu đầu vào:** `orderId`, trạng thái mới (`newStatus`), ghi chú/lý do (`note`).
14. **Dữ liệu đầu ra:** Trạng thái đơn cập nhật, trạng thái thanh toán cập nhật, bản ghi audit.
15. **Mức độ ưu tiên:** Cốt lõi (Critical).
16. **Quan hệ với Use Case khác:**
    - `<<include>>`: Chuyển trạng thái theo máy trạng thái, Cập nhật thanh toán COD PAID khi COMPLETED.
    - `<..`: Hủy đơn nội bộ kèm hoàn kho (`<<extend>>`).

---

### UC11: Quản lý tồn kho (Admin)

1. **Mã Use Case:** UC11
2. **Tên Use Case:** Theo dõi, Quản lý và Điều chỉnh tồn kho sản phẩm
3. **Tác nhân chính (Primary Actor):** Quản trị viên (Admin)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Giúp Admin theo dõi số lượng tồn kho theo từng biến thể SKU, theo dõi cảnh báo sản phẩm sắp hết hàng (tồn <= 5), thực hiện điều chỉnh tăng/giảm tồn kho thủ công sau kiểm kê có lưu vết lý do bắt buộc và tra cứu lịch sử xuất nhập kho.
6. **Điều kiện kích hoạt (Trigger):** Admin chọn mục "Quản lý kho hàng" tại `/admin/inventory`.
7. **Tiền điều kiện (Preconditions):** Admin đã đăng nhập hệ thống (`requireAdmin`).
8. **Hậu điều kiện (Postconditions):** Số lượng tồn kho `stock_quantity` trong bảng `product_variants` được cập nhật chính xác; bản ghi kiểm toán được tạo trong `inventory_transactions`.
9. **Luồng sự kiện chính (Main Success Flow):**
   - **Bước 1 (Actor):** Admin truy cập trang Quản lý kho `/admin/inventory`.
   - **Bước 2 (System):** Hiển thị danh sách biến thể: Tên sản phẩm, SKU, Màu, Size, Giá, Tồn kho hiện tại (`src/controllers/admin.controller.js:560-600`).
   - **Bước 3 (System - Cảnh báo tồn thấp):** Tự động gắn nhãn cảnh báo đỏ cho các biến thể có `stock_quantity <= 5`.
   - **Bước 4 (Actor):** Admin bấm "Điều chỉnh tồn" tại một biến thể SKU.
   - **Bước 5 (System):** Hiển thị Modal điều chỉnh: SKU, Số tồn hiện tại, Số lượng thay đổi và **Lý do điều chỉnh (Bắt buộc)**.
   - **Bước 6 (Actor):** Admin nhập số lượng và lý do kiểm kê, bấm xác nhận (`POST /admin/inventory/adjust`).
   - **Bước 7 (System - Transaction CSDL):**
     - Mở Transaction SQL Server (`src/controllers/admin.controller.js:605-645`).
     - Khóa dòng biến thể: `SELECT stock_quantity FROM product_variants WITH (UPDLOCK, ROWLOCK) WHERE id = @varId`.
     - Kiểm tra tồn kho sau điều chỉnh không âm (`newStock >= 0`).
     - Cập nhật số tồn mới vào `product_variants`.
     - Lưu bản ghi kiểm toán vào `inventory_transactions`: `variant_id, old_quantity, new_quantity, change_quantity, reason, user_id`.
     - Commit Transaction.
   - **Bước 8 (System):** Cập nhật hiển thị số tồn mới và thông báo thành công.
10. **Luồng sự kiện thay thế:** Admin xem lịch sử biến động kho tại `/admin/inventory/history` (`src/controllers/admin.controller.js:648-660`).
11. **Quy tắc nghiệp vụ:**
    - **BR-INV-01:** Số lượng tồn kho không bao giờ được phép âm (`stock_quantity >= 0`).
    - **BR-INV-04:** Mọi thay đổi tồn kho bắt buộc lưu vết kiểm toán vào bảng `inventory_transactions`.
12. **Dữ liệu đầu vào:** `variant_id`, `change_quantity`, `reason`.
13. **Dữ liệu đầu ra:** `stock_quantity` cập nhật, bản ghi `inventory_transactions`.
14. **Mức độ ưu tiên:** Cao (High).
15. **Quan hệ với Use Case khác:**
    - `<<include>>`: Cảnh báo hàng tồn thấp.
    - `<..`: Điều chỉnh tồn kho thủ công, Xem lịch sử biến động kho (`<<extend>>`).

---

### UC12: Quản lý danh mục, thương hiệu, sản phẩm & banner (Admin)

1. **Mã Use Case:** UC12
2. **Tên Use Case:** Quản trị Danh mục, Thương hiệu, Sản phẩm, Ma trận Biến thể và Banner quảng cáo
3. **Tác nhân chính (Primary Actor):** Quản trị viên (Admin)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Cung cấp đầy đủ công cụ quản trị danh mục sản phẩm, thương hiệu/bộ sưu tập, tạo mới và cập nhật sản phẩm giày dép đa biến thể Kích cỡ x Màu sắc, tải lên bộ sưu tập ảnh và cấu hình slider banner quảng cáo trang chủ.
6. **Điều kiện kích hoạt (Trigger):** Admin chọn các mục tương ứng trong menu quản trị `/admin/products`, `/admin/categories`, `/admin/banners`.
7. **Tiền điều kiện (Preconditions):** Admin đã đăng nhập hệ thống (`requireAdmin`).
8. **Hậu điều kiện (Postconditions):** Bản ghi sản phẩm, danh mục, thương hiệu, banner hoặc biến thể được thêm mới, cập nhật hoặc ẩn/xóa trong CSDL.
9. **Luồng sự kiện chính (Main Success Flow - 4 Nhánh Nghiệp vụ Đã Triển khai):**
   - **Nhánh 1: Quản lý Danh mục (Categories):**
     - Admin truy cập `/admin/categories` (`src/controllers/admin.controller.js:665-685`).
     - Admin thêm danh mục mới qua `POST /admin/categories/create` (`src/controllers/admin.controller.js:694-720`) hoặc bật/tắt trạng thái hiển thị qua `POST /admin/categories/:id/toggle` (`src/controllers/admin.controller.js:726-739`).
     - Cập nhật bảng `categories (id, name, slug, description, is_active)`.
   - **Nhánh 2: Quản lý Thương hiệu / Bộ sưu tập (Brands):**
     - Admin xem danh sách thương hiệu kèm số lượng sản phẩm tương ứng hiển thị trực quan tại trang `/admin/categories` (`src/controllers/admin.controller.js:673-677`).
     - Admin tạo thương hiệu mới qua `POST /admin/brands/create` (`src/controllers/admin.controller.js:744-775`): Nhập tên thương hiệu, tự động sinh slug tiếng Việt chuẩn, nhập mô tả.
     - Cập nhật bảng `brands (id, name, slug, description, created_at)`.
   - **Nhánh 3: Quản lý Sản phẩm & Ma trận Biến thể (Products & Variants):**
     - Admin mở form tạo sản phẩm `/admin/products/create` (`src/controllers/admin.controller.js:780-820`).
     - Nhập tên, mã SP, danh mục, thương hiệu, giới tính, giá gốc, giá sale.
     - Cấu hình ma trận biến thể: Chọn Màu sắc và Kích cỡ, hệ thống sinh tổ hợp biến thể; Admin nhập mã SKU và số lượng tồn kho ban đầu cho từng biến thể.
     - Tải lên ảnh chính và ảnh phụ gallery lưu vào `product_images`.
     - Bấm "Lưu sản phẩm" (`POST /admin/products/create`, `src/controllers/admin.controller.js:825-900`): Mở Transaction SQL Server, lưu `products`, `product_images`, `product_variants` và số dư ban đầu trong `inventory_transactions`. Commit.
     - Admin có thể chỉnh sửa sản phẩm (`GET/POST /admin/products/:id/edit`) hoặc bật/tắt hiển thị (`POST /admin/products/:id/toggle`).
   - **Nhánh 4: Quản lý Banner Slider Trang chủ (Banners):**
     - Admin truy cập danh sách banner tại `/admin/banners` (`src/controllers/admin.controller.js:985-996`).
     - Thêm banner mới qua `POST /admin/banners/create` (`src/controllers/admin.controller.js:1001-1021`): Nhập tiêu đề, URL hình ảnh, URL liên kết điều hướng, thứ tự hiển thị (`display_order`).
     - Bật/tắt trạng thái banner qua `POST /admin/banners/:id/toggle` (`src/controllers/admin.controller.js:1025-1038`).
     - Xóa banner qua `POST /admin/banners/:id/delete` (`src/controllers/admin.controller.js:1040-1048`).
     - Cập nhật bảng `banners (id, title, image_url, link_url, display_order, is_active)`.
10. **Luồng sự kiện ngoại lệ:** Trùng mã sản phẩm hoặc SKU -> Báo lỗi trùng lặp dữ liệu. Giá sale >= giá gốc -> Báo lỗi giá không hợp lệ.
11. **Quy tắc nghiệp vụ:**
    - **BR-PRC-01:** Giá niêm yết `base_price > 0`. Nếu có giá khuyến mãi, bắt buộc `0 <= sale_price < base_price`.
    - **BR-VAR-01:** Mã SKU của mỗi biến thể sản phẩm là duy nhất trên toàn hệ thống.
12. **Dữ liệu đầu vào:** Dữ liệu danh mục, thương hiệu, sản phẩm, biến thể SKU, ảnh, banner.
13. **Dữ liệu đầu ra:** Dữ liệu cập nhật trong `categories`, `brands`, `products`, `product_variants`, `product_images`, `banners`.
14. **Mức độ ưu tiên:** Cao (High).
15. **Quan hệ với Use Case khác:** Cung cấp dữ liệu trực tiếp cho `UC05: Tìm kiếm & xem sản phẩm`.

---

### UC13: Quản lý mã giảm giá (Admin)

1. **Mã Use Case:** UC13
2. **Tên Use Case:** Thiết lập và Quản lý Voucher khuyến mãi
3. **Tác nhân chính (Primary Actor):** Quản trị viên (Admin)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Cho phép Admin cấu hình các mã giảm giá (Vouchers) cho các chiến dịch marketing, thiết lập hình thức giảm (theo phần trăm hoặc tiền mặt cố định), giá trị giảm tối đa, đơn hàng tối thiểu, ngày hiệu lực, giới hạn tổng lượt dùng và bật/tắt mã.
6. **Điều kiện kích hoạt (Trigger):** Admin chọn mục "Mã giảm giá" tại `/admin/vouchers`.
7. **Tiền điều kiện (Preconditions):** Admin đã đăng nhập hệ thống (`requireAdmin`).
8. **Hậu điều kiện (Postconditions):** Bản ghi voucher được lưu hoặc cập nhật trong bảng `vouchers`.
9. **Luồng sự kiện chính (Main Success Flow):**
   - **Bước 1 (Actor):** Admin truy cập `/admin/vouchers/create`.
   - **Bước 2 (Actor):** Nhập mã voucher, loại giảm (`PERCENT` hoặc `FIXED`), giá trị giảm, giảm tối đa, đơn tối thiểu, ngày bắt đầu, ngày kết thúc, giới hạn lượt dùng.
   - **Bước 3 (Actor):** Bấm "Lưu mã giảm giá" (`POST /admin/vouchers/create`).
   - **Bước 4 (System):** Kiểm tra tính hợp lệ: Mã chưa tồn tại, `end_date > start_date`, giá trị giảm > 0.
   - **Bước 5 (System):** INSERT vào bảng `vouchers` với `is_active = 1, used_count = 0`.
   - **Bước 6 (System):** Chuyển hướng về danh sách voucher và thông báo tạo thành công.
10. **Luồng sự kiện thay thế:** Bật/tắt kích hoạt voucher tại `/admin/vouchers/:id/toggle`.
11. **Quy tắc nghiệp vụ:**
    - **BR-VOU-02:** Voucher chỉ áp dụng khi: `is_active = 1`, còn trong hạn dùng, chưa hết lượt và đạt đơn tối thiểu.
12. **Dữ liệu đầu vào:** Mã voucher, hình thức giảm, giá trị, thời hạn, điều kiện áp dụng.
13. **Dữ liệu đầu ra:** Bản ghi `vouchers`.
14. **Mức độ ưu tiên:** Trung bình (Medium).
15. **Quan hệ với Use Case khác:** Cung cấp mã cho `UC07: Đặt hàng COD` (`<<extend>>`).

---

### UC14: Báo cáo doanh thu & KPI Dashboard (Admin)

1. **Mã Use Case:** UC14
2. **Tên Use Case:** Báo cáo doanh thu tài chính và Bảng điều khiển KPI
3. **Tác nhân chính (Primary Actor):** Quản trị viên (Admin)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Cung cấp bảng điều khiển trung tâm hiển thị các chỉ số kinh doanh cốt lõi (KPIs), số lượng đơn hàng theo từng trạng thái, danh sách top 5 sản phẩm bán chạy nhất, danh sách sản phẩm sắp hết hàng và tổng doanh thu thực tế được tính toán chuẩn xác từ các đơn hàng đã hoàn tất giao hàng và thu tiền.
6. **Điều kiện kích hoạt (Trigger):** Admin truy cập trang chủ Cổng quản trị tại `/admin/dashboard`.
7. **Tiền điều kiện (Preconditions):** Admin đã đăng nhập hệ thống (`requireAdmin`).
8. **Hậu điều kiện (Postconditions):** Hệ thống kết xuất số liệu thống kê và biểu đồ tài chính chính xác.
9. **Luồng sự kiện chính (Main Success Flow):**
   - **Bước 1 (Actor):** Admin truy cập `/admin/dashboard`.
   - **Bước 2 (System - Tổng hợp dữ liệu tài chính):**
     - **Tính Tổng Doanh thu Thực tế:** Chỉ tính đơn hoàn tất và đã thanh toán:
       ```sql
       SELECT COALESCE(SUM(total_amount), 0) AS total_revenue 
       FROM orders 
       WHERE order_status = 'COMPLETED' AND payment_status = 'PAID'
       ```
     - **Thống kê đơn hàng theo trạng thái:** Đếm số lượng đơn theo từng mốc trạng thái.
     - **Top 5 sản phẩm bán chạy nhất:** Thống kê từ `order_items` thuộc các đơn `COMPLETED`.
     - **Cảnh báo tồn kho:** Đếm số biến thể có `stock_quantity <= 5`.
     - **Thống kê Khách hàng:** Đếm tổng số tài khoản khách hàng hoạt động.
   - **Bước 3 (System):** Kết xuất giao diện Dashboard: 4 thẻ KPI Card, biểu đồ phân bổ trạng thái, bảng đơn hàng mới nhất và bảng Top sản phẩm bán chạy.
10. **Quy tắc nghiệp vụ:**
    - **BR-REV-01:** Doanh thu của hệ thống **chỉ được chính thức ghi nhận từ các đơn hàng có trạng thái `order_status = 'COMPLETED'` và `payment_status = 'PAID'`**.
11. **Dữ liệu đầu vào:** Khoảng thời gian thống kê (tùy chọn).
12. **Dữ liệu đầu ra:** Tổng doanh thu, thống kê đơn hàng, top sản phẩm, cảnh báo kho.
13. **Mức độ ưu tiên:** Cao (High).
14. **Quan hệ với Use Case khác:**
    - `<<include>>`: Tổng hợp doanh thu thực tế, Thống kê đơn theo trạng thái, Top 5 bán chạy.

---

### UC15: Quản lý danh sách yêu thích (Wishlist)

1. **Mã Use Case:** UC15
2. **Tên Use Case:** Quản lý danh sách sản phẩm yêu thích (Wishlist)
3. **Tác nhân chính (Primary Actor):** Khách hàng (Customer) *(Khách vãng lai nhận thông báo đăng nhập)*
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Cho phép khách hàng thêm hoặc xóa sản phẩm khỏi danh sách yêu thích cá nhân chỉ với 1 cú nhấp chuột (1-Click Toggle) trên thẻ sản phẩm hoặc trang chi tiết, xem danh sách các đôi giày đã lưu và xóa sạch danh sách yêu thích. Dữ liệu được lưu trữ bền vững trên máy chủ SQL Server.
6. **Điều kiện kích hoạt (Trigger):** Người dùng nhấp vào biểu tượng Trái tim trên thẻ sản phẩm hoặc nút "Thêm vào yêu thích" tại trang chi tiết.
7. **Tiền điều kiện (Preconditions):** 
   - Đối với Customer: Đã đăng nhập tài khoản.
   - Đối với Guest: Khi nhấp tim, hệ thống hiển thị thông báo Toast yêu cầu đăng nhập (API trả về HTTP 401 Unauthorized JSON).
   - Đối với Admin: Bị chặn hoàn toàn với mã lỗi HTTP 403 Forbidden JSON (`requireCustomer`).
8. **Hậu điều kiện (Postconditions):** Bản ghi được thêm hoặc xóa khỏi bảng `wishlist_items` trong CSDL; cập nhật trạng thái biểu tượng Trái tim.
9. **Luồng sự kiện chính (Main Success Flow - 1-Click Toggle Action):**
   - **Bước 1 (Actor):** Customer nhấp vào biểu tượng Trái tim tại một sản phẩm.
   - **Bước 2 (System):** Gửi yêu cầu `POST /api/wishlist/toggle` kèm `{ productId }` (`src/controllers/wishlist.controller.js:40-75`).
   - **Bước 3 (System):** Middleware `requireCustomer` xác thực: Người dùng đã đăng nhập với vai trò `CUSTOMER` (`src/middlewares/auth.middleware.js:91-110`).
   - **Bước 4 (System):** Truy vấn CSDL kiểm tra: `SELECT id FROM wishlist_items WHERE user_id = @userId AND product_id = @productId`.
   - **Bước 5 (System):**
     - Nếu đã tồn tại -> DELETE xóa bản ghi, trả về `{ inWishlist: false, message: 'Đã xóa khỏi danh sách yêu thích' }`.
     - Nếu chưa tồn tại -> INSERT bản ghi mới, trả về `{ inWishlist: true, message: 'Đã thêm vào danh sách yêu thích' }`.
   - **Bước 6 (System):** Giao diện cập nhật biểu tượng Trái tim (đỏ/rỗng) và hiển thị thông báo Toast xác nhận.
10. **Luồng sự kiện thay thế:**
    - Xem danh sách yêu thích: `GET /api/wishlist` -> Tải toàn bộ sản phẩm đã thích kèm ảnh, giá, tồn kho.
    - Xóa sạch danh sách: `DELETE /api/wishlist` -> Xóa toàn bộ bản ghi thuộc `user_id` trong `wishlist_items`.
11. **Luồng sự kiện ngoại lệ:**
    - Guest bấm Tim: Client hiển thị Toast nhắc đăng nhập (API trả về 401).
    - Admin bấm Tim: API trả về HTTP 403 Forbidden: "Tài khoản Quản trị viên không thể thực hiện thao tác này."
12. **Quy tắc nghiệp vụ:**
    - **BR-WSH-01:** Danh sách yêu thích bắt buộc lưu trữ bền vững trên CSDL SQL Server (`wishlist_items`).
    - **BR-WSH-02:** Ràng buộc duy nhất trên cặp `(user_id, product_id)`: Một sản phẩm chỉ xuất hiện 1 lần trong wishlist của một khách hàng.
13. **Dữ liệu đầu vào:** `productId`.
14. **Dữ liệu đầu ra:** Trạng thái `inWishlist`, bản ghi `wishlist_items`.
15. **Mức độ ưu tiên:** Trung bình (Medium).
16. **Quan hệ với Use Case khác:**
    - `<..`: Bật/tắt yêu thích 1-click Toggle, Xóa sạch danh sách yêu thích (`<<extend>>`).

---

### UC16: Quản lý tài khoản khách hàng (Admin)

1. **Mã Use Case:** UC16
2. **Tên Use Case:** Quản lý Danh sách và Trạng thái Tài khoản Khách hàng
3. **Tác nhân chính (Primary Actor):** Quản trị viên (Admin)
4. **Tác nhân phụ (Secondary Actor):** Không có
5. **Mô tả tóm tắt:** Cho phép Quản trị viên tra cứu danh sách toàn bộ khách hàng đã đăng ký, xem chi tiết lịch sử mua sắm và tổng chi tiêu của từng khách hàng, đồng thời thực hiện thao tác Khóa (Lock) hoặc Mở khóa (Unlock) tài khoản khách hàng khi phát hiện vi phạm với cơ chế bảo vệ chống tự khóa tài khoản Admin.
6. **Điều kiện kích hoạt (Trigger):** Admin chọn mục "Khách hàng" tại `/admin/customers`.
7. **Tiền điều kiện (Preconditions):** Admin đã đăng nhập hệ thống (`requireAdmin`).
8. **Hậu điều kiện (Postconditions):** 
   - Trạng thái `status` của tài khoản khách hàng trong bảng `users` được cập nhật thành `'locked'` hoặc `'active'`.
   - Nếu bị khóa: Phiên làm việc hiện tại của khách hàng đó lập tức bị thu hồi ở request tiếp theo (Revoke Session).
9. **Luồng sự kiện chính (Main Success Flow):**
   - **Bước 1 (Actor):** Admin truy cập `/admin/customers` (`src/controllers/admin.controller.js:460-490`).
   - **Bước 2 (System):** Hiển thị danh sách khách hàng (`role = 'CUSTOMER'`): ID, Họ tên, Email, SĐT, Ngày tạo, Tổng số đơn, Tổng chi tiêu, Trạng thái.
   - **Bước 3 (Actor):** Admin xem chi tiết khách hàng tại `/admin/customers/:id` (`src/controllers/admin.controller.js:495-525`).
   - **Bước 4 (System):** Hiển thị hồ sơ cá nhân, danh sách địa chỉ và toàn bộ lịch sử đơn hàng của khách hàng đó.
   - **Bước 5 (Actor):** Admin nhấp nút "Khóa tài khoản" (hoặc "Mở khóa") (`POST /admin/customers/:id/toggle-status`).
   - **Bước 6 (System - Kiểm tra an toàn):**
     - Kiểm tra vai trò tài khoản đích: Nếu có `role === 'ADMIN'`, từ chối thao tác (`src/controllers/admin.controller.js:530-550`).
     - Thực thi câu lệnh SQL:
       ```sql
       UPDATE users 
       SET status = CASE WHEN status = 'active' THEN 'locked' ELSE 'active' END, 
           updated_at = GETDATE() 
       WHERE id = @targetUserId AND role = 'CUSTOMER'
       ```
   - **Bước 7 (System):** Cập nhật hiển thị trạng thái và thông báo thành công.
10. **Luồng sự kiện ngoại lệ:** Admin cố tình khóa tài khoản Admin -> Báo lỗi: "Không thể khóa tài khoản có quyền Quản trị viên."
11. **Quy tắc nghiệp vụ:**
    - **BR-USR-02:** Cấm tuyệt đối hành vi khóa tài khoản Quản trị viên.
    - **BR-SEC-03:** Khi tài khoản bị khóa (`status = 'locked'`), middleware lập tức thu hồi session (`req.session.destroy`) và đẩy về login.
12. **Dữ liệu đầu vào:** `customerId`, thao tác toggle trạng thái.
13. **Dữ liệu đầu ra:** Trạng thái tài khoản cập nhật trong `users`.
14. **Mức độ ưu tiên:** Cao (High).
15. **Quan hệ với Use Case khác:**
    - `<<include>>`: Xem danh sách & lịch sử mua hàng.
    - `<..`: Khóa / Mở khóa tài khoản khách hàng (`<<extend>>`).
