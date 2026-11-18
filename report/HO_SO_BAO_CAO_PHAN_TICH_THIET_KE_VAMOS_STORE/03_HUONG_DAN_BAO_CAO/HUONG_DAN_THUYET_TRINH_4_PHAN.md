# HƯỚNG DẪN THUYẾT TRÌNH BẢO VỆ CHUYÊN ĐỀ
# PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG VAMOS STORE

**Đơn vị đào tạo:** Trường Cao đẳng Thực hành FPT Polytechnic  
**Chuyên ngành:** Phát triển Phần mềm / Công nghệ Thông tin  
**Dự án:** VAMOS STORE – Website Thương mại Điện tử Bán Giày Dép  
**Tài liệu:** Cẩm nang Hướng dẫn Trình bày 4 Trụ cột Phân tích & Thiết kế Hệ thống  

---

## 1. MỤC TIÊU VÀ NGUYÊN TẮC KHI BÁO CÁO TRƯỚC HỘI ĐỒNG

### 1.1. Mục tiêu cốt lõi
Khi đứng trước Hội đồng Giảng viên thẩm định đồ án CNTT tại FPT Polytechnic, sinh viên cần hiểu rõ: **Hội đồng không chỉ chấm điểm việc website có chạy được hay không, mà chấm điểm tư duy kỹ thuật phần mềm (Software Engineering Mindset)**. Điều đó thể hiện ở việc:
1. Bạn có hiểu rõ nghiệp vụ thực tế mình đang giải quyết hay không?
2. Mô hình Use Case có xác định đúng ranh giới hệ thống và trách nhiệm của từng tác nhân hay không?
3. Cấu trúc dữ liệu ERD có chuẩn hóa, toàn vẹn và tối ưu cho truy vấn hay không?
4. Quy trình xử lý (Activity Diagram) có kiểm soát chặt chẽ các điều kiện biên, giao dịch ACID và trạng thái đơn hàng hay không?
5. Giao diện người dùng (UI) có hiện thực hóa đúng đắn các yêu cầu nghiệp vụ đã phân tích hay không?

### 1.3. Bảng tóm lược khung kế hoạch thuyết trình 4 trụ cột
| Trụ cột | Tên phần | Mục tiêu phân tích & thiết kế | Sơ đồ & Minh họa chính | Điểm mấu chốt kỹ thuật cần nhấn mạnh |
|:---:|---|---|---|---|
| **Trụ cột 1** | **Use Case Diagram** | Xác định phạm vi 14 Use Case, ranh giới hệ thống và trách nhiệm của 3 Actor. | Hình 1, Hình 2, Hình 3 | Quan hệ kế thừa `Customer -|> Guest`, không có Staff, `<<include>>` kiểm tra tồn kho, `<<extend>>` áp voucher. |
| **Trụ cột 2** | **Sơ đồ ERD & CSDL** | Mô hình hóa cấu trúc dữ liệu quan hệ 20 bảng chuẩn 3NF trên Microsoft SQL Server 2022. | Hình 4, Hình 6, Hình 8 | Bảng trung tâm `product_variants` (Size x Màu), `delivery_address_snapshot` trong orders, Filtered Unique Index `uq_user_default_address`, Thẻ kho `inventory_transactions`. |
| **Trụ cột 3** | **Activity Diagram** | Kiểm soát luồng xử lý giao dịch ACID, trừ kho tức thời và máy trạng thái đơn hàng FSM. | Hình 13, Hình 14, Hình 15 | 2 Swimlanes (Người dùng - Hệ thống VAMOS STORE) đơn giản, trực quan, rollback khi hết hàng, trừ kho ngay khi đặt (`OUT_SALE`), hoàn kho tự động (`IN_CANCEL`), FSM 6 trạng thái. |
| **Trụ cột 4** | **Thiết kế Giao diện (UI)** | Hiện thực hóa trải nghiệm người dùng với kiến trúc Server-Side Rendering (Pug + Tailwind CSS). | Hình 20, Hình 24, Hình 29, Hình 31 | Bộ chọn Size/Màu cập nhật tồn kho SKU thời gian thực, Form Checkout COD, Phân quyền Admin đa lớp (route middleware), Thẻ kho trực quan. |


