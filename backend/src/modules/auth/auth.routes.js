const router = require('express').Router();
const controller = require('./auth.controller');
const validate = require('../../common/middlewares/validate');
const { authenticate } = require('../../common/middlewares/authenticate');
const { authLimiter } = require('../../common/middlewares/rateLimiters');
const {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  googleAuthSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('./auth.validation');

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account and send an email OTP for verification
 */
router.post('/register', authLimiter, validate({ body: registerSchema }), controller.register);

/**
 * @openapi
 * /auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify the email OTP sent at registration and receive tokens
 */
router.post('/verify-otp', authLimiter, validate({ body: verifyOtpSchema }), controller.verifyOtp);

/**
 * @openapi
 * /auth/resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend a registration or password-reset OTP
 */
router.post('/resend-otp', authLimiter, validate({ body: resendOtpSchema }), controller.resendOtp);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email + password
 */
router.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);

/**
 * @openapi
 * /auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Log in or sign up using a Google Sign-In idToken
 */
router.post('/google', authLimiter, validate({ body: googleAuthSchema }), controller.googleAuth);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token for a new access + refresh token pair
 */
router.post('/refresh', validate({ body: refreshTokenSchema }), controller.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke a refresh token
 */
router.post('/logout', controller.logout);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password-reset OTP by email
 */
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), controller.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using the OTP from forgot-password
 */
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), controller.resetPassword);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', authenticate, controller.me);

module.exports = router;
