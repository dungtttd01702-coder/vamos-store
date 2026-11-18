# TỔNG HỢP CÂU HỎI VÀ ĐÁP ÁN BẢO VỆ ĐỒ ÁN
# CHUYÊN ĐỀ PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG VAMOS STORE

**Đơn vị:** Trường Cao đẳng Thực hành FPT Polytechnic  
**Chuyên ngành:** Phát triển Phần mềm / Công nghệ Thông tin  
**Bộ tài liệu:** Cẩm nang Hỏi – Đáp Phản biện (Defense Q&A Handbook)  
**Mục tiêu:** Cung cấp câu trả lời ngắn gọn, đúng trọng tâm, giải thích sâu sắc về kỹ thuật và bám sát 100% mã nguồn Node.js cùng CSDL SQL Server 2022 của dự án VAMOS STORE.

---

## TÀI LIỆU TRA CỨU CHUYÊN SÂU DÀNH CHO SINH VIÊN
> **Lưu ý quan trọng cho sinh viên khi ôn tập:**
> Đối với phần Cơ sở dữ liệu (ERD), nhóm đã biên soạn một tệp tài liệu nghiên cứu độc lập tại:
> `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/05_TAI_LIEU_NGHIEN_CUU_ERD/PHAN_TICH_CHI_TIET_ERD_VAMOS_STORE.md`
> Tài liệu này phân tích chi tiết toàn bộ 20 bảng, 153 thuộc tính, 8 nhóm liên kết quan hệ và 18 câu hỏi phản biện chuyên sâu bám sát DDL và mã nguồn Node.js. Sinh viên hãy đọc kỹ tài liệu này để tự tin trả lời bất kỳ câu hỏi nào của Giảng viên về cơ sở dữ liệu!

## MỤC LỤC BỘ CÂU HỎI