### 1.2. Ba nguyên tắc vàng khi thuyết trình
- **Nguyên tắc 1: Bám sát thực tế sản phẩm (Grounded in Code & DDL):** Nói những gì hệ thống thực sự có. Không nói quá, không bịa đặt các công nghệ "đao to búa lớn" nếu trong code không triển khai (ví dụ: hệ thống dùng Express Session lưu trong RAM với cookie `vamos_sid`, mật khẩu mã hóa `bcryptjs` 10 salt rounds — hãy tự tin bảo vệ giải pháp này là phù hợp với quy mô vừa và nhỏ của đồ án, thay vì nói dối là dùng JWT hay Microservices).
- **Nguyên tắc 2: Tự tin chỉ vào sơ đồ và giải thích luồng (Visual-driven Explanation):** Luôn dùng tay hoặc con trỏ chuột hướng về sơ đồ chiếu trên màn hình. Mỗi khi nói một câu, hãy chỉ đúng vào Actor, Use Case, bảng CSDL hoặc nút hành động trên giao diện tương ứng.
- **Nguyên tắc 3: Chuyển tiếp mượt mà và logic (Seamless Transition):** 4 phần không phải là 4 ốc đảo rời rạc. Use Case đặt ra yêu cầu -> ERD thiết kế nơi lưu trữ dữ liệu -> Activity Diagram quy định các bước xử lý dữ liệu -> UI là nơi người dùng trực tiếp thao tác với quy trình đó.

---

## 2. HƯỚNG DẪN MỞ ĐẦU THUYẾT TRÌNH (INTRODUCTION)

### 2.1. Chiến thuật mở đầu
Tránh mở đầu bằng những lời sáo rỗng dài dòng ("Kính thưa quý thầy cô, trong thời đại 4.0 công nghệ bùng nổ..."). Hãy đi thẳng vào trọng tâm với phong thái tự tin, tôn trọng và chuyên nghiệp.

### 2.2. Lời thoại mẫu mở đầu (Sinh viên luyện tập)
> *"Kính thưa Thầy/Cô trong Hội đồng thẩm định!*  
> *Em tên là [Tên sinh viên], đại diện cho nhóm sinh viên thực hiện đề tài xây dựng Website bán giày dép trực tuyến **VAMOS STORE**.*  
> *Hôm nay, nhóm chúng em xin phép được báo cáo chuyên sâu về phần **Phân tích và Thiết kế hệ thống** — giai đoạn nền tảng quyết định chất lượng kỹ thuật của toàn bộ dự án.*  
> *Phần trình bày của chúng em được cấu trúc chặt chẽ qua đúng **4 trụ cột cốt lõi**:*  
> *1. Sơ đồ trường hợp sử dụng (Use Case Diagram) để xác định rõ phạm vi và phân quyền người dùng.*  
> *2. Sơ đồ thực thể liên kết (ERD) với 20 bảng nghiệp vụ chuẩn trên Microsoft SQL Server 2022.*  
> *3. Sơ đồ hoạt động (Activity Diagram) mô tả chi tiết các luồng xử lý giao dịch và máy trạng thái đơn hàng FSM.*  
> *4. Thiết kế giao diện (UI) hiện thực hóa trải nghiệm thực tế cho từng vai trò người dùng.*  
> *Sau đây, em xin phép bắt đầu với phần đầu tiên: Sơ đồ Use Case của hệ thống VAMOS STORE."*

---

## 3. HƯỚNG DẪN TRÌNH BÀY PHẦN 1: USE CASE DIAGRAM

### 3.1. Các điểm cốt lõi cần làm nổi bật
1. **Ranh giới hệ thống (System Boundary):** VAMOS STORE là website thương mại điện tử B2C chuyên biệt cho mặt hàng giày dép, xử lý trọn gói từ duyệt danh mục, chọn biến thể (Size/Màu), giỏ hàng, đặt hàng COD đến quản trị vận hành đơn hàng và thẻ kho.
2. **3 Tác nhân chính (3 Primary Actors):**
   - `Guest (Khách vãng lai)`: Người dùng chưa đăng nhập, chỉ có quyền xem, tìm kiếm, đăng ký, đăng nhập.
   - `Customer (Khách hàng thành viên)`: Kế thừa toàn bộ quyền của `Guest` (`Customer` generalization `Guest`), bổ sung các quyền: quản lý giỏ hàng, đặt hàng COD, sổ địa chỉ, xem lịch sử và hủy đơn `PENDING`.
   - `Admin (Quản trị viên)`: Toàn quyền vận hành: sản phẩm, biến thể SKU, danh mục, kho hàng, voucher, đơn hàng và báo cáo.
   - *Lưu ý quan trọng:* Dự án **không có vai trò Staff riêng**, chỉ có 2 vai trò lưu trong cột `users.role` là `CUSTOMER` và `ADMIN`. Tác nhân `Email Service` là Actor phụ trợ thiết kế cho Use Case khôi phục mật khẩu.
