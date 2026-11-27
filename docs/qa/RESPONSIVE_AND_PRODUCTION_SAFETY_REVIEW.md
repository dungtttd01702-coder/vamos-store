# BÁO CÁO KIỂM THỬ GIAO DIỆN ĐA THIẾT BỊ VÀ AN TOÀN VẬN HÀNH PRODUCTION

**VAMOS STORE — PART C: RESPONSIVE QA & PRODUCTION SAFETY REVIEW**
_Hệ thống kiểm toán và đánh giá độc lập_

---

## 1. MÔI TRƯỜNG KIỂM THỬ

- **Hệ điều hành:** Windows 10/11 Pro (x64)
- **Node.js:** v24.21.0
- **Cơ sở dữ liệu:** Microsoft SQL Server 2022 Express (`vamos_store_db`) trên `127.0.0.1:1433`
- **Công cụ kiểm thử E2E:** Playwright Chromium 1.57.0 (Headless)
- **Máy chủ ứng dụng:** Live Daemon Process tại `http://localhost:3000` (`NODE_ENV=development`)
- **Tài khoản kiểm thử:**
  - _Quản trị viên (Admin):_ `admin@vamos.vn` (Role `ADMIN`)
  - _Khách hàng (Customer):_ `trungdung@gmail.com` (Role `CUSTOMER`)
  - _Khách vãng lai (Guest):_ Phiên trình duyệt ẩn danh không xác thực
- **Thư mục lưu trữ bằng chứng:** `docs/qa/screenshots/` (36 file ảnh PNG + file dữ liệu `responsive_results.json`)

---

## 2. KẾT QUẢ KIỂM THỬ DESKTOP (1440 × 900 PX)

Thực hiện kiểm tra toàn diện 12 trang chức năng trên giao diện Desktop tiêu chuẩn:

| STT | Trang kiểm tra                           | Vai trò  | Trạng thái hiển thị                                      | Hiện tượng tràn ngang | File ảnh chụp bằng chứng         |   Đánh giá   |
| :-: | ---------------------------------------- | :------: | -------------------------------------------------------- | :-------------------: | -------------------------------- | :----------: |
|  1  | **Trang chủ (`/`)**                      |  Guest   | Bố cục chuẩn, Hero Banner, Thẻ sản phẩm cân đối          |    Không (1440px)     | `desktop-01-home.png`            | **VERIFIED** |
|  2  | **Catalog (`/products`)**                |  Guest   | Bộ lọc danh mục, lọc giá, phân trang PJAX hiển thị chuẩn |    Không (1440px)     | `desktop-02-catalog.png`         | **VERIFIED** |
|  3  | **Chi tiết SP (`/products/:slug`)**      |  Guest   | Thư viện ảnh, bảng size, nút Mua ngay & Thêm giỏ rõ ràng |    Không (1440px)     | `desktop-03-detail.png`          | **VERIFIED** |
|  4  | **Đăng nhập (`/auth/login`)**            |  Guest   | Form đăng nhập căn giữa, các trường input rõ ràng        |    Không (1440px)     | `desktop-04-login.png`           | **VERIFIED** |
|  5  | **Đăng ký (`/auth/register`)**           |  Guest   | Form đăng ký đầy đủ các trường họ tên, email, sđt        |    Không (1440px)     | `desktop-05-register.png`        | **VERIFIED** |
|  6  | **Giỏ hàng (`/cart`)**                   |  Guest   | Bảng tóm tắt đơn hàng, voucher, nút chuyển sang checkout |    Không (1440px)     | `desktop-06-cart.png`            | **VERIFIED** |
|  7  | **Wishlist Modal**                       |  Guest   | Modal trượt mượt mà, banner khuyến khích đăng nhập       |    Không (1440px)     | `desktop-07-wishlist-modal.png`  | **VERIFIED** |
|  8  | **Checkout COD (`/checkout`)**           | Customer | Form thông tin giao hàng, voucher, nút xác nhận COD      |    Không (1440px)     | `desktop-09-checkout.png`        | **VERIFIED** |
|  9  | **Lịch sử đơn hàng (`/account/orders`)** | Customer | Bảng danh sách đơn hàng đã đặt, trạng thái COD           |    Không (1440px)     | `desktop-10-account-orders.png`  | **VERIFIED** |
| 10  | **Admin Dashboard (`/admin/dashboard`)** |  Admin   | 4 thẻ thống kê số liệu CSDL thật, biểu đồ trực quan      |    Không (1440px)     | `desktop-11-admin-dashboard.png` | **VERIFIED** |
| 11  | **Admin Sản phẩm (`/admin/products`)**   |  Admin   | Bảng dữ liệu sản phẩm, cột ảnh, giá, nút sửa/xóa         |    Không (1440px)     | `desktop-12-admin-products.png`  | **VERIFIED** |
| 12  | **Admin Đơn hàng (`/admin/orders`)**     |  Admin   | Bảng đơn hàng, lọc trạng thái, chi tiết khách hàng       |    Không (1440px)     | `desktop-13-admin-orders.png`    | **VERIFIED** |

