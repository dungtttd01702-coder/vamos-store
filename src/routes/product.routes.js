const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

// GET /products - Catalog & Filtering
router.get('/', productController.index);

// GET /products/live-search & /products/api/search - Real-time live search API
router.get('/live-search', productController.liveSearch);
router.get('/api/search', productController.liveSearch);

// GET /products/:slug - Product Detail
router.get('/:slug', productController.detail);

module.exports = router;

