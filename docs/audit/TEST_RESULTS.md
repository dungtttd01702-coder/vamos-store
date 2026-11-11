# BÁO CÁO KẾT QUẢ KIỂM THỬ HỒI QUY TỰ ĐỘNG (AUTOMATED TEST RESULTS)

**Dự án:** VAMOS STORE — Website Thương mại điện tử Giày Sneaker & Thể thao  
**Môi trường thực thi:** Node.js v24 / Windows / Microsoft SQL Server 2025 (Local Host) & Docker 2022 Baseline  
**Cơ sở dữ liệu kiểm thử độc lập:** `vamos_store_test_db` (Hoàn toàn tách biệt khỏi `vamos_store_db`)  
**Ngày thực hiện kiểm thử:** 11/11/2026  
**Lệnh thực thi:** `npm test` (`node tests/regression_suite.js`)

---

## 1. TỔNG KẾT KẾT QUẢ THỰC TẾ

| Tổng số ca kiểm thử | Số ca VƯỢT QUA (PASS) | Số ca THẤT BẠI (FAIL) | Tỷ lệ thành công | Thời gian chạy |
| :-----------------: | :-------------------: | :-------------------: | :--------------: | :------------: |
|       **86**        |        **86**         |         **0**         |     **100%**     | **~4.2 giây**  |

---

## 2. CHI TIẾT CÁC CA KIỂM THỬ THEO NHÓM CHỨC NĂNG

### PHẦN 1: XÁC THỰC, SERVER-SIDE VALIDATION & BẢO MẬT (22 Ca Kiểm Thử)

| Mã Test  | Mô tả ca kiểm thử                                                    | Kết quả | Ghi chú kỹ thuật                              |
| -------- | -------------------------------------------------------------------- | :-----: | --------------------------------------------- |
| `VAL-01` | Từ chối email sai định dạng `123@gmail` (thiếu TLD .com/.vn)         | ✔ PASS  | Regex RFC 5322 bắt buộc TLD tối thiểu 2 ký tự |
| `VAL-02` | Từ chối email không chứa ký tự `@`                                   | ✔ PASS  | Bắt buộc cấu trúc `user@domain`               |
| `VAL-03` | Từ chối chuỗi không phải email (`admin`)                             | ✔ PASS  | Không chứa ký tự hợp lệ                       |
| `VAL-04` | Từ chối email thiếu phần mở rộng tên miền (`user@domain`)            | ✔ PASS  | Bắt buộc có dấu chấm và extension hợp lệ      |
| `VAL-05` | Chấp nhận email tên miền chuẩn (`admin@vamos.vn`)                    | ✔ PASS  | Email doanh nghiệp hợp lệ                     |
| `VAL-06` | Chấp nhận email Gmail chuẩn (`customer.test@gmail.com`)              | ✔ PASS  | Email cá nhân hợp lệ                          |
| `VAL-07` | Chấp nhận SĐT di động Việt Nam 10 chữ số (`0901234567`)              | ✔ PASS  | Đầu số Vinaphone/Mobifone hợp lệ              |
| `VAL-08` | Chấp nhận SĐT Viettel 10 chữ số (`0389998888`)                       | ✔ PASS  | Đầu số Viettel hợp lệ                         |
| `VAL-09` | Từ chối đầu số 11 số cũ của Việt Nam (`0123456789`)                  | ✔ PASS  | Chặn đầu số cũ đã chuyển đổi sang 10 số       |
| `VAL-10` | Từ chối số điện thoại quá ngắn (`123456`)                            | ✔ PASS  | Dưới 10 chữ số                                |
| `VAL-11` | Chấp nhận mật khẩu có từ 6 ký tự (`123456`)                          | ✔ PASS  | Thỏa mãn độ dài tối thiểu                     |
| `VAL-12` | Từ chối mật khẩu dưới 6 ký tự (`12345`)                              | ✔ PASS  | Dưới 6 ký tự                                  |
| `VAL-13` | Chấp nhận họ và tên đầy đủ (`Nguyễn Văn A`)                          | ✔ PASS  | Họ tên hợp lệ                                 |
| `VAL-14` | Từ chối họ và tên 1 ký tự (`A`)                                      | ✔ PASS  | Độ dài tối thiểu 2 ký tự                      |
| `SEC-01` | Chống Open Redirect: Chặn protocol-relative URL `//evil.com`         | ✔ PASS  | Tự động chuyển hướng về `/` an toàn           |
| `SEC-02` | Chống Open Redirect: Chặn escape backslash `/\evil.com`              | ✔ PASS  | Tự động chuyển hướng về `/` an toàn           |
| `SEC-03` | Chống Open Redirect: Chặn URL tuyệt đối bên ngoài `https://evil.com` | ✔ PASS  | Tự động chuyển hướng về `/` an toàn           |
| `SEC-04` | Chấp nhận URL nội bộ an toàn `/account/orders`                       | ✔ PASS  | Cho phép chuyển hướng nội bộ                  |
| `SEC-05` | Chấp nhận URL nội bộ có query string `/products?cat=sneaker`         | ✔ PASS  | Cho phép query string nội bộ                  |
| `SEC-06` | CSRF Middleware: Cho phép request `GET` an toàn không cần token      | ✔ PASS  | Phương thức đọc dữ liệu được miễn trừ         |
| `SEC-07` | CSRF Middleware: Chặn request `POST` không có token (403 Forbidden)  | ✔ PASS  | Ngăn chặn Cross-Site Request Forgery          |
| `SEC-08` | CSRF Middleware: Chấp nhận request `POST` có token hợp lệ            | ✔ PASS  | Xác thực thành công token sinh từ session     |

