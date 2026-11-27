# VAMOS CLUB STAGE 2 — BLOCKER & HIGH REMEDIATION REPORT

> **Repository:** `dungtttd01702-coder/vamos-store`
> **Branch:** `fix/master-repair-plan`
> **HEAD:** `c0e242435f8d507f2540e6b0ba305ffa1f08e8f5`
> **Nguồn kiểm toán đối chiếu:** [VAMOS_CLUB_STAGE_2_INDEPENDENT_CODE_REVIEW.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_STAGE_2_INDEPENDENT_CODE_REVIEW.md)
> **Ràng buộc đã tuân thủ:** Không stage/commit/push/merge; không chạy migration, không kết nối SQL Server local/production, không chạy `loyalty:process`, `loyalty:backfill:dry`, `--apply` hoặc suite chạm DB.

---

## A. GIT STATE

- **Branch hiện tại:** `fix/master-repair-plan`
- **HEAD commit:** `c0e242435f8d507f2540e6b0ba305ffa1f08e8f5` (giữ nguyên trước và sau sửa lỗi)
- **Xác nhận:** 0 staged, 0 commits mới, 0 pushes.
- **Danh sách tệp thay đổi trước nhiệm vụ (19 files):**
  - Tracked modified (11): `docs/database/DATABASE_OVERVIEW.md`, `docs/database/DATA_DICTIONARY.md`, `docs/diagrams/erd/PHYSICAL_ERD.puml`, `docs/diagrams/erd/vamos_store_erd.puml`, `docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md`, `docs/loyalty/VAMOS_CLUB_SPEC.md`, `docs/loyalty/VAMOS_CLUB_TEST_PLAN.md`, `package.json`, `src/services/loyalty.service.js`, `src/views/pages/account/rewards.pug`, `tests/test_loyalty_module.js`
  - Untracked (8): `database/migrations/006_vamos_club_expiration_and_tier_cycle.sql`, `docs/loyalty/VAMOS_CLUB_CYCLE_EXPIRATION_IMPLEMENTATION_REPORT.md`, `docs/loyalty/VAMOS_CLUB_STAGE_2_INDEPENDENT_CODE_REVIEW.md`, `src/jobs/backfillLoyaltyHistory.js`, `src/jobs/processLoyaltyCycle.js`, `src/utils/loyaltyCycle.js`, `tests/helpers/loyalty-test-helpers.js`, `tests/test_loyalty_cycle_integration.js`, `tests/test_loyalty_cycle_unit.js` (9 untracked gồm file audit review mới tạo ở bước trước)
- **Tệp chạm trong đợt remediation này:**
  - Chỉnh sửa phạm vi hẹp trên các file sẵn có từ Stage 2 + `tests/regression_suite.js` (`BLOCKER-03`):
    - [tests/test_loyalty_cycle_integration.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js) (`BLOCKER-01`, `BLOCKER-02`)
    - [tests/regression_suite.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/regression_suite.js) (`BLOCKER-03`)
    - [src/services/loyalty.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js) (`HIGH-01`, `MEDIUM-03`)
    - [src/utils/loyaltyCycle.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js) (`HIGH-01`)
    - [src/jobs/backfillLoyaltyHistory.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js) (`HIGH-02`)
    - [database/migrations/006_vamos_club_expiration_and_tier_cycle.sql](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql) (`HIGH-03`)
    - [tests/test_loyalty_cycle_unit.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_unit.js) (unit tests cho `HIGH-01`, `HIGH-02`, `MEDIUM-03`)
    - [tests/test_loyalty_module.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js) (`MEDIUM-01`)
    - [DATA_DICTIONARY.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATA_DICTIONARY.md), [DATABASE_OVERVIEW.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATABASE_OVERVIEW.md), [VAMOS_CLUB_DATA_DICTIONARY.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md), [VAMOS_CLUB_TEST_PLAN.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_TEST_PLAN.md) (`MEDIUM-02`)
  - Tạo mới duy nhất file báo cáo này: [VAMOS_CLUB_STAGE_2_BLOCKER_HIGH_REMEDIATION_REPORT.md](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_STAGE_2_BLOCKER_HIGH_REMEDIATION_REPORT.md).

---

