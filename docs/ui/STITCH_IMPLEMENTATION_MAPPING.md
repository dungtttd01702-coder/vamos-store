# VAMOS STORE — STITCH IMPLEMENTATION MAPPING
**Mục tiêu:** Ánh xạ chi tiết 16 màn hình Google Stitch với toàn bộ kiến trúc MVC thực tế (Routes, Controllers, Services, Repositories, Database Tables và Pug Templates).

---

## 1. MÀN HÌNH 01: QUẢN LÝ BANNERS & SLIDER TRANG CHỦ
- **Mã Screen ID:** `dc21845f3c5749f4b538a05d4687cde3`
- **Route URL:** `/admin/banners`
- **Controller:** `src/controllers/admin.controller.js` (`getBanners`, `updateBanner`, `createBanner`, `deleteBanner`)
- **Service:** `src/services/admin.service.js`
- **Repository:** `src/repositories/admin.repository.js`
- **Database Table:** `dbo.banners` (các trường: `id`, `title`, `image_url`, `link_url`, `display_order`, `is_active`, `created_at`)
- **Pug Template:** `src/views/pages/admin/banners.pug` (kế thừa layout `src/views/layouts/main.pug`, nạp sidebar `admin-nav.pug`)
- **Components & Tương tác:**
  - 4 KPI thẻ Banner (Tổng số banner đang chạy, CTR trung bình, Lượt view/impression, Banner tạm ẩn).
  - Danh sách Hero Top Sliders với biểu tượng kéo thả sắp xếp thứ tự 1, 2, 3, 4.
  - Form cấu hình kép ảnh Desktop (1920x620) và Mobile (750x750) hỗ trợ Multer upload.
  - Bảng thống kê CTR và tỷ lệ chuyển đổi đơn hàng 30 ngày.

---

## 2. MÀN HÌNH 02: QUẢN LÝ ĐƠN HÀNG & STATE MACHINE 6 BƯỚC
- **Mã Screen ID:** `df51e57d544e46b9ae0895bf8bf7e6ae`
- **Route URL:** `/admin/orders`
- **Controller:** `src/controllers/admin.controller.js` (`getOrders`, `updateOrderStatus`)
- **Service:** `src/services/order.service.js` (State Machine 6 bước tuyến tính: PENDING → CONFIRMED → PROCESSING → SHIPPING → COMPLETED; nhánh CANCELLED hoàn tồn kho)
- **Repository:** `src/repositories/order.repository.js`
- **Database Tables:** `dbo.orders`, `dbo.order_items`, `dbo.order_status_history`, `dbo.product_variants`, `dbo.inventory_transactions`, `dbo.vouchers`
- **Pug Template:** `src/views/pages/admin/orders.pug`
- **Components & Tương tác:**
  - 6 Tabs trạng thái State Machine kèm số lượng badge thời gian thực (PENDING, CONFIRMED, PROCESSING, SHIPPING, COMPLETED, CANCELLED).
  - Thanh tiến trình ngang Visual Timeline Tracker.
  - Cụm nút thao tác điều chuyển trạng thái (Xác nhận đơn, Giao hàng, Hoàn tất, Hủy đơn & Hoàn kho).
  - Snapshot bất biến thông tin người nhận, danh sách sản phẩm snapshot, tổng tiền COD.
  - Bảng danh sách đơn hàng có tìm kiếm, lọc theo hình thức, khoảng tiền và phân trang.

---

## 3. MÀN HÌNH 03: GIỎ HÀNG & TÓM TẮT ĐƠN HÀNG
- **Mã Screen ID:** `c4b0ed084792494f9bbb658bc29246d7`
- **Route URL:** `/cart`
- **Controller:** `src/controllers/cart.controller.js` (`getCart`, `addItem`, `updateQuantity`, `removeItem`, `applyVoucher`, `removeVoucher`)
- **Service:** `src/services/cart.service.js`
- **Repository:** `src/repositories/cart.repository.js`, `src/repositories/product.repository.js`
- **Database Tables:** `dbo.carts`, `dbo.cart_items`, `dbo.product_variants`, `dbo.products`, `dbo.vouchers`, `dbo.voucher_usages`
- **Pug Template:** `src/views/pages/cart/index.pug`
- **Components & Tương tác:**
  - Banner nhắc nhở Khách vãng lai đăng nhập nhận ưu đãi VAMOS100.
  - Thanh tiến độ Freeship 100% (miễn phí vận chuyển khi tổng tiền hàng >= 500.000₫).
  - Bảng mặt hàng giỏ: chọn số lượng tăng/giảm, giới hạn cap bán lẻ tối đa 10 đôi/sản phẩm (Q7), xóa từng món hoặc xóa toàn bộ giỏ.
  - Hộp tóm tắt đơn hàng bên phải: Ô nhập voucher, tính tạm tính, giảm giá voucher, phí ship, tổng cộng thanh toán.
  - Slide-over Mini Cart Drawer trượt từ cạnh phải khi nhấp vào icon giỏ hàng trên TopNavBar.

