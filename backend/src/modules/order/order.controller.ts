import * as orderService from './order.service';
import * as paymentService from '../payment/payment.service';
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
