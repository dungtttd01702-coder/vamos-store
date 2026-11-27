# KẾ HOẠCH KIỂM THỬ VÀ BÁO CÁO KẾT QUẢ VAMOS CLUB
## Test Plan & Verification Report: Loyalty & Review-to-Earn System

---

## 1. MỤC TIÊU VÀ PHẠM VI KIỂM THỬ

Bộ test tự động `tests/test_loyalty_module.js` được thiết kế nhằm xác thực độc lập 100% các yêu cầu nghiệp vụ, toàn vẹn dữ liệu, kiểm soát quyền truy cập và khả năng chống gian lận/chống race condition của hệ thống VAMOS CLUB.

- **Môi trường kiểm thử:** Node.js v20+, Microsoft SQL Server 2022 (`vamos_store_db` / `vamos_store_test_db`).
- **Thư viện assertion:** Native Node.js `assert`.

---

## 2. MA TRẬN 24 TEST CASES ĐÃ THỰC THI & KẾT QUẢ THỰC TẾ

| STT | Mã Test | Nhóm Kiểm Thử | Mục Tiêu & Mô Tả Điều Kiện Kiểm Thử | Kết Quả Thực Tế | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | `TIER-01` | Cấp Độ & Tiến Trình | Kiểm tra gán đúng hạng thành viên: <1.000 (MEMBER), 1.000-2.499 (SILVER), 2.500-4.999 (GOLD), >=5.000 (VIP). | Trả về chính xác mã tier tương ứng theo ngưỡng điểm đầu vào (tính theo `qualifying_points_cycle` ở Stage 2). | **PASS** |
| 2 | `TIER-02` | Cấp Độ & Tiến Trình | Tính toán % tiến trình thăng hạng và số điểm còn thiếu đến mốc tiếp theo. | MEMBER 300đ => cần 700đ (30%), SILVER 1500đ => cần 1000đ, VIP => 100%. | **PASS** |
| 3 | `CALC-01` | Tính Điểm Review | Chỉ đánh giá số sao (1-5) mà không có nhận xét chi tiết hay ảnh. | Cộng đúng 100 điểm thưởng cơ bản. | **PASS** |
| 4 | `CALC-02` | Tính Điểm Review | Đánh giá sao kèm bình luận ngắn dưới 50 ký tự và không chọn thẻ nhanh. | Nhận 100 điểm (không đủ điều kiện mức 2). | **PASS** |
| 5 | `CALC-03` | Tính Điểm Review | Đánh giá sao kèm bình luận chi tiết >= 50 ký tự. | Cộng 200 điểm (+100 sao, +100 bình luận dài). | **PASS** |
| 6 | `CALC-04` | Tính Điểm Review | Đánh giá sao kèm chọn ít nhất 1 Quick Tag hợp lệ (`Đi đúng size`). | Cộng 200 điểm (+100 sao, +100 quick tag). | **PASS** |
| 7 | `CALC-05` | Tính Điểm Review | Đánh giá sao kèm Quick Tag và đính kèm ít nhất 1 ảnh thực tế. | Cộng 300 điểm (+100 sao, +100 tag, +100 ảnh). | **PASS** |
| 8 | `CALC-06` | Tính Điểm Review | Đánh giá đầy đủ: sao, bình luận > 50 ký tự, nhiều quick tag và 3 ảnh. | Bị chặn trần tại mức tối đa 300 điểm (Hard Cap). | **PASS** |
| 9 | `CALC-07` | Tính Điểm Review | Gửi số sao không hợp lệ (0 sao hoặc 6 sao). | Ném ngoại lệ lỗi validation: `Số sao đánh giá phải từ 1 đến 5`. | **PASS** |
| 10 | `SEC-REV-01` | Bảo Mật Quyền Sở Hữu | Khách hàng B yêu cầu xem danh sách sản phẩm đánh giá của đơn hàng thuộc khách hàng A. | Bị từ chối: `Đơn hàng không thuộc về tài khoản của bạn`. | **PASS** |
| 11 | `SEC-REV-02` | Bảo Mật Quyền Sở Hữu | Khách hàng B cố tình gửi đánh giá cho đơn hàng của khách hàng A. | Bị từ chối: `Đơn hàng không thuộc về tài khoản của bạn`. | **PASS** |
| 12 | `SEC-REV-03` | Toàn Vẹn Sản Phẩm | Gửi đánh giá cho sản phẩm không nằm trong danh mục các mặt hàng của đơn hàng. | Bị từ chối: `Sản phẩm bạn đánh giá không nằm trong danh mục sản phẩm của đơn hàng này`. | **PASS** |
| 13 | `SEC-REV-04` | Ràng Buộc Đơn Hàng | Gửi đánh giá khi đơn hàng chưa hoàn tất (`order_status = 'PENDING'`). | Bị từ chối: `Chỉ đơn hàng đã giao thành công (COMPLETED) mới đủ điều kiện đánh giá`. | **PASS** |
| 14 | `REV-SUB-01` | Tạo Đánh Giá & Ghi Sổ | Gửi đánh giá hợp lệ: tạo bản ghi `reviews`, lưu 2 ảnh trong `review_media`, cộng 300 điểm vào ví, ghi sổ cái `point_transactions`. | Bản ghi tạo đầy đủ, số dư ví tăng chính xác 300, ghi sổ cái `REVIEW_REWARD`. | **PASS** |
| 15 | `REV-SUB-02` | Chống Review Trùng | Khách hàng cố tình gửi đánh giá lần 2 cho cùng cặp `(order_id, product_id)`. | Bị từ chối ngay lập tức: `Bạn đã gửi đánh giá cho sản phẩm này trong đơn hàng rồi`. | **PASS** |
| 16 | `RED-01` | Quy Tắc Đổi Thưởng | Khách hàng yêu cầu đổi phần thưởng đã bị tắt (`is_active = 0` - Vớ Nano Bạc). | Bị từ chối: `Phần thưởng hiện đang tạm đóng hoặc là quà tặng vật lý`. | **PASS** |
| 17 | `RED-02` | Kiểm Soát Số Dư | Khách hàng có 100 điểm cố tình đổi phần thưởng yêu cầu 1.000 điểm. | Bị từ chối sạch: `Số dư điểm không đủ`, số dư ví giữ nguyên 100 điểm. | **PASS** |
| 18 | `RED-03` | Đổi Điểm Hợp Lệ | Khách hàng đủ điểm đổi Voucher 30.000đ (500 điểm). | Tạo voucher `VAMOSCLUB-...` (limit=1), trừ đúng 500 điểm ví, ghi sổ âm -500, lưu redemption `AVAILABLE`. | **PASS** |
| 19 | `RED-04` | Race Condition Đổi Quà | Ví chỉ có đúng 500 điểm, gửi 2 request đổi voucher 500 điểm **đồng thời** (`Promise.allSettled`). | Đúng 1 request thành công, 1 request bị từ chối, số dư ví còn 0 điểm, **tuyệt đối không bị âm**. | **PASS** |
| 20 | `CHK-01` | Bảo Vệ Voucher Cá Nhân | Khách hàng B cố tình nhập mã voucher đổi điểm của Khách hàng A khi đặt hàng COD. | Bị chặn đứng: `Mã giảm giá là voucher cá nhân thuộc về khách hàng khác`. | **PASS** |
| 21 | `CHK-02` | Vòng Đời Đơn Hàng | Khách hàng A checkout thành công với voucher cá nhân => Voucher thành `USED`. Khi khách hàng A hủy đơn => Voucher hoàn trả thành `AVAILABLE`. | Khi đặt hàng: status `USED`, có `used_at`. Khi hủy đơn: status `AVAILABLE`, `used_at = null`. | **PASS** |
| 22 | `ORD-PUR-01` | 3% Tích Lũy Đơn Hàng | Đơn hoàn tất có hàng 1.000.000đ, giảm 100.000đ, ship 30.000đ => hợp lệ 900.000đ => tích lũy 3%. | Cộng đúng 27.000 điểm vào ví, ghi sổ cái `ORDER_PURCHASE`. Phí ship không bị tính. | **PASS** |
| 23 | `ORD-PUR-02` | Idempotency Sổ Cái | Gọi lại hàm tích điểm đơn hàng lần 2 cho cùng một đơn hàng đã được cộng điểm. | Phát hiện khóa `ORDER_PURCHASE_{id}`, trả về `{ idempotent: true, pointsAwarded: 0 }`, không cộng trùng. | **PASS** |
| 24 | `PROD-REV-01` | Tổng Hợp Thống Kê | Truy vấn đánh giá công khai theo mã sản phẩm qua `loyaltyService.getProductReviews(productId)`. | Tính đúng số sao trung bình, phân bổ tỷ lệ phần trăm 5 sao -> 1 sao, đính kèm media. | **PASS** |

