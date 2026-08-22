import * as seedOrderService from './seedOrder.service';
import * as seedPaymentService from './seedPayment.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

/**
 * One call for the frontend, matching the main store's checkout: places the
 * seed order, decrements stock, clears the seed cart, AND creates the
 * matching Razorpay order in one response.
 */
export const checkout = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await seedOrderService.checkoutSeeds(req.user.id, req.body);
  const payment = await seedPaymentService.createSeedPaymentForOrder(order.id, req.user);
  ApiResponse.created(res, { order, payment }, 'Order placed. Proceed to payment.');
});

export const list = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const { items, meta } = await seedOrderService.listSeedOrders(req.user, req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const getOne = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await seedOrderService.getSeedOrderById(req.params.id, req.user);
  ApiResponse.ok(res, order);
});

export const updateStatus = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await seedOrderService.updateSeedOrderStatus(req.params.id, req.user, req.body);
  ApiResponse.ok(res, order, 'Order status updated.');
});

export const cancel = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await seedOrderService.cancelSeedOrder(req.params.id, req.user, req.body);
  ApiResponse.ok(res, order, 'Order cancelled.');
});
