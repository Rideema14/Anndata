import * as landService from './land.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await landService.listLand(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const getOne = asyncHandler(async (req, res) => {
  const land = await landService.getLandBySlug(req.params.slug);
  ApiResponse.ok(res, land);
});

export const myListings = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const { items, meta } = await landService.myListings(req.user, req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const create = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const land = await landService.createLand(req.user, req.body);
  ApiResponse.created(res, land, 'Land listing created.');
});

export const update = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const land = await landService.updateLand(req.params.id, req.user, req.body);
  ApiResponse.ok(res, land, 'Land listing updated.');
});

export const remove = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await landService.deleteLand(req.params.id, req.user);
  ApiResponse.noContent(res);
});

export const addImages = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) throw ApiError.badRequest('No image files uploaded. Use the "images" field.');
  const images = await landService.addLandImages(req.params.id, req.user, files);
  ApiResponse.created(res, images, 'Images uploaded.');
});

export const removeImage = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await landService.removeLandImage(req.params.id, req.params.imageId, req.user);
  ApiResponse.noContent(res);
});
