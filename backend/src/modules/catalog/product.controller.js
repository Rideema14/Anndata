const productService = require('./product.service');
const ApiResponse = require('../../common/utils/ApiResponse');
const ApiError = require('../../common/utils/ApiError');
const asyncHandler = require('../../common/middlewares/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await productService.listProducts(req.query);
  ApiResponse.paginated(res, items, meta);
});

const nearby = asyncHandler(async (req, res) => {
  const items = await productService.nearbyProducts(req.query);
  ApiResponse.ok(res, items);
});

const topDeals = asyncHandler(async (req, res) => {
  const items = await productService.topDeals(req.query);
  ApiResponse.ok(res, items);
});

const getOne = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug, req.user?.id);
  ApiResponse.ok(res, product);
});

const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.user, req.body);
  ApiResponse.created(res, product, 'Product created.');
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.user, req.body);
  ApiResponse.ok(res, product, 'Product updated.');
});

const remove = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id, req.user);
  ApiResponse.noContent(res);
});

const addImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) throw ApiError.badRequest('No image files uploaded. Use the "images" field.');
  const images = await productService.addProductImages(req.params.id, req.user, req.files);
  ApiResponse.created(res, images, 'Images uploaded.');
});

const removeImage = asyncHandler(async (req, res) => {
  await productService.removeProductImage(req.params.id, req.params.imageId, req.user);
  ApiResponse.noContent(res);
});

const addVariant = asyncHandler(async (req, res) => {
  const variant = await productService.addVariant(req.params.id, req.user, req.body);
  ApiResponse.created(res, variant, 'Variant added.');
});

const updateVariant = asyncHandler(async (req, res) => {
  const variant = await productService.updateVariant(req.params.id, req.params.variantId, req.user, req.body);
  ApiResponse.ok(res, variant, 'Variant updated.');
});

const removeVariant = asyncHandler(async (req, res) => {
  await productService.removeVariant(req.params.id, req.params.variantId, req.user);
  ApiResponse.noContent(res);
});

module.exports = { list, nearby, topDeals, getOne, create, update, remove, addImages, removeImage, addVariant, updateVariant, removeVariant };
