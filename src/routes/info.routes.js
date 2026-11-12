const express = require('express');
const router = express.Router();
const productService = require('../services/product.service');

// GET /categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await productService.getAllCategories();
    res.render('pages/info/categories', {
      title: 'Tất Cả Danh Mục Sản Phẩm',
      categories,
    });
  } catch (error) {
    next(error);
  }
});

// GET /promotions
router.get('/promotions', async (req, res, next) => {
  try {
    const saleCatalog = await productService.getCatalog({ sale: '1', limit: 12 });
    res.render('pages/info/promotions', {
      title: 'Chương Trình Khuyến Mãi & Ưu Đãi HOT',
      products: saleCatalog.products || [],
      totalSale: saleCatalog.total || 0,
    });
  } catch (error) {
    next(error);
  }
});

// GET /about
router.get('/about', (req, res) => {
  res.render('pages/info/about', {
    title: 'Giới Thiệu Về VAMOS STORE',
  });
});

// GET /policy alias
router.get('/policy', (req, res) => {
  res.redirect('/policies/shipping');
});

// GET /policies/:type
router.get('/policies/:type', (req, res) => {
  const { type } = req.params;
  const normalizedType = type === 'return' ? 'returns' : type;
  const titles = {
    shipping: 'Chính Sách Vận Chuyển & Thanh Toán COD',
    returns: 'Chính Sách Đổi Trả 7 Ngày',
    warranty: 'Chính Sách Bảo Hành Sản Phẩm',
    privacy: 'Chính Sách Bảo Mật Thông Tin Khách Hàng',
  };
  res.render('pages/info/policy', {
    title: titles[normalizedType] || 'Chính Sách Khách Hàng',
    policyType: normalizedType,
  });
});

module.exports = router;

