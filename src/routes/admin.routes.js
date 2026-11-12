const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middlewares/auth.middleware');

// All admin routes require ADMIN role
router.use(requireAdmin);

// Dashboard (UC-14)
router.get('/', (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', adminController.getDashboard);

// Orders Management (UC-10)
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderDetail);
router.post('/orders/:id/status', adminController.postUpdateOrderStatus);

// Product Catalog Management (UC-12)
router.get('/products', adminController.getProducts);
router.get('/products/create', adminController.getCreateProduct);
router.post('/products/create', adminController.postCreateProduct);
router.get('/products/:id/edit', adminController.getEditProduct);
router.post('/products/:id/edit', adminController.postEditProduct);
router.post('/products/:id/toggle', adminController.postToggleProductStatus);

// Inventory & Stock Adjustment (UC-11)
router.get('/inventory', adminController.getInventory);
router.post('/inventory/adjust', adminController.postAdjustInventory);
router.get('/inventory/history', adminController.getInventoryHistory);

// Categories & Brands Management (UC-12)
router.get('/categories', adminController.getCategories);
router.post('/categories/create', adminController.postCreateCategory);
router.post('/categories/:id/toggle', adminController.postToggleCategory);
router.post('/brands/create', adminController.postCreateBrand);

// Voucher Management (UC-13)
router.get('/vouchers', adminController.getVouchers);
router.get('/vouchers/create', adminController.getCreateVoucher);
router.post('/vouchers/create', adminController.postCreateVoucher);
router.post('/vouchers/:id/toggle', adminController.postToggleVoucher);

// Customer Accounts Management (UC-04 & Admin)
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerDetail);
router.post('/customers/:id/toggle-status', adminController.postToggleCustomerStatus);

// Banners Management
router.get('/banners', adminController.getBanners);
router.post('/banners/create', adminController.postCreateBanner);
router.post('/banners/:id/toggle', adminController.postToggleBanner);
router.post('/banners/:id/delete', adminController.postDeleteBanner);

module.exports = router;