3. **Danh mục 14 Use Case chuẩn:** Đọc đúng mã từ `UC01` đến `UC14`.
4. **Nhấn mạnh Use Case then chốt:**
   - `UC07 — Đặt hàng COD`: Đây là Use Case cốt lõi nhất, có quan hệ `<<include>>` với kiểm tra tồn kho và xác thực giỏ hàng, có quan hệ `<<extend>>` với áp dụng voucher giảm giá.
   - `UC09 — Hủy đơn hàng`: Chỉ cho phép khi đơn ở trạng thái `PENDING`.
   - `UC03 — Khôi phục mật khẩu`: Trình bày trung thực rằng bảng CSDL `password_reset_tokens` đã thiết kế hoàn chỉnh token hash và thời hạn, nhưng nghiệp vụ gửi mail SMTP thực tế đang được để dành cho giai đoạn mở rộng tiếp theo.

### 3.2. Lời thoại mẫu phần Use Case
> *"Kính thưa Thầy/Cô, nhìn vào **Sơ đồ Use Case tổng quát (Hình 1)** trên màn hình, hệ thống VAMOS STORE phân định rõ ranh giới trách nhiệm thông qua 3 tác nhân chính:*  
> *Đầu tiên là **Guest** — khách vãng lai khi truy cập website. Guest có thể thực hiện tìm kiếm, xem chi tiết sản phẩm qua UC05, cũng như Đăng ký (UC01) và Đăng nhập (UC02).*  
> *Thứ hai là **Customer** — khách hàng đã đăng nhập. Như Thầy/Cô có thể thấy mũi tên hình tam giác rỗng hướng từ Customer về Guest, Customer kế thừa toàn bộ các hành vi của Guest, đồng thời được mở rộng các chức năng giao dịch riêng như Quản lý giỏ hàng (UC06), Đặt hàng COD (UC07), Sổ địa chỉ (UC04), Theo dõi đơn hàng (UC08) và Hủy đơn hàng (UC09).*  
> *Tác nhân thứ ba độc lập là **Admin** — người quản trị và vận hành toàn bộ cửa hàng, nắm giữ các Use Case từ UC10 đến UC14 như Xử lý đơn hàng, Quản lý kho, Quản lý danh mục sản phẩm, Voucher và Báo cáo doanh thu.*  
> *Đặc biệt, tại phân hệ Mua hàng COD (Hình 2), khi khách hàng thực hiện UC07 Đặt hàng, hệ thống bắt buộc phải `<<include>>` luồng kiểm tra số lượng tồn kho khả dụng để bảo đảm tính toàn vẹn, và có thể `<<extend>>` luồng áp dụng mã giảm giá nếu khách hàng có voucher hợp lệ."*

### 3.3. Bí quyết đối đáp các câu hỏi bẫy về Use Case
- **Hỏi:** *Tại sao mũi tên giữa Customer và Guest lại là kế thừa (Generalization) mà không phải là Include hay Extend?*  
  **Đáp:** *Thưa Thầy/Cô, Generalization là quan hệ giữa 2 Actor (tác nhân), thể hiện rằng Customer là một dạng người dùng đặc biệt của Guest nhưng có danh tính xác thực. Mọi nơi Guest có thể truy cập (như trang chủ, xem sản phẩm) thì Customer đều truy cập được. Còn `<<include>>` và `<<extend>>` là quan hệ giữa Use Case với Use Case, không dùng cho quan hệ giữa các Actor.*
- **Hỏi:** *Khác biệt giữa `<<include>>` và `<<extend>>` trong sơ đồ này là gì?*  
  **Đáp:** *Dạ, `<<include>>` là quan hệ bắt buộc — Use Case chính muốn thành công thì Use Case được include bắt buộc phải chạy (ví dụ Đặt hàng bắt buộc phải kiểm tra tồn kho). Còn `<<extend>>` là quan hệ mở rộng tùy chọn, chỉ kích hoạt khi thỏa mãn một điều kiện mở rộng cụ thể (ví dụ: chỉ khi khách có mã voucher và nhập mã thì luồng Áp dụng voucher mới được thực thi, nếu không có voucher thì khách vẫn hoàn tất đặt hàng bình thường).*

---

## 4. HƯỚNG DẪN CHUYỂN TIẾP TỪ USE CASE SANG ERD

### Câu chuyển tiếp mẫu:
> *"Sau khi đã phân tích đầy đủ các chức năng và ranh giới nghiệp vụ qua 14 Use Case, câu hỏi kỹ thuật quan trọng tiếp theo là: **Hệ thống cần tổ chức và lưu trữ dữ liệu như thế nào để phục vụ tối ưu cho các Use Case đó?** Để trả lời câu hỏi này, em xin kính mời Thầy/Cô cùng chuyển sang **Phần 2: Sơ đồ thực thể liên kết (ERD) và Thiết kế Cơ sở dữ liệu của VAMOS STORE**."*

---

