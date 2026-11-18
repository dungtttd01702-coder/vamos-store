# BÁO CÁO KHẢO SÁT VÀ XÂY DỰNG ĐẶC TẢ SƠ ĐỒ LỚP UML (CLASS MODEL DISCOVERY)
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ VAMOS STORE — PHASE 3.3.2.1
### BẢN ĐẶC TẢ HOÀN THIỆN & KIỂM ĐỊNH NGỮ NGHĨA UML (FINAL UML SEMANTIC AUDIT)

> **Dự án:** VAMOS STORE — Website Thương mại điện tử Bán giày trực tuyến  
> **Tiêu chuẩn học thuật:** Chuẩn UML 2.5 cho Đồ án Tốt nghiệp / Assignment Kỹ nghệ Phần mềm FPT Polytechnic  
> **Trạng thái Git Baseline:** Branch `fix/master-repair-plan` | Git HEAD `8135e190c69553be8f6ebf3eab7ba34de995d53c` (`8135e19`)  
> **Nguyên tắc thực thi:** Code-First Discovery & Fact-Based Modeling. Mọi classifier, thuộc tính, phương thức, stereotype và mối quan hệ đều phải có căn cứ xác thực 1-1 từ mã nguồn JavaScript (Node.js/Express) và lược đồ CSDL SQL Server thực tế tại Git baseline. Tuyệt đối không tự suy diễn, không tạo ra các lớp hoặc tầng giả định (như `CartService`, `OrderRepository`, `AdminService`, `VoucherService`, `InventoryService`, `MailService`).

---

# PHẦN 1: TỔNG QUAN KHẢO SÁT HỆ THỐNG & ĐẶC TẢ KIẾN TRÚC

### 1.1. Mục đích và phạm vi khảo sát
Khảo sát toàn diện mã nguồn backend/frontend, lược đồ cơ sở dữ liệu vật lý và các tài liệu kiến trúc đã được nghiệm thu (Phase 1 Use Case, Phase 2 Database/ERD, Phase 3.1 Activity Diagrams, Phase 3.2 System Architecture, Phase 3.3.1 Sequence Diagrams) nhằm trích xuất chính xác mô hình tĩnh (Static Structure Model). Báo cáo này đóng vai trò là bản thiết kế đặc tả chi tiết (Blueprint Specification) làm tiền đề duy nhất để xây dựng bộ Sơ đồ Lớp UML (Class Diagrams CD01–CD06) tại Phase 3.3.2.2.

### 1.2. Môi trường công nghệ thực tế
- **Runtime Environment:** Node.js >= 22 (CommonJS Module System).
- **Web Application Framework:** Express.js 4.21.2.
- **Template Engine (SSR):** Pug 3.0.3.
- **Frontend Styling & Client Scripting:** Tailwind CSS 3.4.17, Vanilla JavaScript (`src/public/js/main.js`).
- **Database Engine:** Microsoft SQL Server 2019/2022 (T-SQL).
- **Database Driver:** `mssql` 12.7.14 (Connection Pool & ACID Transactions).
- **Authentication & Security:** Session-based (`express-session` 1.18.1), mã hóa mật khẩu `bcryptjs` 2.4.3, chống giả mạo `csrfMiddleware` (HMAC/Token), bảo mật HTTP header `helmet` 8.0.0.

### 1.3. Đặc điểm kiến trúc cốt lõi cần phản ánh trung thực
1. **Kiến trúc phân tầng phi đồng nhất (Heterogeneous Layered Architecture):**
   - Hệ thống được tổ chức theo các tầng logic: Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Database Helper.
   - Tuy nhiên, việc áp dụng phân tầng **không diễn ra đồng nhất trên toàn bộ các phân hệ**:
     - **Phân hệ Sản phẩm (`Product`):** Áp dụng mô hình chuẩn 3 tầng: `ProductController` $\rightarrow$ `ProductService` $\rightarrow$ `ProductRepository` $\rightarrow$ `database.js`.
     - **Phân hệ Danh sách yêu thích (`Wishlist`):** Áp dụng mô hình chuẩn 3 tầng: `WishlistController` $\rightarrow$ `WishlistService` $\rightarrow$ `WishlistRepository` $\rightarrow$ `database.js`.
     - **Phân hệ Đơn hàng (`Order`):** Áp dụng mô hình 2 tầng: `CheckoutController` / `AccountController` $\rightarrow$ `OrderService` $\rightarrow$ Direct Database Pool / `sql.Transaction` (Hoàn toàn **không có `OrderRepository`**; câu lệnh SQL được thực thi trực tiếp bên trong `OrderService` qua `sql.Transaction`).
     - **Phân hệ Giỏ hàng (`Cart`) & Xác thực (`Auth`):** Controller gọi trực tiếp Database Helper (`query()`, `getPool()`), xử lý logic session (`req.session`), không sử dụng Service/Repository trung gian.
     - **Phân hệ Bảng điều khiển Quản trị (`Admin Dashboard` & Operations):** `AdminController` kích hoạt đa luồng song song qua `Promise.all` (9 truy vấn song song + 1 tuần tự) gọi trực tiếp Database Pool, không qua tầng Service. Đối với duyệt đơn và hủy đơn, `AdminController` tái sử dụng `OrderService`.
2. **Quy tắc phân quyền và nghiệp vụ bất biến:**
   - **Tác nhân hệ thống:** Chỉ có 3 Tác nhân: `Guest`, `Customer`, `Admin` (Hoàn toàn **không có Staff**).
   - **Thanh toán đơn hàng:** Duy nhất hình thức COD (Cash On Delivery).
   - **Quy tắc kho và thanh toán COD:** Tồn kho được trừ ngay lúc tạo đơn COD thành công (SD07). Trạng thái thanh toán chỉ chuyển sang `PAID` khi đơn hàng chuyển sang `COMPLETED`. Hủy đơn hàng hợp lệ tự động hoàn trả tồn kho và giải phóng mã voucher.
   - **Tính năng Quên mật khẩu (UC03):** Đã có bảng CSDL `password_reset_tokens`, nhưng mã nguồn Express chưa cài đặt route/controller $\rightarrow$ Định danh là **Designed Only — Not Implemented**.
   - **Tính năng Khóa tài khoản:** Chặn tuyệt đối việc khóa tài khoản có role `ADMIN` trong `AdminController:postToggleCustomerStatus`.

---

# PHẦN 2: KIỂM CHỨNG TOÀN DIỆN 12 JAVASCRIPT CLASSES & PHÂN BIỆT PHƯƠNG THỨC

Qua rà soát toàn bộ cây thư mục `src/`, hệ thống tìm kiếm chính xác các tệp sử dụng từ khóa chuẩn ES6 `class ClassName`.

### 2.1. Kết quả kiểm chứng tổng thể và chuẩn hóa thuật ngữ Constructor
- **Tổng số class JavaScript thực sự tồn tại:** Đúng **12 classes**.
- **Kiểm định Constructor:**
  - **Explicit Constructor:** **Không có bất kỳ class nào (0/12)** khai báo constructor tường minh (`constructor(...)`) trong mã nguồn.
  - **Implicit Default Constructor:** Toàn bộ 12 class sử dụng cơ chế **Default Constructor ngầm định (Implicit Default Constructor)** do JavaScript Engine tự động cung cấp theo chuẩn ECMAScript khi khởi tạo (`new ClassName()`).
  - **Quy tắc biểu diễn UML 2.5:** Tuyệt đối **không liệt kê `constructor()`** như một phương thức trong danh sách Operations của các Class Diagram nhằm bảo đảm tính trung thực tuyệt đối với source code thực tế.
- **Mô hình Khởi tạo và Xuất khẩu (Instantiation & Export Pattern):** Cả 12 class đều được khởi tạo thành Singleton Instance ngay tại tệp định nghĩa và xuất khẩu thông qua `module.exports = new ClassName()` hoặc biến instance tương đương.
- **Kế thừa (Inheritance):** Không có bất kỳ class nào sử dụng từ khóa `extends` hoặc `super()`. Toàn bộ 12 class là các lớp độc lập.

---

### 2.2. Phân biệt chặt chẽ 4 hình thái Phương thức và Hàm (Method & Function Classification)

Nhằm tránh nhầm lẫn nghiêm trọng trong việc vẽ biểu đồ UML, mã nguồn được phân định thành 4 nhóm rõ rệt:

