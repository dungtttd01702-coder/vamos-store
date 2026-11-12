# VAMOS STORE — BÁO CÁO PHÂN TÍCH KHÁC BIỆT GIAO DIỆN STITCH
**Dự án:** VAMOS STORE E-Commerce Platform  
**Tài liệu tham chiếu:** 16 Màn hình Google Stitch (Project ID: `5716866424895331560`)  
**Ngày thực hiện:** 12/11/2026  

---

## 1. TỔNG QUAN PHÂN TÍCH KHÁC BIỆT

Quá trình đối chiếu chi tiết giữa 16 tệp HTML nguyên mẫu từ Google Stitch và mã nguồn Pug hiện tại của VAMOS STORE ghi nhận các điểm tương đồng và những điểm cần chuẩn hóa như sau:

### 1.1. Những điểm đã tương đồng tốt
- Cấu trúc kiến trúc phân tầng: Layout Admin cố định bên trái (Sidebar Dark Carbon `#111111`) và Header trên cùng Sticky là nhất quán.
- Bảng màu nhận diện: Tỷ lệ 60-30-10 với nền sáng `surface` (`#F8FAFC`), màu cấu trúc Dark Carbon (`#111111`) và màu điểm nhấn Kinetic Red (`#E11B22` / `primary-container`) hoàn toàn tương thích.
- Cặp phông chữ: Cả hai hệ thống đều sử dụng `Space Grotesk` cho tiêu đề và `Be Vietnam Pro` cho nội dung văn bản.
- Logic nghiệp vụ COD: Luồng thanh toán COD an toàn, bảng tính phí ship 30k và miễn phí từ 500k đã được tích hợp đúng quy định.

### 1.2. Những điểm khác biệt cần chuẩn hóa theo Stitch
1. **Hệ thống Design Token Class Names trong Tailwind:**
   - *Hiện trạng:* File Pug hiện có sử dụng kết hợp giữa class tùy biến `vamos-primary`, `vamos-dark` và Tailwind mặc định (`red-600`, `gray-900`).
   - *Yêu cầu từ Stitch:* Chuẩn hóa sang đúng các token Stitch: `primary-container` (`#E11B22`), `on-surface` (`#0B1C30`), `surface-container-lowest` (`#FFFFFF`), `surface-container-high`, `label-badge`, `font-headline-sm` để cấu trúc DOM bám sát 100% thiết kế.
2. **Top Announcement Bar & Header Storefront:**
   - *Hiện trạng:* Header có thanh thông báo cơ bản.
   - *Yêu cầu từ Stitch:* Thêm dòng thông báo đồng kiểm COD và hotline 1900 2126, Mega menu theo danh mục (Nam, Nữ, Trẻ Em, Hunter Collection, Gosto, Sale có chấm đỏ nhấp nháy), slide-over mini cart drawer tương tác trực quan.
3. **Thanh tiến độ Freeship 100% trong Giỏ hàng (`/cart`):**
   - *Hiện trạng:* Hiển thị text phí ship.
   - *Yêu cầu từ Stitch:* Thêm thanh tiến độ sinh động (Progress Bar màu xanh lục `bg-emerald-500`) báo đạt 100% khi tổng tiền >= 500.000₫.
4. **State Machine 6 Bước trực quan trong Quản trị Đơn hàng (`/admin/orders`):**
   - *Hiện trạng:* Bảng quản lý đơn hàng hiển thị trạng thái bằng badge.
   - *Yêu cầu từ Stitch:* Tích hợp dải 6 Tabs bộ lọc trạng thái (Chờ duyệt 24, Đã xác nhận 18, Đóng gói 12, Vận chuyển 35, Giao xong 62, Đã hủy 5) cùng thanh Visual Timeline Tracker 6 nốt tròn kết nối.
5. **Form cấu hình kép Banner Desktop (1920x620) & Mobile (750x750) (`/admin/banners`):**
   - *Hiện trạng:* Form banner đơn giản với 1 trường ảnh.
   - *Yêu cầu từ Stitch:* Khu vực Dual Upload Dropzone chuyên biệt cho cả 2 tỷ lệ (Desktop widescreen và Mobile vuông 1:1), cùng bảng thống kê CTR và chuyển đổi đơn hàng 30 ngày.

---

## 2. KẾ HOẠCH NÂNG CẤP ĐỒNG BỘ CHI TIẾT THEO TỪNG TRANG

