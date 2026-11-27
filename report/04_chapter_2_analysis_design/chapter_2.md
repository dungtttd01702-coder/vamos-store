# CHƯƠNG II: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG (SYSTEM ANALYSIS & DESIGN)

---

## 1. PHÂN TÍCH NGHIỆP VỤ HỆ THỐNG

Dựa trên việc đối chiếu trực tiếp với hệ thống định tuyến (Routes), các bộ điều khiển (Controllers) và các middleware xác thực thực tế trong mã nguồn dự án VAMOS STORE, nghiệp vụ hệ thống được chuẩn hóa chính xác theo 3 nhóm tác nhân (Actors):

### 1.1. Nghiệp vụ của Khách vãng lai (Guest)
Khách vãng lai là người dùng truy cập vào hệ thống nhưng chưa thực hiện đăng nhập hoặc chưa có tài khoản thành viên:
* **Khám phá và tra cứu sản phẩm:** Xem trang chủ với slider banner quảng bá chiến dịch marketing; xem danh mục sản phẩm nổi bật, sản phẩm mới nhất và sản phẩm bán chạy; tìm kiếm sản phẩm theo từ khóa (khớp tên sản phẩm, mã sản phẩm hoặc thương hiệu).
* **Bộ lọc sản phẩm đa tiêu chí:** Sử dụng bộ lọc nâng cao tại trang cửa hàng (`/products`) để lọc sản phẩm theo danh mục (`category`), đối tượng giới tính (`gender_target: MEN, WOMEN, KIDS, UNISEX`), kích cỡ giày (`size: 36 - 45`), màu sắc (`color`) và khoảng giá bán (`min_price`, `max_price`); sắp xếp theo giá tăng/giảm hoặc tên A-Z.
* **Xem chi tiết sản phẩm:** Xem bộ sưu tập ảnh góc chụp chi tiết; đọc thông số kỹ thuật và hướng dẫn chọn cỡ giày; tương tác chọn ma trận Size x Màu sắc để kiểm tra tức thời tình trạng còn hàng và số lượng tồn thực tế của từng mã biến thể SKU.
* **Đăng ký tài khoản thành viên:** Nhập họ tên, email hợp lệ, số điện thoại và mật khẩu (tối thiểu 6 ký tự) để khởi tạo tài khoản `Customer`. Hệ thống tự động khởi tạo giỏ hàng cá nhân (quan hệ 1:1) ngay khi tạo tài khoản thành công.
* **Đăng nhập hệ thống:** Xác thực danh tính bằng email và mật khẩu qua thuật toán `bcryptjs`, lưu giữ phiên làm việc an toàn thông qua Session trên máy chủ.
* **Quy trình Khôi phục mật khẩu (Thiết kế):** Gửi yêu cầu đặt lại mật khẩu khi quên (CSDL đã thiết kế cấu trúc bảng `password_reset_tokens` và token hash bảo mật, đang ở trạng thái chờ tích hợp Email Service).

### 1.2. Nghiệp vụ của Khách hàng thành viên (Customer)
Khách hàng thành viên là người dùng đã đăng nhập tài khoản có vai trò `CUSTOMER`:
* **Kế thừa toàn bộ quyền của Khách vãng lai:** Xem hàng, tìm kiếm, lọc và xem thông tin chi tiết.
* **Quản lý giỏ hàng trực tuyến:** Thêm biến thể sản phẩm vào giỏ hàng cá nhân (`carts` và `cart_items`); điều chỉnh số lượng (giới hạn tối thiểu 1 đôi, tối đa 10 đôi bán lẻ cho mỗi mặt hàng theo Quy tắc Q7); xóa từng dòng sản phẩm hoặc làm trống giỏ hàng; hệ thống tự động kiểm tra tồn kho tức thời.
* **Quản lý danh sách yêu thích (Wishlist):** Thêm hoặc xóa sản phẩm khỏi danh sách yêu thích được lưu trữ bền vững trong CSDL (`wishlist_items`).
* **Quản lý hồ sơ và sổ địa chỉ giao hàng:** Cập nhật thông tin cá nhân; đổi mật khẩu tài khoản; thêm mới, chỉnh sửa, xóa địa chỉ nhận hàng và thiết lập địa chỉ mặc định (ràng buộc duy nhất 1 địa chỉ mặc định qua Filtered Unique Index).
* **Đặt hàng thanh toán COD (Checkout):** Chọn địa chỉ giao hàng; áp dụng mã giảm giá voucher (nếu thỏa mãn hạn mức và chưa từng dùng theo Quy tắc Q8); kiểm tra tóm tắt tài chính (tạm tính, giảm giá, phí ship, tổng thanh toán); xác nhận tạo đơn hàng trong một Transaction CSDL nguyên tử kèm trừ kho và lưu snapshot thông tin bất biến.
* **Tra cứu và theo dõi đơn hàng (Order Tracking):** Xem danh sách lịch sử đơn hàng; xem chi tiết từng đơn hàng kèm bản sao snapshot địa chỉ và sản phẩm; theo dõi tiến trình chuyển trạng thái theo thời gian thực.
* **Chủ động hủy đơn hàng:** Được quyền tự hủy đơn hàng DUY NHẤT khi đơn đang ở trạng thái chờ xác nhận (`PENDING`). Hệ thống tự động kích hoạt Transaction hoàn trả tồn kho và phục hồi lượt dùng voucher.

