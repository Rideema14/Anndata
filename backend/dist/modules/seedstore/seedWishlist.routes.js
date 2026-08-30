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
const seedWishlistService = __importStar(require("./seedWishlist.service"));
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const router = (0, express_1.Router)();
const seedIdParamSchema = zod_1.z.object({ seedId: zod_1.z.string().uuid() });
router.use(authenticate_1.authenticate);
/**
 * @openapi
 * /seeds/wishlist:
 *   get:
 *     tags: [Seed Store]
 *     summary: List the current user's seed wishlist
 */
router.get('/', (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const { items, meta } = await seedWishlistService.listSeedWishlist(req.user.id, req.query);
    ApiResponse_1.default.paginated(res, items, meta);
}));
router.post('/:seedId', (0, validate_1.default)({ params: seedIdParamSchema }), (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const entry = await seedWishlistService.addToSeedWishlist(req.user.id, req.params.seedId);
    ApiResponse_1.default.created(res, entry, 'Added to wishlist.');
}));
router.delete('/:seedId', (0, validate_1.default)({ params: seedIdParamSchema }), (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    await seedWishlistService.removeFromSeedWishlist(req.user.id, req.params.seedId);
    ApiResponse_1.default.noContent(res);
}));
exports.default = router;
//# sourceMappingURL=seedWishlist.routes.js.map