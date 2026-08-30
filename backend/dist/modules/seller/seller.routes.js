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
const controller = __importStar(require("./seller.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const authorize_1 = __importDefault(require("../../common/middlewares/authorize"));
const seller_validation_1 = require("./seller.validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid() });
router.use(authenticate_1.authenticate);
/**
 * @openapi
 * /sellers/apply:
 *   post:
 *     tags: [Sellers]
 *     summary: Apply to become a seller (or re-submit after a rejection)
 */
router.post('/apply', (0, validate_1.default)({ body: seller_validation_1.applySchema }), controller.apply);
/**
 * @openapi
 * /sellers/me:
 *   get:
 *     tags: [Sellers]
 *     summary: Get the current user's seller profile / application status
 */
router.get('/me', controller.getMyProfile);
router.patch('/me', (0, validate_1.default)({ body: seller_validation_1.updateProfileSchema }), controller.updateMyProfile);
/**
 * @openapi
 * /sellers/dashboard:
 *   get:
 *     tags: [Sellers]
 *     summary: Active listings, orders to fulfill, and revenue snapshot for the current seller
 */
router.get('/dashboard', (0, authorize_1.default)('SELLER', 'ADMIN'), controller.getDashboard);
/**
 * @openapi
 * /sellers/analytics:
 *   get:
 *     tags: [Sellers]
 *     summary: Sales trend, top products, and order-status breakdown for the current seller
 */
router.get('/analytics', (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ query: seller_validation_1.analyticsQuerySchema }), controller.getAnalytics);
/**
 * @openapi
 * /sellers/reviews:
 *   get:
 *     tags: [Sellers]
 *     summary: Every review left on the current seller's products — reviewer name/photo, rating, comment, and which product. This is the "Feedback" view for sellers on the frontend.
 */
router.get('/reviews', (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ query: seller_validation_1.sellerReviewsQuerySchema }), controller.getReviews);
// --- Admin: verification console ------------------------------------------
router.get('/applications', (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ query: seller_validation_1.listApplicationsQuerySchema }), controller.listApplications);
router.patch('/applications/:id/review', (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: seller_validation_1.reviewApplicationSchema }), controller.reviewApplication);
exports.default = router;
//# sourceMappingURL=seller.routes.js.map