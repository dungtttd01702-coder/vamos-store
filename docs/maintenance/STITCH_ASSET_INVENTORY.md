# DANH MỤC TÀI NGUYÊN THIẾT KẾ STITCH (STITCH ASSET INVENTORY)
# DỰ ÁN VAMOS STORE — HỆ THỐNG WEBSITE BÁN GIÀY TRỰC TUYẾN

> **Dự án Stitch Cloud:** `vamos Store E-Commerce Plan`  
> **Stitch Project ID:** `projects/5716866424895331560`  
> **Quy chuẩn thiết kế:** Antigravity Kinetic SSR Design Protocol (60-30-10 Color Rule, Space Grotesk + Be Vietnam Pro)  
> **Ngày cập nhật kiểm kê:** 18/11/2026  
> **Trạng thái:** Đã kiểm kê và đồng bộ 100% vào repository.

---

## 1. NGUYÊN TẮC PHÂN LOẠI TÀI NGUYÊN THEO CHUẨN KỸ THUẬT

Để đảm bảo kiến trúc mã nguồn sạch sẽ, không nhầm lẫn giữa ảnh mô phỏng thiết kế và ảnh tài nguyên động của website, toàn bộ tài nguyên Stitch được phân định nghiêm ngặt thành 2 nhóm:

* **Loại 1 — Ảnh thiết kế giao diện (Design Mockups / Full Page Previews):**
  * Bao gồm 16 ảnh chụp toàn trang (Full-page Screenshots độ phân giải 2560px) và 16 tệp mã nguồn HTML đối chiếu do Stitch xuất bản.
  * *Mục đích sử dụng:* Lưu trữ tại `docs/stitch/` và tích hợp vào tài liệu báo cáo `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/` phục vụ hội đồng thẩm định.
  * *Quy tắc:* Tuyệt đối không dùng nguyên ảnh chụp toàn trang để nhúng làm nội dung bên trong website.
* **Loại 2 — Tài nguyên hình ảnh thực tế (Production Static Assets):**
  * Bao gồm Logo SVG/PNG, Favicon, Banners hero, Badge cam kết an toàn COD, Placeholder giày dép.
  * *Mục đích sử dụng:* Đặt trong thư mục tĩnh `src/public/images/` để server Express phục vụ trực tiếp cho giao diện Pug SSR.

---

## 2. BẢNG KIỂM KÊ CHI TIẾT TÀI NGUYÊN STITCH (STITCH ASSET INVENTORY)

### A. PHÂN HỆ GUEST (KHÁCH VÃNG LAI)

| STT | Tên tệp tin | Nguồn Stitch ID | Kích thước | Định dạng | Chức năng / Màn hình tương ứng | Trạng thái đồng bộ |
|:---:|---|---|:---:|:---:|---|:---:|
| 01 | `09_45cc46eb...trang_chu_bitis_store.png` | `45cc46eb9d664530a4e1a28cd39c28cc` | 2560 × 8646 | PNG | Trang chủ (Home Page) & Hero Banner | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 02 | `06_e7c4e7cc...danh_muc_bo_loc_san_pham.png` | `e7c4e7cc5f0446eba77b901bcbaeb5f8` | 2560 × 3948 | PNG | Danh mục & Bộ lọc sản phẩm đa thuộc tính | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 03 | `08_b3e44855...chi_tiet_san_pham_bitis_hunter_x.png` | `b3e44855d8164c71a634823c05480f61` | 2560 × 5660 | PNG | Chi tiết sản phẩm & Bộ chọn biến thể SKU | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 04 | `10_5f0cb934...dang_nhap_dang_ky_tai_khoan.png` | `5f0cb934b4be4e8eb5a58927abc9f6f0` | 2560 × 2572 | PNG | Đăng nhập tài khoản & CSRF protection | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 05 | `16_cdee8cfa...dang_ky_tai_khoan_thanh_vien.png` | `cdee8cfa0f144a3881596c887d1da2f6` | 2560 × 3040 | PNG | Đăng ký thành viên mới & Xác thực form | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 06 | `18_87682839...catalog_grid_preview.png` | `8768283991846952597` | 1920 × 1080 | PNG | Trích đoạn hiển thị lưới sản phẩm & tag giảm giá | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |

### B. PHÂN HỆ CUSTOMER (KHÁCH HÀNG THÀNH VIÊN)

| STT | Tên tệp tin | Nguồn Stitch ID | Kích thước | Định dạng | Chức năng / Màn hình tương ứng | Trạng thái đồng bộ |
|:---:|---|---|:---:|:---:|---|:---:|
| 07 | `03_c4b0ed08...gio_hang_tom_tat_don.png` | `c4b0ed084792494f9bbb658bc29246d7` | 2560 × 3220 | PNG | Giỏ hàng trực tuyến & Bảng tóm tắt đơn hàng | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 08 | `04_ae23af57...thanh_toan_cod_an_toan.png` | `ae23af5701cd43c696a15c4091cdea97` | 2560 × 3884 | PNG | Thanh toán COD an toàn & Form nhập địa chỉ | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 09 | `07_8bc9424e...quan_ly_don_hang_lich_su_mua_sam.png` | `8bc9424e7e4e4877b9758fec6dbba1f4` | 2560 × 4496 | PNG | Lịch sử mua hàng & Chi tiết trạng thái vận chuyển | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 10 | `17_15095479...checkout_form_snippet.png` | `15095479143853552558` | 1369 × 327 | PNG | Trích đoạn form địa chỉ giao hàng và nút đặt COD | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 11 | `19_14011554...cod_payment_trust_badge.png` | `14011554995619677045` | 990 × 483 | PNG | Component Cam kết đồng kiểm & Thanh toán COD | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |

