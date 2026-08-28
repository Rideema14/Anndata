import type { Content, Part } from '@google/genai';
import { toFile } from 'groq-sdk';
import genai from '../../config/gemini';
import groq, { isGroqConfigured } from '../../config/groq';
import { env } from '../../config/env';
import ApiError from '../../common/utils/ApiError';
import logger from '../../common/utils/logger';
import { pcmToWav } from '../../common/utils/wav';
import { type LanguageCode } from './language';

export type AiContentBlock = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AiContentBlock[];
}

// Gemini's TTS models always return raw 16-bit PCM at this fixed rate — this
// isn't configurable per-request, it's just what the API produces.
const TTS_SAMPLE_RATE = 24000;

/**
 * This module is a small router in front of two providers, not a single
 * client. Text-only chat/advisory calls and voice transcription go to Groq
 * when it's configured, because Groq's LPU inference is several times
 * faster than Gemini for both — and a farmer waiting on a voice-assistant
 * reply feels every extra second. Image-based calls (disease detection)
 * always stay on Gemini: Groq's only multimodal model is a preview model
 * that Groq's own docs say isn't meant for production, and "usually
 * diagnoses your crop correctly" isn't good enough. If Groq is unset, or a
 * Groq call fails for any reason, everything transparently falls back to
 * Gemini — callers of chatComplete/chatCompleteJson/transcribeAudio/
 * synthesizeSpeech never need to know or care which provider actually
 * answered.
 */

// ---------------------------------------------------------------------------
// Gemini implementation (vision-capable chat/JSON, fallback transcription,
// default TTS)
// ---------------------------------------------------------------------------

/**
 * Downloads an image and returns it as base64 inline data, since Gemini's
 * generateContent takes image bytes directly rather than a fetchable URL
 * (unlike OpenAI/Groq's image_url, which the model fetches server-side
 * itself).
 */
async function urlToInlineImage(url: string): Promise<Part> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to download image for AI analysis: ${message}`);
    throw ApiError.internal('Could not load the image for AI analysis.');
  }
  if (!res.ok) throw ApiError.internal('Could not load the image for AI analysis.');

  const mimeType = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  const data = Buffer.from(await res.arrayBuffer()).toString('base64');
  return { inlineData: { mimeType, data } };
}

/** Converts one AiMessage's content into Gemini Parts. */
async function toGeminiParts(content: string | AiContentBlock[]): Promise<Part[]> {
  if (typeof content === 'string') return [{ text: content }];

  const parts: Part[] = [];
  for (const block of content) {
    if (block.type === 'text') {
      parts.push({ text: block.text });
    } else {
      parts.push(await urlToInlineImage(block.image_url.url));
    }
  }
  return parts;
}

/**
 * Splits an AiMessage[] into Gemini's shape: a single system instruction
 * string plus a user/model turn list. Gemini has no 'system' role inside
 * `contents` (system prompts go in a separate `systemInstruction` config
 * field) and calls the assistant's role 'model' rather than 'assistant'.
 */
async function toGeminiRequest(messages: AiMessage[]): Promise<{ systemInstruction?: string; contents: Content[] }> {
  let systemInstruction: string | undefined;
  const contents: Content[] = [];

  for (const message of messages) {
    if (message.role === 'system') {
      const text = typeof message.content === 'string' ? message.content : '';
      systemInstruction = systemInstruction ? `${systemInstruction}\n\n${text}` : text;
      continue;
    }
    contents.push({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: await toGeminiParts(message.content),
    });
  }

  return { systemInstruction, contents };
}

async function geminiGenerateContent(messages: AiMessage[], jsonMode: boolean): Promise<string> {
  try {
    const { systemInstruction, contents } = await toGeminiRequest(messages);

    const response = await genai.models.generateContent({
      model: env.gemini.model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.4, // advisory answers should be fairly consistent, not creative
        responseMimeType: jsonMode ? 'application/json' : undefined,
      },
    });

    const text = response.text;
    if (!text) throw ApiError.internal('The AI service returned an empty response.');
    return text;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Gemini generateContent failed: ${message}`);
    throw ApiError.internal('The AI advisory service is temporarily unavailable. Please try again shortly.');
  }
}

