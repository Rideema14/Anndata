"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentForOrder = createPaymentForOrder;
exports.verifyPayment = verifyPayment;
exports.handleWebhook = handleWebhook;
exports.getPaymentForOrder = getPaymentForOrder;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const razorpay_1 = __importDefault(require("../../config/razorpay"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const env_1 = require("../../config/env");
const socket_1 = require("../../config/socket");
const logger_1 = __importDefault(require("../../common/utils/logger"));
function timingSafeEqualHex(a, b) {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length)
        return false;
    return crypto_1.default.timingSafeEqual(bufA, bufB);
}
/**
 * Creates (or re-creates, after a prior failure) a Razorpay order for an
 * existing platform Order, and upserts the local Payment record that tracks it.
 */
async function createPaymentForOrder(orderId, user) {
    const order = await prisma_1.default.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order)
        throw ApiError_1.default.notFound('Order not found.');
    if (order.userId !== user.id && user.role !== 'ADMIN') {
        throw ApiError_1.default.forbidden('You do not have permission to pay for this order.');
    }
    if (order.payment?.status === 'PAID') {
        throw ApiError_1.default.conflict('This order has already been paid for.');
    }
    if (order.status === 'CANCELLED') {
        throw ApiError_1.default.badRequest('Cannot create a payment for a cancelled order.');
    }
    const amountInPaise = Math.round(Number(order.totalAmount) * 100);
    const razorpayOrder = await razorpay_1.default.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: { orderId: order.id, orderNumber: order.orderNumber },
    });
    const payment = await prisma_1.default.payment.upsert({
        where: { orderId: order.id },
        update: {
            razorpayOrderId: razorpayOrder.id,
            status: 'CREATED',
            amount: order.totalAmount,
            razorpayPaymentId: null,
            razorpaySignature: null,
            failureReason: null,
        },
        create: {
            orderId: order.id,
            userId: order.userId,
            razorpayOrderId: razorpayOrder.id,
            amount: order.totalAmount,
            status: 'CREATED',
        },
    });
    return {
        paymentId: payment.id,
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: env_1.env.razorpay.keyId,
        orderId: order.id,
        orderNumber: order.orderNumber,
    };
}
/** Shared by both the client-side verify endpoint and the server-side webhook. Idempotent. */
async function markPaymentPaid({ razorpayOrderId, razorpayPaymentId, razorpaySignature, method }) {
    const payment = await prisma_1.default.payment.findUnique({ where: { razorpayOrderId } });
    if (!payment) {
        logger_1.default.warn(`Payment webhook/verify for unknown razorpayOrderId=${razorpayOrderId}`);
        return null;
    }
    if (payment.status === 'PAID')
        return payment; // already processed — idempotent no-op
    const updatedOrder = await prisma_1.default.$transaction(async (tx) => {
        await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'PAID', razorpayPaymentId, razorpaySignature, method },
        });
        return tx.order.update({
            where: { id: payment.orderId },
            data: {
                // Keep the order as PENDING — the seller must manually confirm it.
                // We only record that payment was received in the status history.
                statusHistory: { create: { status: 'PENDING', note: 'Payment received.' } },
            },
            include: { items: true },
        });
    });
    (0, socket_1.emitOrderUpdate)(updatedOrder);
    return payment;
}
async function markPaymentFailed(razorpayOrderId, reason) {
    const payment = await prisma_1.default.payment.findUnique({ where: { razorpayOrderId } });
    if (!payment || payment.status === 'PAID')
        return; // never downgrade a successful payment
    await prisma_1.default.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: reason } });
}
/** Client calls this right after the Razorpay Checkout widget succeeds. */
async function verifyPayment({ razorpay_order_id: orderIdRp, razorpay_payment_id: paymentIdRp, razorpay_signature: signature }, user) {
    const payment = await prisma_1.default.payment.findUnique({ where: { razorpayOrderId: orderIdRp } });
    if (!payment)
        throw ApiError_1.default.notFound('Payment record not found.');
    if (payment.userId !== user.id && user.role !== 'ADMIN') {
        throw ApiError_1.default.forbidden('You do not have permission to verify this payment.');
    }
    const expected = crypto_1.default.createHmac('sha256', env_1.env.razorpay.keySecret).update(`${orderIdRp}|${paymentIdRp}`).digest('hex');
    if (!timingSafeEqualHex(expected, signature)) {
        await markPaymentFailed(orderIdRp, 'Signature verification failed.');
        throw ApiError_1.default.badRequest('Payment verification failed. If money was deducted, it will be refunded automatically.');
    }
    let method;
    try {
        const rpPayment = await razorpay_1.default.payments.fetch(paymentIdRp);
        method = rpPayment.method;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger_1.default.warn(`Could not fetch Razorpay payment method for ${paymentIdRp}: ${message}`);
    }
    await markPaymentPaid({ razorpayOrderId: orderIdRp, razorpayPaymentId: paymentIdRp, razorpaySignature: signature, method });
    const order = await prisma_1.default.order.findUnique({ where: { id: payment.orderId }, include: { payment: true, items: true } });
    return order;
}
/**
 * Handles Razorpay's server-to-server webhook — the source of truth for
 * payment state, independent of whether the client ever called /verify.
 * `rawBody` MUST be the raw request bytes (see app.ts's json verify hook),
 * not a re-serialized object, or the signature check will fail.
 */
async function handleWebhook(rawBody, signatureHeader) {
    if (!env_1.env.razorpay.webhookSecret) {
        throw ApiError_1.default.internal('Webhook secret is not configured on this server.');
    }
    if (!rawBody) {
        throw ApiError_1.default.badRequest('Missing request body.');
    }
    if (!signatureHeader || Array.isArray(signatureHeader)) {
        throw ApiError_1.default.unauthorized('Missing webhook signature.');
    }
    const expected = crypto_1.default.createHmac('sha256', env_1.env.razorpay.webhookSecret).update(rawBody).digest('hex');
    if (!timingSafeEqualHex(expected, signatureHeader)) {
        throw ApiError_1.default.unauthorized('Invalid webhook signature.');
    }
    const event = JSON.parse(rawBody.toString('utf8'));
    switch (event.event) {
        case 'payment.captured': {
            const entity = event.payload?.payment?.entity;
            if (entity) {
                await markPaymentPaid({
                    razorpayOrderId: entity.order_id,
                    razorpayPaymentId: entity.id,
                    razorpaySignature: null,
                    method: entity.method,
                });
            }
            break;
        }
        case 'payment.failed': {
            const entity = event.payload?.payment?.entity;
            if (entity) {
                await markPaymentFailed(entity.order_id, entity.error_description || 'Payment failed at gateway.');
            }
            break;
        }
        default:
            logger_1.default.debug(`Unhandled Razorpay webhook event: ${event.event}`);
    }
    return { received: true };
}
async function getPaymentForOrder(orderId, user) {
    const payment = await prisma_1.default.payment.findUnique({ where: { orderId } });
    if (!payment)
        throw ApiError_1.default.notFound('No payment found for this order.');
    if (payment.userId !== user.id && user.role !== 'ADMIN') {
        throw ApiError_1.default.forbidden('You do not have permission to view this payment.');
    }
    return payment;
}
//# sourceMappingURL=payment.service.js.map