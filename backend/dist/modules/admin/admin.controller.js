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
exports.reviewDispute = exports.listDisputes = exports.listRiskSignals = exports.flagShipment = exports.getShipmentDetail = exports.listShipments = exports.reversePayout = exports.listPayouts = exports.createPayout = exports.getSellerBalance = exports.getSellerBalances = exports.listAllProducts = exports.listAllReviews = exports.getPlatformAnalytics = exports.updateUserRole = exports.updateUserStatus = exports.listUsers = void 0;
const adminService = __importStar(require("./admin.service"));
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
exports.listUsers = (0, asyncHandler_1.default)(async (req, res) => {
    const { items, meta } = await adminService.listUsers(req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.updateUserStatus = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const user = await adminService.updateUserStatus(req.user.id, req.params.id, req.body.isActive);
    ApiResponse_1.default.ok(res, user, 'User status updated.');
});
exports.updateUserRole = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const user = await adminService.updateUserRole(req.user.id, req.params.id, req.body.role);
    ApiResponse_1.default.ok(res, user, 'User role updated.');
});
exports.getPlatformAnalytics = (0, asyncHandler_1.default)(async (req, res) => {
    const analytics = await adminService.getPlatformAnalytics(req.query);
    ApiResponse_1.default.ok(res, analytics);
});
exports.listAllReviews = (0, asyncHandler_1.default)(async (req, res) => {
    const { items, meta } = await adminService.listAllReviews(req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.listAllProducts = (0, asyncHandler_1.default)(async (req, res) => {
    const { items, meta } = await adminService.listAllProducts(req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.getSellerBalances = (0, asyncHandler_1.default)(async (req, res) => {
    const { items, meta } = await adminService.getSellerBalances(req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.getSellerBalance = (0, asyncHandler_1.default)(async (req, res) => {
    const balance = await adminService.getSellerBalance(req.params.id);
    ApiResponse_1.default.ok(res, balance);
});
exports.createPayout = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const payout = await adminService.createPayout(req.user.id, req.params.id, req.body);
    ApiResponse_1.default.created(res, payout, 'Payout recorded.');
});
exports.listPayouts = (0, asyncHandler_1.default)(async (req, res) => {
    const { items, meta } = await adminService.listPayouts(req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.reversePayout = (0, asyncHandler_1.default)(async (req, res) => {
    const payout = await adminService.reversePayout(req.params.id);
    ApiResponse_1.default.ok(res, payout, 'Payout reversed.');
});
// --- Shipment management (requirement #10) ------------------------------
exports.listShipments = (0, asyncHandler_1.default)(async (req, res) => {
    const { items, meta } = await adminService.listShipments(req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.getShipmentDetail = (0, asyncHandler_1.default)(async (req, res) => {
    const detail = await adminService.getShipmentDetail(req.params.id);
    ApiResponse_1.default.ok(res, detail);
});
exports.flagShipment = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const shipment = await adminService.flagShipmentForReview(req.params.id, req.user, req.body);
    ApiResponse_1.default.ok(res, shipment, 'Shipment flagged for review.');
});
exports.listRiskSignals = (0, asyncHandler_1.default)(async (_req, res) => {
    const signals = await adminService.listRiskSignals();
    ApiResponse_1.default.ok(res, signals);
});
// --- Dispute review (requirement #9) --------------------------------------
exports.listDisputes = (0, asyncHandler_1.default)(async (req, res) => {
    const { items, meta } = await adminService.listDisputes(req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.reviewDispute = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const dispute = await adminService.reviewDispute(req.params.id, req.user, req.body);
    ApiResponse_1.default.ok(res, dispute, 'Dispute updated.');
});
//# sourceMappingURL=admin.controller.js.map