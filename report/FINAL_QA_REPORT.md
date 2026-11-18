# BÁO CÁO NGHIỆM THU VÀ KIỂM TOÁN CHẤT LƯỢNG CUỐI CÙNG (FINAL QA REPORT)
## DỰ ÁN: XÂY DỰNG WEBSITE BÁN GIÀY DÉP VAMOS STORE
**Đơn vị đào tạo:** Trường Cao đẳng Thực hành FPT Polytechnic  
**Chuyên ngành:** Công nghệ Thông tin (Ứng dụng Phần mềm / Lập trình Web)  
**Nhóm sinh viên thực hiện:**
1. **Trần Trung Dũng** - MSSV: TD01702 (Trưởng nhóm)
2. **Trần Vĩnh Nhật** - MSSV: TD01482 (Thành viên)
3. **Trần Duy Hoàng Sa** - MSSV: TD01519 (Thành viên)  
**Giảng viên hướng dẫn:** ThS. Hoàng Hà  
**Thời điểm thực hiện kiểm toán:** Tháng 12/2026  
**Kiểm toán viên:** Technical Documentation Auditor & Software Architect

---

## 1. TỔNG QUAN VÀ MỤC ĐÍCH NGHIỆM THU

Báo cáo này là văn bản kiểm toán độc lập và toàn diện, được thực hiện nhằm rà soát và đánh giá tính sẵn sàng của toàn bộ bộ tài liệu báo cáo Đồ án tốt nghiệp / Chuyên đề ASM dự án **VAMOS STORE** trước khi sinh viên nộp chính thức lên Hội đồng Giám khảo FPT Polytechnic.

Quá trình kiểm toán tập trung xác minh 4 trụ cột cốt lõi:
1. **Tính chân thực kỹ thuật (Technical Veracity):** Toàn bộ dữ liệu, schema cơ sở dữ liệu, các hàm xử lý mã nguồn, ràng buộc nghiệp vụ và câu lệnh truy vấn phải khớp 100% với hiện trạng thực tế của kho mã nguồn (repository). Tuyệt đối không có tình trạng "vẽ thêm tính năng" hoặc bịa đặt kết quả kiểm thử.
2. **Tính nhất quán liên chương (Cross-Chapter Consistency):** Dữ liệu giữa Trang bìa, Phần mở đầu, Cơ sở lý thuyết (Chương I), Phân tích thiết kế (Chương II), Triển khai mã nguồn (Chương III), Kiểm thử (Chương IV), Triển khai (Chương V), Kết luận (Chương VI) và Danh mục tài liệu tham khảo phải thống nhất tuyệt đối về thuật ngữ, số lượng bảng biểu, sơ đồ hình ảnh và số trang mục lục.
3. **Tính toàn vẹn của mã nguồn (Source Code Integrity):** Kiểm tra an toàn Git preflight, xác nhận không có bất kỳ sửa đổi trái phép nào can thiệp vào mã nguồn nghiệp vụ `src/`, cấu hình máy chủ `server.js`, cơ sở dữ liệu `database/` hoặc các migration gốc.
4. **Chất lượng ấn phẩm xuất bản (Deliverable Quality):** Đảm bảo cả hai định dạng tài liệu nộp nộp bản mềm (`Bao_cao_ASM_VAMOS_STORE_FINAL.docx` và `Bao_cao_ASM_VAMOS_STORE_FINAL.pdf`) đều được biên dịch hoàn chỉnh, không có liên kết ảnh bị vỡ, không bị tràn lề bảng biểu, không có trang trắng và số trang trên Mục lục khớp chuẩn xác với trang thực tế.

---

## 2. KẾT QUẢ KIỂM TRA PREFLIGHT VÀ AN TOÀN HỆ THỐNG (GIT PREFLIGHT)

