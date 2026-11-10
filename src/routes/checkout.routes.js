const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// All checkout actions require authenticated customer
router.get('/', requireAuth, checkoutController.getCheckout);
router.post('/', requireAuth, checkoutController.postCheckout);
router.get('/success/:orderId', requireAuth, checkoutController.getSuccess);

module.exports = router;

