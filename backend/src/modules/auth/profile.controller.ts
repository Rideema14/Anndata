import * as profileService from './profile.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';

export const updateProfile = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const user = await profileService.updateProfile(req.user.id, req.body);
  ApiResponse.ok(res, user, 'Profile updated.');
});

export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  if (!req.file) throw ApiError.badRequest('No image file uploaded. Use the "image" field.');
  const user = await profileService.updateProfileImage(req.user.id, req.file.buffer);
  ApiResponse.ok(res, user, 'Profile image updated.');
});

export const removeProfileImage = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const user = await profileService.removeProfileImage(req.user.id);
  ApiResponse.ok(res, user, 'Profile image removed.');
});

export const loginHistory = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const { page, limit, skip, take } = parsePagination(req.query);
  const { items, totalItems } = await profileService.getLoginHistory(req.user.id, { skip, take });
  ApiResponse.paginated(res, items, buildPaginationMeta(page, limit, totalItems));
});