Hệ thống đã thực hiện kiểm tra trạng thái an toàn kho lưu trữ mã nguồn:
* **Nhánh làm việc (Current Branch):** `fix/master-repair-plan`
* **Commit HEAD đối soát:** `8135e190c69553be8f6ebf3eab7ba34de995d53c`
* **Can thiệp mã nguồn ứng dụng:** **0 file** (Không chỉnh sửa bất kỳ dòng mã nào trong `src/`, `server.js`, `database/`, migrations, seeds, Dockerfile hoặc docker-compose.yml).
* **Can thiệp tài liệu thiết kế gốc:** **0 file** (Toàn bộ các file `.puml` và `.png` kiến trúc, Use Case, ERD, Activity Diagram được bảo toàn nguyên trạng).
* **Phạm vi tác động:** Chỉ chuẩn hóa nội dung tài liệu học thuật trong thư mục `report/` và xuất bản các tệp tài liệu tổng hợp nộp đồ án.

---

## 3. THỐNG KÊ LỖI VÀ PHÂN LOẠI MỨC ĐỘ NGHIÊM TRỌNG (DEFECT CLASSIFICATION)

Sau các vòng rà soát và hiệu chỉnh chuyên sâu, bảng phân loại lỗi hiện tại đạt kết quả như sau:

| Mức độ nghiêm trọng | Định nghĩa & Tiêu chuẩn đánh giá | Số lượng phát hiện ban đầu | Số lượng đã khắc phục | Số lượng còn lại | Trạng thái nghiệm thu |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **BLOCKER (Lỗi chí mạng)** | Mâu thuẫn DDL CSDL, sai lệch logic cốt lõi, bịa đặt kết quả test tự động, tài liệu DOCX/PDF không xuất được hoặc lỗi vỡ layout nghiêm trọng. | 4 | 4 | **0** | **ĐÃ GIẢI QUYẾT 100%** |
| **MAJOR (Lỗi nghiêm trọng)** | Sai lệch số lượng bảng trong Từ điển dữ liệu, thiếu bảng ma trận phân quyền, số trang Mục lục lệch khỏi trang in thực tế, mâu thuẫn phiên bản phần mềm. | 6 | 6 | **0** | **ĐÃ GIẢI QUYẾT 100%** |
| **MINOR (Lỗi nhỏ)** | Lỗi chính tả thuật ngữ, định dạng bảng chưa cân đối, thiếu chú thích bảng biểu, liên kết đường dẫn hình ảnh chưa tối ưu. | 8 | 8 | **0** | **ĐÃ GIẢI QUYẾT 100%** |
| **INFO / OPEN (Ghi chú bảo vệ)** | Các giới hạn môi trường kiểm thử (Docker daemon trên host Windows, kiểm thử tải đa luồng trên staging, dịch vụ gửi mail SMTP bên ngoài). | 3 | 3 ghi chú minh bạch | **3** | **ĐÃ MINH BẠCH HÓA TRONG BÁO CÁO** |

---

## 4. CHI TIẾT CÁC ĐIỂM ĐÃ KIỂM TOÁN VÀ ĐỐI CHIẾU THỰC TẾ

### 4.1. Đối soát cấu trúc Cơ sở dữ liệu (Database Schema & DDL Verbatim Check)
1. **Bảng `password_reset_tokens`:**
   * *Kiểm tra DDL:* Đối chiếu trực tiếp tệp `database/mssql_schema.sql` (dòng 187-195) và migration `001_initial_schema.sql` (dòng 124-132).
   * *Xác nhận:* Cột lưu trữ mã băm là `token_hash NVARCHAR(255) NOT NULL UNIQUE`. Không tồn tại cột nào tên là `token`. Bảng có khóa ngoại liên kết `user_id -> users(id) ON DELETE CASCADE`.
   * *Hiện trạng mã nguồn:* Chưa có route hoặc controller xử lý gửi email khôi phục mật khẩu.
   * *Kết quả chuẩn hóa:* Báo cáo đã chuẩn hóa cách diễn đạt: *"Chức năng khôi phục mật khẩu đã được đưa vào thiết kế và có cấu trúc dữ liệu hỗ trợ, tuy nhiên quy trình xử lý hoàn chỉnh chưa được triển khai trong phiên bản hiện tại."*