## 5. HƯỚNG DẪN TRÌNH BÀY PHẦN 2: ERD & CƠ SỞ DỮ LIỆU

### 5.1. Các điểm cốt lõi cần làm nổi bật
1. **Quy mô và Hệ quản trị:** 20 bảng nghiệp vụ chuẩn trên Microsoft SQL Server 2022 (không tính bảng kỹ thuật `schema_migrations`). Đạt chuẩn chuẩn hóa 3NF (Third Normal Form).
2. **Phân chia 5 nhóm bảng logic:**
   - Nhóm 1: Người dùng & Xác thực (`users`, `addresses`, `password_reset_tokens`).
   - Nhóm 2: Danh mục, Thương hiệu & Biến thể sản phẩm (`categories`, `brands`, `products`, `product_images`, `sizes`, `colors`, `product_variants`).
   - Nhóm 3: Giỏ hàng & Tiếp thị (`carts`, `cart_items`, `wishlist_items`, `vouchers`, `voucher_usages`, `banners`).
   - Nhóm 4: Đơn hàng & Lịch sử trạng thái (`orders`, `order_items`, `order_status_histories`).
   - Nhóm 5: Quản lý kho hàng (`inventory_transactions`).
3. **Quyết định thiết kế kiến trúc đắt giá nhất:**
   - **Tại sao cần bảng `product_variants` riêng?** Sản phẩm giày dép có đặc thù phân mảnh thuộc tính Size và Màu. Mỗi đôi giày cùng tên nhưng khác Size hoặc khác Màu sẽ có SKU riêng, giá riêng và số lượng tồn kho riêng. Bảng `products` lưu thông tin chung (tên, slug, mô tả, danh mục, thương hiệu), còn `product_variants` đóng vai trò thực thể liên kết giữa `products`, `sizes`, `colors` và lưu `stock_quantity`.
   - **Tại sao có `delivery_address_snapshot` trong bảng `orders`?** Để bảo toàn dữ liệu lịch sử hóa đơn. Nếu khách hàng sau này sửa hoặc xóa địa chỉ trong sổ địa chỉ (`addresses`), thông tin địa chỉ trên các đơn hàng đã đặt trong quá khứ vẫn giữ nguyên vẹn (`NVARCHAR(255)`).
   - **Ràng buộc Filtered Unique Index:** Index `uq_user_default_address` trên bảng `addresses` (`WHERE is_default = 1`) bảo đảm tại một thời điểm, mỗi khách hàng chỉ có tối đa một địa chỉ mặc định, ngăn chặn hoàn toàn lỗi logic nghiệp vụ ở tầng CSDL.
   - **Thẻ kho `inventory_transactions`:** Quản lý xuất nhập tồn theo mô hình Ledger (sổ cái). Mọi biến động tăng giảm kho đều ghi nhật ký với các mã loại: `IN_IMPORT` (nhập hàng), `OUT_SALE` (bán hàng), `IN_CANCEL` (hoàn kho khi hủy đơn), `ADJUST` (kiểm kê điều chỉnh).

### 5.2. Khung 4 câu hỏi vàng để giải thích bất kỳ bảng nào trong 20 bảng ERD
Khi giảng viên chỉ vào bất kỳ bảng nào trong sơ đồ ERD (Hình 4), sinh viên hãy bình tĩnh trả lời tuần tự theo đúng 4 câu hỏi cốt lõi sau:
1. **Bảng này dùng để làm gì?** (Nêu ngắn gọn vai trò thực tế).
2. **Vì sao hệ thống cần bảng này?** (Nêu lý do nếu thiếu bảng này thì hệ thống gặp vấn đề gì).
3. **Bảng có những thuộc tính quan trọng nào và lưu thông tin gì?** (Nêu tên cột, kiểu dữ liệu, ý nghĩa nghiệp vụ).
4. **Bảng liên kết với các bảng khác như thế nào?** (Khóa chính PK, khóa ngoại FK, quan hệ 1-1, 1-N hay N-N).

*(Lưu ý: Để tra cứu chi tiết toàn bộ 20 bảng và 153 thuộc tính, sinh viên hãy xem tài liệu độc lập tại `05_TAI_LIEU_NGHIEN_CUU_ERD/PHAN_TICH_CHI_TIET_ERD_VAMOS_STORE.md`).*

