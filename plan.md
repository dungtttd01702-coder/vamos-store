# PROJECT PLAN -- VAMOS STORE (Phiên bản v1.1 Chuẩn hóa)

## Website thương mại điện tử kinh doanh giày dép

> **Tên dự án:** VAMOS STORE  
> **Thương hiệu:** VAMOS  
> **Slogan:** MOVE YOUR WAY.  
> **Loại hệ thống:** Website thương mại điện tử chuyên kinh doanh giày dép  
> **Phiên bản tài liệu:** 1.1 (Chuẩn hóa kiến trúc 3 Actor, tinh gọn Use Case & đồng bộ nghiệp vụ)  
> **Mục đích:** Tài liệu kỹ thuật nền tảng cho phân tích nghiệp vụ, vẽ Use Case Diagram, Activity Diagram, ERD, thiết kế giao diện và lập trình triển khai hệ thống.

---

# 1. TỔNG QUAN DỰ ÁN

## 1.1. Giới thiệu

**VAMOS STORE** là website thương mại điện tử chuyên kinh doanh các dòng sản phẩm giày dép (Sneaker, Giày thể thao, Giày chạy bộ, Sandal, Dép thời trang) và một số phụ kiện chăm sóc giày. Website cung cấp trải nghiệm mua sắm trực tuyến hiện đại: duyệt danh mục, tìm kiếm, lọc đa tiêu chí, xem chi tiết biến thể kích cỡ và màu sắc, quản lý giỏ hàng, đặt hàng thanh toán khi nhận hàng (COD) và tra cứu tiến trình đơn hàng.

Hệ thống cung cấp khu vực quản trị riêng (Admin Portal) để người quản trị quản lý toàn diện danh mục sản phẩm, biến thể kho hàng, vận hành đơn hàng, quản lý mã giảm giá (voucher), quản lý khách hàng và theo dõi báo cáo doanh thu kinh doanh.

Dự án tham khảo mô hình kinh doanh và trải nghiệm mua sắm tiện lợi của Biti's (cách tổ chức danh mục, lọc giới tính, kích cỡ, màu sắc, sắp xếp). VAMOS STORE sở hữu bản sắc thương hiệu, logo, slogan, nội dung, hình ảnh, bảng màu và dữ liệu hoàn toàn độc lập; tuyệt đối không sao chép tài sản trí tuệ độc quyền của Biti's hay bất kỳ thương hiệu nào khác.

- Website tham khảo mô hình: https://bitis.com.vn/

## 1.2. Mục tiêu dự án

- Xây dựng website bán giày dép có giao diện responsive hiện đại, tối ưu trên máy tính, máy tính bảng và điện thoại di động.
- Hỗ trợ khách sắm giày trực quan với bộ lọc chuyên biệt (danh mục, giới tính, kích cỡ, màu sắc, khoảng giá).
- Quản lý chính xác sản phẩm đa biến thể theo từng cặp Kích cỡ (Size) x Màu sắc (Color) gắn với mã SKU duy nhất.
- Vận hành quy trình giỏ hàng, đặt hàng và thanh toán COD minh bạch, an toàn dữ liệu bằng Database Transaction.
- Kiểm soát chặt chẽ tồn kho theo từng biến thể, tự động hoàn kho khi hủy đơn hợp lệ, ngăn chặn bán vượt tồn kho (Overselling).
- Cung cấp khu vực quản trị tập trung giúp Admin xử lý đơn hàng, điều chỉnh kho có lý do và theo dõi hiệu quả kinh doanh.
- Thiết lập bộ tài liệu phân tích kỹ thuật chuẩn mực (Use Case, Activity Diagram, ERD) làm nền móng vững chắc trước khi lập trình.

## 1.3. Đối tượng sử dụng (Chuẩn hóa 3 Actors)

Hệ thống trong phiên bản 1.0 chuẩn hóa chính xác **3 tác nhân người dùng (Primary Actors)**:

1. **Khách vãng lai (Guest):** Người dùng truy cập website chưa đăng nhập; có quyền xem trang chủ, tìm kiếm, lọc và xem chi tiết sản phẩm, đăng ký tài khoản, đăng nhập hoặc yêu cầu khôi phục mật khẩu.
2. **Khách hàng (Customer):** Người dùng đã đăng nhập tài khoản; có toàn quyền duyệt sản phẩm, quản lý hồ sơ cá nhân, quản lý sổ địa chỉ giao hàng, quản lý giỏ hàng, đặt hàng COD, áp dụng voucher, theo dõi tiến trình đơn hàng và hủy đơn hàng khi đơn còn ở trạng thái Chờ xác nhận (`PENDING`).
3. **Quản trị viên (Admin):** Người quản lý và vận hành toàn diện hệ thống: quản lý sản phẩm, danh mục, banner, biến thể; điều chỉnh tồn kho có lưu vết; tiếp nhận và cập nhật trạng thái đơn hàng; quản lý khách hàng; quản lý voucher và xem báo cáo doanh thu. (Đã hợp nhất vai trò Nhân viên vận hành vào Quản trị viên để tối giản kiến trúc phân quyền v1.0).

_Tác nhân hệ thống phụ (Secondary Actor):_ **Email Service** (hỗ trợ gửi email chứa token khôi phục mật khẩu).

## 1.4. Phạm vi phiên bản đầu tiên (Scope Definition)

### Trong phạm vi (In Scope)

- Trang chủ, menu điều hướng danh mục và quản lý banner quảng bá VAMOS.
- Danh sách sản phẩm, phân trang, tìm kiếm theo từ khóa/mã sản phẩm.
- Bộ lọc kết hợp đa tiêu chí: danh mục, giới tính (Nam, Nữ, Trẻ em, Unisex), kích cỡ (size), màu sắc, khoảng giá.
- Sắp xếp sản phẩm: giá tăng/giảm, mới nhất, tên A-Z.
- Trang chi tiết sản phẩm: mô tả, bộ ảnh sản phẩm, chọn màu sắc & kích cỡ, hiển thị trạng thái tồn kho biến thể, sản phẩm liên quan.
- Đăng ký tài khoản, đăng nhập, đăng xuất, khôi phục mật khẩu qua token email.
- Quản lý thông tin cá nhân và quản lý sổ nhiều địa chỉ nhận hàng.
- Giỏ hàng: thêm sản phẩm theo biến thể, tăng/giảm số lượng, xóa dòng sản phẩm.
- Đặt hàng trực tuyến với duy nhất phương thức thanh toán khi nhận hàng (COD).
- Áp dụng mã giảm giá (voucher) thỏa mãn điều kiện đơn hàng tối thiểu và hạn mức (tối đa 1 voucher/đơn).
- Xem lịch sử đơn hàng, xem chi tiết đơn hàng (lưu snapshot thông tin SP tại thời điểm mua), theo dõi dòng thời gian trạng thái.
- Khách hàng tự hủy đơn hàng khi đơn ở trạng thái `PENDING` (hệ thống tự động hoàn kho 1 lần duy nhất).
- Quản trị sản phẩm, biến thể kích cỡ/màu sắc, quản lý ảnh, ẩn/hiện sản phẩm kinh doanh.
- Quản lý danh mục và thương hiệu/bộ sưu tập nội bộ của VAMOS.
- Quản lý tồn kho theo SKU biến thể, cảnh báo tồn kho thấp, điều chỉnh tồn kho có lưu vết lý do.
- Quản lý đơn hàng: tìm kiếm, lọc đơn, xác nhận đơn, cập nhật trạng thái đơn hàng, hủy đơn nội bộ kèm hoàn kho.
- Quản lý khách hàng: xem hồ sơ, xem lịch sử mua hàng, khóa/mở khóa tài khoản khách hàng.
- Quản lý voucher: tạo mã, cấu hình giảm giá theo % hoặc tiền cố định, thời hạn, giới hạn lượt dùng, bật/tắt mã.
- Báo cáo thống kê: tổng đơn hàng, doanh thu thực tế (chỉ tính từ đơn `COMPLETED`), top sản phẩm bán chạy, sản phẩm sắp hết hàng.

### Ngoài phạm vi (Out of Scope - v1.0)

- Ứng dụng di động độc lập (iOS/Android native app) — Website tối ưu responsive trên mọi kích thước màn hình.
- Tích hợp cổng thanh toán trực tuyến (VNPAY, MoMo, ZaloPay, Thẻ quốc tế).
- Tích hợp API tự động với các hãng vận chuyển (GHN, GHTK, Viettel Post) — Sử dụng phí vận chuyển cố định cấu hình nội bộ.
- Hệ thống Live-chat thời gian thực hoặc Chatbot AI.
- Tính năng Livestream bán hàng.
- Hệ thống tích điểm thưởng / thăng hạng thành viên nâng cao.
- Đánh giá sản phẩm công khai kèm bình luận / Hỏi đáp (Q&A/Review) tại trang chi tiết sản phẩm.
- Đề xuất sản phẩm bằng trí tuệ nhân tạo (AI Recommendation).
- Quản lý đa chi nhánh và mạng lưới đa kho hàng độc lập.
- Tích hợp phần mềm kế toán / ERP bên ngoài.

