# ĐẶC TẢ GIAO DIỆN CÁC TRANG (PAGE SPECIFICATIONS) - VAMOS STORE

> **Dự án:** VAMOS STORE  
> **Quy mô:** 35 Màn hình & Thành phần Pug Templates  
> **Phiên bản:** v1.1 Chuẩn hóa  

---

## 1. PHÂN HỆ CÔNG KHAI & KHÁCH HÀNG (PUBLIC & CUSTOMER PAGES)

| Đường dẫn (URL) | Tệp Pug Template | Phân quyền | Thành phần & Dữ liệu hiển thị | Tương tác & Hành động |
| :--- | :--- | :---: | :--- | :--- |
| `/` | `pages/home/index.pug` | Guest, Customer | Slider Banner chính, Danh mục nổi bật, Sản phẩm mới nhất, Sản phẩm bán chạy | Chuyển slide banner, click vào xem danh mục, click vào xem chi tiết sản phẩm |
| `/products` | `pages/products/index.pug` | Guest, Customer | Bộ lọc đa tiêu chí (danh mục, khoảng giá, size, màu), thanh tìm kiếm, sắp xếp giá, lưới sản phẩm phân trang | Lọc kết hợp real-time query, phân trang, chuyển trang |
| `/products/:slug`| `pages/products/detail.pug` | Guest, Customer | Bộ ảnh sản phẩm phóng to, bảng chọn size & màu sắc, tồn kho từng biến thể, mô tả, nút thêm giỏ | Chọn biến thể cập nhật trạng thái kho, tăng giảm số lượng, thêm vào giỏ hàng |
| `/cart` | `pages/cart/index.pug` | Guest, Customer | Danh sách mặt hàng (ảnh, tên, size, màu, đơn giá, số lượng), tổng tiền tạm tính, banner nhắc nhở Guest đăng nhập để checkout | Tăng/giảm số lượng, xóa sản phẩm, chuyển đến trang thanh toán COD |
| `/checkout` | `pages/checkout/index.pug` | Customer | Sổ địa chỉ nhận hàng (hoặc nhập địa chỉ mới), ô nhập voucher kèm nút áp dụng, ghi chú, tóm tắt tổng thanh toán COD | Áp dụng mã voucher, chọn địa chỉ, nút submit có JavaScript chống double click |
| `/checkout/success`| `pages/checkout/success.pug`| Customer | Mã đơn hàng (order_code), tổng tiền COD cần chuẩn bị khi nhận hàng, hướng dẫn nhận hàng | Nút xem chi tiết đơn hàng, nút tiếp tục mua sắm |
| `/orders` | `pages/orders/index.pug` | Customer | Danh sách toàn bộ đơn hàng đã đặt kèm mã đơn, ngày đặt, số lượng SP, tổng tiền, trạng thái | Bấm xem chi tiết từng đơn, lọc theo trạng thái |
| `/orders/:id` | `pages/orders/detail.pug` | Customer | Thông tin người nhận snapshot, timeline máy trạng thái đơn, danh sách mặt hàng snapshot kèm giá cứng, nút Hủy đơn | Nút "Hủy đơn hàng" hiển thị duy nhất khi đơn ở trạng thái `PENDING` |
| `/auth/login` | `pages/auth/login.pug` | Guest | Form đăng nhập (Email, Mật khẩu), link quên mật khẩu, link đăng ký, hiển thị flash alert | Gửi form đăng nhập, chặn nếu đã có session cũ với thông báo yêu cầu đăng xuất |
| `/auth/register` | `pages/auth/register.pug` | Guest | Form đăng ký (Họ tên, Email, Số điện thoại, Mật khẩu, Xác nhận MK) | Gửi form đăng ký, tự động gộp giỏ hàng khách và kích hoạt tài khoản |
| `/auth/forgot-password`| `pages/auth/forgot-password.pug`| Guest | Form nhập email yêu cầu cấp link đặt lại mật khẩu | Gửi token mật mã qua Email Service |
| `/auth/reset-password` | `pages/auth/reset-password.pug` | Guest | Form nhập mật khẩu mới và xác nhận mật khẩu | Cập nhật mật khẩu băm bcrypt vào CSDL |

---

## 2. PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN PORTAL PAGES)

