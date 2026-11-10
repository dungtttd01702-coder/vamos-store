const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// All account routes require authentication
router.use(requireAuth);

router.get('/orders', accountController.getOrders);
router.get('/orders/:id', accountController.getOrderDetail);
router.post('/orders/:id/cancel', accountController.postCancelOrder);

router.get('/profile', accountController.getProfile);
router.post('/profile', accountController.postProfile);

router.get('/addresses', accountController.getAddresses);
router.post('/addresses', accountController.postAddAddress);

module.exports = router;

