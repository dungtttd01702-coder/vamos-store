# TỔNG QUAN CƠ SỞ DỮ LIỆU (DATABASE OVERVIEW)

## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ BÁN GIÀY VAMOS STORE

> **Hệ quản trị CSDL:** Microsoft SQL Server 2019 / 2022 (T-SQL)  
> **Tên cơ sở dữ liệu:** `vamos_store_db`  
> **Bảng mã ký tự (Collation):** `SQL_Latin1_General_CP1_CI_AS` (Hỗ trợ lưu trữ tiếng Việt Unicode qua kiểu `NVARCHAR`)  
> **Phiên bản tài liệu:** v2.2 (Kiểm toán thực tế & Đồng bộ hóa toàn diện hệ thống toàn vẹn dữ liệu)  
> **Cập nhật ngày:** 14/11/2026

---

## 1. Giới thiệu Kiến trúc Dữ liệu

Cơ sở dữ liệu **VAMOS STORE** được thiết kế chuyên biệt để đáp ứng toàn diện các yêu cầu nghiệp vụ của một nền tảng bán lẻ giày dép hiện đại:

- **Mô hình biến thể sản phẩm đa chiều:** Tách bạch giữa sản phẩm cha (`products`) và các biến thể SKU chi tiết (`product_variants`) theo tổ hợp Kích cỡ (`sizes`) và Màu sắc (`colors`).
- **Cơ chế tồn kho nguyên tử (Atomic Inventory):** Quản lý số lượng tồn kho khả dụng theo từng biến thể SKU, hỗ trợ khóa bi quan (`UPDLOCK, ROWLOCK`) chống bán vượt tồn kho (Overselling) và lưu vết kiểm toán biến động kho qua bảng `inventory_transactions`.
- **Lưu trữ dữ liệu lịch sử giao dịch (Historical Snapshotting):** Bảo vệ tính toàn vẹn dữ liệu kế toán và hóa đơn khi sản phẩm, giá bán hoặc địa chỉ giao hàng bị thay đổi trong tương lai thông qua việc lưu snapshot cứng vào `orders` và `order_items`.
- **Quản lý khuyến mãi chặt chẽ:** Kiểm soát lượt sử dụng voucher toàn hệ thống (`vouchers`) và cưỡng chế quy tắc 1 voucher / 1 khách hàng thông qua bảng `voucher_usages`.
- **Danh sách yêu thích máy chủ (Server-side Wishlist):** Lưu trữ bền vững sở thích mua sắm của khách hàng thành viên trên bảng `wishlist_items`.

---

## 2. Thống kê Số lượng Bảng và Phân loại

Qua kiểm toán trực tiếp từ bảng hệ thống `sys.tables` trong CSDL `vamos_store_db` và đối soát với hệ thống migrations (`database/migrations/`), cơ sở dữ liệu bao gồm chính xác:

- **Tổng số bảng:** **21 bảng**
  - **Bảng nghiệp vụ và dữ liệu ứng dụng:** **20 bảng**
  - **Bảng hệ thống quản lý di chuyển dữ liệu:** **01 bảng** (`schema_migrations`)

### Phân nhóm Nghiệp vụ (5 Phân nhóm Dữ liệu)

```
                            CƠ SỞ DỮ LIỆU VAMOS STORE (21 BẢNG)
                                              │
         ┌───────────────────┬────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                ▼                   ▼                   ▼
    [ PHÂN NHÓM 1 ]     [ PHÂN NHÓM 2 ]  [ PHÂN NHÓM 3 ]     [ PHÂN NHÓM 4 ]     [ PHÂN NHÓM 5 ]
     Người dùng &        Sản phẩm &        Tồn kho &           Khách hàng &        Đơn hàng, Khuyến mãi
      Phân quyền          Biến thể         Kiểm kê kho          Giỏ hàng & Wishlist  & Vận hành Cửa hàng
     (3 bảng)            (7 bảng)         (1 bảng)            (3 bảng)            (6 bảng + 1 HT)
```

---

## 3. Thống kê Toàn diện Hệ thống Ràng buộc và Chỉ mục (Constraints & Indexes)

