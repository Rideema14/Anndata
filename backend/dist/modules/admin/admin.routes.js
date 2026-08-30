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
const controller = __importStar(require("./admin.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const authorize_1 = __importDefault(require("../../common/middlewares/authorize"));
const admin_validation_1 = require("./admin.validation");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid() });
// Shipment/dispute endpoints below take an order id/number or a dispute
// id — not always a UUID (orders can be addressed by their human-readable
// order number, same as everywhere else in the order module), so these use
// a looser param schema than idParamSchema above.
const looseIdParamSchema = zod_1.z.object({ id: zod_1.z.string().trim().min(1) });
// Every route in this module is admin-only.
router.use(authenticate_1.authenticate, (0, authorize_1.default)('ADMIN'));
/**
 * @openapi
 * /admin/analytics:
 *   get:
 *     tags: [Admin]
 *     summary: Platform-wide KPIs — user/seller counts, total orders, GMV, and a monthly GMV trend
 */
router.get('/analytics', (0, validate_1.default)({ query: admin_validation_1.platformAnalyticsQuerySchema }), controller.getPlatformAnalytics);
/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List/search users platform-wide, filterable by role and active status
 */
router.get('/users', (0, validate_1.default)({ query: admin_validation_1.listUsersQuerySchema }), controller.listUsers);
router.patch('/users/:id/status', (0, validate_1.default)({ params: idParamSchema, body: admin_validation_1.updateUserStatusSchema }), controller.updateUserStatus);
router.patch('/users/:id/role', (0, validate_1.default)({ params: idParamSchema, body: admin_validation_1.updateUserRoleSchema }), controller.updateUserRole);
/**
 * @openapi
 * /admin/reviews:
 *   get:
 *     tags: [Admin]
 *     summary: Cross-product review moderation queue (approve/reject a review via the existing /products/:id/reviews/:reviewId/approval endpoint)
 */
router.get('/reviews', (0, validate_1.default)({ query: admin_validation_1.adminReviewsQuerySchema }), controller.listAllReviews);
/**
 * @openapi
 * /admin/products:
 *   get:
 *     tags: [Admin]
 *     summary: Every product platform-wide, including inactive listings (unlike the public /products endpoint)
 */
router.get('/products', (0, validate_1.default)({ query: admin_validation_1.adminProductsQuerySchema }), controller.listAllProducts);
/**
 * @openapi
 * /admin/sellers/balances:
 *   get:
 *     tags: [Admin]
 *     summary: Every seller with their computed payout balance (earned − paid out), searchable by name/email/business name
 */
router.get('/sellers/balances', (0, validate_1.default)({ query: admin_validation_1.sellerBalancesQuerySchema }), controller.getSellerBalances);
/** GET /admin/sellers/:id/balance — fresh balance + bank details for one seller, fetched right before opening the payout form */
router.get('/sellers/:id/balance', (0, validate_1.default)({ params: idParamSchema }), controller.getSellerBalance);
/**
 * @openapi
 * /admin/sellers/{id}/payouts:
 *   post:
 *     tags: [Admin]
 *     summary: Record a payout sent to a seller (server re-validates the amount against their current balance)
 */
router.post('/sellers/:id/payouts', (0, validate_1.default)({ params: idParamSchema, body: admin_validation_1.createPayoutSchema }), controller.createPayout);
/**
 * @openapi
 * /admin/payouts:
 *   get:
 *     tags: [Admin]
 *     summary: Platform-wide payout ledger, filterable by seller and status
 */
router.get('/payouts', (0, validate_1.default)({ query: admin_validation_1.listPayoutsQuerySchema }), controller.listPayouts);
/** PATCH /admin/payouts/:id/reverse — correct a mistaken payout entry without deleting the audit row */
router.patch('/payouts/:id/reverse', (0, validate_1.default)({ params: idParamSchema }), controller.reversePayout);
// --- Shipment management (requirement #10) --------------------------------
/**
 * @openapi
 * /admin/shipments:
 *   get:
 *     tags: [Admin]
 *     summary: Platform-wide shipment list — order/product/buyer/seller/courier/AWB, status, pickup confirmation, last event, last sync, delivery, dispute status, risk flags
 */
router.get('/shipments', (0, validate_1.default)({ query: admin_validation_1.listShipmentsQuerySchema }), controller.listShipments);
/** GET /admin/shipments/risk-signals — recent repeated-invalid-AWB / repeated-dispute flags by seller (requirement #11) */
router.get('/shipments/risk-signals', controller.listRiskSignals);
/** GET /admin/shipments/:id — full tracking timeline + audit trail for one order's shipment */
router.get('/shipments/:id', (0, validate_1.default)({ params: looseIdParamSchema }), controller.getShipmentDetail);
/**
 * @openapi
 * /admin/shipments/{id}/flag:
 *   post:
 *     tags: [Admin]
 *     summary: Flag a shipment for investigation. Deliberately the ONLY shipment field an admin can write — courier-derived
 *       status/events/timestamps are never editable here.
 */
router.post('/shipments/:id/flag', (0, validate_1.default)({ params: looseIdParamSchema, body: admin_validation_1.flagShipmentSchema }), controller.flagShipment);
// --- Dispute review (requirement #9) ---------------------------------------
/**
 * @openapi
 * /admin/disputes:
 *   get:
 *     tags: [Admin]
 *     summary: Delivery dispute queue, filterable by status
 */
router.get('/disputes', (0, validate_1.default)({ query: admin_validation_1.listDisputesQuerySchema }), controller.listDisputes);
/**
 * @openapi
 * /admin/disputes/{id}/review:
 *   patch:
 *     tags: [Admin]
 *     summary: Move a dispute to UNDER_REVIEW, or close it as RESOLVED/REJECTED (both take the order out of DISPUTED)
 */
router.patch('/disputes/:id/review', (0, validate_1.default)({ params: idParamSchema, body: admin_validation_1.reviewDisputeSchema }), controller.reviewDispute);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map