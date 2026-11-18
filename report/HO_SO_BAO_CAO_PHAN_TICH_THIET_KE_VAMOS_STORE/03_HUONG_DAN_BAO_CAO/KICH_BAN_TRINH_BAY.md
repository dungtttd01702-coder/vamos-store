# KỊCH BẢN THUYẾT TRÌNH BẢO VỆ CHUYÊN ĐỀ
# PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG VAMOS STORE

**Đề tài:** Xây dựng Website Bán Giày Dép Trực Tuyến VAMOS STORE  
**Nội dung trình bày:** 4 Trụ cột Phân tích & Thiết kế Hệ thống (Use Case, ERD, Activity Diagram, UI)  
**Thời lượng khuyến nghị:** 15 – 20 phút  
**Đối tượng sử dụng:** Sinh viên FPT Polytechnic luyện tập thuyết trình trực tiếp trước Hội đồng Thẩm định  

---

## BẢNG PHÂN BỔ THỜI GIAN TRÌNH BÀY (TIME MANAGEMENT)

| Phần | Nội dung | Thời lượng dự kiến | Trực quan minh họa |
|:---:|---|:---:|---|
| **Mở đầu** | Chào hỏi, giới thiệu nhóm, nêu lý do và 4 trụ cột | **1.5 phút** | Slide bìa / Trang bìa báo cáo |
| **Phần 1** | Sơ đồ Use Case (3 Actor, 14 UC, quan hệ then chốt) | **4.0 phút** | Hình 1, Hình 2, Hình 3 |
| **Chuyển tiếp 1** | Kết nối Use Case sang Cơ sở dữ liệu | **0.5 phút** | Lời dẫn tự nhiên |
| **Phần 2** | Sơ đồ ERD (20 bảng, Variant Size/Màu, Snapshot, Thẻ kho) | **4.5 phút** | Hình 4, Hình 6, Hình 8 |
| **Chuyển tiếp 2** | Kết nối CSDL sang Luồng quy trình hoạt động | **0.5 phút** | Lời dẫn tự nhiên |
| **Phần 3** | Activity Diagram (3 Swimlane, Đặt hàng COD, Hủy đơn, FSM) | **4.5 phút** | Hình 13, Hình 14, Hình 15 |
| **Chuyển tiếp 3** | Kết nối Quy trình sang Giao diện tương tác | **0.5 phút** | Lời dẫn tự nhiên |
| **Phần 4** | Thiết kế Giao diện UI (Pug SSR, Chi tiết SKU, Đơn hàng, Thẻ kho) | **3.5 phút** | Hình 20, Hình 24, Hình 29, Hình 31 |
| **Kết thúc** | Tổng kết giá trị kỹ thuật, lời cảm ơn & Mời đặt câu hỏi | **1.0 phút** | Slide cảm ơn |
| **TỔNG CỘNG** | **Toàn bộ bài báo cáo phân tích thiết kế** | **20 phút** | **Hội đồng chuyển sang Q&A** |

---

## TOÀN VĂN LỜI THOẠI KỊCH BẢN THUYẾT TRÌNH CHI TIẾT

---

### GIAI ĐOẠN 1: MỞ ĐẦU VÀ GIỚI THIỆU TỔNG QUAN (1.5 PHÚT)

*(Hành động: Đứng thẳng, phong thái tự tin, mắt nhìn bao quát Hội đồng, cúi đầu chào nhẹ nhàng)*

