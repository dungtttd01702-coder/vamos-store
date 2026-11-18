# BÁO CÁO KIỂM TOÁN VÀ HIỆU CHỈNH TOÀN DIỆN USE CASE (PHASE 1 FINAL AUDIT REPORT)
## DỰ ÁN VAMOS STORE — GIAI ĐOẠN 1: CHUẨN HÓA YÊU CẦU VÀ USE CASE

> **Dự án:** VAMOS STORE — Website Thương mại điện tử Bán giày chuyên nghiệp  
> **Người thực hiện:** Nhóm Chuyên gia Phân tích Thiết kế & Đảm bảo Chất lượng  
> **Vòng kiểm tra:** Kiểm toán & Hiệu chỉnh Cuối cùng (Final Review & Document Calibration)  
> **Ngày hoàn thành:** 14/11/2026  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | Git HEAD: `8135e19` (Giữ nguyên tuyệt đối)  
> **Cam kết an toàn:** Không chỉnh sửa source code, database, migration, Git history; không commit/push/merge/reset/stash.  

---

## 1. Những Nội dung Đã Kiểm tra (Scope of Audit)

Trong vòng kiểm toán cuối cùng của Giai đoạn 1, nhóm chuyên gia đã tiến hành rà soát chuyên sâu 5 nhóm trọng tâm:
1. **Kiểm tra chức năng Quản lý Sản phẩm, Danh mục, Thương hiệu và Banner (UC12):** Đối chiếu route, controller và views để xác minh chức năng Thương hiệu (Brands) và Banner có thực sự tồn tại và hoạt động hay không.
2. **Kiểm tra hiện trạng chức năng Khôi phục Mật khẩu (UC03):** Xác minh route, controller, service, giao diện và cấu trúc CSDL; phân định rõ giữa thiết kế và triển khai thực tế.
3. **Kiểm tra luồng Giỏ hàng Khách vãng lai và Thành viên (UC06):** Rà soát cơ chế lưu trữ session của Guest, cơ chế CSDL của Customer và luồng tự động gộp giỏ hàng khi đăng nhập / đăng ký.
4. **Đối soát Cơ chế Phân quyền và Mã phản hồi HTTP (RBAC & Status Codes):** Kiểm tra mã lỗi và cơ chế chuyển hướng (Redirect vs 401 vs 403) tại các middleware `requireGuest`, `requireAuth`, `requireCustomer`, `requireAdmin`.
5. **Kiểm tra Quy tắc Tồn kho và Mã giảm giá (Inventory & Voucher Rules):** Đối soát logic trừ kho tại thời điểm tạo đơn, hoàn kho khi hủy đơn, chống hoàn kho lặp, không trừ kho lần hai khi đơn `COMPLETED`, và ràng buộc 1 lần dùng voucher/khách hàng.

---

## 2. Những Lỗi và Điểm Chưa Nhất quán Đã Phát hiện