2. **Bảng `orders` - Cột snapshot địa chỉ giao hàng:**
   * *Kiểm tra DDL:* Đối chiếu trực tiếp tệp `database/mssql_schema.sql` (dòng 318) và migration `001_initial_schema.sql` (dòng 222).
   * *Xác nhận:* Cột lưu trữ là `delivery_address_snapshot NVARCHAR(255) NOT NULL`. Không sử dụng kiểu dữ liệu `NVARCHAR(500)`.
   * *Kết quả chuẩn hóa:* Toàn bộ Từ điển dữ liệu (Bảng 18) và phân tích nghiệp vụ đã thống nhất kiểu `NVARCHAR(255)`.
3. **Phiên bản Hệ quản trị Cơ sở dữ liệu:**
   * *Xác nhận:* Chuẩn hóa thống nhất 100% là **Microsoft SQL Server 2022** trên toàn bộ 9 phần của tài liệu. Loại bỏ hoàn toàn các ký tự nhầm lẫn gõ "2025".
4. **Từ điển dữ liệu (Data Dictionary):**
   * *Xác nhận:* Bao phủ đầy đủ **20 bảng nghiệp vụ thực tế** của hệ thống VAMOS STORE (`users`, `categories`, `brands`, `sizes`, `colors`, `vouchers`, `banners`, `addresses`, `password_reset_tokens`, `carts`, `products`, `product_images`, `product_variants`, `cart_items`, `orders`, `order_items`, `order_status_histories`, `inventory_transactions`, `voucher_usages`, `wishlist_items`).
   * *Đánh số thứ tự:* Được chuẩn hóa từ **Bảng 4 đến Bảng 23**, không trùng lặp số thứ tự với Bảng 1 (Tiến độ dự án), Bảng 2 (Ma trận phân quyền) và Bảng 3 (Danh sách 14 Use Case).
5. **Chỉ mục lọc độc nhất (Filtered Unique Indexes):**
   * Đã xác minh sự tồn tại của 2 Filtered Unique Index đặc thù trong MSSQL:
     * `uq_user_default_address` trên bảng `addresses(user_id) WHERE is_default = 1`.
     * `uq_product_primary_image` trên bảng `product_images(product_id) WHERE is_primary = 1`.

### 4.2. Đối soát Kết quả Kiểm thử (Testing Rigor & Zero Fake Passes)
1. **Kiểm thử tự động (Automated Test Suites):**
   * Chạy thực tế qua CLI:
     * `tests/validate_pug.js`: Biên dịch kiểm tra cú pháp 39 file mẫu giao diện Pug $\rightarrow$ **39/39 Passed (100%)**.
     * `tests/test_validator.js`: Kiểm thử kiểm tra dữ liệu đầu vào phía máy chủ $\rightarrow$ **29/29 Assertions Passed (100%)**.
     * `tests/test_audit_fixes.js`: Kiểm thử hồi quy logic $\rightarrow$ **15/15 Assertions Passed (100%)**.
     * `tests/test_phase3_theme.js`: Kiểm thử hiển thị giao diện Dark/Light $\rightarrow$ **8/8 Scenarios Passed (100%)**.
     * `tests/test_phase4_i18n.js`: Kiểm thử chuyển đổi ngôn ngữ Việt/Anh $\rightarrow$ **8/8 Scenarios Passed (100%)**.
   * *Tổng cộng:* **99 bài kiểm tra tự động độc lập**, tỷ lệ đạt **100%**. Kết quả được lưu tại Bảng 25 trong Báo cáo.