**Sinh viên trình bày:**
> "Kính thưa quý Thầy, quý Cô trong Hội đồng chấm đồ án tốt nghiệp Trường Cao đẳng Thực hành FPT Polytechnic!
> 
> Em tên là **[Họ và tên sinh viên]**, đại diện cho nhóm thực hiện đề tài xây dựng Website bán giày dép trực tuyến **VAMOS STORE**.
> 
> Lời đầu tiên, cho phép em xin được gửi tới quý Thầy/Cô lời chào trân trọng nhất và lời chúc sức khỏe, thành công!
> 
> Kính thưa Thầy/Cô, trong quá trình phát triển một sản phẩm phần mềm thực chiến, giai đoạn quyết định sự sống còn và chất lượng của hệ thống chính là **Phân tích và Thiết kế hệ thống (System Analysis & Design)**. Một hệ thống có kiến trúc dữ liệu chuẩn mực, phân định quyền hạn minh bạch và kiểm soát chặt chẽ các luồng giao dịch sẽ giúp việc lập trình trở nên an toàn, dễ bảo trì và mở rộng lâu dài.
> 
> Chính vì vậy, trong buổi báo cáo chuyên đề hôm nay, nhóm chúng em xin phép được tập trung trình bày sâu sắc vào đúng **4 trụ cột thiết kế cốt lõi** của VAMOS STORE:
> 1. **Sơ đồ Use Case:** Xác định ranh giới chức năng và trách nhiệm của từng tác nhân.
> 2. **Sơ đồ ERD:** Mô hình hóa 20 bảng cơ sở dữ liệu quan hệ trên Microsoft SQL Server 2022.
> 3. **Sơ đồ Activity Diagram:** Kiểm soát luồng xử lý giao dịch ACID, trừ kho và máy trạng thái đơn hàng FSM.
> 4. **Giao diện người dùng UI:** Hiện thực hóa các yêu cầu nghiệp vụ thông qua công nghệ Server-Side Rendering.
> 
> Sau đây, em xin phép bắt đầu với trụ cột đầu tiên: Phân tích Use Case của hệ thống."

---

### GIAI ĐOẠN 2: TRÌNH BÀY PHẦN 1 — USE CASE DIAGRAM (4 PHÚT)

*(Hành động: Chiếu Hình 1 — Sơ đồ Use Case tổng quát lên màn hình, tay cầm bút chỉ hoặc chuột lượn quanh ranh giới hệ thống)*

**Sinh viên trình bày:**
> "Kính thưa Thầy/Cô, nhìn vào **Sơ đồ Use Case tổng quát (Hình 1)**, hệ thống VAMOS STORE được bao bọc trong một ranh giới rõ ràng dành cho website thương mại điện tử chuyên ngành giày dép.
> 
> Hệ thống phục vụ **3 tác nhân chính (Primary Actors)**:
> 
> *(Chỉ vào Actor Guest ở góc trên bên trái)*  
> Tác nhân thứ nhất là **Guest — Khách vãng lai**. Đây là bất kỳ ai truy cập website mà chưa đăng nhập. Guest có quyền tìm kiếm và duyệt danh mục giày (UC05), xem chi tiết sản phẩm, thực hiện Đăng ký tài khoản mới (UC01) hoặc Đăng nhập (UC02).
> 
> *(Chỉ vào Actor Customer và đường mũi tên kế thừa hướng về Guest)*  
> Tác nhân thứ hai là **Customer — Khách hàng thành viên**. Như Thầy/Cô có thể quan sát, giữa Customer và Guest có mối quan hệ **kế thừa (Generalization)** thể hiện qua mũi tên tam giác rỗng. Điều này có nghĩa Customer kế thừa toàn bộ khả năng xem và tìm kiếm của Guest, đồng thời được cấp thêm các quyền hạn mua sắm riêng: Quản lý giỏ hàng (UC06), Đặt hàng thanh toán COD (UC07), Quản lý sổ địa chỉ giao hàng (UC04), Theo dõi đơn hàng (UC08) và Hủy đơn hàng khi cần thiết (UC09).
> 
> *(Chỉ vào Actor Admin ở góc dưới bên phải)*  
> Tác nhân thứ ba độc lập là **Admin — Quản trị viên hệ thống**. Admin nắm giữ các Use Case vận hành cốt lõi từ UC10 đến UC14, bao gồm: Tiếp nhận và xử lý đơn hàng theo tiến trình (UC10), Quản lý kho hàng và theo dõi thẻ kho (UC11), Quản lý sản phẩm và danh mục phân cấp (UC12), Quản lý mã giảm giá voucher (UC13) và Theo dõi báo cáo doanh thu kinh doanh (UC14).
> 
> Em cũng xin lưu ý một điểm thực tế: Dự án của nhóm em tuân thủ thiết kế tối giản, **không chia nhỏ vai trò Staff riêng biệt**, mà toàn quyền vận hành nghiệp vụ tập trung vào vai trò Admin thông qua cột phân quyền `role` trong CSDL."