---

# 2. THƯƠNG HIỆU VÀ ĐỊNH HƯỚNG GIAO DIỆN

## 2.1. Nhận diện thương hiệu

- **Tên thương hiệu:** VAMOS
- **Tên website:** VAMOS STORE
- **Slogan:** MOVE YOUR WAY.
- **Định hướng phong cách:** Trẻ trung, năng động, tối giản, hiện đại, làm nổi bật đường nét và chất lượng sản phẩm giày dép.

## 2.2. Bảng màu đề xuất (Brand Color Palette)

| Vai trò                  | Tên màu                          | Mã Hex    | Ứng dụng                                                 |
| :----------------------- | :------------------------------- | :-------- | :------------------------------------------------------- |
| **Màu chữ & nền chính**  | Đen than (Charcoal)              | `#151515` | Thanh header, typography chính, nút bấm primary          |
| **Màu nền giao diện**    | Trắng tinh khôi (White)          | `#FFFFFF` | Nền trang web, thẻ card sản phẩm, popup                  |
| **Màu nhấn thương hiệu** | Đỏ cam năng động (Vibrant Coral) | `#E94B35` | Nút kêu gọi hành động (CTA), badge giảm giá, icon active |
| **Màu nền phụ**          | Xám nhạt (Light Gray)            | `#F5F5F5` | Nền khối nội dung phụ, breadcrumbs, footer               |
| **Màu chữ phụ**          | Xám trung tính (Muted Gray)      | `#777777` | Mô tả phụ, nhãn phụ, ngày tháng, thông tin bản quyền     |

## 2.3. Nguyên tắc UI/UX cốt lõi

- Ưu tiên hình ảnh sản phẩm chất lượng cao, đồng nhất tỷ lệ khung hình (1:1 hoặc 3:4).
- Header tinh gọn: Logo VAMOS nổi bật, menu danh mục, thanh tìm kiếm nhanh, icon tài khoản và giỏ hàng có badge số lượng.
- Trang danh sách sản phẩm trang bị bộ lọc bên trái (Sidebar filter) tiện dụng, hỗ trợ thu gọn trên màn hình thiết bị di động.
- Thẻ sản phẩm hiển thị trực quan: Ảnh đại diện, nhãn New/Sale, tên sản phẩm, giá niêm yết, giá khuyến mãi.
- Trang chi tiết sản phẩm bắt buộc yêu cầu chọn Màu sắc và Kích cỡ trước khi thêm vào giỏ hàng.
- Phản hồi tương tác người dùng rõ ràng (Toast notification) khi thao tác thành công hoặc phát sinh lỗi nghiệp vụ.

---

# 3. QUY TRÌNH NGHIỆP VỤ TỔNG QUÁT

## 3.1. Quy trình mua hàng (Shopping & Checkout Flow)

1. Người dùng truy cập website VAMOS STORE.
2. Người dùng tìm kiếm hoặc lọc sản phẩm theo nhu cầu (danh mục, giới tính, size, màu, giá).
3. Người dùng mở trang chi tiết sản phẩm, chọn màu sắc, kích cỡ và số lượng mong muốn.
4. Hệ thống kiểm tra số lượng tồn kho khả dụng của biến thể được chọn.
5. Người dùng thêm sản phẩm vào giỏ hàng.
6. Khi tiến hành đặt hàng (Checkout), hệ thống yêu cầu khách hàng đăng nhập tài khoản.
7. Customer kiểm tra giỏ hàng, chọn hoặc nhập địa chỉ nhận hàng, nhập ghi chú đơn hàng.
8. Customer nhập mã giảm giá (voucher) nếu có. Hệ thống xác thực tính hợp lệ và chiết khấu.
9. Hệ thống tính toán tổng thanh toán: `Tổng tiền = Tạm tính - Giảm giá + Phí vận chuyển`.
10. Customer xác nhận đặt hàng với phương thức COD.
11. Hệ thống thực thi **Database Transaction**: Khóa dòng kiểm tra tồn kho thời gian thực, lưu đơn hàng `orders` ở trạng thái `PENDING`, lưu snapshot chi tiết vào `order_items`, trừ tồn kho biến thể, tăng lượt dùng voucher và làm sạch các dòng đã đặt trong giỏ hàng.
12. Customer nhận thông báo đặt hàng thành công kèm mã đơn hàng duy nhất và tổng tiền cần chuẩn bị khi nhận hàng.
13. Admin tiếp nhận, xác nhận và xử lý giao vận đơn hàng.
14. Customer tra cứu và theo dõi tiến trình đơn hàng trong trang Đơn hàng cá nhân.

## 3.2. Quy trình xử lý đơn hàng (Order State Machine)

Hệ thống quản lý vòng đời đơn hàng theo máy trạng thái nghiêm ngặt:

```text
[ PENDING ] ──────► [ CONFIRMED ] ──────► [ PROCESSING ] ──────► [ SHIPPING ] ──────► [ COMPLETED ]
     │                     │
     ▼                     ▼
[ CANCELLED ]        [ CANCELLED ]
(Khách hoặc Admin)     (Chỉ Admin hủy)
```

- **`PENDING` (Chờ xác nhận):** Đơn vừa được khách tạo thành công. Tồn kho đã trừ. Khách hàng hoặc Admin được phép hủy đơn.
- **`CONFIRMED` (Đã xác nhận):** Admin đã kiểm tra thông tin liên lạc và xác nhận đơn hợp lệ. Chỉ Admin được phép hủy đơn.
- **`PROCESSING` (Đang chuẩn bị hàng):** Đơn đang được xuất kho và đóng gói. Không cho phép hủy trực tiếp trên giao diện thông thường.
- **`SHIPPING` (Đang giao hàng):** Đơn đã giao cho đơn vị vận chuyển.
- **`COMPLETED` (Hoàn thành):** Khách đã nhận hàng và thanh toán đủ tiền COD. Hệ thống tự động chuyển `payment_status = 'PAID'`. Doanh thu chính thức được ghi nhận.
- **`CANCELLED` (Đã hủy):** Đơn bị hủy hợp lệ; hệ thống tự động hoàn lại tồn kho biến thể đúng một lần duy nhất (Idempotent).

_Ghi vết lịch sử:_ Mỗi lần chuyển trạng thái, hệ thống bắt buộc lưu một bản ghi vào `order_status_histories` (mã đơn, trạng thái trước/sau, người thực hiện, lý do, thời gian).

## 3.3. Quy tắc tồn kho (Inventory Rules)

- Tồn kho được quản lý chặt chẽ theo từng biến thể sản phẩm chi tiết (**Product Variant = Size + Color + SKU**), không quản lý chung theo sản phẩm cha.
- Không cho phép số lượng tồn kho âm (`stock_quantity >= 0`).
- Giỏ hàng **không giữ chỗ tồn kho** (No Cart Reservation).
- Thao tác trừ kho diễn ra tại thời điểm bấm "Xác nhận đặt hàng" bên trong Database Transaction để triệt tiêu Race Condition.
- Khi đơn hàng bị hủy (`CANCELLED`) sau khi đã trừ kho, hệ thống tự động hoàn trả lại số lượng từng biến thể về kho. Cơ chế hoàn kho đảm bảo chạy duy nhất 1 lần.
- Mọi thao tác điều chỉnh tồn kho thủ công của Admin (nhập thêm hàng, xuất kiểm kê, hỏng rách) bắt buộc lưu vết vào `inventory_transactions` kèm số lượng trước, sau, lý do và User ID.

## 3.4. Quy tắc giá và khuyến mãi (Pricing & Promotions)

- Giá bán niêm yết (`base_price`) và giá khuyến mãi (`sale_price`) phải là số nguyên không âm. Nếu có khuyến mãi: `0 <= sale_price < base_price`.
- **Nguyên tắc Snapshot:** Dữ liệu tên sản phẩm, mã SKU, tên kích cỡ, màu sắc và đơn giá tại thời điểm đặt hàng phải được lưu bản sao tĩnh vào `order_items`. Mọi thay đổi về giá hoặc thông tin sản phẩm sau này của Admin tuyệt đối không làm sai lệch lịch sử đơn cũ.
- **Quy tắc Voucher:** Mã voucher phải đang kích hoạt, trong khung thời gian hiệu lực, chưa hết lượt sử dụng và đạt giá trị đơn tối thiểu. Mỗi đơn hàng chỉ áp dụng tối đa **01 voucher duy nhất**. Số tiền giảm không vượt quá tổng tiền hàng tạm tính.
- Phí vận chuyển áp dụng mức cố định (Flat fee) cấu hình trong hệ thống (v1.0).

