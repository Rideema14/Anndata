import * as soilReportService from './soilReport.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const analyze = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const report = await soilReportService.analyzeSoil(req.user.id, req.body);
  ApiResponse.created(res, report, 'Soil analysis complete.');
});

export const list = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const { items, meta } = await soilReportService.listSoilReports(req.user.id, req.query);
  ApiResponse.paginated(res, items, meta);
});

export const getOne = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const report = await soilReportService.getSoilReportById(req.user.id, req.params.id);
  ApiResponse.ok(res, report);
});

export const remove = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await soilReportService.deleteSoilReport(req.user.id, req.params.id);
  ApiResponse.noContent(res);
});
