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
const seedCartService = __importStar(require("./seedCart.service"));
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const seedCart_validation_1 = require("./seedCart.validation");
const router = (0, express_1.Router)();
const itemIdParamSchema = zod_1.z.object({ itemId: zod_1.z.string().uuid() });
router.use(authenticate_1.authenticate);
/**
 * @openapi
 * /seeds/cart:
 *   get:
 *     tags: [Seed Store]
 *     summary: Get the current user's seed cart with computed line totals
 */
router.get('/', (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const cart = await seedCartService.getOrCreateSeedCart(req.user.id);
    ApiResponse_1.default.ok(res, cart);
}));
router.post('/items', (0, validate_1.default)({ body: seedCart_validation_1.addSeedItemSchema }), (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const cart = await seedCartService.addSeedItem(req.user.id, req.body);
    ApiResponse_1.default.created(res, cart, 'Item added to cart.');
}));
router.patch('/items/:itemId', (0, validate_1.default)({ params: itemIdParamSchema, body: seedCart_validation_1.updateSeedItemSchema }), (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const cart = await seedCartService.updateSeedItemQuantity(req.user.id, req.params.itemId, req.body.quantity);
    ApiResponse_1.default.ok(res, cart, 'Cart updated.');
}));
router.delete('/items/:itemId', (0, validate_1.default)({ params: itemIdParamSchema }), (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const cart = await seedCartService.removeSeedItem(req.user.id, req.params.itemId);
    ApiResponse_1.default.ok(res, cart, 'Item removed.');
}));
router.delete('/', (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const cart = await seedCartService.clearSeedCart(req.user.id);
    ApiResponse_1.default.ok(res, cart, 'Cart cleared.');
}));
exports.default = router;
//# sourceMappingURL=seedCart.routes.js.map