## 3.5. Quy tắc tài khoản và bảo mật (Security Rules)

- Địa chỉ Email là định danh tài khoản duy nhất trên toàn hệ thống.
- Mật khẩu tài khoản bắt buộc băm an toàn bằng thuật toán mã hóa mạnh (bcrypt salt rounds >= 10), tuyệt đối không lưu plaintext.
- Tài khoản bị khóa (`status = 'locked'`) lập tức bị từ chối đăng nhập và hủy phiên làm việc.
- Kiểm tra quyền hạn nghiêm ngặt ở phía Server (Server-side middleware), không bao giờ tin tưởng cờ Role gửi từ Client.
- Khách hàng chỉ được phép truy xuất dữ liệu thuộc quyền sở hữu của chính mình (`order.user_id === session.user.id`).

---

# 4. ACTORS -- TÁC NHÂN HỆ THỐNG (CHUẨN HÓA 3 TÁC NHÂN CHÍNH)

| Mã Actor   | Tên Actor                  | Loại tác nhân      | Mô tả & Vai trò                                                  | Phạm vi trách nhiệm chính                                                                                                                                                                                                                                                                |
| :--------- | :------------------------- | :----------------- | :--------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ACT-01** | **Guest** (Khách vãng lai) | Human / Primary    | Người dùng chưa đăng nhập vào hệ thống website VAMOS STORE.      | Xem trang chủ, tìm kiếm, lọc và sắp xếp sản phẩm, xem chi tiết sản phẩm; đăng ký tài khoản mới; đăng nhập; yêu cầu khôi phục mật khẩu.                                                                                                                                                   |
| **ACT-02** | **Customer** (Khách hàng)  | Human / Primary    | Khách hàng đã đăng nhập tài khoản.                               | Xem, tìm kiếm và lọc sản phẩm; quản lý hồ sơ cá nhân; quản lý sổ địa chỉ giao hàng; quản lý giỏ hàng; đặt hàng thanh toán COD; áp dụng voucher; xem lịch sử đơn hàng; theo dõi tiến trình đơn hàng; hủy đơn hàng (khi đơn là PENDING).                                                   |
| **ACT-03** | **Admin** (Quản trị viên)  | Human / Primary    | Người quản lý và vận hành toàn bộ hệ thống bán hàng VAMOS STORE. | Quản lý danh mục & sản phẩm; quản lý biến thể Size/Màu/SKU; quản lý hình ảnh; quản lý banner; quản lý tồn kho và điều chỉnh tồn kho có lý do; xử lý và cập nhật trạng thái đơn hàng; hủy đơn nội bộ kèm hoàn kho; quản lý khách hàng; quản lý voucher; xem báo cáo doanh thu kinh doanh. |
| **ACT-04** | **Email Service**          | System / Secondary | Dịch vụ gửi thư điện tử bên ngoài (SMTP/NodeMailer).             | Tiếp nhận yêu cầu gửi email chứa token khôi phục mật khẩu khi có yêu cầu hợp lệ từ người dùng.                                                                                                                                                                                           |

_Lưu ý kiến trúc:_ Đã loại bỏ tác nhân `Staff` khỏi phiên bản 1.0; toàn bộ trách nhiệm vận hành đơn hàng và kiểm kho được chuyển giao tập trung cho `Admin`. Tác nhân `Shipping Service` không thuộc phạm vi v1.0.

---

# 5. DANH MỤC USE CASE CHUẨN HÓA (14 USE CASES CỐT LÕI)

Toàn bộ hệ thống VAMOS STORE được chuẩn hóa thành đúng **14 Use Cases nghiệp vụ** được phân nhóm mạch lạc, triệt tiêu hoàn toàn sự phân rã vụn vặt và chồng chéo chức năng:

| Mã UC     | Tên Use Case                    | Actor chính            | Mô tả ngắn                                                                                            | Mức độ ưu tiên |
| :-------- | :------------------------------ | :--------------------- | :---------------------------------------------------------------------------------------------------- | :------------: |
| **UC-01** | **Đăng ký tài khoản**           | Guest                  | Tạo tài khoản khách hàng mới với email độc nhất và mật khẩu băm an toàn.                              |      High      |
| **UC-02** | **Đăng nhập**                   | Guest, Customer, Admin | Xác thực danh tính và cấp phiên làm việc (Session) an toàn cho người dùng.                            |      High      |
| **UC-03** | **Khôi phục mật khẩu**          | Guest (phụ: Email Svc) | Yêu cầu và thiết lập lại mật khẩu mới thông qua mã token gửi qua email.                               |     Medium     |
| **UC-04** | **Quản lý hồ sơ & địa chỉ**     | Customer               | Xem, sửa thông tin cá nhân và quản lý danh sách các địa chỉ giao hàng.                                |      High      |
| **UC-05** | **Tìm kiếm & xem sản phẩm**     | Guest, Customer        | Duyệt danh mục, tìm kiếm theo tên/mã, lọc kết hợp (size, màu, giá) và xem chi tiết sản phẩm.          |      High      |
| **UC-06** | **Quản lý giỏ hàng**            | Customer               | Xem giỏ hàng, thêm sản phẩm theo biến thể size/màu, thay đổi số lượng, xóa sản phẩm.                  |      High      |
| **UC-07** | **Đặt hàng COD**                | Customer               | Tiến hành checkout, chọn địa chỉ nhận, áp dụng voucher (`<<extend>>`), tạo đơn COD trong Transaction. |      High      |
| **UC-08** | **Tra cứu & theo dõi đơn hàng** | Customer               | Xem lịch sử đơn hàng, xem chi tiết snapshot và dòng thời gian trạng thái đơn.                         |      High      |
| **UC-09** | **Hủy đơn hàng**                | Customer               | Hủy đơn hàng khi đơn còn ở trạng thái `PENDING` (`<<extend>>` từ UC-08); tự động hoàn kho.            |      High      |
| **UC-10** | **Xử lý & cập nhật đơn hàng**   | Admin                  | Xem danh sách đơn, xác nhận đơn, chuyển tiếp trạng thái đơn hàng và hủy đơn nội bộ kèm hoàn kho.      |      High      |
| **UC-11** | **Quản lý tồn kho**             | Admin                  | Theo dõi tồn kho theo SKU, xem cảnh báo sắp hết hàng và điều chỉnh tồn kho có ghi nhận lý do.         |      High      |
| **UC-12** | **Quản lý sản phẩm & danh mục** | Admin                  | Quản lý danh mục, banner, thêm/sửa sản phẩm kèm biến thể (Size/Màu/SKU) và ảnh.                       |      High      |
| **UC-13** | **Quản lý mã giảm giá**         | Admin                  | Tạo mới, cập nhật thông tin, điều kiện giá trị đơn tối thiểu và bật/tắt voucher.                      |     Medium     |
| **UC-14** | **Xem báo cáo doanh thu**       | Admin                  | Xem dashboard tổng quan và báo cáo doanh thu thực tế (chỉ tính từ các đơn COMPLETED).                 |      High      |

---

# 6. ĐẶC TẢ CÁC USE CASE QUAN TRỌNG

## 6.1. UC-01 -- Đăng ký tài khoản

- **Actor chính:** Guest
- **Mục tiêu:** Tạo tài khoản Customer mới để mua hàng.
- **Tiền điều kiện:** Guest đang ở website và chưa đăng nhập.
- **Hậu điều kiện thành công:** Bản ghi tài khoản mới được tạo với role `CUSTOMER`, trạng thái `active`, mật khẩu được băm an toàn.
- **Luồng chính:**
  1. Guest chọn chức năng "Đăng ký".
  2. Hệ thống hiển thị biểu mẫu đăng ký.
  3. Guest nhập họ tên, email, số điện thoại, mật khẩu và xác nhận mật khẩu.
  4. Hệ thống kiểm tra dữ liệu bắt buộc, định dạng email, độ dài mật khẩu.
  5. Hệ thống kiểm tra tính duy nhất của email trong CSDL.
  6. Hệ thống băm mật khẩu bằng bcrypt.
  7. Hệ thống tạo tài khoản mới.
  8. Hệ thống thông báo thành công và chuyển hướng đến trang Đăng nhập.
- **Ngoại lệ:** Email đã tồn tại $\rightarrow$ Báo lỗi email đã được đăng ký. Mật khẩu xác nhận không khớp $\rightarrow$ Báo lỗi.

## 6.2. UC-02 -- Đăng nhập

