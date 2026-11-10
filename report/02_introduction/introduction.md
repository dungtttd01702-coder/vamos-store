# PHẦN MỞ ĐẦU (INTRODUCTION)

---

## 1. PHÂN TÍCH HIỆN TRẠNG

Trong bối cảnh nền kinh tế số và thương mại điện tử tại Việt Nam phát triển bùng nổ, hành vi mua sắm của người tiêu dùng đã dịch chuyển mạnh mẽ từ các cửa hàng truyền thống sang các kênh trực tuyến. Đặc biệt, mặt hàng giày dép thời trang và thể thao là một trong những ngành hàng có nhu cầu tiêu dùng rất lớn, đối tượng khách hàng trải dài từ học sinh, sinh viên đến người đi làm và vận động viên chuyên nghiệp.

Tuy nhiên, việc kinh doanh giày dép trực tuyến đặt ra những bài toán nghiệp vụ đặc thù và phức tạp hơn rất nhiều so với các mặt hàng tiêu dùng thông thường:

1. **Quản lý đa biến thể phức tạp (Size x Màu sắc):** Một mẫu giày có thể có từ 5 đến 10 kích cỡ (Size 36 đến 45) và nhiều phiên bản màu sắc khác nhau. Nếu hệ thống quản lý không chặt chẽ theo từng mã biến thể chi tiết (SKU), việc kiểm kê số lượng tồn thực tế của từng cỡ giày sẽ rất dễ xảy ra sai lệch.
2. **Hiện tượng bán vượt tồn kho (Overselling):** Khi nhiều khách hàng cùng truy cập và đặt mua một đôi giày thuộc cỡ hiếm tại cùng một thời điểm, các hệ thống đơn giản không có cơ chế khóa giao dịch đồng thời sẽ dẫn đến tình trạng ghi nhận đơn hàng thành công trong khi kho hàng thực tế đã hết, gây ảnh hưởng tiêu cực đến uy tín thương hiệu.
3. **Biến động giá và tính toàn vẹn của lịch sử giao dịch:** Các chiến dịch khuyến mãi, giảm giá diễn ra liên tục khiến đơn giá sản phẩm thay đổi thường xuyên. Nếu hệ thống chỉ liên kết đơn hàng với bảng sản phẩm bằng khóa ngoại đơn thuần mà không lưu giữ bản sao bất biến (Snapshot), doanh thu và chi tiết đơn hàng trong quá khứ sẽ bị sai lệch hoàn toàn khi giá bán hoặc tên sản phẩm được cập nhật.
4. **Phương thức thanh toán COD đặc trưng:** Tại thị trường Việt Nam, thanh toán tiền mặt khi nhận hàng (Cash On Delivery - COD) vẫn là phương thức chiếm tỷ trọng áp đảo, đòi hỏi hệ thống phải có máy trạng thái đơn hàng chặt chẽ (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`) để quản lý tiến trình thu tiền và đối soát.

Từ những thách thức thực tiễn trên, việc nghiên cứu và xây dựng website thương mại điện tử chuyên kinh doanh giày dép **VAMOS STORE** là một đòi hỏi cấp thiết, mang tính ứng dụng thực tiễn cao, giúp chuẩn hóa toàn diện từ trải nghiệm mua sắm của khách hàng đến quy trình vận hành kho và xử lý đơn hàng của doanh nghiệp.

---

## 2. MỤC ĐÍCH CỦA SẢN PHẨM

### 2.1. Mục đích đối với khách hàng (Customer)

- Mang đến trải nghiệm mua sắm giày dép trực tuyến tiện lợi, hiện đại và trực quan với bộ lọc chuyên biệt theo danh mục, giới tính, kích cỡ, màu sắc và khoảng giá.
- Minh bạch hóa trạng thái hàng hóa: Khách hàng biết chính xác cỡ giày và màu sắc nào còn hàng hoặc hết hàng ngay tại thời điểm xem sản phẩm.
- Quy trình đặt hàng COD tinh gọn, nhanh chóng, cho phép theo dõi chi tiết tiến trình vận chuyển đơn hàng và chủ động hủy đơn khi đơn chưa được nhân viên đóng gói.

### 2.2. Mục đích đối với chủ cửa hàng và quản trị viên (Admin)

- Cung cấp một cổng quản trị (Admin Portal) tập trung giúp kiểm soát toàn diện danh mục sản phẩm, cấu hình ma trận biến thể Size x Màu sắc và gán mã SKU chuẩn hóa.
- Tự động hóa việc trừ kho khi phát sinh đơn hàng và tự động hoàn trả tồn kho khi đơn bị hủy hợp lệ, loại bỏ hoàn toàn rủi ro bán vượt tồn kho.
- Cung cấp công cụ báo cáo doanh thu thực tế (chỉ tính từ các đơn hàng giao thành công `COMPLETED`), giúp người quản lý nắm bắt chính xác hiệu quả kinh doanh.

---

## 3. MỤC TIÊU HỆ THỐNG

### 3.1. Mục tiêu chức năng (Functional Objectives)

- Xây dựng đầy đủ các phân hệ phục vụ 3 nhóm đối tượng: Khách vãng lai (`Guest`), Khách hàng (`Customer`), và Quản trị viên (`Admin`).
- Triển khai bộ danh mục sản phẩm phân tầng: Danh mục (Sneaker, Thể thao, Sandal, Dép) $\rightarrow$ Sản phẩm cha $\rightarrow$ Biến thể chi tiết.
- Xây dựng giỏ hàng trực tuyến cá nhân hóa cho từng khách hàng, hỗ trợ cập nhật số lượng và tính toán tạm tính tức thời.
- Xây dựng quy trình thanh toán COD với khả năng áp dụng mã giảm giá (Voucher) theo các điều kiện hạn mức nghiêm ngặt.
- Xây dựng máy trạng thái đơn hàng (Order State Machine) khép kín và lưu giữ nhật ký kiểm toán (Audit Trail) cho mọi lần đổi trạng thái.

### 3.2. Mục tiêu phi chức năng (Non-Functional Objectives)

- **Bảo mật và an toàn dữ liệu:** Băm mật khẩu người dùng bằng thuật toán `bcrypt` an toàn (salt rounds >= 10); xác thực và phân quyền máy chủ chặt chẽ thông qua Session; sử dụng truy vấn tham số hóa (Parameterized Queries) để ngăn chặn tấn công SQL Injection.
- **Tính toàn vẹn giao dịch (ACID Integrity):** Ứng dụng MySQL Database Transaction kết hợp khóa bi quan (`SELECT ... FOR UPDATE`) để bảo vệ dữ liệu tồn kho trong điều kiện xử lý tranh chấp đồng thời.
- **Hiệu năng và trải nghiệm người dùng (UX):** Tối ưu hóa tốc độ tải trang bằng kỹ thuật Server-Side Rendering (SSR) với Pug Template Engine; giao diện responsive tương thích hoàn hảo trên Desktop, Máy tính bảng và Điện thoại di động nhờ Tailwind CSS.

---

## 4. TÍNH NĂNG CƠ BẢN CỦA HỆ THỐNG

### 4.1. Nhóm chức năng Khách vãng lai (Guest)

- Xem trang chủ, banner quảng bá sự kiện và danh sách sản phẩm mới nhất.
- Tìm kiếm sản phẩm theo từ khóa; lọc sản phẩm đa tiêu chí (danh mục, giới tính, kích cỡ, màu sắc, khoảng giá); sắp xếp theo giá và tên.
- Xem chi tiết sản phẩm: Xem bộ sưu tập hình ảnh, xem bảng thông số, kiểm tra tình trạng còn hàng của từng biến thể Size/Màu.
- Đăng ký tài khoản thành viên mới và đăng nhập hệ thống.
- Yêu cầu khôi phục mật khẩu thông qua mã token bảo mật.

### 4.2. Nhóm chức năng Khách hàng (Customer)

- Sở hữu đầy đủ các quyền hạn của Khách vãng lai.
- Quản lý thông tin hồ sơ cá nhân và quản lý sổ địa chỉ nhận hàng (hỗ trợ nhiều địa chỉ, chọn 1 địa chỉ mặc định).
- Quản lý giỏ hàng: Thêm sản phẩm, tăng/giảm số lượng, xóa sản phẩm khỏi giỏ.
- Đặt hàng COD: Lựa chọn địa chỉ nhận hàng, nhập mã voucher giảm giá, xác nhận tạo đơn hàng.
- Xem lịch sử đơn hàng cá nhân, theo dõi chi tiết từng bước chuyển trạng thái của đơn hàng.
- Tự hủy đơn hàng khi đơn đang ở trạng thái chờ duyệt (`PENDING`).

### 4.3. Nhóm chức năng Quản trị viên (Admin)

- Bảng điều khiển tổng quan (Dashboard): Thống kê doanh thu thực tế, số lượng đơn hàng, biểu đồ và danh sách biến thể sắp hết hàng (`stock <= 5`).
- Quản lý Danh mục và Thương hiệu: Thêm mới, chỉnh sửa, bật/tắt hiển thị danh mục.
- Quản lý Sản phẩm và Biến thể: Thêm mới sản phẩm, tải lên bộ ảnh, cấu hình ma trận biến thể Size x Color x SKU, thiết lập giá niêm yết và giá khuyến mãi.
- Quản lý Tồn kho: Tra cứu tồn kho chi tiết theo từng mã SKU, điều chỉnh tăng/giảm kho thủ công có bắt buộc nhập lý do kiểm toán, xem lịch sử biến động kho (`inventory_transactions`).
- Vận hành Đơn hàng: Xem danh sách đơn, xem chi tiết snapshot đơn hàng, chuyển trạng thái theo quy trình (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`), hủy đơn nội bộ kèm lý do và tự động kích hoạt hoàn kho.
- Quản lý Mã giảm giá (Voucher): Thiết lập mã ưu đãi, mức giảm (% hoặc số tiền), giá trị đơn hàng tối thiểu, thời gian bắt đầu/kết thúc và tổng hạn mức sử dụng.
- Quản lý Banner: Thêm, sửa, xóa, sắp xếp thứ tự hiển thị banner trên slider trang chủ.

