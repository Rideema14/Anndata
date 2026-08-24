import * as machineryPaymentService from './machineryPayment.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const create = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const result = await machineryPaymentService.createMachineryPaymentForBooking(req.body.bookingId, req.user);
  ApiResponse.created(res, result, 'Razorpay order created.');
});

export const verify = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const booking = await machineryPaymentService.verifyMachineryPayment(req.body, req.user);
  ApiResponse.ok(res, booking, 'Payment verified.');
});

export const webhook = asyncHandler(async (req, res) => {
  const result = await machineryPaymentService.handleMachineryWebhook(req.rawBody, req.headers['x-razorpay-signature']);
  res.status(200).json(result);
});

export const getForBooking = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const payment = await machineryPaymentService.getMachineryPaymentForBooking(req.params.bookingId, req.user);
  ApiResponse.ok(res, payment);
});
