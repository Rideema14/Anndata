"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyProfile = getMyProfile;
exports.applyAsSeller = applyAsSeller;
exports.updateMyProfile = updateMyProfile;
exports.listApplications = listApplications;
exports.reviewApplication = reviewApplication;
exports.getDashboard = getDashboard;
exports.getAnalytics = getAnalytics;
exports.getReviews = getReviews;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
const notification_service_1 = require("../notification/notification.service");
async function getMyProfile(userId) {
    const profile = await prisma_1.default.sellerProfile.findUnique({ where: { userId } });
    if (!profile)
        throw ApiError_1.default.notFound('You have not applied to become a seller yet.');
    return profile;
}
/** Create the initial application, or re-submit after a rejection. */
async function applyAsSeller(userId, data) {
    const existing = await prisma_1.default.sellerProfile.findUnique({ where: { userId } });
    if (existing && ['PENDING', 'APPROVED'].includes(existing.verificationStatus)) {
        throw ApiError_1.default.conflict(existing.verificationStatus === 'APPROVED'
            ? 'You are already a verified seller.'
            : 'Your seller application is already pending review.');
    }
    const profile = existing
        ? await prisma_1.default.sellerProfile.update({
            where: { userId },
            data: { ...data, verificationStatus: 'PENDING', reviewedById: null, reviewedAt: null, verificationNote: null },
        })
        : await prisma_1.default.sellerProfile.create({ data: { ...data, userId, verificationStatus: 'PENDING' } });
    return profile;
}
async function updateMyProfile(userId, data) {
    const existing = await getMyProfile(userId);
    // Editing business/bank details after a rejection re-queues the application.
    const statusUpdate = existing.verificationStatus === 'REJECTED' ? { verificationStatus: 'PENDING' } : {};
    return prisma_1.default.sellerProfile.update({ where: { userId }, data: { ...data, ...statusUpdate } });
}
async function listApplications(query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = query.status ? { verificationStatus: query.status } : {};
    const [items, totalItems] = await Promise.all([
        prisma_1.default.sellerProfile.findMany({
            where,
            include: { user: { select: { id: true, name: true, email: true, phone: true } } },
            orderBy: { createdAt: 'asc' },
            skip,
            take,
        }),
        prisma_1.default.sellerProfile.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function reviewApplication(profileId, admin, { decision, note }) {
    const profile = await prisma_1.default.sellerProfile.findUnique({ where: { id: profileId } });
    if (!profile)
        throw ApiError_1.default.notFound('Seller application not found.');
    if (profile.verificationStatus !== 'PENDING') {
        throw ApiError_1.default.badRequest(`Application is already ${profile.verificationStatus.toLowerCase()}.`);
    }
    const newStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const updated = await prisma_1.default.$transaction(async (tx) => {
        const result = await tx.sellerProfile.update({
            where: { id: profileId },
            data: {
                verificationStatus: newStatus,
                verificationNote: note,
                reviewedById: admin.id,
                reviewedAt: new Date(),
            },
        });
        if (newStatus === 'APPROVED') {
            await tx.user.update({ where: { id: profile.userId }, data: { role: 'SELLER' } });
        }
        return result;
    });
    await (0, notification_service_1.notifyUser)({
        userId: profile.userId,
        type: 'SELLER_VERIFICATION',
        title: newStatus === 'APPROVED' ? 'Your seller application was approved' : 'Your seller application was rejected',
        message: newStatus === 'APPROVED'
            ? 'Congratulations — you can now list products on the marketplace.'
            : note || 'Please review your details and re-apply.',
        relatedEntityType: 'SELLER_PROFILE',
        relatedEntityId: profile.id,
        email: {
            subject: newStatus === 'APPROVED' ? 'Seller application approved' : 'Seller application update',
            html: `<p>${newStatus === 'APPROVED'
                ? 'Congratulations — your seller application has been approved. You can now list products.'
                : `Your seller application was not approved.${note ? ` Reason: ${note}` : ''}`}</p>`,
        },
    });
    return updated;
}
async function getDashboard(userId) {
    const [activeListings, totalListings, toFulfillRows, revenueRows, revenue30dRows] = await Promise.all([
        prisma_1.default.product.count({ where: { sellerId: userId, isActive: true } }),
        prisma_1.default.product.count({ where: { sellerId: userId } }),
        prisma_1.default.$queryRaw `
      SELECT COUNT(DISTINCT o.id)::int AS count
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      WHERE p."sellerId" = ${userId} AND o.status IN ('CONFIRMED', 'PROCESSING')
    `,
        prisma_1.default.$queryRaw `
      SELECT COALESCE(SUM(oi."totalPrice"), 0)::float AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      WHERE p."sellerId" = ${userId} AND o.status != 'CANCELLED'
    `,
        prisma_1.default.$queryRaw `
      SELECT COALESCE(SUM(oi."totalPrice"), 0)::float AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      WHERE p."sellerId" = ${userId} AND o.status != 'CANCELLED' AND o."createdAt" >= NOW() - INTERVAL '30 days'
    `,
    ]);
    return {
        activeListings,
        totalListings,
        ordersToFulfill: toFulfillRows[0]?.count ?? 0,
        totalRevenue: revenueRows[0]?.revenue ?? 0,
        revenueLast30Days: revenue30dRows[0]?.revenue ?? 0,
    };
}
async function getAnalytics(userId, { days, topProductsLimit }) {
    const [salesTrend, topProducts, statusBreakdown] = await Promise.all([
        prisma_1.default.$queryRaw `
      SELECT
        DATE_TRUNC('day', o."createdAt")::date AS date,
        COALESCE(SUM(oi."totalPrice"), 0)::float AS revenue,
        COUNT(DISTINCT o.id)::int AS "orderCount"
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      WHERE p."sellerId" = ${userId}
        AND o.status != 'CANCELLED'
        AND o."createdAt" >= NOW() - (${days}::text || ' days')::interval
      GROUP BY DATE_TRUNC('day', o."createdAt")
      ORDER BY date ASC
    `,
        prisma_1.default.$queryRaw `
      SELECT p.id, p.name, p.slug,
        SUM(oi.quantity)::int AS "unitsSold",
        SUM(oi."totalPrice")::float AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      WHERE p."sellerId" = ${userId} AND o.status != 'CANCELLED'
      GROUP BY p.id, p.name, p.slug
      ORDER BY revenue DESC
      LIMIT ${topProductsLimit}
    `,
        prisma_1.default.$queryRaw `
      SELECT o.status, COUNT(DISTINCT o.id)::int AS count
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      WHERE p."sellerId" = ${userId}
      GROUP BY o.status
    `,
    ]);
    return { salesTrend, topProducts, statusBreakdown };
}
/**
 * A seller's "feedback inbox": every review left on any of their products,
 * newest first, with the reviewer's identity (name + profile picture) and
 * which product it was for — not just the public per-product review list.
 * Deliberately not filtered to isApproved-only reviews — this is the
 * seller's own view of everything said about their products, not the
 * public-facing product page.
 */
async function getReviews(sellerId, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { product: { sellerId } };
    if (query.productId)
        where.productId = query.productId;
    if (query.minRating)
        where.rating = { gte: query.minRating };
    const [items, totalItems] = await Promise.all([
        prisma_1.default.review.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, profileImage: true } },
                product: { select: { id: true, name: true, slug: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.review.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
//# sourceMappingURL=seller.service.js.map