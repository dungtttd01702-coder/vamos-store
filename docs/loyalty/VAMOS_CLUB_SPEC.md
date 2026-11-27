# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ HỆ THỐNG VAMOS CLUB
## Loyalty Program: Review-to-Earn & Points-to-Voucher System

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

**VAMOS CLUB** là chương trình khách hàng thân thiết được tích hợp trực tiếp vào nền tảng thương mại điện tử **VAMOS STORE**, hoạt động trên nền tảng **Node.js, Express, Microsoft SQL Server 2022, Pug và Tailwind CSS**.

### 1.1. Mục Tiêu Nghiệp Vụ
1. **Kích thích Review thực tế (Review-to-Earn):** Khuyến khích khách hàng sau khi nhận hàng hoàn tất (COD đã thanh toán - `COMPLETED`) để lại đánh giá có kèm hình ảnh thực tế và nhận xét chi tiết, tạo social proof mạnh mẽ cho sản phẩm.
2. **Tăng tỷ lệ quay lại mua hàng (Repeat Purchase):** Điểm thưởng tích lũy có thể đổi thành các mã giảm giá cá nhân (Personal Voucher) để áp dụng ngay cho các đơn hàng tiếp theo.
3. **Tích lũy chi tiêu 3% (Purchase Cashback Points):** Tự động tích lũy 3% giá trị sản phẩm hợp lệ của mỗi đơn hàng hoàn tất vào ví điểm thành viên.
4. **Minh bạch & Toàn vẹn giao dịch (Immutable Ledger):** Mọi biến động điểm (cộng, trừ, đảo ngược) đều được ghi nhận bằng sổ cái bất biến `point_transactions`, bảo đảm không thất thoát và có thể đối soát.

---

## 2. KIẾN TRÚC VÀ CÁC THÀNH PHẦN HỆ THỐNG (SYSTEM COMPONENTS)

Hệ thống bao gồm 6 thành phần cốt lõi được đồng bộ hóa hoàn toàn:

```
[Khách Hàng Hoàn Tất Đơn Hàng COD (COMPLETED)]
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
[3% Tích Lũy Đơn Hàng]     [Đánh Giá Nhận Điểm Review-to-Earn]
(order.service.js)         (review.service.js / upload.middleware.js)
         │                       │
         └───────────┬───────────┘
                     ▼
         [Ví Điểm: user_points_wallets] ◄─── ACID Transaction / Row Locking
                     │
                     ▼
         [Sổ Cái: point_transactions] (Bất biến, Idempotent)
                     │
                     ▼
         [Trung Tâm Đổi Thưởng VAMOS Club] (/account/rewards)
                     │ (Đổi điểm lấy voucher)
                     ▼
         [Kho Voucher Cá Nhân: voucher_redemptions]
                     │
                     ▼
         [Thanh Toán COD: order.service.js]
```

### Thành phần 1: Cấu trúc Hạng Thành Viên & Chu Kỳ Xét Hạng (Membership Tiers & Tier Cycle)
> [!NOTE]
> **Chính sách nghiệp vụ đã được xác nhận chính thức (21/11/2026):**
> 1. Chu kỳ xét hạng 12 tháng bắt đầu từ thời điểm phát sinh giao dịch tích điểm hợp lệ đầu tiên.
> 2. Cơ chế Soft Landing: khi hết chu kỳ 12 tháng, nếu không đủ điều kiện duy trì hạng, chỉ hạ tối đa 1 bậc.
> 3. Điểm xét hạng (`qualifying_points_cycle`) là tổng điểm kiếm được trong chu kỳ; đổi voucher và hết hạn điểm chỉ trừ điểm khả dụng (`available_points`), không trừ điểm xét hạng. Khi sang chu kỳ mới, điểm xét hạng reset về 0, điểm khả dụng không bị reset.

Hạng thành viên được quản lý theo chu kỳ 12 tháng:
- **🥉 VAMOS Member:** Dưới 1.000 điểm chu kỳ (hoặc tài khoản mới).
- **🥈 VAMOS Silver:** 1.000 – 2.499 điểm chu kỳ.
- **🥇 VAMOS Gold:** 2.500 – 4.999 điểm chu kỳ.
- **👑 VAMOS VIP Elite:** Từ 5.000 điểm chu kỳ trở lên.

### Thành phần 2: Cơ Chế Đánh Giá Nhận Điểm (Review-to-Earn)
- **Điều kiện đánh giá:**
  1. Người dùng đã đăng nhập (Session `vamos_sid`).
  2. Đơn hàng phải thuộc quyền sở hữu của người dùng (`orders.user_id = session.user.id`).
  3. Đơn hàng phải ở trạng thái `COMPLETED` (đã giao thành công và thu tiền COD).
  4. Sản phẩm phải nằm trong đơn hàng thông qua `order_items` và `product_variants`.
  5. Mỗi cặp `(order_id, product_id)` chỉ được đánh giá 1 lần duy nhất (ngăn chặn duplicate review ở tầng Service và Database Unique Constraint).
