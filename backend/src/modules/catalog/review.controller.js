const reviewService = require('./review.service');
const ApiResponse = require('../../common/utils/ApiResponse');
const asyncHandler = require('../../common/middlewares/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await reviewService.listReviews(req.params.id, req.query);
  ApiResponse.paginated(res, items, meta);
});

const create = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.params.id, req.user.id, req.body);
  ApiResponse.created(res, review, 'Review posted.');
});

const update = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(req.params.reviewId, req.user.id, req.body);
  ApiResponse.ok(res, review, 'Review updated.');
});

const remove = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.reviewId, req.user);
  ApiResponse.noContent(res);
});

const setApproval = asyncHandler(async (req, res) => {
  const review = await reviewService.setReviewApproval(req.params.reviewId, req.body.isApproved);
  ApiResponse.ok(res, review, 'Review moderation updated.');
});

module.exports = { list, create, update, remove, setApproval };
