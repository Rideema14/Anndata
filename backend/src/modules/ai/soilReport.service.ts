import type { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import { chatCompleteJson } from './aiProvider.service';
import type { AiMessage } from './aiProvider.service';
import type { SoilAnalysisInput } from './ai.validation';
import type { PaginationQuery } from '../../common/utils/pagination';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdvisoryResult = Record<string, any>;

export async function analyzeSoil(userId: string, data: SoilAnalysisInput) {
  const messages: AiMessage[] = [
    {
      role: 'system',
      content:
        'You are a soil scientist interpreting a soil test report for a farmer. Respond ONLY with a JSON object ' +
        'shaped exactly like: {"summary": string, "recommendations": string[], "suitableCrops": string[], ' +
        '"amendments": string[], "warnings": string[], "confidence": "low"|"medium"|"high"}. Some input fields may ' +
        'be missing — work with what is given, and note in warnings if a key value (like pH) was not provided and ' +
        'would meaningfully change the advice.',
    },
    { role: 'user', content: `Soil data: ${JSON.stringify(data)}` },
  ];

  const result = await chatCompleteJson<AdvisoryResult>(messages);

  return prisma.soilReport.create({
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
      rawInput: data as Prisma.InputJsonValue,
      recommendationSummary: typeof result.summary === 'string' ? result.summary.slice(0, 300) : 'Analysis complete.',
      recommendationData: result as Prisma.InputJsonValue,
    },
  });
}

export async function listSoilReports(userId: string, query: PaginationQuery) {
  const { page, limit, skip, take } = parsePagination(query);
  const [items, totalItems] = await Promise.all([
    prisma.soilReport.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.soilReport.count({ where: { userId } }),
  ]);
  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function getSoilReportById(userId: string, id: string) {
  const report = await prisma.soilReport.findFirst({ where: { id, userId } });
  if (!report) throw ApiError.notFound('Soil report not found.');
  return report;
}

export async function deleteSoilReport(userId: string, id: string) {
  await getSoilReportById(userId, id);
  await prisma.soilReport.delete({ where: { id } });
}
