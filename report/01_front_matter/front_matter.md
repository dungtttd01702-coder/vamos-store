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
3. Các đoạn mã nguồn tham khảo từ các thư viện mã nguồn mở, tài liệu kỹ thuật của cộng đồng (Node.js, Express.js, Microsoft SQL Server 2022, Pug, Tailwind CSS) đều được trích dẫn nguồn gốc rõ ràng theo đúng quy định học thuật.
4. Nhóm xin chịu hoàn toàn trách nhiệm trước Nhà trường, Bộ môn Công nghệ Thông tin và Pháp luật nếu xảy ra bất kỳ sự vi phạm nào liên quan đến quyền sở hữu trí tuệ và tính liêm chính học thuật.

*Đà Nẵng, ngày 10 tháng 12 năm 2026*  
**Thay mặt nhóm sinh viên thực hiện**  
*Trưởng nhóm*  

*(Ký và ghi rõ họ tên)*  
**Trần Trung Dũng**

---

# MỤC LỤC

* **LỜI CẢM ƠN** ................................................................................................................................. 2
* **LỜI CAM KẾT** ................................................................................................................................ 3
* **MỤC LỤC** ...................................................................................................................................... 4
* **DANH MỤC HÌNH ẢNH** ................................................................................................................ 7
* **DANH MỤC BẢNG BIỂU** .............................................................................................................. 9
* **DANH MỤC THUẬT NGỮ VÀ TỪ VIẾT TẮT** ................................................................................. 11
* **PHẦN MỞ ĐẦU** .......................................................................................................................... 12
  * 1. Phân tích hiện trạng .................................................................................................................. 12
  * 2. Mục đích ................................................................................................................................... 12
  * 3. Mục tiêu hệ thống ...................................................................................................................... 13
  * 4. Tính năng cơ bản của hệ thống .................................................................................................. 13
  * 5. Đối tượng sử dụng .................................................................................................................... 14
  * 6. Công nghệ dùng để phát triển dự án ........................................................................................ 15
  * 7. Lập kế hoạch dự án .................................................................................................................. 15
* **CHƯƠNG I: CƠ SỞ LÝ THUYẾT** .............................................................................................. 19
  * 1. Mô hình công nghệ Client - Server ........................................................................................... 19
  * 2. Ngôn ngữ JavaScript & Nền tảng Node.js ................................................................................ 20
  * 3. Framework Express.js ............................................................................................................... 21
  * 4. Mô hình MVC và Kiến trúc phân lớp ........................................................................................ 21
  * 5. Template Engine Pug ............................................................................................................... 23
  * 6. CSS Framework Tailwind CSS .................................................................................................. 23
  * 7. Cơ sở dữ liệu: Microsoft SQL Server 2022 ................................................................................ 24
  * 8. Cơ chế xác thực Session và Bảo mật Bcrypt ............................................................................. 24
  * 9. Công nghệ Container Docker & Docker Compose ................................................................... 25
* **CHƯƠNG II: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG** ............................................................... 26
  * 1. Phân tích nghiệp vụ ................................................................................................................. 26
    * 1.1. Nghiệp vụ của Khách vãng lai (Guest) ................................................................................. 26
    * 1.2. Nghiệp vụ của Khách hàng thành viên (Customer) .............................................................. 26
    * 1.3. Nghiệp vụ của Quản trị viên (Admin) ................................................................................. 27
    * 1.4. Ma trận phân quyền các tác nhân (Actor Permissions Matrix) ........................................... 28
  * 2. Thiết kế hệ thống ..................................................................................................................... 29
    * 2.1. Sơ đồ Use Case (Use Case Diagrams) ................................................................................... 29
    * 2.2. Sơ đồ điều hướng màn hình (Sitemap) ................................................................................. 34
    * 2.3. Mô hình thực thể quan hệ - ERD .......................................................................................... 34
    * 2.4. Từ điển dữ liệu chi tiết (Data Dictionary) ............................................................................ 35
    * 2.5. Sơ đồ hoạt động (Activity Diagram) .................................................................................... 53
  * 3. Thiết kế giao diện và đặc tả (Wireframe) ................................................................................. 55
* **CHƯƠNG III: TRIỂN KHAI MÃ NGUỒN** ................................................................................... 70
  * 1. Cấu trúc mã nguồn dự án .......................................................................................................... 70
  * 2. Kết nối và quản trị cơ sở dữ liệu .............................................................................................. 72
  * 3. Triển khai các tính năng chính ................................................................................................. 72
* **CHƯƠNG IV: KIỂM THỬ HỆ THỐNG** ....................................................................................... 79
  * 1. Kế hoạch kiểm thử .................................................................................................................... 79
  * 2. Ma trận các ca kiểm thử chi tiết ................................................................................................ 80
  * 3. Báo cáo kết quả và đánh giá chất lượng ................................................................................. 84
* **CHƯƠNG V: KẾ HOẠCH TRIỂN KHAI VÀ HƯỚNG DẪN CÀI ĐẶT** .......................................... 87
* **CHƯƠNG VI: HẠN CHẾ VÀ HƯỚNG PHÁT TRIỂN** ................................................................. 93
* **TÀI LIỆU THAM KHẢO** ............................................................................................................ 96

---

# DANH MỤC HÌNH ẢNH