---

## 3. KẾT LUẬN KIỂM THỬ

- **Tổng số test cases VAMOS Club Giai đoạn 1:** 24/24 tests (`tests/test_loyalty_module.js`, đã cập nhật fixture `loyalty_point_batches` cho FEFO).
- **Kiểm thử hồi quy toàn hệ thống (`tests/regression_suite.js`):** 118/118 tests.
- **Kiểm thử giao diện Pug (`tests/validate_pug.js`):** Passed.

---

## 4. KIỂM THỬ GIAI ĐOẠN 2 (CHU KỲ 12 THÁNG & HẾT HẠN 365 NGÀY)

1. **Unit Tests thuần in-memory (`tests/test_loyalty_cycle_unit.js`, 0 kết nối DB):**
   - Kiểm tra 20 kịch bản chu kỳ 12 tháng (`CYC-01` .. `CYC-20`), bao gồm mốc 29/02 năm nhuận, ranh giới `<= cycle_end_at` vs `>`, mid-cycle upgrade guard, Soft Landing tối đa 1 bậc, và multi-cycle catch-up.
   - Kiểm tra hết hạn 365 ngày & giải thuật trừ điểm FEFO (`EXP-01` .. `EXP-04`).
   - Kiểm tra Backfill Replay fail-closed (`BF-01` .. `BF-05`) và transaction rollback/idempotency với SQL mock (`SVC-01` .. `SVC-03`, `WRK-01`).
   - **Trạng thái:** Đã chạy trực tiếp thành công 33/33 assertions (0 kết nối SQL Server).

2. **SQL Server Integration Tests (`tests/test_loyalty_cycle_integration.js`, CI `vamos_store_test_db`):**
   - Kiểm tra Migration `006`, các CHECK constraint, tạo lô 365 ngày khi tích điểm, FEFO khi `redeemVoucher`, worker `sp_getapplock` đa tiến trình, partial-failure retry, multi-cycle Soft Landing, race condition `redeemVoucher` vs `processLoyaltyCycle`, và fail-closed backfill.
   - **Trạng thái:** Đã viết và kiểm tra cú pháp (`node --check`), **CHƯA thực thi** trên SQL Server cục bộ (chỉ chạy trong môi trường test DB cô lập trên CI).