*(Hành động: Chuyển sang Hình 2 — Sơ đồ Use Case Mua hàng COD)*

> "Đi sâu vào **Phân hệ Mua hàng COD (Hình 2)**, em xin nhấn mạnh 2 mối quan hệ quan trọng:
> - Khi Customer thực hiện **UC07 Đặt hàng COD**, Use Case này bắt buộc phải **`<<include>>`** Use Case Kiểm tra số lượng tồn kho khả dụng. Nếu biến thể giày đó không còn đủ số lượng trong kho, việc đặt hàng không thể diễn ra.
> - Đồng thời, UC07 có quan hệ **`<<extend>>`** với Use Case Áp dụng mã voucher. Đây là hành động mở rộng tùy chọn: chỉ khi khách hàng có mã giảm giá hợp lệ và nhập mã thì luồng giảm giá mới được kích hoạt, không bắt buộc đối với mọi đơn hàng.
> 
> Về **UC09 Hủy đơn hàng**, hệ thống chỉ cho phép khách hàng thực hiện khi đơn hàng đang ở trạng thái ban đầu là `PENDING`. Một khi Admin đã bấm xác nhận đơn, quyền hủy của khách hàng sẽ tự động đóng lại để bảo đảm quy trình đóng gói và vận chuyển.
> 
> Đối với **UC03 Khôi phục mật khẩu**, nhóm em đã hoàn thành thiết kế cấu trúc dữ liệu với bảng lưu token hash và thời hạn hết hạn, tuy nhiên trong phiên bản hiện tại, cổng gửi email SMTP thực tế đang được nhóm để dành cho giai đoạn nâng cấp tiếp theo."

---

### GIAI ĐOẠN 3: LỜI DẪN CHUYỂN TIẾP TỪ USE CASE SANG ERD (0.5 PHÚT)

*(Hành động: Hạ tay chỉ xuống, nhìn thẳng Hội đồng, mỉm cười nhẹ)*

**Sinh viên trình bày:**
> "Kính thưa Thầy/Cô, việc phân tích 14 Use Case vừa rồi đã giúp chúng em xác định chính xác những chức năng mà hệ thống phải đáp ứng. Tuy nhiên, để các chức năng đó có thể lưu trữ và xử lý thông tin một cách bền vững, toàn vẹn và tối ưu, chúng ta cần một mô hình dữ liệu quan hệ được chuẩn hóa cao.
> 
> Sau đây, em xin kính mời Thầy/Cô cùng chuyển sang **Phần 2: Sơ đồ thực thể liên kết (ERD) và Thiết kế Cơ sở dữ liệu VAMOS STORE**."

---

### GIAI ĐOẠN 4: TRÌNH BÀY PHẦN 2 — ERD & CƠ SỞ DỮ LIỆU (4.5 PHÚT)

*(Hành động: Chiếu Hình 4 — Sơ đồ ERD tổng quan 20 bảng nghiệp vụ)*

