import * as orderService from './order.service';
import * as paymentService from '../payment/payment.service';
import { getTrackingTimeline, SUPPORTED_CARRIERS } from './tracking.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

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

/** Seller (or admin) fulfillment view — items filtered to just this seller's own products. */
export const getSellerOrderDetail = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await orderService.getSellerOrderDetail(req.params.id, req.user);
  ApiResponse.ok(res, order);
});

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