- **Actor chính:** Guest, Customer, Admin
- **Mục tiêu:** Xác thực danh tính và cấp session truy cập.
- **Tiền điều kiện:** Tài khoản đã đăng ký và không ở trạng thái `locked`.
- **Luồng chính:**
  1. Người dùng mở form Đăng nhập, nhập Email và Mật khẩu.
  2. Hệ thống kiểm tra tài khoản theo email.
  3. Hệ thống kiểm tra tài khoản không bị khóa (`status !== 'locked'`).
  4. Hệ thống đối chiếu mật khẩu với hash trong CSDL.
  5. Hệ thống tạo session phía server (`req.session.user`).
  6. Hệ thống điều hướng: Admin vào `/admin/dashboard`, Customer về trang chủ/giỏ hàng.
- **Ngoại lệ:** Sai email hoặc mật khẩu $\rightarrow$ Báo lỗi thông tin đăng nhập không chính xác. Tài khoản bị khóa $\rightarrow$ Báo lỗi tài khoản bị tạm khóa.

## 6.3. UC-05 -- Tìm kiếm & xem sản phẩm

- **Actor chính:** Guest, Customer
- **Mục tiêu:** Khám phá sản phẩm, tìm kiếm, lọc và xem thông tin chi tiết biến thể kích cỡ, màu sắc.
- **Tiền điều kiện:** Khách truy cập website.
- **Luồng chính:**
  1. Người dùng duyệt danh sách sản phẩm hoặc nhập từ khóa tìm kiếm.
  2. Người dùng áp dụng bộ lọc (danh mục, giới tính, kích cỡ, màu sắc, khoảng giá) hoặc sắp xếp.
  3. Hệ thống trả về danh sách sản phẩm `active` thỏa mãn điều kiện.
  4. Người dùng bấm vào một sản phẩm cụ thể.
  5. Hệ thống tải chi tiết sản phẩm: tên, mô tả, bộ ảnh, bảng chọn size/màu và hiển thị trạng thái tồn kho khả dụng theo từng biến thể.
- **Ngoại lệ:** Sản phẩm bị ẩn hoặc không tồn tại $\rightarrow$ Báo lỗi 404 không tìm thấy sản phẩm.

## 6.4. UC-06 -- Quản lý giỏ hàng

- **Actor chính:** Customer
- **Mục tiêu:** Quản lý các mặt hàng dự định mua trong giỏ hàng cá nhân.
- **Tiền điều kiện:** Customer đã đăng nhập tài khoản.
- **Luồng chính:**
  1. Tại trang chi tiết sản phẩm, Customer chọn màu sắc, kích cỡ, số lượng và bấm "Thêm vào giỏ hàng".
  2. Hệ thống xác định biến thể (`product_variant_id`) và kiểm tra số lượng tồn kho khả dụng.
  3. Hệ thống thêm mới hoặc cộng dồn số lượng vào `cart_items` của Customer.
  4. Customer mở trang giỏ hàng: có thể tăng/giảm số lượng hoặc xóa dòng sản phẩm.
  5. Hệ thống tự động tính lại tổng số lượng và tạm tính tiền hàng.
- **Ngoại lệ:** Số lượng yêu cầu vượt quá tồn kho $\rightarrow$ Báo lỗi số lượng trong kho không đủ.

## 6.5. UC-07 -- Đặt hàng COD

- **Actor chính:** Customer
- **Mục tiêu:** Xác nhận tạo đơn hàng chính thức thanh toán COD và trừ tồn kho an toàn.
- **Tiền điều kiện:** Customer đã đăng nhập; giỏ hàng có ít nhất một sản phẩm.
- **Luồng chính (Database Transaction):**
  1. Customer chọn "Tiến hành đặt hàng" từ giỏ hàng.
  2. Hệ thống hiển thị danh sách sản phẩm, số lượng, đơn giá.
  3. Customer chọn địa chỉ nhận hàng có sẵn hoặc thêm địa chỉ mới.
  4. Customer nhập mã giảm giá (nếu có). Hệ thống kiểm tra voucher và khấu trừ tiền giảm.
  5. Customer xác nhận phương thức COD và bấm "Xác nhận đặt hàng".
  6. Hệ thống khởi tạo Database Transaction:
     - Khóa dòng kiểm tra tồn kho thời gian thực của các biến thể (`SELECT ... FOR UPDATE`).
     - Tạo mã đơn hàng duy nhất và lưu bản ghi đơn hàng `orders` ở trạng thái `PENDING`.
     - Tạo các bản ghi `order_items` lưu snapshot tên SP, SKU, Size, Màu, đơn giá tại thời điểm đặt.
     - Trừ số lượng tồn kho tương ứng trong `product_variants`.
     - Ghi nhận giao dịch xuất kho vào `inventory_transactions`.
     - Tăng số lượt sử dụng của voucher (nếu có).
     - Ghi bản ghi khởi tạo trạng thái vào `order_status_histories`.
     - Xóa các sản phẩm đã đặt khỏi giỏ hàng.
  7. Hệ thống Commit Transaction.
  8. Hệ thống hiển thị màn hình kết quả đặt hàng thành công kèm mã đơn và tổng tiền COD.
- **Ngoại lệ:** Tồn kho không đủ tại thời điểm xác nhận $\rightarrow$ Rollback Transaction, báo lỗi và yêu cầu điều chỉnh giỏ hàng.

## 6.6. UC-09 -- Hủy đơn hàng (Customer)

- **Actor chính:** Customer
- **Mục tiêu:** Khách hàng hủy đơn hàng khi đơn còn ở giai đoạn chờ xác nhận.
- **Tiền điều kiện:** Customer đã đăng nhập; đơn hàng thuộc quyền sở hữu của Customer; trạng thái hiện tại là `PENDING`.
- **Luồng chính (Database Transaction):**
  1. Customer mở chi tiết đơn hàng, hệ thống kiểm tra trạng thái là `PENDING` và hiển thị nút "Hủy đơn".
  2. Customer bấm "Hủy đơn" và xác nhận.
  3. Hệ thống mở Transaction: Khóa đơn, cập nhật trạng thái đơn thành `CANCELLED`.
  4. Hệ thống duyệt các dòng `order_items`, cộng hoàn trả số lượng về tồn kho `product_variants`.
  5. Hệ thống ghi nhận lịch sử hoàn kho vào `inventory_transactions`.
  6. Hệ thống ghi vết vào `order_status_histories` (`changed_by = Customer_id`, `note = 'Khách tự hủy'`).
  7. Hệ thống Commit Transaction và cập nhật giao diện đơn sang trạng thái ĐÃ HỦY.
- **Ngoại lệ:** Đơn hàng đã chuyển sang `CONFIRMED` hoặc trạng thái tiếp theo $\rightarrow$ Từ chối hủy, thông báo đơn đã được tiếp nhận xử lý.

## 6.7. UC-10 -- Xử lý & cập nhật đơn hàng (Admin)

- **Actor chính:** Admin
- **Mục tiêu:** Vận hành và chuyển tiếp trạng thái đơn hàng theo đúng vòng đời nghiệp vụ.
- **Tiền điều kiện:** Admin đã đăng nhập hệ thống.
- **Luồng chính:**
  1. Admin mở danh sách đơn hàng, tìm kiếm và chọn một đơn cụ thể.
  2. Hệ thống hiển thị đầy đủ chi tiết đơn hàng, thông tin người nhận và lịch sử trạng thái.
  3. Admin chọn bước chuyển trạng thái tiếp theo hợp lệ: `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`.
  4. Nếu chuyển sang `COMPLETED`: Hệ thống tự động cập nhật `payment_status = 'PAID'` (đã thu tiền COD).
  5. Hệ thống lưu bản ghi vào `order_status_histories` kèm Admin ID và ghi chú vận hành.
  6. Nhánh hủy nội bộ (`<<extend>>`): Nếu đơn ở `PENDING` hoặc `CONFIRMED` và khách yêu cầu hủy / phát hiện đơn ảo, Admin chọn "Hủy đơn", nhập lý do bắt buộc; hệ thống chuyển sang `CANCELLED` và tự động hoàn trả tồn kho trong Transaction.
- **Ngoại lệ:** Chuyển trạng thái nhảy cóc sai quy tắc $\rightarrow$ Hệ thống từ chối cập nhật.

## 6.8. UC-12 -- Quản lý sản phẩm & danh mục (Admin)

