# HỒ SƠ TỔNG HỢP BÁO CÁO PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
# DỰ ÁN WEBSITE THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE

**Đơn vị đào tạo:** Trường Cao đẳng Thực hành FPT Polytechnic  
**Chuyên ngành:** Công nghệ Thông tin — Phát triển Phần mềm / Ứng dụng Web  
**Đề tài:** Xây dựng Website Bán Giày Dép Trực Tuyến VAMOS STORE  
**Nhóm sinh viên thực hiện:**
1. **Trần Trung Dũng** — MSSV: TD01702 (Trưởng nhóm)
2. **Trần Vĩnh Nhật** — MSSV: TD01482 (Thành viên)
3. **Trần Duy Hoàng Sa** — MSSV: TD01519 (Thành viên)  
**Giảng viên hướng dẫn:** ThS. Hoàng Hà  
**Thời gian hoàn thành:** Tháng 12/2026  

---

## 1. GIỚI THIỆU CHUNG VỀ BỘ HỒ SƠ (OVERVIEW)

Thư mục **`HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE`** là một **bộ hồ sơ độc lập, trọn gói và tự chứa (Self-Contained Dossier)** được chuẩn bị riêng biệt nhằm phục vụ công tác nghiệm thu, chấm điểm và bảo vệ đồ án trước Hội đồng Thẩm định FPT Polytechnic.

Toàn bộ tài liệu tập trung chuyên sâu vào **4 trụ cột then chốt của giai đoạn Phân tích & Thiết kế Phần mềm (System Analysis & Design)**:
1. **Sơ đồ trường hợp sử dụng (Use Case Diagram):** Phân định ranh giới hệ thống, 3 tác nhân (`Guest`, `Customer`, `Admin`) và 14 Use Case chuẩn.
2. **Sơ đồ thực thể liên kết (ERD):** Mô hình hóa cấu trúc dữ liệu quan hệ gồm 20 bảng nghiệp vụ trên Microsoft SQL Server 2022, giải quyết bài toán ma trận biến thể giày dép (Size/Màu) và lưu trữ lịch sử đơn hàng.
3. **Sơ đồ hoạt động (Activity Diagram):** Kiểm soát các luồng xử lý giao dịch ACID, cơ chế trừ kho tức thời chống Overselling, hoàn kho tự động và máy trạng thái đơn hàng (FSM) 6 trạng thái.
4. **Thiết kế giao diện người dùng (UI):** Hiện thực hóa các yêu cầu người dùng thông qua công nghệ Server-Side Rendering (Pug template engine & Tailwind CSS) với 17 màn hình chức năng thực tế.

---

## 2. CẤU TRÚC VÀ BẢN ĐỒ ĐỊNH VỊ THƯ MỤC (DIRECTORY MAP)

Khi mở thư mục này, toàn bộ tài nguyên đã được phân loại khoa học theo 4 nhóm chức năng:

