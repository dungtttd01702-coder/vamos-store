/**
 * Automated Test Suite: VAMOS CLUB Loyalty & Review-to-Earn System
 * Covers:
 * 1. Tier and points calculation logic (MEMBER, SILVER, GOLD, VIP).
 * 2. Review points calculation rules (rating, comment length, quick tags, media, 300 cap).
 * 3. Security & Ownership boundaries (guest, non-owner, non-completed, product not in order).
 * 4. Duplicate review prevention (service & database unique constraint).
 * 5. Voucher redemption (sufficient/insufficient points, inactive rule).
 * 6. Concurrency / Race condition test (anti-double-spending with row locks).
 * 7. Personal voucher checkout protection (owner only, USED on checkout, AVAILABLE on cancel).
 * 8. Order purchase 3% points calculation & idempotency.
 * 9. Product reviews aggregation & star breakdown.
 */

// Ensure test environment bootstrap before any module loads
require('./test_bootstrap');

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const { getPool, query, closePool } = require('../src/config/database');
const loyaltyService = require('../src/services/loyalty.service');
const reviewService = require('../src/services/review.service');
const orderService = require('../src/services/order.service');
const { uploadDir, isAuthenticImage, cleanupUploadedFiles } = require('../src/middlewares/upload.middleware');
const { voucherLimiter, redeemLimiter } = require('../src/middlewares/rateLimit.middleware');

