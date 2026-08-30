"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = generateOtp;
exports.hashOtp = hashOtp;
exports.otpExpiryDate = otpExpiryDate;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../config/env");
function generateOtp() {
    const min = 10 ** (env_1.env.otp.length - 1);
    const max = 10 ** env_1.env.otp.length - 1;
    return crypto_1.default.randomInt(min, max + 1).toString();
}
function hashOtp(code) {
    return crypto_1.default.createHash('sha256').update(code).digest('hex');
}
function otpExpiryDate() {
    return new Date(Date.now() + env_1.env.otp.expiryMinutes * 60_000);
}
//# sourceMappingURL=otp.js.map