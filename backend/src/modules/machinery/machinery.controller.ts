import * as machineryService from './machinery.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';
import type { AvailabilityQuery } from './machinery.validation';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await machineryService.listMachinery(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const getOne = asyncHandler(async (req, res) => {
  const machinery = await machineryService.getMachineryBySlug(req.params.slug);
  ApiResponse.ok(res, machinery);
});

export const getAvailability = asyncHandler(async (req, res) => {
  const { startDate, endDate, quantity } = req.query as unknown as AvailabilityQuery;
  const result = await machineryService.getMachineryAvailability(req.params.id, startDate, endDate, quantity);
  ApiResponse.ok(res, result);
});

export const create = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const machinery = await machineryService.createMachinery(req.user, req.body);
  ApiResponse.created(res, machinery, 'Machinery listing created.');
});

export const update = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const machinery = await machineryService.updateMachinery(req.params.id, req.user, req.body);
  ApiResponse.ok(res, machinery, 'Machinery listing updated.');
});

export const remove = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await machineryService.deleteMachinery(req.params.id, req.user);
  ApiResponse.noContent(res);
});

export const addImages = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) throw ApiError.badRequest('No image files uploaded. Use the "images" field.');
  const images = await machineryService.addMachineryImages(req.params.id, req.user, files);
  ApiResponse.created(res, images, 'Images uploaded.');
});

export const removeImage = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await machineryService.removeMachineryImage(req.params.id, req.params.imageId, req.user);
  ApiResponse.noContent(res);
});

export const addDiscountTier = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const tier = await machineryService.addDiscountTier(req.params.id, req.user, req.body);
  ApiResponse.created(res, tier, 'Discount tier added.');
});

export const updateDiscountTier = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const tier = await machineryService.updateDiscountTier(req.params.id, req.params.tierId, req.user, req.body);
  ApiResponse.ok(res, tier, 'Discount tier updated.');
});

export const removeDiscountTier = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await machineryService.removeDiscountTier(req.params.id, req.params.tierId, req.user);
  ApiResponse.noContent(res);
});
