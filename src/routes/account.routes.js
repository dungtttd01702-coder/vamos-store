const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { requireCustomer } = require('../middlewares/auth.middleware');

// All account routes require Customer role (Admin cannot access)
router.use(requireCustomer);

router.get('/orders', accountController.getOrders);
router.get('/orders/:id', accountController.getOrderDetail);
router.post('/orders/:id/cancel', accountController.postCancelOrder);

router.get('/profile', accountController.getProfile);
router.post('/profile', accountController.postProfile);

router.get('/addresses', accountController.getAddresses);
router.post('/addresses', accountController.postAddAddress);

router.get('/wishlist', (req, res, next) => accountController.getWishlist(req, res, next));

module.exports = router;

