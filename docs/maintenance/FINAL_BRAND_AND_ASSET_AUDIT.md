# BÁO CÁO KIỂM TRA ĐỒNG BỘ STITCH VÀ HOÀN THIỆN THƯƠNG HIỆU VAMOS STORE
# (FINAL BRAND AND ASSET AUDIT REPORT)

> **Dự án:** VAMOS STORE — Website Bán Giày Trực Tuyến  
> **Thời điểm thực hiện:** 21/11/2026  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | HEAD `eb822aba57d75a2ecad390123c188afb73db3cb8`  
> **Đơn vị thực hiện:** Antigravity Engineering System  

---

## 1. MỤC TIÊU VÀ TỔNG QUAN KẾT QUẢ

Báo cáo này tổng hợp kết quả kiểm tra toàn diện nhằm bảo đảm:
1. Website và toàn bộ tài liệu hồ sơ sử dụng nhất quán thương hiệu **VAMOS STORE**, không còn tài nguyên hoặc từ khóa của thương hiệu khác (Biti's, Gosto,...) xuất hiện nhầm lẫn.
2. Tài nguyên từ **Google Stitch** (`projects/5716866424895331560`) được lưu trữ, phân loại và sử dụng đúng mục đích kỹ thuật.
3. Đối chiếu chi tiết 16 màn hình thiết kế Stitch với hệ thống template Pug SSR thực tế trên website.
4. Toàn bộ tài nguyên tĩnh (`src/public/images/`) được minh bạch nguồn gốc (phân định rõ tài nguyên cắt từ Stitch với tài nguyên tiện ích sinh bằng script), hoạt động hoàn hảo qua HTTP status 200.
5. Giao diện người dùng trên 3 kích thước màn hình (Desktop, Tablet, Mobile) hiển thị sắc nét, không tràn thanh cuộn ngang, không có lỗi 404.
6. Bảo toàn 100% logic backend, CSDL, không commit hoặc push khi chưa xác nhận hoàn tất.

---

## 2. KẾT QUẢ RÀ SOÁT THƯƠNG HIỆU VAMOS STORE

| Thành phần | Hiện trạng kiểm tra | Xử lý & Kết quả |
|---|---|---|
| **Logo** | Logo vector chữ `VAMOS • STORE` tại `src/public/images/logo.svg` và raster tại `src/public/images/logo.png`. | Hiển thị sắc nét tỷ lệ vàng, nhận diện thương hiệu VAMOS độc lập. |
| **Favicon** | Tệp `src/public/images/favicon.ico` đa kích thước (16/32/48px). | Biểu tượng chữ V đỏ bo góc trên tab trình duyệt, HTTP 200 OK. |
| **Banner trang chủ** | Section Hero được thiết kế theo layout SSR Kinetic, lấy dữ liệu banner từ CSDL MSSQL (`banners` table) kết hợp typography Tailwind. | Không chứa hình ảnh website lồng nhau; không có từ khóa thương hiệu ngoài. |
| **Ảnh sản phẩm** | Dữ liệu sản phẩm sử dụng ảnh sneaker CDN chất lượng cao và fallback `placeholder-shoe.png`. | Đã kiểm tra 46 sản phẩm trong CSDL, toàn bộ thuộc dòng VAMOS (VAMOS Originals, VAMOS Sport, VAMOS Performance). |
| **Badge COD** | Tệp `src/public/images/cod-trust-badge.png` trích xuất từ component Stitch Screen #19. | Hiển thị cam kết đồng kiểm và thanh toán khi nhận hàng. |
| **Wishlist Báo cáo** | Tệp `04_SAN_PHAM_YEU_THICH.png` trước đây chứa tên Biti's và ảnh bị gãy. | **Đã sửa và re-render mới:** 100% sản phẩm VAMOS (Vamos Stride X1, Vamos Retro Classic 1988, Vamos Air Wave V1 Pro), ảnh hiển thị hoàn hảo. |
| **Activity Diagrams** | 11 sơ đồ hoạt động trước đây có dải cảnh báo PlantUML deprecation màu vàng ở đầu trang. | **Đã biên dịch lại:** Loại bỏ hoàn toàn cảnh báo, sơ đồ Swimlane 2 cột chuẩn mực, trực quan. |

---

## 3. XỬ LÝ ẢNH BANNER HERO HUNTER X (`banner-hero-hunter-x.png`)

* **Kết quả kiểm tra nội dung thực tế:**
  - Tệp `src/public/images/banners/banner-hero-hunter-x.png` trước đây là một bản crop từ ảnh chụp màn hình (screenshot mockup giao diện), bên trong có chứa thanh menu website lồng nhau, thanh tìm kiếm, giỏ hàng và các từ khóa đặc thù (`GOSTO`, `Hunter Collection`).
  - Đây **không phải là graphic banner độc lập**. Nếu nhúng tệp này làm ảnh banner trên website sẽ gây ra hiện tượng giao diện lồng giao diện rất mất thẩm mỹ và vi phạm quy chuẩn thương hiệu.
* **Hành động xử lý:**
  1. Đã **di chuyển** tệp này ra khỏi thư mục static web, đưa vào kho lưu trữ tài liệu tham khảo:  
     `docs/design/reference/stitch_hero_mockup_crop.png`.
  2. Ghi nhận rõ ràng: **Stitch Cloud hiện tại chưa có asset banner hero dạng ảnh tách rời (isolated graphic asset)**. Màn hình hero của Stitch được dựng bằng phối cảnh layout HTML/CSS kết hợp kiểu chữ và ảnh sản phẩm độc lập.
  3. Trên website thực tế (`src/views/pages/home.pug`), Hero section sử dụng cấu trúc HTML/CSS responsive, hiển thị banner từ CSDL kết hợp nút CTA kép và thông số kỹ thuật (280g, +65%, 100%), đạt tính thẩm mỹ cao nhất mà không cần tệp ảnh screenshot lồng ghép.

---

## 4. BẢNG ĐỐI CHIẾU 16 MÀN HÌNH THIẾT KẾ STITCH VỚI WEBSITE HIỆN TẠI

| STT | Màn hình | Thiết kế Stitch (`docs/stitch/images/`) | Giao diện hiện tại (`src/views/`) | Khác biệt kỹ thuật & Thẩm mỹ | Hành động đã thực hiện |
|:---:|---|---|---|---|---|
| 01 | **Trang chủ** | `09_45cc46eb...trang_chu_bitis_store.png` | `pages/home.pug` | Stitch là mockup tĩnh; Web là SSR Pug động với carousel New Arrival, Flash Sale, 4 cam kết bán hàng. | Đồng bộ typography Space Grotesk & Be Vietnam Pro, dùng banner CSDL động, loại bỏ mockup lồng nhau. |
| 02 | **Danh sách sản phẩm** | `06_e7c4e7cc...danh_muc_bo_loc_san_pham.png` | `pages/products/index.pug` | Web bổ sung AJAX lọc đa tiêu chí (size, giới tính, giá), live search debounce và phân trang SSR. | Chuẩn hóa thẻ sản phẩm, tag giảm giá, hiệu ứng hover shadow và fallback ảnh placeholder. |
| 03 | **Chi tiết sản phẩm** | `08_b3e44855...chi_tiet_san_pham_bitis_hunter_x.png` | `pages/products/detail.pug` | Web tích hợp ma trận chọn biến thể SKU động (màu, size), kiểm tra tồn kho realtime và nút Mua Ngay. | Đồng bộ bảng thông số kỹ thuật, chính sách đổi trả, liên kết ảnh thu phóng chất lượng cao. |
| 04 | **Đăng nhập** | `10_5f0cb934...dang_nhap_dang_ky_tai_khoan.png` | `pages/auth/login.pug` | Web có tích hợp xác thực CSRF Token, rate limiting chống brute-force và flash alert thông báo lỗi. | Chuẩn hóa card căn giữa, icon nhãn form, nút CTA nổi bật màu đỏ VAMOS. |
| 05 | **Đăng ký** | `16_cdee8cfa...dang_ky_tai_khoan_thanh_vien.png` | `pages/auth/register.pug` | Web kiểm tra tính hợp lệ email/SĐT Việt Nam 10 số bằng Regex cả ở client và server. | Đồng bộ form đăng ký thành viên, checkbox đồng ý điều khoản, nút chuyển hướng đăng nhập. |
| 06 | **Giỏ hàng** | `03_c4b0ed08...gio_hang_tom_tat_don.png` | `pages/cart/index.pug` | Web hỗ trợ stepper tăng giảm số lượng chặn trần tồn kho (giới hạn bán lẻ 10 đôi), áp dụng voucher trực tiếp. | Thiết kế sidebar tóm tắt chi phí (tạm tính, giảm giá, phí ship), đồng bộ nút thanh toán COD. |
| 07 | **Đặt hàng COD** | `04_ae23af57...thanh_toan_cod_an_toan.png` | `pages/checkout/index.pug` | Web nhúng component badge COD Stitch #19, kiểm tra địa chỉ giao hàng và giao dịch DB atomic. | Tích hợp `/images/cod-trust-badge.png`, xác nhận thông tin đơn hàng bảo vệ CSRF. |
| 08 | **Lịch sử đơn hàng** | `07_8bc9424e...quan_ly_don_hang_lich_su_mua_sam.png` | `pages/account/orders.pug` | Web phân loại đơn hàng theo 6 trạng thái FSM, hỗ trợ hủy đơn phía khách hàng (PENDING/CONFIRMED). | Đồng bộ timeline tiến trình đơn hàng, badge trạng thái màu sắc theo chuẩn Stitch. |
| 09 | **Dashboard Admin** | `05_0bab0414...admin_dashboard_kpi_doanh_thu.png` | `pages/admin/dashboard.pug` | Web tính toán doanh thu thực tế chỉ từ đơn COMPLETED+PAID, hiển thị 4 KPI card và biểu đồ doanh thu. | Đồng bộ cấu trúc bảng điều khiển, cảnh báo tồn kho thấp và đơn hàng mới nhất. |
| 10 | **Quản lý sản phẩm** | `11_4eb8e956...quan_ly_san_pham_ma_tran_bien_the.png` | `pages/admin/products.pug` | Web quản lý đa biến thể SKU (Màu sắc × Size), công tắc kích hoạt/ẩn sản phẩm. | Đồng bộ giao diện bảng quản trị, ảnh thumbnail sản phẩm và bộ lọc trạng thái. |
| 11 | **Quản lý đơn hàng** | `02_df51e57d...quan_ly_don_hang_state_machine.png` | `pages/admin/orders.pug` | Web kiểm soát chuyển đổi trạng thái đơn hàng theo FSM nghiêm ngặt, tự động hoàn kho khi hủy đơn. | Tích hợp chi tiết đơn hàng, lịch sử thay đổi và nút thao tác xử lý đơn. |
| 12 | **Quản lý danh mục** | `12_43935f71...quan_ly_danh_muc_thuong_hieu.png` | `pages/admin/categories.pug` | Web hỗ trợ xem danh sách, thêm mới và bật/tắt hiển thị danh mục, tự sinh slug SEO. | Đồng bộ bảng danh mục, modal thêm danh mục mới với validation server. Không có xóa cứng/chỉnh sửa. |
| 13 | **Quản lý tồn kho** | `13_94f0c7c6...quan_ly_ton_kho_kiem_toan_bien_dong.png` | `pages/admin/inventory.pug` | Web ghi nhận kiểm toán sổ cái thẻ kho (`inventory_transactions`), cảnh báo hết hàng dưới 5 đôi. | Đồng bộ form điều chỉnh kho có nhập lý do điều chỉnh, lịch sử xuất nhập tồn. |
| 14 | **Quản lý Voucher** | `14_a9e215de...quan_ly_vouchers_khuyen_mai.png` | `pages/admin/vouchers.pug` | Web áp dụng quy tắc 1 lần/khách hàng (Q8), kiểm tra hạn sử dụng và giá trị đơn tối thiểu. | Đồng bộ bảng quản lý mã ưu đãi, thời hạn hiệu lực và số lần sử dụng thực tế. |
| 15 | **Quản lý khách hàng** | `15_590bf7d9...quan_ly_khach_hang_vo_hieu_hoa_phien.png` | `pages/admin/customers.pug` | Web hỗ trợ khóa/mở khóa tài khoản khách hàng, tự động hủy phiên đăng nhập khi bị khóa. | Đồng bộ bảng danh sách khách hàng, tổng chi tiêu, lịch sử mua hàng cá nhân. |
| 16 | **Quản lý Banner** | `01_dc21845f...quan_ly_banners_slider.png` | `pages/admin/banners.pug` | Web quản trị banner trang chủ lưu trữ trong CSDL MSSQL, cấu hình thứ tự hiển thị và link đích. | Đồng bộ danh sách banner, xem trước ảnh, công tắc kích hoạt realtime. |

---

## 5. MINH BẠCH XUẤT XỨ VÀ KIỂM TRA HTTP TÀI NGUYÊN TĨNH (`src/public/images/`)

Kết quả kiểm tra HTTP GET thực tế từ máy chủ Express (`node scratch/verify_static_http.js`):

| Tệp tin | Nguồn gốc xuất xứ | Kích thước | Content-Type | HTTP Status | Đánh giá |
|---|---|:---:|---|:---:|:---:|
| `/images/favicon.ico` | **Script-generated utility** (theo design system Stitch) | 4,165 bytes | `image/x-icon` | **200 OK** | Đạt |
| `/images/placeholder-shoe.png` | **Script-generated utility** (vector giày tối giản) | 4,128 bytes | `image/png` | **200 OK** | Đạt |
| `/images/cod-trust-badge.png` | **Cắt trực tiếp từ Stitch Screen #19** | 120,959 bytes | `image/png` | **200 OK** | Đạt |
| `/images/logo.svg` | **Script-generated utility** (vector Space Grotesk) | 515 bytes | `image/svg+xml` | **200 OK** | Đạt |
| `/images/logo.png` | **Script-generated utility** (raster fallback) | 625 bytes | `image/png` | **200 OK** | Đạt |
| `/css/style.css` | Biên dịch từ Tailwind CSS v3 | 69,176 bytes | `text/css` | **200 OK** | Đạt |
| `/js/main.js` | Client-side bundle | 71,975 bytes | `application/javascript` | **200 OK** | Đạt |
| `/images/banners/banner-hero-hunter-x.png` | Đã di chuyển sang kho tham khảo | - | - | **404 Not Found** | Đạt (Bảo vệ nhận diện, không lộ mockup crop) |

---

## 6. KẾT QUẢ KIỂM THỬ GIAO DIỆN RESPONSIVE (PLAYWRIGHT VISUAL AUDIT)

Đã chạy kiểm thử tự động trên trình duyệt Chromium thông qua Playwright (`node scratch/audit_responsive_visuals.js`) trên 3 kích thước:
1. **Desktop:** 1440 × 900 px
2. **Tablet:** 768 × 1024 px
3. **Mobile:** 390 × 844 px

### Kết quả chi tiết trên 6 tuyến đường trọng yếu (18 kịch bản):
* **Trang chủ (`/`):** 3/3 màn hình PASSED (scrollWidth = viewport width, không tràn ngang, zero lỗi 4xx/5xx).
* **Danh mục sản phẩm (`/products`):** 3/3 màn hình PASSED (lưới sản phẩm co giãn linh hoạt 1-2-4 cột).
* **Chi tiết sản phẩm (`/products/giay-sneaker-nam-vamos-air-wave-v1`):** 3/3 màn hình PASSED (ảnh sản phẩm không bị méo, selector size/màu co giãn chuẩn).
* **Đăng nhập (`/auth/login`):** 3/3 màn hình PASSED (form căn giữa chuẩn chỉ, nút CTA rõ ràng).
* **Đăng ký (`/auth/register`):** 3/3 màn hình PASSED (các trường nhập liệu đầy đủ nhãn).
* **Giỏ hàng (`/cart`):** 3/3 màn hình PASSED (bảng tóm tắt đơn hàng và danh sách sản phẩm hiển thị chuẩn).

* **Tổng số screenshot kiểm toán đã lưu:** 18 tệp ảnh tại `docs/maintenance/screenshots/`.
* **Kết luận:** Giao diện website đáp ứng 100% tiêu chuẩn responsive, không có thanh cuộn ngang ngoài ý muốn, không bị vỡ bố cục trên màn hình di động.

---

## 7. KẾT QUẢ KIỂM ĐỊNH MÃ NGUỒN VÀ HỒI QUY NGHIỆP VỤ

1. **Pug Validation:** `cmd.exe /c npm run test:pug` -> **40/40 templates PASSED 100%**.
2. **Hồi quy nghiệp vụ (Regression Suite):** `cmd.exe /c npm test` -> **118/118 test cases PASSED 100%**.
3. **Không làm vỡ tính năng:** Luồng mua hàng COD, giỏ hàng session -> DB merge, hủy đơn phục hồi kho, quản trị admin FSM hoạt động ổn định.
