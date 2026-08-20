import * as paymentService from './payment.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const create = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const result = await paymentService.createPaymentForOrder(req.body.orderId, req.user);
  ApiResponse.created(res, result, 'Razorpay order created.');
});

export const verify = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await paymentService.verifyPayment(req.body, req.user);
  ApiResponse.ok(res, order, 'Payment verified.');
});

export const webhook = asyncHandler(async (req, res) => {
  // req.rawBody is populated by the express.json({ verify }) hook in app.ts —
  // required for signature verification against the exact bytes Razorpay signed.
  const result = await paymentService.handleWebhook(req.rawBody, req.headers['x-razorpay-signature']);
  res.status(200).json(result);
});

export const getForOrder = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const payment = await paymentService.getPaymentForOrder(req.params.orderId, req.user);
  ApiResponse.ok(res, payment);
});
