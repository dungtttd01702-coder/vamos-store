# 06. DANH SÁCH VẤN ĐỀ NGHIỆP VỤ VÀ KẾT QUẢ TRIỂN KHAI (RESOLVED BUSINESS QUESTIONS)

> **Dự án:** VAMOS STORE  
> **Thương hiệu:** VAMOS - MOVE YOUR WAY.  
> **Phiên bản:** v1.1 - Đã chuẩn hóa & Triển khai toàn diện  
> **Mục đích:** Ghi nhận kết quả phân tích và tình trạng giải quyết của toàn bộ 10 câu hỏi nghiệp vụ nền tảng (Q1 đến Q10). Không còn bất kỳ câu hỏi nào ở trạng thái "Chờ duyệt".

---

## BẢNG TỔNG HỢP 10 QUYẾT ĐỊNH NGHIỆP VỤ ĐÃ TRIỂN KHAI

| STT | Vấn đề nghiệp vụ | Giải pháp chính thức được áp dụng | Trạng thái | Bằng chứng kiểm chứng mã nguồn & Test |
| :---: | :--- | :--- | :---: | :--- |
| **Q1** | **Xác minh Email khi Đăng ký** | Tài khoản đăng ký mới kích hoạt ngay (`status = 'active'`) để khách có thể mua sắm ngay lập tức. Tính năng xác thực email chuẩn bị sẵn ở kiến trúc Email Service. | **ĐÃ GIẢI QUYẾT** | `src/controllers/auth.controller.js` (`postRegister`), Test `AUTH-REG-01`. |
| **Q2** | **Giỏ hàng Khách vãng lai & Gộp giỏ** | Cho phép Guest thêm/xóa/sửa sản phẩm trong `req.session.guestCart`. Khi đăng nhập/đăng ký, hệ thống tự động gộp vào `cart_items` trong CSDL (`CartController.mergeGuestCart`). Bắt buộc đăng nhập khi checkout. | **ĐÃ GIẢI QUYẾT** | `src/controllers/cart.controller.js`, `src/controllers/auth.controller.js`, Test suite `GCART-01..03` (100% PASS). |
| **Q3** | **Cách tính Phí vận chuyển** | Áp dụng phí vận chuyển cố định toàn quốc (Flat-rate: 30,000 VNĐ) được cấu hình nội bộ. Không tích hợp API bên thứ ba ở v1.1. | **ĐÃ GIẢI QUYẾT** | `src/services/order.service.js` (`createCodOrder`), trường `shipping_fee` lưu tĩnh trong `orders`. |
| **Q4** | **Phạm vi Hủy đơn của Khách hàng** | Khách hàng **CHỈ ĐƯỢC TỰ HỦY KHI ĐƠN Ở TRẠNG THÁI `PENDING`**. Khi đơn sang `CONFIRMED` hoặc xa hơn, nút hủy bị ẩn và phải liên hệ hỗ trợ. Tự động hoàn kho và voucher. | **ĐÃ GIẢI QUYẾT** | `src/services/order.service.js` (`cancelOrderCustomer`), Test suite `OC-01..04`. |
| **Q5** | **Phân quyền Nhân sự Vận hành (Staff)** | Hợp nhất `Staff` vào `Admin` để tối giản kiến trúc phân quyền cho v1.1. Chuẩn hóa 3 Human Actors: `Guest`, `Customer`, `Admin`. Admin có toàn quyền vận hành đơn, kho, sản phẩm, voucher, khách hàng. | **ĐÃ GIẢI QUYẾT** | `database/mssql_schema.sql` (CHECK role IN ('ADMIN', 'CUSTOMER')), `src/middlewares/auth.middleware.js`. |
| **Q6** | **Quy trình Đổi / Trả hàng trực tuyến** | Thuộc phạm vi ngoài (Out-of-Scope) phiên bản v1.1. Cung cấp trang thông tin tĩnh và quy trình CSKH qua Hotline/Email ngoài hệ thống. | **ĐÃ GIẢI QUYẾT** | Tài liệu phạm vi `01-project-scope.md` ghi rõ Out of Scope. |
| **Q7** | **Gửi Email Xác nhận Đặt hàng** | Thiết kế theo mô hình Graceful Degradation: Nếu có cấu hình SMTP thì gửi email bất đồng bộ; nếu không có hoặc lỗi mạng thì hệ thống ghi log và tiếp tục hoàn tất đơn hàng mà không ngắt luồng. | **ĐÃ GIẢI QUYẾT** | `src/services/order.service.js` (`createCodOrder`), cơ chế `try/catch` an toàn không chặn transaction. |
| **Q8** | **Giới hạn Sử dụng Mã giảm giá** | Mỗi tài khoản khách hàng chỉ được áp dụng 01 voucher tối đa 01 lần duy nhất trong toàn hệ thống. Thêm bảng `voucher_usages` với `UNIQUE(voucher_id, user_id)`. Khi đơn bị hủy, tự động mở khóa hoàn lại lượt dùng. | **ĐÃ GIẢI QUYẾT** | `database/migrations/003_voucher_customer_usage.sql`, `src/services/order.service.js`, Test suite `Q8-01..06` (100% PASS). |
| **Q9** | **Cảnh báo Sắp hết hàng (Low Stock)** | Cấu hình ngưỡng toàn hệ thống `LOW_STOCK_THRESHOLD = 5`. Hiển thị badge cảnh báo trên danh sách sản phẩm và màn hình Quản lý tồn kho `/admin/inventory`. | **ĐÃ GIẢI QUYẾT** | `src/controllers/admin.controller.js` (`getInventory`), view `src/views/pages/admin/inventory.pug`. |
| **Q10** | **Admin Chỉnh sửa Giá sản phẩm** | Cho phép Admin chỉnh sửa giá bất kỳ lúc nào vì hệ thống lưu Snapshot bất biến (`unit_price`, `product_name_snapshot`, `sku_snapshot`, `size_snapshot`, `color_snapshot`) trong `order_items`. Đơn hàng cũ tuyệt đối không bị ảnh hưởng. | **ĐÃ GIẢI QUYẾT** | `database/mssql_schema.sql`, `src/services/order.service.js`, Test suite `OSNAP-01..02`. |

---

## KẾT LUẬN

Toàn bộ 10 bài toán nghiệp vụ nền tảng đã được hoàn thiện từ tầng Database, Business Logic (Services/Controllers), Giao diện người dùng (Views/Pug), đến Hệ thống kiểm thử tự động (Regression Suites). Không còn bất kỳ rủi ro hay sự mơ hồ nào về đặc tả vận hành của VAMOS STORE v1.1.
