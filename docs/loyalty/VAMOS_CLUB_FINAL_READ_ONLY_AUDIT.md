# BÁO CÁO KIỂM TOÁN CHỈ ĐỌC TOÀN DIỆN — VAMOS CLUB (GIAI ĐOẠN 2)
## (FINAL READ-ONLY COMPREHENSIVE AUDIT REPORT — VAMOS CLUB STAGE 2)

> **Dự án:** VAMOS STORE — Website Thương Mại Điện Tử Bán Giày Chuyên Nghiệp  
> **Module kiểm toán:** VAMOS CLUB Loyalty System  
> **Tài liệu kiểm toán:** `docs/loyalty/VAMOS_CLUB_FINAL_READ_ONLY_AUDIT.md`  
> **Thời điểm lập báo cáo:** 21/11/2026  
> **Chế độ kiểm toán:** **STRICT READ-ONLY AUDIT (Chỉ đọc, không can thiệp CSDL, không sửa mã nguồn)**  
> **Trạng thái Git:** Branch `fix/master-repair-plan` | HEAD `eb822aba57d75a2ecad390123c188afb73db3cb8`  
> **Cam kết:** **KHÔNG CÓ DDL/DML, KHÔNG SỬA CODE, KHÔNG CHẠY TEST GHI DB, KHÔNG TỰ Ý CHUYỂN SANG STAGE 2.**

---

