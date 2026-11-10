# CHƯƠNG VI: HẠN CHẾ VÀ HƯỚNG PHÁT TRIỂN (CONCLUSION)

---

## 1. HẠN CHẾ CỦA HỆ THỐNG

Mặc dù hệ thống website bán giày dép **VAMOS STORE** đã hoàn thiện các mục tiêu cơ bản theo đặc tả yêu cầu phiên bản 1.0, song do giới hạn về mặt thời gian và nguồn lực thử nghiệm, đồ án vẫn còn một số điểm hạn chế kỹ thuật sau:

1. **Chưa tích hợp cổng thanh toán trực tuyến tự động:** Hệ thống hiện tại mới chỉ hỗ trợ duy nhất phương thức thanh toán tiền mặt khi nhận hàng (COD). Các cổng thanh toán trực tuyến phổ biến như VNPAY, MoMo, ZaloPay hoặc thẻ quốc tế (Visa/Mastercard) chưa được tích hợp chính thức trong phiên bản này.
2. **Chưa kết nối API với các đơn vị vận chuyển bên ngoài:** Cước phí giao hàng hiện đang áp dụng theo biểu phí cố định (Flat-rate) hoặc miễn phí vận chuyển theo giá trị đơn hàng được cấu hình trong mã nguồn, chưa có tính năng tự động gọi API của GHTK, GHN hay Viettel Post để tính cước phí động theo trọng lượng và khoảng cách địa lý.
3. **Quy trình đổi trả hàng chưa tự động hóa trên giao diện web:** Do đặc thù ngành giày dép đòi hỏi khâu kiểm tra tình trạng giày, đế giày và đối soát kỹ lưỡng, quy trình đổi size hoặc trả hàng hiện mới chỉ dừng lại ở trang thông tin chính sách và hướng dẫn khách hàng liên hệ hotline chăm sóc khách hàng.
4. **Hệ thống đề xuất sản phẩm còn đơn giản:** Danh sách sản phẩm gợi ý và liên quan hiện đang lấy ngẫu nhiên theo danh mục hoặc sản phẩm mới nhất, chưa ứng dụng các thuật toán máy học hoặc học máy để cá nhân hóa gợi ý theo hành vi duyệt web của từng khách hàng.

---

## 2. HƯỚNG PHÁT TRIỂN TƯƠNG LAI

Để nâng cao năng lực cạnh tranh và mở rộng quy mô kinh doanh thực tế, nhóm nghiên cứu đề xuất các định hướng phát triển cho hệ thống VAMOS STORE trong các phiên bản tiếp theo:

1. **Tích hợp cổng thanh toán điện tử đa kênh:**
   - Tích hợp cổng thanh toán trực tuyến VNPAY Sandbox / Production, cho phép khách hàng quét mã VietQR ngân hàng hoặc thanh toán qua thẻ nội địa/quốc tế.
   - Xây dựng cơ chế Webhook / IPN xử lý kết quả thanh toán bất đồng bộ và tự động cập nhật `payment_status = 'PAID'`.
2. **Tự động hóa chuỗi cung ứng và vận chuyển:**
   - Tích hợp trực tiếp với API của các đơn vị giao vận lớn (Giao Hàng Nhanh - GHN API, Giao Hàng Tiết Kiệm - GHTK API).
   - Tự động đẩy đơn, tạo mã vận đơn (Tracking Code), in phiếu giao hàng trực tiếp từ màn hình Admin và đồng bộ trạng thái giao vận theo thời gian thực.
3. **Phát triển ứng dụng di động đa nền tảng (Mobile App):**
   - Xây dựng ứng dụng di động cho hai hệ điều hành iOS và Android bằng Flutter hoặc React Native, tái sử dụng toàn bộ hệ thống API Backend hiện có của VAMOS STORE.
   - Tích hợp tính năng gửi thông báo đẩy (Push Notifications) về tình trạng đơn hàng và các chương trình ưu đãi flash-sale.
4. **Ứng dụng Trí tuệ nhân tạo (AI Recommendation & Virtual Try-on):**
   - Xây dựng mô hình AI gợi ý mẫu giày dựa trên lịch sử xem hàng và độ tương đồng phong cách (Collaborative Filtering).
   - Nghiên cứu tích hợp công nghệ thực tế ảo tăng cường (AR) giúp khách hàng ướm thử giày trên chân thông qua camera điện thoại trước khi đặt mua.

---

## 3. KẾT LUẬN

Sau một thời gian nỗ lực nghiên cứu, phân tích nghiệp vụ, thiết kế hệ thống và hiện thực mã nguồn, nhóm sinh viên đã hoàn thành dự án môn học Dự án Java (JAV102) với đề tài **"Xây dựng Website bán giày dép VAMOS STORE"** đạt đúng các tiêu chuẩn chất lượng học thuật và yêu cầu thực tiễn của Nhà trường.

### Những kết quả chính đã đạt được:

- **Về mặt phân tích & thiết kế:** Xây dựng thành công bộ tài liệu kỹ thuật chuẩn mực bao gồm hồ sơ 3 Actor (`Guest`, `Customer`, `Admin`), 14 Use Case chi tiết, sơ đồ điều hướng Sitemap, mô hình CSDL quan hệ ERD 18 thực thể, Từ điển dữ liệu chi tiết, 5 sơ đồ hoạt động (Activity Diagrams) và bộ khung Wireframe đặc tả 10 màn hình cốt lõi.
- **Về mặt kỹ thuật kiến trúc:** Ứng dụng thành công mô hình MVC phân lớp trên nền tảng Node.js và Express.js; kết hợp Template Engine Pug và Tailwind CSS mang lại giao diện responsive hiện đại, tốc độ tải trang nhanh và thân thiện với SEO.
- **Về mặt cơ sở dữ liệu:** Thiết kế schema MySQL 8.0 chuẩn hóa, giải quyết triệt để bài toán quản lý biến thể giày phức tạp (`Size x Color x SKU`), bảo vệ tính toàn vẹn kho hàng bằng Transaction và Khóa bi quan (`SELECT ... FOR UPDATE`), đồng thời áp dụng mẫu Snapshot bất biến bảo vệ dữ liệu lịch sử đơn hàng.
- **Về mặt kỹ năng thực tiễn:** Quá trình thực hiện đồ án đã giúp các thành viên trong nhóm củng cố sâu sắc tư duy kiến trúc phần mềm, kỹ năng làm việc nhóm, kỹ năng phân tích bài toán thực tế, quản lý phiên bản với Git và đóng gói môi trường với Docker.

Dự án môn học Dự án Java (JAV102) VAMOS STORE không chỉ là kết tinh tri thức của toàn bộ chương trình đào tạo chuyên ngành Phát triển phần mềm tại Trường Cao đẳng Thực hành FPT Polytechnic Đà Nẵng, mà còn là một nền tảng thực tế vững chắc, có khả năng phát triển và ứng dụng thương mại hóa trong tương lai.