## B. BẢNG REMEDIATION

| Finding ID | File & Line | Nguyên nhân | Thay đổi đã thực hiện | Test xác minh | Kết quả | Rủi ro còn lại |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **BLOCKER-01** | [test_loyalty_cycle_integration.js:18-40](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L18-L40) | Fixture dùng cột không tồn tại `users.is_active`, `'customer'`, `reward_type = 'VOUCHER_FIXED'` và cột `min_order_value` (bảng `point_reward_rules` là `min_order_amount`) | Sửa thành `users (..., role, status)` với `('CUSTOMER', 'active')`; sửa `point_reward_rules` thành `reward_type = 'VOUCHER'`, `discount_type = 'fixed_amount'`, `min_order_amount`, `stock_quantity = 999` | `node --check`, đối chiếu trực tiếp `001` & `005` | **NOT VERIFIED ON DB** (cú pháp PASS, chờ CI) | Cần chạy trên SQL Server 2022 ở CI |
| **BLOCKER-02** | [test_loyalty_cycle_integration.js:65-75, 224-255, 260-325](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_cycle_integration.js#L65-L75) | `INT-01` dựa vào constraint cũ thiếu `qualifying_points_cycle = 0`; `INT-04` callback nhận `(batchId, idx)` sai chữ ký `(row)` & kiểm tra `.locked`; `INT-05` dùng batch quá hạn cho redemption race & kiểm tra `.locked`; `INT-06` kiểm tra `.totalWallets` & `assert.rejects` | Cập nhật `INT-01` (với `HIGH-03`), `INT-04` dùng counter trên `row.user_id` & `summary.skippedDueToLock === false`, `INT-05` tách Case A (batch quá hạn bị reject, worker hết hạn sạch) & Case B (2 redemption đồng thời trên batch còn hạn), `INT-06` kiểm tra `dry.reconciledAccounts + dry.failedAccounts`, `applyRes.status === 'ABORTED_PREFLIGHT_FAILED'` & DB batch count = `0` | `node --check`, đối chiếu contract `processLoyaltyCycle.js` & `backfillLoyaltyHistory.js` | **NOT VERIFIED ON DB** (cú pháp PASS, chờ CI) | Cần chạy trên CI `vamos_store_test_db` |
| **BLOCKER-03** | [regression_suite.js:1093-1096](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/regression_suite.js#L1093-L1096) | `ADMIN-06` chuyển đơn sang `COMPLETED` tạo batch mới trong `loyalty_point_batches`, nhưng teardown xóa `point_transactions` & `users` trước khi xóa `loyalty_point_batches` | Bổ sung `DELETE FROM loyalty_point_batches WHERE user_id IN (@u1, @u2, @tu, @gu)` ngay trước `DELETE FROM point_transactions` | `node --check`, rà soát thứ tự FK trên `005` & `006` | **NOT VERIFIED ON DB** (cú pháp PASS, chờ CI) | Cần chạy `regression_suite.js` trên CI |
| **HIGH-01** | [loyalty.service.js:487-536, 575, 690-699](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L487-L536), [loyaltyCycle.js:249-269](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/utils/loyaltyCycle.js#L249-L269) | `redeemVoucher()` và `planFefoDeduction()` không lọc `expires_at > @nowTs`, kiểm tra `wallet.available_points` trước khi tính tổng batch còn hạn, và dùng `GETDATE()` cho `vouchers.end_date` | Lọc `AND expires_at > @nowTs` cả trong `SELECT ... WITH (UPDLOCK, ROWLOCK)` lẫn `UPDATE`, cộng `usableUnexpiredPoints` từ các batch còn hạn để từ chối sớm nếu không đủ, truyền `{ now: nowTs }` vào `planFefoDeduction()`, đồng bộ `@nowTs` cho `vouchers`, lọc `expires_at > GETDATE()` ở `getRewardsCenterData()` | `EXP-05`, `SVC-04`, `SVC-05`, `SVC-06` trong `test_loyalty_cycle_unit.js` (4/4 mocked/unit PASS) | **PASS (Unit/Mock)**; chưa chạy SQL Server thật | Khả năng đồng thời thật trên MSSQL cần CI xác minh |
| **HIGH-02** | [backfillLoyaltyHistory.js:18-235](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js#L18-L235) | `APPLY` dùng snapshot đã đọc ngoài transaction, không giữ khóa ví trước khi đọc sổ cái | Tách `DRY_RUN` (read-only) khỏi `APPLY`. Trong `APPLY`: giữ `acquireSessionAppLock`, mở `sql.Transaction`, khóa `user_points_wallets WITH (UPDLOCK, HOLDLOCK)` **trước** rồi mới đọc `point_transactions WITH (HOLDLOCK)` & `loyalty_point_batches WITH (HOLDLOCK)`, chạy `reconcileSnapshot()` ngay trong `tx`; nếu sai lệch/mutation -> rollback trả về `ABORTED_PREFLIGHT_FAILED` | `BF-06`, `BF-07` trong `test_loyalty_cycle_unit.js` (2/2 mocked/unit PASS) | **PASS (Unit/Mock)**; chưa chạy SQL Server thật | Mọi luồng ngoài app tự chèn trực tiếp vào DB không khóa ví trước sẽ không được đồng bộ -> khuyến nghị vẫn chạy `--apply` trong maintenance window |
| **HIGH-03** | [006_vamos_club_expiration_and_tier_cycle.sql:63-86](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql#L63-L86) | Nhánh `cycle_number = 0` trong `chk_wallets_cycle_consistency` thiếu `AND qualifying_points_cycle = 0` | Bổ sung điều kiện `AND qualifying_points_cycle = 0` vào nhánh `cycle_number = 0`, kèm bước drop-and-recreate idempotent nếu bản cũ chưa có `qualifying_points_cycle` | Rà soát tĩnh DDL T-SQL & đối chiếu `init_mssql.js` | **NOT VERIFIED ON DB** | Cần chạy Migration `006` (1 lần & lặp lại) trên CI SQL Server 2022 |
| **MEDIUM-01** | [test_loyalty_module.js:170-185](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/test_loyalty_module.js#L170-L185) | `setWalletBalanceFixture()` nâng `tier_code` theo `ADMIN_ADJUSTMENT` trong khi `cycle_number = 0` | Đã sửa: giữ nguyên `tier_code`, chỉ cập nhật `available_points` & `lifetime_earned_points` để khớp chính sách Stage 2 | `node --check`, đối chiếu toàn bộ assertions `RED-*`/`CHK-*` trong file | **NOT VERIFIED ON DB** | Chờ chạy `test_loyalty_module.js` trên CI |
| **MEDIUM-02** | [DATA_DICTIONARY.md:13](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATA_DICTIONARY.md#L13), [DATABASE_OVERVIEW.md:29-60,114](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/database/DATABASE_OVERVIEW.md#L29-L60), [VAMOS_CLUB_DATA_DICTIONARY.md:51,65](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_DATA_DICTIONARY.md#L51), [VAMOS_CLUB_TEST_PLAN.md:19](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/docs/loyalty/VAMOS_CLUB_TEST_PLAN.md#L19) | Một số tiêu đề/bảng cũ còn ghi `21 bảng`, `trọn đời`, hoặc `CHECK` 5 loại cũ | Đã sửa đồng bộ lên `28 bảng (001–006)` (nêu rõ `006` chưa chạy runtime), cập nhật diễn giải `qualifying_points_cycle` và `POINT_EXPIRATION` | Đối soát trực tiếp tài liệu với `005`, `006`, `loyaltyCycle.js` | **PASS (Static Docs)** | Còn vài số thống kê constraint chi tiết giai đoạn `001`–`004` giữ phạm vi lịch sử ở Mục 4 `DATABASE_OVERVIEW.md` |
| **MEDIUM-03** | [loyalty.service.js:371-388](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L371-L388) | `awardOrderPurchasePoints(orderId)` standalone đọc `order_status` nhưng không xác minh `COMPLETED` & `PAID` | Đã sửa: đọc thêm `payment_status` và rollback + throw Error nếu `order_status !== 'COMPLETED' || payment_status !== 'PAID'` | `SVC-07` trong `test_loyalty_cycle_unit.js` (PASS) + kiểm tra `testOrder` ở `test_loyalty_module.js` | **PASS (Unit/Mock)** | Cần chạy `ORD-PUR-01` trên CI xác nhận không regression |

---

## C. CHI TIẾT KỸ THUẬT

1. **Vì sao redemption không thể tiêu thụ batch đã hết hạn:**
   - Trong [loyalty.service.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/services/loyalty.service.js#L487-L536), ngay sau khi khóa `user_points_wallets`, hệ thống khóa các lô điểm bằng `WHERE user_id = @userId AND status = 'ACTIVE' AND remaining_points > 0 AND expires_at > @nowTs`, tính tổng `usableUnexpiredPoints` từ chính tập bản ghi đã khóa (không dựa đơn thuần vào `wallet.available_points`), từ chối giao dịch nếu thiếu điểm khả dụng còn hạn, lọc lần 2 trong `planFefoDeduction(batchRes.recordset, points_required, { now: nowTs })`, và gắn lại điều kiện `AND expires_at > @nowTs AND remaining_points >= @take` trong từng câu `UPDATE loyalty_point_batches` kèm kiểm tra `rowsAffected[0] === 1`. Mọi timestamp tạo voucher, `voucher_redemptions`, `loyalty_point_batches`, `user_points_wallets` và `point_transactions` dùng thống nhất một mốc `nowTs`.
2. **Vì sao backfill không còn dùng snapshot cũ để APPLY:**
   - Trong [backfillLoyaltyHistory.js](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/src/jobs/backfillLoyaltyHistory.js#L118-L220), `DRY_RUN` tách biệt hoàn toàn và không ghi DB. Ở chế độ `APPLY`, hàm không tái sử dụng dữ liệu đọc trước đó: nó khóa `acquireSessionAppLock`, mở `sql.Transaction`, khóa serializable `user_points_wallets WITH (UPDLOCK, HOLDLOCK)` trước, rồi mới đọc `point_transactions WITH (HOLDLOCK)` và `loyalty_point_batches WITH (HOLDLOCK)`, chạy lại `reconcileSnapshot()` ngay trong `tx`; nếu phát hiện bất kỳ sai lệch hay batch đã tồn tại, transaction rollback ngay với 0 dòng bị ghi.
3. **Cơ chế khóa và thứ tự khóa được bảo đảm:**
   - Toàn bộ 4 đường ghi chính đều giữ cùng một thứ tự khóa trên đối tượng cốt lõi:
     - `_awardPointsWithBatch()` (order/review): `orders`/`reviews` $\rightarrow$ `user_points_wallets (UPDLOCK, ROWLOCK)` $\rightarrow$ `point_transactions` $\rightarrow$ `loyalty_point_batches`.
     - `redeemVoucher()`: `point_reward_rules` $\rightarrow$ `user_points_wallets (UPDLOCK, ROWLOCK)` $\rightarrow$ `loyalty_point_batches (UPDLOCK, ROWLOCK)` $\rightarrow$ `vouchers`/`voucher_redemptions`/`point_transactions`.
     - `processLoyaltyCycle.js`: `sp_getapplock (Session)` $\rightarrow$ `user_points_wallets (UPDLOCK, ROWLOCK)` $\rightarrow$ `loyalty_point_batches (UPDLOCK, ROWLOCK)` $\rightarrow$ `point_transactions`.
     - `backfillLoyaltyHistory.js (APPLY)`: `sp_getapplock (Session)` $\rightarrow$ `user_points_wallets (UPDLOCK, HOLDLOCK)` $\rightarrow$ `point_transactions (HOLDLOCK)` / `loyalty_point_batches (HOLDLOCK)`.
   - Vì `user_points_wallets` luôn bị khóa trước `loyalty_point_batches` và `point_transactions`, không có chu trình khóa chéo `batch -> wallet` hay `tx -> wallet` trong tầng ứng dụng/worker/backfill. Tuy vậy, khi vận hành thực tế `--apply`, vẫn khuyến nghị chạy trong maintenance window để loại trừ mọi truy vấn thủ công ngoài app.
4. **Vì sao CHECK constraint mới bảo vệ đúng cycle state:**
   - Ở [006_vamos_club_expiration_and_tier_cycle.sql](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql#L43-L86), bộ 3 constraint `chk_wallets_cycle_number` (`>= 0`), `chk_wallets_qualifying_points` (`>= 0`) và `chk_wallets_cycle_consistency` ép buộc chặt 2 trạng thái duy nhất:
     - Chưa kích hoạt (`cycle_number = 0`): `cycle_anchor_at`, `cycle_start_at`, `cycle_end_at` đều `NULL` **và** `qualifying_points_cycle = 0`.
     - Đã kích hoạt (`cycle_number >= 1`): cả 3 mốc thời gian đều `NOT NULL` và `cycle_end_at > cycle_start_at` (cộng `qualifying_points_cycle >= 0`).
5. **Vì sao regression teardown không còn lỗi FK:**
   - Theo [006](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/database/migrations/006_vamos_club_expiration_and_tier_cycle.sql#L104-L105), `loyalty_point_batches` giữ `fk_point_batches_tx -> point_transactions(id)` và `fk_point_batches_user -> users(id)` đều là `ON DELETE NO ACTION`. Việc thêm `DELETE FROM loyalty_point_batches WHERE user_id IN (@u1, @u2, @tu, @gu)` ngay trước `DELETE FROM point_transactions` và `users` trong [regression_suite.js:1094](file:///c:/Users/Admin/Desktop/dự%20án%20JAV/tests/regression_suite.js#L1094) giải phóng toàn bộ tham chiếu con trước khi xóa bản ghi cha cho đúng 4 user fixture.

---

## D. TEST EVIDENCE

### 1. Các kiểm tra Zero-DB đã chạy trực tiếp sau lần sửa cuối cùng
| Lệnh | Exit Code | Kết quả thực tế |
| :--- | :---: | :--- |
| `node tests/test_loyalty_cycle_unit.js` | `0` | **40 passed, 0 failed** (0 kết nối SQL Server; đã bao gồm `EXP-05`, `SVC-04..07`, `BF-06..07`) |
| `node tests/test_db_guard.js` | `0` | **13/13 passed** |
| `node tests/test_validator.js` | `0` | **29 passed, 0 failed** |
| `node tests/validate_pug.js` | `0` | **41/41 Pug templates compiled, 0 syntax errors** |
| `node --check` trên 8 tệp JS bị sửa (`loyaltyCycle.js`, `loyalty.service.js`, `backfillLoyaltyHistory.js`, `processLoyaltyCycle.js`, `test_loyalty_cycle_unit.js`, `test_loyalty_cycle_integration.js`, `test_loyalty_module.js`, `regression_suite.js`) | `0` | **0 syntax errors** |
| `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"` | `0` | **`package.json:OK`** |
| `git diff --check` | `0` | **0 lỗi whitespace / conflict** |
| Static scan (`UPDLOCK/HOLDLOCK/expires_at/chk_wallets_cycle_consistency` & `NOSONAR/isNaN/parseInt`) | `0` | **0 vi phạm Sonar S7773 / S9383; 0 NOSONAR** |

### 2. Các kiểm tra CHƯA chạy tại local (cần SQL Server 2022 trên CI cô lập)
- Chưa chạy `database/init_mssql.js` (Migration `006`) trên SQL Server 2022.
- Chưa chạy `tests/test_loyalty_module.js`.
- Chưa chạy `tests/test_loyalty_cycle_integration.js`.
- Chưa chạy `tests/regression_suite.js`.
- Chưa chạy `npm run test:all` (bao gồm Playwright Chromium).
- Chưa chạy `npm run loyalty:process`, `npm run loyalty:backfill:dry`, hoặc `--apply`.

---

## E. KẾT LUẬN

**`READY FOR SECOND INDEPENDENT REVIEW`**

Toàn bộ 3 **BLOCKER**, 3 **HIGH**, và 3 **MEDIUM** trong báo cáo kiểm toán đã được khắc phục có giới hạn phạm vi; các kiểm tra zero-DB đều pass (`40/40` unit/mocked tests, `13/13` DB guard, `29/29` validator, `41/41` Pug, `0` lỗi cú pháp/whitespace). Stage 2 **chưa hoàn tất end-to-end** cho tới khi hoàn thành vòng Independent Read-Only Code Review thứ hai và xác minh các suite SQL Server 2022 trên GitHub Actions CI.
