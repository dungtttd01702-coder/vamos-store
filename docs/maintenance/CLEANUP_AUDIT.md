# BÁO CÁO KIỂM KÊ VÀ DỌN DẸP DỰ ÁN (CLEANUP AUDIT REPORT)
# DỰ ÁN VAMOS STORE — HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ BÁN GIÀY DÉP

> **Thời điểm thực hiện:** 18/11/2026  
> **Phạm vi kiểm toán:** Toàn bộ repository (trừ `.git`, `node_modules`, `.agents`)  
> **Nguyên tắc an toàn:** Không xóa source code, không xóa migration/database, không xóa test suite chính thức, không can thiệp báo cáo chuyên đề và hồ sơ thẩm định.

---

## 1. TỔNG HỢP KẾT QUẢ DỌN DẸP

* **Tổng số tệp tin đã rà soát:** 743 tệp tin.
* **Tổng số tệp tin rác / tạm thời đã xóa an toàn (Nhóm B):** 63 tệp tin.
* **Tổng dung lượng đã giải phóng:** 2,720,952 bytes (2.59 MB).
* **Số tệp tin giữ lại sau khi kiểm tra:** 100% source code, tests, docs, reports, migrations.
* **Trạng thái an toàn sau khi dọn dẹp:** Website khởi động bình thường, 118/118 test regression PASSED, 40/40 Pug templates compile PASSED.

---

## 2. PHÂN LOẠI TỆP TIN THEO 4 NHÓM AN TOÀN

### Nhóm A — Giữ lại tuyệt đối (Core Assets & Deliverables)
* **Source code đang sử dụng:** Toàn bộ thư mục `src/` (Controllers, Models, Services, Middlewares, Routes, Views Pug, CSS, JS tĩnh).
* **Cơ sở dữ liệu & Migrations:** Thư mục `database/` (`mssql_schema.sql`, `migrations/`, `seed_products.js`, `init_mssql.js`).
* **Hệ thống kiểm thử chính thức:** Thư mục `tests/` (`regression_suite.js`, `validate_pug.js`, các kịch bản kiểm thử tích hợp).
* **Hồ sơ nghiệm thu & Báo cáo:** `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/` (50 tệp tin hoàn chỉnh), các bản PDF/DOCX chính thức.
* **Tài liệu kiến trúc & Sơ đồ:** Thư mục `docs/architecture/`, `docs/database/`, `docs/diagrams/`, `docs/stitch/`.

### Nhóm B — Đã xóa an toàn (Safe to Delete)
Các tệp tạm thời, script debug dùng 1 lần, ảnh render thử nghiệm và dump JSON trung gian trong thư mục `scratch/`.

### Nhóm C — Cần xem xét & Giữ lại (Preserved with Caution)
1. `database/archive_mysql_schema.sql.bak` (25,926 bytes): Bản sao lưu cấu trúc MySQL cũ, giữ lại để làm bằng chứng lịch sử chuyển đổi hệ quản trị sang SQL Server 2022.
2. `report/BAO_CAO_DATN_VAMOS_STORE_BACKUP.md` (155,575 bytes): Bản sao lưu báo cáo tổng quan, giữ lại để phòng ngừa rủi ro.

### Nhóm D — Tài nguyên Stitch (Stitch Design Assets)
Toàn bộ 16 màn hình HTML, 16 ảnh chụp PNG 2560px và 3 component trích đoạn trong `docs/stitch/` được bảo toàn nguyên vẹn.

---

## 3. DANH SÁCH CHI TIẾT CÁC TỆP TIN ĐÃ XÓA (NHÓM B)

