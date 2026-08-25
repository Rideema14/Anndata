import { Router } from 'express';
import { z } from 'zod';
import * as controller from './order.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import { checkoutSchema, updateStatusSchema, listOrdersQuerySchema, cancelOrderSchema } from './order.validation';

const router = Router();

// The frontend addresses orders by their human-readable order number
// (e.g. "ORD-20260825-1234") in the URL, and only opportunistically caches
// the real UUID in memory once it's seen one. On a refresh, bookmark, or
// shared link that cache is empty, so this must accept either form — the
// service layer resolves whichever one it gets.
const idParamSchema = z.object({ id: z.string().trim().min(1) });

router.use(authenticate);

/** GET /orders/carriers — list supported carriers for the dropdown */
router.get('/carriers', controller.getCarriers);

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

router.get('/:id', validate({ params: idParamSchema }), controller.getOne);

/**
 * @openapi
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (seller of items in the order, or admin) — pushes a live update over Socket.IO
 */
router.patch(
  '/:id/status',
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: updateStatusSchema }),
  controller.updateStatus
);

router.post('/:id/cancel', validate({ params: idParamSchema, body: cancelOrderSchema }), controller.cancel);

export default router;