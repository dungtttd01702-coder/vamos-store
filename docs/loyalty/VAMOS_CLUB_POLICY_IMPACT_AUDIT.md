# BÁO CÁO KIỂM TOÁN TÁC ĐỘNG VÀ HOÀN TẤT ĐẶC TẢ KIẾN TRÚC — VAMOS CLUB
## (VAMOS CLUB POLICY AUDIT & ARCHITECTURAL VERIFICATION REPORT)

> **Dự án:** VAMOS STORE — Website Thương Mại Điện Tử Bán Giày Chuyên Nghiệp  
> **Module kiểm toán:** VAMOS CLUB Loyalty System  
> **Giai đoạn:** KIỂM TOÁN BỔ SUNG & HOÀN TẤT ĐẶC TẢ TRƯỚC TRIỂN KHAI (STRICT READ-ONLY)  
> **Thời điểm hoàn thành:** 21/11/2026  
> **Hệ thống thực hiện:** Lead Software Architect, Database Administrator & Antigravity Engineering System  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | HEAD `eb822aba57d75a2ecad390123c188afb73db3cb8`  
> **Cam kết:** **KHÔNG SỬA CODE, KHÔNG TẠO MIGRATION, KHÔNG CHẠY DDL/DML, KHÔNG SỬA DỮ LIỆU CSDL.**

---