```text
HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/
│
├── README.md                                   <-- [Tài liệu bạn đang đọc: Hướng dẫn sử dụng tổng quan]
│
├── 01_TAI_LIEU_BAO_CAO/                        <-- [Tài liệu Báo cáo Chuyên đề chính thức 4 Phần]
│   ├── BAO_CAO_PHAN_TICH_VA_THIET_KE_VAMOS_STORE.docx  <-- Bản Word chuẩn A4 (Times New Roman, có trang bìa)
│   ├── BAO_CAO_PHAN_TICH_VA_THIET_KE_VAMOS_STORE.pdf   <-- Bản PDF 65 trang chuẩn in ấn / nộp Giảng viên
│   └── BAO_CAO_PHAN_TICH_VA_THIET_KE_VAMOS_STORE.md    <-- Bản Markdown nguồn (liên kết ảnh nội bộ tự chứa)
│
├── 02_HINH_ANH_BAO_CAO/                        <-- [Kho lưu trữ toàn bộ 36 tệp hình ảnh đồ họa chất lượng cao]
│   ├── 01_USE_CASE/                            <-- 3 Sơ đồ Use Case (Tổng quát, Mua hàng COD, Quản trị Admin)
│   │   ├── 01_USE_CASE_TONG_QUAT.png
│   │   ├── 02_USE_CASE_MUA_HANG_COD.png
│   │   └── 03_USE_CASE_QUAN_TRI_ADMIN.png
│   │
│   ├── 02_ERD/                                 <-- 5 Sơ đồ ERD (Tổng thể 20 bảng và 4 phân hệ chuyên đề)
│   │   ├── 01_ERD_TONG_QUAT_20_BANG.png
│   │   ├── 02_ERD_NGUOI_DUNG_DIA_CHI.png
│   │   ├── 03_ERD_DANH_MUC_SAN_PHAM.png
│   │   ├── 04_ERD_GIO_HANG_BIEN_THE.png
│   │   └── 05_ERD_DON_HANG_LICH_SU.png
│   │
│   ├── 03_ACTIVITY_DIAGRAM/                    <-- 11 Sơ đồ Hoạt động (9 sơ đồ chính trong báo cáo + 2 bổ trợ)
│   │   ├── AD01_DANG_KY_TAI_KHOAN.png
│   │   ├── AD02_DANG_NHAP.png
│   │   ├── AD03_QUEN_MAT_KHAU.png
│   │   ├── AD04_QUAN_LY_SO_DIA_CHI.png
│   │   ├── AD05_TIM_KIEM_LOC_SAN_PHAM.png
│   │   ├── AD06_QUAN_LY_GIO_HANG.png
│   │   ├── AD08_DAT_HANG_COD.png
│   │   ├── AD10_HUY_DON_HANG_KHACH_HANG.png
│   │   ├── AD11_XU_LY_DON_HANG_ADMIN.png
│   │   ├── AD12_QUAN_LY_TON_KHO.png
│   │   └── AD13_QUAN_LY_DANH_MUC_SAN_PHAM.png
│   │
│   ├── 04_UI_GUEST/                            <-- 5 Ảnh giao diện thực tế dành cho Khách vãng lai
│   │   ├── 01_TRANG_CHU.png
│   │   ├── 02_CUA_HANG_LOC.png
│   │   ├── 03_CHI_TIET_SAN_PHAM.png
│   │   ├── 04_DANG_NHAP.png
│   │   └── 05_DANG_KY.png
│   │
│   ├── 05_UI_CUSTOMER/                         <-- 4 Ảnh giao diện thực tế dành cho Khách hàng thành viên
│   │   ├── 01_GIO_HANG.png
│   │   ├── 02_DAT_HANG_COD.png
│   │   ├── 03_LICH_SU_DON_HANG.png
│   │   └── 04_SAN_PHAM_YEU_THICH.png
│   │
│   └── 06_UI_ADMIN/                            <-- 8 Ảnh giao diện thực tế phân hệ Quản trị viên
│       ├── 01_DASHBOARD.png
│       ├── 02_SAN_PHAM_SKU.png
│       ├── 03_DON_HANG.png
│       ├── 04_DANH_MUC_THUONG_HIEU.png
│       ├── 05_TON_KHO_THE_KHO.png
│       ├── 06_VOUCHER.png
│       ├── 07_KHACH_HANG.png
│       └── 08_BANNER.png
│
├── 03_HUONG_DAN_BAO_CAO/                       <-- [Tài liệu hỗ trợ Thuyết trình, Kịch bản & Hỏi - Đáp phản biện]
│   ├── HUONG_DAN_THUYET_TRINH_4_PHAN.docx      <-- Bản Word cẩm nang hướng dẫn trình bày 4 phần
│   ├── HUONG_DAN_THUYET_TRINH_4_PHAN.pdf       <-- Bản PDF cẩm nang in ấn / đọc trên tablet
│   ├── HUONG_DAN_THUYET_TRINH_4_PHAN.md        <-- Bản Markdown cẩm nang thuyết trình
│   ├── KICH_BAN_TRINH_BAY.md                   <-- Toàn văn kịch bản nói từ mở đầu đến kết thúc (15-20 phút)
│   └── CAU_HOI_VA_CACH_TRA_LOI.md              <-- 32 câu hỏi phản biện thực chiến và đáp án bám sát code/DDL
│
└── 04_DANH_MUC_VA_DOI_CHIEU/                   <-- [Hệ thống danh mục tra cứu và ma trận nguồn gốc kỹ thuật]
    ├── DANH_MUC_HINH_ANH.md                    <-- Bảng tra cứu 34 hình ảnh theo số thứ tự và dung lượng
    ├── DANH_MUC_SO_DO.md                       <-- Bảng đối chiếu cấu trúc Use Case, ERD 20 bảng và Swimlanes
    └── NGUON_GOC_HINH_ANH.md                   <-- Ma trận truy nguyên nguồn gốc từ PlantUML/Pug/DDL thực tế
```

