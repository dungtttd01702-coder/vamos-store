# LỜI CẢM ƠN

Lời đầu tiên, chúng em xin gửi lời cảm ơn chân thành và sâu sắc nhất đến Ban Giám hiệu, quý Thầy Cô Bộ môn Công nghệ Thông tin – Trường Cao đẳng Thực hành FPT Polytechnic đã tận tình truyền đạt những kiến thức chuyên môn, kỹ năng lập trình và kinh nghiệm thực tiễn quý báu trong suốt quá trình chúng em học tập và rèn luyện tại trường.

Đặc biệt, nhóm chúng em xin bày tỏ lòng biết ơn sâu sắc đến Giảng viên hướng dẫn **ThS. Hoàng Hà**, người đã luôn tận tâm theo sát, định hướng chuyên môn, chỉ dẫn phương pháp phân tích thiết kế hệ thống và đưa ra những đóng góp vô cùng xác đáng để nhóm có thể hoàn thiện đề tài **"Xây dựng Website bán giày dép VAMOS STORE"** một cách tốt nhất.

Chúng em cũng xin gửi lời tri ân chân thành đến gia đình, người thân và bạn bè đã luôn là nguồn động viên tinh thần, hỗ trợ và đồng hành cùng chúng em vượt qua những giai đoạn khó khăn trong học tập.

Dù đã nỗ lực hết mình với tinh thần trách nhiệm cao nhất, song do kiến thức và kinh nghiệm thực tế còn hạn chế, báo cáo dự án của chúng em khó tránh khỏi những thiếu sót nhất định. Nhóm chúng em rất mong nhận được những ý kiến đóng góp, chỉ dẫn quý báu từ Hội đồng Giám khảo và quý Thầy Cô để hệ thống VAMOS STORE ngày càng được hoàn thiện và có tính ứng dụng cao hơn trong thực tiễn.

*Chúng em xin chân thành cảm ơn!*

---

# LỜI CAM KẾT

Thay mặt nhóm thực hiện đề tài đồ án tốt nghiệp, tôi - **Trần Trung Dũng**, trưởng nhóm, xin cam kết:

1. Báo cáo dự án với đề tài **"Xây dựng Website bán giày dép VAMOS STORE"** là công trình nghiên cứu, phân tích, thiết kế và phát triển độc lập của các thành viên trong nhóm, dưới sự hướng dẫn trực tiếp của Giảng viên **ThS. Hoàng Hà**.
2. Toàn bộ các số liệu, sơ đồ thiết kế (Use Case, ERD, Activity Diagram, Wireframe), mã nguồn và kết quả kiểm thử được trình bày trong báo cáo này là trung thực, phản ánh đúng quá trình thực hiện dự án thực tế của nhóm, không sao chép trái phép từ bất kỳ công trình nào khác.
3. Các đoạn mã nguồn tham khảo từ các thư viện mã nguồn mở, tài liệu kỹ thuật của cộng đồng (Node.js, Express.js, MySQL, Pug, Tailwind CSS) đều được trích dẫn nguồn gốc rõ ràng theo đúng quy định học thuật.
4. Nhóm xin chịu hoàn toàn trách nhiệm trước Nhà trường, Bộ môn Công nghệ Thông tin và Pháp luật nếu xảy ra bất kỳ sự vi phạm nào liên quan đến quyền sở hữu trí tuệ và tính liêm chính học thuật.

*Đà Nẵng, ngày 10 tháng 12 năm 2026*  
**Thay mặt nhóm sinh viên thực hiện**  
*Trưởng nhóm*  
**(Đã ký)**  
**Trần Trung Dũng**

---

# MỤC LỤC

* **LỜI CẢM ƠN** ................................................................................................................................. 1
* **LỜI CAM KẾT** ................................................................................................................................ 2
* **MỤC LỤC** ...................................................................................................................................... 3
* **DANH MỤC HÌNH ẢNH** ................................................................................................................ 5
* **DANH MỤC BẢNG BIỂU** .............................................................................................................. 6
* **DANH MỤC THUẬT NGỮ VÀ TỪ VIẾT TẮT** ................................................................................. 7
* **PHẦN MỞ ĐẦU** .......................................................................................................................... 8
  * 1. Phân tích hiện trạng .................................................................................................................. 8
  * 2. Mục đích ................................................................................................................................... 8
  * 3. Mục tiêu hệ thống ...................................................................................................................... 8
  * 4. Tính năng cơ bản của hệ thống .................................................................................................. 9
  * 5. Đối tượng sử dụng .................................................................................................................... 9
  * 6. Công nghệ dùng để phát triển dự án ........................................................................................ 10
  * 7. Lập kế hoạch dự án .................................................................................................................. 10
