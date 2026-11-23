const loyaltyService = require('../services/loyalty.service');
const reviewService = require('../services/review.service');
const { cleanupUploadedFiles } = require('../middlewares/upload.middleware');
const { redeemLimiter } = require('../middlewares/rateLimit.middleware');

class LoyaltyController {
  /**
   * Display VAMOS Club Rewards Center Page
   * GET /account/rewards
   */
  async getRewardsCenter(req, res, next) {
    try {
      const user = req.session.user;
      const data = await loyaltyService.getRewardsCenterData(user.id);

      res.render('pages/account/rewards', {
        title: 'VAMOS Club — Điểm Thưởng & Đổi Voucher | VAMOS STORE',
        activeNav: 'rewards',
        user,
        wallet: data.wallet,
        rewardRules: data.rewardRules,
        history: data.history,
        myVouchers: data.myVouchers,
        successMsg: req.query.success || null,
        errorMsg: req.query.error || null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Redeem Points for Voucher (ACID Transaction)
   * POST /account/rewards/redeem
   */
  async postRedeemVoucher(req, res, next) {
    try {
      const user = req.session.user;
      const { reward_rule_id } = req.body;

      if (!reward_rule_id) {
        throw new Error('Vui lòng chọn phần thưởng cần đổi.');
      }

      const clientKey = `${req.ip || '127.0.0.1'}_${user.id}`;
      if (redeemLimiter.isLimited(clientKey)) {
        throw new Error('Bạn đang thực hiện thao tác đổi thưởng quá nhanh. Vui lòng chờ 1 phút trước khi tiếp tục.');
      }
      redeemLimiter.recordAttempt(clientKey);

      const result = await loyaltyService.redeemVoucher(user.id, reward_rule_id);

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
          success: true,
          message: `Đổi thành công mã giảm giá "${result.voucherCode}". Bạn đã sử dụng ${result.pointsSpent.toLocaleString('vi-VN')} điểm.`,
          data: result
        });
      }

      res.redirect(`/account/rewards?success=${encodeURIComponent(`Đổi thành công mã giảm giá "${result.voucherCode}"!`)}`);
    } catch (err) {
      if (req.files) {
        cleanupUploadedFiles(req.files);
      }
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Đổi phần thưởng không thành công.'
        });
      }
      res.redirect(`/account/rewards?error=${encodeURIComponent(err.message || 'Lỗi đổi phần thưởng.')}`);
    }
  }

  /**
   * Check which items in an order are eligible for review
   * GET /account/orders/:orderId/review-status
   */
  async getOrderReviewStatus(req, res, next) {
    try {
      const user = req.session.user;
      const { orderId } = req.params;

      const data = await reviewService.getOrderEligibleItems(orderId, user.id);
      res.json({
        success: true,
        data
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  /**
   * Submit Product Review & Earn Points
   * POST /account/orders/:orderId/reviews
   */
  async postSubmitReview(req, res, next) {
    try {
      const user = req.session.user;
      const { orderId } = req.params;
      const { product_id, rating, comment, quick_tags } = req.body;
      const mediaFiles = req.files || [];

      const result = await reviewService.createReview({
        userId: user.id,
        orderId,
        productId: product_id,
        rating,
        comment,
        quickTags: quick_tags,
        mediaFiles
      });

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
          success: true,
          message: result.message,
          data: result
        });
      }

      res.redirect(`/account/orders?success=${encodeURIComponent(result.message)}`);
    } catch (err) {
      if (req.files) {
        cleanupUploadedFiles(req.files);
      }
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Gửi đánh giá không thành công.'
        });
      }
      res.redirect(`/account/orders?error=${encodeURIComponent(err.message)}`);
    }
  }

  /**
   * Public API: Get Approved Reviews for a Product
   * GET /api/products/:productId/reviews
   */
  async getProductReviews(req, res, next) {
    try {
      const { productId } = req.params;
      const data = await loyaltyService.getProductReviews(productId);
      res.json({
        success: true,
        data
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
}

module.exports = new LoyaltyController();
