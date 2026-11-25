# VAMOS CLUB — BÁO CÁO TRIỂN KHAI CHU KỲ XÉT HẠNG 12 THÁNG & ĐIỂM HẾT HẠN 365 NGÀY

> **Repository:** `dungtttd01702-coder/vamos-store`
> **Branch:** `fix/master-repair-plan`
> **Base Commit:** `c0e242435f8d507f2540e6b0ba305ffa1f08e8f5`
> **Trạng thái Git:** Chỉ chỉnh sửa trên working tree cục bộ (CHƯA stage, CHƯA commit, CHƯA push, PR `#1` giữ nguyên trạng thái `Draft`).
> **Trạng thái Runtime Database:** CHƯA chạy Migration `006`, CHƯA chạy Backfill `APPLY`, CHƯA chạy SQL Server Integration Tests hoặc CLI worker trên SQL Server cục bộ hay production.

---

## 1. TỔNG QUAN CHÍNH SÁCH ĐÃ TRIỂN KHAI

Toàn bộ phần mã nguồn và schema migration đã được triển khai bám sát chính sách nghiệp vụ VAMOS CLUB đã chốt:
1. **Chu kỳ xét hạng 12 tháng & mốc neo chống trôi năm nhuận (`cycle_anchor_at`):**
   - Chu kỳ 1 chỉ kích hoạt tại giao dịch tích điểm hợp lệ đầu tiên (`REVIEW_REWARD` hoặc `ORDER_PURCHASE` có `amount > 0`).
   - Tài khoản chưa có giao dịch tích điểm hợp lệ giữ nguyên `cycle_anchor_at = NULL`, `cycle_start_at = NULL`, `cycle_end_at = NULL`, `cycle_number = 0`, `qualifying_points_cycle = 0`, `tier_code = 'MEMBER'`.
   - `ADMIN_ADJUSTMENT`, `VOUCHER_REDEMPTION`, `POINT_EXPIRATION` không kích hoạt chu kỳ và không cộng vào `qualifying_points_cycle`.
   - Chu kỳ thứ `N` ($\ge 1$) tính trực tiếp từ `cycle_anchor_at` bất biến qua `addYearsFromAnchor(cycle_anchor_at, N - 1)` đến `addYearsFromAnchor(cycle_anchor_at, N)`, đảm bảo ngày `29/02` năm nhuận (`2024-02-29` $\rightarrow$ `2025-02-28` $\rightarrow$ `2028-02-29`) không bị trôi.
   - Ranh giới: `tx.created_at <= cycle_end_at` thuộc chu kỳ đang kết thúc; `tx.created_at > cycle_end_at` rollover/Soft Landing trước khi cộng vào chu kỳ mới.
   - Đồng hồ chuẩn: `GETDATE()` từ SQL Server (được `mssql`/`tedious` đọc theo UTC components).
2. **Thăng hạng tức thì & Hạ hạng mềm (Soft Landing):**
   - Ngưỡng hạng theo chu kỳ 12 tháng: `MEMBER` (`< 1.000`), `SILVER` (`1.000 – 2.499`), `GOLD` (`2.500 – 4.999`), `VIP` (`>= 5.000`).
   - Bảo vệ không tụt hạng giữa chu kỳ (`maxTier(rolledTier, calculateTier(newQualifying))`).
   - Khi hết chu kỳ 12 tháng, nếu `qualifying_points_cycle` không đạt ngưỡng hạng hiện tại, Soft Landing hạ tối đa 1 bậc (`VIP -> GOLD -> SILVER -> MEMBER`), reset `qualifying_points_cycle = 0`, giữ nguyên `available_points`, lô điểm, voucher và sổ cái. Worker xử lý dồn nhiều chu kỳ bị trễ theo đúng thứ tự thời gian.
