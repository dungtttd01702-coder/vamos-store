# BÁO CÁO RÀ SOÁT, ĐỐI CHIẾU TÀI LIỆU VÀ KIỂM TRA TOÀN DIỆN VAMOS STORE
*(FINAL DOCUMENTATION AND ACTIVITY DIAGRAM REVIEW)*

- **Ngày thực hiện:** 21/11/2026
- **Trạng thái Git:** Branch `fix/master-repair-plan` | HEAD `eb822aba57d75a2ecad390123c188afb73db3cb8`
- **Mục tiêu:** Rà soát tính nhất quán giữa tài liệu báo cáo, sơ đồ kiến trúc, sơ đồ hoạt động (Activity Diagrams) và mã nguồn thực tế; khắc phục các mâu thuẫn về nghiệp vụ; xác minh 54 kịch bản responsive trên 18 routes thực tế với các phiên xác thực cô lập (Guest, Customer, Admin).

---

## 1. NHỮNG LỖI VÀ MÂU THUẪN ĐÃ PHÁT HIỆN

Trong quá trình đối chiếu chéo giữa Hồ sơ báo cáo phân tích thiết kế, tài liệu bảo trì, sơ đồ PlantUML và mã nguồn Express/MSSQL, hệ thống đã phát hiện và xử lý 3 vấn đề cốt lõi:

### 1.1. Mâu thuẫn chức năng Quản lý danh mục (Admin)
- **Mâu thuẫn:** 
  - Trong một số phần câu hỏi bảo vệ và tóm tắt nghiệp vụ, tài liệu ghi rằng Admin có thể "chỉnh sửa thông tin danh mục" hoặc "xóa danh mục".
  - Trong bảng kiểm toán mã nguồn (`FINAL_BRAND_AND_ASSET_AUDIT.md`), chức năng thực tế chỉ ghi: xem danh sách danh mục, tạo danh mục mới, bật/tắt hiển thị (`is_active`) và tạo thương hiệu.
- **Sự thật mã nguồn (`src/controllers/admin.controller.js`):**
  - Hệ thống chỉ cung cấp 4 phương thức: `getCategories`, `postCreateCategory`, `postToggleCategory`, và `postCreateBrand`.
  - **Hoàn toàn không có route, controller hay view** để chỉnh sửa (`edit`) hoặc xóa cứng (`delete`) danh mục sản phẩm.

### 1.2. Mức độ triển khai UC03 — Khôi phục mật khẩu (Forgot/Reset Password)
- **Mâu thuẫn:** Sơ đồ `AD03_QUEN_MAT_KHAU` trước đây được trình bày như một chức năng đã hoàn thiện trong mã nguồn, dễ gây hiểu lầm khi giảng viên vấn đáp kiểm tra code.
- **Sự thật mã nguồn:**
  - Database MSSQL có bảng `password_reset_tokens` (tạo từ migration `src/database/init_mssql.js`).
  - Tuy nhiên, trong `src/routes/auth.routes.js` và `src/controllers/auth.controller.js`, luồng gửi email qua giao thức SMTP và các endpoint xác thực mã token khôi phục chưa được triển khai hoàn chỉnh.
  - Đây thực chất là **bản thiết kế quy trình / kiến trúc mục tiêu**, chưa phải tính năng chạy thực tế trong mã nguồn.

### 1.3. Hành vi chuyển hướng (Redirect) của tuyến đường Checkout khi giỏ hàng rỗng
- **Vấn đề phát hiện khi kiểm thử tự động:** Khi người dùng truy cập trực tiếp URL `/checkout` với một tài khoản chưa có sản phẩm trong giỏ hàng, hệ thống trả về mã chuyển hướng HTTP 302 về trang `/cart`.
- **Sự thật mã nguồn (`src/controllers/checkout.controller.js` dòng 24-27):**
  - Đây là quy tắc nghiệp vụ chuẩn của hệ thống thương mại điện tử: Nếu giỏ hàng của người dùng không có sản phẩm (`items.length === 0`), hệ thống bắt buộc chuyển hướng người dùng về trang giỏ hàng `/cart` thay vì hiển thị form thanh toán trống rỗng.
  - Khi thực hiện kiểm thử tự động trang Checkout, cần đảm bảo tài khoản kiểm thử đã có sản phẩm trong giỏ hàng để kiểm tra chính xác giao diện form thanh toán 3 bước.

---

## 2. NHỮNG NỘI DUNG ĐÃ SỬA VÀ ĐỒNG BỘ CỤ THỂ

