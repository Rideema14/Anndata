import { Router } from 'express';
import { z } from 'zod';
import * as machineryController from './machinery.controller';
import * as machineryReviewController from './machineryReview.controller';
import validate from '../../common/middlewares/validate';
import { authenticate, optionalAuthenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import { uploadImage } from '../../common/middlewares/upload';
import {
  machineryCreateSchema,
  machineryUpdateSchema,
  machineryQuerySchema,
  availabilityQuerySchema,
  discountTierInputSchema,
  machineryReviewSchema,
} from './machinery.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
const slugParamSchema = z.object({ slug: z.string().trim().min(1) });
const imageParamSchema = z.object({ id: z.string().uuid(), imageId: z.string().uuid() });
const tierParamSchema = z.object({ id: z.string().uuid(), tierId: z.string().uuid() });
const reviewIdParamSchema = z.object({ id: z.string().uuid(), reviewId: z.string().uuid() });
const approvalBodySchema = z.object({ isApproved: z.boolean() });

/**
 * @openapi
 * /machinery:
 *   get:
 *     tags: [Machinery]
 *     summary: Search/filter/paginate machinery listings; pass startDate+endDate+quantity to only see listings with enough free units for that range
 */
router.get('/', validate({ query: machineryQuerySchema }), machineryController.list);

router.get('/:slug', validate({ params: slugParamSchema }), optionalAuthenticate, machineryController.getOne);

router.post(
  '/',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ body: machineryCreateSchema }),
  machineryController.create
);

router.patch(
  '/:id',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: machineryUpdateSchema }),
  machineryController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema }),
  machineryController.remove
);

/**
 * @openapi
 * /machinery/{id}/availability:
 *   get:
 *     tags: [Machinery]
 *     summary: Check free-unit count for a specific date range and quantity, before booking
 */
router.get(
  '/:id/availability',
  validate({ params: idParamSchema, query: availabilityQuerySchema }),
  machineryController.getAvailability
);

router.post(
  '/:id/images',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema }),
  uploadImage.array('images', 8),
  machineryController.addImages
);

router.delete(
  '/:id/images/:imageId',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: imageParamSchema }),
  machineryController.removeImage
);

router.post(
  '/:id/discount-tiers',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: idParamSchema, body: discountTierInputSchema }),
  machineryController.addDiscountTier
);

router.patch(
  '/:id/discount-tiers/:tierId',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: tierParamSchema, body: discountTierInputSchema.partial() }),
  machineryController.updateDiscountTier
);

router.delete(
  '/:id/discount-tiers/:tierId',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate({ params: tierParamSchema }),
  machineryController.removeDiscountTier
);

// --- Reviews (nested under a machinery listing) -----------------------

router.get('/:id/reviews', validate({ params: idParamSchema }), machineryReviewController.list);

router.post(
  '/:id/reviews',
  authenticate,
  validate({ params: idParamSchema, body: machineryReviewSchema }),
  machineryReviewController.create
);

router.patch(
  '/:id/reviews/:reviewId',
  authenticate,
  validate({ params: reviewIdParamSchema, body: machineryReviewSchema.partial() }),
  machineryReviewController.update
);

router.delete(
  '/:id/reviews/:reviewId',
  authenticate,
  validate({ params: reviewIdParamSchema }),
  machineryReviewController.remove
);

router.patch(
  '/:id/reviews/:reviewId/approval',
  authenticate,
  authorize('ADMIN'),
  validate({ params: reviewIdParamSchema, body: approvalBodySchema }),
  machineryReviewController.setApproval
);

export default router;