| STT | Tên tệp tin | Đường dẫn gốc | Dung lượng (bytes) | Lý do xóa & Bằng chứng xác minh |
|:---:|---|---|:---:|---|
| 01 | `ad_cerulean.png` | `scratch\ad_cerulean.png` | 180,397 | Ảnh render thử nghiệm sơ đồ hoạt động với giao diện Cerulean, không thuộc tài liệu chính thức |
| 02 | `ad_spacelab.png` | `scratch\ad_spacelab.png` | 190,212 | Ảnh render thử nghiệm sơ đồ hoạt động với giao diện Spacelab, không thuộc tài liệu chính thức |
| 03 | `modern_ad.png` | `scratch\modern_ad.png` | 107,224 | Ảnh render thử nghiệm sơ đồ hoạt động, đã được thay thế bằng 11 sơ đồ chuẩn trong docs/diagrams/activity |
| 04 | `modern_erd_result.png` | `scratch\modern_erd_result.png` | 309,798 | Ảnh render thử nghiệm sơ đồ ERD, đã có sơ đồ chính thức trong docs/diagrams/erd |
| 05 | `test_erd_kroki.png` | `scratch\test_erd_kroki.png` | 132,525 | Ảnh test kết nối API Kroki render sơ đồ ERD, không còn sử dụng |
| 06 | `test_kroki_direct.png` | `scratch\test_kroki_direct.png` | 309,798 | Ảnh test kết nối API Kroki direct render, trùng lặp và không còn sử dụng |
| 07 | `test_swimlane_login.png` | `scratch\test_swimlane_login.png` | 18,779 | Ảnh render thử nghiệm swimlane login đơn giản, đã có bản chính thức trong docs/diagrams/activity |
| 08 | `test_syntax_out.png` | `scratch\test_syntax_out.png` | 6,462 | Ảnh test cú pháp PlantUML, kích thước nhỏ không có giá trị lưu trữ |
| 09 | `theme_cerulean.png` | `scratch\theme_cerulean.png` | 15,116 | Ảnh test theme giao diện PlantUML, không sử dụng |
| 10 | `theme_spacelab.png` | `scratch\theme_spacelab.png` | 18,058 | Ảnh test theme giao diện PlantUML, không sử dụng |
| 11 | `theme_vibrant.png` | `scratch\theme_vibrant.png` | 5,847 | Ảnh test theme giao diện PlantUML, không sử dụng |
| 12 | `uc-02.png` | `scratch\uc-02.png` | 64,766 | Ảnh test render use case mua hàng, đã có bản chính thức trong docs/diagrams/use-case/ |
| 13 | `uc-04.png` | `scratch\uc-04.png` | 68,435 | Ảnh test render use case admin, đã có bản chính thức trong docs/diagrams/use-case/ |
| 14 | `img1.jpg` | `scratch\img1.jpg` | 74,390 | Bản sao ảnh chụp màn hình tạm của người dùng gửi qua chat, đã xử lý xong |
| 15 | `img2.jpg` | `scratch\img2.jpg` | 250,241 | Bản sao ảnh chụp màn hình tạm của người dùng gửi qua chat, đã xử lý xong |
| 16 | `wishlist_rendered.html` | `scratch\wishlist_rendered.html` | 101,033 | Tệp HTML tạm dùng để Puppeteer chụp ảnh trang wishlist, đã hoàn tất và lưu ảnh vào báo cáo |
| 17 | `stitch_img_15095479143853552351.png` | `scratch\stitch_img_15095479143853552351.png` | 98,177 | Ảnh tạm tải từ Stitch, đã đồng bộ sang docs/stitch/images/17_... |
| 18 | `stitch_img_8768283991846948996.png` | `scratch\stitch_img_8768283991846948996.png` | 310,774 | Ảnh tạm tải từ Stitch, đã đồng bộ sang docs/stitch/images/18_... |
| 19 | `stitch_img_14011554995619678628.png` | `scratch\stitch_img_14011554995619678628.png` | 120,959 | Ảnh tạm tải từ Stitch, đã đồng bộ sang docs/stitch/images/19_... và src/public/images/ |
| 20 | `generate_static_assets.py` | `scratch\generate_static_assets.py` | 3,440 | Script tạm tạo tài nguyên tĩnh ban đầu, đã chạy xong và tài nguyên đã tạo thành công |
| 21 | `alter_fk.js` | `scratch\alter_fk.js` | 856 | Script chạy truy vấn DDL thử nghiệm một lần trên DB test, không thuộc source code dự án |
| 22 | `apply_modern_erd.js` | `scratch\apply_modern_erd.js` | 10,792 | Script thử nghiệm styling ERD một lần, đã hoàn tất |
| 23 | `audit_phase2_deep.js` | `scratch\audit_phase2_deep.js` | 3,909 | Script kiểm tra sâu phase 2 tạm thời, đã hoàn tất |
| 24 | `bisect_erd.js` | `scratch\bisect_erd.js` | 671 | Script debug cú pháp PlantUML nhị phân, đã sửa xong lỗi cú pháp |
| 25 | `check_compile_banners.js` | `scratch\check_compile_banners.js` | 930 | Script kiểm tra biên dịch banner tạm thời |
| 26 | `check_dash_content.js` | `scratch\check_dash_content.js` | 1,242 | Script kiểm tra nội dung dashboard tạm thời |
| 27 | `check_docs.js` | `scratch\check_docs.js` | 1,115 | Script kiểm tra tệp tài liệu tạm thời |
| 28 | `check_html.js` | `scratch\check_html.js` | 417 | Script kiểm tra HTML tạm thời |
| 29 | `check_photos.js` | `scratch\check_photos.js` | 1,373 | Script kiểm tra URL ảnh sản phẩm tạm thời |
| 30 | `check_uq.js` | `scratch\check_uq.js` | 1,582 | Script kiểm tra ràng buộc unique index tạm thời |
| 31 | `check_repo_images.py` | `scratch\check_repo_images.py` | 1,444 | Script kiểm tra URL ảnh trong Pug tạm thời |
| 32 | `db_metadata.json` | `scratch\db_metadata.json` | 72,582 | Tệp JSON dump metadata database tạm thời |
| 33 | `deep_metadata_clean.json` | `scratch\deep_metadata_clean.json` | 34,484 | Tệp JSON dump metadata database đã dọn dẹp tạm thời |
| 34 | `extract_db_metadata.js` | `scratch\extract_db_metadata.js` | 3,522 | Script trích xuất metadata database tạm thời |
| 35 | `extract_fast.js` | `scratch\extract_fast.js` | 2,952 | Script trích xuất nhanh metadata tạm thời |
| 36 | `extract_schema.py` | `scratch\extract_schema.py` | 2,176 | Script trích xuất schema database tạm thời |
| 37 | `fetch_sonar_issues.js` | `scratch\fetch_sonar_issues.js` | 2,603 | Script tải issue từ SonarCloud tạm thời |
| 38 | `fix_banners_pug.js` | `scratch\fix_banners_pug.js` | 904 | Script sửa file Pug banner tạm thời, đã hoàn tất |
| 39 | `full_db_schema.json` | `scratch\full_db_schema.json` | 31,992 | Tệp JSON trích xuất schema tạm thời |
| 40 | `generate_data_dictionary.js` | `scratch\generate_data_dictionary.js` | 30,394 | Script tạo data dictionary tạm thời, đã tạo tài liệu chính thức trong docs/database/ |
| 41 | `init_study_guide.py` | `scratch\init_study_guide.py` | 285 | Script khởi tạo khung study guide tạm thời |
| 42 | `inspect_all_products.js` | `scratch\inspect_all_products.js` | 704 | Script kiểm tra sản phẩm trong database tạm thời |
| 43 | `live_full_check.js` | `scratch\live_full_check.js` | 16,338 | Script kiểm tra live hệ thống tạm thời |
| 44 | `master_prompt.md` | `scratch\master_prompt.md` | 47,795 | Bản sao lưu nội dung prompt cũ, không thuộc tài liệu chính thức |
| 45 | `parse_audit.js` | `scratch\parse_audit.js` | 977 | Script phân tích kết quả audit tạm thời |
| 46 | `read_steps.py` | `scratch\read_steps.py` | 573 | Script đọc các bước transcript tạm thời |
| 47 | `read_steps2.py` | `scratch\read_steps2.py` | 543 | Script đọc các bước transcript tạm thời |
| 48 | `render_all_labs_puml.js` | `scratch\render_all_labs_puml.js` | 2,651 | Script render PlantUML cho thư mục labs tạm thời |
| 49 | `render_all_sd.js` | `scratch\render_all_sd.js` | 687 | Script render sequence diagram tạm thời |
| 50 | `render_modern_erd.js` | `scratch\render_modern_erd.js` | 10,845 | Script render ERD hiện đại thử nghiệm, đã có render_puml.js |
| 51 | `test_account_session.js` | `scratch\test_account_session.js` | 2,978 | Script test session người dùng đơn lẻ, không nằm trong regression suite chính thức |
| 52 | `test_ad.js` | `scratch\test_ad.js` | 2,536 | Script test activity diagram đơn lẻ |
| 53 | `test_erd_modern.js` | `scratch\test_erd_modern.js` | 1,074 | Script test render ERD đơn lẻ |
| 54 | `test_erd_syntax.js` | `scratch\test_erd_syntax.js` | 11,509 | Script test cú pháp ERD đơn lẻ |
| 55 | `test_modern_ad.js` | `scratch\test_modern_ad.js` | 2,930 | Script test activity diagram đơn lẻ |
| 56 | `test_snippets.js` | `scratch\test_snippets.js` | 802 | Script test trích đoạn code đơn lẻ |
| 57 | `test_styled_erd.js` | `scratch\test_styled_erd.js` | 8,348 | Script test giao diện ERD đơn lẻ |
| 58 | `test_swimlane.py` | `scratch\test_swimlane.py` | 1,352 | Script test cú pháp swimlane đơn lẻ |
| 59 | `test_themes.js` | `scratch\test_themes.js` | 966 | Script test theme PlantUML đơn lẻ |
| 60 | `update_lab4_images.js` | `scratch\update_lab4_images.js` | 3,272 | Script cập nhật ảnh cho Lab 4 tạm thời, đã chạy xong |
| 61 | `update_report.js` | `scratch\update_report.js` | 9,625 | Script cập nhật báo cáo cũ, đã có quy trình build mới |
| 62 | `validate_lab_images.js` | `scratch\validate_lab_images.js` | 1,197 | Script kiểm tra ảnh Lab tạm thời |
| 63 | `verify_consistency.js` | `scratch\verify_consistency.js` | 594 | Script kiểm tra tính nhất quán tạm thời |

