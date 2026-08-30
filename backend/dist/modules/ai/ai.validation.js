"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyQuerySchema = exports.voiceQuerySchema = exports.soilAnalysisSchema = exports.listCropAnalysesQuerySchema = exports.CROP_ANALYSIS_TYPES = exports.weatherAdviceSchema = exports.cropRotationSchema = exports.irrigationAdviceSchema = exports.fertilizerAdviceSchema = exports.diseaseDetectionSchema = exports.cropAdvisorSchema = exports.listChatSessionsQuerySchema = exports.sendChatMessageSchema = void 0;
const zod_1 = require("zod");
const language_1 = require("./language");
const languageCodeSchema = zod_1.z.enum(language_1.LANGUAGE_CODES).optional();
// --- Chat -----------------------------------------------------------------
exports.sendChatMessageSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(1).max(2000),
    language: languageCodeSchema, // pins the reply to this language; omitted = match the user's own message
});
exports.listChatSessionsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
});
// --- Crop analysis (six one-shot advisory types sharing one table) --------
exports.cropAdvisorSchema = zod_1.z.object({
    cropType: zod_1.z.string().trim().max(100).optional(),
    location: zod_1.z.string().trim().max(200).optional(),
    season: zod_1.z.string().trim().max(50).optional(),
    soilType: zod_1.z.string().trim().max(100).optional(),
    farmSizeAcres: zod_1.z.coerce.number().positive().optional(),
    notes: zod_1.z.string().trim().max(1000).optional(),
    language: languageCodeSchema,
});
exports.diseaseDetectionSchema = zod_1.z.object({
    cropType: zod_1.z.string().trim().max(100).optional(),
    notes: zod_1.z.string().trim().max(1000).optional(),
    language: languageCodeSchema,
});
exports.fertilizerAdviceSchema = zod_1.z.object({
    cropType: zod_1.z.string().trim().min(1).max(100),
    soilType: zod_1.z.string().trim().max(100).optional(),
    growthStage: zod_1.z.string().trim().max(100).optional(),
    notes: zod_1.z.string().trim().max(1000).optional(),
    language: languageCodeSchema,
});
exports.irrigationAdviceSchema = zod_1.z.object({
    cropType: zod_1.z.string().trim().min(1).max(100),
    soilType: zod_1.z.string().trim().max(100).optional(),
    location: zod_1.z.string().trim().max(200).optional(),
    notes: zod_1.z.string().trim().max(1000).optional(),
    language: languageCodeSchema,
});
exports.cropRotationSchema = zod_1.z.object({
    currentCrop: zod_1.z.string().trim().min(1).max(100),
    location: zod_1.z.string().trim().max(200).optional(),
    soilType: zod_1.z.string().trim().max(100).optional(),
    previousCrops: zod_1.z.array(zod_1.z.string().trim().max(100)).max(10).optional(),
    notes: zod_1.z.string().trim().max(1000).optional(),
    language: languageCodeSchema,
});
exports.weatherAdviceSchema = zod_1.z.object({
    latitude: zod_1.z.coerce.number().min(-90).max(90),
    longitude: zod_1.z.coerce.number().min(-180).max(180),
    cropType: zod_1.z.string().trim().max(100).optional(),
    language: languageCodeSchema,
});
exports.CROP_ANALYSIS_TYPES = [
    'CROP_ADVISOR',
    'DISEASE_DETECTION',
    'FERTILIZER_ADVICE',
    'IRRIGATION_ADVICE',
    'CROP_ROTATION',
    'WEATHER_ADVICE',
];
exports.listCropAnalysesQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    type: zod_1.z.enum(exports.CROP_ANALYSIS_TYPES).optional(),
});
// --- Soil analysis -----------------------------------------------------
exports.soilAnalysisSchema = zod_1.z.object({
    soilPh: zod_1.z.coerce.number().min(0).max(14).optional(),
    nitrogenLevel: zod_1.z.enum(['Low', 'Medium', 'High']).optional(),
    phosphorusLevel: zod_1.z.enum(['Low', 'Medium', 'High']).optional(),
    potassiumLevel: zod_1.z.enum(['Low', 'Medium', 'High']).optional(),
    organicCarbonPercent: zod_1.z.coerce.number().min(0).max(100).optional(),
    soilType: zod_1.z.string().trim().max(100).optional(),
    location: zod_1.z.string().trim().max(200).optional(),
    latitude: zod_1.z.coerce.number().min(-90).max(90).optional(),
    longitude: zod_1.z.coerce.number().min(-180).max(180).optional(),
    notes: zod_1.z.string().trim().max(1000).optional(),
    language: languageCodeSchema,
});
// --- Voice -----------------------------------------------------------------
exports.voiceQuerySchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid().optional(), // continue an existing chat session, or start a fresh one if omitted
    synthesizeReply: zod_1.z
        .enum(['true', 'false'])
        .default('true')
        .transform((v) => v === 'true'),
    language: languageCodeSchema, // pins the reply (and therefore the synthesized speech) to this language
});
// --- Unified history ---------------------------------------------------
exports.historyQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().positive().max(50).default(20),
});
//# sourceMappingURL=ai.validation.js.map