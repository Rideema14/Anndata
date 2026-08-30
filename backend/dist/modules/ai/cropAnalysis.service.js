"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCropAdvice = getCropAdvice;
exports.detectDisease = detectDisease;
exports.getFertilizerAdvice = getFertilizerAdvice;
exports.getIrrigationAdvice = getIrrigationAdvice;
exports.getCropRotationPlan = getCropRotationPlan;
exports.getWeatherAdvice = getWeatherAdvice;
exports.listCropAnalyses = listCropAnalyses;
exports.getCropAnalysisById = getCropAnalysisById;
exports.deleteCropAnalysis = deleteCropAnalysis;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const cloudinary_1 = require("../../config/cloudinary");
const pagination_1 = require("../../common/utils/pagination");
const aiProvider_service_1 = require("./aiProvider.service");
const weather_service_1 = require("../weather/weather.service");
const language_1 = require("./language");
const SAFETY_NOTE = 'Never give exact chemical/pesticide dosages as if they were universally safe — always caveat that the ' +
    'farmer should confirm against the specific product label and local agricultural extension guidance, since ' +
    'safe rates vary by product formulation and region.';
async function runAnalysis(userId, type, messages, inputData, image) {
    const result = await (0, aiProvider_service_1.chatCompleteJson)(messages);
    return prisma_1.default.cropAnalysis.create({
        data: {
            userId,
            type,
            inputData: inputData,
            imageUrl: image?.url,
            imagePublicId: image?.publicId,
            resultSummary: typeof result.summary === 'string' ? result.summary.slice(0, 300) : 'Analysis complete.',
            resultData: result,
        },
    });
}
async function getCropAdvice(userId, data) {
    const messages = [
        {
            role: 'system',
            content: 'You are an expert agronomist giving crop planting recommendations to farmers. Respond ONLY with a JSON ' +
                'object shaped exactly like: {"summary": string, "recommendedCrops": string[], "recommendations": string[], ' +
                '"warnings": string[], "confidence": "low"|"medium"|"high"}. If no specific crop was named, suggest 2-4 ' +
                `crops well-suited to the given conditions.${(0, language_1.jsonLanguageInstruction)(data.language)}`,
        },
        { role: 'user', content: `Conditions: ${JSON.stringify(data)}` },
    ];
    return runAnalysis(userId, 'CROP_ADVISOR', messages, data);
}
async function detectDisease(userId, data, fileBuffer) {
    const { url, publicId } = await (0, cloudinary_1.uploadBuffer)(fileBuffer, { folder: 'agri-marketplace/ai/disease-detection' });
    const messages = [
        {
            role: 'system',
            content: 'You are a plant pathologist analyzing a photo of a crop for disease or pest symptoms. Respond ONLY with a ' +
                'JSON object shaped exactly like: {"summary": string, "diseaseName": string|null, "isHealthy": boolean, ' +
                '"recommendations": string[], "warnings": string[], "confidence": "low"|"medium"|"high"}. Base your answer ' +
                "only on what's actually visible in the image — if it's unclear, poorly lit, or doesn't show a plant, say " +
                `so plainly rather than guessing. ${SAFETY_NOTE}${(0, language_1.jsonLanguageInstruction)(data.language)}`,
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
    }
    catch (err) {
        await (0, cloudinary_1.deleteAsset)(publicId).catch(() => { }); // don't orphan the upload if the AI call fails
        throw err;
    }
}
async function getFertilizerAdvice(userId, data) {
    const messages = [
        {
            role: 'system',
            content: 'You are an agricultural input advisor giving fertilizer recommendations. Respond ONLY with a JSON object ' +
                'shaped exactly like: {"summary": string, "recommendations": string[], "npkGuidance": string, "warnings": ' +
                `string[], "confidence": "low"|"medium"|"high"}. ${SAFETY_NOTE}${(0, language_1.jsonLanguageInstruction)(data.language)}`,
        },
        { role: 'user', content: `Details: ${JSON.stringify(data)}` },
    ];
    return runAnalysis(userId, 'FERTILIZER_ADVICE', messages, data);
}
async function getIrrigationAdvice(userId, data) {
    const messages = [
        {
            role: 'system',
            content: 'You are an irrigation planning advisor for farmers. Respond ONLY with a JSON object shaped exactly like: ' +
                '{"summary": string, "recommendations": string[], "suggestedSchedule": string, "warnings": string[], ' +
                `"confidence": "low"|"medium"|"high"}.${(0, language_1.jsonLanguageInstruction)(data.language)}`,
        },
        { role: 'user', content: `Details: ${JSON.stringify(data)}` },
    ];
    return runAnalysis(userId, 'IRRIGATION_ADVICE', messages, data);
}
async function getCropRotationPlan(userId, data) {
    const messages = [
        {
            role: 'system',
            content: 'You are a crop rotation planning expert. Respond ONLY with a JSON object shaped exactly like: {"summary": ' +
                'string, "suggestedNextCrops": string[], "rotationPlan": string, "recommendations": string[], "warnings": ' +
                `string[], "confidence": "low"|"medium"|"high"}. Favor rotations that manage soil nutrients and break pest ` +
                `and disease cycles.${(0, language_1.jsonLanguageInstruction)(data.language)}`,
        },
        { role: 'user', content: `Details: ${JSON.stringify(data)}` },
    ];
    return runAnalysis(userId, 'CROP_ROTATION', messages, data);
}
async function getWeatherAdvice(userId, data) {
    const forecast = await (0, weather_service_1.getWeather)(data.latitude, data.longitude, 7);
    const messages = [
        {
            role: 'system',
            content: 'You are an agricultural advisor giving weather-correlated farming recommendations. You will be given a ' +
                'REAL weather forecast — base your advice specifically on it (e.g. rain expected soon → delay spraying; a ' +
                'heat spell → adjust irrigation timing; high wind → delay aerial/spray application). Respond ONLY with a ' +
                'JSON object shaped exactly like: {"summary": string, "recommendations": string[], "warnings": string[], ' +
                `"confidence": "low"|"medium"|"high"}.${(0, language_1.jsonLanguageInstruction)(data.language)}`,
        },
        {
            role: 'user',
            content: `Crop: ${data.cropType || 'not specified'}. 7-day forecast: ${JSON.stringify(forecast)}`,
        },
    ];
    return runAnalysis(userId, 'WEATHER_ADVICE', messages, { ...data, forecastUsed: forecast });
}
async function listCropAnalyses(userId, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { userId };
    if (query.type)
        where.type = query.type;
    const [items, totalItems] = await Promise.all([
        prisma_1.default.cropAnalysis.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
        prisma_1.default.cropAnalysis.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function getCropAnalysisById(userId, id) {
    const analysis = await prisma_1.default.cropAnalysis.findFirst({ where: { id, userId } });
    if (!analysis)
        throw ApiError_1.default.notFound('Analysis not found.');
    return analysis;
}
async function deleteCropAnalysis(userId, id) {
    const analysis = await getCropAnalysisById(userId, id);
    await prisma_1.default.cropAnalysis.delete({ where: { id } });
    if (analysis.imagePublicId)
        await (0, cloudinary_1.deleteAsset)(analysis.imagePublicId).catch(() => { });
}
//# sourceMappingURL=cropAnalysis.service.js.map