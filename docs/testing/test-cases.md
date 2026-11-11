# DANH MỤC KỊCH BẢN KIỂM THỬ (TEST CASES SPECIFICATION) - VAMOS STORE

> **Dự án:** VAMOS STORE  
> **Tổng số test cases:** 162 kịch bản tự động  
> **Phiên bản:** v1.1 Chuẩn hóa  

---

## 1. PHÂN BỐ CÁC BỘ KIỂM THỬ

| Bộ kiểm thử | File thực thi | Số lượng Test Cases | Mục tiêu kiểm thử | Trạng thái |
| :--- | :--- | :---: | :--- | :---: |
| **Pug Views Validation** | `tests/validate_pug.js` | 35 | Biên dịch cú pháp toàn bộ 35 file giao diện Pug | **100% PASS** |
| **Input Validator Tests**| `tests/validator.test.js`| 14 | Kiểm tra chuẩn hóa email, số điện thoại, định dạng | **100% PASS** |
| **Auth Flow Tests** | `tests/test_auth_flow.js`| 10 | Đăng ký, đăng nhập, bảo mật session, redirect | **100% PASS** |
| **Regression Suite 1** | `tests/regression_suite.js` | 5 | Kết nối CSDL và tính toàn vẹn 19 bảng thực thể | **100% PASS** |
| **Regression Suite 2** | `tests/regression_suite.js` | 8 | Đăng ký tài khoản, mã hóa mật khẩu bcrypt | **100% PASS** |
| **Regression Suite 3** | `tests/regression_suite.js` | 7 | Danh mục sản phẩm, biến thể Size x Color x SKU | **100% PASS** |
| **Regression Suite 4** | `tests/regression_suite.js` | 8 | Giỏ hàng, cập nhật số lượng, xóa item | **100% PASS** |
| **Regression Suite 5** | `tests/regression_suite.js` | 8 | Nghiệp vụ mã giảm giá voucher, thời hạn, giá trị tối thiểu | **100% PASS** |
| **Regression Suite 6** | `tests/regression_suite.js` | 10 | Giao dịch đặt hàng COD, trừ tồn kho trong Transaction | **100% PASS** |
| **Regression Suite 7** | `tests/regression_suite.js` | 9 | Hủy đơn hàng và hoàn kho Idempotent | **100% PASS** |
| **Regression Suite 8** | `tests/regression_suite.js` | 6 | Snapshot dữ liệu đơn hàng và giá bán bất biến | **100% PASS** |
| **Regression Suite 9** | `tests/regression_suite.js` | 6 | Khóa dòng UPDLOCK chống Race Condition khi đặt hàng | **100% PASS** |
| **Regression Suite 10** | `tests/regression_suite.js` | 21 | Vận hành đơn hàng phía Admin (State Machine) | **100% PASS** |
| **Regression Suite 11** | `tests/regression_suite.js` | 3 | Giỏ hàng khách trong Session và tự động gộp (Q2) | **100% PASS** |
| **Regression Suite 12** | `tests/regression_suite.js` | 6 | Giới hạn 01 voucher/khách hàng và hoàn quota khi hủy (Q8) | **100% PASS** |
| **Regression Suite 13** | `tests/regression_suite.js` | 2 | Admin điều chỉnh tồn kho thủ công & ghi log kiểm toán | **100% PASS** |
| **Regression Suite 14** | `tests/regression_suite.js` | 4 | Trạng thái khóa tài khoản và chặn Admin tự khóa | **100% PASS** |
| **TỔNG CỘNG** | | **162** | **162/162 PASSED (0 FAIL, 0 SKIPPED)** | **100% PASS** |

---

## 2. CHI TIẾT CÁC TEST CASES ĐẶC THÙ MỚI BỔ SUNG (v1.1)

