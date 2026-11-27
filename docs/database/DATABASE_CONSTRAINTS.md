# HỆ THỐNG RÀNG BUỘC VÀ CHỈ MỤC CƠ SỞ DỮ LIỆU (DATABASE CONSTRAINTS & INDEXES)

## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ BÁN GIÀY VAMOS STORE

> **Hệ quản trị CSDL:** Microsoft SQL Server (T-SQL)  
> **Cơ sở dữ liệu:** `vamos_store_db`  
> **Phiên bản tài liệu:** v2.2 (Hiệu chỉnh học thuật & Chuẩn hóa chính xác theo siêu dữ liệu SQL Server)  
> **Cập nhật ngày:** 14/11/2026

---

## 1. Tổng quan Kiến trúc Toàn vẹn Dữ liệu

Cơ sở dữ liệu **VAMOS STORE** áp dụng nguyên lý **Phòng thủ Đa tầng (Defense in Depth)** nhằm bảo vệ dữ liệu ở cả hai cấp độ: **Cấp độ CSDL vật lý (Database Declarative Constraints)** và **Cấp độ Logic Ứng dụng (Application Transactional Invariants)**.

Hệ thống toàn vẹn được tổ chức thành 5 trụ cột chuẩn tắc:

1. **Toàn vẹn Thực thể (Entity Integrity):** Định danh duy nhất từng bản ghi qua khóa chính `PRIMARY KEY` dạng số nguyên tự tăng `INT IDENTITY(1,1)` cho tất cả 21 bảng (20 bảng nghiệp vụ + 1 bảng hệ thống). Tất cả 21 PK đều được tổ chức vật lý dưới dạng **Clustered Index (Cấu trúc Cây B-Tree)**.
2. **Toàn vẹn Tham chiếu (Referential Integrity):** **24 khóa ngoại vật lý (Physical Foreign Keys)** liên kết chặt chẽ các thực thể với các chính sách toàn vẹn nghiêm ngặt (`CASCADE`: 11, `SET NULL`: 2, `NO ACTION`: 11). Toàn bộ 24 FK đều có hành vi `ON UPDATE NO ACTION`.
3. **Toàn vẹn Miền giá trị (Domain Integrity):** **26 ràng buộc `CHECK`** cưỡng chế giá tiền không âm, số lượng tồn kho hợp lệ, chu kỳ ngày tháng và các tập giá trị enum nghiệp vụ.
4. **Toàn vẹn Duy nhất (Unique Integrity & Filtered Indexes):**
   - **18 Ràng buộc Duy nhất (Unique Constraints):** Gồm **13 ràng buộc trên cột đơn** và **05 ràng buộc trên tổ hợp nhiều cột**, ngăn chặn trùng lặp dữ liệu danh mục, tài khoản và biến thể sản phẩm.
   - **02 Chỉ mục Duy nhất có Điều kiện lọc (Filtered Unique Indexes):** Giải pháp chỉ mục nâng cao của SQL Server xử lý tối ưu bài toán "Mỗi khách hàng có tối đa 1 địa chỉ mặc định" và "Mỗi sản phẩm có tối đa 1 ảnh đại diện chính".
5. **Ràng buộc Giá trị Mặc định (Default Constraints):** **47 ràng buộc `DEFAULT`** tự động thiết lập dấu thời gian `GETDATE()`, các cờ trạng thái `is_active = 1`, `is_default = 0` và giá trị số tiền `0`.
6. **Ràng buộc Nghiệp vụ Cấp độ Ứng dụng (Application-level Invariants):** Cơ chế khóa bi quan (`UPDLOCK, ROWLOCK`), máy trạng thái đơn hàng (Order State Machine) và các mối quan hệ logic không tạo FK vật lý (như quan hệ đa hình `inventory_transactions.reference_id`).

---

## 2. Toàn vẹn Thực thể (Entity Integrity — 21 Primary Keys)