---

## 4. DANH SÁCH CÁC CÔNG CỤ TIỆN ÍCH ĐƯỢC GIỮ LẠI TRONG `scratch/`

Nhằm phục vụ việc biên dịch lại báo cáo hoặc render lại sơ đồ khi cần thiết, các script tự động hóa chuẩn được bảo lưu:
1. `rebuild_all_outputs.py`: Script tổng điều phối build lại toàn bộ HTML, DOCX và PDF.
2. `render_puml.js`: Công cụ gọi Kroki/PlantUML render sơ đồ.
3. `render_simplified_activity_diagrams.py`: Bộ sinh 11 sơ đồ hoạt động 2 Swimlanes.
4. `render_wishlist_page.js`: Bộ render và chụp ảnh giao diện wishlist thực tế qua Puppeteer.
5. `generate_erd_study_guide.py`: Bộ biên soạn cẩm nang nghiên cứu ERD chuyên sâu.
6. `update_dossier_docs.py`: Công cụ đồng bộ tài liệu hồ sơ thẩm định.
7. `sync_report_markdowns.py`: Công cụ đồng bộ văn bản báo cáo.

---

## 5. KẾT LUẬN KIỂM TOÁN

Thư mục làm việc của dự án VAMOS STORE đã được dọn dẹp sạch sẽ, loại bỏ hoàn toàn các tệp thử nghiệm dư thừa, giải phóng bộ nhớ và giữ vững tính toàn vẹn 100% của hệ thống.
