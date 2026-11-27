# BÁO CÁO KIỂM TOÁN TÀI LIỆU ASM — VAMOS STORE
**Mã tài liệu:** `REPORT_AUDIT.md`  
**Dự án:** Xây dựng Website bán giày dép VAMOS STORE  
**Thời điểm thực hiện:** 17/11/2026  
**Đơn vị thực hiện:** Technical Documentation Lead & Software Architect (FPT Polytechnic)  
**Git Baseline:** Branch `fix/master-repair-plan` | Commit HEAD `8135e190c69553be8f6ebf3eab7ba34de995d53c`

---

## 1. MỤC TIÊU VÀ PHẠM VI KIỂM TOÁN

Thực hiện rà soát, đối chiếu toàn diện bản báo cáo dự án tốt nghiệp / Assignment hiện tại (`report/BAO_CAO_DATN_VAMOS_STORE.md` và các chương trong `report/01_front_matter` đến `report/09_references`) với:
1. Hiện thực mã nguồn thực tế trong `src/` và `server.js`.
2. Định nghĩa cơ sở dữ liệu Microsoft SQL Server trong `database/mssql_schema.sql` và các file migrations.
3. Bộ sơ đồ UML đã nghiệm thu (Use Case, Sitemap, Physical ERD, Activity Diagrams, Class Diagrams CD01 – CD06D).
4. Các bộ kịch bản kiểm thử thực tế trong `tests/` và cấu hình triển khai trong `docker-compose.yml`, `Dockerfile`.

---

## 2. DANH SÁCH LỖI VÀ MÂU THUẪN PHÁT HIỆN TRƯỚC KHI CHỈNH SỬA

### Nhóm 1: Sai lệch thông tin công nghệ & Kiến trúc cốt lõi (Global / Chapter I)
| Mã lỗi | Vị trí trong báo cáo cũ | Nội dung trong báo cáo cũ | Hiện thực thực tế trong Repository | Đánh giá mức độ |
|:---:|:---|:---|:---|:---:|
| **ERR-01** | Bìa, Chương I (tr. 19), Chương V, VI | Khẳng định hệ thống sử dụng **Microsoft SQL Server 2025**. | `docker-compose.yml` cấu hình image `mcr.microsoft.com/mssql/server:2022-latest` (Microsoft SQL Server 2022). | **Nghiêm trọng** (Cần chuẩn hóa thành SQL Server 2022). |
| **ERR-02** | Chương I (tr. 15–17), Chương III | Khẳng định toàn bộ hệ thống áp dụng kiến trúc 5 tầng đồng nhất (Router $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Database). | Thực tế kiến trúc hỗn hợp: Phân hệ Admin (`AdminController`), Giỏ hàng (`CartController`), Xác thực (`AuthController`) áp dụng mô hình **Two-Tier (Controller trực tiếp truy vấn Database Helper)**. Chỉ `OrderService`, `ProductService`, `WishlistService` có Service/Repository. | **Nghiêm trọng** (Mô tả sai bản chất kiến trúc code). |
| **ERR-03** | Chương I (tr. 20) | Khẳng định cookie Session có cờ `SameSite=Strict`. | `src/config/app.config.js:29` cấu hình `sameSite: 'lax'`, `name: 'vamos_sid'`. | **Trung bình** |
| **ERR-04** | Toàn bộ tài liệu | Khẳng định quy trình Khôi phục mật khẩu (UC-03) đã hoàn thành trọn vẹn kèm gửi email. | Bảng `password_reset_tokens` tồn tại trong DDL, nhưng chưa có email transport và chưa có giao diện web hoàn chỉnh. | **Nghiêm trọng** (Tuyên bố tính năng chưa hoàn thiện). |

---

