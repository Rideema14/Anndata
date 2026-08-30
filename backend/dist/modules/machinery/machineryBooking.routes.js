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
const controller = __importStar(require("./machineryBooking.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const authorize_1 = __importDefault(require("../../common/middlewares/authorize"));
const machinery_validation_1 = require("./machinery.validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid() });
router.use(authenticate_1.authenticate);
/**
 * @openapi
 * /machinery/bookings:
 *   post:
 *     tags: [Machinery]
 *     summary: Book machinery for a date range and create a Razorpay payment for it
 */
router.post('/', (0, validate_1.default)({ body: machinery_validation_1.createBookingSchema }), controller.create);
router.get('/', (0, validate_1.default)({ query: machinery_validation_1.listBookingsQuerySchema }), controller.list);
router.get('/:id', (0, validate_1.default)({ params: idParamSchema }), controller.getOne);
router.patch('/:id/status', (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: machinery_validation_1.updateBookingStatusSchema }), controller.updateStatus);
router.post('/:id/cancel', (0, validate_1.default)({ params: idParamSchema, body: machinery_validation_1.cancelBookingSchema }), controller.cancel);
exports.default = router;
//# sourceMappingURL=machineryBooking.routes.js.map