- **Actor chính:** Admin
- **Mục tiêu:** Quản trị danh mục và sản phẩm giày dép đa biến thể.
- **Tiền điều kiện:** Admin đã đăng nhập.
- **Luồng chính (Database Transaction):**
  1. Admin mở form thêm/sửa sản phẩm.
  2. Nhập thông tin: Tên sản phẩm, mã sản phẩm (`product_code`), mô tả, danh mục, giới tính, giá niêm yết, giá khuyến mãi (nếu có), trạng thái `active`/`inactive`.
  3. Tải lên danh sách hình ảnh sản phẩm.
  4. Cấu hình các biến thể kích cỡ và màu sắc, nhập mã SKU duy nhất và số lượng tồn kho ban đầu cho từng biến thể.
  5. Admin bấm "Lưu sản phẩm".
  6. Hệ thống kiểm tra mã sản phẩm và SKU không trùng lặp, giá hợp lệ.
  7. Hệ thống lưu sản phẩm vào `products`, lưu ảnh vào `product_images`, lưu biến thể vào `product_variants` trong cùng một transaction.
- **Ngoại lệ:** Trùng mã SKU hoặc giá khuyến mãi lớn hơn giá gốc $\rightarrow$ Báo lỗi dữ liệu không hợp lệ.

---

# 7. YÊU CẦU CHỨC NĂNG CHI TIẾT

## 7.1. Phân hệ Khách hàng (Storefront)

### Trang chủ & Điều hướng

- Hiển thị logo thương hiệu VAMOS, slogan "MOVE YOUR WAY." và menu danh mục.
- Hiển thị slider banner quảng bá thương hiệu do dự án tự thiết kế.
- Hiển thị khối danh mục nổi bật, sản phẩm mới về, sản phẩm bán chạy, sản phẩm ưu đãi.
- Hiển thị thông tin chính sách giao hàng COD, đổi trả và hotline liên hệ.

### Danh mục & Tìm kiếm sản phẩm

- Hiển thị danh sách sản phẩm dạng lưới (Grid), hỗ trợ phân trang chuẩn.
- Tìm kiếm tức thời theo tên sản phẩm hoặc mã sản phẩm.
- Bộ lọc kết hợp: Danh mục sản phẩm, Giới tính (Nam, Nữ, Trẻ em, Unisex), Kích cỡ (Size 36 - 45), Màu sắc, Khoảng giá.
- Sắp xếp: Giá thấp đến cao, Giá cao đến thấp, Mới nhất, Tên A-Z.
- Chỉ hiển thị các sản phẩm đang ở trạng thái kinh doanh (`status = 'active'`).

### Chi tiết sản phẩm

- Tên, mã sản phẩm, mô tả chi tiết, chất liệu.
- Giá niêm yết và giá khuyến mãi (nếu có).
- Bộ sưu tập hình ảnh chi tiết theo các góc chụp.
- Bảng chọn Màu sắc và Kích cỡ trực quan; cập nhật tức thời mã SKU và số lượng tồn kho theo biến thể được chọn.
- Nút "Thêm vào giỏ hàng" (bị vô hiệu hóa nếu biến thể tạm hết hàng).
- Khối hiển thị danh sách sản phẩm liên quan cùng danh mục.

### Tài khoản & Sổ địa chỉ

- Đăng ký tài khoản mới / Đăng nhập / Đăng xuất an toàn.
- Xem và chỉnh sửa hồ sơ cá nhân (họ tên, số điện thoại).
- Đổi mật khẩu cá nhân (yêu cầu mật khẩu cũ).
- Quản lý sổ nhiều địa chỉ giao hàng (Thêm mới, Chỉnh sửa, Xóa, Thiết lập địa chỉ mặc định).
- Yêu cầu khôi phục mật khẩu qua token email có thời hạn.

### Giỏ hàng

- Hiển thị ảnh, tên, phân loại biến thể (Size, Màu), đơn giá, số lượng và thành tiền.
- Tăng, giảm số lượng (chặn vượt quá số lượng tồn kho hiện có).
- Xóa từng dòng sản phẩm hoặc xóa toàn bộ giỏ hàng.
- Tự động tính toán tổng số tiền tạm tính.

### Thanh toán / Đặt hàng COD

- Hiển thị thông tin tóm tắt giỏ hàng.
- Chọn địa chỉ nhận hàng từ sổ địa chỉ hoặc nhập địa chỉ mới.
- Nhập ghi chú giao hàng (ví dụ: giao giờ hành chính).
- Ô nhập mã giảm giá (voucher), kiểm tra điều kiện và hiển thị số tiền được chiết khấu.
- Hiển thị minh bạch: Tạm tính, Tiền giảm giá, Phí giao hàng cố định, Tổng tiền thanh toán COD.
- Nút "Xác nhận đặt hàng" kích hoạt Database Transaction tạo đơn và trừ tồn kho.
- Màn hình kết quả đặt hàng thành công hiển thị mã đơn hàng để tra cứu.

### Đơn hàng cá nhân

- Danh sách đơn hàng đã mua phân loại theo trạng thái.
- Xem chi tiết đơn hàng: hiển thị bản snapshot dữ liệu sản phẩm tại thời điểm mua.
- Theo dõi dòng thời gian (Timeline) các mốc chuyển trạng thái đơn hàng.
- Nút "Hủy đơn hàng" tự động xuất hiện khi đơn ở trạng thái `PENDING`.

## 7.2. Phân hệ Quản trị (Admin Portal)

### Dashboard tổng quan

- Thống kê tổng số lượng đơn hàng, số đơn chờ xác nhận (`PENDING`), số đơn đang xử lý, số đơn hoàn thành.
- Tổng doanh thu thực tế theo khoảng thời gian (ngày, tuần, tháng) chỉ tính từ các đơn `COMPLETED`.
- Danh sách top sản phẩm bán chạy nhất.
- Danh sách sản phẩm/biến thể sắp hết hàng (tồn kho dưới ngưỡng cảnh báo).

### Quản lý sản phẩm & Danh mục

- Thêm mới, chỉnh sửa, xem chi tiết và ẩn/hiện sản phẩm.
- Quản lý danh mục sản phẩm (thêm, sửa, ẩn danh mục).
- Quản lý thương hiệu / bộ sưu tập nội bộ của VAMOS.
- Quản lý ma trận biến thể: Size x Màu sắc x SKU x Tồn kho.
- Quản lý bộ sưu tập hình ảnh sản phẩm và ảnh đại diện.

### Quản lý tồn kho

- Tra cứu danh sách tồn kho chi tiết theo từng mã SKU biến thể.
- Bộ lọc sản phẩm có tồn kho thấp dưới ngưỡng cảnh báo (Low-stock threshold).
- Chức năng điều chỉnh tồn kho thủ công (tăng/giảm tồn kho) bắt buộc nhập lý do phục vụ kiểm toán kho.
- Lưu trữ và tra cứu lịch sử mọi giao dịch biến động kho (`inventory_transactions`).

### Quản lý đơn hàng

- Tra cứu, tìm kiếm đơn hàng theo mã đơn, tên khách hàng, số điện thoại người nhận.
- Lọc đơn hàng theo trạng thái xử lý và khoảng ngày đặt.
- Xem chi tiết toàn diện đơn hàng: thông tin người nhận, danh sách snapshot sản phẩm, lịch sử trạng thái.
- Thao tác xác nhận đơn hàng (`PENDING` $\rightarrow$ `CONFIRMED`).
- Cập nhật chuyển trạng thái đơn hàng tuần tự theo luồng hợp lệ.
- Hủy đơn hàng nội bộ (kèm bắt buộc nhập lý do hủy) và tự động hoàn trả tồn kho.

### Quản lý khách hàng

- Danh sách tài khoản khách hàng đăng ký trên hệ thống.
- Xem chi tiết hồ sơ khách hàng và lịch sử các đơn hàng đã đặt.
- Thao tác Khóa / Mở khóa tài khoản khách hàng khi phát hiện vi phạm.

### Quản lý Voucher & Khuyến mãi

- Tạo mã giảm giá mới: cấu hình mã code, loại giảm giá (% hoặc số tiền cố định), giá trị giảm, giá trị đơn tối thiểu, số tiền giảm tối đa, ngày bắt đầu, ngày kết thúc, giới hạn lượt dùng.
- Cập nhật thông tin voucher khi còn hiệu lực.
- Kích hoạt hoặc Vô hiệu hóa voucher tức thời.

### Quản lý Banner trang chủ

- Quản lý danh sách banner hiển thị tại slider trang chủ.
- Thêm mới, cập nhật hình ảnh, tiêu đề, liên kết điều hướng và trạng thái hiển thị của banner.

### Báo cáo thống kê

- Báo cáo doanh thu bán hàng theo khoảng thời gian tùy chọn.
- Báo cáo số lượng đơn hàng theo từng trạng thái.
- Báo cáo hiệu quả kinh doanh theo danh mục sản phẩm.

---

# 8. MÔ HÌNH DỮ LIỆU ĐỀ XUẤT (DATABASE DESIGN)

## 8.1. Danh sách thực thể (14 Thực thể chuẩn hóa)

