const profileService = require('./profile.service');
const ApiResponse = require('../../common/utils/ApiResponse');
const ApiError = require('../../common/utils/ApiError');
const asyncHandler = require('../../common/middlewares/asyncHandler');
const { parsePagination, buildPaginationMeta } = require('../../common/utils/pagination');

const updateProfile = asyncHandler(async (req, res) => {
  const user = await profileService.updateProfile(req.user.id, req.body);
  ApiResponse.ok(res, user, 'Profile updated.');
});

const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file uploaded. Use the "image" field.');
  const user = await profileService.updateProfileImage(req.user.id, req.file.buffer);
  ApiResponse.ok(res, user, 'Profile image updated.');
});

const loginHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { items, totalItems } = await profileService.getLoginHistory(req.user.id, { skip, take });
  ApiResponse.paginated(res, items, buildPaginationMeta(page, limit, totalItems));
});

module.exports = { updateProfile, uploadProfileImage, loginHistory };
