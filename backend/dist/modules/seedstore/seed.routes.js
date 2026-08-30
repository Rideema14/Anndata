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
const seedController = __importStar(require("./seed.controller"));
const seedReviewController = __importStar(require("./seedReview.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const authorize_1 = __importDefault(require("../../common/middlewares/authorize"));
const upload_1 = require("../../common/middlewares/upload");
const seed_validation_1 = require("./seed.validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid() });
const slugParamSchema = zod_1.z.object({ slug: zod_1.z.string().trim().min(1) });
const imageParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid(), imageId: zod_1.z.string().uuid() });
const variantParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid(), variantId: zod_1.z.string().uuid() });
const reviewIdParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid(), reviewId: zod_1.z.string().uuid() });
const approvalBodySchema = zod_1.z.object({ isApproved: zod_1.z.boolean() });
/**
 * @openapi
 * /seeds:
 *   get:
 *     tags: [Seed Store]
 *     summary: Search/filter/paginate the seed catalog
 */
router.get('/', (0, validate_1.default)({ query: seed_validation_1.seedQuerySchema }), seedController.list);
router.get('/:slug', (0, validate_1.default)({ params: slugParamSchema }), authenticate_1.optionalAuthenticate, seedController.getOne);
router.post('/', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ body: seed_validation_1.seedCreateSchema }), seedController.create);
router.patch('/:id', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: seed_validation_1.seedUpdateSchema }), seedController.update);
router.delete('/:id', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema }), seedController.remove);
router.post('/:id/images', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema }), upload_1.uploadImage.array('images', 8), seedController.addImages);
router.delete('/:id/images/:imageId', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: imageParamSchema }), seedController.removeImage);
router.post('/:id/variants', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: seed_validation_1.seedVariantInputSchema }), seedController.addVariant);
router.patch('/:id/variants/:variantId', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: variantParamSchema, body: seed_validation_1.seedVariantInputSchema.partial() }), seedController.updateVariant);
router.delete('/:id/variants/:variantId', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: variantParamSchema }), seedController.removeVariant);
// --- Reviews (nested under a seed) ------------------------------------
router.get('/:id/reviews', (0, validate_1.default)({ params: idParamSchema }), seedReviewController.list);
router.post('/:id/reviews', authenticate_1.authenticate, (0, validate_1.default)({ params: idParamSchema, body: seed_validation_1.seedReviewSchema }), seedReviewController.create);
router.patch('/:id/reviews/:reviewId', authenticate_1.authenticate, (0, validate_1.default)({ params: reviewIdParamSchema, body: seed_validation_1.seedReviewSchema.partial() }), seedReviewController.update);
router.delete('/:id/reviews/:reviewId', authenticate_1.authenticate, (0, validate_1.default)({ params: reviewIdParamSchema }), seedReviewController.remove);
router.patch('/:id/reviews/:reviewId/approval', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: reviewIdParamSchema, body: approvalBodySchema }), seedReviewController.setApproval);
exports.default = router;
//# sourceMappingURL=seed.routes.js.map