2. **Kiểm thử chấp nhận chức năng thiết kế (25 Functional Acceptance Cases):**
   * Loại bỏ hoàn toàn việc đánh dấu giả mạo "100% Pass" đối với các bài test cần môi trường staging / máy chủ production.
   * Phân loại minh bạch:
     * **24 ca kiểm thử:** Ghi nhận trạng thái **"Đã rà soát logic"** (được đối soát trực tiếp qua source code, controller, middleware và SQL query).
     * **1 ca kiểm thử (Test Case 23 - Concurrency Load):** Ghi nhận trạng thái **"Chưa xác minh (Chờ Staging)"** (lý do: môi trường kiểm thử máy trạm chưa hỗ trợ công cụ bắn tải đa luồng như Apache JMeter hay k6).

### 4.3. Xác minh Môi trường Triển khai Docker
* Đã chạy lệnh kiểm tra môi trường: `docker info`, `docker-compose --version`, `podman --version`.
* *Hiện trạng:* Máy trạm chạy Windows chưa cài đặt Docker Desktop daemon.
* *Cách xử lý minh bạch:* Báo cáo ghi rõ trạng thái tại Chương V: *"Cấu hình đã kiểm tra, chưa xác minh triển khai thực tế"*. Giữ nguyên cấu hình tệp `Dockerfile` và `docker-compose.yml` chuẩn mực để sinh viên trình bày kiến trúc triển khai trước Hội đồng.

### 4.4. Kiểm tra Chất lượng Ấn phẩm Xuất bản (DOCX & PDF Visual Verification)
1. **Tệp Microsoft Word (`Bao_cao_ASM_VAMOS_STORE_FINAL.docx`):**
   * Dung lượng tệp: **19.26 MB (19,265,437 bytes)**.
   * Cấu trúc: 9 chương hoàn chỉnh, định dạng font Times New Roman, dãn dòng 1.25, bảng biểu có header màu xanh Navy chuẩn nhận diện học thuật FPT, hình ảnh được căn giữa và có chú thích rõ ràng.
2. **Tệp Adobe PDF (`Bao_cao_ASM_VAMOS_STORE_FINAL.pdf`):**
   * Dung lượng tệp: **17.42 MB (17,422,435 bytes)**.
   * Khổ giấy: Chuẩn in ấn quốc tế **A4 (210mm x 297mm)**, tỷ lệ khung `Rect(0, 0, 595, 842)`.
   * Tổng số trang: **96 trang hoàn chỉnh**.
   * Hình ảnh: Toàn bộ **24 hình ảnh sơ đồ và giao diện** được nhúng thành công ở độ phân giải cao, không có liên kết hỏng, không tràn lề.
   * Bảng biểu: Toàn bộ **25 bảng biểu** được căn chỉnh vừa vặn trong lề trang in, văn bản tự động xuống dòng, không bị cắt xén dữ liệu.
   * Trang trắng: Đã quét tự động 96 trang qua PyMuPDF, xác nhận **0 trang trắng bất thường**.
   * Số trang Mục lục: **Khớp 100%** giữa số trang ghi trên Mục lục và vị trí thực tế của từng đề mục trong tệp PDF.

---

## 5. BẢNG TỔNG HỢP VỊ TRÍ TRANG CÁC CHƯƠNG TRONG TỆP PDF

| Tên phần / Chương | Trang thực tế trong PDF | Trang ghi trên Mục lục | Trạng thái khớp |
| :--- | :---: | :---: | :---: |
| **Trang bìa chính thức** | Trang 1 | - | Chuẩn hóa |
| **Lời cảm ơn** | Trang 2 | Trang 2 | **Khớp 100%** |
| **Lời cam kết** | Trang 3 | Trang 3 | **Khớp 100%** |
| **Mục lục** | Trang 4 - 6 | Trang 4 | **Khớp 100%** |
| **Danh mục hình ảnh** | Trang 7 - 8 | Trang 7 | **Khớp 100%** |
| **Danh mục bảng biểu** | Trang 9 - 10 | Trang 9 | **Khớp 100%** |
| **Danh mục thuật ngữ và từ viết tắt** | Trang 11 | Trang 11 | **Khớp 100%** |
| **Phần mở đầu (Introduction)** | Trang 12 - 18 | Trang 12 | **Khớp 100%** |
| **Chương I: Cơ sở lý thuyết** | Trang 19 - 25 | Trang 19 | **Khớp 100%** |
| **Chương II: Phân tích và thiết kế hệ thống** | Trang 26 - 69 | Trang 26 | **Khớp 100%** |
| **Chương III: Triển khai mã nguồn** | Trang 70 - 78 | Trang 70 | **Khớp 100%** |
| **Chương IV: Kiểm thử hệ thống** | Trang 79 - 86 | Trang 79 | **Khớp 100%** |
| **Chương V: Kế hoạch triển khai & Cài đặt** | Trang 87 - 92 | Trang 87 | **Khớp 100%** |
| **Chương VI: Hạn chế và hướng phát triển** | Trang 93 - 95 | Trang 93 | **Khớp 100%** |
| **Tài liệu tham khảo (References)** | Trang 96 | Trang 96 | **Khớp 100%** |

