# CHƯƠNG IV: KIỂM THỬ HỆ THỐNG (SYSTEM TESTING)

---

## 1. MỤC TIÊU VÀ PHẠM VI KIỂM THỬ

### 1.1. Mục tiêu kiểm thử

Quá trình kiểm thử phần mềm đóng vai trò quyết định nhằm xác nhận mức độ hoàn thiện của hệ thống VAMOS STORE so với bản đặc tả yêu cầu nghiệp vụ ban đầu. Các mục tiêu cốt lõi bao gồm:

* **Kiểm tra tính đúng đắn của logic nghiệp vụ:** Đảm bảo các luồng đăng ký, đăng nhập, tìm kiếm, lọc đa tiêu chí, tính toán giỏ hàng, áp dụng voucher diễn ra chính xác theo quy tắc nghiệp vụ.
* **Kiểm tra tính toàn vẹn giao dịch (ACID) và tồn kho:** Xác minh cơ chế trừ tồn kho tự động khi tạo đơn `PENDING` và cơ chế hoàn kho khi đơn bị hủy, đảm bảo không xảy ra hiện tượng bán vượt tồn kho (Overselling).
* **Kiểm tra phân quyền và bảo mật:** Xác minh cơ chế bảo vệ máy chủ: chặn khách vãng lai chưa đăng nhập thanh toán; chặn khách hàng thông thường truy cập trái phép vào các trang quản trị của Admin.
* **Kiểm tra tính tương thích và hiển thị (UI/UX):** Đảm bảo giao diện responsive hiển thị cân đối, không vỡ layout trên các độ phân giải màn hình máy tính và thiết bị di động.

### 1.2. Phương pháp và môi trường kiểm thử

* **Phương pháp kiểm thử:** Áp dụng phương pháp kết hợp giữa **Kiểm thử tự động (Automated Unit/Integration Testing)** bằng các kịch bản mã nguồn trong `tests/` và **Kiểm thử chấp nhận chức năng (Functional Acceptance Testing)** theo bộ tiêu chí thiết kế:
  * Phân vùng tương đương (Equivalence Partitioning).
  * Phân tích giá trị biên (Boundary Value Analysis).
  * Kiểm thử các kịch bản lỗi và luồng ngoại lệ (Negative & Edge-case Testing).
* **Môi trường kiểm thử thực tế:**
  * Hệ điều hành: Windows 11 / Ubuntu 22.04 LTS.
  * Trình duyệt kiểm thử: Google Chrome (v120+), Microsoft Edge (v120+), Mobile Simulator (iPhone 14, Samsung Galaxy S22).
  * Backend Runtime: Node.js LTS (v20.x / v24.x) / Express.js 4.x.
  * Cơ sở dữ liệu: Microsoft SQL Server 2022 (Developer Edition).

### 1.3. Phân công trách nhiệm kiểm thử trong nhóm

Để đảm bảo chất lượng toàn diện và tính đồng đều trong sự đóng góp của các thành viên, công tác kiểm thử được phân công cụ thể như sau:

* **Trần Trung Dũng (Trưởng nhóm):** Phụ trách kiểm thử phân hệ Xác thực (`Auth`), Phân quyền người dùng, Giỏ hàng và quy trình Đặt hàng COD (Test Cases 01 - 12).
* **Trần Vĩnh Nhật:** Phụ trách kiểm thử phân hệ Tìm kiếm, Bộ lọc đa tiêu chí (Size, Màu, Giá), Chi tiết biến thể sản phẩm và Banner (Test Cases 13 - 18).
* **Trần Duy Hoàng Sa:** Phụ trách kiểm thử phân hệ Vận hành đơn hàng Admin, Cơ chế hủy đơn & hoàn kho tự động, Quản lý mã giảm giá Voucher và Bảng điều khiển Dashboard (Test Cases 19 - 25).

---

## 2. KỊCH BẢN KIỂM THỬ CHỨC NĂNG THIẾT KẾ (ACCEPTANCE TEST SCENARIOS)

Dưới đây là 25 ca kiểm thử chức năng được nhóm thiết kế làm bộ tiêu chuẩn nghiệm thu người dùng (Acceptance Test Criteria). Trạng thái các ca kiểm thử được ghi nhận trung thực dựa trên bằng chứng kiểm thử thực tế:

### 2.1. Kiểm thử Chức năng Đăng ký tài khoản (UC01)