Toàn bộ 21 bảng trong CSDL `vamos_store_db` đều sở hữu khóa chính vật lý `id INT IDENTITY(1,1)` với thuộc tính tự tăng (Seed: 1, Increment: 1).

Trong Microsoft SQL Server, khi tạo bảng với cú pháp `PRIMARY KEY`, hệ thống tự động tạo một chỉ mục **CLUSTERED INDEX** tương ứng (trừ khi có từ khóa `NONCLUSTERED` tường minh). Qua đối soát siêu dữ liệu thực tế từ `sys.indexes` với điều kiện `is_primary_key = 1`, **100% 21 bảng đều sử dụng chỉ mục CLUSTERED**.

> [!NOTE]
> **Biện luận Kiến trúc về Chỉ mục Cụm (Clustered Index B-Tree Architecture) và Cơ chế Phân mảnh:**  
> 1. **Cấu trúc lưu trữ vật lý:** Bảng có Clustered Index không phải là một Heap Table, cũng không phải là bảng băm (Hash Table), mà dữ liệu các dòng được sắp xếp và lưu trữ trực tiếp tại các trang lá (leaf pages) của cấu trúc cây chỉ mục cân bằng **B-Tree** dựa theo giá trị khóa chính `id`.  
> 2. **Tác động của `INT IDENTITY` lên Page Split và Fragmentation:**
>    - Việc sử dụng khóa chính tự tăng đơn điệu (`INT IDENTITY(1,1)`) giúp các thao tác chèn mới (`INSERT`) hầu như luôn diễn ra tại trang dữ liệu cuối cùng (rightmost leaf page) của cây B-Tree, thay vì chèn ngẫu nhiên vào các trang nằm rải rác ở giữa chỉ mục.
>    - Kỹ thuật này giúp **giảm thiểu đáng kể hiện tượng phân mảnh chỉ mục ngẫu nhiên (random page splits)** và hạn chế phân mảnh logic (logical fragmentation) trong quá trình ghi dữ liệu khối lượng lớn.
>    - **Tuy nhiên, không thể khẳng định loại bỏ hoàn toàn Page Split:** Page split vẫn diễn ra bình thường khi trang lá cuối cùng bị đầy và SQL Server phải phân bổ (allocate) một trang mới (hiện tượng end-of-index split). Ngoài ra, các thao tác `UPDATE` mở rộng độ dài chuỗi ký tự trên các cột `NVARCHAR` có thể làm vượt quá dung lượng còn trống của trang hiện tại, dẫn đến page split trên các trang trung gian.
> 3. **Cân nhắc về Cạnh tranh Ghi trang Cuối (Last-Page Insertion Contention):**
>    - Khi một bảng có tần suất ghi đồng thời cực cao với khóa tự tăng, việc toàn bộ các luồng ghi cùng cạnh tranh trang lá cuối cùng có thể dẫn đến hiện tượng tranh chấp chốt trang (`PAGELATCH_EX` contention).
>    - Đối với tải nghiệp vụ của VAMOS STORE, mô hình `INT IDENTITY` đem lại sự cân bằng tối ưu giữa hiệu năng đọc/ghi, tiết kiệm bộ nhớ đệm (buffer pool cache locality) và tối ưu hóa tối đa các thao tác nối bảng (`JOIN`) theo khóa ngoại.

### Bảng Ma trận 21 Khóa chính Xác minh từ Metadata SQL Server

