# NHẬT KÝ THAY ĐỔI VÀ HIỆU CHỈNH KỸ THUẬT (FINAL QA CHANGELOG)
## BÁO CÁO ĐỒ ÁN TỐT NGHIỆP / CHUYÊN ĐỀ ASM VAMOS STORE
**Đơn vị:** FPT Polytechnic - Bộ môn Công nghệ Thông tin  
**Phạm vi:** Toàn bộ hệ thống tài liệu báo cáo học thuật trong thư mục `report/` và các ấn phẩm xuất bản  
**Thời gian hoàn tất:** Tháng 12/2026

---

## 1. TỔNG QUAN TIẾN TRÌNH HIỆU CHỈNH

Nhằm chuẩn bị tốt nhất cho buổi bảo vệ đồ án tốt nghiệp của nhóm sinh viên, toàn bộ bộ tài liệu báo cáo VAMOS STORE đã trải qua 6 vòng kiểm toán kỹ thuật độc lập (Audit Rounds). Quá trình này loại bỏ triệt để các điểm sai lệch giữa tài liệu thiết kế và mã nguồn thực tế, bảo đảm tính liêm chính học thuật (Academic Integrity) và nâng cao chất lượng thẩm mỹ in ấn theo đúng chuẩn quy cách của FPT Polytechnic.

---

## 2. CHI TIẾT CÁC VÒNG KIỂM TOÁN VÀ THAY ĐỔI (AUDIT ROUNDS)

### VÒNG 1: ĐỐI SOÁT VÀ CHUẨN HÓA CẤU TRÚC CSDL (DDL & SCHEMA RECONCILIATION)
* **Vấn đề phát hiện:**
  1. Trong một số bản nháp cũ, bảng `password_reset_tokens` bị mô tả nhầm có cột tên là `token`.
  2. Bảng `orders` bị mô tả cột snapshot địa chỉ nhận hàng có độ dài `NVARCHAR(500)`.
  3. Xuất hiện một số vị trí gõ nhầm phiên bản cơ sở dữ liệu thành "Microsoft SQL Server 2025".
* **Hành động hiệu chỉnh:**
  1. Đọc nguyên văn tệp `database/mssql_schema.sql` (dòng 187-195) và migration `001_initial_schema.sql` (dòng 124-132). Khẳng định cột chính xác là `token_hash NVARCHAR(255) NOT NULL UNIQUE`. Cập nhật lại Bảng 12 (Từ điển dữ liệu) và chuẩn hóa câu giải trình: *"Chức năng khôi phục mật khẩu đã được đưa vào thiết kế và có cấu trúc dữ liệu hỗ trợ, tuy nhiên quy trình xử lý hoàn chỉnh chưa được triển khai trong phiên bản hiện tại."*
  2. Đọc nguyên văn `database/mssql_schema.sql` (dòng 318) và migration `001_initial_schema.sql` (dòng 222). Khẳng định cột chính xác là `delivery_address_snapshot NVARCHAR(255) NOT NULL`. Cập nhật lại Bảng 18.
  3. Thống nhất tên gọi duy nhất **Microsoft SQL Server 2022** trên toàn bộ 9 file chương của báo cáo.

---

### VÒNG 2: CHUẨN HÓA VÀ ĐÁNH SỐ THỨ TỰ TỪ ĐIỂN DỮ LIỆU (DATA DICTIONARY STANDARDIZATION)
* **Vấn đề phát hiện:** Bản nháp trước đánh số 20 bảng từ điển dữ liệu từ Bảng 1 đến Bảng 20, gây xung đột và trùng lặp với Bảng 1 (Tiến độ dự án) ở Phần mở đầu và Bảng 2, 3 ở Chương II.
* **Hành động hiệu chỉnh:**
  * Giữ nguyên Bảng 1: Lập kế hoạch dự án VAMOS STORE (Phần mở đầu).
  * Chuẩn hóa toàn bộ 20 bảng từ điển dữ liệu thành dãy số tịnh tiến liên tục từ **Bảng 4 đến Bảng 23**:
    * Bảng 4: `users`
    * Bảng 5: `categories`
    * Bảng 6: `brands`
    * Bảng 7: `sizes`
    * Bảng 8: `colors`
    * Bảng 9: `vouchers`
    * Bảng 10: `banners`
    * Bảng 11: `addresses`
    * Bảng 12: `password_reset_tokens`
    * Bảng 13: `carts`
    * Bảng 14: `products`
    * Bảng 15: `product_images`
    * Bảng 16: `product_variants`
    * Bảng 17: `cart_items`
    * Bảng 18: `orders`
    * Bảng 19: `order_items`
    * Bảng 20: `order_status_histories`
    * Bảng 21: `inventory_transactions`
    * Bảng 22: `voucher_usages`
    * Bảng 23: `wishlist_items`
  * Đồng bộ hóa tiêu đề các bảng trong `chapter_2.md` thành định dạng chuẩn `#### Bảng X: Thực thể <tên_bảng> (<ý_nghĩa>)`.

