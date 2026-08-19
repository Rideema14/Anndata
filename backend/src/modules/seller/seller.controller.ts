import * as sellerService from './seller.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const getMyProfile = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const profile = await sellerService.getMyProfile(req.user.id);
  ApiResponse.ok(res, profile);
});

export const apply = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const profile = await sellerService.applyAsSeller(req.user.id, req.body);
  ApiResponse.created(res, profile, 'Seller application submitted.');
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const profile = await sellerService.updateMyProfile(req.user.id, req.body);
  ApiResponse.ok(res, profile, 'Seller profile updated.');
});

export const listApplications = asyncHandler(async (req, res) => {
  const { items, meta } = await sellerService.listApplications(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const reviewApplication = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const profile = await sellerService.reviewApplication(req.params.id, req.user, req.body);
  ApiResponse.ok(res, profile, 'Application reviewed.');
});

export const getDashboard = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const dashboard = await sellerService.getDashboard(req.user.id);
  ApiResponse.ok(res, dashboard);
});

export const getAnalytics = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const analytics = await sellerService.getAnalytics(req.user.id, req.query as any);
  ApiResponse.ok(res, analytics);
});