| STT | Tên bảng (Table Name) | Cột Khóa chính | Kiểu dữ liệu | Identity (Seed, Inc) | Kiểu Index | Tên Index trong SQL Server | Kết luận |
| :-: | :--- | :---: | :---: | :---: | :---: | :--- | :---: |
| 1 | `addresses` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__addresse__3213E83FAC6D3FC2` | ĐẠT |
| 2 | `banners` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__banners__3213E83FA372E37B` | ĐẠT |
| 3 | `brands` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__brands__3213E83F95956B87` | ĐẠT |
| 4 | `cart_items` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__cart_ite__3213E83FF0ABEC3F` | ĐẠT |
| 5 | `carts` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__carts__3213E83FBEEBC15D` | ĐẠT |
| 6 | `categories` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__categori__3213E83F147EE36C` | ĐẠT |
| 7 | `colors` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__colors__3213E83FFC7A18A0` | ĐẠT |
| 8 | `inventory_transactions` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__inventor__3213E83FB660BB74` | ĐẠT |
| 9 | `order_items` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__order_it__3213E83F41DCECBA` | ĐẠT |
| 10 | `order_status_histories` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__order_st__3213E83F16A463F3` | ĐẠT |
| 11 | `orders` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__orders__3213E83FA72089B4` | ĐẠT |
| 12 | `password_reset_tokens` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__password__3213E83FF40122E3` | ĐẠT |
| 13 | `product_images` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__product___3213E83F23409C94` | ĐẠT |
| 14 | `product_variants` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__product___3213E83F745269CC` | ĐẠT |
| 15 | `products` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__products__3213E83FF70C7DCB` | ĐẠT |
| 16 | `schema_migrations` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__schema_m__3213E83F732072DD` | ĐẠT |
| 17 | `sizes` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__sizes__3213E83FDEE648AB` | ĐẠT |
| 18 | `users` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__users__3213E83FC37607E2` | ĐẠT |
| 19 | `voucher_usages` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__voucher___3213E83FA6BBB05E` | ĐẠT |
| 20 | `vouchers` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__vouchers__3213E83F63F62903` | ĐẠT |
| 21 | `wishlist_items` | `id` | `int` | YES (1, 1) | **CLUSTERED** | `PK__wishlist__3213E83F0330F2F5` | ĐẠT |

---

## 3. Toàn vẹn Tham chiếu (Referential Integrity — 24 Foreign Keys)

Đối soát trực tiếp từ bảng hệ thống `sys.foreign_keys` và `sys.foreign_key_columns`, hệ thống có chính xác **24 khóa ngoại vật lý (Physical Foreign Keys)**.

### 3.1. Phân loại Hành vi Tham chiếu
- **`ON DELETE CASCADE` (11 FK):** Áp dụng cho các thực thể phụ thuộc sở hữu mạnh (Strong Ownership / Composition). Khi thực thể cha bị xóa, toàn bộ các bản ghi con phụ thuộc tự động bị xóa đồng thời.
- **`ON DELETE SET NULL` (02 FK):** Áp dụng cho các quan hệ tùy chọn nhằm bảo toàn dữ liệu thực thể chính khi phân loại hoặc khuyến mãi bị xóa (`products.brand_id`, `orders.voucher_id`).
- **`ON DELETE NO ACTION` (11 FK):** Cơ chế cưỡng chế bảo vệ tính toàn vẹn dữ liệu kế toán và lịch sử giao dịch. SQL Server sẽ phát sinh ngoại lệ và chặn đứng thao tác xóa nếu bản ghi cha đang được tham chiếu bởi bản ghi con.
- **`ON UPDATE NO ACTION` (24/24 FK — 100%):** Do toàn bộ khóa chính sử dụng giá trị `INT IDENTITY` bất biến (không bao giờ cập nhật giá trị cột `id`), hành vi `NO ACTION` cho sự kiện UPDATE là lựa chọn chuẩn tắc và an toàn nhất.

### 3.2. Bảng Ma trận 24 Khóa ngoại Vật lý trong SQL Server

