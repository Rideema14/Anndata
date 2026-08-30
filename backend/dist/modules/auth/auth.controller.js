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
exports.me = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refresh = exports.googleAuth = exports.login = exports.resendOtp = exports.verifyOtp = exports.register = void 0;
const authService = __importStar(require("./auth.service"));
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
const requestMeta_1 = require("../../common/utils/requestMeta");
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
exports.register = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await authService.register(req.body);
    ApiResponse_1.default.created(res, result, result.message);
});
exports.verifyOtp = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await authService.verifyRegistrationOtp(req.body, (0, requestMeta_1.getRequestMeta)(req));
    ApiResponse_1.default.ok(res, result, 'Email verified. You are now logged in.');
});
exports.resendOtp = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await authService.resendOtp(req.body);
    ApiResponse_1.default.ok(res, result);
});
exports.login = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await authService.login(req.body, (0, requestMeta_1.getRequestMeta)(req));
    ApiResponse_1.default.ok(res, result, 'Logged in successfully.');
});
exports.googleAuth = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await authService.googleAuth(req.body, (0, requestMeta_1.getRequestMeta)(req));
    ApiResponse_1.default.ok(res, result, 'Logged in with Google.');
});
exports.refresh = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await authService.refreshTokens(req.body, (0, requestMeta_1.getRequestMeta)(req));
    ApiResponse_1.default.ok(res, result, 'Token refreshed.');
});
exports.logout = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await authService.logout(req.body);
    ApiResponse_1.default.ok(res, result);
});
exports.forgotPassword = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await authService.forgotPassword(req.body);
    ApiResponse_1.default.ok(res, result);
});
exports.resetPassword = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await authService.resetPassword(req.body);
    ApiResponse_1.default.ok(res, result);
});
exports.me = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    ApiResponse_1.default.ok(res, authService.sanitizeUser(req.user));
});
//# sourceMappingURL=auth.controller.js.map