## MỤC LỤC
1. [MỤC 1. GIT PREFLIGHT & PHẠM VI DATABASE THỰC TẾ](#mục-1-git-preflight--phạm-vi-database-thực-tế)
2. [MỤC 2. HẠNG MỤC A — XÁC MINH TOÀN BỘ 37 GIAO DỊCH, SAI LỆCH 700 ĐIỂM & 155.100 ĐIỂM](#mục-2-hạng-mục-a--xác-minh-toàn-bộ-37-giao-dịch-sai-lệch-700-điểm--155100-điểm)
3. [MỤC 3. HẠNG MỤC B — XÁC ĐỊNH CHÍNH XÁC QUY TẮC CHU KỲ 12 THÁNG & NĂM NHUẬN](#mục-3-hạng-mục-b--xác-định-chính-xác-quy-tắc-chu-kỳ-12-tháng--năm-nhuận)
4. [MỤC 4. HẠNG MỤC C — KIỂM TOÁN SOFT LANDING & TÌNH HUỐNG NÂNG HẠNG GIỮA CHU KỲ](#mục-4-hạng-mục-c--kiểm-toán-soft-landing--tình-huống-nâng-hạng-giữa-chu-kỳ)
5. [MỤC 5. HẠNG MỤC D — CONCURRENCY, DEADLOCK VÀ IDEMPOTENCY](#mục-5-hạng-mục-d--concurrency-deadlock-và-idempotency)
6. [MỤC 6. HẠNG MỤC E — ĐÁNH GIÁ DỮ LIỆU TEST Ô NHIỄM & PHƯƠNG ÁN KHÔI PHỤC AN TOÀN](#mục-6-hạng-mục-e--đánh-giá-dữ-liệu-test-ô-nhiễm--phương-án-khôi-phục-an-toàn)
7. [MỤC 7. HẠNG MỤC F — BẢNG ĐÁNH GIÁ KHẢ NĂNG TRIỂN KHAI STAGE 2 (PASS/FAIL/BLOCKED)](#mục-7-hạng-mục-f--bảng-đánh-giá-khả-năng-triển-khai-stage-2-passfailblocked)
8. [MỤC 8. DANH SÁCH QUYẾT ĐỊNH NGHIỆP VỤ CẦN NGƯỜI DÙNG PHÊ DUYỆT](#mục-8-danh-sách-quyết-định-nghiệp-vụ-cần-người-dùng-phê-duyệt)
9. [MỤC 9. KẾT LUẬN CUỐI CÙNG](#mục-9-kết-luận-cuối-cùng)

---

## MỤC 1. GIT PREFLIGHT & PHẠM VI DATABASE THỰC TẾ

### 1.1. Git Preflight
- **Branch hiện tại:** `fix/master-repair-plan` (Tracking: `origin/fix/master-repair-plan`).
- **Commit HEAD:** `eb822aba57d75a2ecad390123c188afb73db3cb8` (`chore: clean repository and retain VAMOS project files`).
- **Trạng thái Working Tree:** Toàn bộ các thay đổi chưa commit từ các phiên trước của người dùng (tài liệu, diagram, report) được giữ nguyên vẹn 100%. Không thực hiện `git add`, `git commit`, `git checkout`, `git reset`, `git clean` hay `git stash`.

### 1.2. Phạm Vi Database Thực Tế Đã Kiểm Tra
Kiểm tra cấu hình tại [src/config/app.config.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/config/app.config.js#L31):
- **Hệ quản trị CSDL:** Microsoft SQL Server 2022 Developer Edition trên localhost (`127.0.0.1:1433`).
- **Database phát triển (`vamos_store_db`):** 27 bảng vật lý. Đã truy vấn đối soát dữ liệu thực tế bằng các lệnh `SELECT` chỉ đọc.
- **Database kiểm thử (`vamos_store_test_db`):** 27 bảng vật lý. Số dư ví khớp hoàn hảo với ledger ($20.970 = 20.970$).
- **Database Production từ xa:** **HOÀN TOÀN KHÔNG CÓ KẾT NỐI**. Dự án đang chạy hoàn toàn trong môi trường phát triển nội bộ. Không có bất kỳ database production nào bị ảnh hưởng.
- **Cam kết an toàn:** Không hiển thị mật khẩu, token hay thông tin nhạy cảm trong báo cáo này.

---

## MỤC 2. HẠNG MỤC A — XÁC MINH TOÀN BỘ 37 GIAO DỊCH, SAI LỆCH 700 ĐIỂM & 155.100 ĐIỂM

### 2.1. Xác Minh Lại Số Liệu Thực Tế Trên `vamos_store_db` (SELECT Queries)
Truy vấn trực tiếp từ CSDL:
```sql
SELECT available_points, lifetime_earned_points, lifetime_redeemed_points, tier_code 
FROM user_points_wallets WHERE user_id = 2;
```
- `available_points`: **`27.000`** điểm.
- `lifetime_earned_points`: **`164.900`** điểm.
- `lifetime_redeemed_points`: **`10.500`** điểm.
- `tier_code`: **`VIP`**.

Truy vấn tổng hợp sổ cái `point_transactions`:
```sql
SELECT 
  COUNT(*) AS total_tx,
  SUM(CASE WHEN amount > 0 THEN 1 ELSE 0 END) AS earn_tx_count,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS total_earned,
  SUM(CASE WHEN amount < 0 THEN 1 ELSE 0 END) AS redeem_tx_count,
  SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) AS total_redeemed,
  SUM(amount) AS net_ledger
FROM point_transactions WHERE user_id = 2;
```
- `total_tx`: **`37`** giao dịch.
- `earn_tx_count`: **`16`** (10 giao dịch `REVIEW_REWARD` = 2.900đ và 6 giao dịch `ORDER_PURCHASE` = 162.000đ).
- `total_earned`: **`+164.900`** điểm.
- `redeem_tx_count`: **`21`** giao dịch `VOUCHER_REDEMPTION` ($\times -500$ điểm).
- `total_redeemed`: **`-10.500`** điểm.
- `net_ledger`: **`+154.400`** điểm.
- **Chênh lệch ví so với sổ cái:** $154.400 - 27.000 = \mathbf{127.400}$ điểm.

---

### 2.2. A1: Bảng Đối Chiếu Chi Tiết Toàn Bộ 37 Giao Dịch & Bằng Chứng Test Fixture
Truy vấn trực tiếp kết hợp đối soát với bảng `orders`, `reviews`, `vouchers`, `voucher_redemptions`:

| Tx # | Thời điểm tạo | Loại giao dịch | Điểm | Số dư ghi nhận | Tham chiếu (`ref`) | Khóa Idempotency | Mã đơn / Voucher liên kết | Bằng chứng mã kiểm thử (`test_loyalty_module.js`) |
| :---: | :---: | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| **1** | 2026-11-21 15:37:33 | `REVIEW_REWARD` | +200 | 200 | REVIEW #1 | `REVIEW_29_1` | Đơn #29: `ORD-TEST-LOYALTY-1795250253` | Section 3: Test đánh giá sản phẩm đơn test |
| **2** | 2026-11-21 15:38:45 | `REVIEW_REWARD` | +300 | 500 | REVIEW #2 | `REVIEW_31_1` | Đơn #31: `ORD-TEST-LOYALTY-1795250325` | Section 3: Test đánh giá tối đa 300 điểm |
| **3** | 2026-11-21 15:39:07 | `REVIEW_REWARD` | +300 | 800 | REVIEW #3 | `REVIEW_33_1` | Đơn #33: `ORD-TEST-LOYALTY-1795250347` | Section 3: Đánh giá đơn test #33 |
| **4** | 2026-11-21 15:39:07 | `VOUCHER_REDEMPTION` | -500 | 200 | REDEMPTION #5 | `REDEMPTION_..._29883EDB` | Voucher: `VAMOSCLUB-29883EDB` | Section 5: RED-03 (Dòng 397: set ví 700đ $\rightarrow$ trừ 500đ) |
| **5** | 2026-11-21 15:39:07 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #6 | `REDEMPTION_..._1976BB4A` | Voucher: `VAMOSCLUB-1976BB4A` | Section 5: RED-04 (Dòng 428: set ví 500đ $\rightarrow$ trừ 500đ) |
| **6** | 2026-11-21 15:39:07 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #7 | `REDEMPTION_..._61FF3D24` | Voucher: `VAMOSCLUB-61FF3D24` | Section 6: CHK-01 (Dòng 459: set ví 500đ $\rightarrow$ trừ 500đ) |
| **7** | 2026-11-21 15:39:07 | `ORDER_PURCHASE` | +27.000 | 27.000 | ORDER #33 | `ORDER_PURCHASE_33` | Đơn #33: `ORD-TEST-LOYALTY-1795250347` | Section 7: Tích 3% đơn hàng hoàn tất 900k |
| **8** | 2026-11-21 15:39:38 | `REVIEW_REWARD` | +300 | 27.300 | REVIEW #4 | `REVIEW_35_1` | Đơn #35: `ORD-TEST-LOYALTY-1795250378` | Section 3: Review đơn #35 |
| **9** | 2026-11-21 15:39:38 | `VOUCHER_REDEMPTION` | -500 | 200 | REDEMPTION #8 | `REDEMPTION_..._DA9DBC87` | Voucher: `VAMOSCLUB-DA9DBC87` | Section 5: RED-03 (Dòng 397: set ví 700đ $\rightarrow$ trừ 500đ) |
| **10** | 2026-11-21 15:39:38 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #9 | `REDEMPTION_..._D7E102CA` | Voucher: `VAMOSCLUB-D7E102CA` | Section 5: RED-04 (Dòng 428: set ví 500đ $\rightarrow$ trừ 500đ) |
| **11** | 2026-11-21 15:39:38 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #10 | `REDEMPTION_..._D1DAA047` | Voucher: `VAMOSCLUB-D1DAA047` | Section 6: CHK-01 (Dòng 459: set ví 500đ $\rightarrow$ trừ 500đ) |
| **12** | 2026-11-21 15:40:51 | `REVIEW_REWARD` | +300 | 300 | REVIEW #5 | `REVIEW_38_1` | Đơn #38: `ORD-TEST-LOYALTY-1795250451` | Section 3: Review đơn #38 |
| **13** | 2026-11-21 15:40:51 | `VOUCHER_REDEMPTION` | -500 | 200 | REDEMPTION #11 | `REDEMPTION_..._4707307E` | Voucher: `VAMOSCLUB-4707307E` | Section 5: RED-03 (Dòng 397: set ví 700đ $\rightarrow$ trừ 500đ) |
| **14** | 2026-11-21 15:40:52 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #12 | `REDEMPTION_..._2B68C8E3` | Voucher: `VAMOSCLUB-2B68C8E3` | Section 5: RED-04 (Dòng 428: set ví 500đ $\rightarrow$ trừ 500đ) |
| **15** | 2026-11-21 15:40:52 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #13 | `REDEMPTION_..._EA1685E8` | Voucher: `VAMOSCLUB-EA1685E8` | Section 6: CHK-01 (Dòng 459: set ví 500đ $\rightarrow$ trừ 500đ) |
| **16** | 2026-11-21 15:40:52 | `ORDER_PURCHASE` | +27.000 | 27.000 | ORDER #38 | `ORDER_PURCHASE_38` | Đơn #38: `ORD-TEST-LOYALTY-1795250451` | Section 7: Tích 3% đơn hàng hoàn tất 900k |
| **17** | 2026-11-21 15:41:51 | `REVIEW_REWARD` | +300 | 27.300 | REVIEW #6 | `REVIEW_41_1` | Đơn #41: `ORD-TEST-LOYALTY-1795250511` | Section 3: Review đơn #41 |
| **18** | 2026-11-21 15:41:51 | `VOUCHER_REDEMPTION` | -500 | 200 | REDEMPTION #14 | `REDEMPTION_..._A5487E26` | Voucher: `VAMOSCLUB-A5487E26` | Section 5: RED-03 (Dòng 397: set ví 700đ $\rightarrow$ trừ 500đ) |
| **19** | 2026-11-21 15:41:51 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #15 | `REDEMPTION_..._5312A8B4` | Voucher: `VAMOSCLUB-5312A8B4` | Section 5: RED-04 (Dòng 428: set ví 500đ $\rightarrow$ trừ 500đ) |
| **20** | 2026-11-21 15:41:51 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #16 | `REDEMPTION_..._8277D657` | Voucher: `VAMOSCLUB-8277D657` | Section 6: CHK-01 (Dòng 459: set ví 500đ $\rightarrow$ trừ 500đ) |
| **21** | 2026-11-21 15:41:51 | `ORDER_PURCHASE` | +27.000 | 27.000 | ORDER #41 | `ORDER_PURCHASE_41` | Đơn #41: `ORD-TEST-LOYALTY-1795250511` | Section 7: Tích 3% đơn hàng hoàn tất 900k |
| **22** | 2026-11-21 15:44:54 | `REVIEW_REWARD` | +300 | 27.300 | REVIEW #7 | `REVIEW_44_1` | Đơn #44: `ORD-TEST-LOYALTY-1795250694` | Section 3: Review đơn #44 |
| **23** | 2026-11-21 15:44:54 | `VOUCHER_REDEMPTION` | -500 | 200 | REDEMPTION #17 | `REDEMPTION_..._AA725110` | Voucher: `VAMOSCLUB-AA725110` | Section 5: RED-03 (Dòng 397: set ví 700đ $\rightarrow$ trừ 500đ) |
| **24** | 2026-11-21 15:44:54 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #18 | `REDEMPTION_..._7B740397` | Voucher: `VAMOSCLUB-7B740397` | Section 5: RED-04 (Dòng 428: set ví 500đ $\rightarrow$ trừ 500đ) |
| **25** | 2026-11-21 15:44:54 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #19 | `REDEMPTION_..._33B61F63` | Voucher: `VAMOSCLUB-33B61F63` | Section 6: CHK-01 (Dòng 459: set ví 500đ $\rightarrow$ trừ 500đ) |
| **26** | 2026-11-21 15:44:55 | `ORDER_PURCHASE` | +27.000 | 27.000 | ORDER #44 | `ORDER_PURCHASE_44` | Đơn #44: `ORD-TEST-LOYALTY-1795250694` | Section 7: Tích 3% đơn hàng hoàn tất 900k |
| **27** | 2026-11-21 17:00:15 | `REVIEW_REWARD` | +300 | 27.300 | REVIEW #8 | `REVIEW_47_1` | Đơn #47: `ORD-TEST-LOYALTY-1795255215` | Section 3: Review đơn #47 |
| **28** | 2026-11-21 17:00:15 | `VOUCHER_REDEMPTION` | -500 | 200 | REDEMPTION #20 | `REDEMPTION_..._939A4674` | Voucher: `VAMOSCLUB-939A4674` | Section 5: RED-03 (Dòng 397: set ví 700đ $\rightarrow$ trừ 500đ) |
| **29** | 2026-11-21 17:00:15 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #21 | `REDEMPTION_..._BA49EEE1` | Voucher: `VAMOSCLUB-BA49EEE1` | Section 5: RED-04 (Dòng 428: set ví 500đ $\rightarrow$ trừ 500đ) |
| **30** | 2026-11-21 17:00:15 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #22 | `REDEMPTION_..._B6992174` | Voucher: `VAMOSCLUB-B6992174` | Section 6: CHK-01 (Dòng 459: set ví 500đ $\rightarrow$ trừ 500đ) |
| **31** | 2026-11-21 17:00:15 | `ORDER_PURCHASE` | +27.000 | 27.000 | ORDER #47 | `ORDER_PURCHASE_47` | Đơn #47: `ORD-TEST-LOYALTY-1795255215` | Section 7: Tích 3% đơn hàng hoàn tất 900k |
| **32** | 2026-11-21 18:31:42 | `REVIEW_REWARD` | +300 | 27.300 | REVIEW #9 | `REVIEW_50_1` | Đơn #50: `ORD-TEST-LOYALTY-1795260702` | Section 3: Review đơn #50 |
| **33** | 2026-11-21 18:32:05 | `REVIEW_REWARD` | +300 | 1.000 | REVIEW #10 | `REVIEW_52_1` | Đơn #52: `ORD-TEST-LOYALTY-1795260725` | Section 3: Review đơn #52 |
| **34** | 2026-11-21 18:32:05 | `VOUCHER_REDEMPTION` | -500 | 200 | REDEMPTION #24 | `REDEMPTION_..._E4B2ECD7...` | Voucher: `VAMOSCLUB-E4B2...` | Section 5: RED-03 (Dòng 397: set ví 700đ $\rightarrow$ trừ 500đ) |
| **35** | 2026-11-21 18:32:05 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #25 | `REDEMPTION_..._50C95F10...` | Voucher: `VAMOSCLUB-50C9...` | Section 5: RED-04 (Dòng 428: set ví 500đ $\rightarrow$ trừ 500đ) |
| **36** | 2026-11-21 18:32:05 | `VOUCHER_REDEMPTION` | -500 | 0 | REDEMPTION #26 | `REDEMPTION_..._D302849E...` | Voucher: `VAMOSCLUB-D302...` | Section 6: CHK-01 (Dòng 459: set ví 500đ $\rightarrow$ trừ 500đ) |
| **37** | 2026-11-21 18:32:05 | `ORDER_PURCHASE` | +27.000 | 27.000 | ORDER #52 | `ORDER_PURCHASE_52` | Đơn #52: `ORD-TEST-LOYALTY-1795260725` | Section 7: Tích 3% đơn hàng hoàn tất 900k |

> [!IMPORTANT]
> **BẰNG CHỨNG XÁC NHẬN 100%:**
> Toàn bộ 10 đơn hàng được liên kết trong cột `reference_id` của các bài review đều có tiền tố `ORD-TEST-LOYALTY-` sinh ra từ file `tests/test_loyalty_module.js`. Không có bất kỳ giao dịch nào thuộc về đơn hàng mua sắm thực tế của khách hàng ngoài đời thực.

---

### 2.3. A2: Truy Vết Các Lệnh Test Trực Tiếp Chỉnh Sửa Wallet
Đối chiếu trực tiếp mã nguồn kiểm thử [tests/test_loyalty_module.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js):
- **Dòng 139:** Tệp test tìm khách hàng đầu tiên:
  `let customer1 = await query("SELECT TOP 1 id, email, full_name FROM users WHERE role = 'CUSTOMER' ORDER BY id ASC");`
  $\rightarrow$ Gán `user1.id = 2` (`khachhang@vamos.vn`).
- **Dòng 397 (Test RED-03):**
  `await query("UPDATE user_points_wallets SET available_points = @pts WHERE user_id = @userId", { pts: rule.points_required + 200, userId: user1.id });`
  $\rightarrow$ Gán thẳng ví thành **700 điểm**. Sau đó gọi `redeemVoucher` (-500đ) $\rightarrow$ Ví còn **200 điểm**.
- **Dòng 428 (Test RED-04: Concurrency Anti-Double-Spending):**
  `await query("UPDATE user_points_wallets SET available_points = @pts WHERE user_id = @userId", { pts: rule.points_required, userId: user1.id });`
  $\rightarrow$ Gán thẳng ví thành **500 điểm**. Sau đó bắn 2 request đổi điểm song song $\rightarrow$ 1 request thành công (-500đ), 1 request thất bại $\rightarrow$ Ví về **0 điểm**.
- **Dòng 459 (Test CHK-01 / CHK-02: Checkout Protection):**
  `await query("UPDATE user_points_wallets SET available_points = @pts WHERE user_id = @userId", { pts: rule.points_required, userId: user1.id });`
  $\rightarrow$ Gán thẳng ví thành **500 điểm**. Sau đó gọi `redeemVoucher` (-500đ) sinh voucher test $\rightarrow$ Ví về **0 điểm**.
- **Section 7 (Dòng 560+):** Test luồng tích 3% điểm đơn hàng:
  Đơn hàng 900.000đ hoàn tất $\rightarrow$ Hàm `awardOrderPurchasePoints` cộng 27.000 điểm vào ví:
  $$\text{Số dư ví mới} = 0 + 27.000 = \mathbf{27.000 \text{ điểm}}.$$

**Kết luận A2:**
1. Trong mỗi lần chạy test suite, có đúng 3 lệnh `UPDATE` trực tiếp vào ví được thực thi.
2. Hoàn toàn **KHÔNG CÓ BẢN GHI LEDGER NÀO** được tạo ra cho 3 lần gán số dư này.
3. Sau khi test hoàn thành, ví luôn kết thúc ở con số **27.000 điểm**.

---

### 2.4. A3: Giải Thích Chính Xác Nguồn Gốc Sai Lệch 700 Điểm
Câu hỏi kiểm toán: *700 điểm đến từ đâu? Có phải tổng của nhiều lần điều chỉnh không? Redemption nào đã tiêu thụ? Số điểm này hiện còn trong ví không?*

#### Diễn tiến chi tiết tại Test Run 1 (Thời điểm 15:39:07):
1. **Trước khi đổi voucher:**
   - Tx #1: Thưởng Review #1 = +200 điểm.
   - Tx #2: Thưởng Review #2 = +300 điểm.
   - Tx #3: Thưởng Review #3 = +300 điểm.
   - $\Rightarrow$ **Tổng số điểm hợp lệ thực tế có trong ledger lúc này: $200 + 300 + 300 = \mathbf{800 \text{ điểm}}$.**
2. **Thực thi các lệnh Test:**
   - Dòng 397 gán ví = 700đ. Tx #4 đổi voucher -500đ $\rightarrow$ Tiêu 200đ từ Tx #1 và 300đ từ Tx #2.
   - Dòng 428 gán ví = 500đ (bơm thêm 300đ trực tiếp vào ví). Tx #5 đổi voucher -500đ $\rightarrow$ Tiêu 300đ từ Tx #3, **và tiêu 200 điểm từ số điểm fixture được bơm trực tiếp**.
   - Dòng 459 gán ví = 500đ (bơm thêm 500đ trực tiếp vào ví). Tx #6 đổi voucher -500đ $\rightarrow$ **Tiêu trọn vẹn 500 điểm từ số điểm fixture được bơm trực tiếp**.
3. **Tổng kết nguồn gốc 700 điểm:**
   - Điểm fixture được tiêu tại Tx #5: **200 điểm**.
   - Điểm fixture được tiêu tại Tx #6: **500 điểm**.
   - $\Rightarrow$ **Tổng cộng:** $200 + 500 = \mathbf{700 \text{ điểm}}$.
4. **Số điểm 700 này hiện tại ở đâu?**
   - **HOÀN TOÀN KHÔNG CÒN TRONG VÍ!** Số điểm này đã bị trừ sạch về 0 ngay tại thời điểm Tx #6 hoàn tất (`balance_after = 0`).
   - Chúng đã được chuyển hóa thành 2 mã voucher cá nhân thực tế trong database:
     * `VAMOSCLUB-1976BB4A` (Tx #5, sinh ra lúc 15:39:07.716).
     * `VAMOSCLUB-61FF3D24` (Tx #6, sinh ra lúc 15:39:07.733).

---

### 2.5. A4: Kiểm Tra Lại Kết Quả Mô Phỏng Backfill (155.100 Điểm)
Bảng tính từng bước phát lại (Replay Engine) theo thứ tự thời gian `ORDER BY created_at ASC, id ASC`:

```
BẢNG TÍNH REPLAY TỪNG BƯỚC (STEP-BY-STEP REPLAY SIMULATION)
───────────────────────────────────────────────────────────────────────────────────────────────────
Bước | Giao dịch | Số điểm | Tác động Lô Điểm (Point Batches) | Điểm thiếu | Tổng Active Batches
─────┼───────────┼─────────┼──────────────────────────────────┼────────────┼────────────────────
 1   | Tx #1     | +200    | Tạo Batch 1 (initial: 200, rem: 200)       | 0          | 200
 2   | Tx #2     | +300    | Tạo Batch 2 (initial: 300, rem: 300)       | 0          | 500
 3   | Tx #3     | +300    | Tạo Batch 3 (initial: 300, rem: 300)       | 0          | 800
 4   | Tx #4     | -500    | FEFO: Trừ Batch 1 (rem: 0), Batch 2 (rem: 0)| 0         | 300 (Batch 3)
 5   | Tx #5     | -500    | FEFO: Trừ Batch 3 (rem: 0) -> THIẾU 200Đ!  | 200        | 0
 6   | Tx #6     | -500    | FEFO: Kho hết điểm -> THIẾU 500Đ!         | 500        | 0
 7   | Tx #7     | +27.000 | Tạo Batch 4 (initial: 27000, rem: 27000)   | 0          | 27.000
 8   | Tx #8     | +300    | Tạo Batch 5 (initial: 300, rem: 300)       | 0          | 27.300
 9   | Tx #9-11  | -1.500  | Trừ Batch 4 (rem: 27000 -> 25500)          | 0          | 25.800
 ... | ...       | ...     | Các Run tiếp theo: Trừ đủ từ các Batch đơn | 0          | ...
 Cuối| Tx #37    | +27.000 | Hoàn tất phát lại toàn bộ 37 giao dịch     | TỔNG: 700  | 155.100
───────────────────────────────────────────────────────────────────────────────────────────────────
```

#### Phép toán chứng minh:
- Tổng điểm kiếm được nạp vào các Lô (Initial Points): **`164.900` điểm**.
- Tổng điểm bị trừ theo sổ cái: **`-10.500` điểm**.
- Nhưng do Tx #5 và Tx #6 không tìm thấy 700 điểm trong các lô quá khứ (vì thuật toán FEFO chuẩn không được phép trừ lùi vào các lô đơn hàng trong tương lai), nên Replay Engine chỉ trừ được:
  $$\text{Điểm thực trừ trong kho lô} = 10.500 - 700 = \mathbf{9.800 \text{ điểm}}.$$
- Do đó, tổng số điểm còn lại trong các lô ACTIVE bằng:
  $$\text{Tổng Active Batches} = 164.900 - 9.800 = \mathbf{155.100 \text{ điểm}}.$$
- So sánh với Tổng sổ cái ròng:
  $$\text{Active Batches} - \text{Net Ledger} = 155.100 - 154.400 = \mathbf{+700 \text{ điểm}}.$$
- So sánh với Số dư ví thực tế:
  $$\text{Active Batches} - \text{Wallet DB} = 155.100 - 27.000 = \mathbf{128.100 \text{ điểm}}.$$

> [!CAUTION]
> **KẾT LUẬN KIỂM TOÁN A4:**
> Bất biến $\sum \text{remaining\_points (ACTIVE)} = \text{wallet.available\_points}$ **KHÔNG THỂ THỎA MÃN** trên CSDL phát triển `vamos_store_db` do sự hiện diện của 700 điểm ảo và 6 đơn hàng test lặp lại.
> **TUYỆT ĐỐI KHÔNG ĐƯỢC CHẠY BACKFILL LÊN DATABASE NÀY KHI CHƯA LÀM SẠCH.**

---

## MỤC 3. HẠNG MỤC B — XÁC ĐỊNH CHÍNH XÁC QUY TẮC CHU KỲ 12 THÁNG & NĂM NHUẬN

### 3.1. B1: Biểu Diễn Ranh Giới Chu Kỳ Theo Khoảng Nửa Mở
- **Chuẩn biểu diễn toán học & CSDL:** Khoảng nửa mở **`[cycle_start_at, cycle_end_at)`**.
  * Giao dịch có `created_at >= cycle_start_at` VÀ `created_at < cycle_end_at`: **Thuộc chu kỳ hiện tại**.
  * Giao dịch có `created_at >= cycle_end_at`: **Thuộc chu kỳ tiếp theo**.
- **Rà soát mã nguồn & tài liệu:**
  * Tuyệt đối không dùng `<= cycle_end_at` (vì sẽ gây tranh chấp biên tại đúng thời điểm mili-giây kết thúc).
  * Tuyệt đối không dùng `23:59:59` (vì trong kiểu dữ liệu `DATETIME2`, khoảng thời gian từ `23:59:59.001` đến `23:59:59.999` sẽ bị rơi vào "vùng chân không" không thuộc chu kỳ nào).

---

### 3.2. B2: Xử Lý Ranh Giới Năm Nhuận (Ngày 29/02)
Kết quả truy vấn thực tế trên Microsoft SQL Server 2022:
```sql
SELECT 
  DATEADD(year, 1, CAST('2024-02-29 14:30:00' AS DATETIME2)) AS leap_plus_1_year,
  DATEADD(day, 365, CAST('2024-02-29 14:30:00' AS DATETIME2)) AS leap_plus_365_days;
```
- Kết quả cả hai hàm đều trả về: **`2025-02-28 14:30:00.000`**.

#### Trình bày 2 phương án nghiệp vụ để Quý người dùng quyết định:

```
Phương án 1 (Calendar Normalization - Khuyến nghị kỹ thuật):
[2024-02-29 14:30:00] ──────── 1 Năm ────────► [2025-02-28 14:30:00) ──► Bắt đầu Chu kỳ 2
                                               (Hết hạn đúng ngày cuối tháng 2)

Phương án 2 (March 1st Alignment):
[2024-02-29 14:30:00] ── Hết tháng 2 ──► [2025-03-01 00:00:00) ──► Bắt đầu Chu kỳ 2
                                          (Dời sang ngày đầu tháng 3)
```

| Tiêu chí | Phương án 1: Chuẩn hóa theo SQL Server (Calendar Normalization) | Phương án 2: Dời sang ngày đầu tháng 3 (March 1st Alignment) |
| :--- | :--- | :--- |
| **Quy tắc tính** | `cycle_end_at = DATEADD(year, 1, cycle_start_at)` $\rightarrow$ Ra **`28/02`** năm sau. Chu kỳ mới bắt đầu từ `28/02`. | `cycle_end_at = '2025-03-01 00:00:00'`. Chu kỳ mới bắt đầu từ `01/03`. |
| **Ưu điểm** | Hoàn toàn tự động, dùng hàm gốc `DATEADD(year, 1, ...)` của SQL Server, không cần code xử lý ngoại lệ rườm rà. | Khách hàng cảm thấy được hưởng trọn vẹn toàn bộ tháng 2 của năm sau. |
| **Nhược điểm** | Ngày kỷ niệm của user từ các năm sau sẽ cố định là ngày 28/02. | Phải viết thêm logic kiểm tra `MONTH=2 AND DAY=29` trong code service và SQL script. |

> **Quyết định:** Antigravity đánh dấu đây là **Quyết định nghiệp vụ #1** chờ người dùng phê duyệt trước khi lập trình.

---

### 3.3. B3: Thứ Tự Xử Lý Khi Có Giao Dịch Sát Thời Điểm Kết Thúc Chu Kỳ
1. **Giao dịch kiếm điểm lúc $T < cycle\_end\_at$:** Khóa ví $\rightarrow$ Cộng điểm ví $\rightarrow$ Cộng `qualifying_points_cycle` của chu kỳ cũ $\rightarrow$ Nếu vượt ngưỡng, nâng hạng ngay lập tức.
2. **Giao dịch kiếm điểm lúc $T \ge cycle\_end\_at$:** Hệ thống tự động nhận diện chu kỳ cũ đã kết thúc. Nếu tiến trình chốt sổ chưa chạy, giao dịch này tự động được tính cho chu kỳ mới (cộng vào `qualifying_points_cycle` mới, chu kỳ cũ được bảo toàn để chờ worker chốt).
3. **Tiến trình Worker chốt sổ chu kỳ:**
   - Sử dụng Transaction với khóa bi quan:
     `SELECT * FROM user_points_wallets WITH (UPDLOCK, ROWLOCK) WHERE user_id = @userId;`
   - So sánh `qualifying_points_cycle` với ngưỡng duy trì hạng hiện tại $\rightarrow$ Áp dụng Soft Landing $\rightarrow$ Chốt `tier_code` mới $\rightarrow$ Reset `qualifying_points_cycle = 0` $\rightarrow$ Gán `cycle_start_at = cycle_end_at cũ` và `cycle_end_at mới = DATEADD(year, 1, cycle_start_at mới)`.

---

## MỤC 4. HẠNG MỤC C — KIỂM TOÁN SOFT LANDING & TÌNH HUỐNG NÂNG HẠNG GIỮA CHU KỲ

### 4.1. Bảng Kiểm Tra Logic Soft Landing Toàn Diện

| Hạng hiện tại | Điểm chu kỳ vừa qua | Hạng sau khi xét lại | Căn cứ nghiệp vụ Soft Landing |
| :---: | :---: | :---: | :--- |
| **MEMBER** | 0 | **`MEMBER`** | Dưới 1.000 điểm, tiếp tục giữ MEMBER. |
| **MEMBER** | 1.200 | **`SILVER`** | Đạt $\ge 1.000$ điểm $\rightarrow$ Thăng hạng SILVER. |
| **SILVER** | 1.100 | **`SILVER`** | Đạt $\ge 1.000$ điểm $\rightarrow$ Đủ điều kiện duy trì SILVER. |
| **SILVER** | 400 | **`MEMBER`** | Dưới 1.000 điểm $\rightarrow$ Hạ tối đa 1 bậc từ SILVER xuống MEMBER. |
| **GOLD** | 3.000 | **`GOLD`** | Đạt $\ge 2.500$ điểm $\rightarrow$ Đủ điều kiện duy trì GOLD. |
| **GOLD** | 800 | **`SILVER`** | Dưới 2.500 điểm $\rightarrow$ Hạ tối đa 1 bậc từ GOLD xuống SILVER (không rớt về MEMBER). |
| **VIP** | 6.000 | **`VIP`** | Đạt $\ge 5.000$ điểm $\rightarrow$ Đủ điều kiện duy trì VIP. |
| **VIP** | 300 | **`GOLD`** | Dưới 5.000 điểm $\rightarrow$ Hạ tối đa 1 bậc từ VIP xuống GOLD (không rớt về SILVER/MEMBER). |

### 4.2. Tình Huống Quan Trọng: Nâng Hạng Giữa Chu Kỳ & Đánh Giá Cuối Kỳ
- **Kịch bản:**
  * Khách hàng bắt đầu chu kỳ ở hạng **SILVER**.
  * Tháng 6, khách tích thêm 2.500 điểm $\rightarrow$ Hệ thống nâng hạng tức thì lên **GOLD**.
  * Đến ngày kết thúc chu kỳ 12 tháng, tổng điểm kiếm được trong chu kỳ đó chỉ đạt **1.500 điểm** (thấp hơn ngưỡng duy trì 2.500 điểm của GOLD).
- **Quy tắc Soft Landing áp dụng:**
  1. Hạng hiện tại tại thời điểm đánh giá là **`GOLD`**.
  2. Ngưỡng duy trì hạng GOLD là 2.500 điểm. Vì $1.500 < 2.500$, khách không đủ điều kiện duy trì GOLD.
  3. Áp dụng nguyên tắc Soft Landing: **Chỉ hạ tối đa 1 bậc từ hạng hiện tại** $\Rightarrow$ **Hạ từ GOLD xuống SILVER** (tuyệt đối không bị rớt về MEMBER). Hạng SILVER này duy trì cho chu kỳ 12 tháng tiếp theo.

---

## MỤC 5. HẠNG MỤC D — CONCURRENCY, DEADLOCK VÀ IDEMPOTENCY

### 5.1. D1: Thứ Tự Khóa (Lock Hierarchy)
Rà soát mã nguồn các hàm nghiệp vụ:
- `redeemVoucher`: Khóa `point_reward_rules` trước, sau đó khóa `user_points_wallets`.
- `awardReviewPoints`: Khóa `user_points_wallets` trước.
- `awardOrderPurchasePoints`: Kiểm tra Idempotency trước, sau đó khóa `user_points_wallets`.
- **Thứ tự khóa chuẩn hóa bắt buộc cho Stage 2 (Để triệt tiêu Deadlock):**
  $$\text{Wallet } (user\_points\_wallets) \longrightarrow \text{Batches } (loyalty\_point\_batches)$$
  Mọi tiến trình (Đổi voucher và Worker hết hạn) đều phải lấy khóa `WITH (UPDLOCK, ROWLOCK)` trên hàng ví của `user_id` trước, sau đó mới truy vấn các lô điểm.

### 5.2. D2: Kiểm Tra Idempotency Thực Tế
- **Index CSDL hiện tại:**
  `uq_point_tx_idempotency` — `UNIQUE NONCLUSTERED INDEX` trên cột `idempotency_key` với điều kiện lọc `([idempotency_key] IS NOT NULL)`.
- **Đánh giá khóa `EXP_BATCH_{batchId}`:**
  * Cực kỳ an toàn và chuẩn xác. Do mỗi lô điểm chỉ có một `batchId` duy nhất, giao dịch hết hạn chỉ có thể được chèn thành công đúng 1 lần. Mọi lần retry trùng sẽ bị SQL Server ném lỗi Unique Constraint (Error 2627/2601) và rollback ngay lập tức.

### 5.3. D3: Race Condition (7 Kịch Bản)
1. **Redemption & Expiration cùng truy cập 1 ví:** Khóa `UPDLOCK, ROWLOCK` trên ví buộc 1 bên xếp hàng. Bên sau đọc số dư mới nhất. Ràng buộc `CHECK (available_points >= 0)` bảo vệ tuyệt đối.
2. **Hai worker cùng xử lý 1 batch:** `sp_getapplock` ở cấp Session chặn đứng worker thứ hai ngay từ cửa ngõ.
3. **Worker crash sau khi ghi ledger nhưng trước khi update batch:** Nằm trong cùng 1 Transaction $\rightarrow$ SQL Server tự động Rollback toàn bộ khi connection đứt.
4. **Worker crash sau khi update batch nhưng trước khi commit:** Tương tự, Rollback tự động toàn bộ.
5. **User đổi voucher khi batch sắp hết hạn:** Cơ chế FEFO ưu tiên trừ lô sắp hết hạn trước. Nếu user trừ hết, worker quét thấy `remaining_points = 0` $\rightarrow$ bỏ qua an toàn.
6. **Hai request đổi voucher đồng thời:** Khóa ví tuần tự hóa 2 request. Request 1 trừ điểm, request 2 kiểm tra số dư không đủ và bị từ chối với lỗi tiếng Việt rõ ràng.
7. **Worker retry sau khi commit nhưng mất mạng phản hồi:** Unique index `EXP_BATCH_{batchId}` chặn đứng việc ghi nhận lần 2.

### 5.4. D4: Cơ Chế Deadlock Retry (SQL Server Error 1205)
- **Hiện trạng source code:** Ứng dụng hiện **CHƯA CÓ** cơ chế retry tự động khi gặp lỗi 1205 (`Transaction was deadlocked on resources with another process and has been chosen as the deadlock victim`).
- **Thiết kế đề xuất cho Stage 2:** Xây dựng hàm bọc retry `executeWithRetry(fn, maxRetries = 3, delayMs = 100)`:
  * Bắt mã lỗi `err.number === 1205`.
  * Chờ với exponential backoff có jitter ngẫu nhiên (`delayMs * Math.pow(2, attempt) + Math.random() * 50`).
  * Chỉ retry khi transaction có tính idempotent hoàn toàn.

---

## MỤC 6. HẠNG MỤC E — ĐÁNH GIÁ DỮ LIỆU TEST Ô NHIỄM & PHƯƠNG ÁN KHÔI PHỤC AN TOÀN

### 6.1. E1: Danh Sách Dữ Liệu Test Bị Ô Nhiễm Trên `vamos_store_db`
Qua kiểm tra SELECT, toàn bộ dữ liệu test fixture gồm:
1. **6 đơn hàng test:** Đơn #33, #38, #41, #44, #47, #52 (đều mang mã `ORD-TEST-LOYALTY-...`).
2. **Order items:** Các dòng sản phẩm của 6 đơn hàng trên.
3. **10 bài đánh giá test:** Reviews #1 đến #10 (đều gắn với các đơn test #29, #31, #33, #35, #38, #41, #44, #47, #50, #52).
4. **21 voucher test:** Các mã `VAMOSCLUB-...` sinh ra từ các lần chạy test.
5. **21 bản ghi `voucher_redemptions`:** Gắn với 21 voucher test trên.
6. **37 bản ghi `point_transactions`:** Của `user_id = 2`.
7. **Ví `user_points_wallets`:** Của `user_id = 2` đang giữ 27.000 điểm ảo.

---

### 6.2. E2: Phương Án Khôi Phục An Toàn (Kế Hoạch Khuyến Nghị Trước Stage 2)

```
[BƯỚC 1: SAO LƯU FULL CSDL] ──► [BƯỚC 2: KIỂM THỬ RESTORE] ──► [BƯỚC 3: DỌN DỮ LIỆU TEST THEO FK]
                                                                                │
                                                                                ▼
[BƯỚC 5: ĐỐI SOÁT ZERO-ERROR] ◄── [BƯỚC 4: RESET VÍ VỀ 0Đ CHO USER 2] ─────────┘
```

#### Thứ tự xử lý phụ thuộc khóa ngoại (Dependency Order):
1. Xóa `review_media` của 10 reviews test.
2. Xóa 10 `reviews` test.
3. Xóa `voucher_redemptions` của 21 voucher test.
4. Xóa 21 `vouchers` test có mã `VAMOSCLUB-...`.
5. Xóa `order_items` của 6 đơn hàng test `ORD-TEST-LOYALTY-...`.
6. Xóa 6 `orders` test.
7. Xóa 37 `point_transactions` của `user_id = 2`.
8. Reset ví `user_points_wallets` của `user_id = 2`:
   `UPDATE user_points_wallets SET available_points = 0, lifetime_earned_points = 0, lifetime_redeemed_points = 0, tier_code = 'MEMBER' WHERE user_id = 2;`

> **Lưu ý:** Không thực thi bất kỳ lệnh nào trong số này ở phiên làm việc hiện tại. Chỉ thực hiện khi có phê duyệt riêng của người dùng trước khi tiến hành Stage 2.

---

### 6.3. E3: Giải Pháp Ngăn Chặn Triệt Để Test Ghi Vào Database Dev (Test Isolation)
1. **Thêm Guard vào `src/config/database.js`:**
   ```javascript
   if (process.env.NODE_ENV === 'test') {
     const dbName = appConfig.db.database;
     if (!dbName.includes('test')) {
       throw new Error(`[CRITICAL SECURITY GUARD]: Test suite bị chặn vì đang cố kết nối vào CSDL "${dbName}" thay vì CSDL test!`);
     }
   }
   ```
2. **Khai báo `process.env.NODE_ENV = 'test'`** tại dòng 1 của tệp `tests/test_loyalty_module.js`.
3. **Cập nhật script `package.json`:** Sử dụng `cross-env NODE_ENV=test` cho mọi lệnh `npm run test:...`.

---

## MỤC 7. HẠNG MỤC F — BẢNG ĐÁNH GIÁ KHẢ NĂNG TRIỂN KHAI STAGE 2

| Hạng mục kiểm toán | Trạng thái | Bằng chứng thực tế | Rủi ro còn lại | Điều kiện tối thiểu để triển khai Stage 2 |
| :--- | :---: | :--- | :--- | :--- |
| **1. Test isolation** | **`FAIL`** | `test_loyalty_module.js` thiếu cờ test, đã ghi 37 giao dịch vào `vamos_store_db`. | Chạy test sẽ tiếp tục làm bẩn database. | Bổ sung Guard chặn kết nối nhầm và khai báo `NODE_ENV=test`. |
| **2. Data backfill** | **`FAIL`** | Bất biến $\sum \text{remaining} = \text{wallet}$ không khớp ($155.100 \neq 27.000$). | Backfill sẽ nhân đôi điểm ảo của test. | Dọn dẹp dữ liệu test fixture trên `vamos_store_db` trước khi chạy. |
| **3. Point batches** | **`PASS`** | Đã phác thảo DDL 9 cột, index FEFO và ràng buộc CHECK chuẩn hóa. | Cần bọc transaction khi tạo bảng. | Được duyệt áp dụng qua Migration 006. |
| **4. Point expiration** | **`PASS`** | Nhận diện đúng lô đến hạn 365 ngày, ghi sổ cái `POINT_EXPIRATION`. | Hiệu năng khi bảng lớn. | Filtered index trên `loyalty_point_batches(status, expires_at)`. |
| **5. Tier cycle** | **`BLOCKED`** | Đã chốt chu kỳ 12 tháng từ giao dịch đầu tiên, nhưng chưa chốt ngày 29/02 năm nhuận. | Tranh cãi ngày hết hạn năm nhuận. | Người dùng phê duyệt chọn Phương án 1 (28/02) hay Phương án 2 (01/03). |
| **6. Soft Landing** | **`PASS`** | Đã làm rõ ma trận 12 kịch bản và tình huống thăng hạng giữa chu kỳ. | Cần viết unit test tự động. | Cập nhật logic trong `loyalty.service.js`. |
| **7. Redemption concurrency** | **`PASS`** | Đã có `WITH (UPDLOCK, ROWLOCK)` và ràng buộc `available_points >= 0`. | Cần thống nhất thứ tự lock ví trước - batch sau. | Tuân thủ Lock Hierarchy trong Stage 2. |
| **8. Worker concurrency** | **`PASS`** | Đã xác minh cơ chế `sp_getapplock` loại bỏ đa instance xung đột. | Worker crash giữa chừng. | Bọc try/catch granular cho từng tài khoản. |
| **9. Idempotency** | **`PASS`** | Filtered Unique Index `uq_point_tx_idempotency` đã hoạt động trong DB. | Không có. | Sử dụng định dạng `EXP_BATCH_{batchId}`. |
| **10. Rollback / Recovery** | **`BLOCKED`** | Đã có kế hoạch đổi tên bảng và roll-forward, nhưng chưa tạo file backup `.bak`. | Rủi ro mất dữ liệu nếu migration lỗi. | Tạo bản sao lưu `.bak` và kiểm thử restore thành công. |

---

## MỤC 8. DANH SÁCH QUYẾT ĐỊNH NGHIỆP VỤ CẦN NGƯỜI DÙNG PHÊ DUYỆT

Trước khi có thể bắt tay vào triển khai Stage 2, hệ thống cần Quý người dùng phê duyệt 3 vấn đề sau:

1. **Quyết định về xử lý ngày nhuận 29/02:**
   - *Lựa chọn A (Khuyến nghị kỹ thuật):* Dùng cơ chế tự nhiên của SQL Server `DATEADD(year, 1, '2024-02-29') = '2025-02-28'` (Chu kỳ sau bắt đầu ngày 28/02).
   - *Lựa chọn B:* Chuyển ngày kết thúc sang `01/03` năm sau.
2. **Quyết định về dọn dẹp dữ liệu test trên `vamos_store_db`:**
   - Phê duyệt cho phép chạy kịch bản làm sạch dữ liệu test fixture của `user_id = 2` (xóa 6 đơn test, 10 review test, 21 voucher test, 37 transaction test và reset ví về 0đ) trước khi áp dụng Migration 006?
3. **Phê duyệt phương án Test Isolation Guard:**
   - Đồng ý thêm mã kiểm tra Guard trong `database.js` để tự động ngắt kết nối nếu test runner chạm vào database phát triển?

---

## MỤC 9. KẾT LUẬN CUỐI CÙNG

- **HỆ THỐNG ĐÃ ĐỦ ĐIỀU KIỆN VỀ MẶT THIẾT KẾ KIẾN TRÚC VÀ ĐẶC TẢ NGHIỆP VỤ.**
- **TUY NHIÊN, HỆ THỐNG CHƯA ĐỦ ĐIỀU KIỆN ĐỂ TRIỂN KHAI VÀO DATABASE DO VẪN CÒN 2 HẠNG MỤC FAIL (Test Isolation, Data Backfill) VÀ 2 HẠNG MỤC BLOCKED (Quyết định ngày 29/02, Sao lưu `.bak`).**
- **ĐIỂM DỪNG BẮT BUỘC:** Hệ thống dừng lại tại đây, không thay đổi bất kỳ dòng code logic nào, không thay đổi database và chờ đợi quyết định chính thức từ Quý người dùng!