- **Thang điểm nhận thưởng (Tối đa 300 điểm/đánh giá):**
  * **Mức 1 (+100 điểm):** Đánh giá số sao (1 đến 5 sao).
  * **Mức 2 (+100 điểm):** Viết nhận xét chi tiết (tối thiểu 50 ký tự) HOẶC chọn ít nhất một Quick Tag hợp lệ (`Vừa vặn chuẩn size`, `Đế Phylon cực êm`, `Đẹp như hình`, `Giao hàng nhanh`, `Chất lượng xuất sắc`, `Đóng gói cẩn thận`).
  * **Mức 3 (+100 điểm):** Đính kèm ít nhất 1 hình ảnh thực tế (tối đa 5 ảnh, định dạng JPEG/PNG/WEBP, dung lượng tối đa 5MB/ảnh qua Multer an toàn).
  * **Giới hạn trần:** Tối đa 300 điểm cho mỗi đánh giá hoàn chỉnh.

### Thành phần 3: Cơ Chế Tích Lũy Chi Tiêu Đơn Hàng (Order Purchase Points)
- Khi đơn hàng chuyển trạng thái sang `COMPLETED`, hệ thống tự động trích 3% giá trị sản phẩm hợp lệ (`Math.floor((subtotal - discount_amount) * 0.03)`).
- Phí vận chuyển (`shipping_fee`) tuyệt đối không được tính vào giá trị tích điểm.
- Cơ chế bảo vệ Idempotency: Khóa `ORDER_PURCHASE_{orderId}` trong sổ cái bảo đảm đơn hàng dù được cập nhật nhiều lần cũng không bị cộng trùng điểm.

### Thành phần 4: Cơ Chế Đổi Điểm Thưởng (Points-to-Voucher Redemption)
- Danh mục phần thưởng cấu hình trong bảng `point_reward_rules`:
  1. **Voucher Giảm 30.000đ:** Yêu cầu 500 điểm (Đơn từ 300k).
  2. **Voucher Giảm 70.000đ:** Yêu cầu 1.000 điểm (Đơn từ 600k).
  3. **Voucher Giảm 150.000đ:** Yêu cầu 1.500 điểm (Đơn từ 1.200k).
  4. **Voucher Freeship 40.000đ:** Yêu cầu 300 điểm (Đơn từ 200k).
  5. **Voucher Giảm 20% Dòng Hunter:** Yêu cầu 1.200 điểm (Đơn từ 500k).
  6. **Vớ Kháng Khuẩn Nano Bạc (Quà vật lý):** Yêu cầu 800 điểm (`is_active = 0`, trạng thái sắp mở).
- Khi đổi thưởng, hệ thống sinh mã ngẫu nhiên bảo mật `VAMOSCLUB-{HEX}`, lưu vào `vouchers` với `usage_limit = 1`, liên kết với `voucher_redemptions`.
- Điểm khả dụng (`available_points`) bị trừ, `lifetime_redeemed_points` tăng, ghi sổ cái âm `VOUCHER_REDEMPTION`.

### Thành phần 5: Bảo Vệ Voucher Cá Nhân & Vòng Đời Đơn Hàng
- Voucher đổi từ điểm là **voucher cá nhân**: Chỉ tài khoản sở hữu (`voucher_redemptions.user_id = session.user.id`) mới có thể áp dụng khi checkout. Tài khoản khác nhập mã sẽ bị hệ thống từ chối.
- Khi đặt hàng thành công: Trạng thái redemption chuyển thành `USED`, cập nhật `used_at = GETDATE()`.
- Khi đơn hàng bị hủy (`CANCELLED`): Hệ thống tự động hoàn trả voucher cá nhân về trạng thái `AVAILABLE`, xóa `used_at`, cho phép khách hàng tái sử dụng.

### Thành phần 6: Chống Gian Lận & Race Condition (Concurrency Defense)
- Toàn bộ giao dịch ví điểm và đổi voucher được bao bọc trong SQL Server ACID Transaction với khóa bi quan `WITH (UPDLOCK, ROWLOCK)`.
- Hai yêu cầu đổi điểm đồng thời từ cùng một tài khoản khi số dư chỉ đủ 1 lần sẽ được tuần tự hóa: 1 yêu cầu thành công, 1 yêu cầu bị từ chối do không đủ điểm. Số dư ví điểm tuyệt đối không bao giờ bị âm (`CHECK (available_points >= 0)`).

---

