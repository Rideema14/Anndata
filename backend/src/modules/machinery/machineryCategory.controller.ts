import * as categoryService from './machineryCategory.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  const categories = await categoryService.listMachineryCategories({ includeInactive: req.user?.role === 'ADMIN' });
  ApiResponse.ok(res, categories);
});

export const getOne = asyncHandler(async (req, res) => {
  const category = await categoryService.getMachineryCategoryBySlug(req.params.slug);
  ApiResponse.ok(res, category);
});

export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createMachineryCategory(req.body);
  ApiResponse.created(res, category, 'Machinery category created.');
});

export const update = asyncHandler(async (req, res) => {
  const category = await categoryService.updateMachineryCategory(req.params.id, req.body);
  ApiResponse.ok(res, category, 'Machinery category updated.');
});

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file uploaded. Use the "image" field.');
  const category = await categoryService.updateMachineryCategoryImage(req.params.id, req.file.buffer);
  ApiResponse.ok(res, category, 'Machinery category image updated.');
});

export const remove = asyncHandler(async (req, res) => {
  await categoryService.deleteMachineryCategory(req.params.id);
  ApiResponse.noContent(res);
});