* **CHƯƠNG I: CƠ SỞ LÝ THUYẾT** .............................................................................................. 12
  * 1. Mô hình công nghệ Client - Server ........................................................................................... 12
  * 2. Ngôn ngữ JavaScript & Nền tảng Node.js ................................................................................ 13
  * 3. Framework Express.js ............................................................................................................... 14
  * 4. Mô hình MVC và Kiến trúc phân lớp ........................................................................................ 15
  * 5. Template Engine Pug ............................................................................................................... 17
  * 6. CSS Framework Tailwind CSS .................................................................................................. 18
  * 7. Cơ sở dữ liệu: MySQL 8.0 ......................................................................................................... 19
  * 8. Cơ chế xác thực Session và Bảo mật Bcrypt ............................................................................. 20
  * 9. Công nghệ Container Docker & Docker Compose ................................................................... 21
* **CHƯƠNG II: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG** ............................................................... 22
  * 1. Phân tích nghiệp vụ ................................................................................................................. 22
  * 2. Thiết kế hệ thống ..................................................................................................................... 23
    * 2.1. Sơ đồ Use Case ................................................................................................................... 23
    * 2.2. Sơ đồ điều hướng màn hình (Sitemap) ................................................................................. 29
    * 2.3. Mô hình thực thể quan hệ - ERD .......................................................................................... 30
    * 2.4. Từ điển dữ liệu chi tiết (Data Dictionary) ............................................................................ 32
    * 2.5. Sơ đồ hoạt động (Activity Diagram) .................................................................................... 45
  * 3. Thiết kế giao diện và đặc tả (Wireframe) ................................................................................. 50
* **CHƯƠNG III: TRIỂN KHAI MÃ NGUỒN** ................................................................................... 64
  * 1. Cấu trúc mã nguồn dự án .......................................................................................................... 64
  * 2. Kết nối và quản trị cơ sở dữ liệu .............................................................................................. 65
  * 3. Triển khai các tính năng chính ................................................................................................. 66
* **CHƯƠNG IV: KIỂM THỬ** .......................................................................................................... 80
  * 1. Kế hoạch kiểm thử .................................................................................................................... 80
  * 2. Ma trận các ca kiểm thử chi tiết ................................................................................................ 80
  * 3. Báo cáo kết quả và đánh giá chất lượng ................................................................................. 83
* **CHƯƠNG V: KẾ HOẠCH TRIỂN KHAI VÀ HƯỚNG DẪN CÀI ĐẶT** .......................................... 84
* **CHƯƠNG VI: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN** ................................................................. 87
* **TÀI LIỆU THAM KHẢO** ............................................................................................................ 90

---

# DANH MỤC HÌNH ẢNH

* Hình 1: Mô hình Client - Server trong ứng dụng web ................................................................... 12
* Hình 2: Mô hình kiến trúc MVC phân lớp .................................................................................... 15
* Hình 3: Luồng xử lý một Request trong kiến trúc phân lớp ......................................................... 16
* Hình 4: Chi tiết cấu trúc tầng trong kiến trúc phân lớp VAMOS STORE ....................................... 17
* Hình 5: Sơ đồ Use Case tổng quát VAMOS STORE ...................................................................... 23
* Hình 6: Sơ đồ Use Case chi tiết Đặt hàng COD ........................................................................... 25
* Hình 7: Sơ đồ Use Case chi tiết Quản lý đơn hàng & Kho Admin ................................................ 26
* Hình 8: Sơ đồ điều hướng màn hình (Sitemap) ........................................................................... 29
* Hình 9: Mô hình thực thể quan hệ (ERD 18 bảng) - VAMOS STORE .......................................... 30
* Hình 10: Sơ đồ hoạt động (Activity) - Quy trình Đăng ký & Đăng nhập ........................................ 45
* Hình 11: Sơ đồ hoạt động (Activity) - Mua hàng & Đặt hàng COD ............................................... 46
* Hình 12: Sơ đồ hoạt động (Activity) - Máy trạng thái xử lý đơn hàng .......................................... 47
* Hình 13: Sơ đồ hoạt động (Activity) - Hủy đơn hàng và Hoàn kho tự động ................................... 48
* Hình 14: Sơ đồ hoạt động (Activity) - Admin kiểm kê và điều chỉnh kho ...................................... 49
* Hình 17: Giao diện Trang chủ (Home Page) ................................................................................. 51
* Hình 18: Giao diện Cửa hàng & Bộ lọc đa tiêu chí (Shop & Filter) ............................................. 53
* Hình 19: Giao diện Chi tiết sản phẩm & Chọn Size/Màu .............................................................. 55
* Hình 20: Giao diện Giỏ hàng trực tuyến (Shopping Cart) ............................................................ 57
* Hình 21: Giao diện Đặt hàng COD (Checkout) ............................................................................ 59
* Hình 22: Giao diện Đăng ký / Đăng nhập tài khoản ..................................................................... 61
* Hình 23: Giao diện Lịch sử đơn hàng của khách .......................................................................... 62
* Hình 24: Giao diện Admin Dashboard tổng quan .......................................................................... 63
* Hình 25: Giao diện Admin Quản lý sản phẩm & Biến thể ............................................................. 64
* Hình 26: Giao diện Admin Vận hành đơn hàng ............................................................................ 65