* Hình 1: Mô hình Client - Server trong ứng dụng web ................................................................... 19
* Hình 2: Mô hình kiến trúc MVC phân lớp .................................................................................... 22
* Hình 3: Luồng xử lý một Request trong kiến trúc phân lớp ......................................................... 22
* Hình 4: Chi tiết cấu trúc tầng trong kiến trúc phân lớp VAMOS STORE ....................................... 23
* Hình 5: Sơ đồ Use Case tổng quát VAMOS STORE ...................................................................... 29
* Hình 6: Sơ đồ Use Case chi tiết Đặt hàng COD ........................................................................... 30
* Hình 7: Sơ đồ Use Case chi tiết Vận hành đơn hàng và Kho hàng Admin .................................... 30
* Hình 8: Sơ đồ điều hướng màn hình (Sitemap) VAMOS STORE .................................................. 34
* Hình 9: Mô hình thực thể quan hệ (ERD 20 bảng nghiệp vụ) - VAMOS STORE ........................... 34
* Hình 10: Sơ đồ hoạt động - Quy trình Đăng ký & Đăng nhập ........................................................ 53
* Hình 11: Sơ đồ hoạt động - Quy trình Mua hàng & Đặt hàng COD ............................................... 54
* Hình 12: Sơ đồ hoạt động - Máy trạng thái xử lý đơn hàng Admin ................................................. 54
* Hình 13: Sơ đồ hoạt động - Hủy đơn hàng và Hoàn kho tự động ................................................... 55
* Hình 14: Sơ đồ hoạt động - Admin kiểm kê và điều chỉnh tồn kho ................................................. 55
* Hình 15: Giao diện Trang chủ (Home Page) VAMOS STORE ......................................................... 58
* Hình 16: Giao diện Cửa hàng & Bộ lọc đa tiêu chí (Shop & Filter) ............................................. 59
* Hình 17: Giao diện Chi tiết sản phẩm & Chọn Size/Màu ................................................................ 61
* Hình 18: Giao diện Giỏ hàng trực tuyến (Shopping Cart) ............................................................ 61
* Hình 19: Giao diện Đặt hàng COD (Checkout) ............................................................................ 62
* Hình 20: Giao diện Đăng ký / Đăng nhập tài khoản ...................................................................... 63
* Hình 21: Giao diện Lịch sử đơn hàng của khách hàng ................................................................. 64
* Hình 22: Giao diện Admin Dashboard tổng quan ......................................................................... 66
* Hình 23: Giao diện Admin Quản lý sản phẩm & Biến thể ............................................................ 67
* Hình 24: Giao diện Admin Vận hành và xử lý đơn hàng .............................................................. 69

---

# DANH MỤC BẢNG BIỂU

* Bảng 1: Lập kế hoạch dự án VAMOS STORE .............................................................................. 18
* Bảng 2: Ma trận phân quyền các Actor trong VAMOS STORE ...................................................... 28
* Bảng 3: Danh sách 14 Use Case nghiệp vụ hệ thống VAMOS STORE ........................................... 33
* Bảng 4: Thực thể users (Tài khoản người dùng) .......................................................................... 35
* Bảng 5: Thực thể categories (Danh mục sản phẩm) .................................................................... 35
* Bảng 6: Thực thể brands (Thương hiệu sản phẩm) ...................................................................... 36
* Bảng 7: Thực thể sizes (Kích cỡ giày sneaker) ............................................................................. 36
* Bảng 8: Thực thể colors (Màu sắc giày sneaker) .......................................................................... 37
* Bảng 9: Thực thể vouchers (Mã giảm giá khuyến mãi) ................................................................. 37
* Bảng 10: Thực thể banners (Banner quảng bá trang chủ) ............................................................. 38
* Bảng 11: Thực thể addresses (Sổ địa chỉ nhận hàng) ................................................................... 39
* Bảng 12: Thực thể password_reset_tokens (Token khôi phục mật khẩu) ..................................... 41
* Bảng 13: Thực thể carts (Giỏ hàng trực tuyến) ............................................................................ 41
* Bảng 14: Thực thể products (Sản phẩm giày gốc) ........................................................................ 42
* Bảng 15: Thực thể product_images (Bộ sưu tập ảnh sản phẩm) ................................................... 44
* Bảng 16: Thực thể product_variants (Biến thể SKU và Tồn kho) ................................................. 44
* Bảng 17: Thực thể cart_items (Chi tiết mặt hàng trong giỏ) ........................................................ 45
* Bảng 18: Thực thể orders (Thông tin tổng quát đơn hàng) ........................................................... 46
* Bảng 19: Thực thể order_items (Snapshot chi tiết từng món hàng đặt) ....................................... 48
* Bảng 20: Thực thể order_status_histories (Nhật ký chuyển đổi trạng thái đơn) ........................... 49
* Bảng 21: Thực thể inventory_transactions (Lịch sử biến động thẻ kho) ...................................... 50
* Bảng 22: Thực thể voucher_usages (Nhật ký sử dụng mã giảm giá) ............................................ 52
* Bảng 23: Thực thể wishlist_items (Danh sách sản phẩm yêu thích) ............................................. 52
* Bảng 24: Ma trận 25 ca kiểm thử chức năng thiết kế (Functional Test Cases) .............................. 84
* Bảng 25: Kết quả thực thi kiểm thử tự động hệ thống (Automated Test Suites) ........................... 85

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