---

## 5. ĐỐI TƯỢNG SỬ DỤNG

Hệ thống VAMOS STORE trong phiên bản 1.0 chuẩn hóa chính xác **3 tác nhân (Actors)**:

1. **Khách vãng lai (`Guest`):** Người dùng truy cập website nhưng chưa đăng nhập tài khoản.
2. **Khách hàng (`Customer`):** Người dùng đã đăng ký và đăng nhập tài khoản thành viên, thực hiện mua hàng và quản lý đơn hàng của chính mình.
3. **Quản trị viên (`Admin`):** Người quản lý cấp cao có toàn quyền vận hành cửa hàng, quản trị kho hàng, xử lý đơn hàng và theo dõi tài chính.

> **Lưu ý nghiệp vụ:** Để đảm bảo tính tinh gọn, thực tiễn và phù hợp với quy mô doanh nghiệp bán lẻ giai đoạn đầu, hệ thống **không phân tách vai trò Nhân viên (Staff) riêng biệt**. Toàn bộ quyền duyệt đơn, chuyển kho và đóng gói được tập trung vào vai trò `Admin`.

---

## 6. CÔNG NGHỆ DÙNG ĐỂ PHÁT TRIỂN DỰ ÁN

| Hạng mục                | Công nghệ lựa chọn | Phiên bản khuyến nghị | Vai trò trong hệ thống VAMOS STORE                                                                               |
| :---------------------- | :----------------- | :-------------------: | :--------------------------------------------------------------------------------------------------------------- |
| **Ngôn ngữ lập trình**  | JavaScript (ES6+)  |    Node.js Runtime    | Ngôn ngữ phát triển toàn bộ Backend và xử lý logic nghiệp vụ.                                                    |
| **Nền tảng thực thi**   | Node.js            |   LTS v20.x / v24.x   | Môi trường chạy mã nguồn JavaScript phía máy chủ hiệu năng cao.                                                  |
| **Web Framework**       | Express.js         |          4.x          | Xây dựng hệ thống định tuyến (Routing), Middleware và Controller.                                                |
| **Kiến trúc ứng dụng**  | Layered MVC        |    Chuẩn kiến trúc    | Tách biệt Router $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Database. |
| **Template Engine**     | Pug (Jade)         |          3.x          | Kết xuất giao diện HTML phía máy chủ (Server-Side Rendering).                                                    |
| **CSS Framework**       | Tailwind CSS       |          3.x          | Xây dựng giao diện responsive hiện đại, tối ưu hóa kích thước stylesheet.                                        |
| **Hệ quản trị CSDL**    | MySQL              |          8.0          | Cơ sở dữ liệu quan hệ lưu trữ 18 bảng, xử lý Transaction và Khóa bi quan.                                        |
| **Trình điều khiển DB** | `mysql2/promise`   |          3.x          | Quản lý kết nối Connection Pool và hỗ trợ Promise/async-await.                                                   |
| **Quản lý phiên**       | `express-session`  |          1.x          | Quản lý phiên làm việc máy chủ an toàn, lưu thông tin User đăng nhập.                                            |
| **Mã hóa bảo mật**      | `bcryptjs`         |          2.x          | Băm mật khẩu một chiều chống tấn công tra cứu bảng cầu vồng.                                                     |
| **Container hóa**       | Docker & Compose   |        Latest         | Đóng gói ứng dụng web và cơ sở dữ liệu MySQL thành các container độc lập.                                        |
| **Công cụ thiết kế**    | PlantUML           |        Latest         | Vẽ sơ đồ Use Case, ERD quan hệ, Activity Diagram chuẩn UML.                                                      |

