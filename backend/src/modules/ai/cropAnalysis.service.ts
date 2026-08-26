import type { CropAnalysisType, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { uploadBuffer, deleteAsset } from '../../config/cloudinary';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import { chatCompleteJson } from './aiProvider.service';
import type { AiMessage } from './aiProvider.service';
import { getWeather } from '../weather/weather.service';
import type {
  CropAdvisorInput,
  DiseaseDetectionInput,
  FertilizerAdviceInput,
  IrrigationAdviceInput,
  CropRotationInput,
  WeatherAdviceInput,
  ListCropAnalysesQuery,
} from './ai.validation';

// LLM JSON output is inherently dynamic — every prompt below asks for a
// broadly consistent {summary, recommendations, warnings, confidence} shape
// plus a couple of type-specific fields, but modeling that precisely against
// Prisma's Json input type buys little; `any` here is a deliberate choice,
// not an oversight.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdvisoryResult = Record<string, any>;

const SAFETY_NOTE =
  'Never give exact chemical/pesticide dosages as if they were universally safe — always caveat that the ' +
  'farmer should confirm against the specific product label and local agricultural extension guidance, since ' +
  'safe rates vary by product formulation and region.';

async function runAnalysis(
  userId: string,
  type: CropAnalysisType,
  messages: AiMessage[],
  inputData: Record<string, unknown>,
  image?: { url: string; publicId: string }
) {
  const result = await chatCompleteJson<AdvisoryResult>(messages);

  return prisma.cropAnalysis.create({
    data: {
      userId,
      type,
      inputData: inputData as Prisma.InputJsonValue,
      imageUrl: image?.url,
      imagePublicId: image?.publicId,
      resultSummary: typeof result.summary === 'string' ? result.summary.slice(0, 300) : 'Analysis complete.',
      resultData: result as Prisma.InputJsonValue,
    },
  });
}

export async function getCropAdvice(userId: string, data: CropAdvisorInput) {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content:
        'You are an expert agronomist giving crop planting recommendations to farmers. Respond ONLY with a JSON ' +
        'object shaped exactly like: {"summary": string, "recommendedCrops": string[], "recommendations": string[], ' +
        '"warnings": string[], "confidence": "low"|"medium"|"high"}. If no specific crop was named, suggest 2-4 ' +
        'crops well-suited to the given conditions.',
    },
    { role: 'user', content: `Conditions: ${JSON.stringify(data)}` },
  ];
  return runAnalysis(userId, 'CROP_ADVISOR', messages, data);
}

export async function detectDisease(userId: string, data: DiseaseDetectionInput, fileBuffer: Buffer) {
  const { url, publicId } = await uploadBuffer(fileBuffer, { folder: 'agri-marketplace/ai/disease-detection' });

  const messages: AiMessage[] = [
    {
      role: 'system',
      content:
        'You are a plant pathologist analyzing a photo of a crop for disease or pest symptoms. Respond ONLY with a ' +
        'JSON object shaped exactly like: {"summary": string, "diseaseName": string|null, "isHealthy": boolean, ' +
        '"recommendations": string[], "warnings": string[], "confidence": "low"|"medium"|"high"}. Base your answer ' +
        "only on what's actually visible in the image — if it's unclear, poorly lit, or doesn't show a plant, say " +
        `so plainly rather than guessing. ${SAFETY_NOTE}`,
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: data.cropType ? `Crop: ${data.cropType}. ${data.notes || ''}` : data.notes || 'Please analyze this crop photo.' },
        { type: 'image_url', image_url: { url } },
      ],
    },
  ];

  try {
    return await runAnalysis(userId, 'DISEASE_DETECTION', messages, data, { url, publicId });
  } catch (err) {
    await deleteAsset(publicId).catch(() => {}); // don't orphan the upload if the AI call fails
    throw err;
  }
}

export async function getFertilizerAdvice(userId: string, data: FertilizerAdviceInput) {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content:
        'You are an agricultural input advisor giving fertilizer recommendations. Respond ONLY with a JSON object ' +
        'shaped exactly like: {"summary": string, "recommendations": string[], "npkGuidance": string, "warnings": ' +
        `string[], "confidence": "low"|"medium"|"high"}. ${SAFETY_NOTE}`,
    },
    { role: 'user', content: `Details: ${JSON.stringify(data)}` },
  ];
  return runAnalysis(userId, 'FERTILIZER_ADVICE', messages, data);
}

export async function getIrrigationAdvice(userId: string, data: IrrigationAdviceInput) {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content:
        'You are an irrigation planning advisor for farmers. Respond ONLY with a JSON object shaped exactly like: ' +
        '{"summary": string, "recommendations": string[], "suggestedSchedule": string, "warnings": string[], ' +
        '"confidence": "low"|"medium"|"high"}.',
    },
    { role: 'user', content: `Details: ${JSON.stringify(data)}` },
  ];
  return runAnalysis(userId, 'IRRIGATION_ADVICE', messages, data);
}

export async function getCropRotationPlan(userId: string, data: CropRotationInput) {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content:
        'You are a crop rotation planning expert. Respond ONLY with a JSON object shaped exactly like: {"summary": ' +
        'string, "suggestedNextCrops": string[], "rotationPlan": string, "recommendations": string[], "warnings": ' +
        'string[], "confidence": "low"|"medium"|"high"}. Favor rotations that manage soil nutrients and break pest ' +
        'and disease cycles.',
    },
    { role: 'user', content: `Details: ${JSON.stringify(data)}` },
  ];
  return runAnalysis(userId, 'CROP_ROTATION', messages, data);
}

export async function getWeatherAdvice(userId: string, data: WeatherAdviceInput) {
  const forecast = await getWeather(data.latitude, data.longitude, 7);

  const messages: AiMessage[] = [
    {
      role: 'system',
      content:
        'You are an agricultural advisor giving weather-correlated farming recommendations. You will be given a ' +
        'REAL weather forecast — base your advice specifically on it (e.g. rain expected soon → delay spraying; a ' +
        'heat spell → adjust irrigation timing; high wind → delay aerial/spray application). Respond ONLY with a ' +
        'JSON object shaped exactly like: {"summary": string, "recommendations": string[], "warnings": string[], ' +
        '"confidence": "low"|"medium"|"high"}.',
    },
    {
      role: 'user',
      content: `Crop: ${data.cropType || 'not specified'}. 7-day forecast: ${JSON.stringify(forecast)}`,
    },
  ];
  return runAnalysis(userId, 'WEATHER_ADVICE', messages, { ...data, forecastUsed: forecast });
}

export async function listCropAnalyses(userId: string, query: ListCropAnalysesQuery) {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.CropAnalysisWhereInput = { userId };
  if (query.type) where.type = query.type;

  const [items, totalItems] = await Promise.all([
    prisma.cropAnalysis.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.cropAnalysis.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function getCropAnalysisById(userId: string, id: string) {
  const analysis = await prisma.cropAnalysis.findFirst({ where: { id, userId } });
  if (!analysis) throw ApiError.notFound('Analysis not found.');
  return analysis;
}

export async function deleteCropAnalysis(userId: string, id: string) {
  const analysis = await getCropAnalysisById(userId, id);
  await prisma.cropAnalysis.delete({ where: { id } });
  if (analysis.imagePublicId) await deleteAsset(analysis.imagePublicId).catch(() => {});
}
