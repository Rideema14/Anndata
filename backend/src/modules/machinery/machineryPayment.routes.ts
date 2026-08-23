import { Router } from 'express';
import { z } from 'zod';
import * as controller from './machineryPayment.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import { createMachineryPaymentSchema, verifyMachineryPaymentSchema } from './machineryPayment.validation';

const router = Router();

const bookingIdParamSchema = z.object({ bookingId: z.string().uuid() });

/**
 * @openapi
 * /machinery/payments/webhook:
 *   post:
 *     tags: [Machinery]
 *     summary: Razorpay server-to-server webhook for machinery bookings (not user-authenticated; verified via HMAC signature)
 */
router.post('/webhook', controller.webhook);

router.use(authenticate);

router.post('/create', validate({ body: createMachineryPaymentSchema }), controller.create);

router.post('/verify', validate({ body: verifyMachineryPaymentSchema }), controller.verify);

router.get('/booking/:bookingId', validate({ params: bookingIdParamSchema }), controller.getForBooking);

export default router;