| STT | Trang / Màn hình | Các thành phần Stitch cần bổ sung / chuẩn hóa |
|:---:|:---|:---|
| 01 | **Admin Banners** (`/admin/banners`) | Bổ sung 4 thẻ KPI Banner, khu vực Reorder Hero Sliders, Form Dual Dropzone (Desktop 1920x620 + Mobile 750x750), Bảng thống kê CTR 30 ngày. |
| 02 | **Admin Orders** (`/admin/orders`) | Bổ sung 6 Tabs trạng thái State Machine, Visual Timeline Tracker ngang, Cụm nút chuyển trạng thái lớn (Xác nhận, Hủy & Hoàn kho), Bảng Snapshot chi tiết đơn hàng Q10 locked. |
| 03 | **Shopping Cart** (`/cart`) | Bổ sung Banner cảnh báo Khách vãng lai, Thanh tiến độ Freeship 100% emerald, Tooltip giới hạn tối đa 10 đôi (Q7), Khung nhập voucher VAMOS100, Nút CTA thanh toán shadow nổi bật. |
| 04 | **Checkout COD** (`/checkout`) | Bổ sung Breadcrumb 3 bước thanh toán, Badge "Nhận hàng hài lòng mới trả tiền", Khóa chống double-submit, Hộp cam kết 3 tiêu chuẩn bảo hành. |
| 05 | **Admin Dashboard** (`/admin`) | Bổ sung 4 thẻ KPI doanh thu thật, Biểu đồ thống kê 7 ngày, Danh sách đơn cần duyệt gấp, Danh mục sản phẩm sắp hết hàng. |
| 06 | **Catalog & Shop** (`/products`) | Chuẩn hóa Sidebar lọc (Đối tượng, Size EU 38-44, Khoảng giá, Thương hiệu), Nút Clear All, Lưới Product Card bám sát tỷ lệ Stitch, Nút Wishlist tương tác. |
| 07 | **Customer Orders** (`/account/orders`) | Bổ sung Tabs lọc trạng thái đơn mua của khách hàng, Thẻ hiển thị mã vận đơn và trạng thái giao hàng, Nút hủy đơn khi còn PENDING. |
| 08 | **Product Detail** (`/products/:slug`) | Gallery ảnh lớn kèm thumbnail, Bảng chọn màu sắc swatches, Size pills phản hồi tồn kho, Nút Mua Ngay và Thêm Giỏ hàng, 3 cam kết đổi trả/bảo hành. |
| 09 | **Storefront Home** (`/`) | Bổ sung Announcement bar, Mega menu, Hero slider kinetic zoom, Grid sản phẩm mới bứt phá, Banner Flash sale 50%, Footer 4 cột chuẩn Stitch. |
| 10 | **Login** (`/auth/login`) | Form đăng nhập 2 cột hoặc container bo tròn chuẩn Stitch, nút chuyển đổi hiển thị mật khẩu, thông báo lỗi inline tiếng Việt. |
| 11 | **Admin Products** (`/admin/products`) | Bảng sản phẩm chuẩn hóa với thumbnail, badge danh mục, ma trận biến thể trực quan, form thêm/sửa sản phẩm. |
| 12 | **Admin Categories** (`/admin/categories`) | Quản lý danh mục và thương hiệu theo phong cách tối giản thanh lịch, hiển thị số sản phẩm trong danh mục. |
| 13 | **Admin Inventory** (`/admin/inventory`) | Bảng tồn kho SKU chi tiết, nút điều chỉnh tồn kho kèm modal nhập lý do kiểm toán, bảng nhật ký biến động gần nhất. |
| 14 | **Admin Vouchers** (`/admin/vouchers`) | Bảng quản lý khuyến mãi, form cấu hình voucher hỗ trợ quy tắc 1 lần / khách hàng (Q8). |
| 15 | **Admin Customers** (`/admin/customers`) | Danh sách khách hàng kèm số đơn và chi tiêu, nút khóa/mở tài khoản có bảo vệ ngăn chặn khóa Admin. |
| 16 | **Register** (`/auth/register`) | Form đăng ký thành viên với validate thời gian thực, điều khoản sử dụng, tích hợp tự động đăng nhập. |

---

## 3. NGUYÊN TẮC THI CÔNG
1. **Tách biệt Styling và Logic:** Toàn bộ thuộc tính giao diện (HTML/CSS) lấy từ Stitch; toàn bộ biến hiển thị (`#{product.name}`, `#{order.total_amount}`) và đường dẫn form action lấy từ Backend Express hiện có.
2. **Không làm hỏng Route và Form submission:** Giữ nguyên các trường input `name="email"`, `name="password"`, `name="quantity"`, `name="size_id"`, `name="color_id"`.
3. **Responsive toàn diện:** Đảm bảo hiển thị hoàn hảo từ Mobile (390px), Tablet (768px) đến Desktop lớn (1920px).

