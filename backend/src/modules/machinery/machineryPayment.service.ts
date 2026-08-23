import crypto from 'crypto';
import type { User } from '@prisma/client';
import prisma from '../../config/prisma';
import razorpay from '../../config/razorpay';
import ApiError from '../../common/utils/ApiError';
import { env } from '../../config/env';
import { emitOrderUpdate } from '../../config/socket';
import logger from '../../common/utils/logger';

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function createMachineryPaymentForBooking(bookingId: string, user: User) {
  const booking = await prisma.machineryBooking.findUnique({ where: { id: bookingId }, include: { payment: true } });
  if (!booking) throw ApiError.notFound('Booking not found.');
  if (booking.userId !== user.id && user.role !== 'ADMIN') {
    throw ApiError.forbidden('You do not have permission to pay for this booking.');
  }
  if (booking.payment?.status === 'PAID') {
    throw ApiError.conflict('This booking has already been paid for.');
  }
  if (booking.status === 'CANCELLED') {
    throw ApiError.badRequest('Cannot create a payment for a cancelled booking.');
  }

  const amountInPaise = Math.round(Number(booking.totalAmount) * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: booking.bookingNumber,
    notes: { machineryBookingId: booking.id, bookingNumber: booking.bookingNumber },
  });

  const payment = await prisma.machineryPayment.upsert({
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
    keyId: env.razorpay.keyId,
    bookingId: booking.id,
    bookingNumber: booking.bookingNumber,
  };
}

interface MarkPaidInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string | null;
  method?: string;
}

async function markMachineryPaymentPaid({ razorpayOrderId, razorpayPaymentId, razorpaySignature, method }: MarkPaidInput) {
  const payment = await prisma.machineryPayment.findUnique({ where: { razorpayOrderId } });
  if (!payment) {
    logger.warn(`Machinery payment webhook/verify for unknown razorpayOrderId=${razorpayOrderId}`);
    return null;
  }
  if (payment.status === 'PAID') return payment; // idempotent no-op

  const updatedBooking = await prisma.$transaction(async (tx) => {
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

  emitOrderUpdate({
    id: updatedBooking.id,
    orderNumber: updatedBooking.bookingNumber,
    status: updatedBooking.status,
    updatedAt: updatedBooking.updatedAt,
    userId: updatedBooking.userId,
  });
  return payment;
}

async function markMachineryPaymentFailed(razorpayOrderId: string, reason: string) {
  const payment = await prisma.machineryPayment.findUnique({ where: { razorpayOrderId } });
  if (!payment || payment.status === 'PAID') return;
  await prisma.machineryPayment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: reason } });
}

interface VerifyMachineryPaymentBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function verifyMachineryPayment(
  { razorpay_order_id: orderIdRp, razorpay_payment_id: paymentIdRp, razorpay_signature: signature }: VerifyMachineryPaymentBody,
  user: User
) {
  const payment = await prisma.machineryPayment.findUnique({ where: { razorpayOrderId: orderIdRp } });
  if (!payment) throw ApiError.notFound('Payment record not found.');
  if (payment.userId !== user.id && user.role !== 'ADMIN') {
    throw ApiError.forbidden('You do not have permission to verify this payment.');
  }

  const expected = crypto.createHmac('sha256', env.razorpay.keySecret).update(`${orderIdRp}|${paymentIdRp}`).digest('hex');

  if (!timingSafeEqualHex(expected, signature)) {
    await markMachineryPaymentFailed(orderIdRp, 'Signature verification failed.');
    throw ApiError.badRequest('Payment verification failed. If money was deducted, it will be refunded automatically.');
  }

  let method: string | undefined;
  try {
    const rpPayment = await razorpay.payments.fetch(paymentIdRp);
    method = rpPayment.method;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Could not fetch Razorpay payment method for ${paymentIdRp}: ${message}`);
  }

  await markMachineryPaymentPaid({ razorpayOrderId: orderIdRp, razorpayPaymentId: paymentIdRp, razorpaySignature: signature, method });

  const booking = await prisma.machineryBooking.findUnique({ where: { id: payment.bookingId }, include: { payment: true } });
  return booking;
}

interface RazorpayWebhookPaymentEntity {
  id: string;
  order_id: string;
  method: string;
  error_description?: string;
}

interface RazorpayWebhookEvent {
  event: string;
  payload?: {
    payment?: { entity: RazorpayWebhookPaymentEntity };
  };
}

export async function handleMachineryWebhook(rawBody: Buffer | undefined, signatureHeader: string | string[] | undefined) {
  if (!env.razorpay.webhookSecret) {
    throw ApiError.internal('Webhook secret is not configured on this server.');
  }
  if (!rawBody) {
    throw ApiError.badRequest('Missing request body.');
  }
  if (!signatureHeader || Array.isArray(signatureHeader)) {
    throw ApiError.unauthorized('Missing webhook signature.');
  }

  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
  if (!timingSafeEqualHex(expected, signatureHeader)) {
    throw ApiError.unauthorized('Invalid webhook signature.');
  }

  const event = JSON.parse(rawBody.toString('utf8')) as RazorpayWebhookEvent;

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
      logger.debug(`Unhandled Razorpay webhook event (machinery): ${event.event}`);
  }

  return { received: true };
}

export async function getMachineryPaymentForBooking(bookingId: string, user: User) {
  const payment = await prisma.machineryPayment.findUnique({ where: { bookingId } });
  if (!payment) throw ApiError.notFound('No payment found for this booking.');
  if (payment.userId !== user.id && user.role !== 'ADMIN') {
    throw ApiError.forbidden('You do not have permission to view this payment.');
  }
  return payment;
}
