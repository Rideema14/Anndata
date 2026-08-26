import * as cropAnalysisService from './cropAnalysis.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const cropAdvisor = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const analysis = await cropAnalysisService.getCropAdvice(req.user.id, req.body);
  ApiResponse.created(res, analysis, 'Crop recommendation ready.');
});

export const diseaseDetection = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  if (!req.file) throw ApiError.badRequest('No image file uploaded. Use the "image" field.');
  const analysis = await cropAnalysisService.detectDisease(req.user.id, req.body, req.file.buffer);
  ApiResponse.created(res, analysis, 'Disease detection complete.');
});

export const fertilizerAdvice = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const analysis = await cropAnalysisService.getFertilizerAdvice(req.user.id, req.body);
  ApiResponse.created(res, analysis, 'Fertilizer recommendation ready.');
});

export const irrigationAdvice = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const analysis = await cropAnalysisService.getIrrigationAdvice(req.user.id, req.body);
  ApiResponse.created(res, analysis, 'Irrigation recommendation ready.');
});

export const cropRotation = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const analysis = await cropAnalysisService.getCropRotationPlan(req.user.id, req.body);
  ApiResponse.created(res, analysis, 'Crop rotation plan ready.');
});

export const weatherAdvice = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const analysis = await cropAnalysisService.getWeatherAdvice(req.user.id, req.body);
  ApiResponse.created(res, analysis, 'Weather-based recommendation ready.');
});

export const list = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const { items, meta } = await cropAnalysisService.listCropAnalyses(req.user.id, req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const getOne = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const analysis = await cropAnalysisService.getCropAnalysisById(req.user.id, req.params.id);
  ApiResponse.ok(res, analysis);
});

export const remove = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await cropAnalysisService.deleteCropAnalysis(req.user.id, req.params.id);
  ApiResponse.noContent(res);
});