### C. PHÂN HỆ ADMIN (QUẢN TRỊ VIÊN)

| STT | Tên tệp tin | Nguồn Stitch ID | Kích thước | Định dạng | Chức năng / Màn hình tương ứng | Trạng thái đồng bộ |
|:---:|---|---|:---:|:---:|---|:---:|
| 12 | `05_0bab0414...admin_dashboard_kpi_doanh_thu.png` | `0bab041468e54d9f977a2b523c949088` | 2560 × 4804 | PNG | Admin Dashboard, KPI Doanh thu & Thống kê | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 13 | `11_4eb8e956...quan_ly_san_pham_ma_tran_bien_the.png` | `4eb8e956eee940d990933f25e32abce8` | 2560 × 3724 | PNG | Quản lý sản phẩm, ma trận biến thể SKU | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 14 | `02_df51e57d...quan_ly_don_hang_state_machine.png` | `df51e57d544e46b9ae0895bf8bf7e6ae` | 2560 × 4660 | PNG | Quản lý đơn hàng & Máy trạng thái FSM 6 bước | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 15 | `12_43935f71...quan_ly_danh_muc_thuong_hieu.png` | `43935f717f874c82969ec83de4513e63` | 2560 × 2048 | PNG | Quản lý danh mục ngành hàng & Thương hiệu | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 16 | `13_94f0c7c6...quan_ly_ton_kho_kiem_toan_bien_dong.png` | `94f0c7c6964a42b4b4b6c17891b9e9bd` | 2560 × 3748 | PNG | Quản lý tồn kho & Kiểm kê sổ cái thẻ kho | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 17 | `14_a9e215de...quan_ly_vouchers_khuyen_mai.png` | `a9e215def6fa464e81df4bee6657f7b2` | 2560 × 2048 | PNG | Quản lý mã giảm giá Voucher & Giới hạn Q8 | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 18 | `15_590bf7d9...quan_ly_khach_hang_vo_hieu_hoa_phien.png` | `590bf7d9e99b443481c04d9f5386057b` | 2560 × 4464 | PNG | Quản lý tài khoản khách hàng & Khóa phiên | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |
| 19 | `01_dc21845f...quan_ly_banners_slider.png` | `dc21845f3c5749f4b538a05d4687cde3` | 2560 × 2048 | PNG | Quản lý Banner slider trang chủ | **ĐÃ ĐỒNG BỘ** (`docs/stitch/images/`) |

---

## 3. TÀI NGUYÊN TĨNH DỰ ÁN (WEBSITE PRODUCTION STATIC ASSETS)

Tất cả tài nguyên tĩnh đã được tích hợp vào thư mục chuẩn `src/public/images/`:

| STT | Tên tài nguyên | Đường dẫn phục vụ | Kích thước | Định dạng | Mục đích sử dụng |
|:---:|---|---|:---:|:---:|---|
| 01 | `cod-trust-badge.png` | `/images/cod-trust-badge.png` | 990 × 483 | PNG | Component Cam kết đồng kiểm COD tại trang Checkout |
| 02 | `favicon.ico` | `/images/favicon.ico` | Multi-size | ICO | Favicon nhận diện thương hiệu trên tab trình duyệt |
| 03 | `placeholder-shoe.png`| `/images/placeholder-shoe.png`| 600 × 600 | PNG | Ảnh đại diện dự phòng khi sản phẩm thiếu ảnh |
| 04 | `logo.svg` | `/images/logo.svg` | Vector | SVG | Logo thương hiệu sắc nét tỷ lệ vàng |
| 05 | `logo.png` | `/images/logo.png` | 280 × 60 | PNG | Logo raster dự phòng cho email và PDF |
| 06 | `banner-hero-hunter-x.png` | `/images/banners/banner-hero-hunter-x.png` | 2560 × 1200 | PNG | Banner chính trang chủ quảng bá dòng Hunter X |

---

## 4. KẾT LUẬN VÀ BẢO CHỨNG ĐỒNG BỘ

1. Toàn bộ 16 màn hình thiết kế chuẩn của Stitch và 3 trích đoạn giao diện đã được tải về đầy đủ và kiểm kê minh bạch.
2. Thư mục static assets `src/public/images/` đã được thiết lập đầy đủ các tài nguyên cần thiết, giải quyết triệt để các nguy cơ lỗi 404 cho Favicon và Placeholder.
3. Không có sự xung đột giữa ảnh thiết kế giao diện (Design Previews) và tài nguyên nội dung thực tế (Production Assets).