### PHẦN 2: TÀI KHOẢN MẪU & DANH MỤC SẢN PHẨM (11 Ca Kiểm Thử)

| Mã Test   | Mô tả ca kiểm thử                                          | Kết quả | Ghi chú kỹ thuật                 |
| --------- | ---------------------------------------------------------- | :-----: | -------------------------------- |
| `AUTH-01` | Tài khoản Admin `admin@vamos.vn` tồn tại trong CSDL        | ✔ PASS  | Đã seed vào bảng `users`         |
| `AUTH-02` | Mật khẩu Admin khớp mã băm bcrypt với `123456`             | ✔ PASS  | bcrypt.compare thành công        |
| `AUTH-03` | Tài khoản Admin có vai trò `ADMIN`                         | ✔ PASS  | Đúng vai trò phân quyền          |
| `AUTH-04` | Tài khoản Admin có trạng thái `active`                     | ✔ PASS  | Thỏa mãn ràng buộc CHECK         |
| `AUTH-05` | Tài khoản Customer `khachhang@vamos.vn` tồn tại trong CSDL | ✔ PASS  | Đã seed vào bảng `users`         |
| `AUTH-06` | Mật khẩu Customer khớp mã băm bcrypt với `123456`          | ✔ PASS  | bcrypt.compare thành công        |
| `AUTH-07` | Tài khoản Customer có vai trò `CUSTOMER`                   | ✔ PASS  | Đúng vai trò khách hàng          |
| `PROD-01` | Tối thiểu 4 danh mục sản phẩm đang hoạt động               | ✔ PASS  | Tìm thấy 4 danh mục kích hoạt    |
| `PROD-02` | Danh mục sản phẩm chứa tối thiểu 8 sản phẩm mẫu            | ✔ PASS  | Đang hoạt động trên hệ thống     |
| `PROD-03` | Bộ lọc giới tính MEN/UNISEX trả về sản phẩm tương ứng      | ✔ PASS  | Lọc dữ liệu chính xác            |
| `PROD-04` | Tồn tại các biến thể sản phẩm còn tồn kho để bán           | ✔ PASS  | Biến thể có `stock_quantity > 0` |

### PHẦN 3: GIỎ HÀNG & RÀNG BUỘC TỒN KHO (2 Ca Kiểm Thử)

