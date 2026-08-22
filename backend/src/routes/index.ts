import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import profileRoutes from '../modules/auth/profile.routes';
import categoryRoutes from '../modules/catalog/category.routes';
import productRoutes from '../modules/catalog/product.routes';
import wishlistRoutes from '../modules/catalog/wishlist.routes';
import cartRoutes from '../modules/cart/cart.routes';
import orderRoutes from '../modules/order/order.routes';
import paymentRoutes from '../modules/payment/payment.routes';
import sellerRoutes from '../modules/seller/seller.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import mandiRoutes from '../modules/mandi/mandi.routes';
import weatherRoutes from '../modules/weather/weather.routes';
import adminRoutes from '../modules/admin/admin.routes';
import seedCategoryRoutes from '../modules/seedstore/seedCategory.routes';
import seedWishlistRoutes from '../modules/seedstore/seedWishlist.routes';
import seedCartRoutes from '../modules/seedstore/seedCart.routes';
import seedOrderRoutes from '../modules/seedstore/seedOrder.routes';
import seedPaymentRoutes from '../modules/seedstore/seedPayment.routes';
import seedRoutes from '../modules/seedstore/seed.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', profileRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/sellers', sellerRoutes);
router.use('/notifications', notificationRoutes);
router.use('/mandi', mandiRoutes);
router.use('/weather', weatherRoutes);
router.use('/admin', adminRoutes);

// Seed Store — an independent sub-marketplace (own catalog/cart/order/payment).
// The more specific /seeds/* prefixes MUST be registered before the bare
// '/seeds' mount below: Express matches mount prefixes in registration
// order, and '/seeds' alone would otherwise swallow '/seeds/categories' etc.
// (its remainder path 'categories' would get misrouted into seed.routes.ts's
// GET /:slug handler as if "categories" were a seed's slug).
router.use('/seeds/categories', seedCategoryRoutes);
router.use('/seeds/wishlist', seedWishlistRoutes);
router.use('/seeds/cart', seedCartRoutes);
router.use('/seeds/orders', seedOrderRoutes);
router.use('/seeds/payments', seedPaymentRoutes);
router.use('/seeds', seedRoutes);

router.get('/health', (req, res) => res.json({ success: true, message: 'OK', timestamp: new Date().toISOString() }));

export default router;