---

## 4. MÀN HÌNH 04: THANH TOÁN COD AN TOÀN
- **Mã Screen ID:** `ae23af5701cd43c696a15c4091cdea97`
- **Route URL:** `/checkout`
- **Controller:** `src/controllers/checkout.controller.js` (`getCheckout`, `processCheckout`)
- **Service:** `src/services/checkout.service.js`, `src/services/order.service.js`
- **Repository:** `src/repositories/order.repository.js`, `src/repositories/address.repository.js`
- **Database Tables:** `dbo.orders`, `dbo.order_items`, `dbo.addresses`, `dbo.product_variants`, `dbo.vouchers`, `dbo.voucher_usages`
- **Pug Template:** `src/views/pages/checkout/index.pug`
- **Components & Tương tác:**
  - Tiến trình thanh toán 3 bước (1. Giỏ hàng -> 2. Thông tin & Thanh toán -> 3. Hoàn tất).
  - Form chọn địa chỉ giao nhận (dành cho thành viên) hoặc nhập địa chỉ mới (tên, SĐT, tỉnh/thành, quận/huyện, phường/xã, địa chỉ chi tiết).
  - Lựa chọn phương thức thanh toán: Mặc định COD (Thanh toán khi nhận hàng đồng kiểm 100%), phí ship cố định 30.000₫ (miễn phí khi đơn hàng từ 500.000₫).
  - Nút "ĐẶT HÀNG COD NGAY" với cơ chế chống double-submit qua JavaScript disabling và server-side atomic locking.

---

## 5. MÀN HÌNH 05: ADMIN DASHBOARD & KPI DOANH THU THỰC TẾ
- **Mã Screen ID:** `0bab041468e54d9f977a2b523c949088`
- **Route URL:** `/admin`
- **Controller:** `src/controllers/admin.controller.js` (`getDashboard`)
- **Service:** `src/services/admin.service.js`
- **Repository:** `src/repositories/admin.repository.js`
- **Database Tables:** `dbo.orders`, `dbo.order_items`, `dbo.users`, `dbo.products`, `dbo.product_variants`
- **Pug Template:** `src/views/pages/admin/dashboard.pug`
- **Components & Tương tác:**
  - 4 Thẻ KPI chính: Tổng doanh thu thực tế (chỉ tính đơn COMPLETED + PAID), Số đơn hàng mới cần duyệt, Tổng sản phẩm hoạt động, Tổng khách hàng thành viên.
  - Biểu đồ doanh thu 7 ngày gần nhất và phân bố đơn hàng theo trạng thái.
  - Bảng các đơn hàng mới nhất cần xử lý gấp.
  - Cảnh báo tồn kho sắp hết (Low Stock Alerts) với biến thể tồn kho <= 5.

---