| Tên bảng                 | Mục đích lưu trữ dữ liệu                                                                    |
| :----------------------- | :------------------------------------------------------------------------------------------ |
| `users`                  | Tài khoản người dùng hệ thống (`CUSTOMER`, `ADMIN`).                                        |
| `addresses`              | Sổ địa chỉ nhận hàng của khách hàng (hỗ trợ nhiều địa chỉ, có cờ `is_default`).             |
| `categories`             | Danh mục sản phẩm (Sneaker, Thể thao, Chạy bộ, Sandal, Dép, Phụ kiện).                      |
| `brands`                 | Thương hiệu / Bộ sưu tập nội bộ của VAMOS (VAMOS Street, VAMOS Sport...).                   |
| `products`               | Thông tin sản phẩm cha (mã SP, tên, slug, mô tả, giới tính, giá gốc, giá sale, trạng thái). |
| `product_images`         | Bộ sưu tập hình ảnh sản phẩm (đường dẫn ảnh, thứ tự hiển thị, cờ ảnh đại diện).             |
| `sizes`                  | Bảng danh mục kích cỡ giày (36, 37, 38, 39, 40, 41, 42, 43, 44, 45).                        |
| `colors`                 | Bảng danh mục màu sắc (Đen, Trắng, Xám, Đỏ, Xanh...).                                       |
| `product_variants`       | Biến thể chi tiết sản phẩm (cặp Product + Size + Color gắn với SKU và số lượng tồn kho).    |
| `inventory_transactions` | Nhật ký ghi vết biến động xuất/nhập/hoàn/điều chỉnh tồn kho.                                |
| `carts`                  | Giỏ hàng của khách hàng (quản lý theo `user_id`).                                           |
| `cart_items`             | Dòng sản phẩm chi tiết trong giỏ hàng (liên kết với biến thể và số lượng).                  |
| `vouchers`               | Mã giảm giá khuyến mãi kèm các điều kiện hạn mức.                                           |
| `orders`                 | Thông tin đơn hàng (mã đơn, user, snapshot địa chỉ, tổng tiền, COD, trạng thái).            |
| `order_items`            | Chi tiết sản phẩm của đơn hàng (lưu snapshot thông tin SP tại thời điểm mua).               |
| `order_status_histories` | Nhật ký ghi vết lịch sử chuyển trạng thái của đơn hàng.                                     |
| `password_reset_tokens`  | Token bảo mật phục vụ quy trình khôi phục mật khẩu.                                         |
| `banners`                | Danh sách banner quảng bá hiển thị tại trang chủ.                                           |

## 8.2. Quan hệ dữ liệu chính (Entity Relationships)

- Một `Category` có nhiều `Product`. Một `Brand` có nhiều `Product`.
- Một `Product` có nhiều `Product Image`.
- Một `Product` có nhiều `Product Variant`.
- Một `Size` có nhiều `Product Variant`. Một `Color` có nhiều `Product Variant`.
- Một `User` có nhiều `Address`.
- Một `User` sở hữu một `Cart` đang hoạt động; một `Cart` có nhiều `Cart Item`.
- Một `User` có nhiều `Order`.
- Một `Order` có nhiều `Order Item`. Một `Order` có nhiều `Order Status History`.
- Một `Product Variant` có nhiều `Inventory Transaction`.
- Một `Voucher` được áp dụng cho nhiều `Order`, nhưng mỗi `Order` chỉ sử dụng tối đa một `Voucher`.

## 8.3. Cấu trúc trường dữ liệu quan trọng

### `users`

- `id` (INT/BIGINT, PK, Auto Increment)
- `full_name` (VARCHAR(100), NOT NULL)
- `email` (VARCHAR(150), UNIQUE, NOT NULL, Index)
- `phone` (VARCHAR(20), NULL)
- `password_hash` (VARCHAR(255), NOT NULL)
- `role` (ENUM('ADMIN', 'CUSTOMER'), DEFAULT 'CUSTOMER', NOT NULL)
- `status` (ENUM('active', 'locked'), DEFAULT 'active', NOT NULL)
- `created_at`, `updated_at` (TIMESTAMP)

### `addresses`

- `id` (INT/BIGINT, PK, Auto Increment)
- `user_id` (INT/BIGINT, FK -> users.id, NOT NULL, Index)
- `recipient_name` (VARCHAR(100), NOT NULL)
- `phone` (VARCHAR(20), NOT NULL)
- `province` (VARCHAR(100), NOT NULL)
- `district` (VARCHAR(100), NOT NULL)
- `ward` (VARCHAR(100), NOT NULL)
- `detail_address` (VARCHAR(255), NOT NULL)
- `is_default` (BOOLEAN, DEFAULT FALSE)
- `created_at`, `updated_at` (TIMESTAMP)

### `products`

- `id` (INT/BIGINT, PK, Auto Increment)
- `category_id` (INT, FK -> categories.id, NOT NULL, Index)
- `brand_id` (INT, FK -> brands.id, NULL)
- `product_code` (VARCHAR(50), UNIQUE, NOT NULL, Index)
- `name` (VARCHAR(200), NOT NULL)
- `slug` (VARCHAR(255), UNIQUE, NOT NULL, Index)
- `description` (TEXT, NULL)
- `gender_target` (ENUM('MEN', 'WOMEN', 'KIDS', 'UNISEX'), DEFAULT 'UNISEX', NOT NULL)
- `base_price` (DECIMAL(12, 0), NOT NULL)
- `sale_price` (DECIMAL(12, 0), NULL)
- `status` (ENUM('active', 'inactive', 'draft'), DEFAULT 'active', NOT NULL)
- `created_at`, `updated_at` (TIMESTAMP)

### `product_variants`

- `id` (INT/BIGINT, PK, Auto Increment)
- `product_id` (INT/BIGINT, FK -> products.id, NOT NULL, Index)
- `size_id` (INT, FK -> sizes.id, NOT NULL)
- `color_id` (INT, FK -> colors.id, NOT NULL)
- `sku` (VARCHAR(100), UNIQUE, NOT NULL, Index)
- `stock_quantity` (INT, DEFAULT 0, NOT NULL)
- `status` (ENUM('active', 'inactive'), DEFAULT 'active', NOT NULL)
- `created_at`, `updated_at` (TIMESTAMP)

### `orders`

