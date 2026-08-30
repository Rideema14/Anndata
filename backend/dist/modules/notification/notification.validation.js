"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFeedbackQuerySchema = exports.respondFeedbackSchema = exports.feedbackSchema = exports.updatePreferencesSchema = exports.listNotificationsQuerySchema = exports.NOTIFICATION_TYPES = void 0;
const zod_1 = require("zod");
exports.NOTIFICATION_TYPES = ['ORDER_STATUS', 'PAYMENT', 'SELLER_VERIFICATION', 'REVIEW', 'PRICE_ALERT', 'GENERAL'];
exports.listNotificationsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    unreadOnly: zod_1.z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => v === 'true'),
});
exports.updatePreferencesSchema = zod_1.z.object({
    emailEnabled: zod_1.z.boolean().optional(),
    inAppEnabled: zod_1.z.boolean().optional(),
    mutedTypes: zod_1.z.array(zod_1.z.enum(exports.NOTIFICATION_TYPES)).optional(),
});
exports.feedbackSchema = zod_1.z.object({
    category: zod_1.z.enum(['BUG', 'FEATURE_REQUEST', 'COMPLAINT', 'GENERAL']).default('GENERAL'),
    subject: zod_1.z.string().trim().min(3).max(150),
    message: zod_1.z.string().trim().min(5).max(3000),
});
exports.respondFeedbackSchema = zod_1.z.object({
    status: zod_1.z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']),
    adminResponse: zod_1.z.string().trim().max(3000).optional(),
});
exports.listFeedbackQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    status: zod_1.z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']).optional(),
    category: zod_1.z.enum(['BUG', 'FEATURE_REQUEST', 'COMPLAINT', 'GENERAL']).optional(),
});
//# sourceMappingURL=notification.validation.js.map