import { Router } from 'express';
import { z } from 'zod';
import * as controller from './order.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import { checkoutSchema, updateStatusSchema, listOrdersQuerySchema, cancelOrderSchema } from './order.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });

router.use(authenticate);

/**
 * @openapi
 * /orders/checkout:
 *   post:
 *     tags: [Orders]
 *     summary: Place an order from the current cart and create a Razorpay payment for it
 *     description: |
 *       One call for the frontend: places the order from the user's cart, decrements stock,
 *       clears the cart, AND creates the matching Razorpay order. Everything needed to open
 *       the Razorpay Checkout widget comes back in a single response.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [addressId]
 *             properties:
 *               addressId:
 *                 type: string
 *                 format: uuid
 *                 description: Delivery address ID from the user's address book.
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional note for the seller.
 *                 example: Please deliver before 5 PM.
 *     responses:
 *       201:
 *         description: Order placed. Returns the order object and Razorpay payment details.
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
 *                         order:
 *                           $ref: '#/components/schemas/Order'
 *                         payment:
 *                           type: object
 *                           properties:
 *                             razorpayOrderId:
 *                               type: string
 *                               example: order_MqR5gLk3YB2dFm
 *                             amount:
 *                               type: number
 *                               example: 89900
 *                             currency:
 *                               type: string
 *                               example: INR
 *                             keyId:
 *                               type: string
 *                               example: rzp_test_abc123
 *       400:
 *         description: Cart is empty, address not found, or insufficient stock.
 *       401:
 *         description: Missing or invalid access token.
 *       404:
 *         description: Address not found.
 */
router.post('/checkout', validate({ body: checkoutSchema }), controller.checkout);

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List the current user's orders (or all orders, for admins)
 *     description: Returns a paginated list of orders. Regular users see only their own orders. Admins can see all orders and filter by userId.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: Items per page.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURNED]
 *         description: Filter by order status.
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID (admin only).
 *     responses:
 *       200:
 *         description: Paginated list of orders.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Missing or invalid access token.
 */
router.get('/', validate({ query: listOrdersQuerySchema }), controller.list);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get a single order by ID
 *     description: Returns the full order with items, status history, address, and payment details. Only the order owner or an admin can access it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID.
 *     responses:
 *       200:
 *         description: Full order object.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Not the owner of this order (unless Admin).
 *       404:
 *         description: Order not found.
 */
router.get('/:id', validate({ params: idParamSchema }), controller.getOne);

/**
 * @openapi
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (Seller / Admin)
 *     description: Updates the status of an order and pushes a live update over Socket.IO. A status-history entry is created for audit. Only sellers (who have items in the order) or admins can call this.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURNED]
 *                 example: SHIPPED
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional note about the status change.
 *                 example: Dispatched via BlueDart, tracking ID BD12345.
 *     responses:
 *       200:
 *         description: Order status updated.
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
 *         description: Invalid status transition.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only sellers with items in this order or admins can update status.
 *       404:
 *         description: Order not found.
 */
router.patch(
  '/:id/status',
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: updateStatusSchema }),
  controller.updateStatus
);

/**
 * @openapi
 * /orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel an order
 *     description: Cancels a pending order and restores stock. Only the order owner or an admin can cancel.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional cancellation reason.
 *                 example: Changed my mind about the purchase.
 *     responses:
 *       200:
 *         description: Order cancelled.
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
 *         description: Order cannot be cancelled in its current status.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Not the owner of this order.
 *       404:
 *         description: Order not found.
 */
router.post('/:id/cancel', validate({ params: idParamSchema, body: cancelOrderSchema }), controller.cancel);

export default router;
