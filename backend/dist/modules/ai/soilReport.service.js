"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSoil = analyzeSoil;
exports.listSoilReports = listSoilReports;
exports.getSoilReportById = getSoilReportById;
exports.deleteSoilReport = deleteSoilReport;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
const aiProvider_service_1 = require("./aiProvider.service");
const language_1 = require("./language");
async function analyzeSoil(userId, data) {
    const messages = [
        {
            role: 'system',
            content: 'You are a soil scientist interpreting a soil test report for a farmer. Respond ONLY with a JSON object ' +
                'shaped exactly like: {"summary": string, "recommendations": string[], "suitableCrops": string[], ' +
                '"amendments": string[], "warnings": string[], "confidence": "low"|"medium"|"high"}. Some input fields may ' +
                'be missing — work with what is given, and note in warnings if a key value (like pH) was not provided and ' +
                `would meaningfully change the advice.${(0, language_1.jsonLanguageInstruction)(data.language)}`,
        },
        { role: 'user', content: `Soil data: ${JSON.stringify(data)}` },
    ];
    const result = await (0, aiProvider_service_1.chatCompleteJson)(messages);
    return prisma_1.default.soilReport.create({
        data: {
            userId,
            soilPh: data.soilPh,
            nitrogenLevel: data.nitrogenLevel,
            phosphorusLevel: data.phosphorusLevel,
            potassiumLevel: data.potassiumLevel,
            organicCarbonPercent: data.organicCarbonPercent,
            soilType: data.soilType,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            rawInput: data,
            recommendationSummary: typeof result.summary === 'string' ? result.summary.slice(0, 300) : 'Analysis complete.',
            recommendationData: result,
        },
    });
}
async function listSoilReports(userId, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const [items, totalItems] = await Promise.all([
        prisma_1.default.soilReport.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip, take }),
        prisma_1.default.soilReport.count({ where: { userId } }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function getSoilReportById(userId, id) {
    const report = await prisma_1.default.soilReport.findFirst({ where: { id, userId } });
    if (!report)
        throw ApiError_1.default.notFound('Soil report not found.');
    return report;
}
async function deleteSoilReport(userId, id) {
    await getSoilReportById(userId, id);
    await prisma_1.default.soilReport.delete({ where: { id } });
}
//# sourceMappingURL=soilReport.service.js.map