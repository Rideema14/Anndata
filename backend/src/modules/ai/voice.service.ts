import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import logger from '../../common/utils/logger';
import { transcribeAudio, synthesizeSpeech } from './aiProvider.service';
import * as chatSessionService from './chatSession.service';
import type { LanguageCode } from './language';

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
 *
 * The reply — and therefore the synthesized voice — is pinned to whatever
 * language transcription actually detected the person speaking, so it
 * answers back in that language rather than a default. `explicitLanguage`
 * is only a fallback for when detection comes back inconclusive (e.g. a
 * very short or ambiguous clip); it never overrides a successful detection.
 */
export async function handleVoiceQuery(
  userId: string,
  fileBuffer: Buffer,
  filename: string,
  mimetype: string,
  sessionId: string | undefined,
  synthesizeReply: boolean,
  explicitLanguage?: LanguageCode
): Promise<VoiceResult> {
  const { text: transcript, detectedLanguage } = await transcribeAudio(fileBuffer, filename, mimetype);
  if (!transcript.trim()) {
    throw ApiError.badRequest('Could not detect any speech in the audio.');
  }
  const replyLanguage = detectedLanguage ?? explicitLanguage;

  let activeSessionId: string;
  if (sessionId) {
    const owned = await prisma.aiChatSession.findFirst({ where: { id: sessionId, userId } });
    if (!owned) throw ApiError.notFound('Chat session not found.');
    activeSessionId = sessionId;
  } else {
    const session = await chatSessionService.createSession(userId);
    activeSessionId = session.id;
  }

  const { assistantMessage } = await chatSessionService.sendMessage(userId, activeSessionId, transcript, replyLanguage);

  let replyAudioUrl: string | undefined;
  if (synthesizeReply) {
    try {
      const audioBuffer = await synthesizeSpeech(assistantMessage.content);
      // Returned inline as a data URI rather than uploaded to Cloudinary first.
      // The person is actively waiting on this response — for a live voice
      // reply, skipping the extra upload-then-fetch round trip is the single
      // biggest latency win available here, and the reply is ephemeral by
      // nature (nobody re-visits a past spoken answer by URL), so there's no
      // real loss from not persisting it to cloud storage.
      replyAudioUrl = `data:audio/wav;base64,${audioBuffer.toString('base64')}`;
    } catch (err) {
      // A TTS outage (rate limits, an unaccepted model's terms, etc.) must
      // never take down the whole reply — transcription and the actual
      // answer already succeeded by this point. Log it and hand back a
      // text-only reply instead of failing the request; the person still
      // gets their answer, just without spoken playback this one time.
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`Speech synthesis failed for a voice reply — returning text-only instead of failing the request: ${message}`);
    }
  }

  return { transcript, replyText: assistantMessage.content, replyAudioUrl, sessionId: activeSessionId };
}
