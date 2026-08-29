import * as orderService from './order.service';
import * as shipmentService from './shipment.service';
import * as disputeService from './dispute.service';
import * as paymentService from '../payment/payment.service';
import { getTrackingTimeline, SUPPORTED_CARRIERS, handleTrack17WebhookPayload, verifyTrack17WebhookToken } from './tracking.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';
import { env } from '../../config/env';
import logger from '../../common/utils/logger';

/**
 * One call for the frontend: places the order, decrements stock, clears the
 * cart, AND creates the matching Razorpay order — everything needed to open
 * the Razorpay Checkout widget comes back in a single response.
 */
export const checkout = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await orderService.checkout(req.user.id, req.body);
  const payment = await paymentService.createPaymentForOrder(order.id, req.user);
  ApiResponse.created(res, { order, payment }, 'Order placed. Proceed to payment.');
});

export const list = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const { items, meta } = await orderService.listOrders(req.user, req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const getOne = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await orderService.getOrderById(req.params.id, req.user);
  ApiResponse.ok(res, order);
});

<<<<<<< HEAD
/** Seller (or admin) fulfillment view — items filtered to just this seller's own products. */
export const getSellerOrderDetail = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await orderService.getSellerOrderDetail(req.params.id, req.user);
  ApiResponse.ok(res, order);
});

=======
/** Admin-only manual status override — see order.service.ts's updateStatus for the transition rules. */
>>>>>>> 441adbb369c21ed2d2f22dd3759d4188bd49908d
export const updateStatus = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await orderService.updateStatus(req.params.id, req.user, req.body);
  ApiResponse.ok(res, order, 'Order status updated.');
});

export const cancel = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await orderService.cancelOrder(req.params.id, req.user, req.body);
  ApiResponse.ok(res, order, 'Order cancelled.');
});

/** Returns the shipment tracking timeline for a given order. */
export const getTracking = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  // Resolve first (accepts either the internal id or the order number) so
  // we look up tracking events against the order's real internal id.
  const order = await orderService.getOrderById(req.params.id, req.user);
  const events = await getTrackingTimeline(order.id);
  ApiResponse.ok(res, events);
});

/** Returns the list of supported carriers for the frontend dropdown. */
export const getCarriers = asyncHandler(async (_req, res) => {
  const carriers = SUPPORTED_CARRIERS.map((c) => ({ code: c.code, name: c.name }));
  ApiResponse.ok(res, carriers);
});

/**
 * POST /orders/:id/shipment — the seller's entire shipment-management
 * surface (requirement #2/#3/#18): submit the AWB, get it verified against
 * the carrier. No status field, no way to touch courier-derived data.
 */
export const submitShipment = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await shipmentService.submitShipment(req.params.id, req.user, req.body);
  ApiResponse.ok(res, order, 'Shipment submitted.');
});

/** GET /orders/:id/shipment — full shipment detail (status, verification, events). */
export const getShipment = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const shipment = await shipmentService.getShipmentForOrder(req.params.id, req.user);
  ApiResponse.ok(res, shipment);
});

/** POST /orders/:id/dispute — buyer reports a delivery problem (requirement #9). */
export const createDispute = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const dispute = await disputeService.createDispute(req.params.id, req.user, req.body);
  ApiResponse.created(res, dispute, 'Dispute filed. Our team will review it shortly.');
});

/** GET /orders/disputes/mine — the current user's own disputes. */
export const listMyDisputes = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const disputes = await disputeService.listMyDisputes(req.user);
  ApiResponse.ok(res, disputes);
});

/**
 * POST /orders/webhooks/track17 — 17TRACK push-webhook receiver. Not
 * user-authenticated. 17TRACK doesn't sign its webhook payloads at all, so
 * we authenticate the call ourselves via a shared-secret token in the query
 * string (the same one baked into the single webhook URL registered once in
 * the 17TRACK dashboard — see tracking.service.ts / .env.example). Always
 * answers 200 once the token checks out (even if we couldn't match a
 * shipment/nothing changed) — dropping an event because we couldn't act on
 * it yet isn't something a retry loop fixes.
 */
export const track17Webhook = asyncHandler(async (req, res) => {
  if (!env.tracking.webhookToken) {
    // Webhook not configured — the cron remains the only sync path. Return
    // 200 rather than 404/500 so a stray call from a provider that *is*
    // configured on their end but not ours doesn't retry forever.
    return res.status(200).json({ success: false, message: 'Webhook not configured on this server.' });
  }
  const valid = verifyTrack17WebhookToken(req.query.token as string | undefined);
  if (!valid) {
    logger.warn('17TRACK webhook: invalid or missing token, rejecting.');
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
  const result = await handleTrack17WebhookPayload(req.body);
  return res.status(200).json({ success: true, ...result });
});
