import { Router } from 'express';
import { z } from 'zod';
import * as wishlistService from './wishlist.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';

const router = Router();

const productIdParamSchema = z.object({ productId: z.string().uuid() });

router.use(authenticate);

/**
 * @openapi
 * /wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: List the current user's wishlist
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const { items, meta } = await wishlistService.listWishlist(req.user.id, req.query);
    ApiResponse.paginated(res, items, meta);
  })
);

router.post(
  '/:productId',
  validate({ params: productIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const entry = await wishlistService.addToWishlist(req.user.id, req.params.productId);
    ApiResponse.created(res, entry, 'Added to wishlist.');
  })
);

router.delete(
  '/:productId',
  validate({ params: productIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    await wishlistService.removeFromWishlist(req.user.id, req.params.productId);
    ApiResponse.noContent(res);
  })
);

export default router;
