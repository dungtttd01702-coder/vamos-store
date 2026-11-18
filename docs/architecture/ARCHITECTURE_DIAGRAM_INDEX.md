# MỤC LỤC VÀ DANH MỤC SƠ ĐỒ KIẾN TRÚC HỆ THỐNG
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE — GIAI ĐOẠN 3.2

> **Tiêu chuẩn học thuật:** Chuẩn hóa theo UML 2.5 cho đồ án tốt nghiệp FPT Polytechnic / Assignment Phân tích Thiết kế Hệ thống.  
> **Nguyên tắc đối soát:** Mỗi sơ đồ đều được xây dựng từ việc phân tích mã nguồn thực tế (Express.js, Pug, MSSQL Connection Pool, SQL Server Database), có mã nguồn `.puml` tương ứng và tệp ảnh kết xuất `.png` đã được nghiệm thu thực tế.  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | Git HEAD `8135e19`.

---

## 1. BẢNG TỔNG HỢP TOÀN BỘ 10 SƠ ĐỒ KIẾN TRÚC (10 DIAGRAMS)

| STT | Mã sơ đồ | Tên sơ đồ kiến trúc | Loại sơ đồ UML | Mục đích kỹ thuật | Liên kết File PlantUML | Liên kết File Ảnh PNG | Dung lượng ảnh |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | **AR01** | Sơ đồ Kiến trúc Tổng quan Hệ thống | System Architecture Overview | Toàn cảnh 3 tầng: Client, Application Server (Express/Node.js) và Database (SQL Server 21 bảng). | [SYSTEM_ARCHITECTURE_OVERVIEW.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/SYSTEM_ARCHITECTURE_OVERVIEW.puml) | [SYSTEM_ARCHITECTURE_OVERVIEW.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/SYSTEM_ARCHITECTURE_OVERVIEW.png) | 175,828 B |
| 2 | **AR02** | Sơ đồ Kiến trúc Phân tầng | Layered Architecture | Chi tiết 6 tầng: Presentation $\rightarrow$ Routing & Middleware $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Data Access $\rightarrow$ Database. | [LAYERED_ARCHITECTURE.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/LAYERED_ARCHITECTURE.puml) | [LAYERED_ARCHITECTURE.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/LAYERED_ARCHITECTURE.png) | 204,825 B |
| 3 | **AR03** | Sơ đồ Thành phần Tổng quan | Component Overview | Phân chia thành phần giao diện, hạ tầng middleware, 8 module nghiệp vụ, 2 repository, Connection Pool và CSDL. | [COMPONENT_DIAGRAM_OVERVIEW.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/COMPONENT_DIAGRAM_OVERVIEW.puml) | [COMPONENT_DIAGRAM_OVERVIEW.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/COMPONENT_DIAGRAM_OVERVIEW.png) | 126,946 B |
| 4 | **AR04** | Sơ đồ Thành phần: Xác thực & Tài khoản | Module Component: Auth | Thể hiện luồng login/register, mã hóa bcryptjs, session.regenerate, mergeGuestCart và ghi chú học thuật về Password Reset. | [AUTH_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/AUTH_COMPONENT_DIAGRAM.puml) | [AUTH_COMPONENT_DIAGRAM.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/AUTH_COMPONENT_DIAGRAM.png) | 121,870 B |
| 5 | **AR05** | Sơ đồ Thành phần: Danh mục & Sản phẩm | Module Component: Catalog | Thể hiện phân hệ catalog, lọc đa tiêu chí, API live search thời gian thực, chi tiết biến thể và product.repository.js. | [CATALOG_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/CATALOG_COMPONENT_DIAGRAM.puml) | [CATALOG_COMPONENT_DIAGRAM.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/CATALOG_COMPONENT_DIAGRAM.png) | 117,393 B |
| 6 | **AR06** | Sơ đồ Thành phần: Giỏ hàng & Yêu thích | Module Component: Shopping | Mô hình giỏ hàng kép (Guest Session Cart có Live DB Sync vs Customer DB Cart) và 1-click Wishlist Toggle (`wishlist.service.js`). | [SHOPPING_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/SHOPPING_COMPONENT_DIAGRAM.puml) | [SHOPPING_COMPONENT_DIAGRAM.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/SHOPPING_COMPONENT_DIAGRAM.png) | 125,029 B |
| 7 | **AR07** | Sơ đồ Thành phần: Đặt hàng COD | Module Component: Order & Checkout | Thể hiện quy trình COD Transaction: `POST /checkout`, khóa giỏ hàng, tính ship 30k/0đ, voucher 1 lần/khách, trừ kho, snapshot, xóa giỏ. | [ORDER_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/ORDER_COMPONENT_DIAGRAM.puml) | [ORDER_COMPONENT_DIAGRAM.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/ORDER_COMPONENT_DIAGRAM.png) | 139,939 B |
| 8 | **AR08** | Sơ đồ Thành phần: Quản trị Hệ thống | Module Component: Admin | Thể hiện toàn bộ phân hệ admin: Order State Machine, điều chỉnh kho phi âm, quản lý sản phẩm, voucher, khách hàng (chặn khóa Admin). | [ADMIN_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/ADMIN_COMPONENT_DIAGRAM.puml) | [ADMIN_COMPONENT_DIAGRAM.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/ADMIN_COMPONENT_DIAGRAM.png) | 125,506 B |
| 9 | **AR09** | Sơ đồ Thành phần: Dashboard Báo cáo | Module Component: Dashboard | Thể hiện cơ chế `Promise.all` 9 truy vấn song song + 1 truy vấn đơn khẩn cấp và nguyên tắc Doanh thu thực thu (`COMPLETED` VÀ `PAID`). | [DASHBOARD_COMPONENT_DIAGRAM.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/DASHBOARD_COMPONENT_DIAGRAM.puml) | [DASHBOARD_COMPONENT_DIAGRAM.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/DASHBOARD_COMPONENT_DIAGRAM.png) | 149,840 B |
| 10 | **AR10** | Sơ đồ Vận hành & Triển khai | Deployment Architecture | Mô hình phần cứng & runtime: Client Device (Browser) $\leftrightarrow$ App Server (Node.js/Express) $\leftrightarrow$ DB Server (SQL Server). | [DEPLOYMENT_ARCHITECTURE.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/DEPLOYMENT_ARCHITECTURE.puml) | [DEPLOYMENT_ARCHITECTURE.png](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/architecture/DEPLOYMENT_ARCHITECTURE.png) | 148,906 B |

