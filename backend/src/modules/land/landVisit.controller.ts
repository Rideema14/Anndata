import * as landVisitService from './landVisit.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const create = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const visit = await landVisitService.requestVisit(req.params.id, req.user, req.body);
  ApiResponse.created(res, visit, 'Visit request submitted.');
});

export const listForLand = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const { items, meta } = await landVisitService.listVisitRequestsForLand(req.params.id, req.user, req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const myVisitRequests = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const { items, meta } = await landVisitService.myVisitRequests(req.user, req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const getOne = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const visit = await landVisitService.getVisitRequestById(req.params.id, req.user);
  ApiResponse.ok(res, visit);
});

export const updateStatus = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const visit = await landVisitService.updateVisitStatus(req.params.id, req.user, req.body);
  ApiResponse.ok(res, visit, 'Visit request updated.');
});
