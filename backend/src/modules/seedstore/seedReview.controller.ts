import * as seedReviewService from './seedReview.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await seedReviewService.listSeedReviews(req.params.id, req.query);
  ApiResponse.paginated(res, items, meta);
});

export const create = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const review = await seedReviewService.createSeedReview(req.params.id, req.user.id, req.body);
  ApiResponse.created(res, review, 'Review posted.');
});

export const update = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const review = await seedReviewService.updateSeedReview(req.params.reviewId, req.user.id, req.body);
  ApiResponse.ok(res, review, 'Review updated.');
});

export const remove = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await seedReviewService.deleteSeedReview(req.params.reviewId, req.user);
  ApiResponse.noContent(res);
});

export const setApproval = asyncHandler(async (req, res) => {
  const review = await seedReviewService.setSeedReviewApproval(req.params.reviewId, req.body.isApproved);
  ApiResponse.ok(res, review, 'Review moderation updated.');
});
