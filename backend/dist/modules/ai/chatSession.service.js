"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSessions = listSessions;
exports.createSession = createSession;
exports.getSession = getSession;
exports.deleteSession = deleteSession;
exports.sendMessage = sendMessage;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
const aiProvider_service_1 = require("./aiProvider.service");
const language_1 = require("./language");
const SYSTEM_PROMPT = 'You are an agricultural advisory assistant helping farmers with questions about crops, soil, weather, ' +
    'fertilizers, pests, irrigation, and general farming practices. Give clear, practical, safe advice. Prefer ' +
    'specific, actionable guidance over generic statements. If a question is unrelated to farming or agriculture, ' +
    'politely say so and redirect to farming topics. If you are not confident in an answer that could affect crop ' +
    "health or safety (e.g. chemical dosages), say so plainly and recommend consulting a local agricultural extension officer. " +
    'ALWAYS reply in the same language the user just wrote or spoke in — do not switch to English or any other ' +
    'language unless the user does. You are fluent in Hindi, Marathi, Punjabi, English, and other Indian languages; ' +
    'match the user\'s language, script, and tone (including code-mixed/Hinglish input) rather than translating or ' +
    'defaulting to a different language.';
// Human-readable names (with native script/self-name) for each supported UI
// language, used to pin the reply language explicitly when the caller (the
// app's language switcher) tells us which one the person is using — rather
// than leaving it to the model to infer from the message/transcript alone.
async function listSessions(userId, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const [items, totalItems] = await Promise.all([
        prisma_1.default.aiChatSession.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            skip,
            take,
            include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }, // last message, for a preview line
        }),
        prisma_1.default.aiChatSession.count({ where: { userId } }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function createSession(userId) {
    return prisma_1.default.aiChatSession.create({ data: { userId } });
}
async function getOwnSession(userId, sessionId) {
    const session = await prisma_1.default.aiChatSession.findFirst({ where: { id: sessionId, userId } });
    if (!session)
        throw ApiError_1.default.notFound('Chat session not found.');
    return session;
}
async function getSession(userId, sessionId) {
    await getOwnSession(userId, sessionId);
    return prisma_1.default.aiChatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
}
async function deleteSession(userId, sessionId) {
    await getOwnSession(userId, sessionId);
    await prisma_1.default.aiChatSession.delete({ where: { id: sessionId } });
}
const MAX_HISTORY_MESSAGES = 20; // keep the context window bounded on long-running sessions
async function sendMessage(userId, sessionId, content, targetLanguage) {
    const session = await getOwnSession(userId, sessionId);
    const priorMessages = await prisma_1.default.aiChatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: MAX_HISTORY_MESSAGES,
    });
    const userMessage = await prisma_1.default.aiChatMessage.create({ data: { sessionId, role: 'USER', content } });
    const conversation = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...priorMessages.map((m) => ({ role: m.role === 'USER' ? 'user' : 'assistant', content: m.content })),
        { role: 'user', content },
    ];
    // The app's language switcher, when set, overrides the "match the user's
    // own words" default with a pinned, deterministic reply language — no
    // reliance on the model correctly detecting the language itself. This is
    // appended last so it takes priority over the general instruction above.
    if (targetLanguage) {
        conversation.splice(1, 0, {
            role: 'system',
            content: `The user has set their app language to ${language_1.LANGUAGE_NAMES[targetLanguage]}. Reply in ${language_1.LANGUAGE_NAMES[targetLanguage]} for this entire response, regardless of what language the user's own message is written in.`,
        });
    }
    const replyText = await (0, aiProvider_service_1.chatComplete)(conversation);
    const [assistantMessage] = await prisma_1.default.$transaction([
        prisma_1.default.aiChatMessage.create({ data: { sessionId, role: 'ASSISTANT', content: replyText } }),
        prisma_1.default.aiChatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date(), title: session.title ?? content.slice(0, 60) },
        }),
    ]);
    return { userMessage, assistantMessage };
}
//# sourceMappingURL=chatSession.service.js.map