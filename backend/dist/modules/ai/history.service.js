"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnifiedHistory = getUnifiedHistory;
const prisma_1 = __importDefault(require("../../config/prisma"));
/**
 * Fetches the most recent `limit` items from each of the three history
 * sources, merges, and re-sorts by recency — an approximation (the true
 * top-`limit` across all three could in principle include more than `limit`
 * from one source) rather than a single exact cross-table query. Good
 * enough for a history feed; exact correctness isn't load-bearing here the
 * way it is for, say, machinery availability.
 */
async function getUnifiedHistory(userId, { limit }) {
    const [analyses, soilReports, sessions] = await Promise.all([
        prisma_1.default.cropAnalysis.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { id: true, type: true, resultSummary: true, createdAt: true },
        }),
        prisma_1.default.soilReport.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { id: true, recommendationSummary: true, createdAt: true },
        }),
        prisma_1.default.aiChatSession.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            take: limit,
            select: { id: true, title: true, updatedAt: true },
        }),
    ]);
    const merged = [
        ...analyses.map((a) => ({ id: a.id, kind: 'CROP_ANALYSIS', subtype: a.type, summary: a.resultSummary, createdAt: a.createdAt })),
        ...soilReports.map((s) => ({ id: s.id, kind: 'SOIL_REPORT', summary: s.recommendationSummary, createdAt: s.createdAt })),
        ...sessions.map((c) => ({ id: c.id, kind: 'CHAT', summary: c.title || 'Chat session', createdAt: c.updatedAt })),
    ];
    return merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}
//# sourceMappingURL=history.service.js.map