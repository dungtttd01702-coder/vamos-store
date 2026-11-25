const crypto = require('crypto');
const sql = require('mssql');
const { query, getPool } = require('../config/database');
const loyaltyCycle = require('../utils/loyaltyCycle');

const TIER_THRESHOLDS = loyaltyCycle.TIER_THRESHOLDS;

const ALLOWED_QUICK_TAGS = new Set([
  'Vừa vặn chuẩn size',
  'Đi đúng size',
  'Chuẩn size',
  'Đế Phylon cực êm',
  'Rất êm chân',
  'Êm chân',
  'Đẹp như hình',
  'Giao hàng nhanh',
  'Chất lượng xuất sắc',
  'Đóng gói cẩn thận'
]);

class LoyaltyService {
  /**
   * Determine Tier Code based on qualifying points (or passed points value)
   */
  calculateTier(pointsInput) {
    return loyaltyCycle.calculateTier(pointsInput);
  }

  /**
   * Get detailed tier metrics and progression for UI
   */
  getTierMetrics(tierCodeOrPoints, cycleQualifyingPoints) {
    let currentCode = 'MEMBER';
    let points = 0;

    if (typeof tierCodeOrPoints === 'number') {
      points = tierCodeOrPoints;
      currentCode = this.calculateTier(points);
    } else {
      currentCode = tierCodeOrPoints && TIER_THRESHOLDS[tierCodeOrPoints] ? tierCodeOrPoints : 'MEMBER';
      points = Number(cycleQualifyingPoints) || 0;
    }

    const cfg = TIER_THRESHOLDS[currentCode];
    let progressPercent = 100;
    let pointsNeeded = 0;
    let nextTierName = null;

    if (cfg.next) {
      const nextCfg = TIER_THRESHOLDS[cfg.next];
      const tierRange = nextCfg.min - cfg.min;
      const progressInTier = Math.max(0, points - cfg.min);
      progressPercent = Math.min(100, Math.round((progressInTier / tierRange) * 100));
      pointsNeeded = Math.max(0, nextCfg.min - points);
      nextTierName = nextCfg.name;
    }

    return {
      tier: currentCode,
      tierCode: currentCode,
      tierName: cfg.name,
      tierIcon: cfg.icon,
      qualifyingPoints: points,
      lifetimePoints: points,
      progressPercent,
      progressPercentage: progressPercent,
      pointsNeeded,
      pointsToNextTier: pointsNeeded,
      nextTierName
    };
  }

  /**
   * Fetch canonical timestamp from SQL Server inside active transaction or pool
   */
  async getDbNow(transaction = null) {
    const runner = transaction ? new sql.Request(transaction) : { query: (q) => query(q) };
    const res = await runner.query('SELECT GETDATE() AS db_now');
    return loyaltyCycle.toUtcDate(res.recordset[0].db_now, 'db_now');
  }

  /**
   * Get or initialize a customer's points wallet (cycle stays NULL/0 until first valid earn tx)
   */
  async getOrCreateWallet(userId, transaction = null) {
    let walletRes;
    if (transaction) {
      const req = new sql.Request(transaction);
      req.input('userId', userId);
      walletRes = await req.query(`
        SELECT * FROM user_points_wallets WITH (UPDLOCK, ROWLOCK)
        WHERE user_id = @userId
      `);
    } else {
      walletRes = await query(`
        SELECT * FROM user_points_wallets
        WHERE user_id = @userId
      `, { userId });
    }

    if (walletRes.recordset.length > 0) {
      return walletRes.recordset[0];
    }

    if (transaction) {
      const initReq = new sql.Request(transaction);
      initReq.input('userId', userId);
      await initReq.query(`
        BEGIN TRY
          IF NOT EXISTS (SELECT 1 FROM user_points_wallets WITH (UPDLOCK, HOLDLOCK) WHERE user_id = @userId)
          BEGIN
            INSERT INTO user_points_wallets
            (user_id, available_points, lifetime_earned_points, lifetime_redeemed_points, tier_code, cycle_anchor_at, cycle_number, cycle_start_at, cycle_end_at, qualifying_points_cycle)
            VALUES (@userId, 0, 0, 0, 'MEMBER', NULL, 0, NULL, NULL, 0);
          END
        END TRY
        BEGIN CATCH
          -- Error 2627 / 2601 is duplicate key; safe to ignore when another concurrent request initialized it
        END CATCH
      `);
      const getReq = new sql.Request(transaction);
      getReq.input('userId', userId);
      const newWallet = await getReq.query(`SELECT * FROM user_points_wallets WITH (UPDLOCK, ROWLOCK) WHERE user_id = @userId`);
      return newWallet.recordset[0];
    }

    await query(`
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM user_points_wallets WITH (UPDLOCK, HOLDLOCK) WHERE user_id = @userId)
        BEGIN
          INSERT INTO user_points_wallets
          (user_id, available_points, lifetime_earned_points, lifetime_redeemed_points, tier_code, cycle_anchor_at, cycle_number, cycle_start_at, cycle_end_at, qualifying_points_cycle)
          VALUES (@userId, 0, 0, 0, 'MEMBER', NULL, 0, NULL, NULL, 0);
        END
      END TRY
      BEGIN CATCH
        -- Safe ignore concurrent duplicate insert
      END CATCH
    `, { userId });
    const newWallet = await query(`SELECT * FROM user_points_wallets WHERE user_id = @userId`, { userId });
    return newWallet.recordset[0];
  }