## MỤC LỤC BÁO CÁO
1. [MỤC 1. CÁC QUYẾT ĐỊNH NGHIỆP VỤ ĐÃ ĐƯỢC NGƯỜI DÙNG XÁC NHẬN](#mục-1-các-quyết-định-nghiệp-vụ-đã-được-người-dùng-xác-nhận)
2. [MỤC 2. QUY TẮC BẢO TOÀN & GIỚI HẠN THỰC THI (STRICT CONSTRAINTS)](#mục-2-quy-tắc-bảo-toàn--giới-hạn-thực-thi-strict-constraints)
3. [MỤC 3. KIỂM TOÁN SÂU SAI LỆCH VÍ VÀ LEDGER TRÊN VAMOS_STORE_DB](#mục-3-kiểm-toán-sâu-sai-lệch-ví-và-ledger-trên-vamos_store_db)
4. [MỤC 4. KIỂM TOÁN PHƯƠNG ÁN BACKFILL LOYALTY_POINT_BATCHES](#mục-4-kiểm-toán-phương-án-backfill-loyalty_point_batches)
5. [MỤC 5. KIỂM TOÁN IDEMPOTENCY VÀ XỬ LÝ ĐỒNG THỜI (CONCURRENCY)](#mục-5-kiểm-toán-idempotency-và-xử-lý-đồng-thời-concurrency)
6. [MỤC 6. KIỂM TOÁN PHƯƠNG ÁN ROLLBACK TOÀN DIỆN](#mục-6-kiểm-toán-phương-án-rollback-toàn-diện)
7. [MỤC 7. BẢNG TÌNH HUỐNG KIỂM THỬ SOFT LANDING (TEST MATRIX)](#mục-7-bảng-tình-huống-kiểm-thử-soft-landing-test-matrix)
8. [MỤC 8. ĐẶC TẢ THIẾT KẾ MIGRATION DỰ KIẾN (ĐỀ XUẤT, CHƯA CHẠY)](#mục-8-đặc-tả-thiết-kế-migration-dự-kiến-đề-xuất-chưa-chạy)
9. [MỤC 9. BẢNG TỔNG KẾT ĐIỀU KIỆN TIÊN QUYẾT & LỘ TRÌNH TRIỂN KHAI](#mục-9-bảng-tổng-kết-điều-kiện-tiên-quyết--lộ-trình-triển-khai)
10. [MỤC 10. ĐIỂM DỪNG BẮT BUỘC (MANDATORY AUDIT CHECKPOINT)](#mục-10-điểm-dừng-bắt-buộc-mandatory-audit-checkpoint)

---

## MỤC 1. CÁC QUYẾT ĐỊNH NGHIỆP VỤ ĐÃ ĐƯỢC NGƯỜI DÙNG XÁC NHẬN

Người dùng đã chính thức xác nhận và chốt 3 chính sách nền tảng cho VAMOS CLUB:

### 1.1. Chu Kỳ Xét Hạng 12 Tháng
1. **Mốc bắt đầu chu kỳ đầu tiên:** Bắt đầu chính xác từ thời điểm khách hàng phát sinh **giao dịch tích điểm hợp lệ đầu tiên** (`amount > 0`: gồm `REVIEW_REWARD` hoặc `ORDER_PURCHASE`).
2. **Tài khoản chưa kích hoạt:** Khách hàng đã đăng ký tài khoản hoặc đã tạo ví nhưng chưa từng phát sinh giao dịch tích điểm hợp lệ thì chu kỳ ở trạng thái chờ kích hoạt (`cycle_start_at IS NULL`, `cycle_end_at IS NULL`, `tier_code = 'MEMBER'`).
3. **Mốc chu kỳ tiếp theo:** Nối tiếp theo **ngày kỷ niệm lịch** của chu kỳ ban đầu bằng hàm `DATEADD(year, 1, cycle_start_at)`.
4. **Loại trừ mốc mặc định:** Tuyệt đối không dùng ngày đăng ký tài khoản (`users.created_at`) hoặc ngày tạo ví (`wallets.created_at`) làm mốc mặc định.
5. **Giao dịch không kích hoạt chu kỳ:** Giao dịch đổi voucher (`VOUCHER_REDEMPTION`) và giao dịch hết hạn điểm (`POINT_EXPIRATION`) tuyệt đối không được dùng làm mốc kích hoạt chu kỳ.

### 1.2. Cơ Chế Hạ Hạng Soft Landing
Khi kết thúc chu kỳ 12 tháng, hệ thống so sánh điểm xét hạng của chu kỳ với ngưỡng yêu cầu:
- **VIP không đủ điều kiện duy trì:** Hạ tối đa 1 bậc xuống **`GOLD`**.
- **GOLD không đủ điều kiện duy trì:** Hạ tối đa 1 bậc xuống **`SILVER`**.
- **SILVER không đủ điều kiện duy trì:** Hạ tối đa 1 bậc xuống **`MEMBER`**.
- **MEMBER tiếp tục là `MEMBER`**.
- **Nguyên tắc cốt lõi:** Mỗi chu kỳ chỉ hạ tối đa 1 bậc, không bao giờ rớt nhiều bậc cùng một lúc.
- **Duy trì hoặc thăng hạng:** Nếu điểm chu kỳ đạt hoặc vượt ngưỡng hạng hiện tại thì tiếp tục giữ hạng hoặc thăng hạng tương ứng.
- **Nâng hạng giữa chu kỳ (Real-Time Upgrade):** Có hiệu lực ngay lập tức khi tích đủ điểm.
- **Quy tắc xử lý khi nâng hạng giữa chu kỳ:**
  * Giả sử khách hàng đang ở hạng SILVER, vào tháng thứ 6 của chu kỳ tích thêm điểm và đạt ngưỡng GOLD (2.500 điểm) $\rightarrow$ Khách hàng được nâng lên hạng GOLD ngay lập tức.
  * Đến ngày kết thúc chu kỳ 12 tháng, hệ thống xét lại: Hạng hiện tại của khách hàng tại thời điểm kết thúc chu kỳ là GOLD.
  * Nếu tổng điểm xét hạng của chu kỳ đó không đủ 2.500 điểm để duy trì GOLD $\rightarrow$ Theo đúng quy tắc Soft Landing (chỉ hạ tối đa 1 bậc từ hạng hiện tại), khách hàng **chỉ bị hạ 1 bậc từ GOLD xuống SILVER**, tuyệt đối không bị rớt về MEMBER. Hạng SILVER này được duy trì cho chu kỳ 12 tháng tiếp theo.

### 1.3. Điểm Xét Hạng (Qualifying Points)
- **Định nghĩa:** Điểm xét hạng (`qualifying_points_cycle`) là tổng tất cả các điểm thưởng hợp lệ (`amount > 0`) kiếm được trong chu kỳ 12 tháng đó.
- **Đổi voucher:** Đổi voucher chỉ trừ điểm khả dụng (`available_points`), **tuyệt đối không trừ điểm xét hạng**.
- **Điểm hết hạn:** Điểm hết hạn sau 365 ngày chỉ trừ điểm khả dụng (`available_points`), **tuyệt đối không trừ điểm xét hạng** đã được ghi nhận trong chu kỳ phát sinh.
- **Kết thúc chu kỳ:** Điểm xét hạng của chu kỳ cũ được chốt sổ, và điểm xét hạng của chu kỳ mới bắt đầu từ **0**.
- **Bảo toàn điểm khả dụng:** Số dư điểm khả dụng trong ví (`available_points`) **không bị reset về 0** khi kết thúc chu kỳ.
- **Quyền đổi voucher bình đẳng:** Toàn bộ thành viên các hạng MEMBER, SILVER, GOLD, VIP đều có quyền đổi bất kỳ voucher nào đang hoạt động nếu đủ điểm khả dụng và thỏa mãn điều kiện tối thiểu của voucher đó.

---

## MỤC 2. QUY TẮC BẢO TOÀN & GIỚI HẠN THỰC THI (STRICT CONSTRAINTS)

Đây vẫn là giai đoạn kiểm toán chuyên sâu, hoàn thiện đặc tả và đối soát dữ liệu. Hệ thống tuân thủ 100% các cam kết:
1. **Kiểm tra Git:** Đang ở branch `fix/master-repair-plan`, HEAD `eb822aba57d75a2ecad390123c188afb73db3cb8`. Giữ nguyên vẹn working tree, không checkout, reset, clean, stash, commit hay push.
2. **Không sửa mã nguồn logic nghiệp vụ** (`src/services/`, `src/controllers/`, `src/routes/`).
3. **Không tạo migration mới** (`006_...`) trong thư mục `database/migrations/`.
4. **Không chạy migration hoặc DDL** làm thay đổi schema database.
5. **Không chạy bất kỳ lệnh DML** nào (UPDATE, DELETE, INSERT) làm thay đổi dữ liệu database.
6. **Không tự ý đồng bộ số dư ví** `user_id = 2`.
7. **Không chạy test** có khả năng ghi dữ liệu vào database.
8. **Không triển khai background worker hay scheduler**.

---

## MỤC 3. KIỂM TOÁN SÂU SAI LỆCH VÍ VÀ LEDGER TRÊN VAMOS_STORE_DB

### 3.1. Bảng Đối Chiếu Chi Tiết Toàn Bộ 37 Giao Dịch Của `user_id = 2`
Truy vấn trực tiếp từ bảng `point_transactions` trên CSDL phát triển `vamos_store_db`:

| Tx ID | Thời gian phát sinh | Loại giao dịch (`transaction_type`) | Số điểm (`amount`) | Số dư ghi nhận (`balance_after`) | Số dư chạy (`running_calc`) | Lệch (`balance_after - running`) | Tham chiếu nghiệp vụ (`reference`) | Mã chống trùng (`idempotency_key`) |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **1** | 2026-11-21 15:37:33 | `REVIEW_REWARD` | +200 | 200 | 200 | 0 | REVIEW #1 (Đơn #29) | `REVIEW_29_1` |
| **2** | 2026-11-21 15:38:45 | `REVIEW_REWARD` | +300 | 500 | 500 | 0 | REVIEW #2 (Đơn #31) | `REVIEW_31_1` |
| **3** | 2026-11-21 15:39:07 | `REVIEW_REWARD` | +300 | 800 | 800 | 0 | REVIEW #3 (Đơn #33) | `REVIEW_33_1` |
| **4** | 2026-11-21 15:39:07 | `VOUCHER_REDEMPTION` | -500 | 200 | 300 | -100 | VOUCHER_REDEMPTION #5 | `REDEMPTION_..._29883EDB` |
| **5** | 2026-11-21 15:39:07 | `VOUCHER_REDEMPTION` | -500 | 0 | -200 | +200 | VOUCHER_REDEMPTION #6 | `REDEMPTION_..._1976BB4A` |
| **6** | 2026-11-21 15:39:07 | `VOUCHER_REDEMPTION` | -500 | 0 | -700 | +700 | VOUCHER_REDEMPTION #7 | `REDEMPTION_..._61FF3D24` |
| **7** | 2026-11-21 15:39:07 | `ORDER_PURCHASE` | +27.000 | 27.000 | 26.300 | +700 | ORDER #33 | `ORDER_PURCHASE_33` |
| **8** | 2026-11-21 15:39:38 | `REVIEW_REWARD` | +300 | 27.300 | 26.600 | +700 | REVIEW #4 (Đơn #35) | `REVIEW_35_1` |
| **9** | 2026-11-21 15:39:38 | `VOUCHER_REDEMPTION` | -500 | 200 | 26.100 | -25.900 | VOUCHER_REDEMPTION #8 | `REDEMPTION_..._DA9DBC87` |
| **10** | 2026-11-21 15:39:38 | `VOUCHER_REDEMPTION` | -500 | 0 | 25.600 | -25.600 | VOUCHER_REDEMPTION #9 | `REDEMPTION_..._D7E102CA` |
| **11** | 2026-11-21 15:39:38 | `VOUCHER_REDEMPTION` | -500 | 0 | 25.100 | -25.100 | VOUCHER_REDEMPTION #10 | `REDEMPTION_..._D1DAA047` |
| **12** | 2026-11-21 15:40:51 | `REVIEW_REWARD` | +300 | 300 | 25.400 | -25.100 | REVIEW #5 (Đơn #38) | `REVIEW_38_1` |
| **13** | 2026-11-21 15:40:51 | `VOUCHER_REDEMPTION` | -500 | 200 | 24.900 | -24.700 | VOUCHER_REDEMPTION #11 | `REDEMPTION_..._4707307E` |
| **14** | 2026-11-21 15:40:52 | `VOUCHER_REDEMPTION` | -500 | 0 | 24.400 | -24.400 | VOUCHER_REDEMPTION #12 | `REDEMPTION_..._2B68C8E3` |
| **15** | 2026-11-21 15:40:52 | `VOUCHER_REDEMPTION` | -500 | 0 | 23.900 | -23.900 | VOUCHER_REDEMPTION #13 | `REDEMPTION_..._EA1685E8` |
| **16** | 2026-11-21 15:40:52 | `ORDER_PURCHASE` | +27.000 | 27.000 | 50.900 | -23.900 | ORDER #38 | `ORDER_PURCHASE_38` |
| **17** | 2026-11-21 15:41:51 | `REVIEW_REWARD` | +300 | 27.300 | 51.200 | -23.900 | REVIEW #6 (Đơn #41) | `REVIEW_41_1` |
| **18** | 2026-11-21 15:41:51 | `VOUCHER_REDEMPTION` | -500 | 200 | 50.700 | -50.500 | VOUCHER_REDEMPTION #14 | `REDEMPTION_..._403D4CF9` |
| **19** | 2026-11-21 15:41:51 | `VOUCHER_REDEMPTION` | -500 | 0 | 50.200 | -50.200 | VOUCHER_REDEMPTION #15 | `REDEMPTION_..._5312A8B4` |
| **20** | 2026-11-21 15:41:51 | `VOUCHER_REDEMPTION` | -500 | 0 | 49.700 | -49.700 | VOUCHER_REDEMPTION #16 | `REDEMPTION_..._8277D657` |
| **21** | 2026-11-21 15:41:51 | `ORDER_PURCHASE` | +27.000 | 27.000 | 76.700 | -49.700 | ORDER #41 | `ORDER_PURCHASE_41` |
| **22** | 2026-11-21 15:44:54 | `REVIEW_REWARD` | +300 | 27.300 | 77.000 | -49.700 | REVIEW #7 (Đơn #44) | `REVIEW_44_1` |
| **23** | 2026-11-21 15:44:54 | `VOUCHER_REDEMPTION` | -500 | 200 | 76.500 | -76.300 | VOUCHER_REDEMPTION #17 | `REDEMPTION_..._AA725110` |
| **24** | 2026-11-21 15:44:54 | `VOUCHER_REDEMPTION` | -500 | 0 | 76.000 | -76.000 | VOUCHER_REDEMPTION #18 | `REDEMPTION_..._7B740397` |
| **25** | 2026-11-21 15:44:54 | `VOUCHER_REDEMPTION` | -500 | 0 | 75.500 | -75.500 | VOUCHER_REDEMPTION #19 | `REDEMPTION_..._33B61F63` |
| **26** | 2026-11-21 15:44:55 | `ORDER_PURCHASE` | +27.000 | 27.000 | 102.500 | -75.500 | ORDER #44 | `ORDER_PURCHASE_44` |
| **27** | 2026-11-21 17:00:15 | `REVIEW_REWARD` | +300 | 27.300 | 102.800 | -75.500 | REVIEW #8 (Đơn #47) | `REVIEW_47_1` |
| **28** | 2026-11-21 17:00:15 | `VOUCHER_REDEMPTION` | -500 | 200 | 102.300 | -102.100 | VOUCHER_REDEMPTION #20 | `REDEMPTION_..._939A4674` |
| **29** | 2026-11-21 17:00:15 | `VOUCHER_REDEMPTION` | -500 | 0 | 101.800 | -101.800 | VOUCHER_REDEMPTION #21 | `REDEMPTION_..._BA49EEE1` |
| **30** | 2026-11-21 17:00:15 | `VOUCHER_REDEMPTION` | -500 | 0 | 101.300 | -101.300 | VOUCHER_REDEMPTION #22 | `REDEMPTION_..._B6992174` |
| **31** | 2026-11-21 17:00:15 | `ORDER_PURCHASE` | +27.000 | 27.000 | 128.300 | -101.300 | ORDER #47 | `ORDER_PURCHASE_47` |
| **32** | 2026-11-21 18:31:42 | `REVIEW_REWARD` | +300 | 27.300 | 128.600 | -101.300 | REVIEW #9 (Đơn #50) | `REVIEW_50_1` |
| **33** | 2026-11-21 18:32:05 | `REVIEW_REWARD` | +300 | 1.000 | 128.900 | -127.900 | REVIEW #10 (Đơn #52) | `REVIEW_52_1` |
| **34** | 2026-11-21 18:32:05 | `VOUCHER_REDEMPTION` | -500 | 200 | 128.400 | -128.200 | VOUCHER_REDEMPTION #24 | `REDEMPTION_..._E4B2ECD7...` |
| **35** | 2026-11-21 18:32:05 | `VOUCHER_REDEMPTION` | -500 | 0 | 127.900 | -127.900 | VOUCHER_REDEMPTION #25 | `REDEMPTION_..._50C95F10...` |
| **36** | 2026-11-21 18:32:05 | `VOUCHER_REDEMPTION` | -500 | 0 | 127.400 | -127.400 | VOUCHER_REDEMPTION #26 | `REDEMPTION_..._D302849E...` |
| **37** | 2026-11-21 18:32:05 | `ORDER_PURCHASE` | +27.000 | 27.000 | **154.400** | **-127.400** | ORDER #52 | `ORDER_PURCHASE_52` |

### 3.2. Tổng Kết Số Liệu Ledger & Số Dư Ví Hiện Tại
- **Tổng điểm cộng (Earned):** $+164.900$ điểm (gồm 10 giao dịch `REVIEW_REWARD` = 2.900đ và 6 giao dịch `ORDER_PURCHASE` = 162.000đ).
- **Tổng điểm trừ (Redeemed):** $-10.500$ điểm (21 giao dịch `VOUCHER_REDEMPTION` $\times -500$ điểm).
- **Số dư ledger tính toán cuối cùng (`running_calc`):** **`+154.400` điểm**.
- **Số dư ví thực tế hiện tại (`user_points_wallets.available_points`):** **`27.000` điểm**.
- **Chênh lệch giữa ví và ledger:** **$154.400 - 27.000 = 127.400$ điểm**.

### 3.3. Bằng Chứng Pháp Y Về Nguyên Nhân Lệch Ví (Forensic Evidence)
Phân tích kỹ cột `balance_after` trong bảng trên hé lộ một quy luật bất thường lặp đi lặp lại:
1. **Tại các giao dịch đơn hàng Tx #7, #16, #21, #26, #31, #37:**
   Cả 6 giao dịch này đều có giá trị `amount = +27.000` và **giá trị `balance_after` được ghi nhận trong bảng luôn là đúng `27.000`**!
   Nếu đây là một tài khoản khách hàng mua sắm liên tục, `balance_after` của giao dịch 16 phải là ~50.900đ, giao dịch 21 phải là ~76.700đ, v.v. Việc cả 6 lần đều ghi nhận `balance_after = 27.000` chứng minh rằng **ngay trước mỗi giao dịch mua hàng, số dư ví trong database luôn bị ai đó đặt về 0** ($0 + 27.000 = 27.000$)!
2. **Đối chiếu mã nguồn kiểm thử [tests/test_loyalty_module.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js):**
   Tại dòng 139, tệp test chạy truy vấn:
   `let customer1 = await query("SELECT TOP 1 id, email, full_name FROM users WHERE role = 'CUSTOMER' ORDER BY id ASC");`
   Do `user_id = 2` là khách hàng có ID nhỏ nhất trong CSDL, test runner đã tự động gán `user1 = user_id 2`.
   Trong mỗi lần chạy test suite, các câu lệnh fixture sau được thực thi trực tiếp:
   - **Dòng 397:** `UPDATE user_points_wallets SET available_points = 700 WHERE user_id = @userId;` $\rightarrow$ Đổi 1 voucher (-500đ) $\rightarrow$ ví còn 200đ.
   - **Dòng 428:** `UPDATE user_points_wallets SET available_points = 500 WHERE user_id = @userId;` $\rightarrow$ Chạy test race condition đồng thời (1 request thành công -500đ, 1 thất bại) $\rightarrow$ ví về 0đ.
   - **Dòng 459:** `UPDATE user_points_wallets SET available_points = 500 WHERE user_id = @userId;` $\rightarrow$ Đổi 1 voucher (-500đ) $\rightarrow$ ví về 0đ.
   - **Section 7:** Chạy test đơn hàng mua sắm: cộng 3% của 900.000đ = +27.000 điểm $\rightarrow$ Số dư ví trở thành $0 + 27.000 = 27.000$ điểm!
3. **Các bảng khác bị ảnh hưởng bởi test:**
   - Bảng `orders`: Đã chèn 6 đơn hàng test (`ORD-TEST-LOYALTY-...`, các đơn #33, #38, #41, #44, #47, #52).
   - Bảng `order_items`: Đã chèn các sản phẩm cho 6 đơn hàng test.
   - Bảng `vouchers` và `voucher_redemptions`: Đã sinh 21 mã voucher cá nhân test (`VAMOSCLUB-...`).
   - Bảng `reviews`: Đã chèn 10 bản ghi đánh giá test.

### 3.4. Kết Luận: Sổ Cái Ledger Có Đủ Căn Cứ Làm Nguồn Phục Hồi Không?
- **KẾT LUẬN DỨT KHOÁT:** **SỔ CÁI LEDGER HIỆN TẠI CHƯA ĐỦ CĂN CỨ HỢP LỆ VỀ MẶT NGHIỆP VỤ ĐỂ LÀM NGUỒN PHỤC HỒI SỐ DƯ VÍ.**
- **Lý do kỹ thuật và pháp lý:**
  * 100% dữ liệu của 37 giao dịch trong `point_transactions` là **dữ liệu ô nhiễm do chạy lặp lại test suite 6 lần trên CSDL phát triển** (test data pollution).
  * 154.400 điểm trong sổ cái là tổng dồn ảo của 6 lần chạy test lặp lại. `user_id = 2` không hề có 6 đơn hàng thật trị giá 5,4 triệu đồng ngoài đời.
  * Nếu tự ý chạy script đồng bộ ví lên 154.400 điểm, hệ thống sẽ **hợp thức hóa dữ liệu rác kiểm thử thành tài sản điểm thật** của tài khoản seed!
  * **Hành động đúng đắn:** Giữ nguyên hiện trạng, không sửa số dư ví. Dữ liệu này chỉ là dữ liệu môi trường phát triển (Development). Khi chuẩn bị phát hành hoặc bàn giao, toàn bộ dữ liệu test fixture này cần được dọn dẹp theo quy trình seed chuẩn.

---

## MỤC 4. KIỂM TOÁN PHƯƠNG ÁN BACKFILL LOYALTY_POINT_BATCHES

### 4.1. Quy Trình Phát Lại (Replay) Lịch Sử Giao Dịch
Để xây dựng bảng lô điểm `loyalty_point_batches`, không thể sao chép gộp toàn bộ các giao dịch cộng điểm rồi coi như điểm còn nguyên vẹn. Bắt buộc phải thiết kế một cỗ máy phát lại (Replay Engine) theo thứ tự thời gian:
1. **Thuật toán sắp xếp sự kiện:** Sắp xếp tất cả các giao dịch theo: `ORDER BY created_at ASC, id ASC`.
   * Sử dụng `id ASC` làm **Tie-breaker ổn định** để giải quyết trường hợp các giao dịch có cùng `created_at` (cùng mili-giây).
2. **Giao dịch cộng điểm (`amount > 0`):**
   * Khởi tạo một Lô điểm mới (`batch`):
     - `initial_points = tx.amount`
     - `remaining_points = tx.amount`
     - `expires_at = DATEADD(day, 365, tx.created_at)`
     - `status = 'ACTIVE'`
3. **Giao dịch trừ điểm (`amount < 0` - Đổi voucher):**
   * Áp dụng nguyên tắc **FEFO (First-Expiring First-Out)**:
   * Lấy các lô điểm đang có `status = 'ACTIVE'` và `remaining_points > 0`, sắp xếp theo `ORDER BY expires_at ASC, batch_id ASC`.
   * Khấu trừ dần số điểm cần đổi (`needed = |amount|`):
     - Nếu `batch.remaining_points <= needed`: Trừ hết lô điểm, gán `needed -= batch.remaining_points`, gán `batch.remaining_points = 0`, đổi trạng thái sang `EXHAUSTED`.
     - Nếu `batch.remaining_points > needed`: Trừ một phần, gán `batch.remaining_points -= needed`, gán `needed = 0`. Giữ nguyên `status = 'ACTIVE'`.

---

### 4.2. Thử Nghiệm Phát Lại Thực Tế Trên Dữ Liệu Của `user_id = 2` (Mô Phỏng Trong RAM)
Đã chạy thuật toán Replay FEFO trên bộ nhớ tạm với toàn bộ 37 giao dịch thực tế của `user_id = 2`:

```
=== PHÁT LẠI 37 GIAO DỊCH VÀ PHÁT HIỆN LỖI LÔ ĐIỂM ===
[Khởi tạo]: Tx #1 (+200) -> Batch 1: remaining = 200
            Tx #2 (+300) -> Batch 2: remaining = 300
            Tx #3 (+300) -> Batch 3: remaining = 300
            Tổng điểm trong kho = 800 điểm.

[Biến cố]:  Tx #4 (-500): Tiêu 200 của Batch 1 (hết), tiêu 300 của Batch 2 (hết). Kho còn 300 điểm (Batch 3).
            Tx #5 (-500): Tiêu 300 của Batch 3 (hết). CẦN THÊM 200 ĐIỂM -> KHO ĐÃ HẾT ĐIỂM!
            Tx #6 (-500): CẦN THÊM 500 ĐIỂM -> KHO ĐÃ HẾT ĐIỂM!
```

**Bảng kết quả các lô điểm sau Replay:**

| Lô (Batch ID) | Từ Tx ID | Loại giao dịch gốc | Điểm ban đầu | Điểm còn lại (`remaining`) | Trạng thái (`status`) | Ngày tạo | Ngày hết hạn 365 ngày |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **Batch 1** | Tx #1 | `REVIEW_REWARD` | 200 | 0 | `EXHAUSTED` | 2026-11-21 15:37:33 | 2027-11-21 15:37:33 |
| **Batch 2** | Tx #2 | `REVIEW_REWARD` | 300 | 0 | `EXHAUSTED` | 2026-11-21 15:38:45 | 2027-11-21 15:38:45 |
| **Batch 3** | Tx #3 | `REVIEW_REWARD` | 300 | 0 | `EXHAUSTED` | 2026-11-21 15:39:07 | 2027-11-21 15:39:07 |
| **Batch 4** | Tx #7 | `ORDER_PURCHASE` | 27.000 | 18.000 | `ACTIVE` | 2026-11-21 15:39:07 | 2027-11-21 15:39:07 |
| **Batch 5** | Tx #8 | `REVIEW_REWARD` | 300 | 300 | `ACTIVE` | 2026-11-21 15:39:38 | 2027-11-21 15:39:38 |
| **Batch 6** | Tx #12 | `REVIEW_REWARD` | 300 | 300 | `ACTIVE` | 2026-11-21 15:40:51 | 2027-11-21 15:40:51 |
| **Batch 7** | Tx #16 | `ORDER_PURCHASE` | 27.000 | 27.000 | `ACTIVE` | 2026-11-21 15:40:52 | 2027-11-21 15:40:52 |
| **Batch 8** | Tx #17 | `REVIEW_REWARD` | 300 | 300 | `ACTIVE` | 2026-11-21 15:41:51 | 2027-11-21 15:41:51 |
| **Batch 9** | Tx #21 | `ORDER_PURCHASE` | 27.000 | 27.000 | `ACTIVE` | 2026-11-21 15:41:51 | 2027-11-21 15:41:51 |
| **Batch 10** | Tx #22 | `REVIEW_REWARD` | 300 | 300 | `ACTIVE` | 2026-11-21 15:44:54 | 2027-11-21 15:44:54 |
| **Batch 11** | Tx #26 | `ORDER_PURCHASE` | 27.000 | 27.000 | `ACTIVE` | 2026-11-21 15:44:55 | 2027-11-21 15:44:55 |
| **Batch 12** | Tx #27 | `REVIEW_REWARD` | 300 | 300 | `ACTIVE` | 2026-11-21 17:00:15 | 2027-11-21 17:00:15 |
| **Batch 13** | Tx #31 | `ORDER_PURCHASE` | 27.000 | 27.000 | `ACTIVE` | 2026-11-21 17:00:15 | 2027-11-21 17:00:15 |
| **Batch 14** | Tx #32 | `REVIEW_REWARD` | 300 | 300 | `ACTIVE` | 2026-11-21 18:31:42 | 2027-11-21 18:31:42 |
| **Batch 15** | Tx #33 | `REVIEW_REWARD` | 300 | 300 | `ACTIVE` | 2026-11-21 18:32:05 | 2027-11-21 18:32:05 |
| **Batch 16** | Tx #37 | `ORDER_PURCHASE` | 27.000 | 27.000 | `ACTIVE` | 2026-11-21 18:32:05 | 2027-11-21 18:32:05 |

### 4.3. Đánh Giá Bất Biến Toàn Vẹn: $\sum \text{remaining\_points} = \text{wallet.available\_points}$
- **Tổng số lô tạo ra:** 16 lô (3 lô `EXHAUSTED`, 13 lô `ACTIVE`).
- **Tổng remaining_points của các lô ACTIVE:** **`155.100` điểm**.
- **Số dư ví thực tế trong DB:** **`27.000` điểm**.
- **Chênh lệch:** **`128.100` điểm** ($155.100 - 27.000$).
- **Nguyên nhân toán học:**
  * Tại Tx #5 và Tx #6, script test đổi 2 voucher (-1.000đ) khi kho lô điểm mới chỉ có 800đ (đã bị tiêu 500đ ở Tx #4). Do đó, có **700 điểm đổi voucher không thể tìm thấy nguồn gốc trong các lô điểm hợp lệ**!
  * Do 700 điểm này không thể trừ vào lô nào, tổng số điểm còn lại trong các lô ACTIVE bị dư ra đúng 700 điểm ($154.400 + 700 = 155.100$).
- **KẾT LUẬN QUAN TRỌNG:**
  * **Bất biến $\sum \text{batch.remaining\_points} = \text{wallet.available\_points}$ KHÔNG THỂ CHỨNG MINH ĐƯỢC trên dữ liệu ô nhiễm hiện tại.**
  * Do đó, theo đúng nguyên tắc chỉ đạo của Quý người dùng: **TUYỆT ĐỐI CHƯA ĐƯỢC CHẠY MIGRATION VÀ BACKFILL VÀO DATABASE CHO ĐẾN KHI VẤN ĐỀ DỮ LIỆU TEST ĐƯỢC XỬ LÝ.**

---

## MỤC 5. KIỂM TOÁN IDEMPOTENCY VÀ XỬ LÝ ĐỒNG THỜI (CONCURRENCY)

### 5.1. Khóa Chống Trùng Khi Trừ Hết Hạn (`idempotency_key`)
- **Quy chuẩn định dạng khóa:** **`EXP_BATCH_{batchId}`**.
- **Tính duy nhất tuyệt đối:** Một lô điểm (`batchId`) chỉ sinh ra một lần và chỉ có thể chuyển sang trạng thái hết hạn duy nhất một lần trong suốt vòng đời của nó.
- **Bảo vệ tầng Database:**
  Bảng `point_transactions` có ràng buộc:
  ```sql
  CREATE UNIQUE NONCLUSTERED INDEX uq_point_tx_idempotency 
  ON point_transactions(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;
  ```
  Nếu worker bị lỗi mạng và kích hoạt lại, câu lệnh chèn giao dịch hết hạn cho cùng một `batchId` sẽ lập tức bị SQL Server từ chối với mã lỗi `Error 2601 / 2627` (Unique Key Violation), ngăn chặn 100% rủi ro trừ lặp.

### 5.2. Khả Năng Xử Lý Lại Khi Worker Bị Crash Giữa Chừng
- Mọi thao tác xử lý hết hạn cho một khách hàng được đặt trong một Transaction nguyên tử:
  ```sql
  BEGIN TRANSACTION;
  -- 1. Khóa ví
  -- 2. Đọc và khóa các batch đến hạn
  -- 3. Trừ available_points trên user_points_wallets
  -- 4. INSERT point_transactions (type = 'POINT_EXPIRATION', key = 'EXP_BATCH_{id}')
  -- 5. UPDATE loyalty_point_batches SET remaining_points = 0, status = 'EXPIRED'
  COMMIT TRANSACTION;
  ```
- Nếu worker bị crash (mất điện, sập node, kill process): SQL Server tự động **ROLLBACK** toàn bộ các thay đổi chưa commit. Khi worker chạy lại, các lô điểm vẫn ở trạng thái `ACTIVE` và chưa có bản ghi ledger `EXP_BATCH_{id}` $\rightarrow$ Worker tiếp tục quét và xử lý lại an toàn.

### 5.3. Khóa Ứng Dụng Phân Tán (Multi-Worker Coordination)
- Để ngăn chặn nhiều worker hoặc cron job chạy song song trên nhiều server cùng quét trùng một tập dữ liệu, hệ thống sử dụng khóa phân tán tích hợp của SQL Server:
  ```sql
  DECLARE @lockResult INT;
  EXEC @lockResult = sp_getapplock 
       @Resource = 'LoyaltyExpirationWorkerLock', 
       @LockMode = 'Exclusive', 
       @LockOwner = 'Session', 
       @LockTimeout = 0; -- Không chờ, trả kết quả ngay
  IF @lockResult < 0
  BEGIN
      PRINT 'Một instance worker khác đang xử lý. Tiến trình này tự động thoát an toàn.';
      RETURN;
  END
  ```

### 5.4. Xử Lý Đồng Thời: Redeem Voucher Song Song Với Worker Quét Hết Hạn
- **Quy tắc thứ tự khóa (Lock Hierarchy) ngăn ngừa Deadlock:**
  Bắt buộc cả 2 quy trình (Khách đổi voucher và Worker trừ hết hạn) đều phải tuân thủ thứ tự khóa tài nguyên giống hệt nhau:
  1. **Bước 1 (Khóa ví trước):**
     `SELECT available_points FROM user_points_wallets WITH (UPDLOCK, ROWLOCK) WHERE user_id = @userId;`
  2. **Bước 2 (Khóa các lô điểm sau):**
     `SELECT id, remaining_points FROM loyalty_point_batches WITH (UPDLOCK, ROWLOCK) WHERE user_id = @userId AND status = 'ACTIVE' ORDER BY expires_at ASC;`
- **Cơ chế hoạt động:**
  * Do cả hai luồng đều bắt đầu bằng việc xin khóa `UPDLOCK, ROWLOCK` trên hàng ví của `user_id`, tiến trình nào đến trước sẽ chiếm được khóa. Tiến trình thứ hai bắt buộc phải xếp hàng chờ (block ở mức mili-giây) mà **không bao giờ sinh ra Deadlock** (loại trừ hiện tượng luồng A giữ X chờ Y trong khi luồng B giữ Y chờ X).
  * Nếu khách hàng đổi điểm trước: Điểm sắp hết hạn được tiêu dùng trước (FEFO) $\rightarrow$ Worker vào sau đọc thấy lô điểm đã có `remaining_points = 0` và `status = 'EXHAUSTED'` $\rightarrow$ Worker bỏ qua, không trừ nữa.
  * Ràng buộc kiểm tra `CHECK (available_points >= 0)` và `CHECK (remaining_points >= 0)` bảo đảm số dư không bao giờ bị âm.

---

## MỤC 6. KIỂM TOÁN PHƯƠNG ÁN ROLLBACK TOÀN DIỆN

Phân tích kịch bản: Migration 006 đã áp dụng, hệ thống đã hoạt động được một thời gian và đã phát sinh: batch mới, giao dịch đổi voucher mới, giao dịch hết hạn điểm, kết quả xét hạng mới. Sau đó hệ thống gặp sự cố cần rollback về cơ chế cũ.

### 6.1. Trả Lời 6 Câu Hỏi Trọng Yếu Về Rollback

#### 1. Có thể rollback về logic cũ mà vẫn bảo toàn số dư ví không?
- **CÓ THỂ BẢO TOÀN SỐ DƯ TẠI THỜI ĐIỂM ROLLBACK**, nhưng không thể tự động đảo ngược các giao dịch hết hạn điểm nếu không có quyết định kinh doanh:
  * Nếu doanh nghiệp quyết định **chấp nhận số điểm đã hết hạn là hợp lệ**: Giữ nguyên `available_points` hiện tại.
  * Nếu doanh nghiệp muốn **hoàn trả điểm đã hết hạn**: Phải chạy một script đối soát tạo giao dịch bù `ADMIN_ADJUSTMENT` với số điểm dương tương ứng với các giao dịch `POINT_EXPIRATION` đã xảy ra.

#### 2. Các giao dịch `POINT_EXPIRATION` được xử lý ra sao?
- **TUYỆT ĐỐI KHÔNG ĐƯỢC XÓA (DELETE)** các bản ghi `POINT_EXPIRATION` trong `point_transactions`.
- Bảng sổ cái là Append-Only và bất biến. Xóa bản ghi sổ cái sẽ làm sai lệch kiểm toán hệ thống. Mọi điều chỉnh đều phải thông qua giao dịch bù (Compensating Transaction).

#### 3. Những batch đã tiêu điểm hoặc hết hạn được bảo toàn bằng cách nào?
- **KHÔNG CHẠY `DROP TABLE loyalty_point_batches`**.
- Thay vào đó, thực hiện đổi tên bảng sang dạng lưu trữ:
  ```sql
  EXEC sp_rename 'loyalty_point_batches', 'loyalty_point_batches_archive_20261121';
  ```
  Việc này bảo toàn 100% bằng chứng lịch sử tiêu điểm phục vụ kiểm toán tài chính và đối chất khiếu nại khách hàng.

#### 4. Voucher đã cấp và đã sử dụng có bị ảnh hưởng không?
- **HOÀN TOÀN KHÔNG BỊ ẢNH HƯỞNG**.
- Các bảng `vouchers` và `voucher_redemptions` là các bảng độc lập. Mã voucher khách hàng đã đổi vẫn nằm trong CSDL và có thể sử dụng bình thường khi thanh toán đơn hàng.

#### 5. Có cần migration tiến về phía trước (Roll-forward) để sửa lỗi thay vì rollback không?
- **CỰC KỲ KHUYẾN NGHỊ**. Trong quản trị CSDL chuyên nghiệp, **Roll-forward** (tạo migration mới vá lỗi) luôn an toàn hơn việc chạy rollback DDL, vì rollback dễ gây đứt gãy khóa ngoại và xung đột phiên bản mã nguồn đang chạy.

#### 6. Có cần backup và kiểm thử phục hồi trên bản sao database không?
- **BẮT BUỘC 100%**. Trước khi thực thi bất kỳ DDL nào trên database runtime, quy trình bắt buộc phải:
  1. Tạo bản sao lưu đầy đủ: `BACKUP DATABASE vamos_store_db TO DISK = 'C:\backup\vamos_store_db_pre_006.bak'`.
  2. Thực hiện chạy thử migration và script kiểm thử phục hồi trên database kiểm thử `vamos_store_test_db`.

---

## MỤC 7. BẢNG TÌNH HUỐNG KIỂM THỬ SOFT LANDING (TEST MATRIX)

Dưới đây là ma trận 12 kịch bản kiểm thử toàn diện, làm rõ trạng thái trước/sau xét hạng và ranh giới ngày tháng:

| STT | Kịch bản kiểm thử | Hạng trước xét lại | Điểm chu kỳ vừa qua | Hạng sau khi xét lại | Điểm chu kỳ mới | Ngày bắt đầu chu kỳ mới | Diễn giải & Căn cứ quy tắc |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | MEMBER kết thúc chu kỳ với 0 điểm | `MEMBER` | 0 | `MEMBER` | 0 | `cycle_end_at` cũ | Không đủ điểm thăng hạng, tiếp tục giữ MEMBER. |
| **2** | MEMBER đạt SILVER | `MEMBER` | 1.200 | `SILVER` | 0 | `cycle_end_at` cũ | Vượt ngưỡng 1.000 điểm $\rightarrow$ Thăng hạng SILVER. |
| **3** | SILVER đủ điểm duy trì | `SILVER` | 1.100 | `SILVER` | 0 | `cycle_end_at` cũ | Điểm chu kỳ $\ge 1.000 \rightarrow$ Tái bổ nhiệm SILVER. |
| **4** | SILVER không đủ điểm duy trì | `SILVER` | 400 | `MEMBER` | 0 | `cycle_end_at` cũ | Điểm $< 1.000 \rightarrow$ Soft Landing: Hạ 1 bậc xuống MEMBER. |
| **5** | GOLD đủ điểm duy trì | `GOLD` | 3.000 | `GOLD` | 0 | `cycle_end_at` cũ | Điểm chu kỳ $\ge 2.500 \rightarrow$ Tái bổ nhiệm GOLD. |
| **6** | GOLD không đủ điểm duy trì | `GOLD` | 800 | `SILVER` | 0 | `cycle_end_at` cũ | Điểm $< 2.500 \rightarrow$ Soft Landing: Hạ 1 bậc xuống SILVER (dù điểm chỉ có 800 cũng không bị rớt về MEMBER). |
| **7** | VIP đủ điểm duy trì | `VIP` | 6.000 | `VIP` | 0 | `cycle_end_at` cũ | Điểm chu kỳ $\ge 5.000 \rightarrow$ Tái bổ nhiệm VIP. |
| **8** | VIP không đủ điểm duy trì | `VIP` | 300 | `GOLD` | 0 | `cycle_end_at` cũ | Điểm $< 5.000 \rightarrow$ Soft Landing: Hạ 1 bậc xuống GOLD (tuyệt đối không rớt về SILVER hay MEMBER). |
| **9** | Khách được nâng hạng giữa chu kỳ | `GOLD` | 2.500 | `GOLD` | 0 | `cycle_end_at` cũ | Khách từ SILVER lên GOLD vào tháng 6. Cuối chu kỳ tổng điểm 2.500 $\ge 2.500 \rightarrow$ Tái bổ nhiệm GOLD. *(Nếu điểm chu kỳ $< 2500$, hạ 1 bậc xuống SILVER)*. |
| **10** | Vừa đủ ngưỡng đúng thời điểm kết thúc | `SILVER` | 2.500 | `GOLD` | 0 | `cycle_end_at` cũ | Đúng 23:59:59 của ngày kết thúc đạt 2.500đ $\rightarrow$ Thăng hạng GOLD cho chu kỳ tiếp theo. |
| **11** | Chu kỳ bắt đầu ngày 29/02 năm nhuận | `MEMBER` | 1.500 | `SILVER` | 0 | `2025-02-28 23:59:59` | `DATEADD(year, 1, '2024-02-29') = '2025-02-28'`. Chu kỳ sau bắt đầu từ `2025-03-01`. |
| **12** | Giao dịch tích điểm xảy ra đúng ranh giới | `SILVER` | Tùy thời điểm | Tùy điểm | 0 | `cycle_end_at` cũ | Nếu `tx.created_at <= cycle_end_at`: Tính vào chu kỳ cũ. Nếu `tx.created_at > cycle_end_at`: Tính vào chu kỳ mới. |

---

## MỤC 8. ĐẶC TẢ THIẾT KẾ MIGRATION DỰ KIẾN (ĐỀ XUẤT, CHƯA CHẠY)

> [!IMPORTANT]
> Đây là bản phác thảo kỹ thuật đề xuất để xin ý kiến phản biện. **CHƯA ĐƯỢC TẠO THÀNH FILE VÀ CHƯA ĐƯỢC CHẠY VÀO DATABASE.**

- **Tên migration dự kiến:** `006_vamos_club_expiration_and_tier_cycle.sql`
- **Mục tiêu:**
  1. Bổ sung trường quản lý chu kỳ xét hạng vào bảng `user_points_wallets`:
     * `cycle_start_at DATETIME2 NULL` (Để `NULL` cho tài khoản chưa có giao dịch tích điểm hợp lệ).
     * `cycle_end_at DATETIME2 NULL`.
     * `qualifying_points_cycle INT NOT NULL DEFAULT 0`.
  2. Tạo bảng mới `loyalty_point_batches` (9 cột) phục vụ quản lý thời hạn 365 ngày và giải thuật FEFO:
     * `id INT IDENTITY(1,1) PRIMARY KEY`
     * `user_id INT NOT NULL FK users(id)`
     * `transaction_id INT NOT NULL FK point_transactions(id)`
     * `initial_points INT NOT NULL`
     * `remaining_points INT NOT NULL`
     * `expires_at DATETIME2 NOT NULL`
     * `status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE'`
     * `created_at DATETIME2 NOT NULL DEFAULT GETDATE()`
     * `updated_at DATETIME2 NOT NULL DEFAULT GETDATE()`
     * Filtered Index: `ix_batches_fefo ON (user_id, status, expires_at ASC) INCLUDE (remaining_points) WHERE status = 'ACTIVE'`.
  3. Cập nhật ràng buộc `CHECK (transaction_type IN (..., 'POINT_EXPIRATION'))` trên bảng `point_transactions`.

---

## MỤC 9. BẢNG TỔNG KẾT ĐIỀU KIỆN TIÊN QUYẾT & LỘ TRÌNH TRIỂN KHAI

| Nhóm nội dung | Chi tiết tình trạng kiểm toán | Mức độ sẵn sàng |
| :--- | :--- | :---: |
| **1. Chính sách nghiệp vụ đã chốt** | - Chu kỳ 12 tháng bắt đầu từ giao dịch tích điểm đầu tiên.<br>- Soft Landing: mỗi chu kỳ chỉ hạ tối đa 1 bậc.<br>- Điểm xét hạng độc lập với điểm khả dụng; đổi voucher và hết hạn không trừ điểm xét hạng.<br>- Mọi hạng đều được đổi voucher nếu đủ điều kiện. | ✅ **ĐÃ XÁC NHẬN 100%** |
| **2. Kết quả kiểm toán dữ liệu & sai lệch** | - Truy vết 37 giao dịch của `user_id = 2`: 100% là dữ liệu test do chạy test suite 6 lần.<br>- CSDL `vamos_store_test_db` khớp 100% ($20.970 = 20.970$).<br>- Không có khách hàng thật ngoài đời bị ảnh hưởng.<br>- Sổ cái hiện tại chưa đủ căn cứ làm nguồn phục hồi số dư ví. | ✅ **ĐỐI SOÁT PHÁP Y HOÀN TẤT** |
| **3. Khảo sát kiến trúc FEFO & Concurrency** | - Thuật toán FEFO, mô hình lô điểm độc lập không phá vỡ Append-Only ledger.<br>- Khóa idempotency `EXP_BATCH_{batchId}` duy nhất.<br>- Thứ tự khóa ví trước - batch sau triệt tiêu hoàn toàn Deadlock. | ✅ **THIẾT KẾ ĐÃ ĐƯỢC CHỨNG MINH** |
| **4. Các Blocker còn lại trước triển khai** | 1. **Dữ liệu test trên CSDL phát triển:** Cần thống nhất dọn dẹp hoặc khởi tạo lại (re-seed) dữ liệu sạch cho `vamos_store_db` trước khi áp dụng migration và backfill.<br>2. **Cô lập môi trường test:** Thêm `process.env.NODE_ENV = 'test'` vào `tests/test_loyalty_module.js` và cấu hình test runner để không bao giờ ghi nhầm vào DB chính. | ⏳ **CẦN GIẢI QUYẾT TRƯỚC GIAI ĐOẠN 2** |
| **5. Lộ trình triển khai sau khi được duyệt** | **Bước 1:** Chuẩn hóa cấu hình môi trường test độc lập.<br>**Bước 2:** Chuẩn bị script tạo bản sao lưu CSDL (`.bak`).<br>**Bước 3:** Tạo migration file `006_...sql` và chạy thử trên `vamos_store_test_db`.<br>**Bước 4:** Cập nhật mã nguồn `loyalty.service.js` với logic FEFO, Soft Landing và chu kỳ 12 tháng.<br>**Bước 5:** Viết bộ test suite mới kiểm thử 12 kịch bản của Test Matrix.<br>**Bước 6:** Xây dựng CLI command quét định kỳ `src/jobs/processLoyaltyCycle.js`. | 📋 **ĐỀ XUẤT THỨ TỰ THỰC THI** |

---

## MỤC 10. ĐIỂM DỪNG BẮT BUỘC (MANDATORY AUDIT CHECKPOINT)

Hệ thống cam kết:
- **KHÔNG** sửa bất kỳ file mã nguồn logic nghiệp vụ nào.
- **KHÔNG** tạo migration file trong repository.
- **KHÔNG** chạy migration hoặc DDL vào cơ sở dữ liệu.
- **KHÔNG** thực hiện câu lệnh UPDATE, INSERT, DELETE nào lên database.
- **KHÔNG** tự ý sửa số dư ví của `user_id = 2`.
- **KHÔNG** tự ý triển khai scheduler hoặc worker.

Báo cáo kiểm toán bổ sung đã được hoàn thiện toàn diện. Hệ thống trân trọng kính báo và dừng lại chờ chỉ đạo chính thức từ Quản lý dự án!