---

## 6. DANH MỤC CÁC TỆP BÀN GIAO CHÍNH THỨC (DELIVERABLES)

Toàn bộ các tệp tài liệu phục vụ nghiệm thu và nộp đồ án đều nằm sẵn sàng tại thư mục gốc và thư mục `report/`:

1. **Tài liệu nộp bản in / Word:**
   * [`Bao_cao_ASM_VAMOS_STORE_FINAL.docx`](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/Bao_cao_ASM_VAMOS_STORE_FINAL.docx) (19,265,437 bytes)
2. **Tài liệu nộp bản in / PDF:**
   * [`Bao_cao_ASM_VAMOS_STORE_FINAL.pdf`](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/Bao_cao_ASM_VAMOS_STORE_FINAL.pdf) (96 trang A4, 17,422,435 bytes)
3. **Mã nguồn tài liệu Markdown hoàn chỉnh:**
   * [`report/BAO_CAO_DATN_VAMOS_STORE.md`](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/report/BAO_CAO_DATN_VAMOS_STORE.md) (168.55 KB)
4. **Bộ hồ sơ kiểm toán nghiệm thu chuyên sâu:**
   * [`report/FINAL_QA_REPORT.md`](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/report/FINAL_QA_REPORT.md) (Báo cáo tổng kết nghiệm thu này)
   * [`report/FINAL_QA_CHECKLIST.md`](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/report/FINAL_QA_CHECKLIST.md) (Bảng kiểm tra chi tiết từng tiêu chí theo mẫu FPT)
   * [`report/FINAL_QA_ISSUES.md`](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/report/FINAL_QA_ISSUES.md) (Sổ tay xử lý vấn đề mở & Chiến lược bảo vệ đồ án)
   * [`report/FINAL_QA_CHANGELOG.md`](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/report/FINAL_QA_CHANGELOG.md) (Nhật ký sửa đổi kỹ thuật qua các vòng kiểm toán)

---

## 7. KẾT LUẬN NGHIỆM THU CHÍNH THỨC

Dựa trên kết quả kiểm tra nghiêm ngặt đối với toàn bộ các tiêu chí học thuật và kỹ thuật:
* Không còn bất kỳ lỗi BLOCKER hay MAJOR nào tồn đọng.
* Toàn bộ sơ đồ, bảng dữ liệu và logic xử lý đều phản ánh trung thực hiện trạng mã nguồn dự án.
* Các tệp xuất bản DOCX và PDF đạt tiêu chuẩn in ấn đồ án tốt nghiệp xuất sắc.

**ĐÁNH GIÁ NGHIỆM THU CHÍNH THỨC: READY TO SUBMIT (ĐỦ ĐIỀU KIỆN NỘP VÀ BẢO VỆ).**

*Kiểm toán viên khuyến nghị nhóm sinh viên in ấn bản PDF để nộp lưu chiểu và tham khảo kỹ tài liệu [`FINAL_QA_ISSUES.md`](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/report/FINAL_QA_ISSUES.md) để tự tin trả lời phỏng vấn trước Hội đồng Giám khảo.*
