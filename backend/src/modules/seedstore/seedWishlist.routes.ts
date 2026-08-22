import { Router } from 'express';
import { z } from 'zod';
import * as seedWishlistService from './seedWishlist.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';

const router = Router();

const seedIdParamSchema = z.object({ seedId: z.string().uuid() });

router.use(authenticate);

/**
 * @openapi
 * /seeds/wishlist:
 *   get:
 *     tags: [Seed Store]
 *     summary: List the current user's seed wishlist
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const { items, meta } = await seedWishlistService.listSeedWishlist(req.user.id, req.query);
    ApiResponse.paginated(res, items, meta);
  })
);

router.post(
  '/:seedId',
  validate({ params: seedIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const entry = await seedWishlistService.addToSeedWishlist(req.user.id, req.params.seedId);
    ApiResponse.created(res, entry, 'Added to wishlist.');
  })
);

router.delete(
  '/:seedId',
  validate({ params: seedIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    await seedWishlistService.removeFromSeedWishlist(req.user.id, req.params.seedId);
    ApiResponse.noContent(res);
  })
);

export default router;
