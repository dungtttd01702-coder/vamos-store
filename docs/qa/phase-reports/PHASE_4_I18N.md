# VAMOS STORE — BÁO CÁO NGHIỆM THU PHASE 4: INTERNATIONALIZATION (i18n VI / EN)

- **Ngày thực hiện:** 13/11/2026
- **Nhánh thực hiện:** `fix/master-repair-plan`
- **Người thực hiện:** Senior Full-Stack Developer & Software Architect
- **Trạng thái:** HOÀN THÀNH 100% (8/8 automated tests PASSED)

---

## 1. MỤC TIÊU & PHẠM VI

Khắc phục triệt để lỗi **BUG-05**: Chức năng chuyển đổi ngôn ngữ Tiếng Việt / Tiếng Anh (VI / EN) không hoạt động do các nút bấm trên giao diện chỉ là văn bản tĩnh hoặc thẻ span không có route xử lý.

### Phạm vi triển khai:
1. Xây dựng Middleware SSR Dictionary Engine: `src/middlewares/i18n.middleware.js` hỗ trợ song ngữ `vi` (mặc định) và `en`.
2. Tạo 2 từ điển ngôn ngữ chuẩn:
   - `src/locales/vi.json`
   - `src/locales/en.json`
   Cung cấp nhãn cho Navigation, Search, Admin Portal, Cart, Wishlist, Footer và Common Actions.
3. Tạo Endpoint chuyển đổi ngôn ngữ an toàn: `GET /set-locale/:lang` trong `src/routes/home.routes.js` và `src/controllers/home.controller.js`.
4. Cơ chế lưu trữ: Sử dụng Cookie `vamos_locale` với thời hạn 1 năm (`maxAge: 365 days`, `sameSite: lax`).
5. Phòng thủ bảo mật OWASP:
   - Whitelist validation: Chỉ chấp nhận `vi` và `en`, mọi giá trị không hợp lệ tự động quy về `vi`.
   - Chống Open Redirect: Kiểm tra Hostname của `Referrer`, ngăn chặn hacker chuyển hướng người dùng sang domain độc hại.
6. Cập nhật giao diện:
   - Header Storefront (`src/views/partials/header.pug`): Nút bấm VN / EN kích hoạt active link và highlight ngôn ngữ đang chọn.
   - Admin Bar (`src/views/partials/admin-nav.pug`): Nút bấm VN / EN tích hợp chuyển đổi ngôn ngữ trong khu vực quản trị.
   - Layout Storefront (`src/views/layouts/main.pug`): Wishlist Modal và client state inject `window.CURRENT_LOCALE`.
   - Giữ nguyên tiền tệ Việt Nam Đồng (VND), không quy đổi sang USD hay can thiệp vào định dạng thanh toán COD.

---

## 2. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (`tests/test_phase4_i18n.js`)

Bộ kiểm thử tự động gồm 8 kịch bản nghiêm ngặt:
- **Test 1:** Kiểm tra cấu hình danh sách ngôn ngữ hỗ trợ (`['vi', 'en']`) và mặc định (`vi`) — **PASS**.
- **Test 2:** Khách truy cập lần đầu không mang cookie được render SSR Tiếng Việt ("Sneaker Nam", "FLASH SALE TOÀN HỆ THỐNG") — **PASS**.
- **Test 3:** Gọi `GET /set-locale/en` sinh header `set-cookie: vamos_locale=en` và redirect an toàn về internal referrer — **PASS**.
- **Test 4:** Truy cập với cookie `vamos_locale=en` render toàn bộ nhãn tiếng Anh ("Men's Sneakers", "STOREWIDE FLASH SALE", `CURRENT_LOCALE='en'`) — **PASS**.
- **Test 5:** Gọi `GET /set-locale/vi` khôi phục cookie về `vi` và render lại tiếng Việt — **PASS**.
- **Test 6:** Kiểm tra Whitelist: Truy cập `/set-locale/evil_lang` bị từ chối và fallback an toàn về `vi` — **PASS**.
- **Test 7:** Chống Open Redirect: Request có Referer độc hại `https://evil-attacker.com/steal` bị chặn, tự động redirect về internal root `/` — **PASS**.
- **Test 8:** Hỗ trợ AJAX: Header `Accept: application/json` trả về `{ success: true, locale: "en" }` — **PASS**.

**Tổng kết:** 8/8 tests PASSED (0 FAILED).
Validate Pug: 39/39 templates biên dịch thành công 100%.

---

## 3. DANH SÁCH FILE THAY ĐỔI
- `src/locales/vi.json` (Mới)
- `src/locales/en.json` (Mới)
- `src/middlewares/i18n.middleware.js` (Mới)
- `src/controllers/home.controller.js` (Cập nhật `setLocale` endpoint)
- `src/routes/home.routes.js` (Cập nhật route `/set-locale/:lang`)
- `src/app.js` (Đăng ký `i18nMiddleware`)
- `src/views/partials/header.pug` (Gắn link chuyển ngôn ngữ và hàm `t()`)
- `src/views/layouts/main.pug` (Đa ngôn ngữ hóa Wishlist Modal & inject `CURRENT_LOCALE`)
- `tests/test_phase4_i18n.js` (Mới)
- `package.json` (Thêm script `test:i18n`)
- `docs/qa/phase-reports/PHASE_4_I18N.md` (Mới)