#### Ví dụ mẫu 1: Trả lời về bảng `product_variants` (Bảng trung tâm cốt lõi)
> *"Thưa Thầy/Cô, bảng `product_variants` là bảng **Biến thể sản phẩm**:*
> *1. **Dùng để làm gì:** Lưu trữ thông tin chi tiết của từng phiên bản cụ thể cho mỗi đôi giày (kết hợp giữa Kích cỡ và Màu sắc).*
> *2. **Vì sao cần:** Ngành giày dép có đặc thù phân mảnh Size và Màu. Một mẫu giày như Hunter X có Size 40, 41, 42 với màu Đen, Trắng. Mỗi cặp Size-Màu có số lượng tồn kho riêng, giá bán riêng và mã vạch SKU riêng. Nếu không có bảng này, hệ thống không thể kiểm soát được khách mua size nào và kho còn size đó hay không.*
> *3. **Thuộc tính quan trọng:** Khóa chính `id`, mã định danh thương mại `sku`, giá bán `price`, giá gốc `original_price`, số lượng tồn khả dụng `stock_quantity`, cùng cờ trạng thái `is_active`.*
> *4. **Liên kết:** Bảng này liên kết N-1 với `products` (qua `product_id`), N-1 với `sizes` (qua `size_id`), N-1 với `colors` (qua `color_id`), và liên kết 1-N tới `cart_items`, `order_items`, `inventory_transactions`."*

#### Ví dụ mẫu 2: Trả lời về bảng `orders` và cột `delivery_address_snapshot`
> *"Thưa Thầy/Cô, bảng `orders` là bảng **Đơn hàng**:*
> *1. **Dùng để làm gì:** Lưu thông tin giao dịch mua hàng của khách.*
> *2. **Vì sao cần:** Để quản lý quy trình giao nhận, theo dõi tổng tiền, trạng thái đơn hàng FSM và xuất hóa đơn.*
> *3. **Thuộc tính quan trọng:** Khóa chính `id`, mã đơn `order_code`, tổng tiền hàng `total_amount`, tiền giảm `discount_amount`, phí vận chuyển `shipping_fee`, tiền thanh toán cuối `final_amount`, trạng thái đơn `status` (PENDING, CONFIRMED, PROCESSING, SHIPPING, COMPLETED, CANCELLED), và đặc biệt là cột `delivery_address_snapshot`.*
> *4. **Ý nghĩa của cột `delivery_address_snapshot`:** Đây là chuỗi địa chỉ giao hàng được 'chụp lại' cố định dạng văn bản tại thời điểm khách bấm đặt hàng. Dù sau này người dùng có đổi tên, đổi số điện thoại hay cập nhật lại sổ địa chỉ trong bảng `addresses`, thì địa chỉ ghi trên đơn hàng cũ vẫn giữ nguyên vẹn, đảm bảo tính pháp lý và không làm sai lệch lịch sử giao hàng."*

### 5.3. Lời thoại mẫu phần ERD tổng quan
> *"Kính thưa Thầy/Cô, cơ sở dữ liệu của VAMOS STORE được thiết kế chuẩn mực trên hệ quản trị Microsoft SQL Server 2022 với **20 bảng nghiệp vụ** như hiển thị trên **Sơ đồ ERD tổng thể (Hình 4)**.*  
> *Điểm mấu chốt đầu tiên trong thiết kế của nhóm chúng em là giải quyết bài toán đặc thù của ngành giày dép thông qua bảng trung tâm **product_variants (Biến thể sản phẩm)**.*  
> *Một sản phẩm cha trong bảng `products` có thể có nhiều biến thể. Mỗi bản ghi trong `product_variants` là giao điểm giữa sản phẩm với một kích cỡ trong bảng `sizes` và một màu sắc trong bảng `colors`. Mỗi biến thể này có mã định danh thương mại riêng là SKU, quản lý giá bán riêng và số lượng tồn kho khả dụng `stock_quantity` riêng biệt.*  
> *Khi khách hàng thêm sản phẩm vào giỏ, bảng `cart_items` sẽ liên kết trực tiếp tới `variant_id` chứ không liên kết tới `product_id`. Điều này bảo đảm khách hàng chọn đúng chính xác size và màu mình cần mua.*  
> *Điểm mấu chốt thứ hai là tính toàn vẹn và lịch sử hóa dữ liệu trong phân hệ Đơn hàng:*  
> *Trong bảng `orders`, chúng em thiết kế cột `delivery_address_snapshot` kiểu `NVARCHAR(255)`. Khi chốt đơn, toàn bộ chuỗi địa chỉ giao hàng được chụp lại cố định. Dù sau này người dùng có đổi tên, đổi số điện thoại hay cập nhật lại địa chỉ trong bảng `addresses`, hóa đơn pháp lý của đơn hàng vẫn được giữ nguyên vẹn.*  
> *Đồng thời, bảng `order_status_histories` ghi nhận nhật ký kiểm toán (audit log) mỗi khi trạng thái đơn hàng thay đổi, lưu rõ ai đổi, đổi từ trạng thái nào sang trạng thái nào và thời điểm đổi."*

---

## 6. HƯỚNG DẪN CHUYỂN TIẾP TỪ ERD SANG ACTIVITY DIAGRAM