Qua đối soát siêu dữ liệu thực tế từ SQL Server (`sys.indexes`, `sys.foreign_keys`, `sys.check_constraints`, `sys.default_constraints`):
- **Khóa chính (Primary Key):** **21 khóa chính** (100% là `id INT IDENTITY(1,1)` với chỉ mục `CLUSTERED` tổ chức theo cấu trúc Cây B-Tree).
- **Khóa ngoại (Foreign Key):** **24 khóa ngoại vật lý** (11 `CASCADE`, 2 `SET NULL`, 11 `NO ACTION`). Toàn bộ 24 FK đều có hành vi `ON UPDATE NO ACTION`.
- **Ràng buộc Duy nhất (Unique Constraints):** **18 ràng buộc** (13 ràng buộc trên cột đơn và 05 ràng buộc trên tổ hợp nhiều cột).
- **Chỉ mục Duy nhất có Điều kiện lọc (Filtered Unique Indexes):** **02 chỉ mục** (`uq_user_default_address` với `WHERE ([is_default]=(1))` và `uq_product_primary_image` với `WHERE ([is_primary]=(1))`).
- **Ràng buộc Kiểm tra (Check Constraints):** **26 ràng buộc** cưỡng chế miền giá trị tài chính, tồn kho, chu kỳ ngày tháng và các tập enum hợp lệ.
- **Ràng buộc Mặc định (Default Constraints):** **47 ràng buộc** tự động hóa việc gán giá trị thời gian và trạng thái mặc định.

---

## 4. Danh mục Kiểm kê Chi tiết 21 Bảng Dữ liệu

