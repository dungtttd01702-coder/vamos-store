# BÁO CÁO TOÀN DIỆN AUDIT HỆ THỐNG — VAMOS STORE

**Ngày thực hiện:** 12/11/2026  
**Phiên bản hệ thống:** v1.1 Production-Ready  
**Môi trường:** Node.js 18+ / Express / Microsoft SQL Server / Pug / Tailwind CSS

---

## 1. MỤC TIÊU VÀ PHẠM VI AUDIT

Rà soát toàn bộ source code, database, security, frontend logic, backend service/repository, testing và quy trình CI/CD của dự án **VAMOS STORE** nhằm phát hiện các lỗ hổng bảo mật, lỗi nghiệp vụ, bất cập kiến trúc và chuẩn bị hệ thống đạt tiêu chuẩn Production-Ready.

---

## 2. BẢNG PHÂN LOẠI VÀ THEO DÕI VẤN ĐỀ

| Mã            | Mức độ       | Phân hệ                          | Vấn đề                                                                                                                          | Tác động                                                                                                   | Trạng thái           |
| ------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------- |
| **SEC-01**    | **CRITICAL** | Frontend (Live Search)           | Nguy cơ XSS do sử dụng `innerHTML` nối chuỗi trực tiếp từ kết quả tìm kiếm và từ khóa query trong `main.js`.                    | Kẻ tấn công có thể chèn script độc hại thực thi trong trình duyệt người dùng.                              | **ĐÃ XỬ LÝ (ĐỢT 2)** |
| **LOG-01**    | **HIGH**     | Backend (Cart & Order)           | Chưa chặn triệt để số lượng mua > 10 đôi ở backend; `cart.controller.js` tự động chuyển đổi số âm/chuỗi không hợp lệ thành `1`. | Người dùng có thể bypass frontend để đặt sỉ số lượng lớn hoặc gửi dữ liệu âm/thập phân làm hỏng tính toán. | **ĐÃ XỬ LÝ (ĐỢT 2)** |
| **LOG-02**    | **HIGH**     | Frontend (Product Detail)        | `getActiveVariant()` tự fallback về `variants[0]` khi không tìm thấy tổ hợp Size và Màu hợp lệ.                                 | Hiển thị sai SKU, sai số lượng tồn kho khả dụng và cho phép bấm mua biến thể không tồn tại.                | **ĐÃ XỬ LÝ (ĐỢT 2)** |
| **UX-01**     | **HIGH**     | Frontend (Live Search)           | Thiếu `AbortController` và requestId tracking; race condition khi gõ nhanh khiến request cũ ghi đè kết quả mới.                 | Người dùng thấy kết quả tìm kiếm của từ khóa trước đó, gây bối rối và sai lệch trải nghiệm.                | **ĐÃ XỬ LÝ (ĐỢT 2)** |
| **SEC-02**    | **MEDIUM**   | Frontend / Backend (Auth & Form) | Regex email quá cứng nhắc chỉ chấp nhận `.com`/`.vn`, cảnh báo sai khi người dùng đang nhập dở.                                 | Chặn người dùng có email hợp lệ quốc tế (.org, .store, .net) hoặc gây ức chế UX khi vừa gõ.                | **ĐÃ XỬ LÝ (ĐỢT 2)** |
| **DEVOPS-01** | **HIGH**     | CI/CD (GitHub Actions)           | `ci.yml` chỉ chạy `npm test` (chỉ có regression suite), bỏ qua `test_auth_flow.js` và `test_live_search.js`.                    | Không phát hiện được lỗi vỡ giao diện xác thực hoặc tìm kiếm khi có thay đổi mã nguồn mới.                 | **ĐÃ XỬ LÝ (ĐỢT 7)** |
| **SEC-03**    | **MEDIUM**   | Backend (Security Headers)       | Cần rà soát cookie flags (HttpOnly, SameSite, Secure) và xử lý lỗi tránh lộ stack trace ở production.                           | Rò rỉ thông tin nhạy cảm của hệ điều hành và cơ sở dữ liệu khi có ngoại lệ hệ thống.                       | **ĐÃ XỬ LÝ (ĐỢT 3)** |
| **DOC-01**    | **LOW**      | Documentation                    | Một số file tài liệu chưa đồng bộ số lượng kiểm thử tự động mới nhất (167 tests -> chuẩn hóa).                                  | Thiếu tính nhất quán giữa tài liệu kỹ thuật và mã nguồn thực tế.                                           | **ĐÃ XỬ LÝ (ĐỢT 8)** |

