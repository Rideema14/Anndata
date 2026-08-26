import * as authService from './auth.service';
import ApiResponse from '../../common/utils/ApiResponse';
import asyncHandler from '../../common/middlewares/asyncHandler';
import { getRequestMeta } from '../../common/utils/requestMeta';
import ApiError from '../../common/utils/ApiError';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  ApiResponse.created(res, result, result.message);
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyRegistrationOtp(req.body, getRequestMeta(req));
  ApiResponse.ok(res, result, 'Email verified. You are now logged in.');
});

export const resendOtp = asyncHandler(async (req, res) => {
  const result = await authService.resendOtp(req.body);
  ApiResponse.ok(res, result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, getRequestMeta(req));
  ApiResponse.ok(res, result, 'Logged in successfully.');
});

export const googleAuth = asyncHandler(async (req, res) => {
  const result = await authService.googleAuth(req.body, getRequestMeta(req));
  ApiResponse.ok(res, result, 'Logged in with Google.');
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refreshTokens(req.body, getRequestMeta(req));
  ApiResponse.ok(res, result, 'Token refreshed.');
});

export const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.body);
  ApiResponse.ok(res, result);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  ApiResponse.ok(res, result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  ApiResponse.ok(res, result);
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  ApiResponse.ok(res, authService.sanitizeUser(req.user));
});
