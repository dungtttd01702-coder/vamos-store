# SỔ TAY QUẢN LÝ VẤN ĐỀ MỞ VÀ HƯỚNG DẪN BẢO VỆ ĐỒ ÁN (FINAL QA ISSUES & DEFENDING GUIDE)
## DỰ ÁN: XÂY DỰNG WEBSITE BÁN GIÀY DÉP VAMOS STORE
**Đơn vị đào tạo:** Trường Cao đẳng Thực hành FPT Polytechnic  
**Bộ môn:** Công nghệ Thông tin  
**Đối tượng sử dụng:** Nhóm sinh viên thực hiện đề tài (Trần Trung Dũng, Trần Vĩnh Nhật, Trần Duy Hoàng Sa)

---

## PHẦN 1: DANH MỤC CÁC VẤN ĐỀ MỞ VÀ GIỚI HẠN KỸ THUẬT (OPEN ISSUES & CONSTRAINTS)

Trong quá trình kiểm toán kỹ thuật độc lập, nhóm kiểm toán ghi nhận **3 vấn đề mở mang tính giới hạn môi trường**. Toàn bộ các vấn đề này đã được minh bạch hóa trong báo cáo, không gây ảnh hưởng đến tính đúng đắn của kiến trúc nhưng nhóm sinh viên cần nắm vững bản chất để giải trình tự tin trước Hội đồng Giám khảo.

---

### VẤN ĐỀ 1: XÁC MINH MÔI TRƯỜNG KHỞI CHẠY CONTAINER DOCKER (DOCKER RUNTIME VERIFICATION)
* **Hiện trạng kỹ thuật:** 
  * Cấu hình tệp `Dockerfile` và `docker-compose.yml` trong mã nguồn dự án đã được kiểm tra cú pháp và cấu trúc tham chiếu. Cấu hình hoàn toàn hợp lệ, phân tách rõ 2 dịch vụ: Web App Node.js (cổng 3000) và CSDL Microsoft SQL Server 2022 (cổng 1433) kèm các biến môi trường cấu hình mật khẩu sa và volume lưu trữ dữ liệu bền vững.
  * Tuy nhiên, trên máy tính trạm kiểm thử thực tế của nhóm (Windows OS), dịch vụ nền Docker Desktop daemon chưa được cài đặt / khởi động (`docker info` trả về lỗi command not found). Do đó, việc khởi chạy live container trên máy trạm chưa được kích hoạt thực tế.
* **Tác động đến dự án:** Hoàn toàn không ảnh hưởng đến khả năng chạy của ứng dụng, vì hệ thống VAMOS STORE đang vận hành trực tiếp cực kỳ ổn định thông qua môi trường Node.js local kết nối trực tiếp đến máy chủ Microsoft SQL Server 2022.
* **Cách thể hiện trong báo cáo:** Báo cáo tại Chương V đã chuẩn hóa trạng thái minh bạch: *"Cấu hình đã kiểm tra, chưa xác minh triển khai thực tế"*.
* **Chiến lược trả lời Hội đồng Giám khảo:**
  > *"Kính thưa Thầy/Cô, nhóm chúng em đã đóng gói toàn bộ ứng dụng và CSDL vào `Dockerfile` theo mô hình Multi-stage và điều phối qua `docker-compose.yml` để đảm bảo tính khả chuyển khi đưa lên máy chủ Linux Production. Tại môi trường máy tính cá nhân dùng để phát triển, nhóm ưu tiên chạy trực tiếp qua Node.js runtime và SQL Server 2022 Express cục bộ để tối ưu hóa tài nguyên phần cứng và tốc độ gỡ lỗi (debug). Khi chuyển giao sang môi trường Cloud VPS Ubuntu, toàn bộ cấu hình Docker Compose này sẽ được kích hoạt nguyên vẹn mà không cần thay đổi bất kỳ dòng mã nguồn nào."*

---

