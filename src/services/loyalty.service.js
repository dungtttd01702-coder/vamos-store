const crypto = require('crypto');
const sql = require('mssql');
const { query, getPool } = require('../config/database');

const TIER_THRESHOLDS = {
  MEMBER: { name: 'VAMOS Member', min: 0, next: 'SILVER', nextMin: 1000, icon: '🥉' },
  SILVER: { name: 'VAMOS Silver', min: 1000, next: 'GOLD', nextMin: 2500, icon: '🥈' },
  GOLD: { name: 'VAMOS Gold', min: 2500, next: 'VIP', nextMin: 5000, icon: '🥇' },
  VIP: { name: 'VAMOS VIP Elite', min: 5000, next: null, nextMin: null, icon: '👑' }
};

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
   * Determine Tier Code based on Lifetime Earned Points
   */
  calculateTier(lifetimeEarnedPoints) {
    const points = Number(lifetimeEarnedPoints) || 0;
    if (points >= 5000) return 'VIP';
    if (points >= 2500) return 'GOLD';
    if (points >= 1000) return 'SILVER';
    return 'MEMBER';
  }

  /**
   * Get detailed tier metrics and progression for UI
   */
  getTierMetrics(tierCodeOrPoints, lifetimeEarnedPoints) {
    let currentCode = 'MEMBER';
    let points = 0;

    if (typeof tierCodeOrPoints === 'number') {
      points = tierCodeOrPoints;
      currentCode = this.calculateTier(points);
    } else {
      currentCode = tierCodeOrPoints && TIER_THRESHOLDS[tierCodeOrPoints] ? tierCodeOrPoints : 'MEMBER';
      points = Number(lifetimeEarnedPoints) || 0;
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
      lifetimePoints: points,
      progressPercent,
      progressPercentage: progressPercent,
      pointsNeeded,
      pointsToNextTier: pointsNeeded,
      nextTierName
    };
  }

  /**
   * Get or initialize a customer's points wallet
   */
  async getOrCreateWallet(userId, transaction = null) {
    const runner = transaction ? new sql.Request(transaction) : { query: (q, p) => query(q, p) };
    
    // Check existing wallet
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

    // Initialize wallet atomically with error handling for concurrent initialization
    if (transaction) {
      const initReq = new sql.Request(transaction);
      initReq.input('userId', userId);
      await initReq.query(`
        BEGIN TRY
          IF NOT EXISTS (SELECT 1 FROM user_points_wallets WITH (UPDLOCK, HOLDLOCK) WHERE user_id = @userId)
          BEGIN
            INSERT INTO user_points_wallets (user_id, available_points, lifetime_earned_points, lifetime_redeemed_points, tier_code)
            VALUES (@userId, 0, 0, 0, 'MEMBER');
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
    } else {
      await query(`
        BEGIN TRY
          IF NOT EXISTS (SELECT 1 FROM user_points_wallets WITH (UPDLOCK, HOLDLOCK) WHERE user_id = @userId)
          BEGIN
            INSERT INTO user_points_wallets (user_id, available_points, lifetime_earned_points, lifetime_redeemed_points, tier_code)
            VALUES (@userId, 0, 0, 0, 'MEMBER');
          END
        END TRY
        BEGIN CATCH
          -- Safe ignore concurrent duplicate insert
        END CATCH
      `, { userId });
      const newWallet = await query(`SELECT * FROM user_points_wallets WHERE user_id = @userId`, { userId });
      return newWallet.recordset[0];
    }
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

    let points = 100; // Base: 100 points for star rating

    // Check comment >= 50 characters OR at least 1 valid quick tag
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

    // Check media
    if (hasMedia) {
      points += 100;
    }

    return Math.min(300, Math.max(100, points));
  }

  /**
   * Award Review Points atomically within a transaction
   */
  async awardReviewPoints(transaction, { userId, reviewId, orderId, productId, pointsEarned }) {
    // 1. Lock or create wallet
    const wallet = await this.getOrCreateWallet(userId, transaction);

    const newAvailable = wallet.available_points + pointsEarned;
    const newLifetime = wallet.lifetime_earned_points + pointsEarned;
    const newTier = this.calculateTier(newLifetime);

    // 2. Update wallet
    const updateReq = new sql.Request(transaction);
    updateReq.input('userId', userId);
    updateReq.input('avail', newAvailable);
    updateReq.input('life', newLifetime);
    updateReq.input('tier', newTier);
    await updateReq.query(`
      UPDATE user_points_wallets
      SET available_points = @avail,
          lifetime_earned_points = @life,
          tier_code = @tier,
          updated_at = GETDATE()
      WHERE user_id = @userId
    `);

    // 3. Write immutable ledger record
    const ledgerReq = new sql.Request(transaction);
    ledgerReq.input('userId', userId);
    ledgerReq.input('type', 'REVIEW_REWARD');
    ledgerReq.input('amount', pointsEarned);
    ledgerReq.input('bal', newAvailable);
    ledgerReq.input('refType', 'REVIEW');
    ledgerReq.input('refId', String(reviewId));
    ledgerReq.input('desc', `Thưởng ${pointsEarned} điểm VAMOS Club khi đánh giá sản phẩm đơn hàng #${orderId}`);
    ledgerReq.input('idempotency', `REVIEW_${orderId}_${productId}`);

    await ledgerReq.query(`
      INSERT INTO point_transactions 
      (user_id, transaction_type, amount, balance_after, reference_type, reference_id, description, idempotency_key, created_at)
      VALUES
      (@userId, @type, @amount, @bal, @refType, @refId, @desc, @idempotency, GETDATE())
    `);

    return {
      pointsEarned,
      newBalance: newAvailable,
      tierCode: newTier
    };
  }

  /**
   * Award 3% Order Purchase points when order is COMPLETED & PAID (Idempotent)
   * Supports both (transaction, { orderId, userId, eligibleAmount }) and (orderId)
   */
  async awardOrderPurchasePoints(arg1, arg2) {
    let transaction = null;
    let orderId, userId, eligibleAmount;
    let shouldManageTx = false;

    if (arg1 && typeof arg1.commit === 'function') {
      transaction = arg1;
      orderId = arg2.orderId;
      userId = arg2.userId;
      eligibleAmount = arg2.eligibleAmount;
    } else {
      if (typeof arg1 === 'object' && arg1 !== null) {
        orderId = arg1.orderId;
        userId = arg1.userId;
        eligibleAmount = arg1.eligibleAmount;
      } else {
        orderId = Number(arg1);
      }
      const pool = await getPool();
      transaction = new sql.Transaction(pool);
      await transaction.begin();
      shouldManageTx = true;

      if (!userId || eligibleAmount === undefined) {
        const orderRes = await new sql.Request(transaction)
          .input('oId', orderId)
          .query(`SELECT user_id, subtotal, discount_amount, order_status FROM orders WHERE id = @oId`);
        if (orderRes.recordset.length === 0) {
          await transaction.rollback();
          throw new Error(`Đơn hàng #${orderId} không tồn tại.`);
        }
        const ord = orderRes.recordset[0];
        userId = ord.user_id;
        eligibleAmount = Math.max(0, Number(ord.subtotal || 0) - Number(ord.discount_amount || 0));
      }
    }

    try {
      const eligible = Math.max(0, Number(eligibleAmount) || 0);
      const earnedPoints = Math.floor(eligible * 0.03); // 3% purchase reward rule
      const idempotencyKey = `ORDER_PURCHASE_${orderId}`;

      // Check idempotency: avoid duplicate crediting if already awarded
      const checkReq = new sql.Request(transaction);
      checkReq.input('idem', idempotencyKey);
      const checkRes = await checkReq.query(`
        SELECT id FROM point_transactions WHERE idempotency_key = @idem
      `);

      if (checkRes.recordset.length > 0) {
        if (shouldManageTx) await transaction.commit();
        return { pointsAwarded: 0, idempotent: true };
      }

      if (earnedPoints <= 0) {
        if (shouldManageTx) await transaction.commit();
        return { pointsAwarded: 0, idempotent: false };
      }

      // Lock wallet
      const wallet = await this.getOrCreateWallet(userId, transaction);
      const newAvailable = wallet.available_points + earnedPoints;
      const newLifetime = wallet.lifetime_earned_points + earnedPoints;
      const newTier = this.calculateTier(newLifetime);

      // Update wallet
      const upReq = new sql.Request(transaction);
      upReq.input('userId', userId);
      upReq.input('avail', newAvailable);
      upReq.input('life', newLifetime);
      upReq.input('tier', newTier);
      await upReq.query(`
        UPDATE user_points_wallets
        SET available_points = @avail,
            lifetime_earned_points = @life,
            tier_code = @tier,
            updated_at = GETDATE()
        WHERE user_id = @userId
      `);

      // Insert transaction ledger
      const txReq = new sql.Request(transaction);
      txReq.input('userId', userId);
      txReq.input('type', 'ORDER_PURCHASE');
      txReq.input('amount', earnedPoints);
      txReq.input('bal', newAvailable);
      txReq.input('refType', 'ORDER');
      txReq.input('refId', String(orderId));
      txReq.input('desc', `Tích lũy 3% mua sắm (+${earnedPoints.toLocaleString('vi-VN')} điểm) từ đơn hàng #${orderId}`);
      txReq.input('idem', idempotencyKey);
      await txReq.query(`
        INSERT INTO point_transactions
        (user_id, transaction_type, amount, balance_after, reference_type, reference_id, description, idempotency_key, created_at)
        VALUES
        (@userId, @type, @amount, @bal, @refType, @refId, @desc, @idem, GETDATE())
      `);

      if (shouldManageTx) {
        await transaction.commit();
      }

      return { pointsAwarded: earnedPoints, idempotent: false, earnedPoints };
    } catch (err) {
      if (shouldManageTx) {
        try { await transaction.rollback(); } catch (rbErr) {}
      }
      throw err;
    }
  }

  /**
   * Redeem Points for Voucher with ACID Transaction and Pessimistic Locking
   */
  async redeemVoucher(userId, rewardRuleId) {
    if (!userId) {
      throw new Error('Yêu cầu đăng nhập tài khoản khách hàng để đổi điểm.');
    }
    const ruleId = Number.parseInt(rewardRuleId, 10);
    if (!ruleId) {
      throw new Error('Mã phần thưởng không hợp lệ.');
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Lock and read reward rule
      const ruleReq = new sql.Request(transaction);
      ruleReq.input('ruleId', ruleId);
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

      // 2. Lock and read user points wallet
      const wallet = await this.getOrCreateWallet(userId, transaction);

      if (wallet.available_points < rule.points_required) {
        throw new Error(`Số dư điểm không đủ. Bạn đang có ${wallet.available_points.toLocaleString('vi-VN')} điểm, cần ${rule.points_required.toLocaleString('vi-VN')} điểm để đổi phần thưởng này.`);
      }

      // 3. Generate cryptographically strong, unique, unguessable personal voucher code (16 bytes = 128-bit entropy)
      let voucherCode = null;
      let randomPart = '';
      for (let attempt = 0; attempt < 5; attempt++) {
        randomPart = crypto.randomBytes(16).toString('hex').toUpperCase();
        const candidateCode = `VAMOSCLUB-${randomPart}`;
        const checkReq = new sql.Request(transaction);
        checkReq.input('candidateCode', candidateCode);
        const exists = await checkReq.query(`SELECT 1 FROM vouchers WHERE code = @candidateCode`);
        if (exists.recordset.length === 0) {
          voucherCode = candidateCode;
          break;
        }
      }

      if (!voucherCode) {
        throw new Error('Hệ thống tạm thời không thể khởi tạo mã voucher độc quyền lúc này. Vui lòng thử lại sau.');
      }

      // 4. Create voucher in vouchers table
      const vReq = new sql.Request(transaction);
      vReq.input('code', voucherCode);
      vReq.input('name', `Voucher VAMOS Club - ${rule.title}`);
      vReq.input('discType', rule.discount_type === 'free_shipping' ? 'fixed_amount' : rule.discount_type);
      vReq.input('discVal', rule.discount_value);
      vReq.input('minOrder', rule.min_order_amount);
      vReq.input('maxDisc', rule.max_discount_amount);
      vReq.input('validDays', rule.voucher_valid_days || 30);

      const vRes = await vReq.query(`
        INSERT INTO vouchers 
        (code, name, discount_type, discount_value, min_order_value, max_discount_amount, start_date, end_date, usage_limit, used_count, is_active, created_at)
        OUTPUT INSERTED.id
        VALUES
        (@code, @name, @discType, @discVal, @minOrder, @maxDisc, GETDATE(), DATEADD(day, @validDays, GETDATE()), 1, 0, 1, GETDATE());
      `);

      const voucherId = vRes.recordset[0].id;

      // 5. Create voucher_redemptions record linking user and voucher
      const redReq = new sql.Request(transaction);
      redReq.input('userId', userId);
      redReq.input('ruleId', rule.id);
      redReq.input('voucherId', voucherId);
      redReq.input('pointsSpent', rule.points_required);
      const redRes = await redReq.query(`
        INSERT INTO voucher_redemptions 
        (user_id, reward_rule_id, voucher_id, points_spent, status, redeemed_at, created_at)
        OUTPUT INSERTED.id
        VALUES
        (@userId, @ruleId, @voucherId, @pointsSpent, 'AVAILABLE', GETDATE(), GETDATE())
      `);
      const redemptionId = redRes.recordset[0].id;

      // 6. Deduct available points and update lifetime redeemed points
      const newAvailable = wallet.available_points - rule.points_required;
      const newRedeemed = wallet.lifetime_redeemed_points + rule.points_required;

      const upWalletReq = new sql.Request(transaction);
      upWalletReq.input('userId', userId);
      upWalletReq.input('avail', newAvailable);
      upWalletReq.input('redeemed', newRedeemed);
      await upWalletReq.query(`
        UPDATE user_points_wallets
        SET available_points = @avail,
            lifetime_redeemed_points = @redeemed,
            updated_at = GETDATE()
        WHERE user_id = @userId
      `);

      // 7. Write immutable point_transactions ledger
      const txReq = new sql.Request(transaction);
      txReq.input('userId', userId);
      txReq.input('type', 'VOUCHER_REDEMPTION');
      txReq.input('amount', -rule.points_required);
      txReq.input('bal', newAvailable);
      txReq.input('refType', 'VOUCHER_REDEMPTION');
      txReq.input('refId', String(voucherId));
      txReq.input('desc', `Đổi ${rule.points_required.toLocaleString('vi-VN')} điểm lấy mã giảm giá ${voucherCode} (${rule.title})`);
      txReq.input('idem', `REDEMPTION_${userId}_${ruleId}_${Date.now()}_${randomPart}`);

      await txReq.query(`
        INSERT INTO point_transactions
        (user_id, transaction_type, amount, balance_after, reference_type, reference_id, description, idempotency_key, created_at)
        VALUES
        (@userId, @type, @amount, @bal, @refType, @refId, @desc, @idem, GETDATE())
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
        expiresInDays: rule.voucher_valid_days
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Get all data for VAMOS Club Rewards Center Page
   */
  async getRewardsCenterData(userId) {
    const wallet = await this.getOrCreateWallet(userId);
    const tierMetrics = this.getTierMetrics(wallet.tier_code, wallet.lifetime_earned_points);

    // Active reward rules
    const rulesRes = await query(`
      SELECT * FROM point_reward_rules
      ORDER BY sort_order ASC, points_required ASC
    `);

    // Point transaction history (Latest 30 records)
    const historyRes = await query(`
      SELECT TOP 30 * FROM point_transactions
      WHERE user_id = @userId
      ORDER BY created_at DESC
    `, { userId });

    // Customer's personal redeemed vouchers
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

    return {
      wallet: {
        ...wallet,
        ...tierMetrics
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
    if (!pId) return { summary: { avgRating: 0, totalReviews: 0, starCounts: {} }, reviews: [] };

    // 1. Fetch Approved Reviews
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

    // 2. Fetch Media for these reviews
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

    // 3. Compute Summary Statistics
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
