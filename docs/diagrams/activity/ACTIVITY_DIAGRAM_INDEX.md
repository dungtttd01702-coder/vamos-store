# DANH MỤC VÀ ĐỐI CHIẾU CHUẨN HÓA 11 SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM INDEX)
# DỰ ÁN THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE

> **Tiêu chuẩn áp dụng:** Chuẩn hóa theo UML 2.5 cho Đồ án Phân tích & Thiết kế Hệ thống VAMOS STORE.  
> **Nguyên tắc thiết kế:**  
> 1. Mỗi sơ đồ tập trung vào đúng **một chức năng/quy trình nghiệp vụ cốt lõi**.  
> 2. Cấu trúc **2 Swimlanes đối xứng tuyệt đối**: Cột trái là **Người dùng** (hoặc Khách hàng / Quản trị viên), cột phải là **Hệ thống**.  
> 3. Mũi tên xanh `#2563eb` sắc nét, đi thẳng, không đan chéo cắt ngang qua các swimlane.  
> 4. Nhánh điều kiện Đúng/Sai hiển thị trực quan: Đúng đi thẳng xuống luồng thành công; Sai hiển thị thông báo lỗi và quay lại bước nhập liệu.  
> 5. Loại bỏ 100% các chi tiết kỹ thuật nội bộ backend (không đưa SQL, controller, service, middleware, transaction isolation vào sơ đồ nghiệp vụ).  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | Git HEAD `eb822ab`.

---

## 1. BẢNG ĐỐI CHIẾU ÁNH XẠ CHÍNH THỨC 11 SƠ ĐỒ HOẠT ĐỘNG

Bảng dưới đây thống nhất tuyệt đối giữa **Mã định danh trong Báo cáo**, **Tên quy trình nghiệp vụ**, **File PlantUML nguồn**, **File PNG hồ sơ báo cáo**, **Tác nhân tham gia** và **Trạng thái triển khai thực tế trong source code**:

| Mã Báo cáo | Tên quy trình nghiệp vụ | Tệp PlantUML nguồn (`docs/diagrams/activity/`) | Tệp PNG Hồ sơ Báo cáo (`03_ACTIVITY_DIAGRAM/`) | Kích thước ảnh (WxH) | Tác nhân chính | Trạng thái triển khai trong mã nguồn thực tế |
|:---:|---|---|---|:---:|:---:|---|
| **AD01** | **Đăng ký tài khoản thành viên** | `AD02_DANG_KY_TAI_KHOAN.puml` *(alias: `AD01_REGISTER.puml`)* | `AD01_DANG_KY_TAI_KHOAN.png` | 1689 × 770 | Khách vãng lai ➔ Hệ thống | **Đã hoàn thiện (Implemented)**<br>Route: `POST /auth/register`<br>Băm mật khẩu Bcrypt, cấp phiên. |
| **AD02** | **Đăng nhập hệ thống & Phân quyền** | `AD01_DANG_NHAP.puml` *(alias: `AD02_LOGIN.puml`)* | `AD02_DANG_NHAP.png` | 1359 × 714 | Người dùng ➔ Hệ thống | **Đã hoàn thiện (Implemented)**<br>Route: `POST /auth/login`<br>So sánh Bcrypt, tạo Express Session. |
| **AD03** | **Khôi phục mật khẩu tài khoản** | `AD11_QUEN_MAT_KHAU.puml` *(alias: `AD03_PASSWORD_RESET.puml`)* | `AD03_QUEN_MAT_KHAU.png` | 1935 × 905 | Người dùng ➔ Hệ thống | ⚠️ **Thiết kế quy trình / Chưa hoàn thiện**<br>Bảng `password_reset_tokens` đã có trong DB;<br>Chưa cài đặt route/controller và gửi mail SMTP. |
| **AD04** | **Quản lý sổ địa chỉ giao hàng** | `AD10_QUAN_LY_SO_DIA_CHI.puml` *(alias: `AD04_PROFILE_ADDRESS.puml`)* | `AD04_QUAN_LY_SO_DIA_CHI.png` | 1678 × 883 | Khách hàng ➔ Hệ thống | **Đã hoàn thiện (Implemented)**<br>Route: `/account/addresses`<br>Thêm mới, đổi địa chỉ mặc định. |
| **AD05** | **Tìm kiếm & Lọc danh mục sản phẩm** | `AD03_TIM_KIEM_LOC_SAN_PHAM.puml` *(alias: `AD05_SEARCH_PRODUCT.puml`)* | `AD05_TIM_KIEM_LOC_SAN_PHAM.png` | 1550 × 714 | Người dùng ➔ Hệ thống | **Đã hoàn thiện (Implemented)**<br>Route: `GET /products`<br>Lọc theo size, giá, giới tính, thương hiệu. |
| **AD06** | **Quản lý giỏ hàng trực tuyến** | `AD04_QUAN_LY_GIO_HANG.puml` *(alias: `AD06_CART_MANAGEMENT.puml`)* | `AD06_QUAN_LY_GIO_HANG.png` | 1624 × 659 | Khách hàng ➔ Hệ thống | **Đã hoàn thiện (Implemented)**<br>Route: `/cart`<br>Tăng/giảm số lượng, chặn trần bán lẻ 10 đôi. |
| **AD08** | **Đặt hàng thanh toán COD nguyên tử** | `AD05_DAT_HANG_COD.puml` *(alias: `AD08_CHECKOUT_COD.puml`)* | `AD08_DAT_HANG_COD.png` | 1765 × 880 | Khách hàng ➔ Hệ thống | **Đã hoàn thiện (Implemented)**<br>Route: `POST /checkout`<br>Khóa tồn kho, trừ kho, tạo đơn PENDING. |
| **AD10** | **Khách hàng hủy đơn hàng (PENDING)** | `AD06_HUY_DON_HANG_KHACH_HANG.puml` *(alias: `AD10_CUSTOMER_CANCEL_ORDER.puml`)* | `AD10_HUY_DON_HANG_KHACH_HANG.png` | 1888 × 880 | Khách hàng ➔ Hệ thống | **Đã hoàn thiện (Implemented)**<br>Chỉ cho phép hủy khi đơn ở `PENDING`.<br>Tự động hoàn kho, hoàn voucher. |
| **AD11** | **Admin xử lý đơn hàng theo FSM** | `AD07_XU_LY_DON_HANG_ADMIN.puml` *(alias: `AD11_ADMIN_ORDER_PROCESSING.puml`)* | `AD11_XU_LY_DON_HANG_ADMIN.png` | 2003 × 1001 | Quản trị viên ➔ Hệ thống | **Đã hoàn thiện (Implemented)**<br>Máy trạng thái FSM: 6 trạng thái chuẩn.<br>Cập nhật PAID khi COMPLETED. |
| **AD12** | **Quản lý kho hàng & Ghi thẻ kho** | `AD08_QUAN_LY_TON_KHO.puml` *(alias: `AD12_INVENTORY_MANAGEMENT.puml`)* | `AD12_QUAN_LY_TON_KHO.png` | 1880 × 880 | Quản trị viên ➔ Hệ thống | **Đã hoàn thiện (Implemented)**<br>Route: `POST /admin/inventory/adjust`<br>Ghi nhật ký thẻ kho `inventory_transactions`. |
| **AD13** | **Quản lý danh mục & thương hiệu** | `AD09_QUAN_LY_DANH_MUC_SAN_PHAM.puml` *(alias: `AD13_CATALOG_MANAGEMENT.puml`)* | `AD13_QUAN_LY_DANH_MUC_SAN_PHAM.png` | 1698 × 659 | Quản trị viên ➔ Hệ thống | **Đã hoàn thiện (Implemented)**<br>Xem danh sách, thêm mới, bật/tắt hiển thị.<br>Không có chức năng xóa cứng/chỉnh sửa. |

---

## 2. CHI TIẾT ĐẶC TẢ TỪNG SƠ ĐỒ HOẠT ĐỘNG

### AD01 — Đăng ký tài khoản thành viên (Register)
* **Tác nhân:** Khách vãng lai (`Guest`) ➔ `|Hệ thống|`.
* **Luồng chính:**
  1. Người dùng mở trang đăng ký, điền họ tên, email, số điện thoại, mật khẩu và bấm "Đăng ký".
  2. Hệ thống kiểm tra hợp lệ định dạng email, SĐT 10 số, mật khẩu $\ge$ 6 ký tự và kiểm tra email chưa tồn tại.
  3. **Nhánh Đúng:** Băm mật khẩu bằng Bcrypt, lưu tài khoản vai trò `CUSTOMER`, thông báo đăng ký thành công và chuyển sang màn hình đăng nhập.
  4. **Nhánh Sai:** Trả về thông báo lỗi cụ thể (trùng email hoặc thông tin không hợp lệ) để người dùng sửa lại.
* **Tệp liên quan:**
  - Nguồn PUML: `docs/diagrams/activity/AD02_DANG_KY_TAI_KHOAN.puml`
  - Ảnh PNG: `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/02_HINH_ANH_BAO_CAO/03_ACTIVITY_DIAGRAM/AD01_DANG_KY_TAI_KHOAN.png`

