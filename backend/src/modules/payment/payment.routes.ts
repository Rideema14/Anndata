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
 *     summary: Razorpay server-to-server webhook (not user-authenticated)
 *     description: Handles real-time payment updates from Razorpay servers. The payload is verified using the HMAC signature in the `x-razorpay-signature` header.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: The raw Razorpay event payload.
 *     responses:
 *       200:
 *         description: Webhook processed successfully.
 *       400:
 *         description: Invalid signature or missing payload.
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
 *     description: Creates a payment order on Razorpay for an existing platform order. Normally done automatically during checkout, but this endpoint allows retrying a failed payment or generating a new payment link for an unpaid order.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *                 description: The internal platform order ID.
 *     responses:
 *       201:
 *         description: Razorpay order created.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         razorpayOrderId:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         currency:
 *                           type: string
 *                         keyId:
 *                           type: string
 *       400:
 *         description: Order is already paid or cancelled.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Not the owner of this order.
 *       404:
 *         description: Order not found.
 */
router.post('/create', validate({ body: createPaymentSchema }), controller.create);

/**
 * @openapi
 * /payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify the Razorpay signature after the Checkout widget succeeds
 *     description: Once the frontend Razorpay Checkout widget completes a payment, it sends the returned signature here. We verify it cryptographically and update the order status to PAID.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *                 example: order_MqR5gLk3YB2dFm
 *               razorpay_payment_id:
 *                 type: string
 *                 example: pay_MqR5gLk3YB2dFm
 *               razorpay_signature:
 *                 type: string
 *                 example: 9a38c...
 *     responses:
 *       200:
 *         description: Payment verified successfully. Returns the updated order.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid signature.
 *       401:
 *         description: Missing or invalid access token.
 *       404:
 *         description: Payment record not found.
 */
router.post('/verify', validate({ body: verifyPaymentSchema }), controller.verify);

/**
 * @openapi
 * /payments/order/{orderId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment details for a specific order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID.
 *     responses:
 *       200:
 *         description: Payment details.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Not the owner of this order.
 *       404:
 *         description: Payment record not found.
 */
router.get('/order/:orderId', validate({ params: orderIdParamSchema }), controller.getForOrder);

export default router;
