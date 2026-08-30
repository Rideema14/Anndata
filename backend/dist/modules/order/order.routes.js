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
const controller = __importStar(require("./order.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const authorize_1 = __importDefault(require("../../common/middlewares/authorize"));
const order_validation_1 = require("./order.validation");
const router = (0, express_1.Router)();
// The frontend addresses orders by their human-readable order number
// (e.g. "ORD-20260825-1234") in the URL, and only opportunistically caches
// the real UUID in memory once it's seen one. On a refresh, bookmark, or
// shared link that cache is empty, so this must accept either form — the
// service layer resolves whichever one it gets.
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().trim().min(1) });
/**
 * @openapi
 * /orders/webhooks/track17:
 *   post:
 *     tags: [Orders]
 *     summary: 17TRACK push-webhook (not user-authenticated; verified via a shared token query param — see tracking.service.ts)
 */
// No `authenticate` here — 17TRACK's servers call this directly. 17TRACK
// doesn't sign its webhook payloads, so authentication is a shared-secret
// token in the query string instead (see verifyTrack17WebhookToken in
// tracking.service.ts). Mirrors payment.routes.ts's Razorpay webhook,
// registered before `authenticate` for the same reason.
router.post('/webhooks/track17', controller.track17Webhook);
router.use(authenticate_1.authenticate);
/** GET /orders/carriers — list supported carriers for the dropdown */
router.get('/carriers', controller.getCarriers);
/** GET /orders/disputes/mine — the current user's own disputes (must be registered before the generic /:id routes below) */
router.get('/disputes/mine', controller.listMyDisputes);
/**
 * @openapi
 * /orders/checkout:
 *   post:
 *     tags: [Orders]
 *     summary: Place an order from the current cart and create a Razorpay payment for it
 */
router.post('/checkout', (0, validate_1.default)({ body: order_validation_1.checkoutSchema }), controller.checkout);
/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List the current user's orders (or all orders, for admins)
 */
router.get('/', (0, validate_1.default)({ query: order_validation_1.listOrdersQuerySchema }), controller.list);
/** GET /orders/:id/tracking — shipment event timeline */
router.get('/:id/tracking', (0, validate_1.default)({ params: idParamSchema }), controller.getTracking);
/** GET /orders/:id/seller-detail — seller/admin fulfillment view, items filtered to the requesting seller's own products */
router.get('/:id/seller-detail', (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema }), controller.getSellerOrderDetail);
/** GET /orders/:id/shipment — full shipment detail (status, verification, courier timeline) */
router.get('/:id/shipment', (0, validate_1.default)({ params: idParamSchema }), controller.getShipment);
/**
 * POST /orders/:id/shipment — seller submits the AWB for an order
 * (requirement #2/#18). This is the seller's ONLY write path for shipment
 * data; every subsequent status change (pickup, transit, delivery) comes
 * exclusively from the courier via tracking.service.ts.
 */
router.post('/:id/shipment', (0, authorize_1.default)('SELLER', 'ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: order_validation_1.submitShipmentSchema }), controller.submitShipment);
/** POST /orders/:id/dispute — buyer reports a delivery problem (requirement #9) */
router.post('/:id/dispute', (0, validate_1.default)({ params: idParamSchema, body: order_validation_1.createDisputeSchema }), controller.createDispute);
router.get('/:id', (0, validate_1.default)({ params: idParamSchema }), controller.getOne);
/**
 * @openapi
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Admin-only manual order status override — pushes a live update over Socket.IO. Sellers no longer have access to
 *       this endpoint; see POST /orders/{id}/shipment for their (courier-verified) shipment submission flow instead.
 */
router.patch('/:id/status', (0, authorize_1.default)('ADMIN'), (0, validate_1.default)({ params: idParamSchema, body: order_validation_1.updateStatusSchema }), controller.updateStatus);
router.post('/:id/cancel', (0, validate_1.default)({ params: idParamSchema, body: order_validation_1.cancelOrderSchema }), controller.cancel);
exports.default = router;
//# sourceMappingURL=order.routes.js.map