### Nhóm 2: Mâu thuẫn Nghiệp vụ, Use Case & Sitemap (Chapter II)
| Mã lỗi | Vị trí trong báo cáo cũ | Nội dung trong báo cáo cũ | Chuẩn hóa theo Yêu cầu & Source Code | Đánh giá mức độ |
|:---:|:---|:---|:---|:---:|
| **ERR-05** | Mục 2.1.B & 2.1.C (tr. 25–26) | - `UC08` gọi là "Áp dụng mã giảm giá"<br>- `UC09` gọi là "Xem danh sách đơn hàng"<br>- `UC10` gọi là "Hủy đơn hàng" | Danh mục 14 Use Case chuẩn hóa:<br>- `UC07` – Đặt hàng COD<br>- `UC08` – Tra cứu và theo dõi đơn hàng<br>- `UC09` – Hủy đơn hàng<br>- `UC10` – Admin xử lý và cập nhật đơn hàng<br>- `UC13` – Quản lý mã giảm giá | **Rất nghiêm trọng** (Lệch toàn bộ bảng mã Use Case). |
| **ERR-06** | Mục 2.1 (tr. 23–27) | Thiếu đặc tả cho 4 Use Case phân hệ Admin: `UC11` (Quản lý kho), `UC12` (Quản lý sản phẩm & danh mục), `UC13` (Quản lý voucher), `UC14` (Báo cáo doanh thu). | Phải bổ sung đầy đủ bảng đặc tả Use Case cho toàn bộ 14 Use Case đã chuẩn hóa. | **Nghiêm trọng** (Thiếu phạm vi đồ án). |
| **ERR-07** | Mục 2.2 (Sitemap, tr. 29) | Chưa thể hiện rõ vùng quản trị Khách hàng (Customer Management) và Quản lý Banner trang chủ. | Bổ sung đầy đủ 28 route tương ứng với phân vùng Public, Customer và Admin. | **Trung bình** |

---

### Nhóm 3: Sai lệch Mô hình Dữ liệu ERD & Data Dictionary (Chapter II)
| Mã lỗi | Vị trí trong báo cáo cũ | Nội dung trong báo cáo cũ | Hiện thực thực tế trong DDL & Migrations | Đánh giá mức độ |
|:---:|:---|:---|:---|:---:|
| **ERR-08** | Mục 2.3 & 2.4 (tr. 30–44) | Báo cáo ghi "Mô hình ERD 18 thực thể" và chỉ liệt kê 18 bảng từ Bảng 2 đến Bảng 19. | Cơ sở dữ liệu có **20 bảng nghiệp vụ**: Bị bỏ sót hoàn toàn 2 bảng: `voucher_usages` (Migration 003) và `wishlist_items` (Migration 004). Bảng `schema_migrations` là bảng kỹ thuật, không tính vào bảng nghiệp vụ. | **Rất nghiêm trọng** (Bỏ sót thực thể CSDL). |
| **ERR-09** | Từ điển dữ liệu (tr. 33–44) | Dùng kiểu dữ liệu MySQL (`VARCHAR` thay vì `NVARCHAR`, `Auto Increment` thay vì `IDENTITY(1,1)`). | Toàn bộ DDL chạy trên Microsoft SQL Server dùng `NVARCHAR`, `INT IDENTITY(1,1)`, `DATETIME2`. | **Nghiêm trọng** (Nhầm lẫn hệ quản trị CSDL). |
| **ERR-10** | Bảng `cart_items` & `order_items` | Tên cột định danh biến thể bị nhầm lẫn giữa các bảng. | - `cart_items.variant_id`<br>- `inventory_transactions.variant_id`<br>- `order_items.product_variant_id` (Phải ghi chính xác theo DDL). | **Nghiêm trọng** |
| **ERR-11** | Bảng `password_reset_tokens` | Ghi tên cột token là `token`. | DDL thực tế tại `mssql_schema.sql:190` là `token_hash NVARCHAR(255) NOT NULL UNIQUE`. | **Nghiêm trọng** |
| **ERR-12** | Ràng buộc Unique & Filtered Index | Bỏ sót các ràng buộc duy nhất cốt lõi bảo vệ toàn vẹn dữ liệu. | Thiếu:<br>- `UNIQUE (product_id, size_id, color_id)` trên `product_variants`<br>- `UNIQUE (cart_id, variant_id)` trên `cart_items`<br>- `UNIQUE (voucher_id, user_id)` trên `voucher_usages`<br>- `UNIQUE (user_id, product_id)` trên `wishlist_items`<br>- Filtered index `addresses(user_id) WHERE is_default = 1`. | **Nghiêm trọng** |