👉 **Kết luận Desktop:** **12/12 trang đạt tiêu chuẩn hoàn hảo (0 lỗi tràn ngang, 100% VERIFIED).**

---

## 3. KẾT QUẢ KIỂM THỬ TABLET (768 × 1024 PX)

Thực hiện kiểm tra 12 trang chức năng ở chế độ Tablet dọc (Portrait iPad 768px):

| STT | Trang kiểm tra                           | Vai trò  |         Hiện tượng tràn ngang         | File ảnh chụp bằng chứng        |        Đánh giá        |
| :-: | ---------------------------------------- | :------: | :-----------------------------------: | ------------------------------- | :--------------------: |
|  1  | **Trang chủ (`/`)**                      |  Guest   | ⚠️ Có (`scrollWidth = 864px > 768px`) | `tablet-01-home.png`            | **PARTIALLY VERIFIED** |
|  2  | **Catalog (`/products`)**                |  Guest   | ⚠️ Có (`scrollWidth = 864px > 768px`) | `tablet-02-catalog.png`         | **PARTIALLY VERIFIED** |
|  3  | **Chi tiết SP (`/products/:slug`)**      |  Guest   | ⚠️ Có (`scrollWidth = 864px > 768px`) | `tablet-03-detail.png`          | **PARTIALLY VERIFIED** |
|  4  | **Đăng nhập (`/auth/login`)**            |  Guest   | ⚠️ Có (`scrollWidth = 864px > 768px`) | `tablet-04-login.png`           | **PARTIALLY VERIFIED** |
|  5  | **Đăng ký (`/auth/register`)**           |  Guest   | ⚠️ Có (`scrollWidth = 864px > 768px`) | `tablet-05-register.png`        | **PARTIALLY VERIFIED** |
|  6  | **Giỏ hàng (`/cart`)**                   |  Guest   | ⚠️ Có (`scrollWidth = 864px > 768px`) | `tablet-06-cart.png`            | **PARTIALLY VERIFIED** |
|  7  | **Wishlist Modal**                       |  Guest   |     Không (Modal responsive 100%)     | `tablet-07-wishlist-modal.png`  |      **VERIFIED**      |
|  8  | **Checkout COD (`/checkout`)**           | Customer | ⚠️ Có (`scrollWidth = 803px > 768px`) | `tablet-09-checkout.png`        | **PARTIALLY VERIFIED** |
|  9  | **Lịch sử đơn hàng (`/account/orders`)** | Customer | ⚠️ Có (`scrollWidth = 803px > 768px`) | `tablet-10-account-orders.png`  | **PARTIALLY VERIFIED** |
| 10  | **Admin Dashboard (`/admin/dashboard`)** |  Admin   |        **Không (768px chuẩn)**        | `tablet-11-admin-dashboard.png` |      **VERIFIED**      |
| 11  | **Admin Sản phẩm (`/admin/products`)**   |  Admin   |    **Không (Bảng tự cuộn ngang)**     | `tablet-12-admin-products.png`  |      **VERIFIED**      |
| 12  | **Admin Đơn hàng (`/admin/orders`)**     |  Admin   |    **Không (Bảng tự cuộn ngang)**     | `tablet-13-admin-orders.png`    |      **VERIFIED**      |

### Phân tích nguyên nhân lỗi tràn ngang Tablet (864px vs 768px):

