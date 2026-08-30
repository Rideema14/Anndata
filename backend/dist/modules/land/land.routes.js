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
const landController = __importStar(require("./land.controller"));
const landVisitController = __importStar(require("./landVisit.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const authorize_1 = __importDefault(require("../../common/middlewares/authorize"));
const upload_1 = require("../../common/middlewares/upload");
const land_validation_1 = require("./land.validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid() });
const slugParamSchema = zod_1.z.object({ slug: zod_1.z.string().trim().min(1) });
const imageParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid(), imageId: zod_1.z.string().uuid() });
/**
 * @openapi
 * /land:
 *   get:
 *     tags: [Land]
 *     summary: Search/filter/paginate land listings (deal type, price, area, city/state)
 */
router.get('/', (0, validate_1.default)({ query: land_validation_1.landQuerySchema }), landController.list);
// Must be registered before '/:slug' — otherwise Express would treat
// "my-listings" as a slug and route it into the getOne handler.
router.get('/my-listings', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ query: land_validation_1.myListingsQuerySchema }), landController.myListings);
router.get('/:slug', (0, validate_1.default)({ params: slugParamSchema }), authenticate_1.optionalAuthenticate, landController.getOne);
router.post('/', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ body: land_validation_1.landCreateSchema }), landController.create);
router.patch('/:id', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: land_validation_1.landUpdateSchema }), landController.update);
router.delete('/:id', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema }), landController.remove);
router.post('/:id/images', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema }), upload_1.uploadImage.array('images', 8), landController.addImages);
router.delete('/:id/images/:imageId', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: imageParamSchema }), landController.removeImage);
// --- Visit requests (nested under a listing) --------------------------
/**
 * @openapi
 * /land/{id}/visit-requests:
 *   post:
 *     tags: [Land]
 *     summary: Buyer requests a site visit for this listing (date, time, message)
 */
router.post('/:id/visit-requests', authenticate_1.authenticate, (0, validate_1.default)({ params: idParamSchema, body: land_validation_1.createVisitRequestSchema }), landVisitController.create);
router.get('/:id/visit-requests', authenticate_1.authenticate, (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema, query: land_validation_1.listVisitRequestsQuerySchema }), landVisitController.listForLand);
exports.default = router;
//# sourceMappingURL=land.routes.js.map