---

### AD02 — Đăng nhập hệ thống & Phân quyền (Login)
* **Tác nhân:** Người dùng (`Guest / Customer / Admin`) ➔ `|Hệ thống|`.
* **Luồng chính:**
  1. Người dùng mở trang đăng nhập, điền email, mật khẩu và bấm "Đăng nhập".
  2. Hệ thống kiểm tra tài khoản tồn tại, trạng thái hoạt động và so sánh mật khẩu Bcrypt.
  3. **Nhánh Đúng:** Cấp phiên làm việc an toàn (Express Session), phân quyền điều hướng (`ADMIN` vào `/admin/dashboard`, `CUSTOMER` vào trang chủ/đơn hàng).
  4. **Nhánh Sai:** Thông báo lỗi sai email hoặc mật khẩu, yêu cầu nhập lại.
* **Tệp liên quan:**
  - Nguồn PUML: `docs/diagrams/activity/AD01_DANG_NHAP.puml`
  - Ảnh PNG: `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/02_HINH_ANH_BAO_CAO/03_ACTIVITY_DIAGRAM/AD02_DANG_NHAP.png`

---

### AD03 — Khôi phục mật khẩu (Password Reset — Designed Architecture)
* **Tác nhân:** Người dùng (`User`) ➔ `|Hệ thống|`.
* **Trạng thái thực tế:** **Thiết kế quy trình / Chưa hoàn thiện trong mã nguồn (Pending Implementation)**.
  > *Lưu ý học thuật:* Bảng `password_reset_tokens` đã được tạo sẵn trong CSDL MSSQL. Tuy nhiên, trong mã nguồn thực tế chưa cài đặt route tiếp nhận, controller và dịch vụ gửi mail SMTP. Sơ đồ AD03 phản ánh bản thiết kế quy trình nghiệp vụ mục tiêu.
* **Luồng chính:**
  1. Người dùng mở chức năng Quên mật khẩu, nhập email và bấm gửi yêu cầu.
  2. Hệ thống kiểm tra email tồn tại trong CSDL.
  3. **Nhánh Đúng:** Tạo token hết hạn, lưu CSDL, gửi link qua email; Người dùng mở link nhập mật khẩu mới; Hệ thống cập nhật mật khẩu mới và hủy hiệu lực token.
  4. **Nhánh Sai:** Thông báo email không tồn tại trong hệ thống.
* **Tệp liên quan:**
  - Nguồn PUML: `docs/diagrams/activity/AD11_QUEN_MAT_KHAU.puml`
  - Ảnh PNG: `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/02_HINH_ANH_BAO_CAO/03_ACTIVITY_DIAGRAM/AD03_QUEN_MAT_KHAU.png`

---

### AD04 — Quản lý sổ địa chỉ giao hàng (Address Management)
* **Tác nhân:** Khách hàng (`Customer`) ➔ `|Hệ thống|`.
* **Luồng chính:**
  1. Khách hàng mở sổ địa chỉ, nhập người nhận, SĐT 10 số, địa chỉ chi tiết, tùy chọn đặt làm mặc định và bấm "Lưu địa chỉ".
  2. Hệ thống kiểm tra tính hợp lệ dữ liệu.
  3. **Nhánh Đúng:** Nếu đặt mặc định thì bỏ cờ mặc định cũ, lưu địa chỉ mới vào bảng `user_addresses`, hiển thị danh sách đã cập nhật.
  4. **Nhánh Sai:** Cảnh báo SĐT hoặc địa chỉ sai định dạng để người dùng sửa lại.
* **Tệp liên quan:**
  - Nguồn PUML: `docs/diagrams/activity/AD10_QUAN_LY_SO_DIA_CHI.puml`
  - Ảnh PNG: `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/02_HINH_ANH_BAO_CAO/03_ACTIVITY_DIAGRAM/AD04_QUAN_LY_SO_DIA_CHI.png`

---

### AD05 — Tìm kiếm & Lọc danh mục sản phẩm (Product Search & Filter)
* **Tác nhân:** Người dùng (`Guest / Customer`) ➔ `|Hệ thống|`.
* **Luồng chính:**
  1. Người dùng nhập từ khóa tìm kiếm hoặc chọn bộ lọc (size EU, khoảng giá, giới tính, thương hiệu).
  2. Hệ thống truy vấn danh mục sản phẩm theo tiêu chí.
  3. **Nhánh Có:** Phân trang danh sách sản phẩm; Người dùng chọn xem chi tiết; Hệ thống hiển thị ảnh, bảng size và số lượng tồn kho.
  4. **Nhánh Không:** Hiển thị thông báo không tìm thấy sản phẩm, gợi ý mẫu sneaker nổi bật để người dùng đổi bộ lọc.