| TT | Tệp tin / Tài nguyên | Vị trí / Mục sửa | Nội dung thay đổi cụ thể |
|:---:|:---|:---|:---|
| 1 | `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/01_TAI_LIEU_BAO_CAO/BAO_CAO_PHAN_TICH_VA_THIET_KE_VAMOS_STORE.md` | Dòng 552 (Bảng Use Case) & Dòng 1459-1460 (Câu hỏi 3.8) | Sửa mô tả Quản lý danh mục: chỉ hỗ trợ xem danh sách, tạo mới danh mục, bật/tắt hiển thị (`is_active`) và tạo thương hiệu. Xóa bỏ nội dung khẳng định có chức năng sửa/xóa danh mục. Ghi nhận trung thực: *"Hệ thống hiện chưa cung cấp chức năng xóa cứng hoặc chỉnh sửa danh mục."* |
| 2 | `docs/maintenance/FINAL_BRAND_AND_ASSET_AUDIT.md` | Mục 4 (Bảng chức năng Admin) | Bỏ cột `Sửa`, chỉnh sửa ghi chú: chỉ hỗ trợ Xem danh sách, Thêm mới và Bật/tắt trạng thái hiển thị (`is_active`). |
| 3 | `docs/maintenance/FINAL_PROJECT_VERIFICATION.md` | Mục 3.2 (Ma trận kiểm thử Admin) | Cập nhật đúng các thao tác thực tế của route `/admin/categories`. |
| 4 | `docs/diagrams/activity/AD09_QUAN_LY_DANH_MUC_SAN_PHAM.puml` | Toàn bộ sơ đồ | Tinh giản về đúng 2 luồng chính thực tế: Tạo danh mục mới và Chuyển đổi trạng thái hiển thị (`is_active`). Loại bỏ các nhánh sửa/xóa không tồn tại trong source. |
| 5 | `docs/diagrams/activity/AD03_QUEN_MAT_KHAU.puml` | Tiêu đề & Ghi chú | Đổi tiêu đề sơ đồ thành: `Sơ đồ hoạt động — Khôi phục mật khẩu (Thiết kế quy trình — Chưa cài đặt trong mã nguồn)`. Thêm `note right` cảnh báo rõ mức độ hoàn thiện kiến trúc. |
| 6 | `docs/diagrams/activity/ACTIVITY_DIAGRAM_INDEX.md` | Toàn bộ tài liệu | Chuẩn hóa bảng đối chiếu 11 Activity Diagram chính thức, thiết lập mã thống nhất AD01-AD13, gán trạng thái rõ ràng cho từng sơ đồ. |
| 7 | Toàn bộ 11 ảnh Activity Diagram PNG trong cả 3 thư mục: `03_ACTIVITY_DIAGRAM/`, `docs/diagrams/activity/`, `report/analysis_design_images/` | 11 tệp PNG | Biên dịch lại đồng bộ bằng PlantUML jar chuẩn: cấu trúc 2 Swimlane Người dùng & Hệ thống, độ phân giải cao 300 DPI, hiển thị sắc nét khi in A4. |
| 8 | `src/public/images/products/` & `04_SAN_PHAM_YEU_THICH.png` | Thư viện ảnh sản phẩm & Trang Wishlist | Trích xuất 3 ảnh sneaker VAMOS studio chuẩn từ Stitch (`vamos-stride-x1.png`, `vamos-air-wave-v1.png`, `vamos-retro-classic-1988.png`). Render lại ảnh chụp màn hình `04_SAN_PHAM_YEU_THICH.png` ở độ phân giải 2560px, hiển thị đầy đủ 3 sản phẩm VAMOS chính hãng sắc nét. |
| 9 | Toàn bộ tài liệu xuất bản: `BAO_CAO_PHAN_TICH_VA_THIET_KE_VAMOS_STORE.html`, `.docx`, `.pdf` (Root & Hồ sơ báo cáo) | Toàn bộ tài liệu xuất | Chạy script đồng bộ hóa `scratch/rebuild_all_outputs.py` biên dịch lại toàn bộ HTML, DOCX (20.1 MB) và PDF (23.8 MB) khớp hoàn toàn với bản Markdown mới nhất. |

---

## 3. BẰNG CHỨNG MÃ NGUỒN THỰC TẾ (SOURCE CODE EVIDENCE)