| Mã Test   | Mô tả ca kiểm thử                                        | Kết quả | Ghi chú kỹ thuật            |
| --------- | -------------------------------------------------------- | :-----: | --------------------------- |
| `CART-01` | Thêm 2 sản phẩm vào giỏ hàng thử nghiệm thành công       | ✔ PASS  | Lưu vào bảng `cart_items`   |
| `CART-02` | Giới hạn số lượng giỏ hàng không vượt quá tồn kho tối đa | ✔ PASS  | Capped tại `stock_quantity` |

### PHẦN 4: VOUCHER VÀ QUY TẮC KHUYẾN MÃI (5 Ca Kiểm Thử)

| Mã Test    | Mô tả ca kiểm thử                                | Kết quả | Ghi chú kỹ thuật               |
| ---------- | ------------------------------------------------ | :-----: | ------------------------------ |
| `VOUCH-01` | Mã voucher `VAMOS50K` tồn tại và đang kích hoạt  | ✔ PASS  | Tìm thấy trong bảng `vouchers` |
| `VOUCH-02` | Giá trị đơn tối thiểu của `VAMOS50K` là 500.000đ | ✔ PASS  | Khớp cấu hình nghiệp vụ        |
| `VOUCH-03` | Mã voucher `FREESHIP` tồn tại và đang kích hoạt  | ✔ PASS  | Tìm thấy trong bảng `vouchers` |
| `VOUCH-04` | Số tiền giảm giá của `FREESHIP` là 30.000đ       | ✔ PASS  | Khớp cấu hình nghiệp vụ        |
| `VOUCH-05` | Từ chối voucher hết hạn hoặc không tồn tại       | ✔ PASS  | Loại bỏ voucher không hợp lệ   |

### PHẦN 5: GIAO DỊCH ĐẶT HÀNG COD NGUYÊN TỬ & BẢO TOÀN DỮ LIỆU (19 Ca Kiểm Thử)

| Mã Test    | Mô tả ca kiểm thử                                            | Kết quả | Ghi chú kỹ thuật                      |
| ---------- | ------------------------------------------------------------ | :-----: | ------------------------------------- |
| `CHECK-01` | Tạo đơn hàng COD thành công với mã định danh                 | ✔ PASS  | Trả về `orderId` hợp lệ               |
| `CHECK-02` | Mã đơn hàng sinh chuẩn theo định dạng `VAM{YYMMDD}-{RANDOM}` | ✔ PASS  | Bắt đầu bằng tiền tố `VAM`            |
| `CHECK-03` | Trạng thái ban đầu của đơn hàng là `PENDING`                 | ✔ PASS  | Khớp quy tắc nghiệp vụ                |
| `CHECK-04` | Phương thức thanh toán được gán là `COD`                     | ✔ PASS  | Phương thức thanh toán duy nhất       |
| `CHECK-05` | Trạng thái thanh toán ban đầu là `UNPAID`                    | ✔ PASS  | Chưa thu tiền COD                     |
| `CHECK-06` | Snapshot họ tên người nhận khớp dữ liệu đặt hàng             | ✔ PASS  | Lưu trong `recipient_name_snapshot`   |
| `CHECK-07` | Snapshot số điện thoại người nhận khớp dữ liệu đặt hàng      | ✔ PASS  | Lưu trong `recipient_phone_snapshot`  |
| `CHECK-08` | Snapshot địa chỉ giao hàng khớp dữ liệu đặt hàng             | ✔ PASS  | Lưu trong `delivery_address_snapshot` |
| `CHECK-09` | Bản ghi chi tiết đơn hàng được tạo trong `order_items`       | ✔ PASS  | Lưu chi tiết từng sản phẩm            |
| `CHECK-10` | Số lượng sản phẩm trong đơn đặt hàng chính xác               | ✔ PASS  | `quantity = 1`                        |
| `CHECK-11` | Snapshot tên sản phẩm được lưu độc lập tại thời điểm đặt     | ✔ PASS  | `product_name_snapshot`               |
| `CHECK-12` | Snapshot mã SKU được lưu độc lập                             | ✔ PASS  | `sku_snapshot`                        |
| `CHECK-13` | Snapshot kích thước giày được lưu độc lập                    | ✔ PASS  | `size_snapshot`                       |
| `CHECK-14` | Snapshot màu sắc sản phẩm được lưu độc lập                   | ✔ PASS  | `color_snapshot`                      |
| `CHECK-15` | Tồn kho biến thể bị trừ chính xác ngay trong transaction     | ✔ PASS  | Giảm đúng 1 sản phẩm                  |
| `CHECK-16` | Ghi vết xuất kho vào bảng `inventory_transactions`           | ✔ PASS  | Có bản ghi xuất kho                   |
| `CHECK-17` | Số lượng biến động xuất kho là số âm (`-1`)                  | ✔ PASS  | `change_quantity = -1`                |
| `CHECK-18` | Lượt sử dụng voucher tăng đúng 1 lần trong transaction       | ✔ PASS  | `used_count` tăng từ n lên n+1        |
| `CHECK-19` | Giỏ hàng của khách hàng tự động được dọn rỗng sau khi đặt    | ✔ PASS  | `cart_items` bị xóa sạch              |