**Sinh viên trình bày:**
> "Kính thưa Hội đồng, cơ sở dữ liệu của VAMOS STORE được cài đặt trực tiếp trên hệ quản trị **Microsoft SQL Server 2022**. CSDL bao gồm đúng **20 bảng nghiệp vụ chuẩn** đạt chuẩn hóa dạng 3NF (không bao gồm bảng kỹ thuật `schema_migrations`).
> 
> 20 bảng này được nhóm em quy hoạch mạch lạc thành 5 phân hệ dữ liệu:
> 
> *(Chỉ vào cụm bảng Danh mục và Sản phẩm — Hình 6)*  
> Em xin phân tích quyết định kiến trúc quan trọng nhất của nhóm: **Bài toán biến thể sản phẩm giày dép**.  
> Một sản phẩm giày không thể chỉ lưu đơn giản trong một bảng `products`, bởi vì cùng một mẫu giày Nike hay Adidas sẽ có rất nhiều kích cỡ khác nhau (Size 39, 40, 41 trong bảng `sizes`) và nhiều phối màu khác nhau (Đen, Trắng, Đỏ trong bảng `colors`).  
> Vì vậy, nhóm em thiết kế bảng trung tâm là **`product_variants` (Biến thể sản phẩm)**. Mỗi dòng trong bảng này là một sự kết hợp cụ thể giữa một sản phẩm cha, một kích cỡ và một màu sắc. Bảng này quản lý mã thương phẩm độc nhất **SKU**, giá bán thực tế và quan trọng nhất là số lượng tồn kho độc lập **`stock_quantity`**.  
> Khi khách hàng thêm hàng vào giỏ trong bảng `cart_items`, khóa ngoại tham chiếu thẳng tới `variant_id` chứ không trỏ về sản phẩm cha. Điều này loại bỏ hoàn toàn rủi ro khách đặt mua giày nhưng không rõ kích cỡ hoặc màu sắc.
> 
> *(Chỉ vào cụm bảng Đơn hàng — Hình 8)*  
> Điểm sáng thứ hai trong thiết kế ERD là **Tính toàn vẹn và lịch sử hóa dữ liệu đơn hàng**:  
> Thầy/Cô có thể nhận thấy trong bảng `orders`, nhóm em thiết kế cột **`delivery_address_snapshot`** kiểu dữ liệu `NVARCHAR(255)`. Tại sao chúng em không chỉ lưu một khóa ngoại `address_id` trỏ về bảng sổ địa chỉ?  
> Bởi vì trong thương mại điện tử, người dùng có thể sửa đổi tên, số điện thoại hoặc xóa địa chỉ cũ bất kỳ lúc nào. Nếu chỉ dùng khóa ngoại, dữ liệu trên các đơn hàng trong quá khứ sẽ bị biến đổi theo, làm sai lệch hóa đơn và chứng từ kế toán. Cột snapshot này lưu trữ nguyên vẹn địa chỉ giao hàng tại thời điểm đặt, bảo toàn tính pháp lý vĩnh viễn cho đơn hàng.  
> Tương tự, trong bảng `order_items`, chúng em lưu **`unit_price`** là giá thực tế tại thời điểm mua, độc lập hoàn toàn với việc sau này Admin có tăng hay giảm giá trong bảng biến thể.
> 
> *(Chỉ vào bảng addresses và bảng inventory_transactions)*  
> Ngoài ra, để bảo vệ dữ liệu ở tầng thấp nhất, nhóm em áp dụng các ràng buộc nâng cao:  
> - Trên bảng `addresses`, chúng em tạo một **Filtered Unique Index** mang tên `uq_user_default_address` với điều kiện `WHERE is_default = 1`. Ràng buộc này bảo đảm ở mức CSDL rằng mỗi khách hàng chỉ có thể có duy nhất một địa chỉ mặc định, ngăn chặn hoàn toàn lỗi logic có nhiều địa chỉ mặc định cùng lúc.  
> - Bảng `inventory_transactions` đóng vai trò là **Thẻ kho (Stock Ledger)** ghi nhận mọi biến động xuất nhập tồn với 4 loại giao dịch: `IN_IMPORT` (nhập hàng), `OUT_SALE` (bán hàng), `IN_CANCEL` (hoàn kho khi hủy đơn) và `ADJUST` (điều chỉnh kiểm kê)."

