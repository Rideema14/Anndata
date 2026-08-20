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
 */
router.get('/', authenticate, validate({ query: listNotificationsQuerySchema }), controller.list);

router.get('/unread-count', authenticate, controller.unreadCount);

router.patch('/:id/read', authenticate, validate({ params: idParamSchema }), controller.markRead);

router.post('/read-all', authenticate, controller.markAllRead);

router.get('/preferences', authenticate, controller.getPreferences);

router.patch('/preferences', authenticate, validate({ body: updatePreferencesSchema }), controller.updatePreferences);

// --- Feedback ----------------------------------------------------------

// Feedback can be submitted anonymously (the service accepts a null userId) —
// optionalAuthenticate attaches req.user when a token is present without
// rejecting the request when it isn't.
router.post('/feedback', optionalAuthenticate, validate({ body: feedbackSchema }), controller.submitFeedback);

router.get('/feedback/mine', authenticate, validate({ query: listFeedbackQuerySchema }), controller.myFeedback);

router.get(
  '/feedback',
  authenticate,
  authorize('ADMIN'),
  validate({ query: listFeedbackQuerySchema }),
  controller.listFeedback
);

router.patch(
  '/feedback/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: respondFeedbackSchema }),
  controller.respondToFeedback
);

export default router;