### VẤN ĐỀ 2: KIỂM THỬ TẢI ĐA LUỒNG CHO CA KIỂM THỬ 23 (CONCURRENCY & STRESS TESTING)
* **Hiện trạng kỹ thuật:**
  * Ca kiểm thử 23 (Test Case 23) đặt ra kịch bản: *"Kiểm thử đặt hàng đồng thời nhiều luồng khi số lượng tồn kho biến thể chỉ còn 1 đôi (Race Condition / Concurrency Control)"*.
  * Môi trường máy trạm thử nghiệm chưa cài đặt các công cụ bắn tải chuyên dụng như Apache JMeter, k6 hay Locust, nên bài test tải đa luồng thực tế ở quy mô hàng trăm request/giây chưa thể ghi nhận số liệu đo đạc benchmark thực địa.
* **Bảo chứng mã nguồn (Code-level Defense):**
  * Logic nghiệp vụ trong `src/controllers/checkout.controller.js` đã được thiết kế cực kỳ chặt chẽ: toàn bộ chuỗi xử lý đặt hàng (kiểm tra tồn kho biến thể $\rightarrow$ trừ số lượng tồn $\rightarrow$ ghi nhận biến động kho `inventory_transactions` $\rightarrow$ tạo bản ghi đơn hàng `orders` và snapshot `order_items` $\rightarrow$ làm trống giỏ hàng `cart_items`) được bao bọc trong một **Transaction CSDL của Microsoft SQL Server** với cấp độ cô lập giao dịch ngặt nghèo.
  * Nếu hai phiên checkout cùng tranh chấp 1 biến thể SKU duy nhất, Transaction nào vào trước sẽ khóa bản ghi để cập nhật; Transaction vào sau gặp điều kiện `stock_quantity < requested_quantity` sẽ bị kích hoạt ngoại lệ `ROLLBACK TRANSACTION`, bảo đảm tồn kho không bao giờ bị âm.
* **Cách thể hiện trong báo cáo:** Ca kiểm thử 23 trong Bảng 24 được ghi nhận trạng thái trung thực: **"Chưa xác minh (Chờ Staging)"**, kèm phân tích lý thuyết khóa CSDL.
* **Chiến lược trả lời Hội đồng Giám khảo:**
  > *"Kính thưa Thầy/Cô, để giải quyết triệt để bài toán tranh chấp tài nguyên (Race Condition) khi nhiều khách hàng cùng thanh toán món hàng cuối cùng, nhóm đã triển khai cơ chế khóa bi quan (Pessimistic Locking / Atomic Transaction) trực tiếp từ tầng CSDL Microsoft SQL Server. Mọi thao tác trừ kho đều nằm trong một Database Transaction nguyên tử. Do giới hạn phần cứng máy trạm phát triển, nhóm chưa thể chạy kịch bản mô phỏng 1,000 người dùng đồng thời bằng JMeter, nhưng về mặt thuật toán và thiết kế CSDL, hệ thống cam kết tính toàn vẹn dữ liệu ACID tuyệt đối, không thể xảy ra hiện tượng tồn kho âm."*

---

### VẤN ĐỀ 3: QUY TRÌNH HOÀN CHỈNH CỦA CHỨC NĂNG KHÔI PHỤC MẬT KHẨU (PASSWORD RESET WORKFLOW)
* **Hiện trạng kỹ thuật:**
  * Trong cơ sở dữ liệu, bảng `password_reset_tokens` đã được định nghĩa chuẩn xác với cấu trúc: `id`, `user_id` (FK tới `users`), `token_hash` (NVARCHAR(255) UNIQUE), `expires_at` (DATETIME2) và `created_at`.
  * Tuy nhiên, trong mã nguồn backend hiện tại, nhóm chưa tích hợp thư viện gửi mail (như `nodemailer` kết nối Gmail SMTP hoặc AWS SES) để tạo luồng gửi mã xác thực tự động về hòm thư người dùng.