Toàn bộ các trang quản trị đều được bảo vệ bởi middleware `requireAdmin`, tích hợp thanh điều hướng dùng chung `partials/admin-nav.pug`:

| Đường dẫn (URL) | Tệp Pug Template | Mô tả chức năng quản trị | Dữ liệu chính & Tác vụ vận hành |
| :--- | :--- | :--- | :--- |
| `/admin/dashboard` | `pages/admin/dashboard.pug` | Bảng điều khiển trung tâm & thống kê doanh thu | Số lượng đơn theo trạng thái, tổng doanh thu đơn `COMPLETED`, top 5 sản phẩm bán chạy nhất, danh sách đơn cần xử lý gấp |
| `/admin/orders` | `pages/admin/orders.pug` | Quản lý danh sách toàn bộ đơn hàng | Bộ lọc trạng thái (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `COMPLETED`, `CANCELLED`), tìm kiếm theo mã đơn, khách hàng |
| `/admin/orders/:id` | `pages/admin/order-detail.pug`| Chi tiết & chuyển trạng thái đơn hàng | Cập nhật trạng thái theo State Machine tuần tự; form hủy đơn nội bộ bắt buộc nhập lý do (tự động hoàn kho & giải phóng voucher) |
| `/admin/products` | `pages/admin/products.pug` | Quản lý danh mục sản phẩm kinh doanh | Bảng danh sách sản phẩm, giá bán, danh mục, trạng thái active/draft, tổng tồn kho các biến thể, nút bật/tắt hiển thị |
| `/admin/products/create`| `pages/admin/product-form.pug`| Thêm sản phẩm mới kèm bộ biến thể | Nhập thông tin cha (tên, slug, code, danh mục, giá, ảnh) và bảng thêm động các biến thể Size x Màu x SKU x Số lượng ban đầu |
| `/admin/products/:id/edit`| `pages/admin/product-form.pug`| Chỉnh sửa thông tin sản phẩm và biến thể | Cập nhật giá, ảnh, thông tin sản phẩm (nhờ Snapshot Pattern, đơn hàng cũ không bị ảnh hưởng) |
| `/admin/inventory` | `pages/admin/inventory.pug` | Quản lý tồn kho theo biến thể chi tiết | Bảng danh sách SKU, tên SP, Size, Màu, Số lượng tồn; badge cảnh báo tồn thấp (`<= 5`); form điều chỉnh tăng/giảm tồn kho trực tiếp |
| `/admin/inventory/history`| `pages/admin/inventory-history.pug`| Nhật ký kiểm toán kho (Audit Log) | Lịch sử mọi biến động tồn kho: thời gian, mã SKU, số lượng cũ, số lượng mới, độ chênh lệch, lý do, người thao tác |
| `/admin/categories`| `pages/admin/categories.pug` | Quản lý danh mục & thương hiệu | Thêm mới danh mục, cấu hình slug, bật/tắt hiển thị danh mục, thêm mới thương hiệu / bộ sưu tập |
| `/admin/vouchers` | `pages/admin/vouchers.pug` | Quản lý mã giảm giá khuyến mãi | Bảng mã voucher, loại giảm giá (% hoặc số tiền), giá trị đơn tối thiểu, số lượt đã dùng / giới hạn, thời hạn, nút bật/tắt |
| `/admin/vouchers/create`| `pages/admin/voucher-form.pug`| Tạo mới mã giảm giá | Form cấu hình mã, tên, loại chiết khấu, hạn mức, ngày bắt đầu và kết thúc |
| `/admin/customers` | `pages/admin/customers.pug` | Quản lý tài khoản khách hàng | Danh sách khách hàng, tổng số đơn đã mua, trạng thái hoạt động (`active`/`locked`), nút khóa/mở khóa tài khoản |
| `/admin/customers/:id`| `pages/admin/customer-detail.pug`| Hồ sơ khách hàng chi tiết | Thông tin cá nhân, danh sách sổ địa chỉ, toàn bộ lịch sử đơn hàng của khách hàng, nút khóa tài khoản với hiệu lực vô hiệu hóa session tức thì |
| `/admin/banners` | `pages/admin/banners.pug` | Quản lý slider banner trang chủ | Danh sách banner, xem trước ảnh, liên kết đích, thứ tự hiển thị, form thêm banner mới và nút bật/tắt hiển thị |