export interface TranscriptionResult {
  text: string;
  detectedLanguage?: LanguageCode;
}

// Whisper (and the prompt asked of Gemini below) report the detected
// language as its English name (e.g. "Hindi"), not an ISO code — this maps
// that back to our internal codes. Anything outside these five (Bengali,
// Tamil, Urdu, etc.) is left undetected rather than mismapped; the model's
// own "reply in whatever language you were spoken to in" instruction still
// covers it, just without a deterministic pin.
const LANGUAGE_NAME_TO_CODE: Record<string, LanguageCode> = {
  english: 'en',
  hindi: 'hi',
  marathi: 'mr',
  punjabi: 'pa',
  gujarati: 'gu',
};
function mapDetectedLanguage(name?: string): LanguageCode | undefined {
  return name ? LANGUAGE_NAME_TO_CODE[name.trim().toLowerCase()] : undefined;
}

/**
 * Transcribes an uploaded audio file to text via Gemini, also asking it to
 * name the language it heard so the reply can be pinned to match — see
 * TranscriptionResult. This is the fallback path (used when Groq is unset
 * or a Groq transcription call fails) — Gemini has no dedicated
 * transcription endpoint, so audio is transcribed by passing it as
 * multimodal input to generateContent with an instruction to transcribe
 * verbatim. The mimetype from a browser recording often carries a codec
 * suffix (e.g. 'audio/webm;codecs=opus'), which Gemini doesn't expect, so
 * it's stripped down to the bare type.
 */
