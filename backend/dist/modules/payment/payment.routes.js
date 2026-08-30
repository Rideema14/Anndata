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
const controller = __importStar(require("./payment.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const payment_validation_1 = require("./payment.validation");
const router = (0, express_1.Router)();
const orderIdParamSchema = zod_1.z.object({ orderId: zod_1.z.string().uuid() });
/**
 * @openapi
 * /payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Razorpay server-to-server webhook (not user-authenticated; verified via HMAC signature)
 */
// No `authenticate` here — Razorpay's servers call this directly, authenticated
// only by the X-Razorpay-Signature header, checked inside the service.
router.post('/webhook', controller.webhook);
router.use(authenticate_1.authenticate);
/**
 * @openapi
 * /payments/create:
 *   post:
 *     tags: [Payments]
 *     summary: Create (or retry) a Razorpay order for a placed platform order
 *     security: [{ bearerAuth: [] }]
 */
router.post('/create', (0, validate_1.default)({ body: payment_validation_1.createPaymentSchema }), controller.create);
/**
 * @openapi
 * /payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify the Razorpay signature after the Checkout widget succeeds
 *     security: [{ bearerAuth: [] }]
 */
router.post('/verify', (0, validate_1.default)({ body: payment_validation_1.verifyPaymentSchema }), controller.verify);
router.get('/order/:orderId', (0, validate_1.default)({ params: orderIdParamSchema }), controller.getForOrder);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map