## 6. MÀN HÌNH 06: DANH MỤC & BỘ LỌC SẢN PHẨM (CATALOG & SHOP)
- **Mã Screen ID:** `e7c4e7cc5f0446eba77b901bcbaeb5f8`
- **Route URL:** `/products`
- **Controller:** `src/controllers/product.controller.js` (`getProducts`, `searchProducts`)
- **Service:** `src/services/product.service.js`
- **Repository:** `src/repositories/product.repository.js`
- **Database Tables:** `dbo.products`, `dbo.categories`, `dbo.brands`, `dbo.product_variants`, `dbo.sizes`, `dbo.colors`, `dbo.product_images`
- **Pug Template:** `src/views/pages/products/index.pug`
- **Components & Tương tác:**
  - Breadcrumb phân cấp (Trang chủ > Tất cả sản phẩm > Danh mục).
  - Sidebar bộ lọc đa tiêu chí bên trái: Lọc theo Đối tượng (Nam, Nữ, Trẻ em, Unisex), Kích cỡ giày EU (38-44), Khoảng giá (Dưới 500k, 500k-1tr, Trên 1tr), Thương hiệu (Vamos Active, Biti's Hunter, Gosto...).
  - Giữ nguyên toàn bộ URL query parameters khi chuyển trang và sắp xếp (Giá tăng dần, giảm dần, mới nhất, bán chạy).
  - Lưới sản phẩm responsive (Grid 3-4 cột) với Product Card đầy đủ: Ảnh chính, ảnh hover, tag giảm giá, badge mới, dải size có sẵn, giá niêm yết/sale và nút Trái tim Yêu thích (Wishlist).

---

## 7. MÀN HÌNH 07: LỊCH SỬ ĐƠN HÀNG KHÁCH HÀNG
- **Mã Screen ID:** `8bc9424e7e4e4877b9758fec6dbba1f4`
- **Route URL:** `/account/orders`
- **Controller:** `src/controllers/account.controller.js` (`getOrders`, `getOrderDetail`, `cancelOrder`)
- **Service:** `src/services/order.service.js`
- **Repository:** `src/repositories/order.repository.js`
- **Database Tables:** `dbo.orders`, `dbo.order_items`, `dbo.order_status_history`
- **Pug Template:** `src/views/pages/account/orders.pug`
- **Components & Tương tác:**
  - Sidebar thông tin cá nhân khách hàng (Họ tên, email, avatar, menu tài khoản).
  - Danh sách đơn hàng phân chia theo các tab trạng thái: Tất cả, Chờ duyệt (PENDING), Đang giao (SHIPPING), Hoàn thành (COMPLETED), Đã hủy (CANCELLED).
  - Chi tiết từng đơn: Mã đơn, thời gian đặt, danh sách ảnh giày, tổng tiền COD.
  - Nút "Hủy đơn hàng" chỉ hiển thị khi đơn đang ở trạng thái PENDING.

---

## 8. MÀN HÌNH 08: CHI TIẾT SẢN PHẨM (PRODUCT DETAIL)
- **Mã Screen ID:** `b3e44855d8164c71a634823c05480f61`
- **Route URL:** `/products/:slug`
- **Controller:** `src/controllers/product.controller.js` (`getProductDetail`)
- **Service:** `src/services/product.service.js`
- **Repository:** `src/repositories/product.repository.js`
- **Database Tables:** `dbo.products`, `dbo.product_variants`, `dbo.sizes`, `dbo.colors`, `dbo.product_images`
- **Pug Template:** `src/views/pages/products/detail.pug`
- **Components & Tương tác:**
  - Gallery ảnh lớn bên trái kèm dải thumbnail cuộn ngang/dọc.
  - Khối thông tin: Thương hiệu, Tên giày, Mã SKU, Giá niêm yết & Giá khuyến mãi.
  - Bảng chọn Màu sắc (Color swatches) và Kích cỡ (Size pills). Tự động cập nhật số lượng tồn kho khả dụng khi người dùng chọn tổ hợp màu + size.
  - Nút "THÊM VÀO GIỎ HÀNG" (gọi API AJAX thêm giỏ, cập nhật badge giỏ) và nút "MUA NGAY" (chuyển hướng thẳng đến `/checkout`).
  - Nút Trái tim Wishlist hỗ trợ cả Khách vãng lai và Thành viên đăng nhập.
  - Khối cam kết: Đổi trả 7 ngày tận nơi, bảo hành chính hãng trọn đời keo chỉ, kiểm tra hàng COD trước khi nhận.

---

## 9. MÀN HÌNH 09: TRANG CHỦ BITI'S STORE (STOREFRONT HOME)
- **Mã Screen ID:** `45cc46eb9d664530a4e1a28cd39c28cc`
- **Route URL:** `/`
- **Controller:** `src/controllers/home.controller.js` (`getHomePage`)
- **Service:** `src/services/product.service.js`, `src/services/admin.service.js`
- **Repository:** `src/repositories/product.repository.js`, `src/repositories/admin.repository.js`
- **Database Tables:** `dbo.banners`, `dbo.products`, `dbo.categories`, `dbo.product_images`
- **Pug Template:** `src/views/pages/home.pug`
- **Components & Tương tác:**
  - Announcement bar trên cùng: "MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC ĐƠN HÀNG TỪ 500K".
  - TopNavBar: Logo VAMOS, Mega menu theo danh mục, Ô tìm kiếm debounce, Nút Wishlist, Nút Cart kèm badge số lượng và Nút Account.
  - Hero Slider: Ảnh banner chất lượng cao có hiệu ứng chuyển động và liên kết chiến dịch thực tế.
  - Khối "Sản Phẩm Mới Bứt Phá" và "Bộ Sưu Tập Bán Chạy Nhất" tải từ database thực.
  - Banner quảng bá Flash Sale và Bộ sưu tập cao cấp.
  - Footer chuẩn 4 cột: Về VAMOS, Chính sách & Hỗ trợ, Đăng ký bản tin nhận voucher 10%, Bản quyền & giấy phép.

---

## 10. MÀN HÌNH 10: ĐĂNG NHẬP TÀI KHOẢN (AUTH LOGIN)
- **Mã Screen ID:** `5f0cb934b4be4e8eb5a58927abc9f6f0`
- **Route URL:** `/auth/login`
- **Controller:** `src/controllers/auth.controller.js` (`getLogin`, `postLogin`)
- **Service:** `src/services/auth.service.js`
- **Repository:** `src/repositories/user.repository.js`, `src/repositories/cart.repository.js`
- **Database Tables:** `dbo.users`, `dbo.carts`, `dbo.cart_items`
- **Pug Template:** `src/views/pages/auth/login.pug`
- **Components & Tương tác:**
  - Form đăng nhập chuẩn UX: Email / Số điện thoại, Mật khẩu kèm nút Hiện/Ẩn mắt mật khẩu.
  - Checkbox "Ghi nhớ đăng nhập", liên kết "Quên mật khẩu?".
  - Tự động hợp nhất Giỏ hàng khách vãng lai (Session Cart) vào Giỏ hàng cơ sở dữ liệu (Customer Cart) khi đăng nhập thành công.
  - Chuyển hướng an toàn dựa trên `returnUrl` (ngăn chặn Open Redirect).

---

## 11. MÀN HÌNH 11: QUẢN LÝ SẢN PHẨM & MA TRẬN BIẾN THỂ
- **Mã Screen ID:** `4eb8e956eee940d990933f25e32abce8`
- **Route URL:** `/admin/products`
- **Controller:** `src/controllers/admin.controller.js` (`getProducts`, `getProductForm`, `saveProduct`, `deleteProduct`)
- **Service:** `src/services/product.service.js`
- **Repository:** `src/repositories/product.repository.js`
- **Database Tables:** `dbo.products`, `dbo.product_variants`, `dbo.sizes`, `dbo.colors`, `dbo.categories`, `dbo.brands`
- **Pug Template:** `src/views/pages/admin/products.pug` & `product-form.pug`
- **Components & Tương tác:**
  - Bảng danh sách sản phẩm với ảnh thumbnail, mã sản phẩm, danh mục, thương hiệu, giá gốc, giá sale, tổng tồn kho và trạng thái.
  - Modal/Form quản lý ma trận biến thể: Tạo các tổ hợp Size x Color, sinh SKU tự động, gán số lượng tồn kho từng biến thể.

---

## 12. MÀN HÌNH 12: QUẢN LÝ DANH MỤC & THƯƠNG HIỆU
- **Mã Screen ID:** `43935f717f874c82969ec83de4513e63`
- **Route URL:** `/admin/categories`
- **Controller:** `src/controllers/admin.controller.js` (`getCategories`, `saveCategory`, `deleteCategory`)
- **Service:** `src/services/admin.service.js`
- **Repository:** `src/repositories/admin.repository.js`
- **Database Tables:** `dbo.categories`, `dbo.brands`
- **Pug Template:** `src/views/pages/admin/categories.pug`
- **Components & Tương tác:**
  - Quản lý danh mục sản phẩm (Tên danh mục, slug URL, mô tả, trạng thái hoạt động).
  - Quản lý thương hiệu (Tên hãng, logo, xuất xứ, danh sách sản phẩm thuộc hãng).

---

## 13. MÀN HÌNH 13: QUẢN LÝ TỒN KHO & KIỂM TOÁN BIẾN ĐỘNG
- **Mã Screen ID:** `94f0c7c6964a42b4b4b6c17891b9e9bd`
- **Route URL:** `/admin/inventory`
- **Controller:** `src/controllers/admin.controller.js` (`getInventory`, `adjustStock`, `getInventoryHistory`)
- **Service:** `src/services/admin.service.js`, `src/services/order.service.js`
- **Repository:** `src/repositories/admin.repository.js`
- **Database Tables:** `dbo.product_variants`, `dbo.inventory_transactions`, `dbo.users`
- **Pug Template:** `src/views/pages/admin/inventory.pug`
- **Components & Tương tác:**
  - Bảng tồn kho thời gian thực của từng SKU (Sản phẩm - Màu - Size).
  - Nút điều chỉnh tồn kho (Nhập thêm, xuất hủy, kiểm kê thực tế) bắt buộc nhập lý do thay đổi.
  - Nhật ký kiểm toán `inventory_transactions` ghi nhận: Thời gian, người thực hiện, tồn cũ, tồn mới, số lượng biến động và lý do.

---

## 14. MÀN HÌNH 14: QUẢN LÝ VOUCHERS & KHUYẾN MÃI
- **Mã Screen ID:** `a9e215def6fa464e81df4bee6657f7b2`
- **Route URL:** `/admin/vouchers`
- **Controller:** `src/controllers/admin.controller.js` (`getVouchers`, `saveVoucher`, `deleteVoucher`)
- **Service:** `src/services/admin.service.js`
- **Repository:** `src/repositories/admin.repository.js`
- **Database Tables:** `dbo.vouchers`, `dbo.voucher_usages`
- **Pug Template:** `src/views/pages/admin/vouchers.pug`
- **Components & Tương tác:**
  - Bảng danh sách voucher: Mã code, loại giảm (% hoặc tiền mặt), giá trị giảm, đơn hàng tối thiểu, ngày bắt đầu/kết thúc, giới hạn lượt dùng và số lượt đã sử dụng.
  - Form thêm/sửa voucher có kiểm tra tính hợp lệ nghiệp vụ (Q8: Mỗi voucher chỉ dùng 1 lần / khách hàng).

---

## 15. MÀN HÌNH 15: QUẢN LÝ KHÁCH HÀNG & VÔ HIỆU HÓA PHIÊN
- **Mã Screen ID:** `590bf7d9e99b443481c04d9f5386057b`
- **Route URL:** `/admin/customers`
- **Controller:** `src/controllers/admin.controller.js` (`getCustomers`, `toggleCustomerStatus`, `getCustomerDetail`)
- **Service:** `src/services/admin.service.js`
- **Repository:** `src/repositories/admin.repository.js`, `src/repositories/user.repository.js`
- **Database Tables:** `dbo.users`, `dbo.orders`, `dbo.addresses`
- **Pug Template:** `src/views/pages/admin/customers.pug`
- **Components & Tương tác:**
  - Danh sách người dùng hệ thống (Họ tên, email, SĐT, số đơn hàng đã đặt, tổng chi tiêu).
  - Nút chuyển trạng thái tài khoản: `active` ↔ `locked`.
  - Khóa bảo vệ nghiêm ngặt: Tuyệt đối không cho phép khóa tài khoản có vai trò ADMIN.

---

## 16. MÀN HÌNH 16: ĐĂNG KÝ TÀI KHOẢN THÀNH VIÊN
- **Mã Screen ID:** `cdee8cfa0f144a3881596c887d1da2f6`
- **Route URL:** `/auth/register`
- **Controller:** `src/controllers/auth.controller.js` (`getRegister`, `postRegister`)
- **Service:** `src/services/auth.service.js`
- **Repository:** `src/repositories/user.repository.js`
- **Database Tables:** `dbo.users`
- **Pug Template:** `src/views/pages/auth/register.pug`
- **Components & Tương tác:**
  - Form đăng ký thành viên: Họ và tên, Email, Số điện thoại (10 số di động VN), Mật khẩu (tối thiểu 6 ký tự), Nhập lại mật khẩu.
  - Validate kép: Client-side phản hồi trực quan ngay tại trường nhập liệu + Server-side mã hóa bcrypt bảo mật và kiểm tra email trùng lặp.
  - Tự động đăng nhập và đồng bộ giỏ hàng ngay sau khi đăng ký thành công.
