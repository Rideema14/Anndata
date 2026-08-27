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
  createPayoutSchema,
  listPayoutsQuerySchema,
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
 * /admin/sellers/balances:
 *   get:
 *     tags: [Admin]
 *     summary: Every seller with their computed payout balance (earned − paid out), searchable by name/email/business name
 */
router.get('/sellers/balances', validate({ query: sellerBalancesQuerySchema }), controller.getSellerBalances);

/** GET /admin/sellers/:id/balance — fresh balance + bank details for one seller, fetched right before opening the payout form */
router.get('/sellers/:id/balance', validate({ params: idParamSchema }), controller.getSellerBalance);

/**
 * @openapi
 * /admin/sellers/{id}/payouts:
 *   post:
 *     tags: [Admin]
 *     summary: Record a payout sent to a seller (server re-validates the amount against their current balance)
 */
router.post(
  '/sellers/:id/payouts',
  validate({ params: idParamSchema, body: createPayoutSchema }),
  controller.createPayout
);

/**
 * @openapi
 * /admin/payouts:
 *   get:
 *     tags: [Admin]
 *     summary: Platform-wide payout ledger, filterable by seller and status
 */
router.get('/payouts', validate({ query: listPayoutsQuerySchema }), controller.listPayouts);

/** PATCH /admin/payouts/:id/reverse — correct a mistaken payout entry without deleting the audit row */
router.patch('/payouts/:id/reverse', validate({ params: idParamSchema }), controller.reversePayout);

export default router;