---

## 3. HƯỚNG DẪN SỬ DỤNG CHO CÁC MỤC ĐÍCH KHÁC NHAU

### 3.1. Dành cho Giảng viên hướng dẫn & Hội đồng Thẩm định
- **Để chấm điểm tổng thể:** Mở tệp `01_TAI_LIEU_BAO_CAO/BAO_CAO_PHAN_TICH_VA_THIET_KE_VAMOS_STORE.pdf`. Tài liệu gồm đúng 65 trang chuẩn A4, có trang bìa trang trọng của FPT Polytechnic, mục lục định dạng chấm dòng, danh mục hình ảnh, danh mục bảng biểu và nội dung thuyết minh chi tiết cho cả 4 phần.
- **Để kiểm tra tính xác thực mã nguồn và cơ sở dữ liệu:** Mở tệp `04_DANH_MUC_VA_DOI_CHIEU/NGUON_GOC_HINH_ANH.md` và `04_DANH_MUC_VA_DOI_CHIEU/DANH_MUC_SO_DO.md`. Tài liệu đối chiếu chi tiết từng cột trong 20 bảng DDL với sơ đồ ERD và luồng xử lý transaction trong mã nguồn Node.js.

### 3.2. Dành cho Sinh viên tự học và nghiên cứu chuyên sâu cơ sở dữ liệu (ERD)
- **Tài liệu học tập độc lập:** Mở thư mục `05_TAI_LIEU_NGHIEN_CUU_ERD/` và đọc file `PHAN_TICH_CHI_TIET_ERD_VAMOS_STORE.md`.
- **Nội dung chuyên sâu:** Phân tích toàn bộ 20 bảng nghiệp vụ và 153 thuộc tính thực tế trong CSDL SQL Server 2022. Với mỗi bảng, tài liệu giải thích:
  1. Bảng dùng để làm gì?
  2. Vì sao hệ thống cần bảng này?
  3. Bảng có những thuộc tính nào, kiểu dữ liệu gì và lưu trữ thông tin gì?
  4. Bảng liên kết với các bảng khác qua các khóa ngoại nào?
  5. Ví dụ thực tế trong luồng mua sắm VAMOS STORE.
- Đồng thời cung cấp hướng dẫn cách đọc ký hiệu Crow's Foot, giải thích 8 nhóm quan hệ, luồng dữ liệu 11 bước của kịch bản đặt hàng COD và 18 câu hỏi phản biện CSDL có đáp án chi tiết.

