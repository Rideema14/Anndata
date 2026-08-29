import { Router } from 'express';
import { z } from 'zod';
import * as controller from './admin.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import {
  listUsersQuerySchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  platformAnalyticsQuerySchema,
  adminReviewsQuerySchema,
  adminProductsQuerySchema,
  sellerBalancesQuerySchema,
  listPayoutsQuerySchema,
  createPayoutSchema,
} from './admin.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });

// Every route in this module is admin-only.
router.use(authenticate, authorize('ADMIN'));

/**
 * @openapi
 * /admin/analytics:
 *   get:
 *     tags: [Admin]
 *     summary: Platform-wide KPIs — user/seller counts, total orders, GMV, and a monthly GMV trend
 */
router.get('/analytics', validate({ query: platformAnalyticsQuerySchema }), controller.getPlatformAnalytics);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List/search users platform-wide, filterable by role and active status
 */
router.get('/users', validate({ query: listUsersQuerySchema }), controller.listUsers);

router.patch(
  '/users/:id/status',
  validate({ params: idParamSchema, body: updateUserStatusSchema }),
  controller.updateUserStatus
);

router.patch('/users/:id/role', validate({ params: idParamSchema, body: updateUserRoleSchema }), controller.updateUserRole);

/**
 * @openapi
 * /admin/reviews:
 *   get:
 *     tags: [Admin]
 *     summary: Cross-product review moderation queue (approve/reject a review via the existing /products/:id/reviews/:reviewId/approval endpoint)
 */
router.get('/reviews', validate({ query: adminReviewsQuerySchema }), controller.listAllReviews);

/**
 * @openapi
 * /admin/products:
 *   get:
 *     tags: [Admin]
 *     summary: Every product platform-wide, including inactive listings (unlike the public /products endpoint)
 */
router.get('/products', validate({ query: adminProductsQuerySchema }), controller.listAllProducts);

/**
 * @openapi
 * /admin/payouts/balances:
 *   get:
 *     tags: [Admin]
 *     summary: Every seller's balance — delivered-order revenue minus payouts already recorded
 */
router.get('/payouts/balances', validate({ query: sellerBalancesQuerySchema }), controller.getSellerBalances);

/** GET /admin/payouts/balances/:id — one seller's balance, with bank details for the pay-out form */
router.get('/payouts/balances/:id', validate({ params: idParamSchema }), controller.getSellerBalance);

/**
 * @openapi
 * /admin/payouts:
 *   get:
 *     tags: [Admin]
 *     summary: The full payout ledger, newest first
 */
router.get('/payouts', validate({ query: listPayoutsQuerySchema }), controller.listPayouts);

/** POST /admin/payouts/:id — record a payout to seller :id (manual bank transfer/UPI done outside the app) */
router.post('/payouts/:id', validate({ params: idParamSchema, body: createPayoutSchema }), controller.createPayout);

/** POST /admin/payouts/:id/reverse — mark a recorded payout as reversed (:id here is the payout's own id, not a seller id) */
router.post('/payouts/:id/reverse', validate({ params: idParamSchema }), controller.reversePayout);

export default router;
