import { Router } from 'express';
import { z } from 'zod';
import * as productController from './product.controller';
import * as reviewController from './review.controller';
import validate from '../../common/middlewares/validate';
import { authenticate, optionalAuthenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import { uploadImage } from '../../common/middlewares/upload';
import {
  productCreateSchema,
  productUpdateSchema,
  productQuerySchema,
  nearbyQuerySchema,
  topDealsQuerySchema,
  variantInputSchema,
  reviewSchema,
} from './catalog.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
const slugParamSchema = z.object({ slug: z.string().trim().min(1) });
const imageParamSchema = z.object({ id: z.string().uuid(), imageId: z.string().uuid() });
const variantParamSchema = z.object({ id: z.string().uuid(), variantId: z.string().uuid() });
const reviewIdParamSchema = z.object({ id: z.string().uuid(), reviewId: z.string().uuid() });
const approvalBodySchema = z.object({ isApproved: z.boolean() });

/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Search/filter/paginate the product catalog
 */
router.get('/', validate({ query: productQuerySchema }), productController.list);

router.get('/nearby', validate({ query: nearbyQuerySchema }), productController.nearby);

router.get('/top-deals', validate({ query: topDealsQuerySchema }), productController.topDeals);

router.get('/:slug', validate({ params: slugParamSchema }), optionalAuthenticate, productController.getOne);

router.post(
  '/',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ body: productCreateSchema }),
  productController.create
);

router.patch(
  '/:id',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: productUpdateSchema }),
  productController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema }),
  productController.remove
);

router.post(
  '/:id/images',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema }),
  uploadImage.array('images', 8),
  productController.addImages
);

router.delete(
  '/:id/images/:imageId',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: imageParamSchema }),
  productController.removeImage
);

router.post(
  '/:id/variants',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: variantInputSchema }),
  productController.addVariant
);

router.patch(
  '/:id/variants/:variantId',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: variantParamSchema, body: variantInputSchema.partial() }),
  productController.updateVariant
);

router.delete(
  '/:id/variants/:variantId',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: variantParamSchema }),
  productController.removeVariant
);

// --- Reviews (nested under a product) --------------------------------------

router.get('/:id/reviews', validate({ params: idParamSchema }), reviewController.list);

router.post(
  '/:id/reviews',
  authenticate,
  validate({ params: idParamSchema, body: reviewSchema }),
  reviewController.create
);

router.patch(
  '/:id/reviews/:reviewId',
  authenticate,
  validate({ params: reviewIdParamSchema, body: reviewSchema.partial() }),
  reviewController.update
);

router.delete(
  '/:id/reviews/:reviewId',
  authenticate,
  validate({ params: reviewIdParamSchema }),
  reviewController.remove
);

router.patch(
  '/:id/reviews/:reviewId/approval',
  authenticate,
  authorize('ADMIN'),
  validate({ params: reviewIdParamSchema, body: approvalBodySchema }),
  reviewController.setApproval
);

export default router;