* **Tệp liên quan:**
  - Nguồn PUML: `docs/diagrams/activity/AD03_TIM_KIEM_LOC_SAN_PHAM.puml`
  - Ảnh PNG: `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/02_HINH_ANH_BAO_CAO/03_ACTIVITY_DIAGRAM/AD05_TIM_KIEM_LOC_SAN_PHAM.png`

---

### AD06 — Quản lý giỏ hàng trực tuyến (Cart Management)
* **Tác nhân:** Khách hàng (`Guest / Customer`) ➔ `|Hệ thống|`.
* **Luồng chính:**
  1. Khách hàng chọn size EU, màu sắc, số lượng và bấm "Thêm vào giỏ hàng".
  2. Hệ thống kiểm tra tồn kho khả dụng và giới hạn bán lẻ tối đa 10 đôi/mẫu.
  3. **Nhánh Đúng:** Thêm/tăng số lượng trong giỏ hàng, tính toán lại tạm tính và hiển thị thông báo thành công.
  4. **Nhánh Sai:** Thông báo không đủ tồn kho hoặc vượt quá giới hạn 10 đôi để khách hàng điều chỉnh lại.
* **Tệp liên quan:**
  - Nguồn PUML: `docs/diagrams/activity/AD04_QUAN_LY_GIO_HANG.puml`
  - Ảnh PNG: `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/02_HINH_ANH_BAO_CAO/03_ACTIVITY_DIAGRAM/AD06_QUAN_LY_GIO_HANG.png`

---

### AD08 — Đặt hàng thanh toán COD nguyên tử (Checkout COD)
* **Tác nhân:** Khách hàng (`Customer`) ➔ `|Hệ thống|`.
* **Luồng chính:**
  1. Khách hàng nhập địa chỉ nhận hàng, chọn phương thức COD, nhập mã voucher (nếu có) và bấm "Xác nhận đặt hàng".
  2. Hệ thống kiểm tra tồn kho tức thời và tính hợp lệ của voucher.
  3. **Nhánh Đúng:** Tạo đơn hàng mới trạng thái `PENDING`, khóa giá mua snapshot, trừ tồn kho và ghi sổ thẻ kho (`inventory_transactions`), tăng lượt dùng voucher, làm trống giỏ hàng và cấp mã đơn hàng.
  4. **Nhánh Sai:** Hoàn nguyên dữ liệu, thông báo lỗi hết hàng hoặc voucher không hợp lệ.
* **Tệp liên quan:**
  - Nguồn PUML: `docs/diagrams/activity/AD05_DAT_HANG_COD.puml`
  - Ảnh PNG: `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/02_HINH_ANH_BAO_CAO/03_ACTIVITY_DIAGRAM/AD08_DAT_HANG_COD.png`

---

### AD10 — Khách hàng hủy đơn hàng (Customer Cancel Order)
* **Tác nhân:** Khách hàng (`Customer`) ➔ `|Hệ thống|`.
* **Luồng chính:**
  1. Khách hàng mở danh sách đơn hàng cá nhân, chọn đơn cần hủy, chọn lý do và xác nhận.
  2. Hệ thống kiểm tra trạng thái hiện tại của đơn hàng.
  3. **Nhánh Đúng (Đơn đang ở `PENDING`):** Chuyển trạng thái đơn sang `CANCELLED`, hoàn trả số lượng vào tồn kho SKU, ghi nhận giao dịch hoàn kho vào thẻ kho, khôi phục lượt dùng voucher và hiển thị thông báo hủy thành công.
  4. **Nhánh Sai (Đơn đã duyệt/đang giao):** Từ chối hủy trực tiếp, thông báo đơn hàng đã đóng gói/đang giao vận và hướng dẫn liên hệ hotline 1900 2126.
* **Tệp liên quan:**
  - Nguồn PUML: `docs/diagrams/activity/AD06_HUY_DON_HANG_KHACH_HANG.puml`
  - Ảnh PNG: `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/02_HINH_ANH_BAO_CAO/03_ACTIVITY_DIAGRAM/AD10_HUY_DON_HANG_KHACH_HANG.png`

---