## 3. LÀM RÕ CÁC QUY TẮC NGHIỆP VỤ & CÂU HỎI KIỂM TOÁN (AUDIT CLARIFICATIONS)

Nhằm đảm bảo sự nhất quán tuyệt đối giữa tài liệu đặc tả, cơ sở dữ liệu và mã nguồn thực thi, 5 điểm cốt lõi sau được làm rõ:

### 3.1. Ngưỡng Hạng Thành Viên & Chu Kỳ Xét Hạng 12 Tháng (Chính Sách Đã Chốt)
- **Ngưỡng điểm xếp hạng theo chu kỳ 12 tháng:**
  * **🥉 VAMOS Member:** Dưới 1.000 điểm tích lũy trong chu kỳ.
  * **🥈 VAMOS Silver:** 1.000 – 2.499 điểm tích lũy trong chu kỳ.
  * **🥇 VAMOS Gold:** 2.500 – 4.999 điểm tích lũy trong chu kỳ.
  * **👑 VAMOS VIP:** Từ 5.000 điểm tích lũy trong chu kỳ trở lên.
- **Quy tắc chu kỳ 12 tháng:**
  * Chu kỳ đầu tiên bắt đầu từ thời điểm phát sinh giao dịch tích điểm hợp lệ đầu tiên (`REVIEW_REWARD` hoặc `ORDER_PURCHASE` với `amount > 0`). Tài khoản chưa có giao dịch tích điểm hợp lệ giữ `cycle_anchor_at = NULL`, `cycle_start_at = NULL`, `cycle_end_at = NULL`, `cycle_number = 0`, `qualifying_points_cycle = 0`, `tier_code = 'MEMBER'`.
  * Mốc gốc `cycle_anchor_at` bất biến theo UTC. Chu kỳ thứ `N` ($\ge 1$) chạy từ `addYearsFromAnchor(cycle_anchor_at, N - 1)` đến `addYearsFromAnchor(cycle_anchor_at, N)` để tránh trôi ngày 29/02 năm nhuận (`2024-02-29` $\rightarrow$ `2025-02-28` $\rightarrow$ `2028-02-29`).
  * Ranh giới giao dịch: `tx.created_at <= cycle_end_at` thuộc chu kỳ đang kết thúc; `tx.created_at > cycle_end_at` kích hoạt rollover/Soft Landing trước khi cộng vào chu kỳ mới.
  * Mọi mốc thời gian đối chiếu theo đồng hồ chuẩn SQL Server `GETDATE()` (được `mssql`/`tedious` đọc theo UTC).
- **Quy tắc bảo lưu & Hạ hạng Soft Landing:**
  * Khách hàng thăng hạng giữa chu kỳ có hiệu lực ngay khi đạt ngưỡng.
  * Khi hết chu kỳ 12 tháng, nếu điểm không đủ duy trì hạng hiện tại, hệ thống áp dụng **Soft Landing**: chỉ hạ tối đa 1 bậc (VIP $\rightarrow$ GOLD; GOLD $\rightarrow$ SILVER; SILVER $\rightarrow$ MEMBER; MEMBER giữ nguyên).
  * Điểm xét hạng của chu kỳ mới bắt đầu từ 0; số dư điểm khả dụng trong ví không bị reset.
- **Tách bạch điểm xét hạng và điểm khả dụng:**
  * Đổi voucher chỉ trừ `available_points`, không làm giảm điểm xét hạng trong chu kỳ.
  * Điểm hết hạn sau 365 ngày chỉ trừ `available_points`, không làm giảm điểm xét hạng của chu kỳ phát sinh.

### 3.2. Phạm Vi Hỗ Trợ Đa Phương Tiện (Media Upload Scope)
- **Hỗ trợ hiện tại (Giai đoạn 1):** Hệ thống chỉ chấp nhận tệp hình ảnh thực tế (`IMAGE`) thuộc các định dạng `JPEG`, `JPG`, `PNG`, `WEBP`. Mỗi ảnh có dung lượng tối đa 5MB, tối đa 5 ảnh cho mỗi đánh giá.
- **Kiểm soát bảo mật:** Multer lưu tệp vào thư mục an toàn `src/public/uploads/reviews/` với tên file ngẫu nhiên UUID/Timestamp. Middleware thực hiện kiểm tra sâu chữ ký nhị phân (magic bytes) và tự động dọn dẹp tệp rác (`cleanupUploadedFiles`) nếu transaction bị hủy hoặc dữ liệu không hợp lệ.
- **Tệp Video:** Hiện tại **CHƯA hỗ trợ tải video**. Ràng buộc cơ sở dữ liệu `CHECK (media_type IN ('IMAGE', 'VIDEO'))` được thiết kế sẵn để mở rộng trong giai đoạn tương lai mà không cần thay đổi schema.

