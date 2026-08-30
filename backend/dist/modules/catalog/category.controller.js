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
exports.removeSubCategory = exports.updateSubCategory = exports.createSubCategory = exports.remove = exports.uploadImage = exports.update = exports.create = exports.getOne = exports.list = void 0;
const categoryService = __importStar(require("./category.service"));
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
exports.list = (0, asyncHandler_1.default)(async (req, res) => {
    const categories = await categoryService.listCategories({ includeInactive: req.user?.role === 'ADMIN' });
    ApiResponse_1.default.ok(res, categories);
});
exports.getOne = (0, asyncHandler_1.default)(async (req, res) => {
    const category = await categoryService.getCategoryBySlug(req.params.slug);
    ApiResponse_1.default.ok(res, category);
});
exports.create = (0, asyncHandler_1.default)(async (req, res) => {
    const category = await categoryService.createCategory(req.body);
    ApiResponse_1.default.created(res, category, 'Category created.');
});
exports.update = (0, asyncHandler_1.default)(async (req, res) => {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    ApiResponse_1.default.ok(res, category, 'Category updated.');
});
exports.uploadImage = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.file)
        throw ApiError_1.default.badRequest('No image file uploaded. Use the "image" field.');
    const category = await categoryService.updateCategoryImage(req.params.id, req.file.buffer);
    ApiResponse_1.default.ok(res, category, 'Category image updated.');
});
exports.remove = (0, asyncHandler_1.default)(async (req, res) => {
    await categoryService.deleteCategory(req.params.id);
    ApiResponse_1.default.noContent(res);
});
exports.createSubCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const subCategory = await categoryService.createSubCategory(req.body);
    ApiResponse_1.default.created(res, subCategory, 'Sub-category created.');
});
exports.updateSubCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const subCategory = await categoryService.updateSubCategory(req.params.id, req.body);
    ApiResponse_1.default.ok(res, subCategory, 'Sub-category updated.');
});
exports.removeSubCategory = (0, asyncHandler_1.default)(async (req, res) => {
    await categoryService.deleteSubCategory(req.params.id);
    ApiResponse_1.default.noContent(res);
});
//# sourceMappingURL=category.controller.js.map