---

# DANH MỤC BẢNG BIỂU

* Bảng 1: Bảng tiến độ triển khai dự án qua 5 giai đoạn ................................................................. 10
* Bảng 2: Ma trận phân quyền các Actor trong VAMOS STORE ...................................................... 22
* Bảng 3: Từ điển dữ liệu bảng `users` (Tài khoản người dùng) .................................................... 33
* Bảng 4: Từ điển dữ liệu bảng `addresses` (Sổ địa chỉ giao hàng) ................................................ 33
* Bảng 5: Từ điển dữ liệu bảng `categories` (Danh mục giày) ......................................................... 34
* Bảng 6: Từ điển dữ liệu bảng `brands` (Thương hiệu giày) ........................................................... 34
* Bảng 7: Từ điển dữ liệu bảng `products` (Sản phẩm giày gốc) .................................................... 35
* Bảng 8: Từ điển dữ liệu bảng `product_images` (Bộ sưu tập ảnh) ................................................ 35
* Bảng 9: Từ điển dữ liệu bảng `sizes` (Kích cỡ giày sneaker) ....................................................... 36
* Bảng 10: Từ điển dữ liệu bảng `colors` (Màu sắc giày sneaker) .................................................. 36
* Bảng 11: Từ điển dữ liệu bảng `product_variants` (Biến thể SKU và Tồn kho) .......................... 37
* Bảng 12: Từ điển dữ liệu bảng `inventory_transactions` (Lịch sử biến động kho) ...................... 38
* Bảng 13: Từ điển dữ liệu bảng `carts` (Giỏ hàng của khách hàng) .............................................. 39
* Bảng 14: Từ điển dữ liệu bảng `cart_items` (Chi tiết các mặt hàng trong giỏ) ............................ 39
* Bảng 15: Từ điển dữ liệu bảng `vouchers` (Mã giảm giá khuyến mãi) .......................................... 40
* Bảng 16: Từ điển dữ liệu bảng `orders` (Thông tin tổng quát đơn hàng) ...................................... 41
* Bảng 17: Từ điển dữ liệu bảng `order_items` (Snapshot chi tiết từng món hàng đặt) .................. 42
* Bảng 18: Từ điển dữ liệu bảng `order_status_histories` (Lịch sử chuyển đổi trạng thái đơn) ....... 43
* Bảng 19: Từ điển dữ liệu bảng `password_reset_tokens` (Mã khôi phục mật khẩu) .................... 43
* Bảng 20: Từ điển dữ liệu bảng `banners` (Banner sự kiện trên trang chủ) .................................. 44
* Bảng 21: Bảng kết quả thực thi các ca kiểm thử hệ thống VAMOS STORE ................................... 81

---

# DANH MỤC THUẬT NGỮ VÀ TỪ VIẾT TẮT

| Thuật ngữ / Viết tắt | Tên tiếng Anh đầy đủ | Ý nghĩa và giải thích trong hệ thống |
| :--- | :--- | :--- |
| **COD** | Cash On Delivery | Hình thức thanh toán bằng tiền mặt khi nhận hàng. |
| **SSR** | Server-Side Rendering | Cơ chế biên dịch giao diện HTML trực tiếp trên máy chủ trước khi gửi về client. |
| **MVC** | Model - View - Controller | Mô hình kiến trúc phân tách giữa Dữ liệu, Giao diện và Điều khiển luồng. |
| **ERD** | Entity-Relationship Diagram | Sơ đồ biểu diễn mô hình thực thể và mối quan hệ giữa các bảng cơ sở dữ liệu. |
| **SKU** | Stock Keeping Unit | Mã định danh duy nhất cho từng phân loại biến thể sản phẩm (Size + Màu). |
| **ACID** | Atomicity, Consistency, Isolation, Durability | 4 đặc tính toàn vẹn bắt buộc của các giao dịch cơ sở dữ liệu (Transaction). |
| **Bcrypt** | Blowfish Cryptographic Hash Function | Thuật toán băm mật khẩu một chiều có kèm muối (Salt) chống tấn công Rainbow Table. |
| **Pug** | Pug Template Engine (trước đây là Jade) | Công cụ tạo mẫu HTML dựa trên cấu trúc thụt lề cho môi trường Node.js. |
| **Tailwind CSS** | Utility-First CSS Framework | Thư viện CSS cung cấp các class tiện ích nguyên tử giúp tùy biến giao diện nhanh chóng. |
| **DTO** | Data Transfer Object | Đối tượng vận chuyển dữ liệu giữa các tầng kiến trúc trong ứng dụng. |