### Câu chuyển tiếp mẫu:
> *"Một cơ sở dữ liệu dù được thiết kế chuẩn hóa và toàn vẹn đến đâu cũng chỉ là dữ liệu tĩnh ở trạng thái nghỉ. Để dữ liệu đó vận hành chính xác và an toàn, hệ thống cần những quy trình nghiệp vụ rõ ràng, kiểm soát chặt chẽ điều kiện rẽ nhánh và giao dịch.*  
> *Ngay sau đây, em xin kính mời Thầy/Cô cùng theo dõi **Phần 3: Sơ đồ hoạt động (Activity Diagram)** để thấy cách hệ thống VAMOS STORE điều phối dữ liệu qua từng bước xử lý thực tế."*

---

## 7. HƯỚNG DẪN TRÌNH BÀY PHẦN 3: ACTIVITY DIAGRAM

### 7.1. Các điểm cốt lõi cần làm nổi bật
1. **Cấu trúc phân làn đơn giản hóa (2 Swimlanes) theo yêu cầu giảng viên:**
   Toàn bộ sơ đồ hoạt động đã được chuẩn hóa thành đúng **2 cột Swimlane trực quan**:
   - Cột 1: `Người dùng / Khách hàng / Quản trị viên` — Thực hiện hành động nhập liệu, lựa chọn hoặc bấm nút trên giao diện.
   - Cột 2: `Hệ thống VAMOS STORE` — Tiếp nhận dữ liệu, kiểm tra hợp lệ, xử lý nghiệp vụ CSDL và phản hồi kết quả.
   - Luồng chạy thẳng từ trên xuống dưới, rẽ nhánh rõ ràng qua hình thoi Quyết định (Decision) với 2 nhánh [Đúng / Hợp lệ] và [Sai / Lỗi], giúp giảng viên và người nghe nắm bắt quy trình ngay trong 30 giây mà không bị rối bởi các chi tiết kỹ thuật quá sâu.

2. **Cách trình bày quy trình Đăng nhập (AD02) theo sơ đồ tối giản:**
   - Người dùng nhập Email và Mật khẩu -> Nhấn nút 'Đăng nhập'.
   - Hệ thống VAMOS STORE tiếp nhận thông tin và kiểm tra tài khoản.
   - Điểm quyết định:
     - Nếu thông tin sai hoặc tài khoản bị khóa -> Báo lỗi và yêu cầu nhập lại.
     - Nếu thông tin chính xác -> Cấp phiên làm việc, hợp nhất giỏ hàng tạm thời và chuyển hướng vào hệ thống.

3. **Quy trình Đặt hàng COD nguyên tử (AD08 — Trọng tâm bảo vệ):**
   - Khách hàng điền thông tin giao hàng, chọn thanh toán COD -> Nhấn 'Đặt hàng'.
   - Hệ thống mở giao dịch CSDL, kiểm tra tồn kho khả dụng của từng mã giày.
   - Điểm quyết định:
     - Nếu bất kỳ sản phẩm nào hết hàng -> Hủy giao dịch (Rollback), thông báo cho khách hàng chọn lại.
     - Nếu đủ hàng -> Tạo đơn hàng trạng thái `PENDING`, **trừ tồn kho tức thời (`OUT_SALE`)**, xóa giỏ hàng và hiển thị màn hình 'Đặt hàng thành công'.
   - *Điểm nhấn thuyết trình:* Nhấn mạnh cơ chế trừ kho ngay lập tức để chống bán vượt số lượng thực tế (Overselling).

4. **Quy trình Hủy đơn và Hoàn kho (AD10 & AD11):**
   - Khách hàng chỉ được hủy khi đơn ở trạng thái `PENDING`.
   - Admin có quyền hủy khi đơn ở `PENDING` hoặc `CONFIRMED`.
   - Khi hủy thành công: Hệ thống tự động kích hoạt giao dịch hoàn kho (`IN_CANCEL`), cộng trả lại số lượng tồn kho và hoàn trả lượt sử dụng voucher.
2. **Quy trình Đặt hàng COD (Hình 13 — Trọng tâm số 1):**
   - Bước 1: Khách hàng xác nhận thông tin giao hàng tại trang Checkout.
   - Bước 2: Server mở một **Database Transaction**.
   - Bước 3: Kiểm tra tồn kho khả dụng của từng biến thể (`stock_quantity >= quantity`). Nếu có bất kỳ món nào hết hàng -> Rollback transaction, thông báo lỗi.
   - Bước 4: Kiểm tra và khóa lượt dùng voucher (nếu có).
   - Bước 5: Chèn bản ghi vào bảng `orders` và `order_items`.
   - Bước 6: **Trừ số lượng tồn kho ngay tại thời điểm tạo đơn (`OUT_SALE`)** và ghi nhật ký thẻ kho `inventory_transactions`.
   - Bước 7: Xóa các món đã mua khỏi bảng `cart_items`.
   - Bước 8: Commit transaction, trả về trạng thái `PENDING` cho đơn hàng.
