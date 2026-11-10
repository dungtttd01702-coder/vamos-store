const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middlewares/auth.middleware');

// All admin routes require ADMIN role
router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderDetail);
router.post('/orders/:id/status', adminController.postUpdateOrderStatus);

module.exports = router;

