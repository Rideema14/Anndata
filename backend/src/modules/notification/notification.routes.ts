import { Router } from 'express';
import { z } from 'zod';
import * as controller from './notification.controller';
import validate from '../../common/middlewares/validate';
import { authenticate, optionalAuthenticate } from '../../common/middlewares/authenticate';
import authorize from '../../common/middlewares/authorize';
import {
  listNotificationsQuerySchema,
  updatePreferencesSchema,
  feedbackSchema,
  respondFeedbackSchema,
  listFeedbackQuerySchema,
} from './notification.validation';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List the current user's notifications
 *     description: Returns a paginated list of notifications for the authenticated user, ordered by creation date descending.
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
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: If true, filters to only show unread notifications.
 *     responses:
 *       200:
 *         description: Paginated notifications.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Missing or invalid access token.
 */
router.get('/', authenticate, validate({ query: listNotificationsQuerySchema }), controller.list);

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get the count of unread notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count.
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
 *                         unreadCount:
 *                           type: integer
 *       401:
 *         description: Missing or invalid access token.
 */
router.get('/unread-count', authenticate, controller.unreadCount);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Missing or invalid access token.
 *       404:
 *         description: Notification not found.
 */
router.patch('/:id/read', authenticate, validate({ params: idParamSchema }), controller.markRead);

/**
 * @openapi
 * /notifications/read-all:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read.
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
 *                         updatedCount:
 *                           type: integer
 *       401:
 *         description: Missing or invalid access token.
 */
router.post('/read-all', authenticate, controller.markAllRead);

/**
 * @openapi
 * /notifications/preferences:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification preferences
 *     description: Returns the user's settings for email/in-app notifications and muted categories.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/NotificationPreference'
 *       401:
 *         description: Missing or invalid access token.
 */
router.get('/preferences', authenticate, controller.getPreferences);

/**
 * @openapi
 * /notifications/preferences:
 *   patch:
 *     tags: [Notifications]
 *     summary: Update notification preferences
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailEnabled:
 *                 type: boolean
 *               inAppEnabled:
 *                 type: boolean
 *               mutedTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ORDER_STATUS, PAYMENT, SELLER_VERIFICATION, REVIEW, PRICE_ALERT, GENERAL]
 *     responses:
 *       200:
 *         description: Preferences updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/NotificationPreference'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 */
router.patch('/preferences', authenticate, validate({ body: updatePreferencesSchema }), controller.updatePreferences);

// --- Feedback ----------------------------------------------------------

/**
 * @openapi
 * /notifications/feedback:
 *   post:
 *     tags: [Feedback]
 *     summary: Submit feedback, bug reports, or support requests
 *     description: Can be submitted anonymously (without a token) or authenticated. If authenticated, the feedback is linked to the user.
 *     security:
 *       - []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, message]
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [BUG, FEATURE_REQUEST, COMPLAINT, GENERAL]
 *                 default: GENERAL
 *               subject:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 150
 *               message:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 3000
 *     responses:
 *       201:
 *         description: Feedback submitted.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Validation error.
 */
// Feedback can be submitted anonymously (the service accepts a null userId) —
// optionalAuthenticate attaches req.user when a token is present without
// rejecting the request when it isn't.
router.post('/feedback', optionalAuthenticate, validate({ body: feedbackSchema }), controller.submitFeedback);

/**
 * @openapi
 * /notifications/feedback/mine:
 *   get:
 *     tags: [Feedback]
 *     summary: List feedback submitted by the current user
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
 *           enum: [OPEN, IN_REVIEW, RESOLVED, CLOSED]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [BUG, FEATURE_REQUEST, COMPLAINT, GENERAL]
 *     responses:
 *       200:
 *         description: Paginated feedback.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Missing or invalid access token.
 */
router.get('/feedback/mine', authenticate, validate({ query: listFeedbackQuerySchema }), controller.myFeedback);

/**
 * @openapi
 * /notifications/feedback:
 *   get:
 *     tags: [Feedback]
 *     summary: List all feedback (Admin only)
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
 *           enum: [OPEN, IN_REVIEW, RESOLVED, CLOSED]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [BUG, FEATURE_REQUEST, COMPLAINT, GENERAL]
 *     responses:
 *       200:
 *         description: Paginated feedback.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only admins can view all feedback.
 */
router.get(
  '/feedback',
  authenticate,
  authorize('ADMIN'),
  validate({ query: listFeedbackQuerySchema }),
  controller.listFeedback
);

/**
 * @openapi
 * /notifications/feedback/{id}:
 *   patch:
 *     tags: [Feedback]
 *     summary: Respond to or update the status of feedback (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, IN_REVIEW, RESOLVED, CLOSED]
 *               adminResponse:
 *                 type: string
 *                 maxLength: 3000
 *     responses:
 *       200:
 *         description: Feedback updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Only admins can respond to feedback.
 *       404:
 *         description: Feedback not found.
 */
router.patch(
  '/feedback/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: respondFeedbackSchema }),
  controller.respondToFeedback
);

export default router;