| STT | Tên bảng (Table Name)        | Tên nghiệp vụ tiếng Việt     | Phân nhóm dữ liệu       | Migration khởi tạo           | Chức năng & Vai trò nghiệp vụ                                                                                                                 |
| :-: | :--------------------------- | :--------------------------- | :---------------------- | :--------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
|  1  | **`users`**                  | Tài khoản người dùng         | Người dùng & Phân quyền | `001_initial_schema`         | Lưu trữ thông tin tài khoản thành viên (`CUSTOMER`) và quản trị viên (`ADMIN`), mật khẩu băm bcrypt, trạng thái hoạt động.                    |
|  2  | **`addresses`**              | Sổ địa chỉ giao hàng         | Người dùng & Phân quyền | `001_initial_schema`         | Lưu danh sách các địa chỉ nhận hàng của khách hàng. Cưỡng chế tối đa 1 địa chỉ mặc định qua Filtered Unique Index.                            |
|  3  | **`password_reset_tokens`**  | Token đặt lại mật khẩu       | Người dùng & Phân quyền | `001_initial_schema`         | Lưu mã token bảo mật và thời hạn phục vụ quy trình khôi phục mật khẩu khi người dùng quên mật khẩu (Cấu trúc DB đã sẵn sàng).                 |
|  4  | **`categories`**             | Danh mục sản phẩm            | Sản phẩm & Biến thể     | `001_initial_schema`         | Phân loại sản phẩm (Sneaker Nam, Sneaker Nữ, Giày Thể Thao, Sandal & Dép), slug duy nhất, cờ kích hoạt hiển thị.                              |
|  5  | **`brands`**                 | Thương hiệu / Bộ sưu tập     | Sản phẩm & Biến thể     | `001_initial_schema`         | Quản lý các nhãn hiệu / dòng sản phẩm (VAMOS Originals, VAMOS Sport, VAMOS Active), phục vụ lọc và phân loại sản phẩm.                        |
|  6  | **`sizes`**                  | Bảng kích cỡ giày            | Sản phẩm & Biến thể     | `001_initial_schema`         | Danh mục kích cỡ giày chuẩn hóa (Size 38, 39, 40, 41, 42, 43, 44...), thứ tự hiển thị sắp xếp trực quan.                                      |
|  7  | **`colors`**                 | Bảng màu sắc giày            | Sản phẩm & Biến thể     | `001_initial_schema`         | Danh mục màu sắc giày (Đen, Trắng, Xanh Navy, Xám, Đỏ Đô...), mã màu Hex phục vụ hiển thị trên giao diện storefront.                          |
|  8  | **`products`**               | Sản phẩm chính               | Sản phẩm & Biến thể     | `001_initial_schema`         | Thông tin gốc của sản phẩm: tên, mã SP, slug, mô tả, phân loại giới tính (MEN, WOMEN, KIDS, UNISEX), giá niêm yết, giá khuyến mãi.            |
|  9  | **`product_images`**         | Bộ sưu tập ảnh sản phẩm      | Sản phẩm & Biến thể     | `001_initial_schema`         | Lưu trữ các hình ảnh của sản phẩm. Cưỡng chế duy nhất 1 ảnh đại diện chính (`is_primary = 1`) qua Filtered Unique Index.                      |
| 10  | **`product_variants`**       | Biến thể sản phẩm (SKU)      | Sản phẩm & Biến thể     | `001_initial_schema`         | Tổ hợp Kích cỡ x Màu sắc của sản phẩm, mã SKU duy nhất, số lượng tồn kho thực tế (`stock_quantity`) và trạng thái kinh doanh.                 |
| 11  | **`inventory_transactions`** | Lịch sử biến động kho        | Tồn kho & Kiểm kê       | `001_initial_schema`         | Nhật ký kiểm toán mọi giao dịch xuất nhập kho: xuất kho bán hàng (EXPORT), hoàn kho do hủy đơn (RESTOCK), hoặc điều chỉnh thủ công (ADJUST).  |
| 12  | **`carts`**                  | Giỏ hàng thành viên          | Khách hàng & Giỏ hàng   | `001_initial_schema`         | Giỏ hàng bền vững của tài khoản khách hàng (Quan hệ 1-1 với `users`). Khách vãng lai sử dụng Session tạm, không ghi bảng này.                 |
| 13  | **`cart_items`**             | Chi tiết giỏ hàng            | Khách hàng & Giỏ hàng   | `001_initial_schema`         | Các mặt hàng biến thể được thêm vào giỏ hàng, số lượng mua (giới hạn 1-10 đôi/mẫu). Giỏ hàng không giữ chỗ tồn kho.                           |
| 14  | **`wishlist_items`**         | Danh sách sản phẩm yêu thích | Khách hàng & Yêu thích  | `004_create_wishlist_items`  | Lưu trữ danh sách sản phẩm yêu thích của khách hàng thành viên trên máy chủ SQL Server, ràng buộc Unique ngăn chặn thêm trùng lặp.            |
| 15  | **`vouchers`**               | Mã giảm giá khuyến mãi       | Đơn hàng & Khuyến mãi   | `001_initial_schema`         | Cấu hình voucher: mã code, loại giảm (% hoặc tiền cố định), giá trị giảm, đơn tối thiểu, hạn dùng, giới hạn tổng số lượt dùng.                |
| 16  | **`voucher_usages`**         | Lịch sử sử dụng voucher      | Đơn hàng & Khuyến mãi   | `003_voucher_customer_usage` | Ràng buộc duy nhất `(voucher_id, user_id)` đảm bảo mỗi khách hàng chỉ được áp dụng mỗi mã voucher tối đa 1 lần duy nhất.                      |
| 17  | **`orders`**                 | Đơn hàng bán                 | Đơn hàng & Khuyến mãi   | `001_initial_schema`         | Đơn hàng chính thức: mã đơn duy nhất, snapshot thông tin giao hàng, tổng tiền, tiền ship, phương thức COD, trạng thái thanh toán và đơn hàng. |
| 18  | **`order_items`**            | Chi tiết đơn hàng            | Đơn hàng & Khuyến mãi   | `001_initial_schema`         | Lưu snapshot bất biến của từng mặt hàng tại thời điểm đặt: tên SP, SKU, Size, Màu, đơn giá mua, số lượng, thành tiền dòng.                    |
| 19  | **`order_status_histories`** | Lịch sử trạng thái đơn       | Đơn hàng & Vận hành     | `001_initial_schema`         | Ghi vết kiểm toán toàn bộ tiến trình vòng đời đơn hàng: trạng thái cũ, trạng thái mới, người thao tác (User/Admin), lý do và dấu thời gian.   |
| 20  | **`banners`**                | Banner quảng cáo trang chủ   | Vận hành Cửa hàng       | `001_initial_schema`         | Quản lý các hình ảnh trình chiếu (slider banner) trên trang chủ: tiêu đề, link hình ảnh, link điều hướng và thứ tự hiển thị.                  |
| 21  | **`schema_migrations`**      | Quản lý phiên bản CSDL       | Hệ thống                | `001_initial_schema`         | Ghi nhận các tệp migration đã thực thi thành công, phiên bản và thời gian áp dụng, đảm bảo tính lũy thừa khi bootstrap CSDL.                  |