- [NHÓM 1: CÂU HỎI VỀ USE CASE DIAGRAM (SƠ ĐỒ TRƯỜNG HỢP SỬ DỤNG)](#nhóm-1-câu-hỏi-về-use-case-diagram) (Câu 1 – 6)
- [NHÓM 2: CÂU HỎI VỀ ERD VÀ THIẾT KẾ CƠ SỞ DỮ LIỆU](#nhóm-2-câu-hỏi-về-erd-và-thiết-kế-cơ-sở-dữ-liệu) (Câu 7 – 14)
- [NHÓM 3: CÂU HỎI VỀ ACTIVITY DIAGRAM VÀ XỬ LÝ GIAO DỊCH](#nhóm-3-câu-hỏi-về-activity-diagram-và-xử-lý-giao-dịch) (Câu 15 – 21)
- [NHÓM 4: CÂU HỎI VỀ THIẾT KẾ GIAO DIỆN NGƯỜI DÙNG (UI)](#nhóm-4-câu-hỏi-về-thiết-kế-giao-diện-người-dùng-ui) (Câu 22 – 26)
- [NHÓM 5: CÂU HỎI BẪY KỸ THUẬT VÀ BẢO MẬT HỆ THỐNG](#nhóm-5-câu-hỏi-bẫy-kỹ-thuật-và-bảo-mật-hệ-thống) (Câu 27 – 32)

---

## NHÓM 1: CÂU HỎI VỀ USE CASE DIAGRAM

### Câu 1: Tại sao trong sơ đồ Use Case của hệ thống chỉ có 3 Actor (Guest, Customer, Admin) mà không có vai trò Staff (Nhân viên)?
- **Trả lời trọng tâm:** Hệ thống VAMOS STORE được thiết kế tập trung quyền vận hành cho một vai trò quản trị duy nhất là `Admin`, phản ánh trung thực cấu trúc cơ sở dữ liệu và mã nguồn ứng dụng hiện tại.
- **Giải thích thêm:** Trong bảng `users`, cột `role` chỉ có 2 giá trị là `'CUSTOMER'` và `'ADMIN'`. Toàn bộ các tác vụ vận hành như xác nhận đơn hàng, nhập kho hay xem báo cáo đều được thực hiện qua các route quản trị `/admin/*` và được kiểm soát bởi middleware `requireRole('ADMIN')`. Việc không tách vai trò `Staff` là một quyết định kỹ thuật có chủ đích: tránh làm phức tạp hóa hệ thống phân quyền (RBAC) khi quy mô nghiệp vụ hiện tại của cửa hàng hoàn toàn do ban quản trị điều hành trực tiếp.

### Câu 2: Mối quan hệ kế thừa (Generalization) giữa Customer và Guest có ý nghĩa như thế nào trong mô hình Use Case?
- **Trả lời trọng tâm:** Quan hệ kế thừa giữa 2 Actor thể hiện rằng `Customer` là một trường hợp đặc biệt của `Guest`. `Customer` sở hữu toàn bộ các quyền và khả năng tương tác mà `Guest` có, đồng thời được mở rộng thêm các quyền hạn dành riêng cho người dùng đã đăng nhập.
- **Giải thích thêm:** Bất kỳ chức năng nào mà Guest thực hiện được (như xem trang chủ, tìm kiếm giày, lọc sản phẩm theo size/màu, xem chi tiết sản phẩm) thì Customer đều thực hiện được mà không cần phải vẽ lại các đường liên kết từ Customer tới các Use Case đó. Điều này giúp sơ đồ Use Case tổng quát tinh gọn, đúng chuẩn mực UML và tránh trùng lặp đường nối.

### Câu 3: Hãy phân biệt rõ sự khác nhau giữa quan hệ `<<include>>` và `<<extend>>` thông qua các ví dụ cụ thể trong dự án VAMOS STORE?
- **Trả lời trọng tâm:** 
  - `<<include>>` là quan hệ **bắt buộc**: Use Case cơ sở không thể hoàn tất nếu Use Case được include thất bại hoặc không được thực hiện.
  - `<<extend>>` là quan hệ **mở rộng tùy chọn**: Use Case mở rộng chỉ được thực thi khi thỏa mãn một điểm mở rộng (extension point) hoặc một điều kiện nhất định.
- **Ví dụ trong dự án:**
  - Trong quy trình Đặt hàng COD (`UC07`), quan hệ với "Kiểm tra tồn kho" là **`<<include>>`** vì bắt buộc phải kiểm tra tồn kho của từng biến thể trước khi tạo đơn; nếu hết hàng thì đơn không thể tạo.
  - Ngược lại, quan hệ giữa `UC07` với "Áp dụng mã giảm giá voucher" là **`<<extend>>`** vì khách hàng có thể mua hàng mà không dùng voucher. Luồng áp dụng voucher chỉ được gọi khi khách hàng nhập mã hợp lệ.

### Câu 4: Tình trạng thực tế của Use Case UC03 (Khôi phục mật khẩu) trong dự án hiện nay như thế nào?
- **Trả lời trọng tâm:** Về mặt cơ sở dữ liệu, bảng `password_reset_tokens` đã được tạo lập hoàn chỉnh với các trường `token_hash NVARCHAR(255) NOT NULL UNIQUE`, `expires_at` và `used_at`. Tuy nhiên, về mặt mã nguồn ứng dụng, cổng gửi email SMTP thực tế chưa được kích hoạt; chức năng này hiện ở mức thiết kế cấu trúc dữ liệu và đang nằm trong kế hoạch triển khai giai đoạn 2.
- **Giải thích thêm:** Tác nhân `Email Service` trên sơ đồ Use Case là tác nhân phụ (Secondary Actor) được mô hình hóa để dự trù cho kiến trúc gửi mail khôi phục mật khẩu. Việc trình bày rõ ràng tình trạng này thể hiện tính trung thực học thuật và khả năng kiểm soát dự án của sinh viên.

### Câu 5: Tại sao VAMOS STORE chỉ thiết kế Use Case Đặt hàng COD (UC07) mà không tích hợp thanh toán trực tuyến qua VNPAY, MoMo hay ZaloPay?
- **Trả lời trọng tâm:** VAMOS STORE tập trung tối ưu hóa phương thức thanh toán phổ biến nhất trong thương mại điện tử giày dép tại Việt Nam là COD (Giao hàng thu tiền tận nơi). Việc giới hạn ở COD trong phiên bản này giúp đơn giản hóa luồng giao dịch, không bị phụ thuộc vào môi trường Sandbox bên thứ ba và tập trung nguồn lực vào việc tối ưu hóa quản lý kho hàng và máy trạng thái đơn hàng.

### Câu 6: Làm thế nào để xác định được ranh giới hệ thống (System Boundary) trong sơ đồ Use Case của VAMOS STORE?
- **Trả lời trọng tâm:** Ranh giới hệ thống được xác định bởi chiếc khung hình chữ nhật bao quanh 14 Use Case. Các tác nhân (Guest, Customer, Admin, Email Service) nằm ngoài ranh giới vì họ là đối tượng tương tác từ bên ngoài. Mọi chức năng, xử lý dữ liệu và bảng biểu bên trong hình chữ nhật đều thuộc phạm vi quản lý và chịu trách nhiệm của phần mềm VAMOS STORE.

---

## NHÓM 2: CÂU HỎI VỀ ERD VÀ THIẾT KẾ CƠ SỞ DỮ LIỆU

### Câu 7: Tại sao cơ sở dữ liệu VAMOS STORE có đúng 20 bảng nghiệp vụ? Bảng `schema_migrations` có được tính vào không?
- **Trả lời trọng tâm:** Hệ thống có đúng **20 bảng nghiệp vụ thực tế** được khai báo trong `database/mssql_schema.sql` để phục vụ các chức năng từ người dùng, sản phẩm, giỏ hàng, kho hàng đến đơn hàng. Bảng `schema_migrations` **không được tính** vào 20 bảng này vì đây là bảng hạ tầng kỹ thuật của công cụ migration, chỉ dùng để theo dõi các phiên bản cập nhật database chứ không chứa dữ liệu nghiệp vụ của cửa hàng.

### Câu 8: Tại sao lại cần tách bảng `product_variants` riêng mà không lưu trực tiếp giá và số lượng tồn kho trong bảng `products`?
- **Trả lời trọng tâm:** Vì đặc thù của mặt hàng giày dép là một sản phẩm có nhiều kích cỡ (Size 39, 40, 41...) và nhiều màu sắc (Đen, Trắng, Đỏ...). Mỗi sự kết hợp cụ thể (ví dụ: Giày Nike Air Force 1 - Màu Trắng - Size 40) là một thực thể thương mại độc lập, có mã SKU riêng, giá bán riêng và số lượng tồn kho thực tế riêng biệt.
- **Giải thích thêm:** Nếu lưu trực tiếp trong `products`, chúng ta sẽ vi phạm dạng chuẩn 1NF (thuộc tính đa trị) hoặc không thể quản lý được số lượng tồn kho chính xác theo từng size. Tách bảng `product_variants` là giải pháp chuẩn hóa dữ liệu, giúp `cart_items` và `order_items` tham chiếu chính xác đến từng đôi giày cụ thể.

### Câu 9: Tại sao lại cần tách riêng hai bảng danh mục `sizes` và `colors` mà không gõ trực tiếp tên size và màu vào bảng `product_variants`?
- **Trả lời trọng tâm:** Việc tách riêng `sizes` và `colors` nhằm bảo đảm tính toàn vẹn dữ liệu, chống dị thường cập nhật (Update Anomaly) và hỗ trợ tìm kiếm, lọc sản phẩm nhanh chóng.
- **Giải thích thêm:** Nếu gõ tự do dạng chuỗi (text), người nhập liệu có thể gõ "Trắng", "trắng", "White" hoặc "Size 40", "40", gây sai lệch khi lọc sản phẩm. Tách thành bảng danh mục với khóa chính là số nguyên (INT) giúp chuẩn hóa dữ liệu, tiết kiệm dung lượng lưu trữ và cho phép quản lý thêm các thuộc tính mở rộng như mã màu HEX (`hex_code`) để hiển thị màu sắc trực quan trên giao diện.

### Câu 10: Tại sao trong bảng `orders` lại có cột `delivery_address_snapshot` mà không chỉ dùng khóa ngoại `address_id` trỏ về bảng `addresses`?
- **Trả lời trọng tâm:** Để **lịch sử hóa dữ liệu và bảo toàn tính pháp lý của hóa đơn**. Cột `delivery_address_snapshot` lưu toàn bộ chuỗi địa chỉ giao hàng tại thời điểm đặt hàng.
- **Giải thích thêm:** Nếu chỉ lưu khóa ngoại `address_id`, khi khách hàng sau này cập nhật số điện thoại mới, đổi địa chỉ hoặc xóa địa chỉ cũ khỏi sổ địa chỉ, toàn bộ các đơn hàng đã đặt trong quá khứ sẽ bị thay đổi thông tin theo, làm sai lệch hồ sơ giao hàng và báo cáo tài chính. Snapshot địa chỉ bảo đảm đơn hàng đã chốt thì không bao giờ bị biến đổi lịch sử.

### Câu 11: Ràng buộc Filtered Unique Index `uq_user_default_address` trên bảng `addresses` có ý nghĩa kỹ thuật gì?
- **Trả lời trọng tâm:** Ràng buộc `CREATE UNIQUE INDEX uq_user_default_address ON addresses(user_id) WHERE is_default = 1;` bảo đảm ở mức CSDL rằng: **Mỗi người dùng chỉ có tối đa duy nhất một địa chỉ mặc định**.
- **Giải thích thêm:** Nếu không có Filtered Index, một người dùng có thể vô tình có 2 địa chỉ cùng có cờ `is_default = 1`, gây xung đột khi hệ thống tự động điền địa chỉ vào trang Checkout. Ràng buộc mức CSDL này an toàn hơn nhiều so với việc chỉ kiểm tra bằng code ứng dụng.

### Câu 12: Bảng `inventory_transactions` đóng vai trò gì và có bao nhiêu loại giao dịch?
- **Trả lời trọng tâm:** Bảng `inventory_transactions` đóng vai trò là **Thẻ kho (Stock Ledger)**, ghi nhận lại toàn bộ nhật ký lịch sử của mọi lần tăng giảm tồn kho trong hệ thống.
- **Giải thích thêm:** Bảng lưu 4 loại giao dịch chuẩn (`transaction_type`):
  1. `IN_IMPORT`: Nhập hàng vào kho từ nhà cung cấp.
  2. `OUT_SALE`: Trừ kho khi khách hàng đặt đơn hàng COD thành công.
  3. `IN_CANCEL`: Hoàn hàng vào kho khi đơn hàng bị hủy hợp lệ.
  4. `ADJUST`: Điều chỉnh số lượng khi thủ kho kiểm kê thực tế.  
  Mỗi bản ghi đều lưu số lượng biến động, mã đơn hàng tham chiếu (`reference_id`) và thời điểm tạo, phục vụ công tác đối soát kế toán kho.

### Câu 13: Bảng `cart_items` và bảng `order_items` khác nhau như thế nào? Tại sao không dùng chung một bảng?
- **Trả lời trọng tâm:** `cart_items` là dữ liệu tạm thời, biến động liên tục và chưa có cam kết thanh toán. `order_items` là dữ liệu giao dịch chính thức, mang tính pháp lý và bất biến.
- **Giải thích thêm:** 
  - Trong `cart_items`, người dùng có thể thêm bớt, xóa hoặc đổi số lượng bất kỳ lúc nào. Giá sản phẩm trong giỏ hàng thay đổi theo giá hiện tại của shop. Khóa ngoại trỏ tới `carts(id)` và `product_variants(id)`.
  - Trong `order_items`, mỗi dòng hàng đại diện cho một sản phẩm đã được chốt mua trong đơn hàng cụ thể `orders(id)`. Cột `unit_price` lưu giá cố định tại thời điểm mua. Dữ liệu trong `order_items` không bao giờ bị xóa ngay cả khi giỏ hàng của người dùng được làm trống.

### Câu 14: Tại sao trong bảng `order_items` lại đặt tên cột là `product_variant_id`, trong khi ở bảng `cart_items` lại là `variant_id`?
- **Trả lời trọng tâm:** Đây là đặc điểm thực tế của mã nguồn DDL trong tập tin `database/mssql_schema.sql`. Cả hai cột đều là khóa ngoại tham chiếu về khóa chính `product_variants(id)`. Khi lập trình backend, đội ngũ phát triển tuân thủ đúng tên cột được khai báo trong schema để tránh lỗi cú pháp truy vấn SQL Server.

---

## NHÓM 3: CÂU HỎI VỀ ACTIVITY DIAGRAM VÀ XỬ LÝ GIAO DỊCH

### Câu 15: Tại sao hệ thống lại trừ số lượng tồn kho ngay khi đơn hàng được tạo (`PENDING`) mà không chờ đến khi đơn hàng hoàn thành (`COMPLETED`) mới trừ?
- **Trả lời trọng tâm:** Để **chống tình trạng bán vượt số lượng thực tế (Overselling)** trong thương mại điện tử.
- **Giải thích thêm:** Nếu không trừ kho ngay khi đặt hàng, giả sử trong kho chỉ còn đúng 1 đôi giày size 40, cả 5 khách hàng cùng lúc đều có thể bấm đặt hàng thành công. Đến lúc đóng gói giao hàng thì cửa hàng không có đủ sản phẩm để giao, dẫn đến trải nghiệm tồi tệ cho khách hàng. Bằng cách trừ kho ngay tại thời điểm tạo đơn trong một Database Transaction, đôi giày đó lập tức được giữ chỗ cho người đặt đầu tiên.

### Câu 16: Nếu trừ kho ngay khi tạo đơn, vậy khi khách hàng hủy đơn hàng thì tồn kho được xử lý như thế nào?
- **Trả lời trọng tâm:** Hệ thống sẽ tự động thực hiện **giao dịch hoàn kho (Stock Restock)** trong cùng một Database Transaction.
- **Giải thích thêm:** Số lượng sản phẩm của từng dòng đơn hàng sẽ được cộng ngược lại vào cột `product_variants.stock_quantity`. Đồng thời, hệ thống tạo một bản ghi mới trong bảng `inventory_transactions` với mã giao dịch `IN_CANCEL` và ghi chú rõ mã đơn hàng bị hủy. Nếu đơn hàng có sử dụng voucher, số lượt sử dụng voucher (`used_count`) cũng được giảm đi để hoàn trả quyền dùng mã cho khách hàng.

### Câu 17: Điều kiện hủy đơn hàng của Khách hàng (Customer) và Quản trị viên (Admin) khác nhau như thế nào?
- **Trả lời trọng tâm:**
  - **Khách hàng:** Chỉ được quyền tự hủy đơn khi đơn hàng đang ở trạng thái sơ khai **`PENDING`** (Chờ xử lý). Khi đơn đã được xác nhận, nút hủy trên giao diện của khách hàng sẽ bị vô hiệu hóa.
  - **Quản trị viên (Admin):** Có quyền hủy đơn khi đơn hàng ở cả 2 trạng thái **`PENDING`** hoặc **`CONFIRMED`** (ví dụ: liên hệ khách không được, khách gọi điện xin hủy, hoặc phát hiện lỗi địa chỉ).
  - Khi đơn đã bước sang `PROCESSING` (Đang đóng gói) hoặc `SHIPPING` (Đang giao hàng), cả hai đều không thể tự ý hủy trực tiếp trên giao diện để tránh rủi ro thất thoát hàng hóa.

### Câu 18: Máy trạng thái đơn hàng (Order FSM) của VAMOS STORE gồm bao nhiêu trạng thái? Tại sao không có trạng thái `SHIPPED` hay `DELIVERED`?
- **Trả lời trọng tâm:** Hệ thống vận hành chính xác theo **6 trạng thái chuẩn** được khai báo trong ràng buộc CHECK của bảng `orders`:
  1. `PENDING` (Chờ xử lý)
  2. `CONFIRMED` (Đã xác nhận)
  3. `PROCESSING` (Đang đóng gói / xử lý)
  4. `SHIPPING` (Đang giao hàng)
  5. `COMPLETED` (Hoàn thành / Đã nhận hàng và thu tiền COD)
  6. `CANCELLED` (Đã hủy)
- **Giải thích thêm:** Nhóm không sử dụng các từ như `SHIPPED` hay `DELIVERED` vì toàn bộ mã nguồn backend trong `src/services/orderService.js` và DDL CSDL quy định tên trạng thái đang giao là `SHIPPING` và đã giao thành công là `COMPLETED`. Việc trả lời đúng 6 trạng thái này chứng minh sinh viên nắm rất chắc mã nguồn thực tế.

### Câu 19: Nếu 2 khách hàng cùng nhấn nút Đặt hàng cho một đôi giày duy nhất trong kho vào cùng một tích tắc, hệ thống xử lý tranh chấp như thế nào?
- **Trả lời trọng tâm:** Hệ thống sử dụng cơ chế **Database Transaction với khóa hàng (Row-level Locking) của SQL Server**.
- **Giải thích thêm:** Khi request của khách hàng thứ nhất đi vào transaction, câu lệnh cập nhật tồn kho sẽ giữ khóa độc quyền (Exclusive Lock) trên bản ghi của biến thể đó. Khách hàng thứ nhất kiểm tra tồn kho còn 1 -> trừ còn 0 -> thành công. Khi transaction thứ nhất commit xong, request của khách hàng thứ hai được giải phóng khóa và đọc dữ liệu mới: tồn kho lúc này đã là 0 -> điều kiện kiểm tra tồn kho thất bại -> hệ thống kích hoạt **ROLLBACK** cho khách hàng thứ hai và trả về thông báo "Sản phẩm đã hết hàng".

### Câu 20: Ý nghĩa của các phân làn (Swimlanes) trong các sơ đồ Activity Diagram là gì?
- **Trả lời trọng tâm:** Phân làn Swimlanes thể hiện sự phân tách ranh giới trách nhiệm giữa các thành phần kiến trúc khác nhau trong một quy trình.
- **Giải thích thêm:** Thông thường có 3 làn:
  - Làn **Khách hàng / Admin**: Thể hiện hành vi kích hoạt và tương tác giao diện người dùng.
  - Làn **Hệ thống Web (Server Controller & Service)**: Thể hiện logic nghiệp vụ, xác thực dữ liệu và kiểm tra quyền hạn.
  - Làn **Cơ sở dữ liệu (Database)**: Thể hiện việc thực thi câu lệnh SQL, quản lý khóa và duy trì tính toàn vẹn ACID.

### Câu 21: Tại sao trong sơ đồ hoạt động Đặt hàng COD không có bước thanh toán thẻ ngân hàng?
- **Trả lời trọng tâm:** Vì hình thức thanh toán của VAMOS STORE là COD (Cash on Delivery - Thanh toán tiền mặt khi nhận hàng). Quá trình thanh toán thực tế diễn ra ngoài đời thực khi bưu tá giao giày cho khách hàng. Về mặt hệ thống phần mềm, khi đơn hàng được bưu tá xác nhận đã giao và chuyển trạng thái sang `COMPLETED`, hệ thống mới ghi nhận dòng tiền đơn hàng đã hoàn tất.

---

## NHÓM 4: CÂU HỎI VỀ THIẾT KẾ GIAO DIỆN NGƯỜI DÙNG (UI)

### Câu 22: Tại sao nhóm lại lựa chọn Server-Side Rendering (SSR) với Pug và Tailwind CSS mà không sử dụng React hay Vue?
- **Trả lời trọng tâm:** Đối với một website thương mại điện tử bán giày dép, **khả năng tối ưu hóa công cụ tìm kiếm (SEO) và tốc độ tải trang ban đầu (First Contentful Paint)** là hai yếu tố sống còn để thu hút khách hàng.
- **Giải thích thêm:** SSR với Pug giúp mã HTML được sinh hoàn chỉnh ngay trên server, các bot tìm kiếm của Google dễ dàng thu thập dữ liệu sản phẩm, hình ảnh và giá cả. Đồng thời, SSR giúp việc bảo mật các phiên đăng nhập (Express Session) và kiểm tra quyền Admin diễn ra hoàn toàn khép kín trên server, giảm bớt sự cồng kềnh của các thư viện JavaScript phía client. Tailwind CSS giúp xây dựng giao diện hiện đại, chuẩn Responsive mà kích thước tệp CSS xuất xưởng cực kỳ nhỏ gọn.

### Câu 23: Màn hình Chi tiết sản phẩm (Hình 20) xử lý sự kiện tương tác giữa kích cỡ, màu sắc và tồn kho như thế nào?
- **Trả lời trọng tâm:** Khi trang web tải về, backend truyền kèm một mảng dữ liệu các biến thể SKU khả dụng dưới dạng thuộc tính JSON trên giao diện. Khi người dùng click chọn một màu và một kích cỡ:
  1. Mã JavaScript bắt sự kiện và tìm kiếm mã SKU tương ứng trong ma trận biến thể.
  2. Giao diện cập nhật giá bán thực tế của biến thể đó.
  3. Giao diện hiển thị số lượng hàng còn trong kho (`Còn X sản phẩm`).
  4. Nếu số lượng bằng 0, nút "Thêm vào giỏ hàng" tự động bị vô hiệu hóa (disabled) và đổi nhãn thành "Hết hàng", ngăn chặn người dùng bấm thêm sản phẩm không có thật.

### Câu 24: Làm thế nào để bảo vệ các màn hình quản trị Admin không bị người dùng thông thường truy cập trái phép?
- **Trả lời trọng tâm:** Hệ thống sử dụng cơ chế bảo vệ nhiều lớp:
  1. **Tầng Giao diện:** Toàn bộ menu, nút bấm dẫn đến trang Admin đều bị ẩn hoàn toàn đối với Guest và Customer trong Pug template.
  2. **Tầng Định tuyến (Routing Middleware):** Mọi route bắt đầu bằng `/admin/*` đều bắt buộc phải đi qua 2 middleware tuần tự:
     - `requireAuth`: Kiểm tra người dùng đã đăng nhập chưa. Nếu chưa -> chuyển hướng về `/login`.
     - `requireRole('ADMIN')`: Kiểm tra thuộc tính `req.session.user.role === 'ADMIN'`. Nếu là Customer -> trả về mã lỗi 403 Forbidden hoặc chuyển hướng về trang chủ. Do đó, người dùng dù có gõ trực tiếp URL trên thanh địa chỉ cũng không thể vào được trang quản trị.

### Câu 25: Giao diện VAMOS STORE có hỗ trợ hiển thị trên điện thoại di động (Responsive) không? Thực hiện như thế nào?
- **Trả lời trọng tâm:** Có. Giao diện được thiết kế theo tư duy **Mobile-First** bằng cách tận dụng hệ thống tiền tố breakpoint của Tailwind CSS (`sm:`, `md:`, `lg:`, `xl:`).
- **Giải thích thêm:** Ví dụ trên màn hình Cửa hàng (`shop.pug`), thanh bộ lọc danh mục hiển thị dạng ngăn kéo (drawer) hoặc xếp dọc trên điện thoại, và tự động chuyển sang dạng cột bên trái (sidebar) trên màn hình máy tính để bàn. Bảng danh sách giỏ hàng tự động chuyển từ bảng ngang sang dạng thẻ card bo tròn trên màn hình nhỏ.

### Câu 26: Màn hình Quản lý Đơn hàng của Admin (Hình 29) giúp giải quyết bài toán vận hành như thế nào?
- **Trả lời trọng tâm:** Màn hình phân loại đơn hàng theo 6 tab trạng thái tương ứng với FSM. Admin có thể nhanh chóng lọc ra các đơn mới cần xử lý (`PENDING`), nhấn nút "Xác nhận đơn" để chuyển sang `CONFIRMED`, hoặc bấm chuyển sang `SHIPPING` khi đã bàn giao cho đơn vị vận chuyển. Mỗi thao tác đổi trạng thái đều hiển thị hộp thoại xác nhận để tránh bấm nhầm.

---

## NHÓM 5: CÂU HỎI BẪY KỸ THUẬT VÀ BẢO MẬT HỆ THỐNG

### Câu 27: Cơ chế quản lý phiên làm việc (Session) của VAMOS STORE hoạt động như thế nào? Có dùng JWT không?
- **Trả lời trọng tâm:** Hệ thống sử dụng cơ chế **Express Session truyền thống lưu trữ trong bộ nhớ RAM (MemoryStore)**, định danh bằng cookie mang tên **`vamos_sid`**. Hệ thống **không sử dụng JWT (JSON Web Token)**.
- **Giải thích thêm:** Cookie `vamos_sid` được cấu hình với các cờ bảo mật cao: `httpOnly: true` (ngăn chặn JavaScript đọc cookie, chống tấn công XSS trộm phiên), `sameSite: 'lax'` (chống tấn công CSRF) và có thời hạn sống 7 ngày. Việc sử dụng MemoryStore phù hợp với quy mô triển khai đơn máy chủ (Single Instance) của đồ án tốt nghiệp, và có thể nâng cấp lên Redis Store khi cần mở rộng đa máy chủ trong tương lai.

### Câu 28: Mật khẩu người dùng được lưu trữ và bảo vệ như thế nào trong cơ sở dữ liệu?
- **Trả lời trọng tâm:** Mật khẩu người dùng được mã hóa bằng thuật toán băm một chiều **`bcrypt`** (thư viện `bcryptjs`) với chi phí muối **`saltRounds = 10`**. Mật khẩu dạng văn bản gốc (plain text) tuyệt đối không bao giờ được ghi vào CSDL hoặc in ra file log.
- **Giải thích thêm:** Thuật toán bcrypt tự động sinh muối ngẫu nhiên (Salt) cho mỗi lần mã hóa, chống lại các cuộc tấn công tra cứu trước như Rainbow Table, bảo đảm an toàn dữ liệu người dùng ngay cả khi cơ sở dữ liệu bị rò rỉ.

### Câu 29: Hệ thống phòng chống tấn công SQL Injection bằng cách nào?
- **Trả lời trọng tâm:** Hệ thống sử dụng thư viện kết nối cơ sở dữ liệu với kỹ thuật **Tham số hóa truy vấn (Parameterized Queries / Prepared Statements)** của `mssql`.
- **Giải thích thêm:** Mọi giá trị do người dùng nhập từ giao diện (như từ khóa tìm kiếm, tên đăng nhập, ID sản phẩm) đều được truyền qua các biến tham số `@param` (ví dụ: `request.input('userId', sql.Int, userId)`). Dữ liệu người dùng nhập luôn được coi là dữ liệu thuần túy, máy chủ SQL Server không bao giờ biên dịch dữ liệu đó thành mã lệnh thực thi, triệt tiêu 100% lỗ hổng SQL Injection.

### Câu 30: Hệ thống phòng chống tấn công Cross-Site Scripting (XSS) như thế nào?
- **Trả lời trọng tâm:**
  1. Template engine **Pug tự động mã hóa (HTML entity encode)** mọi ký tự đặc biệt như `<`, `>`, `&`, `"` khi in biến ra giao diện thông qua cú pháp `#{variable}` hoặc `= variable`. Kẻ tấn công dù có cố tình chèn mã `<script>` vào ô bình luận hay địa chỉ thì mã đó cũng chỉ hiển thị dưới dạng chữ thường chứ không thể thực thi trên trình duyệt.
  2. Cookie phiên `vamos_sid` được thiết lập `httpOnly: true`, làm cho mã script độc hại nếu có lọt vào cũng không thể đánh cắp được token phiên làm việc.

### Câu 31: Tại sao hệ thống lại cần bảng `banners`? Có Use Case nào cho banner không?
- **Trả lời trọng tâm:** Bảng `banners` phục vụ cho việc quản lý các hình ảnh truyền thông và chiến dịch khuyến mãi trên Trang chủ. Quản trị viên có thể thêm mới, đổi ảnh, gán đường link đích và bật tắt trạng thái hiển thị của banner mà không cần phải sửa đổi mã nguồn hay triển khai lại ứng dụng web. Chức năng này thuộc phạm vi quản trị giao diện tiếp thị của Admin.

### Câu 32: Điểm mạnh lớn nhất và hạn chế kỹ thuật lớn nhất của đồ án VAMOS STORE là gì?
- **Trả lời trọng tâm:**
  - **Điểm mạnh lớn nhất:** Thiết kế cơ sở dữ liệu và quy trình nghiệp vụ rất thực chiến: giải quyết trọn vẹn bài toán ma trận biến thể giày dép (Size/Màu), cơ chế thẻ kho nhật ký xuất nhập tồn minh bạch, và kiểm soát giao dịch đặt hàng COD an toàn chống Overselling.
  - **Hạn chế kỹ thuật và hướng phát triển:** Hiện tại phiên bản này chưa tích hợp cổng gửi mail SMTP tự động cho chức năng khôi phục mật khẩu, và chưa tích hợp cổng thanh toán trực tuyến qua các ví điện tử. Đây là hai nội dung nhóm đã thiết kế sẵn cấu trúc dữ liệu và sẽ kích hoạt ngay trong giai đoạn nâng cấp tiếp theo.