Qua quá trình rà soát trực tiếp mã nguồn, nhóm kiểm toán đã phát hiện và xử lý các điểm chưa đồng bộ sau:
1. **Chưa làm nổi bật chức năng Quản lý Thương hiệu trong UC12:** Trong phiên bản sơ khai, UC12 chỉ ghi chung là "Sản phẩm, danh mục & banner", chưa nhấn mạnh tính năng Quản lý Thương hiệu (`POST /admin/brands/create` và hiển thị trên view `categories.pug`). Điều này dẫn đến nguy cơ bị đánh giá là bỏ sót tính năng đã có trong mã nguồn.
2. **Mô tả UC03 chưa thể hiện rõ hiện trạng thiếu SMTP Backend:** Tài liệu cũ ghi nhận quy trình gửi email khôi phục mật khẩu mà chưa làm nổi bật rằng trong mã nguồn thực thi v1.0, chưa có route xử lý và chưa cấu hình thư viện SMTP (Nodemailer), gây hiểu nhầm rằng tính năng gửi mail đang hoạt động.
3. **Mô tả UC06 chưa tách bạch giữa luồng Guest và Customer:** Tài liệu cũ chưa làm rõ rằng Khách vãng lai hoàn toàn có thể thêm, sửa, xóa giỏ hàng tạm trong phiên (`req.session.guestCart`) mà không bắt buộc phải đăng nhập, và chưa mô tả rõ hàm `mergeGuestCart` được gọi tự động khi đăng nhập/đăng ký.
4. **Nhầm lẫn giữa mã lỗi HTTP 403 và HTTP 302 Redirect:** Tài liệu cũ tuyên bố chung là các tác nhân vi phạm đều nhận "HTTP 403 Forbidden", trong khi mã nguồn thực tế sử dụng `HTTP 302 Redirect` cho các trang Web HTML (`/checkout`, `/account/*`, `/admin/*`) và chỉ trả về `HTTP 403 JSON` hoặc `HTTP 401 JSON` đối với các API endpoints (`/api/wishlist/*`).
5. **Đồng bộ giữa hai thư mục sơ đồ:** Tồn tại song song hai thư mục `docs/diagrams/usecase/` và `docs/diagrams/use-case/` có thể gây sai lệch phiên bản nếu không được đồng bộ hóa nhất quán.

---

## 3. Những Tập tin Đã Hiệu chỉnh (Calibrated Files)

Nhóm chuyên gia đã cập nhật và hiệu chỉnh đồng bộ toàn bộ tài liệu và sơ đồ liên quan:

1. `docs/analysis/usecase/USE_CASE_OVERVIEW.md`: Chuẩn hóa tên 16 Use Case, cập nhật ma trận phân quyền chi tiết với mã HTTP thực tế (302 Redirect vs 401 vs 403), làm rõ cơ chế giỏ hàng phiên của Guest và cô lập Admin.
2. `docs/analysis/usecase/USE_CASE_SPECIFICATION.md`: Hiệu chỉnh toàn bộ 16 Use Case, bổ sung chi tiết 4 nhánh nghiệp vụ của UC12 (bao gồm Thương hiệu và Banner), cập nhật đúng hiện trạng `Designed Only / Not Implemented` của UC03, mô tả 2 luồng độc lập của UC06 và hàm `mergeGuestCart`.
3. `docs/analysis/usecase/USE_CASE_TRACEABILITY.md`: Cập nhật cấu trúc kiến trúc thực tế (loại bỏ tham chiếu `repositories` không tồn tại, thay bằng truy vấn trực tiếp và Domain Services), cập nhật trạng thái và bằng chứng kiểm thử cho 16 Use Case.
4. `docs/diagrams/usecase/USE_CASE_OVERVIEW.puml` & `USE_CASE_OVERVIEW.png`: Render lại với nhãn UC03 rõ ràng, phân rã 4 phân hệ và hiển thị ghi chú nghiệp vụ.
5. `docs/diagrams/usecase/uc-01-auth.puml` & `uc-01-auth.png`: Render lại với chi tiết UC03 Designed Only và UC02 Auto-merge Guest Cart.
6. `docs/diagrams/usecase/uc-02-shopping.puml` & `uc-02-shopping.png`: Render lại làm rõ 2 luồng Guest Session Cart và Customer DB Cart dưới UC06.
7. `docs/diagrams/usecase/uc-03-orders.puml` & `uc-03-orders.png`: Render lại với ghi chú kiểm chứng mã nguồn cho quy tắc tồn kho và voucher.
8. `docs/diagrams/usecase/uc-04-admin.puml` & `uc-04-admin.png`: Render lại hiển thị rõ nhánh Quản lý Thương hiệu (`ManageBrand`) và Quản lý Banner (`ManageBanners`) trong UC12.
9. Đồng bộ toàn bộ 5 file `.puml` và 5 file `.png` sang `docs/diagrams/use-case/`.

---

## 4. Bằng chứng Đối chiếu Mã nguồn (Code Reconciliation Evidence)

