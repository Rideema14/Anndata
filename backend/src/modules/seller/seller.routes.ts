import { Router } from 'express';
import { z } from 'zod';
import * as controller from './seller.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import {
  applySchema,
  updateProfileSchema,
  reviewApplicationSchema,
  listApplicationsQuerySchema,
  analyticsQuerySchema,
  sellerReviewsQuerySchema,
} from './seller.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });

router.use(authenticate);

/**
 * @openapi
 * /sellers/apply:
 *   post:
 *     tags: [Sellers]
 *     summary: Apply to become a seller (or re-submit after a rejection)
 */
router.post('/apply', validate({ body: applySchema }), controller.apply);

/**
 * @openapi
 * /sellers/me:
 *   get:
 *     tags: [Sellers]
 *     summary: Get the current user's seller profile / application status
 */
router.get('/me', controller.getMyProfile);

router.patch('/me', validate({ body: updateProfileSchema }), controller.updateMyProfile);

/**
 * @openapi
 * /sellers/dashboard:
 *   get:
 *     tags: [Sellers]
 *     summary: Active listings, orders to fulfill, and revenue snapshot for the current seller
 */
router.get('/dashboard', authorize('SELLER', 'ADMIN'), controller.getDashboard);

/**
 * @openapi
 * /sellers/analytics:
 *   get:
 *     tags: [Sellers]
 *     summary: Sales trend, top products, and order-status breakdown for the current seller
 */
router.get('/analytics', authorize('SELLER', 'ADMIN'), validate({ query: analyticsQuerySchema }), controller.getAnalytics);

/**
 * @openapi
 * /sellers/reviews:
 *   get:
 *     tags: [Sellers]
 *     summary: Every review left on the current seller's products — reviewer name/photo, rating, comment, and which product. This is the "Feedback" view for sellers on the frontend.
 */
router.get('/reviews', authorize('SELLER', 'ADMIN'), validate({ query: sellerReviewsQuerySchema }), controller.getReviews);

// --- Admin: verification console ------------------------------------------

router.get(
  '/applications',
  authorize('ADMIN'),
  validate({ query: listApplicationsQuerySchema }),
  controller.listApplications
);

router.patch(
  '/applications/:id/review',
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: reviewApplicationSchema }),
  controller.reviewApplication
);

export default router;
