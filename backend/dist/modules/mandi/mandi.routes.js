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
const express_1 = require("express");
const zod_1 = require("zod");
const controller = __importStar(require("./mandi.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const authorize_1 = __importDefault(require("../../common/middlewares/authorize"));
const mandi_validation_1 = require("./mandi.validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid() });
const mandiIdParamSchema = zod_1.z.object({ mandiId: zod_1.z.string().uuid() });
// --- Cascading location filters (public) ------------------------------------
/**
 * @openapi
 * /mandi/states:
 *   get:
 *     tags: [Mandi]
 *     summary: List states that have at least one active mandi
 */
router.get('/states', controller.listStates);
router.get('/districts', (0, validate_1.default)({ query: mandi_validation_1.districtsQuerySchema }), controller.listDistricts);
// --- Markets (mandis) --------------------------------------------------
router.get('/markets', (0, validate_1.default)({ query: mandi_validation_1.mandiListQuerySchema }), controller.listMandis);
router.get('/markets/:id', (0, validate_1.default)({ params: idParamSchema }), controller.getMandi);
router.post('/markets', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ body: mandi_validation_1.mandiSchema }), controller.createMandi);
router.patch('/markets/:id', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: mandi_validation_1.mandiSchema.partial() }), controller.updateMandi);
router.delete('/markets/:id', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: idParamSchema }), controller.deleteMandi);
// --- Crops -----------------------------------------------------------------
router.get('/crops', controller.listCrops);
router.post('/crops', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ body: mandi_validation_1.cropSchema }), controller.createCrop);
router.patch('/crops/:id', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: mandi_validation_1.cropSchema.partial() }), controller.updateCrop);
router.delete('/crops/:id', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: idParamSchema }), controller.deleteCrop);
// --- Prices ------------------------------------------------------------
/**
 * @openapi
 * /mandi/prices:
 *   get:
 *     tags: [Mandi]
 *     summary: Query price records, filterable by state/district/mandi/crop/date range
 */
router.get('/prices', (0, validate_1.default)({ query: mandi_validation_1.priceQuerySchema }), controller.listPrices);
router.post('/prices', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ body: mandi_validation_1.priceEntrySchema }), controller.createPrice);
router.post('/prices/bulk', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ body: mandi_validation_1.bulkPriceEntrySchema }), controller.bulkCreatePrices);
/**
 * @openapi
 * /mandi/prices/history:
 *   get:
 *     tags: [Mandi]
 *     summary: Ordered price time series for a crop-mandi pair, for charting
 */
router.get('/prices/history', (0, validate_1.default)({ query: mandi_validation_1.priceHistoryQuerySchema }), controller.getPriceHistory);
// --- External sync (optional, admin-triggered) ------------------------------
router.get('/sync/status', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), controller.syncStatus);
router.post('/sync', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), controller.syncPrices);
// --- Favorite mandis (personal) ---------------------------------------------
router.get('/favorites', authenticate_1.authenticate, controller.listFavorites);
router.post('/favorites/:mandiId', authenticate_1.authenticate, (0, validate_1.default)({ params: mandiIdParamSchema }), controller.addFavorite);
router.delete('/favorites/:mandiId', authenticate_1.authenticate, (0, validate_1.default)({ params: mandiIdParamSchema }), controller.removeFavorite);
// --- Price alerts (personal) ------------------------------------------------
router.get('/alerts', authenticate_1.authenticate, controller.listAlerts);
router.post('/alerts', authenticate_1.authenticate, (0, validate_1.default)({ body: mandi_validation_1.alertSchema }), controller.createAlert);
router.patch('/alerts/:id', authenticate_1.authenticate, (0, validate_1.default)({ params: idParamSchema, body: mandi_validation_1.alertSchema.partial() }), controller.updateAlert);
router.delete('/alerts/:id', authenticate_1.authenticate, (0, validate_1.default)({ params: idParamSchema }), controller.deleteAlert);
exports.default = router;
//# sourceMappingURL=mandi.routes.js.map