---

## 2. HƯỚNG DẪN TRÌNH BÀY BẢO VỆ ĐỒ ÁN (DEFENSE GUIDE)

Khi sinh viên đứng trước Hội đồng Chấm thi tốt nghiệp / Giảng viên hướng dẫn, nên sử dụng bộ sơ đồ này theo trình tự logic:
1. **Bắt đầu bằng Sơ đồ AR01 (System Architecture Overview):** Giới thiệu bức tranh toàn cảnh 3 tầng công nghệ: Node.js/Express ở giữa làm máy chủ ứng dụng, Pug SSR phía trước phục vụ SEO và SQL Server 2019/2022 phía sau lưu trữ dữ liệu bền vững.
2. **Đi sâu vào Sơ đồ AR02 (Layered Architecture):** Chứng minh tính chuyên nghiệp trong thiết kế phần mềm qua việc phân tách 6 tầng rành mạch, nhấn mạnh chuỗi 8 bước Middleware bảo mật OWASP (Security headers, CSRF token, Session lax, Route guards).
3. **Trình bày Sơ đồ AR03 (Component Overview):** Chứng minh hệ thống được module hóa cao độ, các bộ điều khiển được chia nhỏ theo nghiệp vụ, giảm thiểu sự phụ thuộc chéo.
4. **Minh họa các phân hệ then chốt (AR04 đến AR09):**
   - **AR07 (Đặt hàng COD):** Nhấn mạnh giải pháp chống bán quá tồn kho (Over-selling) bằng Transaction và khóa dòng bi quan `UPDLOCK, ROWLOCK`.
   - **AR09 (Dashboard):** Giải thích nguyên tắc kế toán tài chính chỉ ghi nhận doanh thu thực thu (`COMPLETED` + `PAID`) và kỹ thuật tối ưu truy vấn bất đồng bộ bằng `Promise.all`.
5. **Kết thúc bằng Sơ đồ AR10 (Deployment Architecture):** Thể hiện rõ mô hình triển khai thực tế trên máy chủ, phân tích việc quản lý tài nguyên thông qua Connection Pool (tối đa 10 kết nối) và cơ chế tắt máy chủ an toàn Graceful Shutdown.

---

*Tài liệu thuộc Báo cáo Thiết kế Kiến trúc Hệ thống VAMOS STORE.*