3. **Quy trình Hủy đơn và Hoàn kho (Hình 14 & Hình 15 — Trọng tâm số 2):**
   - **Điều kiện hủy của Khách hàng:** Khách hàng chỉ được quyền tự hủy đơn khi đơn hàng đang ở trạng thái sơ khởi `PENDING`. Nếu đơn đã được chuyển sang `CONFIRMED` hoặc đang giao, nút hủy sẽ bị vô hiệu hóa.
   - **Quyền hủy của Admin:** Admin có quyền hủy đơn ở cả 2 trạng thái `PENDING` và `CONFIRMED`.
   - **Cơ chế hoàn kho tự động:** Khi hủy đơn hợp lệ, hệ thống mở Transaction hoàn lại số lượng sản phẩm vào `product_variants.stock_quantity`, đồng thời tạo bản ghi thẻ kho mới với mã `IN_CANCEL`, và phục hồi số lượt sử dụng voucher nếu đơn có áp dụng voucher.
4. **Máy trạng thái đơn hàng (FSM):** Khẳng định 6 trạng thái chuẩn mực: `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPING` -> `COMPLETED`, và nhánh rẽ `CANCELLED`. Nhấn mạnh: VAMOS STORE không bao giờ trừ kho lần thứ hai khi chuyển trạng thái sang `COMPLETED`, tránh lỗi trừ đúp (Double Deduction).

### 7.2. Lời thoại mẫu phần Activity Diagram
> *"Kính thưa Thầy/Cô, để minh họa cho khả năng kiểm soát giao dịch của hệ thống, em xin phép phân tích sâu vào **Sơ đồ hoạt động Đặt hàng COD (Hình 13)**.*  
> *Sơ đồ này được tổ chức theo 3 phân làn rõ rệt: Khách hàng, Hệ thống Web Node.js và Cơ sở dữ liệu SQL Server.*  
> *Khi Khách hàng nhấn 'Xác nhận đặt hàng', tầng Service lập tức khởi tạo một MSSQL Transaction. Bước quan trọng nhất diễn ra ở nút điều kiện: Server kiểm tra tồn kho tức thời của từng mã SKU trong giỏ hàng.*  
> *Nếu có sản phẩm vừa bị người khác mua hết, hệ thống lập tức Rollback toàn bộ, giữ nguyên trạng thái dữ liệu và báo cho người dùng.*  
> *Nếu đủ hàng, hệ thống tiến hành tạo đơn hàng với trạng thái `PENDING`, đồng thời **trừ tồn kho ngay lập tức (`OUT_SALE`)** và tạo bản ghi thẻ kho tương ứng.*  
> *Việc trừ tồn kho ngay khi đặt hàng là giải pháp kỹ thuật tối ưu để ngăn chặn hiện tượng Overselling (bán quá số lượng thực tế).*  
> *Và nếu sau đó khách hàng quyết định hủy đơn (Hình 14), điều kiện kiểm tra chỉ cho phép hủy khi đơn còn là `PENDING`. Khi hủy thành công, một Transaction hoàn kho sẽ kích hoạt: số lượng giày được cộng trả lại kho, một giao dịch nhập hoàn `IN_CANCEL` được ghi vào thẻ kho, bảo đảm tính cân bằng kế toán kho hàng 100%."*

---

## 8. HƯỚNG DẪN CHUYỂN TIẾP TỪ ACTIVITY DIAGRAM SANG UI

### Câu chuyển tiếp mẫu:
> *"Một quy trình nghiệp vụ được thiết kế chặt chẽ trên giấy chỉ thực sự mang lại giá trị khi được chuyển hóa thành những màn hình trực quan, thân thiện và bảo mật cho người dùng cuối.*  
> *Sau đây, em xin kính mời Thầy/Cô cùng đến với **Phần 4: Thiết kế Giao diện Người dùng (UI)** để trải nghiệm cách VAMOS STORE hiện thực hóa toàn bộ các Use Case và quy trình đã phân tích."*

---

## 9. HƯỚNG DẪN TRÌNH BÀY PHẦN 4: USER INTERFACE (UI)

