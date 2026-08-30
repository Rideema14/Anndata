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
const controller = __importStar(require("./auth.controller"));
const validate_1 = __importDefault(require("../../common/middlewares/validate"));
const authenticate_1 = require("../../common/middlewares/authenticate");
const rateLimiters_1 = require("../../common/middlewares/rateLimiters");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account and send an email OTP for verification
 */
router.post('/register', rateLimiters_1.authLimiter, (0, validate_1.default)({ body: auth_validation_1.registerSchema }), controller.register);
/**
 * @openapi
 * /auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify the email OTP sent at registration and receive tokens
 */
router.post('/verify-otp', rateLimiters_1.authLimiter, (0, validate_1.default)({ body: auth_validation_1.verifyOtpSchema }), controller.verifyOtp);
/**
 * @openapi
 * /auth/resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend a registration or password-reset OTP
 */
router.post('/resend-otp', rateLimiters_1.authLimiter, (0, validate_1.default)({ body: auth_validation_1.resendOtpSchema }), controller.resendOtp);
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email + password
 */
router.post('/login', rateLimiters_1.authLimiter, (0, validate_1.default)({ body: auth_validation_1.loginSchema }), controller.login);
/**
 * @openapi
 * /auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Log in or sign up using a Google Sign-In idToken
 */
router.post('/google', rateLimiters_1.authLimiter, (0, validate_1.default)({ body: auth_validation_1.googleAuthSchema }), controller.googleAuth);
/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token for a new access + refresh token pair
 */
router.post('/refresh', (0, validate_1.default)({ body: auth_validation_1.refreshTokenSchema }), controller.refresh);
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke a refresh token
 */
router.post('/logout', controller.logout);
/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password-reset OTP by email
 */
router.post('/forgot-password', rateLimiters_1.authLimiter, (0, validate_1.default)({ body: auth_validation_1.forgotPasswordSchema }), controller.forgotPassword);
/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using the OTP from forgot-password
 */
router.post('/reset-password', rateLimiters_1.authLimiter, (0, validate_1.default)({ body: auth_validation_1.resetPasswordSchema }), controller.resetPassword);
/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', authenticate_1.authenticate, controller.me);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map