### 1.3. Nghiệp vụ của Quản trị viên (Admin)
Quản trị viên là người dùng có vai trò `ADMIN`, có toàn quyền điều hành và quản lý hoạt động kinh doanh:
* **Bảng điều khiển tổng quan (Dashboard):** Xem thống kê tổng doanh thu thực tế (chỉ tính từ các đơn hàng có `order_status = 'COMPLETED'` và `payment_status = 'PAID'`); thống kê số lượng đơn theo 6 trạng thái; theo dõi Top 4 sản phẩm bán chạy nhất theo số lượng bán (`ORDER BY total_sold DESC`); xem danh sách cảnh báo tồn kho thấp (`stock_quantity <= 5`) và danh sách đơn hàng khẩn cấp cần xử lý.
* **Quản lý Danh mục và Thương hiệu:** Thêm mới danh mục và thương hiệu; chỉnh sửa mô tả và đường dẫn tĩnh SEO (slug); bật/tắt trạng thái hiển thị của danh mục.
* **Quản lý Sản phẩm và Biến thể:** Tạo mới thông tin sản phẩm cha; cấu hình ma trận biến thể giày theo Size x Color x SKU kèm số lượng tồn kho ban đầu; quản lý bộ ảnh sản phẩm và chỉ định ảnh đại diện chính (`is_primary = 1`); chỉnh sửa thông tin hoặc ẩn/hiện sản phẩm.
* **Quản lý Tồn kho và Thẻ kho (Inventory Management):** Tra cứu tồn kho chi tiết theo từng mã SKU; thực hiện điều chỉnh tăng/giảm kho thủ công khi kiểm kê thực tế; bắt buộc ghi nhận lý do điều chỉnh để lưu vết kiểm toán vào bảng `inventory_transactions`.
* **Vận hành và Xử lý Đơn hàng (Order Fulfillment):** Xem danh sách đơn hàng có phân trang và bộ lọc trạng thái; xem chi tiết snapshot đơn hàng; thực hiện chuyển đổi trạng thái đơn hàng theo đúng máy trạng thái chuẩn (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`); hủy đơn hàng nội bộ kèm lý do và kích hoạt hoàn kho tự động. Khi chuyển trạng thái sang `COMPLETED` trong luồng COD, hệ thống tự động cập nhật `payment_status = 'PAID'`.
* **Quản lý Mã giảm giá (Vouchers):** Tạo mới mã ưu đãi; cấu hình hình thức giảm (phần trăm hoặc tiền cố định), giá trị giảm, mức giảm trần, giá trị đơn tối thiểu, khung thời gian hiệu lực và giới hạn số lượt dùng; bật/tắt trạng thái voucher.
* **Quản lý Tài khoản Khách hàng (Customer Accounts):** Tra cứu danh sách khách hàng, xem tổng số đơn và tổng chi tiêu tích lũy; xem chi tiết hồ sơ cá nhân, sổ địa chỉ và lịch sử đơn hàng; khóa hoặc mở khóa tài khoản khách hàng (`status = 'active' | 'locked'`) với cơ chế bảo vệ nghiêm ngặt: tuyệt đối không cho phép khóa tài khoản ADMIN.
* **Quản lý Banner quảng bá trang chủ:** Xem danh sách banner theo thứ tự hiển thị `display_order`; thêm banner mới kèm link điều hướng; bật/tắt trạng thái hiển thị; xóa vật lý banner khỏi CSDL.

### 1.4. Ma trận phân quyền các tác nhân (Actor Permissions Matrix)

Dưới đây là ma trận phân quyền truy cập và thực thi chức năng của 3 tác nhân (`Guest`, `Customer`, `Admin`) trên toàn bộ các phân hệ của VAMOS STORE:

| Phân hệ / Nghiệp vụ | Khách vãng lai (Guest) | Khách hàng (Customer) | Quản trị viên (Admin) |
| :--- | :---: | :---: | :---: |
| Xem trang chủ, tìm kiếm, lọc sản phẩm | Cho phép | Cho phép | Cho phép |
| Xem chi tiết sản phẩm, kiểm tra tồn kho SKU | Cho phép | Cho phép | Cho phép |
| Đăng ký / Đăng nhập tài khoản | Cho phép | Cho phép | Cho phép |
| Quản lý giỏ hàng trực tuyến (Carts) | Không (Cần đăng nhập) | Toàn quyền | Không |
| Quản lý danh sách yêu thích (Wishlist) | Không (Cần đăng nhập) | Toàn quyền | Không |
| Quản lý hồ sơ cá nhân & Sổ địa chỉ | Không | Toàn quyền (Cá nhân) | Không |
| Đặt hàng thanh toán COD & Áp voucher | Không (Cần đăng nhập) | Toàn quyền | Không |
| Tra cứu lịch sử & Chi tiết đơn hàng | Không | Đơn hàng cá nhân | Toàn bộ đơn hàng |
| Hủy đơn hàng khi trạng thái PENDING | Không | Cho phép (Đơn cá nhân) | Cho phép (Kèm hoàn kho) |
| Quản lý danh mục, thương hiệu, banner | Không | Không | Toàn quyền (CRUD) |
| Quản lý sản phẩm, biến thể SKU, ảnh | Không | Không | Toàn quyền (CRUD) |
| Quản lý tồn kho & Điều chỉnh thẻ kho | Không | Không | Toàn quyền |
| Vận hành chuyển trạng thái đơn hàng | Không | Không | Toàn quyền (Fulfillment) |
| Quản lý mã giảm giá (Vouchers) | Không | Không | Toàn quyền |
| Quản lý tài khoản khách hàng | Không | Không | Toàn quyền (Khóa/Mở) |
| Bảng điều khiển KPI & Báo cáo doanh thu | Không | Không | Toàn quyền (Dashboard) |

_Bảng 2: Ma trận phân quyền các Actor trong VAMOS STORE_

---

## 2. THIẾT KẾ HỆ THỐNG

### 2.1. Sơ đồ Use Case (Use Case Diagrams)

Hệ thống VAMOS STORE chuẩn hóa chính xác **14 Use Case cốt lõi** phục vụ 3 tác nhân (`Guest`, `Customer`, `Admin`), được tổ chức thành 4 phân hệ chính:
1. Phân hệ Xác thực & Tài khoản (`UC01`, `UC02`, `UC03`, `UC04`).
2. Phân hệ Duyệt hàng & Mua sắm (`UC05`, `UC06`, `UC07`).
3. Phân hệ Quản lý Đơn hàng Khách hàng (`UC08`, `UC09`).
4. Phân hệ Quản trị Vận hành Admin (`UC10`, `UC11`, `UC12`, `UC13`, `UC14`).

#### A. Sơ đồ Use Case tổng quát toàn hệ thống

<div align="center">
  <img src="images/hinh_05_use_case_tong_quat.png" alt="Hình 5: Sơ đồ Use Case tổng quát VAMOS STORE" style="max-width: 80%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 5: Sơ đồ Use Case tổng quát VAMOS STORE</strong></p>
</div>

---

#### B. Sơ đồ Use Case chi tiết phân hệ Mua sắm & Đặt hàng COD
* Ca sử dụng trọng tâm là **"Đặt hàng COD" (`UC07`)** được thực hiện bởi `Customer`.
* Quan hệ `<<include>>`: Luồng đặt hàng bắt buộc phải thực hiện bước *"Chọn địa chỉ nhận hàng"* và *"Xác nhận đơn hàng"*.
* Quan hệ `<<extend>>`: Khách hàng có thể tùy chọn *"Áp dụng mã giảm giá"* khi đơn hàng thỏa mãn điều kiện giá trị tối thiểu của voucher.

<div align="center">
  <img src="images/hinh_06_use_case_mua_hang.png" alt="Hình 6: Sơ đồ Use Case chi tiết Đặt hàng COD" style="max-width: 80%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 6: Sơ đồ Use Case chi tiết Đặt hàng COD</strong></p>
</div>

---

#### C. Sơ đồ Use Case chi tiết Quản lý đơn hàng & Kho Admin
* Khách hàng theo dõi tiến trình đơn hàng qua **"Tra cứu và theo dõi đơn hàng" (`UC08`)**.
* Chức năng **"Hủy đơn hàng" (`UC09`)** là điểm mở rộng (`<<extend>>`) gắn kèm điều kiện: chỉ khả dụng khi `order_status = 'PENDING'`.
* Quản trị viên thực hiện **"Admin xử lý đơn hàng" (`UC10`)** để điều phối trạng thái và **"Quản lý tồn kho" (`UC11`)** để kiểm kê, điều chỉnh số lượng tồn.

<div align="center">
  <img src="images/hinh_07_use_case_quan_ly.png" alt="Hình 7: Sơ đồ Use Case chi tiết Quản lý đơn hàng & Vận hành kho Admin" style="max-width: 80%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 7: Sơ đồ Use Case chi tiết Vận hành đơn hàng và Kho hàng Admin</strong></p>
</div>

---

#### D. Bảng đặc tả tổng hợp 14 Use Case hệ thống VAMOS STORE

| Mã UC | Tên Use Case | Tác nhân chính | Tiền điều kiện | Hậu điều kiện thành công | Luồng sự kiện chính |
|:---:|:---|:---:|:---|:---|:---|
| **UC01** | Đăng ký tài khoản | Guest | Chưa đăng nhập, email chưa tồn tại trong hệ thống. | Tạo tài khoản `Customer`, băm mật khẩu `bcryptjs`, tự động tạo giỏ hàng rỗng (1:1). | 1. Nhập họ tên, email, SĐT, MK.<br>2. Hệ thống kiểm tra hợp lệ.<br>3. Lưu bản ghi `users`, cấp `carts`, chuyển đến trang đăng nhập. |
| **UC02** | Đăng nhập hệ thống | Guest, Customer, Admin | Đã có tài khoản trong CSDL. | Thiết lập Session người dùng, phân quyền truy cập theo vai trò. | 1. Nhập email và mật khẩu.<br>2. Đối soát mật khẩu hash.<br>3. Điều hướng: Admin vào `/admin`, Customer vào `/`. |
| **UC03** | Khôi phục mật khẩu (Thiết kế) | Guest | Quên mật khẩu tài khoản. | CSDL đã có bảng `password_reset_tokens` hỗ trợ; quy trình xử lý hoàn chỉnh chưa được triển khai trong phiên bản hiện tại. | 1. Người dùng gửi yêu cầu khôi phục.<br>2. (Chức năng trong thiết kế, chưa triển khai luồng gửi email). |
| **UC04** | Quản lý hồ sơ & địa chỉ | Customer | Đã đăng nhập `Customer`. | Cập nhật hồ sơ, lưu sổ địa chỉ trong bảng `addresses`. | 1. Vào trang cá nhân.<br>2. Thêm/sửa địa chỉ nhận hàng.<br>3. Chọn địa chỉ mặc định (duy nhất qua Filtered Index). |
| **UC05** | Tìm kiếm & xem sản phẩm | Guest, Customer | Không có. | Hiển thị danh sách sản phẩm, chi tiết biến thể và tồn kho. | 1. Tìm từ khóa hoặc chọn bộ lọc.<br>2. Xem danh sách kết quả.<br>3. Xem chi tiết sản phẩm và chọn Size/Màu. |
| **UC06** | Quản lý giỏ hàng | Customer | Đã đăng nhập `Customer`. | Bản ghi `cart_items` được cập nhật tương ứng. | 1. Chọn biến thể giày và số lượng.<br>2. Thêm vào giỏ.<br>3. Tăng/giảm (tối đa 10 đôi) hoặc xóa sản phẩm. |
| **UC07** | Đặt hàng COD | Customer | Giỏ hàng có sản phẩm, đã đăng nhập. | Tạo đơn hàng trong bảng `orders`, trừ kho, lưu snapshot, làm trống giỏ hàng. | 1. Vào trang Checkout.<br>2. Chọn địa chỉ và nhập voucher.<br>3. Bấm Đặt hàng.<br>4. Hệ thống chạy Transaction nguyên tử và chuyển hướng thành công. |
| **UC08** | Tra cứu & theo dõi đơn hàng | Customer | Đã đăng nhập, có đơn hàng đã đặt. | Hiển thị thông tin chi tiết đơn hàng, snapshot giá và tiến trình xử lý. | 1. Vào Lịch sử đơn hàng.<br>2. Chọn xem chi tiết đơn.<br>3. Xem trạng thái vận chuyển và danh sách sản phẩm đặt. |
| **UC09** | Hủy đơn hàng | Customer | Đơn hàng của chính mình ở trạng thái `PENDING`. | Trạng thái chuyển `CANCELLED`, hoàn trả số lượng tồn kho, hoàn lại lượt dùng voucher. | 1. Vào chi tiết đơn `PENDING`.<br>2. Bấm "Hủy đơn hàng" và nhập lý do.<br>3. Hệ thống chạy Transaction cập nhật trạng thái và hoàn kho. |
| **UC10** | Admin xử lý đơn hàng | Admin | Đã đăng nhập `Admin`. | Trạng thái đơn chuyển đổi theo quy trình chuẩn, cập nhật `payment_status` khi xong. | 1. Vào danh sách đơn hàng Admin.<br>2. Chọn đơn cần duyệt.<br>3. Chuyển trạng thái (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ ... $\rightarrow$ `COMPLETED`). |
| **UC11** | Quản lý tồn kho | Admin | Đã đăng nhập `Admin`. | Số lượng tồn kho biến thể cập nhật, ghi nhật ký kiểm toán vào `inventory_transactions`. | 1. Vào trang Quản lý kho.<br>2. Tra cứu mã SKU.<br>3. Nhập số lượng điều chỉnh và lý do.<br>4. Hệ thống cập nhật kho và lưu thẻ kho. |
| **UC12** | Quản lý sản phẩm & danh mục | Admin | Đã đăng nhập `Admin`. | Dữ liệu sản phẩm, biến thể, ảnh, danh mục, thương hiệu được lưu vào CSDL. | 1. Vào trang Quản lý sản phẩm/danh mục.<br>2. Nhập thông tin, tạo biến thể Size/Color/SKU.<br>3. Bấm Lưu để ghi dữ liệu nguyên tử. |
| **UC13** | Quản lý mã giảm giá | Admin | Đã đăng nhập `Admin`. | Bản ghi voucher mới được lưu vào bảng `vouchers`. | 1. Vào trang Quản lý Voucher.<br>2. Nhập mã, giá trị giảm, hạn mức, ngày hiệu lực.<br>3. Bấm Lưu hoặc bật/tắt hiển thị. |
| **UC14** | Báo cáo doanh thu | Admin | Đã đăng nhập `Admin`. | Dashboard hiển thị tổng doanh thu từ đơn `COMPLETED` + `PAID`, Top 4 bán chạy. | 1. Truy cập `/admin/dashboard`.<br>2. Hệ thống tổng hợp số liệu CSDL thời gian thực.<br>3. Hiển thị KPI, biểu đồ và danh sách sản phẩm. |

_Bảng 3: Danh sách 14 Use Case nghiệp vụ hệ thống VAMOS STORE_

---

### 2.2. Sơ đồ điều hướng màn hình (Sitemap)

Website VAMOS STORE được phân định cấu trúc trang chặt chẽ thành 3 phân vùng độc lập dựa trên cơ chế phân quyền RBAC và middleware bảo vệ:

1. **Phân vùng công khai (Public Zone):**
   * Trang chủ (`/`): Banner slider, danh mục nổi bật, sản phẩm mới, top bán chạy.
   * Cửa hàng (`/products`): Danh sách sản phẩm kèm bộ lọc đa tiêu chí bên thanh sidebar.
   * Chi tiết sản phẩm (`/products/:slug`): Thư viện ảnh, mô tả, chọn Size/Màu và kiểm tra tồn kho.
   * Tìm kiếm trực tiếp (`/api/products/search`): Gợi ý kết quả tìm kiếm thời gian thực.
   * Xác thực tài khoản: Đăng nhập (`/auth/login`), Đăng ký (`/auth/register`), Quên mật khẩu (`/auth/forgot-password`).
   * Trang thông tin tĩnh: Giới thiệu (`/about`), Chính sách (`/policy`), Khuyến mãi (`/promotions`).

2. **Phân vùng Khách hàng (Customer Protected Zone - Yêu cầu đăng nhập `CUSTOMER`):**
   * Giỏ hàng trực tuyến (`/cart`): Quản lý mặt hàng, số lượng, tạm tính.
   * Đặt hàng thanh toán COD (`/checkout`): Chọn địa chỉ, áp voucher, xác nhận đặt hàng.
   * Đặt hàng thành công (`/checkout/success/:id`): Xem mã đơn và thông báo xác nhận.
   * Hồ sơ cá nhân (`/account/profile`): Cập nhật thông tin, đổi mật khẩu.
   * Sổ địa chỉ giao hàng (`/account/addresses`): Thêm, sửa, xóa, đặt địa chỉ mặc định.
   * Lịch sử đơn hàng (`/account/orders`): Danh sách đơn hàng cá nhân.
   * Chi tiết đơn hàng (`/account/orders/:id`): Xem chi tiết đơn và nút hủy đơn khi `PENDING`.
   * Danh sách yêu thích (`/account/wishlist` và `/api/wishlist`): Sản phẩm đã lưu.

3. **Phân vùng Quản trị (Admin Protected Zone - Yêu cầu quyền `ADMIN` qua `requireAdmin`):**
   * Bảng điều khiển tổng quan (`/admin/dashboard`): Doanh thu, đơn hàng, Top 4 bán chạy, cảnh báo kho.
   * Quản lý sản phẩm (`/admin/products`): Danh sách, thêm mới, sửa, ẩn/hiện sản phẩm và biến thể.
   * Quản lý tồn kho (`/admin/inventory`): Kiểm kê tồn kho, điều chỉnh kho thủ công, thẻ kho lịch sử.
   * Quản lý danh mục & thương hiệu (`/admin/categories`): Thêm mới, đổi trạng thái.
   * Vận hành đơn hàng (`/admin/orders`): Danh sách đơn, chi tiết đơn, chuyển đổi trạng thái 6 bước.
   * Quản lý voucher (`/admin/vouchers`): Danh sách, tạo voucher mới, bật/tắt trạng thái.
   * Quản lý khách hàng (`/admin/customers`): Danh sách khách, chi tiết chi tiêu, khóa/mở khóa tài khoản.
   * Quản lý banner (`/admin/banners`): Danh sách banner trang chủ, thêm banner, bật/tắt, xóa banner.

<div align="center">
  <img src="images/hinh_08_sitemap.png" alt="Hình 8: Sơ đồ điều hướng màn hình Sitemap VAMOS STORE" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 8: Sơ đồ điều hướng màn hình (Sitemap) VAMOS STORE</strong></p>
</div>

---

### 2.3. Mô hình thực thể quan hệ - ERD (Entity-Relationship Diagram)

Hệ thống cơ sở dữ liệu VAMOS STORE được thiết kế chuẩn hóa ở dạng chuẩn 3NF (Third Normal Form) gồm **chính xác 20 thực thể nghiệp vụ** chạy trên hệ quản trị CSDL Microsoft SQL Server 2022 (bảng `schema_migrations` là bảng quản lý phiên bản migration kỹ thuật, không thuộc miền thực thể nghiệp vụ):

<div align="center">
  <img src="images/hinh_09_erd.png" alt="Hình 9: Mô hình thực thể quan hệ (ERD 20 bảng) - VAMOS STORE" style="max-width: 95%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 9: Mô hình thực thể quan hệ (ERD 20 bảng nghiệp vụ) - VAMOS STORE</strong></p>
</div>

---

### 2.4. Từ điển dữ liệu chi tiết (Data Dictionary)

Toàn bộ 20 bảng nghiệp vụ được đặc tả chính xác theo chuẩn cú pháp DDL Microsoft SQL Server trong `database/mssql_schema.sql` và các file migration thực tế:

#### Bảng 4: Thực thể `users` (Tài khoản người dùng)
*Mục đích: Quản trị thông tin xác thực và phân quyền tài khoản người dùng (`CUSTOMER`, `ADMIN`).*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh duy nhất của người dùng |
| `full_name` | `NVARCHAR(100)` | Có | | | Họ và tên đầy đủ |
| `email` | `NVARCHAR(150)` | Có | UNIQUE | | Địa chỉ thư điện tử dùng để đăng nhập |
| `password_hash` | `NVARCHAR(255)` | Có | | | Mật khẩu đã băm bằng thuật toán bcryptjs |
| `phone` | `NVARCHAR(20)` | Không | NULL | | Số điện thoại liên lạc của người dùng |
| `role` | `NVARCHAR(20)` | Có | CHECK | `'CUSTOMER'` | Vai trò tài khoản: `ADMIN` hoặc `CUSTOMER` |
| `status` | `NVARCHAR(20)` | Có | CHECK | `'active'` | Trạng thái tài khoản: `active` hoặc `locked` |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm tạo tài khoản |
| `updated_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm cập nhật tài khoản gần nhất |

---

#### Bảng 5: Thực thể `categories` (Danh mục sản phẩm)
*Mục đích: Phân loại nhóm sản phẩm giày dép (Sneaker, Thể thao, Sandal, Dép).*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh danh mục |
| `name` | `NVARCHAR(100)` | Có | | | Tên hiển thị của danh mục |
| `slug` | `NVARCHAR(120)` | Có | UNIQUE | | Đường dẫn tĩnh thân thiện SEO |
| `description` | `NVARCHAR(MAX)` | Không | NULL | | Mô tả chi tiết về danh mục |
| `is_active` | `BIT` | Có | | `1` | Trạng thái hiển thị (1: Bật, 0: Tạm ẩn) |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm tạo danh mục |

---

#### Bảng 6: Thực thể `brands` (Thương hiệu sản phẩm)
*Mục đích: Quản lý thương hiệu đối tác sản xuất giày dép (Nike, Adidas, Puma,...).*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh thương hiệu |
| `name` | `NVARCHAR(100)` | Có | | | Tên thương hiệu |
| `slug` | `NVARCHAR(120)` | Có | UNIQUE | | Đường dẫn tĩnh SEO của thương hiệu |
| `description` | `NVARCHAR(MAX)` | Không | NULL | | Thông tin giới thiệu thương hiệu |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm tạo thương hiệu |

---

#### Bảng 7: Thực thể `sizes` (Kích cỡ giày sneaker)
*Mục đích: Danh mục các cỡ giày chuẩn hóa phục vụ cấu hình biến thể (Size 36 đến 45).*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh kích cỡ |
| `size_name` | `NVARCHAR(20)` | Có | UNIQUE | | Tên kích cỡ giày (36, 37, 38, ..., 45) |
| `display_order` | `INT` | Có | | `0` | Thứ tự ưu tiên sắp xếp khi hiển thị |

---

#### Bảng 8: Thực thể `colors` (Màu sắc giày sneaker)
*Mục đích: Danh mục màu sắc sản phẩm hỗ trợ tạo biến thể (Trắng, Đen, Xám, Đỏ,...).*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh màu sắc |
| `color_name` | `NVARCHAR(50)` | Có | UNIQUE | | Tên gọi màu sắc |
| `hex_code` | `NVARCHAR(10)` | Không | NULL | | Mã màu thập lục phân (Hex Code, ví dụ `#FFFFFF`) |

---

#### Bảng 9: Thực thể `vouchers` (Mã giảm giá khuyến mãi)
*Mục đích: Quản lý các chiến dịch khuyến mãi chiết khấu đơn hàng.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh voucher |
| `code` | `NVARCHAR(50)` | Có | UNIQUE | | Mã nhập ưu đãi (ví dụ `VAMOS100`) |
| `name` | `NVARCHAR(100)` | Có | | | Tên chiến dịch ưu đãi |
| `discount_type` | `NVARCHAR(20)` | Có | CHECK | | Hình thức giảm: `percentage` hoặc `fixed_amount` |
| `discount_value` | `DECIMAL(12,0)`| Có | CHECK (>0) | | Giá trị giảm (% chiết khấu hoặc số tiền VNĐ) |
| `min_order_value`| `DECIMAL(12,0)`| Có | CHECK (>=0)| `0` | Giá trị đơn hàng tối thiểu để được áp dụng |
| `max_discount_amount`| `DECIMAL(12,0)`| Không| NULL | | Mức giảm tối đa trần khi giảm theo % |
| `start_date` | `DATETIME2` | Có | CHECK | | Thời điểm bắt đầu có hiệu lực |
| `end_date` | `DATETIME2` | Có | CHECK | | Thời điểm hết hạn (`end_date >= start_date`) |
| `usage_limit` | `INT` | Có | CHECK (>=0)| `0` | Tổng số lượt dùng tối đa toàn sàn (0: không giới hạn)|
| `used_count` | `INT` | Có | CHECK (>=0)| `0` | Số lượt đã sử dụng thực tế |
| `is_active` | `BIT` | Có | | `1` | Trạng thái hiển thị voucher |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm tạo voucher |

---

#### Bảng 10: Thực thể `banners` (Banner quảng bá trang chủ)
*Mục đích: Quản lý hình ảnh và liên kết slider quảng cáo tại trang chủ storefront.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh banner |
| `title` | `NVARCHAR(150)` | Có | | | Tiêu đề chiến dịch banner |
| `image_url` | `NVARCHAR(1000)`| Có | | | Đường dẫn URL hình ảnh banner từ CDN |
| `link_url` | `NVARCHAR(255)` | Không | NULL | | Đường dẫn đích khi người dùng nhấp vào |
| `display_order` | `INT` | Có | | `0` | Thứ tự ưu tiên hiển thị trên carousel slider |
| `is_active` | `BIT` | Có | | `1` | Trạng thái kích hoạt hiển thị (1: Bật, 0: Tắt) |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm tạo banner |

---

#### Bảng 11: Thực thể `addresses` (Sổ địa chỉ nhận hàng)
*Mục đích: Lưu trữ danh sách địa chỉ giao hàng của từng khách hàng (quan hệ Composition với `User`).*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh địa chỉ |
| `user_id` | `INT` | Có | FK $\rightarrow$ `users(id)` | ON DELETE CASCADE | Chủ sở hữu địa chỉ |
| `recipient_name`| `NVARCHAR(100)` | Có | | | Họ tên người nhận hàng |
| `phone` | `NVARCHAR(20)` | Có | | | Số điện thoại nhận hàng |
| `province` | `NVARCHAR(100)` | Có | | | Tỉnh / Thành phố |
| `district` | `NVARCHAR(100)` | Có | | | Quận / Huyện |
| `ward` | `NVARCHAR(100)` | Có | | | Phường / Xã |
| `detail_address`| `NVARCHAR(255)` | Có | | | Địa chỉ chi tiết (số nhà, tên đường, thôn xóm)|
| `is_default` | `BIT` | Có | Filtered Index: `uq_user_default_address` (WHERE `is_default = 1`) | `0` | Đánh dấu địa chỉ mặc định (duy nhất 1 địa chỉ mặc định/user) |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm thêm địa chỉ |
| `updated_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm cập nhật địa chỉ |

---

#### Bảng 12: Thực thể `password_reset_tokens` (Token khôi phục mật khẩu)
*Mục đích: Lưu trữ token băm bảo mật phục vụ quy trình đặt lại mật khẩu. Chức năng khôi phục mật khẩu đã được đưa vào thiết kế và có cấu trúc dữ liệu hỗ trợ, tuy nhiên quy trình xử lý hoàn chỉnh chưa được triển khai trong phiên bản hiện tại.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh token |
| `user_id` | `INT` | Có | FK $\rightarrow$ `users(id)` | ON DELETE CASCADE | Tài khoản yêu cầu khôi phục mật khẩu |
| `token_hash` | `NVARCHAR(255)` | Có | UNIQUE | | Chuỗi băm token ngẫu nhiên bảo mật |
| `expires_at` | `DATETIME2` | Có | | | Thời điểm hết hạn của token (30 phút) |
| `used_at` | `DATETIME2` | Không | NULL | | Thời điểm token đã được sử dụng thành công |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm khởi tạo yêu cầu |

---

#### Bảng 13: Thực thể `carts` (Giỏ hàng trực tuyến)
*Mục đích: Quản lý giỏ hàng thành viên với quan hệ 1:1 nghiêm ngặt đối với `users`.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh giỏ hàng |
| `user_id` | `INT` | Có | FK $\rightarrow$ `users(id)` | UNIQUE, CASCADE | Khách hàng sở hữu giỏ hàng (ràng buộc 1:1) |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm khởi tạo giỏ hàng |
| `updated_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm cập nhật giỏ hàng gần nhất |

---

#### Bảng 14: Thực thể `products` (Sản phẩm giày gốc)
*Mục đích: Lưu trữ thông tin chung của mẫu giày cha trước khi phân tách biến thể Size/Màu.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh sản phẩm |
| `category_id` | `INT` | Có | FK $\rightarrow$ `categories` | NO ACTION | Danh mục trực thuộc |
| `brand_id` | `INT` | Không | FK $\rightarrow$ `brands` | SET NULL | Thương hiệu sản xuất |
| `product_code` | `NVARCHAR(50)` | Có | UNIQUE | | Mã quản lý sản phẩm nội bộ |
| `name` | `NVARCHAR(200)` | Có | | | Tên gọi thương mại của sản phẩm |
| `slug` | `NVARCHAR(255)` | Có | UNIQUE | | Đường dẫn tĩnh thân thiện SEO |
| `description` | `NVARCHAR(MAX)` | Không | NULL | | Mô tả chi tiết tính năng, công nghệ sản phẩm |
| `gender_target`| `NVARCHAR(20)` | Có | CHECK | `'UNISEX'` | Đối tượng khách hàng: `MEN, WOMEN, KIDS, UNISEX`|
| `base_price` | `DECIMAL(12,0)`| Có | CHECK (>=0) | | Giá niêm yết gốc của sản phẩm |
| `sale_price` | `DECIMAL(12,0)`| Không| CHECK | NULL | Giá khuyến mãi (`sale_price < base_price`) |
| `status` | `NVARCHAR(20)` | Có | CHECK | `'active'` | Trạng thái: `active`, `inactive`, `draft` |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm tạo sản phẩm |
| `updated_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm cập nhật sản phẩm gần nhất |

---

#### Bảng 15: Thực thể `product_images` (Bộ sưu tập ảnh sản phẩm)
*Mục đích: Lưu trữ album hình ảnh các góc chụp chi tiết của mẫu giày.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh hình ảnh |
| `product_id` | `INT` | Có | FK $\rightarrow$ `products(id)`| ON DELETE CASCADE | Sản phẩm cha chứa hình ảnh |
| `image_url` | `NVARCHAR(1000)`| Có | | | Đường dẫn URL hình ảnh chất lượng cao |
| `is_primary` | `BIT` | Có | Filtered Index: `uq_product_primary_image` (WHERE `is_primary = 1`) | `0` | Đánh dấu ảnh đại diện chính (duy nhất 1 ảnh chính/sản phẩm) |
| `display_order` | `INT` | Có | | `0` | Thứ tự ưu tiên hiển thị trong slider ảnh |

---

#### Bảng 16: Thực thể `product_variants` (Biến thể SKU và Tồn kho)
*Mục đích: Quản lý ma trận phân loại Size x Color và lưu trữ số lượng tồn kho theo từng mã SKU.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh biến thể |
| `product_id` | `INT` | Có | FK $\rightarrow$ `products` | ON DELETE CASCADE | Mẫu giày cha trực thuộc |
| `size_id` | `INT` | Có | FK $\rightarrow$ `sizes` | NO ACTION | Kích cỡ giày của biến thể |
| `color_id` | `INT` | Có | FK $\rightarrow$ `colors` | NO ACTION | Màu sắc của biến thể |
| `sku` | `NVARCHAR(100)` | Có | UNIQUE | | Mã SKU duy nhất định danh biến thể |
| `stock_quantity`| `INT` | Có | CHECK (>=0) | `0` | Số lượng tồn kho thực tế có thể bán |
| `status` | `NVARCHAR(20)` | Có | CHECK | `'active'` | Trạng thái biến thể: `active` hoặc `inactive` |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm tạo biến thể |
| `updated_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm cập nhật biến thể |
| *Ràng buộc* | | | `UNIQUE(product_id, size_id, color_id)` | | Chống trùng lặp cặp kích cỡ và màu sắc |

---

#### Bảng 17: Thực thể `cart_items` (Chi tiết mặt hàng trong giỏ)
*Mục đích: Lưu trữ từng dòng sản phẩm khách hàng chọn đưa vào giỏ hàng.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh dòng mặt hàng giỏ |
| `cart_id` | `INT` | Có | FK $\rightarrow$ `carts(id)` | ON DELETE CASCADE | Giỏ hàng sở hữu |
| `variant_id` | `INT` | Có | FK $\rightarrow$ `product_variants`| NO ACTION | Biến thể sản phẩm chọn mua |
| `quantity` | `INT` | Có | CHECK (>0) | `1` | Số lượng đặt (Quy tắc Q7: tối đa 10 đôi) |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm thêm vào giỏ |
| `updated_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm sửa số lượng |
| *Ràng buộc* | | | `UNIQUE(cart_id, variant_id)` | | Một biến thể chỉ xuất hiện 1 dòng trong giỏ |

---

#### Bảng 18: Thực thể `orders` (Thông tin tổng quát đơn hàng)
*Mục đích: Lưu trữ hồ sơ giao dịch đặt hàng và snapshot thông tin tài chính bất biến.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh đơn hàng |
| `order_code` | `NVARCHAR(50)` | Có | UNIQUE | | Mã đơn hàng hiển thị (ví dụ `ORD-1731800000-XYZ`)|
| `user_id` | `INT` | Có | FK $\rightarrow$ `users(id)` | NO ACTION | Khách hàng đặt mua |
| `recipient_name_snapshot`| `NVARCHAR(100)`| Có | | | Snapshot họ tên người nhận tại thời điểm đặt |
| `recipient_phone_snapshot`| `NVARCHAR(20)`| Có | | | Snapshot số điện thoại người nhận |
| `delivery_address_snapshot`| `NVARCHAR(255)`| Có | | | Snapshot địa chỉ nhận hàng chi tiết đầy đủ |
| `subtotal` | `DECIMAL(12,0)`| Có | CHECK (>=0) | | Tổng tiền hàng tạm tính trước giảm giá |
| `discount_amount`| `DECIMAL(12,0)`| Có | CHECK (>=0) | `0` | Số tiền chiết khấu được giảm từ voucher |
| `shipping_fee` | `DECIMAL(12,0)`| Có | CHECK (>=0) | `0` | Cước phí vận chuyển đơn hàng |
| `total_amount` | `DECIMAL(12,0)`| Có | CHECK (>=0) | | Tổng số tiền thanh toán cuối cùng |
| `voucher_id` | `INT` | Không | FK $\rightarrow$ `vouchers` | SET NULL | Voucher đã áp dụng (nếu có) |
| `voucher_code_snapshot`| `NVARCHAR(50)`| Không | NULL | | Snapshot mã voucher tại thời điểm đặt |
| `payment_method`| `NVARCHAR(20)`| Có | CHECK | `'COD'` | Hình thức thanh toán: `COD` |
| `payment_status`| `NVARCHAR(20)`| Có | CHECK | `'UNPAID'` | Trạng thái thanh toán: `UNPAID` hoặc `PAID` |
| `order_status` | `NVARCHAR(20)` | Có | CHECK | `'PENDING'` | Trạng thái: `PENDING, CONFIRMED, PROCESSING, SHIPPING, COMPLETED, CANCELLED`|
| `customer_note`| `NVARCHAR(500)`| Không | NULL | | Ghi chú dặn dò của khách hàng khi giao hàng |
| `admin_note` | `NVARCHAR(500)`| Không | NULL | | Ghi chú xử lý nội bộ của quản trị viên |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm tạo đơn hàng |
| `updated_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm cập nhật trạng thái đơn gần nhất |

---

#### Bảng 19: Thực thể `order_items` (Snapshot chi tiết từng món hàng đặt)
*Mục đích: Lưu giữ bản sao bất biến của các sản phẩm trong đơn, bảo toàn dữ liệu lịch sử kế toán.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh dòng chi tiết đơn hàng |
| `order_id` | `INT` | Có | FK $\rightarrow$ `orders(id)` | ON DELETE CASCADE | Đơn hàng trực thuộc |
| `product_variant_id`| `INT` | Có | FK $\rightarrow$ `product_variants`| NO ACTION | Biến thể giày đã đặt mua |
| `product_name_snapshot`| `NVARCHAR(200)`| Có| | | Snapshot tên sản phẩm tại thời điểm mua |
| `sku_snapshot` | `NVARCHAR(100)`| Có | | | Snapshot mã SKU biến thể |
| `size_snapshot`| `NVARCHAR(20)` | Có | | | Snapshot kích cỡ giày |
| `color_snapshot`| `NVARCHAR(50)` | Có | | | Snapshot màu sắc giày |
| `unit_price` | `DECIMAL(12,0)`| Có | CHECK (>=0) | | Snapshot đơn giá bán thực tế của 1 đôi |
| `quantity` | `INT` | Có | CHECK (>0) | | Số lượng đặt mua của mặt hàng này |
| `line_total` | `DECIMAL(12,0)`| Có | CHECK (>=0) | | Thành tiền của dòng (`unit_price * quantity`)|

---

#### Bảng 20: Thực thể `order_status_histories` (Nhật ký chuyển đổi trạng thái đơn)
*Mục đích: Lưu vết kiểm toán (Audit Trail) cho toàn bộ tiến trình chuyển đổi trạng thái của đơn hàng.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh dòng lịch sử trạng thái |
| `order_id` | `INT` | Có | FK $\rightarrow$ `orders(id)` | ON DELETE CASCADE | Đơn hàng được ghi nhận |
| `changed_by` | `INT` | Có | FK $\rightarrow$ `users(id)` | NO ACTION | Người thực hiện thao tác (Admin hoặc Khách)|
| `previous_status`| `NVARCHAR(50)`| Không| NULL | | Trạng thái trước khi chuyển đổi |
| `new_status` | `NVARCHAR(50)` | Có | | | Trạng thái mới sau khi chuyển đổi |
| `note` | `NVARCHAR(255)`| Không | NULL | | Lý do chuyển đổi hoặc lý do hủy đơn |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm ghi nhận sự kiện chuyển trạng thái |

---

#### Bảng 21: Thực thể `inventory_transactions` (Lịch sử biến động thẻ kho)
*Mục đích: Ghi nhận vết kiểm toán mọi lần tăng/giảm tồn kho (bán hàng, hoàn kho hủy đơn, kiểm kê kho).*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh giao dịch kho |
| `variant_id` | `INT` | Có | FK $\rightarrow$ `product_variants`| NO ACTION | Biến thể giày có biến động tồn kho |
| `user_id` | `INT` | Có | FK $\rightarrow$ `users(id)` | NO ACTION | Người thực hiện (Admin kiểm kê hoặc Khách đặt)|
| `old_quantity` | `INT` | Có | CHECK (>=0) | | Số lượng tồn kho trước khi thay đổi |
| `new_quantity` | `INT` | Có | CHECK (>=0) | | Số lượng tồn kho sau khi thay đổi |
| `change_quantity`| `INT` | Có | | | Số lượng thay đổi (+ để tăng, - để giảm) |
| `reason` | `NVARCHAR(255)`| Có | | | Lý do điều chỉnh (Xuất bán, Hoàn hủy, Kiểm kê)|
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm phát sinh giao dịch thẻ kho |

---

#### Bảng 22: Thực thể `voucher_usages` (Nhật ký sử dụng mã giảm giá)
*Mục đích: Thực thi ràng buộc Quy tắc Q8 (mỗi khách hàng chỉ được dùng tối đa 1 lần cho mỗi voucher).*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh lượt sử dụng |
| `voucher_id` | `INT` | Có | FK $\rightarrow$ `vouchers(id)`| NO ACTION | Mã voucher được áp dụng |
| `user_id` | `INT` | Có | FK $\rightarrow$ `users(id)` | NO ACTION | Khách hàng hưởng ưu đãi |
| `order_id` | `INT` | Có | FK $\rightarrow$ `orders(id)` | ON DELETE CASCADE | Đơn hàng áp dụng mã ưu đãi |
| `used_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm sử dụng mã voucher |
| *Ràng buộc* | | | `UNIQUE(voucher_id, user_id)` | | Ràng buộc cứng: 1 khách chỉ dùng 1 voucher 1 lần |

---

#### Bảng 23: Thực thể `wishlist_items` (Danh sách sản phẩm yêu thích)
*Mục đích: Lưu trữ danh sách sản phẩm yêu thích được lưu bền vững phía máy chủ cho khách hàng.*

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Giá trị mặc định | Mô tả nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `INT` | Có | PK, IDENTITY(1,1) | Tự tăng | Mã định danh dòng mặt hàng yêu thích |
| `user_id` | `INT` | Có | FK $\rightarrow$ `users(id)` | ON DELETE CASCADE | Khách hàng lưu sản phẩm |
| `product_id` | `INT` | Có | FK $\rightarrow$ `products(id)`| ON DELETE CASCADE | Sản phẩm được đưa vào danh sách yêu thích |
| `created_at` | `DATETIME2` | Có | | `GETDATE()` | Thời điểm lưu sản phẩm vào danh sách |
| *Ràng buộc* | | | `UNIQUE(user_id, product_id)` | | Một sản phẩm chỉ xuất hiện 1 lần trong wishlist |

---

### 2.5. Sơ đồ hoạt động (Activity Diagrams)

Toàn bộ 5 sơ đồ hoạt động cốt lõi được xây dựng chuẩn mực theo cú pháp UML 2.5, mô hình hóa chính xác các luồng rẽ nhánh, kiểm tra dữ liệu máy chủ và các giao dịch nguyên tử (ACID Transaction) kết hợp khóa dòng bi quan `SELECT ... WITH (UPDLOCK, ROWLOCK)` của Microsoft SQL Server:

#### A. Quy trình Đăng ký & Đăng nhập (Hình 10)
Mô hình hóa quy trình xác thực hai tác nhân: Đăng ký thành viên mới (kiểm tra tính duy nhất của email, băm mật khẩu `bcryptjs`, khởi tạo giỏ hàng tự động) và Đăng nhập (so khớp hash mật khẩu, cấp phiên làm việc `session`, chuyển hướng theo vai trò `ADMIN` hoặc `CUSTOMER`).

<div align="center">
  <img src="images/hinh_10_activity_auth.png" alt="Hình 10: Sơ đồ hoạt động Đăng ký & Đăng nhập" style="max-width: 85%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 10: Sơ đồ hoạt động - Quy trình Đăng ký & Đăng nhập</strong></p>
</div>

---

#### B. Quy trình Mua hàng & Đặt hàng COD nguyên tử (Hình 11)
Mô hình hóa luồng đặt hàng thanh toán COD chạy trong một `sql.Transaction` nguyên tử: Khóa dòng kiểm tra voucher bằng `SELECT ... WITH (UPDLOCK, ROWLOCK)`, kiểm tra điều kiện Quy tắc Q8, khóa và kiểm tra tồn kho từng biến thể, trừ kho tức thời, tạo bản ghi `orders` và `order_items` snapshot bất biến, cập nhật `voucher_usages` và dọn sạch giỏ hàng. Nếu có bất kỳ lỗi nào xảy ra, toàn bộ giao dịch được Rollback an toàn.

<div align="center">
  <img src="images/hinh_11_activity_checkout.png" alt="Hình 11: Sơ đồ hoạt động Đặt hàng COD" style="max-width: 85%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 11: Sơ đồ hoạt động - Quy trình Mua hàng & Đặt hàng COD</strong></p>
</div>

---

#### C. Máy trạng thái xử lý đơn hàng Admin (Hình 12)
Mô hình hóa máy trạng thái đơn hàng (Order State Machine) khép kín gồm 6 trạng thái: `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`. Khi Admin chuyển sang `COMPLETED`, hệ thống tự động đồng bộ `payment_status = 'PAID'`. Mọi lần chuyển đổi đều được ghi vết kiểm toán vào `order_status_histories`.

<div align="center">
  <img src="images/hinh_12_activity_order_processing.png" alt="Hình 12: Sơ đồ hoạt động Xử lý đơn hàng Admin" style="max-width: 85%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 12: Sơ đồ hoạt động - Máy trạng thái xử lý đơn hàng Admin</strong></p>
</div>

---

#### D. Quy trình Hủy đơn hàng và Hoàn kho tự động (Hình 13)
Mô hình hóa cơ chế hủy đơn: Khách hàng chỉ được hủy khi đơn đang ở trạng thái `PENDING`; Quản trị viên có quyền hủy khi đơn ở trạng thái `PENDING` hoặc `CONFIRMED`. Hệ thống tự động kích hoạt Transaction hoàn trả số lượng tồn kho cho các biến thể trong `order_items`, giảm `used_count` và xóa bản ghi `voucher_usages` nếu đơn có áp dụng voucher.

<div align="center">
  <img src="images/hinh_13_activity_order_cancel.png" alt="Hình 13: Sơ đồ hoạt động Hủy đơn hàng và Hoàn kho tự động" style="max-width: 85%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 13: Sơ đồ hoạt động - Hủy đơn hàng và Hoàn kho tự động</strong></p>
</div>

---

#### E. Quy trình Admin kiểm kê và Điều chỉnh kho (Hình 14)
Mô hình hóa quy trình kiểm kê kho: Quản trị viên tra cứu SKU biến thể, nhập số lượng điều chỉnh tăng/giảm và bắt buộc nhập lý do điều chỉnh; hệ thống chạy Transaction nguyên tử cập nhật `product_variants.stock_quantity` và tự động ghi nhận một bản ghi thẻ kho vào `inventory_transactions`.

<div align="center">
  <img src="images/hinh_14_activity_inventory.png" alt="Hình 14: Sơ đồ hoạt động Admin kiểm kê và điều chỉnh kho" style="max-width: 85%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 14: Sơ đồ hoạt động - Admin kiểm kê và điều chỉnh tồn kho</strong></p>
</div>

---

### 2.6. Thiết kế giao diện và đặc tả màn hình (Wireframe & UI Specifications)

Phần giao diện người dùng được triển khai thực tế bằng Template Engine Pug và framework Tailwind CSS, tối ưu hóa hiển thị responsive hoàn hảo trên đa thiết bị:

#### 1. Giao diện Trang chủ (Home Page) - Hình 15
* **Route:** `GET /`
* **Template:** `src/views/pages/home.pug`
* **Mô tả:** Hiển thị Hero Banner carousel quảng bá bộ sưu tập mới; thanh điều hướng chính (Header) tích hợp live search; danh mục nổi bật (Sneaker, Thể thao, Sandal, Dép); danh sách sản phẩm bán chạy và sản phẩm mới nhất.

<div align="center">
  <img src="images/hinh_17_giao_dien_trang_chu.png" alt="Hình 15: Giao diện Trang chủ VAMOS STORE" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 15: Giao diện Trang chủ (Home Page) VAMOS STORE</strong></p>
</div>

---

#### 2. Giao diện Cửa hàng & Bộ lọc đa tiêu chí (Shop & Filter) - Hình 16
* **Route:** `GET /products`
* **Template:** `src/views/pages/products/index.pug`
* **Mô tả:** Bộ lọc nâng cao đa tiêu chí phía thanh bên trái (Sidebar Filter) cho phép lọc theo Danh mục, Giới tính, Size giày (36-45), Màu sắc và Khoảng giá; khu vực lưới hiển thị thẻ sản phẩm (Card) với nhãn giá niêm yết, giá khuyến mãi và trạng thái hàng.

<div align="center">
  <img src="images/hinh_18_giao_dien_cua_hang.png" alt="Hình 16: Giao diện Cửa hàng & Bộ lọc đa tiêu chí" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 16: Giao diện Cửa hàng & Bộ lọc đa tiêu chí (Shop & Filter)</strong></p>
</div>

---

#### 3. Giao diện Chi tiết sản phẩm & Chọn Size/Màu - Hình 17
* **Route:** `GET /products/:slug`
* **Template:** `src/views/pages/products/detail.pug`
* **Mô tả:** Thư viện ảnh gallery chất lượng cao; khu vực chọn ma trận Size và Màu sắc có kiểm tra tồn kho thời gian thực; nút "Thêm vào giỏ hàng" và nút "Lưu vào yêu thích"; bảng thông số chất liệu và hướng dẫn đo size chân.

<div align="center">
  <img src="images/hinh_19_giao_dien_chi_tiet_san_pham.png" alt="Hình 17: Giao diện Chi tiết sản phẩm & Chọn Size/Màu" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 17: Giao diện Chi tiết sản phẩm & Chọn Size/Màu</strong></p>
</div>

---

#### 4. Giao diện Giỏ hàng trực tuyến (Shopping Cart) - Hình 18
* **Route:** `GET /cart`
* **Template:** `src/views/pages/cart/index.pug`
* **Mô tả:** Bảng danh sách các mặt hàng đã chọn (ảnh, tên, size, màu, đơn giá, số lượng); cụm nút tăng/giảm số lượng có kiểm tra hạn mức bán lẻ (tối đa 10 đôi); nút xóa dòng mặt hàng; cột tóm tắt tài chính tạm tính và nút chuyển sang bước Đặt hàng COD.

<div align="center">
  <img src="images/hinh_20_giao_dien_gio_hang.png" alt="Hình 18: Giao diện Giỏ hàng trực tuyến" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 18: Giao diện Giỏ hàng trực tuyến (Shopping Cart)</strong></p>
</div>

---

#### 5. Giao diện Đặt hàng thanh toán COD (Checkout) - Hình 19
* **Route:** `GET /checkout`
* **Template:** `src/views/pages/checkout/index.pug`
* **Mô tả:** Khu vực lựa chọn địa chỉ giao hàng nhận hàng từ sổ địa chỉ có sẵn hoặc nhập địa chỉ mới; ô nhập mã giảm giá voucher kèm nút kiểm tra tính hợp lệ; bảng tóm tắt đơn hàng (tạm tính, giảm giá, phí ship, tổng tiền); nút xác nhận đặt hàng thanh toán COD.

<div align="center">
  <img src="images/hinh_21_giao_dien_dat_hang_cod.png" alt="Hình 19: Giao diện Đặt hàng COD (Checkout)" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 19: Giao diện Đặt hàng COD (Checkout)</strong></p>
</div>

---

#### 6. Giao diện Đăng ký / Đăng nhập tài khoản - Hình 20
* **Route:** `GET /auth/login` và `GET /auth/register`
* **Template:** `src/views/pages/auth/login.pug` và `register.pug`
* **Mô tả:** Biểu mẫu đăng nhập và đăng ký chuẩn mực có validation thời gian thực phía máy khách và kiểm tra an toàn phía máy chủ; thông báo lỗi trực quan khi nhập sai định dạng email hoặc mật khẩu không khớp.

<div align="center">
  <img src="images/hinh_22_giao_dien_dang_nhap.png" alt="Hình 20: Giao diện Đăng ký / Đăng nhập tài khoản" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 20: Giao diện Đăng ký / Đăng nhập tài khoản</strong></p>
</div>

---

#### 7. Giao diện Lịch sử đơn hàng của khách - Hình 21
* **Route:** `GET /account/orders` và `GET /account/orders/:id`
* **Template:** `src/views/pages/account/orders.pug` và `order-detail.pug`
* **Mô tả:** Bảng danh sách đơn hàng đã mua kèm badge trạng thái màu sắc trực quan; trang chi tiết đơn hàng hiển thị mã đơn, tiến trình thời gian thực, snapshot địa chỉ người nhận, snapshot sản phẩm và nút "Hủy đơn hàng" khi đơn đang ở trạng thái `PENDING`.

<div align="center">
  <img src="images/hinh_23_giao_dien_lich_su_don_hang.png" alt="Hình 21: Giao diện Lịch sử đơn hàng của khách" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 21: Giao diện Lịch sử đơn hàng của khách hàng</strong></p>
</div>

---

#### 8. Giao diện Admin Dashboard tổng quan - Hình 22
* **Route:** `GET /admin/dashboard`
* **Template:** `src/views/pages/admin/dashboard.pug`
* **Mô tả:** Bảng điều khiển quản trị trung tâm hiển thị 4 thẻ KPI tài chính và đơn hàng; biểu đồ thống kê đơn hàng theo 6 trạng thái; bảng xếp hạng Top 4 sản phẩm bán chạy nhất theo số lượng bán (`ORDER BY total_sold DESC`); danh sách các biến thể giày sắp hết hàng (`stock <= 5`) để quản lý kịp thời nhập thêm hàng.

<div align="center">
  <img src="images/hinh_24_giao_dien_admin_dashboard.png" alt="Hình 22: Giao diện Admin Dashboard tổng quan" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 22: Giao diện Admin Dashboard tổng quan</strong></p>
</div>

---

#### 9. Giao diện Admin Quản lý sản phẩm & Biến thể - Hình 23
* **Route:** `GET /admin/products` và `GET /admin/products/create`
* **Template:** `src/views/pages/admin/products.pug` và `product-form.pug`
* **Mô tả:** Bảng danh sách sản phẩm có tìm kiếm và phân trang; form thêm/sửa sản phẩm tích hợp cấu hình ma trận biến thể Size x Color x SKU, nhập số lượng tồn kho ban đầu, tải lên bộ sưu tập ảnh và chọn ảnh đại diện chính.

<div align="center">
  <img src="images/hinh_25_giao_dien_admin_san_pham.png" alt="Hình 23: Giao diện Admin Quản lý sản phẩm & Biến thể" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 23: Giao diện Admin Quản lý sản phẩm & Biến thể</strong></p>
</div>

---

#### 10. Giao diện Admin Vận hành đơn hàng - Hình 24
* **Route:** `GET /admin/orders` và `GET /admin/orders/:id`
* **Template:** `src/views/pages/admin/orders.pug` và `order-detail.pug`
* **Mô tả:** Danh sách quản lý đơn hàng toàn sàn có bộ lọc trạng thái; trang chi tiết đơn hàng cho phép xem thông tin khách, địa chỉ snapshot, sản phẩm đặt và form cập nhật trạng thái theo đúng máy trạng thái nghiệp vụ.

<div align="center">
  <img src="images/hinh_26_giao_dien_admin_don_hang.png" alt="Hình 24: Giao diện Admin Vận hành đơn hàng" style="max-width: 90%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 15px 0;" />
  <p><strong>Hình 24: Giao diện Admin Vận hành và xử lý đơn hàng</strong></p>
</div>
