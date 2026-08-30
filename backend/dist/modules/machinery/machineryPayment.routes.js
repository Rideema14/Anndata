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
const controller = __importStar(require("./machineryPayment.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const machineryPayment_validation_1 = require("./machineryPayment.validation");
const router = (0, express_1.Router)();
const bookingIdParamSchema = zod_1.z.object({ bookingId: zod_1.z.string().uuid() });
/**
 * @openapi
 * /machinery/payments/webhook:
 *   post:
 *     tags: [Machinery]
 *     summary: Razorpay server-to-server webhook for machinery bookings (not user-authenticated; verified via HMAC signature)
 */
router.post('/webhook', controller.webhook);
router.use(authenticate_1.authenticate);
router.post('/create', (0, validate_1.default)({ body: machineryPayment_validation_1.createMachineryPaymentSchema }), controller.create);
router.post('/verify', (0, validate_1.default)({ body: machineryPayment_validation_1.verifyMachineryPaymentSchema }), controller.verify);
router.get('/booking/:bookingId', (0, validate_1.default)({ params: bookingIdParamSchema }), controller.getForBooking);
exports.default = router;
//# sourceMappingURL=machineryPayment.routes.js.map