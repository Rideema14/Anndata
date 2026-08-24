import * as analyticsService from './machineryAnalytics.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const getDashboard = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const dashboard = await analyticsService.getDashboard(req.user.id);
  ApiResponse.ok(res, dashboard);
});

export const getAnalytics = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const analytics = await analyticsService.getAnalytics(req.user.id, req.query as any);
  ApiResponse.ok(res, analytics);
});

export const getCalendar = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const calendar = await analyticsService.getBookingCalendar(req.user.id, req.query as any);
  ApiResponse.ok(res, calendar);
});
