# BÁO CÁO KIỂM TOÁN CHẤT LƯỢNG TOÀN DIỆN (QUALITY AUDIT) — VAMOS STORE

**Mã kiểm toán:** QA-VAMOS-2026-v1.1  
**Ngày thực hiện:** 12/11/2026  
**Đơn vị thực hiện:** Senior Fullstack, Backend, Frontend, QA, Security & Architecture Team  
**Mục tiêu:** Rà soát toàn bộ hệ thống theo tiêu chuẩn E-Commerce chuyên nghiệp của Nike, Adidas, Zalando.

---

## 1. BẢNG TỔNG HỢP VẤN ĐỀ VÀ PHÂN LOẠI MỨC ĐỘ

| Mã vấn đề      | Phân hệ    | Mức độ       | File & Vị trí                           | Mô tả vấn đề                                                                                                        | Nguyên nhân gốc                                                                                        | Hướng xử lý                                                                                                                         | Cách xác minh                                                 |
| -------------- | ---------- | ------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **QA-CART-01** | Cart       | **CRITICAL** | `cart.controller.js` (`mergeGuestCart`) | Khi Guest có 5 đôi, Customer có 8 đôi cùng biến thể (tồn 20), gộp giỏ tạo ra 13 đôi, vượt hạn mức bán lẻ 10 đôi.    | `Math.min(variant.stock_quantity, currentQty + quantity)` không chặn theo `MAX_RETAIL_QUANTITY = 10`.  | Bổ sung `Math.min(MAX_RETAIL_QUANTITY, variant.stock_quantity, ...)` trong `mergeGuestCart`.                                        | Unit/Integration Test `MERGE-01` trong `regression_suite.js`. |
| **QA-CART-02** | Cart       | **HIGH**     | `cart.controller.js` (`index`)          | Giỏ hàng Guest trong session không cập nhật lại khi Admin đổi giá hoặc hạ số lượng tồn kho trong database.          | `index()` trực tiếp render từ `req.session.guestCart` mà không đối chiếu lại CSDL theo thời gian thực. | Re-query trạng thái, giá và tồn kho khả dụng từ DB cho giỏ hàng Guest; tự động điều chỉnh và hiển thị flash thông báo.              | Test case `GCART-SYNC-01` & `GCART-SYNC-02`.                  |
| **QA-CART-03** | UI / Cart  | **MEDIUM**   | `src/views/pages/cart/index.pug`        | Khi số lượng = 1, nút "-" gửi `quantity = 0` gây bất ngờ xóa item thay vì giữ ở mức tối thiểu 1.                    | Nút "-" không có thuộc tính `disabled` khi `quantity <= 1`.                                            | Khóa nút "-" khi `quantity <= 1` (buộc dùng nút xóa chuyên dụng nếu muốn xóa). Khóa nút "+" khi $\ge \min(stock, 10)$.              | Test biên `tests/validate_pug.js` & regression.               |
| **QA-FLOW-01** | Checkout   | **HIGH**     | `cart.routes.js` & `cart.controller.js` | Nút "Mua Ngay (COD)" chỉ chuyển hướng về `/cart` như nút "Thêm vào giỏ" thông thường, không đưa vào luồng checkout. | Route `/buy-now` map trực tiếp vào `addItem()` vốn redirect về `/cart`.                                | Viết riêng method `buyNow()`: Customer chuyển thẳng tới `/checkout`, Guest lưu giỏ và chuyển đến `/auth/login?returnUrl=/checkout`. | Test luồng `BUYNOW-01` & `BUYNOW-02`.                         |
| **QA-VAL-01**  | Validation | **HIGH**     | `cart.controller.js`                    | Ký pháp số mũ khoa học (e.g. `1e1`, `1e2`) hoặc số âm có thể bypass nếu chỉ dùng `parseInt`.                        | Thiếu regex kiểm tra số nguyên dương thuần túy `/^[1-9]\d*$/`.                                         | Ràng buộc định dạng số nguyên dương nghiêm ngặt, từ chối mọi chuỗi có ký tự `e`, `.`, `-`.                                          | Test ca biên `LIMIT-01` đến `LIMIT-04`.                       |
| **QA-SEC-01**  | Security   | **HIGH**     | `src/app.js`                            | Thiếu một số security headers phòng vệ chủ động (MIME sniffing, clickjacking, referrer policy).                     | Ứng dụng Express chưa cấu hình middleware security headers.                                            | Thiết lập bộ tiêu đề chuẩn OWASP (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) và tắt `X-Powered-By`.            | Kiểm tra tiêu đề HTTP response.                               |

---

## 2. KẾ HOẠCH TRIỂN KHAI SỬA LỖI VÀ BẢO ĐẢM TÍNH TOÀN VẸN

1. **Giai đoạn 2 (Backend & Nghiệp vụ):**
   - Nâng cấp `CartController.mergeGuestCart` đảm bảo chặn mức trần 10 đôi.
   - Thêm cơ chế đồng bộ giá và tồn kho thời gian thực cho giỏ hàng Guest trong `CartController.index`.
   - Triển khai method `CartController.buyNow` đưa đúng vào luồng checkout.
2. **Giai đoạn 3 (Database & Security):**
   - Đảm bảo tính toàn vẹn của transaction đặt hàng và snapshot đơn hàng.
   - Kiểm tra parameterized queries trên 100% các truy vấn.
3. **Giai đoạn 4 (Frontend UI/UX):**
   - Cập nhật Pug view giỏ hàng: khóa nút "-" khi số lượng = 1, khóa nút "+" khi đạt max(stock, 10).
   - Tối ưu giao diện và các trạng thái loading, disabled, toast thông báo.
4. **Giai đoạn 5 (Testing & Regression):**
   - Bổ sung test cases xác minh 20 tình huống biên đặc thù.
   - Chạy toàn bộ 5 test suites.
5. **Giai đoạn 6 (Review & Git push):**
   - Tạo `docs/FINAL_QUALITY_REPORT.md` và push lên GitHub repository.
