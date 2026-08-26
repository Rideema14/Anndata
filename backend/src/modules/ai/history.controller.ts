import * as historyService from './history.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const getHistory = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const history = await historyService.getUnifiedHistory(req.user.id, req.query as any);
  ApiResponse.ok(res, history);
});