3. **Điểm hết hạn sau 365 ngày & FEFO:**
   - Mỗi giao dịch tích điểm hợp lệ ghi nhận đồng thời bản ghi `point_transactions` (`OUTPUT INSERTED.id`) và 1 lô điểm trong `loyalty_point_batches` với `expires_at = addDaysUTC(created_at, 365)`, `status = 'ACTIVE'`.
   - Khi đổi voucher (`redeemVoucher`), mọi hạng thành viên đều được đổi nếu đủ điểm khả dụng và rule hợp lệ; điểm được trừ theo thứ tự **FEFO** (`expires_at ASC, id ASC`), lô về `0` chuyển sang `EXHAUSTED`, không làm giảm `qualifying_points_cycle`.
   - Khi lô điểm đến hạn (`expires_at <= now`), worker ghi nhận `POINT_EXPIRATION` với `idempotency_key = 'EXP_BATCH_{batchId}'`, trừ `available_points`, đánh dấu `EXPIRED` và giữ nguyên `qualifying_points_cycle`.

---

## 2. DANH SÁCH TỆP TẠO MỚI & CHỈNH SỬA

| Tệp | Hành động | Mục đích |
| :--- | :--- | :--- |
| [006_vamos_club_expiration_and_tier_cycle.sql](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql) | Tạo mới | Mở rộng 5 cột chu kỳ trên `user_points_wallets`, tạo bảng `loyalty_point_batches` + indexes FEFO/due, thêm `POINT_EXPIRATION` vào `chk_point_tx_type` |
| [loyaltyCycle.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js) | Tạo mới | Pure domain engine (0 DB): `addYearsFromAnchor`, `addDaysUTC`, `evaluateCycleEndTier`, `rolloverCyclesThroughTimestamp`, `applyPositiveEarnToWallet`, `planFefoDeduction`, `replayUserHistory` |
| [loyalty.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js) | Chỉnh sửa | Tích hợp tạo batch 365 ngày + cập nhật chu kỳ trong `_awardPointsWithBatch`, FEFO trong `redeemVoucher()`, dữ liệu chu kỳ & lô sắp hết hạn trong `getRewardsCenterData()` |
| [processLoyaltyCycle.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/processLoyaltyCycle.js) | Tạo mới | CLI worker định kỳ dùng `sp_getapplock` (Session-scoped trên pool 1 kết nối), thứ tự khóa `user_points_wallets` $\rightarrow$ `loyalty_point_batches`, xử lý hết hạn batch + multi-cycle Soft Landing |
| [backfillLoyaltyHistory.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js) | Tạo mới | CLI backfill `DRY_RUN` & fail-closed `APPLY` (`--apply --confirm-apply`), từ chối khi có sai lệch hoặc dữ liệu không khớp |
| [rewards.pug](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/views/pages/account/rewards.pug) | Chỉnh sửa | Hiển thị thông tin chu kỳ 12 tháng, điểm xét hạng chu kỳ, lô điểm sắp hết hạn 365 ngày và nhãn `POINT_EXPIRATION` |
| [package.json](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/package.json) | Chỉnh sửa | Thêm scripts `loyalty:process`, `loyalty:backfill:dry`, `test:loyalty:unit`, `test:loyalty:cycle` và tích hợp vào `test:all` |
| [loyalty-test-helpers.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/helpers/loyalty-test-helpers.js) | Tạo mới | Helper test runner dùng chung để tránh trùng lặp mã nguồn giữa các file test |
| [test_loyalty_cycle_unit.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_unit.js) | Tạo mới | 33 pure in-memory unit tests (0 kết nối DB) bao phủ 20 kịch bản chu kỳ, FEFO, Backfill Replay, mock Service/Worker |
| [test_loyalty_cycle_integration.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js) | Tạo mới | 6 SQL Server integration tests cô lập qua `test_bootstrap.js` để chạy trên CI `vamos_store_test_db` |
| [test_loyalty_module.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js) | Chỉnh sửa | Cập nhật `setWalletBalanceFixture` (tạo/khấu trừ `loyalty_point_batches`) và thứ tự teardown xóa `loyalty_point_batches` trước `point_transactions` |
| [VAMOS_CLUB_SPEC.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_SPEC.md) | Chỉnh sửa | Đồng bộ quy tắc `cycle_anchor_at` + bảng liên kết tệp & trạng thái chưa chạy DB |
| [VAMOS_CLUB_DATA_DICTIONARY.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md) | Chỉnh sửa | Đồng bộ chi tiết Migration `006`, các cột ví và bảng `loyalty_point_batches` |
| [VAMOS_CLUB_TEST_PLAN.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_TEST_PLAN.md) | Chỉnh sửa | Bổ sung kế hoạch & kết quả test Giai đoạn 2 (Unit vs CI Integration) |
| [DATA_DICTIONARY.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATA_DICTIONARY.md) | Chỉnh sửa | Cập nhật danh mục 28 bảng (gồm `005` + `006` chưa chạy runtime) |
| [DATABASE_OVERVIEW.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATABASE_OVERVIEW.md) | Chỉnh sửa | Bổ sung Migration `005`/`006` và hướng dẫn vận hành CLI Worker / Backfill |
| [PHYSICAL_ERD.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/erd/PHYSICAL_ERD.puml) | Chỉnh sửa | Thêm 5 cột chu kỳ trên `user_points_wallets`, `POINT_EXPIRATION`, entity `loyalty_point_batches` và FK |
| [vamos_store_erd.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/erd/vamos_store_erd.puml) | Chỉnh sửa | Đồng bộ ERD mức logic cho `user_points_wallets` và `loyalty_point_batches` |

