import { Router } from 'express';
import { z } from 'zod';
import * as controller from './order.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import {
  checkoutSchema,
  updateStatusSchema,
  listOrdersQuerySchema,
  cancelOrderSchema,
  submitShipmentSchema,
  createDisputeSchema,
} from './order.validation';

const router = Router();

// The frontend addresses orders by their human-readable order number
// (e.g. "ORD-20260825-1234") in the URL, and only opportunistically caches
// the real UUID in memory once it's seen one. On a refresh, bookmark, or
// shared link that cache is empty, so this must accept either form — the
// service layer resolves whichever one it gets.
const idParamSchema = z.object({ id: z.string().trim().min(1) });

router.use(authenticate);

/** GET /orders/carriers — list supported delivery platforms for the seller shipment-form dropdown (requirement #4) */
router.get('/carriers', controller.getCarriers);

/** GET /orders/disputes/mine — the current user's own disputes (must be registered before the generic /:id routes below) */
router.get('/disputes/mine', controller.listMyDisputes);

/**
 * @openapi
 * /orders/checkout:
 *   post:
 *     tags: [Orders]
 *     summary: Place an order from the current cart and create a Razorpay payment for it
 */
router.post('/checkout', validate({ body: checkoutSchema }), controller.checkout);

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List the current user's orders (or all orders, for admins — see also GET /admin/orders for the full admin management view)
 */
router.get('/', validate({ query: listOrdersQuerySchema }), controller.list);

/** GET /orders/:id/seller-detail — seller/admin fulfillment view, items filtered to the requesting seller's own products */
router.get('/:id/seller-detail', authorize('SELLER', 'ADMIN'), validate({ params: idParamSchema }), controller.getSellerOrderDetail);

/** GET /orders/:id/shipment — shipment detail (courier, AWB, official tracking link) */
router.get('/:id/shipment', validate({ params: idParamSchema }), controller.getShipment);

/**
 * POST /orders/:id/shipment — seller submits the courier + AWB for an order
 * (requirement #2/#3). This is the seller's ONLY write path for shipment
 * data — submitting moves the order straight to SHIPPED. Every subsequent
 * status change is a manual admin action (PATCH /orders/:id/status or the
 * admin order-detail screen) since there is no automatic tracking provider.
 */
router.post(
  '/:id/shipment',
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: submitShipmentSchema }),
  controller.submitShipment
);

/** POST /orders/:id/dispute — buyer reports a delivery problem (requirement #9) */
router.post('/:id/dispute', validate({ params: idParamSchema, body: createDisputeSchema }), controller.createDispute);

router.get('/:id', validate({ params: idParamSchema }), controller.getOne);

/**
 * @openapi
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Admin-only manual order status override. Sellers have no access to this endpoint; see POST /orders/{id}/shipment for
 *       their shipment submission flow instead.
 */
router.patch(
  '/:id/status',
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: updateStatusSchema }),
  controller.updateStatus
);

router.post('/:id/cancel', validate({ params: idParamSchema, body: cancelOrderSchema }), controller.cancel);

export default router;