| STT | Tình huống kiểm thử | Dữ liệu nhập | Kết quả mong đợi | Người kiểm thử | Trạng thái xác minh |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | Đăng ký thành công với thông tin đầy đủ, hợp lệ | Họ tên: "Nguyễn Văn A"<br>Email: `customer01@gmail.com`<br>Mật khẩu: `Vamos@2026`<br>Xác nhận: `Vamos@2026`<br>SĐT: `0901234567` | Hệ thống tạo tài khoản mới với role `CUSTOMER`, băm mật khẩu bcrypt, tạo giỏ hàng trống và chuyển hướng về trang Đăng nhập kèm thông báo thành công. | Trần Trung Dũng | **Đã rà soát logic** |
| 2 | Đăng ký với địa chỉ Email đã tồn tại | Email: `customer01@gmail.com`<br>(Email đã có trong CSDL) | Báo lỗi: *"Địa chỉ email này đã được sử dụng. Vui lòng chọn email khác!"*, không tạo bản ghi mới. | Trần Trung Dũng | **Đã rà soát logic** |
| 3 | Để trống các trường thông tin bắt buộc | Họ tên: (trống)<br>Email: (trống)<br>Mật khẩu: (trống) | Hệ thống kích hoạt validation, hiển thị thông báo lỗi yêu cầu nhập đầy đủ thông tin bên dưới từng trường. | Trần Trung Dũng | **Đã rà soát logic** |
| 4 | Mật khẩu xác nhận không trùng khớp | Mật khẩu: `Vamos@2026`<br>Xác nhận: `Vamos@9999` | Báo lỗi: *"Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!"*. | Trần Trung Dũng | **Đã rà soát logic** |
| 5 | Nhập sai định dạng địa chỉ Email | Email: `nguyenvana.com` (thiếu ký tự `@`) | Báo lỗi: *"Vui lòng nhập định dạng email hợp lệ."*. | Trần Trung Dũng | **Đã rà soát logic** |
| 6 | Mật khẩu không đủ độ dài tối thiểu | Mật khẩu: `12345` (dưới 6 ký tự) | Báo lỗi: *"Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên."*. | Trần Trung Dũng | **Đã rà soát logic** |

### 2.2. Kiểm thử Chức năng Đăng nhập và Phân quyền (UC02)

| STT | Tình huống kiểm thử | Dữ liệu nhập | Kết quả mong đợi | Người kiểm thử | Trạng thái xác minh |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 7 | Khách hàng đăng nhập đúng thông tin | Email: `customer01@gmail.com`<br>Mật khẩu: `Vamos@2026` | Đăng nhập thành công, cấp session, hiển thị tên khách hàng trên Header và chuyển về Trang chủ. | Trần Trung Dũng | **Đã rà soát logic** |
| 8 | Quản trị viên đăng nhập tài khoản Admin | Email: `admin@vamos.com`<br>Mật khẩu: `Admin@Vamos2026` | Đăng nhập thành công, cấp session quyền `ADMIN`, tự động điều hướng vào trang Bảng điều khiển `/admin/dashboard`. | Trần Trung Dũng | **Đã rà soát logic** |
| 9 | Đăng nhập với mật khẩu không chính xác | Email: `customer01@gmail.com`<br>Mật khẩu: `SaiMatKhau123` | Báo lỗi: *"Email hoặc mật khẩu không chính xác."*. | Trần Trung Dũng | **Đã rà soát logic** |
| 10 | Đăng nhập với email không tồn tại | Email: `khongtontai@gmail.com` | Báo lỗi: *"Email hoặc mật khẩu không chính xác."*. | Trần Trung Dũng | **Đã rà soát logic** |
| 11 | Đăng nhập với tài khoản đang bị khóa (`status = 'locked'`) | Email: `locked_user@gmail.com`<br>Mật khẩu: `ValidPass123` | Hệ thống từ chối đăng nhập, hiển thị thông báo: *"Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ bộ phận hỗ trợ!"*. | Trần Trung Dũng | **Đã rà soát logic** |
| 12 | Khách hàng cố tình truy cập URL Admin `/admin/dashboard` | Đang đăng nhập tài khoản có role `CUSTOMER` | Middleware chặn truy cập, trả về mã lỗi `403 Forbidden` và không hiển thị dữ liệu quản trị. | Trần Trung Dũng | **Đã rà soát logic** |

### 2.3. Kiểm thử Chức năng Tìm kiếm và Lọc sản phẩm (UC05)