| STT | Tên Khóa ngoại (`fk_name`) | Bảng nguồn (`from_table`) | Cột FK (`from_column`) | Bảng đích (`to_table`) | Cột tham chiếu (`to_column`) | Hành vi ON DELETE | Hành vi ON UPDATE | Lý giải Thiết kế Kiến trúc |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `fk_addresses_user` | `addresses` | `user_id` | `users` | `id` | **CASCADE** | NO ACTION | Xóa tài khoản khách hàng $\rightarrow$ tự động xóa sổ địa chỉ giao hàng của người đó. |
| 2 | `fk_pwd_reset_user` | `password_reset_tokens` | `user_id` | `users` | `id` | **CASCADE** | NO ACTION | Token đặt lại mật khẩu gắn liền với vòng đời tài khoản người dùng. |
| 3 | `fk_carts_user` | `carts` | `user_id` | `users` | `id` | **CASCADE** | NO ACTION | Giỏ hàng thuộc quyền sở hữu của user, xóa user thì dọn sạch giỏ hàng. |
| 4 | `fk_wishlist_items_user` | `wishlist_items` | `user_id` | `users` | `id` | **CASCADE** | NO ACTION | Xóa tài khoản người dùng thì tự động giải phóng danh sách yêu thích của họ. |
| 5 | `fk_cart_items_cart` | `cart_items` | `cart_id` | `carts` | `id` | **CASCADE** | NO ACTION | Dọn dẹp giỏ hàng tự động xóa toàn bộ các dòng mặt hàng trong giỏ. |
| 6 | `fk_product_images_product` | `product_images` | `product_id` | `products` | `id` | **CASCADE** | NO ACTION | Xóa sản phẩm cha thì tự động xóa toàn bộ album ảnh liên quan. |
| 7 | `fk_variants_product` | `product_variants` | `product_id` | `products` | `id` | **CASCADE** | NO ACTION | Xóa sản phẩm cha thì tự động xóa toàn bộ các biến thể SKU con. |
| 8 | `fk_wishlist_items_product` | `wishlist_items` | `product_id` | `products` | `id` | **CASCADE** | NO ACTION | Xóa sản phẩm thì tự động gỡ sản phẩm đó khỏi wishlist của tất cả khách hàng. |
| 9 | `fk_order_items_order` | `order_items` | `order_id` | `orders` | `id` | **CASCADE** | NO ACTION | Xóa đơn hàng (nghiệp vụ admin dọn dữ liệu) thì tự động xóa toàn bộ dòng chi tiết. |
| 10 | `fk_order_histories_order` | `order_status_histories` | `order_id` | `orders` | `id` | **CASCADE** | NO ACTION | Xóa đơn hàng thì tự động xóa toàn bộ nhật ký thay đổi trạng thái đơn đó. |
| 11 | `FK_voucher_usages_order` | `voucher_usages` | `order_id` | `orders` | `id` | **CASCADE** | NO ACTION | Khi đơn hàng bị hủy/xóa, bản ghi ghi nhận lượt dùng voucher của đơn tự xóa theo. |
| 12 | `fk_products_brand` | `products` | `brand_id` | `brands` | `id` | **SET NULL** | NO ACTION | Xóa thương hiệu/bộ sưu tập không làm mất sản phẩm; `brand_id` chuyển về `NULL`. |
| 13 | `fk_orders_voucher` | `orders` | `voucher_id` | `vouchers` | `id` | **SET NULL** | NO ACTION | Xóa voucher không làm hỏng đơn hàng; mã voucher đã được lưu snapshot vào `voucher_code_snapshot`. |
| 14 | `fk_products_category` | `products` | `category_id` | `categories` | `id` | **NO ACTION** | NO ACTION | Chặn xóa danh mục nếu đang có sản phẩm thuộc danh mục đó, bảo vệ cấu trúc storefront. |
| 15 | `fk_variants_size` | `product_variants` | `size_id` | `sizes` | `id` | **NO ACTION** | NO ACTION | Chặn xóa kích cỡ nếu đang có biến thể giày sử dụng cỡ đó. |
| 16 | `fk_variants_color` | `product_variants` | `color_id` | `colors` | `id` | **NO ACTION** | NO ACTION | Chặn xóa màu sắc nếu đang có biến thể giày sử dụng màu đó. |
| 17 | `fk_orders_user` | `orders` | `user_id` | `users` | `id` | **NO ACTION** | NO ACTION | **Bảo vệ chứng từ kế toán:** Tuyệt đối cấm xóa khách hàng đã phát sinh đơn hàng. |
| 18 | `fk_cart_items_variant` | `cart_items` | `variant_id` | `product_variants` | `id` | **NO ACTION** | NO ACTION | Chặn xóa biến thể sản phẩm nếu đang có khách hàng lưu trong giỏ hàng. |
| 19 | `fk_order_items_variant` | `order_items` | `product_variant_id` | `product_variants` | `id` | **NO ACTION** | NO ACTION | **Bảo vệ chứng từ bán hàng:** Chặn xóa biến thể SKU nếu đã từng được đặt mua. |
| 20 | `fk_order_histories_user` | `order_status_histories` | `changed_by` | `users` | `id` | **NO ACTION** | NO ACTION | Chặn xóa tài khoản người dùng nếu người đó là người thao tác chuyển trạng thái đơn. |
| 21 | `fk_inv_trans_variant` | `inventory_transactions` | `variant_id` | `product_variants` | `id` | **NO ACTION** | NO ACTION | **Bảo vệ sổ kho:** Tuyệt đối không xóa biến thể đã phát sinh lịch sử xuất nhập kho. |
| 22 | `fk_inv_trans_user` | `inventory_transactions` | `user_id` | `users` | `id` | **NO ACTION** | NO ACTION | Chặn xóa tài khoản của người thực hiện giao dịch điều chỉnh / xuất nhập kho. |
| 23 | `FK_voucher_usages_user` | `voucher_usages` | `user_id` | `users` | `id` | **NO ACTION** | NO ACTION | Bảo vệ lịch sử sử dụng voucher của từng khách hàng. |
| 24 | `FK_voucher_usages_voucher` | `voucher_usages` | `voucher_id` | `vouchers` | `id` | **NO ACTION** | NO ACTION | Bảo vệ lịch sử các lần áp dụng mã voucher. |

