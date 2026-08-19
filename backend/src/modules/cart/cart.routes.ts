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
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await cartService.getOrCreateCart(req.user.id);
    ApiResponse.ok(res, cart);
  })
);

router.post(
  '/items',
  validate({ body: addItemSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await cartService.addItem(req.user.id, req.body);
    ApiResponse.created(res, cart, 'Item added to cart.');
  })
);

router.patch(
  '/items/:itemId',
  validate({ params: itemIdParamSchema, body: updateItemSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await cartService.updateItemQuantity(req.user.id, req.params.itemId, req.body.quantity);
    ApiResponse.ok(res, cart, 'Cart updated.');
  })
);

router.delete(
  '/items/:itemId',
  validate({ params: itemIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await cartService.removeItem(req.user.id, req.params.itemId);
    ApiResponse.ok(res, cart, 'Item removed.');
  })
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await cartService.clearCart(req.user.id);
    ApiResponse.ok(res, cart, 'Cart cleared.');
  })
);

export default router;
