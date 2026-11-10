# 04. ĐẶC TẢ CÁC USE CASE QUAN TRỌNG (USE CASE SPECIFICATIONS v1.1)

> **Hệ thống:** VAMOS STORE  
> **Thương hiệu:** VAMOS  
> **Chuẩn tài liệu:** Mẫu đặc tả Use Case chi tiết chuẩn UML 2.5 (Thống nhất mã định danh từ UC-01 đến UC-14)  

---

## MỤC LỤC ĐẶC TẢ
1. [UC-01: Đăng ký tài khoản](#uc-01-đăng-ký-tài-khoản)
2. [UC-02: Đăng nhập](#uc-02-đăng-nhập)
3. [UC-03: Khôi phục mật khẩu](#uc-03-khôi-phục-mật-khẩu)
4. [UC-04: Quản lý hồ sơ & địa chỉ](#uc-04-quản-lý-hồ-sơ--địa-chỉ)
5. [UC-05: Tìm kiếm & xem sản phẩm](#uc-05-tìm-kiếm--xem-sản-phẩm)
6. [UC-06: Quản lý giỏ hàng](#uc-06-quản-lý-giỏ-hàng)
7. [UC-07: Đặt hàng COD](#uc-07-đặt-hàng-cod)
8. [UC-08: Tra cứu & theo dõi đơn hàng](#uc-08-tra-cứu--theo-dõi-đơn-hàng)
9. [UC-09: Hủy đơn hàng (Khách hàng)](#uc-09-hủy-đơn-hàng-khách-hàng)
10. [UC-10: Xử lý & cập nhật đơn hàng (Admin)](#uc-10-xử-lý--cập-nhật-đơn-hàng-admin)
11. [UC-11: Quản lý tồn kho (Admin)](#uc-11-quản-lý-tồn-kho-admin)
12. [UC-12: Quản lý sản phẩm & danh mục (Admin)](#uc-12-quản-lý-sản-phẩm--danh-mục-admin)
13. [UC-13: Quản lý mã giảm giá (Admin)](#uc-13-quản-lý-mã-giảm-giá-admin)
14. [UC-14: Xem báo cáo doanh thu (Admin)](#uc-14-xem-báo-cáo-doanh-thu-admin)

---

### UC-01: Đăng ký tài khoản
- **Mã Use Case:** UC-01
- **Tên Use Case:** Đăng ký tài khoản khách hàng
- **Mục tiêu:** Tạo tài khoản Customer mới để mua hàng và lưu thông tin.
- **Actor chính:** Guest
- **Tiền điều kiện:** Người dùng chưa đăng nhập.
- **Hậu điều kiện thành công:** Tài khoản mới được tạo trong `users` với `role = 'CUSTOMER'`, `status = 'active'`, mật khẩu được mã hóa bcrypt; điều hướng đến trang Đăng nhập.
- **Luồng sự kiện chính (Main Flow):**
  1. Guest chọn "Đăng ký".
  2. Hệ thống hiển thị biểu mẫu: Họ tên, Email, Số điện thoại, Mật khẩu, Xác nhận mật khẩu.
  3. Guest nhập thông tin hợp lệ và gửi biểu mẫu.
  4. Hệ thống kiểm tra dữ liệu bắt buộc, định dạng email, độ dài mật khẩu >= 8 ký tự.
  5. Hệ thống kiểm tra email chưa từng tồn tại trong CSDL.
  6. Hệ thống băm mật khẩu bằng bcrypt (salt rounds >= 10).
  7. Hệ thống lưu bản ghi người dùng mới vào bảng `users`.
  8. Hệ thống thông báo đăng ký thành công và chuyển hướng đến trang Đăng nhập (`UC-02`).
- **Ngoại lệ:** Email đã tồn tại $\rightarrow$ Báo lỗi email đã đăng ký. Mật khẩu không khớp $\rightarrow$ Báo lỗi xác nhận mật khẩu.

---

### UC-02: Đăng nhập
- **Mã Use Case:** UC-02
- **Tên Use Case:** Đăng nhập hệ thống
- **Mục tiêu:** Xác thực danh tính và cấp session truy cập an toàn theo vai trò.
- **Actor chính:** Guest, Customer, Admin
- **Tiền điều kiện:** Tài khoản đã được tạo và không bị khóa.
- **Hậu điều kiện thành công:** Tạo session an toàn phía máy chủ (`req.session.user`); điều hướng Customer về trang chủ/giỏ hàng, Admin về `/admin/dashboard`.
- **Luồng sự kiện chính (Main Flow):**
  1. Người dùng mở trang Đăng nhập, nhập Email và Mật khẩu.
  2. Hệ thống kiểm tra các trường bắt buộc không để trống.
  3. Hệ thống tìm kiếm tài khoản theo email trong bảng `users`.
  4. Hệ thống kiểm tra trạng thái tài khoản: Nếu `status === 'locked'`, từ chối đăng nhập.
  5. Hệ thống đối chiếu mật khẩu với mã băm trong database qua `bcrypt.compare`.
  6. Hệ thống khởi tạo session an toàn trên máy chủ lưu `user_id`, `role`, `full_name`.
  7. Hệ thống điều hướng theo vai trò (Customer hoặc Admin).
- **Ngoại lệ:** Sai email/mật khẩu $\rightarrow$ Báo lỗi chung "Email hoặc mật khẩu không chính xác". Tài khoản bị khóa $\rightarrow$ Báo lỗi tài khoản bị tạm khóa.

---

### UC-03: Khôi phục mật khẩu
- **Mã Use Case:** UC-03
- **Tên Use Case:** Khôi phục mật khẩu qua Email
- **Mục tiêu:** Giúp người dùng lấy lại quyền truy cập tài khoản khi quên mật khẩu qua token an toàn.
- **Actor chính:** Guest
- **Actor phụ:** Email Service
- **Tiền điều kiện:** Tài khoản tồn tại trong hệ thống.
- **Hậu điều kiện thành công:** Mật khẩu mới được cập nhật vào database, token bị vô hiệu hóa; người dùng đăng nhập bằng mật khẩu mới.
- **Luồng sự kiện chính (Main Flow):**
  1. Người dùng chọn "Quên mật khẩu?" tại trang đăng nhập.
  2. Người dùng nhập email tài khoản và gửi yêu cầu.
  3. Hệ thống kiểm tra email tồn tại trong bảng `users`.
  4. Hệ thống sinh mã token ngẫu nhiên bảo mật, lưu vào `password_reset_tokens` kèm thời hạn (30 phút).
  5. Hệ thống kích hoạt Email Service gửi đường dẫn đặt lại mật khẩu kèm token tới email của người dùng.
  6. Người dùng mở email, bấm vào đường dẫn để mở trang đặt lại mật khẩu.
  7. Hệ thống xác thực token: Kiểm tra token tồn tại, chưa sử dụng và còn trong thời hạn.
  8. Người dùng nhập mật khẩu mới và xác nhận mật khẩu.
  9. Hệ thống băm mật khẩu mới, cập nhật vào bảng `users`, đồng thời đánh dấu token đã sử dụng.
  10. Hệ thống hiển thị thông báo thành công và chuyển hướng về trang Đăng nhập.
- **Ngoại lệ:** Token không hợp lệ hoặc đã hết hạn $\rightarrow$ Báo lỗi yêu cầu thực hiện lại.

---

### UC-04: Quản lý hồ sơ & địa chỉ
- **Mã Use Case:** UC-04
- **Tên Use Case:** Quản lý thông tin hồ sơ và sổ địa chỉ giao hàng
- **Mục tiêu:** Cho phép khách hàng quản lý thông tin cá nhân, đổi mật khẩu và quản lý danh sách nhiều địa chỉ giao hàng.
- **Actor chính:** Customer
- **Tiền điều kiện:** Customer đã đăng nhập tài khoản.
- **Hậu điều kiện thành công:** Thông tin cá nhân hoặc sổ địa chỉ được cập nhật chính xác trong CSDL.
- **Luồng sự kiện chính (Main Flow):**
  1. Customer truy cập trang "Hồ sơ của tôi".
  2. Chỉnh sửa thông tin cá nhân: Customer cập nhật họ tên, số điện thoại $\rightarrow$ Hệ thống kiểm tra và lưu vào `users`.
  3. Đổi mật khẩu: Customer nhập mật khẩu cũ, mật khẩu mới $\rightarrow$ Hệ thống kiểm tra mật khẩu cũ chính xác và cập nhật mật khẩu băm mới.
  4. Quản lý sổ địa chỉ: Customer xem danh sách địa chỉ nhận hàng, có thể:
     - Thêm địa chỉ mới: Nhập người nhận, SĐT, tỉnh/thành, quận/huyện, phường/xã, địa chỉ chi tiết.
     - Sửa hoặc xóa địa chỉ có sẵn.
     - Đặt một địa chỉ làm địa chỉ mặc định (`is_default = true`).
- **Ngoại lệ:** Nhập sai mật khẩu hiện tại $\rightarrow$ Báo lỗi mật khẩu cũ không đúng.

---

### UC-05: Tìm kiếm & xem sản phẩm
- **Mã Use Case:** UC-05
- **Tên Use Case:** Khám phá, Tìm kiếm và Xem chi tiết sản phẩm
- **Mục tiêu:** Người dùng tìm thấy sản phẩm giày dép mong muốn theo danh mục, từ khóa và bộ lọc; xem chi tiết biến thể kích cỡ, màu sắc và tình trạng còn hàng.
- **Actor chính:** Guest, Customer
- **Tiền điều kiện:** Người dùng truy cập website.
- **Hậu điều kiện thành công:** Danh sách sản phẩm hoặc thông tin chi tiết biến thể được hiển thị đầy đủ, chính xác.
- **Luồng sự kiện chính (Main Flow):**
  1. Người dùng duyệt danh mục hoặc nhập từ khóa tìm kiếm (theo tên hoặc mã sản phẩm).
  2. Người dùng áp dụng các tiêu chí lọc: Giới tính (Nam, Nữ, Trẻ em, Unisex), Kích cỡ (Size 36 - 45), Màu sắc, Khoảng giá; hoặc chọn sắp xếp (giá tăng/giảm, mới nhất).
  3. Hệ thống trả về danh sách sản phẩm `active` khớp điều kiện lọc.
  4. Người dùng bấm vào một sản phẩm cụ thể.
  5. Hệ thống tải chi tiết sản phẩm: tên, mã SP, mô tả, bộ sưu tập ảnh từ `product_images`, danh mục và giá.
  6. Hệ thống hiển thị bảng ma trận biến thể: Màu sắc và Kích cỡ khả dụng.
  7. Người dùng bấm chọn Màu và Size $\rightarrow$ Hệ thống cập nhật hiển thị mã SKU tương ứng và số lượng tồn kho khả dụng (`stock_quantity`).
  8. Hệ thống tự động hiển thị khối 4-8 sản phẩm liên quan cùng danh mục ở cuối trang.
- **Ngoại lệ:** Không tìm thấy sản phẩm khớp bộ lọc $\rightarrow$ Hiển thị thông báo rỗng kèm nút xóa bộ lọc.

---

### UC-06: Quản lý giỏ hàng
- **Mã Use Case:** UC-06
- **Tên Use Case:** Quản lý giỏ hàng
- **Mục tiêu:** Quản lý danh sách sản phẩm dự định mua, cập nhật số lượng và kiểm tra tồn kho.
- **Actor chính:** Customer
- **Tiền điều kiện:** Customer đã đăng nhập tài khoản.
- **Hậu điều kiện thành công:** Dòng sản phẩm trong `cart_items` được thêm mới, cập nhật hoặc xóa; cập nhật tổng tiền tạm tính; không làm giảm tồn kho hệ thống (giỏ hàng không giữ chỗ).
- **Luồng sự kiện chính (Main Flow):**
  1. Tại trang chi tiết sản phẩm, Customer chọn Màu sắc, Kích cỡ và số lượng, bấm "Thêm vào giỏ hàng".
  2. Hệ thống kiểm tra biến thể hợp lệ và kiểm tra `(số lượng hiện có trong giỏ + số lượng thêm mới) <= stock_quantity`.
  3. Hệ thống thêm mới hoặc tăng số lượng dòng sản phẩm trong `cart_items`.
  4. Customer mở trang giỏ hàng: xem danh sách các đôi giày đã chọn (ảnh, tên, size, màu, đơn giá, thành tiền).
  5. Customer có thể thay đổi số lượng (hệ thống kiểm tra tồn kho) hoặc bấm xóa sản phẩm.
  6. Hệ thống tự động tính toán lại tạm tính tổng tiền hàng.
- **Ngoại lệ:** Thêm số lượng vượt quá tồn kho $\rightarrow$ Báo lỗi số lượng trong kho không đủ.

---

### UC-07: Đặt hàng COD
- **Mã Use Case:** UC-07
- **Tên Use Case:** Đặt hàng thanh toán khi nhận hàng (COD)
- **Mục tiêu:** Tạo đơn hàng chính thức trong hệ thống, lưu bản snapshot thông tin mua, trừ tồn kho và khởi động quy trình vận hành đơn.
- **Actor chính:** Customer
- **Tiền điều kiện:** Customer đã đăng nhập; giỏ hàng có ít nhất một sản phẩm.
- **Hậu điều kiện thành công:** Đơn hàng mới được tạo trong `orders` (`order_status = 'PENDING'`, `payment_status = 'UNPAID'`, mã đơn duy nhất), toàn bộ mặt hàng được lưu snapshot vào `order_items`, tồn kho các biến thể bị trừ chính xác trong Database Transaction, xóa các sản phẩm đã đặt khỏi giỏ.
- **Luồng sự kiện chính (Main Flow - Database Transaction):**
  1. Customer chọn "Tiến hành đặt hàng" từ giỏ hàng.
  2. Hệ thống hiển thị tóm tắt đơn hàng.
  3. `<<include>>`: Customer chọn địa chỉ giao hàng từ sổ địa chỉ hoặc nhập địa chỉ mới.
  4. `<<extend>>`: Customer nhập mã giảm giá (Voucher) $\rightarrow$ Hệ thống kiểm tra điều kiện (thời hạn, lượt dùng, đơn tối thiểu), tính số tiền giảm và cập nhật tổng tiền.
  5. `<<include>>`: Customer xác nhận phương thức thanh toán duy nhất là COD và nhập ghi chú (nếu có).
  6. Customer bấm nút "XÁC NHẬN ĐẶT HÀNG".
  7. Hệ thống mở Database Transaction:
     - `<<include>>`: Khóa dòng kiểm tra tồn kho thời gian thực của các biến thể trong giỏ (`SELECT stock_quantity FROM product_variants WHERE id IN (...) FOR UPDATE`). Nếu bất kỳ biến thể nào không đủ tồn kho, Rollback transaction và thông báo lỗi.
     - Tạo mã đơn hàng ngẫu nhiên không trùng lặp (ví dụ: `VMS-261105-001`).
     - Tạo snapshot thông tin người nhận và địa chỉ giao hàng chi tiết.
     - Lưu bản ghi vào bảng `orders` ở trạng thái `PENDING`.
     - Duyệt từng dòng giỏ hàng: Tạo bản ghi trong `order_items` lưu snapshot tên SP, SKU, Size, Màu, đơn giá tại thời điểm mua; cập nhật trừ tồn kho trong `product_variants`: `stock_quantity = stock_quantity - quantity`.
     - Ghi nhận giao dịch xuất kho vào `inventory_transactions`.
     - Tăng số lượt sử dụng của voucher (nếu có).
     - Ghi nhận lịch sử trạng thái ban đầu vào `order_status_histories`.
     - Xóa các sản phẩm đã đặt khỏi bảng `cart_items`.
  8. Hệ thống Commit Transaction.
  9. Hệ thống chuyển hướng khách hàng sang màn hình kết quả đặt hàng thành công, hiển thị mã đơn hàng và tổng tiền cần thanh toán khi nhận hàng.
- **Ngoại lệ:** Tồn kho không đủ tại thời điểm xác nhận $\rightarrow$ Rollback transaction, báo lỗi sản phẩm đã hết hàng.

---

### UC-08: Tra cứu & theo dõi đơn hàng
- **Mã Use Case:** UC-08
- **Tên Use Case:** Tra cứu lịch sử và theo dõi tiến trình đơn hàng
- **Mục tiêu:** Khách hàng theo dõi danh sách các đơn hàng đã đặt và dòng thời gian xử lý vận chuyển thực tế.
- **Actor chính:** Customer
- **Tiền điều kiện:** Customer đã đăng nhập tài khoản.
- **Hậu điều kiện thành công:** Hiển thị chi tiết đơn hàng, snapshot mặt hàng, địa chỉ nhận hàng, phương thức COD, tổng tiền và tiến trình trạng thái trực quan (Timeline).
- **Luồng sự kiện chính (Main Flow):**
  1. Customer mở trang "Đơn hàng của tôi".
  2. Hệ thống tải danh sách các đơn hàng thuộc quyền sở hữu của Customer (`orders.user_id === current_user.id`).
  3. Customer bấm xem một đơn hàng cụ thể.
  4. Hệ thống hiển thị chi tiết đơn: Mã đơn, ngày đặt, địa chỉ nhận hàng, ghi chú, trạng thái hiện tại.
  5. Hệ thống hiển thị danh sách sản phẩm từ `order_items` (hiển thị snapshot size, màu, đơn giá tại thời điểm mua).
  6. Hệ thống tải lịch sử chuyển trạng thái từ `order_status_histories` hiển thị dòng thời gian (Timeline) từ `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`.
  7. Nếu trạng thái đơn hiện tại là `PENDING`, hệ thống kích hoạt hiển thị nút "Hủy đơn hàng" (`UC-09`).
- **Ngoại lệ:** Truy cập đơn hàng của người khác $\rightarrow$ Báo lỗi 403 Forbidden không có quyền xem.

---

### UC-09: Hủy đơn hàng (Khách hàng)
- **Mã Use Case:** UC-09
- **Tên Use Case:** Hủy đơn hàng phía khách hàng
- **Mục tiêu:** Khách hàng chủ động hủy đơn hàng khi đơn còn ở giai đoạn chờ xác nhận (`PENDING`).
- **Actor chính:** Customer
- **Tiền điều kiện:** Customer đã đăng nhập; đơn hàng thuộc sở hữu của Customer; trạng thái hiện tại là `PENDING`.
- **Hậu điều kiện thành công:** Trạng thái đơn đổi thành `CANCELLED`; tồn kho các biến thể được cộng hoàn trả tự động đúng 1 lần duy nhất trong Transaction.
- **Luồng sự kiện chính (Main Flow - Database Transaction):**
  1. Customer bấm nút "Hủy đơn hàng" tại chi tiết đơn hàng đang `PENDING`.
  2. Hệ thống hiển thị hộp thoại xác nhận: "Bạn có chắc chắn muốn hủy đơn hàng này không?".
  3. Customer xác nhận đồng ý.
  4. Hệ thống mở Database Transaction:
     - Khóa dòng đơn hàng kiểm tra lại trạng thái.
     - Cập nhật `orders.order_status = 'CANCELLED'`.
     - Duyệt danh sách `order_items` của đơn hàng, cộng hoàn trả số lượng vào `product_variants.stock_quantity`.
     - Ghi nhận lịch sử hoàn kho vào `inventory_transactions`.
     - Ghi nhận vào `order_status_histories`: `previous_status = 'PENDING'`, `new_status = 'CANCELLED'`, `changed_by = Customer_id`, `note = 'Khách hàng tự hủy'`.
  5. Hệ thống Commit Transaction.
  6. Hệ thống hiển thị thông báo "Hủy đơn hàng thành công" và cập nhật giao diện chi tiết đơn sang trạng thái ĐÃ HỦY.
- **Ngoại lệ:** Đơn hàng đã chuyển sang `CONFIRMED` $\rightarrow$ Rollback transaction, thông báo đơn đã được nhân viên tiếp nhận, không thể tự hủy.

---

### UC-10: Xử lý & cập nhật đơn hàng (Admin)
- **Mã Use Case:** UC-10
- **Tên Use Case:** Xử lý và cập nhật trạng thái đơn hàng nội bộ
- **Mục tiêu:** Quản trị viên tiếp nhận đơn, xác nhận, chuyển tiếp trạng thái đơn hàng theo đúng vòng đời nghiệp vụ; hoặc hủy đơn nội bộ kèm hoàn kho.
- **Actor chính:** Admin
- **Tiền điều kiện:** Admin đã đăng nhập hệ thống.
- **Hậu điều kiện thành công:** Trạng thái đơn hàng được chuyển sang bước tiếp theo hợp lệ; lưu vết lịch sử; nếu chuyển sang `COMPLETED` thì cập nhật `payment_status = 'PAID'`.
- **Luồng sự kiện chính (Main Flow):**
  1. Admin mở danh sách đơn hàng quản trị, lọc theo trạng thái hoặc tìm theo mã đơn/SĐT.
  2. Admin chọn xem một đơn hàng cụ thể.
  3. Hệ thống hiển thị đầy đủ thông tin: Người nhận, địa chỉ, snapshot sản phẩm, ghi chú và trạng thái hiện tại.
  4. Admin chọn chuyển trạng thái tiếp theo hợp lệ:
     - `PENDING` $\rightarrow$ `CONFIRMED` (Xác nhận đơn)
     - `CONFIRMED` $\rightarrow$ `PROCESSING` (Chuẩn bị hàng)
     - `PROCESSING` $\rightarrow$ `SHIPPING` (Bàn giao giao hàng)
     - `SHIPPING` $\rightarrow$ `COMPLETED` (Hoàn thành)
  5. Hệ thống cập nhật `orders.order_status`.
  6. Nếu trạng thái mới là `COMPLETED`: Hệ thống tự động cập nhật `payment_status = 'PAID'` (đã thu tiền COD).
  7. Hệ thống ghi nhận bản ghi vào `order_status_histories` kèm Admin User ID và ghi chú.
  8. Nhánh hủy nội bộ (`<<extend>>`): Nếu đơn ở `PENDING` hoặc `CONFIRMED` và khách báo hủy qua hotline hoặc đơn giả mạo, Admin chọn "Hủy đơn nội bộ", nhập lý do bắt buộc $\rightarrow$ Hệ thống chuyển sang `CANCELLED` và tự động hoàn trả tồn kho trong Transaction.
- **Ngoại lệ:** Cố tình chuyển cóc trạng thái sai quy tắc $\rightarrow$ Báo lỗi chuyển trạng thái không hợp lệ.

---

### UC-11: Quản lý tồn kho (Admin)
- **Mã Use Case:** UC-11
- **Tên Use Case:** Quản lý và điều chỉnh tồn kho
- **Mục tiêu:** Theo dõi tồn kho theo từng biến thể SKU, theo dõi cảnh báo sắp hết hàng và thực hiện điều chỉnh tồn kho có lưu vết lý do kiểm kê.
- **Actor chính:** Admin
- **Tiền điều kiện:** Admin đã đăng nhập.
- **Hậu điều kiện thành công:** Số lượng tồn kho được cập nhật; tạo bản ghi kiểm toán trong `inventory_transactions`.
- **Luồng sự kiện chính (Main Flow):**
  1. Admin mở trang Quản lý tồn kho.
  2. Hệ thống hiển thị danh sách biến thể sản phẩm: Tên SP, SKU, Màu, Size, Số lượng tồn hiện tại.
  3. Admin có thể lọc các biến thể có số tồn `<= 5` (Cảnh báo sắp hết hàng) để chủ động nhập hàng.
  4. Admin bấm "Điều chỉnh tồn" tại một biến thể.
  5. Admin nhập số lượng thay đổi (tăng/giảm/nhập số tồn thực tế sau kiểm kê) và nhập **Lý do điều chỉnh** (bắt buộc: Nhập hàng mới / Hàng lỗi hỏng / Cân bằng kiểm kê).
  6. Hệ thống kiểm tra số tồn sau điều chỉnh không âm.
  7. Hệ thống mở Transaction: Cập nhật `product_variants.stock_quantity`, lưu bản ghi vào `inventory_transactions` kèm Admin ID và lý do.
  8. Hệ thống Commit Transaction và thông báo thành công.
- **Ngoại lệ:** Không nhập lý do điều chỉnh $\rightarrow$ Báo lỗi lý do là trường bắt buộc.

---

### UC-12: Quản lý sản phẩm & danh mục (Admin)
- **Mã Use Case:** UC-12
- **Tên Use Case:** Quản lý danh mục, banner, sản phẩm và biến thể
- **Mục tiêu:** Quản trị toàn diện danh mục sản phẩm, slider banner trang chủ và danh sách sản phẩm giày dép đa biến thể Kích cỡ x Màu sắc.
- **Actor chính:** Admin
- **Tiền điều kiện:** Admin đã đăng nhập.
- **Hậu điều kiện thành công:** Dữ liệu danh mục, banner, sản phẩm và biến thể được lưu trữ nhất quán trong CSDL.
- **Luồng sự kiện chính (Main Flow):**
  1. Quản lý danh mục & Banner: Admin có thể thêm, sửa, ẩn danh mục sản phẩm hoặc cập nhật hình ảnh slider banner trang chủ.
  2. Thêm mới sản phẩm: Admin mở form thêm sản phẩm, nhập tên, mã SP, mô tả, danh mục, giới tính, giá gốc, giá sale.
  3. `<<include>>`: Tải lên danh sách ảnh sản phẩm lưu vào `product_images`.
  4. `<<include>>`: Cấu hình danh sách Màu sắc và Kích cỡ; hệ thống sinh ma trận biến thể; Admin nhập mã SKU duy nhất và số lượng tồn ban đầu cho từng biến thể.
  5. Admin bấm "Lưu sản phẩm".
  6. Hệ thống mở Transaction: Lưu `products`, `product_images`, `product_variants` và số dư ban đầu trong `inventory_transactions`.
  7. Hệ thống Commit Transaction và thông báo thành công.
- **Ngoại lệ:** Trùng mã sản phẩm hoặc trùng SKU $\rightarrow$ Báo lỗi dữ liệu đã tồn tại.

---

### UC-13: Quản lý mã giảm giá (Admin)
- **Mã Use Case:** UC-13
- **Tên Use Case:** Quản lý voucher khuyến mãi
- **Mục tiêu:** Thiết lập và quản lý các chương trình khuyến mãi giảm giá bằng voucher.
- **Actor chính:** Admin
- **Tiền điều kiện:** Admin đã đăng nhập.
- **Hậu điều kiện thành công:** Bản ghi voucher được lưu hoặc cập nhật trong bảng `vouchers`.
- **Luồng sự kiện chính (Main Flow):**
  1. Admin mở trang Quản lý Voucher, bấm "Tạo voucher mới".
  2. Admin cấu hình: Mã voucher (viết hoa), Tên chương trình, Loại giảm (% hoặc số tiền cố định), Giá trị giảm, Đơn hàng tối thiểu, Ngày bắt đầu, Ngày kết thúc, Giới hạn lượt dùng, Cờ hoạt động.
  3. Admin bấm "Lưu voucher".
  4. Hệ thống kiểm tra tính hợp lệ: Mã voucher chưa tồn tại, `end_date > start_date`, giá trị giảm > 0.
  5. Hệ thống lưu bản ghi vào bảng `vouchers`.
  6. Admin có thể bật/tắt (kích hoạt/vô hiệu hóa) hoặc chỉnh sửa voucher bất kỳ lúc nào.
- **Ngoại lệ:** Trùng mã voucher $\rightarrow$ Báo lỗi mã giảm giá đã tồn tại.

---

### UC-14: Xem báo cáo doanh thu (Admin)
- **Mã Use Case:** UC-14
- **Tên Use Case:** Xem dashboard và báo cáo doanh thu kinh doanh
- **Mục tiêu:** Giúp người quản trị nắm bắt số liệu kinh doanh thực tế, số lượng đơn hàng và hiệu quả bán hàng.
- **Actor chính:** Admin
- **Tiền điều kiện:** Admin đã đăng nhập.
- **Hậu điều kiện thành công:** Hiển thị số liệu báo cáo chính xác theo khoảng thời gian tùy chọn.
- **Luồng sự kiện chính (Main Flow):**
  1. Admin truy cập màn hình Dashboard hoặc Báo cáo doanh thu.
  2. Admin chọn khoảng thời gian cần thống kê (Hôm nay, 7 ngày qua, Tháng này, hoặc Tùy chỉnh từ ngày... đến ngày...).
  3. Hệ thống tổng hợp dữ liệu:
     - Thống kê số lượng đơn theo từng trạng thái.
     - Tính tổng doanh thu thực tế: **Chỉ cộng doanh thu từ các đơn hàng có trạng thái `COMPLETED`**.
     - Thống kê top 5 sản phẩm bán chạy nhất.
     - Thống kê danh sách sản phẩm sắp hết hàng.
  4. Hệ thống kết xuất biểu đồ trực quan và bảng số liệu chi tiết.
