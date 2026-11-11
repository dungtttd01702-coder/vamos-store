# BẢN ĐỒ VỊ TRÍ HÌNH ẢNH & DANH MỤC SƠ ĐỒ BÁO CÁO VAMOS STORE

Tài liệu này hướng dẫn chi tiết vị trí, tên file và ý nghĩa của toàn bộ **25 hình ảnh, sơ đồ kiến trúc và giao diện Wireframe** trong Báo cáo Đồ án Tốt nghiệp Website Bán giày dép VAMOS STORE.

Tất cả các file ảnh gốc độ phân giải cao đã được tạo sẵn trong thư mục:
`c:\Users\Admin\Desktop\dự án JAV\report\images\`

---

## 1. BẢNG TRA CỨU VỊ TRÍ TOÀN BỘ HÌNH ẢNH

|  STT   | Tên hình trong báo cáo                                                  | Tên file ảnh trong `report/images/`       | Vị trí chương / mục                |         Kích thước & Tỷ lệ          | Mục đích & Nội dung thể hiện                                                                                                         |
| :----: | :---------------------------------------------------------------------- | :---------------------------------------- | :--------------------------------- | :---------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------- |
| **0**  | **Logo FPT Education**                                                  | `fpt_logo.png`                            | Trang bìa chính & Trang bìa phụ    |           Vector nét cao            | Logo chuẩn của Tổ chức Giáo dục FPT trên trang bìa khung đôi.                                                                        |
| **1**  | **Hình 1: Mô hình Client - Server trong ứng dụng web**                  | `hinh_01_client_server.png`               | Chương I - Mục 1.1                 |     565 x 836 px (Dọc cân đối)      | Thể hiện luồng tương tác giữa Browser Client $\rightarrow$ Internet $\rightarrow$ Node.js/Express Server $\rightarrow$ Microsoft SQL Server 2025. |
| **2**  | **Hình 2: Mô hình kiến trúc MVC phân lớp**                              | `hinh_02_mvc.png`                         | Chương I - Mục 4.1                 |        863 x 305 px (Ngang)         | Mối quan hệ tương tác giữa 3 thành phần Controller, Model và View.                                                                   |
| **3**  | **Hình 3: Luồng xử lý một Request trong kiến trúc phân lớp**            | `hinh_03_mvc_flow.png`                    | Chương I - Mục 4.2                 |    1712 x 540 px (Rộng sắc nét)     | Tuần tự xử lý Request: Client $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ SQL Server.     |
| **4**  | **Hình 4: Chi tiết cấu trúc tầng trong kiến trúc phân lớp VAMOS STORE** | `hinh_04_mvc_layers.png`                  | Chương I - Mục 4.2                 |     1185 x 654 px (Chuẩn 16:9)      | Chi tiết 3 tầng: Presentation Layer (Pug/CSS), Business Logic Layer (Services), Data Access Layer (MSSQL Pool).                      |
| **5**  | **Hình 5: Sơ đồ Use Case tổng quát VAMOS STORE**                        | `hinh_05_use_case_tong_quat.png`          | Chương II - Mục 2.1.A              |        1118 x 1369 px (Dọc)         | 14 Use Case tổng quát của 3 Actor: Guest, Customer, Admin (Tuyệt đối không có Staff).                                                |
| **6**  | **Hình 6: Sơ đồ Use Case chi tiết Đặt hàng COD**                        | `hinh_06_use_case_mua_hang.png`           | Chương II - Mục 2.1.B              |        963 x 304 px (Ngang)         | Phân rã Use Case xem giỏ hàng, áp voucher, chọn địa chỉ và chốt đơn thanh toán khi nhận hàng.                                        |
| **7**  | **Hình 7: Sơ đồ Use Case chi tiết Quản lý đơn hàng & Kho Admin**        | `hinh_07_use_case_quan_ly.png`            | Chương II - Mục 2.1.C              |        874 x 304 px (Ngang)         | Nghiệp vụ Admin duyệt đơn theo máy trạng thái và kiểm kê/điều chỉnh tồn kho có lưu vết.                                              |
| **8**  | **Hình 8: Sơ đồ điều hướng màn hình (Sitemap)**                         | `hinh_08_sitemap.png`                     | Chương II - Mục 2.2                |    1482 x 457 px (Cây phân cấp)     | Cây cấu trúc website: Trang chủ, Danh mục, Chi tiết sản phẩm, Giỏ hàng, Checkout, Tra cứu đơn, Khu vực Admin.                        |
| **9**  | **Hình 9: Mô hình thực thể quan hệ (ERD 18 bảng) - VAMOS STORE**        | `hinh_09_erd.png`                         | Chương II - Mục 2.3                |     2730 x 1090 px (Đại bản đồ)     | Toàn bộ 18 bảng dữ liệu quan hệ Microsoft SQL Server 2025, khóa chính PK, khóa ngoại FK, quan hệ 1-N, N-N biến thể.                  |
| **10** | **Hình 10: Sơ đồ hoạt động - Quy trình Đăng ký & Đăng nhập**            | `hinh_10_activity_auth.png`               | Chương II - Mục 2.5.A              |        3020 x 863 px (Rộng)         | Luồng kiểm tra email trùng, băm mật khẩu bcrypt 10 vòng, cấp Session ID cookie.                                                      |
| **11** | **Hình 11: Sơ đồ hoạt động - Mua hàng & Đặt hàng COD**                  | `hinh_11_activity_checkout.png`           | Chương II - Mục 2.5.B              |     2008 x 1659 px (Chuẩn UML)      | Khóa bi quan `SELECT ... FOR UPDATE`, trừ tồn kho trong Transaction, hoàn tất đơn COD.                                               |
| **12** | **Hình 12: Sơ đồ hoạt động - Máy trạng thái xử lý đơn hàng**            | `hinh_12_activity_order_processing.png`   | Chương II - Mục 2.5.C              |      2701 x 1022 px (Tuần tự)       | Quy trình 5 bước: `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPING` $\rightarrow$ `COMPLETED`. |
| **13** | **Hình 13: Sơ đồ hoạt động - Hủy đơn hàng và Hoàn kho tự động**         | `hinh_13_activity_order_cancel.png`       | Chương II - Mục 2.5.D              |      2189 x 1092 px (Rẽ nhánh)      | Khách hoặc Admin hủy đơn $\rightarrow$ Hệ thống tự động cộng trả số lượng tồn kho và lưu vết kiểm toán.                              |
| **14** | **Hình 14: Sơ đồ hoạt động - Admin kiểm kê và điều chỉnh kho**          | `hinh_14_activity_inventory.png`          | Chương II - Mục 2.5.E              |     1791 x 1214 px (Quy trình)      | Admin điều chỉnh số lượng tồn kho biến thể, bắt buộc ghi rõ nguyên nhân kiểm toán.                                                   |
| **17** | **Hình 17: Giao diện Trang chủ (Home Page)**                            | `hinh_17_giao_dien_trang_chu.png`         | Chương II - Mục 2.6 (Giao diện 1)  |    863 x 2048 px (Wireframe dài)    | Banner sự kiện, danh mục sneaker nổi bật, sản phẩm mới nhất và footer chính sách.                                                    |
| **18** | **Hình 18: Giao diện Cửa hàng & Bộ lọc đa tiêu chí**                    | `hinh_18_giao_dien_cua_hang.png`          | Chương II - Mục 2.6 (Giao diện 2)  |   1279 x 2048 px (Lưới sản phẩm)    | Lưới sản phẩm kèm thanh lọc theo thương hiệu, khoảng giá, size giày và sắp xếp giá.                                                  |
| **19** | **Hình 19: Giao diện Chi tiết sản phẩm & Chọn Size/Màu**                | `hinh_19_giao_dien_chi_tiet_san_pham.png` | Chương II - Mục 2.6 (Giao diện 3)  |   1088 x 2048 px (Chi tiết giày)    | Bộ sưu tập ảnh, bộ chọn size giày, chọn màu sắc, kiểm tra tồn kho realtime và nút Thêm vào giỏ.                                      |
| **20** | **Hình 20: Giao diện Giỏ hàng trực tuyến**                              | `hinh_20_giao_dien_gio_hang.png`          | Chương II - Mục 2.6 (Giao diện 4)  |   1440 x 1382 px (Bảng giỏ hàng)    | Danh sách sản phẩm trong giỏ, điều chỉnh số lượng, tạm tính tổng tiền và chuyển sang thanh toán.                                     |
| **21** | **Hình 21: Giao diện Đặt hàng COD (Checkout)**                          | `hinh_21_giao_dien_dat_hang_cod.png`      | Chương II - Mục 2.6 (Giao diện 5)  |  1440 x 1638 px (Form thanh toán)   | Chọn địa chỉ giao hàng, nhập mã voucher ưu đãi, chọn phương thức COD và chốt đơn hàng.                                               |
| **22** | **Hình 22: Giao diện Đăng ký / Đăng nhập tài khoản**                    | `hinh_22_giao_dien_dang_nhap.png`         | Chương II - Mục 2.6 (Giao diện 6)  |  1440 x 1024 px (Auth Modal/Card)   | Tab chuyển đổi Đăng nhập / Đăng ký, nhập email, mật khẩu và ghi nhớ phiên.                                                           |
| **23** | **Hình 23: Giao diện Lịch sử đơn hàng của khách**                       | `hinh_23_giao_dien_lich_su_don_hang.png`  | Chương II - Mục 2.6 (Giao diện 7)  | 1440 x 1664 px (Dòng thời gian đơn) | Theo dõi trạng thái đơn hàng, xem snapshot sản phẩm và nút hủy đơn khi còn ở `PENDING`.                                              |
| **24** | **Hình 24: Giao diện Admin Dashboard tổng quan**                        | `hinh_24_giao_dien_admin_dashboard.png`   | Chương II - Mục 2.6 (Giao diện 8)  |   1440 x 1531 px (Thống kê Admin)   | Card doanh thu, cảnh báo đơn chờ duyệt, danh sách biến thể sắp hết hàng dưới 5 đôi.                                                  |
| **25** | **Hình 25: Giao diện Admin Quản lý sản phẩm & Biến thể**                | `hinh_25_giao_dien_admin_san_pham.png`    | Chương II - Mục 2.6 (Giao diện 9)  |   1440 x 1629 px (Bảng sản phẩm)    | Danh sách sản phẩm, quản lý ma trận biến thể (Size, Color, SKU, Tồn kho, Giá phụ thu).                                               |
| **26** | **Hình 26: Giao diện Admin Vận hành đơn hàng**                          | `hinh_26_giao_dien_admin_don_hang.png`    | Chương II - Mục 2.6 (Giao diện 10) |  1239 x 2048 px (Xử lý đơn Admin)   | Lọc đơn theo tab trạng thái, xem chi tiết giao nhận, duyệt chuyển trạng thái và hủy đơn hoàn kho.                                    |

---

## 2. HƯỚNG DẪN XUẤT RA FILE PDF CHUẨN ĐỒ ÁN TỐT NGHIỆP

Để có file PDF đẹp 100% giống như file mẫu WellFitness, bạn có 2 cách thực hiện cực kỳ đơn giản và không bao giờ bị lỗi dính chữ hay méo ảnh:

### CÁCH 1: XUẤT TRỰC TIẾP TỪ FILE HTML IN ẤN (KHUYÊN DÙNG - ĐẸP NHẤT)

1. Trong thư mục `report/`, tìm file:
   **`BAO_CAO_VAMOS_STORE_PRINT.html`**
2. Nhấp đúp chuột để mở file này bằng trình duyệt **Google Chrome** hoặc **Microsoft Edge**.
3. Bạn sẽ thấy ngay giao diện báo cáo hoàn chỉnh với trang bìa đôi FPT Poly, đầy đủ 25 sơ đồ và wireframe sắc nét.
4. Bấm nút màu xanh **"🖨️ In Báo Cáo / Xuất PDF (Ctrl + P)"** ở góc trên bên phải màn hình (hoặc nhấn tổ hợp phím `Ctrl + P`).
5. Trong cửa sổ in:
   - **Máy in đích (Destination):** Chọn `Save as PDF` (Lưu dưới dạng PDF).
   - **Khổ giấy (Paper size):** Chọn `A4`.
   - **Tùy chọn khác (More settings):**
     - Đánh dấu tick vào: **Background graphics** (Đồ họa nền) để hiển thị màu sắc bảng biểu và khung viền.
     - Bỏ tick mục: **Headers and footers** (để trình duyệt không tự chèn URL và ngày tháng mặc định, vì file đã có chân trang chuẩn FPT Poly).
6. Bấm **Save (Lưu)** $\rightarrow$ Bạn đã có ngay file PDF hoàn chỉnh, chữ nghĩa ngay ngắn, hình ảnh sắc nét, lề chuẩn 20-20-20-25mm!

---

### CÁCH 2: DÙNG FILE MARKDOWN ĐƯA LÊN WEB HOẶC CÔNG CỤ CHUYỂN ĐỔI

Nếu bạn muốn chỉnh sửa thêm nội dung hoặc đưa lên các website chuyển Markdown sang PDF:

1. File Markdown đầy đủ là:
   **`report/BAO_CAO_DATN_VAMOS_STORE.md`**
2. Tất cả các hình ảnh đều đã được chèn sẵn theo đường dẫn tương đối `images/hinh_XX.png`.
3. Bạn có thể mở file này bằng:
   - **VS Code**: Cài extension _Markdown PDF_ hoặc _Marp_ $\rightarrow$ Chuột phải chọn _Export (PDF)_.
   - **Typora**: Mở file `.md` $\rightarrow$ File $\rightarrow$ Export $\rightarrow$ PDF.
   - **Dillinger.io / HackMD.io**: Dán nội dung Markdown vào rồi chọn xuất PDF.