---

## 3. CHI TIẾT CÁC VẤN ĐỀ VÀ PHƯƠNG ÁN XỬ LÝ

### 3.1. Vấn đề SEC-01 (CRITICAL): XSS trong Live Search Rendering

- **Vị trí:** `src/public/js/main.js` (hàm `renderResults` và `highlightMatch`).
- **Nguyên nhân:** Mã nguồn dùng chuỗi HTML template literals gán trực tiếp vào `dropdown.innerHTML` với `${item.name}`, `${item.product_code}`, `${query}`, `${item.image_url}`.
- **Phương án xử lý:**
  1. Chuyển đổi toàn bộ việc khởi tạo DOM sang `document.createElement`, `document.createTextNode`, `element.textContent`.
  2. Xây dựng hàm `safeHighlightMatch(container, text, query)` an toàn sử dụng DOM Text Nodes và phần tử `span`, tuyệt đối không dùng regex string replacement inject vào `innerHTML`.
  3. Validate format của `image_url` chỉ cho phép URL hợp lệ (`http://`, `https://`, `/images/`).

### 3.2. Vấn đề LOG-01 (HIGH): Thực thi quy tắc Bán lẻ Tối đa 10 đôi ở Server

- **Vị trí:** `src/controllers/cart.controller.js` (`addItem`, `updateItem`), `src/services/order.service.js` (`createCodOrder`).
- **Nguyên nhân:**
  - `addItem`: `const qty = Math.max(1, parseInt(quantity, 10) || 1)` tự động chuyển mọi dữ liệu invalid thành `1`, không chặn nếu khách gửi `quantity = 99`.
  - `updateItem`: `item.quantity = Math.min(qty, item.stock_quantity)` cho phép tăng lên tới tồn kho (ví dụ 100 đôi) nếu khách sửa request.
  - `order.service.js`: Chưa kiểm tra số lượng của từng dòng trong giỏ hàng có vượt quá 10 đôi hay không.
- **Phương án xử lý:**
  1. Thêm hàm kiểm tra `validateCartQuantity(rawQty)`: từ chối số âm, số thập phân, chuỗi rỗng, chữ cái với mã lỗi HTTP 400.
  2. Bắt buộc $1 \le qty \le 10$. Nếu $qty > 10$, trả về thông báo kèm hotline hỗ trợ mua sỉ `1900 2126`.
  3. Kiểm tra tổng số lượng sau khi cộng dồn không được vượt quá 10 đôi cho cùng 1 dòng sản phẩm.
  4. Trong `order.service.js`, kiểm tra lại từng item: nếu $item.quantity > 10$ hoặc $\le 0$, hủy transaction và ném Exception rõ ràng.

### 3.3. Vấn đề LOG-02 (HIGH): Fix Fallback sai trong `getActiveVariant()`

- **Vị trí:** `src/public/js/main.js` (hàm `getActiveVariant`).
- **Nguyên nhân:** Code có đoạn `if (!selectedColor || !selectedSize || variants.length === 0) return variants[0] || null;`.
- **Phương án xử lý:**
  1. Nếu không tìm thấy tổ hợp Size + Color được chọn, trả về `null`.
  2. Khi `variant === null`: xóa hiển thị SKU, cập nhật badge tồn kho: _"Vui lòng chọn Màu sắc và Kích cỡ phù hợp"_, disable nút "Thêm vào giỏ" và "Mua ngay (COD)".

### 3.4. Vấn đề UX-01 (HIGH): Race Condition trong Live Search

- **Vị trí:** `src/public/js/main.js` (`initRealtimeLiveSearch`).
- **Nguyên nhân:** Gõ nhanh nhiều ký tự phát sinh các request fetch không đồng bộ. Request cũ về chậm hơn sẽ ghi đè kết quả của từ khóa mới nhất.
- **Phương án xử lý:**
  1. Sử dụng `AbortController`: gọi `activeController.abort()` trước khi gửi request mới.
  2. Lưu trữ `activeQuery` và `activeRequestId`: chỉ render kết quả nếu response khớp với từ khóa đang có trong input.

---

## 4. KẾT LUẬN VÀ LỘ TRÌNH THỰC HIỆN

Báo cáo audit này được sử dụng làm kim chỉ nam kỹ thuật cho toàn bộ các đợt sửa lỗi tiếp theo (ĐỢT 2 -> ĐỢT 9). Mọi chỉnh sửa phải kèm theo automated tests chứng minh kết quả.
