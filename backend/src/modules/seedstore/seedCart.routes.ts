import { Router } from 'express';
import { z } from 'zod';
import * as seedCartService from './seedCart.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import { addSeedItemSchema, updateSeedItemSchema } from './seedCart.validation';

const router = Router();

const itemIdParamSchema = z.object({ itemId: z.string().uuid() });

router.use(authenticate);

/**
 * @openapi
 * /seeds/cart:
 *   get:
 *     tags: [Seed Store]
 *     summary: Get the current user's seed cart with computed line totals
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await seedCartService.getOrCreateSeedCart(req.user.id);
    ApiResponse.ok(res, cart);
  })
);

router.post(
  '/items',
  validate({ body: addSeedItemSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await seedCartService.addSeedItem(req.user.id, req.body);
    ApiResponse.created(res, cart, 'Item added to cart.');
  })
);

router.patch(
  '/items/:itemId',
  validate({ params: itemIdParamSchema, body: updateSeedItemSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await seedCartService.updateSeedItemQuantity(req.user.id, req.params.itemId, req.body.quantity);
    ApiResponse.ok(res, cart, 'Cart updated.');
  })
);

router.delete(
  '/items/:itemId',
  validate({ params: itemIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await seedCartService.removeSeedItem(req.user.id, req.params.itemId);
    ApiResponse.ok(res, cart, 'Item removed.');
  })
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const cart = await seedCartService.clearSeedCart(req.user.id);
    ApiResponse.ok(res, cart, 'Cart cleared.');
  })
);

export default router;