### PHẦN 6: KHÁCH HÀNG HỦY ĐƠN & HOÀN KHO NGUYÊN TỬ (7 Ca Kiểm Thử)

| Mã Test    | Mô tả ca kiểm thử                                         | Kết quả | Ghi chú kỹ thuật                  |
| ---------- | --------------------------------------------------------- | :-----: | --------------------------------- |
| `ORDER-01` | Khách hàng hủy đơn hàng ở trạng thái `PENDING` thành công | ✔ PASS  | Cho phép tự hủy đơn chờ xử lý     |
| `ORDER-02` | Trạng thái đơn hàng cập nhật thành `CANCELLED` trong CSDL | ✔ PASS  | Cập nhật `order_status`           |
| `ORDER-03` | Tồn kho được hoàn trả đầy đủ về số lượng ban đầu          | ✔ PASS  | Phục hồi chính xác tồn kho        |
| `ORDER-04` | Ghi vết hoàn kho vào bảng `inventory_transactions`        | ✔ PASS  | Có bản ghi nhập lại kho           |
| `ORDER-05` | Số lượng biến động hoàn kho là số dương (`+1`)            | ✔ PASS  | `change_quantity = +1`            |
| `ORDER-06` | Chặn đứng hành vi hủy đơn lần 2 trên đơn đã `CANCELLED`   | ✔ PASS  | Bị từ chối ngay lập tức           |
| `ORDER-07` | Đảm bảo tồn kho KHÔNG bị hoàn trả hai lần                 | ✔ PASS  | Chống gian lận tăng khống tồn kho |

### PHẦN 7: QUẢN TRỊ VIÊN & MA TRẬN CHUYỂN TRẠNG THÁI (12 Ca Kiểm Thử)

| Mã Test    | Mô tả ca kiểm thử                                                | Kết quả | Ghi chú kỹ thuật                        |
| ---------- | ---------------------------------------------------------------- | :-----: | --------------------------------------- |
| `TRANS-01` | Ma trận từ chối bước nhảy phi logic: `PENDING -> COMPLETED`      | ✔ PASS  | Ném lỗi luồng trạng thái không cho phép |
| `ADMIN-01` | Admin cập nhật trạng thái đơn hàng sang `CONFIRMED`              | ✔ PASS  | Bước xác nhận đơn                       |
| `ADMIN-02` | Trạng thái thanh toán giữ nguyên `UNPAID` khi `CONFIRMED`        | ✔ PASS  | Chưa giao hàng thành công               |
| `ADMIN-03` | Khách hàng KHÔNG THỂ hủy đơn khi đơn đã `CONFIRMED`              | ✔ PASS  | Khóa quyền tự hủy của khách             |
| `ADMIN-04` | Admin cập nhật trạng thái đơn hàng sang `PROCESSING`             | ✔ PASS  | Bước kho đóng gói                       |
| `ADMIN-05` | Admin cập nhật trạng thái đơn hàng sang `SHIPPING`               | ✔ PASS  | Bước bàn giao vận chuyển                |
| `ADMIN-06` | Admin cập nhật trạng thái đơn hàng sang `COMPLETED`              | ✔ PASS  | Bước khách nhận hàng                    |
| `ADMIN-07` | Đơn COD tự động chuyển `payment_status = 'PAID'` khi `COMPLETED` | ✔ PASS  | Quy tắc thu tiền COD tự động            |
| `TRANS-02` | Ma trận từ chối hủy đơn đã hoàn thành: `COMPLETED -> CANCELLED`  | ✔ PASS  | Đơn đã giao không được hủy thường       |
| `ADMIN-08` | Tính toán doanh thu Admin CHỈ bao gồm đơn `COMPLETED` + `PAID`   | ✔ PASS  | Số liệu doanh thu chuẩn xác             |
| `ADMIN-09` | Đảm bảo 0 đơn hàng chưa hoàn thành bị tính là `PAID`             | ✔ PASS  | Không ghi nhận doanh thu ảo             |
| `TRANS-03` | Ma trận từ chối phục hồi đơn đã hủy: `CANCELLED -> CONFIRMED`    | ✔ PASS  | Trạng thái cuối cùng bất biến           |

