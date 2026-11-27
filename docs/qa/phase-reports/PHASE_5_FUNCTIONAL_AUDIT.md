# VAMOS STORE — BÁO CÁO NGHIỆM THU PHASE 5: FULL FUNCTIONAL & INTERACTIVE BUTTON AUDIT

- **Ngày thực hiện:** 13/11/2026
- **Nhánh thực hiện:** `fix/master-repair-plan`
- **Người thực hiện:** Senior Full-Stack Developer & Software Architect
- **Trạng thái:** HOÀN THÀNH 100% (7/7 automated tests PASSED)

---

## 1. MỤC TIÊU & PHẠM VI

Rà soát và kiểm thử toàn bộ các nút bấm, luồng dữ liệu, form và thao tác tương tác trên toàn hệ thống VAMOS STORE:
1. **Catalog Filters & Pagination (Khắc phục BUG-08):**
   - Bộ lọc phân loại: danh mục (`?cat=`), giới tính (`?gender=`), kích cỡ (`?size=`), khoảng giá (`?minPrice=`, `?maxPrice=`), sắp xếp (`?sort=`).
   - Phân trang PJAX: Bổ sung class `.catalog-pagination-link` và `.catalog-filter-link` vào các nút phân trang trong `src/views/pages/products/index.pug`.
   - Đảm bảo sau mỗi lần nạp PJAX, hàm `initAutomaticCatalogFiltering` và `syncWishlistUI` được gọi tự động để các sản phẩm nạp mới vẫn nhận diện trạng thái trái tim yêu thích.
2. **Live Search API:**
   - Endpoint `/api/products/search` trả về danh sách sản phẩm gợi ý tức thì định dạng chuẩn JSON.
3. **Product Detail Interactions:**
   - Trình chọn size/màu sắc tương tác mượt mà.
   - Kiểm tra tồn kho và giới hạn bán lẻ tối đa 10 đôi/lần (`MAX_RETAIL_QUANTITY = 10`). Request vượt quá 10 đôi bị từ chối với thông báo hướng dẫn mua sỉ qua Hotline 1900 2126.
   - Debounce chống click đúp cho nút Thêm vào giỏ (`#btn-add-to-cart`) và Mua ngay (`#btn-buy-now`).
4. **Cart & Shipping Calculation:**
   - Công thức phí vận chuyển COD áp dụng đồng bộ toàn hệ thống:
     - Tạm tính < 500.000₫: Phí vận chuyển 30.000₫.
     - Tạm tính $\ge$ 500.000₫: Miễn phí vận chuyển (0₫).
     - Giỏ hàng rỗng: 0₫ tạm tính, 0₫ phí vận chuyển.
5. **Checkout COD Guards:**
   - Bảo vệ form thanh toán chống nhấp đúp (`data-submitting="true"`, đổi nhãn sang trạng thái loading).
   - Ngăn chặn tài khoản Quản trị viên (`Admin`) truy cập hoặc submit thanh toán COD.
6. **Admin Operations & State Management:**
   - Kiểm tra chức năng Bật/Tắt trạng thái Danh mục (`categories.is_active`).
   - Kiểm tra chức năng Bật/Tắt trạng thái Mã giảm giá (`vouchers.is_active`).
   - Quản lý trạng thái đơn hàng và điều chỉnh tồn kho.

---

## 2. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (`tests/test_phase5_functional.js`)

- **Test 1:** Lọc danh mục Catalog (`/products?cat=sneaker-nam`) nạp dữ liệu và view chính xác — **PASS**.
- **Test 2:** Live Search API trả về kết quả mảng sản phẩm hợp lệ — **PASS**.
- **Test 3:** Công thức tính phí ship (miễn phí từ 500.000₫, 30.000₫ dưới 500.000₫) — **PASS**.
- **Test 4:** Nút Mua ngay chặn số lượng bán lẻ > 10 đôi và thông báo rõ ràng — **PASS**.
- **Test 5:** Admin bị chặn truy cập `/checkout`, tự động redirect về `/admin/dashboard` — **PASS**.
- **Test 6:** Admin kích hoạt đảo trạng thái Voucher (`vouchers.is_active`) trực tiếp trong SQL Server — **PASS**.
- **Test 7:** Admin kích hoạt đảo trạng thái Danh mục (`categories.is_active`) trực tiếp trong SQL Server — **PASS**.

**Tổng kết:** 7/7 tests PASSED (0 FAILED).

---

## 3. DANH SÁCH FILE THAY ĐỔI
- `src/views/pages/products/index.pug` (Gắn `.catalog-pagination-link` và `.catalog-filter-link` cho phân trang)
- `src/public/js/main.js` (Hỗ trợ PJAX phân trang và tái kích hoạt `syncWishlistUI`)
- `tests/test_phase5_functional.js` (Mới)
- `package.json` (Thêm script `test:functional`)
- `docs/qa/BUG_BACKLOG.md` (Đánh dấu BUG-08 FIXED)
- `docs/qa/phase-reports/PHASE_5_FUNCTIONAL_AUDIT.md` (Mới)
