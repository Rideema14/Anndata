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
exports.track17Webhook = exports.listMyDisputes = exports.createDispute = exports.getShipment = exports.submitShipment = exports.getCarriers = exports.getTracking = exports.cancel = exports.updateStatus = exports.getSellerOrderDetail = exports.getOne = exports.list = exports.checkout = void 0;
const orderService = __importStar(require("./order.service"));
const shipmentService = __importStar(require("./shipment.service"));
const disputeService = __importStar(require("./dispute.service"));
const paymentService = __importStar(require("../payment/payment.service"));
const tracking_service_1 = require("./tracking.service");
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
const env_1 = require("../../config/env");
const logger_1 = __importDefault(require("../../common/utils/logger"));
/**
 * One call for the frontend: places the order, decrements stock, clears the
 * cart, AND creates the matching Razorpay order — everything needed to open
 * the Razorpay Checkout widget comes back in a single response.
 */
exports.checkout = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const order = await orderService.checkout(req.user.id, req.body);
    const payment = await paymentService.createPaymentForOrder(order.id, req.user);
    ApiResponse_1.default.created(res, { order, payment }, 'Order placed. Proceed to payment.');
});
exports.list = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const { items, meta } = await orderService.listOrders(req.user, req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.getOne = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const order = await orderService.getOrderById(req.params.id, req.user);
    ApiResponse_1.default.ok(res, order);
});
/** Seller (or admin) fulfillment view — items filtered to just this seller's own products. */
exports.getSellerOrderDetail = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const order = await orderService.getSellerOrderDetail(req.params.id, req.user);
    ApiResponse_1.default.ok(res, order);
});
/** Admin-only manual status override — see order.service.ts's updateStatus for the transition rules. */
exports.updateStatus = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const order = await orderService.updateStatus(req.params.id, req.user, req.body);
    ApiResponse_1.default.ok(res, order, 'Order status updated.');
});
exports.cancel = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const order = await orderService.cancelOrder(req.params.id, req.user, req.body);
    ApiResponse_1.default.ok(res, order, 'Order cancelled.');
});
/** Returns the shipment tracking timeline for a given order. */
exports.getTracking = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    // Resolve first (accepts either the internal id or the order number) so
    // we look up tracking events against the order's real internal id.
    const order = await orderService.getOrderById(req.params.id, req.user);
    const events = await (0, tracking_service_1.getTrackingTimeline)(order.id);
    ApiResponse_1.default.ok(res, events);
});
/** Returns the list of supported carriers for the frontend dropdown. */
exports.getCarriers = (0, asyncHandler_1.default)(async (_req, res) => {
    const carriers = tracking_service_1.SUPPORTED_CARRIERS.map((c) => ({ code: c.code, name: c.name }));
    ApiResponse_1.default.ok(res, carriers);
});
/**
 * POST /orders/:id/shipment — the seller's entire shipment-management
 * surface (requirement #2/#3/#18): submit the AWB, get it verified against
 * the carrier. No status field, no way to touch courier-derived data.
 */
exports.submitShipment = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const order = await shipmentService.submitShipment(req.params.id, req.user, req.body);
    ApiResponse_1.default.ok(res, order, 'Shipment submitted.');
});
/** GET /orders/:id/shipment — full shipment detail (status, verification, events). */
exports.getShipment = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const shipment = await shipmentService.getShipmentForOrder(req.params.id, req.user);
    ApiResponse_1.default.ok(res, shipment);
});
/** POST /orders/:id/dispute — buyer reports a delivery problem (requirement #9). */
exports.createDispute = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const dispute = await disputeService.createDispute(req.params.id, req.user, req.body);
    ApiResponse_1.default.created(res, dispute, 'Dispute filed. Our team will review it shortly.');
});
/** GET /orders/disputes/mine — the current user's own disputes. */
exports.listMyDisputes = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const disputes = await disputeService.listMyDisputes(req.user);
    ApiResponse_1.default.ok(res, disputes);
});
/**
 * POST /orders/webhooks/track17 — 17TRACK push-webhook receiver. Not
 * user-authenticated. 17TRACK doesn't sign its webhook payloads at all, so
 * we authenticate the call ourselves via a shared-secret token in the query
 * string (the same one baked into the single webhook URL registered once in
 * the 17TRACK dashboard — see tracking.service.ts / .env.example). Always
 * answers 200 once the token checks out (even if we couldn't match a
 * shipment/nothing changed) — dropping an event because we couldn't act on
 * it yet isn't something a retry loop fixes.
 */
exports.track17Webhook = (0, asyncHandler_1.default)(async (req, res) => {
    if (!env_1.env.tracking.webhookToken) {
        // Webhook not configured — the cron remains the only sync path. Return
        // 200 rather than 404/500 so a stray call from a provider that *is*
        // configured on their end but not ours doesn't retry forever.
        return res.status(200).json({ success: false, message: 'Webhook not configured on this server.' });
    }
    const valid = (0, tracking_service_1.verifyTrack17WebhookToken)(req.query.token);
    if (!valid) {
        logger_1.default.warn('17TRACK webhook: invalid or missing token, rejecting.');
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    const result = await (0, tracking_service_1.handleTrack17WebhookPayload)(req.body);
    return res.status(200).json({ success: true, ...result });
});
//# sourceMappingURL=order.controller.js.map