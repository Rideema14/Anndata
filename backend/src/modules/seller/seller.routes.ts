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
 *     description: Submits a seller profile application. The profile goes into a `PENDING` state and must be reviewed by an Admin. If rejected, the user can fix the details and re-apply via this endpoint.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessName]
 *             properties:
 *               businessName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 150
 *                 example: Green Earth Farms
 *               businessDescription:
 *                 type: string
 *                 maxLength: 2000
 *                 example: We produce organic vegetables and seeds.
 *               gstNumber:
 *                 type: string
 *                 maxLength: 20
 *                 example: 22AAAAA0000A1Z5
 *     responses:
 *       201:
 *         description: Seller application submitted.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SellerProfile'
 *       400:
 *         description: Validation error or application is already pending/approved.
 *       401:
 *         description: Missing or invalid access token.
 */
router.post('/apply', validate({ body: applySchema }), controller.apply);

/**
 * @openapi
 * /sellers/me:
 *   get:
 *     tags: [Sellers]
 *     summary: Get the current user's seller profile / application status
 *     description: Returns the user's seller profile, which includes the verification status, bank details, and service area.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile object.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SellerProfile'
 *       401:
 *         description: Missing or invalid access token.
 *       404:
 *         description: User has not applied to be a seller.
 */
router.get('/me', controller.getMyProfile);

/**
 * @openapi
 * /sellers/me:
 *   patch:
 *     tags: [Sellers]
 *     summary: Update seller profile details (business info, bank details, service area)
 *     description: Allows the seller to update their profile information. Can be done while pending or after approval.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *                 maxLength: 150
 *               businessDescription:
 *                 type: string
 *                 maxLength: 2000
 *               gstNumber:
 *                 type: string
 *                 maxLength: 20
 *               bankAccountHolder:
 *                 type: string
 *                 maxLength: 150
 *               bankAccountNumber:
 *                 type: string
 *                 maxLength: 30
 *               bankIfscCode:
 *                 type: string
 *                 pattern: '^[A-Z]{4}0[A-Z0-9]{6}$'
 *               bankName:
 *                 type: string
 *                 maxLength: 150
 *               serviceAreaLat:
 *                 type: number
 *               serviceAreaLng:
 *                 type: number
 *               serviceAreaRadiusKm:
 *                 type: number
 *     responses:
 *       200:
 *         description: Seller profile updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SellerProfile'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 *       404:
 *         description: User has not applied to be a seller.
 */
router.patch('/me', validate({ body: updateProfileSchema }), controller.updateMyProfile);

/**
 * @openapi
 * /sellers/dashboard:
 *   get:
 *     tags: [Sellers]
 *     summary: Get seller dashboard snapshot
 *     description: Active listings, orders to fulfill, and revenue snapshot for the current seller.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: number
 *                         activeProducts:
 *                           type: integer
 *                         pendingOrders:
 *                           type: integer
 *                         totalOrders:
 *                           type: integer
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: User is not an approved seller.
 */
router.get('/dashboard', authorize('SELLER', 'ADMIN'), controller.getDashboard);

/**
 * @openapi
 * /sellers/analytics:
 *   get:
 *     tags: [Sellers]
 *     summary: Get detailed seller analytics
 *     description: Sales trend over time, top performing products, and order-status breakdown for the current seller.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look back for trends.
 *       - in: query
 *         name: topProductsLimit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top products to return.
 *     responses:
 *       200:
 *         description: Analytics data.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         salesTrend:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 format: date
 *                               revenue:
 *                                 type: number
 *                               orders:
 *                                 type: integer
 *                         topProducts:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               productId:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                               unitsSold:
 *                                 type: integer
 *                               revenue:
 *                                 type: number
 *                         orderStatusBreakdown:
 *                           type: object
 *                           additionalProperties:
 *                             type: integer
 *       400:
 *         description: Validation error in query parameters.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: User is not an approved seller.
 */
router.get('/analytics', authorize('SELLER', 'ADMIN'), validate({ query: analyticsQuerySchema }), controller.getAnalytics);

// --- Admin: verification console ------------------------------------------

/**
 * @openapi
 * /sellers/applications:
 *   get:
 *     tags: [Sellers]
 *     summary: List all seller applications (Admin only)
 *     description: Paginated list of seller profiles, optionally filtered by status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [UNSUBMITTED, PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Paginated seller profiles.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only admins can list all applications.
 */
router.get(
  '/applications',
  authorize('ADMIN'),
  validate({ query: listApplicationsQuerySchema }),
  controller.listApplications
);

/**
 * @openapi
 * /sellers/applications/{id}/review:
 *   patch:
 *     tags: [Sellers]
 *     summary: Approve or reject a seller application (Admin only)
 *     description: Reviews a pending application. If approved, the user's role is elevated to `SELLER`. If rejected, the user can fix and reapply. Sends a notification to the user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Seller profile ID (not user ID).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [APPROVE, REJECT]
 *               note:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Feedback for the applicant, especially if rejected.
 *     responses:
 *       200:
 *         description: Application reviewed.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SellerProfile'
 *       400:
 *         description: Validation error or application is not in a reviewable state.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only admins can review applications.
 *       404:
 *         description: Application not found.
 */
router.patch(
  '/applications/:id/review',
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: reviewApplicationSchema }),
  controller.reviewApplication
);

export default router;
