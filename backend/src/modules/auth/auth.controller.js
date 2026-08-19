const authService = require('./auth.service');
const ApiResponse = require('../../common/utils/ApiResponse');
const asyncHandler = require('../../common/middlewares/asyncHandler');
const { getRequestMeta } = require('../../common/utils/requestMeta');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  ApiResponse.created(res, result, 'Verification code sent.');
});

const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyRegistrationOtp(req.body, getRequestMeta(req));
  ApiResponse.ok(res, result, 'Email verified. You are now logged in.');
});

const resendOtp = asyncHandler(async (req, res) => {
  const result = await authService.resendOtp(req.body);
  ApiResponse.ok(res, result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, getRequestMeta(req));
  ApiResponse.ok(res, result, 'Logged in successfully.');
});

const googleAuth = asyncHandler(async (req, res) => {
  const result = await authService.googleAuth(req.body, getRequestMeta(req));
  ApiResponse.ok(res, result, 'Logged in with Google.');
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refreshTokens(req.body, getRequestMeta(req));
  ApiResponse.ok(res, result, 'Token refreshed.');
});

const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.body);
  ApiResponse.ok(res, result);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  ApiResponse.ok(res, result);
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  ApiResponse.ok(res, result);
});

const me = asyncHandler(async (req, res) => {
  ApiResponse.ok(res, authService.sanitizeUser(req.user));
});

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  googleAuth,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  me,
};
