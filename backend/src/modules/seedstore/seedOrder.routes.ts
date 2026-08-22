import { Router } from 'express';
import { z } from 'zod';
import * as controller from './seedOrder.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import {
  seedCheckoutSchema,
  updateSeedOrderStatusSchema,
  listSeedOrdersQuerySchema,
  cancelSeedOrderSchema,
} from './seedOrder.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });

router.use(authenticate);

/**
 * @openapi
 * /seeds/orders/checkout:
 *   post:
 *     tags: [Seed Store]
 *     summary: Place an order from the current seed cart and create a Razorpay payment for it
 */
router.post('/checkout', validate({ body: seedCheckoutSchema }), controller.checkout);

router.get('/', validate({ query: listSeedOrdersQuerySchema }), controller.list);

router.get('/:id', validate({ params: idParamSchema }), controller.getOne);

router.patch(
  '/:id/status',
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: updateSeedOrderStatusSchema }),
  controller.updateStatus
);

router.post('/:id/cancel', validate({ params: idParamSchema, body: cancelSeedOrderSchema }), controller.cancel);

export default router;
