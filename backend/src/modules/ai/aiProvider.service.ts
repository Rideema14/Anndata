import type { Content, Part } from '@google/genai';
import genai from '../../config/gemini';
import { env } from '../../config/env';
import ApiError from '../../common/utils/ApiError';
import logger from '../../common/utils/logger';
import { pcmToWav } from '../../common/utils/wav';

export type AiContentBlock = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AiContentBlock[];
}

// Gemini's TTS models always return raw 16-bit PCM at this fixed rate — this
// isn't configurable per-request, it's just what the API produces.
const TTS_SAMPLE_RATE = 24000;

/**
 * Downloads an image and returns it as base64 inline data, since Gemini's
 * generateContent takes image bytes directly rather than a fetchable URL
 * (unlike OpenAI's image_url, which the model fetched server-side itself).
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

async function callGenerateContent(messages: AiMessage[], jsonMode: boolean): Promise<string> {
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

/** Plain-text reply — used for open-ended chat. */
export async function chatComplete(messages: AiMessage[]): Promise<string> {
  return callGenerateContent(messages, false);
}

/**
 * Structured reply — used for every one-shot advisory type. json_object mode
 * (responseMimeType: 'application/json') guarantees syntactically valid
 * JSON, so a parse failure here would mean something is genuinely wrong
 * upstream, not a normal case to design around.
 */
export async function chatCompleteJson<T>(messages: AiMessage[]): Promise<T> {
  const raw = await callGenerateContent(messages, true);
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.error(`Gemini returned non-JSON despite json_object mode: ${raw.slice(0, 500)}`);
    throw ApiError.internal('The AI service returned a response we could not parse. Please try again.');
  }
}

/**
 * Transcribes an uploaded audio file to text. Gemini has no dedicated
 * transcription endpoint (unlike OpenAI's Whisper) — audio is transcribed by
 * passing it as multimodal input to generateContent with an instruction to
 * transcribe verbatim. The mimetype from a browser recording often carries a
 * codec suffix (e.g. 'audio/webm;codecs=opus'), which Gemini doesn't expect,
 * so it's stripped down to the bare type.
 */
export async function transcribeAudio(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
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
                'Transcribe this audio verbatim. Reply with ONLY the spoken words as plain text — no preamble, ' +
                'no commentary, no quotation marks. If the audio contains no discernible speech, reply with ' +
                'nothing at all.',
            },
            { inlineData: { mimeType: bareMimeType, data: buffer.toString('base64') } },
          ],
        },
      ],
    });

    return (response.text || '').trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Gemini transcription failed (file: ${filename}): ${message}`);
    throw ApiError.internal('Could not transcribe the audio. Please try again.');
  }
}

/** Synthesizes speech from text, returning raw MP3-equivalent audio bytes as a playable WAV file. */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
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

    // Gemini TTS returns headerless 16-bit PCM, not a ready-to-play file like
    // OpenAI's MP3 was — wrap it in a WAV header so every downstream
    // consumer (Cloudinary, <audio> tags) can play it directly.
    const pcm = Buffer.from(base64Pcm, 'base64');
    return pcmToWav(pcm, { sampleRate: TTS_SAMPLE_RATE, channels: 1, bitDepth: 16 });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Gemini speech synthesis failed: ${message}`);
    throw ApiError.internal('Could not generate speech audio. Please try again.');
  }
}