### AD11 — Admin xử lý đơn hàng theo FSM (Admin Order Processing)
* **Tác nhân:** Quản trị viên (`Admin`) ➔ `|Hệ thống|`.
* **Luồng chính:**
  1. Admin mở danh sách đơn hàng, xem chi tiết và chọn trạng thái chuyển tiếp tiếp theo.
  2. Hệ thống kiểm tra tính hợp lệ của quy tắc chuyển đổi máy trạng thái (FSM):
     - `PENDING` ➔ `CONFIRMED` hoặc `CANCELLED`
     - `CONFIRMED` ➔ `PROCESSING` hoặc `CANCELLED`
     - `PROCESSING` ➔ `SHIPPING`
     - `SHIPPING` ➔ `COMPLETED`
  3. **Nhánh Đúng:** Cập nhật trạng thái mới. Nếu sang `CANCELLED` thì hoàn kho; nếu sang `COMPLETED` thì tự động cập nhật thanh toán COD thành `PAID`; lưu lịch sử trạng thái.
  4. **Nhánh Sai:** Từ chối cập nhật và cảnh báo vi phạm quy trình xử lý đơn hàng.
* **Tệp liên quan:**
  - Nguồn PUML: `docs/diagrams/activity/AD07_XU_LY_DON_HANG_ADMIN.puml`
  - Ảnh PNG: `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/02_HINH_ANH_BAO_CAO/03_ACTIVITY_DIAGRAM/AD11_XU_LY_DON_HANG_ADMIN.png`

---

### AD12 — Quản lý kho hàng & Ghi thẻ kho (Inventory Adjustment)
* **Tác nhân:** Quản trị viên (`Admin`) ➔ `|Hệ thống|`.
* **Luồng chính:**
  1. Admin mở bảng quản lý tồn kho, chọn biến thể SKU, nhập số lượng tồn mới và lý do kiểm kê, bấm "Lưu thay đổi".
  2. Hệ thống kiểm tra số lượng tồn kho nhập vào.
  3. **Nhánh Đúng (Số lượng là số nguyên $\ge 0$ và có lý do):** Cập nhật số lượng tồn kho thực tế của SKU, ghi bút toán bất biến vào bảng thẻ kho `inventory_transactions` kèm mã Admin thực hiện, thông báo cập nhật thành công.
  4. **Nhánh Sai:** Báo lỗi số lượng âm hoặc thiếu lý do kiểm kê để Admin nhập lại.
* **Tệp liên quan:**
  - Nguồn PUML: `docs/diagrams/activity/AD08_QUAN_LY_TON_KHO.puml`
  - Ảnh PNG: `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/02_HINH_ANH_BAO_CAO/03_ACTIVITY_DIAGRAM/AD12_QUAN_LY_TON_KHO.png`

---

### AD13 — Quản lý danh mục & thương hiệu (Catalog Management)
* **Tác nhân:** Quản trị viên (`Admin`) ➔ `|Hệ thống|`.
* **Hiện trạng chức năng thực tế trong mã nguồn:**
  - `GET /admin/categories`: Xem danh sách danh mục (kèm số lượng sản phẩm liên kết) và thương hiệu.
  - `POST /admin/categories/create`: Thêm mới danh mục (`name`, `slug`, `gender_target`, `description`).
  - `POST /admin/categories/:id/toggle`: Bật/tắt trạng thái hiển thị (`status = 'active' | 'inactive'`).
  - `POST /admin/brands/create`: Thêm mới thương hiệu.
  - *Không có chức năng chỉnh sửa thông tin hoặc xóa cứng danh mục trong mã nguồn hiện tại.*
* **Luồng chính:**
  1. Admin mở trang quản lý danh mục và thương hiệu, nhập thông tin danh mục mới (hoặc chọn bật/tắt hiển thị danh mục cũ).
  2. Hệ thống kiểm tra tên danh mục bắt buộc và tính duy nhất của slug.
  3. **Nhánh Đúng:** Lưu danh mục mới với trạng thái `active = 1` (hoặc đảo trạng thái hiển thị), thông báo thành công và hiển thị trên bảng quản trị.
  4. **Nhánh Sai:** Báo lỗi thiếu tên danh mục hoặc trùng lặp slug để Admin nhập lại.
* **Tệp liên quan:**
  - Nguồn PUML: `docs/diagrams/activity/AD09_QUAN_LY_DANH_MUC_SAN_PHAM.puml`
  - Ảnh PNG: `report/HO_SO_BAO_CAO_PHAN_TICH_THIET_KE_VAMOS_STORE/02_HINH_ANH_BAO_CAO/03_ACTIVITY_DIAGRAM/AD13_QUAN_LY_DANH_MUC_SAN_PHAM.png`
