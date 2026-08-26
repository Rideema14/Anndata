import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { transcribeAudio, synthesizeSpeech } from './aiProvider.service';
import { uploadBuffer } from '../../config/cloudinary';
import * as chatSessionService from './chatSession.service';

export interface VoiceResult {
  transcript: string;
  replyText: string;
  replyAudioUrl?: string;
  sessionId: string;
}

/**
 * Transcribes the recording, feeds the transcript through the same chat
 * pipeline as text chat (so voice and text share one conversation history
 * and one system prompt, not a parallel implementation), and optionally
 * synthesizes the reply back to speech.
 */
export async function handleVoiceQuery(
  userId: string,
  fileBuffer: Buffer,
  filename: string,
  mimetype: string,
  sessionId: string | undefined,
  synthesizeReply: boolean
): Promise<VoiceResult> {
  const transcript = await transcribeAudio(fileBuffer, filename, mimetype);
  if (!transcript.trim()) {
    throw ApiError.badRequest('Could not detect any speech in the audio.');
  }

  let activeSessionId = sessionId;
  if (activeSessionId) {
    const owned = await prisma.aiChatSession.findFirst({ where: { id: activeSessionId, userId } });
    if (!owned) throw ApiError.notFound('Chat session not found.');
  } else {
    const session = await chatSessionService.createSession(userId);
    activeSessionId = session.id;
  }

  const { assistantMessage } = await chatSessionService.sendMessage(userId, activeSessionId, transcript);

  let replyAudioUrl: string | undefined;
  if (synthesizeReply) {
    const audioBuffer = await synthesizeSpeech(assistantMessage.content);
    // Cloudinary has no separate "audio" resource type — audio-only files
    // are uploaded under 'video', which is its documented convention.
    const uploaded = await uploadBuffer(audioBuffer, { folder: 'agri-marketplace/ai/voice-replies', resourceType: 'video' });
    replyAudioUrl = uploaded.url;
  }

  return { transcript, replyText: assistantMessage.content, replyAudioUrl, sessionId: activeSessionId };
}