---

### GIAI ĐOẠN 5: LỜI DẪN CHUYỂN TIẾP TỪ ERD SANG ACTIVITY DIAGRAM (0.5 PHÚT)

*(Hành động: Chuyển slide, giữ ánh mắt tập trung)*

**Sinh viên trình bày:**
> "Kính thưa Thầy/Cô, chúng ta đã có một mô hình cơ sở dữ liệu 20 bảng rất chặt chẽ. Nhưng một cấu trúc dữ liệu tốt sẽ không thể phát huy tác dụng nếu thiếu đi những quy trình xử lý giao dịch an toàn. Làm sao để đảm bảo khi khách đặt hàng thì kho bị trừ chính xác? Làm sao để không xảy ra tình trạng hai khách hàng cùng tranh mua một đôi giày duy nhất?  
> Để làm rõ cơ chế kiểm soát này, em xin kính mời Thầy/Cô cùng theo dõi **Phần 3: Sơ đồ hoạt động (Activity Diagram) của VAMOS STORE**."

---

### GIAI ĐOẠN 6: TRÌNH BÀY PHẦN 3 — ACTIVITY DIAGRAM (4.5 PHÚT)

*(Hành động: Chiếu Hình 13 — Sơ đồ hoạt động Đặt hàng COD)*

**Sinh viên trình bày:**
> "Kính thưa quý Thầy/Cô, sơ đồ hoạt động của VAMOS STORE được thiết kế theo định hướng đơn giản hóa, trực quan với **2 phân làn Swimlane rõ ràng**: Người dùng (thực hiện thao tác trên giao diện) và Hệ thống VAMOS STORE (kiểm tra điều kiện, xử lý nghiệp vụ và phản hồi kết quả). Luồng chạy thẳng từ trên xuống dưới với các nút rẽ nhánh Quyết định Đúng/Sai rất dễ theo dõi.
> 
> Em xin phân tích sâu vào quy trình then chốt nhất của hệ thống: **Quy trình Đặt hàng COD (Hình 13)**:
> 
> *(Dùng tay chỉ dọc theo luồng đi từ trên xuống)*  
> 1. Khi Khách hàng hoàn tất nhập thông tin và nhấn nút 'Xác nhận đặt hàng', tầng ứng dụng Node.js sẽ tiếp nhận request và mở một **Database Transaction** ở mức độ cô lập bảo vệ dữ liệu.
> 2. *(Chỉ vào nút Decision kiểm tra tồn kho)*: Hệ thống lập tức truy vấn vào bảng `product_variants` để kiểm tra số lượng tồn kho khả dụng `stock_quantity` của tất cả sản phẩm có trong giỏ hàng. Nếu có bất kỳ mã SKU nào có `stock_quantity < quantity` yêu cầu, hệ thống sẽ thực thi lệnh **ROLLBACK** ngay lập tức, hủy bỏ toàn bộ thao tác và trả về thông báo lỗi chi tiết cho khách hàng.
> 3. Nếu còn đủ hàng, hệ thống kiểm tra mã voucher (nếu có), tính toán số tiền giảm giá và chèn bản ghi vào bảng `orders` với trạng thái ban đầu là `PENDING`.
> 4. *(Nhấn mạnh)*: Ngay tại bước này, hệ thống **thực hiện trừ số lượng tồn kho ngay lập tức (`OUT_SALE`)** trong cùng Transaction, đồng thời ghi thẻ kho và xóa các mục hàng tương ứng trong giỏ hàng.
> 5. Sau khi tất cả các bước trên thành công trọn vẹn, lệnh **COMMIT** được phát ra, đơn hàng chính thức được xác lập."

*(Hành động: Chuyển sang Hình 14 — Quy trình Hủy đơn hàng và Hình 15 — Admin xử lý đơn hàng)*