---

## 5. Quá trình Tiến hóa và Di chuyển CSDL (Database Migrations)

Cơ sở dữ liệu VAMOS STORE được quản lý thông qua cơ chế Versioned SQL Migrations lũy thừa (Idempotent Migrations) trong thư mục `database/migrations/`:

| Thứ tự  | Tệp Migration                    | Mục tiêu & Nội dung thay đổi                                                                                               | Bảng / Đối tượng tác động                                                                      |
| :-----: | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **001** | `001_initial_schema.sql`         | Khởi tạo cấu trúc nền tảng gồm bảng hệ thống `schema_migrations` và 18 bảng nghiệp vụ đầu tiên của hệ thống.               | Tạo 18 bảng nghiệp vụ + `schema_migrations`                                                    |
| **002** | `002_add_filtered_indexes.sql`   | Bổ sung các chỉ mục có điều kiện lọc (Filtered Unique Indexes) để bảo vệ toàn vẹn dữ liệu nâng cao ở tầng CSDL.            | `uq_user_default_address` trên `addresses`<br>`uq_product_primary_image` trên `product_images` |
| **003** | `003_voucher_customer_usage.sql` | Triển khai bảng theo dõi sử dụng voucher để áp dụng quy tắc kinh doanh: Mỗi khách hàng chỉ được dùng 1 voucher đúng 1 lần. | Tạo bảng `voucher_usages` (Bảng thứ 19)<br>Chỉ mục `IX_voucher_usages_user_id`                 |
| **004** | `004_create_wishlist_items.sql`  | Triển khai bảng danh sách yêu thích lưu máy chủ (Server-side Wishlist) cho khách hàng thành viên.                          | Tạo bảng `wishlist_items` (Bảng thứ 20)<br>Chỉ mục `ix_wishlist_items_user_id`, `product_id`   |

### Cơ chế Bootstrap CSDL An toàn (`database/init_mssql.js`)

- Tệp `init_mssql.js` đọc thư mục `database/migrations/`, sắp xếp theo thứ tự số hiệu (`001`, `002`, `003`, `004`), đối chiếu với bảng `schema_migrations`.
- Chỉ thực thi các tệp chưa từng áp dụng, chia các khối lệnh theo từ khóa `GO` của T-SQL.
- Có lớp bảo vệ chống chạy nhầm trên môi trường Production (`ALLOW_PRODUCTION_INIT`).
- Nạp dữ liệu mồi mặc định (Seed data) có kiểm tra tồn tại (`IF NOT EXISTS`) cho `sizes`, `colors`, `categories`, `brands`, `banners` và tài khoản Admin ban đầu.

---

## 6. Báo cáo Đối soát giữa `mssql_schema.sql` và Migrations Thực tế

Qua quá trình rà soát mã nguồn, nhóm kiểm toán ghi nhận điểm lệch sau:

- **Tệp `database/mssql_schema.sql`:** Là tệp schema nguyên khối được lập ở giai đoạn đầu, hiện chứa **20 bảng** (19 bảng nghiệp vụ + `schema_migrations`), **chưa bao gồm bảng `wishlist_items`**.
- **Hệ thống Migrations (`database/migrations/`):** Đã bổ sung migration `004_create_wishlist_items.sql` tạo bảng `wishlist_items`.
- **Cơ sở dữ liệu thực tế (`vamos_store_db`):** Đã chạy đầy đủ 4 migrations, sở hữu chính xác **21 bảng** (20 bảng nghiệp vụ + 1 bảng hệ thống).

> **Kết luận kiểm toán:** Nguồn chân lý duy nhất (Single Source of Truth) của cấu trúc CSDL VAMOS STORE là hệ thống các tệp di chuyển trong `database/migrations/` và cấu trúc đang chạy thực tế trong CSDL SQL Server `vamos_store_db`. Tệp `mssql_schema.sql` được ghi nhận là bản schema tham khảo cũ cần được cập nhật bổ sung `wishlist_items` trong các đợt bảo trì sau.