### 3.3. Các Mối Quan hệ Logic Cấp Ứng dụng (Không có FK Vật lý)
- **`inventory_transactions.reference_id`:** Lưu ID tham chiếu nghiệp vụ đa hình (khi `transaction_type = 'ORDER_HOLD'` hoặc `'ORDER_CANCEL'`, giá trị này trỏ tới `orders.id`; khi là giao dịch kiểm kê thủ công, giá trị này trỏ tới mã phiếu kiểm kê). Do trỏ tới nhiều thực thể khác nhau nên không tạo FK vật lý mà xử lý qua code logic.
- **Khách hàng vãng lai (Guest Cart):** Giỏ hàng của khách chưa đăng nhập được lưu trữ trong HTTP Session / Cookie Client, chỉ được ánh xạ và hợp nhất vào CSDL vật lý (`carts`, `cart_items`) tại thời điểm đăng nhập.

---

## 4. Toàn vẹn Miền giá trị (Domain Integrity — 26 Check Constraints)

Đối soát trực tiếp từ bảng hệ thống `sys.check_constraints`, toàn bộ cơ sở dữ liệu có chính xác **26 ràng buộc `CHECK`** cưỡng chế dữ liệu hợp lệ:

| STT | Bảng dữ liệu | Tên Ràng buộc (`constraint_name`) | Biểu thức Kiểm tra (`definition`) | Mục đích Nghiệp vụ |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `users` | `CK__users__role__4CA06362` | `([role]='CUSTOMER' OR [role]='ADMIN')` | Chỉ cho phép 2 vai trò chuẩn: Quản trị viên hoặc Khách hàng. |
| 2 | `users` | `CK__users__status__4E88ABD4` | `([status]='locked' OR [status]='active')` | Trạng thái tài khoản hợp lệ. |
| 3 | `products` | `CK__products__base_p__08B54D69` | `([base_price]>=(0))` | Giá gốc niêm yết không được phép âm. |
| 4 | `products` | `chk_products_sale_price` | `([sale_price] IS NULL OR [sale_price]>=(0) AND [sale_price]<[base_price])` | Giá khuyến mãi phải không âm và luôn nhỏ hơn giá gốc. |
| 5 | `products` | `CK__products__gender__07C12930` | `([gender_target]='UNISEX' OR [gender_target]='KIDS' OR [gender_target]='WOMEN' OR [gender_target]='MEN')` | Phân loại nhóm đối tượng mục tiêu chuẩn. |
| 6 | `products` | `CK__products__status__0A9D95DB` | `([status]='draft' OR [status]='inactive' OR [status]='active')` | Vòng đời sản phẩm: Bản nháp, Ngừng bán, hoặc Đang bán. |
| 7 | `product_variants` | `CK__product_v__stock__19DFD96B` | `([stock_quantity]>=(0))` | Số lượng tồn kho SKU không bao giờ được âm. |
| 8 | `product_variants` | `CK__product_v__statu__1BC821DD` | `([status]='inactive' OR [status]='active')` | Trạng thái kinh doanh của biến thể. |
| 9 | `cart_items` | `CK__cart_item__quant__25518C17` | `([quantity]>=(1))` | Số lượng mua trong giỏ hàng tối thiểu là 1 đôi. |
| 10 | `vouchers` | `CK__vouchers__discou__6383C8BA` | `([discount_type]='fixed_amount' OR [discount_type]='percentage')` | Loại giảm giá: Tiền cố định (VNĐ) hoặc Phần trăm (%). |
| 11 | `vouchers` | `CK__vouchers__discou__6477ECF3` | `([discount_value]>(0))` | Mức giảm giá phải lớn hơn 0. |
| 12 | `vouchers` | `CK__vouchers__min_or__66603565` | `([min_order_value]>=(0))` | Giá trị đơn hàng tối thiểu không được âm. |
| 13 | `vouchers` | `chk_vouchers_dates` | `([end_date]>=[start_date])` | Ngày kết thúc voucher phải sau hoặc bằng ngày bắt đầu. |
| 14 | `vouchers` | `CK__vouchers__usage___68487DD7` | `([usage_limit]>=(0))` | Giới hạn số lượt dùng không được âm (0 = không giới hạn). |
| 15 | `vouchers` | `CK__vouchers__used_c__6A30C649` | `([used_count]>=(0))` | Số lượt đã sử dụng không được âm. |
| 16 | `orders` | `CK__orders__subtotal__2CF2ADDF` | `([subtotal]>=(0))` | Tiền hàng trước giảm giá không được âm. |
| 17 | `orders` | `CK__orders__discount__2EDAF651` | `([discount_amount]>=(0))` | Số tiền chiết khấu giảm giá không được âm. |
| 18 | `orders` | `CK__orders__shipping__30C33EC3` | `([shipping_fee]>=(0))` | Cước phí vận chuyển không được âm. |
| 19 | `orders` | `CK__orders__total_am__31B762FC` | `([total_amount]>=(0))` | Tổng tiền đơn hàng phải thanh toán không được âm. |
| 20 | `orders` | `CK__orders__payment___3493CFA7` | `([payment_status]='PAID' OR [payment_status]='UNPAID')` | Trạng thái thanh toán đơn hàng (Chưa trả / Đã trả). |
| 21 | `orders` | `CK__orders__order_st__367C1819` | `([order_status]='CANCELLED' OR [order_status]='COMPLETED' OR [order_status]='SHIPPING' OR [order_status]='PROCESSING' OR [order_status]='CONFIRMED' OR [order_status]='PENDING')` | Máy trạng thái đơn hàng: 6 trạng thái hợp lệ. |
| 22 | `order_items` | `CK__order_ite__quant__3F004F0F` | `([quantity]>=(1))` | Số lượng mua của từng món trong đơn phải $\ge 1$. |
| 23 | `order_items` | `CK__order_ite__unit___3FFE7348` | `([unit_price]>=(0))` | Đơn giá bán tại thời điểm đặt hàng không được âm. |
| 24 | `order_items` | `CK__order_ite__line___40E49781` | `([line_total]>=(0))` | Thành tiền dòng sản phẩm không được âm. |
| 25 | `inventory_transactions` | `CK__inventory__trans__498EEC8D` | `([transaction_type]='ADJUSTMENT_DECREASE' OR [transaction_type]='ADJUSTMENT_INCREASE' OR [transaction_type]='ORDER_CANCEL' OR [transaction_type]='ORDER_HOLD' OR [transaction_type]='SALE_DEDUCTION' OR [transaction_type]='PURCHASE_RECEIPT')` | 6 loại hình giao dịch kho hợp lệ. |
| 26 | `inventory_transactions` | `CK__inventory__chang__4A8310C6` | `([change_quantity]<>(0))` | Lượng biến động kho phải khác 0 (không tạo giao dịch rác). |

