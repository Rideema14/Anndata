import * as categoryService from './category.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories({ includeInactive: req.user?.role === 'ADMIN' });
  ApiResponse.ok(res, categories);
});

export const getOne = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  ApiResponse.ok(res, category);
});

export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  ApiResponse.created(res, category, 'Category created.');
});

export const update = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  ApiResponse.ok(res, category, 'Category updated.');
});

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file uploaded. Use the "image" field.');
  const category = await categoryService.updateCategoryImage(req.params.id, req.file.buffer);
  ApiResponse.ok(res, category, 'Category image updated.');
});

export const remove = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  ApiResponse.noContent(res);
});

export const createSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await categoryService.createSubCategory(req.body);
  ApiResponse.created(res, subCategory, 'Sub-category created.');
});

export const updateSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await categoryService.updateSubCategory(req.params.id, req.body);
  ApiResponse.ok(res, subCategory, 'Sub-category updated.');
});

export const removeSubCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteSubCategory(req.params.id);
  ApiResponse.noContent(res);
});
