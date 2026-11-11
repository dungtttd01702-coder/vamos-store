const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

// GET /cart
router.get('/', (req, res, next) => cartController.index(req, res, next));

// POST /cart/add
router.post('/add', (req, res, next) => cartController.addItem(req, res, next));
router.post('/buy-now', (req, res, next) => cartController.addItem(req, res, next));

// POST /cart/update
router.post('/update', (req, res, next) => cartController.updateItem(req, res, next));

// POST /cart/clear
router.post('/clear', (req, res, next) => cartController.clearCart(req, res, next));

// POST /cart/remove
router.post('/remove', (req, res, next) => cartController.removeItem(req, res, next));
router.post('/remove/:itemId', (req, res, next) => cartController.removeItem(req, res, next));

module.exports = router;