> "Tiếp theo, em xin giải thích về **Quy trình Hủy đơn hàng và Hoàn kho (Hình 14)**:
> - Về mặt nghiệp vụ, khách hàng chỉ có thể hủy đơn khi đơn hàng đang ở trạng thái `PENDING`. Khi khách gửi yêu cầu hủy, hệ thống mở một Transaction hoàn kho: Trạng thái đơn chuyển sang `CANCELLED`, số lượng giày được cộng trả lại cho biến thể `product_variants.stock_quantity`, và một bản ghi thẻ kho mới với mã **`IN_CANCEL`** được ghi nhận. Nếu đơn đó có áp dụng mã voucher, lượt sử dụng voucher cũng được hoàn trả lại cho khách hàng.
> 
> Cuối cùng, về **Máy trạng thái đơn hàng (Order FSM)**, hệ thống quản trị của VAMOS STORE vận hành tuần tự qua đúng 6 trạng thái:
> `PENDING` (Chờ xử lý) -> `CONFIRMED` (Đã xác nhận) -> `PROCESSING` (Đang đóng gói) -> `SHIPPING` (Đang giao hàng) -> `COMPLETED` (Đã giao thành công).
> Và nhánh rẽ kết thúc là `CANCELLED` (Đã hủy).
> 
> Một nguyên tắc kỹ thuật cực kỳ quan trọng mà nhóm em đã kiểm toán trong mã nguồn: Vì hàng đã được trừ kho ngay tại lúc tạo đơn `PENDING`, nên khi Admin chuyển trạng thái qua `CONFIRMED`, `PROCESSING`, `SHIPPING` và cuối cùng là `COMPLETED`, **hệ thống tuyệt đối không trừ kho thêm một lần nào nữa**, tránh hoàn toàn lỗi trừ tồn kho trùng lặp (Double Deduction)."

---

### GIAI ĐOẠN 7: LỜI DẪN CHUYỂN TIẾP TỪ ACTIVITY DIAGRAM SANG UI (0.5 PHÚT)

*(Hành động: Mỉm cười, giọng hào hứng hơn)*

**Sinh viên trình bày:**
> "Kính thưa Thầy/Cô, toàn bộ mô hình dữ liệu và các quy trình xử lý giao dịch chặt chẽ kể trên cuối cùng đã được nhóm chúng em hiện thực hóa thành những trang màn hình giao diện trực quan, thân thiện và giàu tính tương tác.
> 
> Sau đây, em xin kính mời Thầy/Cô cùng bước vào **Phần 4: Thiết kế Giao diện Người dùng (UI)** của website VAMOS STORE."

---

### GIAI ĐOẠN 8: TRÌNH BÀY PHẦN 4 — USER INTERFACE (UI) (3.5 PHÚT)

*(Hành động: Chiếu Hình 20 — Màn hình Chi tiết sản phẩm)*

**Sinh viên trình bày:**
> "Kính thưa Hội đồng, giao diện VAMOS STORE được xây dựng trên nền tảng công nghệ **Server-Side Rendering (SSR) sử dụng Pug template engine và Tailwind CSS**. Nhóm lựa chọn SSR vì đây là giải pháp tối ưu cho website thương mại điện tử: tải trang ban đầu cực nhanh, hỗ trợ SEO vượt trội giúp sản phẩm dễ lên top tìm kiếm, đồng thời bảo mật tuyệt đối các logic kiểm tra quyền trên server.
> 
> Các màn hình được phân nhóm rõ nét theo 3 vai trò:
> 
> Ở phân hệ Khách hàng, em xin hướng sự chú ý của Thầy/Cô vào **Màn hình Chi tiết sản phẩm (Hình 20)**:  
> Màn hình này giải quyết trực tiếp bài toán ma trận biến thể. Khi người dùng click chọn một màu sắc và một kích cỡ, mã JavaScript phía client sẽ bắt sự kiện và hiển thị chính xác số lượng tồn kho của SKU đó. Nếu SKU đó hết hàng (`stock_quantity = 0`), nút 'Thêm vào giỏ' lập tức bị vô hiệu hóa và chuyển sang trạng thái cảnh báo 'Hết hàng'. Điều này ngăn chặn việc người dùng thêm hàng ảo vào giỏ."