### 3.3. Xử Lý Quà Tặng Vật Lý (Physical Gift Handling)
- Bản ghi quà tặng vật lý `Vớ Kháng Khuẩn Nano Bạc VAMOS` trong bảng `point_reward_rules` hiện được cấu hình:
  * `reward_type = 'PHYSICAL_GIFT'`
  * `stock_quantity = 0`
  * `is_active = 0`
- Trạng thái hiển thị trên giao diện là "Sắp mở đổi quà". Luồng quy đổi quà tặng vật lý đòi hỏi quy trình vận chuyển độc lập và sẽ được kích hoạt khi tích hợp module giao vận quà tặng.

### 3.4. Vòng Đời Voucher Cá Nhân & Hoàn Trả Khi Hủy Đơn
- Voucher đổi từ điểm thưởng là voucher độc quyền (`is_personal = 1`). Chỉ tài khoản tạo ra lượt đổi (`voucher_redemptions.user_id`) mới có thể áp dụng mã tại bước thanh toán.
- **Khi đặt hàng thành công:** Trạng thái bản ghi `voucher_redemptions` chuyển từ `AVAILABLE` sang `USED`, ghi nhận `used_at = GETDATE()`.
- **Khi đơn hàng bị hủy (`CANCELLED`):** Hệ thống kích hoạt cơ chế hoàn trả tự động: cập nhật `status = 'AVAILABLE'` và `used_at = NULL`. Mã voucher lập tức có hiệu lực trở lại để khách hàng sử dụng cho đơn hàng khác mà không bị mất quyền lợi.

### 3.5. Đồng Bộ Hóa Toàn Diện Với Kế Hoạch Triển Khai
- Toàn bộ kiến trúc và quy trình nghiệp vụ trên đã được chuẩn hóa và ghi nhận chi tiết tại **Section 16: VAMOS CLUB — LOYALTY SYSTEM** trong [plan.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/plan.md#16-vamos-club--loyalty-system-review-to-earn--points-to-voucher).

---

## 4. MA TRẬN LIÊN KẾT TÀI LIỆU DỰ ÁN

| Thành phần | Đường dẫn tài liệu / Mã nguồn | Trạng thái đồng bộ |
| :--- | :--- | :---: |
| Kế hoạch tổng thể | [plan.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/plan.md#16-vamos-club--loyalty-system-review-to-earn--points-to-voucher) | ✓ Đã đồng bộ |
| Từ điển dữ liệu CSDL | [DATA_DICTIONARY.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATA_DICTIONARY.md#phân-nhóm-7-khách-hàng-thân-thiết--đổi-thưởng-vamos-club-loyalty-system) | ✓ 27 bảng chuẩn hóa |
| Sơ đồ quan hệ ERD | [PHYSICAL_ERD.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/erd/PHYSICAL_ERD.puml) | ✓ Đã tích hợp 6 bảng |
| SQL Migration (005) | [005_vamos_club_loyalty_system.sql](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/005_vamos_club_loyalty_system.sql) | ✓ Đã áp dụng |
| SQL Migration (006) | [006_vamos_club_expiration_and_tier_cycle.sql](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql) | ⏳ Đã tạo file (chưa chạy trên DB runtime) |
| Domain Engine Chu kỳ & FEFO | [loyaltyCycle.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js) | ✓ Pure module (offline unit tested) |
| CLI Worker Định kỳ | [processLoyaltyCycle.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/processLoyaltyCycle.js) | ⏳ Đã tạo CLI (`sp_getapplock`, chưa chạy DB thật) |
| Backfill Replay Tool | [backfillLoyaltyHistory.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js) | ⏳ Fail-closed (`DRY_RUN`/`APPLY`), chưa chạy DB thật |
| Review Service & Logic | [review.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/review.service.js) | ✓ Magic bytes & ACID |
| Loyalty Service & Wallet | [loyalty.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js) | ✓ Pessimistic lock, FEFO & chu kỳ 12 tháng |
| Upload Middleware | [upload.middleware.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/middlewares/upload.middleware.js) | ✓ Chống file rác & Giả mạo |
| Giao diện Đổi thưởng | [rewards.pug](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/views/pages/account/rewards.pug) | ✓ Tailwind CSS + chu kỳ & hạn 365 ngày |
| Unit Tests (Offline) | [test_loyalty_cycle_unit.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_unit.js) | ✓ 0 kết nối DB |
| Integration Tests (CI DB) | [test_loyalty_cycle_integration.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js) | ⏳ Chờ chạy trên CI SQL Server |
| Kiểm thử Tự động | [test_loyalty_module.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js) | ✓ Đã đồng bộ FEFO batch fixture |
| Kiểm thử Hồi quy | [regression_suite.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/regression_suite.js) | ✓ End-to-end suite |
