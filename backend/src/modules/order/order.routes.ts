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

/**
 * @openapi
 * /orders/webhooks/track17:
 *   post:
 *     tags: [Orders]
 *     summary: 17TRACK push-webhook (not user-authenticated; verified via a shared token query param — see tracking.service.ts)
 */
// No `authenticate` here — 17TRACK's servers call this directly. 17TRACK
// doesn't sign its webhook payloads, so authentication is a shared-secret
// token in the query string instead (see verifyTrack17WebhookToken in
// tracking.service.ts). Mirrors payment.routes.ts's Razorpay webhook,
// registered before `authenticate` for the same reason.
router.post('/webhooks/track17', controller.track17Webhook);

router.use(authenticate);

/** GET /orders/carriers — list supported carriers for the dropdown */
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
 *     summary: List the current user's orders (or all orders, for admins)
 */
router.get('/', validate({ query: listOrdersQuerySchema }), controller.list);

/** GET /orders/:id/tracking — shipment event timeline */
router.get('/:id/tracking', validate({ params: idParamSchema }), controller.getTracking);

<<<<<<< HEAD
/** GET /orders/:id/seller-detail — seller/admin fulfillment view, items filtered to the requesting seller's own products */
router.get('/:id/seller-detail', authorize('SELLER', 'ADMIN'), validate({ params: idParamSchema }), controller.getSellerOrderDetail);
=======
/** GET /orders/:id/shipment — full shipment detail (status, verification, courier timeline) */
router.get('/:id/shipment', validate({ params: idParamSchema }), controller.getShipment);

/**
 * POST /orders/:id/shipment — seller submits the AWB for an order
 * (requirement #2/#18). This is the seller's ONLY write path for shipment
 * data; every subsequent status change (pickup, transit, delivery) comes
 * exclusively from the courier via tracking.service.ts.
 */
router.post(
  '/:id/shipment',
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: submitShipmentSchema }),
  controller.submitShipment
);

/** POST /orders/:id/dispute — buyer reports a delivery problem (requirement #9) */
router.post('/:id/dispute', validate({ params: idParamSchema, body: createDisputeSchema }), controller.createDispute);
>>>>>>> 441adbb369c21ed2d2f22dd3759d4188bd49908d

router.get('/:id', validate({ params: idParamSchema }), controller.getOne);

/**
 * @openapi
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Admin-only manual order status override — pushes a live update over Socket.IO. Sellers no longer have access to
 *       this endpoint; see POST /orders/{id}/shipment for their (courier-verified) shipment submission flow instead.
 */
router.patch(
  '/:id/status',
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: updateStatusSchema }),
  controller.updateStatus
);

router.post('/:id/cancel', validate({ params: idParamSchema, body: cancelOrderSchema }), controller.cancel);

export default router;
