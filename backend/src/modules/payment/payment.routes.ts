import { Router } from 'express';
import { z } from 'zod';
import * as controller from './payment.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import { createPaymentSchema, verifyPaymentSchema } from './payment.validation';

const router = Router();

const orderIdParamSchema = z.object({ orderId: z.string().uuid() });

/**
 * @openapi
 * /payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Razorpay server-to-server webhook (not user-authenticated; verified via HMAC signature)
 */
// No `authenticate` here — Razorpay's servers call this directly, authenticated
// only by the X-Razorpay-Signature header, checked inside the service.
router.post('/webhook', controller.webhook);

router.use(authenticate);

/**
 * @openapi
 * /payments/create:
 *   post:
 *     tags: [Payments]
 *     summary: Create (or retry) a Razorpay order for a placed platform order
 *     security: [{ bearerAuth: [] }]
 */
router.post('/create', validate({ body: createPaymentSchema }), controller.create);

/**
 * @openapi
 * /payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify the Razorpay signature after the Checkout widget succeeds
 *     security: [{ bearerAuth: [] }]
 */
router.post('/verify', validate({ body: verifyPaymentSchema }), controller.verify);

router.get('/order/:orderId', validate({ params: orderIdParamSchema }), controller.getForOrder);

export default router;