### 2.1. Suite 11: Giỏ hàng khách vãng lai & Gộp giỏ (Guest Cart - Decision Q2)
- **`GCART-01`:** Khách vãng lai thêm sản phẩm vào `req.session.guestCart` với số lượng hợp lệ $\rightarrow$ Session lưu trữ chính xác thông tin biến thể và số lượng.
- **`GCART-02`:** Khách vãng lai đăng nhập $\rightarrow$ Gọi hàm `mergeGuestCart` $\rightarrow$ Toàn bộ sản phẩm trong Session được chuyển vào bảng `cart_items` trong CSDL, xóa sạch `guestCart` trong Session.
- **`GCART-03`:** Sản phẩm đã tồn tại trong giỏ hàng CSDL trước khi gộp $\rightarrow$ Số lượng được cộng dồn chính xác nhưng không vượt quá tồn kho thực tế (`stock_quantity`).

### 2.2. Suite 12: Giới hạn 01 Voucher / Khách hàng (Voucher Usage - Decision Q8)
- **`Q8-01`:** Khách hàng A áp dụng voucher hợp lệ lần đầu tiên $\rightarrow$ Đơn hàng COD tạo thành công, ghi nhận bản ghi vào bảng `voucher_usages`.
- **`Q8-02`:** Khách hàng A cố gắng tạo đơn hàng thứ hai áp dụng cùng mã voucher đó $\rightarrow$ Hệ thống phát hiện đã dùng qua `voucher_usages`, từ chối tạo đơn và báo lỗi "Bạn đã sử dụng mã giảm giá này rồi".
- **`Q8-03`:** Khách hàng B (tài khoản khác) áp dụng mã voucher đó $\rightarrow$ Tạo đơn thành công (chứng minh giới hạn độc lập theo từng `user_id`).
- **`Q8-04`:** Khách hàng A hủy đơn hàng đầu tiên (khi đơn còn `PENDING`) $\rightarrow$ Bản ghi trong `voucher_usages` tự động bị xóa, `used_count` giảm 1.
- **`Q8-05`:** Sau khi đơn bị hủy, Khách hàng A tạo lại đơn mới với mã voucher đó $\rightarrow$ Tạo đơn thành công (chứng minh phục hồi quyền sử dụng khi hủy).
- **`Q8-06`:** Ràng buộc duy nhất `UQ_voucher_user_usage` trong CSDL $\rightarrow$ Cố tình insert trùng `(voucher_id, user_id)` bị CSDL chặn và báo lỗi Unique Violation.

### 2.3. Suite 13: Admin Điều chỉnh Tồn kho Thủ công (Inventory Adjustment)
- **`INV-01`:** Admin điều chỉnh tăng/giảm tồn kho biến thể tại `/admin/inventory/adjust` $\rightarrow$ `product_variants.stock_quantity` được cập nhật chính xác.
- **`INV-02`:** Bản ghi nhật ký kiểm toán trong `inventory_transactions` được tạo tự động với đầy đủ `old_quantity`, `new_quantity`, `change_quantity`, `reason` và `user_id`.

### 2.4. Suite 14: Khóa Tài khoản & Vô hiệu hóa Phiên (Account Locking)
- **`LOCK-01`:** Admin khóa tài khoản Customer (`status = 'locked'`) $\rightarrow$ CSDL cập nhật trạng thái `locked`.
- **`LOCK-02`:** Tài khoản bị khóa thực hiện đăng nhập $\rightarrow$ Hệ thống chặn đăng nhập và báo lỗi tài khoản bị tạm khóa.
- **`LOCK-03`:** Tài khoản đang có Session hợp lệ nhưng bị Admin khóa trong lúc đang thao tác $\rightarrow$ Middleware `requireAuth` phát hiện, hủy Session, xóa cookie `vamos_sid` và chuyển hướng về `/auth/login?error=account_locked`.
- **`LOCK-04`:** Admin cố tình gửi request khóa tài khoản của chính mình $\rightarrow$ Hệ thống từ chối với lỗi "Không thể tự khóa tài khoản của chính mình", bảo vệ quyền quản trị hệ thống.
