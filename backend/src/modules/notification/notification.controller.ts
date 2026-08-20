import * as notificationService from './notification.service';
import * as feedbackService from './feedback.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const { items, meta } = await notificationService.listNotifications(req.user.id, req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const unreadCount = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const result = await notificationService.getUnreadCount(req.user.id);
  ApiResponse.ok(res, result);
});

export const markRead = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const notification = await notificationService.markAsRead(req.user.id, req.params.id);
  ApiResponse.ok(res, notification);
});

export const markAllRead = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const result = await notificationService.markAllAsRead(req.user.id);
  ApiResponse.ok(res, result);
});

export const getPreferences = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const pref = await notificationService.getPreferences(req.user.id);
  ApiResponse.ok(res, pref);
});

export const updatePreferences = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const pref = await notificationService.updatePreferences(req.user.id, req.body);
  ApiResponse.ok(res, pref, 'Preferences updated.');
});

export const submitFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.submitFeedback(req.user?.id, req.body);
  ApiResponse.created(res, feedback, 'Thanks for the feedback.');
});

export const myFeedback = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const { items, meta } = await feedbackService.getMyFeedback(req.user.id, req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const listFeedback = asyncHandler(async (req, res) => {
  const { items, meta } = await feedbackService.listFeedback(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const respondToFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.respondToFeedback(req.params.id, req.body);
  ApiResponse.ok(res, feedback, 'Feedback updated.');
});
