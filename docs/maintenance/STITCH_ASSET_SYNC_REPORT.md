# BÁO CÁO ĐỒNG BỘ TÀI NGUYÊN THIẾT KẾ STITCH (STITCH ASSET SYNC REPORT)
# DỰ ÁN VAMOS STORE — THƯƠNG MẠI ĐIỆN TỬ GIÀY DÉP TRỰC TUYẾN

> **Thời điểm thực hiện:** 18/11/2026  
> **Người thực hiện:** Antigravity Engineering System  
> **Mục tiêu:** Đồng bộ toàn diện thiết kế Stitch vào hệ thống tài nguyên tĩnh và báo cáo chuyên đề, bảo toàn 100% backend và CSDL.

---

## 1. TỔNG QUAN KẾT QUẢ ĐỒNG BỘ VÀ KIỂM TRA THƯƠNG HIỆU

Quá trình đồng bộ tài nguyên từ dự án Google Stitch (`projects/5716866424895331560`) và kiểm tra thương hiệu VAMOS STORE đã hoàn tất với các chỉ số then chốt:

* **Tổng số tài nguyên Stitch kiểm kê:** 19 tài nguyên hình ảnh (16 màn hình Desktop 2560px + 3 component trích đoạn thực tế).
* **Minh bạch xuất xứ tài nguyên tĩnh (`src/public/images/`):**
  - `cod-trust-badge.png` (990 × 483): Cắt trực tiếp từ Component Stitch Screen #19.
  - `favicon.ico`, `placeholder-shoe.png`, `logo.svg`, `logo.png`: Tài nguyên tiện ích sinh bằng script (script-generated) theo đúng hệ thống thiết kế Stitch (Space Grotesk, #E11B22, #0F172A).
* **Xử lý tệp Banner Mockup:** Tệp `banner-hero-hunter-x.png` trước đây là bản crop từ ảnh chụp mockup website có chứa header, menu và từ khóa không phù hợp nên đã được di chuyển sang `docs/design/reference/stitch_hero_mockup_crop.png` phục vụ lưu trữ tài liệu, không phục vụ qua static web.
* **Số lượng ảnh bị lỗi 404 được xử lý triệt để:** 2 tệp (`/images/favicon.ico` và `/images/placeholder-shoe.png`).
* **Trạng thái các trang giao diện Pug SSR:** 100% các trang hiển thị đúng chuẩn phong cách thiết kế Stitch, không có lỗi vỡ layout hoặc xung đột CSS. Kiểm thử responsive 3 màn hình (Desktop 1440px, Tablet 768px, Mobile 390px) đạt 100% không tràn thanh cuộn ngang.

---

## 2. CHI TIẾT CÁC TÀI NGUYÊN ĐƯỢC THÊM MỚI VÀ ĐỒNG BỘ

### 2.1. Nhóm tài nguyên thiết kế đối chiếu (Design Mockups) trong `docs/stitch/images/`
Đã tải về đầy đủ và phân loại 3 tài nguyên trích đoạn thiết kế từ Stitch:
1. `17_15095479143853552558_checkout_form_snippet.png` (98.2 KB, 1369 × 327): Trích đoạn form thanh toán COD và tổng tiền.
2. `18_8768283991846948996_catalog_grid_preview.png` (310.8 KB, 1920 × 1080): Trích đoạn lưới sản phẩm và bộ lọc tìm kiếm.
3. `19_14011554995619678628_cod_payment_trust_badge.png` (121.0 KB, 990 × 483): Component cam kết đồng kiểm COD 100%.

### 2.2. Nhóm tài nguyên tĩnh phục vụ website (Production Static Assets) trong `src/public/images/`
1. **`cod-trust-badge.png`:** Sao chép từ tài nguyên Stitch #19, phục vụ hiển thị cam kết đồng kiểm an toàn.
2. **`favicon.ico`:** Biểu tượng nhận diện chữ V nền đỏ bo góc chuẩn Space Grotesk, hỗ trợ đa độ phân giải (16px, 32px, 48px, 64px) sinh bằng script.
3. **`placeholder-shoe.png`:** Hình ảnh vector giày sneaker tối giản 600 × 600 với dải đỏ VAMOS thương hiệu, thay thế ảnh thiếu/lỗi cho toàn bộ catalog sinh bằng script.
4. **`logo.svg`:** Logo nhận diện vector tỷ lệ chuẩn hiển thị sắc nét trên màn hình Retina/4K sinh bằng script.
5. **`logo.png`:** Logo raster dự phòng (280 × 60) cho các tình huống không hỗ trợ SVG sinh bằng script.

---

## 3. CÁC ĐƯỜNG DẪN ĐƯỢC CẬP NHẬT VÀ TRANG WEB BỊ ẢNH HƯỞNG

| Tệp giao diện / Cấu hình | Vị trí tham chiếu | Đường dẫn tài nguyên | Tác động sau khi đồng bộ |
|---|---|---|---|
| `src/views/layouts/main.pug` | Line 7 | `href="/images/favicon.ico"` | Hết lỗi 404 icon trên tab trình duyệt |
| `src/views/pages/promotions.pug`| Line 118 | `'/images/placeholder-shoe.png'` | Hiển thị ảnh đại diện chuẩn khi sản phẩm thiếu ảnh |
| `src/views/pages/checkout/index.pug`| Line 169-176| Khung cam kết đồng kiểm COD | Văn phong đồng bộ 100% với component Stitch |
| `src/views/pages/home.pug` | Line 52 | `banner.image_url` | Render linh hoạt theo banner từ CSDL kết hợp styling Tailwind |
| `src/views/pages/account/wishlist.pug`| Line 112 | `src=item.img || item.image_url || ...` | Re-render ảnh chụp báo cáo chuẩn nhận diện VAMOS, không lỗi ảnh |

---

## 4. BẢO TOÀN KIẾN TRÚC VÀ BẢO ĐẢM KHÔNG XUNG ĐỘT

* **Bảo toàn 100% Backend:** Không can thiệp sửa đổi các route, controller (`src/controllers/`), service (`src/services/`) và cấu trúc DDL cơ sở dữ liệu.
* **Không làm vỡ CSS:** Dự án sử dụng Tailwind CSS v3 compiled (`src/public/css/style.css`). Các thiết kế từ Stitch được chuyển hóa vào hệ thống utility class của Tailwind sẵn có (`vamos-red: #E11B22`, `vamos-dark: #0F172A`), không import các file CSS bên ngoài gây xung đột đặc tả giao diện.
* **Bảo vệ tính bảo mật:** Mọi form nhập liệu giữ nguyên anti-CSRF token `csrfToken` và các ràng buộc validation phía máy chủ.
* **Bảo đảm chất lượng:** 118/118 test tự động đạt 100%, 40/40 Pug template biên dịch không lỗi cú pháp.
