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

router.get('/health', (req, res) => res.json({ success: true, message: 'OK', timestamp: new Date().toISOString() }));

export default router;
