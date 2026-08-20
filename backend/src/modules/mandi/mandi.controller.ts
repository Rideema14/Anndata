import * as mandiService from './mandi.service';
import * as priceService from './price.service';
import * as favoriteService from './favorite.service';
import * as alertService from './alert.service';
import * as ingestionService from './ingestion.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

// --- Cascading location filters ---------------------------------------------

export const listStates = asyncHandler(async (req, res) => {
  const states = await mandiService.listStates();
  ApiResponse.ok(res, states);
});

export const listDistricts = asyncHandler(async (req, res) => {
  const districts = await mandiService.listDistricts(req.query.state as string);
  ApiResponse.ok(res, districts);
});

// --- Mandi CRUD --------------------------------------------------------

export const listMandis = asyncHandler(async (req, res) => {
  const { items, meta } = await mandiService.listMandis(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const getMandi = asyncHandler(async (req, res) => {
  const mandi = await mandiService.getMandiById(req.params.id);
  ApiResponse.ok(res, mandi);
});

export const createMandi = asyncHandler(async (req, res) => {
  const mandi = await mandiService.createMandi(req.body);
  ApiResponse.created(res, mandi, 'Mandi created.');
});

export const updateMandi = asyncHandler(async (req, res) => {
  const mandi = await mandiService.updateMandi(req.params.id, req.body);
  ApiResponse.ok(res, mandi, 'Mandi updated.');
});

export const deleteMandi = asyncHandler(async (req, res) => {
  await mandiService.deleteMandi(req.params.id);
  ApiResponse.noContent(res);
});

// --- Crop CRUD -----------------------------------------------------------

export const listCrops = asyncHandler(async (req, res) => {
  const crops = await mandiService.listCrops();
  ApiResponse.ok(res, crops);
});

export const createCrop = asyncHandler(async (req, res) => {
  const crop = await mandiService.createCrop(req.body);
  ApiResponse.created(res, crop, 'Crop created.');
});

export const updateCrop = asyncHandler(async (req, res) => {
  const crop = await mandiService.updateCrop(req.params.id, req.body);
  ApiResponse.ok(res, crop, 'Crop updated.');
});

export const deleteCrop = asyncHandler(async (req, res) => {
  await mandiService.deleteCrop(req.params.id);
  ApiResponse.noContent(res);
});

// --- Prices ----------------------------------------------------------------

export const listPrices = asyncHandler(async (req, res) => {
  const { items, meta } = await priceService.listPrices(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const createPrice = asyncHandler(async (req, res) => {
  const price = await priceService.createPriceEntry(req.body);
  ApiResponse.created(res, price, 'Price recorded.');
});

export const bulkCreatePrices = asyncHandler(async (req, res) => {
  const result = await priceService.bulkUpsertPriceEntries(req.body.entries, 'ADMIN');
  ApiResponse.created(res, result, `${result.created} price record(s) imported.`);
});

export const getPriceHistory = asyncHandler(async (req, res) => {
  const history = await priceService.getPriceHistory(req.query as any);
  ApiResponse.ok(res, history);
});

export const syncPrices = asyncHandler(async (req, res) => {
  const result = await ingestionService.syncFromDataGovIn();
  ApiResponse.ok(res, result, 'Sync complete.');
});

export const syncStatus = asyncHandler(async (req, res) => {
  ApiResponse.ok(res, { configured: ingestionService.isIngestionConfigured() });
});

// --- Favorites ---------------------------------------------------------

export const listFavorites = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const favorites = await favoriteService.listFavorites(req.user.id);
  ApiResponse.ok(res, favorites);
});

export const addFavorite = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const favorite = await favoriteService.addFavorite(req.user.id, req.params.mandiId);
  ApiResponse.created(res, favorite, 'Added to favorites.');
});

export const removeFavorite = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await favoriteService.removeFavorite(req.user.id, req.params.mandiId);
  ApiResponse.noContent(res);
});

// --- Price alerts --------------------------------------------------------

export const listAlerts = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const alerts = await alertService.listAlerts(req.user.id);
  ApiResponse.ok(res, alerts);
});

export const createAlert = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const alert = await alertService.createAlert(req.user.id, req.body);
  ApiResponse.created(res, alert, 'Alert created.');
});

export const updateAlert = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const alert = await alertService.updateAlert(req.user.id, req.params.id, req.body);
  ApiResponse.ok(res, alert, 'Alert updated.');
});

export const deleteAlert = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await alertService.deleteAlert(req.user.id, req.params.id);
  ApiResponse.noContent(res);
});