---

## 7. LẬP KẾ HOẠCH DỰ ÁN (PROJECT TIMELINE)

Dưới đây là kế hoạch phân bổ các giai đoạn thực hiện dự án môn học **Dự án Java (JAV102)** - VAMOS STORE được phân công chi tiết và đồng đều cho 3 thành viên trong nhóm (Bắt đầu từ **03/11/2026** đến **15/12/2026**, thời gian bảo vệ dự án dự kiến: **15/12/2026 - 17/12/2026**):

|   STT   | Hạng mục công việc                                  |        Người thực hiện         | Ngày bắt đầu | Ngày kết thúc |                Kết quả đạt được                 |
| :-----: | :-------------------------------------------------- | :----------------------------: | :----------: | :-----------: | :---------------------------------------------: |
|  **I**  | **GIAI ĐOẠN 1: PHÂN TÍCH YÊU CẦU & NGHIỆP VỤ**      |                                |              |               |                                                 |
|    1    | Khảo sát bài toán kinh doanh giày dép trực tuyến    |            Cả nhóm             |  03/11/2026  |  05/11/2026   | Tài liệu phạm vi dự án (`01-project-scope.md`)  |
|    2    | Phân tích 3 tác nhân (`Guest`, `Customer`, `Admin`) |         Trần Trung Dũng        |  06/11/2026  |  07/11/2026   |    Tài liệu đặc tả tác nhân (`02-actors.md`)    |
|    3    | Xây dựng danh mục Use Case & Quy tắc nghiệp vụ      |  Trần Vĩnh Nhật, T. T. Dũng    |  07/11/2026  |  08/11/2026   |     Catalog Use Case và Business Rules v1.1     |
| **II**  | **GIAI ĐOẠN 2: THIẾT KẾ HỆ THỐNG**                  |                                |              |               |                                                 |
|    4    | Thiết kế sơ đồ Use Case tổng quát & chi tiết        |         Trần Vĩnh Nhật         |  09/11/2026  |  10/11/2026   | 5 Sơ đồ Use Case PlantUML (`uc-00` đến `uc-04`) |
|    5    | Thiết kế sơ đồ điều hướng màn hình (Sitemap)        |       Trần Duy Hoàng Sa        |  10/11/2026  |  11/11/2026   |          Bản vẽ cây điều hướng Sitemap          |
|    6    | Thiết kế mô hình CSDL (ERD) & Từ điển dữ liệu       |         Trần Trung Dũng        |  11/11/2026  |  13/11/2026   | ERD 18 bảng, `schema.sql`, `data-dictionary.md` |
|    7    | Thiết kế sơ đồ hoạt động (Activity Diagrams)        |         Trần Vĩnh Nhật         |  12/11/2026  |  14/11/2026   | 5 Sơ đồ Activity PlantUML (`ad-01` đến `ad-05`) |
|    8    | Thiết kế khung xương giao diện (Wireframe)          |       Trần Duy Hoàng Sa        |  13/11/2026  |  15/11/2026   |     Đặc tả khung layout 10 màn hình cốt lõi     |
| **III** | **GIAI ĐOẠN 3: HIỆN THỰC MÃ NGUỒN (DEVELOPMENT)**   |                                |              |               |                                                 |
|    9    | Khởi tạo cấu trúc dự án MVC phân lớp & Database     |         Trần Trung Dũng        |  16/11/2026  |  18/11/2026   |    Khung source code Node.js, Pug, Tailwind     |
|   10    | Hiện thực Module Xác thực (Auth) & Khách hàng       |         Trần Trung Dũng        |  19/11/2026  |  24/11/2026   |       Đăng ký, đăng nhập, session, bcrypt       |
|   11    | Hiện thực Module Sản phẩm, Biến thể & Bộ lọc        |         Trần Vĩnh Nhật         |  19/11/2026  |  26/11/2026   |  Quản lý sản phẩm, lọc đa tiêu chí, chọn size   |
|   12    | Hiện thực Module Giỏ hàng, Voucher & Đặt hàng COD   |         Trần Trung Dũng        |  25/11/2026  |  30/11/2026   |   Transaction đặt hàng COD, trừ kho, voucher    |
|   13    | Hiện thực Module Quản trị Đơn hàng & Quản lý Kho    |       Trần Duy Hoàng Sa        |  26/11/2026  |  02/12/2026   | Máy trạng thái đơn hàng, hoàn kho, audit trail  |
| **IV**  | **GIAI ĐOẠN 4: KIỂM THỬ HỆ THỐNG (TESTING)**        |                                |              |               |                                                 |
|   14    | Xây dựng bộ kịch bản kiểm thử (Test Cases)          |            Cả nhóm             |  03/12/2026  |  04/12/2026   |   25+ kịch bản test phân chia đều cho 3 thành viên |
|   15    | Thực thi kiểm thử Auth, Giỏ hàng, Đặt hàng COD      |         Trần Trung Dũng        |  05/12/2026  |  08/12/2026   |        Báo cáo kết quả kiểm thử phân hệ Khách hàng |
|   16    | Thực thi kiểm thử Sản phẩm, Biến thể, Bộ lọc, Banner|         Trần Vĩnh Nhật         |  05/12/2026  |  08/12/2026   |       Báo cáo kết quả kiểm thử phân hệ Catalog  |
|   17    | Thực thi kiểm thử Quản lý đơn, Quản lý kho, Voucher |       Trần Duy Hoàng Sa        |  05/12/2026  |  08/12/2026   |      Báo cáo kết quả kiểm thử phân hệ Quản trị  |
|  **V**  | **GIAI ĐOẠN 5: TRIỂN KHAI & ĐÓNG GÓI BÁO CÁO**      |                                |              |               |                                                 |
|   18    | Đóng gói triển khai môi trường Docker Compose       |       Trần Duy Hoàng Sa        |  09/12/2026  |  11/12/2026   |     Kịch bản container hóa Local Server & Nginx |
|   19    | Biên soạn và hoàn thiện Báo cáo Dự án               |            Cả nhóm             |  11/12/2026  |  14/12/2026   | Bản thảo báo cáo hoàn chỉnh từ Chương I đến VI  |
|   20    | Rà soát định dạng Word, in ấn và chuẩn bị bảo vệ    |            Cả nhóm             |  14/12/2026  |  15/12/2026   |     Tập báo cáo sẵn sàng bảo vệ (15-17/12/2026) |

_Bảng 1: Lập kế hoạch dự án VAMOS STORE_
