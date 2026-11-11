# BÁO CÁO KẾT QUẢ KIỂM THỬ TOÀN DIỆN (TEST REPORT) - VAMOS STORE

> **Dự án:** VAMOS STORE  
> **Phiên bản:** v1.1 Chuẩn hóa  
> **Môi trường thực thi:** Microsoft SQL Server 2025 (`vamos_store_test_db`), Node.js v20 LTS, Windows 11  
> **Thời điểm kiểm thử gần nhất:** 11/11/2026  
> **Tổng số kịch bản kiểm thử:** 162 bài kiểm thử tự động  
> **Kết quả chung:** **162 / 162 PASSED (100% PASS RATE, 0 FAILED, 0 SKIPPED)**

---

## 1. BẢNG TỔNG HỢP KẾT QUẢ THEO TỪNG BỘ TEST

| STT | Tên bộ kiểm thử | Lệnh thực thi | Số lượng tests | PASSED | FAILED | SKIPPED | Tỷ lệ đạt |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | **Biên dịch giao diện Pug** | `node tests/validate_pug.js` | 35 | 35 | 0 | 0 | **100%** |
| 2 | **Kiểm tra chuẩn hóa Input** | `node tests/validator.test.js` | 14 | 14 | 0 | 0 | **100%** |
| 3 | **Kiểm tra luồng Xác thực** | `node tests/test_auth_flow.js` | 10 | 10 | 0 | 0 | **100%** |
| 4 | **Hồi quy nghiệp vụ CSDL** | `node tests/regression_suite.js` | 103 | 103 | 0 | 0 | **100%** |
| **TỔNG**| **TOÀN BỘ HỆ THỐNG** | `npm run test:all` | **162** | **162** | **0** | **0** | **100%** |

---

## 2. CHI TIẾT KẾT QUẢ CÁC BỘ KIỂM THỬ

### 2.1. Kiểm thử Biên dịch Pug Templates (`tests/validate_pug.js`)
- Đã quét và biên dịch thành công 35/35 tệp Pug trong `src/views/`.
- Không phát sinh lỗi cú pháp (Cú pháp phân đoạn thập phân Tailwind `.py-0.5` đã được sửa thành `(class="py-0.5")` hợp lệ).
- Các trang Admin Portal mới (`dashboard`, `products`, `product-form`, `inventory`, `inventory-history`, `categories`, `vouchers`, `voucher-form`, `customers`, `customer-detail`, `banners`) đều biên dịch sạch sẽ.

### 2.2. Kiểm thử Input Validator (`tests/validator.test.js`)
- 14/14 trường hợp kiểm thử validator email và số điện thoại đều đạt:
  - Chặn đứng: `123@gmail`, `abc`, `abc@`, chuỗi rỗng.
  - Chấp nhận & chuẩn hóa: `abc@gmail.com`, `ABC@GMAIL.COM` (về chữ thường), `  abc@gmail.com  ` (loại bỏ khoảng trắng thừa).
  - Chuẩn hóa số điện thoại Việt Nam 10 chữ số.

### 2.3. Kiểm thử Luồng Xác thực & Session (`tests/test_auth_flow.js`)
- 10/10 kiểm thử xác thực:
  - Đăng ký thành công tài khoản mới với mật khẩu bcrypt.
  - Ngăn chặn đăng ký trùng email.
  - Đăng nhập thành công, tái tạo phiên với `req.session.regenerate()`.
  - Phân quyền điều hướng theo Role (Admin $\rightarrow$ `/admin/dashboard`, Customer $\rightarrow$ `/`).
  - Hủy session và xóa sạch cookie `vamos_sid` khi đăng xuất.
  - Middleware `requireGuest` chặn tài khoản đang đăng nhập gửi lại form login/register.

### 2.4. Kiểm thử Hồi quy Nghiệp vụ & Concurrency (`tests/regression_suite.js`)
- 103/103 kiểm thử phủ khắp 14 phân hệ nghiệp vụ:
  - **Suite 1 (Schema & DB):** 19 bảng thực thể tồn tại đầy đủ, khóa ngoại và ràng buộc CHECK hợp lệ.
  - **Suite 2 (Auth & Security):** Mã hóa bcrypt an toàn, chặn SQLi.
  - **Suite 3 (Catalog & Variants):** Quản lý SKU, Size, Màu sắc và lọc đa tiêu chí.
  - **Suite 4 (Cart Operations):** Thêm, sửa số lượng, xóa item trong giỏ.
  - **Suite 5 (Voucher Engine):** Kiểm tra điều kiện giảm giá, thời hạn, đơn tối thiểu.
  - **Suite 6 (COD Transaction):** Trừ tồn kho nguyên tử trong Database Transaction.
  - **Suite 7 (Cancellation & Restocking):** Hoàn kho tự động và đảm bảo Idempotent (chỉ hoàn 1 lần duy nhất).
  - **Suite 8 (Snapshot Integrity):** Bất biến thông tin sản phẩm và giá bán trong `order_items` khi Admin sửa giá gốc (Q10).
  - **Suite 9 (Concurrency & Race Condition):** Khóa dòng `WITH (UPDLOCK, ROWLOCK)` ngăn chặn Overselling khi nhiều luồng cùng checkout biến thể cuối cùng.
  - **Suite 10 (Admin Order State Machine):** Chuyển đổi trạng thái tuần tự và hủy đơn nội bộ kèm lý do.
  - **Suite 11 (Guest Cart & Merge):** Lưu giỏ hàng Session và tự động gộp vào CSDL khi đăng nhập/đăng ký (Q2).
  - **Suite 12 (Single-use Voucher):** Ràng buộc 1 lần/user, chặn dùng lại, phục hồi lượt dùng khi đơn bị hủy (Q8).
  - **Suite 13 (Admin Inventory Adjustment):** Điều chỉnh tồn kho thủ công và ghi log kiểm toán vào `inventory_transactions`.
  - **Suite 14 (Account Locking):** Khóa tài khoản trong CSDL và vô hiệu hóa Session ngay lập tức ở request kế tiếp.

---

## 3. KẾT LUẬN NGHIỆM THU

Hệ thống VAMOS STORE v1.1 đã vượt qua 100% các bài kiểm thử tự động, không còn lỗi tồn đọng, sẵn sàng bàn giao và đưa vào vận hành thực tế.
