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

/**
 * Creates (or re-creates, after a prior failure) a Razorpay order for an
 * existing platform Order, and upserts the local Payment record that tracks it.
 */
export async function createPaymentForOrder(orderId: string, user: User) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order) throw ApiError.notFound('Order not found.');
  if (order.userId !== user.id && user.role !== 'ADMIN') {
    throw ApiError.forbidden('You do not have permission to pay for this order.');
  }
  if (order.payment?.status === 'PAID') {
    throw ApiError.conflict('This order has already been paid for.');
  }
  if (order.status === 'CANCELLED') {
    throw ApiError.badRequest('Cannot create a payment for a cancelled order.');
  }

  const amountInPaise = Math.round(Number(order.totalAmount) * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: order.id, orderNumber: order.orderNumber },
  });

  const payment = await prisma.payment.upsert({
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
    keyId: env.razorpay.keyId,
    orderId: order.id,
    orderNumber: order.orderNumber,
  };
}

interface MarkPaidInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string | null;
  method?: string;
}

/** Shared by both the client-side verify endpoint and the server-side webhook. Idempotent. */
async function markPaymentPaid({ razorpayOrderId, razorpayPaymentId, razorpaySignature, method }: MarkPaidInput) {
  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
  if (!payment) {
    logger.warn(`Payment webhook/verify for unknown razorpayOrderId=${razorpayOrderId}`);
    return null;
  }
  if (payment.status === 'PAID') return payment; // already processed — idempotent no-op

  const updatedOrder = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID', razorpayPaymentId, razorpaySignature, method },
    });
    return tx.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'CONFIRMED',
        statusHistory: { create: { status: 'CONFIRMED', note: 'Payment received.' } },
      },
      include: { items: true },
    });
  });

  emitOrderUpdate(updatedOrder);
  return payment;
}

async function markPaymentFailed(razorpayOrderId: string, reason: string) {
  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
  if (!payment || payment.status === 'PAID') return; // never downgrade a successful payment
  await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: reason } });
}

interface VerifyPaymentBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Client calls this right after the Razorpay Checkout widget succeeds. */
export async function verifyPayment(
  { razorpay_order_id: orderIdRp, razorpay_payment_id: paymentIdRp, razorpay_signature: signature }: VerifyPaymentBody,
  user: User
) {
  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: orderIdRp } });
  if (!payment) throw ApiError.notFound('Payment record not found.');
  if (payment.userId !== user.id && user.role !== 'ADMIN') {
    throw ApiError.forbidden('You do not have permission to verify this payment.');
  }

  const expected = crypto.createHmac('sha256', env.razorpay.keySecret).update(`${orderIdRp}|${paymentIdRp}`).digest('hex');

  if (!timingSafeEqualHex(expected, signature)) {
    await markPaymentFailed(orderIdRp, 'Signature verification failed.');
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

  await markPaymentPaid({ razorpayOrderId: orderIdRp, razorpayPaymentId: paymentIdRp, razorpaySignature: signature, method });

  const order = await prisma.order.findUnique({ where: { id: payment.orderId }, include: { payment: true, items: true } });
  return order;
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

/**
 * Handles Razorpay's server-to-server webhook — the source of truth for
 * payment state, independent of whether the client ever called /verify.
 * `rawBody` MUST be the raw request bytes (see app.ts's json verify hook),
 * not a re-serialized object, or the signature check will fail.
 */
export async function handleWebhook(rawBody: Buffer | undefined, signatureHeader: string | string[] | undefined) {
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
      logger.debug(`Unhandled Razorpay webhook event: ${event.event}`);
  }

  return { received: true };
}

export async function getPaymentForOrder(orderId: string, user: User) {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw ApiError.notFound('No payment found for this order.');
  if (payment.userId !== user.id && user.role !== 'ADMIN') {
    throw ApiError.forbidden('You do not have permission to view this payment.');
  }
  return payment;
}