  /**
   * Calculate Review Points Server-Side strictly
   */
  calculateReviewPoints(arg1, commentArg, quickTagsArg, hasMediaArg) {
    let rating, comment, quickTags, hasMedia;
    if (typeof arg1 === 'object' && arg1 !== null) {
      rating = arg1.rating;
      comment = arg1.comment;
      quickTags = arg1.quickTags;
      hasMedia = Boolean(arg1.hasMedia || (Array.isArray(arg1.files) && arg1.files.length > 0));
    } else {
      rating = arg1;
      comment = commentArg;
      quickTags = quickTagsArg;
      hasMedia = Boolean(hasMediaArg && (Array.isArray(hasMediaArg) ? hasMediaArg.length > 0 : hasMediaArg));
    }

    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Số sao đánh giá phải từ 1 đến 5 sao.');
    }

    let points = 100;

    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';
    const hasSufficientComment = trimmedComment.length >= 50;

    let hasValidTag = false;
    if (Array.isArray(quickTags)) {
      hasValidTag = quickTags.some(t => ALLOWED_QUICK_TAGS.has(String(t).trim()));
    } else if (typeof quickTags === 'string' && quickTags.trim() !== '') {
      try {
        const parsed = JSON.parse(quickTags);
        if (Array.isArray(parsed)) {
          hasValidTag = parsed.some(t => ALLOWED_QUICK_TAGS.has(String(t).trim()));
        }
      } catch (e) {
        hasValidTag = ALLOWED_QUICK_TAGS.has(quickTags.trim());
      }
    }

    if (hasSufficientComment || hasValidTag) {
      points += 100;
    }

    if (hasMedia) {
      points += 100;
    }

