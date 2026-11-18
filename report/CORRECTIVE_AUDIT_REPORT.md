# BÁO CÁO KIỂM TOÁN VÀ NGHIỆM THU NỘI DUNG TOÀN DIỆN
## TÀI LIỆU CHUYÊN ĐỀ PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG VAMOS STORE

* **Ngày thực hiện kiểm toán:** 17/11/2026
* **Đối tượng nghiệm thu:**
  * Mã nguồn Markdown: `report/BAO_CAO_PHAN_TICH_VA_THIET_KE_VAMOS_STORE.md` (174,937 bytes, 1,576 dòng)
  * Bản Word (DOCX): `report/BAO_CAO_PHAN_TICH_VA_THIET_KE_VAMOS_STORE.docx` & `BAO_CAO_PHAN_TICH_VA_THIET_KE_VAMOS_STORE.docx` (8.83 MB)
  * Bản in PDF chuyên nghiệp: `report/BAO_CAO_PHAN_TICH_VA_THIET_KE_VAMOS_STORE.pdf` & `BAO_CAO_PHAN_TICH_VA_THIET_KE_VAMOS_STORE.pdf` (8.74 MB, **đúng 65 trang A4**)
* **Căn cứ đối soát kỹ thuật:**
  * Bộ mã DDL CSDL: `database/mssql_schema.sql`
  * Các tệp migration thực tế: `database/migrations/001_initial_schema.sql`, `003_voucher_customer_usage.sql`, `004_create_wishlist_items.sql`
  * Mã nguồn xác thực & phân quyền: `src/config/app.config.js`, `src/middlewares/auth.middleware.js`, `src/controllers/auth.controller.js`
  * Mã nguồn giao dịch & máy trạng thái đơn hàng: `src/services/order.service.js`, `src/controllers/admin.controller.js`
  * Các sơ đồ PlantUML gốc: `docs/diagrams/usecase/USE_CASE_OVERVIEW.puml`, `docs/diagrams/erd/PHYSICAL_ERD.puml`, các sơ đồ `docs/diagrams/activity/AD*.puml`
* **Người thực hiện:** Technical Documentation Auditor & Software Architect

---

## 1. TỔNG KẾT NỘI DUNG 4 PHẦN CHUYÊN SÂU ĐÃ HOÀN TẤT

Tài liệu được biên soạn hoàn chỉnh theo phong cách học thuật của sinh viên FPT Polytechnic trình bày trước Hội đồng Giảng viên: giàu tính thuyết minh, giải thích bản chất nghiệp vụ, có câu dẫn dắt tự nhiên, tuyệt đối không chèn sơ đồ/hình ảnh đơn độc mà không có phân tích.

### Phần 1. Phân tích Chức năng Hệ thống – Use Case (Trang 10 – 28)
* **1.1. Giới thiệu tổng quan hệ thống:** Giới thiệu mục tiêu của VAMOS STORE trong việc giải quyết bài toán bán lẻ giày dép trực tuyến, vai trò của việc phân tích Use Case trước khi thiết kế dữ liệu.
* **1.2. Xác định các tác nhân (Actor):** Phân tích chi tiết 3 tác nhân con người chính (`Guest`, `Customer`, `Admin`) và 1 tác nhân phụ (`Email Service`). Giải thích tường minh quan hệ kế thừa `Customer -|> Guest`. Khẳng định rõ ràng **hoàn toàn không có tác nhân Staff**. Đi kèm **Bảng 1: Ma trận phân quyền các tác nhân (Actor Permissions Matrix)**.
* **1.3. Sơ đồ Use Case tổng quát:** Chèn **Hình 1** (Tổng quát 14 UC), **Hình 2** (Mua sắm & Đặt hàng COD), **Hình 3** (Quản lý Admin). Thuyết minh chi tiết cách đọc sơ đồ, ranh giới 4 gói nghiệp vụ, ý nghĩa quan hệ `<<include>>` (khóa dòng trừ kho) và `<<extend>>` (áp voucher, hủy đơn PENDING).
* **1.4. Danh sách và đặc tả chi tiết 14 Use Case (Bảng 2 & UC01 – UC14):**
  * Biên soạn đầy đủ 14 ca sử dụng theo mẫu chuẩn: Mục đích, Tác nhân, Mô tả, Luồng xử lý chính từng bước, Luồng ngoại lệ.
  * Phân tích sâu các nghiệp vụ cốt lõi: Đăng ký (`UC01`), Đăng nhập (`UC02`), Giỏ hàng (`UC06`), Đặt hàng COD (`UC07`), Hủy đơn (`UC09`), Admin cập nhật FSM (`UC10`).
  * Làm rõ `UC03` (Khôi phục mật khẩu): Mới dừng lại ở mức thiết kế dữ liệu (bảng `password_reset_tokens`), mã nguồn chưa có route/controller và chưa kết nối SMTP gửi email; không mô tả như tính năng đã chạy thực tế.
