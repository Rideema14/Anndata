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
exports.removeDiscountTier = exports.updateDiscountTier = exports.addDiscountTier = exports.removeImage = exports.addImages = exports.remove = exports.update = exports.create = exports.getAvailability = exports.getOne = exports.list = void 0;
const machineryService = __importStar(require("./machinery.service"));
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
exports.list = (0, asyncHandler_1.default)(async (req, res) => {
    const { items, meta } = await machineryService.listMachinery(req.query, req.user);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.getOne = (0, asyncHandler_1.default)(async (req, res) => {
    const machinery = await machineryService.getMachineryBySlug(req.params.slug);
    ApiResponse_1.default.ok(res, machinery);
});
exports.getAvailability = (0, asyncHandler_1.default)(async (req, res) => {
    const { startDate, endDate, quantity } = req.query;
    const result = await machineryService.getMachineryAvailability(req.params.id, startDate, endDate, quantity);
    ApiResponse_1.default.ok(res, result);
});
exports.create = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const machinery = await machineryService.createMachinery(req.user, req.body);
    ApiResponse_1.default.created(res, machinery, 'Machinery listing created.');
});
exports.update = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const machinery = await machineryService.updateMachinery(req.params.id, req.user, req.body);
    ApiResponse_1.default.ok(res, machinery, 'Machinery listing updated.');
});
exports.remove = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    await machineryService.deleteMachinery(req.params.id, req.user);
    ApiResponse_1.default.noContent(res);
});
exports.addImages = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const files = req.files;
    if (!files || files.length === 0)
        throw ApiError_1.default.badRequest('No image files uploaded. Use the "images" field.');
    const images = await machineryService.addMachineryImages(req.params.id, req.user, files);
    ApiResponse_1.default.created(res, images, 'Images uploaded.');
});
exports.removeImage = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    await machineryService.removeMachineryImage(req.params.id, req.params.imageId, req.user);
    ApiResponse_1.default.noContent(res);
});
exports.addDiscountTier = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const tier = await machineryService.addDiscountTier(req.params.id, req.user, req.body);
    ApiResponse_1.default.created(res, tier, 'Discount tier added.');
});
exports.updateDiscountTier = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const tier = await machineryService.updateDiscountTier(req.params.id, req.params.tierId, req.user, req.body);
    ApiResponse_1.default.ok(res, tier, 'Discount tier updated.');
});
exports.removeDiscountTier = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    await machineryService.removeDiscountTier(req.params.id, req.params.tierId, req.user);
    ApiResponse_1.default.noContent(res);
});
//# sourceMappingURL=machinery.controller.js.map