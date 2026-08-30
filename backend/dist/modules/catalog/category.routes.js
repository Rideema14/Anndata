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
const controller = __importStar(require("./category.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const authorize_1 = __importDefault(require("../../common/middlewares/authorize"));
const upload_1 = require("../../common/middlewares/upload");
const catalog_validation_1 = require("./catalog.validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid() });
const slugParamSchema = zod_1.z.object({ slug: zod_1.z.string().trim().min(1) });
/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Catalog]
 *     summary: List all active categories with their sub-categories
 */
router.get('/', authenticate_1.optionalAuthenticate, controller.list);
router.get('/:slug', (0, validate_1.default)({ params: slugParamSchema }), controller.getOne);
router.post('/', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ body: catalog_validation_1.categorySchema }), controller.create);
router.patch('/:id', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: catalog_validation_1.categorySchema.partial() }), controller.update);
router.post('/:id/image', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: idParamSchema }), upload_1.uploadImage.single('image'), controller.uploadImage);
router.delete('/:id', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: idParamSchema }), controller.remove);
router.post('/subcategories', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ body: catalog_validation_1.subCategorySchema }), controller.createSubCategory);
router.patch('/subcategories/:id', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: catalog_validation_1.subCategorySchema.partial() }), controller.updateSubCategory);
router.delete('/subcategories/:id', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: idParamSchema }), controller.removeSubCategory);
exports.default = router;
//# sourceMappingURL=category.routes.js.map