* **1.5. Nhận xét về mô hình Use Case:** Đánh giá tính phân quyền và khẳng định vai trò nền tảng làm tiền đề cho ERD, Activity Diagram và UI.

### Phần 2. Phân tích Cơ sở Dữ liệu – ERD (Trang 29 – 39)
* **2.1. Giới thiệu mô hình dữ liệu:** Nền tảng Microsoft SQL Server 2022, vai trò của ERD trong chuẩn hóa 3NF, hạn chế trùng lặp và bảo đảm toàn vẹn giao dịch ACID.
* **2.2. Sơ đồ ERD tổng quát:** Chèn **Hình 4** (ERD tổng thể 20 bảng nghiệp vụ) và 4 sơ đồ phân hệ **Hình 5, 6, 7, 8**. Phân tích vai trò của 4 bảng trung tâm (`users`, `products`, `product_variants`, `orders`). Giải thích tại sao giày dép bắt buộc phải quản lý theo biến thể Size $\\times$ Màu sắc (`product_variants`), và cách dữ liệu chuyển hóa từ `cart_items` sang `order_items`.
* **2.3. Phân tích các nhóm thực thể nghiệp vụ (Bảng 3 & 7 nhóm thực thể):**
  * Bao trùm chính xác **20 bảng nghiệp vụ thực tế** trong DDL (bảng kỹ thuật `schema_migrations` không tính).
  * Loại bỏ hoàn toàn các bảng giả định: `roles`, `user_roles`, `attribute_types`, `attribute_values`, `variant_attribute_values`, `wishlists`.
* **2.4. Phân tích các mối quan hệ tiêu biểu:** Phân tích bản chất nghiệp vụ kèm ví dụ thực tế cho 6 mối quan hệ cốt lõi: Tài khoản - Địa chỉ (1:N), Sản phẩm - Biến thể SKU (1:N), Giỏ hàng - Biến thể (1:N), Đơn hàng - Chi tiết đơn (1:N Snapshot giá), Đơn hàng - Lịch sử trạng thái (1:N), Voucher - Người dùng (N:N).
* **2.5. Khóa và ràng buộc toàn vẹn dữ liệu:**
  * Giải thích PK, FK, UNIQUE, CHECK.
  * Giải thích bản chất 2 Filtered Unique Index: `uq_user_default_address` và `uq_product_primary_image` bảo đảm **tối đa một (at most one)**, không bắt buộc phải có ít nhất một.
  * **Bảng 4: Bảng đối soát tên cột khóa ngoại thực tế trong DDL:** Xác thực 100% các cột `cart_items.variant_id`, `inventory_transactions.variant_id`, `order_items.product_variant_id`, `order_items.unit_price`, `password_reset_tokens.token_hash` & `used_at`, `orders.delivery_address_snapshot`, `order_status_histories.changed_by` & `previous_status` & `new_status`.
* **2.6. Nhận xét về thiết kế CSDL:** Tổng kết tính khoa học, khả năng chống bán vượt tồn kho và cơ chế bảo toàn dữ liệu bằng snapshot.

### Phần 3. Mô hình hóa Quy trình – Activity Diagram (Trang 40 – 51)
* **3.1. Giới thiệu Activity Diagram:** Cấu trúc điểm bắt đầu, điểm kết thúc, hoạt động, điều kiện rẽ nhánh và kỹ thuật phân 3 làn Swimlanes (Tác nhân — Ứng dụng Web — CSDL).
* **3.2. Phân tích 7 quy trình hoạt động nghiệp vụ trọng yếu (Bảng 5 & 9 sơ đồ chuẩn Hình 9 – 17):**
  * Trình bày đầy đủ theo cấu trúc: a. Mục đích, b. Tác nhân, c. Sơ đồ, d. Giải thích luồng chi tiết, e. Kết quả nghiệp vụ.
  * Bao quát: Đăng ký (AD01), Đăng nhập & gộp giỏ (AD02), Tìm kiếm & chi tiết (AD05), Giỏ hàng (AD06), Đặt hàng COD (AD08), Hủy đơn (AD10), Admin xử lý đơn (AD11), Kho & thẻ kho (AD12), Danh mục & sản phẩm (AD13).
