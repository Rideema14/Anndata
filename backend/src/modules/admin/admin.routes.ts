import { Router } from 'express';
import { z } from 'zod';
import * as controller from './admin.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import {
  listUsersQuerySchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  platformAnalyticsQuerySchema,
  adminReviewsQuerySchema,
  adminProductsQuerySchema,
} from './admin.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });

// Every route in this module is admin-only.
router.use(authenticate, authorize('ADMIN'));

/**
 * @openapi
 * /admin/analytics:
 *   get:
 *     tags: [Admin]
 *     summary: Platform-wide KPIs — user/seller counts, total orders, GMV, and a monthly GMV trend
 */
router.get('/analytics', validate({ query: platformAnalyticsQuerySchema }), controller.getPlatformAnalytics);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List/search users platform-wide, filterable by role and active status
 */
router.get('/users', validate({ query: listUsersQuerySchema }), controller.listUsers);

router.patch(
  '/users/:id/status',
  validate({ params: idParamSchema, body: updateUserStatusSchema }),
  controller.updateUserStatus
);

router.patch('/users/:id/role', validate({ params: idParamSchema, body: updateUserRoleSchema }), controller.updateUserRole);

/**
 * @openapi
 * /admin/reviews:
 *   get:
 *     tags: [Admin]
 *     summary: Cross-product review moderation queue (approve/reject a review via the existing /products/:id/reviews/:reviewId/approval endpoint)
 */
router.get('/reviews', validate({ query: adminReviewsQuerySchema }), controller.listAllReviews);

/**
 * @openapi
 * /admin/products:
 *   get:
 *     tags: [Admin]
 *     summary: Every product platform-wide, including inactive listings (unlike the public /products endpoint)
 */
router.get('/products', validate({ query: adminProductsQuerySchema }), controller.listAllProducts);

export default router;