- **Vị trí lỗi:** Header Storefront (`src/views/partials/header.pug`, dòng 53–120).
- **Cơ chế phát sinh:** Breakpoint `md:` trong Tailwind kích hoạt từ `768px`. Tại chính xác 768px, danh mục desktop (`md:flex`, ~430px) xuất hiện song song với Logo (~140px) và các nút thao tác bên phải (Theme, Wishlist, Cart, Đăng nhập, Đăng ký ~281px).
- **Tổng chiều rộng tự nhiên:** `140 + 430 + 281 + gaps/padding = 864px > 768px`.
- **Hậu quả:** Xuất hiện thanh cuộn ngang nhẹ 96px trên toàn bộ các trang Storefront ở độ phân giải đúng 768px.
- **Điểm tích cực:** Giao diện Quản trị viên (Admin Portal) được cô lập riêng nên **hoàn toàn không bị tràn ngang** (chuẩn 768px).

---

## 4. KẾT QUẢ KIỂM THỬ MOBILE (390 × 844 PX)

Thực hiện kiểm tra 13 trang và tính năng trên kích thước iPhone di động:

| STT | Trang kiểm tra                           | Vai trò  | Hiện tượng tràn ngang / Đè nút                     | File ảnh chụp bằng chứng        |        Đánh giá        |
| :-: | ---------------------------------------- | :------: | -------------------------------------------------- | ------------------------------- | :--------------------: |
|  1  | **Trang chủ (`/`)**                      |  Guest   | Header rộng 505px > 390px                          | `mobile-01-home.png`            | **PARTIALLY VERIFIED** |
|  2  | **Menu Mobile Hamburger**                |  Guest   | Menu trượt mở thành công (`isMenuVisible: true`)   | `mobile-08-mobile-menu.png`     |      **VERIFIED**      |
|  3  | **Catalog (`/products`)**                |  Guest   | Lưới 2 cột hiển thị tốt, header rộng 505px         | `mobile-02-catalog.png`         | **PARTIALLY VERIFIED** |
|  4  | **Chi tiết SP (`/products/:slug`)**      |  Guest   | Nút mua và chọn size responsive, header rộng 505px | `mobile-03-detail.png`          | **PARTIALLY VERIFIED** |
|  5  | **Đăng nhập (`/auth/login`)**            |  Guest   | Form đăng nhập co giãn chuẩn, header rộng 505px    | `mobile-04-login.png`           | **PARTIALLY VERIFIED** |
|  6  | **Đăng ký (`/auth/register`)**           |  Guest   | Form đăng ký thao tác tốt, header rộng 505px       | `mobile-05-register.png`        | **PARTIALLY VERIFIED** |
|  7  | **Giỏ hàng (`/cart`)**                   |  Guest   | Bố cục giỏ hàng co giãn 1 cột chuẩn                | `mobile-06-cart.png`            | **PARTIALLY VERIFIED** |
|  8  | **Wishlist Modal**                       |  Guest   | Modal chiếm trọn màn hình, cuộn mượt               | `mobile-07-wishlist-modal.png`  |      **VERIFIED**      |
|  9  | **Checkout COD (`/checkout`)**           | Customer | Form địa chỉ và tóm tắt tiền co gọn 1 cột          | `mobile-09-checkout.png`        | **PARTIALLY VERIFIED** |
| 10  | **Lịch sử đơn hàng (`/account/orders`)** | Customer | Thẻ đơn hàng co giãn tốt, header rộng 444px        | `mobile-10-account-orders.png`  | **PARTIALLY VERIFIED** |
| 11  | **Admin Dashboard (`/admin/dashboard`)** |  Admin   | **Khớp chuẩn 390px, 0 tràn ngang!**                | `mobile-11-admin-dashboard.png` |      **VERIFIED**      |
| 12  | **Admin Sản phẩm (`/admin/products`)**   |  Admin   | **Khớp chuẩn 390px, bảng tự scroll ngang!**        | `mobile-12-admin-products.png`  |      **VERIFIED**      |
| 13  | **Admin Đơn hàng (`/admin/orders`)**     |  Admin   | **Khớp chuẩn 390px, bảng tự scroll ngang!**        | `mobile-13-admin-orders.png`    |      **VERIFIED**      |

### Phân tích hiện tượng giao diện Mobile:

