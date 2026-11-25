const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout.controller');
const { requireCustomer } = require('../middlewares/auth.middleware');

// All checkout actions require authenticated customer (Admin cannot checkout)
router.get('/', requireCustomer, checkoutController.getCheckout);
router.post('/', requireCustomer, checkoutController.postCheckout);
router.post('/apply-voucher', requireCustomer, checkoutController.postApplyVoucher);
router.get('/success/:orderId', requireCustomer, checkoutController.getSuccess);

module.exports = router;

