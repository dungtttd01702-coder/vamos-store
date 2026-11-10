const express = require('express');
const router = express.Router();

const homeRoutes = require('./home.routes');
const productRoutes = require('./product.routes');
const authRoutes = require('./auth.routes');
const cartRoutes = require('./cart.routes');
const checkoutRoutes = require('./checkout.routes');
const accountRoutes = require('./account.routes');
const adminRoutes = require('./admin.routes');
const infoRoutes = require('./info.routes');

// Mount routes
router.use('/', homeRoutes);
router.use('/products', productRoutes);
router.use('/auth', authRoutes);
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/account', accountRoutes);
router.use('/admin', adminRoutes);
router.use('/', infoRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'VAMOS STORE Web Server',
  });
});

module.exports = router;