- `id` (INT/BIGINT, PK, Auto Increment)
- `order_code` (VARCHAR(50), UNIQUE, NOT NULL, Index)
- `user_id` (INT/BIGINT, FK -> users.id, NOT NULL, Index)
- `recipient_name_snapshot` (VARCHAR(100), NOT NULL)
- `recipient_phone_snapshot` (VARCHAR(20), NOT NULL)
- `delivery_address_snapshot` (VARCHAR(500), NOT NULL)
- `subtotal` (DECIMAL(12, 0), NOT NULL)
- `discount_amount` (DECIMAL(12, 0), DEFAULT 0, NOT NULL)
- `shipping_fee` (DECIMAL(12, 0), DEFAULT 0, NOT NULL)
- `total_amount` (DECIMAL(12, 0), NOT NULL)
- `voucher_id` (INT, FK -> vouchers.id, NULL)
- `voucher_code_snapshot` (VARCHAR(50), NULL)
- `payment_method` (VARCHAR(20), DEFAULT 'COD', NOT NULL)
- `payment_status` (ENUM('UNPAID', 'PAID'), DEFAULT 'UNPAID', NOT NULL)
- `order_status` (ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'), DEFAULT 'PENDING', NOT NULL, Index)
- `customer_note` (VARCHAR(255), NULL)
- `admin_note` (VARCHAR(255), NULL)
- `created_at`, `updated_at` (TIMESTAMP)

### `order_items` (Bảo toàn nguyên tắc Snapshot)

- `id` (INT/BIGINT, PK, Auto Increment)
- `order_id` (INT/BIGINT, FK -> orders.id, NOT NULL, Index)
- `product_variant_id` (INT/BIGINT, FK -> product_variants.id, NOT NULL)
- `product_name_snapshot` (VARCHAR(200), NOT NULL)
- `sku_snapshot` (VARCHAR(100), NOT NULL)
- `size_snapshot` (VARCHAR(20), NOT NULL)
- `color_snapshot` (VARCHAR(50), NOT NULL)
- `unit_price` (DECIMAL(12, 0), NOT NULL)
- `quantity` (INT, NOT NULL)
- `line_total` (DECIMAL(12, 0), NOT NULL)

## 8.4. Ràng buộc dữ liệu cốt lõi (Integrity Constraints)

- Khóa duy nhất (UNIQUE): `users.email`, `products.product_code`, `products.slug`, `product_variants.sku`, `orders.order_code`, `vouchers.code`.
- Ràng buộc không âm: `product_variants.stock_quantity >= 0`, `products.base_price >= 0`, `orders.total_amount >= 0`, `order_items.quantity > 0`.
- Ràng buộc tham chiếu (Foreign Keys): Sử dụng `ON DELETE RESTRICT` cho sản phẩm và biến thể đã phát sinh đơn hàng để ngăn chặn việc xóa làm hỏng lịch sử dữ liệu.
- Ràng buộc toàn vẹn tiền tệ: `orders.total_amount = orders.subtotal - orders.discount_amount + orders.shipping_fee`.

---

# 9. KIẾN TRÚC VÀ CÔNG NGHỆ (ARCHITECTURE & TECH STACK)

## 9.1. Tech Stack đã chốt

- **Backend Platform:** Node.js (phiên bản LTS).
- **Web Framework:** Express.js (kiến trúc MVC phân lớp).
- **Template Engine:** Pug Template Engine (Server-Side Rendering).
- **CSS Framework:** Tailwind CSS (build qua Tailwind CLI độc lập).
- **Database Engine:** Microsoft SQL Server 2025 / 2022 Docker baseline (hệ quản trị CSDL quan hệ chính thức).
- **Database Access:** `mssql` driver (Tedious) hỗ trợ Connection Pooling, T-SQL Parameterized Queries và ACID Transactions.
- **Session Management:** `express-session` kết hợp cookie bảo mật (httpOnly, sameSite, session.regenerate).
- **Bảo mật:** `bcryptjs` (mã hóa mật khẩu băm 1 chiều), Anti-CSRF Token Middleware, getSafeReturnUrl chống Open Redirect, Server-side validation (RFC 5322).
- **Containerization:** Docker & Docker Compose (đóng gói ứng dụng web và cơ sở dữ liệu Microsoft SQL Server 2022).
- **Version Control:** Git.

## 9.2. Kiến trúc ứng dụng phân lớp (Layered MVC Architecture)

Ứng dụng tuân thủ nghiêm ngặt nguyên tắc phân tách trách nhiệm (Separation of Concerns):

```text
Browser Client
     │
     ▼
Routes (Định tuyến URL và HTTP Methods)
     │
     ▼
Middlewares (Xác thực Auth, Phân quyền Role, Validate dữ liệu, Chống CSRF)
     │
     ▼
Controllers (Tiếp nhận Request, gọi Service, điều hướng Response)
     │
     ▼
Services (Chứa toàn bộ Business Logic: Transaction đặt hàng, trừ tồn kho, tính voucher)
     │
     ▼
Repositories / Database Pool (Thực thi truy vấn T-SQL Parameterized có tham số)
     │
     ▼
Microsoft SQL Server Database (Lưu trữ và đảm bảo toàn vẹn dữ liệu)
```

- **Không viết logic nghiệp vụ trong Controller:** Controller chỉ nhận request, chuyển dữ liệu cho Service và trả Pug View hoặc JSON.
- **Không nhúng câu lệnh SQL trong View:** View (Pug) chỉ thuần túy nhận dữ liệu render HTML.
- **Toàn bộ quyền hạn kiểm tra ở Server-side Middleware:** Tuyệt đối không chỉ dựa vào việc ẩn/hiện nút trên giao diện.

## 9.3. Cấu trúc thư mục mã nguồn chuẩn hóa

```text
vamos-store/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tailwind.config.js
├── README.md
├── plan.md
├── plan_v1.1.md
├── CHANGELOG_v1.1.md
├── PROJECT_REVIEW.md
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
├── docs/
│   ├── analysis/
│   │   ├── 01-project-scope.md
│   │   ├── 02-actors.md
│   │   ├── 03-use-case-catalog.md
│   │   ├── 04-use-case-specifications.md
│   │   ├── 05-business-rules.md
│   │   └── 06-open-questions.md
│   ├── diagrams/
│   │   ├── use-case/
│   │   ├── activity/
│   │   └── erd/
│   └── ui/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── database.js
│   │   └── session.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── storefront.routes.js
│   │   ├── cart.routes.js
│   │   ├── order.routes.js
│   │   └── admin.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── cart.controller.js
│   │   ├── order.controller.js
│   │   └── admin/
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── product.service.js
│   │   ├── cart.service.js
│   │   ├── order.service.js
│   │   └── inventory.service.js
│   ├── repositories/
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── validate.middleware.js
│   │   └── error.middleware.js
│   ├── validators/
│   ├── utils/
│   ├── views/
│   │   ├── layouts/
│   │   ├── partials/
│   │   ├── storefront/
│   │   ├── auth/
│   │   ├── customer/
│   │   └── admin/
│   └── public/
│       ├── css/
│       ├── js/
│       └── images/
└── tests/
    ├── unit/
    └── integration/
```

---

# 10. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

## 10.1. Bảo mật (Security)

- Mật khẩu băm an toàn bằng `bcrypt` với cost factor phù hợp.
- Cookie session cài đặt cờ `HttpOnly`, `SameSite=Lax`, và `Secure` khi chạy môi trường production (HTTPS).
- Ngăn chặn SQL Injection tuyệt đối bằng cách sử dụng Parameterized Queries trên 100% các câu lệnh truy vấn CSDL.
- Chống tấn công XSS thông qua cơ chế tự động escape mã HTML của Pug template engine.
- Bảo vệ các form thao tác thay đổi dữ liệu (POST, PUT, DELETE) bằng CSRF token.
- Kiểm soát phân quyền phía Server: Mọi route bắt đầu bằng `/admin` bắt buộc phải qua middleware xác thực cờ `req.session.user.role === 'ADMIN'`.

## 10.2. Hiệu năng & Tối ưu (Performance)

- Thiết lập Database Index phù hợp trên các trường thường xuyên tìm kiếm và lọc (`email`, `product_code`, `slug`, `sku`, `category_id`, `order_code`, `order_status`).
- Áp dụng phân trang (Pagination) cho danh sách sản phẩm và đơn hàng, không load toàn bộ bảng dữ liệu vào bộ nhớ.
- Tối ưu hóa dung lượng hình ảnh tải lên máy chủ.

## 10.3. Tính dễ sử dụng (Usability)

- Giao diện thân thiện, tương thích mượt mà trên Desktop, Tablet và Mobile.
- Định dạng tiền tệ hiển thị chuẩn Việt Nam Đồng (ví dụ: `850.000 đ`).
- Có thông báo xác nhận rõ ràng trước các thao tác nhạy cảm (như hủy đơn hàng, xóa giỏ hàng, khóa tài khoản).

## 10.4. Tính toàn vẹn giao dịch (ACID Integrity)

- Thao tác đặt hàng, trừ tồn kho và hủy đơn hoàn kho bắt buộc phải chạy trong **Database Transaction**. Nếu xảy ra lỗi bất kỳ bước nào, toàn bộ giao dịch phải được Rollback lập tức.

---

# 11. KẾ HOẠCH TRIỂN KHAI (ROADMAP)

- **Phase 1 -- Phân tích và Thiết kế:** Chốt phạm vi dự án; Chuẩn hóa 3 Actors; Vẽ Use Case Diagram tổng quan và chi tiết; Viết đặc tả Use Case; Vẽ Activity Diagram cho các luồng cốt lõi; Thiết kế ERD Database.
- **Phase 2 -- Khởi tạo dự án:** Cấu hình Node.js/Express, Docker Compose, Microsoft SQL Server 2022/2025, Pug, Tailwind CSS, tạo cấu trúc thư mục MVC, viết database migrations và seeds mẫu.
- **Phase 3 -- Tài khoản & Xác thực:** Đăng ký, đăng nhập, đăng xuất, khôi phục mật khẩu, quản lý hồ sơ và sổ địa chỉ giao hàng, middleware xác thực và phân quyền Admin.
- **Phase 4 -- Cửa hàng & Sản phẩm:** Trang chủ, danh sách sản phẩm phân trang, tìm kiếm, bộ lọc đa tiêu chí, chi tiết sản phẩm và biến thể size/màu.
- **Phase 5 -- Giỏ hàng & Đặt hàng COD:** Thêm/sửa/xóa giỏ hàng, kiểm tra tồn kho, áp dụng voucher, chọn địa chỉ, tạo đơn COD và trừ kho bằng Database Transaction.
- **Phase 6 -- Quản lý đơn hàng:** Danh sách đơn, chi tiết đơn snapshot, theo dõi tiến trình đơn hàng, khách hàng hủy đơn `PENDING` và hoàn kho tự động.
- **Phase 7 -- Quản trị hệ thống (Admin):** Dashboard thống kê doanh thu, quản lý danh mục, CRUD sản phẩm & biến thể, quản lý tồn kho có lý do, xử lý trạng thái đơn hàng, quản lý voucher, quản lý khách hàng.
- **Phase 8 -- Kiểm thử & Đóng gói:** Kiểm thử phân quyền, kiểm thử validation, kiểm thử đồng thời nhiều người đặt cùng biến thể (Race condition test), kiểm thử responsive và viết tài liệu hướng dẫn bàn giao.

---

# 12. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

- Guest duyệt xem được sản phẩm, sử dụng được bộ lọc (danh mục, size, màu, giá) và tìm kiếm.
- Guest đăng ký tài khoản thành công, đăng nhập nhận session hợp lệ.
- Customer chọn được màu sắc, kích cỡ và thêm đúng biến thể vào giỏ hàng.
- Hệ thống chặn không cho đặt hàng vượt quá số lượng tồn kho thực tế.
- Customer tạo được đơn hàng COD hợp lệ; tổng tiền tính toán chính xác tuyệt đối.
- Chi tiết đơn hàng lưu trữ đúng snapshot dữ liệu sản phẩm tại thời điểm mua.
- Mã giảm giá (voucher) được kiểm tra chính xác các điều kiện hạn mức.
- Customer chỉ xem và hủy được đơn hàng thuộc quyền sở hữu của chính mình.
- Customer chỉ tự hủy được đơn khi đơn ở trạng thái `PENDING`; tồn kho được hoàn trả đúng 1 lần duy nhất.
- Admin quản lý được toàn diện sản phẩm, danh mục, biến thể, hình ảnh và điều chỉnh kho có lý do.
- Admin chuyển tiếp được trạng thái đơn hàng theo đúng máy trạng thái.
- Admin tra cứu được khách hàng, quản lý voucher và xem báo cáo doanh thu chính xác.
- Website hoạt động ổn định trên cả máy tính và thiết bị di động.

---

# 13. QUY ƯỚC DỮ LIỆU MẪU

Dữ liệu mẫu được khởi tạo độc lập cho VAMOS STORE:

- Ví dụ mã sản phẩm cha: `VMS-SNK-001` (Sneaker Street), `VMS-RUN-002` (Giày chạy bộ), `VMS-SDL-003` (Sandal quai hậu).
- Ví dụ SKU biến thể: `VMS-SNK-001-BLK-40` (Đen, size 40), `VMS-SNK-001-WHT-41` (Trắng, size 41).
- Danh mục chính: Giày Sneaker, Giày Thể Thao, Giày Chạy Bộ, Sandal, Dép Thời Trang, Phụ Kiện.
- Phân loại đối tượng: Nam, Nữ, Trẻ em, Unisex.
- Bảng màu: Đen, Trắng, Xám, Đỏ, Xanh Navy, Kem.
- Bảng kích cỡ: Dải size từ 36 đến 45 tùy dòng sản phẩm.

---

# 14. OPEN QUESTIONS -- CÁC ĐIỂM CẦN XÁC NHẬN TRƯỚC KHI CODE

|   STT   | Vấn đề nghiệp vụ                        | Phân tích chi tiết                                                                                                | Các phương án lựa chọn                                                                                  | Đề xuất của AI                                                                                                               | Trạng thái  |
| :-----: | :-------------------------------------- | :---------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- | :---------: |
| **Q1**  | **Xác minh Email khi đăng ký**          | Gửi link kích hoạt email giúp chống spam nhưng làm tăng độ trễ và tỷ lệ bỏ rơi khi khách đăng ký mua sắm lần đầu. | A: Kích hoạt ngay<br>B: Bắt buộc xác minh email mới được mua                                            | **Chọn A:** Kích hoạt tài khoản ngay (`active`), chuẩn bị sẵn cấu trúc service để kích hoạt xác minh sau nếu cần.            | _Chờ duyệt_ |
| **Q2**  | **Giỏ hàng của Guest**                  | Khách muốn chọn size/màu vào giỏ trước khi đăng nhập hay bắt buộc đăng nhập mới cho dùng giỏ?                     | A: Bắt đăng nhập ngay khi bấm Thêm giỏ<br>B: Cho lưu giỏ tạm trong Session và gộp (merge) khi đăng nhập | **Chọn B:** Lưu session giỏ hàng cho Guest; khi chuyển sang bước Đặt hàng mới bắt buộc đăng nhập và gộp giỏ.                 | _Chờ duyệt_ |
| **Q3**  | **Cấu hình Phí vận chuyển**             | Do không tích hợp API bên ngoài, phí ship tính thế nào?                                                           | A: Đồng giá cố định (30.000 đ)<br>B: Miễn phí cho đơn từ 500.000 đ                                      | **Chọn A & B:** Áp dụng phí cố định 30.000 đ toàn quốc; Miễn phí giao hàng cho đơn hàng có tạm tính từ 500.000 đ trở lên.    | _Chờ duyệt_ |
| **Q4**  | **Điều kiện hủy đơn của Khách**         | Khách được tự hủy đơn đến bước nào?                                                                               | A: Chỉ hủy khi `PENDING`<br>B: Hủy được cả khi `CONFIRMED`                                              | **Chọn A:** Chỉ cho khách tự bấm hủy khi đơn là `PENDING`. Khi đã `CONFIRMED` hoặc đóng gói, phải liên hệ hotline.           | _Chờ duyệt_ |
| **Q5**  | **Chính sách Đổi / Trả hàng**           | Có làm chức năng đổi size/trả hàng online trong v1.0 không?                                                       | A: Có tính năng đổi trả online<br>B: Để ngoài phạm vi v1.0 (hướng dẫn qua hotline)                      | **Chọn B:** Thuộc phạm vi Out-of-Scope v1.0. Cung cấp trang tĩnh chính sách đổi trả và số hotline hỗ trợ.                    | _Chờ duyệt_ |
| **Q6**  | **Email thông báo đơn hàng**            | Có gửi email thông báo khi đặt hàng thành công không?                                                             | A: Bắt buộc gửi email đơn<br>B: Chỉ hiển thị màn hình kết quả đặt hàng (nếu chưa cấu hình SMTP)         | **Chọn B:** Thiết kế sẵn module gửi mail; nếu cấu hình SMTP thì gửi, nếu chưa cấu hình thì vẫn hoàn tất đơn mượt mà.         | _Chờ duyệt_ |
| **Q7**  | **Ngưỡng cảnh báo sắp hết hàng**        | Cảnh báo tồn kho theo từng biến thể hay ngưỡng chung?                                                             | A: Ngưỡng chung toàn hệ thống<br>B: Cấu hình riêng cho từng mã SKU                                      | **Chọn A:** Sử dụng ngưỡng chung mặc định (ví dụ: `<= 5 đôi`) để đơn giản hóa giao diện quản trị v1.0.                       | _Chờ duyệt_ |
| **Q8**  | **Giới hạn số lần dùng Voucher**        | Voucher có giới hạn theo từng khách hàng không?                                                                   | A: Chỉ giới hạn tổng lượt hệ thống<br>B: Mỗi khách chỉ được dùng 1 lần                                  | **Chọn B:** Bổ sung ràng buộc mỗi tài khoản khách hàng chỉ được dùng mã ưu đãi đó tối đa 1 lần (`usage_limit_per_user = 1`). | _Chờ duyệt_ |
| **Q9**  | **Chỉnh sửa giá khi có đơn đang xử lý** | Admin có được sửa giá sản phẩm cha khi đơn đang giao không?                                                       | A: Cho phép sửa bất kỳ lúc nào<br>B: Khóa sửa giá khi có đơn                                            | **Chọn A:** Cho phép sửa giá vì hệ thống đã lưu Snapshot giá cứng trong `order_items`, không làm ảnh hưởng đơn cũ.           | _Chờ duyệt_ |
| **Q10** | **Xử lý tồn kho khi khách bỏ giỏ hàng** | Giỏ hàng có được giữ chỗ tồn kho không?                                                                           | A: Giữ chỗ tồn kho trong 15 phút<br>B: Không giữ chỗ, chỉ trừ kho khi bấm Đặt hàng                      | **Chọn B:** Không giữ chỗ tồn kho trong giỏ. Tồn kho chỉ được trừ tại thời điểm commit transaction đặt hàng.                 | _Chờ duyệt_ |

---

# 15. NGUỒN THAM KHẢO VÀ BẢN QUYỀN

- Website tham khảo mô hình thương mại điện tử: https://bitis.com.vn/
- Tham khảo: Cách tổ chức danh mục, bộ lọc giới tính, chọn size/màu và các bước đặt hàng trực tuyến phổ biến.
- Cam kết độc lập: Nhận diện thương hiệu VAMOS, logo, hình ảnh, mã SKU, nội dung mô tả sản phẩm và giao diện thiết kế hoàn toàn độc lập, không vi phạm bản quyền thương hiệu của Biti's hay bất kỳ đơn vị nào.

---

**END OF PROJECT PLAN v1.1 -- VAMOS STORE**
