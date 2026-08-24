import { Router } from 'express';
import { z } from 'zod';
import * as controller from './machineryBooking.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  listBookingsQuerySchema,
  cancelBookingSchema,
} from './machinery.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });

router.use(authenticate);

/**
 * @openapi
 * /machinery/bookings:
 *   post:
 *     tags: [Machinery]
 *     summary: Book machinery for a date range and create a Razorpay payment for it
 */
router.post('/', validate({ body: createBookingSchema }), controller.create);

router.get('/', validate({ query: listBookingsQuerySchema }), controller.list);

router.get('/:id', validate({ params: idParamSchema }), controller.getOne);

router.patch(
  '/:id/status',
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: updateBookingStatusSchema }),
  controller.updateStatus
);

router.post('/:id/cancel', validate({ params: idParamSchema, body: cancelBookingSchema }), controller.cancel);

export default router;