---

## 5. Toàn vẹn Duy nhất (Unique Integrity) & Chỉ mục (Indexes)

Hệ thống phân biệt rõ ràng giữa **Ràng buộc Duy nhất (Unique Constraint)** và **Chỉ mục Duy nhất có Điều kiện lọc (Filtered Unique Index)** dựa trên siêu dữ liệu `sys.indexes` (`is_unique_constraint` và `has_filter`):

### 5.1. 18 Ràng buộc Duy nhất (Unique Constraints — `is_unique_constraint = 1`)
Hệ thống có chính xác **18 Unique Constraints**, được phân thành:
- **13 Ràng buộc trên cột đơn (Single-column):**
  1. `brands.slug` (`UQ__brands__...`)
  2. `carts.user_id` (`UQ__carts__...`) — Cưỡng chế quan hệ 1-1 giữa người dùng và giỏ hàng.
  3. `categories.slug` (`UQ__categori__...`)
  4. `colors.color_name` (`UQ__colors__...`)
  5. `orders.order_code` (`UQ__orders__...`)
  6. `password_reset_tokens.token` (`UQ__password__...`)
  7. `product_variants.sku` (`UQ__product___...`)
  8. `products.slug` (`UQ__products__...`)
  9. `products.product_code` (`UQ__products__...`)
  10. `schema_migrations.version` (`UQ__schema_m__...`)
  11. `sizes.size_name` (`UQ__sizes__...`)
  12. `users.email` (`UQ__users__...`)
  13. `vouchers.code` (`UQ__vouchers__...`)
