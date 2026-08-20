import { Router } from 'express';
import * as controller from './auth.controller';
import validate from '../../common/middlewares/validate';
import { authenticate } from '../../common/middlewares/authenticate';
import { authLimiter } from '../../common/middlewares/rateLimiters';
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  googleAuthSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account and send an email OTP for verification
 *     description: Creates a new user with `BUYER` role and sends a 6-digit OTP to the provided email. The account stays unverified until `/auth/verify-otp` is called.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Ravi Kumar
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ravi@example.com
 *               phone:
 *                 type: string
 *                 pattern: '^\+?[0-9]{10,15}$'
 *                 example: '+919876543210'
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 description: Must contain at least one uppercase letter, one lowercase letter, and one number.
 *                 example: SecurePass1
 *     responses:
 *       201:
 *         description: Verification code sent to the provided email.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error (invalid email, weak password, etc.)
 *       409:
 *         description: A user with this email already exists.
 *       429:
 *         description: Too many requests — rate limited.
 */
router.post('/register', authLimiter, validate({ body: registerSchema }), controller.register);

/**
 * @openapi
 * /auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify the email OTP sent at registration and receive tokens
 *     description: Validates the 6-digit OTP for the given email. On success the account is marked verified and access + refresh tokens are returned.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ravi@example.com
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: '482913'
 *               purpose:
 *                 type: string
 *                 enum: [REGISTER, RESET_PASSWORD]
 *                 default: REGISTER
 *     responses:
 *       200:
 *         description: Email verified. Returns access and refresh tokens along with the user object.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthTokens'
 *       400:
 *         description: Invalid or expired OTP, or too many attempts.
 *       404:
 *         description: No pending verification found for this email.
 *       429:
 *         description: Too many requests — rate limited.
 */
router.post('/verify-otp', authLimiter, validate({ body: verifyOtpSchema }), controller.verifyOtp);

/**
 * @openapi
 * /auth/resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend a registration or password-reset OTP
 *     description: Generates a new OTP and sends it to the user's email. Any previously issued OTP for the same purpose is invalidated.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ravi@example.com
 *               purpose:
 *                 type: string
 *                 enum: [REGISTER, RESET_PASSWORD]
 *                 default: REGISTER
 *     responses:
 *       200:
 *         description: OTP resent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: No user found for this email.
 *       429:
 *         description: Too many requests — rate limited.
 */
router.post('/resend-otp', authLimiter, validate({ body: resendOtpSchema }), controller.resendOtp);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email + password
 *     description: Authenticates with email and password credentials. Returns access + refresh tokens on success. A login-history entry is created.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ravi@example.com
 *               password:
 *                 type: string
 *                 minLength: 1
 *                 example: SecurePass1
 *     responses:
 *       200:
 *         description: Logged in successfully. Returns tokens and user profile.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Invalid credentials or account not verified.
 *       429:
 *         description: Too many requests — rate limited.
 */
router.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);

/**
 * @openapi
 * /auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Log in or sign up using a Google Sign-In idToken
 *     description: Verifies the Google `idToken` with the Google Auth Library. Creates a new user if the email doesn't exist, or logs in the existing user. Returns access + refresh tokens.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 minLength: 10
 *                 description: The `idToken` obtained from Google Sign-In on the client.
 *                 example: eyJhbGciOiJSUzI1NiIs...
 *     responses:
 *       200:
 *         description: Logged in with Google. Returns tokens and user profile.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthTokens'
 *       400:
 *         description: Invalid or expired Google idToken.
 *       429:
 *         description: Too many requests — rate limited.
 */
router.post('/google', authLimiter, validate({ body: googleAuthSchema }), controller.googleAuth);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token for a new access + refresh token pair
 *     description: Rotates the refresh token — the old token is revoked and a new pair is issued. Use this to silently extend sessions on the client.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 minLength: 10
 *                 example: dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...
 *     responses:
 *       200:
 *         description: Token refreshed successfully. Returns new access + refresh tokens.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Refresh token is invalid, expired, or already revoked.
 */
router.post('/refresh', validate({ body: refreshTokenSchema }), controller.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke a refresh token
 *     description: Marks the supplied refresh token as revoked so it can no longer be used.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...
 *     responses:
 *       200:
 *         description: Logged out — refresh token revoked.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/logout', controller.logout);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password-reset OTP by email
 *     description: Sends a 6-digit OTP to the given email for the `RESET_PASSWORD` purpose. The token is valid for a limited time.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ravi@example.com
 *     responses:
 *       200:
 *         description: Password-reset OTP sent (returns success even if the email doesn't exist, to avoid email enumeration).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       429:
 *         description: Too many requests — rate limited.
 */
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), controller.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using the OTP from forgot-password
 *     description: Verifies the password-reset OTP and sets the new password. All existing refresh tokens for this user are revoked.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ravi@example.com
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: '592710'
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 description: Must contain at least one uppercase letter, one lowercase letter, and one number.
 *                 example: NewSecure1
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid or expired OTP, or weak password.
 *       429:
 *         description: Too many requests — rate limited.
 */
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), controller.resetPassword);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     description: Returns the sanitized profile of the authenticated user. Requires a valid access token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Missing or invalid access token.
 */
router.get('/me', authenticate, controller.me);

export default router;
