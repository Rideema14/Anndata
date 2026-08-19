import { Router } from 'express';
import { z } from 'zod';
import * as cartService from './cart.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import { addItemSchema, updateItemSchema } from './cart.validation';

const router = Router();

const itemIdParamSchema = z.object({ itemId: z.string().uuid() });

router.use(authenticate);

/**
 * @openapi
 * /cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get the current user's cart with computed line totals
 *     description: Returns the user's cart with all items, including product details, variant info, quantity, and computed line totals. Creates an empty cart if one doesn't exist.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart object with items.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Missing or invalid access token.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await cartService.getOrCreateCart(req.user.id);
    ApiResponse.ok(res, cart);
  })
);

/**
 * @openapi
 * /cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add an item to the cart
 *     description: Adds a product (and optionally a specific variant) to the cart. If the same product+variant combination already exists, the quantity is incremented.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: Product to add.
 *               variantId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional variant of the product.
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *     responses:
 *       201:
 *         description: Item added to cart. Returns the updated cart.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Validation error or insufficient stock.
 *       401:
 *         description: Missing or invalid access token.
 *       404:
 *         description: Product or variant not found.
 */
router.post(
  '/items',
  validate({ body: addItemSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await cartService.addItem(req.user.id, req.body);
    ApiResponse.created(res, cart, 'Item added to cart.');
  })
);

/**
 * @openapi
 * /cart/items/{itemId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update the quantity of a cart item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart updated. Returns the updated cart.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Validation error or insufficient stock.
 *       401:
 *         description: Missing or invalid access token.
 *       404:
 *         description: Cart item not found.
 */
router.patch(
  '/items/:itemId',
  validate({ params: itemIdParamSchema, body: updateItemSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await cartService.updateItemQuantity(req.user.id, req.params.itemId, req.body.quantity);
    ApiResponse.ok(res, cart, 'Cart updated.');
  })
);

/**
 * @openapi
 * /cart/items/{itemId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove an item from the cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID.
 *     responses:
 *       200:
 *         description: Item removed. Returns the updated cart.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Missing or invalid access token.
 *       404:
 *         description: Cart item not found.
 */
router.delete(
  '/items/:itemId',
  validate({ params: itemIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await cartService.removeItem(req.user.id, req.params.itemId);
    ApiResponse.ok(res, cart, 'Item removed.');
  })
);

/**
 * @openapi
 * /cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear the entire cart
 *     description: Removes all items from the cart. The cart itself is kept.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared. Returns the empty cart.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Missing or invalid access token.
 */
router.delete(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await cartService.clearCart(req.user.id);
    ApiResponse.ok(res, cart, 'Cart cleared.');
  })
);

export default router;
