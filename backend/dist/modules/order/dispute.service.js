"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDispute = createDispute;
exports.listMyDisputes = listMyDisputes;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const socket_1 = require("../../config/socket");
const notification_service_1 = require("../notification/notification.service");
const auditLog_service_1 = require("./auditLog.service");
const shipment_constants_1 = require("./shipment.constants");
/**
 * Buyer reports a delivery problem on an order the courier has already
 * marked delivered (requirement #9). Puts the order on hold (DISPUTED) so
 * it stops being treated as successfully completed, without touching any
 * existing shipment/tracking evidence.
 */
async function createDispute(idOrNumber, user, input) {
    const order = await prisma_1.default.order.findFirst({
        where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
        include: { items: { include: { product: { select: { sellerId: true } } } }, disputes: true, shipment: true },
    });
    if (!order)
        throw ApiError_1.default.notFound('Order not found.');
    if (order.userId !== user.id)
        throw ApiError_1.default.forbidden('You do not have permission to report a problem with this order.');
    if (order.status !== 'DELIVERED') {
        throw ApiError_1.default.badRequest('You can only report a delivery problem once the order has been marked delivered.');
    }
    const openDispute = order.disputes.find((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW');
    if (openDispute) {
        throw ApiError_1.default.conflict('A dispute for this order is already open and under review.');
    }
    const [dispute] = await prisma_1.default.$transaction([
        prisma_1.default.dispute.create({
            data: { orderId: order.id, userId: user.id, reason: input.reason, details: input.details },
        }),
        prisma_1.default.order.update({
            where: { id: order.id },
            data: { status: 'DISPUTED', statusHistory: { create: { status: 'DISPUTED', note: `Buyer reported a problem: ${input.reason}`, changedById: user.id } } },
        }),
    ]);
    await (0, auditLog_service_1.recordAudit)({
        orderId: order.id,
        shipmentId: order.shipment?.id,
        action: shipment_constants_1.AUDIT_ACTIONS.CUSTOMER_CREATED_DISPUTE,
        actorId: user.id,
        actorRole: 'CUSTOMER',
        source: 'CUSTOMER',
        previousState: 'DELIVERED',
        newState: 'DISPUTED',
        metadata: { reason: input.reason },
    });
    // Requirement #11: repeated disputes against the same seller(s) is a risk
    // signal. This order may have items from multiple sellers, so flag each.
    const sellerIds = [...new Set(order.items.map((i) => i.product.sellerId))];
    await Promise.all(sellerIds.map(async (sellerId) => {
        const since = new Date(Date.now() - shipment_constants_1.REPEATED_DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const recentDisputeCount = await prisma_1.default.dispute.count({
            where: {
                createdAt: { gte: since },
                order: { items: { some: { product: { sellerId } } } },
            },
        });
        if (recentDisputeCount >= shipment_constants_1.REPEATED_DISPUTE_THRESHOLD) {
            await (0, auditLog_service_1.recordAudit)({
                orderId: order.id,
                action: shipment_constants_1.AUDIT_ACTIONS.SHIPMENT_FLAGGED,
                actorId: sellerId,
                actorRole: 'SYSTEM',
                source: 'SYSTEM',
                metadata: { reason: shipment_constants_1.RISK_FLAGS.REPEATED_DISPUTES_SELLER, count: recentDisputeCount, windowDays: shipment_constants_1.REPEATED_DISPUTE_WINDOW_DAYS },
            });
        }
    }));
    const refreshedOrder = await prisma_1.default.order.findUniqueOrThrow({ where: { id: order.id } });
    (0, socket_1.emitOrderUpdate)(refreshedOrder);
    // Notify the seller(s) — they can't act on it directly (admin owns
    // dispute resolution) but should know their delivery is being questioned.
    await Promise.all(sellerIds.map((sellerId) => (0, notification_service_1.notifyUser)({
        userId: sellerId,
        type: 'ORDER_STATUS',
        title: `Delivery dispute opened — order #${order.orderNumber}`,
        message: `The buyer has reported a problem with a delivered order. It's on hold pending admin review.`,
        relatedEntityType: 'ORDER',
        relatedEntityId: order.id,
    }).catch(() => { })));
    return dispute;
}
/** Lists the current user's own disputes (used by the customer order-history view; admin review lives in admin.service.ts). */
async function listMyDisputes(user) {
    return prisma_1.default.dispute.findMany({
        where: { userId: user.id },
        include: { order: { select: { id: true, orderNumber: true, status: true } } },
        orderBy: { createdAt: 'desc' },
    });
}
//# sourceMappingURL=dispute.service.js.map