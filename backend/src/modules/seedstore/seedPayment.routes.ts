import { Router } from 'express';
import { z } from 'zod';
import * as controller from './seedPayment.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import { createSeedPaymentSchema, verifySeedPaymentSchema } from './seedPayment.validation';

const router = Router();

const orderIdParamSchema = z.object({ orderId: z.string().uuid() });

/**
 * @openapi
 * /seeds/payments/webhook:
 *   post:
 *     tags: [Seed Store]
 *     summary: Razorpay server-to-server webhook for seed orders (not user-authenticated; verified via HMAC signature)
 */
router.post('/webhook', controller.webhook);

router.use(authenticate);

router.post('/create', validate({ body: createSeedPaymentSchema }), controller.create);

router.post('/verify', validate({ body: verifySeedPaymentSchema }), controller.verify);

router.get('/order/:orderId', validate({ params: orderIdParamSchema }), controller.getForOrder);

export default router;
