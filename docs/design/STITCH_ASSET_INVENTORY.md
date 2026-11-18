# DANH MỤC TÀI NGUYÊN THIẾT KẾ STITCH (STITCH ASSET INVENTORY)
# DỰ ÁN VAMOS STORE — HỆ THỐNG WEBSITE BÁN GIÀY TRỰC TUYẾN

> **Dự án Stitch Cloud:** `vamos Store E-Commerce Plan`  
> **Stitch Project ID:** `projects/5716866424895331560`  
> **Quy chuẩn thiết kế:** Antigravity Kinetic SSR Design Protocol (Space Grotesk + Be Vietnam Pro, #E11B22, #0F172A)  
> **Ngày cập nhật kiểm kê:** 18/11/2026  
> **Trạng thái:** Đã kiểm kê, phân loại minh bạch nguồn gốc và đồng bộ 100%.

---

## 1. NGUYÊN TẮC PHÂN LOẠI MINH BẠCH NGUỒN GỐC TÀI NGUYÊN

Để đảm bảo tính trung thực kỹ thuật và sự độc lập thương hiệu của VAMOS STORE:

* **Nhóm A — Ảnh thiết kế giao diện (Design Mockups / Full Page Previews):**
  * Bao gồm 16 ảnh chụp toàn trang (Full-page Screenshots độ phân giải cao 2560px) và các trích đoạn giao diện Stitch.
  * *Mục đích sử dụng:* Lưu trữ tại `docs/stitch/images/` để làm tài liệu đối chiếu thiết kế và phục vụ hồ sơ báo cáo tại `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/`.
  * *Quy tắc:* Tuyệt đối không dùng nguyên ảnh chụp màn hình / mockup lồng ghép làm ảnh nội dung trên trang web (tránh lỗi lồng header/menu/thanh tìm kiếm trùng lặp).
* **Nhóm B — Tài nguyên tĩnh hoạt động trên Website (Production Static Assets):**
  * Được lưu trữ tập trung tại thư mục phục vụ tĩnh `src/public/images/`.
  * **Minh bạch xuất xứ từng tệp:**
    1. **Tài nguyên cắt tách trực tiếp từ Stitch:**
       * `cod-trust-badge.png` (990 × 483): Cắt trực tiếp từ Component Cam kết đồng kiểm & Thanh toán COD (Stitch Screen #19 - ID `14011554995619677045`).
    2. **Tài nguyên tiện ích sinh bằng script (Script-generated utility assets):**
       * `favicon.ico`: Tạo bởi script chuẩn hóa đồ họa, tuân thủ bảng màu (#E11B22, #0F172A) và typography Space Grotesk của Stitch design system.
       * `placeholder-shoe.png` (600 × 600): Tạo bởi script đồ họa vector/canvas chuẩn hóa hình hài giày sneaker thể thao dự phòng khi sản phẩm thiếu ảnh.
       * `logo.svg`: Tạo bằng script vector chuẩn SVG nhận diện thương hiệu `VAMOS • STORE`.
       * `logo.png` (280 × 60): Tạo bằng script render raster từ logo vector phục vụ fallback.
    3. **Ghi nhận về Graphic Banner Hero độc lập:**
       * Trong Stitch Cloud hiện tại **chưa có tài nguyên graphic banner hero dạng ảnh tách rời** (hero trên Stitch được dựng bằng HTML/CSS layout kết hợp typography và ảnh sản phẩm).
       * Tệp `banner-hero-hunter-x.png` trước đây thực chất là bản crop từ ảnh chụp mockup giao diện (chứa menu và header trùng lặp) nên đã được **di chuyển sang thư mục lưu trữ tham khảo** `docs/design/reference/stitch_hero_mockup_crop.png`. Website không phục vụ tệp này qua static web để tránh sai lệch nhận diện thương hiệu.

---

## 2. BẢNG KIỂM KÊ 19 TÀI NGUYÊN STITCH TRONG DỰ ÁN (`docs/stitch/images/`)

### A. PHÂN HỆ GUEST (KHÁCH VÃNG LAI)

| STT | Tên tệp tin | Nguồn Stitch Screen ID | Kích thước | Phân nhóm | Mục đích sử dụng |
|:---:|---|---|:---:|:---:|---|
| 01 | `09_45cc46eb...trang_chu_bitis_store.png` | `45cc46eb9d664530a4e1a28cd39c28cc` | 2560 × 8646 | Nhóm A (Mockup) | Mockup tham chiếu giao diện Trang chủ & Hero |
| 02 | `06_e7c4e7cc...danh_muc_bo_loc_san_pham.png` | `e7c4e7cc5f0446eba77b901bcbaeb5f8` | 2560 × 3948 | Nhóm A (Mockup) | Mockup tham chiếu Danh mục & Bộ lọc sản phẩm |
| 03 | `08_b3e44855...chi_tiet_san_pham_bitis_hunter_x.png` | `b3e44855d8164c71a634823c05480f61` | 2560 × 5660 | Nhóm A (Mockup) | Mockup tham chiếu Chi tiết sản phẩm & SKU selector |
| 04 | `10_5f0cb934...dang_nhap_dang_ky_tai_khoan.png` | `5f0cb934b4be4e8eb5a58927abc9f6f0` | 2560 × 2572 | Nhóm A (Mockup) | Mockup tham chiếu Đăng nhập tài khoản |
| 05 | `16_cdee8cfa...dang_ky_tai_khoan_thanh_vien.png` | `cdee8cfa0f144a3881596c887d1da2f6` | 2560 × 3040 | Nhóm A (Mockup) | Mockup tham chiếu Đăng ký thành viên mới |
| 06 | `18_87682839...catalog_grid_preview.png` | `8768283991846952597` | 1920 × 1080 | Nhóm A (Snippet) | Trích đoạn hiển thị lưới sản phẩm & tag giảm giá |

### B. PHÂN HỆ CUSTOMER (KHÁCH HÀNG THÀNH VIÊN)

| STT | Tên tệp tin | Nguồn Stitch Screen ID | Kích thước | Phân nhóm | Mục đích sử dụng |
|:---:|---|---|:---:|:---:|---|
| 07 | `03_c4b0ed08...gio_hang_tom_tat_don.png` | `c4b0ed084792494f9bbb658bc29246d7` | 2560 × 3220 | Nhóm A (Mockup) | Mockup tham chiếu Giỏ hàng trực tuyến |
| 08 | `04_ae23af57...thanh_toan_cod_an_toan.png` | `ae23af5701cd43c696a15c4091cdea97` | 2560 × 3884 | Nhóm A (Mockup) | Mockup tham chiếu Thanh toán COD an toàn |
| 09 | `07_8bc9424e...quan_ly_don_hang_lich_su_mua_sam.png` | `8bc9424e7e4e4877b9758fec6dbba1f4` | 2560 × 4496 | Nhóm A (Mockup) | Mockup tham chiếu Lịch sử đơn hàng khách hàng |
| 10 | `17_15095479...checkout_form_snippet.png` | `15095479143853552558` | 1369 × 327 | Nhóm A (Snippet) | Trích đoạn form đặt hàng COD |
| 11 | `19_14011554...cod_payment_trust_badge.png` | `14011554995619677045` | 990 × 483 | Nhóm B (Production) | Gốc cắt thành `/images/cod-trust-badge.png` |

### C. PHÂN HỆ ADMIN (QUẢN TRỊ VIÊN)

| STT | Tên tệp tin | Nguồn Stitch Screen ID | Kích thước | Phân nhóm | Mục đích sử dụng |
|:---:|---|---|:---:|:---:|---|
| 12 | `05_0bab0414...admin_dashboard_kpi_doanh_thu.png` | `0bab041468e54d9f977a2b523c949088` | 2560 × 4804 | Nhóm A (Mockup) | Mockup tham chiếu Admin Dashboard & KPI |
| 13 | `11_4eb8e956...quan_ly_san_pham_ma_tran_bien_the.png` | `4eb8e956eee940d990933f25e32abce8` | 2560 × 3724 | Nhóm A (Mockup) | Mockup tham chiếu Quản lý sản phẩm & SKU |
| 14 | `02_df51e57d...quan_ly_don_hang_state_machine.png` | `df51e57d544e46b9ae0895bf8bf7e6ae` | 2560 × 4660 | Nhóm A (Mockup) | Mockup tham chiếu Quản lý đơn hàng FSM |
| 15 | `12_43935f71...quan_ly_danh_muc_thuong_hieu.png` | `43935f717f874c82969ec83de4513e63` | 2560 × 2048 | Nhóm A (Mockup) | Mockup tham chiếu Quản lý danh mục & thương hiệu |
| 16 | `13_94f0c7c6...quan_ly_ton_kho_kiem_toan_bien_dong.png` | `94f0c7c6964a42b4b4b6c17891b9e9bd` | 2560 × 3748 | Nhóm A (Mockup) | Mockup tham chiếu Quản lý tồn kho & thẻ kho |
| 17 | `14_a9e215de...quan_ly_vouchers_khuyen_mai.png` | `a9e215def6fa464e81df4bee6657f7b2` | 2560 × 2048 | Nhóm A (Mockup) | Mockup tham chiếu Quản lý mã giảm giá |
| 18 | `15_590bf7d9...quan_ly_khach_hang_vo_hieu_hoa_phien.png` | `590bf7d9e99b443481c04d9f5386057b` | 2560 × 4464 | Nhóm A (Mockup) | Mockup tham chiếu Quản lý tài khoản khách hàng |
| 19 | `01_dc21845f...quan_ly_banners_slider.png` | `dc21845f3c5749f4b538a05d4687cde3` | 2560 × 2048 | Nhóm A (Mockup) | Mockup tham chiếu Quản trị Banners |

---

## 3. TÀI NGUYÊN TĨNH WEBSITE ĐANG HOẠT ĐỘNG THỰC TẾ (`src/public/images/`)

| STT | Tên tài nguyên | Đường dẫn phục vụ | Kích thước | Nguồn gốc tạo dựng | Trạng thái HTTP |
|:---:|---|---|:---:|---|:---:|
| 01 | `cod-trust-badge.png` | `/images/cod-trust-badge.png` | 990 × 483 | Cắt trực tiếp từ Stitch Screen #19 (`14011554995619677045`) | **200 OK** |
| 02 | `favicon.ico` | `/images/favicon.ico` | 16/32/48 | Script-generated theo quy chuẩn bảng màu Stitch | **200 OK** |
| 03 | `placeholder-shoe.png`| `/images/placeholder-shoe.png`| 600 × 600 | Script-generated theo phong cách tối giản Stitch | **200 OK** |
| 04 | `logo.svg` | `/images/logo.svg` | Vector | Script-generated vector Space Grotesk chuẩn nhận diện VAMOS | **200 OK** |
| 05 | `logo.png` | `/images/logo.png` | 280 × 60 | Script-generated raster fallback cho tài liệu | **200 OK** |

---

## 4. TÀI NGUYÊN THAM KHẢO ĐÃ DI CHUYỂN (`docs/design/reference/`)

| STT | Tên tệp tin | Nguồn gốc | Lý do chuyển |
|:---:|---|---|---|
| 01 | `stitch_hero_mockup_crop.png` | Bản crop từ ảnh chụp mockup giao diện Stitch cũ | Chứa thanh điều hướng, menu và header trùng lặp; không phù hợp làm graphic banner độc lập trên website thực tế. |
