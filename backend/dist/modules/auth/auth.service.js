"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUser = sanitizeUser;
exports.register = register;
exports.verifyRegistrationOtp = verifyRegistrationOtp;
exports.resendOtp = resendOtp;
exports.login = login;
exports.googleAuth = googleAuth;
exports.refreshTokens = refreshTokens;
exports.logout = logout;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const google_auth_library_1 = require("google-auth-library");
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const mailer_1 = require("../../config/mailer");
const otpEmail_template_1 = require("./otpEmail.template");
const jwt_1 = require("../../common/utils/jwt");
const otp_1 = require("../../common/utils/otp");
const env_1 = require("../../config/env");
const logger_1 = __importDefault(require("../../common/utils/logger"));
const SALT_ROUNDS = 10;
const MAX_OTP_ATTEMPTS = 5;
const googleClient = new google_auth_library_1.OAuth2Client(env_1.env.google.clientId);
function sanitizeUser(user) {
    const { passwordHash, otpCodeHash, otpExpiresAt, otpPurpose, otpAttempts, ...safe } = user;
    return safe;
}
async function issueTokenPair(user, meta = {}) {
    const accessToken = (0, jwt_1.signAccessToken)(user);
    const refreshToken = (0, jwt_1.generateRefreshToken)();
    await prisma_1.default.refreshToken.create({
        data: {
            userId: user.id,
            tokenHash: (0, jwt_1.hashToken)(refreshToken),
            expiresAt: (0, jwt_1.expiryDateFromNow)(env_1.env.jwt.refreshExpiresIn),
            userAgent: meta.userAgent,
            ipAddress: meta.ipAddress,
        },
    });
    return { accessToken, refreshToken };
}
async function recordLogin(userId, meta, success, reason) {
    await prisma_1.default.loginHistory.create({
        data: { userId, ipAddress: meta.ipAddress, userAgent: meta.userAgent, success, reason },
    });
}
/**
 * Generates and stores a fresh OTP, then attempts to email it. The DB write
 * happens first and always sticks — if the SMTP send afterwards fails
 * (bad credentials, provider outage, network blip), we log it and return
 * `false` instead of throwing. Otherwise a purely transient mail problem
 * would blow up `register`/`resendOtp`/`forgotPassword` *after* the account
 * (and OTP hash) were already committed, which is exactly what produced the
 * confusing "created in the database but the frontend shows an error" bug:
 * the user really was registered, but the request still rejected.
 */
