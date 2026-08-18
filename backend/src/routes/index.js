const router = require('express').Router();

router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/users', require('../modules/auth/profile.routes'));
router.use('/categories', require('../modules/catalog/category.routes'));
router.use('/products', require('../modules/catalog/product.routes'));
router.use('/wishlist', require('../modules/catalog/wishlist.routes'));
router.use('/cart', require('../modules/cart/cart.routes'));
router.use('/orders', require('../modules/order/order.routes'));
router.use('/payments', require('../modules/payment/payment.routes'));

router.get('/health', (req, res) => res.json({ success: true, message: 'OK', timestamp: new Date().toISOString() }));

module.exports = router;
