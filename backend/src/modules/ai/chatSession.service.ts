import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import { chatComplete } from './aiProvider.service';
import type { AiMessage } from './aiProvider.service';
import type { PaginationQuery } from '../../common/utils/pagination';

const SYSTEM_PROMPT =
  'You are an agricultural advisory assistant helping farmers with questions about crops, soil, weather, ' +
  'fertilizers, pests, irrigation, and general farming practices. Give clear, practical, safe advice. Prefer ' +
  'specific, actionable guidance over generic statements. If a question is unrelated to farming or agriculture, ' +
  'politely say so and redirect to farming topics. If you are not confident in an answer that could affect crop ' +
  "health or safety (e.g. chemical dosages), say so plainly and recommend consulting a local agricultural extension officer.";

export async function listSessions(userId: string, query: PaginationQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const [items, totalItems] = await Promise.all([
    prisma.aiChatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }, // last message, for a preview line
    }),
    prisma.aiChatSession.count({ where: { userId } }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function createSession(userId: string) {
  return prisma.aiChatSession.create({ data: { userId } });
}

async function getOwnSession(userId: string, sessionId: string) {
  const session = await prisma.aiChatSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw ApiError.notFound('Chat session not found.');
  return session;
}

export async function getSession(userId: string, sessionId: string) {
  await getOwnSession(userId, sessionId);
  return prisma.aiChatSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function deleteSession(userId: string, sessionId: string) {
  await getOwnSession(userId, sessionId);
  await prisma.aiChatSession.delete({ where: { id: sessionId } });
}

const MAX_HISTORY_MESSAGES = 20; // keep the context window bounded on long-running sessions

export async function sendMessage(userId: string, sessionId: string, content: string) {
  const session = await getOwnSession(userId, sessionId);

  const priorMessages = await prisma.aiChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: MAX_HISTORY_MESSAGES,
  });

  const userMessage = await prisma.aiChatMessage.create({ data: { sessionId, role: 'USER', content } });

  const conversation: AiMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...priorMessages.map((m): AiMessage => ({ role: m.role === 'USER' ? 'user' : 'assistant', content: m.content })),
    { role: 'user', content },
  ];

  const replyText = await chatComplete(conversation);

  const [assistantMessage] = await prisma.$transaction([
    prisma.aiChatMessage.create({ data: { sessionId, role: 'ASSISTANT', content: replyText } }),
    prisma.aiChatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date(), title: session.title ?? content.slice(0, 60) },
    }),
  ]);

  return { userMessage, assistantMessage };
}