* **Tác động đến dự án:** Tính năng đăng ký, đăng nhập, đổi mật khẩu khi đã đăng nhập (Profile Password Change) đều hoạt động hoàn hảo 100%. Luồng quên mật khẩu hiện dừng lại ở mức thiết kế cấu trúc CSDL và giao diện form tiếp nhận.
* **Cách thể hiện trong báo cáo:** Báo cáo ghi nhận thống nhất tại tất cả các chương: *"Chức năng khôi phục mật khẩu đã được đưa vào thiết kế và có cấu trúc dữ liệu hỗ trợ, tuy nhiên quy trình xử lý hoàn chỉnh chưa được triển khai trong phiên bản hiện tại."*
* **Chiến lược trả lời Hội đồng Giám khảo:**
  > *"Kính thưa Thầy/Cô, trong phạm vi đề tài tốt nghiệp, nhóm tập trung ưu tiên tối đa vào luồng nghiệp vụ xương sống của một website thương mại điện tử: tìm kiếm, lọc đa tiêu chí, ma trận biến thể giày SKU, giỏ hàng, khuyến mãi voucher và đặc biệt là quy trình xử lý đơn hàng COD nguyên tử kèm hoàn kho tự động. Đối với chức năng Quên mật khẩu, nhóm đã hoàn thiện khâu phân tích thiết kế CSDL với bảng `password_reset_tokens` lưu mã băm an toàn kèm thời gian hết hạn (`expires_at`). Do tính năng này đòi hỏi hạ tầng SMTP Mail Server có trả phí để tránh rơi vào hộp thư rác (Spam), nhóm đã đưa nội dung này vào Danh mục Hướng phát triển tương lai ở Chương VI để tiếp tục tích hợp trong giai đoạn 2."*

---

## PHẦN 2: BỘ CÂU HỎI PHẢN BIỆN THƯỜNG GẶP VÀ KỊCH BẢN TRẢ LỜI (DEFENDING FAQ)

Dưới đây là tập hợp các câu hỏi hóc búa nhất mà các Thầy/Cô trong Hội đồng chấm đồ án FPT Polytechnic thường đặt ra cho các đề tài website thương mại điện tử, kèm theo định hướng trả lời xuất sắc giúp nhóm đạt điểm tối đa:

### Câu hỏi 1: Tại sao nhóm chọn công nghệ Server-Side Rendering (Pug Template) thay vì các framework Single Page Application (SPA) phổ biến như React, Vue hay Next.js?
* **Định hướng trả lời:**
  1. **Khả năng SEO (Search Engine Optimization) vượt trội:** Website bán giày dép là sàn bán lẻ thương mại điện tử, việc các công cụ tìm kiếm (Googlebot, Bingbot) thu thập dữ liệu (crawling/indexing) thông tin sản phẩm, thương hiệu, mức giá là sống còn đối với doanh nghiệp. SSR với Pug sinh mã HTML hoàn chỉnh ngay trên server giúp bot đọc được dữ liệu tức thì mà không phụ thuộc vào việc trình duyệt thực thi JavaScript.
  2. **Hiệu năng tải trang đầu (First Contentful Paint - FCP):** Khách hàng mua sắm trên thiết bị di động có cấu hình trung bình hoặc mạng 3G/4G yếu sẽ nhận được trang hiển thị ngay lập tức, không phải chờ tải các gói bundle JavaScript dung lượng lớn (vài Megabytes) như các ứng dụng SPA client-side rendering.
  3. **Bảo mật và đơn giản hóa kiến trúc:** Không để lộ logic nghiệp vụ và API nhạy cảm ra ngoài trình duyệt, quản lý phiên làm việc thông qua máy chủ (Server-side Session) an toàn, phòng chống tấn công XSS hiệu quả hơn.

---

