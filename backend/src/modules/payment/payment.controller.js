const paymentService = require('./payment.service');
const ApiResponse = require('../../common/utils/ApiResponse');
const asyncHandler = require('../../common/middlewares/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const result = await paymentService.createPaymentForOrder(req.body.orderId, req.user);
  ApiResponse.created(res, result, 'Razorpay order created.');
});

const verify = asyncHandler(async (req, res) => {
  const order = await paymentService.verifyPayment(req.body, req.user);
  ApiResponse.ok(res, order, 'Payment verified.');
});

const webhook = asyncHandler(async (req, res) => {
  // req.rawBody is populated by the express.json({ verify }) hook in app.js —
  // required for signature verification against the exact bytes Razorpay signed.
  const result = await paymentService.handleWebhook(req.rawBody, req.headers['x-razorpay-signature']);
  res.status(200).json(result);
});

const getForOrder = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentForOrder(req.params.orderId, req.user);
  ApiResponse.ok(res, payment);
});

module.exports = { create, verify, webhook, getForOrder };
