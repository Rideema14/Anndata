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
exports.setApproval = exports.remove = exports.update = exports.create = exports.list = void 0;
const machineryReviewService = __importStar(require("./machineryReview.service"));
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
exports.list = (0, asyncHandler_1.default)(async (req, res) => {
    const { items, meta } = await machineryReviewService.listMachineryReviews(req.params.id, req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.create = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const review = await machineryReviewService.createMachineryReview(req.params.id, req.user.id, req.body);
    ApiResponse_1.default.created(res, review, 'Review posted.');
});
exports.update = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const review = await machineryReviewService.updateMachineryReview(req.params.reviewId, req.user.id, req.body);
    ApiResponse_1.default.ok(res, review, 'Review updated.');
});
exports.remove = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    await machineryReviewService.deleteMachineryReview(req.params.reviewId, req.user);
    ApiResponse_1.default.noContent(res);
});
exports.setApproval = (0, asyncHandler_1.default)(async (req, res) => {
    const review = await machineryReviewService.setMachineryReviewApproval(req.params.reviewId, req.body.isApproved);
    ApiResponse_1.default.ok(res, review, 'Review moderation updated.');
});
//# sourceMappingURL=machineryReview.controller.js.map