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
const landVisitController = __importStar(require("./landVisit.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const land_validation_1 = require("./land.validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid() });
// Must be registered before the bare '/land' mount in routes/index.ts — same
// rule as '/seeds/*' and '/machinery/*': Express matches mount prefixes in
// registration order, and '/land' alone would otherwise swallow
// '/land/visit-requests' as if "visit-requests" were a listing slug.
/**
 * @openapi
 * /land/visit-requests/my:
 *   get:
 *     tags: [Land]
 *     summary: The authenticated buyer's own land visit requests
 */
router.get('/my', authenticate_1.authenticate, (0, validate_1.default)({ query: land_validation_1.listVisitRequestsQuerySchema }), landVisitController.myVisitRequests);
router.get('/:id', authenticate_1.authenticate, (0, validate_1.default)({ params: idParamSchema }), landVisitController.getOne);
/**
 * @openapi
 * /land/visit-requests/{id}/status:
 *   patch:
 *     tags: [Land]
 *     summary: Seller accepts/rejects/completes a visit request; buyer may cancel their own
 */
router.patch('/:id/status', authenticate_1.authenticate, (0, validate_1.default)({ params: idParamSchema, body: land_validation_1.updateVisitStatusSchema }), landVisitController.updateStatus);
exports.default = router;
//# sourceMappingURL=landVisit.routes.js.map