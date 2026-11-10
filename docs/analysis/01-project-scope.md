# 01. PHẠM VI NGHIỆP VỤ DỰ ÁN (PROJECT SCOPE)

> **Tên dự án:** VAMOS STORE  
> **Thương hiệu:** VAMOS  
> **Slogan:** MOVE YOUR WAY.  
> **Loại hệ thống:** Website Thương mại điện tử kinh doanh giày dép và phụ kiện  
> **Giai đoạn:** Phân tích và Thiết kế Use Case (Analysis & Use Case Design)  
> **Phiên bản tài liệu:** 1.0

---

## 1. TỔNG QUAN VÀ BỐI CẢNH DỰ ÁN

### 1.1. Giới thiệu

**VAMOS STORE** là nền tảng thương mại điện tử chuyên kinh doanh giày dép (Sneaker, Thể thao, Chạy bộ, Sandal, Dép, Thời trang) và các phụ kiện chăm sóc giày. Nền tảng hướng tới phong cách trẻ trung, năng động, tối giản và hiện đại ("MOVE YOUR WAY."), mang lại trải nghiệm duyệt sản phẩm mượt mà và luồng mua sắm trực quan cho khách hàng.

### 1.2. Mô hình tham chiếu và Nguyên tắc độc lập thương hiệu

