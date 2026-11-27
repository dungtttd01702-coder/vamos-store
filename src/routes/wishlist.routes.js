const express = require('express');
const router = express.Router();
const { requireCustomer } = require('../middlewares/auth.middleware');
const wishlistController = require('../controllers/wishlist.controller');

// Enforce Customer role & session authentication for all wishlist endpoints
router.use(requireCustomer);

// GET /api/wishlist - Retrieve customer wishlist
router.get('/', (req, res) => wishlistController.getWishlist(req, res));

// POST /api/wishlist/items - Add item
router.post('/items', (req, res) => wishlistController.addItem(req, res));

// POST /api/wishlist/toggle - Toggle item (convenient 1-click action)
router.post('/toggle', (req, res) => wishlistController.toggleItem(req, res));

// DELETE /api/wishlist/items/:productId - Remove single item
router.delete('/items/:productId', (req, res) => wishlistController.removeItem(req, res));

// DELETE /api/wishlist - Clear all items
router.delete('/', (req, res) => wishlistController.clearWishlist(req, res));

// POST /api/wishlist/migrate - One-time migration of legacy customer items
router.post('/migrate', (req, res) => wishlistController.migrateLegacy(req, res));

module.exports = router;
