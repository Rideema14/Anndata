import * as adminService from './admin.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listUsers(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const user = await adminService.updateUserStatus(req.user.id, req.params.id, req.body.isActive);
  ApiResponse.ok(res, user, 'User status updated.');
});

export const updateUserRole = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const user = await adminService.updateUserRole(req.user.id, req.params.id, req.body.role);
  ApiResponse.ok(res, user, 'User role updated.');
});

export const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const analytics = await adminService.getPlatformAnalytics(req.query as any);
  ApiResponse.ok(res, analytics);
});

export const listAllReviews = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listAllReviews(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const listAllProducts = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listAllProducts(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const getSellerBalances = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.getSellerBalances(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const getSellerBalance = asyncHandler(async (req, res) => {
  const balance = await adminService.getSellerBalance(req.params.id);
  ApiResponse.ok(res, balance);
});

export const createPayout = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const payout = await adminService.createPayout(req.user.id, req.params.id, req.body);
  ApiResponse.created(res, payout, 'Payout recorded.');
});

export const listPayouts = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listPayouts(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const reversePayout = asyncHandler(async (req, res) => {
  const payout = await adminService.reversePayout(req.params.id);
  ApiResponse.ok(res, payout, 'Payout reversed.');
});

// --- Shipment management (requirement #10) ------------------------------

export const listShipments = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listShipments(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const getShipmentDetail = asyncHandler(async (req, res) => {
  const detail = await adminService.getShipmentDetail(req.params.id);
  ApiResponse.ok(res, detail);
});

export const flagShipment = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const shipment = await adminService.flagShipmentForReview(req.params.id, req.user, req.body);
  ApiResponse.ok(res, shipment, 'Shipment flagged for review.');
});

export const listRiskSignals = asyncHandler(async (_req, res) => {
  const signals = await adminService.listRiskSignals();
  ApiResponse.ok(res, signals);
});

// --- Dispute review (requirement #9) --------------------------------------

export const listDisputes = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listDisputes(req.query as any);
  ApiResponse.paginated(res, items, meta);
});

export const reviewDispute = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const dispute = await adminService.reviewDispute(req.params.id, req.user, req.body);
  ApiResponse.ok(res, dispute, 'Dispute updated.');
});
