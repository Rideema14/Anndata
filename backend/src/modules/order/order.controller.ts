import * as orderService from './order.service';
import * as shipmentService from './shipment.service';
import * as disputeService from './dispute.service';
import * as paymentService from '../payment/payment.service';
import { PUBLIC_COURIER_LIST } from './courier.config';
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

/** Admin-only manual status override — see order.service.ts's updateStatus for the transition rules. */
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

/** Returns the list of supported delivery platforms for the seller shipment-form dropdown (requirement #4). */
export const getCarriers = asyncHandler(async (_req, res) => {
  ApiResponse.ok(res, PUBLIC_COURIER_LIST);
});

/**
 * POST /orders/:id/shipment — the seller's entire shipment-management
 * surface (requirement #2/#3): submit courier + AWB. No status field, no
 * way to touch delivery confirmation or settlement.
 */
export const submitShipment = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await shipmentService.submitShipment(req.params.id, req.user, req.body);
  ApiResponse.ok(res, order, 'Shipment submitted.');
});

/** GET /orders/:id/shipment — shipment detail plus the official courier tracking link. */
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