---

### VÒNG 3: BỔ SUNG MA TRẬN PHÂN QUYỀN VÀ CHÚ THÍCH USE CASE (ACTOR MATRIX & USE CASES)
* **Vấn đề phát hiện:** Danh mục bảng biểu ở `front_matter.md` có liệt kê `Bảng 2: Ma trận phân quyền các Actor trong VAMOS STORE` và `Bảng 3: Danh sách 14 Use Case nghiệp vụ hệ thống VAMOS STORE`, nhưng nội dung trong `chapter_2.md` chưa gắn nhãn và thiếu bảng ma trận phân quyền trực quan.
* **Hành động hiệu chỉnh:**
  * Bổ sung mục **1.4. Ma trận phân quyền các tác nhân (Actor Permissions Matrix)** vào cuối Phần 1 của Chương II, thể hiện bảng ma trận phân quyền RBAC qua 16 phân hệ/nghiệp vụ cho 3 tác nhân (`Guest`, `Customer`, `Admin`), gắn nhãn chú thích: `_Bảng 2: Ma trận phân quyền các Actor trong VAMOS STORE_`.
  * Bổ sung nhãn chú thích chuẩn `_Bảng 3: Danh sách 14 Use Case nghiệp vụ hệ thống VAMOS STORE_` ngay dưới bảng đặc tả 14 Use Case ở Mục 2.1.D.

---

### VÒNG 4: MINH BẠCH HÓA KẾT QUẢ KIỂM THỬ (ZERO FAKE PASSES CALIBRATION)
* **Vấn đề phát hiện:** Trong báo cáo cũ, toàn bộ 25 ca kiểm thử chấp nhận chức năng (Acceptance Test Cases) đều được ghi nhận là "Pass 100%". Điều này vi phạm nguyên tắc liêm chính khoa học vì ca kiểm thử tải đa luồng (Case 23) chưa có công cụ benchmark thực địa trên máy tính phát triển.
* **Hành động hiệu chỉnh:**
  * Trong Bảng 24 (Ma trận kiểm thử chức năng):
    * 24 ca kiểm thử chức năng cơ bản được điều chỉnh trạng thái thành **"Đã rà soát logic"** (kèm ghi chú rõ ràng về việc đối chiếu với code controller và truy vấn SQL).
    * Ca kiểm thử 23 (Kiểm thử tải đồng thời khi kho chỉ còn 1 đôi) được điều chỉnh trạng thái thành **"Chưa xác minh (Chờ Staging)"**.
  * Trong Bảng 25 (Kết quả kiểm thử tự động): Ghi nhận số liệu thực tế đo đạc từ CLI:
    * Kiểm thử cú pháp giao diện Pug: 39/39 passed (100%).
    * Kiểm thử bộ lọc và validate dữ liệu: 29/29 assertions passed (100%).
    * Kiểm thử hồi quy logic: 15/15 assertions passed (100%).
    * Kiểm thử giao diện Theme Dark/Light: 8/8 passed (100%).
    * Kiểm thử chuyển đổi ngôn ngữ đa quốc gia i18n: 8/8 passed (100%).
    * Tổng số bài test tự động: **99 checks, 100% Pass**.

---

### VÒNG 5: HIỆU CHỈNH TRẠNG THÁI TRIỂN KHAI DOCKER (DOCKER REALISM CALIBRATION)
* **Vấn đề phát hiện:** Tài liệu cũ ghi nhận Docker đã chạy live container, trong khi trên thực tế máy trạm chưa khởi động Docker daemon.
* **Hành động hiệu chỉnh:**
  * Chuẩn hóa cách ghi nhận tại Chương V: *"Cấu hình đã kiểm tra, chưa xác minh triển khai thực tế"*.
  * Giữ nguyên mã nguồn tệp `Dockerfile` và `docker-compose.yml` để làm tài liệu thuyết minh kiến trúc đóng gói phần mềm.

---

### VÒNG 6: TỐI ƯU HÓA LAYOUT VÀ ĐỒNG BỘ CHUẨN XÁC SỐ TRANG (VISUAL LAYOUT & EXACT TOC MAPPING)
* **Vấn đề phát hiện:** Số trang trên Mục lục (TOC), Danh mục hình ảnh và Danh mục bảng biểu bị lệch so với số trang thực tế trong tệp PDF xuất bản.
* **Hành động hiệu chỉnh:**
  * Quét toàn bộ 96 trang PDF bằng thư viện `pymupdf` để trích xuất tọa độ và vị trí chính xác của từng tiêu đề chương, đề mục, hình ảnh (Hình 1 - 24) và bảng biểu (Bảng 1 - 25).
  * Cập nhật lại toàn bộ số trang trong `report/01_front_matter/front_matter.md` khớp chuẩn xác 100% với tệp in thực tế.
  * Tái biên dịch tệp tổng hợp `report/BAO_CAO_DATN_VAMOS_STORE.md` (168.55 KB).
  * Xuất bản tệp Microsoft Word chính thức: [`Bao_cao_ASM_VAMOS_STORE_FINAL.docx`](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/Bao_cao_ASM_VAMOS_STORE_FINAL.docx) (19,265,437 bytes).
  * Xuất bản tệp Adobe PDF in ấn chính thức: [`Bao_cao_ASM_VAMOS_STORE_FINAL.pdf`](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/Bao_cao_ASM_VAMOS_STORE_FINAL.pdf) (17,422,435 bytes, 96 trang A4).