| STT | Tình huống kiểm thử | Dữ liệu nhập | Kết quả mong đợi | Người kiểm thử | Trạng thái xác minh |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 13 | Tìm kiếm theo từ khóa có kết quả | Từ khóa: `"Sneaker"` | Hiển thị danh sách các sản phẩm có tên hoặc mô tả chứa từ khóa "Sneaker". | Trần Vĩnh Nhật | **Đã rà soát logic** |
| 14 | Tìm kiếm với từ khóa không tồn tại | Từ khóa: `"AoKhoacMuaDong"` | Hiển thị thông báo: *"Không tìm thấy sản phẩm nào phù hợp với từ khóa của bạn."*. | Trần Vĩnh Nhật | **Đã rà soát logic** |
| 15 | Lọc sản phẩm theo Kích cỡ (Size 41) | Chọn nút Size: `41` | Chỉ hiển thị các sản phẩm có biến thể Size 41 và đang còn hàng (`stock_quantity > 0`). | Trần Vĩnh Nhật | **Đã rà soát logic** |
| 16 | Lọc sản phẩm theo Màu sắc (Màu Đen) | Chọn ô màu: `Đen` | Chỉ hiển thị các mẫu giày có phiên bản màu Đen. | Trần Vĩnh Nhật | **Đã rà soát logic** |
| 17 | Lọc theo Khoảng giá bán (500.000đ - 1.000.000đ) | Giá từ: `500000`, đến: `1000000` | Danh sách hiển thị đúng các sản phẩm có giá niêm yết (hoặc giá sale) nằm trong khoảng này. | Trần Vĩnh Nhật | **Đã rà soát logic** |
| 18 | Sắp xếp sản phẩm theo giá tăng dần | Chọn Sort: `"Giá tăng dần"` | Danh sách sản phẩm được sắp xếp theo thứ tự đơn giá từ thấp đến cao. | Trần Vĩnh Nhật | **Đã rà soát logic** |

### 2.4. Kiểm thử Chức năng Giỏ hàng và Đặt hàng COD (UC06, UC07)

| STT | Tình huống kiểm thử | Dữ liệu nhập | Kết quả mong đợi | Người kiểm thử | Trạng thái xác minh |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 19 | Thêm biến thể sản phẩm vào giỏ hàng | Chọn Size 40, Màu Đen, Số lượng: 1 $
ightarrow$ Bấm "Thêm vào giỏ" | Thêm thành công bản ghi vào `cart_items`, biểu tượng giỏ hàng trên Header cập nhật số lượng badge = 1. | Trần Trung Dũng | **Đã rà soát logic** |
| 20 | Chọn biến thể có tồn kho bằng 0 (`stock = 0`) | Biến thể Size 42 (đã hết hàng) | Nút chọn Size 42 bị làm mờ (disabled), nút "Thêm vào giỏ" bị vô hiệu hóa, hiển thị thông báo "Hết hàng". | Trần Trung Dũng | **Đã rà soát logic** |
| 21 | Tăng số lượng sản phẩm trong giỏ hàng | Bấm nút `[+]` tại dòng sản phẩm | Số lượng tăng lên 2, tạm tính tiền hàng tự động cập nhật tức thì (chặn tối đa 10 theo Rule Q7). | Trần Trung Dũng | **Đã rà soát logic** |
| 22 | Đặt hàng COD thành công với giỏ hàng hợp lệ | Chọn địa chỉ mặc định, phương thức: COD, ghi chú: "Giao chiều" | Tạo đơn hàng mới trạng thái `PENDING`, trừ tồn kho của biến thể tương ứng, lưu snapshot tên, SKU, size, màu, đơn giá vào `order_items`, làm rỗng giỏ hàng. | Trần Trung Dũng | **Đã rà soát logic** |
| 23 | Hai khách hàng cùng đặt đôi giày cuối cùng (`stock = 1`) | Khách A và Khách B cùng bấm đặt mua gần như đồng thời | Giao dịch áp dụng khóa `SELECT ... WITH (UPDLOCK, ROWLOCK)`: Khách A hoàn tất trước đặt thành công (kho về 0); Khách B bị báo lỗi: *"Sản phẩm đã hết hàng, vui lòng điều chỉnh lại!"*. Không bị bán vượt. | Trần Trung Dũng | **Chưa xác minh (Chờ Staging)** |

### 2.5. Kiểm thử Chức năng Hủy đơn hàng và Hoàn kho (UC09, UC10)

| STT | Tình huống kiểm thử | Dữ liệu nhập | Kết quả mong đợi | Người kiểm thử | Trạng thái xác minh |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 24 | Khách hàng tự hủy đơn ở trạng thái `PENDING` | Bấm nút "Hủy đơn" tại đơn `PENDING`, nhập lý do: "Đổi ý muốn chọn size khác" | Đơn hàng chuyển sang `CANCELLED`, hệ thống tự động cộng hoàn trả số lượng vào `stock_quantity` của các biến thể, ghi nhật ký `ORDER_CANCELLED_RESTOCK`. | Trần Duy Hoàng Sa | **Đã rà soát logic** |
| 25 | Khách hàng muốn hủy đơn khi đơn đã `CONFIRMED` hoặc `SHIPPING` | Đơn hàng đã được Admin xác nhận | Nút "Hủy đơn" trên giao diện khách hàng bị ẩn/vô hiệu hóa. Nếu cố tình gửi request POST trực tiếp, server trả về lỗi từ chối thao tác. | Trần Duy Hoàng Sa | **Đã rà soát logic** |

