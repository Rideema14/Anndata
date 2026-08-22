import { Router } from 'express';
import { z } from 'zod';
import * as seedController from './seed.controller';
import * as seedReviewController from './seedReview.controller';
import validate from '../../common/middlewares/validate';
import { authenticate, optionalAuthenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import { uploadImage } from '../../common/middlewares/upload';
import {
  seedCreateSchema,
  seedUpdateSchema,
  seedQuerySchema,
  seedVariantInputSchema,
  seedReviewSchema,
} from './seed.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
const slugParamSchema = z.object({ slug: z.string().trim().min(1) });
const imageParamSchema = z.object({ id: z.string().uuid(), imageId: z.string().uuid() });
const variantParamSchema = z.object({ id: z.string().uuid(), variantId: z.string().uuid() });
const reviewIdParamSchema = z.object({ id: z.string().uuid(), reviewId: z.string().uuid() });
const approvalBodySchema = z.object({ isApproved: z.boolean() });

/**
 * @openapi
 * /seeds:
 *   get:
 *     tags: [Seed Store]
 *     summary: Search/filter/paginate the seed catalog
 */
router.get('/', validate({ query: seedQuerySchema }), seedController.list);

router.get('/:slug', validate({ params: slugParamSchema }), optionalAuthenticate, seedController.getOne);

router.post('/', authenticate, authorize('SELLER', 'ADMIN'), validate({ body: seedCreateSchema }), seedController.create);

router.patch(
  '/:id',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: seedUpdateSchema }),
  seedController.update
);

router.delete('/:id', authenticate, authorize('SELLER', 'ADMIN'), validate({ params: idParamSchema }), seedController.remove);

router.post(
  '/:id/images',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema }),
  uploadImage.array('images', 8),
  seedController.addImages
);

router.delete(
  '/:id/images/:imageId',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: imageParamSchema }),
  seedController.removeImage
);

router.post(
  '/:id/variants',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: seedVariantInputSchema }),
  seedController.addVariant
);

router.patch(
  '/:id/variants/:variantId',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: variantParamSchema, body: seedVariantInputSchema.partial() }),
  seedController.updateVariant
);

router.delete(
  '/:id/variants/:variantId',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: variantParamSchema }),
  seedController.removeVariant
);

// --- Reviews (nested under a seed) ------------------------------------

router.get('/:id/reviews', validate({ params: idParamSchema }), seedReviewController.list);

router.post(
  '/:id/reviews',
  authenticate,
  validate({ params: idParamSchema, body: seedReviewSchema }),
  seedReviewController.create
);

router.patch(
  '/:id/reviews/:reviewId',
  authenticate,
  validate({ params: reviewIdParamSchema, body: seedReviewSchema.partial() }),
  seedReviewController.update
);

router.delete(
  '/:id/reviews/:reviewId',
  authenticate,
  validate({ params: reviewIdParamSchema }),
  seedReviewController.remove
);

router.patch(
  '/:id/reviews/:reviewId/approval',
  authenticate,
  authorize('ADMIN'),
  validate({ params: reviewIdParamSchema, body: approvalBodySchema }),
  seedReviewController.setApproval
);

export default router;
