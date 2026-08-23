import * as bookingService from './machineryBooking.service';
import * as paymentService from './machineryPayment.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

/**
 * One call for the frontend, matching the checkout pattern used elsewhere:
 * creates the booking (reserving the units for that date range) AND the
 * matching Razorpay order in one response.
 */
export const create = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const booking = await bookingService.createBooking(req.user.id, req.body);
  const payment = await paymentService.createMachineryPaymentForBooking(booking.id, req.user);
  ApiResponse.created(res, { booking, payment }, 'Booking created. Proceed to payment.');
});

export const list = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const { items, meta } = await bookingService.listBookings(req.user, req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const getOne = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const booking = await bookingService.getBookingById(req.params.id, req.user);
  ApiResponse.ok(res, booking);
});

export const updateStatus = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const booking = await bookingService.updateBookingStatus(req.params.id, req.user, req.body);
  ApiResponse.ok(res, booking, 'Booking status updated.');
});

export const cancel = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const booking = await bookingService.cancelBooking(req.params.id, req.user, req.body);
  ApiResponse.ok(res, booking, 'Booking cancelled.');
});
