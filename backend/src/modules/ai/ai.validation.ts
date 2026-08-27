import { z } from 'zod';

// --- Shared language codes -------------------------------------------------
// Kept in sync with the frontend's src/locales supported languages, so a
// person's UI language selection can pin the AI's reply/speech language
// deterministically instead of relying on the model to infer it.
export const LANGUAGE_CODES = ['en', 'hi', 'mr', 'pa', 'gu'] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];
const languageCodeSchema = z.enum(LANGUAGE_CODES).optional();

// --- Chat -----------------------------------------------------------------

export const sendChatMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  language: languageCodeSchema, // pins the reply to this language; omitted = match the user's own message
});
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;

export const listChatSessionsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type ListChatSessionsQuery = z.infer<typeof listChatSessionsQuerySchema>;

// --- Crop analysis (six one-shot advisory types sharing one table) --------

export const cropAdvisorSchema = z.object({
  cropType: z.string().trim().max(100).optional(),
  location: z.string().trim().max(200).optional(),
  season: z.string().trim().max(50).optional(),
  soilType: z.string().trim().max(100).optional(),
  farmSizeAcres: z.coerce.number().positive().optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type CropAdvisorInput = z.infer<typeof cropAdvisorSchema>;

export const diseaseDetectionSchema = z.object({
  cropType: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type DiseaseDetectionInput = z.infer<typeof diseaseDetectionSchema>;

export const fertilizerAdviceSchema = z.object({
  cropType: z.string().trim().min(1).max(100),
  soilType: z.string().trim().max(100).optional(),
  growthStage: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type FertilizerAdviceInput = z.infer<typeof fertilizerAdviceSchema>;

export const irrigationAdviceSchema = z.object({
  cropType: z.string().trim().min(1).max(100),
  soilType: z.string().trim().max(100).optional(),
  location: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type IrrigationAdviceInput = z.infer<typeof irrigationAdviceSchema>;

export const cropRotationSchema = z.object({
  currentCrop: z.string().trim().min(1).max(100),
  location: z.string().trim().max(200).optional(),
  soilType: z.string().trim().max(100).optional(),
  previousCrops: z.array(z.string().trim().max(100)).max(10).optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type CropRotationInput = z.infer<typeof cropRotationSchema>;

export const weatherAdviceSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  cropType: z.string().trim().max(100).optional(),
});
export type WeatherAdviceInput = z.infer<typeof weatherAdviceSchema>;

export const CROP_ANALYSIS_TYPES = [
  'CROP_ADVISOR',
  'DISEASE_DETECTION',
  'FERTILIZER_ADVICE',
  'IRRIGATION_ADVICE',
  'CROP_ROTATION',
  'WEATHER_ADVICE',
] as const;

export const listCropAnalysesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.enum(CROP_ANALYSIS_TYPES).optional(),
});
export type ListCropAnalysesQuery = z.infer<typeof listCropAnalysesQuerySchema>;

// --- Soil analysis -----------------------------------------------------

export const soilAnalysisSchema = z.object({
  soilPh: z.coerce.number().min(0).max(14).optional(),
  nitrogenLevel: z.enum(['Low', 'Medium', 'High']).optional(),
  phosphorusLevel: z.enum(['Low', 'Medium', 'High']).optional(),
  potassiumLevel: z.enum(['Low', 'Medium', 'High']).optional(),
  organicCarbonPercent: z.coerce.number().min(0).max(100).optional(),
  soilType: z.string().trim().max(100).optional(),
  location: z.string().trim().max(200).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type SoilAnalysisInput = z.infer<typeof soilAnalysisSchema>;

// --- Voice -----------------------------------------------------------------

export const voiceQuerySchema = z.object({
  sessionId: z.string().uuid().optional(), // continue an existing chat session, or start a fresh one if omitted
  synthesizeReply: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  language: languageCodeSchema, // pins the reply (and therefore the synthesized speech) to this language
});
export type VoiceQuery = z.infer<typeof voiceQuerySchema>;

// --- Unified history ---------------------------------------------------

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
