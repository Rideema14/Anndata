"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMachineryPaymentForBooking = createMachineryPaymentForBooking;
exports.verifyMachineryPayment = verifyMachineryPayment;
exports.handleMachineryWebhook = handleMachineryWebhook;
exports.getMachineryPaymentForBooking = getMachineryPaymentForBooking;
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
async function createMachineryPaymentForBooking(bookingId, user) {
    const booking = await prisma_1.default.machineryBooking.findUnique({ where: { id: bookingId }, include: { payment: true } });
    if (!booking)
        throw ApiError_1.default.notFound('Booking not found.');
    if (booking.userId !== user.id && user.role !== 'ADMIN') {
        throw ApiError_1.default.forbidden('You do not have permission to pay for this booking.');
    }
    if (booking.payment?.status === 'PAID') {
        throw ApiError_1.default.conflict('This booking has already been paid for.');
    }
    if (booking.status === 'CANCELLED') {
        throw ApiError_1.default.badRequest('Cannot create a payment for a cancelled booking.');
    }
    const amountInPaise = Math.round(Number(booking.totalAmount) * 100);
    const razorpayOrder = await razorpay_1.default.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: booking.bookingNumber,
        notes: { machineryBookingId: booking.id, bookingNumber: booking.bookingNumber },
    });
    const payment = await prisma_1.default.machineryPayment.upsert({
        where: { bookingId: booking.id },
        update: {
            razorpayOrderId: razorpayOrder.id,
            status: 'CREATED',
            amount: booking.totalAmount,
            razorpayPaymentId: null,
            razorpaySignature: null,
            failureReason: null,
        },
        create: {
            bookingId: booking.id,
            userId: booking.userId,
            razorpayOrderId: razorpayOrder.id,
            amount: booking.totalAmount,
            status: 'CREATED',
        },
    });
    return {
        paymentId: payment.id,
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: env_1.env.razorpay.keyId,
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
    };
}
async function markMachineryPaymentPaid({ razorpayOrderId, razorpayPaymentId, razorpaySignature, method }) {
    const payment = await prisma_1.default.machineryPayment.findUnique({ where: { razorpayOrderId } });
    if (!payment) {
        logger_1.default.warn(`Machinery payment webhook/verify for unknown razorpayOrderId=${razorpayOrderId}`);
        return null;
    }
    if (payment.status === 'PAID')
        return payment; // idempotent no-op
    const updatedBooking = await prisma_1.default.$transaction(async (tx) => {
        await tx.machineryPayment.update({
            where: { id: payment.id },
            data: { status: 'PAID', razorpayPaymentId, razorpaySignature, method },
        });
        return tx.machineryBooking.update({
            where: { id: payment.bookingId },
            data: {
                status: 'CONFIRMED',
                statusHistory: { create: { status: 'CONFIRMED', note: 'Payment received.' } },
            },
        });
    });
    (0, socket_1.emitOrderUpdate)({
        id: updatedBooking.id,
        orderNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        updatedAt: updatedBooking.updatedAt,
        userId: updatedBooking.userId,
    });
    return payment;
}
async function markMachineryPaymentFailed(razorpayOrderId, reason) {
    const payment = await prisma_1.default.machineryPayment.findUnique({ where: { razorpayOrderId } });
    if (!payment || payment.status === 'PAID')
        return;
    await prisma_1.default.machineryPayment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: reason } });
}
async function verifyMachineryPayment({ razorpay_order_id: orderIdRp, razorpay_payment_id: paymentIdRp, razorpay_signature: signature }, user) {
    const payment = await prisma_1.default.machineryPayment.findUnique({ where: { razorpayOrderId: orderIdRp } });
    if (!payment)
        throw ApiError_1.default.notFound('Payment record not found.');
    if (payment.userId !== user.id && user.role !== 'ADMIN') {
        throw ApiError_1.default.forbidden('You do not have permission to verify this payment.');
    }
    const expected = crypto_1.default.createHmac('sha256', env_1.env.razorpay.keySecret).update(`${orderIdRp}|${paymentIdRp}`).digest('hex');
    if (!timingSafeEqualHex(expected, signature)) {
        await markMachineryPaymentFailed(orderIdRp, 'Signature verification failed.');
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
    await markMachineryPaymentPaid({ razorpayOrderId: orderIdRp, razorpayPaymentId: paymentIdRp, razorpaySignature: signature, method });
    const booking = await prisma_1.default.machineryBooking.findUnique({ where: { id: payment.bookingId }, include: { payment: true } });
    return booking;
}
async function handleMachineryWebhook(rawBody, signatureHeader) {
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
                await markMachineryPaymentPaid({
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
                await markMachineryPaymentFailed(entity.order_id, entity.error_description || 'Payment failed at gateway.');
            }
            break;
        }
        default:
            logger_1.default.debug(`Unhandled Razorpay webhook event (machinery): ${event.event}`);
    }
    return { received: true };
}
async function getMachineryPaymentForBooking(bookingId, user) {
    const payment = await prisma_1.default.machineryPayment.findUnique({ where: { bookingId } });
    if (!payment)
        throw ApiError_1.default.notFound('No payment found for this booking.');
    if (payment.userId !== user.id && user.role !== 'ADMIN') {
        throw ApiError_1.default.forbidden('You do not have permission to view this payment.');
    }
    return payment;
}
//# sourceMappingURL=machineryPayment.service.js.map