### 9.1. Các điểm cốt lõi cần làm nổi bật
1. **Kiến trúc công nghệ UI:** Server-Side Rendering (SSR) sử dụng template engine **Pug** kết hợp với **Tailwind CSS**. Không phải Single Page Application giả lập, mà là giao diện web chuẩn SEO, tối ưu tốc độ tải trang ban đầu và bảo vệ logic xác thực an toàn trên máy chủ.
2. **Cấu trúc trình bày 4 bước cho từng màn hình:**
   - **Mục đích:** Màn hình này phục vụ ai và giải quyết Use Case nào?
   - **Thành phần giao diện:** Có những khu vực chức năng nào (Header, Bộ lọc, Bảng dữ liệu, Modal)?
   - **Thao tác người dùng:** Người dùng có thể click, chọn, nhập liệu những gì?
   - **Kết quả & Liên hệ:** Hệ thống xử lý gì ở phía sau (gọi API nào, tác động bảng CSDL nào)?
3. **Phân nhóm 3 vai trò giao diện:**
   - **Khách vãng lai (Guest):** Trang chủ (Hero banner, sản phẩm mới), Cửa hàng & Bộ lọc đa tiêu chí, Chi tiết sản phẩm & Bộ chọn thuộc tính Size/Màu, Đăng nhập, Đăng ký.
   - **Khách hàng (Customer):** Giỏ hàng tương tác, Trang chốt đơn Checkout COD, Lịch sử và chi tiết đơn hàng, Danh sách yêu thích.
   - **Quản trị viên (Admin):** Dashboard chỉ số kinh doanh, Quản lý danh mục & thương hiệu, Quản lý sản phẩm ma trận SKU, Quản lý đơn hàng FSM, Quản lý tồn kho & thẻ kho chi tiết, Quản lý voucher, Quản lý người dùng, Quản lý banner.

### 9.2. Lời thoại mẫu phần UI
> *"Kính thưa Thầy/Cô, giao diện của VAMOS STORE được thiết kế hiện đại, tinh gọn theo nguyên tắc phân quyền người dùng.*  
> *Ở phân hệ Khách hàng, em xin giới thiệu **Màn hình Chi tiết sản phẩm (Hình 20)**. Đây là nơi hiện thực hóa mối quan hệ giữa sản phẩm cha và các biến thể. Người dùng chọn Màu sắc và Kích cỡ giày qua các nút bấm trực quan. Giao diện sẽ tự động cập nhật số lượng tồn kho khả dụng của đúng mã SKU đó. Nếu kích cỡ đó đã hết hàng trong bảng `product_variants`, nút 'Thêm vào giỏ' sẽ tự động bị mờ đi và chuyển sang trạng thái Hết hàng, giúp khách hàng không bao giờ đặt nhầm món hàng không có sẵn.*  
> *Chuyển sang phân hệ Quản trị, em xin nhấn mạnh **Màn hình Quản lý Đơn hàng (Hình 29)** và **Màn hình Thẻ kho (Hình 31)**:*  
> *Tại màn hình Đơn hàng, Admin có thể theo dõi tiến trình 6 trạng thái FSM. Các nút hành động như 'Xác nhận đơn', 'Chuyển sang đóng gói' hay 'Bắt đầu giao hàng' được kiểm soát chặt chẽ bằng logic backend, chỉ hiển thị đúng các bước chuyển tiếp hợp lệ.*  
> *Đồng thời, tại màn hình Thẻ kho, mỗi biến động xuất nhập tồn từ quy trình Đặt hàng hay Hủy đơn đều được hiển thị minh bạch dưới dạng bảng nhật ký số lượng kèm mã đơn hàng tham chiếu, giúp thủ kho đối soát số liệu chính xác bất kỳ lúc nào."*

---

## 10. HƯỚNG DẪN KẾT THÚC BÁO CÁO VÀ CHUYỂN SANG PHẦN Q&A

### Lời thoại mẫu kết thúc:
> *"Kính thưa quý Thầy/Cô trong Hội đồng thẩm định!*  
> *Qua 4 phần báo cáo vừa rồi từ **Use Case Diagram**, **ERD Cơ sở dữ liệu**, **Activity Diagram** đến **Giao diện người dùng UI**, nhóm chúng em đã chứng minh được tính đồng bộ, nhất quán và chặt chẽ trong toàn bộ quá trình phân tích và thiết kế hệ thống VAMOS STORE.*  
> *Mỗi Use Case đều có bảng CSDL tương ứng lưu trữ, mỗi thao tác người dùng đều có sơ đồ luồng kiểm soát dữ liệu, và mỗi giao diện đều phản ánh trung thực mã nguồn đã triển khai.*  
> *Nhóm chúng em xin chân thành cảm ơn sự chú ý lắng nghe của quý Thầy/Cô, và chúng em rất mong nhận được những nhận xét, góp ý quý báu cũng như các câu hỏi của Hội đồng để giúp dự án hoàn thiện hơn nữa! Em xin trân trọng cảm ơn!"*