1. **Menu di động (Hamburger Drawer):** Đã kiểm chứng Playwright click mở thành công, hiển thị đầy đủ ô tìm kiếm di động và các danh mục sản phẩm (`mobile-08-mobile-menu.png`).
2. **Khu vực thân trang (Body content):** Các component thẻ sản phẩm, form đăng nhập, form thanh toán, giỏ hàng đều tự co giãn 1 cột trên màn hình 390px rất tốt.
3. **Admin Portal trên Mobile:** Hoạt động xuất sắc, toàn bộ thẻ thống kê xếp dọc mượt mà, thanh điều hướng phụ (`no-scrollbar overflow-x-auto`) cuộn ngang êm ái, đạt chuẩn 390px tuyệt đối không bị tràn.
4. **Vấn đề Header Storefront:**
   - Trong `src/views/partials/header.pug`, các nút hành động phía bên phải (Nút Theme, Nút Wishlist, Nút Giỏ hàng, Khối `Đăng nhập / Đăng ký`, Nút Hamburger) được gom trong một hàng ngang với `gap-3` và kích thước cố định.
   - Khi ở trạng thái Guest: Tổng chiều rộng cần thiết là **505px**, vượt quá chiều rộng màn hình **390px**.
   - Khi ở trạng thái Customer: Tổng chiều rộng là **444px**, vượt quá **390px**.
   - Điều này làm thanh header bị giãn ra ngoài khung nhìn và khiến nút hamburger bị đẩy sát hoặc tràn mép phải.

---

## 5. DANH SÁCH BẰNG CHỨNG HÌNH ẢNH (SCREENSHOT EVIDENCE)

Tất cả 36 file ảnh chụp thực tế từ trình duyệt Chromium headless đã được lưu tại thư mục [docs/qa/screenshots/](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots):

### 5.1. Desktop (1440 × 900)

- [desktop-01-home.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/desktop-01-home.png) (346 KB)
- [desktop-02-catalog.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/desktop-02-catalog.png) (216 KB)
- [desktop-03-detail.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/desktop-03-detail.png) (210 KB)
- [desktop-04-login.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/desktop-04-login.png) (92 KB)
- [desktop-05-register.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/desktop-05-register.png) (78 KB)
- [desktop-06-cart.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/desktop-06-cart.png) (128 KB)
- [desktop-07-wishlist-modal.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/desktop-07-wishlist-modal.png) (249 KB)
- [desktop-09-checkout.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/desktop-09-checkout.png) (126 KB)
- [desktop-10-account-orders.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/desktop-10-account-orders.png) (136 KB)
- [desktop-11-admin-dashboard.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/desktop-11-admin-dashboard.png) (138 KB)
- [desktop-12-admin-products.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/desktop-12-admin-products.png) (177 KB)
- [desktop-13-admin-orders.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/desktop-13-admin-orders.png) (149 KB)

### 5.2. Tablet (768 × 1024)

- [tablet-01-home.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/tablet-01-home.png) (267 KB)
- [tablet-02-catalog.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/tablet-02-catalog.png) (74 KB)
- [tablet-03-detail.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/tablet-03-detail.png) (233 KB)
- [tablet-04-login.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/tablet-04-login.png) (76 KB)
- [tablet-05-register.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/tablet-05-register.png) (69 KB)
- [tablet-06-cart.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/tablet-06-cart.png) (108 KB)
- [tablet-07-wishlist-modal.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/tablet-07-wishlist-modal.png) (206 KB)
- [tablet-09-checkout.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/tablet-09-checkout.png) (108 KB)
- [tablet-10-account-orders.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/tablet-10-account-orders.png) (79 KB)
- [tablet-11-admin-dashboard.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/tablet-11-admin-dashboard.png) (118 KB)
- [tablet-12-admin-products.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/tablet-12-admin-products.png) (119 KB)
- [tablet-13-admin-orders.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/tablet-13-admin-orders.png) (113 KB)

### 5.3. Mobile (390 × 844)

