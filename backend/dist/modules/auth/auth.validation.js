"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressSchema = exports.updateProfileSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.googleAuthSchema = exports.loginSchema = exports.resendOtpSchema = exports.verifyOtpSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number');
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100),
    email: zod_1.z.string().trim().toLowerCase().email(),
    phone: zod_1.z
        .string()
        .trim()
        .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number')
        .optional(),
    password: passwordSchema,
});
exports.verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email(),
    otp: zod_1.z.string().trim().length(6),
    purpose: zod_1.z.enum(['REGISTER', 'RESET_PASSWORD']).default('REGISTER'),
});
exports.resendOtpSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email(),
    purpose: zod_1.z.enum(['REGISTER', 'RESET_PASSWORD']).default('REGISTER'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.googleAuthSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(10, 'idToken is required'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(10),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email(),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email(),
    otp: zod_1.z.string().trim().length(6),
    newPassword: passwordSchema,
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100).optional(),
    phone: zod_1.z
        .string()
        .trim()
        .regex(/^\+?[0-9]{10,15}$/)
        .optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
});
exports.addressSchema = zod_1.z.object({
    label: zod_1.z.string().trim().max(30).default('Home'),
    fullName: zod_1.z.string().trim().min(2).max(100),
    phone: zod_1.z
        .string()
        .trim()
        .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number'),
    addressLine1: zod_1.z.string().trim().min(3).max(200),
    addressLine2: zod_1.z.string().trim().max(200).optional(),
    city: zod_1.z.string().trim().min(2).max(100),
    state: zod_1.z.string().trim().min(2).max(100),
    postalCode: zod_1.z.string().trim().min(3).max(12),
    country: zod_1.z.string().trim().min(2).max(60).default('India'),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    isDefault: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=auth.validation.js.map