async function geminiTranscribeAudio(buffer: Buffer, filename: string, mimetype: string): Promise<TranscriptionResult> {
  try {
    const bareMimeType = mimetype.split(';')[0].trim() || 'audio/webm';

    const response = await genai.models.generateContent({
      model: env.gemini.transcribeModel,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'Transcribe this audio verbatim and identify the language being spoken. Respond in EXACTLY this ' +
                'two-line format and nothing else:\nLANGUAGE: <the English name of the spoken language, e.g. Hindi>\n' +
                'TRANSCRIPT: <the verbatim transcription, in its own script — do not translate or transliterate>\n' +
                'If the audio contains no discernible speech, respond with exactly:\nLANGUAGE: none\nTRANSCRIPT:',
            },
            { inlineData: { mimeType: bareMimeType, data: buffer.toString('base64') } },
          ],
        },
      ],
    });

    const raw = (response.text || '').trim();
    const detectedLanguage = mapDetectedLanguage(raw.match(/^LANGUAGE:\s*(.*)$/im)?.[1]);
    const text = (raw.match(/TRANSCRIPT:\s*([\s\S]*)$/i)?.[1] || '').trim();
    return { text, detectedLanguage };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Gemini transcription failed (file: ${filename}): ${message}`);
    throw ApiError.internal('Could not transcribe the audio. Please try again.');
  }
}

/** Synthesizes speech from text via Gemini, returning a playable WAV file. */
// Gemini's free-tier TTS quota is small (10 requests/day at the time of
// writing) and, once exhausted, every call fails the same way until the
// daily reset — so the same backoff idea applies here as for Groq below:
// after a rate-limit/quota error, stop attempting Gemini TTS for a while
// instead of paying for a doomed network round trip on every voice reply.
let geminiTtsRetryAt = 0;
const GEMINI_TTS_BACKOFF_MS = 5 * 60 * 1000;

function looksRateLimited(message: string): boolean {
  return message.includes('RESOURCE_EXHAUSTED') || message.includes('429');
}

async function geminiSynthesizeSpeech(text: string): Promise<Buffer> {
  if (Date.now() < geminiTtsRetryAt) {
    throw ApiError.internal('Speech synthesis is temporarily rate-limited. Please try again shortly.');
  }
  try {
    const response = await genai.models.generateContent({
      model: env.gemini.ttsModel,
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: env.gemini.ttsVoice } } },
      },
    });

    const base64Pcm = response.data;
    if (!base64Pcm) throw ApiError.internal('The AI service returned no audio.');

    // Gemini TTS returns headerless 16-bit PCM, not a ready-to-play file —
    // wrap it in a WAV header so every downstream consumer (Cloudinary,
    // <audio> tags) can play it directly.
    const pcm = Buffer.from(base64Pcm, 'base64');
    return pcmToWav(pcm, { sampleRate: TTS_SAMPLE_RATE, channels: 1, bitDepth: 16 });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    if (looksRateLimited(message)) {
      geminiTtsRetryAt = Date.now() + GEMINI_TTS_BACKOFF_MS;
      logger.warn(`Gemini TTS is rate-limited — pausing further attempts for ${GEMINI_TTS_BACKOFF_MS / 60000} minutes.`);
    }
    logger.error(`Gemini speech synthesis failed: ${message}`);
    throw ApiError.internal('Could not generate speech audio. Please try again.');
  }
}

// ---------------------------------------------------------------------------
// Groq implementation (fast text-only chat/JSON, fast transcription,
// optional TTS)
// ---------------------------------------------------------------------------

/** True if any message carries an image block — these calls must go to Gemini. */
function needsVision(messages: AiMessage[]): boolean {
  return messages.some((m) => Array.isArray(m.content) && m.content.some((b) => b.type === 'image_url'));
}

/** Flattens an AiMessage's content to plain text for Groq, which is text-only here by construction. */
function flattenText(content: string | AiContentBlock[]): string {
  if (typeof content === 'string') return content;
  return content
    .filter((b): b is Extract<AiContentBlock, { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

async function groqGenerateContent(messages: AiMessage[], jsonMode: boolean): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: env.groq.chatModel,
    messages: messages.map((m) => ({ role: m.role, content: flattenText(m.content) })),
    temperature: 0.4, // advisory answers should be fairly consistent, not creative
    // Groq's reasoning models default to spending time "thinking" before
    // answering; advisory replies don't need that, and skipping it is most
    // of where Groq's speed advantage over Gemini actually comes from.
    reasoning_effort: 'low',
    response_format: jsonMode ? { type: 'json_object' } : undefined,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error('Groq returned an empty response.');
  return text;
}

/** Transcribes audio via Groq's dedicated Whisper Large v3 Turbo endpoint. */
async function groqTranscribeAudio(buffer: Buffer, filename: string, mimetype: string): Promise<TranscriptionResult> {
  const bareMimeType = mimetype.split(';')[0].trim() || 'audio/webm';
  const file = await toFile(buffer, filename || 'audio.webm', { type: bareMimeType });

  // verbose_json (rather than plain 'text') also reports which language
  // Whisper actually heard, which is what lets the reply be pinned to
  // match the person's own speech instead of a hardcoded default. No
  // `language` hint is passed in — forcing one only helps when it's
  // correct, and biases transcription toward the wrong language when it's
  // not (e.g. someone speaking Marathi while the app's UI is in English).
  const transcription = await groq.audio.transcriptions.create({
    model: env.groq.whisperModel,
    file,
    response_format: 'verbose_json',
  });

  const result = transcription as unknown as { text?: string; language?: string };
  return { text: (result.text || '').trim(), detectedLanguage: mapDetectedLanguage(result.language) };
}

/** Synthesizes speech via Groq's Orpheus TTS. Returns a ready-to-play WAV — no PCM wrapping needed, unlike Gemini. */
async function groqSynthesizeSpeech(text: string): Promise<Buffer> {
  const response = await groq.audio.speech.create({
    model: env.groq.ttsModel,
    voice: env.groq.ttsVoice,
    input: text,
    response_format: 'wav',
  });

  return Buffer.from(await response.arrayBuffer());
}

// ---------------------------------------------------------------------------
// Router — the only exports the rest of the app talks to
// ---------------------------------------------------------------------------

async function routeGenerateContent(messages: AiMessage[], jsonMode: boolean): Promise<string> {
  if (needsVision(messages) || !isGroqConfigured) {
    return geminiGenerateContent(messages, jsonMode);
  }

  try {
    return await groqGenerateContent(messages, jsonMode);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Groq chat completion failed, falling back to Gemini: ${message}`);
    return geminiGenerateContent(messages, jsonMode);
  }
}

