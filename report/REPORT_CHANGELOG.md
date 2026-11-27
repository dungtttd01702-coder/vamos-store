# NHẬT KÝ THAY ĐỔI VÀ HOÀN THIỆN BÁO CÁO — VAMOS STORE
**Mã tài liệu:** `REPORT_CHANGELOG.md`  
**Dự án:** Website bán giày dép VAMOS STORE  
**Thời điểm cập nhật:** 17/11/2026

---

## 1. TỔNG QUAN CÁC HẠNG MỤC ĐÃ ĐƯỢC CHUẨN HÓA

### Hạng mục 1: Chuẩn hóa Thông tin cốt lõi & Phiên bản Công nghệ
- Đổi phiên bản CSDL từ giả định "Microsoft SQL Server 2025" thành **Microsoft SQL Server 2022** (khớp `docker-compose.yml` image `mcr.microsoft.com/mssql/server:2022-latest`).
- Chuẩn hóa chính xác 3 tác nhân: **Guest**, **Customer**, **Admin** (loại bỏ vai trò Staff riêng biệt theo quyết định thiết kế).
- Chuẩn hóa danh mục **14 Use Case** từ `UC01` đến `UC14`, khắc phục hoàn toàn sự lệch mã trong bản cũ.
- Làm rõ tính năng `UC03` (Khôi phục mật khẩu): Đã thiết kế cấu trúc bảng `password_reset_tokens` và token hash, đang ở trạng thái chờ tích hợp Email Service.

### Hạng mục 2: Tái cấu trúc toàn diện Chương II (Ưu tiên cao nhất)
- **Mục 1 (Phân tích nghiệp vụ):** Viết lại chi tiết quyền hạn thực tế của 3 tác nhân dựa trên đối chiếu route, controller và middleware.
- **Mục 2.1 (Sơ đồ Use Case):**
  - Cập nhật dẫn chiếu sơ đồ tổng quát và sơ đồ chi tiết.
  - Sửa lại toàn bộ các mã Use Case trong phần mô tả quan hệ `<<include>>` và `<<extend>>`.
  - **Bổ sung Bảng đặc tả 14 Use Case tổng hợp** với đầy đủ Actor, Tiền điều kiện, Hậu điều kiện và Luồng chính.
- **Mục 2.2 (Sitemap):** Chuẩn hóa cây điều hướng 3 phân vùng (Công khai, Khách hàng, Quản trị viên) tương ứng 28 routes thực tế.
- **Mục 2.3 (Mô hình ERD):** Cập nhật mô tả thành **Mô hình thực thể quan hệ gồm 20 bảng nghiệp vụ**, phân biệt rõ bảng kỹ thuật `schema_migrations`.
- **Mục 2.4 (Từ điển dữ liệu chi tiết - Data Dictionary):**
  - Viết lại toàn bộ 20 bảng nghiệp vụ theo chuẩn T-SQL Microsoft SQL Server (`NVARCHAR`, `DECIMAL(12,0)`, `DATETIME2`, `INT IDENTITY(1,1)`).
  - Bổ sung 2 bảng bị thiếu trong bản cũ: `Bảng 19: voucher_usages` và `Bảng 20: wishlist_items`.
  - Đánh số lại thứ tự bảng liên tục từ Bảng 1 đến Bảng 20.
  - Chuẩn hóa tên cột phân biệt: `cart_items.variant_id`, `inventory_transactions.variant_id`, `order_items.product_variant_id`.
  - Ghi nhận đầy đủ các ràng buộc toàn vẹn: `UNIQUE (sku)`, `UNIQUE (product_id, size_id, color_id)`, `UNIQUE (cart_id, variant_id)`, `UNIQUE (voucher_id, user_id)`, `UNIQUE (user_id, product_id)`, và Filtered Unique Index trên `addresses(user_id) WHERE is_default = 1`.
- **Mục 2.5 (Activity Diagrams):** Cập nhật mô tả luồng giao dịch theo T-SQL Table Hints `WITH (UPDLOCK, ROWLOCK)`.
- **Mục 2.6 (Đặc tả giao diện):** Đối chiếu 10 màn hình cốt lõi với các view Pug thực tế trong `src/views/`.