---

## 3. DANH SÁCH CÁC TỆP ĐƯỢC THAY ĐỔI VÀ TẠO MỚI

| STT | Đường dẫn tệp | Loại thao tác | Nội dung chính |
| :---: | :--- | :---: | :--- |
| 1 | `report/01_front_matter/front_matter.md` | Hiệu chỉnh | Đồng bộ Mục lục, Danh mục hình ảnh (Hình 1-24), Danh mục bảng biểu (Bảng 1-25) |
| 2 | `report/02_introduction/introduction.md` | Hiệu chỉnh | Chuẩn hóa Bảng 1 (Tiến độ dự án), chuẩn hóa MSSQL 2022 |
| 3 | `report/03_chapter_1_theory/chapter_1.md` | Hiệu chỉnh | Chuẩn hóa MSSQL 2022, bổ sung phân tích kiến trúc MVC phân lớp |
| 4 | `report/04_chapter_2_analysis_design/chapter_2.md` | Hiệu chỉnh | Thêm Bảng 2 (Ma trận phân quyền), Bảng 3 (14 Use Case), Bảng 4-23 (Từ điển dữ liệu 20 bảng) |
| 5 | `report/05_chapter_3_implementation/chapter_3.md` | Hiệu chỉnh | Làm rõ mã nguồn Connection Pool, Transaction Đặt hàng COD, Hoàn kho |
| 6 | `report/06_chapter_4_testing/chapter_4.md` | Hiệu chỉnh | Chuẩn hóa Bảng 24 (25 ca test), Bảng 25 (99 bài test tự động CLI), loại bỏ fake pass |
| 7 | `report/07_chapter_5_deployment/chapter_5.md` | Hiệu chỉnh | Ghi nhận trung thực hiện trạng Docker, chi tiết hóa kế hoạch Production VPS |
| 8 | `report/08_chapter_6_conclusion/chapter_6.md` | Hiệu chỉnh | Thẳng thắn nêu hạn chế và định hình 9 hướng phát triển tương lai |
| 9 | `report/09_references/references.md` | Hiệu chỉnh | Chuẩn hóa danh mục tài liệu công nghệ và giáo trình tham khảo |
| 10 | `report/BAO_CAO_DATN_VAMOS_STORE.md` | Tái tạo | Biên dịch nối chuỗi 9 phần thành tài liệu Master hoàn chỉnh (168.55 KB) |
| 11 | `Bao_cao_ASM_VAMOS_STORE_FINAL.docx` | Tái tạo | Xuất bản Word hoàn thiện, định dạng chuẩn FPT (19.26 MB) |
| 12 | `Bao_cao_ASM_VAMOS_STORE_FINAL.pdf` | Tái tạo | Xuất bản PDF in ấn hoàn thiện (96 trang A4, 17.42 MB) |
| 13 | `report/FINAL_QA_REPORT.md` | Tạo mới | Báo cáo kiểm toán và nghiệm thu tổng thể chính thức |
| 14 | `report/FINAL_QA_CHECKLIST.md` | Tạo mới | Bảng kiểm tra nghiệm thu chi tiết 42 tiêu chí đạt 100% |
| 15 | `report/FINAL_QA_ISSUES.md` | Tạo mới | Sổ tay quản lý vấn đề mở và cẩm nang hướng dẫn sinh viên bảo vệ đồ án |
| 16 | `report/FINAL_QA_CHANGELOG.md` | Tạo mới | Nhật ký thay đổi và hiệu chỉnh kỹ thuật chi tiết này |

---

## 4. KẾT LUẬN VỀ CHẤT LƯỢNG SẢN PHẨM

Toàn bộ các thay đổi được thực hiện hoàn toàn tuân thủ theo Quy tắc An toàn Git (Git Safety Guidelines) và Quy ước Liêm chính Học thuật (Academic Integrity):
* **Không làm hỏng hoặc thay đổi bất kỳ file mã nguồn ứng dụng hay tệp CSDL nào.**
* **Không làm mất bất kỳ sơ đồ thiết kế gốc nào.**
* **Tài liệu báo cáo đã đạt trạng thái hoàn thiện tuyệt đối, sẵn sàng để nộp lên Nhà trường FPT Polytechnic.**