/** Plain-text reply — used for open-ended chat. Routes to Groq when configured, Gemini otherwise/on failure. */
export async function chatComplete(messages: AiMessage[]): Promise<string> {
  return routeGenerateContent(messages, false);
}

/**
 * Structured reply — used for every one-shot advisory type. Both providers'
 * JSON modes guarantee syntactically valid JSON, so a parse failure here
 * would mean something is genuinely wrong upstream, not a normal case to
 * design around.
 */
export async function chatCompleteJson<T>(messages: AiMessage[]): Promise<T> {
  const raw = await routeGenerateContent(messages, true);
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.error(`AI provider returned non-JSON despite JSON mode: ${raw.slice(0, 500)}`);
    throw ApiError.internal('The AI service returned a response we could not parse. Please try again.');
  }
}

/**
 * Transcribes an uploaded audio file to text. Tries Groq's Whisper Large v3
 * Turbo first when configured (purpose-built for this, and noticeably
 * faster than Gemini's multimodal workaround), falling back to Gemini on
 * any failure so a Groq outage or rate limit never breaks the voice
 * assistant outright.
 */
export async function transcribeAudio(buffer: Buffer, filename: string, mimetype: string): Promise<TranscriptionResult> {
  if (isGroqConfigured) {
    try {
      const result = await groqTranscribeAudio(buffer, filename, mimetype);
      if (result.text) return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`Groq transcription failed (file: ${filename}), falling back to Gemini: ${message}`);
    }
  }
  return geminiTranscribeAudio(buffer, filename, mimetype);
}

// Devanagari (Hindi/Marathi), Gurmukhi (Punjabi), and Gujarati script
// ranges. Groq's only TTS model (canopylabs/orpheus-v1-english) is
// English-only by name and design — sending it text in any of these
// scripts would produce garbled or silent audio, not a clear failure, so
// this is checked explicitly rather than trusting the env-configured
// provider blindly.
const NON_LATIN_SCRIPT = /[\u0900-\u097F\u0A00-\u0A7F\u0A80-\u0AFF]/;

// If Groq TTS fails with what looks like a persistent config problem (e.g.
// the account hasn't accepted a model's terms yet on console.groq.com — a
// 400, not a transient blip), retrying it on every subsequent voice reply
// just adds a wasted network round trip to each one while waiting on a
// response that will keep failing the same way. Back off for a while
// instead; this clears itself automatically once the account issue is
// fixed, without needing a server restart.
let groqTtsRetryAt = 0;
const GROQ_TTS_BACKOFF_MS = 10 * 60 * 1000;

function looksPersistent(err: unknown): boolean {
  const status = (err as { status?: number } | undefined)?.status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

/**
 * Synthesizes speech from text. Defaults to Gemini (free); set
 * AI_TTS_PROVIDER=groq to use Groq's Orpheus voices instead, which are more
 * expressive but billed per character and English-only. Falls back to
 * Gemini if the Groq call fails for any reason, or up front if the text
 * itself isn't in a script Orpheus can speak.
 */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const wantsGroq = env.groq.ttsProvider === 'groq' && isGroqConfigured && Date.now() >= groqTtsRetryAt;
  if (wantsGroq && NON_LATIN_SCRIPT.test(text)) {
    logger.warn('Skipping Groq TTS for non-Latin-script text (Orpheus is English-only); using Gemini instead.');
  } else if (wantsGroq) {
    try {
      return await groqSynthesizeSpeech(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`Groq speech synthesis failed, falling back to Gemini: ${message}`);
      if (looksPersistent(err)) {
        groqTtsRetryAt = Date.now() + GROQ_TTS_BACKOFF_MS;
        logger.warn(
          `Groq TTS looks misconfigured (likely unaccepted model terms — see console.groq.com) — ` +
            `pausing further attempts for ${GROQ_TTS_BACKOFF_MS / 60000} minutes so future voice replies don't ` +
            `each pay for a call that's going to fail the same way.`
        );
      }
    }
  }
  return geminiSynthesizeSpeech(text);
}