async function runLoyaltyTests() {
  console.log('===============================================================');
  console.log('   VAMOS STORE - VAMOS CLUB LOYALTY & REVIEW TEST SUITE');
  console.log('===============================================================');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  const pool = await getPool();

  // Guard assertion: Validate that tests are strictly connected to a test database
  const dbCheck = await query('SELECT DB_NAME() AS current_db');
  const currentDb = dbCheck.recordset[0]?.current_db;
  console.log(`[TEST ISOLATION GUARD] Connected database: ${currentDb} (NODE_ENV=${process.env.NODE_ENV})`);
  if (!currentDb || !currentDb.toLowerCase().includes('test')) {
    throw new Error(`[CRITICAL TEST ABORT] test_loyalty_module must run against a test database! Connected to: ${currentDb}`);
  }

  // Tracking structure for dedicated fixtures generated in this test run
  const runTimestamp = Date.now();
  const runRand = Math.random().toString(36).substring(2, 8);
  const testRunId = `loyalty_${runTimestamp}_${runRand}`;

  const trackedFixtures = {
    userIds: [],
    orderIds: [],
    voucherIds: [],
    redemptionIds: [],
    reviewIds: [],
    cartIds: [],
    walletUserIds: []
  };

  /**
   * Helper: Sets wallet balance safely within a transaction and records an ADMIN_ADJUSTMENT
   * point_transaction to preserve ledger integrity and mathematical invariance.
   */
  async function setWalletBalanceFixture(userId, targetPoints, reason = 'Test fixture balance adjustment') {
    const conn = await getPool();
    const tx = new sql.Transaction(conn);
    await tx.begin();
    try {
      const wReq = new sql.Request(tx);
      const wCheck = await wReq.input('uid', sql.Int, userId).query(`
        SELECT user_id, available_points, lifetime_earned_points
        FROM user_points_wallets WITH (UPDLOCK, ROWLOCK)
        WHERE user_id = @uid
      `);

      let currentPoints = 0;
      let currentLifetime = 0;
      if (wCheck.recordset.length === 0) {
        const createReq = new sql.Request(tx);
        const newW = await createReq.input('uid', sql.Int, userId).query(`
          INSERT INTO user_points_wallets (user_id, available_points, lifetime_earned_points, lifetime_redeemed_points, tier_code)
          OUTPUT INSERTED.user_id, INSERTED.available_points, INSERTED.lifetime_earned_points
          VALUES (@uid, 0, 0, 0, 'MEMBER')
        `);
        currentPoints = newW.recordset[0].available_points;
        currentLifetime = newW.recordset[0].lifetime_earned_points;
      } else {
        currentPoints = wCheck.recordset[0].available_points;
        currentLifetime = wCheck.recordset[0].lifetime_earned_points;
      }

      const delta = targetPoints - currentPoints;
      if (delta !== 0) {
        // Record ledger transaction
        const txReq = new sql.Request(tx);
        txReq.input('uid', sql.Int, userId);
        txReq.input('amount', sql.Int, delta);
        txReq.input('balAfter', sql.Int, targetPoints);
        txReq.input('type', sql.VarChar(50), 'ADMIN_ADJUSTMENT');
        txReq.input('desc', sql.NVarChar(255), reason);
        const ptInsert = await txReq.query(`
          INSERT INTO point_transactions (user_id, amount, balance_after, transaction_type, description)
          OUTPUT INSERTED.id
          VALUES (@uid, @amount, @balAfter, @type, @desc)
        `);
        const pointTxId = ptInsert.recordset[0].id;

        if (delta > 0) {
          const batchReq = new sql.Request(tx);
          batchReq.input('uid', sql.Int, userId);
          batchReq.input('ptId', sql.Int, pointTxId);
          batchReq.input('pts', sql.Int, delta);
          await batchReq.query(`
            INSERT INTO loyalty_point_batches (user_id, transaction_id, initial_points, remaining_points, expires_at, status)
            VALUES (@uid, @ptId, @pts, @pts, DATEADD(day, 365, SYSUTCDATETIME()), 'ACTIVE')
          `);
        } else {
          let toDeduct = -delta;
          const activeBatchesRes = await new sql.Request(tx)
            .input('uid', sql.Int, userId)
            .query(`
              SELECT id, remaining_points
              FROM loyalty_point_batches WITH (UPDLOCK, ROWLOCK)
              WHERE user_id = @uid AND status = 'ACTIVE' AND remaining_points > 0
              ORDER BY expires_at ASC, id ASC
            `);
          for (const batch of activeBatchesRes.recordset) {
            if (toDeduct <= 0) break;
            const take = Math.min(toDeduct, batch.remaining_points);
            const rem = batch.remaining_points - take;
            toDeduct -= take;
            await new sql.Request(tx)
              .input('bid', sql.Int, batch.id)
              .input('rem', sql.Int, rem)
              .input('st', sql.NVarChar(20), rem === 0 ? 'EXHAUSTED' : 'ACTIVE')
              .query(`
                UPDATE loyalty_point_batches
                SET remaining_points = @rem, status = @st
                WHERE id = @bid
              `);
          }
        }

        // Update wallet balance only (ADMIN_ADJUSTMENT must not activate cycle or elevate tier)
        const updReq = new sql.Request(tx);
        updReq.input('uid', sql.Int, userId);
        updReq.input('target', sql.Int, targetPoints);
        const newLifetime = delta > 0 ? currentLifetime + delta : currentLifetime;
        updReq.input('newLifetime', sql.Int, newLifetime);
        await updReq.query(`
          UPDATE user_points_wallets
          SET available_points = @target,
              lifetime_earned_points = @newLifetime,
              updated_at = SYSUTCDATETIME()
          WHERE user_id = @uid
        `);
      }

      await tx.commit();
      if (!trackedFixtures.walletUserIds.includes(userId)) {
        trackedFixtures.walletUserIds.push(userId);
      }
    } catch (err) {
      try {
        await tx.rollback();
      } catch (rollbackErr) {
        console.warn('[LOYALTY FIXTURE] Rollback warning:', rollbackErr.message);
      }
      throw err;
    }
  }

  try {
    // -------------------------------------------------------------
    // SECTION 1: UNIT LOGIC - TIER & REVIEW POINTS CALCULATION
    // -------------------------------------------------------------
    console.log('\n--- 1. TIER & POINTS CALCULATION LOGIC ---');

    test('TIER-01: Correct tier assignment based on total points earned', () => {
      assert.strictEqual(loyaltyService.calculateTier(0), 'MEMBER');
      assert.strictEqual(loyaltyService.calculateTier(500), 'MEMBER');
      assert.strictEqual(loyaltyService.calculateTier(999), 'MEMBER');
      assert.strictEqual(loyaltyService.calculateTier(1000), 'SILVER');
      assert.strictEqual(loyaltyService.calculateTier(2499), 'SILVER');
      assert.strictEqual(loyaltyService.calculateTier(2500), 'GOLD');
      assert.strictEqual(loyaltyService.calculateTier(4999), 'GOLD');
      assert.strictEqual(loyaltyService.calculateTier(5000), 'VIP');
      assert.strictEqual(loyaltyService.calculateTier(15000), 'VIP');
    });

    test('TIER-02: Tier progress metrics computation', () => {
      const memberMetrics = loyaltyService.getTierMetrics(300);
      assert.strictEqual(memberMetrics.tier, 'MEMBER');
      assert.strictEqual(memberMetrics.pointsToNextTier, 700);
      assert.strictEqual(memberMetrics.progressPercentage, 30);

      const silverMetrics = loyaltyService.getTierMetrics(1500);
      assert.strictEqual(silverMetrics.tier, 'SILVER');
      assert.strictEqual(silverMetrics.pointsToNextTier, 1000); // 2500 - 1500

      const vipMetrics = loyaltyService.getTierMetrics(6000);
      assert.strictEqual(vipMetrics.tier, 'VIP');
      assert.strictEqual(vipMetrics.pointsToNextTier, 0);
      assert.strictEqual(vipMetrics.progressPercentage, 100);
    });

    test('CALC-01: Rating only awards 100 points', () => {
      const pts = loyaltyService.calculateReviewPoints(5, '', [], []);
      assert.strictEqual(pts, 100);
    });

    test('CALC-02: Rating + short comment (<50 chars) without tag awards 100 points', () => {
      const pts = loyaltyService.calculateReviewPoints(4, 'Giày đẹp lắm', [], []);
      assert.strictEqual(pts, 100);
    });

    test('CALC-03: Rating + detailed comment (>=50 chars) awards 200 points', () => {
      const longComment = 'Giày rất êm ái, đế cao su bám tốt, form giày ôm sát bàn chân, đi lại rất thoải mái!';
      assert.ok(longComment.length >= 50);
      const pts = loyaltyService.calculateReviewPoints(5, longComment, [], []);
      assert.strictEqual(pts, 200);
    });

    test('CALC-04: Rating + valid quick tag awards 200 points', () => {
      const pts = loyaltyService.calculateReviewPoints(5, 'Ok', ['Đi đúng size'], []);
      assert.strictEqual(pts, 200);
    });

    test('CALC-05: Rating + quick tag + photos awards max cap 300 points', () => {
      const pts = loyaltyService.calculateReviewPoints(5, '', ['Đi đúng size'], [{ filename: 'photo1.jpg' }]);
      assert.strictEqual(pts, 300);
    });

    test('CALC-06: Maximum points per review is capped at 300', () => {
      const longComment = 'Giày rất êm ái, đế cao su bám tốt, form giày ôm sát bàn chân, đi lại rất thoải mái cả ngày!';
      const media = [{ filename: 'p1.jpg' }, { filename: 'p2.jpg' }, { filename: 'p3.jpg' }];
      const tags = ['Đi đúng size', 'Rất êm chân', 'Đóng gói cẩn thận'];
      const pts = loyaltyService.calculateReviewPoints(5, longComment, tags, media);
      assert.strictEqual(pts, 300);
    });

    test('CALC-07: Invalid rating throws Error', () => {
      assert.throws(() => loyaltyService.calculateReviewPoints(0, '', [], []), /Số sao đánh giá phải từ 1 đến 5/);
      assert.throws(() => loyaltyService.calculateReviewPoints(6, '', [], []), /Số sao đánh giá phải từ 1 đến 5/);
    });

    // -------------------------------------------------------------
    // SECTION 2: FIXTURE SETUP FOR INTEGRATION TESTING (ISOLATED)
    // -------------------------------------------------------------
    console.log('\n--- 2. DATABASE FIXTURES SETUP (ISOLATED RUN) ---');

    // Create fresh isolated test accounts per run (Zero shared user pollution)
    const user1Email = `loyalty_u1_${testRunId}@vamos.test`;
    const insertUser1 = await query(`
      INSERT INTO users (email, password_hash, full_name, role, status)
      OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name
      VALUES (@email, 'hash_test', N'Khách Test Loyalty 1 (Isolated)', 'CUSTOMER', 'ACTIVE')
    `, { email: user1Email });
    const user1 = insertUser1.recordset[0];
    trackedFixtures.userIds.push(user1.id);

    const user2Email = `loyalty_u2_${testRunId}@vamos.test`;
    const insertUser2 = await query(`
      INSERT INTO users (email, password_hash, full_name, role, status)
      OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name
      VALUES (@email, 'hash_test', N'Khách Test Loyalty 2 (Isolated)', 'CUSTOMER', 'ACTIVE')
    `, { email: user2Email });
    const user2 = insertUser2.recordset[0];
    trackedFixtures.userIds.push(user2.id);

    // Get a valid product variant (read-only reference)
    const variantRes = await query(`
      SELECT TOP 1 pv.id as variant_id, pv.product_id, p.base_price, p.name as product_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.stock_quantity > 0 AND p.status = 'active'
    `);
    const testVariant = variantRes.recordset[0];
    assert.ok(testVariant, 'Must have at least one product variant for testing');

    // Create a COMPLETED test order for user1
    const testOrderRes = await query(`
      INSERT INTO orders (
        order_code, user_id, recipient_name_snapshot, recipient_phone_snapshot,
        delivery_address_snapshot, payment_method, payment_status, order_status,
        subtotal, discount_amount, shipping_fee, total_amount,
        created_at, updated_at
      )
      OUTPUT INSERTED.id, INSERTED.order_code
      VALUES (
        'ORD-TEST-' + @runId,
        @userId, N'Test User 1', '0912345678',
        N'123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        'COD', 'PAID', 'COMPLETED',
        1000000, 100000, 30000, 930000,
        SYSUTCDATETIME(), SYSUTCDATETIME()
      )
    `, { runId: testRunId, userId: user1.id });
    const testOrder = testOrderRes.recordset[0];
    trackedFixtures.orderIds.push(testOrder.id);

    // Insert order item
    await query(`
      INSERT INTO order_items (order_id, product_variant_id, product_name_snapshot, sku_snapshot, size_snapshot, color_snapshot, unit_price, quantity, line_total)
      VALUES (@orderId, @variantId, @name, 'SKU-TEST', '41', N'Đen', 1000000, 1, 1000000)
    `, {
      orderId: testOrder.id,
      variantId: testVariant.variant_id,
      name: testVariant.product_name
    });

    console.log(`  ✔ Fixtures initialized: Run=${testRunId}, User1=${user1.id}, User2=${user2.id}, Order=${testOrder.id}, Product=${testVariant.product_id}`);

    // -------------------------------------------------------------
    // SECTION 3: REVIEW ELIGIBILITY & SECURITY BOUNDARIES
    // -------------------------------------------------------------
    console.log('\n--- 3. REVIEW ELIGIBILITY & SECURITY BOUNDARIES ---');

    await asyncTest('SEC-REV-01: Order not belonging to user is rejected', async () => {
      await assert.rejects(
        async () => {
          await reviewService.getOrderEligibleItems(testOrder.id, user2.id);
        },
        /không thuộc về tài khoản của bạn/
      );
    });

    await asyncTest('SEC-REV-02: Review submission by non-owner is rejected', async () => {
      await assert.rejects(
        async () => {
          await reviewService.createReview({
            userId: user2.id,
            orderId: testOrder.id,
            productId: testVariant.product_id,
            rating: 5,
            comment: 'Hàng xịn xò',
          });
        },
        /không thuộc về tài khoản của bạn/
      );
    });

    await asyncTest('SEC-REV-03: Product not in order cannot be reviewed', async () => {
      // Find a product not in this order
      const otherProductRes = await query(`
        SELECT TOP 1 id FROM products WHERE id != @prodId AND status = 'active'
      `, { prodId: testVariant.product_id });

      if (otherProductRes.recordset.length > 0) {
        const otherProdId = otherProductRes.recordset[0].id;
        await assert.rejects(
          async () => {
            await reviewService.createReview({
              userId: user1.id,
              orderId: testOrder.id,
              productId: otherProdId,
              rating: 5,
              comment: 'Sản phẩm khác',
            });
          },
          /không nằm trong danh mục sản phẩm/
        );
      }
    });

    await asyncTest('SEC-REV-04: Non-completed order cannot be reviewed', async () => {
      // Create pending order
      const pendingOrderRes = await query(`
        INSERT INTO orders (
          order_code, user_id, recipient_name_snapshot, recipient_phone_snapshot,
          delivery_address_snapshot, payment_method, payment_status, order_status,
          subtotal, discount_amount, shipping_fee, total_amount
        )
        OUTPUT INSERTED.id
        VALUES (
          'ORD-PEND-' + @runId,
          @userId, N'Test User 1', '0912345678',
          N'123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
          'COD', 'UNPAID', 'PENDING',
          500000, 0, 30000, 530000
        )
      `, { runId: testRunId, userId: user1.id });
      const pendingOrder = pendingOrderRes.recordset[0];
      trackedFixtures.orderIds.push(pendingOrder.id);

      await assert.rejects(
        async () => {
          await reviewService.createReview({
            userId: user1.id,
            orderId: pendingOrder.id,
            productId: testVariant.product_id,
            rating: 5,
            comment: 'Chưa nhận đã review',
          });
        },
        /Chỉ đơn hàng đã giao thành công/
      );
    });

    // -------------------------------------------------------------
    // SECTION 4: REVIEW CREATION & LEDGER INTEGRATION
    // -------------------------------------------------------------
    console.log('\n--- 4. REVIEW SUBMISSION & POINTS LEDGER INTEGRATION ---');

    let initialWallet = await loyaltyService.getOrCreateWallet(user1.id);
    const startBalance = initialWallet.available_points;

    await asyncTest('REV-SUB-01: Valid review creates review, media, and credits wallet points', async () => {
      const reviewResult = await reviewService.createReview({
        userId: user1.id,
        orderId: testOrder.id,
        productId: testVariant.product_id,
        rating: 5,
        quickTags: ['Đi đúng size', 'Rất êm chân'],
        comment: 'Giày thực sự rất êm chân và chuẩn size, đóng gói cẩn thận 2 lớp hộp, rất ưng ý!',
        files: [
          { filename: 'test_shoe_1.jpg', path: 'public/uploads/reviews/test_shoe_1.jpg', size: 1024, mimetype: 'image/jpeg' },
          { filename: 'test_shoe_2.jpg', path: 'public/uploads/reviews/test_shoe_2.jpg', size: 2048, mimetype: 'image/jpeg' }
        ]
      });
      trackedFixtures.reviewIds.push(reviewResult.reviewId);

      assert.strictEqual(reviewResult.pointsEarned, 300);
      assert.strictEqual(reviewResult.rating, 5);

      // Verify DB record in reviews
      const revDb = await query(`SELECT * FROM reviews WHERE id = @id`, { id: reviewResult.reviewId });
      assert.strictEqual(revDb.recordset.length, 1);
      assert.strictEqual(revDb.recordset[0].points_earned, 300);

      // Verify review_media
      const mediaDb = await query(`SELECT * FROM review_media WHERE review_id = @revId`, { revId: reviewResult.reviewId });
      assert.strictEqual(mediaDb.recordset.length, 2);

      // Verify wallet updated
      const updatedWallet = await loyaltyService.getOrCreateWallet(user1.id);
      assert.strictEqual(updatedWallet.available_points, startBalance + 300);

      // Verify ledger transaction
      const txDb = await query(`
        SELECT TOP 1 * FROM point_transactions
        WHERE user_id = @userId AND transaction_type = 'REVIEW_REWARD'
        ORDER BY id DESC
      `, { userId: user1.id });
      assert.strictEqual(txDb.recordset.length, 1);
      assert.strictEqual(txDb.recordset[0].amount, 300);
    });

    await asyncTest('REV-SUB-02: Duplicate review on same (order_id, product_id) is blocked', async () => {
      await assert.rejects(
        async () => {
          await reviewService.createReview({
            userId: user1.id,
            orderId: testOrder.id,
            productId: testVariant.product_id,
            rating: 4,
            comment: 'Cố tình đánh giá lần hai để lấy điểm',
          });
        },
        /đã gửi đánh giá cho sản phẩm này/
      );
    });

    // -------------------------------------------------------------
    // SECTION 5: VOUCHER REDEMPTION & CONCURRENCY PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- 5. VOUCHER REDEMPTION & ANTI-DOUBLE-SPENDING ---');

    await asyncTest('RED-01: Inactive rule cannot be redeemed', async () => {
      // Rule 6: Vớ Nano Bạc is_active = 0
      const inactiveRule = await query(`SELECT TOP 1 id FROM point_reward_rules WHERE is_active = 0`);
      if (inactiveRule.recordset.length > 0) {
        await assert.rejects(
          async () => {
            await loyaltyService.redeemVoucher(user1.id, inactiveRule.recordset[0].id);
          },
          /tạm đóng hoặc chưa khả dụng|quà tặng vật lý/
        );
      }
    });

    await asyncTest('RED-02: Insufficient points rejects redemption cleanly without deducting points', async () => {
      // Find rule requiring 1000 points
      const bigRule = await query(`SELECT TOP 1 id, points_required FROM point_reward_rules WHERE points_required >= 1000 AND is_active = 1`);
      if (bigRule.recordset.length > 0) {
        // Ensure user balance is less than required via ledger-safe fixture helper
        await setWalletBalanceFixture(user1.id, 100, 'RED-02: Points below required');
        const currentWallet = await loyaltyService.getOrCreateWallet(user1.id);

        await assert.rejects(
          async () => {
            await loyaltyService.redeemVoucher(user1.id, bigRule.recordset[0].id);
          },
          /Số dư điểm không đủ/
        );

        // Verify balance did not change
        const walletAfter = await loyaltyService.getOrCreateWallet(user1.id);
        assert.strictEqual(walletAfter.available_points, currentWallet.available_points);
      }
    });

    await asyncTest('RED-03: Sufficient points creates personal voucher, ledger entry, and decrements balance', async () => {
      // Rule 1: Voucher 30.000đ (500 pts)
      const ruleRes = await query(`SELECT TOP 1 id, points_required, discount_value FROM point_reward_rules WHERE id = 1 AND is_active = 1`);
      const rule = ruleRes.recordset[0];
      assert.ok(rule, 'Rule 1 must exist');

      // Ensure user has at least points_required + 200 via ledger-safe fixture helper
      await setWalletBalanceFixture(user1.id, rule.points_required + 200, 'RED-03: Points for redemption');

      const balanceBefore = (await loyaltyService.getOrCreateWallet(user1.id)).available_points;
      const redeemRes = await loyaltyService.redeemVoucher(user1.id, rule.id);
      if (redeemRes.voucherId) trackedFixtures.voucherIds.push(redeemRes.voucherId);
      if (redeemRes.redemptionId) trackedFixtures.redemptionIds.push(redeemRes.redemptionId);

      assert.ok(redeemRes.voucherCode.startsWith('VAMOSCLUB-'));
      assert.strictEqual(redeemRes.pointsSpent, rule.points_required);

      // Verify wallet balance decremented
      const walletAfter = await loyaltyService.getOrCreateWallet(user1.id);
      assert.strictEqual(walletAfter.available_points, balanceBefore - rule.points_required);

      // Verify voucher in vouchers table
      const voucherDb = await query(`SELECT * FROM vouchers WHERE code = @code`, { code: redeemRes.voucherCode });
      assert.strictEqual(voucherDb.recordset.length, 1);
      assert.strictEqual(voucherDb.recordset[0].usage_limit, 1);

      // Verify redemption record
      const redDb = await query(`SELECT * FROM voucher_redemptions WHERE id = @id`, { id: redeemRes.redemptionId });
      assert.strictEqual(redDb.recordset[0].status, 'AVAILABLE');
      assert.strictEqual(redDb.recordset[0].user_id, user1.id);
    });

    await asyncTest('RED-04: Concurrency Race Condition Test - Anti-Double-Spending', async () => {
      const ruleRes = await query(`SELECT TOP 1 id, points_required FROM point_reward_rules WHERE id = 1 AND is_active = 1`);
      const rule = ruleRes.recordset[0];

      // Set wallet balance to exactly rule.points_required via ledger-safe fixture helper
      await setWalletBalanceFixture(user1.id, rule.points_required, 'RED-04: Points for race condition test');

      // Fire 2 concurrent redemption requests
      const results = await Promise.allSettled([
        loyaltyService.redeemVoucher(user1.id, rule.id),
        loyaltyService.redeemVoucher(user1.id, rule.id)
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      for (const res of fulfilled) {
        if (res.value?.voucherId) trackedFixtures.voucherIds.push(res.value.voucherId);
        if (res.value?.redemptionId) trackedFixtures.redemptionIds.push(res.value.redemptionId);
      }

      assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent request must succeed');
      assert.strictEqual(rejected.length, 1, 'Exactly one concurrent request must be rejected');
      assert.ok(rejected[0].reason.message.includes('Số dư điểm không đủ'));

      // Check balance is exactly 0, NEVER negative
      const finalWallet = await loyaltyService.getOrCreateWallet(user1.id);
      assert.strictEqual(finalWallet.available_points, 0, 'Wallet balance must be exactly 0, never negative');
    });

    // -------------------------------------------------------------
    // SECTION 6: VOUCHER CHECKOUT PROTECTION & LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n--- 6. VOUCHER CHECKOUT PROTECTION & ORDER LIFECYCLE ---');

    // Give user1 points and redeem a fresh voucher via ledger-safe fixture helper
    const ruleRes = await query(`SELECT TOP 1 id, points_required FROM point_reward_rules WHERE id = 1 AND is_active = 1`);
    const rule = ruleRes.recordset[0];
    await setWalletBalanceFixture(user1.id, rule.points_required, 'SEC-6: Points for checkout voucher');
    const freshVoucher = await loyaltyService.redeemVoucher(user1.id, rule.id);
    if (freshVoucher.voucherId) trackedFixtures.voucherIds.push(freshVoucher.voucherId);
    if (freshVoucher.redemptionId) trackedFixtures.redemptionIds.push(freshVoucher.redemptionId);

    // Ensure user2 has a cart with an item
    let cartRes = await query(`SELECT id FROM carts WHERE user_id = @userId`, { userId: user2.id });
    let cartId = cartRes.recordset[0] ? cartRes.recordset[0].id : null;
    if (!cartId) {
      const newCart = await query(`INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@userId)`, { userId: user2.id });
      cartId = newCart.recordset[0].id;
    }
    trackedFixtures.cartIds.push(cartId);
    await query(`
      IF NOT EXISTS (SELECT 1 FROM cart_items WHERE cart_id = @cartId AND variant_id = @varId)
      BEGIN
        INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@cartId, @varId, 1);
      END
    `, { cartId, varId: testVariant.variant_id });

    await asyncTest('CHK-01: Other customer cannot checkout with personal redeemed voucher', async () => {
      await assert.rejects(
        async () => {
          await orderService.createCodOrder({
            userId: user2.id, // User 2 trying to use User 1's voucher
            voucherCode: freshVoucher.voucherCode,
            recipientName: 'User 2',
            recipientPhone: '0987654321',
            deliveryAddress: '456 Phố Huế, Hoàn Kiếm, Hà Nội'
          });
        },
        /không hợp lệ hoặc không áp dụng được cho tài khoản/
      );
    });

    await asyncTest('CHK-02: Owner can checkout with voucher, voucher is marked USED, and cancellation restores it to AVAILABLE', async () => {
      // Ensure user1 has a cart with an item
      let cart1Res = await query(`SELECT id FROM carts WHERE user_id = @userId`, { userId: user1.id });
      let cart1Id = cart1Res.recordset[0] ? cart1Res.recordset[0].id : null;
      if (!cart1Id) {
        const newCart1 = await query(`INSERT INTO carts (user_id) OUTPUT INSERTED.id VALUES (@userId)`, { userId: user1.id });
        cart1Id = newCart1.recordset[0].id;
      }
      trackedFixtures.cartIds.push(cart1Id);
      await query(`
        IF NOT EXISTS (SELECT 1 FROM cart_items WHERE cart_id = @cartId AND variant_id = @varId)
        BEGIN
          INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@cartId, @varId, 1);
        END
      `, { cartId: cart1Id, varId: testVariant.variant_id });

      // Checkout with freshVoucher
      const newOrder = await orderService.createCodOrder({
        userId: user1.id,
        voucherCode: freshVoucher.voucherCode,
        recipientName: 'User 1',
        recipientPhone: '0912345678',
        deliveryAddress: '123 Lê Lợi, Bến Nghé, Q1, HCM'
      });

      assert.ok(newOrder.orderId);
      trackedFixtures.orderIds.push(newOrder.orderId);

      // Verify voucher_redemptions is marked USED
      const redUsed = await query(`SELECT status, used_at FROM voucher_redemptions WHERE voucher_id = @vId`, { vId: freshVoucher.voucherId });
      assert.strictEqual(redUsed.recordset[0].status, 'USED');
      assert.ok(redUsed.recordset[0].used_at !== null);

      // Now cancel order
      await orderService.cancelOrder(newOrder.orderId, user1.id, 'Đổi ý không mua nữa');

      // Verify voucher_redemptions is restored to AVAILABLE
      const redRestored = await query(`SELECT status, used_at FROM voucher_redemptions WHERE voucher_id = @vId`, { vId: freshVoucher.voucherId });
      assert.strictEqual(redRestored.recordset[0].status, 'AVAILABLE');
      assert.strictEqual(redRestored.recordset[0].used_at, null);
    });

    // -------------------------------------------------------------
    // SECTION 7: ORDER PURCHASE 3% POINTS & IDEMPOTENCY
    // -------------------------------------------------------------
    console.log('\n--- 7. ORDER PURCHASE 3% POINTS & IDEMPOTENCY ---');

    await asyncTest('ORD-PUR-01: 3% points credited on subtotal - discount (excluding shipping)', async () => {
      // subtotal: 1,000,000, discount: 100,000 -> eligible: 900,000 -> 3% = 27,000 points
      const walletPre = await loyaltyService.getOrCreateWallet(user1.id);
      const preBalance = walletPre.available_points;

      const result = await loyaltyService.awardOrderPurchasePoints(testOrder.id);
      assert.strictEqual(result.pointsAwarded, 27000);

      const walletPost = await loyaltyService.getOrCreateWallet(user1.id);
      assert.strictEqual(walletPost.available_points, preBalance + 27000);
    });

    await asyncTest('ORD-PUR-02: Repeated award call is idempotent (zero extra points)', async () => {
      const walletPre = await loyaltyService.getOrCreateWallet(user1.id);

      const repeatResult = await loyaltyService.awardOrderPurchasePoints(testOrder.id);
      assert.strictEqual(repeatResult.idempotent, true);
      assert.strictEqual(repeatResult.pointsAwarded, 0);

      const walletPost = await loyaltyService.getOrCreateWallet(user1.id);
      assert.strictEqual(walletPost.available_points, walletPre.available_points);
    });

    // -------------------------------------------------------------
    // SECTION 8: PRODUCT REVIEWS AGGREGATION
    // -------------------------------------------------------------
    console.log('\n--- 8. PRODUCT REVIEWS AGGREGATION & BREAKDOWN ---');

    await asyncTest('PROD-REV-01: Correctly aggregates product reviews and star statistics', async () => {
      const revData = await loyaltyService.getProductReviews(testVariant.product_id);
      assert.ok(revData.summary);
      assert.ok(revData.summary.totalReviews >= 1);
      assert.ok(revData.summary.avgRating >= 1 && revData.summary.avgRating <= 5);
      assert.ok(revData.reviews.length >= 1);
      assert.ok(revData.reviews[0].media);
    });

    // -------------------------------------------------------------
    // SECTION 9: UPLOAD CLEANUP & VOUCHER SECURITY VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- 9. UPLOAD CLEANUP & VOUCHER SECURITY AUDIT ---');

    async function assertRejectedReviewCleansTempFile(tempPrefix, buildReviewInput, expectedError, cleanupAssertMsg) {
      const tempFilename = `${tempPrefix}_${Date.now()}.jpg`;
      const tempPath = path.join(uploadDir, tempFilename);
      fs.writeFileSync(tempPath, Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])); // Valid JPEG header
      assert.ok(fs.existsSync(tempPath), 'Temp file must exist before test');

      await assert.rejects(
        async () => {
          await reviewService.createReview(buildReviewInput(tempFilename, tempPath));
        },
        expectedError
      );

      assert.strictEqual(fs.existsSync(tempPath), false, cleanupAssertMsg);
    }

    await asyncTest('CLEANUP-01: Validation failure cleanly deletes uploaded temp files from disk', async () => {
      await assertRejectedReviewCleansTempFile(
        'test_temp_val',
        (tempFilename, tempPath) => ({
          userId: user1.id,
          orderId: testOrder.id,
          productId: testVariant.product_id,
          rating: 99, // Invalid rating triggers validation failure
          comment: 'Test cleanup',
          mediaFiles: [{ filename: tempFilename, path: tempPath, size: 4 }]
        }),
        /Đánh giá số sao bắt buộc từ 1 đến 5 sao/,
        'Temp file must be deleted upon validation error'
      );
    });

    await asyncTest('CLEANUP-02: Duplicate review rejection cleans up newly uploaded files', async () => {
      await assertRejectedReviewCleansTempFile(
        'test_temp_dup',
        (tempFilename, tempPath) => ({
          userId: user1.id,
          orderId: testOrder.id,
          productId: testVariant.product_id,
          rating: 5,
          comment: 'Attempt duplicate review with photo',
          mediaFiles: [{ filename: tempFilename, path: tempPath, size: 4 }]
        }),
        /Mỗi sản phẩm trong một đơn hàng chỉ được nhận thưởng đánh giá 1 lần/,
        'Temp file must be deleted on duplicate review rejection'
      );
    });

    test('CLEANUP-03: Magic bytes inspection accepts authentic images and rejects executables', () => {
      // 1. Genuine JPEG
      const jpegFile = path.join(uploadDir, `test_sig_jpeg_${Date.now()}.jpg`);
      fs.writeFileSync(jpegFile, Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]));
      assert.strictEqual(isAuthenticImage(jpegFile), true);
      cleanupUploadedFiles([jpegFile]);

      // 2. Genuine PNG
      const pngFile = path.join(uploadDir, `test_sig_png_${Date.now()}.png`);
      fs.writeFileSync(pngFile, Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]));
      assert.strictEqual(isAuthenticImage(pngFile), true);
      cleanupUploadedFiles([pngFile]);

      // 3. Genuine WebP
      const webpFile = path.join(uploadDir, `test_sig_webp_${Date.now()}.webp`);
      const webpBuf = Buffer.alloc(12);
      webpBuf.write('RIFF', 0, 'ascii');
      webpBuf.write('WEBP', 8, 'ascii');
      fs.writeFileSync(webpFile, webpBuf);
      assert.strictEqual(isAuthenticImage(webpFile), true);
      cleanupUploadedFiles([webpFile]);

      // 4. Fake image / Script disguised as .jpg
      const fakeFile = path.join(uploadDir, `test_sig_fake_${Date.now()}.jpg`);
      fs.writeFileSync(fakeFile, Buffer.from('<?php echo "evil shell"; ?>'));
      assert.strictEqual(isAuthenticImage(fakeFile), false);
      cleanupUploadedFiles([fakeFile]);
    });

    test('SEC-VOUCH-01: Voucher code 16-byte cryptographic entropy (42 chars, format VAMOSCLUB-[HEX32])', () => {
      assert.strictEqual(freshVoucher.voucherCode.length, 42);
      assert.match(freshVoucher.voucherCode, /^VAMOSCLUB-[0-9A-F]{32}$/);
    });

    test('SEC-VOUCH-02: Sliding window rate limiter enforces maximum failed voucher attempts', () => {
      const testKey = `test_ratelimit_${Date.now()}`;
      assert.strictEqual(voucherLimiter.isLimited(testKey), false);

      // Record 4 failed attempts
      for (let i = 0; i < 4; i++) {
        voucherLimiter.recordAttempt(testKey);
        assert.strictEqual(voucherLimiter.isLimited(testKey), false);
      }

      // 5th attempt hits the limit
      voucherLimiter.recordAttempt(testKey);
      assert.strictEqual(voucherLimiter.isLimited(testKey), true, '5 failed attempts in 60s must be rate-limited');

      // Reset works
      voucherLimiter.reset(testKey);
      assert.strictEqual(voucherLimiter.isLimited(testKey), false);
    });

    console.log('\n===============================================================');
    console.log(`[LOYALTY TEST SUITE]: ALL ${passed}/${total} TESTS PASSED PERFECTLY!`);
    console.log('===============================================================\n');

  } finally {
    // -------------------------------------------------------------
    // TEARDOWN & FIXTURE CLEANUP (Strict Foreign Key Ordering)
    // -------------------------------------------------------------
    console.log('\n--- TEARDOWN: CLEANING UP ISOLATED TEST FIXTURES ---');
    let teardownFailure = null;
    try {
      // 1. voucher_usages
      if (trackedFixtures.orderIds.length > 0 || trackedFixtures.voucherIds.length > 0 || trackedFixtures.userIds.length > 0) {
        const oIds = trackedFixtures.orderIds.filter(Boolean);
        const vIds = trackedFixtures.voucherIds.filter(Boolean);
        const uIds = trackedFixtures.userIds.filter(Boolean);
        const conditions = [];
        if (oIds.length) conditions.push(`order_id IN (${oIds.join(',')})`);
        if (vIds.length) conditions.push(`voucher_id IN (${vIds.join(',')})`);
        if (uIds.length) conditions.push(`user_id IN (${uIds.join(',')})`);
        if (conditions.length) {
          await query(`DELETE FROM voucher_usages WHERE ${conditions.join(' OR ')}`);
        }
      }

      // 2. voucher_redemptions
      if (trackedFixtures.redemptionIds.length > 0 || trackedFixtures.voucherIds.length > 0 || trackedFixtures.userIds.length > 0) {
        const rIds = trackedFixtures.redemptionIds.filter(Boolean);
        const vIds = trackedFixtures.voucherIds.filter(Boolean);
        const uIds = trackedFixtures.userIds.filter(Boolean);
        const conditions = [];
        if (rIds.length) conditions.push(`id IN (${rIds.join(',')})`);
        if (vIds.length) conditions.push(`voucher_id IN (${vIds.join(',')})`);
        if (uIds.length) conditions.push(`user_id IN (${uIds.join(',')})`);
        if (conditions.length) {
          await query(`DELETE FROM voucher_redemptions WHERE ${conditions.join(' OR ')}`);
        }
      }

      // 3. review_media
      if (trackedFixtures.reviewIds.length > 0) {
        const revIds = trackedFixtures.reviewIds.filter(Boolean);
        if (revIds.length) {
          await query(`DELETE FROM review_media WHERE review_id IN (${revIds.join(',')})`);
        }
      }

      // 4. reviews
      if (trackedFixtures.reviewIds.length > 0 || trackedFixtures.userIds.length > 0 || trackedFixtures.orderIds.length > 0) {
        const revIds = trackedFixtures.reviewIds.filter(Boolean);
        const uIds = trackedFixtures.userIds.filter(Boolean);
        const oIds = trackedFixtures.orderIds.filter(Boolean);
        const conditions = [];
        if (revIds.length) conditions.push(`id IN (${revIds.join(',')})`);
        if (uIds.length) conditions.push(`user_id IN (${uIds.join(',')})`);
        if (oIds.length) conditions.push(`order_id IN (${oIds.join(',')})`);
        if (conditions.length) {
          await query(`DELETE FROM reviews WHERE ${conditions.join(' OR ')}`);
        }
      }

      // 5. order_items & order_status_histories & orders
      if (trackedFixtures.orderIds.length > 0) {
        const oIds = trackedFixtures.orderIds.filter(Boolean);
        if (oIds.length) {
          await query(`DELETE FROM order_items WHERE order_id IN (${oIds.join(',')})`);
          await query(`DELETE FROM order_status_histories WHERE order_id IN (${oIds.join(',')})`);
          await query(`DELETE FROM orders WHERE id IN (${oIds.join(',')})`);
        }
      }

      // 6. vouchers (only test vouchers created in this run)
      if (trackedFixtures.voucherIds.length > 0) {
        const vIds = trackedFixtures.voucherIds.filter(Boolean);
        if (vIds.length) {
          await query(`DELETE FROM vouchers WHERE id IN (${vIds.join(',')})`);
        }
      }

      // 7. loyalty_point_batches, point_transactions & user_points_wallets
      if (trackedFixtures.userIds.length > 0) {
        const uIds = trackedFixtures.userIds.filter(Boolean);
        if (uIds.length) {
          await query(`DELETE FROM loyalty_point_batches WHERE user_id IN (${uIds.join(',')})`);
          await query(`DELETE FROM point_transactions WHERE user_id IN (${uIds.join(',')})`);
          await query(`DELETE FROM user_points_wallets WHERE user_id IN (${uIds.join(',')})`);
        }
      }

      // 8. cart_items & carts
      if (trackedFixtures.cartIds.length > 0 || trackedFixtures.userIds.length > 0) {
        const cIds = trackedFixtures.cartIds.filter(Boolean);
        const uIds = trackedFixtures.userIds.filter(Boolean);
        if (cIds.length) {
          await query(`DELETE FROM cart_items WHERE cart_id IN (${cIds.join(',')})`);
        }
        const cartConditions = [];
        if (cIds.length) cartConditions.push(`id IN (${cIds.join(',')})`);
        if (uIds.length) cartConditions.push(`user_id IN (${uIds.join(',')})`);
        if (cartConditions.length) {
          await query(`DELETE FROM carts WHERE ${cartConditions.join(' OR ')}`);
        }
      }

      // 9. inventory_transactions (created during order placement/cancellation for test users)
      if (trackedFixtures.userIds.length > 0) {
        const uIds = trackedFixtures.userIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0);
        if (uIds.length) {
          await query(`DELETE FROM inventory_transactions WHERE user_id IN (${uIds.join(',')})`);
        }
      }

      // 10. users (only test users created in this run)
      if (trackedFixtures.userIds.length > 0) {
        const uIds = trackedFixtures.userIds.filter(Boolean);
        if (uIds.length) {
          await query(`DELETE FROM users WHERE id IN (${uIds.join(',')})`);
        }
      }

      console.log('  ✔ Teardown completed: Isolated fixtures purged successfully.');
    } catch (cleanupErr) {
      console.error('  ✖ [CRITICAL TEARDOWN FAILURE] Error during fixture teardown:', cleanupErr.message);
      teardownFailure = cleanupErr;
    } finally {
      await closePool();
      if (teardownFailure) {
        throw new Error(`[LOYALTY TEST ABORT] Fixture cleanup failed: ${teardownFailure.message}`);
      }
    }
  }
}

if (require.main === module) {
  runLoyaltyTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[LOYALTY TEST FAILED]:', err);
      process.exit(1);
    });
}

module.exports = { runLoyaltyTests };