---

## 3. ĐỐI SOÁT KIẾN TRÚC CSDL & MIGRATION 006

- Đảm bảo tính idempotent theo chuẩn `database/init_mssql.js` (`COL_LENGTH`, `sys.check_constraints`, `sys.indexes`, `OBJECT_ID`, phân tách lô lệnh bằng `GO`).
- Không sửa `001`–`005`, giữ nguyên `uq_point_tx_idempotency` trên `point_transactions(idempotency_key)`.
- Bảo toàn 100% số dư hiện có trong `user_points_wallets` khi nâng cấp.
- Ràng buộc `chk_wallets_cycle_consistency` bảo đảm nhất quán giữa `cycle_number = 0` (`NULL` timestamps) và `cycle_number >= 1` (`NOT NULL`, `cycle_end_at > cycle_start_at`).
- Ràng buộc `chk_point_batches_status_remaining` bảo đảm `ACTIVE` phải có `remaining_points > 0` và `EXHAUSTED`/`EXPIRED` phải có `remaining_points = 0`.

---

## 4. PURE ENGINE CHU KỲ & FEFO (`src/utils/loyaltyCycle.js`)

- Không phụ thuộc DB, thời gian được truyền tường minh (`txTime`, `asOfDate`).
- Xử lý trọn vẹn `29/02` năm nhuận bằng phép tính trực tiếp trên `cycle_anchor_at` + số thứ tự chu kỳ `N - 1` / `N`.
- Cung cấp `replayUserHistory` dùng chung giữa unit test offline và CLI backfill để phát hiện các anomaly: `EXISTING_BATCHES_PRESENT`, `DUPLICATE_IDEMPOTENCY_KEY`, `MISSING_REFERENCE`, `NEGATIVE_TX_INSUFFICIENT_BATCHES`, `EXPIRATION_TARGET_MISMATCH`, `WALLET_REPLAY_MISMATCH`.

---

## 5. SERVICE TÍCH ĐIỂM & ĐỔI VOUCHER (`src/services/loyalty.service.js`)

- `_awardPointsWithBatch`: chạy bên trong SQL transaction của đơn hàng/đánh giá; dùng `GETDATE()` từ SQL Server (hoặc `txTimeOverride` trong test), cập nhật đồng thời `point_transactions`, `loyalty_point_batches`, và các cột chu kỳ/hạng của `user_points_wallets`.
- `redeemVoucher`: khóa `UPDLOCK, ROWLOCK` theo thứ tự `point_reward_rules` $\rightarrow$ `user_points_wallets` $\rightarrow$ `loyalty_point_batches`, lập kế hoạch FEFO qua `planFefoDeduction`, kiểm tra `rowsAffected` từng batch trước khi trừ điểm và tạo voucher cá nhân.
- `getRewardsCenterData`: nạp thêm `nextExpiringBatch` (`status = 'ACTIVE' AND remaining_points > 0 ORDER BY expires_at ASC, id ASC`) và tính tiến độ hạng theo `qualifying_points_cycle`.

---

## 6. CLI WORKER ĐỊNH KỲ (`src/jobs/processLoyaltyCycle.js`)

