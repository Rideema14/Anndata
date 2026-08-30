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
exports.respondToFeedback = exports.listFeedback = exports.myFeedback = exports.submitFeedback = exports.updatePreferences = exports.getPreferences = exports.markAllRead = exports.markRead = exports.unreadCount = exports.list = void 0;
const notificationService = __importStar(require("./notification.service"));
const feedbackService = __importStar(require("./feedback.service"));
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
exports.list = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const { items, meta } = await notificationService.listNotifications(req.user.id, req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.unreadCount = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const result = await notificationService.getUnreadCount(req.user.id);
    ApiResponse_1.default.ok(res, result);
});
exports.markRead = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const notification = await notificationService.markAsRead(req.user.id, req.params.id);
    ApiResponse_1.default.ok(res, notification);
});
exports.markAllRead = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const result = await notificationService.markAllAsRead(req.user.id);
    ApiResponse_1.default.ok(res, result);
});
exports.getPreferences = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const pref = await notificationService.getPreferences(req.user.id);
    ApiResponse_1.default.ok(res, pref);
});
exports.updatePreferences = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const pref = await notificationService.updatePreferences(req.user.id, req.body);
    ApiResponse_1.default.ok(res, pref, 'Preferences updated.');
});
exports.submitFeedback = (0, asyncHandler_1.default)(async (req, res) => {
    const feedback = await feedbackService.submitFeedback(req.user?.id, req.body);
    ApiResponse_1.default.created(res, feedback, 'Thanks for the feedback.');
});
exports.myFeedback = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const { items, meta } = await feedbackService.getMyFeedback(req.user.id, req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.listFeedback = (0, asyncHandler_1.default)(async (req, res) => {
    const { items, meta } = await feedbackService.listFeedback(req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.respondToFeedback = (0, asyncHandler_1.default)(async (req, res) => {
    const feedback = await feedbackService.respondToFeedback(req.params.id, req.body);
    ApiResponse_1.default.ok(res, feedback, 'Feedback updated.');
});
//# sourceMappingURL=notification.controller.js.map