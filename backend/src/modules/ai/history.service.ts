import prisma from '../../config/prisma';
import type { HistoryQuery } from './ai.validation';

export interface HistoryItem {
  id: string;
  kind: 'CROP_ANALYSIS' | 'SOIL_REPORT' | 'CHAT';
  subtype?: string;
  summary: string;
  createdAt: Date;
}

/**
 * Fetches the most recent `limit` items from each of the three history
 * sources, merges, and re-sorts by recency — an approximation (the true
 * top-`limit` across all three could in principle include more than `limit`
 * from one source) rather than a single exact cross-table query. Good
 * enough for a history feed; exact correctness isn't load-bearing here the
 * way it is for, say, machinery availability.
 */
export async function getUnifiedHistory(userId: string, { limit }: HistoryQuery): Promise<HistoryItem[]> {
  const [analyses, soilReports, sessions] = await Promise.all([
    prisma.cropAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, type: true, resultSummary: true, createdAt: true },
    }),
    prisma.soilReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, recommendationSummary: true, createdAt: true },
    }),
    prisma.aiChatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: { id: true, title: true, updatedAt: true },
    }),
  ]);

  const merged: HistoryItem[] = [
    ...analyses.map((a) => ({ id: a.id, kind: 'CROP_ANALYSIS' as const, subtype: a.type, summary: a.resultSummary, createdAt: a.createdAt })),
    ...soilReports.map((s) => ({ id: s.id, kind: 'SOIL_REPORT' as const, summary: s.recommendationSummary, createdAt: s.createdAt })),
    ...sessions.map((c) => ({ id: c.id, kind: 'CHAT' as const, summary: c.title || 'Chat session', createdAt: c.updatedAt })),
  ];

  return merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}