### Hạng mục 3: Chuẩn hóa Chương I, III, IV, V, VI
- **Chương I (Cơ sở lý thuyết):** Sửa mô tả kiến trúc thành mô hình kết hợp (Layered MVC cho Order/Product/Wishlist và Two-Tier cho Admin/Cart); sửa cấu hình session cookie thành `SameSite=Lax`.
- **Chương III (Triển khai mã nguồn):**
  - Xóa toàn bộ code giả định và các class không tồn tại (`AuthService`, `InventoryService`, `UserRepository`, `CartRepository`, `pool.getConnection()`, `connection.beginTransaction()`, `FOR UPDATE`, `?`, `NOW()`, `GREATEST()`).
  - Thay thế bằng các trích đoạn mã nguồn thực tế: `src/controllers/auth.controller.js`, `src/services/order.service.js` (xử lý Transaction T-SQL với `new sql.Transaction(pool)`, trừ kho nguyên tử, kiểm tra voucher Rule Q8, hoàn kho khi hủy đơn), `src/config/database.js`.
- **Chương IV (Kiểm thử hệ thống):**
  - Phân định rõ 25 ca kiểm thử kịch bản chức năng và kết quả từ các bộ test script tự động thực tế (`test_validator.js` với 29 ca kiểm thử Unit Pass, `validate_pug.js` với 39 templates Pass).
  - Loại bỏ các tuyên bố quá mức; che giấu dữ liệu mật khẩu mẫu an toàn.
- **Chương V (Triển khai hệ thống):**
  - Định vị thành "Kế hoạch triển khai & Hướng dẫn cài đặt".
  - Xóa mật khẩu thật và chuỗi secret viết trực tiếp trong ví dụ, thay bằng biến môi trường an toàn.
  - Khẳng định môi trường vận hành hiện tại là Localhost và Docker Compose.
- **Chương VI (Kết luận):**
  - Phân tách rõ tính năng hoàn thành, tính năng thiết kế chờ tích hợp (UC-03 email, telemetry banner), hạn chế kỹ thuật và hướng mở rộng.
- **Phần đầu & Định dạng (Front Matter):**
  - Rà soát Lời cảm ơn, Lời cam kết (bỏ "(Đã ký)", để trống cho sinh viên ký tay).
  - Chuẩn hóa Danh mục hình ảnh: Đánh số liên tục từ Hình 1 đến Hình 24 (khắc phục lỗi nhảy cóc Hình 15-16).
  - Chuẩn hóa Danh mục bảng biểu: Bổ sung đủ 20 bảng từ điển dữ liệu (tổng cộng 25 bảng).

---

## 2. KẾT QUẢ ĐÓNG GÓI TÀI LIỆU ĐẦU RA (FINAL DELIVERABLES)

1. **`Bao_cao_ASM_VAMOS_STORE_FINAL.docx`:**
   - Dung lượng: ~19.26 MB.
   - Số lượng đoạn văn: 823 paragraphs, 30 bảng biểu định dạng chuyên nghiệp.
   - Bao gồm trang bìa chuẩn FPT Polytechnic từ `report/BIA_ASSIGNMENT_VAMOS_STORE.docx`, nhúng đầy đủ 24 hình ảnh sơ đồ kiến trúc, Use Case, ERD, Activity Diagrams và giao diện UI từ `report/images/`.
   - Typography chuẩn học thuật: Font Times New Roman 12pt, dãn dòng 1.25, tiêu đề màu Navy `#1E3A8A`.

2. **`Bao_cao_ASM_VAMOS_STORE_FINAL.pdf`:**
   - Dung lượng: ~17.41 MB.
   - Kết xuất trực tiếp từ engine Chromium headless (Playwright) với layout khổ A4 chuẩn in ấn, ngắt trang hợp lý, bảng biểu phân màu zebra striping và căn lề trang bìa chuẩn xác.

3. **Tài liệu Markdown Master:**
   - `report/BAO_CAO_DATN_VAMOS_STORE.md`: Hợp nhất toàn bộ 9 chương tài liệu đã qua kiểm toán và đồng bộ 100% với mã nguồn và CSDL.
   - `report/BAO_CAO_DATN_VAMOS_STORE_BACKUP.md`: Bản sao lưu an toàn trước khi chỉnh sửa.

4. **Bộ hồ sơ kiểm toán và truy vết kỹ thuật:**
   - `REPORT_AUDIT.md`: Báo cáo chi tiết 18 lỗi sai lệch được phát hiện trước khi sửa.
   - `REPORT_CHANGELOG.md`: Nhật ký chuẩn hóa và đóng gói.
   - `REPORT_OPEN_ISSUES.md`: Bản ghi các vấn đề mở và khuyến nghị tương lai.
   - `REPORT_EVIDENCE_MAP.md`: Ma trận truy vết 14 Use Case, 20 bảng CSDL và mã nguồn.