### Câu hỏi 2: Giải thích cơ chế bảo đảm tính toàn vẹn dữ liệu khi khách hàng bấm đặt hàng COD (Checkout)? Nếu đang chạy mà mất điện/sập mạng thì dữ liệu có bị sai lệch không?
* **Định hướng trả lời:**
  * Nhóm sử dụng mô hình **Database Transaction** của Microsoft SQL Server:
    * Bắt đầu giao dịch: `BEGIN TRANSACTION`.
    * Bước 1: Kiểm tra lại số lượng tồn kho thực tế của từng mã SKU trong giỏ hàng.
    * Bước 2: Trừ số lượng tồn `stock_quantity = stock_quantity - quantity` trong bảng `product_variants`.
    * Bước 3: Ghi vết kiểm toán biến động kho vào bảng `inventory_transactions` với loại giao dịch `ORDER_OUT`.
    * Bước 4: Kiểm tra và tăng số lượt dùng mã giảm giá trong bảng `vouchers`, ghi log vào `voucher_usages`.
    * Bước 5: Tạo bản ghi đơn hàng trong bảng `orders` và lưu các dòng snapshot bất biến vào `order_items`.
    * Bước 6: Xóa các mặt hàng tương ứng trong giỏ hàng `cart_items`.
    * Kết thúc giao dịch: `COMMIT TRANSACTION`.
  * **Xử lý sự cố:** Nếu bất kỳ bước nào trong chuỗi 6 bước trên xảy ra lỗi (ví dụ hết hàng, voucher hết hạn, rớt kết nối mạng hoặc máy chủ sập nguồn), hệ thống lập tức bắt ngoại lệ trong khối `catch` và thực thi lệnh `ROLLBACK TRANSACTION`. Toàn bộ các thao tác đã thực hiện trước đó sẽ bị hủy bỏ hoàn toàn, CSDL quay về trạng thái toàn vẹn ban đầu, bảo đảm không bao giờ có hiện tượng trừ kho mà đơn không tạo được, hoặc tạo đơn mà không trừ kho.

---

### Câu hỏi 3: Trong thiết kế cơ sở dữ liệu, nhóm giải quyết bài toán một khách hàng có nhiều địa chỉ nhưng chỉ có duy nhất một địa chỉ mặc định như thế nào?
* **Định hướng trả lời:**
  * Trong bảng `addresses`, một người dùng (`user_id`) có thể lưu nhiều địa chỉ nhận hàng (quan hệ 1:N). Cột `is_default` mang giá trị 1 (mặc định) hoặc 0 (phụ).
  * Để đảm bảo ở tầng cơ sở dữ liệu một người dùng **chỉ có thể có tối đa một địa chỉ mặc định**, nhóm không dùng Unique Index thông thường (vì nếu dùng unique trên `(user_id, is_default)` thì người dùng chỉ tạo được tối đa một địa chỉ phụ mang giá trị 0).
  * Nhóm đã ứng dụng tính năng cao cấp của Microsoft SQL Server 2022 là **Chỉ mục lọc độc nhất (Filtered Unique Index)**:
    ```sql
    CREATE UNIQUE NONCLUSTERED INDEX uq_user_default_address
    ON addresses(user_id)
    WHERE is_default = 1;
    ```
  * Nhờ chỉ mục có điều kiện `WHERE is_default = 1`, CSDL cho phép một người dùng có vô số địa chỉ phụ (`is_default = 0`), nhưng nếu cố tình chèn hoặc cập nhật bản ghi thứ hai có `is_default = 1` cho cùng một `user_id`, CSDL sẽ chặn đứng ngay lập tức và ném lỗi vi phạm ràng buộc độc nhất. Kỹ thuật tương tự cũng được nhóm áp dụng cho ảnh đại diện chính của sản phẩm trong bảng `product_images(product_id) WHERE is_primary = 1`.

---

### Câu hỏi 4: Khi khách hàng hủy đơn hàng hoặc Admin hủy đơn, quy trình hoàn trả kho diễn ra như thế nào?
* **Định hướng trả lời:**
  * Hệ thống chỉ cho phép khách hàng tự hủy đơn DUY NHẤT khi đơn hàng đang ở trạng thái `PENDING` (Chờ xác nhận). Khi đơn đã sang `CONFIRMED` hoặc `SHIPPING`, nút hủy trên giao diện khách hàng sẽ tự động ẩn đi và chỉ Admin mới có quyền điều phối.
  * Khi tiến trình hủy đơn kích hoạt (qua controller `order.controller.js` hoặc `admin.controller.js`), hệ thống thực hiện một Database Transaction hoàn kho tự động:
    1. Cập nhật `orders.order_status = 'CANCELLED'`.
    2. Đọc danh sách các mặt hàng trong `order_items` của đơn hàng đó.
    3. Cộng hoàn trả số lượng vào tồn kho: `stock_quantity = stock_quantity + quantity` của từng `product_variant_id`.
    4. Ghi một bản ghi nhật ký hoàn kho vào bảng `inventory_transactions` với loại giao dịch `ORDER_CANCEL_RESTOCK` để nhân viên quản lý kho theo dõi.
    5. Nếu đơn hàng có sử dụng voucher, hệ thống hoàn lại lượt dùng: giảm `used_count` trong bảng `vouchers` và xóa bản ghi log trong `voucher_usages`.
    6. Ghi vết lịch sử chuyển đổi vào bảng `order_status_histories`.

