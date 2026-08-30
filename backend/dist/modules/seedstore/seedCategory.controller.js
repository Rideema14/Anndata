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
exports.remove = exports.uploadImage = exports.update = exports.create = exports.getOne = exports.list = void 0;
const seedCategoryService = __importStar(require("./seedCategory.service"));
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
exports.list = (0, asyncHandler_1.default)(async (req, res) => {
    const categories = await seedCategoryService.listSeedCategories({ includeInactive: req.user?.role === 'ADMIN' });
    ApiResponse_1.default.ok(res, categories);
});
exports.getOne = (0, asyncHandler_1.default)(async (req, res) => {
    const category = await seedCategoryService.getSeedCategoryBySlug(req.params.slug);
    ApiResponse_1.default.ok(res, category);
});
exports.create = (0, asyncHandler_1.default)(async (req, res) => {
    const category = await seedCategoryService.createSeedCategory(req.body);
    ApiResponse_1.default.created(res, category, 'Seed category created.');
});
exports.update = (0, asyncHandler_1.default)(async (req, res) => {
    const category = await seedCategoryService.updateSeedCategory(req.params.id, req.body);
    ApiResponse_1.default.ok(res, category, 'Seed category updated.');
});
exports.uploadImage = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.file)
        throw ApiError_1.default.badRequest('No image file uploaded. Use the "image" field.');
    const category = await seedCategoryService.updateSeedCategoryImage(req.params.id, req.file.buffer);
    ApiResponse_1.default.ok(res, category, 'Seed category image updated.');
});
exports.remove = (0, asyncHandler_1.default)(async (req, res) => {
    await seedCategoryService.deleteSeedCategory(req.params.id);
    ApiResponse_1.default.noContent(res);
});
//# sourceMappingURL=seedCategory.controller.js.map