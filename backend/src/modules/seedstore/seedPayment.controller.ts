import * as seedPaymentService from './seedPayment.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const create = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const result = await seedPaymentService.createSeedPaymentForOrder(req.body.orderId, req.user);
  ApiResponse.created(res, result, 'Razorpay order created.');
});

export const verify = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const order = await seedPaymentService.verifySeedPayment(req.body, req.user);
  ApiResponse.ok(res, order, 'Payment verified.');
});

export const webhook = asyncHandler(async (req, res) => {
  const result = await seedPaymentService.handleSeedWebhook(req.rawBody, req.headers['x-razorpay-signature']);
  res.status(200).json(result);
});

export const getForOrder = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const payment = await seedPaymentService.getSeedPaymentForOrder(req.params.orderId, req.user);
  ApiResponse.ok(res, payment);
});