*(Hành động: Chiếu Hình 24 — Màn hình Đặt hàng COD)*

> "Tại **Màn hình Đặt hàng COD (Hình 24)**:  
> Khách hàng có thể chọn nhanh địa chỉ nhận hàng từ sổ địa chỉ đã lưu hoặc nhập địa chỉ mới. Giao diện tích hợp ô nhập mã Voucher với phản hồi tức thì về số tiền được giảm trừ. Tổng tiền thanh toán được phân tách minh bạch: Tiền hàng, Phí vận chuyển, Số tiền giảm giá và Tổng thanh toán cuối cùng."

*(Hành động: Chiếu Hình 27 — Admin Dashboard, Hình 29 — Admin Orders và Hình 31 — Admin Inventory)*

> "Chuyển sang phân hệ Quản trị Admin:
> - **Màn hình Dashboard (Hình 27):** Cung cấp các thẻ thống kê tổng quan về doanh thu thực tế, số lượng đơn hàng theo ngày, danh sách cảnh báo sản phẩm sắp hết hàng trong kho.
> - **Màn hình Quản lý Đơn hàng (Hình 29):** Admin có thể lọc đơn theo 6 trạng thái FSM. Các nút bấm chuyển trạng thái như 'Xác nhận đơn', 'Giao hàng', 'Hoàn tất' chỉ xuất hiện khi phù hợp với quy tắc chuyển trạng thái hợp lệ.
> - **Màn hình Thẻ kho (Hình 31):** Đây là giao diện chuyên nghiệp dành cho bộ phận kho vận, hiển thị chi tiết lịch sử từng lần xuất, nhập, hoàn hàng kèm mã tham chiếu đơn hàng và ghi chú nghiệp vụ, giúp đối soát dữ liệu kho minh bạch 100%."

---

### GIAI ĐOẠN 9: KẾT LUẬN VÀ MỜI HỘI ĐỒNG ĐẶT CÂU HỎI (1.0 PHÚT)

*(Hành động: Chuyển sang slide kết thúc, đứng trang trọng, hướng về toàn thể Hội đồng)*

**Sinh viên trình bày:**
> "Kính thưa quý Thầy, quý Cô trong Hội đồng chấm đồ án!
> 
> Qua 4 phần báo cáo vừa trình bày:
> - **Use Case** đã giúp định hình phạm vi 14 chức năng và ranh giới 3 tác nhân.
> - **ERD** đã hiện thực hóa 20 bảng cơ sở dữ liệu quan hệ chuẩn mực, giải quyết triệt để bài toán biến thể giày dép và lịch sử hóa đơn hàng.
> - **Activity Diagram** đã kiểm soát an toàn tuyệt đối các giao dịch ACID, ngăn chặn Overselling và duy trì tính cân bằng của thẻ kho.
> - Và **UI** đã mang đến trải nghiệm trực quan, chân thực và bảo mật cho cả người mua lẫn nhà quản trị.
> 
> Toàn bộ nội dung trong báo cáo của nhóm chúng em đều được xây dựng dựa trên sự đối chiếu nghiêm ngặt với mã nguồn Node.js và CSDL SQL Server thực tế của dự án, bảo đảm tính trung thực học thuật cao nhất.
> 
> Nhóm chúng em xin được gửi lời cảm ơn chân thành nhất tới quý Thầy/Cô đã dành thời gian quý báu lắng nghe bài thuyết trình của nhóm.
> 
> Chúng em rất mong nhận được những lời nhận xét, góp ý và các câu hỏi phản biện của quý Thầy/Cô để nhóm có cơ hội làm rõ hơn các khía cạnh kỹ thuật của dự án.
> 
> Em xin trân trọng cảm ơn quý Thầy/Cô!"