| Điểm nghiệp vụ | Tệp mã nguồn & Dòng code | Bằng chứng thực tế |
| :--- | :--- | :--- |
| **Quản lý Thương hiệu (Brands)** | `src/routes/admin.routes.js:35`<br>`src/controllers/admin.controller.js:744-775` | Route `POST /brands/create`, hàm `postCreateBrand` kiểm tra tên, chuẩn hóa slug tiếng Việt, INSERT vào bảng `brands`. Hiển thị danh sách thương hiệu và đếm số sản phẩm tại `getCategories` (`line 673-677`). |
| **Quản lý Banner (Banners)** | `src/routes/admin.routes.js:49-52`<br>`src/controllers/admin.controller.js:985-1048` | Các route: `GET /banners`, `POST /banners/create`, `POST /banners/:id/toggle`, `POST /banners/:id/delete`. Thao tác trực tiếp trên bảng `banners`. |
| **Hiện trạng UC03 (Khôi phục mật khẩu)** | `src/views/pages/auth/login.pug:37`<br>`database/mssql_schema.sql:187-196`<br>`src/routes/auth.routes.js:1-18` | Giao diện có thẻ link `a(href="/auth/forgot-password") Quên mật khẩu?`. CSDL có bảng `password_reset_tokens`. Tuy nhiên `auth.routes.js` **hoàn toàn chưa có route `/forgot-password`** và chưa có Nodemailer/SMTP -> Xác nhận `Designed Only / Not Implemented`. |
| **Giỏ hàng Khách vãng lai (Guest Cart)** | `src/controllers/cart.controller.js:42-121`<br>`src/controllers/cart.controller.js:235-265` | Khách vãng lai không cần login, giỏ hàng lưu mảng `req.session.guestCart`. Có Live DB Sync cập nhật giá và tồn kho thực tế mỗi lần xem giỏ hàng (`line 45-103`). |
| **Gộp Giỏ hàng khi Login / Register** | `src/controllers/auth.controller.js:122-126, 288-293`<br>`src/controllers/cart.controller.js:686-745` | Khi login hoặc register, gọi hàm tĩnh `CartController.mergeGuestCart(cartId, guestCart)`. Tự động cộng dồn số lượng vào `cart_items` (ràng buộc tối đa 10 đôi), xóa `guestCart` và cập nhật `cartCount`. |
| **Phân quyền Guest -> Customer Pages** | `src/middlewares/auth.middleware.js:98` | Guest truy cập `/checkout`, `/account/*` bị chuyển hướng: `res.redirect('/auth/login?returnUrl=...')` (**HTTP 302 Redirect**). |
| **Phân quyền Guest -> Wishlist API** | `src/middlewares/auth.middleware.js:96` | Guest gọi `/api/wishlist/*` bị chặn với **HTTP 401 Unauthorized JSON** (`{ success: false, message: 'Vui lòng đăng nhập để tiếp tục' }`). |
| **Phân quyền Customer -> Admin Portal** | `src/middlewares/auth.middleware.js:137-139` | Customer truy cập `/admin/*` bị chặn với **HTTP 403 Forbidden** (`error.status = 403`). |
| **Cô lập Admin khỏi Mua sắm Web** | `src/middlewares/auth.middleware.js:105-108`<br>`src/controllers/cart.controller.js:34-39` | Admin truy cập `/checkout`, `/account/*`, `/cart` bị flash cảnh báo và chuyển hướng: `res.redirect('/admin/dashboard')` (**HTTP 302 Redirect**). |
| **Cô lập Admin khỏi Wishlist API** | `src/middlewares/auth.middleware.js:102-104` | Admin gọi `/api/wishlist/*` bị chặn với **HTTP 403 Forbidden JSON** (`{ success: false, message: 'Tài khoản Quản trị viên không thể thực hiện thao tác này' }`). |
| **Trừ kho tại thời điểm Đặt hàng** | `src/services/order.service.js:160-196` | Mở Transaction, khóa dòng `product_variants WITH (UPDLOCK, ROWLOCK)`, kiểm tra `currentStock < item.quantity`, trừ kho `UPDATE product_variants SET stock_quantity = stock_quantity - @qty`, ghi `inventory_transactions`. |
| **Hoàn kho khi Hủy đơn hàng** | `src/services/order.service.js:335-364` | Khóa dòng biến thể, cộng lại `stock_quantity = currentStock + item.quantity`, ghi `inventory_transactions` với `transaction_type = 'RESTOCK'`. |
| **Chống hoàn kho lặp (Anti-double Restitution)** | `src/services/order.service.js:435-438`<br>`src/services/order.service.js:8-13, 501-512` | Tại `cancelOrderByCustomer`: kiểm tra `if (order.order_status === 'CANCELLED') throw new Error(...)`. Tại Admin: `CANCELLED: []` là trạng thái kết thúc, không thể chuyển tiếp. |
| **Không trừ kho khi COMPLETED** | `src/services/order.service.js:534-550` | Khi `newStatus === 'COMPLETED'`, chỉ cập nhật `payment_status = 'PAID'` và `order_status = 'COMPLETED'`, **hoàn toàn không có thao tác trừ kho**. |
| **Voucher giới hạn 1 lần / Khách hàng** | `src/services/order.service.js:104-108, 224-230`<br>`database/mssql_schema.sql:357` | Kiểm tra `SELECT 1 FROM voucher_usages WITH (UPDLOCK, ROWLOCK) WHERE voucher_id = @vouchId AND user_id = @userId`. CSDL có ràng buộc `CONSTRAINT uq_voucher_user UNIQUE (voucher_id, user_id)`. |