### 3.3. Dành cho Sinh viên luyện tập thuyết trình trước khi bảo vệ
- **Bước 1 — Nắm vững phương pháp và lời thoại từng phần:** Đọc kỹ tài liệu `03_HUONG_DAN_BAO_CAO/HUONG_DAN_THUYET_TRINH_4_PHAN.md` (hoặc mở bản PDF/Word tương ứng). Tài liệu hướng dẫn cách chỉ tay vào sơ đồ, cách giải thích `<<include>>`, `<<extend>>`, ma trận biến thể `product_variants`, thẻ kho `inventory_transactions` và máy trạng thái 6 bước FSM.
- **Bước 2 — Tập nói theo kịch bản hoàn chỉnh:** Đọc tệp `03_HUONG_DAN_BAO_CAO/KICH_BAN_TRINH_BAY.md`. Tập bấm giờ nói từ phần Chào hỏi (1.5 phút), Use Case (4 phút), ERD (4.5 phút), Activity (4.5 phút) đến UI (3.5 phút) để bảo đảm không vượt quá khung thời gian quy định 15 – 20 phút.
- **Bước 3 — Ôn luyện phản biện câu hỏi hóc búa:** Đọc tệp `03_HUONG_DAN_BAO_CAO/CAU_HOI_VA_CACH_TRA_LOI.md`. Trong này tổng hợp sẵn 32 câu hỏi mà giảng viên thường hỏi nhiều nhất (tại sao trừ kho ngay lúc đặt hàng? tại sao snapshot địa chỉ? tại sao 20 bảng? cơ chế session MemoryStore thế nào?...), kèm câu trả lời ngắn gọn và phần giải thích sâu.

### 3.4. Dành cho việc chuẩn bị Slide thuyết trình (PowerPoint / Canva)
- Khi làm Slide thuyết trình, sinh viên không cần chụp lại màn hình hay tìm kiếm rải rác:
  - Slide Use Case: Lấy ảnh độ phân giải cao trong thư mục `02_HINH_ANH_BAO_CAO/01_USE_CASE/`.
  - Slide Cơ sở dữ liệu: Lấy ảnh nét 300 DPI trong thư mục `02_HINH_ANH_BAO_CAO/02_ERD/`.
  - Slide Luồng quy trình: Lấy sơ đồ swimlane trong thư mục `02_HINH_ANH_BAO_CAO/03_ACTIVITY_DIAGRAM/`.
  - Slide Demo Giao diện: Lấy ảnh chụp thực tế tỷ lệ 16:9 sắc nét trong các thư mục `04_UI_GUEST/`, `05_UI_CUSTOMER/`, `06_UI_ADMIN/`.

---

## 4. TÓM TẮT CÁC THÔNG SỐ VÀ DỮ LIỆU ĐÃ XÁC MINH (VERIFIED FACTS)

Mọi tài liệu trong hồ sơ này đều đã vượt qua quá trình kiểm toán đối chiếu kỹ thuật tự động và xác minh thực tế:
- **Use Case:** Đúng 3 tác nhân (`Guest`, `Customer`, `Admin`), 14 Use Case chính thức (`UC01` – `UC14`). Không có `Staff`.
- **Cơ sở dữ liệu (MSSQL Server 2022):** Đúng 20 bảng nghiệp vụ chuẩn 3NF. Không tính `schema_migrations`. Cột `orders.delivery_address_snapshot` là `NVARCHAR(255) NOT NULL`. Cột `password_reset_tokens.token_hash` là `NVARCHAR(255) NOT NULL UNIQUE`. Cột `order_items.product_variant_id` và `cart_items.variant_id` chính xác 100%.
- **Quy trình đơn hàng (FSM):** Vận hành tuần tự qua đúng 6 trạng thái: `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPING` -> `COMPLETED`, và nhánh hủy `CANCELLED`. Trừ kho ngay tại thời điểm tạo đơn (`OUT_SALE`), không trừ đúp khi hoàn thành. Hoàn kho tức thời (`IN_CANCEL`) khi hủy đơn hợp lệ.
- **Giao diện & Bảo mật:** Server-Side Rendering (SSR) với Pug template engine, cookie phiên `vamos_sid` (HttpOnly, SameSite=Lax), thuật toán mã hóa mật khẩu `bcryptjs` (salt=10).

---

*Hồ sơ được thiết lập hoàn chỉnh, tự chứa và sẵn sàng phục vụ cho công tác in ấn, nộp báo cáo và thuyết trình bảo vệ đồ án tốt nghiệp.*