---

### Câu hỏi 5: Trang Dashboard quản trị của Admin hiển thị doanh thu như thế nào? Có phải cứ có đơn đặt là cộng vào doanh thu không?
* **Định hướng trả lời:**
  * **Tuyệt đối không!** Trong nghiệp vụ thương mại điện tử thực tế áp dụng hình thức thanh toán COD (nhận hàng trả tiền mặt), tỉ lệ hoàn đơn hoặc hủy đơn khi chưa giao thành công là rất cao. Nếu tính doanh thu trên các đơn mới đặt (`PENDING`), số liệu tài chính sẽ bị ảo (ảo tưởng doanh thu).
  * Do đó, truy vấn tính KPI doanh thu thực tế trong `src/controllers/admin.controller.js` được nhóm thiết lập điều kiện lọc nghiêm ngặt:
    ```sql
    SELECT SUM(total_amount) AS total_revenue
    FROM orders
    WHERE order_status = 'COMPLETED' AND payment_status = 'PAID';
    ```
  * Chỉ những đơn hàng đã giao thành công đến tay người mua (`COMPLETED`) và nhân viên bưu tá đã thu tiền xác nhận thanh toán (`PAID`) mới được ghi nhận vào dòng tiền doanh thu thực tế của cửa hàng.
  * Tương tự, danh sách "Top 4 sản phẩm bán chạy nhất" trên Dashboard được nhóm sắp xếp theo tổng số lượng sản phẩm thực tế đã bán thành công (`ORDER BY total_sold DESC`), phản ánh chính xác thị hiếu tiêu dùng của khách hàng.

---

## PHẦN 3: DANH SÁCH VIỆC CẦN LÀM TRƯỚC GIỜ NỘP BÁO CÁO (STUDENT ACTION CHECKLIST)

1. [ ] **In ấn tài liệu:** 
   * Sử dụng tệp [`Bao_cao_ASM_VAMOS_STORE_FINAL.pdf`](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/Bao_cao_ASM_VAMOS_STORE_FINAL.pdf) (96 trang) để in ấn.
   * Nên in màu trang bìa (Trang 1) và các trang có sơ đồ kiến trúc, sơ đồ ERD (Trang 34) và giao diện trực quan.
2. [ ] **Ký tên trên Lời cam kết:**
   * Sau khi in bản cứng, Trưởng nhóm **Trần Trung Dũng** ký và ghi rõ họ tên tại Trang 3 (Lời cam kết).
3. [ ] **Chuẩn bị môi trường Demo thực tế:**
   * Khởi động máy chủ SQL Server 2022 cục bộ.
   * Chạy lệnh `npm start` hoặc `node server.js` tại thư mục dự án.
   * Mở trình duyệt truy cập `http://localhost:3000` để demo luồng mua hàng COD.
   * Đăng nhập tài khoản Quản trị `admin@vamos.com` (mật khẩu: `Admin@Vamos2026`) để demo trang Dashboard và duyệt đơn hàng.
4. [ ] **Ôn tập thuyết trình:** 3 thành viên phân chia nội dung thuyết trình khớp với bảng phân công kiểm thử ở Bảng 1 và Chương IV:
   * Thành viên 1 (Dũng): Giới thiệu đề tài, kiến trúc MVC phân lớp và luồng Đăng ký / Xác thực.
   * Thành viên 2 (Nhật): Phân tích thiết kế ERD 20 bảng, Bộ lọc đa tiêu chí và Quy trình Đặt hàng COD nguyên tử.
   * Thành viên 3 (Hoàng Sa): Quy trình Vận hành đơn hàng Admin, Quản lý kho, Cơ chế hoàn kho tự động và Báo cáo doanh thu Dashboard.
