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
const productController = __importStar(require("./product.controller"));
const reviewController = __importStar(require("./review.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const authorize_1 = __importDefault(require("../../common/middlewares/authorize"));
const upload_1 = require("../../common/middlewares/upload");
const catalog_validation_1 = require("./catalog.validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid() });
const slugParamSchema = zod_1.z.object({ slug: zod_1.z.string().trim().min(1) });
const imageParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid(), imageId: zod_1.z.string().uuid() });
const variantParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid(), variantId: zod_1.z.string().uuid() });
const reviewIdParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid(), reviewId: zod_1.z.string().uuid() });
const approvalBodySchema = zod_1.z.object({ isApproved: zod_1.z.boolean() });
/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Search/filter/paginate the product catalog
 */
router.get('/', (0, validate_1.default)({ query: catalog_validation_1.productQuerySchema }), productController.list);
router.get('/nearby', (0, validate_1.default)({ query: catalog_validation_1.nearbyQuerySchema }), productController.nearby);
router.get('/top-deals', (0, validate_1.default)({ query: catalog_validation_1.topDealsQuerySchema }), productController.topDeals);
router.get('/:slug', (0, validate_1.default)({ params: slugParamSchema }), authenticate_1.optionalAuthenticate, productController.getOne);
router.post('/', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ body: catalog_validation_1.productCreateSchema }), productController.create);
router.patch('/:id', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: catalog_validation_1.productUpdateSchema }), productController.update);
router.delete('/:id', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema }), productController.remove);
router.post('/:id/images', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema }), upload_1.uploadImage.array('images', 8), productController.addImages);
router.delete('/:id/images/:imageId', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: imageParamSchema }), productController.removeImage);
router.post('/:id/variants', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: catalog_validation_1.variantInputSchema }), productController.addVariant);
router.patch('/:id/variants/:variantId', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: variantParamSchema, body: catalog_validation_1.variantInputSchema.partial() }), productController.updateVariant);
router.delete('/:id/variants/:variantId', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: variantParamSchema }), productController.removeVariant);
// --- Reviews (nested under a product) --------------------------------------
router.get('/:id/reviews', (0, validate_1.default)({ params: idParamSchema }), reviewController.list);
router.post('/:id/reviews', authenticate_1.authenticate, (0, validate_1.default)({ params: idParamSchema, body: catalog_validation_1.reviewSchema }), reviewController.create);
router.patch('/:id/reviews/:reviewId', authenticate_1.authenticate, (0, validate_1.default)({ params: reviewIdParamSchema, body: catalog_validation_1.reviewSchema.partial() }), reviewController.update);
router.delete('/:id/reviews/:reviewId', authenticate_1.authenticate, (0, validate_1.default)({ params: reviewIdParamSchema }), reviewController.remove);
router.patch('/:id/reviews/:reviewId/approval', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: reviewIdParamSchema, body: approvalBodySchema }), reviewController.setApproval);
exports.default = router;
//# sourceMappingURL=product.routes.js.map