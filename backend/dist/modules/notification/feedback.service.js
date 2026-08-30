"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitFeedback = submitFeedback;
exports.listFeedback = listFeedback;
exports.getMyFeedback = getMyFeedback;
exports.respondToFeedback = respondToFeedback;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
const notification_service_1 = require("./notification.service");
async function submitFeedback(userId, data) {
    return prisma_1.default.feedback.create({ data: { ...data, userId: userId || null } });
}
async function listFeedback(query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if (query.status)
        where.status = query.status;
    if (query.category)
        where.category = query.category;
    const [items, totalItems] = await Promise.all([
        prisma_1.default.feedback.findMany({
            where,
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.feedback.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function getMyFeedback(userId, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { userId };
    const [items, totalItems] = await Promise.all([
        prisma_1.default.feedback.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
        prisma_1.default.feedback.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function respondToFeedback(id, { status, adminResponse }) {
    const feedback = await prisma_1.default.feedback.findUnique({ where: { id } });
    if (!feedback)
        throw ApiError_1.default.notFound('Feedback not found.');
    const updated = await prisma_1.default.feedback.update({ where: { id }, data: { status, adminResponse } });
    if (feedback.userId && adminResponse) {
        await (0, notification_service_1.notifyUser)({
            userId: feedback.userId,
            type: 'GENERAL',
            title: 'We responded to your feedback',
            message: adminResponse,
            relatedEntityType: 'FEEDBACK',
            relatedEntityId: feedback.id,
            email: {
                subject: `Re: ${feedback.subject}`,
                html: `<p>Hi,</p><p>We reviewed your feedback and here's our response:</p><blockquote>${adminResponse}</blockquote>`,
            },
        });
    }
    return updated;
}
//# sourceMappingURL=feedback.service.js.map