1. **Static Method bên trong Class:**
   - Định nghĩa: Phương thức được khai báo trực tiếp bằng từ khóa `static` bên trong thân class (`class { static method() {} }`).
   - Phạm vi truy cập: Gọi trực tiếp qua tên Constructor Class (`ClassName.method()`).
   - Biểu diễn UML: Gạch chân tên phương thức kèm hậu tố `{static}`.
   - **Duy nhất 1 trường hợp tồn tại:** `CartController.mergeGuestCart(cartId, guestCart)` tại [src/controllers/cart.controller.js:686](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/cart.controller.js#L686).

2. **Function gắn vào Class/Instance (Attached Function / Monkey-patched property):**
   - Định nghĩa: Hàm độc lập cấp tệp tin (standalone function) được gán thủ công vào thuộc tính của Constructor Class hoặc Instance sau khi khai báo class.
   - Bản chất: Đây **KHÔNG PHẢI** là static method hay instance method nội tại của class definition.
   - **Các trường hợp thực tế:**
     - `CartController.validateCartQuantity`: Hàm độc lập khai báo tại dòng 9 (`function validateCartQuantity(quantity) { ... }`), sau đó được gán vào class tại dòng 764 (`CartController.validateCartQuantity = validateCartQuantity;`) và gán vào instance tại dòng 766 (`cartControllerInstance.validateCartQuantity = validateCartQuantity;`).
     - `authController.getSafeReturnUrl`: Hàm độc lập khai báo tại dòng 16 [src/controllers/auth.controller.js:16](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/auth.controller.js#L16) (`function getSafeReturnUrl(returnUrl) { ... }`), sau đó được gán vào singleton instance tại dòng 334 (`authController.getSafeReturnUrl = getSafeReturnUrl;`).
   - Biểu diễn UML: Không đưa vào khung Operations của Class UML như một phương thức chuẩn. Thể hiện mối quan hệ Dependency (`<<use>>`) tới helper hoặc ghi chú bằng UML Note để phản ánh đúng kỹ thuật gắn hàm động của JavaScript.

3. **Instance Methods bên trong Class:**
   - Định nghĩa: Các phương thức thông thường khai báo trong thân class, được gọi thông qua Singleton Instance.
   - Biểu diễn UML: Liệt kê đầy đủ trong phần Operations của Class UML.

4. **Function export từ Module riêng biệt (CommonJS Modules):**
   - Các middleware (`authMiddleware`, `csrfMiddleware`, `errorMiddleware`, `i18nMiddleware`), các hàm cấu hình trong `database.js`, `validator.js`, và `homeController`.

---

### 2.3. Danh mục chi tiết từng JavaScript Class

#### 1. `AccountController`
- **File path:** [src/controllers/account.controller.js:5](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/account.controller.js#L5).
- **Constructor:** Không khai báo Explicit Constructor (Sử dụng Implicit Default Constructor).
- **Instance Methods (7 phương thức):**
  1. `getOrders(req, res, next)`: Hiển thị danh sách đơn hàng của khách hàng đang đăng nhập.
  2. `getOrderDetail(req, res, next)`: Xem chi tiết một đơn hàng theo mã đơn hàng.
  3. `postCancelOrder(req, res, next)`: Khách hàng yêu cầu hủy đơn hàng (khi đơn ở trạng thái `PENDING` hoặc `CONFIRMED`).
  4. `getProfile(req, res, next)`: Xem thông tin cá nhân của khách hàng.
  5. `postProfile(req, res, next)`: Cập nhật thông tin cá nhân (họ tên, số điện thoại).
  6. `getAddresses(req, res, next)`: Xem danh sách sổ địa chỉ nhận hàng.
  7. `postAddAddress(req, res, next)`: Thêm mới địa chỉ nhận hàng vào sổ địa chỉ.
- **Static Methods:** Không có (0 phương thức).
- **Attached Functions:** Không có.
- **Export Pattern:** `module.exports = new AccountController();` (Singleton Instance tại dòng 208).
- **Dependencies:** `order.service.js`, `database.js`, `validator.js`.
- **Use Cases liên quan:** UC04 (Quản lý hồ sơ & Sổ địa chỉ), UC08 (Tra cứu đơn hàng), UC09 (Khách hàng hủy đơn hàng).

#### 2. `AdminController`
- **File path:** [src/controllers/admin.controller.js:4](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/admin.controller.js#L4).
- **Constructor:** Không khai báo Explicit Constructor (Sử dụng Implicit Default Constructor).
- **Instance Methods (28 phương thức):**
  1. `getDashboard(req, res, next)`: Bảng điều khiển tổng quan KPI, doanh thu, đơn hàng (`Promise.all` 9 truy vấn song song + 1 tuần tự).
  2. `getOrders(req, res, next)`: Danh sách đơn hàng toàn hệ thống với bộ lọc trạng thái và phân trang.
  3. `getOrderDetail(req, res, next)`: Xem chi tiết đơn hàng, sản phẩm, lịch sử trạng thái phía Admin.
  4. `postUpdateOrderStatus(req, res, next)`: Cập nhật trạng thái đơn hàng (tuân thủ State Machine `VALID_TRANSITIONS`).
  5. `getProducts(req, res, next)`: Danh sách sản phẩm quản trị kèm bộ lọc.
  6. `getCreateProduct(req, res, next)`: Form tạo mới sản phẩm (nạp Categories, Brands, Sizes, Colors).
  7. `postCreateProduct(req, res, next)`: Tạo mới sản phẩm và sinh ma trận biến thể SKU trong transaction.
  8. `getEditProduct(req, res, next)`: Form chỉnh sửa thông tin sản phẩm.
  9. `postEditProduct(req, res, next)`: Cập nhật thông tin sản phẩm và biến thể.
  10. `postToggleProductStatus(req, res, next)`: Đổi trạng thái hiển thị của sản phẩm (`active` / `inactive`).
  11. `getInventory(req, res, next)`: Bảng quản lý tồn kho theo từng biến thể SKU.
  12. `postAdjustInventory(req, res, next)`: Điều chỉnh tồn kho (`IN`, `OUT`, `AUDIT`) và ghi log `inventory_transactions`.
  13. `getInventoryHistory(req, res, next)`: Xem lịch sử biến động kho hàng.
  14. `getCategories(req, res, next)`: Danh sách danh mục sản phẩm.
  15. `postCreateCategory(req, res, next)`: Tạo mới danh mục sản phẩm.
  16. `postToggleCategory(req, res, next)`: Đổi trạng thái hoạt động của danh mục.
  17. `postCreateBrand(req, res, next)`: Tạo mới thương hiệu sản phẩm.
  18. `getVouchers(req, res, next)`: Danh sách mã giảm giá.
  19. `getCreateVoucher(req, res)`: Form tạo mới voucher.
  20. `postCreateVoucher(req, res, next)`: Lưu voucher mới vào CSDL.
  21. `postToggleVoucher(req, res, next)`: Bật/tắt trạng thái hoạt động của voucher.
  22. `getCustomers(req, res, next)`: Danh sách tài khoản khách hàng toàn hệ thống.
  23. `getCustomerDetail(req, res, next)`: Xem chi tiết thông tin và lịch sử mua sắm của khách hàng.
  24. `postToggleCustomerStatus(req, res, next)`: Khóa hoặc kích hoạt tài khoản khách hàng (chặn khóa Admin).
  25. `getBanners(req, res, next)`: Danh sách banner trang chủ.
  26. `postCreateBanner(req, res, next)`: Tạo mới banner quảng cáo.
  27. `postToggleBanner(req, res, next)`: Bật/tắt trạng thái hiển thị của banner.
  28. `postDeleteBanner(req, res, next)`: Xóa banner khỏi hệ thống.
- **Static Methods:** Không có (0 phương thức).
- **Attached Functions:** Không có.
- **Export Pattern:** `module.exports = new AdminController();` (Singleton Instance tại dòng 1051).
- **Dependencies:** `database.js`, `order.service.js`.
- **Use Cases liên quan:** UC10 (Admin xử lý đơn), UC11 (Quản lý kho), UC12 (Quản lý danh mục & sản phẩm), UC13 (Quản lý voucher), UC14 (Báo cáo doanh thu & Dashboard), UC16 (Quản lý khách hàng).

#### 3. `AuthController`
- **File path:** [src/controllers/auth.controller.js:26](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/auth.controller.js#L26).
- **Constructor:** Không khai báo Explicit Constructor (Sử dụng Implicit Default Constructor).
- **Instance Methods (5 phương thức):**
  1. `getLogin(req, res)`: Hiển thị trang đăng nhập kèm token CSRF và URL chuyển hướng an toàn.
  2. `postLogin(req, res, next)`: Xác thực tài khoản, kiểm tra khóa tài khoản, tái tạo session (`session.regenerate()`), đồng bộ giỏ hàng vãng lai.
  3. `getRegister(req, res)`: Hiển thị trang đăng ký tài khoản.
  4. `postRegister(req, res, next)`: Kiểm tra trùng email, băm mật khẩu (`bcryptjs`), tạo bản ghi `users`, tự động tạo `carts` (1-1), đồng bộ giỏ hàng vãng lai.
  5. `postLogout(req, res, next)`: Hủy session phía server, xóa cookie `vamos_sid`, chuyển hướng về trang chủ.
- **Static Methods:** Không có (0 phương thức).
- **Attached Function:** `authController.getSafeReturnUrl = getSafeReturnUrl` (Hàm độc lập tại dòng 16 được gán vào instance tại dòng 334).
- **Export Pattern:** `const authController = new AuthController(); authController.getSafeReturnUrl = getSafeReturnUrl; module.exports = authController;` (Singleton Instance tại dòng 336).
- **Dependencies:** `bcryptjs`, `database.js`, `cart.controller.js`, `validator.js`.
- **Use Cases liên quan:** UC01 (Đăng ký tài khoản), UC02 (Đăng nhập hệ thống).

#### 4. `CartController`
- **File path:** [src/controllers/cart.controller.js:27](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/cart.controller.js#L27).
- **Constructor:** Không khai báo Explicit Constructor (Sử dụng Implicit Default Constructor).
- **Instance Methods (6 phương thức):**
  1. `index(req, res, next)`: Hiển thị giỏ hàng (từ CSDL nếu là Customer, từ `req.session.guestCart` nếu là Guest).
  2. `addItem(req, res, next)`: Thêm sản phẩm vào giỏ hàng (kiểm tra tồn kho và giới hạn mua lẻ tối đa 10 sản phẩm).
  3. `buyNow(req, res, next)`: Mua ngay (thêm sản phẩm vào giỏ và chuyển hướng ngay đến trang checkout).
  4. `updateItem(req, res, next)`: Cập nhật số lượng một món hàng trong giỏ.
  5. `clearCart(req, res, next)`: Xóa toàn bộ sản phẩm trong giỏ hàng.
  6. `removeItem(req, res, next)`: Xóa một món hàng khỏi giỏ hàng.
- **Static Methods (1 phương thức static thực thụ):**
  - `static async mergeGuestCart(cartId, guestCart)`: Khai báo bằng từ khóa `static async` tại dòng 686. Đồng bộ toàn bộ sản phẩm từ session giỏ hàng vãng lai vào giỏ hàng CSDL của người dùng khi đăng nhập/đăng ký thành công.
- **Attached Function:** `validateCartQuantity` (Hàm độc lập tại dòng 9 được gán vào `CartController.validateCartQuantity` tại dòng 764 và `cartControllerInstance.validateCartQuantity` tại dòng 766).
- **Export Pattern:** `const cartControllerInstance = new CartController(); module.exports = cartControllerInstance;` (Singleton Instance tại dòng 768).
- **Dependencies:** `database.js`.
- **Use Cases liên quan:** UC06 (Quản lý giỏ hàng), hỗ trợ UC01, UC02 (Merge cart).

#### 5. `CheckoutController`
- **File path:** [src/controllers/checkout.controller.js:5](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/checkout.controller.js#L5).
- **Constructor:** Không khai báo Explicit Constructor (Sử dụng Implicit Default Constructor).
- **Instance Methods (3 phương thức):**
  1. `getCheckout(req, res, next)`: Hiển thị trang đặt hàng, kiểm tra giỏ hàng có sản phẩm, nạp danh sách địa chỉ nhận hàng của khách.
  2. `postCheckout(req, res, next)`: Tiếp nhận dữ liệu đặt hàng, kiểm tra tính hợp lệ dữ liệu, gọi `orderService.createCodOrder` để thực thi giao dịch ACID.
  3. `getSuccess(req, res, next)`: Hiển thị trang xác nhận đặt hàng thành công kèm mã đơn hàng.
- **Static Methods:** Không có (0 phương thức).
- **Attached Functions:** Không có.
- **Export Pattern:** `module.exports = new CheckoutController();` (Singleton Instance tại dòng 205).
- **Dependencies:** `order.service.js`, `database.js`, `validator.js`.
- **Use Cases liên quan:** UC07 (Đặt hàng thanh toán COD).

#### 6. `ProductController`
- **File path:** [src/controllers/product.controller.js:3](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/product.controller.js#L3).
- **Constructor:** Không khai báo Explicit Constructor (Sử dụng Implicit Default Constructor).
- **Instance Methods (3 phương thức):**
  1. `index(req, res, next)`: Hiển thị danh mục sản phẩm kèm các bộ lọc (danh mục, giới tính, size, khoảng giá, sắp xếp) và phân trang.
  2. `detail(req, res, next)`: Hiển thị chi tiết sản phẩm theo slug (ảnh, kích thước, màu sắc, tồn kho từng biến thể).
  3. `liveSearch(req, res, next)`: Tìm kiếm nhanh sản phẩm qua AJAX (Live Search API) trả về định dạng JSON.
- **Static Methods:** Không có (0 phương thức).
- **Attached Functions:** Không có.
- **Export Pattern:** `module.exports = new ProductController();` (Singleton Instance tại dòng 160).
- **Dependencies:** `product.service.js`.
- **Use Cases liên quan:** UC05 (Tìm kiếm & Chi tiết sản phẩm).

#### 7. `WishlistController`
- **File path:** [src/controllers/wishlist.controller.js:3](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/controllers/wishlist.controller.js#L3).
- **Constructor:** Không khai báo Explicit Constructor (Sử dụng Implicit Default Constructor).
- **Instance Methods (6 phương thức):**
  1. `getWishlist(req, res)`: Xem danh sách sản phẩm yêu thích của khách hàng.
  2. `addItem(req, res)`: Thêm sản phẩm vào danh sách yêu thích.
  3. `toggleItem(req, res)`: Bật/tắt trạng thái yêu thích của sản phẩm (thêm nếu chưa có, xóa nếu đã có).
  4. `removeItem(req, res)`: Xóa một sản phẩm khỏi danh sách yêu thích.
  5. `clearWishlist(req, res)`: Xóa toàn bộ danh sách yêu thích.
  6. `migrateLegacy(req, res)`: Đồng bộ danh sách yêu thích cũ từ LocalStorage lên CSDL khi đăng nhập.
- **Static Methods:** Không có (0 phương thức).
- **Attached Functions:** Không có.
- **Export Pattern:** `module.exports = new WishlistController();` (Singleton Instance tại dòng 152).
- **Dependencies:** `wishlist.service.js`.
- **Use Cases liên quan:** UC15 (Quản lý danh sách yêu thích).

#### 8. `OrderService`
- **File path:** [src/services/order.service.js:16](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/services/order.service.js#L16).
- **Constructor:** Không khai báo Explicit Constructor (Sử dụng Implicit Default Constructor).
- **Instance Methods (7 phương thức nghiệp vụ quan trọng):**
  1. `createCodOrder(params)`: Điều phối toàn bộ quy trình đặt hàng COD trong một SQL Transaction với mức khóa bi quan (`UPDLOCK, ROWLOCK, HOLDLOCK`).
  2. `_executeCancellation(transaction, params)`: Phương thức nội bộ thực thi hủy đơn hàng: hoàn tồn kho cho biến thể, ghi `inventory_transactions`, hoàn lại voucher trong `vouchers` và xóa `voucher_usages`, đổi trạng thái sang `CANCELLED`, và ghi log `order_status_histories`.
  3. `cancelOrder(orderId, userId, reason)`: Khách hàng hủy đơn hàng (khi trạng thái là `PENDING` hoặc `CONFIRMED`). Mở Transaction và gọi `_executeCancellation`.
  4. `updateOrderStatusByAdmin(params)`: Admin cập nhật trạng thái đơn hàng. Tuân thủ ma trận `VALID_TRANSITIONS`. Tự động gọi `_executeCancellation` nếu `CANCELLED`, đổi `payment_status = 'PAID'` nếu `COMPLETED`.
  5. `getOrdersByUser(userId)`: Lấy danh sách đơn hàng của người dùng kèm thông tin tổng quan.
  6. `getCustomerOrders(userId)`: Lấy danh sách lịch sử đơn hàng của khách hàng phục vụ trang quản lý cá nhân.
  7. `getOrderDetails(orderIdentifier, userId)`: Lấy chi tiết đơn hàng (các món snapshot, người nhận, trạng thái, lịch sử trạng thái) theo ID hoặc theo Order Code.
- **Static Methods:** Không có (0 phương thức).
- **Attached Functions:** Không có.
- **Export Pattern:** `module.exports = new OrderService();` (Singleton Instance tại dòng 649).
- **Dependencies:** `database.js` (`getPool`, `sql.Transaction`, `sql.Request`).
- **Use Cases liên quan:** UC07 (Checkout COD), UC08 (Tra cứu đơn), UC09 (Khách hủy đơn), UC10 (Admin duyệt đơn).

#### 9. `ProductService`
- **File path:** [src/services/product.service.js:3](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/services/product.service.js#L3).
- **Constructor:** Không khai báo Explicit Constructor (Sử dụng Implicit Default Constructor).
- **Instance Methods (7 phương thức):**
  1. `getCatalog(filters)`: Lấy danh sách sản phẩm theo bộ lọc nghiệp vụ và phân trang.
  2. `getProductBySlug(slug)`: Lấy thông tin chi tiết sản phẩm kèm danh sách biến thể, ảnh, size, color.
  3. `getAllCategories()`: Lấy danh sách tất cả danh mục đang hoạt động.
  4. `getHomeBanners()`: Lấy danh sách banner đang kích hoạt trên trang chủ.
  5. `getLatestProducts(limit)`: Lấy danh sách sản phẩm mới nhất (mặc định limit = 8).
  6. `getFlashSaleProducts(limit)`: Lấy danh sách sản phẩm đang giảm giá nổi bật (mặc định limit = 4).
  7. `searchLive(keyword, limit)`: Tìm kiếm trực tiếp sản phẩm theo từ khóa cho Live Search.
- **Static Methods:** Không có (0 phương thức).
- **Attached Functions:** Không có.
- **Export Pattern:** `module.exports = new ProductService();` (Singleton Instance tại dòng 33).
- **Dependencies:** `product.repository.js`.
- **Use Cases liên quan:** UC05 (Tìm kiếm & Chi tiết sản phẩm).

#### 10. `WishlistService`
- **File path:** [src/services/wishlist.service.js:3](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/services/wishlist.service.js#L3).
- **Constructor:** Không khai báo Explicit Constructor (Sử dụng Implicit Default Constructor).
- **Instance Methods (6 phương thức):**
  1. `getWishlist(userId)`: Lấy toàn bộ danh sách sản phẩm yêu thích của khách hàng.
  2. `addItem(userId, productId)`: Thêm sản phẩm vào danh sách yêu thích nếu sản phẩm tồn tại và chưa có trong danh sách.
  3. `toggleItem(userId, productId)`: Đảo ngược trạng thái yêu thích (thêm nếu chưa có, xóa nếu đã có).
  4. `removeItem(userId, productId)`: Xóa một sản phẩm khỏi danh sách yêu thích.
  5. `clearWishlist(userId)`: Xóa toàn bộ danh sách yêu thích của khách hàng.
  6. `migrateLegacyWishlist(userId, productIds)`: Đồng bộ mảng ID sản phẩm từ client LocalStorage vào CSDL.
- **Static Methods:** Không có (0 phương thức).
- **Attached Functions:** Không có.
- **Export Pattern:** `module.exports = new WishlistService();` (Singleton Instance tại dòng 187).
- **Dependencies:** `wishlist.repository.js`.
- **Use Cases liên quan:** UC15 (Quản lý danh sách yêu thích).

#### 11. `ProductRepository`
- **File path:** [src/models/repositories/product.repository.js:3](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/models/repositories/product.repository.js#L3).
- **Constructor:** Không khai báo Explicit Constructor (Sử dụng Implicit Default Constructor).
- **Instance Methods (7 phương thức truy vấn CSDL):**
  1. `findAll(filters)`: Xây dựng câu truy vấn động T-SQL lấy danh sách sản phẩm theo danh mục, giới tính, kích thước, khoảng giá, từ khóa tìm kiếm, sắp xếp và phân trang OFFSET...FETCH.
  2. `findBySlug(slug)`: Truy vấn chi tiết sản phẩm, join với `categories`, `brands`, lấy toàn bộ ảnh từ `product_images` và biến thể từ `product_variants`.
  3. `getCategories()`: Truy vấn danh sách các danh mục có sản phẩm đang hoạt động.
  4. `getBanners()`: Truy vấn bảng `banners` lấy các banner đang kích hoạt theo thứ tự hiển thị.
  5. `getLatestProducts(limit)`: Truy vấn danh sách sản phẩm mới nhất được tạo.
  6. `getFlashSaleProducts(limit)`: Truy vấn danh sách sản phẩm có `sale_price IS NOT NULL` và `sale_price < base_price`.
  7. `searchLive(keyword, limit)`: Truy vấn nhanh theo tên sản phẩm hoặc mã sản phẩm phục vụ Live Search.
- **Static Methods:** Không có (0 phương thức).
- **Attached Functions:** Không có.
- **Export Pattern:** `module.exports = new ProductRepository();` (Singleton Instance tại dòng 275).
- **Dependencies:** `database.js`.
- **Use Cases liên quan:** UC05 (Tìm kiếm & Chi tiết sản phẩm).

#### 12. `WishlistRepository`
- **File path:** [src/models/repositories/wishlist.repository.js:3](file:///c:/Users/Admin/Desktop/d%E1%BB%B1%20%C3%A1n%20JAV/src/models/repositories/wishlist.repository.js#L3).
- **Constructor:** Không khai báo Explicit Constructor (Sử dụng Implicit Default Constructor).
- **Instance Methods (7 phương thức truy vấn CSDL):**
  1. `findByUserId(userId)`: Truy vấn bảng `wishlist_items` join với `products`, `product_images`, `categories` để lấy đầy đủ dữ liệu hiển thị.
  2. `findProductById(productId)`: Kiểm tra sự tồn tại và tính hợp lệ của sản phẩm theo ID.
  3. `isInWishlist(userId, productId)`: Kiểm tra xem sản phẩm đã có trong wishlist của người dùng hay chưa (`COUNT(*)`).
  4. `addItem(userId, productId)`: Thêm mới bản ghi vào bảng `wishlist_items`.
  5. `removeItem(userId, productId)`: Xóa bản ghi khỏi bảng `wishlist_items` theo `user_id` và `product_id`.
  6. `clearWishlist(userId)`: Xóa toàn bộ bản ghi của người dùng trong bảng `wishlist_items`.
  7. `countByUserId(userId)`: Đếm tổng số lượng món đồ trong wishlist của người dùng.
- **Static Methods:** Không có (0 phương thức).
- **Attached Functions:** Không có.
- **Export Pattern:** `module.exports = new WishlistRepository();` (Singleton Instance tại dòng 132).
- **Dependencies:** `database.js`.
- **Use Cases liên quan:** UC15 (Quản lý danh sách yêu thích).

---

# PHẦN 3: APPLICATION MODULES INVENTORY (DANH MỤC THÀNH PHẦN ỨNG DỤNG TÍCH HỢP)

Dưới đây là bảng tổng hợp toàn diện mọi thành phần mã nguồn ứng dụng trong `src/` và `server.js`, phân định rõ ràng giữa JavaScript Classes, các Module CommonJS (Function / Object exports), và Thư viện bên ngoài:

| STT | Tên Thành Phần (Name) | Đường Dẫn Tệp Tin (File Path) | Phân Loại Cấu Trúc (Type) | Kiểu Export (Export Style) | Trách Nhiệm Nghiệp Vụ Cốt Lõi (Responsibility) | Danh Sách Hàm / Phương Thức Thực Tế (Methods) | Phụ Thuộc Trực Tiếp (Dependencies) | Bảng CSDL Tác Động (Database Tables) | Use Cases Liên Quan |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | `AccountController` | `src/controllers/account.controller.js` | JavaScript Class | `new AccountController()` | Điều phối tài khoản khách hàng, hồ sơ, địa chỉ, đơn cá nhân | `getOrders`, `getOrderDetail`, `postCancelOrder`, `getProfile`, `postProfile`, `getAddresses`, `postAddAddress` | `order.service.js`, `database.js`, `validator.js` | `users`, `addresses`, `orders` | UC04, UC08, UC09 |
| 2 | `AdminController` | `src/controllers/admin.controller.js` | JavaScript Class | `new AdminController()` | Trung tâm quản trị: Dashboard KPI, sản phẩm, kho, voucher, khách | 28 methods: `getDashboard`, `getOrders`, `postUpdateOrderStatus`, `postCreateProduct`, `postAdjustInventory`,... | `database.js`, `order.service.js` | 18 bảng nghiệp vụ (trừ carts, wishlist) | UC10, UC11, UC12, UC13, UC14, UC16 |
| 3 | `AuthController` | `src/controllers/auth.controller.js` | JavaScript Class | `authController` instance | Quản lý xác thực, đăng ký, đăng nhập, bảo vệ phiên, đồng bộ giỏ hàng | 5 instance methods: `getLogin`, `postLogin`, `getRegister`, `postRegister`, `postLogout` + 1 attached: `getSafeReturnUrl` | `bcryptjs`, `database.js`, `cart.controller.js`, `validator.js` | `users`, `carts` | UC01, UC02 |
| 4 | `CartController` | `src/controllers/cart.controller.js` | JavaScript Class | `cartControllerInstance` | Quản lý giỏ hàng DB/Session, thêm/sửa/xóa món, merge giỏ vãng lai | 6 instance: `index`, `addItem`, `buyNow`, `updateItem`, `clearCart`, `removeItem` + 1 static: `mergeGuestCart` + 1 attached: `validateCartQuantity` | `database.js` | `carts`, `cart_items`, `product_variants`, `products` | UC06, UC01, UC02 |
| 5 | `CheckoutController` | `src/controllers/checkout.controller.js` | JavaScript Class | `new CheckoutController()` | Điều phối thanh toán COD, kiểm tra giỏ, nạp địa chỉ, hoàn tất đơn | `getCheckout`, `postCheckout`, `getSuccess` | `order.service.js`, `database.js`, `validator.js` | `carts`, `cart_items`, `addresses` | UC07 |
| 6 | `ProductController` | `src/controllers/product.controller.js` | JavaScript Class | `new ProductController()` | Điều phối hiển thị danh mục sản phẩm, bộ lọc, chi tiết sản phẩm, Live Search | `index`, `detail`, `liveSearch` | `product.service.js` | Không gọi trực tiếp DB (ủy quyền Service) | UC05 |
| 7 | `WishlistController` | `src/controllers/wishlist.controller.js` | JavaScript Class | `new WishlistController()` | Điều phối danh sách yêu thích, thêm/xóa/toggle món, migrate legacy | `getWishlist`, `addItem`, `toggleItem`, `removeItem`, `clearWishlist`, `migrateLegacy` | `wishlist.service.js` | Không gọi trực tiếp DB (ủy quyền Service) | UC15 |
| 8 | `homeController` | `src/controllers/home.controller.js` | Object Module | `module.exports = { index, setLocale }` | Kết xuất trang chủ (Banners, Sản phẩm mới, Flash Sale) và đổi ngôn ngữ | `index(req, res, next)`, `setLocale(req, res)` | `product.service.js` | Không gọi trực tiếp DB (ủy quyền Service) | UC05 |
| 9 | `OrderService` | `src/services/order.service.js` | JavaScript Class | `new OrderService()` | Điều phối logic giao dịch đơn hàng COD, hủy đơn hoàn kho, cập nhật trạng thái | `createCodOrder`, `_executeCancellation`, `cancelOrder`, `updateOrderStatusByAdmin`, `getOrdersByUser`, `getCustomerOrders`, `getOrderDetails` | `database.js` | `orders`, `order_items`, `product_variants`, `inventory_transactions`, `vouchers`, `voucher_usages`, `cart_items`, `order_status_histories` | UC07, UC08, UC09, UC10 |
| 10 | `ProductService` | `src/services/product.service.js` | JavaScript Class | `new ProductService()` | Xử lý logic nghiệp vụ danh mục, bộ lọc, sản phẩm mới, flash sale, tìm kiếm | `getCatalog`, `getProductBySlug`, `getAllCategories`, `getHomeBanners`, `getLatestProducts`, `getFlashSaleProducts`, `searchLive` | `product.repository.js` | Không gọi trực tiếp DB (ủy quyền Repo) | UC05 |
| 11 | `WishlistService` | `src/services/wishlist.service.js` | JavaScript Class | `new WishlistService()` | Xử lý logic nghiệp vụ danh sách yêu thích, kiểm tra trùng lặp, toggle | `getWishlist`, `addItem`, `toggleItem`, `removeItem`, `clearWishlist`, `migrateLegacyWishlist` | `wishlist.repository.js` | Không gọi trực tiếp DB (ủy quyền Repo) | UC15 |
| 12 | `ProductRepository` | `src/models/repositories/product.repository.js` | JavaScript Class | `new ProductRepository()` | Thực thi các câu truy vấn T-SQL lấy dữ liệu sản phẩm, danh mục, biến thể, ảnh | `findAll`, `findBySlug`, `getCategories`, `getBanners`, `getLatestProducts`, `getFlashSaleProducts`, `searchLive` | `database.js` | `products`, `product_variants`, `product_images`, `categories`, `brands`, `sizes`, `colors`, `banners` | UC05 |
| 13 | `WishlistRepository` | `src/models/repositories/wishlist.repository.js` | JavaScript Class | `new WishlistRepository()` | Thực thi các câu truy vấn T-SQL thao tác trên bảng `wishlist_items` | `findByUserId`, `findProductById`, `isInWishlist`, `addItem`, `removeItem`, `clearWishlist`, `countByUserId` | `database.js` | `wishlist_items`, `products`, `product_images`, `categories` | UC15 |
| 14 | `authMiddleware` | `src/middlewares/auth.middleware.js` | Object Module | `module.exports = { ... }` | Quản lý phiên, bảo vệ phân quyền (Customer / Admin / Guest), gắn Pug locals | `sessionContextMiddleware`, `requireAuth`, `requireGuest`, `requireCustomer`, `requireAdmin` | `database.js` | `users` (kiểm tra status active/locked) | UC01, UC02, UC04, UC06-UC16 |
| 15 | `csrfMiddleware` | `src/middlewares/csrf.middleware.js` | Function Module | `module.exports = csrfMiddleware` | Tạo token CSRF mã hóa ngẫu nhiên, gắn vào view, kiểm tra token trên request POST | `csrfMiddleware(req, res, next)` | `crypto` | Không thao tác CSDL | Toàn bộ ứng dụng |
| 16 | `errorMiddleware` | `src/middlewares/error.middleware.js` | Object Module | `module.exports = { notFoundHandler, errorHandler }` | Bắt lỗi 404, xử lý lỗi hệ thống tập trung, phân hóa JSON / HTML View | `notFoundHandler(req, res, next)`, `errorHandler(err, req, res, next)` | Express Engine | Không thao tác CSDL | Toàn bộ ứng dụng |
| 17 | `i18nMiddleware` | `src/middlewares/i18n.middleware.js` | Function Module | `module.exports = i18nMiddleware` | Bản địa hóa đa ngôn ngữ (Tiếng Việt `vi` / Tiếng Anh `en`) trong phiên SSR | `i18nMiddleware(req, res, next)` | `src/locales/` | Không thao tác CSDL | Toàn bộ ứng dụng |
| 18 | `database` | `src/config/database.js` | Object Module | `module.exports = { getPool, closePool, testDbConnection, query, sql }` | Quản trị Connection Pool SQL Server, cung cấp hàm truy vấn an toàn, Transaction | `getPool()`, `closePool()`, `testDbConnection()`, `query(sqlText, params)` | `mssql`, `app.config.js` | Quản lý kết nối toàn bộ 21 bảng CSDL | Toàn bộ ứng dụng |
| 19 | `appConfig` | `src/config/app.config.js` | Object Module | `module.exports = { app, db, session, auth }` | Nạp biến môi trường (`.env`), cấu hình cổng, thông số MSSQL Pool, thời gian sống Session | Cấu hình Object | `dotenv` | Không thao tác CSDL | Toàn bộ ứng dụng |
| 20 | `validator` | `src/utils/validator.js` | Object Module | `module.exports = { ... }` | Tiện ích kiểm tra tính hợp lệ dữ liệu đầu vào (Email, SĐT VN, Password, Mua lẻ 1..10) | `isValidEmail`, `isValidPhone`, `isValidPassword`, `isValidFullName`, `validateCartQuantity` | Regex Patterns | Không thao tác CSDL | UC01, UC04, UC06, UC07 |
| 21 | `app` | `src/app.js` | Express App Object | `module.exports = app` | Khởi tạo Express, cấu hình middleware toàn cục, mount router, kích hoạt error handling | Cấu hình Express App | Express, Helmet, Morgan, Session, Middlewares, Routes | Không trực tiếp truy vấn | Toàn bộ ứng dụng |
| 22 | `server` | `server.js` | Executable Script | Không export (Entry point) | Khởi động HTTP Server, kiểm tra kết nối CSDL, xử lý Graceful Shutdown | Lắng nghe cổng mạng (`app.listen`), xử lý tín hiệu `SIGINT`, `SIGTERM` | `src/app.js`, `database.js` | Kiểm tra kết nối CSDL khi boot | Khởi tạo hệ thống |

---

# PHẦN 4: ĐẶC TẢ CHI TIẾT 20 DOMAIN ENTITIES (MÔ HÌNH THỰC THỂ DỮ LIỆU)

Cơ sở dữ liệu vật lý `vamos_store_db` trên SQL Server bao gồm **21 bảng vật lý**:
- **20 bảng thực thể nghiệp vụ (Domain Entities):** Phản ánh toàn bộ dữ liệu kinh doanh của hệ thống.
- **1 bảng hạ tầng kỹ thuật (Infrastructure Table):** Bảng `schema_migrations` (`version: VARCHAR(50) NOT NULL UNIQUE`, `description: NVARCHAR(255)`, `applied_at: DATETIME2 DEFAULT GETDATE()`) dùng riêng cho công cụ theo dõi phiên bản CSDL, không chứa dữ liệu nghiệp vụ nên được loại trừ khỏi Class Diagram miền nghiệp vụ.

Dưới đây là đặc tả chi tiết 100% thuộc tính, kiểu dữ liệu SQL Server, ràng buộc khóa chính, khóa ngoại, unique constraint, default value, check constraint và nguồn migration của từng thực thể:

#### 1. `User` (Bảng `users`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `full_name: NVARCHAR(100)` (NOT NULL).
  - `email: NVARCHAR(150)` (NOT NULL).
  - `password_hash: NVARCHAR(255)` (NOT NULL) — *Lưu ý: Tên cột chính xác là `password_hash`, không dùng password trần*.
  - `phone: NVARCHAR(20)` (NULL).
  - `role: NVARCHAR(20)` (NOT NULL, DEFAULT `'CUSTOMER'`).
  - `status: NVARCHAR(20)` (NOT NULL, DEFAULT `'active'`).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
  - `updated_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc duy nhất (Unique Constraints & Filtered Indexes):**
  - `UQ__users__email` (Toàn cục).
  - Filtered Unique Index `uq_users_active_email` trên `email` WHERE `status != 'locked'`.
  - Filtered Unique Index `uq_users_active_phone` trên `phone` WHERE `status != 'locked' AND phone IS NOT NULL`.
- **Ràng buộc kiểm tra (Check Constraints):**
  - `CHECK (role IN ('ADMIN', 'CUSTOMER'))`.
  - `CHECK (status IN ('active', 'locked'))`.
- **Quan hệ nghiệp vụ:** Là thực thể trung tâm của phân hệ người dùng, sở hữu `Address`, `Cart`, và liên kết với `WishlistItem`, `PasswordResetToken`, `Order`, `VoucherUsage`, `InventoryTransaction`, `OrderStatusHistory`.
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:17-27` & `002_add_filtered_indexes.sql`.

#### 2. `Address` (Bảng `addresses`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `user_id: INT` (NOT NULL, FK $\rightarrow$ `users(id)` ON DELETE CASCADE).
  - `recipient_name: NVARCHAR(100)` (NOT NULL).
  - `phone: NVARCHAR(20)` (NOT NULL).
  - `province: NVARCHAR(100)` (NOT NULL).
  - `district: NVARCHAR(100)` (NOT NULL).
  - `ward: NVARCHAR(100)` (NOT NULL).
  - `detail_address: NVARCHAR(255)` (NOT NULL).
  - `is_default: BIT` (NOT NULL, DEFAULT `0`).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
  - `updated_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc duy nhất:** Filtered Unique Index `uq_user_default_address` trên `user_id` WHERE `is_default = 1` (Mỗi khách hàng chỉ có tối đa 1 địa chỉ mặc định).
- **Quan hệ:** Thuộc quyền sở hữu hồ sơ của `User` (Composition).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:106-120`.

#### 3. `PasswordResetToken` (Bảng `password_reset_tokens`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `user_id: INT` (NOT NULL, FK $\rightarrow$ `users(id)` ON DELETE CASCADE).
  - `token: NVARCHAR(255)` (NOT NULL, UNIQUE) — *Lưu ý: Tên cột chính xác là `token`, không phải `token_hash`*.
  - `expires_at: DATETIME2` (NOT NULL).
  - `used_at: DATETIME2` (NULL).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc duy nhất:** `UNIQUE (token)`.
- **Trạng thái triển khai:** **DESIGNED ONLY — NOT IMPLEMENTED** (CSDL đã có bảng thực tế, Express chưa có route/controller xử lý).
- **Quan hệ:** Đối tượng token bảo mật kỹ thuật tạm thời liên kết với `User` (Association).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:124-133`.

#### 4. `Category` (Bảng `categories`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `name: NVARCHAR(100)` (NOT NULL).
  - `slug: NVARCHAR(120)` (NOT NULL, UNIQUE).
  - `description: NVARCHAR(MAX)` (NULL).
  - `is_active: BIT` (NOT NULL, DEFAULT `1`).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc duy nhất:** `UNIQUE (slug)`.
- **Quan hệ:** Phân loại sản phẩm (1 Category chứa 0..* Product qua Association).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:32-41`.

#### 5. `Brand` (Bảng `brands`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `name: NVARCHAR(100)` (NOT NULL).
  - `slug: NVARCHAR(120)` (NOT NULL, UNIQUE).
  - `description: NVARCHAR(MAX)` (NULL).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc duy nhất:** `UNIQUE (slug)`.
- **Quan hệ:** Nhãn hiệu sản phẩm (0..1 Brand gán cho 0..* Product qua Association).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:44-52`.

#### 6. `Size` (Bảng `sizes`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `size_name: NVARCHAR(20)` (NOT NULL, UNIQUE).
  - `display_order: INT` (NOT NULL, DEFAULT `0`).
- **Ràng buộc duy nhất:** `UNIQUE (size_name)`.
- **Quan hệ:** Bảng danh mục kích thước giày, tham chiếu bởi `ProductVariant` (Association).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:55-61`.

#### 7. `Color` (Bảng `colors`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `color_name: NVARCHAR(50)` (NOT NULL, UNIQUE).
  - `hex_code: NVARCHAR(10)` (NULL).
- **Ràng buộc duy nhất:** `UNIQUE (color_name)`.
- **Quan hệ:** Bảng danh mục màu sắc, tham chiếu bởi `ProductVariant` (Association).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:64-70`.

#### 8. `Product` (Bảng `products`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `category_id: INT` (NOT NULL, FK $\rightarrow$ `categories(id)` ON DELETE NO ACTION).
  - `brand_id: INT` (NULL, FK $\rightarrow$ `brands(id)` ON DELETE SET NULL) — *Lưu ý: `brand_id` là trường NULLABLE*.
  - `product_code: NVARCHAR(50)` (NOT NULL, UNIQUE).
  - `name: NVARCHAR(200)` (NOT NULL).
  - `slug: NVARCHAR(255)` (NOT NULL, UNIQUE).
  - `description: NVARCHAR(MAX)` (NULL).
  - `gender_target: NVARCHAR(20)` (NOT NULL, DEFAULT `'UNISEX'`).
  - `base_price: DECIMAL(12,0)` (NOT NULL).
  - `sale_price: DECIMAL(12,0)` (NULL).
  - `status: NVARCHAR(20)` (NOT NULL, DEFAULT `'active'`).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
  - `updated_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc duy nhất:** `UNIQUE (slug)`, `UNIQUE (product_code)`.
- **Ràng buộc kiểm tra (Check Constraints):**
  - `CHECK (base_price >= 0)`.
  - `CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price < base_price))`.
  - `CHECK (gender_target IN ('MEN', 'WOMEN', 'KIDS', 'UNISEX'))`.
  - `CHECK (status IN ('draft', 'active', 'inactive'))`.
- **Quan hệ:** Sở hữu `ProductImage`, `ProductVariant` (Composition); tham chiếu bởi `WishlistItem` (Association).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:148-166`.

#### 9. `ProductImage` (Bảng `product_images`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `product_id: INT` (NOT NULL, FK $\rightarrow$ `products(id)` ON DELETE CASCADE).
  - `image_url: NVARCHAR(1000)` (NOT NULL).
  - `is_primary: BIT` (NOT NULL, DEFAULT `0`).
  - `display_order: INT` (NOT NULL, DEFAULT `0`).
- **Ràng buộc duy nhất:** Filtered Unique Index `uq_product_primary_image` trên `product_id` WHERE `is_primary = 1` (Mỗi sản phẩm chỉ có duy nhất 1 ảnh đại diện chính).
- **Quan hệ:** Thuộc sở hữu của `Product` (Composition).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:170-178`.

#### 10. `ProductVariant` (Bảng `product_variants`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `product_id: INT` (NOT NULL, FK $\rightarrow$ `products(id)` ON DELETE CASCADE).
  - `size_id: INT` (NOT NULL, FK $\rightarrow$ `sizes(id)` ON DELETE NO ACTION).
  - `color_id: INT` (NOT NULL, FK $\rightarrow$ `colors(id)` ON DELETE NO ACTION).
  - `sku: NVARCHAR(100)` (NOT NULL, UNIQUE).
  - `stock_quantity: INT` (NOT NULL, DEFAULT `0`).
  - `status: NVARCHAR(20)` (NOT NULL, DEFAULT `'active'`).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
  - `updated_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc duy nhất:**
  - `UNIQUE (sku)`.
  - `UNIQUE (product_id, size_id, color_id)` (Mỗi tổ hợp Size + Color của một sản phẩm chỉ có duy nhất 1 biến thể SKU).
- **Ràng buộc kiểm tra:**
  - `CHECK (stock_quantity >= 0)`.
  - `CHECK (status IN ('active', 'inactive'))`.
- **Quan hệ:** Thuộc sở hữu của `Product` (Composition); được tham chiếu bởi `CartItem`, `OrderItem`, `InventoryTransaction`.
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:182-197`.

#### 11. `InventoryTransaction` (Bảng `inventory_transactions`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `variant_id: INT` (NOT NULL, FK $\rightarrow$ `product_variants(id)` ON DELETE NO ACTION) — *Lưu ý: Tên cột chính xác là `variant_id`*.
  - `user_id: INT` (NOT NULL, FK $\rightarrow$ `users(id)` ON DELETE NO ACTION).
  - `old_quantity: INT` (NOT NULL).
  - `new_quantity: INT` (NOT NULL).
  - `change_quantity: INT` (NOT NULL).
  - `reason: NVARCHAR(255)` (NOT NULL).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc kiểm tra:** `CHECK (old_quantity >= 0)`, `CHECK (new_quantity >= 0)`.
- **Quan hệ:** Nhật ký kiểm toán biến động kho hàng, liên kết với `ProductVariant` và `User` (Association).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:276-288`.

#### 12. `Cart` (Bảng `carts`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `user_id: INT` (NOT NULL, FK $\rightarrow$ `users(id)` ON DELETE CASCADE, UNIQUE).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
  - `updated_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc duy nhất:** `UNIQUE (user_id)` (Quan hệ 1-to-0..1 giữa Khách hàng và Giỏ hàng CSDL).
- **Quan hệ:** Thuộc quyền sở hữu của `User` (Composition 1-to-0..1), sở hữu `CartItem` (Composition).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:137-144`.

#### 13. `CartItem` (Bảng `cart_items`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `cart_id: INT` (NOT NULL, FK $\rightarrow$ `carts(id)` ON DELETE CASCADE).
  - `variant_id: INT` (NOT NULL, FK $\rightarrow$ `product_variants(id)` ON DELETE NO ACTION) — *Lưu ý: Tên cột chính xác là `variant_id`*.
  - `quantity: INT` (NOT NULL, DEFAULT `1`).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
  - `updated_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc duy nhất:** `UNIQUE (cart_id, variant_id)`.
- **Ràng buộc kiểm tra:** `CHECK (quantity > 0)`.
- **Quan hệ:** Thuộc sở hữu của `Cart` (Composition), tham chiếu `ProductVariant` (Association).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:201-212`.

#### 14. `Voucher` (Bảng `vouchers`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `code: NVARCHAR(50)` (NOT NULL, UNIQUE).
  - `name: NVARCHAR(100)` (NOT NULL).
  - `discount_type: NVARCHAR(20)` (NOT NULL).
  - `discount_value: DECIMAL(12,0)` (NOT NULL).
  - `min_order_value: DECIMAL(12,0)` (NOT NULL, DEFAULT `0`).
  - `max_discount_amount: DECIMAL(12,0)` (NULL).
  - `start_date: DATETIME2` (NOT NULL).
  - `end_date: DATETIME2` (NOT NULL).
  - `usage_limit: INT` (NOT NULL, DEFAULT `0`).
  - `used_count: INT` (NOT NULL, DEFAULT `0`).
  - `is_active: BIT` (NOT NULL, DEFAULT `1`).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc duy nhất:** `UNIQUE (code)`.
- **Ràng buộc kiểm tra:**
  - `CHECK (discount_type IN ('percentage', 'fixed_amount'))`.
  - `CHECK (discount_value > 0)`.
  - `CHECK (min_order_value >= 0)`.
  - `CHECK (usage_limit >= 0)`.
  - `CHECK (used_count >= 0)`.
  - `CHECK (end_date >= start_date)`.
- **Quan hệ:** Tham chiếu bởi `Order` (Association, 0..1 to 0..*) và `VoucherUsage` (Association).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:73-89`.

#### 15. `VoucherUsage` (Bảng `voucher_usages`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `voucher_id: INT` (NOT NULL, FK $\rightarrow$ `vouchers(id)` ON DELETE NO ACTION).
  - `user_id: INT` (NOT NULL, FK $\rightarrow$ `users(id)` ON DELETE NO ACTION).
  - `order_id: INT` (NOT NULL, FK $\rightarrow$ `orders(id)` ON DELETE CASCADE).
  - `used_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc duy nhất:** `UNIQUE (voucher_id, user_id)` (Quy tắc nghiệp vụ: Mỗi khách hàng chỉ được dùng 1 mã voucher tối đa 1 lần).
- **Quan hệ:** Ghi nhận lịch sử áp dụng voucher của khách hàng theo đơn hàng (Association).
- **Nguồn Migration:** `database/migrations/003_voucher_customer_usage.sql:6-14`.

#### 16. `Order` (Bảng `orders`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `order_code: NVARCHAR(50)` (NOT NULL, UNIQUE).
  - `user_id: INT` (NOT NULL, FK $\rightarrow$ `users(id)` ON DELETE NO ACTION).
  - `recipient_name_snapshot: NVARCHAR(100)` (NOT NULL).
  - `recipient_phone_snapshot: NVARCHAR(20)` (NOT NULL).
  - `delivery_address_snapshot: NVARCHAR(500)` (NOT NULL) — *Lưu ý: Độ dài chuẩn xác là NVARCHAR(500)*.
  - `subtotal: DECIMAL(12,0)` (NOT NULL).
  - `discount_amount: DECIMAL(12,0)` (NOT NULL, DEFAULT `0`).
  - `shipping_fee: DECIMAL(12,0)` (NOT NULL, DEFAULT `0`).
  - `total_amount: DECIMAL(12,0)` (NOT NULL).
  - `voucher_id: INT` (NULL, FK $\rightarrow$ `vouchers(id)` ON DELETE SET NULL) — *Lưu ý: `voucher_id` là trường NULLABLE*.
  - `voucher_code_snapshot: NVARCHAR(50)` (NULL).
  - `payment_method: NVARCHAR(20)` (NOT NULL, DEFAULT `'COD'`).
  - `payment_status: NVARCHAR(20)` (NOT NULL, DEFAULT `'UNPAID'`).
  - `order_status: NVARCHAR(20)` (NOT NULL, DEFAULT `'PENDING'`).
  - `customer_note: NVARCHAR(255)` (NULL).
  - `admin_note: NVARCHAR(255)` (NULL).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
  - `updated_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc duy nhất:** `UNIQUE (order_code)`.
- **Ràng buộc kiểm tra:**
  - `CHECK (subtotal >= 0)`.
  - `CHECK (discount_amount >= 0)`.
  - `CHECK (shipping_fee >= 0)`.
  - `CHECK (total_amount >= 0)`.
  - `CHECK (payment_status IN ('UNPAID', 'PAID'))`.
  - `CHECK (order_status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'))`.
- **Quan hệ:** Sở hữu `OrderItem`, `OrderStatusHistory` (Composition); liên kết `User`, `Voucher`, `VoucherUsage` (Association).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:216-239`.

#### 17. `OrderItem` (Bảng `order_items`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `order_id: INT` (NOT NULL, FK $\rightarrow$ `orders(id)` ON DELETE CASCADE).
  - `product_variant_id: INT` (NOT NULL, FK $\rightarrow$ `product_variants(id)` ON DELETE NO ACTION) — *Lưu ý: Tên cột chính xác là `product_variant_id`*.
  - `product_name_snapshot: NVARCHAR(200)` (NOT NULL).
  - `sku_snapshot: NVARCHAR(100)` (NOT NULL).
  - `size_snapshot: NVARCHAR(20)` (NOT NULL).
  - `color_snapshot: NVARCHAR(50)` (NOT NULL).
  - `unit_price: DECIMAL(12,0)` (NOT NULL).
  - `quantity: INT` (NOT NULL).
  - `line_total: DECIMAL(12,0)` (NOT NULL).
- **Ràng buộc duy nhất:** `UNIQUE (order_id, product_variant_id)`.
- **Ràng buộc kiểm tra:** `CHECK (unit_price >= 0)`, `CHECK (quantity > 0)`, `CHECK (line_total >= 0)`.
- **Quan hệ:** Thuộc quyền sở hữu của `Order` (Composition), liên kết với `ProductVariant` (Association).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:243-257`.

#### 18. `OrderStatusHistory` (Bảng `order_status_histories`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `order_id: INT` (NOT NULL, FK $\rightarrow$ `orders(id)` ON DELETE CASCADE).
  - `changed_by: INT` (NOT NULL, FK $\rightarrow$ `users(id)` ON DELETE NO ACTION).
  - `previous_status: NVARCHAR(50)` (NULL).
  - `new_status: NVARCHAR(50)` (NOT NULL).
  - `note: NVARCHAR(255)` (NULL).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Quan hệ:** Thuộc sở hữu của `Order` (Composition), liên kết với `User` (Association).
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:261-272`.

#### 19. `WishlistItem` (Bảng `wishlist_items`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `user_id: INT` (NOT NULL, FK $\rightarrow$ `users(id)` ON DELETE CASCADE).
  - `product_id: INT` (NOT NULL, FK $\rightarrow$ `products(id)` ON DELETE CASCADE).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Ràng buộc duy nhất:** `UNIQUE (user_id, product_id)`.
- **Quan hệ:** Thực thể liên kết (Associative Entity) nối `User` và `Product` qua **Association**.
- **Nguồn Migration:** `database/migrations/004_create_wishlist_items.sql:7-16`.

#### 20. `Banner` (Bảng `banners`)
- **Khóa chính (PK):** `id: INT` (IDENTITY, NOT NULL).
- **Thuộc tính & Kiểu dữ liệu SQL Server:**
  - `title: NVARCHAR(150)` (NOT NULL).
  - `image_url: NVARCHAR(255)` (NOT NULL).
  - `link_url: NVARCHAR(255)` (NULL).
  - `display_order: INT` (NOT NULL, DEFAULT `0`).
  - `is_active: BIT` (NOT NULL, DEFAULT `1`).
  - `created_at: DATETIME2` (NOT NULL, DEFAULT `GETDATE()`).
- **Quan hệ:** Bảng cấu hình độc lập hiển thị quảng cáo trang chủ, không có khóa ngoại FK.
- **Nguồn Migration:** `database/migrations/001_initial_schema.sql:93-102`.

---

# PHẦN 5: RELATIONSHIP ANALYSIS — KIỂM ĐỊNH NGỮ NGHĨA UML 2.5 CHO 24 FOREIGN KEYS

Căn cứ trên 24 Khóa ngoại (Foreign Keys) được kiểm chứng trực tiếp từ hệ thống `sys.foreign_keys` của SQL Server, dưới đây là bảng phân tích toàn diện 24 mối quan hệ, đối chiếu chặt chẽ giữa **Bản số lược đồ CSDL (Schema Multiplicity)**, **Quy tắc bất biến ứng dụng (Application Invariant)** và **Ngữ nghĩa quan hệ UML 2.5 (Composition vs Association)**.

### 5.1. Bảng phân tích chi tiết 24 mối quan hệ Foreign Key

| STT | Thực Thể Nguồn (A) | Thực Thể Đích (B) | Cột Khóa Ngoại (FK Column) | Cột FK Nullable | Hành Vi Xóa (ON DELETE) | Schema Multiplicity (CSDL thuần túy) | Application Invariant (Nghiệp vụ ứng dụng) | Loại Quan Hệ UML 2.5 | Tên Ràng Buộc FK | Ngữ Nghĩa Sở Hữu & Lý Do Lựa Chọn Loại Quan Hệ UML |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `User` | `Address` | `addresses.user_id` | NOT NULL | CASCADE | `1` : `0..*` | `1` : `0..*` | **Composition** | `fk_addresses_user` | Sổ địa chỉ thuộc sở hữu độc quyền của User; địa chỉ không chia sẻ cho user khác; User xóa thì địa chỉ bị xóa theo. |
| 2 | `User` | `Cart` | `carts.user_id` | NOT NULL | CASCADE | `1` : `0..1` | `1` : `1` *(Khi đăng ký)* | **Composition** | `fk_carts_user` | CSDL có `UNIQUE(user_id)` nên tối đa 1 Cart. Về mặt CSDL là 1 to 0..1; khi đăng ký mã nguồn luôn tạo Cart (Application Invariant). Giỏ thuộc sở hữu của User. |
| 3 | `User` | `Order` | `orders.user_id` | NOT NULL | NO ACTION | `1` : `0..*` | `1` : `0..*` | **Association** | `fk_orders_user` | Đơn hàng có vòng đời độc lập phục vụ kiểm toán thuế/kế toán; User bị khóa/xóa thì đơn hàng vẫn được lưu vết (NO ACTION). |
| 4 | `User` | `WishlistItem` | `wishlist_items.user_id` | NOT NULL | CASCADE | `1` : `0..*` | `1` : `0..*` | **Association** *(Hiệu chỉnh)* | `fk_wishlist_items_user` | **Hiệu chỉnh từ Composition sang Association.** Lý do: `WishlistItem` chịu 2 FK CASCADE đồng thời (`user_id` và `product_id`). UML 2.5 cấm một part có 2 composite owners. Đây là Associative Entity. |
| 5 | `User` | `PasswordResetToken` | `password_reset_tokens.user_id` | NOT NULL | CASCADE | `1` : `0..*` | `1` : `0..1` *(Active)* | **Association** *(Hiệu chỉnh)* | `fk_pwd_reset_user` | **Hiệu chỉnh từ Composition sang Association.** Lý do: Token là đối tượng bảo mật kỹ thuật tạm thời, không phải bộ phận cấu thành thực thể User trong domain model. CASCADE chỉ là dọn rác kỹ thuật. |
| 6 | `User` | `VoucherUsage` | `voucher_usages.user_id` | NOT NULL | NO ACTION | `1` : `0..*` | `1` : `0..*` | **Association** | `FK_voucher_usages_user` | Sổ cái ghi nhận lịch sử áp dụng voucher của người dùng; bảo toàn khi tài khoản bị khóa. |
| 7 | `User` | `InventoryTransaction` | `inventory_transactions.user_id` | NOT NULL | NO ACTION | `1` : `0..*` | `1` : `0..*` | **Association** | `fk_inv_trans_user` | Nhật ký biến động kho ghi nhận mã người dùng hoặc Admin thực hiện; không cascade xóa log. |
| 8 | `User` | `OrderStatusHistory` | `order_status_histories.changed_by` | NOT NULL | NO ACTION | `1` : `0..*` | `1` : `0..*` | **Association** | `fk_order_histories_user` | Nhật ký lịch sử trạng thái ghi nhận người thao tác (`changed_by`); bảo toàn lịch sử. |
| 9 | `Category` | `Product` | `products.category_id` | NOT NULL | NO ACTION | `1` : `0..*` | `1` : `0..*` | **Association** | `fk_products_category` | Danh mục phân loại sản phẩm; Category tồn tại hoàn toàn độc lập với sản phẩm (không phải Whole-Part). |
| 10 | `Brand` | `Product` | `products.brand_id` | **NULLABLE** | SET NULL | `0..1` : `0..*` | `0..1` : `0..*` | **Association** | `fk_products_brand` | Nhãn hiệu có thể gán hoặc để trống (`brand_id` NULL). Xóa Brand gán `brand_id = NULL`. Phía Brand là `0..1`. |
| 11 | `Product` | `ProductImage` | `product_images.product_id` | NOT NULL | CASCADE | `1` : `0..*` | `1` : `1..*` *(Active)* | **Composition** | `fk_product_images_product` | Ảnh sản phẩm thuộc sở hữu độc quyền của Product, không chia sẻ; xóa Product xóa toàn bộ ảnh. CSDL thuần túy là `0..*`, UI active yêu cầu $\ge 1$ ảnh. |
| 12 | `Product` | `ProductVariant` | `product_variants.product_id` | NOT NULL | CASCADE | `1` : `0..*` | `1` : `1..*` *(Admin)* | **Composition** | `fk_variants_product` | Biến thể (SKU) là bộ phận cấu thành thiết yếu của sản phẩm; xóa Product xóa các biến thể. CSDL thuần túy là `0..*`, code tạo ma trận biến thể $\ge 1$. |
| 13 | `Product` | `WishlistItem` | `wishlist_items.product_id` | NOT NULL | CASCADE | `1` : `0..*` | `1` : `0..*` | **Association** | `fk_wishlist_items_product` | Sản phẩm được tham chiếu trong mục yêu thích. Không thể là Composition vì WishlistItem đã nối với User. |
| 14 | `Size` | `ProductVariant` | `product_variants.size_id` | NOT NULL | NO ACTION | `1` : `0..*` | `1` : `0..*` | **Association** | `fk_variants_size` | Bảng từ điển danh mục kích cỡ chuẩn; Size tồn tại độc lập với biến thể. |
| 15 | `Color` | `ProductVariant` | `product_variants.color_id` | NOT NULL | NO ACTION | `1` : `0..*` | `1` : `0..*` | **Association** | `fk_variants_color` | Bảng từ điển danh mục màu sắc chuẩn; Color tồn tại độc lập với biến thể. |
| 16 | `Cart` | `CartItem` | `cart_items.cart_id` | NOT NULL | CASCADE | `1` : `0..*` | `1` : `0..*` | **Composition** | `fk_cart_items_cart` | Dòng món hàng thuộc sở hữu trọn vẹn của Giỏ hàng; xóa Giỏ hàng xóa sạch món hàng bên trong. |
| 17 | `ProductVariant` | `CartItem` | `cart_items.variant_id` | NOT NULL | NO ACTION | `1` : `0..*` | `1` : `0..*` | **Association** | `fk_cart_items_variant` | Món trong giỏ tham chiếu tới biến thể cụ thể để hiển thị giá và trừ kho; không xóa biến thể khi xóa giỏ. |
| 18 | `ProductVariant` | `OrderItem` | `order_items.product_variant_id` | NOT NULL | NO ACTION | `1` : `0..*` | `1` : `0..*` | **Association** | `fk_order_items_variant` | Món trong đơn tham chiếu tới biến thể để phục vụ kiểm tra/hoàn tồn kho; bảo toàn khi biến thể ngưng bán. |
| 19 | `ProductVariant` | `InventoryTransaction` | `inventory_transactions.variant_id` | NOT NULL | NO ACTION | `1` : `0..*` | `1` : `0..*` | **Association** | `fk_inv_trans_variant` | Nhật ký biến động kho ghi nhận mã biến thể SKU được điều chỉnh; log tồn tại vĩnh viễn độc lập. |
| 20 | `Order` | `OrderItem` | `order_items.order_id` | NOT NULL | CASCADE | `1` : `0..*` | `1` : `1..*` *(Create)* | **Composition** | `fk_order_items_order` | Dòng chi tiết đơn hàng (snapshot giá, tên) thuộc sở hữu của Đơn hàng; xóa Đơn xóa sạch dòng hàng. CSDL là `0..*`, checkout tạo $\ge 1$ item. |
| 21 | `Order` | `OrderStatusHistory` | `order_status_histories.order_id` | NOT NULL | CASCADE | `1` : `0..*` | `1` : `1..*` *(Create)* | **Composition** | `fk_order_histories_order` | Lịch sử trạng thái gắn liền với vòng đời của Đơn hàng; xóa Đơn xóa sạch lịch sử. Checkout luôn tạo log khởi tạo `PENDING`. |
| 22 | `Order` | `VoucherUsage` | `voucher_usages.order_id` | NOT NULL | CASCADE | `1` : `0..*` | `1` : `0..1` *(Checkout)* | **Association** | `FK_voucher_usages_order` | **Schema Multiplicity:** `Order 1 — 0..* VoucherUsage`. CSDL không có ràng buộc `UNIQUE(order_id)` hay Unique Index trên `order_id` (chỉ có `UNIQUE(voucher_id, user_id)`), do đó bản số CSDL thuần túy cho phép 0..*.<br>**Application Invariant:** A single order uses at most one voucher in the current checkout workflow (`1` : `0..1`). |
| 23 | `Voucher` | `Order` | `orders.voucher_id` | **NULLABLE** | SET NULL | `0..1` : `0..*` | `0..1` : `0..*` | **Association** | `fk_orders_voucher` | Đơn hàng có thể không áp dụng mã voucher (`voucher_id` NULL). Phía Voucher là `0..1`. |
| 24 | `Voucher` | `VoucherUsage` | `voucher_usages.voucher_id` | NOT NULL | NO ACTION | `1` : `0..*` | `1` : `0..*` | **Association** | `FK_voucher_usages_voucher` | Mã voucher liên kết với sổ cái lịch sử sử dụng để kiểm soát giới hạn 1 lần/khách. |

---

### 5.2. Luận cứ ngữ nghĩa UML 2.5: Đánh giá chuyên sâu Composition vs Association

Quy chuẩn UML 2.5 định nghĩa: **Composition (Composite Aggregation)** là một dạng liên kết Whole–Part cực kỳ chặt chẽ với hai điều kiện tiên quyết:
1. **Quyền sở hữu duy nhất (Exclusive Ownership):** Một đối tượng thành phần (Part) chỉ có thể thuộc về **duy nhất một** đối tượng sở hữu (Composite Whole) tại một thời điểm. Multiplicity phía Whole tối đa là `1` hoặc `0..1`, tuyệt đối không bao giờ là `*`.
2. **Sinh mệnh đồng nhất (Coincident / Dependent Lifetime):** Đối tượng Part không có ý nghĩa tồn tại độc lập nếu thiếu Whole; khi Whole bị tiêu hủy, Part bắt buộc phải bị tiêu hủy theo.

Dựa trên nguyên tắc học thuật này, nhóm kiến trúc đã thực hiện đánh giá độc lập và điều chỉnh:

- **7 quan hệ Composition thực sự hợp lệ (Giữ nguyên hình thoi đen):**
  1. `Product` $\blacklozenge\longrightarrow$ `ProductImage`: Ảnh sản phẩm không thể chia sẻ cho sản phẩm khác, không có FK nào khác sở hữu, khi xóa sản phẩm ảnh bị hủy hoàn toàn.
  2. `Product` $\blacklozenge\longrightarrow$ `ProductVariant`: Biến thể SKU là bộ phận cấu thành trực tiếp của sản phẩm trong catalog; xóa sản phẩm xóa sạch toàn bộ biến thể.
  3. `Cart` $\blacklozenge\longrightarrow$ `CartItem`: Mục giỏ hàng chỉ tồn tại trong một giỏ hàng cụ thể; xóa giỏ hàng xóa sạch các mục.
  4. `Order` $\blacklozenge\longrightarrow$ `OrderItem`: Chi tiết dòng hàng snapshot thuộc về một đơn hàng duy nhất; xóa đơn hàng xóa chi tiết.
  5. `Order` $\blacklozenge\longrightarrow$ `OrderStatusHistory`: Lịch sử trạng thái là audit log nội tại gắn với đơn hàng; xóa đơn hàng xóa lịch sử.
  6. `User` $\blacklozenge\longrightarrow$ `Address`: Sổ địa chỉ thuộc quyền sở hữu riêng tư của một khách hàng; không dùng chung giữa các khách hàng; xóa tài khoản xóa toàn bộ địa chỉ.
  7. `User` $\blacklozenge\longrightarrow$ `Cart`: Giỏ hàng CSDL thuộc sở hữu của duy nhất một người dùng (`UNIQUE(user_id)`); xóa người dùng xóa giỏ hàng.

- **2 quan hệ được HIỆU CHỈNH từ Composition sang Association (Đường thẳng mũi tên đơn):**
  1. **`User` — `WishlistItem` (Chuyển sang Association):**
     - *Phân tích:* Bảng `wishlist_items` chịu 2 khóa ngoại có `ON DELETE CASCADE` đồng thời: `user_id` $\rightarrow$ `users(id)` VÀ `product_id` $\rightarrow$ `products(id)`.
     - *Lý do ngữ nghĩa UML:* Theo chuẩn UML 2.5, một Part **không thể có cùng lúc hai Composite Owners** (`User` và `Product`). Hơn nữa, `wishlist_items` đóng vai trò là một **Associative Entity (Bảng liên kết Nhiều - Nhiều)** kết nối giữa Khách hàng và Sản phẩm yêu thích. Việc gán hình thoi đen Composition từ User sẽ phá vỡ ngữ nghĩa chuẩn hóa UML. Vì vậy, quan hệ này được chuẩn hóa thành **Association**!
  2. **`User` — `PasswordResetToken` (Chuyển sang Association):**
     - *Phân tích:* Mã token đặt lại mật khẩu là một thực thể bảo mật tạm thời (transient technical security token) có thời hạn sống ngắn (`expires_at`), không phải là một "bộ phận cấu thành" (part) của đối tượng Người (User) trong mô hình miền thực tế.
     - *Lý do ngữ nghĩa UML:* Ràng buộc `ON DELETE CASCADE` ở mức CSDL chỉ là một **chiến lược dọn rác dữ liệu tự động (data cleanup strategy)** của DBA, không đồng nghĩa với quyền sở hữu Whole-Part trong mô hình hướng đối tượng. Do đó, quan hệ này được xác lập chính xác là **Association**!

---

# PHẦN 6: USE CASE MAPPING CHO TOÀN BỘ 16 USE CASES CHUẨN HÓA

Bảng đối soát đảm bảo tính nhất quán tuyệt đối giữa 16 Sơ đồ Tuần tự (SD01–SD16), 16 Sơ đồ Hoạt động (AD01–AD16) và các thành phần lớp/module trong hệ thống:

| Mã UC | Tên Use Case Nghiệp Vụ | Controller Module | Service Module | Repository Module | Domain Entities Tác Động | Other Modules & Helpers | Trạng Thái Triển Khai (Implementation Status) |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **UC01** | Đăng ký tài khoản | `AuthController` | *(Direct Controller-to-DB)* | *(Direct Controller-to-DB)* | `User`, `Cart`, `CartItem` | `bcryptjs`, `validator`, `CartController.mergeGuestCart`, `database.js` | **Đã triển khai** |
| **UC02** | Đăng nhập hệ thống | `AuthController` | *(Direct Controller-to-DB)* | *(Direct Controller-to-DB)* | `User`, `Cart`, `CartItem` | `bcryptjs`, `req.session.regenerate()`, `CartController.mergeGuestCart`, `database.js` | **Đã triển khai** |
| **UC03** | Khôi phục mật khẩu | *(Chưa có trong Express)* | *(Chưa có trong Express)* | *(Chưa có trong Express)* | `User`, `PasswordResetToken` | *(Chưa có trong Express)* | **DESIGNED ONLY — NOT IMPLEMENTED** (CSDL đã có bảng `password_reset_tokens`) |
| **UC04** | Quản lý hồ sơ & Sổ địa chỉ | `AccountController` | *(Direct Controller-to-DB)* | *(Direct Controller-to-DB)* | `User`, `Address` | `validator`, `authMiddleware.requireCustomer`, `database.js` | **Đã triển khai** |
| **UC05** | Tìm kiếm & Chi tiết sản phẩm | `ProductController`, `homeController` | `ProductService` | `ProductRepository` | `Product`, `ProductVariant`, `Category`, `Brand`, `ProductImage`, `Size`, `Color`, `Banner` | `database.js`, Pug View Engine | **Đã triển khai** |
| **UC06** | Quản lý giỏ hàng | `CartController` | *(Direct Controller-to-DB & Session)* | *(Direct Controller-to-DB)* | `Cart`, `CartItem`, `ProductVariant`, `Product` | `CartController.validateCartQuantity`, `csrfMiddleware`, `database.js` | **Đã triển khai** |
| **UC07** | Đặt hàng thanh toán COD | `CheckoutController` | `OrderService:createCodOrder` | *(Direct Database Access via sql.Transaction)* | `Order`, `OrderItem`, `ProductVariant`, `InventoryTransaction`, `Voucher`, `VoucherUsage`, `Cart`, `CartItem`, `OrderStatusHistory` | `validator`, `csrfMiddleware`, `authMiddleware`, `database.js` (Khóa bi quan `UPDLOCK, ROWLOCK, HOLDLOCK`) | **Đã triển khai** |
| **UC08** | Tra cứu & Theo dõi đơn hàng | `AccountController` | `OrderService:getOrdersByUser, getOrderDetails` | *(Direct Database Access via query)* | `Order`, `OrderItem`, `OrderStatusHistory` | `authMiddleware.requireCustomer`, `database.js` | **Đã triển khai** |
| **UC09** | Khách hàng hủy đơn hàng | `AccountController` | `OrderService:cancelOrder, _executeCancellation` | *(Direct Database Access via sql.Transaction)* | `Order`, `OrderItem`, `ProductVariant`, `InventoryTransaction`, `Voucher`, `VoucherUsage`, `OrderStatusHistory` | `authMiddleware.requireCustomer`, `csrfMiddleware`, `database.js` (Khóa bi quan `UPDLOCK, ROWLOCK`) | **Đã triển khai** |
| **UC10** | Admin xử lý & Cập nhật đơn | `AdminController` | `OrderService:updateOrderStatusByAdmin, _executeCancellation` | *(Direct Database Access via sql.Transaction)* | `Order`, `OrderItem`, `ProductVariant`, `InventoryTransaction`, `Voucher`, `VoucherUsage`, `OrderStatusHistory` | `authMiddleware.requireAdmin`, `csrfMiddleware`, `database.js`, State Machine `VALID_TRANSITIONS` | **Đã triển khai** |
| **UC11** | Quản lý kho hàng & Tồn kho | `AdminController` | *(Direct Controller-to-DB)* | *(Direct Controller-to-DB)* | `ProductVariant`, `InventoryTransaction`, `Product`, `Size`, `Color` | `authMiddleware.requireAdmin`, `csrfMiddleware`, `database.js` (`sql.Transaction` với `UPDLOCK, ROWLOCK`) | **Đã triển khai** |
| **UC12** | Quản lý danh mục & Sản phẩm | `AdminController` | *(Direct Controller-to-DB)* | *(Direct Controller-to-DB)* | `Category`, `Brand`, `Product`, `ProductImage`, `ProductVariant`, `Size`, `Color`, `Banner` | `authMiddleware.requireAdmin`, `csrfMiddleware`, `database.js` (`sql.Transaction` tạo SKU ma trận biến thể) | **Đã triển khai** |
| **UC13** | Quản lý mã giảm giá | `AdminController` | *(Direct Controller-to-DB)* | *(Direct Controller-to-DB)* | `Voucher`, `VoucherUsage` | `authMiddleware.requireAdmin`, `csrfMiddleware`, `database.js` | **Đã triển khai** |
| **UC14** | Báo cáo doanh thu & Dashboard | `AdminController` | *(Direct Controller-to-DB)* | *(Direct Controller-to-DB)* | `Order`, `OrderItem`, `ProductVariant`, `Product` | `authMiddleware.requireAdmin`, `database.js` (`Promise.all` 9 truy vấn song song + 1 tuần tự; doanh thu `COMPLETED` & `PAID`) | **Đã triển khai** |
| **UC15** | Quản lý danh sách yêu thích | `WishlistController` | `WishlistService` | `WishlistRepository` | `WishlistItem`, `Product`, `ProductImage` | `csrfMiddleware`, `authMiddleware.requireCustomer`, `database.js`, `main.js` | **Đã triển khai** |
| **UC16** | Quản lý khách hàng | `AdminController` | *(Direct Controller-to-DB)* | *(Direct Controller-to-DB)* | `User`, `Address`, `Order` | `authMiddleware.requireAdmin`, `csrfMiddleware`, `database.js` (Chặn khóa tài khoản role `ADMIN`) | **Đã triển khai** |

---

# PHẦN 7: XÁC MINH CƠ SỞ DỮ LIỆU & RECONCILIATION MIGRATIONS

### 7.1. Đối chiếu giữa file Schema tổng hợp và các Migrations
Một phát hiện quan trọng từ quá trình kiểm toán mã nguồn và CSDL:
1. **Tệp Schema tổng hợp `database/mssql_schema.sql`:**
   - Chứa **20 câu lệnh `CREATE TABLE`**:
     - 1 bảng hạ tầng: `schema_migrations`.
     - 19 bảng nghiệp vụ: `users`, `categories`, `brands`, `sizes`, `colors`, `vouchers`, `banners`, `addresses`, `password_reset_tokens`, `carts`, `products`, `product_images`, `product_variants`, `cart_items`, `orders`, `order_items`, `order_status_histories`, `inventory_transactions`, `voucher_usages`.
     - **Không chứa bảng `wishlist_items`**.
2. **Thư mục `database/migrations/`:**
   - Bao gồm **4 tệp migration** được đánh số thứ tự:
     - `001_initial_schema.sql`: Khởi tạo 18 bảng nghiệp vụ ban đầu (chưa có `voucher_usages` và `wishlist_items`).
     - `002_add_filtered_indexes.sql`: Bổ sung 2 filtered unique index trên bảng `users` (`uq_users_active_email`, `uq_users_active_phone`). Không tạo bảng mới.
     - `003_voucher_customer_usage.sql`: Tạo thêm bảng `voucher_usages` (kiểm soát 1 khách dùng voucher 1 lần).
     - `004_create_wishlist_items.sql`: Tạo thêm bảng `wishlist_items` (lưu trữ danh sách yêu thích của khách hàng).
3. **Phân loại bảng vật lý thực tế:**
   - **Tổng số bảng vật lý:** **21 bảng** (20 bảng nghiệp vụ + 1 bảng hệ thống `schema_migrations`).
   - **Số bảng Domain Entities nghiệp vụ:** **20 bảng** (18 bảng từ 001 + 1 bảng từ 003 + 1 bảng từ 004).

### 7.2. Kết quả kiểm chứng Runtime trên CSDL SQL Server trực tiếp
- **Trạng thái kết nối CSDL Runtime:** **VERIFIED (Active & Online)**.
- **Kết quả truy vấn `INFORMATION_SCHEMA.TABLES`:** Xác nhận đủ 21 bảng BASE TABLE đang tồn tại trên CSDL `vamos_store_db`.
- **Kết quả truy vấn `schema_migrations`:**
  - `001_initial_schema`: Applied at `2026-11-11T18:32:03.340Z`.
  - `002_add_filtered_indexes`: Applied at `2026-11-11T18:32:03.423Z`.
  - `003_voucher_customer_usage`: Applied at `2026-11-11T23:21:45.333Z`.
  - `004_create_wishlist_items`: Applied at `2026-11-13T23:25:18.016Z`.
- **Kết quả truy vấn `sys.foreign_keys`:** Xác nhận chính xác **24 foreign keys**, 0 ngoại lệ, 0 sai lệch.

---

# PHẦN 8: BẢN THIẾT KẾ CHI TIẾT BỘ SƠ ĐỒ LỚP UML (CD01–CD06)

Nhằm đảm bảo tính trực quan, khoa học, phân định rõ ràng các ranh giới miền nghiệp vụ, tránh tình trạng sơ đồ bị quá tải ("mạng nhện" khó đọc) và phục vụ tối ưu cho việc chèn vào Báo cáo Đồ án tốt nghiệp / Luận văn, nhóm kiến trúc đề xuất phân chia thành **6 Sơ đồ Lớp (CD01 – CD06)**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   BỘ 6 SƠ ĐỒ LỚP UML (CD01 - CD06)                     │
├────────────────────────────────────────────────────────────────────────┤
│ CD01: Domain Model (20 Thực thể dữ liệu & 24 Quan hệ CSDL)             │
│ CD02: Authentication & Account Module (Auth, User, Address, Session)   │
│ CD03: Catalog & Product Browsing Module (Product, Category, Service)   │
│ CD04: Shopping, Cart & Wishlist Module (Cart, Wishlist, Session Sync)  │
│ CD05: Order & Checkout Transaction Module (Order, Tx, Inventory Log)   │
│ CD06: Administration & Operational Module (Dashboard, Inventory, Admin)│
└────────────────────────────────────────────────────────────────────────┘
```

---

### Chi tiết kế hoạch từng sơ đồ:

#### 1. CD01 — Domain Model Class Diagram (Sơ đồ Lớp Mô hình Miền & Dữ liệu)
- **Mục tiêu:** Thể hiện toàn bộ 20 thực thể dữ liệu nghiệp vụ (`<<entity>>`), khóa chính, khóa ngoại, các trường thuộc tính cốt lõi với kiểu dữ liệu chuẩn SQL Server, và toàn bộ 24 mối quan hệ Foreign Key thực tế (7 Composition, 17 Association) kèm đúng bản số (Schema Multiplicity vs Application Invariant) và quy tắc ràng buộc (UNIQUE, CHECK, ON DELETE CASCADE / SET NULL).
- **Classifiers tham gia (20 Domain Entities):**
  - Cụm Khách hàng & Hồ sơ: `User`, `Address`, `PasswordResetToken`.
  - Cụm Danh mục & Sản phẩm: `Category`, `Brand`, `Size`, `Color`, `Product`, `ProductImage`, `ProductVariant`, `Banner`.
  - Cụm Giỏ hàng & Yêu thích: `Cart`, `CartItem`, `WishlistItem`.
  - Cụm Đơn hàng & Kho: `Order`, `OrderItem`, `OrderStatusHistory`, `InventoryTransaction`, `Voucher`, `VoucherUsage`.
- **Kiểm soát mật độ (Density Control):** Gom nhóm trực quan 20 Entity thành 4 package logic: `Identity & Profile`, `Product Catalog`, `Shopping & Wishlist`, `Order & Inventory` để sơ đồ thoáng đạt, không bị rối.
- **Thành phần loại trừ:** Hoàn toàn là tầng dữ liệu/miền; không đưa Controllers, Services, Repositories, Middlewares hay bảng hạ tầng `schema_migrations` vào sơ đồ này. Không đưa constructor giả định vào bất kỳ entity nào.

#### 2. CD02 — Authentication & Account Module Class Diagram (Phân hệ Xác thực & Hồ sơ cá nhân)
- **Mục tiêu:** Thể hiện cấu trúc lớp của luồng đăng ký tài khoản, đăng nhập an toàn, bảo vệ phiên (chống Session Fixation), quản lý thông tin cá nhân và sổ địa chỉ giao hàng (UC01, UC02, UC03, UC04).
- **Classifiers tham gia:**
  - Controllers: `AuthController`, `AccountController`.
  - Middlewares & Helpers: `authMiddleware` (`<<middleware>>`), `csrfMiddleware` (`<<middleware>>`), `validator` (`<<helper>>`), `database` (`<<database helper>>`).
  - Entities liên quan: `User`, `Address`, `Cart`, `PasswordResetToken` (gắn stereotype `<<entity, designed-only>>`).
  - Thư viện ngoài (External Libraries): `bcryptjs` (hashing), `express-session` (runtime session).
- **Quan hệ & Phụ thuộc:**
  - `AuthController` phụ thuộc `bcryptjs`, `CartController.mergeGuestCart`, `database`, `validator`.
  - `AccountController` phụ thuộc `order.service.js`, `database`, `validator`.
  - `authMiddleware` phụ thuộc `database` để kiểm tra trạng thái tài khoản active/locked.
- **Thành phần lặp lại từ sơ đồ khác:** `User`, `Address`, `Cart` (tái sử dụng từ CD01 để thể hiện tương tác dữ liệu).
- **Lưu ý đặc biệt:** Session (`req.session`) là cơ chế runtime của HTTP/Express, **không mô hình hóa thành Entity CSDL**. Tính năng Quên mật khẩu gắn note minh bạch: "Bảng CSDL đã tồn tại, route Express chưa cài đặt". Không đưa constructor giả định vào sơ đồ.

#### 3. CD03 — Catalog & Product Browsing Module Class Diagram (Phân hệ Sản phẩm & Duyệt danh mục)
- **Mục tiêu:** Thể hiện mô hình chuẩn 3 tầng phân lớp rõ rệt: Controller $\rightarrow$ Service $\rightarrow$ Repository của phân hệ hiển thị sản phẩm, bộ lọc đa tiêu chí (danh mục, giới tính, kích thước, giá), tìm kiếm Live Search và trang chủ (UC05).
- **Classifiers tham gia:**
  - Controllers: `ProductController`, `homeController` (`<<controller module>>`).
  - Services: `ProductService`.
  - Repositories: `ProductRepository`.
  - Helpers: `database` (`<<database helper>>`).
  - Entities liên quan: `Product`, `ProductVariant`, `Category`, `Brand`, `ProductImage`, `Size`, `Color`, `Banner`.
- **Quan hệ & Phụ thuộc:**
  - `ProductController` $\rightarrow$ `ProductService` $\rightarrow$ `ProductRepository` $\rightarrow$ `database.js`.
  - `homeController` $\rightarrow$ `ProductService`.
- **Thành phần lặp lại:** Các entity sản phẩm và `database` xuất hiện lại từ CD01/hạ tầng.

#### 4. CD04 — Shopping, Cart & Wishlist Module Class Diagram (Phân hệ Mua sắm, Giỏ hàng & Yêu thích)
- **Mục tiêu:** Thể hiện rõ nét sự bất đối xứng kiến trúc giữa Giỏ hàng (CartController gọi trực tiếp Database Pool / Session) và Danh sách yêu thích (WishlistController $\rightarrow$ WishlistService $\rightarrow$ WishlistRepository) (UC06, UC15).
- **Classifiers tham gia:**
  - Controllers: `CartController` (chứa static method `mergeGuestCart`), `WishlistController`.
  - Services: `WishlistService` (Khẳng định Cart KHÔNG có Service).
  - Repositories: `WishlistRepository` (Khẳng định Cart KHÔNG có Repository).
  - Middlewares & Helpers: `csrfMiddleware`, `authMiddleware`, `validator`, `database`.
  - Entities liên quan: `Cart`, `CartItem`, `WishlistItem`, `ProductVariant`, `Product`.
- **Quan hệ & Phụ thuộc:**
  - `CartController` thực thi trực tiếp trên session (`req.session.guestCart`) và gọi `database.query` / `sql.Transaction`; cung cấp phương thức static `mergeGuestCart` cho `AuthController`.
  - `WishlistController` $\rightarrow$ `WishlistService` $\rightarrow$ `WishlistRepository` $\rightarrow$ `database.query`.
- **Thành phần lặp lại:** `Cart`, `CartItem`, `WishlistItem`, `ProductVariant`, `Product` từ CD01.

#### 5. CD05 — Order & Checkout Transaction Module Class Diagram (Phân hệ Đặt hàng & Giao dịch Đơn hàng)
- **Mục tiêu:** Thể hiện giao dịch ACID của quá trình đặt hàng COD (SD07), quy trình khách hàng hủy đơn hoàn kho (SD09) và theo dõi đơn hàng (SD08) (UC07, UC08, UC09).
- **Classifiers tham gia:**
  - Controllers: `CheckoutController`, `AccountController`.
  - Services: `OrderService` (chứa `createCodOrder`, `cancelOrder`, `_executeCancellation`, `getOrdersByUser`, `getCustomerOrders`, `getOrderDetails`).
  - Repositories: Khẳng định **KHÔNG CÓ `OrderRepository`** (câu lệnh T-SQL được thực thi trực tiếp bên trong `OrderService` qua `sql.Transaction`).
  - Helpers: `database` (Connection Pool & `sql.Transaction` với `UPDLOCK, ROWLOCK, HOLDLOCK`), `validator`, `csrfMiddleware`, `authMiddleware`.
  - Entities liên quan: `Order`, `OrderItem`, `OrderStatusHistory`, `InventoryTransaction`, `Voucher`, `VoucherUsage`, `ProductVariant`, `CartItem`.
- **Quan hệ & Phụ thuộc:**
  - `CheckoutController` gọi `OrderService.createCodOrder`.
  - `AccountController` gọi `OrderService.cancelOrder` và `OrderService.getOrdersByUser` / `getOrderDetails`.
  - `OrderService` tương tác trực tiếp với `database.sql.Transaction` để khóa dòng bi quan và ghi log đồng thời 8 bảng.
- **Thành phần lặp lại:** Các entity đơn hàng và kho từ CD01; `AccountController` từ CD02.

#### 6. CD06 — Administration & Operational Management Class Diagram (Phân hệ Quản trị Vận hành)
- **Mục tiêu:** Thể hiện trung tâm điều hành của Admin: Dashboard KPI (UC14 - Promise.all 9 truy vấn song song), duyệt trạng thái đơn hàng (UC10), xuất/nhập kho (UC11), quản lý SKU ma trận (UC12), quản lý Voucher (UC13) và khóa khách hàng (UC16).
- **Classifiers tham gia:**
  - Controllers: `AdminController`.
  - Services kết nối: `OrderService` (tái sử dụng `updateOrderStatusByAdmin` và `_executeCancellation` cho duyệt và hủy đơn).
  - Repositories: Khẳng định **KHÔNG CÓ `AdminRepository`**. `AdminController` gọi trực tiếp `database.js` cho Dashboard, Inventory, Vouchers, Categories, Brands, Banners, Customers.
  - Middlewares & Helpers: `authMiddleware` (`requireAdmin`), `csrfMiddleware`, `database`.
  - Entities liên quan: `Order`, `OrderItem`, `ProductVariant`, `Product`, `Category`, `Brand`, `Voucher`, `User`, `Banner`, `InventoryTransaction`, `OrderStatusHistory`, `VoucherUsage`.
- **Quan hệ & Phụ thuộc:**
  - `AdminController` gọi trực tiếp `database.query` / `database.getPool` cho 8 phân hệ quản trị.
  - `AdminController` gọi `OrderService.updateOrderStatusByAdmin` cho phân hệ duyệt đơn.
- **Thành phần lặp lại:** `AdminController` tương tác với hầu hết các Entity để quản trị.

---

# PHẦN 9: NHẬN DIỆN KHOẢNG CÁCH KIẾN TRÚC & QUY TẮC MÔ HÌNH HÓA PASSWORD RESET

### 9.1. Phân định rõ ràng tính năng Quên mật khẩu (UC03)
- **Thực tế CSDL:** Bảng `password_reset_tokens` đã tồn tại hoàn chỉnh trong SQL Server (`database/migrations/001_initial_schema.sql:124-133`).
- **Thực tế mã nguồn Express:** Chưa có route (`/forgot-password`, `/reset-password`), chưa có controller method, chưa có cấu hình SMTP gửi email.
- **Quy tắc mô hình hóa chuẩn xác:**
  - `PasswordResetToken` được xem là **Domain Entity thực tế** tương ứng 1-1 với bảng CSDL.
  - Use case UC03 được gắn nhãn minh bạch: **`DESIGNED ONLY — NOT IMPLEMENTED`**.
  - Tuyệt đối **không tự bịa đặt** các class như `AuthService`, `MailService` hay `ResetPasswordController`.
  - Trong các sơ đồ lớp tương lai (CD01, CD02), sử dụng UML Note để ghi chú rõ ràng trạng thái chưa cài đặt của workflow này.

### 9.2. Sự phi đồng nhất của tầng Data Access (DAL)
- Hệ thống chỉ có 2 Repository thực sự: `ProductRepository` và `WishlistRepository`.
- Các phân hệ Giỏ hàng, Đơn hàng, Xác thực, Quản trị không có tầng Repository mà truy vấn trực tiếp thông qua Database Helper. Sơ đồ lớp tuyệt đối không vẽ thêm các Repository giả để "làm đẹp" kiến trúc.

### 9.3. Cơ chế giỏ hàng vãng lai (Guest Cart)
- Khách vãng lai không có bản ghi trong bảng `carts`. Giỏ hàng của Guest được duy trì trong `req.session.guestCart` và được đồng bộ vào CSDL thông qua phương thức static `CartController.mergeGuestCart(cartId, guestCart)` khi người dùng đăng nhập hoặc đăng ký.

---

# PHẦN 10: DANH MỤC KIỂM TOÁN TỰ ĐỘNG (AUDIT CHECKLIST)

- [x] **Đủ 20 thực thể nghiệp vụ (Domain Entities):** Đã kiểm chứng đầy đủ 20 bảng từ SQL Server, bao gồm cả `wishlist_items` (migration 004) và `voucher_usages` (migration 003).
- [x] **Không đưa bảng hạ tầng vào Domain Model:** Bảng `schema_migrations` được phân loại chính xác là bảng hạ tầng kỹ thuật, không đưa vào danh mục thực thể miền nghiệp vụ.
- [x] **Kiểm chứng Implicit Default Constructor:** Xác nhận cả 12 JavaScript classes **không khai báo explicit constructor** (`constructor(...)`). Không liệt kê constructor giả định vào Class Diagram.
- [x] **Phân định rõ ràng Static Method vs Attached Function:**
  - `CartController.mergeGuestCart`: Static method thực thụ duy nhất (dòng 686).
  - `CartController.validateCartQuantity`: Standalone helper function được gắn vào class/instance (dòng 764, 766).
  - `authController.getSafeReturnUrl`: Standalone helper function được gắn vào instance (dòng 334).
- [x] **Hiệu chỉnh Multiplicity User – Cart chuẩn xác:** Phân biệt rõ Schema Multiplicity (`User 1 — 0..1 Cart`) và Application Invariant (`User 1 — 1 Cart` khi đăng ký).
- [x] **Kiểm định ngữ nghĩa UML 2.5 cho 24 Foreign Keys:**
  - Giữ đúng 7 quan hệ Composition thực sự (Product-Image, Product-Variant, Cart-Item, Order-Item, Order-StatusHistory, User-Address, User-Cart).
  - Hiệu chỉnh 2 quan hệ sang Association: `User — WishlistItem` (tránh vi phạm 2 composite owners trên associative entity) và `User — PasswordResetToken` (token là đối tượng bảo mật tạm thời, CASCADE là kỹ thuật dọn rác).
  - 15 quan hệ còn lại đều là Association chuẩn xác.
- [x] **Tên cột CSDL chính xác 100%:**
  - `users.password_hash` (chính xác).
  - `products.brand_id` (chính xác là INT NULL).
  - `password_reset_tokens.token` (chính xác là `token`, không phải `token_hash`).
  - `cart_items.variant_id` (chính xác).
  - `inventory_transactions.variant_id` (chính xác).
  - `order_items.product_variant_id` (chính xác).
  - `orders.voucher_id` (chính xác là INT NULL).
  - `orders.delivery_address_snapshot` (chính xác là NVARCHAR(500)).
- [x] **Mapping đầy đủ 16 Use Cases:** Đã lập bảng ánh xạ chi tiết UC01 đến UC16, phân định rõ controller, service, repository, entity, và đánh dấu UC03 là `DESIGNED ONLY — NOT IMPLEMENTED`.
- [x] **Không bịa đặt lớp/tầng:** Tuyệt đối không tạo `CartService`, `OrderRepository`, `AdminService`, `VoucherService`, `InventoryService`, `MailService`.
- [x] **Reconciliation migrations minh bạch:** Đã phân tích rõ sự khác biệt giữa `mssql_schema.sql` (20 bảng) và các file migration (18 + 0 + 1 + 1 = 20 bảng nghiệp vụ + 1 bảng hệ thống = 21 bảng vật lý).
- [x] **Bảo toàn Invariant:** Không sửa source code, không sửa database, không tạo migration, không commit/push.

---

# PHẦN 11: BẢO TOÀN GIT VÀ KIỂM TRA TRẠNG THÁI

Các lệnh kiểm tra trạng thái Git baseline bắt buộc:

```powershell
git branch --show-current
git rev-parse HEAD
git status --short
git diff --check
git diff --stat
```

- **Branch hiện tại:** `fix/master-repair-plan`.
- **Git HEAD hiện tại:** `8135e190c69553be8f6ebf3eab7ba34de995d53c` (`8135e19`).
- **Tệp tin thay đổi duy nhất:** `docs/diagrams/class/CLASS_MODEL_DISCOVERY.md`.
- **Không có bất kỳ thay đổi nào trong mã nguồn (`src/`) hoặc CSDL (`database/`).**
- **Không có tệp tin PlantUML (`.puml`) hoặc ảnh (`.png`) nào được tạo ra trong lượt này.**

---

# PHẦN 12: QUY TẮC DỪNG VÀ NGHIỆM THU (MANDATORY STOP)

Theo quy định nghiêm ngặt của Phase 3.3.2.1:
1. **DỪNG LẠI HOÀN TOÀN TẠI ĐÂY.**
2. **Không** tự ý tạo các tệp mã nguồn PlantUML (`.puml`) hay kết xuất ảnh (`.png`).
3. **Không** tự ý chuyển sang Phase 3.3.2.2 (Class Diagram Creation).
4. **Không** commit, push hoặc can thiệp mã nguồn.
5. Chờ phản hồi, kiểm tra chéo và quyết định phê duyệt chính thức bản đặc tả từ Người dùng / ChatGPT trước khi chuyển sang Phase 3.3.2.2.