---

### Nhóm 4: Cú pháp T-SQL & Code giả định trong Báo cáo (Chapter II, III)
| Mã lỗi | Vị trí trong báo cáo cũ | Nội dung trong báo cáo cũ | Hiện thực thực tế trong Source Code | Đánh giá mức độ |
|:---:|:---|:---|:---|:---:|
| **ERR-13** | Sơ đồ Activity Diagram & Chương III | Dùng cú pháp MySQL `FOR UPDATE`, `NOW()`, `GREATEST()`. | SQL Server sử dụng Table Hint `WITH (UPDLOCK, ROWLOCK)`, `GETDATE()`, và mệnh đề `CASE WHEN`. | **Nghiêm trọng** |
| **ERR-14** | Chương III (tr. 64–79) | Viết các file và class không tồn tại: `AuthService.js`, `InventoryService.js`, `UserRepository.js`, `CartRepository.js`, `pool.getConnection()`, `connection.beginTransaction()`. | Mã nguồn thực tế chạy trên `src/controllers/auth.controller.js`, `src/services/order.service.js` với `new sql.Transaction(pool)`. | **Rất nghiêm trọng** (Code giả định). |

---

### Nhóm 5: Sai lệch Đánh số hình ảnh & Bảo mật thông tin (Front Matter, Chapter IV, V)
| Mã lỗi | Vị trí trong báo cáo cũ | Nội dung trong báo cáo cũ | Hiện thực thực tế cần chuẩn hóa | Đánh giá mức độ |
|:---:|:---|:---|:---|:---:|
| **ERR-15** | Danh mục hình ảnh (tr. 5) | Đánh số nhảy cóc từ `Hình 14` sang thẳng `Hình 17` (thiếu Hình 15 và Hình 16). | Đánh lại số thứ tự hình ảnh liên tục, chính xác từ Hình 1 đến Hình 24. | **Trung bình** |
| **ERR-16** | Chương IV (tr. 80–83) | Tuyên bố "25 / 25 kịch bản (Pass 100%)", không có bằng chứng test suite tự động. | Phân định rõ Test Cases thiết kế (25 ca chức năng) và Test Scripts tự động (Unit validator 29 ca pass, Pug 39 templates pass). | **Nghiêm trọng** |
| **ERR-17** | Chương V (tr. 84–86) | Để lộ mật khẩu `MSSQL_SA_PASSWORD: "VamosPassSecure2025!"` và khẳng định domain `vamos.store` đã chạy online. | Thay thế bằng biến môi trường bảo mật, ghi rõ hệ thống hiện vận hành trên môi trường Local & Docker Compose. | **Nghiêm trọng** (Rủi ro an toàn thông tin). |
| **ERR-18** | Lời cam kết (tr. 2) | Ghi trạng thái "(Đã ký)" khi thực tế báo cáo chưa ký tên. | Đổi thành vị trí ký tên trang trọng của Trưởng nhóm, không ghi "(Đã ký)". | **Thấp** |

---

## 3. KẾT LUẬN KIỂM TOÁN
Bản báo cáo cũ có 18 lỗi sai lệch đáng kể so với hiện thực mã nguồn và cơ sở dữ liệu. Cần tiến hành tái cấu trúc, chuẩn hóa toàn diện từ Chương I đến Chương VI, tập trung ưu tiên cao nhất vào **Chương II (Phân tích và Thiết kế hệ thống)** để phục vụ thuyết trình đồ án.
