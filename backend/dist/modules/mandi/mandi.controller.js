"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAlert = exports.updateAlert = exports.createAlert = exports.listAlerts = exports.removeFavorite = exports.addFavorite = exports.listFavorites = exports.syncStatus = exports.syncPrices = exports.getPriceHistory = exports.bulkCreatePrices = exports.createPrice = exports.listPrices = exports.deleteCrop = exports.updateCrop = exports.createCrop = exports.listCrops = exports.deleteMandi = exports.updateMandi = exports.createMandi = exports.getMandi = exports.listMandis = exports.listDistricts = exports.listStates = void 0;
const mandiService = __importStar(require("./mandi.service"));
const priceService = __importStar(require("./price.service"));
const favoriteService = __importStar(require("./favorite.service"));
const alertService = __importStar(require("./alert.service"));
const ingestionService = __importStar(require("./ingestion.service"));
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
// --- Cascading location filters ---------------------------------------------
exports.listStates = (0, asyncHandler_1.default)(async (req, res) => {
    const states = await mandiService.listStates();
    ApiResponse_1.default.ok(res, states);
});
exports.listDistricts = (0, asyncHandler_1.default)(async (req, res) => {
    const districts = await mandiService.listDistricts(req.query.state);
    ApiResponse_1.default.ok(res, districts);
});
// --- Mandi CRUD --------------------------------------------------------
exports.listMandis = (0, asyncHandler_1.default)(async (req, res) => {
    const { items, meta } = await mandiService.listMandis(req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.getMandi = (0, asyncHandler_1.default)(async (req, res) => {
    const mandi = await mandiService.getMandiById(req.params.id);
    ApiResponse_1.default.ok(res, mandi);
});
exports.createMandi = (0, asyncHandler_1.default)(async (req, res) => {
    const mandi = await mandiService.createMandi(req.body);
    ApiResponse_1.default.created(res, mandi, 'Mandi created.');
});
exports.updateMandi = (0, asyncHandler_1.default)(async (req, res) => {
    const mandi = await mandiService.updateMandi(req.params.id, req.body);
    ApiResponse_1.default.ok(res, mandi, 'Mandi updated.');
});
exports.deleteMandi = (0, asyncHandler_1.default)(async (req, res) => {
    await mandiService.deleteMandi(req.params.id);
    ApiResponse_1.default.noContent(res);
});
// --- Crop CRUD -----------------------------------------------------------
exports.listCrops = (0, asyncHandler_1.default)(async (req, res) => {
    const crops = await mandiService.listCrops();
    ApiResponse_1.default.ok(res, crops);
});
exports.createCrop = (0, asyncHandler_1.default)(async (req, res) => {
    const crop = await mandiService.createCrop(req.body);
    ApiResponse_1.default.created(res, crop, 'Crop created.');
});
exports.updateCrop = (0, asyncHandler_1.default)(async (req, res) => {
    const crop = await mandiService.updateCrop(req.params.id, req.body);
    ApiResponse_1.default.ok(res, crop, 'Crop updated.');
});
exports.deleteCrop = (0, asyncHandler_1.default)(async (req, res) => {
    await mandiService.deleteCrop(req.params.id);
    ApiResponse_1.default.noContent(res);
});
// --- Prices ----------------------------------------------------------------
exports.listPrices = (0, asyncHandler_1.default)(async (req, res) => {
    const { items, meta } = await priceService.listPrices(req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.createPrice = (0, asyncHandler_1.default)(async (req, res) => {
    const price = await priceService.createPriceEntry(req.body);
    ApiResponse_1.default.created(res, price, 'Price recorded.');
});
exports.bulkCreatePrices = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await priceService.bulkUpsertPriceEntries(req.body.entries, 'ADMIN');
    ApiResponse_1.default.created(res, result, `${result.created} price record(s) imported.`);
});
exports.getPriceHistory = (0, asyncHandler_1.default)(async (req, res) => {
    const history = await priceService.getPriceHistory(req.query);
    ApiResponse_1.default.ok(res, history);
});
exports.syncPrices = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await ingestionService.syncFromDataGovIn();
    ApiResponse_1.default.ok(res, result, 'Sync complete.');
});
exports.syncStatus = (0, asyncHandler_1.default)(async (req, res) => {
    ApiResponse_1.default.ok(res, { configured: ingestionService.isIngestionConfigured() });
});
// --- Favorites ---------------------------------------------------------
exports.listFavorites = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const favorites = await favoriteService.listFavorites(req.user.id);
    ApiResponse_1.default.ok(res, favorites);
});
exports.addFavorite = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const favorite = await favoriteService.addFavorite(req.user.id, req.params.mandiId);
    ApiResponse_1.default.created(res, favorite, 'Added to favorites.');
});
exports.removeFavorite = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    await favoriteService.removeFavorite(req.user.id, req.params.mandiId);
    ApiResponse_1.default.noContent(res);
});
// --- Price alerts --------------------------------------------------------
exports.listAlerts = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const alerts = await alertService.listAlerts(req.user.id);
    ApiResponse_1.default.ok(res, alerts);
});
exports.createAlert = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const alert = await alertService.createAlert(req.user.id, req.body);
    ApiResponse_1.default.created(res, alert, 'Alert created.');
});
exports.updateAlert = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const alert = await alertService.updateAlert(req.user.id, req.params.id, req.body);
    ApiResponse_1.default.ok(res, alert, 'Alert updated.');
});
exports.deleteAlert = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    await alertService.deleteAlert(req.user.id, req.params.id);
    ApiResponse_1.default.noContent(res);
});
//# sourceMappingURL=mandi.controller.js.map