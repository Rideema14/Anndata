const orderService = require('./order.service');
const paymentService = require('../payment/payment.service');
const ApiResponse = require('../../common/utils/ApiResponse');
const asyncHandler = require('../../common/middlewares/asyncHandler');

/**
 * One call for the frontend: places the order, decrements stock, clears the
 * cart, AND creates the matching Razorpay order — everything needed to open
 * the Razorpay Checkout widget comes back in a single response.
 */
const checkout = asyncHandler(async (req, res) => {
  const order = await orderService.checkout(req.user.id, req.body);
  const payment = await paymentService.createPaymentForOrder(order.id, req.user);
  ApiResponse.created(res, { order, payment }, 'Order placed. Proceed to payment.');
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await orderService.listOrders(req.user, req.query);
  ApiResponse.paginated(res, items, meta);
});

const getOne = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user);
  ApiResponse.ok(res, order);
});

const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(req.params.id, req.user, req.body);
  ApiResponse.ok(res, order, 'Order status updated.');
});

const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user, req.body);
  ApiResponse.ok(res, order, 'Order cancelled.');
});

module.exports = { checkout, list, getOne, updateStatus, cancel };