* **3.3. Những nghiệp vụ cần giải thích sâu:**
  * *Đặt hàng COD nguyên tử:* Khóa bi quan `UPDLOCK, ROWLOCK`, trừ kho tức thời (`OUT_SALE`), ghi thẻ kho, tạo đơn snapshot, xóa giỏ hàng trong 1 transaction. Thuần túy COD tiền mặt, không dùng VNPAY/Momo.
  * *Hủy đơn hàng:* Khách chỉ hủy khi `PENDING`; Admin hủy khi `PENDING` hoặc `CONFIRMED`. Tự động hoàn kho `+qty`, ghi thẻ kho, hoàn voucher usage.
  * *Admin cập nhật trạng thái FSM:* Đúng 6 trạng thái (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `COMPLETED`, `CANCELLED`). Tuyệt đối không dùng `SHIPPED` hoặc `DELIVERED`. Khi sang `COMPLETED`, cập nhật `payment_status = 'PAID'`, **tuyệt đối không trừ kho lần thứ 2**.
* **3.4. Nhận xét về Activity Diagram:** Minh bạch luồng xử lý, dự báo mọi ngoại lệ và làm căn cứ cho giao diện UI.

### Phần 4. Thiết kế Giao diện – User Interface (Trang 52 – 65)
* **4.1. Giới thiệu thiết kế giao diện:** Pug template, Tailwind CSS, SSR, tỷ lệ 60-30-10, Desktop Viewport $1440 \times 900$.
* **4.2. Giao diện dành cho Guest (Hình 18 – 22):** Trang chủ, Cửa hàng & lọc, Chi tiết sản phẩm & chọn size/màu, Đăng nhập, Đăng ký. Mỗi màn hình trình bày: Mục đích, Khu vực chính, Thông tin hiển thị, Thao tác, Kết quả.
* **4.3. Giao diện dành cho Customer (Hình 23 – 26):** Giỏ hàng trực tuyến, Đặt hàng COD, Lịch sử & chi tiết đơn hàng, Danh sách yêu thích.
* **4.4. Giao diện dành cho Admin (Hình 27 – 34):** Dashboard, Quản lý sản phẩm & SKU, Quản lý đơn hàng, Danh mục/Thương hiệu, Tồn kho & thẻ kho, Voucher, Khách hàng, Banner.
* **4.5. Nhận xét chung & Mối liên kết xuyên suốt 4 phần:** Phân tích mô hình chuỗi giá trị xuyên suốt từ Use Case (UC07) $\rightarrow$ ERD (8 bảng liên quan) $\rightarrow$ Activity Diagram (AD08) $\rightarrow$ UI (Hình 23 & 24), tạo nên một tài liệu kỹ thuật hữu cơ và thống nhất.

---

## 2. KẾT QUẢ KIỂM TRA ĐỊNH DẠNG VÀ SỐ TRANG

1. **Tổng số trang PDF:** **Chính xác 65 trang A4**.
2. **Kiểm tra trang trắng (PyMuPDF):** **0 trang trắng** (`ZERO blank pages detected across all 65 pages`).
3. **Độ khớp số trang Mục lục (TOC Alignment):**
   * Phần 1 (Use Case): Bắt đầu trang 10.
   * Phần 2 (ERD): Bắt đầu trang 29.
   * Phần 3 (Activity Diagram): Bắt đầu trang 40.
   * Phần 4 (User Interface): Bắt đầu trang 52.
   * Toàn bộ 34 hình vẽ (Hình 1 đến 34) và 5 bảng biểu (Bảng 1 đến 5) khớp số trang thực tế 100%.
4. **Bản Word DOCX:** Tạo hoàn chỉnh với trang bìa chuẩn FPT Polytechnic có khung viền đôi nghệ thuật, logo trường và định dạng học thuật Times New Roman 12-13pt.

---

## 3. KẾT LUẬN NGHIỆM THU

$$\mathbf{KẾT\ LUẬN:\ READY\ TO\ SUBMIT}$$

Tài liệu báo cáo chuyên đề **"PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG — VAMOS STORE"** đã đáp ứng hoàn hảo yêu cầu của Giảng viên: nội dung phân tích sâu sắc, đầy đủ thuyết minh, đúng chuẩn văn phong học thuật FPT Polytechnic và có tính liên kết chặt chẽ giữa 4 trụ cột cốt lõi.
