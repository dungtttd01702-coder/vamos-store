# DANH MỤC KỊCH BẢN KIỂM THỬ (TEST CASES SPECIFICATION) — VAMOS STORE

> **Dự án:** VAMOS STORE (E-Commerce Platform)  
> **Tổng số test cases:** 178 kịch bản tự động  
> **Phiên bản:** v1.1 Production-Ready  
> **Trạng thái:** 178/178 PASSED (100% Pass Rate)  

---

## 1. PHÂN BỐ CÁC BỘ KIỂM THỬ

| Bộ kiểm thử | File thực thi | Số lượng Test Cases | Mục tiêu kiểm thử | Trạng thái |
|:---|:---|:---:|:---|:---:|
| **Pug Views Validation** | `tests/validate_pug.js` | 35 | Biên dịch cú pháp toàn bộ 35 file giao diện Pug | **100% PASS** |
| **Input Validator Tests** | `tests/validator.test.js` | 14 | Kiểm tra chuẩn hóa email, số điện thoại, định dạng | **100% PASS** |
| **Auth Flow Tests** | `tests/test_auth_flow.js` | 10 | Đăng ký, đăng nhập, bảo mật session, redirect | **100% PASS** |
| **Live Search Tests** | `tests/test_live_search.js` | 8 | Tìm kiếm real-time API, autocomplete, SKU prefix, XSS immune | **100% PASS** |
| **Regression Suite 1-14** | `tests/regression_suite.js` | 103 | Nghiệp vụ CSDL, Đặt hàng COD, Concurrency, Restocking, Voucher Q8, Admin Lifecycle | **100% PASS** |
| **Regression Suite 15 (Mới)** | `tests/regression_suite.js` | 8 | Giới hạn bán lẻ 10 đôi, chặn âm/thập phân, IDOR Order Isolation, SQLi Sort Whitelist | **100% PASS** |
| **TỔNG CỘNG** | | **178** | **178/178 PASSED (0 FAIL, 0 SKIPPED)** | **100% PASS** |

---

## 2. CHI TIẾT CÁC TEST CASES ĐẶC THÙ MỚI BỔ SUNG (v1.1)

### 2.1. Live Search & XSS Safety (`tests/test_live_search.js`)
- **`SEARCH-01`:** Query rỗng $\rightarrow$ Trả về mảng rỗng `[]`.
- **`SEARCH-02`:** Query "Sandal" $\rightarrow$ Khớp sản phẩm kèm ảnh, giá, slug.
- **`SEARCH-03`:** Query mã SKU "VM-" $\rightarrow$ Khớp tiền tố mã sản phẩm.
- **`SEARCH-04`:** Endpoint GET `/api/products/search?q=Sandal` $\rightarrow$ Trả về JSON 200.
- **`SEARCH-05`:** Endpoint GET `/products/live-search?q=Sneaker` $\rightarrow$ Trả về JSON 200.
- **`SEARCH-06`:** Payload `<script>alert("XSS")</script>` $\rightarrow$ Không gây lỗi server, trả về kết quả an toàn.
- **`SEARCH-07`:** Wildcards SQL `'; DROP TABLE test; -- %_[]` $\rightarrow$ Xử lý an toàn qua tham số `@q`.
- **`SEARCH-08`:** XSS query parameter $\rightarrow$ Trả về JSON đã được vệ sinh.

### 2.2. Suite 15: Giới hạn số lượng bán lẻ & Bảo mật (`tests/regression_suite.js`)
- **`LIMIT-01`:** Gửi số lượng âm (`-5`) vào giỏ hàng $\rightarrow$ Validator và Controller từ chối với HTTP 400.
- **`LIMIT-02`:** Gửi số thập phân (`3.5`) vào giỏ hàng $\rightarrow$ Validator và Controller từ chối với HTTP 400.
- **`LIMIT-03`:** Gửi chuỗi không phải số (`"abc"`) $\rightarrow$ Validator và Controller từ chối với HTTP 400.
- **`LIMIT-04`:** Gửi số lượng mua sỉ > 10 đôi (`99`) $\rightarrow$ Bị chặn kèm thông báo hotline `1900 2126`.
- **`LIMIT-05`:** Đặt hàng COD nếu giỏ hàng chứa dòng sản phẩm > 10 đôi $\rightarrow$ Transaction ném ngoại lệ và rollback ở CSDL.
- **`IDOR-01`:** Khách hàng A cố tình truy cập đơn hàng của Khách hàng B qua URL $\rightarrow$ Trả về `null` (HTTP 404).
- **`IDOR-02`:** Khách hàng B xem đơn hàng chính chủ $\rightarrow$ Hiển thị đầy đủ thông tin đơn hàng.
- **`SEC-SQLI-01`:** Truyền tham số sắp xếp độc hại `'; DROP TABLE users; --` $\rightarrow$ Tự động fallback về sắp xếp mặc định hợp lệ.
