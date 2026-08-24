// Validates that all required environment variables are present before the
// app starts. Fail fast and loud rather than crashing later mid-request.
import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key] || process.env[key]?.trim() === '');

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `\n[ENV] Missing required environment variables:\n  - ${missing.join('\n  - ')}\n\n` +
        'Copy .env.example to .env and fill these in before starting the server.\n'
    );
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    // eslint-disable-next-line no-console
    console.warn('[ENV] RAZORPAY_WEBHOOK_SECRET is not set — the payment webhook endpoint will reject all events.');
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  databaseUrl: process.env.DATABASE_URL as string,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET as string,
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  smtp: {
    host: process.env.SMTP_HOST as string,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER as string,
    pass: process.env.SMTP_PASS as string,
    from: process.env.MAIL_FROM || 'Agri Marketplace <no-reply@agrimarketplace.com>',
  },

  otp: {
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    apiSecret: process.env.CLOUDINARY_API_SECRET as string,
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID as string,
    keySecret: process.env.RAZORPAY_KEY_SECRET as string,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },

  rateLimit: {
    authWindowMin: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MIN || '15', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '2000', 10),
  },

  weather: {
    baseUrl: process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1/forecast',
    cacheTtlMinutes: parseInt(process.env.WEATHER_CACHE_TTL_MINUTES || '30', 10),
  },

  dataGovIn: {
    apiKey: process.env.DATA_GOV_IN_API_KEY,
    resourceId: process.env.DATA_GOV_IN_RESOURCE_ID,
    baseUrl: process.env.DATA_GOV_IN_BASE_URL || 'https://api.data.gov.in/resource',
  },
};