### PHẦN 8: QUẢN TRỊ VIÊN HỦY ĐƠN & HOÀN KHO (2 Ca Kiểm Thử)

| Mã Test    | Mô tả ca kiểm thử                                             | Kết quả | Ghi chú kỹ thuật            |
| ---------- | ------------------------------------------------------------- | :-----: | --------------------------- |
| `ADMIN-10` | Admin hủy đơn hàng hợp lệ theo yêu cầu của khách qua tổng đài | ✔ PASS  | Cập nhật `CANCELLED`        |
| `ADMIN-11` | Tồn kho được hoàn trả chính xác sau khi Admin hủy đơn         | ✔ PASS  | Tự động hoàn kho và ghi log |

### PHẦN 9 & 10: KIỂM THỬ ĐỒNG THỜI & CHỐNG OVERSELLING / OVER-USAGE (6 Ca Kiểm Thử)

| Mã Test     | Mô tả ca kiểm thử                                                    | Kết quả | Ghi chú kỹ thuật                      |
| ----------- | -------------------------------------------------------------------- | :-----: | ------------------------------------- |
| `CONCUR-01` | 2 khách cùng mua 1 sản phẩm cuối cùng: Đúng 1 người thành công       | ✔ PASS  | Xử lý tuần tự nhờ khóa dòng           |
| `CONCUR-02` | Đúng 1 người thất bại do sản phẩm đã hết hàng                        | ✔ PASS  | Bị từ chối với mã lỗi out-of-stock    |
| `CONCUR-03` | Tồn kho sau cạnh tranh bằng đúng 0 (Tuyệt đối không âm kho)          | ✔ PASS  | Chống overselling hoàn hảo            |
| `CONCUR-04` | 2 khách cùng áp dụng voucher chỉ còn 1 lượt: Đúng 1 người thành công | ✔ PASS  | Xử lý cập nhật nguyên tử có điều kiện |
| `CONCUR-05` | Người cạnh tranh bị từ chối do voucher đã hết lượt sử dụng           | ✔ PASS  | Chặn vượt hạn mức voucher             |
| `CONCUR-06` | Số lượt dùng `used_count` bằng đúng 1 (Không vượt `usage_limit`)     | ✔ PASS  | Không bị race condition               |

---

## 3. KẾT LUẬN VÀ BẢO ĐẢM KỸ THUẬT

1. Toàn bộ 86 ca kiểm thử được thực thi trên môi trường cơ sở dữ liệu thật Microsoft SQL Server (database kiểm thử độc lập `vamos_store_test_db`).
2. Tỷ lệ thành công đạt **100% (86/86 ca kiểm thử)**.
3. Cơ sở dữ liệu phát triển chính `vamos_store_db` không bị ảnh hưởng, không phát sinh dữ liệu rác từ các ca kiểm thử cạnh tranh đồng thời.
4. Hệ thống đã sẵn sàng cho hoạt động thực tế và bảo trì lâu dài.
