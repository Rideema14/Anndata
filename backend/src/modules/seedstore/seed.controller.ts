import * as seedService from './seed.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await seedService.listSeeds(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const getOne = asyncHandler(async (req, res) => {
  const seed = await seedService.getSeedBySlug(req.params.slug, req.user?.id);
  ApiResponse.ok(res, seed);
});

export const create = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const seed = await seedService.createSeed(req.user, req.body);
  ApiResponse.created(res, seed, 'Seed listing created.');
});

export const update = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const seed = await seedService.updateSeed(req.params.id, req.user, req.body);
  ApiResponse.ok(res, seed, 'Seed listing updated.');
});

export const remove = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await seedService.deleteSeed(req.params.id, req.user);
  ApiResponse.noContent(res);
});

export const addImages = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) throw ApiError.badRequest('No image files uploaded. Use the "images" field.');
  const images = await seedService.addSeedImages(req.params.id, req.user, files);
  ApiResponse.created(res, images, 'Images uploaded.');
});

export const removeImage = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await seedService.removeSeedImage(req.params.id, req.params.imageId, req.user);
  ApiResponse.noContent(res);
});

export const addVariant = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const variant = await seedService.addVariant(req.params.id, req.user, req.body);
  ApiResponse.created(res, variant, 'Variant added.');
});

export const updateVariant = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const variant = await seedService.updateVariant(req.params.id, req.params.variantId, req.user, req.body);
  ApiResponse.ok(res, variant, 'Variant updated.');
});

export const removeVariant = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await seedService.removeVariant(req.params.id, req.params.variantId, req.user);
  ApiResponse.noContent(res);
});
