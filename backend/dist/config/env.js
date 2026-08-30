"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.validateEnv = validateEnv;
// Validates that all required environment variables are present before the
// app starts. Fail fast and loud rather than crashing later mid-request.
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
    'GEMINI_API_KEY',
];
function validateEnv() {
    const missing = REQUIRED_VARS.filter((key) => !process.env[key] || process.env[key]?.trim() === '');
    if (missing.length > 0) {
        // eslint-disable-next-line no-console
        console.error(`\n[ENV] Missing required environment variables:\n  - ${missing.join('\n  - ')}\n\n` +
            'Copy .env.example to .env and fill these in before starting the server.\n');
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
        // eslint-disable-next-line no-console
        console.warn('[ENV] RAZORPAY_WEBHOOK_SECRET is not set — the payment webhook endpoint will reject all events.');
    }
    if (!process.env.GROQ_API_KEY) {
        // eslint-disable-next-line no-console
        console.warn('[ENV] GROQ_API_KEY is not set — text chat/advisory and voice transcription will run on Gemini only ' +
            '(noticeably slower than Groq for these). See .env.example; this is optional, not required.');
    }
}
exports.env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    databaseUrl: process.env.DATABASE_URL,
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },
    emailjs: {
        serviceId: process.env.EMAILJS_SERVICE_ID,
        templateId: process.env.EMAILJS_TEMPLATE_ID,
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        // Optional but strongly recommended — see the warning below. Required
        // for server-side (non-browser) sends unless that account setting is
        // relaxed.
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
        fromName: process.env.MAIL_FROM_NAME || 'Agri Marketplace',
        fromEmail: process.env.MAIL_FROM_EMAIL || 'no-reply@agrimarketplace.com',
    },
    otp: {
        length: parseInt(process.env.OTP_LENGTH || '6', 10),
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    },
    // Platform/checkout pricing — previously hardcoded as constants inside
    // order.service.ts, machineryBooking.service.ts and seedOrder.service.ts.
    // Centralized here so the fee can be changed via .env without a code
    // change/redeploy, and so all three modules stay in sync.
    pricing: {
        // Flat fee (in rupees) added to an order when the subtotal is below
        // freeShippingThreshold.
        platformFee: parseFloat(process.env.PLATFORM_FEE || '49'),
        // Subtotal (in rupees) at/above which platformFee is waived (0).
        freeShippingThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD || '999'),
        // Flat tax rate applied to the subtotal, e.g. 0.05 = 5%.
        taxRate: parseFloat(process.env.TAX_RATE || '0.05'),
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
    tracking: {
        // Provider: 17TRACK (17track.net) — not TrackingMore, not KeyDelivery.
        // TrackingMore's live Tracking API/Webhook access moved off its
        // permanent Free plan in mid-2026. KeyDelivery's registration flow
        // stopped working reliably after that. 17TRACK still offers a real
        // Tracking API + webhook on a free quota with no card required — sign
        // up at https://api.17track.net, then get your key at
        // https://api.17track.net/admin/settings. Unlike KeyDelivery, there's no
        // per-account carrier-ID lookup step: 17TRACK's carrier codes are a
        // fixed public list, hardcoded in tracking.service.ts.
        // Leave TRACK17_API_KEY blank in dev to run with format-validation only
        // (AWBs won't be verified against a real carrier, and shipments stay
        // flagged "provider unavailable" until synced). Set TRACKING_SIMULATE=true
        // instead to auto-verify AWBs and generate a fake but internally-
        // consistent tracking timeline for development/testing — this is the
        // same simulation the seed script uses, and it never runs when
        // TRACK17_API_KEY is set.
        apiKey: process.env.TRACK17_API_KEY,
        simulate: process.env.TRACKING_SIMULATE === 'true',
        pollIntervalMinutes: parseInt(process.env.TRACKING_POLL_MINUTES || '10', 10),
        // 17TRACK pushes to a single webhook URL you register once in its
        // dashboard (Settings page) — unlike KeyDelivery, it's not passed
        // per-request. Set this to your public webhook endpoint including the
        // shared token below as a query param, e.g.
        // https://api.yourapp.com/api/v1/orders/webhooks/track17?token=<TRACKING_WEBHOOK_TOKEN>,
        // and paste that exact URL into the 17TRACK dashboard once. Leave both
        // unset to run on scheduled polling only (the cron job is the fallback
        // either way).
        webhookUrl: process.env.TRACKING_WEBHOOK_URL,
        // 17TRACK's webhook payload carries NO signature of its own (same
        // situation as KeyDelivery) — see tracking.service.ts's
        // verifyTrack17WebhookToken(). We authenticate inbound webhook calls
        // ourselves via this shared-secret token appended to webhookUrl above.
        // Generate any random string for it.
        webhookToken: process.env.TRACKING_WEBHOOK_TOKEN,
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        // Runs on Google's Gemini API instead of a paid provider — Google AI
        // Studio (https://aistudio.google.com/apikey) issues a free key with no
        // card required, and its free tier covers text, vision, audio input, and
        // TTS all through this one key. It IS rate-limited (roughly single-digit
        // to low-double-digit requests/minute, capped per day) and Google may use
        // free-tier prompts/outputs to improve its models, so this is meant to
        // get the project running at zero cost, not to be a production SLA.
        // Defaults below are confirmed-current as of mid-2026 (checked live
        // rather than assumed, since Google revises the free-tier model list
        // every few months and Pro-tier models moved to paid-only in April
        // 2026). Each is independently overridable so you can move to a newer
        // model ID later without a code change — check
        // https://ai.google.dev/gemini-api/docs/models for what's current and
        // still free. gemini-2.5-flash is the safe, vision-capable, free-tier
        // floor for both chat and disease-detection image analysis; swap
        // GEMINI_MODEL to gemini-2.5-flash-lite if you hit rate limits, since
        // Flash-Lite trades a little quality for a noticeably higher daily quota.
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        // Reuses a plain multimodal model rather than a dedicated ASR one —
        // Gemini has no separate transcription endpoint; audio is transcribed by
        // passing it as multimodal input to generateContent with an instruction
        // prompt (see aiProvider.service.ts). Flash is accurate enough for this
        // and stays on the free tier.
        transcribeModel: process.env.GEMINI_TRANSCRIBE_MODEL || 'gemini-2.5-flash',
        // Gemini's TTS models are a separate "-tts" family (text-only in, audio-
        // only out) and are still Preview as of mid-2026, but Preview here just
        // means the model ID may change — the free tier applies to them too.
        ttsModel: process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts',
        // One of Gemini TTS's ~30 prebuilt voice names (see the TTS docs for the
        // full list) — Kore is a clear, neutral default; override freely.
        ttsVoice: process.env.GEMINI_TTS_VOICE || 'Kore',
    },
    groq: {
        // Entirely optional — deliberately NOT in REQUIRED_VARS above, so the
        // app runs fine on Gemini alone with this blank. When present,
        // aiProvider.service.ts routes text chat/advisory and voice
        // transcription through Groq instead (see that file for exactly which
        // calls move and why), because Groq's LPU inference is dramatically
        // faster than Gemini for both: openai/gpt-oss-120b runs at roughly
        // 500 tokens/sec vs. Gemini Flash's typical throughput, and Whisper
        // Large v3 Turbo is a purpose-built transcription endpoint rather than
        // Gemini's "feed audio into a text model" workaround. Free tier, no
        // card required: https://console.groq.com/keys.
        apiKey: process.env.GROQ_API_KEY,
        // openai/gpt-oss-120b is Groq's current flagship open-weight model and
        // is what Groq itself recommends migrating to now that
        // llama-3.3-70b-versatile has been retired (Aug 2026). Swap to
        // openai/gpt-oss-20b for even higher free-tier throughput at a slight
        // quality cost, or check https://console.groq.com/docs/models for
        // what's current.
        chatModel: process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-120b',
        whisperModel: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo',
        // Voice-assistant replies default to Groq's Orpheus TTS: it's several
        // times faster than Gemini's, and synthesis was otherwise the slowest
        // leg of a voice round trip. Orpheus is English-only and billed per
        // character (no confirmed free tier as of mid-2026), and any
        // non-Latin-script reply (Hindi/Marathi/Punjabi/Gujarati) always still
        // goes to Gemini regardless of this setting — see aiProvider.service.ts.
        // Set AI_TTS_PROVIDER=gemini to opt out and use Gemini's free TTS for
        // every language instead, at the cost of slower voice replies.
        ttsProvider: (process.env.AI_TTS_PROVIDER === 'gemini' ? 'gemini' : 'groq'),
        ttsModel: process.env.GROQ_TTS_MODEL || 'canopylabs/orpheus-v1-english',
        ttsVoice: process.env.GROQ_TTS_VOICE || 'autumn',
    },
};
//# sourceMappingURL=env.js.map