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
 *     description: Returns a paginated list of products on the authenticated user's wishlist.
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
 *     responses:
 *       200:
 *         description: Paginated wishlist entries with product details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Missing or invalid access token.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const { items, meta } = await wishlistService.listWishlist(req.user.id, req.query);
    ApiResponse.paginated(res, items, meta);
  })
);

/**
 * @openapi
 * /wishlist/{productId}:
 *   post:
 *     tags: [Wishlist]
 *     summary: Add a product to the wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The product ID to add.
 *     responses:
 *       201:
 *         description: Added to wishlist.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Missing or invalid access token.
 *       404:
 *         description: Product not found.
 *       409:
 *         description: Product is already on the wishlist.
 */
router.post(
  '/:productId',
  validate({ params: productIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required.');
    const entry = await wishlistService.addToWishlist(req.user.id, req.params.productId);
    ApiResponse.created(res, entry, 'Added to wishlist.');
  })
);

/**
 * @openapi
 * /wishlist/{productId}:
 *   delete:
 *     tags: [Wishlist]
 *     summary: Remove a product from the wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The product ID to remove.
 *     responses:
 *       204:
 *         description: Removed from wishlist.
 *       401:
 *         description: Missing or invalid access token.
 *       404:
 *         description: Product not on the wishlist.
 */
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
