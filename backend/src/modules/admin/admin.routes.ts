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
<<<<<<< HEAD
  listPayoutsQuerySchema,
  createPayoutSchema,
=======
  createPayoutSchema,
  listPayoutsQuerySchema,
  listShipmentsQuerySchema,
  flagShipmentSchema,
  listDisputesQuerySchema,
  reviewDisputeSchema,
>>>>>>> 441adbb369c21ed2d2f22dd3759d4188bd49908d
} from './admin.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
// Shipment/dispute endpoints below take an order id/number or a dispute
// id — not always a UUID (orders can be addressed by their human-readable
// order number, same as everywhere else in the order module), so these use
// a looser param schema than idParamSchema above.
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
<<<<<<< HEAD
 * /admin/payouts/balances:
 *   get:
 *     tags: [Admin]
 *     summary: Every seller's balance — delivered-order revenue minus payouts already recorded
 */
router.get('/payouts/balances', validate({ query: sellerBalancesQuerySchema }), controller.getSellerBalances);

/** GET /admin/payouts/balances/:id — one seller's balance, with bank details for the pay-out form */
router.get('/payouts/balances/:id', validate({ params: idParamSchema }), controller.getSellerBalance);
=======
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
>>>>>>> 441adbb369c21ed2d2f22dd3759d4188bd49908d

/**
 * @openapi
 * /admin/payouts:
 *   get:
 *     tags: [Admin]
<<<<<<< HEAD
 *     summary: The full payout ledger, newest first
 */
router.get('/payouts', validate({ query: listPayoutsQuerySchema }), controller.listPayouts);

/** POST /admin/payouts/:id — record a payout to seller :id (manual bank transfer/UPI done outside the app) */
router.post('/payouts/:id', validate({ params: idParamSchema, body: createPayoutSchema }), controller.createPayout);

/** POST /admin/payouts/:id/reverse — mark a recorded payout as reversed (:id here is the payout's own id, not a seller id) */
router.post('/payouts/:id/reverse', validate({ params: idParamSchema }), controller.reversePayout);
=======
 *     summary: Platform-wide payout ledger, filterable by seller and status
 */
router.get('/payouts', validate({ query: listPayoutsQuerySchema }), controller.listPayouts);

/** PATCH /admin/payouts/:id/reverse — correct a mistaken payout entry without deleting the audit row */
router.patch('/payouts/:id/reverse', validate({ params: idParamSchema }), controller.reversePayout);

// --- Shipment management (requirement #10) --------------------------------

/**
 * @openapi
 * /admin/shipments:
 *   get:
 *     tags: [Admin]
 *     summary: Platform-wide shipment list — order/product/buyer/seller/courier/AWB, status, pickup confirmation, last event, last sync, delivery, dispute status, risk flags
 */
router.get('/shipments', validate({ query: listShipmentsQuerySchema }), controller.listShipments);

/** GET /admin/shipments/risk-signals — recent repeated-invalid-AWB / repeated-dispute flags by seller (requirement #11) */
router.get('/shipments/risk-signals', controller.listRiskSignals);

/** GET /admin/shipments/:id — full tracking timeline + audit trail for one order's shipment */
router.get('/shipments/:id', validate({ params: looseIdParamSchema }), controller.getShipmentDetail);

/**
 * @openapi
 * /admin/shipments/{id}/flag:
 *   post:
 *     tags: [Admin]
 *     summary: Flag a shipment for investigation. Deliberately the ONLY shipment field an admin can write — courier-derived
 *       status/events/timestamps are never editable here.
 */
router.post('/shipments/:id/flag', validate({ params: looseIdParamSchema, body: flagShipmentSchema }), controller.flagShipment);

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
>>>>>>> 441adbb369c21ed2d2f22dd3759d4188bd49908d

export default router;
