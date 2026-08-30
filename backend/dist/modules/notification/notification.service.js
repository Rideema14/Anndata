"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyUser = notifyUser;
exports.listNotifications = listNotifications;
exports.getUnreadCount = getUnreadCount;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.getPreferences = getPreferences;
exports.updatePreferences = updatePreferences;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const mailer_1 = require("../../config/mailer");
const pagination_1 = require("../../common/utils/pagination");
const logger_1 = __importDefault(require("../../common/utils/logger"));
async function getOrCreatePreference(userId) {
    let pref = await prisma_1.default.notificationPreference.findUnique({ where: { userId } });
    if (!pref) {
        pref = await prisma_1.default.notificationPreference.create({ data: { userId } });
    }
    return pref;
}
/**
 * Internal helper — call this from any module (orders, payments, seller
 * verification, reviews, price alerts, ...) to notify a user. Respects the
 * user's NotificationPreference: skipped entirely if the type is muted,
 * written to the in-app feed only if inAppEnabled, emailed only if
 * emailEnabled. Never throws — a notification failure should never break
 * the calling request (e.g. an order status update should still succeed
 * even if the email send fails).
 */
async function notifyUser({ userId, type, title, message, relatedEntityType, relatedEntityId, email }) {
    try {
        const pref = await getOrCreatePreference(userId);
        if (pref.mutedTypes.includes(type))
            return;
        if (pref.inAppEnabled) {
            await prisma_1.default.notification.create({
                data: { userId, type, title, message, relatedEntityType, relatedEntityId },
            });
        }
        if (pref.emailEnabled && email) {
            const user = await prisma_1.default.user.findUnique({ where: { id: userId }, select: { email: true } });
            if (user) {
                await (0, mailer_1.sendMail)({ to: user.email, subject: email.subject, html: email.html });
            }
        }
    }
    catch (err) {
        const message2 = err instanceof Error ? err.message : String(err);
        logger_1.default.error(`notifyUser failed for userId=${userId} type=${type}: ${message2}`);
    }
}
async function listNotifications(userId, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { userId, ...(query.unreadOnly ? { isRead: false } : {}) };
    const [items, totalItems] = await Promise.all([
        prisma_1.default.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
        prisma_1.default.notification.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function getUnreadCount(userId) {
    const count = await prisma_1.default.notification.count({ where: { userId, isRead: false } });
    return { unreadCount: count };
}
async function markAsRead(userId, notificationId) {
    const notification = await prisma_1.default.notification.findFirst({ where: { id: notificationId, userId } });
    if (!notification)
        throw ApiError_1.default.notFound('Notification not found.');
    return prisma_1.default.notification.update({ where: { id: notificationId }, data: { isRead: true } });
}
async function markAllAsRead(userId) {
    await prisma_1.default.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { message: 'All notifications marked as read.' };
}
async function getPreferences(userId) {
    return getOrCreatePreference(userId);
}
async function updatePreferences(userId, data) {
    await getOrCreatePreference(userId);
    return prisma_1.default.notificationPreference.update({ where: { userId }, data });
}
//# sourceMappingURL=notification.service.js.map