- [mobile-01-home.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/mobile-01-home.png) (121 KB)
- [mobile-02-catalog.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/mobile-02-catalog.png) (52 KB)
- [mobile-03-detail.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/mobile-03-detail.png) (92 KB)
- [mobile-04-login.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/mobile-04-login.png) (49 KB)
- [mobile-05-register.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/mobile-05-register.png) (50 KB)
- [mobile-06-cart.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/mobile-06-cart.png) (55 KB)
- [mobile-07-wishlist-modal.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/mobile-07-wishlist-modal.png) (100 KB)
- [mobile-08-mobile-menu.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/mobile-08-mobile-menu.png) (61 KB)
- [mobile-09-checkout.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/mobile-09-checkout.png) (54 KB)
- [mobile-10-account-orders.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/mobile-10-account-orders.png) (47 KB)
- [mobile-11-admin-dashboard.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/mobile-11-admin-dashboard.png) (69 KB)
- [mobile-12-admin-products.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/mobile-12-admin-products.png) (60 KB)
- [mobile-13-admin-orders.png](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/docs/qa/screenshots/mobile-13-admin-orders.png) (65 KB)

---

## 6. KẾT QUẢ KIỂM TRA `database/init_mssql.js`

Rà soát toàn diện mã nguồn script khởi tạo CSDL:

| Câu hỏi đánh giá                                         |          Trả lời          | Chi tiết phân tích kỹ thuật                                                                                                                                                                     |
| -------------------------------------------------------- | :-----------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Có tự động tạo database không?**                    |          **CÓ**           | Dòng 86–93: Kiểm tra `SELECT database_id FROM sys.databases WHERE name = @dbName`. Nếu chưa có, kết nối tới `master` và thực thi `CREATE DATABASE [${safeDbName}]`.                             |
| **2. Có tự động tạo bảng không?**                        |          **CÓ**           | Dòng 107–153: Tạo bảng `schema_migrations`, quét thư mục `database/migrations/` và thực thi lần lượt các file `.sql` chưa được áp dụng.                                                         |
| **3. Có seed tài khoản Admin không?**                    |          **CÓ**           | Dòng 59–63: Kiểm tra `IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@vamos.vn')`, chèn tài khoản Admin với mật khẩu băm từ `process.env.ADMIN_DEFAULT_PASSWORD \|\| '123456'`.         |
| **4. Có seed dữ liệu mẫu không?**                        |          **CÓ**           | Dòng 17–56: Seed Sizes (38–44), Colors (5 màu), Categories (4 danh mục), Brands (3 thương hiệu), Banners (1 banner). Tất cả đều có `IF NOT EXISTS`.                                             |
| **5. Có nguy cơ ghi đè hoặc làm mất dữ liệu không?**     | **KHÔNG LÀM MẤT DỮ LIỆU** | Script hoàn toàn phi hủy hoại (Non-destructive), không chứa `DROP TABLE`, `TRUNCATE` hay `DELETE`. Khi bảng hoặc dữ liệu đã tồn tại, nó tự động bỏ qua.                                         |
| **6. Có được gọi tự động khi ứng dụng khởi động không?** |         **KHÔNG**         | `server.js` và `src/app.js` **hoàn toàn không gọi file này**. Script chỉ chạy khi lập trình viên gõ lệnh thủ công `node database/init_mssql.js` hoặc trong test setup `tests/setup_test_db.js`. |

### Đánh giá an toàn môi trường Production & Phương án khắc phục:

- **Rủi ro hiện tại:** Script chưa có guard kiểm tra biến môi trường `NODE_ENV`. Nếu một kỹ sư vô tình chạy `node database/init_mssql.js` trên máy chủ Production khi chưa cấu hình `ADMIN_DEFAULT_PASSWORD`, tài khoản admin mặc định sẽ được tạo với mật khẩu yếu `123456`.
- **Phương án khắc phục đề xuất (chờ phê duyệt, chưa sửa vào code):**
  Thêm đoạn kiểm tra an toàn nghiêm ngặt ở đầu hàm `init()`:
  ```javascript
  // Đề xuất bảo vệ Production tại dòng 72 của database/init_mssql.js:
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.ALLOW_PRODUCTION_INIT
  ) {
    throw new Error(
      "BLOCKED: Cannot run database bootstrap in PRODUCTION environment without ALLOW_PRODUCTION_INIT=true",
    );
  }
  ```

---

## 7. KẾT QUẢ CHẠY LẠI TOÀN BỘ CÁC BỘ KIỂM THỬ (REGRESSION RESULTS)

Tất cả 10 bộ kiểm thử đã được chạy lại thực tế với log ghi nhận độc lập:

|   STT    | Tên Suite Kiểm Thử               | File thực thi                          | Số Test |  PASS   | FAIL  | SKIP / CANCELED | Môi trường kiểm thử                |
| :------: | -------------------------------- | -------------------------------------- | :-----: | :-----: | :---: | :-------------: | ---------------------------------- |
|    1     | **Phase 1: Role Separation**     | `tests/test_phase1_role_separation.js` |   11    |   11    |   0   |        0        | Node.js + Supertest + Local MSSQL  |
|    2     | **Phase 2: Wishlist Engine**     | `tests/test_phase2_wishlist.js`        |    7    |    7    |   0   |        0        | JSDOM Unit Test                    |
|    3     | **Phase 3: Theme Engine**        | `tests/test_phase3_theme.js`           |    8    |    8    |   0   |        0        | JSDOM + Tailwind CSS Check         |
|    4     | **Phase 4: i18n Engine**         | `tests/test_phase4_i18n.js`            |    8    |    8    |   0   |        0        | Node.js + Supertest SSR            |
|    5     | **Phase 5: Functional Audit**    | `tests/test_phase5_functional.js`      |    7    |    7    |   0   |        0        | Node.js + Supertest + Local MSSQL  |
|    6     | **Phase 6: Data Integrity**      | `tests/test_phase6_data_integrity.js`  |    3    |    3    |   0   |        0        | Node.js + MSSQL Direct Pool        |
|    7     | **Phase 7: Browser Matrix E2E**  | `tests/test_phase7_browser_matrix.js`  |   11    |   11    |   0   |        0        | Playwright Chromium (1440x900)     |
|    8     | **Server-side Wishlist Suite**   | `tests/test_wishlist_server.js`        |   14    |   14    |   0   |        0        | Node.js + Supertest + Local MSSQL  |
|    9     | **WL-08 Cross-Browser Sync**     | `tests/test_wl08_cross_browser.js`     |    1    |    1    |   0   |        0        | Playwright Dual Contexts + MSSQL   |
|    10    | **Responsive QA Suite**          | `tests/test_responsive_qa.js`          |   37    |   37    |   0   |        0        | Playwright Chromium Multi-viewport |
| **TỔNG** | **Toàn bộ hệ thống VAMOS STORE** | **10 Bộ kiểm thử**                     | **107** | **107** | **0** |      **0**      | **100% Hoàn thành thực tế**        |

---

## 8. DANH SÁCH LỖI VÀ VẤN ĐỀ CÒN TỒN TẠI

Phân loại theo mức độ ưu tiên:

### 8.1. Critical (Nghiêm trọng): **0 lỗi**

- Không có lỗi nào gây chết server, mất dữ liệu CSDL, bypass xác thực hay lộ secret.

### 8.2. High (Cao): **0 lỗi**

- Các nghiệp vụ Wishlist, Cart, Checkout, Auth, Admin RBAC đều hoạt động 100% ổn định.

### 8.3. Medium (Trung bình): **1 lỗi hiển thị**

1. **Lỗi tràn ngang Storefront Header ở độ phân giải Tablet (768px) và Mobile (390px):**
   - _Mô tả:_ Thanh header Storefront (`src/views/partials/header.pug`) chứa quá nhiều phần tử cố định trên một hàng, gây tràn ngang 96px trên Tablet (864px vs 768px) và đẩy nút Hamburger sát mép trên Mobile.
   - _Phương án khắc phục đề xuất (cho giai đoạn tinh chỉnh UI):_
     - Trên Mobile (< 768px): Thêm class `hidden sm:flex` vào cụm nút `Đăng nhập / Đăng ký` trên header và chuyển liên kết đăng nhập vào bên trong menu di động (`#mobile-menu`).
     - Trên Tablet (768px): Điều chỉnh breakpoint của menu danh mục từ `md:flex` sang `lg:flex` để ở màn hình 768px danh mục vẫn được gập gọn trong nút hamburger.

### 8.4. Low (Thấp): **2 điểm lưu ý**

1. **Bảo vệ môi trường Production trong `init_mssql.js`:** Cần bổ sung guard chặn chạy script seed khi `NODE_ENV === 'production'`.
2. **Bộ nhớ đệm Client:** File `main.js?v=3.3.0` cần hard refresh trên trình duyệt của người dùng cũ.

---

## 9. DANH SÁCH CHỨC NĂNG CHƯA XÁC MINH

