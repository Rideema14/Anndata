import { toFile } from 'openai';
import openai from '../../config/openai';
import { env } from '../../config/env';
import ApiError from '../../common/utils/ApiError';
import logger from '../../common/utils/logger';

export type AiContentBlock = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AiContentBlock[];
}

async function callChatCompletion(messages: AiMessage[], jsonMode: boolean): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: env.openai.model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any, // structurally matches OpenAI's message shape; avoids importing its deep type tree here
      temperature: 0.4, // advisory answers should be fairly consistent, not creative
      response_format: jsonMode ? { type: 'json_object' } : undefined,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw ApiError.internal('The AI service returned an empty response.');
    return content;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`OpenAI chat completion failed: ${message}`);
    throw ApiError.internal('The AI advisory service is temporarily unavailable. Please try again shortly.');
  }
}

/** Plain-text reply — used for open-ended chat. */
export async function chatComplete(messages: AiMessage[]): Promise<string> {
  return callChatCompletion(messages, false);
}

/**
 * Structured reply — used for every one-shot advisory type. The system
 * prompt MUST ask for JSON explicitly (OpenAI requires the word "json" to
 * appear in the prompt when response_format is json_object); every prompt
 * builder in cropAnalysis.service.ts and soilReport.service.ts already does
 * this. json_object mode guarantees syntactically valid JSON, so a parse
 * failure here would mean something is genuinely wrong upstream, not a
 * normal case to design around.
 */
export async function chatCompleteJson<T>(messages: AiMessage[]): Promise<T> {
  const raw = await callChatCompletion(messages, true);
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.error(`OpenAI returned non-JSON despite json_object mode: ${raw.slice(0, 500)}`);
    throw ApiError.internal('The AI service returned a response we could not parse. Please try again.');
  }
}

/** Transcribes an uploaded audio file to text. */
export async function transcribeAudio(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
  try {
    // toFile wraps a Buffer with a filename for upload — used instead of the
    // global `File` constructor because that global isn't reliably available
    // before Node 20, and this project's engines field allows 18. It's a
    // named export (not a static OpenAI.toFile method) and its option is
    // `contentType`, not `type` — confirmed against OpenAI's own examples
    // rather than assumed, since it's easy to get backwards.
    const file = await toFile(buffer, filename, { contentType: mimetype });
    const response = await openai.audio.transcriptions.create({
      file,
      model: env.openai.transcribeModel,
    });
    return response.text;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`OpenAI transcription failed: ${message}`);
    throw ApiError.internal('Could not transcribe the audio. Please try again.');
  }
}

/** Synthesizes speech from text, returning raw MP3 bytes. */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  try {
    const response = await openai.audio.speech.create({
      model: env.openai.ttsModel,
      voice: env.openai.ttsVoice as OpenAiVoice,
      input: text,
    });
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`OpenAI speech synthesis failed: ${message}`);
    throw ApiError.internal('Could not generate speech audio. Please try again.');
  }
}

// The SDK types `voice` as a specific string-literal union that occasionally
// changes as new voices ship. Widening to `string` at the call site above
// and asserting through this alias keeps OPENAI_TTS_VOICE genuinely
// configurable via env var without fighting that union on every SDK bump.
type OpenAiVoice = Parameters<typeof openai.audio.speech.create>[0]['voice'];