    return Math.min(300, Math.max(100, points));
  }

  /**
   * Atomically credit points, write immutable ledger, create 365-day batch, and update cycle/tier.
   */
  async _awardPointsWithBatch(transaction, {
    userId,
    transactionType,
    points,
    referenceType,
    referenceId,
    description,
    idempotencyKey,
    txTimeOverride = null
  }) {
    const txTime = txTimeOverride
      ? loyaltyCycle.toUtcDate(txTimeOverride, 'txTimeOverride')
      : await this.getDbNow(transaction);
    const expiresAt = loyaltyCycle.addDaysUTC(txTime, loyaltyCycle.EXPIRATION_DAYS);

    // 1. Lock or create wallet
    const wallet = await this.getOrCreateWallet(userId, transaction);

    // 2. Apply cycle boundary, soft landing (if overdue), qualifying points, and real-time upgrade
    const cycleState = loyaltyCycle.applyPositiveEarnToWallet(wallet, points, txTime, transactionType);

    const newAvailable = wallet.available_points + points;
    const newLifetime = wallet.lifetime_earned_points + points;

    // 3. Insert immutable ledger record and retrieve transaction_id atomically
    const ledgerReq = new sql.Request(transaction);
    ledgerReq.input('userId', sql.Int, userId);
    ledgerReq.input('type', sql.NVarChar(30), transactionType);
    ledgerReq.input('amount', sql.Int, points);
    ledgerReq.input('bal', sql.Int, newAvailable);
    ledgerReq.input('refType', sql.NVarChar(50), referenceType);
    ledgerReq.input('refId', sql.NVarChar(100), String(referenceId));
    ledgerReq.input('desc', sql.NVarChar(500), description);
    ledgerReq.input('idem', sql.NVarChar(100), idempotencyKey);
    ledgerReq.input('createdAt', sql.DateTime2, txTime);

    const ledgerRes = await ledgerReq.query(`
      INSERT INTO point_transactions
      (user_id, transaction_type, amount, balance_after, reference_type, reference_id, description, idempotency_key, created_at)
      OUTPUT INSERTED.id
      VALUES
      (@userId, @type, @amount, @bal, @refType, @refId, @desc, @idem, @createdAt)
    `);
    const transactionId = ledgerRes.recordset[0].id;

    // 4. Create 365-day expiration point batch linked 1-1 with transaction_id
    const batchReq = new sql.Request(transaction);
    batchReq.input('userId', sql.Int, userId);
    batchReq.input('txId', sql.Int, transactionId);
    batchReq.input('initPts', sql.Int, points);
    batchReq.input('remPts', sql.Int, points);
    batchReq.input('expiresAt', sql.DateTime2, expiresAt);
    batchReq.input('createdAt', sql.DateTime2, txTime);

    const batchRes = await batchReq.query(`
      INSERT INTO loyalty_point_batches
      (user_id, transaction_id, initial_points, remaining_points, expires_at, status, created_at, updated_at)
      OUTPUT INSERTED.id
      VALUES
      (@userId, @txId, @initPts, @remPts, @expiresAt, 'ACTIVE', @createdAt, @createdAt)
    `);
    const batchId = batchRes.recordset[0].id;

    // 5. Update wallet balances, tier, and cycle fields
    const updateReq = new sql.Request(transaction);
    updateReq.input('userId', sql.Int, userId);
    updateReq.input('avail', sql.Int, newAvailable);
    updateReq.input('life', sql.Int, newLifetime);
    updateReq.input('tier', sql.NVarChar(20), cycleState.tier_code);
    updateReq.input('anchorAt', sql.DateTime2, cycleState.cycle_anchor_at);
    updateReq.input('cycleNum', sql.Int, cycleState.cycle_number);
    updateReq.input('cycleStart', sql.DateTime2, cycleState.cycle_start_at);
    updateReq.input('cycleEnd', sql.DateTime2, cycleState.cycle_end_at);
    updateReq.input('qualifying', sql.Int, cycleState.qualifying_points_cycle);
    updateReq.input('updatedAt', sql.DateTime2, txTime);

    await updateReq.query(`
      UPDATE user_points_wallets
      SET available_points = @avail,
          lifetime_earned_points = @life,
          tier_code = @tier,
          cycle_anchor_at = @anchorAt,
          cycle_number = @cycleNum,
          cycle_start_at = @cycleStart,
          cycle_end_at = @cycleEnd,
          qualifying_points_cycle = @qualifying,
          updated_at = @updatedAt
      WHERE user_id = @userId
    `);

    return {
      transactionId,
      batchId,
      newBalance: newAvailable,
      tierCode: cycleState.tier_code,
      cycleNumber: cycleState.cycle_number,
      qualifyingPointsCycle: cycleState.qualifying_points_cycle,
      expiresAt,
      createdAt: txTime
    };
  }

  /**
   * Award Review Points atomically within a transaction
   */
  async awardReviewPoints(transaction, { userId, reviewId, orderId, productId, pointsEarned, txTimeOverride = null }) {
    const idempotencyKey = `REVIEW_${orderId}_${productId}`;
    const checkReq = new sql.Request(transaction);
    checkReq.input('idem', sql.NVarChar(100), idempotencyKey);
    const existing = await checkReq.query('SELECT id FROM point_transactions WHERE idempotency_key = @idem');
    if (existing.recordset.length > 0) {
      const wallet = await this.getOrCreateWallet(userId, transaction);
      return {
        pointsEarned: 0,
        idempotent: true,
        newBalance: wallet.available_points,
        tierCode: wallet.tier_code
      };
    }

    const res = await this._awardPointsWithBatch(transaction, {
      userId,
      transactionType: 'REVIEW_REWARD',
      points: pointsEarned,
      referenceType: 'REVIEW',
      referenceId: String(reviewId),
      description: `Thưởng ${pointsEarned} điểm VAMOS Club khi đánh giá sản phẩm đơn hàng #${orderId}`,
      idempotencyKey,
      txTimeOverride
    });

    return {
      pointsEarned,
      idempotent: false,
      newBalance: res.newBalance,
      tierCode: res.tierCode,
      transactionId: res.transactionId,
      batchId: res.batchId,
      qualifyingPointsCycle: res.qualifyingPointsCycle,
      cycleNumber: res.cycleNumber
    };
  }

  /**
   * Award 3% Order Purchase points when order is COMPLETED & PAID (Idempotent)
   * Supports both (transaction, { orderId, userId, eligibleAmount }) and (orderId)
   */
  async awardOrderPurchasePoints(arg1, arg2 = {}) {
    let transaction = null;
    let orderId, userId, eligibleAmount, txTimeOverride;
    let shouldManageTx = false;

    if (arg1 && typeof arg1.commit === 'function') {
      transaction = arg1;
      orderId = arg2.orderId;
      userId = arg2.userId;
      eligibleAmount = arg2.eligibleAmount;
      txTimeOverride = arg2.txTimeOverride || null;
    } else {
      if (typeof arg1 === 'object' && arg1 !== null) {
        orderId = arg1.orderId;
        userId = arg1.userId;
        eligibleAmount = arg1.eligibleAmount;
        txTimeOverride = arg1.txTimeOverride || null;
      } else {
        orderId = Number(arg1);
        txTimeOverride = arg2.txTimeOverride || null;
      }
      const pool = await getPool();
      transaction = new sql.Transaction(pool);
      await transaction.begin();
      shouldManageTx = true;

      if (!userId || eligibleAmount === undefined) {
        const orderRes = await new sql.Request(transaction)
          .input('oId', orderId)
          .query('SELECT user_id, subtotal, discount_amount, order_status, payment_status FROM orders WHERE id = @oId');
        if (orderRes.recordset.length === 0) {
          await transaction.rollback();
          throw new Error(`Đơn hàng #${orderId} không tồn tại.`);
        }
        const ord = orderRes.recordset[0];
        if (ord.order_status !== 'COMPLETED' || ord.payment_status !== 'PAID') {
          await transaction.rollback();
          throw new Error(`Đơn hàng #${orderId} chưa hoàn tất và thanh toán (COMPLETED/PAID), không đủ điều kiện tích điểm.`);
        }
        userId = ord.user_id;
        eligibleAmount = Math.max(0, Number(ord.subtotal || 0) - Number(ord.discount_amount || 0));
      }
    }

    try {
      const eligible = Math.max(0, Number(eligibleAmount) || 0);
      const earnedPoints = Math.floor(eligible * 0.03);
      const idempotencyKey = `ORDER_PURCHASE_${orderId}`;

      const checkReq = new sql.Request(transaction);
      checkReq.input('idem', sql.NVarChar(100), idempotencyKey);
      const checkRes = await checkReq.query('SELECT id FROM point_transactions WHERE idempotency_key = @idem');

      if (checkRes.recordset.length > 0) {
        if (shouldManageTx) await transaction.commit();
        return { pointsAwarded: 0, idempotent: true };
      }

      if (earnedPoints <= 0) {
        if (shouldManageTx) await transaction.commit();
        return { pointsAwarded: 0, idempotent: false };
      }

      const awardRes = await this._awardPointsWithBatch(transaction, {
        userId,
        transactionType: 'ORDER_PURCHASE',
        points: earnedPoints,
        referenceType: 'ORDER',
        referenceId: String(orderId),
        description: `Tích lũy 3% mua sắm (+${earnedPoints.toLocaleString('vi-VN')} điểm) từ đơn hàng #${orderId}`,
        idempotencyKey,
        txTimeOverride
      });

      if (shouldManageTx) {
        await transaction.commit();
      }

      return {
        pointsAwarded: earnedPoints,
        idempotent: false,
        earnedPoints,
        transactionId: awardRes.transactionId,
        batchId: awardRes.batchId,
        newBalance: awardRes.newBalance,
        tierCode: awardRes.tierCode,
        qualifyingPointsCycle: awardRes.qualifyingPointsCycle,
        cycleNumber: awardRes.cycleNumber
      };
    } catch (err) {
      if (shouldManageTx) {
        try {
          await transaction.rollback();
        } catch (_) {}
      }
      throw err;
    }
  }

  /**
   * Redeem Points for Voucher with ACID Transaction, Pessimistic Locking & FEFO Batch Deduction.
   * All tiers (MEMBER/SILVER/GOLD/VIP) are permitted if points and rule conditions are met.
   */
  async redeemVoucher(userId, rewardRuleId, options = {}) {
    if (!userId) {
      throw new Error('Yêu cầu đăng nhập tài khoản khách hàng để đổi điểm.');
    }
    const ruleId = Number.parseInt(rewardRuleId, 10);
    if (!ruleId || Number.isNaN(ruleId)) {
      throw new Error('Mã phần thưởng không hợp lệ.');
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const nowTs = options.nowOverride
        ? loyaltyCycle.toUtcDate(options.nowOverride, 'nowOverride')
        : await this.getDbNow(transaction);

      const customIdempotencyKey = options.idempotencyKey
        ? String(options.idempotencyKey).trim()
        : null;

      if (customIdempotencyKey) {
        const dupTxReq = new sql.Request(transaction);
        dupTxReq.input('userId', sql.Int, userId);
        dupTxReq.input('idem', sql.NVarChar(100), customIdempotencyKey);
        const dupTxRes = await dupTxReq.query(`
          SELECT pt.reference_id, pt.balance_after, pt.amount,
                 vr.id AS redemption_id, v.code AS voucher_code, v.name AS voucher_name
          FROM point_transactions pt
          LEFT JOIN vouchers v ON TRY_CAST(pt.reference_id AS INT) = v.id
          LEFT JOIN voucher_redemptions vr ON vr.voucher_id = v.id AND vr.user_id = pt.user_id
          WHERE pt.user_id = @userId AND pt.idempotency_key = @idem
        `);
        if (dupTxRes.recordset.length > 0) {
          const existing = dupTxRes.recordset[0];
          await transaction.commit();
          return {
            success: true,
            idempotent: true,
            voucherCode: existing.voucher_code,
            voucherId: Number.parseInt(existing.reference_id, 10),
            redemptionId: existing.redemption_id,
            voucherName: existing.voucher_name,
            pointsSpent: Math.abs(Number(existing.amount || 0)),
            balanceAfter: existing.balance_after,
            fefoDeductions: []
          };
        }
      }

      // 1. Lock and read reward rule
      const ruleReq = new sql.Request(transaction);
      ruleReq.input('ruleId', sql.Int, ruleId);
      const ruleRes = await ruleReq.query(`
        SELECT * FROM point_reward_rules WITH (UPDLOCK, ROWLOCK)
        WHERE id = @ruleId
      `);

      if (ruleRes.recordset.length === 0) {
        throw new Error('Chương trình đổi thưởng này không tồn tại.');
      }

      const rule = ruleRes.recordset[0];
      if (!rule.is_active) {
        throw new Error(`Phần thưởng "${rule.title}" hiện đang tạm đóng hoặc chưa khả dụng đổi điểm.`);
      }

      if (rule.reward_type === 'PHYSICAL_GIFT') {
        throw new Error(`Phần thưởng "${rule.title}" là quà tặng vật lý hiện đang ở trạng thái chuẩn bị mở.`);
      }

      // 2. Lock Hierarchy Step 1: Lock user points wallet FIRST
      const wallet = await this.getOrCreateWallet(userId, transaction);

      // 3. Lock Hierarchy Step 2: Lock ACTIVE & UNEXPIRED point batches of this user ordered FEFO (expires_at ASC, id ASC)
      const batchReq = new sql.Request(transaction);
      batchReq.input('userId', sql.Int, userId);
      batchReq.input('nowTs', sql.DateTime2, nowTs);
      const batchRes = await batchReq.query(`
        SELECT id, user_id, remaining_points, expires_at, status
        FROM loyalty_point_batches WITH (UPDLOCK, ROWLOCK)
        WHERE user_id = @userId
          AND status = 'ACTIVE'
          AND remaining_points > 0
          AND expires_at > @nowTs
        ORDER BY expires_at ASC, id ASC
      `);

      const usableSummary = loyaltyCycle.summarizeUsablePoints(batchRes.recordset, nowTs, wallet.available_points);
      const usableUnexpiredPoints = usableSummary.usablePoints;

      if (wallet.available_points < rule.points_required || usableUnexpiredPoints < rule.points_required) {
        throw new Error(
          `Số dư điểm không đủ (hoặc điểm đã quá hạn 365 ngày). Điểm khả dụng còn hạn hiện có ${usableUnexpiredPoints.toLocaleString('vi-VN')} điểm, cần ${rule.points_required.toLocaleString('vi-VN')} điểm để đổi phần thưởng này.`
        );
      }

      const fefoPlan = loyaltyCycle.planFefoDeduction(batchRes.recordset, rule.points_required, { now: nowTs });

      // Apply FEFO batch updates atomically inside same transaction
      for (const item of fefoPlan.deductions) {
        const upBatchReq = new sql.Request(transaction);
        upBatchReq.input('batchId', sql.Int, item.id);
        upBatchReq.input('userId', sql.Int, userId);
        upBatchReq.input('take', sql.Int, item.take);
        upBatchReq.input('newRemaining', sql.Int, item.newRemaining);
        upBatchReq.input('newStatus', sql.NVarChar(20), item.newStatus);
        upBatchReq.input('nowTs', sql.DateTime2, nowTs);

        const upBatchRes = await upBatchReq.query(`
          UPDATE loyalty_point_batches
          SET remaining_points = @newRemaining,
              status = @newStatus,
              updated_at = @nowTs
          WHERE id = @batchId
            AND user_id = @userId
            AND status = 'ACTIVE'
            AND remaining_points >= @take
            AND expires_at > @nowTs
        `);

        if (!upBatchRes.rowsAffected || upBatchRes.rowsAffected[0] !== 1) {
          throw new Error(`Không thể khấu trừ lô điểm #${item.id}. Giao dịch được hủy an toàn.`);
        }
      }

      // 4. Generate cryptographically strong, unique personal voucher code
      let voucherCode = null;
      let randomPart = '';
      for (let attempt = 0; attempt < 5; attempt++) {
        randomPart = crypto.randomBytes(16).toString('hex').toUpperCase();
        const candidateCode = `VAMOSCLUB-${randomPart}`;
        const checkReq = new sql.Request(transaction);
        checkReq.input('candidateCode', candidateCode);
        const exists = await checkReq.query('SELECT 1 FROM vouchers WHERE code = @candidateCode');
        if (exists.recordset.length === 0) {
          voucherCode = candidateCode;
          break;
        }
      }

      if (!voucherCode) {
        throw new Error('Hệ thống tạm thời không thể khởi tạo mã voucher độc quyền lúc này. Vui lòng thử lại sau.');
      }

      // 5. Create voucher in vouchers table preserving rule discount_type (true free_shipping vs fixed_amount/percentage)
      const vReq = new sql.Request(transaction);
      vReq.input('code', voucherCode);
      vReq.input('name', `Voucher VAMOS Club - ${rule.title}`);
      vReq.input('discType', rule.discount_type || 'fixed_amount');
      vReq.input('discVal', rule.discount_value);
      vReq.input('minOrder', rule.min_order_amount);
      vReq.input('maxDisc', rule.max_discount_amount);
      vReq.input('validDays', rule.voucher_valid_days || 30);
      vReq.input('nowTs', sql.DateTime2, nowTs);

      const vRes = await vReq.query(`
        INSERT INTO vouchers
        (code, name, discount_type, discount_value, min_order_value, max_discount_amount, start_date, end_date, usage_limit, used_count, is_active, created_at)
        OUTPUT INSERTED.id
        VALUES
        (@code, @name, @discType, @discVal, @minOrder, @maxDisc, @nowTs, DATEADD(day, @validDays, @nowTs), 1, 0, 1, @nowTs);
      `);

      const voucherId = vRes.recordset[0].id;

      // 6. Create voucher_redemptions record
      const redReq = new sql.Request(transaction);
      redReq.input('userId', sql.Int, userId);
      redReq.input('ruleId', sql.Int, rule.id);
      redReq.input('voucherId', sql.Int, voucherId);
      redReq.input('pointsSpent', sql.Int, rule.points_required);
      redReq.input('nowTs', sql.DateTime2, nowTs);
      const redRes = await redReq.query(`
        INSERT INTO voucher_redemptions
        (user_id, reward_rule_id, voucher_id, points_spent, status, redeemed_at, created_at)
        OUTPUT INSERTED.id
        VALUES
        (@userId, @ruleId, @voucherId, @pointsSpent, 'AVAILABLE', @nowTs, @nowTs)
      `);
      const redemptionId = redRes.recordset[0].id;

      // 7. Deduct ONLY available_points & update lifetime_redeemed_points (NEVER reduce qualifying_points_cycle)
      const newAvailable = wallet.available_points - rule.points_required;
      const newRedeemed = wallet.lifetime_redeemed_points + rule.points_required;

      const upWalletReq = new sql.Request(transaction);
      upWalletReq.input('userId', sql.Int, userId);
      upWalletReq.input('avail', sql.Int, newAvailable);
      upWalletReq.input('redeemed', sql.Int, newRedeemed);
      upWalletReq.input('updatedAt', sql.DateTime2, nowTs);
      await upWalletReq.query(`
        UPDATE user_points_wallets
        SET available_points = @avail,
            lifetime_redeemed_points = @redeemed,
            updated_at = @updatedAt
        WHERE user_id = @userId
      `);

      // 8. Write immutable point_transactions ledger
      const txReq = new sql.Request(transaction);
      txReq.input('userId', sql.Int, userId);
      txReq.input('type', sql.NVarChar(30), 'VOUCHER_REDEMPTION');
      txReq.input('amount', sql.Int, -rule.points_required);
      txReq.input('bal', sql.Int, newAvailable);
      txReq.input('refType', sql.NVarChar(50), 'VOUCHER_REDEMPTION');
      txReq.input('refId', sql.NVarChar(100), String(voucherId));
      txReq.input('desc', sql.NVarChar(500), `Đổi ${rule.points_required.toLocaleString('vi-VN')} điểm lấy mã giảm giá ${voucherCode} (${rule.title})`);
      const redemptionIdemKey = customIdempotencyKey || `REDEMPTION_${userId}_${ruleId}_${Date.now()}_${randomPart}`;
      txReq.input('idem', sql.NVarChar(100), redemptionIdemKey);
      txReq.input('createdAt', sql.DateTime2, nowTs);

      await txReq.query(`
        INSERT INTO point_transactions
        (user_id, transaction_type, amount, balance_after, reference_type, reference_id, description, idempotency_key, created_at)
        VALUES
        (@userId, @type, @amount, @bal, @refType, @refId, @desc, @idem, @createdAt)
      `);

      await transaction.commit();

      return {
        success: true,
        voucherCode,
        voucherId,
        redemptionId,
        voucherName: rule.title,
        pointsSpent: rule.points_required,
        balanceAfter: newAvailable,
        expiresInDays: rule.voucher_valid_days,
        fefoDeductions: fefoPlan.deductions
      };
    } catch (err) {
      try {
        await transaction.rollback();
      } catch (_) {}
      throw err;
    }
  }

  /**
   * Get all data for VAMOS Club Rewards Center Page
   */
  async getRewardsCenterData(userId, options = {}) {
    const wallet = await this.getOrCreateWallet(userId);
    const nowTs = options.nowOverride
      ? loyaltyCycle.toUtcDate(options.nowOverride, 'nowOverride')
      : await this.getDbNow();
    const cycleQualifying = Number(wallet.qualifying_points_cycle || 0);
    const tierMetrics = this.getTierMetrics(wallet.tier_code, cycleQualifying);

    const rulesRes = await query(`
      SELECT * FROM point_reward_rules
      ORDER BY sort_order ASC, points_required ASC
    `);

    const historyRes = await query(`
      SELECT TOP 30 * FROM point_transactions
      WHERE user_id = @userId
      ORDER BY created_at DESC
    `, { userId });

    const vouchersRes = await query(`
      SELECT
        vr.id AS redemption_id, vr.points_spent, vr.status AS redemption_status, vr.redeemed_at, vr.used_at,
        v.id AS voucher_id, v.code AS voucher_code, v.name AS voucher_name, v.discount_type, v.discount_value,
        v.min_order_value, v.max_discount_amount, v.start_date, v.end_date, v.is_active,
        prr.title AS rule_title, prr.reward_type
      FROM voucher_redemptions vr
      JOIN vouchers v ON vr.voucher_id = v.id
      JOIN point_reward_rules prr ON vr.reward_rule_id = prr.id
      WHERE vr.user_id = @userId
      ORDER BY vr.id DESC
    `, { userId });

    const batchesRes = await query(`
      SELECT id, remaining_points, expires_at, status
      FROM loyalty_point_batches
      WHERE user_id = @userId
        AND status = 'ACTIVE'
        AND remaining_points > 0
        AND expires_at > @nowTs
      ORDER BY expires_at ASC, id ASC
    `, { userId, nowTs });

    const usableSummary = loyaltyCycle.summarizeUsablePoints(batchesRes.recordset, nowTs, wallet.available_points);
    const expiredPendingPoints = Math.max(0, Number(wallet.available_points || 0) - usableSummary.usablePoints);

    return {
      wallet: {
        ...wallet,
        ...tierMetrics,
        usable_points: usableSummary.usablePoints,
        usablePoints: usableSummary.usablePoints,
        expired_pending_points: expiredPendingPoints,
        nextExpiringBatch: usableSummary.nextExpiringBatch
      },
      rewardRules: rulesRes.recordset,
      history: historyRes.recordset,
      myVouchers: vouchersRes.recordset
    };
  }

  /**
   * Get Approved Reviews and Summary Statistics for a Product
   */
  async getProductReviews(productId) {
    const pId = Number.parseInt(productId, 10);
    if (!pId || Number.isNaN(pId)) {
      return { summary: { avgRating: 0, totalReviews: 0, starCounts: {} }, reviews: [] };
    }

    const reviewsRes = await query(`
      SELECT
        r.id, r.rating, r.comment, r.quick_tags, r.points_earned, r.created_at,
        u.full_name AS customer_name,
        SUBSTRING(u.email, 1, 3) + '***' + SUBSTRING(u.email, CHARINDEX('@', u.email), 50) AS masked_email,
        o.order_code
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN orders o ON r.order_id = o.id
      WHERE r.product_id = @productId AND r.status = 'APPROVED'
      ORDER BY r.created_at DESC
    `, { productId: pId });

    const reviews = reviewsRes.recordset;

    if (reviews.length > 0) {
      const reviewIds = reviews.map(r => r.id);
      const mediaRes = await query(`
        SELECT review_id, media_type, media_url, original_filename
        FROM review_media
        WHERE review_id IN (${reviewIds.join(',')})
      `);

      const mediaMap = {};
      for (const m of mediaRes.recordset) {
        if (!mediaMap[m.review_id]) mediaMap[m.review_id] = [];
        mediaMap[m.review_id].push(m);
      }

      for (const r of reviews) {
        r.media = mediaMap[r.id] || [];
        if (r.quick_tags) {
          try {
            r.tagsList = JSON.parse(r.quick_tags);
          } catch (e) {
            r.tagsList = r.quick_tags.split(',').map(s => s.trim()).filter(Boolean);
          }
        } else {
          r.tagsList = [];
        }
      }
    }

    const totalReviews = reviews.length;
    let sumRating = 0;
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const r of reviews) {
      sumRating += r.rating;
      if (starCounts[r.rating] !== undefined) {
        starCounts[r.rating]++;
      }
    }

    const avgRating = totalReviews > 0 ? (sumRating / totalReviews).toFixed(1) : 0;

    return {
      summary: {
        avgRating: Number(avgRating),
        totalReviews,
        starCounts,
        starPercentages: {
          5: totalReviews > 0 ? Math.round((starCounts[5] / totalReviews) * 100) : 0,
          4: totalReviews > 0 ? Math.round((starCounts[4] / totalReviews) * 100) : 0,
          3: totalReviews > 0 ? Math.round((starCounts[3] / totalReviews) * 100) : 0,
          2: totalReviews > 0 ? Math.round((starCounts[2] / totalReviews) * 100) : 0,
          1: totalReviews > 0 ? Math.round((starCounts[1] / totalReviews) * 100) : 0,
        }
      },
      reviews
    };
  }
}

module.exports = new LoyaltyService();