---

## 5. Danh sách 16 Use Case Chuẩn hóa Cuối cùng

1. **UC01:** Đăng ký tài khoản (Guest) — *Implemented*
2. **UC02:** Đăng nhập hệ thống (Guest, Customer, Admin) — *Implemented*
3. **UC03:** Khôi phục mật khẩu (Guest, Email Service dự kiến) — *Designed Only / Not Implemented*
4. **UC04:** Quản lý hồ sơ & sổ địa chỉ (Customer) — *Implemented*
5. **UC05:** Tìm kiếm & xem sản phẩm (Guest, Customer) — *Implemented*
6. **UC06:** Quản lý giỏ hàng (Guest, Customer) — *Implemented*
7. **UC07:** Đặt hàng COD (Customer) — *Implemented*
8. **UC08:** Tra cứu & theo dõi đơn hàng (Customer) — *Implemented*
9. **UC09:** Hủy đơn hàng tự phục vụ (Customer) — *Implemented*
10. **UC10:** Xử lý & cập nhật đơn hàng (Admin) — *Implemented*
11. **UC11:** Quản lý tồn kho (Admin) — *Implemented*
12. **UC12:** Quản lý danh mục, thương hiệu, sản phẩm & banner (Admin) — *Implemented*
13. **UC13:** Quản lý mã giảm giá (Admin) — *Implemented*
14. **UC14:** Báo cáo doanh thu & KPI Dashboard (Admin) — *Implemented*
15. **UC15:** Quản lý danh sách yêu thích (Wishlist) (Customer) — *Implemented*
16. **UC16:** Quản lý tài khoản khách hàng (Admin) — *Implemented*

---

## 6. Trạng thái Triển khai Thực tế của Từng Use Case

- **Tổng số Use Case:** 16 Use Case.
- **Implemented (Hoàn thành trong Code & CSDL):** 15 / 16 Use Case (**93.75%**).
- **Designed Only / Not Implemented (Bản thiết kế):** 01 / 16 Use Case (**6.25%** - UC03 do chưa tích hợp dịch vụ gửi thư SMTP ngoài).
- **Not Implemented (Chưa thiết kế):** 0 / 16 Use Case (**0%**).

---

## 7. Kết quả Render và Kiểm tra Sơ đồ PlantUML