- **Kiểm thử trên thiết bị phần cứng thật (Real Physical Devices - iOS Safari & Android Chrome):** Hiện tại mới chỉ kiểm thử qua Playwright Browser Emulation (Chromium giả lập Viewport & User-Agent). Các hiệu ứng cảm ứng đặc thù (touch bounce, iOS dynamic address bar) chưa được đo lường trên máy thật.

---

## 10. TRẠNG THÁI GIT SAU KIỂM TRA

```text
Branch: fix/master-repair-plan
HEAD: 98946a8 (Tương thích hoàn toàn với commit gần nhất)

Modified unstaged (19 files - Giữ nguyên 100% Part A và Part B):
	docs/audit/FINAL_AUDIT_REPORT.md
	docs/audit/TEST_RESULTS.md
	docs/qa/BUG_BACKLOG.md
	docs/qa/PHASED_REPAIR_PLAN.md
	docs/qa/phase-reports/PHASE_0_BASELINE.md
	docs/qa/phase-reports/PHASE_1_ROLE_ADMIN.md
	docs/qa/phase-reports/PHASE_2_WISHLIST.md
	docs/qa/phase-reports/PHASE_3_THEME.md
	docs/qa/phase-reports/PHASE_4_I18N.md
	docs/qa/phase-reports/PHASE_5_FUNCTIONAL_AUDIT.md
	docs/qa/phase-reports/PHASE_6_ADMIN_DATA.md
	docs/qa/phase-reports/PHASE_7_FINAL_TEST.md
	src/locales/en.json
	src/locales/vi.json
	src/middlewares/auth.middleware.js
	src/public/js/main.js
	src/routes/index.js
	src/views/layouts/admin.pug
	src/views/layouts/main.pug

Untracked files (14 mục - Bao gồm mã nguồn Part B, test suites và báo cáo):
	database/migrations/004_create_wishlist_items.sql
	docs/qa/FINAL_INDEPENDENT_AUDIT.md
	docs/qa/FINAL_PRE_COMMIT_REVIEW.md
	docs/qa/RESPONSIVE_AND_PRODUCTION_SAFETY_REVIEW.md
	docs/qa/phase-reports/PHASE_B_FINAL_CHANGE_REVIEW.md
	docs/qa/phase-reports/PHASE_B_INDEPENDENT_AUDIT.md
	docs/qa/phase-reports/PHASE_B_SERVER_SIDE_WISHLIST.md
	docs/qa/screenshots/
	src/controllers/wishlist.controller.js
	src/models/repositories/wishlist.repository.js
	src/routes/wishlist.routes.js
	src/services/wishlist.service.js
	tests/test_responsive_qa.js
	tests/test_wishlist_server.js
	tests/test_wl08_cross_browser.js

(Chưa có file nào bị stage hoặc commit. Toàn bộ thay đổi được bảo toàn).
```

---

## 11. KẾT LUẬN CUỐI CÙNG

### **ĐÁNH GIÁ: READY TO COMMIT WITH KNOWN UI OBSERVATION**

1. **Mục tiêu chính của đợt sửa lỗi:**
   - Bảo mật thông tin tài khoản QA: **ĐẠT (100% làm sạch).**
   - Chuyển đổi Wishlist sang SQL Server có xác thực và cô lập: **ĐẠT (100% hoàn thành).**
   - Phân quyền Admin Portal: **ĐẠT (Cô lập hoàn toàn khỏi storefront).**
   - Đa ngôn ngữ và Theme: **ĐẠT (Hoạt động ổn định).**
   - Toàn bộ 107/107 ca kiểm thử hồi quy: **100% PASSED.**
2. **Về lỗi tràn ngang Storefront Header trên Tablet 768px / Mobile:**
   - Đây là lỗi giao diện CSS hiện hữu từ layout ban đầu của template `header.pug`, không làm hỏng logic backend hay database.
   - Nếu bạn đồng ý, chúng ta có thể đóng gói commit cho **Part A + Part B** trước để bảo toàn kết quả đã kiểm toán, sau đó xử lý tinh chỉnh CSS cho Header trong một commit riêng.
   - Nếu bạn muốn sửa dứt điểm lỗi CSS Header trước khi commit, vui lòng phê duyệt phương án sửa `src/views/partials/header.pug`.

_(Dừng lại theo quy tắc, chờ quyết định và phê duyệt từ bạn)._
