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
const machineryController = __importStar(require("./machinery.controller"));
const machineryReviewController = __importStar(require("./machineryReview.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const authorize_1 = __importDefault(require("../../common/middlewares/authorize"));
const upload_1 = require("../../common/middlewares/upload");
const machinery_validation_1 = require("./machinery.validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid() });
const slugParamSchema = zod_1.z.object({ slug: zod_1.z.string().trim().min(1) });
const imageParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid(), imageId: zod_1.z.string().uuid() });
const tierParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid(), tierId: zod_1.z.string().uuid() });
const reviewIdParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid(), reviewId: zod_1.z.string().uuid() });
const approvalBodySchema = zod_1.z.object({ isApproved: zod_1.z.boolean() });
/**
 * @openapi
 * /machinery:
 *   get:
 *     tags: [Machinery]
 *     summary: Search/filter/paginate machinery listings; pass startDate+endDate+quantity to only see listings with enough free units for that range
 */
router.get('/', authenticate_1.optionalAuthenticate, (0, validate_1.default)({ query: machinery_validation_1.machineryQuerySchema }), machineryController.list);
router.get('/:slug', (0, validate_1.default)({ params: slugParamSchema }), authenticate_1.optionalAuthenticate, machineryController.getOne);
router.post('/', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ body: machinery_validation_1.machineryCreateSchema }), machineryController.create);
router.patch('/:id', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: machinery_validation_1.machineryUpdateSchema }), machineryController.update);
router.delete('/:id', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema }), machineryController.remove);
/**
 * @openapi
 * /machinery/{id}/availability:
 *   get:
 *     tags: [Machinery]
 *     summary: Check free-unit count for a specific date range and quantity, before booking
 */
router.get('/:id/availability', (0, validate_1.default)({ params: idParamSchema, query: machinery_validation_1.availabilityQuerySchema }), machineryController.getAvailability);
router.post('/:id/images', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema }), upload_1.uploadImage.array('images', 8), machineryController.addImages);
router.delete('/:id/images/:imageId', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: imageParamSchema }), machineryController.removeImage);
router.post('/:id/discount-tiers', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: machinery_validation_1.discountTierInputSchema }), machineryController.addDiscountTier);
router.patch('/:id/discount-tiers/:tierId', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: tierParamSchema, body: machinery_validation_1.discountTierInputSchema.partial() }), machineryController.updateDiscountTier);
router.delete('/:id/discount-tiers/:tierId', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: tierParamSchema }), machineryController.removeDiscountTier);
// --- Reviews (nested under a machinery listing) -----------------------
router.get('/:id/reviews', (0, validate_1.default)({ params: idParamSchema }), machineryReviewController.list);
router.post('/:id/reviews', authenticate_1.authenticate, (0, validate_1.default)({ params: idParamSchema, body: machinery_validation_1.machineryReviewSchema }), machineryReviewController.create);
router.patch('/:id/reviews/:reviewId', authenticate_1.authenticate, (0, validate_1.default)({ params: reviewIdParamSchema, body: machinery_validation_1.machineryReviewSchema.partial() }), machineryReviewController.update);
router.delete('/:id/reviews/:reviewId', authenticate_1.authenticate, (0, validate_1.default)({ params: reviewIdParamSchema }), machineryReviewController.remove);
router.patch('/:id/reviews/:reviewId/approval', authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: reviewIdParamSchema, body: approvalBodySchema }), machineryReviewController.setApproval);
exports.default = router;
//# sourceMappingURL=machinery.routes.js.map