Toàn bộ 5 sơ đồ đã được biên dịch thành công ra tệp ảnh PNG độ phân giải cao tại cả hai thư mục `docs/diagrams/usecase/` và `docs/diagrams/use-case/`:

| Tên sơ đồ | Tập tin PlantUML | Tập tin ảnh Rendered | Dung lượng PNG | Kiểm tra trực quan & Tiêu chuẩn |
| :--- | :--- | :--- | :---: | :--- |
| **Tổng thể Hệ thống** | [USE_CASE_OVERVIEW.puml](../../diagrams/usecase/USE_CASE_OVERVIEW.puml) | [USE_CASE_OVERVIEW.png](../../diagrams/usecase/USE_CASE_OVERVIEW.png) | 126,783 bytes | Đầy đủ 3 Actor chính + 1 Actor phụ dự kiến, phân rã 4 phân hệ, `Customer -up-\|> Guest` chuẩn UML. |
| **Phân hệ Tài khoản** | [uc-01-auth.puml](../../diagrams/usecase/uc-01-auth.puml) | [uc-01-auth.png](../../diagrams/usecase/uc-01-auth.png) | 121,666 bytes | UC03 ghi rõ `Designed Only`, UC02 thể hiện mở rộng `Merge Guest Cart`, ghi chú hiện trạng rõ ràng. |
| **Phân hệ Mua sắm** | [uc-02-shopping.puml](../../diagrams/usecase/uc-02-shopping.puml) | [uc-02-shopping.png](../../diagrams/usecase/uc-02-shopping.png) | 118,974 bytes | Phân định rõ 2 luồng Guest Session Cart và Customer DB Cart, không ép buộc Guest phải đăng nhập. |
| **Phân hệ Đơn hàng** | [uc-03-orders.puml](../../diagrams/usecase/uc-03-orders.puml) | [uc-03-orders.png](../../diagrams/usecase/uc-03-orders.png) | 126,027 bytes | Trừ kho lúc đặt hàng, hoàn kho lúc hủy, chống hoàn kho lặp, không trừ kho khi COMPLETED. |
| **Phân hệ Quản trị** | [uc-04-admin.puml](../../diagrams/usecase/uc-04-admin.puml) | [uc-04-admin.png](../../diagrams/usecase/uc-04-admin.png) | 128,484 bytes | Thể hiện đầy đủ 4 module của UC12 (Danh mục, Thương hiệu, Sản phẩm & biến thể, Banners). |

---

## 8. Những Nội dung Chưa thể Xác minh (Unverified Items)

- **Cấu hình SMTP gửi mail thực tế:** Trong môi trường phát triển cục bộ và repository hiện tại, chưa có tài khoản dịch vụ gửi thư SMTP (SendGrid API Key / Gmail SMTP App Password) nên chưa thể thực hiện kiểm thử gửi email thật cho UC03. Do đó, việc xếp UC03 vào trạng thái `Designed Only / Not Implemented` là hoàn toàn trung thực và chính xác về mặt học thuật.

---

## 9. Bảng Tổng kết Đánh giá Kiểm toán Giai đoạn 1

