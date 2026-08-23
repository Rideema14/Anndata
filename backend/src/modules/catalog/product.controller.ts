import * as productService from './product.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await productService.listProducts(req.query as any, req.user?.id);
  ApiResponse.paginated(res, items, meta);
});

export const nearby = asyncHandler(async (req, res) => {
  const items = await productService.nearbyProducts(req.query as any);
  ApiResponse.ok(res, items);
});

export const topDeals = asyncHandler(async (req, res) => {
  const items = await productService.topDeals(req.query as any);
  ApiResponse.ok(res, items);
});

export const getOne = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug, req.user?.id);
  ApiResponse.ok(res, product);
});

export const create = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const product = await productService.createProduct(req.user, req.body);
  ApiResponse.created(res, product, 'Product created.');
});

export const update = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const product = await productService.updateProduct(req.params.id, req.user, req.body);
  ApiResponse.ok(res, product, 'Product updated.');
});

export const remove = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await productService.deleteProduct(req.params.id, req.user);
  ApiResponse.noContent(res);
});

export const addImages = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) throw ApiError.badRequest('No image files uploaded. Use the "images" field.');
  const images = await productService.addProductImages(req.params.id, req.user, files);
  ApiResponse.created(res, images, 'Images uploaded.');
});

export const removeImage = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await productService.removeProductImage(req.params.id, req.params.imageId, req.user);
  ApiResponse.noContent(res);
});

export const addVariant = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const variant = await productService.addVariant(req.params.id, req.user, req.body);
  ApiResponse.created(res, variant, 'Variant added.');
});

export const updateVariant = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const variant = await productService.updateVariant(req.params.id, req.params.variantId, req.user, req.body);
  ApiResponse.ok(res, variant, 'Variant updated.');
});

export const removeVariant = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await productService.removeVariant(req.params.id, req.params.variantId, req.user);
  ApiResponse.noContent(res);
});