_Bảng 24: Ma trận 25 ca kiểm thử chức năng thiết kế (Functional Test Cases)_

---

## 3. KẾT QUẢ THỰC THI KIỂM THỬ VÀ ĐÁNH GIÁ CHẤT LƯỢNG

Để đảm bảo tính trung thực học thuật cao nhất, nhóm phân định rạch ròi giữa kết quả từ **các bộ kịch bản kiểm thử tự động đã thực thi trực tiếp trong repository** và **bộ kịch bản nghiệm thu chức năng thiết kế**.

### 3.1. Kết quả kiểm thử tự động (Automated Test Execution Evidence)

Nhóm đã xây dựng và thực thi thành công 5 bộ kịch bản kiểm thử tự động trong thư mục `tests/`. Để đảm bảo tính chuẩn xác học thuật, số liệu được phân loại rạch ròi theo bản chất kỹ thuật (số template biên dịch, số unit assertion và số kịch bản integration test):

| STT | Bộ kiểm thử tự động | Lệnh thực thi CLI | Bản chất kỹ thuật | Số lượng kiểm tra | Kết quả thực tế |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | **Kiểm tra cú pháp Pug Template** | `node tests/validate_pug.js` | Biên dịch tĩnh 39 template Pug trong `src/views/`, phát hiện lỗi cú pháp, thụt lề, include/extend. | 39 templates | **39 / 39 Pass (100%)** |
| 2 | **Kiểm thử bộ tiền kiểm dữ liệu (Input Validator)** | `node tests/test_validator.js` | Unit test assertions kiểm tra email, phone, name, password và giới hạn số lượng đặt mua 1-10. | 29 assertions | **29 / 29 Pass (100%)** |
| 3 | **Kiểm thử hồi quy nghiệp vụ (Audit Fixes)** | `node tests/test_audit_fixes.js` | Unit test assertions kiểm tra tự sửa bộ lọc giá, target giới tính, bảo toàn query phân trang catalog. | 15 assertions | **15 / 15 Pass (100%)** |
| 4 | **Kiểm thử cơ chế Theme (Dark/Light)** | `node tests/test_phase3_theme.js` | Unit test assertions kiểm tra lưu trạng thái theme, script chống nhấp nháy FOUC và toggle class `.dark`. | 8 assertions | **8 / 8 Pass (100%)** |
| 5 | **Kiểm thử đa ngôn ngữ & bảo mật (i18n)** | `node tests/test_phase4_i18n.js` | Integration test scenarios kiểm tra cookie locale, chuyển đổi ngôn ngữ SSR và chặn Open Redirect. | 8 test scenarios | **8 / 8 Pass (100%)** |
| | **TỔNG CỘNG LƯỢT KIỂM TRA** | | **39 templates + 52 assertions + 8 scenarios** | **99 lượt kiểm tra** | **99 / 99 Pass (100%)** |

_Bảng 25: Kết quả thực thi kiểm thử tự động hệ thống (Automated Test Suites)_

### 3.2. Đánh giá chất lượng và Giới hạn kiểm thử

* **Phân biệt bản chất kiểm tra tự động:** 99 lượt kiểm tra tự động nêu trên gồm 39 template giao diện được biên dịch thành công, 52 unit test assertions xác minh logic xử lý dữ liệu và 8 kịch bản tích hợp giao thức web. Kết quả này chứng minh mã nguồn đạt độ hoàn thiện cao về mặt cú pháp giao diện và xử lý an toàn dữ liệu đầu vào.
* **Đánh giá bộ 25 kịch bản chức năng thiết kế:**
  * **24 / 25 kịch bản (96%):** Đã được rà soát logic chi tiết qua mã nguồn Controller, Service và cấu trúc giao diện; các quy tắc nghiệp vụ như giới hạn giỏ hàng, phân quyền session, trừ kho khi đặt và hoàn kho khi hủy đơn đều khớp với hiện thực code.
  * **1 kịch bản (Ca số 23 - Tranh chấp đồng thời cao khi còn 1 sản phẩm):** Giữ nguyên trạng thái **Chưa xác minh (Chờ Staging)**. Mặc dù mã nguồn đã hiện thực cơ chế khóa bi quan cấp dòng `WITH (UPDLOCK, ROWLOCK)` trong transaction T-SQL để chống bán vượt tồn kho, nhưng ca này đòi hỏi môi trường Staging có công cụ tạo tải đồng thời (như k6 hoặc Apache JMeter) để đo đạc và nghiệm thu thực tế.
* **Lưu ý nguyên tắc học thuật:** Nhóm tuyệt đối không dùng kết quả biên dịch thành công 39 template Pug để kết luận rằng toàn bộ hệ thống đã chạy đúng 100% trong mọi điều kiện vận hành. Các kết quả trên phản ánh trung thực trạng thái kiểm thử tại thời điểm báo cáo đồ án.