- Chạy qua CLI `npm run loyalty:process`, không tự gắn timer nền trong Express request lifecycle.
- Bảo vệ `validateDatabaseConnection(appConfig.db, process.env.NODE_ENV)` trước khi tạo kết nối.
- Khóa đa tiến trình `sp_getapplock` ở mức `Session` trên một pool ghim 1 kết nối (`max: 1, min: 1`) và giải phóng bằng `sp_releaseapplock` trong khối `finally`.
- Luôn khóa `user_points_wallets` trước `loyalty_point_batches` để đồng bộ lock hierarchy với `redeemVoucher`, triệt tiêu deadlock.
- Chống ghi trùng khi hết hạn bằng `idempotency_key = 'EXP_BATCH_{batchId}'`.

---

## 7. BACKFILL AN TOÀN & FAIL-CLOSED (`src/jobs/backfillLoyaltyHistory.js`)

- Mặc định chỉ chạy `DRY_RUN`; chế độ `APPLY` yêu cầu tường minh cả hai cờ `--apply` và `--confirm-apply` (hoặc tùy chọn `apply: true, confirmApply: true`).
- Thực hiện kiểm tra toàn bộ ví và sổ cái qua `replayUserHistory`; nếu có bất kỳ tài khoản nào chứa dữ liệu test/điều chỉnh sai lệch hoặc thiếu batch nguồn (như trường hợp lịch sử đã ghi nhận ở tài liệu kiểm toán `user_id = 2`), hệ thống từ chối ghi DB (**fail-closed**), tuyệt đối không tự động sửa `available_points` hay bịa batch giả.

---

## 8. CẬP NHẬT GIAO DIỆN & CẤU HÌNH

- [rewards.pug](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/views/pages/account/rewards.pug): Cập nhật thông điệp chính sách 365 ngày & chu kỳ 12 tháng, hiển thị `qualifying_points_cycle`, ngày kết thúc chu kỳ (`cycle_end_at`), thông báo lô điểm sắp hết hạn (`nextExpiringBatch`), và huy hiệu cho `POINT_EXPIRATION`.
- [package.json](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/package.json): Bổ sung scripts `loyalty:process`, `loyalty:backfill:dry`, `test:loyalty:unit`, `test:loyalty:cycle`, đồng thời đưa unit/integration test vào `test:all`.

---

## 9. KẾT QUẢ KIỂM THỬ THỰC TẾ (CHỈ OFFLINE / ZERO-DB)

Các lệnh đã thực thi trực tiếp sau lần sửa mã nguồn cuối cùng (tất cả đều **0 kết nối SQL Server**):
- `node tests/test_loyalty_cycle_unit.js`: **PASS 33/33** (20 test chu kỳ `CYC-01..CYC-20`, 4 test hết hạn/FEFO `EXP-01..EXP-04`, 5 test Backfill `BF-01..BF-05`, 4 test Service/Worker mock `SVC-01..SVC-03`, `WRK-01`).
- `node tests/test_validator.js`: **PASS 29/29**.
- `node tests/test_db_guard.js`: **PASS 13/13**.
- `node tests/validate_pug.js`: **PASS 41/41** templates Pug.
- `node --check` trên toàn bộ 8 file JS tạo mới/chỉnh sửa: **PASS** (0 lỗi cú pháp).
- `JSON.parse` kiểm tra `package.json`: **PASS**.
- `git diff --check`: **PASS** (0 lỗi whitespace/conflict markers).

---

## 10. CÁC KIỂM TRA CHƯA THỂ CHẠY TẠI LOCAL (CẦN CI / MÔI TRƯỜNG SQL SERVER)

Do tuân thủ nguyên tắc không kết nối/ghi dữ liệu vào SQL Server local hay production:
- **Chưa chạy** Migration `006_vamos_club_expiration_and_tier_cycle.sql` trên SQL Server.
- **Chưa chạy** `tests/test_loyalty_module.js` bản cập nhật đối với `loyalty_point_batches`.
- **Chưa chạy** `tests/test_loyalty_cycle_integration.js` trên `vamos_store_test_db`.
- **Chưa chạy** `npm run loyalty:backfill:dry` hay `npm run loyalty:process` trên dữ liệu thật.
- **Chưa chạy** `npm run test:all` (bao gồm Playwright Chromium).
- **Chưa có kết quả SonarCloud scan** cho commit mới (vì chưa commit/push).