- **05 Ràng buộc trên tổ hợp nhiều cột (Multi-column / Composite):**
  1. `cart_items (cart_id, variant_id)` (`uq_cart_variant`) — Ngăn chặn thêm trùng lặp cùng một SKU vào giỏ.
  2. `order_items (order_id, product_variant_id)` (`uq_order_items_variant`) — Đảm bảo mỗi biến thể chỉ xuất hiện 1 dòng trong cùng đơn hàng.
  3. `product_variants (product_id, size_id, color_id)` (`uq_variants_combination`) — Ngăn chặn tạo trùng biến thể cùng cỡ và màu cho một đôi giày.
  4. `voucher_usages (voucher_id, user_id)` (`UQ_voucher_user_usage`) — Cưỡng chế quy tắc nghiệp vụ: Mỗi khách hàng chỉ được dùng 1 voucher đúng 1 lần.
  5. `wishlist_items (user_id, product_id)` (`uq_wishlist_user_product`) — Ngăn chặn khách hàng thêm trùng lặp một sản phẩm vào danh sách yêu thích.

### 5.2. 02 Chỉ mục Duy nhất có Điều kiện lọc (Filtered Unique Indexes — `has_filter = 1`)
Được tạo bằng lệnh `CREATE UNIQUE NONCLUSTERED INDEX` có mệnh đề lọc `WHERE`:
1. **`uq_user_default_address` trên bảng `addresses`:**
   - **Cột:** `user_id`
   - **Mệnh đề lọc thực tế (`filter_definition`):** `WHERE ([is_default]=(1))`
   - **Ý nghĩa nghiệp vụ:** Cho phép một khách hàng có vô số địa chỉ phụ (`is_default = 0`), nhưng **tuyệt đối chỉ có tối đa 1 địa chỉ mặc định** (`is_default = 1`). Ràng buộc Unique thông thường không thể đáp ứng được trường hợp này.
