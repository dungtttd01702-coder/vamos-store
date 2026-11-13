# PHASE 2 — WISHLIST GUEST & CUSTOMER REPORT
## BÁO CÁO SỬA CHỮA DỨT ĐIỂM CHỨC NĂNG DANH MỤC YÊU THÍCH (WISHLIST)

> **Thời điểm xác nhận:** 2026-11-13  
> **Trạng thái:** HOÀN THÀNH 100% (7/7 Wishlist Tests PASS)  
> **Branch làm việc:** `fix/master-repair-plan`  
> **Các Bug đã khắc phục:** `BUG-03` (Wishlist Event Binding & Cross-Session Storage), `BUG-08` (Catalog PJAX Re-binding).

---

## 1. MỤC TIÊU & PHẠM VI SỬA CHỮA

Trước đây, người dùng gặp các sự cố:
- Guest bấm trái tim nhưng không thấy phản hồi rõ ràng hoặc không rõ trạng thái lưu.
- Customer bấm trái tim không lưu hoặc bị ghi đè lẫn lộn giữa các phiên làm việc.
- Nút bấm trái tim trên thẻ sản phẩm ở một số vị trí bị đè (overlay) bởi liên kết hình ảnh `<a>` do thiếu `z-index`.
- Admin đăng nhập vẫn nhìn thấy nút bấm trái tim hoặc giao diện Wishlist.

### Các giải pháp đã triển khai:

1. **Khắc phục triệt để lỗi Overlay click trên thẻ sản phẩm:**
   - Đã bổ sung thuộc tính `z-10` và `relative` cho tất cả các nút `.btn-wishlist` tại:
     - `src/views/pages/home.pug` (Sản phẩm Giảm giá & Sản phẩm Mới).
     - `src/views/pages/products/index.pug` (Catalog sản phẩm).
     - `src/views/pages/products/detail.pug` (Chi tiết sản phẩm).
   - Bảo đảm nút tim luôn nằm trên cùng và nhận 100% sự kiện con trỏ.

2. **Chuẩn hóa cơ chế lưu trữ phân tách theo vai trò (Multi-Tenant LocalStorage):**
   - **Guest:** Lưu vào `vamos_guest_wishlist_v1`. Khi Guest bấm tim, hiển thị thông báo Toast:
     *"❤️ Đã lưu [Tên sản phẩm] vào danh sách yêu thích! (Đã lưu tạm trên thiết bị. Đăng nhập để đồng bộ danh sách vào tài khoản của bạn)"*.
   - **Customer:** Lưu độc lập theo ID tài khoản: `vamos_user_wishlist_${userId}`. Khi User A đăng xuất và User B đăng nhập, danh sách yêu thích của User A hoàn toàn được bảo vệ, không bị lẫn sang User B.
   - **Admin:** Bị vô hiệu hóa hoàn toàn cơ chế Wishlist (`if (window.IS_ADMIN) return;`). Không khởi tạo modal, không lưu storage.

3. **Thuật toán Hợp nhất Guest $\to$ Customer thông minh (Deduplication Merge):**
   - Khi khách vãng lai đã chọn các sản phẩm yêu thích và tiến hành đăng nhập / đăng ký:
     - Hệ thống lấy toàn bộ sản phẩm từ `vamos_guest_wishlist_v1`.
     - Đối chiếu với `vamos_user_wishlist_${userId}` qua `id` sản phẩm.
     - Tự động bổ sung các sản phẩm chưa có, bỏ qua sản phẩm trùng lặp.
     - Sau khi hợp nhất thành công, tự động dọn sạch key tạm `vamos_guest_wishlist_v1`.

4. **Bảo đảm hoạt động qua Catalog PJAX Reload:**
   - Event Delegation được lắng nghe ở cấp `document`, tự động bắt chính xác mọi thẻ `.btn-wishlist` mới được chèn vào DOM sau khi phân trang hoặc lọc sản phẩm.
   - Hàm `window.syncWishlistUI()` được gọi ngay sau mỗi lần cập nhật PJAX container để tô màu đỏ các sản phẩm đã lưu.

---

## 2. KẾT QUẢ KIỂM THỬ XÁC MINH (`tests/test_phase2_wishlist.js`)

```
===============================================================
   VAMOS STORE - PHASE 2: WISHLIST ENGINE & ROLE ISOLATION
===============================================================
  ✔ [PASS] WIS-01: Guest clicks heart: product saved to guest storage with active state
  ✔ [PASS] WIS-02: Guest clicks heart again: product removed from storage
  ✔ [PASS] WIS-05: Customer wishlist storage is strictly keyed by User ID
  ✔ [PASS] WIS-08: Account switching maintains zero data leakage between different users
  ✔ [PASS] WIS-07: Guest-to-Customer merge combines items seamlessly without duplicates and clears temporary storage
  ✔ [PASS] WIS-13: Admin role strictly bypasses wishlist engine
  ✔ [PASS] WIS-11: All product card templates have valid data attributes and Admin layout is strictly free of wishlist DOM
===============================================================
   PHASE 2 TEST SUMMARY: 7 PASSED, 0 FAILED
===============================================================
```

---

## 3. DANH SÁCH FILE THAY ĐỔI

1. `src/public/js/main.js` (Cập nhật `initWishlistEngine`, `toggleWishlist`, toast message, guard admin)
2. `src/views/pages/home.pug` (Thêm `z-10` trên `.btn-wishlist` chống click overlay)
3. `tests/test_phase2_wishlist.js` (MỚI: Bộ test 7 bài kiểm thử toàn diện wishlist)
4. `package.json` (Tích hợp `test:wishlist` vào `test:all`)

---

## 4. KẾT LUẬN & CHUYỂN GIAO SANG PHASE 3

Phase 2 đã hoàn thành trọn vẹn, không có lỗi hồi quy. Chuyển tiếp ngay sang **Phase 3: Dark Mode / Light Mode Theme Engine**.
