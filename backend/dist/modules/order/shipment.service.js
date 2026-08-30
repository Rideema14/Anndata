"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitShipment = submitShipment;
exports.getShipmentForOrder = getShipmentForOrder;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const socket_1 = require("../../config/socket");
const notification_service_1 = require("../notification/notification.service");
const auditLog_service_1 = require("./auditLog.service");
const tracking_service_1 = require("./tracking.service");
const shipment_constants_1 = require("./shipment.constants");
const ORDER_FOR_SHIPMENT_INCLUDE = {
    items: { include: { product: { select: { sellerId: true } } } },
    shipment: { include: { events: { orderBy: { eventTime: 'asc' } } } },
    payment: { select: { status: true } },
};
function assertSellerOnOrder(order, user) {
    if (user.role === 'ADMIN')
        return;
    const isSellerOnOrder = order.items.some((item) => item.product?.sellerId === user.id);
    if (!isSellerOnOrder)
        throw ApiError_1.default.forbidden('You do not have permission to manage shipping for this order.');
}
/** Logs a rejected AWB attempt (no Shipment row — nothing valid to persist) and checks the repeated-invalid-AWB risk rule. */
async function recordRejectedAwbAttempt(orderId, sellerId, reason, metadata) {
    await (0, auditLog_service_1.recordAudit)({
        orderId,
        action: shipment_constants_1.AUDIT_ACTIONS.SELLER_AWB_REJECTED,
        actorId: sellerId,
        actorRole: 'SELLER',
        source: 'SELLER',
        metadata: { reason, ...metadata },
    });
    const since = new Date(Date.now() - shipment_constants_1.REPEATED_INVALID_AWB_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const recentRejections = await prisma_1.default.shipmentAuditLog.count({
        where: { action: shipment_constants_1.AUDIT_ACTIONS.SELLER_AWB_REJECTED, actorId: sellerId, createdAt: { gte: since } },
    });
    if (recentRejections >= shipment_constants_1.REPEATED_INVALID_AWB_THRESHOLD) {
        // No shipment row exists for a rejected attempt, so there's nowhere to
        // attach a per-shipment flag — this is a seller-level signal for the
        // admin dashboard's risk view, surfaced via the audit trail itself
        // (admin.service.ts's risky-shipment query looks at recent
        // SELLER_AWB_REJECTED counts per seller, same as this one).
        await (0, auditLog_service_1.recordAudit)({
            orderId,
            action: shipment_constants_1.AUDIT_ACTIONS.SHIPMENT_FLAGGED,
            actorId: sellerId,
            actorRole: 'SELLER',
            source: 'SYSTEM',
            metadata: { reason: shipment_constants_1.RISK_FLAGS.REPEATED_INVALID_AWB_SELLER, count: recentRejections, windowDays: shipment_constants_1.REPEATED_INVALID_AWB_WINDOW_DAYS },
        });
    }
}
/**
 * Seller submits the AWB for an order (requirement #2/#3). This is the
 * seller's ENTIRE surface area for shipment management — no status field,
 * no courier-derived fields. Everything from here on (pickup, transit,
 * delivery) is written exclusively by tracking.service.ts from courier data.
 */
async function submitShipment(idOrNumber, user, input) {
    const order = await prisma_1.default.order.findFirst({
        where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
        include: ORDER_FOR_SHIPMENT_INCLUDE,
    });
    if (!order)
        throw ApiError_1.default.notFound('Order not found.');
    assertSellerOnOrder(order, user);
    if (['CANCELLED', 'DELIVERED', 'RETURNED', 'DISPUTED'].includes(order.status)) {
        throw ApiError_1.default.badRequest(`Order is ${order.status.toLowerCase()} and can no longer accept shipment information.`);
    }
    if (order.payment && order.payment.status !== 'PAID') {
        throw ApiError_1.default.badRequest('This order has not been paid for yet — shipment tracking can only be added once payment is confirmed.');
    }
    // Allow submitting once, and allow a correction only while still
    // unverified (provider hadn't confirmed it yet) — once verified or
    // further along, the AWB is locked (courier is now the source of truth).
    if (order.shipment && (order.shipment.verified || order.shipment.status !== 'AWB_SUBMITTED')) {
        throw ApiError_1.default.conflict('A shipment has already been submitted and verified for this order. Contact support if the AWB was entered incorrectly.');
    }
    const carrier = (0, tracking_service_1.getCarrier)(input.carrierCode);
    if (!carrier)
        throw ApiError_1.default.badRequest('Unknown carrier selected.');
    const awb = input.awb.trim();
    const normalizedAwb = (0, tracking_service_1.normalizeAwb)(awb);
    if (!(0, tracking_service_1.isPlausibleAwbFormat)(normalizedAwb)) {
        await recordRejectedAwbAttempt(order.id, user.id, 'AWB_INVALID_FORMAT', { carrierCode: input.carrierCode, awbLength: awb.length });
        throw ApiError_1.default.badRequest('That doesn\'t look like a valid AWB / tracking number.');
    }
    // Requirement #3: prevent the same AWB being attached to more than one
    // active order (excluding this one, if we're correcting an unverified
    // submission on retry).
    const duplicate = await prisma_1.default.shipment.findFirst({
        where: {
            normalizedAwb,
            carrierCode: input.carrierCode,
            orderId: { not: order.id },
            order: { status: { notIn: ['CANCELLED'] } },
            status: { notIn: ['RETURNED'] },
        },
        select: { id: true, orderId: true },
    });
    if (duplicate) {
        await recordRejectedAwbAttempt(order.id, user.id, 'DUPLICATE_AWB', { carrierCode: input.carrierCode, conflictingOrderId: duplicate.orderId });
        throw ApiError_1.default.conflict('This AWB is already associated with another active order. Each shipment needs its own tracking number.');
    }
    const verification = await (0, tracking_service_1.verifyAwbWithProvider)(input.carrierCode, normalizedAwb, input.carrierName);
    if (verification.outcome === 'not_found') {
        await recordRejectedAwbAttempt(order.id, user.id, 'AWB_NOT_FOUND', { carrierCode: input.carrierCode });
        throw ApiError_1.default.badRequest('The tracking provider could not find this AWB with the selected carrier. Double-check the number and try again.');
    }
    if (verification.outcome === 'mismatch') {
        await recordRejectedAwbAttempt(order.id, user.id, 'CARRIER_MISMATCH', { carrierCode: input.carrierCode, detected: verification.detectedCarrierNames });
        throw ApiError_1.default.badRequest(`This AWB appears to belong to ${verification.detectedCarrierNames.join(' or ')}, not ${carrier.name}. Please select the correct carrier.`);
    }
    const verified = verification.outcome === 'verified';
    const shipmentData = {
        orderId: order.id,
        sellerId: user.id,
        carrierCode: input.carrierCode,
        carrierName: input.carrierName ?? carrier.name,
        awb,
        normalizedAwb,
        status: (verified ? 'AWB_VERIFIED' : 'AWB_SUBMITTED'),
        verified,
        verifiedCarrierCode: verified ? verification.verifiedCarrierCode : null,
        verificationAttempts: 1,
        lastVerificationError: verification.outcome === 'deferred' ? verification.reason : null,
        flaggedForReview: verification.outcome === 'deferred',
        riskFlags: verification.outcome === 'deferred' ? [shipment_constants_1.RISK_FLAGS.PROVIDER_UNAVAILABLE] : [],
    };
    const shipment = order.shipment
        ? await prisma_1.default.shipment.update({ where: { id: order.shipment.id }, data: shipmentData })
        : await prisma_1.default.shipment.create({ data: shipmentData });
    await prisma_1.default.order.update({
        where: { id: order.id },
        data: {
            status: 'CONFIRMED',
            trackingCarrier: input.carrierCode,
            trackingNumber: awb,
            lastTrackingSync: verified ? new Date() : null,
            statusHistory: {
                create: { status: 'CONFIRMED', note: `Seller submitted AWB ${awb} via ${carrier.name}.`, changedById: user.id },
            },
        },
    });
    await (0, auditLog_service_1.recordAudit)({
        orderId: order.id,
        shipmentId: shipment.id,
        action: shipment_constants_1.AUDIT_ACTIONS.SELLER_SUBMITTED_AWB,
        actorId: user.id,
        actorRole: 'SELLER',
        source: 'SELLER',
        newState: 'AWB_SUBMITTED',
        metadata: { carrierCode: input.carrierCode, awb },
    });
    if (verified) {
        await (0, auditLog_service_1.recordAudit)({
            orderId: order.id,
            shipmentId: shipment.id,
            action: shipment_constants_1.AUDIT_ACTIONS.AWB_VERIFIED,
            actorId: user.id,
            actorRole: 'SYSTEM',
            source: 'SYSTEM',
            previousState: 'AWB_SUBMITTED',
            newState: 'AWB_VERIFIED',
        });
    }
    else {
        await (0, auditLog_service_1.recordAudit)({
            orderId: order.id,
            shipmentId: shipment.id,
            action: shipment_constants_1.AUDIT_ACTIONS.AWB_VERIFICATION_DEFERRED,
            actorRole: 'SYSTEM',
            source: 'SYSTEM',
            metadata: { reason: shipmentData.lastVerificationError },
        });
    }
    const refreshed = await prisma_1.default.order.findUniqueOrThrow({ where: { id: order.id }, include: ORDER_FOR_SHIPMENT_INCLUDE });
    (0, socket_1.emitOrderUpdate)(refreshed);
    const trackUrl = (0, tracking_service_1.getTrackingUrl)(input.carrierCode, awb);
    (0, notification_service_1.notifyUser)({
        userId: order.userId,
        type: 'ORDER_STATUS',
        title: `Order #${order.orderNumber} shipped`,
        message: verified
            ? `Your order has been handed to ${carrier.name} (AWB ${awb}). We'll update you as it moves.`
            : `Your seller has submitted tracking for your order (AWB ${awb}, ${carrier.name}). We're confirming it with the carrier now.`,
        relatedEntityType: 'ORDER',
        relatedEntityId: order.id,
        email: {
            subject: `Your order #${order.orderNumber} is on its way`,
            html: `<p>Your order has been shipped.</p><p><b>Carrier:</b> ${carrier.name}</p><p><b>AWB:</b> ${awb}</p>${trackUrl ? `<p><a href="${trackUrl}">Track your shipment</a></p>` : ''}`,
        },
    }).catch(() => { });
    // Kick an immediate sync so the buyer doesn't have to wait for the next
    // cron tick to see the first courier-confirmed event, if any exist yet.
    if (verified)
        (0, tracking_service_1.syncTracking)(order.id).catch(() => { });
    return refreshed;
}
/** Full shipment detail (status, verification, events) for an order — buyer, the order's seller, or admin. */
async function getShipmentForOrder(idOrNumber, user) {
    const order = await prisma_1.default.order.findFirst({
        where: { OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }] },
        include: ORDER_FOR_SHIPMENT_INCLUDE,
    });
    if (!order)
        throw ApiError_1.default.notFound('Order not found.');
    if (user.role !== 'ADMIN' && order.userId !== user.id) {
        assertSellerOnOrder(order, user);
    }
    if (!order.shipment)
        return null;
    return order.shipment;
}
//# sourceMappingURL=shipment.service.js.map