async function sendOtpEmail(user, purpose) {
    const otp = (0, otp_1.generateOtp)();
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: {
            otpCodeHash: (0, otp_1.hashOtp)(otp),
            otpExpiresAt: (0, otp_1.otpExpiryDate)(),
            otpPurpose: purpose,
            otpAttempts: 0,
        },
    });
    try {
        await (0, mailer_1.sendMail)({
            to: user.email,
            subject: purpose === 'RESET_PASSWORD' ? 'Your password reset code' : 'Verify your email',
            html: (0, otpEmail_template_1.otpEmailHtml)({ name: user.name, otp, purpose }),
        });
        return true;
    }
    catch (err) {
        logger_1.default.error(`Failed to send ${purpose} OTP email to ${user.email}`, err);
        return false;
    }
}
async function register({ name, email, phone, password }) {
    const existing = await prisma_1.default.user.findUnique({ where: { email } });
    if (existing && existing.isEmailVerified) {
        throw ApiError_1.default.conflict('An account with this email already exists. Try logging in.');
    }
    const passwordHash = await bcryptjs_1.default.hash(password, SALT_ROUNDS);
    const user = existing
        ? await prisma_1.default.user.update({
            where: { id: existing.id },
            data: { name, phone, passwordHash },
        })
        : await prisma_1.default.user.create({
            data: { name, email, phone, passwordHash },
        });
    // The account is now safely in the database no matter what happens next —
    // an email hiccup below must never turn into a "registration failed"
    // error for something that already succeeded.
    const emailSent = await sendOtpEmail(user, 'REGISTER');
    return {
        message: emailSent
            ? 'Registration started. Check your email for a verification code.'
            : "Account created, but we couldn't send the verification email right now. Use Resend Code on the next screen.",
        email: user.email,
        emailSent,
    };
}
function checkOtp(user, purpose, otp) {
    if (!user.otpCodeHash || user.otpPurpose !== purpose) {
        return 'No pending verification code for this request. Please request a new one.';
    }
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        return 'Too many incorrect attempts. Please request a new code.';
    }
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
        return 'This code has expired. Please request a new one.';
    }
    if ((0, otp_1.hashOtp)(otp) !== user.otpCodeHash) {
        return 'Incorrect code.';
    }
    return null;
}
async function verifyRegistrationOtp({ email, otp }, meta = {}) {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user) {
        throw ApiError_1.default.badRequest('No pending verification code for this request. Please request a new one.');
    }
    const otpError = checkOtp(user, 'REGISTER', otp);
    if (otpError) {
        await prisma_1.default.user.update({ where: { id: user.id }, data: { otpAttempts: { increment: 1 } } });
        throw ApiError_1.default.badRequest(otpError);
    }
    const verifiedUser = await prisma_1.default.user.update({
        where: { id: user.id },
        data: {
            isEmailVerified: true,
            otpCodeHash: null,
            otpExpiresAt: null,
            otpPurpose: null,
            otpAttempts: 0,
        },
    });
    // Every user gets exactly one cart, provisioned the moment their account becomes active.
    await prisma_1.default.cart.upsert({
        where: { userId: verifiedUser.id },
        update: {},
        create: { userId: verifiedUser.id },
    });
    const tokens = await issueTokenPair(verifiedUser, meta);
    await recordLogin(verifiedUser.id, meta, true, 'register');
    return { user: sanitizeUser(verifiedUser), ...tokens };
}
async function resendOtp({ email, purpose }) {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    // Don't reveal whether the account exists — always return the same message.
    const genericResponse = { message: 'If that email needs a code, we just sent one.' };
    if (!user)
        return genericResponse;
    if (purpose === 'REGISTER' && user.isEmailVerified)
        return genericResponse;
    if (purpose === 'RESET_PASSWORD' && !user.passwordHash)
        return genericResponse; // Google-only account
    await sendOtpEmail(user, purpose);
    return genericResponse;
}
async function login({ email, password }, meta = {}) {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
        throw ApiError_1.default.unauthorized('Invalid email or password.');
    }
    const passwordMatches = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!passwordMatches) {
        await recordLogin(user.id, meta, false, 'bad_password');
        throw ApiError_1.default.unauthorized('Invalid email or password.');
    }
    if (!user.isEmailVerified) {
        throw ApiError_1.default.forbidden('Please verify your email before logging in.');
    }
    if (!user.isActive) {
        throw ApiError_1.default.forbidden('This account has been deactivated.');
    }
    const tokens = await issueTokenPair(user, meta);
    await recordLogin(user.id, meta, true, 'password');
    return { user: sanitizeUser(user), ...tokens };
}
async function googleAuth({ idToken }, meta = {}) {
    if (!env_1.env.google.clientId) {
        throw ApiError_1.default.internal('Google sign-in is not configured on this server.');
    }
    let ticket;
    try {
        ticket = await googleClient.verifyIdToken({ idToken, audience: env_1.env.google.clientId });
    }
    catch (err) {
        throw ApiError_1.default.unauthorized('Invalid Google token.');
    }
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
        throw ApiError_1.default.unauthorized('Google token did not include an email address.');
    }
    let user = await prisma_1.default.user.findUnique({ where: { googleId: payload.sub } });
    if (!user) {
        user = await prisma_1.default.user.findUnique({ where: { email: payload.email } });
        if (user) {
            // Existing local account signing in with Google for the first time — link it.
            user = await prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    googleId: payload.sub,
                    googlePicture: payload.picture,
                    isEmailVerified: true,
                },
            });
        }
        else {
            user = await prisma_1.default.user.create({
                data: {
                    name: payload.name || payload.email.split('@')[0],
                    email: payload.email,
                    googleId: payload.sub,
                    googlePicture: payload.picture,
                    authProvider: 'GOOGLE',
                    isEmailVerified: true,
                },
            });
            await prisma_1.default.cart.create({ data: { userId: user.id } });
        }
    }
    if (!user.isActive) {
        throw ApiError_1.default.forbidden('This account has been deactivated.');
    }
    const tokens = await issueTokenPair(user, meta);
    await recordLogin(user.id, meta, true, 'google');
    return { user: sanitizeUser(user), ...tokens };
}
async function refreshTokens({ refreshToken }, meta = {}) {
    const tokenHash = (0, jwt_1.hashToken)(refreshToken);
    const stored = await prisma_1.default.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
        throw ApiError_1.default.unauthorized('Refresh token is invalid or has expired. Please log in again.');
    }
    const user = await prisma_1.default.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive) {
        throw ApiError_1.default.unauthorized('Account no longer exists or has been deactivated.');
    }
    // Rotation: this refresh token can never be used again, even if replayed.
    await prisma_1.default.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const tokens = await issueTokenPair(user, meta);
    return { user: sanitizeUser(user), ...tokens };
}
async function logout({ refreshToken }) {
    if (!refreshToken)
        return { message: 'Logged out.' };
    const tokenHash = (0, jwt_1.hashToken)(refreshToken);
    await prisma_1.default.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
    return { message: 'Logged out.' };
}
async function forgotPassword({ email }) {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    const genericResponse = { message: 'If that email is registered, a reset code has been sent.' };
    if (!user || !user.passwordHash)
        return genericResponse; // don't leak existence / Google-only accounts
    await sendOtpEmail(user, 'RESET_PASSWORD');
    return genericResponse;
}
async function resetPassword({ email, otp, newPassword }) {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user) {
        throw ApiError_1.default.badRequest('No pending verification code for this request. Please request a new one.');
    }
    const otpError = checkOtp(user, 'RESET_PASSWORD', otp);
    if (otpError) {
        await prisma_1.default.user.update({ where: { id: user.id }, data: { otpAttempts: { increment: 1 } } });
        throw ApiError_1.default.badRequest(otpError);
    }
    const passwordHash = await bcryptjs_1.default.hash(newPassword, SALT_ROUNDS);
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            otpCodeHash: null,
            otpExpiresAt: null,
            otpPurpose: null,
            otpAttempts: 0,
        },
    });
    // Password changed — kill every existing session on every device.
    await prisma_1.default.refreshToken.updateMany({ where: { userId: user.id, revoked: false }, data: { revoked: true } });
    return { message: 'Password has been reset. Please log in again.' };
}
//# sourceMappingURL=auth.service.js.map