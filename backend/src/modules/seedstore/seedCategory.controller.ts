import * as seedCategoryService from './seedCategory.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  const categories = await seedCategoryService.listSeedCategories({ includeInactive: req.user?.role === 'ADMIN' });
  ApiResponse.ok(res, categories);
});

export const getOne = asyncHandler(async (req, res) => {
  const category = await seedCategoryService.getSeedCategoryBySlug(req.params.slug);
  ApiResponse.ok(res, category);
});

export const create = asyncHandler(async (req, res) => {
  const category = await seedCategoryService.createSeedCategory(req.body);
  ApiResponse.created(res, category, 'Seed category created.');
});

export const update = asyncHandler(async (req, res) => {
  const category = await seedCategoryService.updateSeedCategory(req.params.id, req.body);
  ApiResponse.ok(res, category, 'Seed category updated.');
});

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file uploaded. Use the "image" field.');
  const category = await seedCategoryService.updateSeedCategoryImage(req.params.id, req.file.buffer);
  ApiResponse.ok(res, category, 'Seed category image updated.');
});

export const remove = asyncHandler(async (req, res) => {
  await seedCategoryService.deleteSeedCategory(req.params.id);
  ApiResponse.noContent(res);
});