- **Tham khảo mô hình nghiệp vụ:** Dự án tham khảo cấu trúc trải nghiệm người dùng từ các website thương mại điện tử giày dép tiêu biểu tại Việt Nam (như Biti's), cụ thể là:
  - Phân loại danh mục theo Giới tính (Nam, Nữ, Trẻ em, Unisex) và Dòng sản phẩm.
  - Bộ lọc kết hợp đa tiêu chí: Giới tính, Size, Màu sắc, Khoảng giá, Trạng thái khuyến mãi.
  - Quản lý sản phẩm đa biến thể (Size x Color x SKU).
  - Trải nghiệm giỏ hàng, đặt hàng thu tiền hộ (COD) và tra cứu tiến trình đơn hàng.
- **Ranh giới thương hiệu độc lập:**
  - Tên thương hiệu: **VAMOS**, website: **VAMOS STORE**.
  - Không sao chép logo, hình ảnh, mã sản phẩm, nội dung mô tả hoặc thiết kế độc quyền của Biti's hay bất kỳ thương hiệu nào khác.
  - Toàn bộ dữ liệu sản phẩm, hình ảnh và tài sản số được tạo dựng độc lập theo định hướng phong cách riêng của VAMOS.

---

## 2. PHÂN TÍCH PHẠM VI HỆ THỐNG (SYSTEM SCOPE)

### 2.1. Phạm vi trong phiên bản đầu tiên (In Scope - Version 1.0)

| Nhóm chức năng                       | Các hạng mục trong phạm vi                                                                                                                                                                                                |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Trang chủ & Điều hướng**           | Banner thương hiệu VAMOS, danh mục nổi bật, sản phẩm mới, sản phẩm bán chạy, sản phẩm khuyến mãi, thông tin giao hàng & hỗ trợ.                                                                                           |
| **Khám phá sản phẩm**                | Danh sách sản phẩm phân trang, tìm kiếm theo tên/mã sản phẩm, bộ lọc kết hợp (danh mục, giới tính, khoảng giá, size, màu, sale), sắp xếp (giá, mới nhất, tên A-Z, phổ biến).                                              |
| **Chi tiết sản phẩm**                | Tên, mã SP, mô tả, bộ ảnh sản phẩm, chọn màu sắc & kích cỡ, trạng thái tồn kho theo từng biến thể, số lượng, sản phẩm liên quan.                                                                                          |
| **Quản lý biến thể & kho**           | Biến thể kích cỡ (Size), màu sắc (Color), mã SKU duy nhất, quản lý số lượng tồn kho theo biến thể, lịch sử điều chỉnh kho có lý do, cảnh báo tồn kho thấp.                                                                |
| **Tài khoản & Xác thực**             | Đăng ký, đăng nhập, đăng xuất, quên/đặt lại mật khẩu (dùng token an toàn), xem/cập nhật thông tin cá nhân, đổi mật khẩu, quản lý nhiều địa chỉ nhận hàng.                                                                 |
| **Giỏ hàng**                         | Thêm biến thể sản phẩm, cập nhật số lượng (chặn vượt tồn kho), xóa dòng sản phẩm, kiểm tra tồn kho theo thời gian thực trước khi thanh toán.                                                                              |
| **Đặt hàng & Thanh toán**            | Chọn địa chỉ giao hàng, nhập ghi chú đơn hàng, áp dụng mã giảm giá (voucher hợp lệ), tính toán tạm tính/giảm giá/phí giao hàng/tổng thanh toán, phương thức thanh toán COD (Cash On Delivery) trong database transaction. |
| **Xử lý đơn hàng (Customer)**        | Xem lịch sử đơn hàng, xem chi tiết đơn hàng (lưu snapshot thông tin SP tại thời điểm mua), theo dõi dòng thời gian trạng thái, hủy đơn hàng (khi đơn ở trạng thái PENDING).                                               |
| **Vận hành đơn hàng (Staff/Admin)**  | Tìm kiếm & lọc đơn hàng, xem chi tiết đơn, xác nhận đơn (PENDING → CONFIRMED), cập nhật trạng thái đơn hàng (CONFIRMED → PROCESSING → SHIPPING → COMPLETED), hủy đơn nội bộ có hoàn kho tự động một lần duy nhất.         |
| **Quản trị sản phẩm & danh mục**     | CRUD sản phẩm, quản lý danh mục, quản lý bộ sưu tập/nhãn nội bộ VAMOS, quản lý ảnh sản phẩm, ẩn/hiện sản phẩm kinh doanh.                                                                                                 |
| **Quản lý Voucher & Khuyến mãi**     | Tạo và cấu hình mã giảm giá (giảm % hoặc giảm tiền mặt, đơn tối thiểu, hạn sử dụng, giới hạn lượt dùng), kích hoạt/vô hiệu hóa voucher. Tối đa 1 voucher/đơn.                                                             |
| **Quản trị người dùng & Phân quyền** | Quản lý khách hàng (xem lịch sử mua, khóa/mở khóa), quản lý tài khoản nhân viên (Staff), phân quyền chức năng cho Staff. Staff bị giới hạn quyền tại máy chủ.                                                             |
| **Dashboard & Báo cáo**              | Thống kê số lượng đơn theo trạng thái, doanh thu theo thời gian (chỉ ghi nhận từ đơn COMPLETED), top sản phẩm bán chạy, sản phẩm tồn kho thấp.                                                                            |

### 2.2. Phạm vi ngoài phiên bản đầu tiên (Out of Scope - Version 1.0)

Tuyệt đối **không** thiết kế Use Case, không vẽ sơ đồ và không lập trình cho các chức năng sau:

1. Ứng dụng di động độc lập (Native iOS / Android app) — Hệ thống tập trung làm Web Responsive cho Desktop, Tablet và Mobile browser.
2. Cổng thanh toán trực tuyến thực tế (VNPAY, MoMo, ZaloPay, thẻ tín dụng/quốc tế qua Stripe/PayPal) — Phiên bản 1.0 tập trung duy nhất phương thức thanh toán khi nhận hàng (COD).
3. Tích hợp API tự động với các đơn vị vận chuyển bên ngoài (Giao Hàng Nhanh, Giao Hàng Tiết Kiệm, Viettel Post) — Phí vận chuyển áp dụng mức cố định được cấu hình nội bộ.
4. Hệ thống Chat trực tiếp thời gian thực (Real-time livechat / Chatbot AI).
5. Tính năng Livestream bán hàng.
6. Hệ thống tích điểm thưởng / hạng thành viên nâng cao (Loyalty tier system).
7. Đánh giá sản phẩm công khai kèm bình luận / Hỏi đáp (Q&A/Review) tại trang sản phẩm.
8. Gợi ý sản phẩm bằng thuật toán Học máy / Trí tuệ nhân tạo (AI Recommendation Engine).
9. Quản lý mạng lưới đa chi nhánh, đa kho hàng độc lập (Multi-warehouse / Multi-branch inventory).
10. Tích hợp phần mềm ERP, hệ thống kế toán doanh nghiệp bên thứ ba.

---

## 3. RÀNG BUỘC KỸ THUẬT VÀ PHI CHỨC NĂNG CỐT LÕI

- **Bảo mật:** Mật khẩu bắt buộc hash (bcrypt/Argon2); chống SQL Injection (Prepared Statements); phân quyền kiểm soát chặt chẽ ở phía Server-side Middleware.
- **Tính toàn vẹn giao dịch (ACID):** Thao tác đặt hàng, trừ kho, hủy đơn hoàn kho phải chạy trong Database Transaction để triệt tiêu hiện tượng Race Condition (bán vượt tồn kho khi nhiều khách đặt cùng lúc).
- **Snapshot dữ liệu đơn hàng:** Đơn giá, tên sản phẩm, SKU, Size, Màu tại thời điểm mua phải được lưu tĩnh trong `order_items` để bảo toàn dữ liệu lịch sử khi Admin cập nhật giá hay thông tin sản phẩm sau này.
