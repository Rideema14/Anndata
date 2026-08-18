const router = require('express').Router();
const { z } = require('zod');
const controller = require('./order.controller');
const validate = require('../../common/middlewares/validate');
const { authenticate } = require('../../common/middlewares/authenticate');
const authorize = require('../../common/middlewares/authorize');
const { checkoutSchema, updateStatusSchema, listOrdersQuerySchema, cancelOrderSchema } = require('./order.validation');

const idParamSchema = z.object({ id: z.string().uuid() });

router.use(authenticate);

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

module.exports = router;