| Hạng mục | Kết quả | Bằng chứng mã nguồn | Ghi chú |
| :--- | :---: | :--- | :--- |
| **Ranh giới Actor & Kế thừa** | **ĐẠT** | `Customer --\|> Guest`, loại bỏ Staff, Admin toàn quyền vận hành | Chuẩn UML 2.5, nhất quán toàn bộ tài liệu |
| **Quản lý Thương hiệu (Brands)** | **ĐẠT** | `src/routes/admin.routes.js:35`, `admin.controller.js:744-775` | Nằm trong UC12, có route và view quản lý |
| **Quản lý Banner (Banners)** | **ĐẠT** | `src/routes/admin.routes.js:49-52`, `admin.controller.js:985-1048` | Nằm trong UC12, đầy đủ get, create, toggle, delete |
| **Hiện trạng UC03 (Khôi phục MK)** | **ĐẠT** | `login.pug:37`, `mssql_schema.sql:187`, thiếu route trong `auth.routes.js` | Gán đúng trạng thái `Designed Only / Not Implemented` |
| **Giỏ hàng Khách vãng lai** | **ĐẠT** | `cart.controller.js:42-121, 235-265`, `req.session.guestCart` | Khách không bị bắt buộc đăng nhập để dùng giỏ |
| **Tự động Gộp Giỏ hàng** | **ĐẠT** | `auth.controller.js:125, 292`, `cart.controller.js:686-745` | Gọi `mergeGuestCart` khi đăng nhập hoặc đăng ký |
| **Phân quyền Web: Guest -> Customer** | **ĐẠT** | `src/middlewares/auth.middleware.js:98` | Trả về HTTP 302 Redirect sang login |
| **Phân quyền API: Guest -> Wishlist** | **ĐẠT** | `src/middlewares/auth.middleware.js:96` | Trả về HTTP 401 Unauthorized JSON |
| **Phân quyền Web: Customer -> Admin** | **ĐẠT** | `src/middlewares/auth.middleware.js:137-139` | Trả về HTTP 403 Forbidden |
| **Cô lập Admin khỏi Mua sắm Web** | **ĐẠT** | `auth.middleware.js:108`, `cart.controller.js:37` | Trả về HTTP 302 Redirect về Dashboard |
| **Cô lập Admin khỏi Wishlist API** | **ĐẠT** | `src/middlewares/auth.middleware.js:103` | Trả về HTTP 403 Forbidden JSON |
| **Trừ kho lúc Đặt hàng** | **ĐẠT** | `src/services/order.service.js:160-196` | Khóa `UPDLOCK, ROWLOCK`, trừ kho trong Transaction |
| **Hoàn kho lúc Hủy đơn** | **ĐẠT** | `src/services/order.service.js:335-364` | Hoàn kho và ghi `inventory_transactions` |
| **Chống hoàn kho lặp** | **ĐẠT** | `src/services/order.service.js:435-438, 501-512` | Check status CANCELLED, cấm hủy lần 2 |
| **Không trừ kho khi COMPLETED** | **ĐẠT** | `src/services/order.service.js:534-550` | Chỉ cập nhật `payment_status = 'PAID'`, không trừ kho |
| **Voucher 1 lần / Khách hàng** | **ĐẠT** | `order.service.js:104-108`, `uq_voucher_user` trong DB | Chặn dùng lại qua bảng `voucher_usages` |
| **Đồng bộ Sơ đồ PlantUML & PNG** | **ĐẠT** | 5 file `.puml` và 5 file `.png` (118KB - 128KB) | Đồng bộ cả `docs/diagrams/usecase/` và `use-case/` |
| **An toàn Git & Mã nguồn** | **ĐẠT** | `git status`, HEAD `8135e19`, không chạm source/DB | Tuyệt đối tuân thủ nguyên tắc an toàn |

---

## 10. Kết luận Nghiệm thu Giai đoạn 1

Giai đoạn 1 đã được kiểm toán toàn diện và hoàn thành với chất lượng cao nhất:
- Không còn bất kỳ điểm mâu thuẫn hay chưa đồng bộ nào giữa tài liệu, sơ đồ và mã nguồn.
- Mọi chức năng đã triển khai (kể cả Thương hiệu, Banner, Wishlist, Quản lý Khách hàng) đều được phản ánh chuẩn xác.
- Hiện trạng của UC03 được mô tả khách quan, trung thực và có bằng chứng cụ thể.
- Nghiệp vụ kho và phân quyền bảo mật có trích dẫn mã nguồn từng file và từng dòng.

**Kính trình Quản trị viên xem xét và phê duyệt kết quả Giai đoạn 1 để chính thức chuyển sang Giai đoạn 2 (Thiết kế Cơ sở Dữ liệu & ERD).**