### 3.1. Bằng chứng Quản lý danh mục chỉ có Xem, Tạo mới và Bật/Tắt hiển thị
Trích xuất từ [src/controllers/admin.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/admin.controller.js#L140-L195):
```javascript
  // GET /admin/categories
  async getCategories(req, res, next) {
    try {
      const categories = await query('SELECT * FROM categories ORDER BY display_order ASC, name ASC');
      const brands = await query('SELECT * FROM brands ORDER BY name ASC');
      res.render('pages/admin/categories', {
        title: 'Quản lý Danh mục & Thương hiệu',
        path: '/admin/categories',
        categories: categories.recordset,
        brands: brands.recordset
      });
    } catch (err) { next(err); }
  }

  // POST /admin/categories
  async postCreateCategory(req, res, next) {
    try {
      const { name, slug, description, display_order } = req.body;
      await query(`
        INSERT INTO categories (name, slug, description, display_order, is_active)
        VALUES (@name, @slug, @description, @displayOrder, 1)
      `, { name, slug: slug || slugify(name), description, displayOrder: display_order || 0 });
      req.flash('success_msg', 'Tạo danh mục mới thành công');
      res.redirect('/admin/categories');
    } catch (err) { next(err); }
  }

  // POST /admin/categories/:id/toggle
  async postToggleCategory(req, res, next) {
    try {
      const { id } = req.params;
      await query(`
        UPDATE categories 
        SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
            updated_at = GETDATE()
        WHERE id = @id
      `, { id });
      req.flash('success_msg', 'Đã cập nhật trạng thái hiển thị');
      res.redirect('/admin/categories');
    } catch (err) { next(err); }
  }
```
*Kết luận:* Bộ điều khiển hoàn toàn không có hàm `updateCategory` hay `deleteCategory`.

### 3.2. Bằng chứng UC03 — Bảng CSDL tồn tại nhưng thiếu luồng xử lý Backend
Trích xuất định nghĩa bảng từ [src/database/init_mssql.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/database/init_mssql.js):
```sql
CREATE TABLE password_reset_tokens (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    token NVARCHAR(255) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
Trong khi đó, tệp [src/routes/auth.routes.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/routes/auth.routes.js) và `src/controllers/auth.controller.js` chỉ có:
- `GET /auth/login`, `POST /auth/login`
- `GET /auth/register`, `POST /auth/register`
- `GET /auth/logout`
*Kết luận:* Việc định vị sơ đồ `AD03_QUEN_MAT_KHAU` là "Bản thiết kế quy trình / kiến trúc mục tiêu" là chính xác tuyệt đối.

### 3.3. Bằng chứng Luồng chuyển hướng Checkout khi giỏ hàng trống
Trích xuất từ [src/controllers/checkout.controller.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/controllers/checkout.controller.js#L20-L28):
```javascript
      const cartRes = await query(`
        SELECT ci.id AS cart_item_id, ci.quantity, ...
        FROM cart_items ci JOIN carts ct ON ci.cart_id = ct.id ...
        WHERE ct.user_id = @userId
      `, { userId: user.id });

      const items = cartRes.recordset;
      if (!items || items.length === 0) {
        return res.redirect('/cart');
      }
```
*Kết luận:* Hành vi redirect 302 sang `/cart` khi giỏ hàng rỗng là đúng thiết kế logic, không phải lỗi hệ thống.

---

## 4. BẢNG ĐỐI CHIẾU CHUẨN HÓA 11 SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM)

Toàn bộ 11 sơ đồ hoạt động đã được chuẩn hóa theo danh mục chính thức [ACTIVITY_DIAGRAM_INDEX.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/activity/ACTIVITY_DIAGRAM_INDEX.md), tuân thủ nghiêm ngặt định dạng 2 Swimlane (`Người dùng` và `Hệ thống`), mô tả 1 luồng nghiệp vụ chính trực quan:

| Mã | Tên sơ đồ hoạt động | File mã nguồn PlantUML (.puml) | File hình ảnh trong Hồ sơ báo cáo (.png) | Tác nhân chính | Trạng thái triển khai |
|:---:|:---|:---|:---|:---:|:---:|
| **AD01** | Đăng ký tài khoản | `AD02_DANG_KY_TAI_KHOAN.puml` | `AD01_DANG_KY_TAI_KHOAN.png` | Khách vãng lai | ✅ Đã cài đặt hoàn chỉnh |
| **AD02** | Đăng nhập hệ thống | `AD01_DANG_NHAP.puml` | `AD02_DANG_NHAP.png` | Người dùng / Admin | ✅ Đã cài đặt hoàn chỉnh |
| **AD03** | Khôi phục mật khẩu | `AD11_QUEN_MAT_KHAU.puml` | `AD03_QUEN_MAT_KHAU.png` | Người dùng | ⚠️ Thiết kế quy trình / Chưa hoàn thiện |
| **AD04** | Quản lý sổ địa chỉ | `AD10_QUAN_LY_SO_DIA_CHI.puml` | `AD04_QUAN_LY_SO_DIA_CHI.png` | Khách hàng | ✅ Đã cài đặt hoàn chỉnh |
| **AD05** | Tìm kiếm và lọc sản phẩm | `AD03_TIM_KIEM_LOC_SAN_PHAM.puml` | `AD05_TIM_KIEM_LOC_SAN_PHAM.png` | Khách vãng lai | ✅ Đã cài đặt hoàn chỉnh |
| **AD06** | Quản lý giỏ hàng | `AD04_QUAN_LY_GIO_HANG.puml` | `AD06_QUAN_LY_GIO_HANG.png` | Khách hàng / Khách | ✅ Đã cài đặt hoàn chỉnh |
| **AD08** | Đặt hàng COD | `AD05_DAT_HANG_COD.puml` | `AD08_DAT_HANG_COD.png` | Khách hàng | ✅ Đã cài đặt hoàn chỉnh |
| **AD10** | Hủy đơn hàng | `AD06_HUY_DON_HANG_KHACH_HANG.puml` | `AD10_HUY_DON_HANG_KHACH_HANG.png` | Khách hàng | ✅ Đã cài đặt hoàn chỉnh |
| **AD11** | Xử lý đơn hàng Admin | `AD07_XU_LY_DON_HANG_ADMIN.puml` | `AD11_XU_LY_DON_HANG_ADMIN.png` | Quản trị viên (Admin) | ✅ Đã cài đặt hoàn chỉnh |
| **AD12** | Quản lý tồn kho biến thể | `AD08_QUAN_LY_TON_KHO.puml` | `AD12_QUAN_LY_TON_KHO.png` | Quản trị viên (Admin) | ✅ Đã cài đặt hoàn chỉnh |
| **AD13** | Quản lý danh mục & trạng thái | `AD09_QUAN_LY_DANH_MUC_SAN_PHAM.puml` | `AD13_QUAN_LY_DANH_MUC_SAN_PHAM.png` | Quản trị viên (Admin) | ✅ Đã cài đặt hoàn chỉnh |

---

## 5. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG 54 KỊCH BẢN RESPONSIVE (18 ROUTES × 3 VIEWPORTS)

Hệ thống đã thực hiện kiểm thử tự động toàn diện qua Chromium Headless (Puppeteer) trên 3 phiên trình duyệt độc lập (Isolated Browser Contexts):
- **Desktop:** Viewport 1440 × 900 px
- **Tablet:** Viewport 768 × 1024 px
- **Mobile:** Viewport 390 × 844 px

Tài khoản kiểm thử:
- Guest: Không session.
- Customer: `khachhang@vamos.vn` (có sản phẩm kiểm thử trong giỏ hàng).
- Admin: `admin@vamos.vn` (phiên quản trị).

| STT | Vai trò | Tuyến đường (Route Path) | HTTP Status | Trang đích (Final URL) | Xác minh nội dung (3 Viewports) | Tràn ngang (Overflow) |
|:---:|:---|:---|:---:|:---|:---:|:---:|
| 1 | **Guest** | `/` (Trang chủ) | 200 | `http://localhost:3099/` | ✅ Đạt 100% (Khớp Hero/Products) | 0 (Không tràn) |
| 2 | **Guest** | `/products` (Danh mục sản phẩm) | 200 | `http://localhost:3099/products` | ✅ Đạt 100% (Khớp Bộ lọc & Lưới SP) | 0 (Không tràn) |
| 3 | **Guest** | `/auth/login` (Đăng nhập) | 200 | `http://localhost:3099/auth/login` | ✅ Đạt 100% (Khớp Form đăng nhập) | 0 (Không tràn) |
| 4 | **Guest** | `/auth/register` (Đăng ký) | 200 | `http://localhost:3099/auth/register` | ✅ Đạt 100% (Khớp Form tạo tài khoản) | 0 (Không tràn) |
| 5 | **Guest** | `/cart` (Giỏ hàng) | 200 | `http://localhost:3099/cart` | ✅ Đạt 100% (Khớp Giao diện giỏ hàng) | 0 (Không tràn) |
| 6 | **Customer** | `/account/orders` (Đơn hàng) | 200 | `http://localhost:3099/account/orders` | ✅ Đạt 100% (Khớp Lịch sử đơn hàng) | 0 (Không tràn) |
| 7 | **Customer** | `/account/wishlist` (Yêu thích) | 200 | `http://localhost:3099/account/wishlist` | ✅ Đạt 100% (Khớp Danh sách Wishlist) | 0 (Không tràn) |
| 8 | **Customer** | `/account/profile` (Hồ sơ) | 200 | `http://localhost:3099/account/profile` | ✅ Đạt 100% (Khớp Thông tin cá nhân) | 0 (Không tràn) |
| 9 | **Customer** | `/account/addresses` (Sổ địa chỉ) | 200 | `http://localhost:3099/account/addresses` | ✅ Đạt 100% (Khớp Danh sách địa chỉ nhận) | 0 (Không tràn) |
| 10 | **Customer** | `/checkout` (Thanh toán COD) | 200 | `http://localhost:3099/checkout` | ✅ Đạt 100% (Khớp Form ĐỒNG KIỂM COD) | 0 (Không tràn) |
| 11 | **Admin** | `/admin/dashboard` (Tổng quan) | 200 | `http://localhost:3099/admin/dashboard` | ✅ Đạt 100% (Khớp KPI/Thống kê doanh thu) | 0 (Không tràn) |
| 12 | **Admin** | `/admin/products` (QL Sản phẩm) | 200 | `http://localhost:3099/admin/products` | ✅ Đạt 100% (Khớp Bảng danh sách SP) | 0 (Không tràn) |
| 13 | **Admin** | `/admin/orders` (QL Đơn hàng) | 200 | `http://localhost:3099/admin/orders` | ✅ Đạt 100% (Khớp Quản lý đơn hàng) | 0 (Không tràn) |
| 14 | **Admin** | `/admin/inventory` (QL Tồn kho) | 200 | `http://localhost:3099/admin/inventory` | ✅ Đạt 100% (Khớp Kho hàng & Tồn kho SKU) | 0 (Không tràn) |
| 15 | **Admin** | `/admin/categories` (QL Danh mục) | 200 | `http://localhost:3099/admin/categories` | ✅ Đạt 100% (Khớp Danh mục & Thương hiệu) | 0 (Không tràn) |
| 16 | **Admin** | `/admin/vouchers` (QL Voucher) | 200 | `http://localhost:3099/admin/vouchers` | ✅ Đạt 100% (Khớp Quản lý mã giảm giá) | 0 (Không tràn) |
| 17 | **Admin** | `/admin/customers` (QL Khách hàng)| 200 | `http://localhost:3099/admin/customers` | ✅ Đạt 100% (Khớp Danh sách tài khoản KH) | 0 (Không tràn) |
| 18 | **Admin** | `/admin/banners` (QL Banner) | 200 | `http://localhost:3099/admin/banners` | ✅ Đạt 100% (Khớp Quản lý Banner/Slide) | 0 (Không tràn) |

### Tóm tắt định lượng kiểm thử:
- **Tổng số kịch bản:** 54 / 54 kịch bản (18 routes × 3 viewports).
- **Lỗi HTTP (>=400):** **0 (Không có lỗi 404, 500 hay Crash server)**.
- **Chuyển hướng ngoài ý muốn:** **0** (Các trang yêu cầu bảo mật đều duy trì đúng session, không bị redirect về Login).
- **Mức độ xác minh nội dung:** **100% (54/54)**.
- **Lỗi tràn ngang (Horizontal Scrollbar):** **0 (0px)** trên cả Tablet 768px và Mobile 390px.
- **Tệp bằng chứng:** Toàn bộ 54 ảnh chụp màn hình được lưu trữ tại `docs/maintenance/screenshots/`.

---

## 6. CÁC MỤC GHI CHÚ PHẠM VI VÀ BẢO LƯU

1. **Chức năng Quản lý Danh mục:** Không cung cấp thao tác cập nhật tên/mô tả hoặc xóa cứng (Hard Delete). Hệ thống bảo vệ toàn vẹn dữ liệu sản phẩm bằng cách chỉ cho phép chuyển đổi trạng thái hiển thị (`is_active = 0/1`).
2. **Quy trình Khôi phục Mật khẩu (UC03):** Giữ sơ đồ thiết kế trong hồ sơ kiến trúc để phục vụ lộ trình phát triển giai đoạn tiếp theo (Roadmap Phase 2), đã được gắn thẻ cảnh báo rõ ràng trong báo cáo.
3. **Quy tắc Giỏ hàng rỗng:** Khi giỏ hàng không có sản phẩm, tuyến `/checkout` chủ động điều hướng sang `/cart` là hành vi nghiệp vụ mong muốn (Expected Behavior).
