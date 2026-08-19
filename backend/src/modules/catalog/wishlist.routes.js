const router = require('express').Router();
const { z } = require('zod');
const wishlistService = require('./wishlist.service');
const ApiResponse = require('../../common/utils/ApiResponse');
const asyncHandler = require('../../common/middlewares/asyncHandler');
const validate = require('../../common/middlewares/validate');
const { authenticate } = require('../../common/middlewares/authenticate');

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
    const { items, meta } = await wishlistService.listWishlist(req.user.id, req.query);
    ApiResponse.paginated(res, items, meta);
  })
);

router.post(
  '/:productId',
  validate({ params: productIdParamSchema }),
  asyncHandler(async (req, res) => {
    const entry = await wishlistService.addToWishlist(req.user.id, req.params.productId);
    ApiResponse.created(res, entry, 'Added to wishlist.');
  })
);

router.delete(
  '/:productId',
  validate({ params: productIdParamSchema }),
  asyncHandler(async (req, res) => {
    await wishlistService.removeFromWishlist(req.user.id, req.params.productId);
    ApiResponse.noContent(res);
  })
);

module.exports = router;
