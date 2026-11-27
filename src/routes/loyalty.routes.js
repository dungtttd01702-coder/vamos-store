const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyalty.controller');
const { requireCustomer } = require('../middlewares/auth.middleware');
const { reviewUploadMiddleware } = require('../middlewares/upload.middleware');

// ==========================================
// CUSTOMER AUTHENTICATED ROUTES
// ==========================================

// Rewards Center Page
router.get('/account/rewards', requireCustomer, loyaltyController.getRewardsCenter);

// Redeem Points for Voucher (ACID Transaction)
router.post('/account/rewards/redeem', requireCustomer, loyaltyController.postRedeemVoucher);

// Check review eligibility for order items
router.get('/account/orders/:orderId/review-status', requireCustomer, loyaltyController.getOrderReviewStatus);

// Submit Product Review & Earn Points (Multipart Upload: max 5 images, max 5MB)
router.post(
  '/account/orders/:orderId/reviews',
  requireCustomer,
  reviewUploadMiddleware,
  loyaltyController.postSubmitReview
);

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// Get Approved Reviews and Summary for a Product
router.get('/api/products/:productId/reviews', loyaltyController.getProductReviews);

module.exports = router;
