"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.updateUserStatus = updateUserStatus;
exports.updateUserRole = updateUserRole;
exports.getPlatformAnalytics = getPlatformAnalytics;
exports.listAllReviews = listAllReviews;
exports.listAllProducts = listAllProducts;
exports.getSellerBalances = getSellerBalances;
exports.getSellerBalance = getSellerBalance;
exports.createPayout = createPayout;
exports.listPayouts = listPayouts;
exports.reversePayout = reversePayout;
exports.listShipments = listShipments;
exports.getShipmentDetail = getShipmentDetail;
exports.flagShipmentForReview = flagShipmentForReview;
exports.listDisputes = listDisputes;
exports.reviewDispute = reviewDispute;
exports.listRiskSignals = listRiskSignals;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
const notification_service_1 = require("../notification/notification.service");
const auditLog_service_1 = require("../order/auditLog.service");
const shipment_constants_1 = require("../order/shipment.constants");
// --- User management ---------------------------------------------------
async function listUsers(query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if (query.role)
        where.role = query.role;
    if (query.isActive !== undefined)
        where.isActive = query.isActive;
    if (query.search) {
        where.OR = [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
        ];
    }
    const [items, totalItems] = await Promise.all([
        prisma_1.default.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                authProvider: true,
                isEmailVerified: true,
                isActive: true,
                profileImage: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.user.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function updateUserStatus(adminId, targetUserId, isActive) {
    if (adminId === targetUserId) {
        throw ApiError_1.default.badRequest('You cannot change your own account status.');
    }
    const user = await prisma_1.default.user.findUnique({ where: { id: targetUserId } });
    if (!user)
        throw ApiError_1.default.notFound('User not found.');
    const updated = await prisma_1.default.user.update({ where: { id: targetUserId }, data: { isActive } });
    if (!isActive) {
        // Deactivation should end every active session immediately, not just block new logins.
        await prisma_1.default.refreshToken.updateMany({ where: { userId: targetUserId, revoked: false }, data: { revoked: true } });
    }
    return updated;
}
async function updateUserRole(adminId, targetUserId, role) {
    if (adminId === targetUserId) {
        throw ApiError_1.default.badRequest('You cannot change your own role.');
    }
    const user = await prisma_1.default.user.findUnique({ where: { id: targetUserId } });
    if (!user)
        throw ApiError_1.default.notFound('User not found.');
    // A blunt, support-facing override — separate from the formal /sellers/apply +
    // /sellers/applications/:id/review workflow. Setting role=SELLER this way does
    // NOT create a SellerProfile; the user still won't have one until they apply
    // normally, so prefer the application flow for granting seller access.
    return prisma_1.default.user.update({ where: { id: targetUserId }, data: { role } });
}
async function getPlatformAnalytics({ months }) {
    const [usersByRole, totalOrders, totalProducts, gmvRows, statusBreakdown, monthlyGmv] = await Promise.all([
        prisma_1.default.user.groupBy({ by: ['role'], _count: { role: true } }),
        prisma_1.default.order.count(),
        prisma_1.default.product.count(),
        prisma_1.default.$queryRaw `
      SELECT COALESCE(SUM("totalAmount"), 0)::float AS gmv FROM orders WHERE status != 'CANCELLED'
    `,
        prisma_1.default.order.groupBy({ by: ['status'], _count: { status: true } }),
        prisma_1.default.$queryRaw `
      SELECT
        DATE_TRUNC('month', "createdAt")::date AS month,
        COALESCE(SUM("totalAmount"), 0)::float AS gmv,
        COUNT(*)::int AS "orderCount"
      FROM orders
      WHERE status != 'CANCELLED' AND "createdAt" >= NOW() - (${months}::text || ' months')::interval
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `,
    ]);
    const roleCounts = Object.fromEntries(usersByRole.map((r) => [r.role, r._count.role]));
    return {
        totalUsers: usersByRole.reduce((sum, r) => sum + r._count.role, 0),
        totalBuyers: roleCounts.BUYER ?? 0,
        totalSellers: roleCounts.SELLER ?? 0,
        totalAdmins: roleCounts.ADMIN ?? 0,
        totalOrders,
        totalProducts,
        gmv: gmvRows[0]?.gmv ?? 0,
        monthlyGmv,
        orderStatusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count.status })),
    };
}
// --- Cross-product review moderation queue ----------------------------
async function listAllReviews(query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if (query.isApproved !== undefined)
        where.isApproved = query.isApproved;
    if (query.minRating)
        where.rating = { gte: query.minRating };
    if (query.productId)
        where.productId = query.productId;
    const [items, totalItems] = await Promise.all([
        prisma_1.default.review.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, profileImage: true } },
                product: { select: { id: true, name: true, slug: true, sellerId: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.review.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function listAllProducts(query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if (query.isActive !== undefined)
        where.isActive = query.isActive;
    if (query.sellerId)
        where.sellerId = query.sellerId;
    if (query.search) {
        where.OR = [
            { name: { contains: query.search, mode: 'insensitive' } },
            { brand: { contains: query.search, mode: 'insensitive' } },
        ];
    }
    const [items, totalItems] = await Promise.all([
        prisma_1.default.product.findMany({
            where,
            include: {
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                category: { select: { id: true, name: true } },
                seller: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.product.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function computeSellerBalance(sellerId) {
    const rows = await prisma_1.default.$queryRaw `
    WITH product_revenue AS (
      SELECT COALESCE(SUM(oi."totalPrice"), 0) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      WHERE p."sellerId" = ${sellerId} AND o.status = 'DELIVERED'
    ),
    seed_revenue AS (
      SELECT COALESCE(SUM(soi."totalPrice"), 0) AS revenue
      FROM seed_order_items soi
      JOIN seed_orders so ON so.id = soi."orderId"
      JOIN seeds s ON s.id = soi."seedId"
      WHERE s."sellerId" = ${sellerId} AND so.status = 'DELIVERED'
    ),
    machinery_revenue AS (
      SELECT COALESCE(SUM(mb."totalAmount"), 0) AS revenue
      FROM machinery_bookings mb
      JOIN machinery m ON m.id = mb."machineryId"
      WHERE m."sellerId" = ${sellerId} AND mb.status = 'COMPLETED'
    ),
    paid_out AS (
      SELECT COALESCE(SUM(amount), 0) AS paid
      FROM payouts
      WHERE "sellerId" = ${sellerId} AND status = 'PAID'
    )
    SELECT
      (product_revenue.revenue + seed_revenue.revenue + machinery_revenue.revenue)::float AS "totalEarned",
      paid_out.paid::float AS "totalPaidOut",
      (product_revenue.revenue + seed_revenue.revenue + machinery_revenue.revenue - paid_out.paid)::float AS balance
    FROM product_revenue, seed_revenue, machinery_revenue, paid_out
  `;
    return rows[0] ?? { totalEarned: 0, totalPaidOut: 0, balance: 0 };
}
/** Paginated, searchable list of every seller with their computed balance — the admin payouts page's main table. */
async function getSellerBalances(query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const search = query.search ?? null;
    const [items, countRows] = await Promise.all([
        prisma_1.default.$queryRaw `
      WITH product_revenue AS (
        SELECT p."sellerId" AS "sellerId", SUM(oi."totalPrice") AS revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi."orderId"
        JOIN products p ON p.id = oi."productId"
        WHERE o.status = 'DELIVERED'
        GROUP BY p."sellerId"
      ),
      seed_revenue AS (
        SELECT s."sellerId" AS "sellerId", SUM(soi."totalPrice") AS revenue
        FROM seed_order_items soi
        JOIN seed_orders so ON so.id = soi."orderId"
        JOIN seeds s ON s.id = soi."seedId"
        WHERE so.status = 'DELIVERED'
        GROUP BY s."sellerId"
      ),
      machinery_revenue AS (
        SELECT m."sellerId" AS "sellerId", SUM(mb."totalAmount") AS revenue
        FROM machinery_bookings mb
        JOIN machinery m ON m.id = mb."machineryId"
        WHERE mb.status = 'COMPLETED'
        GROUP BY m."sellerId"
      ),
      paid_out AS (
        SELECT "sellerId", SUM(amount) AS paid
        FROM payouts
        WHERE status = 'PAID'
        GROUP BY "sellerId"
      )
      SELECT
        u.id, u.name, u.email, u.phone, u."profileImage",
        sp."businessName", sp."verificationStatus"::text AS "verificationStatus",
        sp."bankAccountHolder", sp."bankAccountNumber", sp."bankIfscCode", sp."bankName",
        (COALESCE(pr.revenue, 0) + COALESCE(sr.revenue, 0) + COALESCE(mr.revenue, 0))::float AS "totalEarned",
        COALESCE(po.paid, 0)::float AS "totalPaidOut",
        (COALESCE(pr.revenue, 0) + COALESCE(sr.revenue, 0) + COALESCE(mr.revenue, 0) - COALESCE(po.paid, 0))::float AS balance
      FROM users u
      LEFT JOIN seller_profiles sp ON sp."userId" = u.id
      LEFT JOIN product_revenue pr ON pr."sellerId" = u.id
      LEFT JOIN seed_revenue sr ON sr."sellerId" = u.id
      LEFT JOIN machinery_revenue mr ON mr."sellerId" = u.id
      LEFT JOIN paid_out po ON po."sellerId" = u.id
      WHERE u.role = 'SELLER'
        AND (${search}::text IS NULL OR u.name ILIKE '%' || ${search} || '%' OR u.email ILIKE '%' || ${search} || '%' OR sp."businessName" ILIKE '%' || ${search} || '%')
      ORDER BY balance DESC NULLS LAST, u.name ASC
      LIMIT ${take} OFFSET ${skip}
    `,
        prisma_1.default.$queryRaw `
      SELECT COUNT(*)::int AS count
      FROM users u
      LEFT JOIN seller_profiles sp ON sp."userId" = u.id
      WHERE u.role = 'SELLER'
        AND (${search}::text IS NULL OR u.name ILIKE '%' || ${search} || '%' OR u.email ILIKE '%' || ${search} || '%' OR sp."businessName" ILIKE '%' || ${search} || '%')
    `,
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, countRows[0]?.count ?? 0) };
}
/** Single seller's balance + bank details — fetched fresh right before the "Pay out" modal opens, so figures can't be stale. */
async function getSellerBalance(sellerId) {
    const user = await prisma_1.default.user.findUnique({
        where: { id: sellerId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            role: true,
            sellerProfile: {
                select: {
                    businessName: true,
                    verificationStatus: true,
                    bankAccountHolder: true,
                    bankAccountNumber: true,
                    bankIfscCode: true,
                    bankName: true,
                },
            },
        },
    });
    if (!user || user.role !== 'SELLER')
        throw ApiError_1.default.notFound('Seller not found.');
    const balance = await computeSellerBalance(sellerId);
    return { ...user, ...balance };
}
/** Records a payout an admin has (manually) sent to a seller. Re-validates the balance server-side so two admins can't double-pay a seller from stale list data. */
async function createPayout(adminId, sellerId, input) {
    const seller = await prisma_1.default.user.findUnique({ where: { id: sellerId }, select: { id: true, role: true, name: true } });
    if (!seller || seller.role !== 'SELLER')
        throw ApiError_1.default.notFound('Seller not found.');
    const { balance } = await computeSellerBalance(sellerId);
    if (input.amount > balance) {
        throw ApiError_1.default.badRequest(`Payout of ₹${input.amount.toFixed(2)} exceeds this seller's outstanding balance of ₹${balance.toFixed(2)}.`);
    }
    const payout = await prisma_1.default.payout.create({
        data: {
            sellerId,
            amount: input.amount,
            method: input.method,
            reference: input.reference,
            note: input.note,
            paidById: adminId,
        },
        include: { paidBy: { select: { id: true, name: true } } },
    });
    (0, notification_service_1.notifyUser)({
        userId: sellerId,
        type: 'PAYMENT',
        title: 'Payout received',
        message: `A payout of ₹${input.amount.toFixed(2)} has been sent to your registered bank account${input.reference ? ` (ref: ${input.reference})` : ''}.`,
        relatedEntityType: 'PAYOUT',
        relatedEntityId: payout.id,
        email: {
            subject: `You've received a payout of ₹${input.amount.toFixed(2)}`,
            html: `<p>Hi ${seller.name},</p><p>A payout of <b>₹${input.amount.toFixed(2)}</b> has been sent to your registered bank account.</p>${input.reference ? `<p><b>Reference:</b> ${input.reference}</p>` : ''}<p>Log in to your seller dashboard to see your updated balance.</p>`,
        },
    }).catch(() => { });
    return payout;
}
/** Platform-wide payout ledger — filterable by seller and status. */
async function listPayouts(query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if (query.sellerId)
        where.sellerId = query.sellerId;
    if (query.status)
        where.status = query.status;
    const [items, totalItems] = await Promise.all([
        prisma_1.default.payout.findMany({
            where,
            include: {
                seller: { select: { id: true, name: true, email: true, sellerProfile: { select: { businessName: true } } } },
                paidBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.payout.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
/** Corrects a mistaken payout entry (wrong amount/seller) without deleting the audit row. */
async function reversePayout(payoutId) {
    const payout = await prisma_1.default.payout.findUnique({ where: { id: payoutId } });
    if (!payout)
        throw ApiError_1.default.notFound('Payout not found.');
    if (payout.status === 'REVERSED')
        throw ApiError_1.default.badRequest('This payout has already been reversed.');
    return prisma_1.default.payout.update({ where: { id: payoutId }, data: { status: 'REVERSED' } });
}
// --- Shipment management (requirement #10) ------------------------------
const ADMIN_SHIPMENT_INCLUDE = {
    order: {
        select: {
            id: true,
            orderNumber: true,
            status: true,
            user: { select: { id: true, name: true, email: true } },
            items: { select: { productName: true, product: { select: { name: true } } } },
            disputes: { select: { id: true, status: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
    },
    seller: { select: { id: true, name: true, email: true } },
    events: { orderBy: { eventTime: 'desc' }, take: 1 },
};
async function listShipments(query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if (query.status)
        where.status = query.status;
    if (query.flagged !== undefined)
        where.flaggedForReview = query.flagged;
    if (query.disputed !== undefined) {
        where.order = { disputes: query.disputed ? { some: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } } : { none: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } } };
    }
    if (query.search) {
        where.OR = [
            { normalizedAwb: { contains: query.search.toUpperCase() } },
            { order: { orderNumber: { contains: query.search, mode: 'insensitive' } } },
        ];
    }
    const [items, totalItems] = await Promise.all([
        prisma_1.default.shipment.findMany({
            where,
            include: ADMIN_SHIPMENT_INCLUDE,
            orderBy: [{ flaggedForReview: 'desc' }, { updatedAt: 'desc' }],
            skip,
            take,
        }),
        prisma_1.default.shipment.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
/** Full shipment detail for one order — complete tracking timeline plus the shipment audit trail (requirement #10/#12). */
async function getShipmentDetail(orderIdOrNumber) {
    const order = await prisma_1.default.order.findFirst({
        where: { OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }] },
        include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            items: { include: { product: { select: { id: true, name: true, sellerId: true } } } },
            shipment: { include: { events: { orderBy: { eventTime: 'asc' } }, seller: { select: { id: true, name: true, email: true } } } },
            disputes: { orderBy: { createdAt: 'desc' } },
            statusHistory: { orderBy: { changedAt: 'asc' } },
        },
    });
    if (!order)
        throw ApiError_1.default.notFound('Order not found.');
    const auditLog = await prisma_1.default.shipmentAuditLog.findMany({
        where: { orderId: order.id },
        orderBy: { createdAt: 'asc' },
    });
    return { order, auditLog };
}
/**
 * Admin manually flags a shipment for investigation (requirement #10/#11).
 * Deliberately the ONLY shipment write available to admins — status,
 * pickupConfirmedAt, deliveredAt, and every ShipmentEvent stay
 * courier-derived and are never exposed for direct editing here.
 */
async function flagShipmentForReview(orderIdOrNumber, admin, { note }) {
    const order = await prisma_1.default.order.findFirst({
        where: { OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }] },
        include: { shipment: true },
    });
    if (!order)
        throw ApiError_1.default.notFound('Order not found.');
    if (!order.shipment)
        throw ApiError_1.default.badRequest('This order has no shipment yet.');
    const updated = await prisma_1.default.shipment.update({
        where: { id: order.shipment.id },
        data: {
            flaggedForReview: true,
            riskNote: order.shipment.riskNote ? `${order.shipment.riskNote}\n---\n${note}` : note,
        },
    });
    await (0, auditLog_service_1.recordAudit)({
        orderId: order.id,
        shipmentId: order.shipment.id,
        action: shipment_constants_1.AUDIT_ACTIONS.ADMIN_FLAGGED_SHIPMENT,
        actorId: admin.id,
        actorRole: 'ADMIN',
        source: 'ADMIN',
        metadata: { note },
    });
    return updated;
}
// --- Dispute review (requirement #9) -------------------------------------
async function listDisputes(query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = {};
    if (query.status)
        where.status = query.status;
    const [items, totalItems] = await Promise.all([
        prisma_1.default.dispute.findMany({
            where,
            include: {
                order: { select: { id: true, orderNumber: true, status: true, shipment: { select: { deliveredAt: true } } } },
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.dispute.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
/**
 * Admin resolves (or moves to review) a delivery dispute. RESOLVED/REJECTED
 * both close it out and take the order out of DISPUTED — the distinction is
 * business meaning admins record via adminNote (e.g. refund issued vs.
 * delivery evidence upheld), not a different order-status outcome, since
 * that downstream action (refund, replacement, ...) is outside the scope of
 * this shipment-tracking system. Never touches prior shipment/tracking
 * evidence.
 */
async function reviewDispute(disputeId, admin, { status, adminNote }) {
    const dispute = await prisma_1.default.dispute.findUnique({ where: { id: disputeId }, include: { order: true } });
    if (!dispute)
        throw ApiError_1.default.notFound('Dispute not found.');
    if (dispute.status === 'RESOLVED' || dispute.status === 'REJECTED') {
        throw ApiError_1.default.badRequest('This dispute has already been closed.');
    }
    const updatedDispute = await prisma_1.default.dispute.update({
        where: { id: disputeId },
        data: {
            status,
            adminNote,
            resolvedById: status === 'RESOLVED' || status === 'REJECTED' ? admin.id : undefined,
            resolvedAt: status === 'RESOLVED' || status === 'REJECTED' ? new Date() : undefined,
        },
    });
    if ((status === 'RESOLVED' || status === 'REJECTED') && dispute.order.status === 'DISPUTED') {
        await prisma_1.default.order.update({
            where: { id: dispute.orderId },
            data: {
                status: 'DELIVERED',
                statusHistory: {
                    create: { status: 'DELIVERED', note: `Dispute ${status.toLowerCase()}${adminNote ? `: ${adminNote}` : ''}`, changedById: admin.id },
                },
            },
        });
    }
    await (0, auditLog_service_1.recordAudit)({
        orderId: dispute.orderId,
        action: shipment_constants_1.AUDIT_ACTIONS.ADMIN_REVIEWED_DISPUTE,
        actorId: admin.id,
        actorRole: 'ADMIN',
        source: 'ADMIN',
        previousState: dispute.status,
        newState: status,
        metadata: adminNote ? { adminNote } : undefined,
    });
    return updatedDispute;
}
/**
 * Recent seller-level risk signals (requirement #11) — repeated invalid AWB
 * submissions or repeated disputes against the same seller, raised by
 * shipment.service.ts / dispute.service.ts as SHIPMENT_FLAGGED audit
 * entries with no shipmentId (since a rejected AWB attempt never creates a
 * Shipment row to attach a per-shipment flag to). Kept intentionally simple
 * — a recent list, not a paginated report — since this is meant as an
 * admin "worth a look" feed, not a full audit query surface.
 */
async function listRiskSignals(limit = 50) {
    const logs = await prisma_1.default.shipmentAuditLog.findMany({
        where: { action: shipment_constants_1.AUDIT_ACTIONS.SHIPMENT_FLAGGED },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
    const actorIds = [...new Set(logs.map((l) => l.actorId).filter((id) => Boolean(id)))];
    const actors = actorIds.length
        ? await prisma_1.default.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } })
        : [];
    const actorById = new Map(actors.map((a) => [a.id, a]));
    return logs.map((log) => ({ ...log, actor: log.actorId ? (actorById.get(log.actorId) ?? null) : null }));
}
//# sourceMappingURL=admin.service.js.map