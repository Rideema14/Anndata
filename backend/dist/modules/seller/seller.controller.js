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
exports.getReviews = exports.getAnalytics = exports.getDashboard = exports.reviewApplication = exports.listApplications = exports.updateMyProfile = exports.apply = exports.getMyProfile = void 0;
const sellerService = __importStar(require("./seller.service"));
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
exports.getMyProfile = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const profile = await sellerService.getMyProfile(req.user.id);
    ApiResponse_1.default.ok(res, profile);
});
exports.apply = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const profile = await sellerService.applyAsSeller(req.user.id, req.body);
    ApiResponse_1.default.created(res, profile, 'Seller application submitted.');
});
exports.updateMyProfile = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const profile = await sellerService.updateMyProfile(req.user.id, req.body);
    ApiResponse_1.default.ok(res, profile, 'Seller profile updated.');
});
exports.listApplications = (0, asyncHandler_1.default)(async (req, res) => {
    const { items, meta } = await sellerService.listApplications(req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.reviewApplication = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const profile = await sellerService.reviewApplication(req.params.id, req.user, req.body);
    ApiResponse_1.default.ok(res, profile, 'Application reviewed.');
});
exports.getDashboard = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const dashboard = await sellerService.getDashboard(req.user.id);
    ApiResponse_1.default.ok(res, dashboard);
});
exports.getAnalytics = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const analytics = await sellerService.getAnalytics(req.user.id, req.query);
    ApiResponse_1.default.ok(res, analytics);
});
exports.getReviews = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const { items, meta } = await sellerService.getReviews(req.user.id, req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
//# sourceMappingURL=seller.controller.js.map