---

## 11. TUÂN THỦ QUY TẮC SONARCLOUD & CHẤT LƯỢNG MÃ

- Không sử dụng `NOSONAR` hay `eslint-disable`.
- Không dùng global `isNaN`, `parseInt`, `parseFloat` (`Number.isNaN`, `Number.parseInt`, `Number.isSafeInteger` được sử dụng nhất quán).
- Các Promise cấp cao trong test và CLI đều gắn `.catch(...)` và cập nhật `process.exitCode = 1`.
- Tách hàm dùng chung [loyalty-test-helpers.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/helpers/loyalty-test-helpers.js) để hạn chế trùng lặp giữa hai file test mới.

---

## 12. ĐỒNG BỘ TÀI LIỆU & SƠ ĐỒ ERD

- Đã cập nhật đồng bộ: [VAMOS_CLUB_SPEC.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_SPEC.md), [VAMOS_CLUB_DATA_DICTIONARY.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md), [VAMOS_CLUB_TEST_PLAN.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_TEST_PLAN.md), [DATA_DICTIONARY.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATA_DICTIONARY.md), [DATABASE_OVERVIEW.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATABASE_OVERVIEW.md), [PHYSICAL_ERD.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/erd/PHYSICAL_ERD.puml), [vamos_store_erd.puml](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/diagrams/erd/vamos_store_erd.puml).
- Tài liệu phân định rõ ràng giữa chính sách đã chốt, mã nguồn/migration đã tạo, và trạng thái CSDL runtime chưa thực thi DDL/backfill.

---

## 13. RỦI RO & VẤN ĐỀ MỞ CẦN LƯU Ý

1. **Dữ liệu dev bị ô nhiễm trước đây (như `user_id = 2`):** Sẽ khiến `backfillLoyaltyHistory.js --apply` tự động fail-closed cho đến khi dữ liệu lịch sử hoặc DB phát triển được dọn sạch / quyết định hướng xử lý riêng.
2. **Độ trễ áp dụng Migration `006` trên runtime:** Trong thời gian mã nguồn mới đã có trên branch nhưng DB chưa chạy Migration `006`, các lời gọi SQL tới `loyalty_point_batches` hoặc cột `cycle_anchor_at` sẽ lỗi nếu chạy ứng dụng vào DB chưa migrate. Cần chạy `database/init_mssql.js` trước khi khởi động app dùng code mới.
3. **Vận hành định kỳ Worker:** Chưa cấu hình cron/Windows Task Scheduler/GitHub Scheduled Job thực tế để gọi `npm run loyalty:process` hằng ngày.

---

## 14. BƯỚC TIẾP THEO ĐƯỢC ĐỀ XUẤT

1. Người dùng review diff trên working tree và phê duyệt riêng thao tác `git commit` + `git push` lên `fix/master-repair-plan`.
2. Trên GitHub Actions CI (`vamos_store_test_db`), xác nhận Migration `006`, `test_loyalty_module.js`, `test_loyalty_cycle_integration.js`, `test:all` và SonarCloud Quality Gate đều PASS.
3. Trước khi áp dụng lên `vamos_store_db` hoặc production: tạo backup `.bak`, chạy Migration `006`, chạy `npm run loyalty:backfill:dry` để kiểm tra toàn bộ ví, xử lý riêng mọi anomaly (nếu có), rồi mới lên lịch chạy `npm run loyalty:process`.

---

> **KẾT LUẬN TRẠNG THÁI GIAI ĐOẠN 2:** Chức năng chu kỳ xét hạng 12 tháng & điểm hết hạn 365 ngày VAMOS CLUB **CHƯA ĐƯỢC COI LÀ HOÀN TẤT END-TO-END TRÊN RUNTIME DB** cho đến khi Migration `006` được chạy và kiểm chứng trên CI SQL Server, dữ liệu lịch sử được đối soát (`DRY_RUN`), và CLI worker `processLoyaltyCycle.js` được kiểm thử thực tế trên SQL Server.