2. **`uq_product_primary_image` trên bảng `product_images`:**
   - **Cột:** `product_id`
   - **Mệnh đề lọc thực tế (`filter_definition`):** `WHERE ([is_primary]=(1))`
   - **Ý nghĩa nghiệp vụ:** Cho phép một sản phẩm có nhiều ảnh phụ (`is_primary = 0`), nhưng **tuyệt đối chỉ có tối đa 1 ảnh đại diện chính** (`is_primary = 1`).

---

## 6. Ràng buộc Giá trị Mặc định (47 Default Constraints)

Cơ sở dữ liệu sở hữu **47 ràng buộc `DEFAULT`** trên các cột giúp tự động hóa việc gán giá trị khởi tạo mà không phụ thuộc hoàn toàn vào mã lệnh tầng ứng dụng:
- Tự động gán thời gian hiện tại `(getdate())` cho các cột `created_at` trên toàn bộ các bảng.
- Gán trạng thái kích hoạt mặc định: `is_active = 1` cho `banners`, `categories`, `vouchers`.
- Gán giá trị mặc định cho cờ: `is_default = 0` cho `addresses`, `is_primary = 0` cho `product_images`.
- Gán giá trị khởi tạo tài chính: `0` cho `discount_amount`, `shipping_fee`, `min_order_value`, `usage_limit`, `used_count`, `stock_quantity`.
- Gán giá trị mặc định cho chuỗi trạng thái: `'active'` cho `users`, `products`, `product_variants`; `'CUSTOMER'` cho `users.role`; `'PENDING'` cho `orders.order_status`; `'UNPAID'` cho `orders.payment_status`; `'COD'` cho `orders.payment_method`.

---

## 7. Ràng buộc Nghiệp vụ Cấp Ứng dụng (Application Transaction Invariants)

Ngoài các ràng buộc declarative của SQL Server, hệ thống áp dụng các quy tắc toàn vẹn nghiêm ngặt trong mã nguồn `src/`:

1. **Khóa Bi quan Chống Bán Vượt Tồn (Pessimistic Row Locking):**  
   Tại `src/services/order.service.js`, truy vấn kiểm tra tồn kho khi khách đặt hàng sử dụng cú pháp:
   ```sql
   SELECT id, stock_quantity, status 
   FROM product_variants WITH (UPDLOCK, ROWLOCK) 
   WHERE id = @variantId
   ```
   Ngăn chặn hoàn toàn hiện tượng Race Condition khi hai khách hàng đồng thời đặt mua đôi giày cuối cùng trong kho.
2. **Kiểm soát Vòng đời Đơn hàng (Strict State Machine):**  
   Chuyển trạng thái đơn hàng qua route Admin phải tuân thủ luồng hợp lệ:  
   `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`. Hủy đơn (`CANCELLED`) chỉ được phép khi đơn chưa chuyển sang `SHIPPING`.
3. **Cơ chế Hoàn Kho An toàn (Idempotent Stock Restock):**  
   Khi hủy đơn hàng, hệ thống kiểm tra trạng thái đơn trước đó, hoàn lại số lượng tồn cho từng biến thể SKU và tự động ghi một dòng nhật ký kiểm toán vào `inventory_transactions` với `transaction_type = 'ORDER_CANCEL'`.
