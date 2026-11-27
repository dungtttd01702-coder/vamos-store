# TÀI LIỆU NGHIÊN CỨU VÀ PHÂN TÍCH CHUYÊN SÂU CƠ SỞ DỮ LIỆU ERD
# DỰ ÁN HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE

> **Chuyên ngành:** Công nghệ Thông tin — Phát triển Phần mềm & Ứng dụng Web  
> **Cơ sở dữ liệu đích:** Microsoft SQL Server 2022 (RDBMS Quan hệ Chuẩn Hóa 3NF)  
> **Tài liệu nguồn:** `database/mssql_schema.sql`, `database/migrations/`, và toàn bộ mã nguồn xử lý trong `src/`  
> **Mục tiêu:** Cung cấp tài liệu tự học, tự ôn tập toàn diện và chuyên sâu về cấu trúc cơ sở dữ liệu. Giúp sinh viên nắm vững bản chất từng bảng, từng cột, từng mối liên kết và các ràng buộc kỹ thuật; tự tin trả lời và bảo vệ xuất sắc trước mọi câu hỏi phản biện của Hội đồng Giảng viên FPT Polytechnic.

---

## MỤC LỤC TỔNG QUAN

* [CHƯƠNG 1. TỔNG QUAN HỆ THỐNG CƠ SỞ DỮ LIỆU VAMOS STORE](#chương-1-tổng-quan-hệ-thống-cơ-sở-dữ-liệu-vamos-store)
  * [1.1. Bối cảnh nghiệp vụ bán lẻ giày dép & Đòi hỏi kiến trúc dữ liệu](#11-bối-cảnh-nghiệp-vụ-bán-lẻ-giày-dép--đòi-hỏi-kiến-trúc-dữ-liệu)
  * [1.2. Phân loại 20 bảng nghiệp vụ theo 6 phân hệ cốt lõi](#12-phân-loại-20-bảng-nghiệp-vụ-theo-6-phân-hệ-cốt-lõi)
  * [1.3. Bảng kỹ thuật `schema_migrations`](#13-bảng-kỹ-thuật-schema_migrations)
* [CHƯƠNG 2. PHÂN TÍCH CHI TIẾT 20 BẢNG NGHIỆP VỤ](#chương-2-phân-tích-chi-tiết-20-bảng-nghiệp-vụ)
  * [2.1. Bảng `users` (Tài khoản người dùng & Phân quyền)](#21-bảng-users)
  * [2.2. Bảng `addresses` (Sổ địa chỉ nhận hàng & Địa chỉ mặc định)](#22-bảng-addresses)
  * [2.3. Bảng `password_reset_tokens` (Mã khôi phục mật khẩu)](#23-bảng-password_reset_tokens)
  * [2.4. Bảng `categories` (Danh mục phân loại sản phẩm)](#24-bảng-categories)
  * [2.5. Bảng `brands` (Thương hiệu giày dép)](#25-bảng-brands)
  * [2.6. Bảng `sizes` (Kích cỡ giày chuẩn EU)](#26-bảng-sizes)
  * [2.7. Bảng `colors` (Màu sắc & Mã màu hiển thị)](#27-bảng-colors)
  * [2.8. Bảng `products` (Thông tin sản phẩm gốc - Master)](#28-bảng-products)
  * [2.9. Bảng `product_images` (Thư viện hình ảnh sản phẩm)](#29-bảng-product_images)
  * [2.10. Bảng `product_variants` (Ma trận biến thể SKU & Quản lý tồn kho)](#210-bảng-product_variants)
  * [2.11. Bảng `inventory_transactions` (Sổ nhật ký thẻ kho bất biến)](#211-bảng-inventory_transactions)
  * [2.12. Bảng `carts` (Giỏ hàng người dùng)](#212-bảng-carts)
  * [2.13. Bảng `cart_items` (Chi tiết từng món trong giỏ hàng)](#213-bảng-cart_items)
  * [2.14. Bảng `vouchers` (Mã phiếu giảm giá khuyến mãi)](#214-bảng-vouchers)
  * [2.15. Bảng `banners` (Banner quảng cáo & Chiến dịch trang chủ)](#215-bảng-banners)
  * [2.16. Bảng `orders` (Hóa đơn đơn hàng & Khóa giá bất biến)](#216-bảng-orders)
  * [2.17. Bảng `order_items` (Chi tiết dòng sản phẩm trong đơn hàng)](#217-bảng-order_items)
  * [2.18. Bảng `order_status_histories` (Lịch sử tiến trình trạng thái đơn hàng)](#218-bảng-order_status_histories)
  * [2.19. Bảng `voucher_usages` (Nhật ký áp dụng voucher - Ràng buộc 1 lần/khách)](#219-bảng-voucher_usages)
  * [2.20. Bảng `wishlist_items` (Danh sách sản phẩm yêu thích)](#220-bảng-wishlist_items)
* [CHƯƠNG 3. PHÂN TÍCH CÁC MỐI QUAN HỆ GIỮA CÁC BẢNG (RELATIONSHIP MATRIX)](#chương-3-phân-tích-các-mối-quan-hệ-giữa-các-bảng)
  * [3.1. Nhóm quan hệ Tài khoản và Sổ địa chỉ](#31-nhóm-quan-hệ-tài-khoản-và-sổ-địa-chỉ)
  * [3.2. Nhóm quan hệ Phân loại danh mục và Thương hiệu](#32-nhóm-quan-hệ-phân-loại-danh-mục-và-thương-hiệu)
  * [3.3. Nhóm quan hệ Ma trận biến thể Giày dép (Cốt lõi ngành thời trang)](#33-nhóm-quan-hệ-ma-trận-biến-thể-giày-dép)
  * [3.4. Nhóm quan hệ Giỏ hàng và Dòng sản phẩm chọn mua](#34-nhóm-quan-hệ-giỏ-hàng-và-dòng-sản-phẩm-chọn-mua)
  * [3.5. Nhóm quan hệ Đơn hàng, Chi tiết đơn hàng và Nhật ký trạng thái](#35-nhóm-quan-hệ-đơn-hàng-chi-tiết-đơn-hàng-và-nhật-ký-trạng-thái)
  * [3.6. Nhóm quan hệ Quản trị tồn kho và Thẻ kho kiểm toán](#36-nhóm-quan-hệ-quản-trị-tồn-kho-và-thẻ-kho-kiểm-toán)
  * [3.7. Nhóm quan hệ Khuyến mãi và Giới hạn sử dụng voucher](#37-nhóm-quan-hệ-khuyến-mãi-và-giới-hạn-sử-dụng-voucher)
  * [3.8. Nhóm quan hệ Yêu thích và Quảng bá tiếp thị](#38-nhóm-quan-hệ-yêu-thích-và-quảng-bá-tiếp-thị)
* [CHƯƠNG 4. PHÂN TÍCH CÁC RÀNG BUỘC TOÀN VẸN DỮ LIỆU (INTEGRITY CONSTRAINTS)](#chương-4-phân-tích-các-ràng-buộc-toàn-vẹn-dữ-liệu)
  * [4.1. Khóa chính (Primary Key) & Cơ chế phát sinh tự động `IDENTITY(1,1)`](#41-khóa-chính-primary-key)
  * [4.2. Khóa ngoại (Foreign Key) & Quy tắc toàn vẹn tham chiếu `ON DELETE`](#42-khóa-ngoại-foreign-key)
  * [4.3. Ràng buộc duy nhất tổ hợp (Composite UNIQUE Constraints)](#43-ràng-buộc-duy-nhất-tổ-hợp)
  * [4.4. Chỉ mục lọc duy nhất (Filtered Unique Indexes - Đặc sản SQL Server)](#44-chỉ-mục-lọc-duy-nhất-filtered-unique-indexes)
  * [4.5. Ràng buộc kiểm tra miền giá trị (CHECK Constraints)](#45-ràng-buộc-kiểm-tra-miền-giá-trị)
  * [4.6. Phân định rõ: Ràng buộc Database vs Quy tắc nghiệp vụ Application](#46-phân-định-rõ-ràng-buộc-database-vs-quy-tắc-nghiệp-vụ-application)
* [CHƯƠNG 5. KỊCH BẢN NGHIỆP VỤ XUYÊN SUỐT: QUY TRÌNH MUA HÀNG COD TRÊN CSDL](#chương-5-kịch-bản-nghiệp-vụ-xuyên-suốt-quy-trình-mua-hàng-cod-trên-csdl)
* [CHƯƠNG 6. HƯỚNG DẪN ĐỌC VÀ HIỂU SƠ ĐỒ ERD CHO NGƯỜI MỚI HỌC](#chương-6-hướng-dẫn-đọc-và-hiểu-sơ-đồ-erd-cho-người-mới-học)
* [CHƯƠNG 7. BỘ CÂU HỎI PHẢN BIỆN CỦA GIẢNG VIÊN VÀ HƯỚNG DẪN TRẢ LỜI ĐẠT ĐIỂM TỐI ĐA](#chương-7-bộ-câu-hỏi-phản-biện-của-giảng-viên)

---

# CHƯƠNG 1. TỔNG QUAN HỆ THỐNG CƠ SỞ DỮ LIỆU VAMOS STORE

## 1.1. Bối cảnh nghiệp vụ bán lẻ giày dép & Đòi hỏi kiến trúc dữ liệu

Website thương mại điện tử **VAMOS STORE** chuyên kinh doanh các dòng giày thể thao (Sneaker, Running, Casual) và sandal chất lượng cao. Khác biệt với việc bán các mặt hàng đơn giản như sách hay đồ gia dụng, bán lẻ giày dép đòi hỏi kiến trúc cơ sở dữ liệu phải giải quyết được những bài toán kỹ thuật rất đặc thù:

1. **Bài toán ma trận thuộc tính đa chiều (Product Matrix):** Một mẫu giày (ví dụ *VAMOS Hunter X*) có thể có nhiều màu sắc (Đen, Trắng, Đỏ) và mỗi màu lại có nhiều kích cỡ (Size 39, 40, 41, 42, 43, 44). Số lượng tồn kho không thể gắn vào sản phẩm cha, mà bắt buộc phải quản lý tới từng mã SKU biến thể cụ thể `[Sản phẩm] x [Màu] x [Size]`.
2. **Bài toán khóa giá và địa chỉ bất biến (Immutable Snapshot):** Khi khách hàng đã chốt đơn mua một đôi giày với giá khuyến mãi 599.000₫ và địa chỉ giao hàng tại thời điểm đặt, thì 1 năm sau xem lại đơn hàng, giá tiền và địa chỉ phải giữ nguyên giá trị lịch sử lúc mua, tuyệt đối không được tự động nhảy theo giá thay đổi trong danh mục hay địa chỉ mới của khách hàng.
3. **Bài toán tính toàn vẹn kho hàng và giao dịch nguyên tử (ACID Transaction):** Thanh toán COD (giao hàng thu tiền tận nơi) yêu cầu hệ thống phải trừ kho ngay khi bấm đặt hàng (`OUT_SALE`) để tránh bán vượt tồn (Overselling) khi nhiều khách cùng mua 1 đôi cuối cùng; đồng thời phải tự động hoàn kho (`IN_CANCEL`) khi đơn bị hủy.
4. **Bài toán kiểm soát khuyến mãi khắt khe:** Mỗi mã voucher phải được giới hạn số lần sử dụng trên toàn hệ thống và đặc biệt là mỗi khách hàng chỉ được hưởng 1 lần duy nhất để chống gian lận lạm dụng mã giảm giá.

Để đáp ứng trọn vẹn các yêu cầu trên, cơ sở dữ liệu của VAMOS STORE được thiết kế chuẩn hóa theo **Dạng chuẩn 3 (3NF)** trên nền tảng **Microsoft SQL Server 2022**, đảm bảo tính toàn vẹn dữ liệu ở mức vật lý bằng các ràng buộc khóa ngoại, Unique tổ hợp và Filtered Unique Index.

---

## 1.2. Phân loại 20 bảng nghiệp vụ theo 6 phân hệ cốt lõi

Toàn bộ CSDL bao gồm đúng **20 bảng nghiệp vụ** được phân định ranh giới chức năng rõ ràng thành 6 phân hệ:

| STT | Phân hệ nghiệp vụ | Các bảng thành phần | Chức năng chính trong hệ thống |
|:---:|---|---|---|
| **1** | **Tài khoản & Xác thực** | `users`, `addresses`, `password_reset_tokens` | Quản lý định danh người dùng, bảo mật mật khẩu bcrypt, phân quyền Customer/Admin, lưu trữ sổ địa chỉ giao hàng có cơ chế địa chỉ mặc định duy nhất và quy trình khôi phục mật khẩu. |
| **2** | **Danh mục & Sản phẩm Master** | `categories`, `brands`, `sizes`, `colors`, `products`, `product_images` | Quản trị cây danh mục phân loại, thương hiệu giày, từ điển kích cỡ EU chuẩn form, từ điển màu sắc và thông tin sản phẩm cha cùng thư viện hình ảnh studio chất lượng cao. |
| **3** | **Biến thể SKU & Quản trị tồn kho** | `product_variants`, `inventory_transactions` | Tạo lập ma trận tổ hợp Size x Màu ra từng SKU biến thể độc lập, theo dõi số lượng tồn kho khả dụng tức thời và ghi nhận nhật ký thẻ kho bất biến phục vụ kiểm toán tài chính. |
| **4** | **Giỏ hàng trực tuyến** | `carts`, `cart_items` | Lưu trữ bền vững giỏ hàng của từng khách hàng, ràng buộc giới hạn bán lẻ tối đa 10 đôi/mặt hàng và tự động đồng bộ giỏ hàng vãng lai khi đăng nhập. |
| **5** | **Khuyến mãi & Tiếp thị** | `vouchers`, `voucher_usages`, `banners` | Quản trị mã giảm giá (theo % hoặc số tiền), hạn mức đơn hàng, giới hạn 1 khách chỉ dùng 1 lần và quản lý trình chiếu banner chiến dịch trang chủ. |
| **6** | **Đơn hàng & Vận hành COD** | `orders`, `order_items`, `order_status_histories`, `wishlist_items` | Xử lý chốt đơn COD an toàn, lưu trữ chi tiết dòng đơn hàng snapshot bất biến, theo dõi dòng đời đơn qua 6 trạng thái FSM và quản lý danh sách sản phẩm yêu thích. |

---

## 1.3. Bảng kỹ thuật `schema_migrations`

Ngoài 20 bảng nghiệp vụ phục vụ trực tiếp cho người dùng và các luồng chức năng của website, trong cơ sở dữ liệu còn tồn tại một bảng kỹ thuật đặc biệt là `schema_migrations`:

```sql
CREATE TABLE schema_migrations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    version VARCHAR(255) NOT NULL UNIQUE,
    applied_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

* **Mục đích:** Bảng này dùng để quản lý phiên bản nâng cấp cấu trúc CSDL (Database Migrations). Mỗi khi có một migration mới chạy (ví dụ `001_initial_schema.sql`, `002_add_filtered_indexes.sql`, `003_voucher_customer_usage.sql`, `004_create_wishlist_items.sql`), hệ thống sẽ kiểm tra bảng này. Nếu phiên bản migration đã được ghi nhận trong cột `version`, hệ thống sẽ bỏ qua; nếu chưa, hệ thống sẽ thực thi và ghi nhận thời điểm áp dụng vào cột `applied_at`.
* **Quy ước học thuật:** Khi giảng viên hỏi về quy mô CSDL của dự án VAMOS STORE, sinh viên cần khẳng định: **"Hệ thống có đúng 20 bảng nghiệp vụ phục vụ cho các chức năng của website, và 1 bảng kỹ thuật `schema_migrations` dùng riêng cho công cụ triển khai tự động."**

---

# CHƯƠNG 2. PHÂN TÍCH CHI TIẾT 20 BẢNG NGHIỆP VỤ

Trong chương này, toàn bộ 20 bảng nghiệp vụ sẽ được phân tích toàn diện theo đúng cấu trúc tiêu chuẩn học thuật: **Mục đích**, **Vai trò trong hệ thống**, **Bảng chi tiết 100% thuộc tính thực tế từ DDL SQL Server**, **Giải thích khóa và ràng buộc**, **Các bảng liên kết** và **Ví dụ sử dụng thực tế trong mã nguồn**.

---

## 2.1. Bảng `users` (Tài khoản người dùng & Phân quyền)

### 2.1.1. Mục đích của bảng
Bảng `users` là bảng trung tâm trong phân hệ người dùng, đại diện cho mọi thực thể con người tương tác có định danh với hệ thống VAMOS STORE. Bảng lưu trữ thông tin nhận diện tài khoản, thông tin liên lạc cơ bản, chuỗi băm mật khẩu bảo mật và quyền hạn truy cập của tài khoản.

### 2.1.2. Vai trò trong hệ thống
* Đóng vai trò là gốc rễ xác thực cho các phiên làm việc (Session authentication qua cookie `vamos_sid`).
* Phân chia người dùng thành 2 vai trò nghiệp vụ: `CUSTOMER` (Khách hàng mua sắm) và `ADMIN` (Quản trị viên vận hành hệ thống).
* Cung cấp cơ chế khóa tài khoản tức thời (`status = 'LOCKED'`). Middleware `checkLockedUser` sẽ kiểm tra cờ này trên từng request để vô hiệu hóa phiên làm việc của người dùng bị khóa ngay lập tức mà không cần đợi cookie hết hạn.
* Là bảng cha liên kết tới hầu hết các bảng nghiệp vụ cá nhân: `addresses`, `carts`, `orders`, `wishlist_items`, `voucher_usages`.

### 2.1.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính, mã định danh số nguyên duy nhất tự tăng của người dùng trong toàn hệ thống. |
| 2 | `full_name` | `NVARCHAR(100)` | **NOT NULL** | Lưu họ và tên đầy đủ của người dùng (hỗ trợ tiếng Việt có dấu nhờ tiền tố `NVARCHAR`). Dùng để xưng hô trên thanh điều hướng, hồ sơ cá nhân và in trên hóa đơn. |
| 3 | `email` | `VARCHAR(100)` | **NOT NULL, UNIQUE** | Địa chỉ hòm thư điện tử của người dùng. Đóng vai trò là tên đăng nhập duy nhất (`UNIQUE`), ngăn chặn việc 1 email đăng ký nhiều tài khoản. Dùng để gửi thông báo đơn hàng và mã khôi phục mật khẩu. |
| 4 | `password_hash` | `VARCHAR(255)` | **NOT NULL** | Lưu chuỗi mật khẩu đã được mã hóa một chiều bằng thuật toán **Bcrypt** với hệ số `saltRounds = 10` (độ dài chuỗi 60 ký tự). Tuyệt đối không lưu mật khẩu dạng văn bản thô (Plain Text) để bảo vệ người dùng nếu CSDL bị rò rỉ. |
| 5 | `phone` | `VARCHAR(20)` | `NULL` | Số điện thoại cá nhân của người dùng. Được dùng để tự động điền sẵn khi người dùng tạo địa chỉ giao hàng mới hoặc đặt hàng nhanh. Có thể `NULL` khi đăng ký mới chỉ dùng email. |
| 6 | `role` | `VARCHAR(20)` | **NOT NULL, DEFAULT 'CUSTOMER'** | Phân quyền truy cập. Nhận một trong hai giá trị: `'CUSTOMER'` (khách hàng mua sắm bình thường) hoặc `'ADMIN'` (quản trị viên có quyền vào trang `/admin/*`). Mặc định khi tạo tài khoản luôn là `'CUSTOMER'`. |
| 7 | `status` | `VARCHAR(20)` | **NOT NULL, DEFAULT 'ACTIVE'** | Trạng thái hoạt động của tài khoản. Nhận giá trị `'ACTIVE'` (đang hoạt động bình thường) hoặc `'LOCKED'` (đã bị quản trị viên khóa). Nếu là `'LOCKED'`, hệ thống sẽ từ chối đăng nhập và chặn ngay các thao tác đặt hàng. |
| 8 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Dấu thời gian ghi nhận thời điểm tài khoản được khởi tạo thành công trong hệ thống. |
| 9 | `updated_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Dấu thời gian ghi nhận thời điểm thông tin tài khoản được cập nhật gần nhất (đổi tên, đổi mật khẩu, đổi trạng thái). |

### 2.1.4. Giải thích khóa và ràng buộc
* **PK:** `id` đảm bảo mỗi người dùng là một thực thể duy nhất.
* **UNIQUE:** Cột `email` có ràng buộc `UNIQUE` ở mức vật lý CSDL. Nếu có câu lệnh INSERT trùng email, SQL Server sẽ ném mã lỗi vi phạm chỉ mục duy nhất và hệ thống sẽ bắt lỗi để hiển thị câu tiếng Việt thân thiện: *"Email này đã được sử dụng bởi một tài khoản khác"*.
* **DEFAULT:** Cột `role` nhận `'CUSTOMER'`, `status` nhận `'ACTIVE'`, `created_at` và `updated_at` tự động lấy thời gian máy chủ bằng hàm `GETDATE()`.

### 2.1.5. Các bảng liên kết

| Bảng liên kết | Thuộc tính tham chiếu | Kiểu quan hệ | Ý nghĩa nghiệp vụ |
|---|---|:---:|---|
| `addresses` | `addresses.user_id -> users.id` | **1 - N** | Một người dùng có thể lưu nhiều địa chỉ nhận hàng trong sổ địa chỉ. Khi xóa tài khoản `users`, toàn bộ địa chỉ tự động xóa theo nhờ `ON DELETE CASCADE`. |
| `carts` | `carts.user_id -> users.id` | **1 - 1** | Mỗi người dùng có đúng 1 giỏ hàng cá nhân duy nhất được lưu bền vững trên máy chủ. |
| `orders` | `orders.user_id -> users.id` | **1 - N** | Một người dùng có thể thực hiện nhiều đơn hàng theo thời gian. |
| `wishlist_items` | `wishlist_items.user_id -> users.id` | **1 - N** | Người dùng có thể lưu nhiều sản phẩm yêu thích vào danh sách quan tâm. |
| `voucher_usages` | `voucher_usages.user_id -> users.id` | **1 - N** | Ghi nhận các mã voucher mà người dùng này đã sử dụng trong lịch sử mua hàng. |
| `password_reset_tokens` | `password_reset_tokens.user_id -> users.id` | **1 - N** | Lưu các mã token phục vụ yêu cầu khôi phục mật khẩu của người dùng. |

### 2.1.6. Ví dụ sử dụng thực tế trong mã nguồn VAMOS STORE
Khi khách hàng nhập form đăng ký tại `/auth/register`, controller `auth.controller.js` gọi hàm `bcrypt.hash(password, 10)` rồi thực hiện câu lệnh:
```sql
INSERT INTO users (full_name, email, password_hash, phone, role, status)
VALUES (@fullName, @email, @hash, @phone, 'CUSTOMER', 'ACTIVE');
```
Sau đó hệ thống lấy `user.id` vừa sinh ra để khởi tạo luôn một giỏ hàng rỗng trong bảng `carts`.

---

## 2.2. Bảng `addresses` (Sổ địa chỉ nhận hàng & Địa chỉ mặc định)

### 2.2.1. Mục đích của bảng
Bảng `addresses` đại diện cho sổ địa chỉ giao hàng của khách hàng. Nó cho phép một tài khoản lưu trước nhiều điểm nhận hàng khác nhau (Nhà riêng, Văn phòng công ty, Nhà người thân) để khi đặt hàng không cần phải gõ lại từ đầu.

### 2.2.2. Vai trò trong hệ thống
* Giúp tối ưu hóa trải nghiệm thanh toán (Checkout UX): Khách hàng chỉ cần 1 cú nhấp chuột để chọn địa chỉ nhận hàng quen thuộc.
* Quản lý phân cấp hành chính 3 cấp chuẩn bưu chính Việt Nam: Tỉnh/Thành phố (`province`), Quận/Huyện (`district`), Phường/Xã (`ward`) và Địa chỉ chi tiết (`detail_address`).
* Đảm bảo cơ chế **duy nhất 1 địa chỉ mặc định** cho mỗi khách hàng thông qua chỉ mục đặc biệt **Filtered Unique Index**.

### 2.2.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng, mã định danh bản ghi địa chỉ. |
| 2 | `user_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu đến `users.id`, xác định địa chỉ này thuộc về tài khoản khách hàng nào. Có `ON DELETE CASCADE`. |
| 3 | `recipient_name` | `NVARCHAR(100)` | **NOT NULL** | Tên của người sẽ nhận bưu phẩm tại địa chỉ này (ví dụ: *"Nguyễn Văn An"*). Có thể khác với tên tài khoản nếu đặt hàng hộ người thân. |
| 4 | `phone` | `VARCHAR(20)` | **NOT NULL** | Số điện thoại của người nhận hàng để shipper bưu tá liên lạc khi phát hàng tận nơi. |
| 5 | `province` | `NVARCHAR(100)` | **NOT NULL** | Tên Tỉnh hoặc Thành phố trực thuộc trung ương (ví dụ: *"Hà Nội"*, *"TP. Hồ Chí Minh"*, *"Đà Nẵng"*). |
| 6 | `district` | `NVARCHAR(100)` | **NOT NULL** | Tên Quận hoặc Huyện (ví dụ: *"Quận Cầu Giấy"*, *"Huyện Thanh Trì"*). |
| 7 | `ward` | `NVARCHAR(100)` | **NOT NULL** | Tên Phường hoặc Xã (ví dụ: *"Phường Dịch Vọng Hậu"*). |
| 8 | `detail_address` | `NVARCHAR(255)` | **NOT NULL** | Số nhà, ngõ/ngách, tên tòa nhà hoặc tên đường cụ thể (ví dụ: *"Tòa nhà FPT, Số 10 Phạm Văn Bạch"*). |
| 9 | `is_default` | `BIT` | **NOT NULL, DEFAULT 0** | Cờ nhị phân (0 hoặc 1) xác định xem địa chỉ này có phải là địa chỉ ưu tiên mặc định của khách hàng hay không. `1` = Địa chỉ mặc định, `0` = Địa chỉ phụ. |
| 10 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm tạo bản ghi địa chỉ. |
| 11 | `updated_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm chỉnh sửa thông tin địa chỉ gần nhất. |

### 2.2.4. Giải thích khóa và ràng buộc
* **Chỉ mục lọc duy nhất (Filtered Unique Index):**
  Trong Migration `002_add_filtered_indexes.sql`, CSDL được cài đặt chỉ mục:
  ```sql
  CREATE UNIQUE NONCLUSTERED INDEX uq_user_default_address
  ON addresses (user_id)
  WHERE is_default = 1;
  ```
  *Ý nghĩa thực tế:* Một khách hàng có thể có 10 địa chỉ có `is_default = 0` (vì chỉ mục chỉ lọc những dòng có `is_default = 1`), nhưng khách hàng đó **tuyệt đối không thể có 2 dòng cùng có `is_default = 1`**. Nếu ứng dụng vô tình ghi đè hoặc lỗi logic đặt 2 địa chỉ mặc định, CSDL SQL Server sẽ chặn đứng ngay lập tức ở tầng vật lý.
* **ON DELETE CASCADE:** Nếu tài khoản người dùng bị xóa khỏi hệ thống, toàn bộ địa chỉ trong sổ địa chỉ của họ sẽ tự động bị xóa theo sạch sẽ, không để lại rác dữ liệu mồ côi (Orphan records).

### 2.2.5. Các bảng liên kết
* `users` (`addresses.user_id -> users.id`): Quan hệ **N - 1**. Nhiều địa chỉ thuộc về một người dùng.
* Khi khách hàng đặt đơn, hệ thống sẽ đọc từ `addresses` rồi gộp chuỗi lại thành text để ghi vào cột `orders.delivery_address_snapshot`. Bảng `orders` không giữ FK tới `addresses` để tránh việc người dùng sửa đổi hoặc xóa địa chỉ làm hỏng lịch sử của các đơn hàng cũ.

---

## 2.3. Bảng `password_reset_tokens` (Mã khôi phục mật khẩu)

### 2.3.1. Mục đích của bảng
Bảng `password_reset_tokens` phục vụ cho quy trình bảo mật khôi phục mật khẩu khi khách hàng bị quên (Use Case UC03 / AD11). Nó lưu trữ các chuỗi mã token ngẫu nhiên có gắn kèm thời hạn hiệu lực được sinh ra khi người dùng gửi yêu cầu "Quên mật khẩu".

### 2.3.2. Vai trò trong hệ thống
* Cung cấp cơ chế đặt lại mật khẩu an toàn qua link gửi vào email của khách hàng.
* Chống tấn công phát lại (Replay Attack): Mỗi mã token chỉ được dùng đúng 1 lần duy nhất; khi dùng xong cột `used_at` sẽ được đóng dấu ngày giờ, ngăn chặn kẻ gian dùng lại link cũ trong email.
* Tự động hết hạn: Cột `expires_at` giới hạn thời gian tồn tại của token (thông thường là 60 phút).

### 2.3.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng của bảng mã token. |
| 2 | `user_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu đến `users.id`, xác định token này được cấp phát cho tài khoản nào. Có `ON DELETE CASCADE`. |
| 3 | `token_hash` | `NVARCHAR(255)` | **NOT NULL, UNIQUE** | Chuỗi mã định danh bí mật ngẫu nhiên (UUID hoặc chuỗi ngẫu nhiên 64 ký tự hex) được đính kèm vào đường link khôi phục gửi cho khách. Ràng buộc `UNIQUE` đảm bảo không bao giờ có 2 token trùng nhau. |
| 4 | `expires_at` | `DATETIME2` | **NOT NULL** | Thời điểm hết hạn của token. Khi người dùng bấm vào link, hệ thống kiểm tra `IF GETDATE() > expires_at` thì sẽ báo lỗi: *"Đường link khôi phục mật khẩu đã hết hạn, vui lòng tạo yêu cầu mới."* |
| 5 | `used_at` | `DATETIME2` | `NULL` | Thời điểm token được người dùng sử dụng để đổi mật khẩu thành công. Mặc định là `NULL`. Khi đã có giá trị khác null thì token bị coi là đã vô hiệu hóa. |
| 6 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm phát sinh yêu cầu khôi phục mật khẩu. |

---

## 2.4. Bảng `categories` (Danh mục phân loại sản phẩm)

### 2.4.1. Mục đích của bảng
Bảng `categories` dùng để quản lý cấu trúc phân loại sản phẩm của cửa hàng VAMOS STORE theo các nhóm công năng hoặc đối tượng sử dụng (ví dụ: Sneaker Nam, Sneaker Nữ, Giày Chạy Bộ, Sandal & Dép).

### 2.4.2. Vai trò trong hệ thống
* Xây dựng menu điều hướng chính trên thanh Header của website.
* Phục vụ bộ lọc tìm kiếm sản phẩm theo danh mục (`/products?cat=sneaker-nam`).
* Phục vụ thống kê doanh số bán hàng và số lượng tồn kho theo từng ngành hàng cho Quản trị viên.

### 2.4.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng của danh mục sản phẩm. |
| 2 | `name` | `NVARCHAR(100)` | **NOT NULL** | Tên hiển thị của danh mục bằng tiếng Việt (ví dụ: *"Sneaker Nam"*, *"Giày Thể Thao Running"*). |
| 3 | `slug` | `VARCHAR(100)` | **NOT NULL, UNIQUE** | Chuỗi định danh URL thân thiện cho SEO (ví dụ: `"sneaker-nam"`, `"giay-the-thao"`). Ràng buộc `UNIQUE` đảm bảo đường dẫn không bị xung đột. |
| 4 | `description` | `NVARCHAR(500)` | `NULL` | Đoạn văn bản mô tả ngắn về đặc tính của dòng sản phẩm thuộc danh mục này, hỗ trợ hiển thị thẻ meta description cho SEO. |
| 5 | `is_active` | `BIT` | **NOT NULL, DEFAULT 1** | Trạng thái hiển thị danh mục. `1` = Đang hiển thị công khai trên menu web; `0` = Tạm ẩn (khi hết hàng mùa vụ hoặc tạm ngừng kinh doanh). |
| 6 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Ngày giờ tạo danh mục. |

---

## 2.5. Bảng `brands` (Thương hiệu giày dép)

### 2.5.1. Mục đích của bảng
Bảng `brands` lưu trữ thông tin về các hãng sản xuất và các nhãn hiệu giày phân phối chính hãng trên website VAMOS STORE (ví dụ: Biti's Hunter, VAMOS Originals, VAMOS Performance, Nike, Adidas).

### 2.5.2. Vai trò trong hệ thống
* Giúp khách hàng lọc sản phẩm theo thương hiệu yêu thích tại trang Cửa hàng.
* Tôn vinh giá trị sản phẩm: Mỗi card sản phẩm đều hiển thị nhãn thương hiệu (Brand Tag) ở góc trên.
* Quản lý logo thương hiệu trên các khối đối tác đối tác chiến lược trang chủ.

### 2.5.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng của bảng thương hiệu. |
| 2 | `name` | `NVARCHAR(100)` | **NOT NULL** | Tên chính thức của thương hiệu (ví dụ: *"Biti's Hunter"*, *"VAMOS Originals"*). |
| 3 | `slug` | `VARCHAR(100)` | **NOT NULL, UNIQUE** | Chuỗi URL thân thiện không dấu dùng để lọc thương hiệu trên đường dẫn web (ví dụ: `"bitis-hunter"`). |
| 4 | `description` | `NVARCHAR(500)` | `NULL` | Giới thiệu ngắn về nguồn gốc, xuất xứ và công nghệ nổi bật của thương hiệu. |
| 5 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Ngày giờ tạo thương hiệu trong CSDL. |

---

## 2.6. Bảng `sizes` (Kích cỡ giày chuẩn EU)

### 2.6.1. Mục đích của bảng
Bảng `sizes` đóng vai trò là bảng danh mục chuẩn hóa (Lookup Table) cho toàn bộ hệ thống kích cỡ giày dép được bán tại VAMOS STORE, sử dụng dải kích cỡ tiêu chuẩn châu Âu (EU Size).

### 2.6.2. Vai trò trong hệ thống
* Chuẩn hóa kích cỡ thành một bảng riêng (Dạng chuẩn 3NF). Tránh việc mỗi người nhập một kiểu (người gõ "39", người gõ "Size 39", người gõ "EU 39") gây lỗi khi lọc sản phẩm.
* Cung cấp danh sách các nút chọn Size trên giao diện chi tiết sản phẩm và bộ lọc trang Cửa hàng.
* Sắp xếp kích cỡ theo đúng thứ tự logic từ nhỏ đến lớn thông qua thuộc tính `display_order`.

### 2.6.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng của bảng kích cỡ. |
| 2 | `size_name` | `VARCHAR(20)` | **NOT NULL, UNIQUE** | Giá trị kích cỡ bằng chữ số chuẩn (ví dụ: `"38"`, `"39"`, `"40"`, `"41"`, `"42"`, `"43"`, `"44"`). Ràng buộc `UNIQUE` chống tạo trùng kích cỡ. |
| 3 | `display_order` | `INT` | **NOT NULL, DEFAULT 0** | Số nguyên quy định thứ tự hiển thị ưu tiên khi đưa lên website. Ví dụ size 38 có order=1, size 39 có order=2, size 44 có order=7. Nhờ cột này, các nút size trên giao diện luôn xuất hiện từ bé đến lớn rất gọn gàng. |

---

## 2.7. Bảng `colors` (Màu sắc & Mã màu hiển thị)

### 2.7.1. Mục đích của bảng
Bảng `colors` đóng vai trò là bảng danh mục chuẩn hóa cho tất cả các phối màu của sản phẩm giày dép trong hệ sinh thái VAMOS STORE.

### 2.7.2. Vai trò trong hệ thống
* Chuẩn hóa tên gọi màu sắc của sản phẩm thành các bản ghi nhất quán (ví dụ: Đen Carbon, Trắng Tuyết, Đỏ Kinetic, Xám Khói).
* Cung cấp mã màu hex (`hex_code`) để giao diện web tự động hiển thị các chấm tròn màu (Color Swatches) trên card sản phẩm và bộ chọn màu chi tiết mà không cần phải cắt ghép từng ảnh nhỏ.

### 2.7.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng của bảng màu sắc. |
| 2 | `color_name` | `NVARCHAR(50)` | **NOT NULL, UNIQUE** | Tên gọi tiếng Việt của màu sắc (ví dụ: *"Đen Carbon"*, *"Trắng Tuyết"*, *"Đỏ Kinetic"*). |
| 3 | `hex_code` | `VARCHAR(10)` | `NULL` | Mã màu web dạng thập lục phân (ví dụ: `"#111111"`, `"#FFFFFF"`, `"#E11B22"`). Trình duyệt đọc mã này để tô màu nền trực tiếp cho icon swatch trên giao diện HTML/CSS. |

---

## 2.8. Bảng `products` (Thông tin sản phẩm gốc - Master)

### 2.8.1. Mục đích của bảng
Bảng `products` lưu trữ thông tin sản phẩm ở mức độ khái niệm trừu tượng (Product Master/Parent Product). Nó đại diện cho một model/dòng giày nói chung (ví dụ đôi *"Giày Sneaker Nam Vamos Air Wave V1"*) trước khi xét đến từng size và màu cụ thể.

### 2.8.2. Vai trò trong hệ thống
* Là thực thể trung tâm của toàn bộ catalog sản phẩm trên website.
* Lưu trữ các thông tin chung bất biến giữa các size: Tên sản phẩm, slug đường dẫn, mã sản phẩm nội bộ, giá bán niêm yết, phân loại giới tính mục tiêu và mô tả đặc tính kỹ thuật.
* Đóng vai trò là bảng cha liên kết trực tiếp tới danh mục (`categories`), thương hiệu (`brands`), thư viện ảnh (`product_images`) và tập hợp các biến thể SKU con (`product_variants`).

### 2.8.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng định danh duy nhất sản phẩm gốc. |
| 2 | `category_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu đến `categories.id`, xác định sản phẩm thuộc nhóm danh mục nào. |
| 3 | `brand_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu đến `brands.id`, xác định hãng sản xuất của đôi giày. |
| 4 | `product_code` | `VARCHAR(50)` | **NOT NULL, UNIQUE** | Mã sản phẩm nội bộ do cửa hàng quy định (ví dụ: `"SP001"`, `"VMS-HUNTER-X"`). Ràng buộc `UNIQUE` chống tạo trùng mã hàng. |
| 5 | `name` | `NVARCHAR(200)` | **NOT NULL** | Tên thương mại đầy đủ của sản phẩm hiển thị trên website (ví dụ: *"Giày Sneaker Vamos Retro Classic 1988"*). |
| 6 | `slug` | `VARCHAR(200)` | **NOT NULL, UNIQUE** | Chuỗi URL thân thiện chuẩn SEO dùng cho trang chi tiết `/products/:slug` (ví dụ: `"vamos-retro-classic-1988"`). |
| 7 | `description` | `NVARCHAR(MAX)` | `NULL` | Bài viết mô tả chi tiết sản phẩm: công nghệ đế đệm, chất liệu sợi dệt, hướng dẫn bảo quản, quy cách bảo hành (hỗ trợ văn bản dài định dạng HTML/Markdown). |
| 8 | `gender_target` | `VARCHAR(20)` | **NOT NULL, DEFAULT 'UNISEX'** | Đối tượng sử dụng mục tiêu của đôi giày. Nhận một trong các giá trị: `'MEN'` (Nam), `'WOMEN'` (Nữ), hoặc `'UNISEX'` (Dùng chung cho cả nam và nữ). Dùng cho bộ lọc Pill Buttons trên giao diện. |
| 9 | `base_price` | `DECIMAL(18,2)` | **NOT NULL** | Giá bán gốc niêm yết của sản phẩm (chưa áp dụng chương trình giảm giá). Đơn vị VNĐ. Luôn bắt buộc phải lớn hơn 0. |
| 10 | `sale_price` | `DECIMAL(18,2)` | `NULL` | Giá bán khuyến mãi (nếu có chiến dịch ưu đãi). Nếu có giá trị và `sale_price < base_price`, hệ thống sẽ tự động tính tỷ lệ giảm `%` và hiển thị badge đỏ `-20%` trên card sản phẩm. |
| 11 | `status` | `VARCHAR(20)` | **NOT NULL, DEFAULT 'ACTIVE'** | Trạng thái kinh doanh của sản phẩm: `'ACTIVE'` (đang bán công khai) hoặc `'INACTIVE'` (ngừng kinh doanh/tạm ẩn khỏi danh mục). |
| 12 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm tạo sản phẩm mới. |
| 13 | `updated_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm cập nhật giá hoặc thông tin sản phẩm gần nhất. |

---

## 2.9. Bảng `product_images` (Thư viện hình ảnh sản phẩm)

### 2.9.1. Mục đích của bảng
Bảng `product_images` quản lý danh sách các tệp hình ảnh minh họa cho sản phẩm. Một sản phẩm giày thường có nhiều góc chụp khác nhau (Góc nghiêng 45 độ, góc từ trên nhìn xuống, góc đế giày, góc cận cảnh mũi giày).

### 2.9.2. Vai trò trong hệ thống
* Cung cấp gallery hình ảnh cho trang chi tiết sản phẩm (`products/detail.pug`).
* Xác định hình ảnh đại diện chính (Primary Image / Thumbnail) để hiển thị trên các card sản phẩm ngoài trang chủ, trang danh mục và giỏ hàng.
* Sắp xếp thứ tự hiển thị các ảnh thumbnail nhỏ thông qua thuộc tính `display_order`.

### 2.9.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng định danh tệp ảnh. |
| 2 | `product_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu `products.id`. Xác định ảnh này chụp cho sản phẩm nào. Có `ON DELETE CASCADE`. |
| 3 | `image_url` | `NVARCHAR(500)` | **NOT NULL** | Đường dẫn tương đối hoặc tuyệt đối tới tệp hình ảnh (ví dụ: `"/images/products/air-wave-red.png"` hoặc URL CDN). |
| 4 | `is_primary` | `BIT` | **NOT NULL, DEFAULT 0** | Cờ nhị phân xác định ảnh đại diện chính của sản phẩm. `1` = Ảnh đại diện chính (Thumbnail), `0` = Ảnh chi tiết bổ trợ trong gallery. |
| 5 | `display_order` | `INT` | **NOT NULL, DEFAULT 0** | Thứ tự ưu tiên hiển thị của các ảnh trong slide/gallery (0, 1, 2, 3...). |

### 2.9.4. Ràng buộc quan trọng (Chỉ mục lọc duy nhất)
Trong Migration `002_add_filtered_indexes.sql`:
```sql
CREATE UNIQUE NONCLUSTERED INDEX uq_product_primary_image
ON product_images (product_id)
WHERE is_primary = 1;
```
*Ý nghĩa thực tế:* Ngăn chặn tuyệt đối việc một sản phẩm có từ 2 ảnh chính trở lên. Điều này bảo đảm giao diện website ở trang chủ và danh mục khi chạy câu lệnh `SELECT ... WHERE is_primary = 1` sẽ luôn luôn chỉ lấy ra duy nhất đúng 1 tấm ảnh đại diện đẹp nhất của sản phẩm.

---

## 2.10. Bảng `product_variants` (Ma trận biến thể SKU & Quản lý tồn kho)

### 2.10.1. Mục đích của bảng
Bảng `product_variants` là bảng cốt lõi nhất giải quyết bài toán ma trận giày dép trong ngành thời trang. Nó đại diện cho từng đơn vị lưu kho cụ thể (Stock Keeping Unit - SKU), là sự kết hợp vật lý chính xác giữa: **1 Sản phẩm gốc + 1 Kích cỡ cụ thể + 1 Màu sắc cụ thể**.

### 2.10.2. Vai trò trong hệ thống
* Quản lý số lượng tồn kho thực tế (`stock_quantity`) tại tầng vật lý. Khách mua size 40 màu Đen thì chỉ có kho của SKU size 40 màu Đen bị trừ, size 41 màu Đen của người khác không bị ảnh hưởng.
* Mỗi biến thể có một mã `sku` độc lập (ví dụ `"VMS-AIR-BLK-40"`) dùng để dán mã vạch lên hộp giày ngoài đời thực.
* Là thực thể vật lý được thêm vào giỏ hàng (`cart_items`) và được khách chốt mua trong đơn hàng (`order_items`).

### 2.10.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng, mã định danh biến thể sản phẩm. |
| 2 | `product_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu đến sản phẩm cha `products.id`. Có `ON DELETE CASCADE`. |
| 3 | `size_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu đến kích cỡ `sizes.id`. |
| 4 | `color_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu đến màu sắc `colors.id`. |
| 5 | `sku` | `VARCHAR(100)` | **NOT NULL, UNIQUE** | Mã quản lý kho hàng duy nhất (Stock Keeping Unit) của biến thể (ví dụ: `"VMS-HUNTER-X-BLK-40"`). Ràng buộc `UNIQUE` đảm bảo không bao giờ bị trùng mã SKU trong toàn kho. |
| 6 | `stock_quantity` | `INT` | **NOT NULL, DEFAULT 0** | Số lượng đôi giày thực tế đang có sẵn trong kho hàng. Có ràng buộc `CHECK (stock_quantity >= 0)` để CSDL tự động chặn đứng mọi nguy cơ tồn kho bị âm (âm kho). |
| 7 | `status` | `VARCHAR(20)` | **NOT NULL, DEFAULT 'ACTIVE'** | Trạng thái của biến thể: `'ACTIVE'` (đang bán bình thường) hoặc `'OUT_OF_STOCK'` (tạm hết hàng) hoặc `'INACTIVE'` (ngừng sản xuất size/màu này). |
| 8 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Ngày giờ tạo biến thể. |
| 9 | `updated_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Ngày giờ điều chỉnh tồn kho hoặc cập nhật trạng thái gần nhất. |

### 2.10.4. Giải thích ràng buộc quan trọng
* **Ràng buộc duy nhất tổ hợp (Composite UNIQUE Constraint):**
  ```sql
  CONSTRAINT UQ_variant_product_size_color UNIQUE (product_id, size_id, color_id)
  ```
  *Ý nghĩa thực tế:* Một sản phẩm không thể có 2 dòng biến thể cùng trùng một kích cỡ và một màu sắc. Ví dụ: Nếu đôi Hunter X đã có dòng biến thể (Hunter X, Size 40, Đen) thì nếu Admin vô tình bấm tạo thêm một biến thể (Hunter X, Size 40, Đen) lần nữa, CSDL sẽ ném lỗi vi phạm Unique ngay lập tức. Muốn tăng số lượng, Admin phải dùng chức năng cập nhật `stock_quantity` chứ không được tạo thêm dòng.
* **Ràng buộc kiểm tra tồn kho không âm (CHECK Constraint):**
  ```sql
  CONSTRAINT CK_variant_stock CHECK (stock_quantity >= 0)
  ```
  *Ý nghĩa thực tế:* Đảm bảo không bao giờ xảy ra hiện tượng bán vượt số lượng tồn thực tế (Overselling). Nếu trong kho chỉ còn 1 đôi mà có câu lệnh trừ 2 đôi, câu lệnh UPDATE sẽ vi phạm CHECK constraint và bị hủy bỏ (Rollback) ngay lập tức.

---

## 2.11. Bảng `inventory_transactions` (Sổ nhật ký thẻ kho bất biến)

### 2.11.1. Mục đích của bảng
Bảng `inventory_transactions` đóng vai trò là Sổ nhật ký thẻ kho điện tử (Stock Ledger / Audit Trail). Trong quản trị kho bãi chuyên nghiệp, **tuyệt đối không bao giờ được phép âm thầm sửa số lượng tồn kho mà không có bằng chứng ghi nhận lý do tại sao tăng và tại sao giảm**. Bảng này ghi nhận mọi biến động xuất nhập tồn của từng biến thể SKU.

### 2.11.2. Vai trò trong hệ thống
* Lưu vết kiểm toán kế toán: Ghi nhận ai là người thực hiện, thời điểm nào, số lượng trước khi đổi là bao nhiêu, số lượng sau khi đổi là bao nhiêu và chênh lệch là bao nhiêu đôi.
* Phục vụ các nghiệp vụ tự động:
  - Khách mua chốt đơn COD: Tự động ghi thẻ kho lý do `"OUT_SALE: Đơn hàng #VAM261118-001"`.
  - Khách hủy đơn hàng khi đang chờ duyệt: Tự động ghi thẻ kho lý do `"IN_CANCEL: Hoàn tồn đơn #VAM261118-001"`.
  - Admin nhập hàng container mới: Ghi thẻ kho lý do `"IN_IMPORT: Nhập hàng đợt 1 tháng 11"`.
  - Kiểm kho phát hiện rách hộp/hao hụt: Ghi thẻ kho lý do `"ADJUST: Kiểm kê hao hụt định kỳ"`.

### 2.11.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng của bản ghi giao dịch thẻ kho. |
| 2 | `variant_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu đến biến thể `product_variants.id` chịu biến động số lượng. |
| 3 | `user_id` | `INT` | `NULL, FK` | Khóa ngoại tham chiếu `users.id`, ghi nhận tài khoản thực hiện hành động (có thể là Admin điều chỉnh, hoặc Khách hàng khi đặt đơn). |
| 4 | `old_quantity` | `INT` | **NOT NULL** | Số lượng tồn kho của biến thể ngay trước thời điểm phát sinh giao dịch. |
| 5 | `new_quantity` | `INT` | **NOT NULL** | Số lượng tồn kho của biến thể ngay sau khi hoàn tất giao dịch. |
| 6 | `change_quantity` | `INT` | **NOT NULL** | Số lượng chênh lệch (âm nếu là xuất kho bán hàng, dương nếu là nhập hàng mới hoặc hoàn kho do hủy đơn). Ta luôn có đẳng thức kiểm toán: `old_quantity + change_quantity = new_quantity`. |
| 7 | `reason` | `NVARCHAR(255)` | **NOT NULL** | Diễn giải lý do phát sinh nghiệp vụ kho (ví dụ: *"Bán lẻ đơn hàng #VAM261118-1234"*, *"Hoàn kho đơn hủy #VAM261118-1234"*). |
| 8 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm chính xác phát sinh biến động kho hàng. |

---

## 2.12. Bảng `carts` (Giỏ hàng người dùng)

### 2.12.1. Mục đích của bảng
Bảng `carts` đóng vai trò là bảng phần đầu (Header) lưu trữ thông tin giỏ hàng bền vững (Persistent Server-side Cart) của những khách hàng đã đăng nhập tài khoản.

### 2.12.2. Vai trò trong hệ thống
* Khắc phục nhược điểm của giỏ hàng lưu bằng Cookie/Session: Khách hàng thêm giày vào giỏ hàng trên điện thoại, sau đó mở máy tính đăng nhập vào thì giỏ hàng vẫn còn nguyên vẹn nhờ được lưu trong bảng `carts` của CSDL.
* Đảm bảo tính duy nhất: Mỗi tài khoản người dùng chỉ có duy nhất 1 giỏ hàng (`user_id UNIQUE`).

### 2.12.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng định danh giỏ hàng. |
| 2 | `user_id` | `INT` | **NOT NULL, UNIQUE, FK** | Khóa ngoại tham chiếu `users.id`. Ràng buộc `UNIQUE` bảo đảm mỗi người dùng sở hữu duy nhất 1 giỏ hàng. Có `ON DELETE CASCADE`. |
| 3 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Ngày giờ tạo giỏ hàng. |
| 4 | `updated_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Ngày giờ cập nhật giỏ hàng gần nhất (thêm, sửa, xóa món). |

---

## 2.13. Bảng `cart_items` (Chi tiết từng món trong giỏ hàng)

### 2.13.1. Mục đích của bảng
Bảng `cart_items` lưu trữ từng dòng sản phẩm cụ thể nằm bên trong một giỏ hàng. Nó liên kết trực tiếp một giỏ hàng (`carts`) với một biến thể sản phẩm cụ thể (`product_variants`) kèm số lượng khách muốn mua.

### 2.13.2. Vai trò trong hệ thống
* Cho phép một giỏ hàng có thể chứa nhiều đôi giày khác nhau (khác mẫu, hoặc cùng một mẫu nhưng khác size/màu).
* Thực thi quy định bán lẻ: Giới hạn khách hàng chỉ được chọn mua từ 1 đến 10 đôi / sản phẩm để đảm bảo sự công bằng cho thị trường tiêu dùng lẻ (Decision Q7).
* Đảm bảo mỗi biến thể chỉ xuất hiện trên tối đa 1 dòng duy nhất trong giỏ hàng nhờ ràng buộc Unique.

### 2.13.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng định danh dòng giỏ hàng. |
| 2 | `cart_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu đến giỏ hàng cha `carts.id`. Có `ON DELETE CASCADE`. |
| 3 | `variant_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu đến biến thể `product_variants.id` được chọn (xác định rõ size gì, màu gì). |
| 4 | `quantity` | `INT` | **NOT NULL, DEFAULT 1** | Số lượng đôi giày khách muốn mua cho biến thể này. |
| 5 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm thêm món hàng này vào giỏ. |
| 6 | `updated_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm bấm tăng/giảm số lượng gần nhất. |

### 2.13.4. Ràng buộc toàn vẹn quan trọng
* **Ràng buộc duy nhất dòng giỏ hàng (Composite UNIQUE):**
  ```sql
  CONSTRAINT UQ_cart_variant UNIQUE (cart_id, variant_id)
  ```
  *Ý nghĩa thực tế:* Trong 1 giỏ hàng, một biến thể (ví dụ Hunter X size 40 Đen) chỉ được xuất hiện trên **đúng 1 dòng duy nhất**. Nếu khách hàng đang có 1 đôi Hunter X size 40 Đen trong giỏ mà tiếp tục ra ngoài trang sản phẩm bấm "Thêm vào giỏ hàng" lần nữa, ứng dụng sẽ thực hiện lệnh `UPDATE cart_items SET quantity = quantity + 1` chứ CSDL không bao giờ cho phép chèn thêm một dòng mới trùng `variant_id`.
* **Ràng buộc kiểm tra số lượng bán lẻ (CHECK Constraint):**
  ```sql
  CONSTRAINT CK_cart_quantity CHECK (quantity > 0 AND quantity <= 10)
  ```
  *Ý nghĩa thực tế:* Chặn đứng ngay tại tầng CSDL nếu có ai đó cố tình hack API gửi số lượng âm (`-5`), số lượng 0 hoặc số lượng mua sỉ chợ đen (`99 đôi`).

---

## 2.14. Bảng `vouchers` (Mã phiếu giảm giá khuyến mãi)

### 2.14.1. Mục đích của bảng
Bảng `vouchers` quản trị các chương trình khuyến mãi và phiếu giảm giá (Voucher / Coupon) của VAMOS STORE, hỗ trợ cả 2 hình thức: giảm theo phần trăm `%` hoặc giảm số tiền cố định VNĐ.

### 2.14.2. Vai trò trong hệ thống
* Kích thích người tiêu dùng chốt đơn thông qua các chiến dịch ưu đãi (ví dụ mã `VAMOS100` giảm 100.000₫ cho khách mới, mã `FREESHIP` giảm 30.000₫ phí ship).
* Kiểm soát ngân sách khuyến mãi: Thiết lập giá trị đơn hàng tối thiểu (`min_order_value`), mức giảm tối đa (`max_discount_amount`), tổng số lượt phát hành tối đa (`usage_limit`) và đếm số lượt đã sử dụng (`used_count`).

### 2.14.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng của voucher. |
| 2 | `code` | `VARCHAR(50)` | **NOT NULL, UNIQUE** | Ký tự mã giảm giá khách hàng gõ vào ô nhập (ví dụ: `"VAMOS50K"`, `"FREESHIP"`). Viết in hoa, không dấu, duy nhất toàn hệ thống. |
| 3 | `name` | `NVARCHAR(100)` | **NOT NULL** | Tên mô tả chương trình ưu đãi (ví dụ: *"Tri ân khách hàng thân thiết - Giảm 50K"*). |
| 4 | `discount_type` | `VARCHAR(20)` | **NOT NULL** | Loại giảm giá: Nhận giá trị `'PERCENT'` (giảm theo tỷ lệ %) hoặc `'FIXED'` (giảm trừ thẳng một số tiền cụ thể). |
| 5 | `discount_value` | `DECIMAL(18,2)` | **NOT NULL** | Giá trị giảm. Nếu type là `'PERCENT'`, giá trị là số phần trăm (ví dụ `20` tức 20%); nếu là `'FIXED'`, giá trị là số tiền VNĐ (ví dụ `50000.00` tức 50.000₫). |
| 6 | `min_order_value` | `DECIMAL(18,2)` | **NOT NULL, DEFAULT 0** | Giá trị tạm tính tối thiểu của giỏ hàng để được áp dụng voucher này (ví dụ đơn phải từ 500.000₫ trở lên). |
| 7 | `max_discount_amount` | `DECIMAL(18,2)` | `NULL` | Mức trần giảm giá tối đa (thường áp dụng cho loại `'PERCENT'` để chống thâm hụt ngân sách khi khách mua đơn quá lớn, ví dụ giảm 20% nhưng tối đa không quá 200.000₫). |
| 8 | `start_date` | `DATETIME2` | **NOT NULL** | Thời điểm bắt đầu có hiệu lực của mã giảm giá. |
| 9 | `end_date` | `DATETIME2` | **NOT NULL** | Thời điểm kết thúc hiệu lực của mã. Hệ thống sẽ so sánh `IF GETDATE() > end_date` để báo mã đã hết hạn. |
| 10 | `usage_limit` | `INT` | **NOT NULL, DEFAULT 100** | Tổng số lượt sử dụng tối đa của voucher được phát hành ra cho toàn bộ khách hàng. |
| 11 | `used_count` | `INT` | **NOT NULL, DEFAULT 0** | Số lượt khách hàng thực tế đã dùng voucher này để đặt đơn thành công. Khi `used_count >= usage_limit`, voucher sẽ tự động hết lượt. |
| 12 | `is_active` | `BIT` | **NOT NULL, DEFAULT 1** | Trạng thái kích hoạt: `1` = Đang cho phép sử dụng, `0` = Tạm khóa (Admin có thể chủ động dừng chương trình sớm). |
| 13 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm tạo voucher. |

---

## 2.15. Bảng `banners` (Banner quảng cáo & Chiến dịch trang chủ)

### 2.15.1. Mục đích của bảng
Bảng `banners` dùng để quản lý các hình ảnh biểu ngữ quảng cáo, banner slider trình chiếu tại khu vực Hero Section của trang chủ website.

### 2.15.2. Vai trò trong hệ thống
* Phục vụ công tác tiếp thị, quảng bá các bộ sưu tập giày mới ra mắt (như *"Chiến dịch VAMOS Hunter X - Bước tiến vô cực"*).
* Cho phép Admin thay đổi linh hoạt hình ảnh, tiêu đề chiến dịch và đường link chuyển hướng mà không cần phải can thiệp sửa mã nguồn HTML.

### 2.15.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng của banner. |
| 2 | `title` | `NVARCHAR(200)` | **NOT NULL** | Tiêu đề của chiến dịch quảng cáo hiển thị nổi bật trên banner. |
| 3 | `image_url` | `NVARCHAR(500)` | **NOT NULL** | Đường dẫn tệp ảnh banner (chuẩn kích thước Desktop 1920x620). |
| 4 | `link_url` | `NVARCHAR(500)` | `NULL` | Đường dẫn liên kết khi người dùng nhấp chuột vào banner (ví dụ: `"/products?cat=sneaker-nam"`). |
| 5 | `display_order` | `INT` | **NOT NULL, DEFAULT 0** | Thứ tự trình chiếu trong slider (0 hiển thị trước, 1 hiển thị sau). |
| 6 | `is_active` | `BIT` | **NOT NULL, DEFAULT 1** | Trạng thái hiển thị: `1` = Đang hiển thị trên trang chủ, `0` = Ẩn. |
| 7 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Ngày giờ tạo banner. |

---

## 2.16. Bảng `orders` (Hóa đơn đơn hàng & Khóa giá bất biến)

### 2.16.1. Mục đích của bảng
Bảng `orders` là bảng đầu não trong phân hệ bán hàng, lưu trữ thông tin tổng quát của một giao dịch đặt mua hàng. Bảng này đại diện cho hợp đồng mua bán ràng buộc giữa Khách hàng và VAMOS STORE.

### 2.16.2. Vai trò trong hệ thống
* Lưu giữ toàn bộ các chỉ số tài chính của đơn hàng: Tạm tính (`subtotal`), Số tiền giảm giá (`discount_amount`), Phí vận chuyển (`shipping_fee`) và Tổng số tiền phải thanh toán (`total_amount`).
* Quản lý tiến trình vận hành đơn hàng thông qua máy trạng thái hữu hạn (Finite State Machine - FSM) gồm 6 trạng thái chuẩn: `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPING` -> `COMPLETED`, hoặc `CANCELLED`.
* **Bảo toàn dữ liệu lịch sử bất biến (Snapshotting):** Lưu lại cứng toàn bộ họ tên, SĐT và địa chỉ giao hàng của người nhận tại thời điểm đặt đơn vào các cột Snapshot, tuyệt đối không bị ảnh hưởng nếu sau này khách hàng vào sửa sổ địa chỉ.

### 2.16.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng, mã ID kỹ thuật của đơn hàng. |
| 2 | `order_code` | `VARCHAR(50)` | **NOT NULL, UNIQUE** | Mã đơn hàng nghiệp vụ hiển thị cho khách hàng và shipper (ví dụ: `"VAM261118-7578"`). Định dạng tiền tố thương hiệu `VAM` kèm ngày tháng năm và chuỗi ngẫu nhiên. Ràng buộc `UNIQUE` chống trùng mã đơn. |
| 3 | `user_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu `users.id`, xác định ai là người tạo đơn hàng này. |
| 4 | `recipient_name_snapshot` | `NVARCHAR(100)` | **NOT NULL** | **Snapshot tên người nhận:** Họ tên người nhận tại thời điểm bấm đặt hàng. |
| 5 | `recipient_phone_snapshot` | `VARCHAR(20)` | **NOT NULL** | **Snapshot SĐT người nhận:** Số điện thoại liên lạc nhận hàng tại thời điểm đặt. |
| 6 | `delivery_address_snapshot` | `NVARCHAR(500)` | **NOT NULL** | **Snapshot địa chỉ giao hàng:** Toàn bộ chuỗi địa chỉ ghép đầy đủ (Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố) được đóng băng bất biến tại thời điểm đặt đơn. |
| 7 | `subtotal` | `DECIMAL(18,2)` | **NOT NULL** | Tổng tiền hàng tạm tính (Tổng các dòng `order_items.line_total`), chưa trừ voucher và chưa cộng phí ship. |
| 8 | `discount_amount` | `DECIMAL(18,2)` | **NOT NULL, DEFAULT 0** | Số tiền được giảm giá nhờ áp dụng mã voucher thành công. |
| 9 | `shipping_fee` | `DECIMAL(18,2)` | **NOT NULL, DEFAULT 0** | Cước phí vận chuyển bưu tá tận nơi (Mặc định 30.000₫, miễn phí 0₫ nếu đơn hàng từ 500.000₫ trở lên). |
| 10 | `total_amount` | `DECIMAL(18,2)` | **NOT NULL** | **Tổng số tiền thanh toán thực tế cuối cùng** mà shipper sẽ thu của khách khi giao hàng. Công thức kiểm toán tài chính: `total_amount = subtotal - discount_amount + shipping_fee`. |
| 11 | `voucher_id` | `INT` | `NULL, FK` | Khóa ngoại tham chiếu `vouchers.id` (nếu khách có dùng mã). Có thể `NULL` nếu đơn mua giá gốc. |
| 12 | `voucher_code_snapshot` | `VARCHAR(50)` | `NULL` | **Snapshot mã voucher:** Lưu lại ký tự mã giảm giá (ví dụ `"VAMOS100"`) phòng trường hợp sau này mã voucher gốc bị Admin xóa khỏi hệ thống. |
| 13 | `payment_method` | `VARCHAR(20)` | **NOT NULL, DEFAULT 'COD'** | Phương thức thanh toán: Nhận giá trị `'COD'` (Thanh toán tiền mặt khi nhận hàng) hoặc `'BANKING'` (Chuyển khoản). |
| 14 | `payment_status` | `VARCHAR(20)` | **NOT NULL, DEFAULT 'UNPAID'** | Trạng thái thanh toán: `'UNPAID'` (Chưa thanh toán) hoặc `'PAID'` (Đã thu tiền). Đối với đơn COD, trạng thái này bắt buộc phải là `'UNPAID'` trong suốt quá trình vận chuyển và chỉ được nhảy sang `'PAID'` khi đơn hàng đã chuyển sang trạng thái `'COMPLETED'` thành công. |
| 15 | `order_status` | `VARCHAR(30)` | **NOT NULL, DEFAULT 'PENDING'** | Trạng thái tiến trình đơn hàng (FSM): `'PENDING'` (Chờ xác nhận), `'CONFIRMED'` (Đã duyệt), `'PROCESSING'` (Đang đóng gói), `'SHIPPING'` (Đang giao hàng), `'COMPLETED'` (Giao thành công), `'CANCELLED'` (Đã hủy). |
| 16 | `customer_note` | `NVARCHAR(500)` | `NULL` | Lời nhắn dặn dò của khách hàng cho bưu tá (ví dụ: *"Giao vào giờ hành chính, gọi trước 15 phút"*). |
| 17 | `admin_note` | `NVARCHAR(500)` | `NULL` | Ghi chú nội bộ giữa các nhân viên quản trị cửa hàng. |
| 18 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm khách hàng chốt đặt đơn thành công. |
| 19 | `updated_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm cập nhật trạng thái đơn gần nhất. |

---

## 2.17. Bảng `order_items` (Chi tiết dòng sản phẩm trong đơn hàng)

### 2.17.1. Mục đích của bảng
Bảng `order_items` lưu trữ từng dòng mặt hàng cụ thể nằm bên trong một đơn hàng. Nếu khách hàng mua một lúc 2 đôi giày khác nhau trong 1 lượt thanh toán thì đơn hàng `orders` đó sẽ có 2 bản ghi con trong `order_items`.

### 2.17.2. Vai trò trong hệ thống
* Là căn cứ pháp lý và hóa đơn kế toán chi tiết: Xác định rõ đơn hàng gồm những đôi giày nào, size bao nhiêu, màu gì, số lượng mấy đôi và giá bán lúc mua là bao nhiêu.
* **Nguyên tắc đóng băng giá cứng (Immutable Price Snapshot):** Cột `unit_price` lưu lại giá thực tế tại đúng thời khắc bấm nút Đặt hàng. Dù ngày mai Admin có tăng giá sản phẩm lên 2.000.000₫ hay hạ xuống 100.000₫ thì giá trong `order_items` của đơn hàng cũ vẫn giữ nguyên vẹn 100%.

### 2.17.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng của dòng chi tiết đơn hàng. |
| 2 | `order_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu đến đơn hàng cha `orders.id`. Có `ON DELETE CASCADE`. |
| 3 | `product_variant_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu đến biến thể SKU `product_variants.id`. Dùng để biết cần hoàn kho cho biến thể nào nếu sau đó đơn hàng bị hủy. |
| 4 | `product_name_snapshot` | `NVARCHAR(200)` | **NOT NULL** | **Snapshot tên sản phẩm:** Lưu lại nguyên văn tên giày lúc mua phòng trường hợp sau này sản phẩm gốc bị đổi tên. |
| 5 | `sku_snapshot` | `VARCHAR(100)` | **NOT NULL** | **Snapshot mã SKU:** Mã kho hàng của biến thể tại thời điểm mua. |
| 6 | `size_snapshot` | `VARCHAR(20)` | **NOT NULL** | **Snapshot kích cỡ:** Kích cỡ giày lúc mua (ví dụ: `"40"`). |
| 7 | `color_snapshot` | `NVARCHAR(50)` | **NOT NULL** | **Snapshot màu sắc:** Màu sắc giày lúc mua (ví dụ: *"Đen Carbon"*). |
| 8 | `unit_price` | `DECIMAL(18,2)` | **NOT NULL** | **Đơn giá đóng băng:** Giá bán thực tế của 1 đôi giày tại thời điểm chốt đơn (đã lấy theo `sale_price` nếu đang sale). |
| 9 | `quantity` | `INT` | **NOT NULL** | Số lượng đôi giày khách đặt mua cho dòng này. Ràng buộc `CHECK (quantity > 0)`. |
| 10 | `line_total` | `DECIMAL(18,2)` | **NOT NULL** | **Thành tiền của dòng:** Công thức kiểm toán kế toán: `line_total = unit_price * quantity`. |

### 2.17.4. Ràng buộc quan trọng
```sql
CONSTRAINT UQ_order_item_variant UNIQUE (order_id, product_variant_id)
```
*Ý nghĩa thực tế:* Trong cùng một đơn hàng, một biến thể giày cụ thể chỉ xuất hiện trên một dòng duy nhất để hóa đơn in ra được rõ ràng và chuẩn mực kế toán.

---

## 2.18. Bảng `order_status_histories` (Lịch sử tiến trình trạng thái đơn hàng)

### 2.18.1. Mục đích của bảng
Bảng `order_status_histories` lưu lại toàn bộ tiến trình lịch sử biến động trạng thái của một đơn hàng kể từ lúc mới tạo cho đến khi hoàn thành hoặc bị hủy.

### 2.18.2. Vai trò trong hệ thống
* Cung cấp dữ liệu để hiển thị thanh tiến trình vận chuyển (Timeline Tracking 5 bước) trên giao diện theo dõi đơn hàng của khách hàng.
* Ghi nhận bằng chứng kiểm toán vận hành: Ai là người chuyển trạng thái (Khách hàng tự hủy hay nhân viên Admin nào duyệt), chuyển từ trạng thái nào sang trạng thái nào và lúc mấy giờ.

### 2.18.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng của bản ghi lịch sử trạng thái. |
| 2 | `order_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu `orders.id`. Có `ON DELETE CASCADE`. |
| 3 | `changed_by` | `INT` | `NULL, FK` | Khóa ngoại tham chiếu `users.id`, ghi nhận ID của người thực hiện chuyển trạng thái. Có thể `NULL` nếu là hệ thống tự động chuyển. |
| 4 | `previous_status` | `VARCHAR(30)` | `NULL` | Trạng thái trước khi chuyển (ví dụ: `'PENDING'`). Có thể `NULL` ở dòng đầu tiên lúc vừa tạo đơn. |
| 5 | `new_status` | `VARCHAR(30)` | **NOT NULL** | Trạng thái mới sau khi chuyển (ví dụ: `'CONFIRMED'`). |
| 6 | `note` | `NVARCHAR(500)` | `NULL` | Ghi chú lý do chuyển trạng thái (ví dụ: *"Khách gọi điện xác nhận đổi địa chỉ"*, *"Hủy do khách đổi ý không lấy"*). |
| 7 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm chính xác thực hiện việc chuyển trạng thái. |

---

## 2.19. Bảng `voucher_usages` (Nhật ký áp dụng voucher - Ràng buộc 1 lần/khách)

### 2.19.1. Mục đích của bảng
Bảng `voucher_usages` được bổ sung trong Migration `003_voucher_customer_usage.sql` để hiện thực hóa quy tắc nghiệp vụ quan trọng **Decision Q8**: Mỗi khách hàng chỉ được phép sử dụng một mã voucher cụ thể tối đa **1 lần duy nhất** trong lịch sử mua hàng.

### 2.19.2. Vai trò trong hệ thống
* Ngăn chặn hành vi gian lận (Abuse): Không cho phép một tài khoản lợi dụng các mã giảm giá lớn (như mã `VAMOS100` giảm 100K) để đặt đơn liên tục nhiều lần.
* Tự động phục hồi quyền dùng voucher khi hủy đơn: Nếu đơn hàng áp voucher bị hủy lúc đang `PENDING`, bản ghi trong bảng này sẽ được xóa đi để khách hàng có thể dùng lại mã đó cho đơn hàng sau.

### 2.19.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng của lượt sử dụng voucher. |
| 2 | `voucher_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu `vouchers.id`. |
| 3 | `user_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu `users.id`. |
| 4 | `order_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu `orders.id`. Có `ON DELETE CASCADE`. |
| 5 | `used_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm khách hàng dùng voucher để chốt đơn. |

### 2.19.4. Ràng buộc duy nhất quyết định (Decision Q8)
```sql
CONSTRAINT UQ_voucher_user_usage UNIQUE (voucher_id, user_id)
```
*Ý nghĩa thực tế:* Cặp khóa `(voucher_id, user_id)` là DUY NHẤT. Nếu khách hàng cố tình mở 2 tab trình duyệt cùng lúc để đặt 2 đơn hàng với cùng 1 voucher, chỉ có 1 request đi vào trước ghi nhận thành công, request thứ hai sẽ bị CSDL ném lỗi vi phạm Unique Constraint ngay lập tức, triệt tiêu hoàn toàn lỗi Race Condition (tranh chấp đồng thời).

---

## 2.20. Bảng `wishlist_items` (Danh sách sản phẩm yêu thích)

### 2.20.1. Mục đích của bảng
Bảng `wishlist_items` được tạo trong Migration `004_create_wishlist_items.sql` để phục vụ chức năng Lưu sản phẩm yêu thích (Wishlist) của những khách hàng đã đăng nhập.

### 2.20.2. Vai trò trong hệ thống
* Cho phép người dùng đánh dấu các mẫu giày yêu thích (nhấn vào biểu tượng trái tim) để theo dõi giá và mua sau.
* Hiển thị danh sách sản phẩm đã lưu trên trang cá nhân `/account/wishlist`.
* Ràng buộc Unique `(user_id, product_id)` ngăn chặn việc cùng 1 sản phẩm bị thêm nhiều lần vào danh sách yêu thích của cùng 1 người.

### 2.20.3. Phân tích chi tiết từng thuộc tính trong DDL

| STT | Tên thuộc tính | Kiểu dữ liệu (MSSQL) | Khóa & Ràng buộc | Ý nghĩa và mục đích sử dụng |
|:---:|---|---|---|---|
| 1 | `id` | `INT IDENTITY(1,1)` | **PRIMARY KEY** | Khóa chính tự tăng của mục yêu thích. |
| 2 | `user_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu `users.id`. Có `ON DELETE CASCADE`. |
| 3 | `product_id` | `INT` | **NOT NULL, FK** | Khóa ngoại tham chiếu `products.id`. Có `ON DELETE CASCADE`. |
| 4 | `created_at` | `DATETIME2` | **NOT NULL, DEFAULT GETDATE()** | Thời điểm người dùng nhấn thả tim yêu thích sản phẩm. |

### 2.20.4. Ràng buộc toàn vẹn
```sql
CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id)
```
*Ý nghĩa thực tế:* Bảo đảm một người dùng chỉ có tối đa 1 dòng yêu thích cho 1 sản phẩm, không bị trùng lặp dữ liệu.

---

# CHƯƠNG 3. PHÂN TÍCH CÁC MỐI QUAN HỆ GIỮA CÁC BẢNG (RELATIONSHIP MATRIX)

Trong chương này, chúng ta sẽ phân tích ý nghĩa nghiệp vụ thực tế của **8 nhóm quan hệ cốt lõi** trong cơ sở dữ liệu VAMOS STORE. Không chỉ đơn thuần là các đường kẻ nối giữa các bảng trên sơ đồ ERD, mỗi quan hệ đều phản ánh một quy tắc vận hành cụ thể của thế giới thực.

---

## 3.1. Nhóm quan hệ Tài khoản và Sổ địa chỉ
* **Mối quan hệ:** `users (1) ──< addresses (N)`
  * **Cặp khóa:** `addresses.user_id` tham chiếu đến `users.id`.
  * **Bản chất nghiệp vụ:** Quan hệ 1 - Nhiều (One-to-Many). Một khách hàng (`users`) có thể lưu nhiều địa chỉ nhận hàng (`addresses`) trong sổ địa chỉ cá nhân của mình (ví dụ: Nhà riêng, Công ty, Địa chỉ bố mẹ). Ngược lại, mỗi địa chỉ cụ thể chỉ thuộc quyền sở hữu của một tài khoản duy nhất.
  * **Ràng buộc đặc thù:** Thông qua chỉ mục lọc duy nhất `uq_user_default_address`, hệ thống cho phép 1 user có nhiều địa chỉ nhưng **tối đa chỉ có 1 địa chỉ được đánh dấu mặc định (`is_default = 1`)**.
  * **Hành vi xóa:** `ON DELETE CASCADE` — Nếu xóa tài khoản người dùng, toàn bộ địa chỉ của họ bị xóa theo để bảo vệ tính toàn vẹn dữ liệu.

* **Mối quan hệ:** `users (1) ──< password_reset_tokens (N)`
  * **Cặp khóa:** `password_reset_tokens.user_id` tham chiếu đến `users.id`.
  * **Bản chất nghiệp vụ:** Một người dùng có thể gửi yêu cầu quên mật khẩu nhiều lần theo thời gian, mỗi lần hệ thống sinh ra một mã token mới. Khi mật khẩu được đặt lại hoặc token hết hạn, bản ghi được cập nhật hoặc xóa bỏ.

---

## 3.2. Nhóm quan hệ Phân loại danh mục và Thương hiệu
* **Mối quan hệ:** `categories (1) ──< products (N)`
  * **Cặp khóa:** `products.category_id` tham chiếu đến `categories.id`.
  * **Bản chất nghiệp vụ:** Quan hệ 1 - Nhiều. Một danh mục sản phẩm (ví dụ *"Sneaker Nam"*) có thể chứa hàng chục hoặc hàng trăm mẫu giày khác nhau. Mỗi sản phẩm bắt buộc phải thuộc về đúng 1 danh mục chính để hệ thống có thể xây dựng đường dẫn breadcrumb và thanh menu chính xác.

* **Mối quan hệ:** `brands (1) ──< products (N)`
  * **Cặp khóa:** `products.brand_id` tham chiếu đến `brands.id`.
  * **Bản chất nghiệp vụ:** Quan hệ 1 - Nhiều. Một thương hiệu (ví dụ *"Biti's Hunter"*) có thể sản xuất nhiều model giày khác nhau. Mỗi model giày gắn liền với đúng 1 hãng sản xuất.

* **Mối quan hệ:** `products (1) ──< product_images (N)`
  * **Cặp khóa:** `product_images.product_id` tham chiếu đến `products.id`.
  * **Bản chất nghiệp vụ:** Quan hệ 1 - Nhiều. Một sản phẩm giày cần nhiều góc chụp hình ảnh khác nhau để khách hàng quan sát kỹ lưỡng trước khi quyết định mua. Chỉ mục lọc `uq_product_primary_image` đảm bảo trong N tấm ảnh đó chỉ có duy nhất 1 tấm ảnh đại diện chính (`is_primary = 1`).

---

## 3.3. Nhóm quan hệ Ma trận biến thể Giày dép (Cốt lõi ngành thời trang)
* **Mối quan hệ:** 
  - `products (1) ──< product_variants (N)`
  - `sizes (1) ──< product_variants (N)`
  - `colors (1) ──< product_variants (N)`
* **Cặp khóa:**
  - `product_variants.product_id` tham chiếu đến `products.id`.
  - `product_variants.size_id` tham chiếu đến `sizes.id`.
  - `product_variants.color_id` tham chiếu đến `colors.id`.
* **Bản chất nghiệp vụ:** Đây là mô hình phân rã quan hệ Nhiều - Nhiều (Many-to-Many) giữa 3 thực thể: Sản phẩm, Kích cỡ và Màu sắc. 
* **Tại sao không lưu size và màu trực tiếp vào bảng `products`?**
  Nếu lưu size và màu thành các cột trong bảng `products` (ví dụ tạo các cột `size_39_qty`, `size_40_qty`), CSDL sẽ vi phạm nghiêm trọng **Dạng chuẩn 1 (1NF)** và Dạng chuẩn 2 (2NF). Khi cửa hàng nhập thêm size mới (ví dụ Size 45) hoặc màu mới, ta lại phải chạy lệnh ALTER TABLE sửa cấu trúc CSDL — điều tối kỵ trong kỹ thuật phần mềm. 
  Bằng cách tạo bảng `product_variants`, hệ thống có thể sinh ra vô số biến thể SKU một cách tự nhiên và linh hoạt. Mỗi dòng biến thể tự quản lý số lượng tồn kho `stock_quantity` của riêng mình. Ràng buộc `UNIQUE (product_id, size_id, color_id)` bảo đảm không bao giờ bị trùng lặp tổ hợp biến thể.

---

## 3.4. Nhóm quan hệ Giỏ hàng và Dòng sản phẩm chọn mua
* **Mối quan hệ:** `users (1) ── (1) carts`
  * **Cặp khóa:** `carts.user_id` tham chiếu đến `users.id` với ràng buộc `UNIQUE`.
  * **Bản chất nghiệp vụ:** Quan hệ 1 - 1 (One-to-One). Mỗi người dùng có đúng 1 giỏ hàng duy nhất trên máy chủ.
* **Mối quan hệ:** `carts (1) ──< cart_items (N)`
  * **Cặp khóa:** `cart_items.cart_id` tham chiếu đến `carts.id`.
  * **Bản chất nghiệp vụ:** Quan hệ 1 - Nhiều. Một giỏ hàng chứa nhiều dòng món hàng được chọn.
* **Mối quan hệ:** `product_variants (1) ──< cart_items (N)`
  * **Cặp khóa:** `cart_items.variant_id` tham chiếu đến `product_variants.id`.
  * **Bản chất nghiệp vụ:** Quan hệ 1 - Nhiều. Mỗi dòng món hàng trong giỏ hàng bắt buộc phải trỏ đến một **biến thể cụ thể (`product_variants`)** chứ không được trỏ chung chung đến `products`. Điều này giúp hệ thống biết chính xác khách định mua size mấy, màu gì để kiểm tra xem trong kho có còn hàng hay không.
  * Ràng buộc `UNIQUE (cart_id, variant_id)` đảm bảo nếu khách chọn cùng size và màu đó thì hệ thống chỉ tăng số lượng chứ không tạo dòng mới.

---

## 3.5. Nhóm quan hệ Đơn hàng, Chi tiết đơn hàng và Nhật ký trạng thái
* **Mối quan hệ:** `users (1) ──< orders (N)`
  * **Cặp khóa:** `orders.user_id` tham chiếu đến `users.id`.
  * **Bản chất nghiệp vụ:** Quan hệ 1 - Nhiều. Một khách hàng có thể đặt nhiều đơn hàng trong lịch sử mua sắm.
* **Mối quan hệ:** `orders (1) ──< order_items (N)`
  * **Cặp khóa:** `order_items.order_id` tham chiếu đến `orders.id`.
  * **Bản chất nghiệp vụ:** Quan hệ 1 - Nhiều. Một đơn hàng có thể gồm nhiều đôi giày khác nhau. Toàn bộ thông tin giá tiền, tên giày, size và màu đều được đóng băng snapshot tại các cột của `order_items`.
* **Mối quan hệ:** `product_variants (1) ──< order_items (N)`
  * **Cặp khóa:** `order_items.product_variant_id` tham chiếu đến `product_variants.id`.
  * **Bản chất nghiệp vụ:** Dùng để liên kết ngược về biến thể trong kho hàng. Nếu đơn hàng bị hủy khi đang ở trạng thái `PENDING`, hệ thống sẽ dựa vào khóa ngoại này để cộng trả lại số lượng tồn kho cho đúng biến thể đó.
* **Mối quan hệ:** `orders (1) ──< order_status_histories (N)`
  * **Cặp khóa:** `order_status_histories.order_id` tham chiếu đến `orders.id`.
  * **Bản chất nghiệp vụ:** Quan hệ 1 - Nhiều. Mỗi lần đơn hàng đổi trạng thái (`PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPING` -> `COMPLETED`), một bản ghi nhật ký mới sẽ được chèn vào bảng này để lưu vết.

---

## 3.6. Nhóm quan hệ Quản trị tồn kho và Thẻ kho kiểm toán
* **Mối quan hệ:** `product_variants (1) ──< inventory_transactions (N)`
  * **Cặp khóa:** `inventory_transactions.variant_id` tham chiếu đến `product_variants.id`.
  * **Bản chất nghiệp vụ:** Quan hệ 1 - Nhiều. Một biến thể SKU trong suốt vòng đời của nó sẽ trải qua nhiều lần biến động tồn kho (Nhập hàng, Khách mua chốt đơn, Khách hủy hoàn kho, Kiểm kê điều chỉnh). Mỗi lần biến động đều được lưu thành một bản ghi thẻ kho bất biến.

---

## 3.7. Nhóm quan hệ Khuyến mãi và Giới hạn sử dụng voucher
* **Mối quan hệ:** `vouchers (1) ──< orders (N)`
  * **Cặp khóa:** `orders.voucher_id` tham chiếu đến `vouchers.id`.
  * **Bản chất nghiệp vụ:** Quan hệ 1 - Nhiều. Một mã voucher có thể được áp dụng cho nhiều đơn hàng khác nhau của nhiều khách hàng khác nhau cho đến khi hết hạn mức `usage_limit`.
* **Mối quan hệ:** `vouchers (1) ──< voucher_usages (N)` và `users (1) ──< voucher_usages (N)`
  * **Cặp khóa:** `voucher_usages.voucher_id` tham chiếu `vouchers.id`, `voucher_usages.user_id` tham chiếu `users.id`.
  * **Bản chất nghiệp vụ:** Bảng `voucher_usages` đóng vai trò là bảng trung gian liên kết Nhiều - Nhiều giữa Người dùng và Voucher. Nhờ ràng buộc `UNIQUE (voucher_id, user_id)`, nó ngăn chặn triệt để một khách hàng sử dụng cùng 1 mã voucher từ 2 lần trở lên.

---

## 3.8. Nhóm quan hệ Yêu thích và Quảng bá tiếp thị
* **Mối quan hệ:** `users (1) ──< wishlist_items (N)` và `products (1) ──< wishlist_items (N)`
  * **Cặp khóa:** `wishlist_items.user_id` tham chiếu `users.id`, `wishlist_items.product_id` tham chiếu `products.id`.
  * **Bản chất nghiệp vụ:** Bảng `wishlist_items` phân rã quan hệ Nhiều - Nhiều giữa Người dùng và Sản phẩm. Một người có thể thích nhiều sản phẩm, một sản phẩm được nhiều người thích. Ràng buộc `UNIQUE (user_id, product_id)` chống thả tim trùng lặp.
* **Bảng độc lập `banners`:**
  * Bảng `banners` là bảng quản trị nội dung trình chiếu độc lập, không có khóa ngoại FK trỏ tới bảng nào khác, cho phép Quản trị viên tự do gắn link dẫn đến bất kỳ chương trình nào trên web.

---

# CHƯƠNG 4. PHÂN TÍCH CÁC RÀNG BUỘC TOÀN VẸN DỮ LIỆU (INTEGRITY CONSTRAINTS)

Để một cơ sở dữ liệu vận hành an toàn và tin cậy trong môi trường doanh nghiệp thực tế, các quy tắc toàn vẹn không được phép phó mặc hoàn toàn cho mã nguồn ứng dụng mà bắt buộc phải được bảo vệ đa tầng ngay tại mức vật lý của CSDL.

---

## 4.1. Khóa chính (Primary Key) & Cơ chế phát sinh tự động `IDENTITY(1,1)`
* Tất cả 20 bảng nghiệp vụ trong VAMOS STORE đều có khóa chính đơn thuộc kiểu số nguyên `INT` với thuộc tính `IDENTITY(1,1)`.
* **Ý nghĩa kỹ thuật:**
  - `IDENTITY(1,1)` quy định bản ghi đầu tiên có ID là 1, và mỗi bản ghi kế tiếp tự động tăng thêm 1 đơn vị do chính SQL Server quản lý độc quyền.
  - Khóa chính số nguyên tự tăng mang lại hiệu năng cao nhất cho SQL Server: kích thước lưu trữ nhỏ (chỉ 4 bytes), tốc độ đánh chỉ mục Clustered Index tối ưu, tìm kiếm nhị phân cực nhanh so với kiểu chuỗi UUID (16 bytes).

---

## 4.2. Khóa ngoại (Foreign Key) & Quy tắc toàn vẹn tham chiếu `ON DELETE`
Khóa ngoại (FK) bảo đảm không bao giờ xuất hiện dữ liệu rác hoặc dữ liệu mồ côi (Orphan Data). Khi bảng cha bị xóa, hành vi của các bảng con được quy định rõ ràng:

1. **`ON DELETE CASCADE` (Xóa lan truyền tự động):**
   - Được áp dụng cho các thực thể phụ thuộc hoàn toàn vào thực thể cha:
     - Xóa `users` -> Tự động xóa `addresses`, `carts`, `wishlist_items`, `password_reset_tokens`.
     - Xóa `products` -> Tự động xóa `product_images`, `product_variants`.
     - Xóa `orders` -> Tự động xóa `order_items`, `order_status_histories`, `voucher_usages`.
   - *Ý nghĩa:* Dọn dẹp sạch sẽ toàn bộ dữ liệu phụ thuộc liên quan, giữ CSDL luôn gọn gàng.
2. **`ON DELETE NO ACTION` (Chặn hành động xóa nếu còn dữ liệu phụ thuộc):**
   - Được áp dụng cho các thực thể độc lập có giá trị lịch sử:
     - Không cho phép xóa `categories` nếu vẫn còn sản phẩm đang thuộc danh mục đó.
     - Không cho phép xóa `sizes` hoặc `colors` nếu đang có biến thể SKU trong kho tham chiếu tới.
     - Không cho phép xóa `product_variants` nếu biến thể đó đã từng nằm trong các đơn hàng `orders` cũ.
   - *Ý nghĩa:* Bảo vệ tính toàn vẹn lịch sử giao dịch và tài chính của cửa hàng.

---

## 4.3. Ràng buộc duy nhất tổ hợp (Composite UNIQUE Constraints)
Ràng buộc UNIQUE trên nhiều cột đồng thời là kỹ thuật bảo vệ nghiệp vụ vô cùng hiệu quả trong VAMOS STORE:

| Bảng | Cột áp dụng UNIQUE tổ hợp | Tên Constraint trong DDL | Ý nghĩa nghiệp vụ thực tế |
|---|---|---|---|
| `product_variants` | `(product_id, size_id, color_id)` | `UQ_variant_product_size_color` | Chống việc tạo trùng một tổ hợp biến thể của cùng 1 mẫu giày. Mỗi phối màu và size chỉ tồn tại đúng 1 SKU duy nhất. |
| `cart_items` | `(cart_id, variant_id)` | `UQ_cart_variant` | Trong 1 giỏ hàng, mỗi biến thể chỉ có đúng 1 dòng. Thêm tiếp thì tăng số lượng chứ không tạo dòng mới. |
| `voucher_usages` | `(voucher_id, user_id)` | `UQ_voucher_user_usage` | **Thực thi Decision Q8:** Mỗi khách hàng chỉ được dùng 1 mã voucher tối đa 1 lần. Chống gian lận mã giảm giá. |
| `wishlist_items` | `(user_id, product_id)` | `uq_wishlist_user_product` | Một người dùng chỉ có tối đa 1 dòng yêu thích cho 1 sản phẩm. |
| `order_items` | `(order_id, product_variant_id)` | `UQ_order_item_variant` | Trong cùng một đơn hàng, mỗi biến thể chỉ xuất hiện trên 1 dòng duy nhất. |

---

## 4.4. Chỉ mục lọc duy nhất (Filtered Unique Indexes - Đặc sản SQL Server)
Trong cơ sở dữ liệu quan hệ truyền thống, nếu một cột có ràng buộc `UNIQUE`, ta chỉ có thể lưu tối đa duy nhất 1 giá trị `1` trong toàn bảng. Tuy nhiên, nghiệp vụ thực tế lại đòi hỏi:
- Khách hàng có thể có nhiều địa chỉ có `is_default = 0`, nhưng **với mỗi user chỉ được có tối đa duy nhất một địa chỉ có `is_default = 1`**.
- Sản phẩm có thể có nhiều ảnh có `is_primary = 0`, nhưng **với mỗi product chỉ được có tối đa duy nhất một ảnh có `is_primary = 1`**.

Để giải quyết bài toán này, VAMOS STORE sử dụng tính năng cao cấp của Microsoft SQL Server: **Filtered Unique Index**:

```sql
-- 1. Đảm bảo mỗi khách hàng chỉ có duy nhất 1 địa chỉ mặc định
CREATE UNIQUE NONCLUSTERED INDEX uq_user_default_address
ON addresses (user_id)
WHERE is_default = 1;

-- 2. Đảm bảo mỗi sản phẩm chỉ có duy nhất 1 ảnh đại diện chính
CREATE UNIQUE NONCLUSTERED INDEX uq_product_primary_image
ON product_images (product_id)
WHERE is_primary = 1;
```

*Cơ chế hoạt động:* SQL Server chỉ đưa những dòng thỏa mãn điều kiện `WHERE is_default = 1` hoặc `WHERE is_primary = 1` vào cây chỉ mục duy nhất B-Tree. Nhờ đó, các dòng phụ (`is_default = 0`) được tạo thoải mái, nhưng nếu có bản ghi thứ 2 của cùng `user_id` mà có `is_default = 1`, CSDL sẽ chặn đứng ngay lập tức!

---

## 4.5. Ràng buộc kiểm tra miền giá trị (CHECK Constraints)
* `CK_variant_stock`: `stock_quantity >= 0` — Chặn đứng nguy cơ âm kho khi bán hàng.
* `CK_cart_quantity`: `quantity > 0 AND quantity <= 10` — Ép buộc số lượng trong giỏ hàng phải từ 1 đến 10 đôi (Q7).
* `CK_order_item_qty`: `quantity > 0` — Đảm bảo chi tiết hóa đơn luôn có số lượng dương.

---

## 4.6. Phân định rõ: Ràng buộc Database vs Quy tắc nghiệp vụ Application
Khi thuyết trình trước Hội đồng, sinh viên cần phân định mạch lạc 2 tầng kiểm soát dữ liệu:

1. **Ràng buộc Database (Vật lý):** Là những gì nằm trực tiếp trong file DDL SQL Server (PK, FK, UNIQUE, CHECK, NOT NULL, Filtered Index). Tầng này là chốt chặn cuối cùng. Dù lập trình viên có viết code lỗi hay có kẻ cố tình tấn công trực tiếp vào CSDL thì dữ liệu vẫn không thể bị sai hỏng.
2. **Quy tắc Application (Logic nghiệp vụ trong Express.js):** Là các bước kiểm tra nghiệp vụ động trước khi tạo câu lệnh SQL (ví dụ: kiểm tra xem voucher có còn trong thời hạn `start_date` đến `end_date` hay không, kiểm tra giỏ hàng có đủ giá trị tối thiểu `min_order_value` hay không, kiểm tra máy trạng thái đơn hàng FSM có được phép chuyển từ `PENDING` sang `CANCELLED` hay không).

---

# CHƯƠNG 5. KỊCH BẢN NGHIỆP VỤ XUYÊN SUỐT: QUY TRÌNH MUA HÀNG COD TRÊN CSDL

Để giúp sinh viên hình dung cách thức 20 bảng cơ sở dữ liệu phối hợp nhịp nhàng với nhau trong thực tế, chúng ta sẽ lần theo toàn bộ hành trình của một giao dịch tiêu biểu: **"Khách hàng Nguyễn Văn An vào website VAMOS STORE chọn mua 1 đôi giày Hunter X size 40 màu Đen bằng hình thức thanh toán khi nhận hàng (COD) có áp dụng mã giảm giá VAMOS50K"**.

Quá trình này trải qua đúng **11 bước thao tác trên CSDL**:

---

### Bước 1: Khách hàng đăng nhập hệ thống
* **Bảng tham gia:** `users`, `carts`
* **Thao tác dữ liệu:**
  - Hệ thống chạy truy vấn: `SELECT id, password_hash, role, status FROM users WHERE email = @email;`
  - So sánh mật khẩu bằng `bcrypt.compare()`.
  - Kiểm tra `status = 'ACTIVE'`.
  - Lấy giỏ hàng cá nhân từ bảng `carts`: `SELECT id FROM carts WHERE user_id = @userId;`
  - Nếu trước đó khách có giỏ hàng vãng lai (Guest Session), hệ thống sẽ tiến hành hợp nhất (Merge) các món hàng từ session vào bảng `cart_items`.

---

### Bước 2: Khách hàng xem danh mục và chi tiết sản phẩm
* **Bảng tham gia:** `categories`, `brands`, `products`, `product_images`
* **Thao tác dữ liệu:**
  - Hệ thống thực hiện câu lệnh JOIN để lấy thông tin sản phẩm và ảnh chính:
    ```sql
    SELECT p.id, p.name, p.slug, p.base_price, p.sale_price, b.name AS brand_name, pi.image_url
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
    WHERE p.slug = 'vamos-hunter-x' AND p.status = 'ACTIVE';
    ```

---

### Bước 3: Khách hàng chọn biến thể Size EU và Màu sắc
* **Bảng tham gia:** `sizes`, `colors`, `product_variants`
* **Thao tác dữ liệu:**
  - Hệ thống đọc danh sách kích cỡ và màu sắc có sẵn của đôi Hunter X:
    ```sql
    SELECT pv.id AS variant_id, pv.sku, pv.stock_quantity, s.size_name, c.color_name, c.hex_code
    FROM product_variants pv
    JOIN sizes s ON pv.size_id = s.id
    JOIN colors c ON pv.color_id = c.id
    WHERE pv.product_id = @productId AND pv.status = 'ACTIVE';
    ```
  - Khi khách chọn **Size 40** và **Màu Đen**, hệ thống xác định được đúng `variant_id = 15` (Mã SKU: `"VMS-HX-BLK-40"`), kiểm tra thấy `stock_quantity = 8 > 0` (còn hàng).

---

### Bước 4: Thêm sản phẩm vào giỏ hàng
* **Bảng tham gia:** `cart_items`
* **Thao tác dữ liệu:**
  - Kiểm tra xem biến thể `variant_id = 15` đã có trong giỏ hàng `cart_id = 3` chưa.
  - Nếu chưa có: Thực hiện chèn mới:
    ```sql
    INSERT INTO cart_items (cart_id, variant_id, quantity)
    VALUES (3, 15, 1);
    ```
  - Ràng buộc `CHECK (quantity <= 10)` và `UNIQUE (cart_id, variant_id)` bảo đảm tính an toàn dữ liệu.

---

### Bước 5: Khách hàng vào trang Thanh toán (Checkout)
* **Bảng tham gia:** `addresses`
* **Thao tác dữ liệu:**
  - Hệ thống đọc địa chỉ mặc định của khách hàng để điền sẵn vào form:
    ```sql
    SELECT id, recipient_name, phone, province, district, ward, detail_address
    FROM addresses
    WHERE user_id = @userId AND is_default = 1;
    ```

---

### Bước 6: Khách hàng áp dụng mã giảm giá VAMOS50K
* **Bảng tham gia:** `vouchers`, `voucher_usages`
* **Thao tác dữ liệu:**
  - Đọc thông tin voucher:
    ```sql
    SELECT id, discount_type, discount_value, min_order_value, usage_limit, used_count
    FROM vouchers
    WHERE code = 'VAMOS50K' AND is_active = 1 AND GETDATE() BETWEEN start_date AND end_date;
    ```
  - **Kiểm tra Decision Q8:** Kiểm tra xem khách hàng này đã từng dùng mã `VAMOS50K` trước đây chưa:
    ```sql
    SELECT 1 FROM voucher_usages WHERE voucher_id = @voucherId AND user_id = @userId;
    ```
  - Nếu chưa có bản ghi nào tồn tại, mã giảm giá được chấp thuận; hệ thống tính mức giảm 50.000₫.

---

### Bước 7: Bấm nút "Đặt hàng" — Khởi tạo Transaction an toàn (ACID)
* **Bảng tham gia:** Toàn bộ hệ thống giao dịch
* **Thao tác dữ liệu:**
  - Controller gọi `orderService.createOrder()`.
  - Hệ thống mở một giao dịch MSSQL Transaction nguyên tử:
    ```sql
    BEGIN TRANSACTION;
    ```

---

### Bước 8: Kiểm tra tồn kho khóa bi quan và Trừ kho
* **Bảng tham gia:** `product_variants`, `inventory_transactions`
* **Thao tác dữ liệu:**
  - Đọc và khóa dòng biến thể để tránh xung đột đồng thời:
    ```sql
    SELECT stock_quantity FROM product_variants WITH (UPDLOCK, ROWLOCK) WHERE id = 15;
    ```
  - Trừ 1 đôi giày trong kho:
    ```sql
    UPDATE product_variants
    SET stock_quantity = stock_quantity - 1, updated_at = GETDATE()
    WHERE id = 15;
    ```
  - Ghi bản ghi thẻ kho kiểm toán:
    ```sql
    INSERT INTO inventory_transactions (variant_id, user_id, old_quantity, new_quantity, change_quantity, reason)
    VALUES (15, @userId, 8, 7, -1, 'OUT_SALE: Đơn hàng mới');
    ```

---

### Bước 9: Tạo bản ghi Đơn hàng tổng thể (Master Order)
* **Bảng tham gia:** `orders`
* **Thao tác dữ liệu:**
  - Lưu đơn hàng với toàn bộ thông tin đóng băng Snapshot:
    ```sql
    INSERT INTO orders (
        order_code, user_id, recipient_name_snapshot, recipient_phone_snapshot,
        delivery_address_snapshot, subtotal, discount_amount, shipping_fee,
        total_amount, voucher_id, voucher_code_snapshot, payment_method, payment_status, order_status
    ) VALUES (
        'VAM261118-7578', @userId, N'Nguyễn Văn An', '0901234567',
        N'Số 10 Phạm Văn Bạch, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
        1099000.00, 50000.00, 0.00, 1049000.00,
        @voucherId, 'VAMOS50K', 'COD', 'UNPAID', 'PENDING'
    );
    -- Lấy ID đơn hàng vừa tạo: SCOPE_IDENTITY() => @orderId = 101
    ```

---

### Bước 10: Lưu chi tiết đơn hàng đóng băng giá và Ghi nhận dùng Voucher
* **Bảng tham gia:** `order_items`, `voucher_usages`, `vouchers`
* **Thao tác dữ liệu:**
  - Chèn dòng chi tiết đơn hàng:
    ```sql
    INSERT INTO order_items (
        order_id, product_variant_id, product_name_snapshot, sku_snapshot,
        size_snapshot, color_snapshot, unit_price, quantity, line_total
    ) VALUES (
        101, 15, N'Giày Sneaker Vamos Hunter X', 'VMS-HX-BLK-40',
        '40', N'Đen Carbon', 1099000.00, 1, 1099000.00
    );
    ```
  - Ghi nhận lượt sử dụng voucher (khóa vĩnh viễn quyền dùng lại của khách này):
    ```sql
    INSERT INTO voucher_usages (voucher_id, user_id, order_id)
    VALUES (@voucherId, @userId, 101);
    
    UPDATE vouchers SET used_count = used_count + 1 WHERE id = @voucherId;
    ```
  - Khởi tạo dòng lịch sử đầu tiên của đơn hàng:
    ```sql
    INSERT INTO order_status_histories (order_id, changed_by, previous_status, new_status, note)
    VALUES (101, @userId, NULL, 'PENDING', N'Khách hàng đặt hàng COD thành công');
    ```

---

### Bước 11: Làm rỗng giỏ hàng và Chốt giao dịch (COMMIT)
* **Bảng tham gia:** `cart_items`
* **Thao tác dữ liệu:**
  - Xóa sạch món hàng vừa mua khỏi giỏ hàng:
    ```sql
    DELETE FROM cart_items WHERE cart_id = 3 AND variant_id = 15;
    ```
  - Xác nhận lưu vĩnh viễn toàn bộ thay đổi vào đĩa cứng:
    ```sql
    COMMIT TRANSACTION;
    ```
  - Trình duyệt chuyển hướng khách hàng sang trang `/checkout/success` kèm mã đơn `"VAM261118-7578"`. Giao dịch hoàn tất an toàn 100%!

---

# CHƯƠNG 6. HƯỚNG DẪN ĐỌC VÀ HIỂU SƠ ĐỒ ERD CHO NGƯỜI MỚI HỌC

Để sinh viên có thể tự tin cầm sơ đồ ERD chỉ tay vào từng phần và giải thích lưu loát trước Giảng viên, phần này tổng hợp toàn bộ các khái niệm cơ bản nhất của mô hình hóa thực thể quan hệ:

---

## 6.1. Thực thể (Entity) là gì?
* **Khái niệm:** Thực thể là một đối tượng, một sự vật hoặc một khái niệm trong thế giới thực mà hệ thống phần mềm cần quản lý thông tin về nó.
* **Biểu diễn trên CSDL:** Mỗi thực thể tương ứng với **một Bảng (Table)**.
* **Ví dụ VAMOS STORE:** Người dùng (`users`), Đôi giày (`products`), Đơn hàng (`orders`), Phiếu giảm giá (`vouchers`).

---

## 6.2. Thuộc tính (Attribute) là gì?
* **Khái niệm:** Thuộc tính là các đặc điểm, tính chất mô tả chi tiết cho thực thể đó.
* **Biểu diễn trên CSDL:** Mỗi thuộc tính tương ứng với **một Cột (Column)** trong bảng.
* **Ví dụ VAMOS STORE:** Đôi giày có thuộc tính Tên (`name`), Giá tiền (`base_price`), Màu sắc (`color_name`), Kích cỡ (`size_name`).

---

## 6.3. Khóa chính (Primary Key - PK) là gì?
* **Khái niệm:** Là một hoặc một tập hợp thuộc tính dùng để **phân biệt duy nhất** một bản ghi này với tất cả các bản ghi khác trong cùng một bảng.
* **Quy tắc vàng:** Khóa chính không bao giờ được phép mang giá trị `NULL` và không bao giờ được phép trùng lặp.
* **Ví dụ VAMOS STORE:** Cột `id` trong bảng `users`. Trong hệ thống có thể có 10 người cùng tên là "Nguyễn Văn An", nhưng người thứ nhất có `id = 1`, người thứ hai có `id = 2` — nhờ đó hệ thống không bao giờ bị nhầm lẫn tài khoản.

---

## 6.4. Khóa ngoại (Foreign Key - FK) là gì?
* **Khái niệm:** Là một thuộc tính trong bảng con dùng để **tham chiếu (trỏ) tới Khóa chính của bảng cha**, nhằm thiết lập mối liên kết dữ liệu giữa 2 bảng.
* **Ví dụ VAMOS STORE:** Trong bảng `orders` có cột `user_id`. Cột `user_id` này chính là Khóa ngoại trỏ về `users.id` để biết đơn hàng này do ai đặt.

---

## 6.5. Các loại quan hệ (Cardinality) & Cách đọc ký pháp Chân Quạ (Crow's Foot)
Trên sơ đồ ERD chuẩn Crow's Foot:
* **Quan hệ 1 - 1 (Một - Một):**
  - Ký hiệu: Hai vạch thẳng song song `||`.
  - Ý nghĩa: 1 bản ghi bảng A chỉ liên kết với tối đa 1 bản ghi bảng B.
  - Ví dụ: `users (1) ── (1) carts` — 1 khách hàng chỉ có 1 giỏ hàng duy nhất.
* **Quan hệ 1 - N (Một - Nhiều):**
  - Ký hiệu: Một đầu là vạch thẳng `|`, đầu kia xòe ra hình chân quạ `>|` hoặc `>o`.
  - Ý nghĩa: 1 bản ghi bảng A có thể liên kết với nhiều bản ghi bảng B.
  - Ví dụ: `categories (1) ──< products (N)` — 1 danh mục có nhiều sản phẩm.
* **Quan hệ N - N (Nhiều - Nhiều):**
  - Ý nghĩa: 1 bản ghi bảng A liên kết với nhiều bản ghi bảng B, và ngược lại.
  - **Quy tắc bắt buộc trong RDBMS:** Không bao giờ được nối trực tiếp quan hệ N-N giữa 2 bảng vì sẽ làm vỡ cấu trúc CSDL. Ta bắt buộc phải tạo ra một **Bảng trung gian (Junction Table)** ở giữa và chuyển thành hai mối quan hệ 1-N.
  - Ví dụ: `products` và `sizes` có quan hệ Nhiều - Nhiều -> Được giải quyết bằng bảng trung gian `product_variants`.

---

## 6.6. Cách xác định Bảng Cha (Parent) và Bảng Con (Child)
* **Quy tắc:** Bảng nào nắm giữ Khóa chính được trỏ tới là **Bảng Cha**; bảng nào chứa Khóa ngoại là **Bảng Con**.
* **Nguyên tắc nhập xuất dữ liệu:**
  - Khi thêm mới: Bắt buộc phải tạo bản ghi ở Bảng Cha trước, rồi mới được tạo bản ghi ở Bảng Con (không thể tạo đơn hàng `orders` cho một `user_id` chưa từng tồn tại).
  - Khi xóa: Nếu không có cascade, bắt buộc phải xóa bản ghi ở Bảng Con trước rồi mới được xóa Bảng Cha.

---

# CHƯƠNG 7. BỘ CÂU HỎI PHẢN BIỆN CỦA GIẢNG VIÊN VÀ HƯỚNG DẪN TRẢ LỜI ĐẠT ĐIỂM TỐI ĐA

Dưới đây là **18 câu hỏi điển hình** mà Hội đồng Giảng viên FPT Polytechnic thường đặt ra nhất khi bảo vệ đồ án về phần Cơ sở dữ liệu và ERD, kèm theo gợi ý câu trả lời ngắn gọn, chuẩn xác và đi thẳng vào bản chất:

---

### Câu 1: Tại sao hệ thống phải tách bảng `products` và `product_variants` mà không lưu thẳng size và số lượng vào bảng `products`?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, trong ngành bán lẻ giày dép, một mẫu giày luôn có ma trận biến thể đa chiều gồm nhiều Kích cỡ và Màu sắc. Nếu lưu trực tiếp size và số lượng vào bảng `products`, CSDL sẽ vi phạm Dạng chuẩn 1 (1NF) vì thuộc tính lặp và Dạng chuẩn 2 (2NF). Khi cửa hàng nhập thêm size mới (ví dụ Size 45), hệ thống sẽ phải chạy lệnh sửa cấu trúc bảng rất nguy hiểm.  
  Bằng cách tách riêng bảng `product_variants`, mỗi dòng biến thể là một mã SKU độc lập tự quản lý tồn kho của riêng mình, vừa đúng chuẩn hóa CSDL, vừa giúp việc trừ kho khi khách mua đúng size diễn ra chính xác tuyệt đối ạ."

---

### Câu 2: Tại sao phải tách bảng `orders` và `order_items`?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, một đơn hàng của khách hàng có thể mua cùng lúc nhiều đôi giày khác nhau. Để biểu diễn mối quan hệ 1 - Nhiều này theo Dạng chuẩn 1NF, ta bắt buộc phải tách thành:  
  - Bảng `orders`: Lưu thông tin chung của đơn hàng (Mã đơn, người nhận, địa chỉ, tổng tiền, trạng thái).  
  - Bảng `order_items`: Lưu chi tiết từng món hàng trong đơn đó (Sản phẩm nào, size gì, màu gì, số lượng mấy đôi, giá lúc mua)."

---

### Câu 3: Tại sao trong bảng `order_items` lại có các cột `unit_price`, `product_name_snapshot`, `size_snapshot` mà không JOIN sang bảng `products` để lấy cho gọn?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, đây là nguyên tắc **Đóng băng dữ liệu lịch sử bất biến (Price & Data Snapshotting)** bắt buộc trong thương mại điện tử:  
  - Nếu ta không lưu giá lúc mua mà chỉ JOIN sang bảng `products`, thì khi cửa hàng tăng giá đôi giày từ 500K lên 800K, toàn bộ các đơn hàng khách đã mua từ năm ngoái sẽ tự động bị nhảy lên 800K làm sai lệch hoàn toàn doanh thu và sổ sách kế toán.  
  - Tương tự, nếu sản phẩm gốc sau này bị đổi tên hoặc bị xóa, các cột Snapshot trong `order_items` bảo đảm hóa đơn của khách hàng vẫn hiển thị vẹn nguyên giá trị lịch sử ạ."

---

### Câu 4: Cột `delivery_address_snapshot` trong bảng `orders` dùng để làm gì? Tại sao không dùng khóa ngoại trỏ sang bảng `addresses`?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, cột `delivery_address_snapshot` lưu trữ toàn bộ chuỗi địa chỉ giao hàng tại thời điểm bấm đặt hàng.  
  Hệ thống không dùng FK trỏ sang bảng `addresses` vì khách hàng có quyền vào sổ địa chỉ để chỉnh sửa hoặc xóa địa chỉ cũ bất cứ lúc nào. Nếu dùng FK, việc khách sửa địa chỉ giao về nhà mới sẽ làm sai lệch địa chỉ bưu tá cần phát của các đơn hàng đang giao trên đường; hoặc nếu khách xóa địa chỉ thì CSDL sẽ bị lỗi vi phạm ràng buộc toàn vẹn ạ."

---

### Câu 5: Bảng `inventory_transactions` dùng để làm gì trong hệ thống?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, bảng `inventory_transactions` đóng vai trò là Sổ nhật ký thẻ kho điện tử bất biến (Audit Trail).  
  Trong quản lý kho, CSDL tuyệt đối không được âm thầm sửa số lượng tồn kho mà không có lý do. Bảng này ghi nhận mọi biến động xuất nhập tồn: Bán hàng trừ kho (`OUT_SALE`), Hủy đơn hoàn kho (`IN_CANCEL`), Nhập hàng mới (`IN_IMPORT`) hoặc Kiểm kê định kỳ (`ADJUST`), lưu rõ số lượng trước, số lượng sau và tài khoản nào thực hiện để phục vụ đối soát kế toán ạ."

---

### Câu 6: Filtered Unique Index trong dự án hoạt động như thế nào? Em dùng nó ở đâu?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, Filtered Unique Index là chỉ mục duy nhất có điều kiện lọc của Microsoft SQL Server. Trong dự án VAMOS STORE, em áp dụng ở 2 vị trí quan trọng:  
  1. Bảng `addresses`: `CREATE UNIQUE INDEX uq_user_default_address ON addresses (user_id) WHERE is_default = 1;` — Đảm bảo mỗi khách hàng có thể có nhiều địa chỉ phụ, nhưng **duy nhất chỉ có 1 địa chỉ mặc định**.  
  2. Bảng `product_images`: `CREATE UNIQUE INDEX uq_product_primary_image ON product_images (product_id) WHERE is_primary = 1;` — Đảm bảo mỗi sản phẩm chỉ có **duy nhất 1 ảnh đại diện chính**."

---

### Câu 7: Bảng `voucher_usages` có vai trò gì và ràng buộc Unique ở đó giải quyết bài toán gì?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, bảng `voucher_usages` dùng để kiểm soát quy định **Decision Q8**: Mỗi khách hàng chỉ được dùng 1 mã voucher tối đa 1 lần duy nhất.  
  Ràng buộc `UNIQUE (voucher_id, user_id)` bảo đảm nếu khách hàng mở 2 trình duyệt cùng lúc để đặt 2 đơn hàng với cùng 1 mã voucher, CSDL SQL Server sẽ chặn đứng ngay lập tức ở tầng vật lý, chống được lỗi gian lận và lỗi tranh chấp đồng thời (Race Condition) ạ."

---

### Câu 8: Tại sao cột `cart_items.variant_id` lại trỏ tới `product_variants.id` mà không trỏ tới `products.id`?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, vì khách hàng không thể mua một 'sản phẩm chung chung' mà bắt buộc phải mua một đôi giày có Size cụ thể và Màu sắc cụ thể. Do đó, dòng giỏ hàng bắt buộc phải trỏ đến `product_variants.id` để hệ thống kiểm tra chính xác số lượng tồn kho của biến thể đó xem có đủ hàng để bán hay không ạ."

---

### Câu 9: Bảng `order_status_histories` giải quyết bài toán gì?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, bảng này lưu lịch sử tiến trình đơn hàng theo thời gian: Ai chuyển trạng thái, từ trạng thái nào sang trạng thái nào, lý do gì và lúc mấy giờ. Dữ liệu này được dùng để hiển thị thanh Timeline 5 bước theo dõi đơn hàng cho khách hàng và phục vụ kiểm toán nội bộ ạ."

---

### Câu 10: Ràng buộc `CHECK (stock_quantity >= 0)` trong bảng `product_variants` có ý nghĩa gì?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, ràng buộc này đảm bảo số lượng tồn kho trong CSDL không bao giờ bị âm. Khi có nhiều người cùng mua 1 đôi giày cuối cùng, nếu hệ thống có câu lệnh UPDATE trừ kho vượt quá số lượng hiện có, CSDL sẽ ném lỗi CHECK constraint và Rollback giao dịch ngay lập tức, ngăn chặn triệt để hiện tượng bán vượt tồn (Overselling) ạ."

---

### Câu 11: Ràng buộc `CHECK (quantity > 0 AND quantity <= 10)` trong bảng `cart_items` dùng để làm gì?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, đây là ràng buộc hiện thực hóa quy định bán lẻ tiêu dùng của VAMOS STORE (Decision Q7): Mỗi khách chỉ được mua tối đa 10 đôi / sản phẩm để đảm bảo sự công bằng, ngăn chặn đầu cơ chợ đen. Ràng buộc CHECK ở mức CSDL giúp chặn đứng các hành vi hack API gửi số lượng âm hoặc số lượng lớn ạ."

---

### Câu 12: Sự khác nhau giữa `ON DELETE CASCADE` và `ON DELETE NO ACTION` trong dự án của em là gì?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô:  
  - `ON DELETE CASCADE`: Khi xóa bản ghi cha thì toàn bộ bản ghi con bị xóa theo (em dùng cho các bảng phụ thuộc như `users` -> `addresses`, `products` -> `product_images`).  
  - `ON DELETE NO ACTION`: Chặn không cho phép xóa bản ghi cha nếu đang có bản ghi con tham chiếu tới (em dùng cho `categories` -> `products`, `sizes` -> `product_variants` và `orders` -> `order_items` để bảo vệ toàn vẹn lịch sử kinh doanh) ạ."

---

### Câu 13: CSDL của em đã đạt Chuẩn hóa Dạng chuẩn 3 (3NF) chưa? Em chứng minh điều đó như thế nào?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, CSDL của VAMOS STORE đã đạt trọn vẹn Chuẩn hóa Dạng chuẩn 3 (3NF):  
  1. **1NF:** Tất cả các thuộc tính đều là giá trị nguyên tử (Atomic), không có mảng hay danh sách lặp (Size và Màu được tách riêng thành các dòng biến thể).  
  2. **2NF:** Đã đạt 1NF và toàn bộ các thuộc tính không khóa đều phụ thuộc hàm toàn phần vào Khóa chính đơn `id`, không có phụ thuộc một phần.  
  3. **3NF:** Đã đạt 2NF và không có phụ thuộc bắc cầu giữa các thuộc tính không khóa. Các thông tin Danh mục, Thương hiệu, Màu sắc, Kích cỡ đều được tách thành các bảng riêng có khóa chính độc lập ạ."

---

### Câu 14: Tại sao mật khẩu trong bảng `users` lại lưu kiểu `VARCHAR(255)` mà không lưu `NVARCHAR`? Mật khẩu được mã hóa như thế nào?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, chuỗi băm Bcrypt luôn chỉ chứa các ký tự ASCII tiêu chuẩn (độ dài 60 ký tự bắt đầu bằng `$2a$` hoặc `$2b$`), không bao giờ chứa ký tự Unicode tiếng Việt có dấu, do đó dùng `VARCHAR(255)` giúp tiết kiệm 50% dung lượng lưu trữ so với `NVARCHAR`. Hệ thống sử dụng thư viện Bcrypt với 10 vòng salt để băm một chiều, hoàn toàn không thể giải mã ngược lại được ạ."

---

### Câu 15: Token khôi phục mật khẩu trong `password_reset_tokens` được bảo vệ chống tấn công phát lại (Replay Attack) như thế nào?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, bảng có 2 cơ chế bảo vệ:  
  1. Cột `expires_at`: Giới hạn token chỉ tồn tại tối đa 60 phút.  
  2. Cột `used_at`: Ban đầu là `NULL`. Khi người dùng đặt lại mật khẩu thành công, hệ thống cập nhật `used_at = GETDATE()`. Nếu kẻ gian lấy lại link cũ để bấm lần 2, hệ thống kiểm tra thấy `used_at IS NOT NULL` sẽ lập tức từ chối ạ."

---

### Câu 16: Khi thanh toán đơn hàng bằng COD, trạng thái thanh toán `payment_status` được cập nhật như thế nào?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, đối với đơn COD (giao hàng thu tiền), khi đơn mới tạo ở trạng thái `PENDING`, `payment_status` bắt buộc phải là `'UNPAID'` (Chưa thanh toán). Trong suốt quá trình duyệt, đóng gói và vận chuyển, trạng thái vẫn là `'UNPAID'`. Chỉ khi shipper giao hàng thành công và Admin chuyển trạng thái đơn sang `'COMPLETED'`, hệ thống mới tự động chuyển `payment_status` sang `'PAID'` (Đã thu tiền) ạ."

---

### Câu 17: Bảng `wishlist_items` khác bảng `cart_items` ở điểm nào?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô:  
  - `wishlist_items`: Lưu sản phẩm ở mức sản phẩm cha (`products.id`) mà khách hàng quan tâm yêu thích, không cần chọn size hay số lượng.  
  - `cart_items`: Lưu cụ thể đến từng biến thể SKU (`product_variants.id`) có kèm size, màu và số lượng mà khách hàng đã sẵn sàng bỏ tiền ra mua ạ."

---

### Câu 18: Bảng `banners` có liên kết khóa ngoại với bảng nào không? Tại sao?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, bảng `banners` là bảng quản trị giao diện tiếp thị độc lập, không có khóa ngoại FK trỏ tới bảng nào. Thiết kế này giúp người quản trị có toàn quyền linh hoạt: có thể đặt link dẫn đến một danh mục, dẫn đến một sản phẩm cụ thể, dẫn đến trang khuyến mãi hoặc thậm chí là một trang bài viết giới thiệu chiến dịch mới mà không bị ràng buộc cứng bởi cấu trúc dữ liệu ạ."

---

## TỔNG KẾT VÀ BẢN ĐỒ TRA CỨU NHANH
Tài liệu này bao quát đầy đủ 100% 20 bảng nghiệp vụ, 153 thuộc tính và toàn bộ các mối quan hệ của cơ sở dữ liệu VAMOS STORE. Sinh viên hãy đọc kỹ các chương, đặc biệt là Chương 5 (Kịch bản mua hàng xuyên suốt) và Chương 7 (Bộ câu hỏi phản biện) trước ngày bảo vệ đồ án để đạt kết quả cao nhất!
