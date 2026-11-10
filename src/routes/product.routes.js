const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

// GET /products - Catalog & Filtering
router.get('/', productController.index);

// GET /products/:slug - Product Detail
router.get('/:slug', productController.detail);

module.exports = router;

