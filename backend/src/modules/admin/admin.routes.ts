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
  listAllOrdersQuerySchema,
  listDisputesQuerySchema,
  reviewDisputeSchema,
} from './admin.validation';
import { decideSettlementSchema, confirmRefundSchema, correctSettlementSchema } from '../order/order.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
// Order/dispute endpoints below take an order id/number or a dispute id —
// not always a UUID (orders can be addressed by their human-readable order
// number, same as everywhere else in the order module), so these use a
// looser param schema than idParamSchema above.
const looseIdParamSchema = z.object({ id: z.string().trim().min(1) });

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
 *     summary: Record a payout sent to a seller (server re-validates the amount against their current balance, then reconciles it against their oldest pending settlements)
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

// --- All-orders management (requirement #11/#12/#13) ------------------------

/**
 * @openapi
 * /admin/orders:
 *   get:
 *     tags: [Admin]
 *     summary: Every order on the platform, server-side paginated — searchable by order number/AWB/seller/buyer, filterable by
 *       order status, settlement status, payment status, and courier.
 */
router.get('/orders', validate({ query: listAllOrdersQuerySchema }), controller.listAllOrders);

/** GET /admin/orders/:id — full order detail: buyer, seller, payment breakdown, shipment, settlement history, audit trail */
router.get('/orders/:id', validate({ params: looseIdParamSchema }), controller.getOrderAdminDetail);

/**
 * @openapi
 * /admin/orders/{id}/settlement:
 *   post:
 *     tags: [Admin]
 *     summary: Decide an order's settlement — REFUND_BUYER (full amount paid) or PAY_SELLER (product amount only). Only valid
 *       while the order's settlement is PENDING_REVIEW; requires a reason.
 */
router.post(
  '/orders/:id/settlement',
  validate({ params: looseIdParamSchema, body: decideSettlementSchema }),
  controller.decideSettlement
);

/** POST /admin/orders/:id/settlement/refund-confirm — mark an approved buyer refund as actually issued */
router.post(
  '/orders/:id/settlement/refund-confirm',
  validate({ params: looseIdParamSchema, body: confirmRefundSchema }),
  controller.confirmBuyerRefund
);

/** POST /admin/orders/:id/settlement/correct — reopen a decided settlement for review (requirement #25: never silently overwrite) */
router.post(
  '/orders/:id/settlement/correct',
  validate({ params: looseIdParamSchema, body: correctSettlementSchema }),
  controller.correctSettlement
);

// --- Dispute review (requirement #9) ---------------------------------------

/**
 * @openapi
 * /admin/disputes:
 *   get:
 *     tags: [Admin]
 *     summary: Delivery dispute queue, filterable by status
 */
router.get('/disputes', validate({ query: listDisputesQuerySchema }), controller.listDisputes);

/**
 * @openapi
 * /admin/disputes/{id}/review:
 *   patch:
 *     tags: [Admin]
 *     summary: Move a dispute to UNDER_REVIEW, or close it as RESOLVED/REJECTED (both take the order out of DISPUTED)
 */
router.patch('/disputes/:id/review', validate({ params: idParamSchema, body: reviewDisputeSchema }), controller.reviewDispute);

export default router;
