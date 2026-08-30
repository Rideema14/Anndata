"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const profile_routes_1 = __importDefault(require("../modules/auth/profile.routes"));
const category_routes_1 = __importDefault(require("../modules/catalog/category.routes"));
const product_routes_1 = __importDefault(require("../modules/catalog/product.routes"));
const wishlist_routes_1 = __importDefault(require("../modules/catalog/wishlist.routes"));
const cart_routes_1 = __importDefault(require("../modules/cart/cart.routes"));
const order_routes_1 = __importDefault(require("../modules/order/order.routes"));
const payment_routes_1 = __importDefault(require("../modules/payment/payment.routes"));
const seller_routes_1 = __importDefault(require("../modules/seller/seller.routes"));
const notification_routes_1 = __importDefault(require("../modules/notification/notification.routes"));
const mandi_routes_1 = __importDefault(require("../modules/mandi/mandi.routes"));
const weather_routes_1 = __importDefault(require("../modules/weather/weather.routes"));
const admin_routes_1 = __importDefault(require("../modules/admin/admin.routes"));
const seedCategory_routes_1 = __importDefault(require("../modules/seedstore/seedCategory.routes"));
const seedWishlist_routes_1 = __importDefault(require("../modules/seedstore/seedWishlist.routes"));
const seedCart_routes_1 = __importDefault(require("../modules/seedstore/seedCart.routes"));
const seedOrder_routes_1 = __importDefault(require("../modules/seedstore/seedOrder.routes"));
const seedPayment_routes_1 = __importDefault(require("../modules/seedstore/seedPayment.routes"));
const seed_routes_1 = __importDefault(require("../modules/seedstore/seed.routes"));
const machineryCategory_routes_1 = __importDefault(require("../modules/machinery/machineryCategory.routes"));
const machineryBooking_routes_1 = __importDefault(require("../modules/machinery/machineryBooking.routes"));
const machineryPayment_routes_1 = __importDefault(require("../modules/machinery/machineryPayment.routes"));
const machineryAnalytics_routes_1 = __importDefault(require("../modules/machinery/machineryAnalytics.routes"));
const machinery_routes_1 = __importDefault(require("../modules/machinery/machinery.routes"));
const land_routes_1 = __importDefault(require("../modules/land/land.routes"));
const landVisit_routes_1 = __importDefault(require("../modules/land/landVisit.routes"));
const ai_routes_1 = __importDefault(require("../modules/ai/ai.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/users', profile_routes_1.default);
router.use('/categories', category_routes_1.default);
router.use('/products', product_routes_1.default);
router.use('/wishlist', wishlist_routes_1.default);
router.use('/cart', cart_routes_1.default);
router.use('/orders', order_routes_1.default);
router.use('/payments', payment_routes_1.default);
router.use('/sellers', seller_routes_1.default);
router.use('/notifications', notification_routes_1.default);
router.use('/mandi', mandi_routes_1.default);
router.use('/weather', weather_routes_1.default);
router.use('/admin', admin_routes_1.default);
// Seed Store — an independent sub-marketplace (own catalog/cart/order/payment).
// The more specific /seeds/* prefixes MUST be registered before the bare
// '/seeds' mount below: Express matches mount prefixes in registration
// order, and '/seeds' alone would otherwise swallow '/seeds/categories' etc.
// (its remainder path 'categories' would get misrouted into seed.routes.ts's
// GET /:slug handler as if "categories" were a seed's slug).
router.use('/seeds/categories', seedCategory_routes_1.default);
router.use('/seeds/wishlist', seedWishlist_routes_1.default);
router.use('/seeds/cart', seedCart_routes_1.default);
router.use('/seeds/orders', seedOrder_routes_1.default);
router.use('/seeds/payments', seedPayment_routes_1.default);
router.use('/seeds', seed_routes_1.default);
// Machinery & Equipment Rental — same mount-order rule as Seed Store above:
// specific /machinery/* prefixes before the bare '/machinery' mount.
router.use('/machinery/categories', machineryCategory_routes_1.default);
router.use('/machinery/bookings', machineryBooking_routes_1.default);
router.use('/machinery/payments', machineryPayment_routes_1.default);
router.use('/machinery/analytics', machineryAnalytics_routes_1.default);
router.use('/machinery', machinery_routes_1.default);
// Land Marketplace
router.use('/land/visit-requests', landVisit_routes_1.default);
router.use('/land', land_routes_1.default);
// AI Farm Advisory Suite
router.use('/ai', ai_routes_1.default);
router.get('/health', (req, res) => res.json({ success: true, message: 'OK', timestamp: new Date().toISOString() }));
exports.default = router;
//# sourceMappingURL=index.js.map