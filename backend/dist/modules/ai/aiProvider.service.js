"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatComplete = chatComplete;
exports.chatCompleteJson = chatCompleteJson;
exports.transcribeAudio = transcribeAudio;
exports.synthesizeSpeech = synthesizeSpeech;
const groq_sdk_1 = require("groq-sdk");
const gemini_1 = __importDefault(require("../../config/gemini"));
const groq_1 = __importStar(require("../../config/groq"));
const env_1 = require("../../config/env");
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const logger_1 = __importDefault(require("../../common/utils/logger"));
const wav_1 = require("../../common/utils/wav");
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
async function urlToInlineImage(url) {
    let res;
    try {
        res = await fetch(url);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger_1.default.error(`Failed to download image for AI analysis: ${message}`);
        throw ApiError_1.default.internal('Could not load the image for AI analysis.');
    }
    if (!res.ok)
        throw ApiError_1.default.internal('Could not load the image for AI analysis.');
    const mimeType = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
    const data = Buffer.from(await res.arrayBuffer()).toString('base64');
    return { inlineData: { mimeType, data } };
}
/** Converts one AiMessage's content into Gemini Parts. */
async function toGeminiParts(content) {
    if (typeof content === 'string')
        return [{ text: content }];
    const parts = [];
    for (const block of content) {
        if (block.type === 'text') {
            parts.push({ text: block.text });
        }
        else {
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
async function toGeminiRequest(messages) {
    let systemInstruction;
    const contents = [];
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
async function geminiGenerateContent(messages, jsonMode) {
    try {
        const { systemInstruction, contents } = await toGeminiRequest(messages);
        const response = await gemini_1.default.models.generateContent({
            model: env_1.env.gemini.model,
            contents,
            config: {
                systemInstruction,
                temperature: 0.4, // advisory answers should be fairly consistent, not creative
                responseMimeType: jsonMode ? 'application/json' : undefined,
            },
        });
        const text = response.text;
        if (!text)
            throw ApiError_1.default.internal('The AI service returned an empty response.');
        return text;
    }
    catch (err) {
        if (err instanceof ApiError_1.default)
            throw err;
        const message = err instanceof Error ? err.message : String(err);
        logger_1.default.error(`Gemini generateContent failed: ${message}`);
        throw ApiError_1.default.internal('The AI advisory service is temporarily unavailable. Please try again shortly.');
    }
}
// Whisper (and the prompt asked of Gemini below) report the detected
// language as its English name (e.g. "Hindi"), not an ISO code — this maps
// that back to our internal codes. Anything outside these five (Bengali,
// Tamil, Urdu, etc.) is left undetected rather than mismapped; the model's
// own "reply in whatever language you were spoken to in" instruction still
// covers it, just without a deterministic pin.
const LANGUAGE_NAME_TO_CODE = {
    english: 'en',
    hindi: 'hi',
    marathi: 'mr',
    punjabi: 'pa',
    gujarati: 'gu',
};
function mapDetectedLanguage(name) {
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
async function geminiTranscribeAudio(buffer, filename, mimetype) {
    try {
        const bareMimeType = mimetype.split(';')[0].trim() || 'audio/webm';
        const response = await gemini_1.default.models.generateContent({
            model: env_1.env.gemini.transcribeModel,
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: 'Transcribe this audio verbatim and identify the language being spoken. Respond in EXACTLY this ' +
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
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger_1.default.error(`Gemini transcription failed (file: ${filename}): ${message}`);
        throw ApiError_1.default.internal('Could not transcribe the audio. Please try again.');
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
function looksRateLimited(message) {
    return message.includes('RESOURCE_EXHAUSTED') || message.includes('429');
}
async function geminiSynthesizeSpeech(text) {
    if (Date.now() < geminiTtsRetryAt) {
        throw ApiError_1.default.internal('Speech synthesis is temporarily rate-limited. Please try again shortly.');
    }
    try {
        const response = await gemini_1.default.models.generateContent({
            model: env_1.env.gemini.ttsModel,
            contents: [{ role: 'user', parts: [{ text }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: env_1.env.gemini.ttsVoice } } },
            },
        });
        const base64Pcm = response.data;
        if (!base64Pcm)
            throw ApiError_1.default.internal('The AI service returned no audio.');
        // Gemini TTS returns headerless 16-bit PCM, not a ready-to-play file —
        // wrap it in a WAV header so every downstream consumer (Cloudinary,
        // <audio> tags) can play it directly.
        const pcm = Buffer.from(base64Pcm, 'base64');
        return (0, wav_1.pcmToWav)(pcm, { sampleRate: TTS_SAMPLE_RATE, channels: 1, bitDepth: 16 });
    }
    catch (err) {
        if (err instanceof ApiError_1.default)
            throw err;
        const message = err instanceof Error ? err.message : String(err);
        if (looksRateLimited(message)) {
            geminiTtsRetryAt = Date.now() + GEMINI_TTS_BACKOFF_MS;
            logger_1.default.warn(`Gemini TTS is rate-limited — pausing further attempts for ${GEMINI_TTS_BACKOFF_MS / 60000} minutes.`);
        }
        logger_1.default.error(`Gemini speech synthesis failed: ${message}`);
        throw ApiError_1.default.internal('Could not generate speech audio. Please try again.');
    }
}
// ---------------------------------------------------------------------------
// Groq implementation (fast text-only chat/JSON, fast transcription,
// optional TTS)
// ---------------------------------------------------------------------------
/** True if any message carries an image block — these calls must go to Gemini. */
function needsVision(messages) {
    return messages.some((m) => Array.isArray(m.content) && m.content.some((b) => b.type === 'image_url'));
}
/** Flattens an AiMessage's content to plain text for Groq, which is text-only here by construction. */
function flattenText(content) {
    if (typeof content === 'string')
        return content;
    return content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
}
async function groqGenerateContent(messages, jsonMode) {
    const completion = await groq_1.default.chat.completions.create({
        model: env_1.env.groq.chatModel,
        messages: messages.map((m) => ({ role: m.role, content: flattenText(m.content) })),
        temperature: 0.4, // advisory answers should be fairly consistent, not creative
        // Groq's reasoning models default to spending time "thinking" before
        // answering; advisory replies don't need that, and skipping it is most
        // of where Groq's speed advantage over Gemini actually comes from.
        reasoning_effort: 'low',
        response_format: jsonMode ? { type: 'json_object' } : undefined,
    });
    const text = completion.choices[0]?.message?.content;
    if (!text)
        throw new Error('Groq returned an empty response.');
    return text;
}
/** Transcribes audio via Groq's dedicated Whisper Large v3 Turbo endpoint. */
async function groqTranscribeAudio(buffer, filename, mimetype) {
    const bareMimeType = mimetype.split(';')[0].trim() || 'audio/webm';
    const file = await (0, groq_sdk_1.toFile)(buffer, filename || 'audio.webm', { type: bareMimeType });
    // verbose_json (rather than plain 'text') also reports which language
    // Whisper actually heard, which is what lets the reply be pinned to
    // match the person's own speech instead of a hardcoded default. No
    // `language` hint is passed in — forcing one only helps when it's
    // correct, and biases transcription toward the wrong language when it's
    // not (e.g. someone speaking Marathi while the app's UI is in English).
    const transcription = await groq_1.default.audio.transcriptions.create({
        model: env_1.env.groq.whisperModel,
        file,
        response_format: 'verbose_json',
    });
    const result = transcription;
    return { text: (result.text || '').trim(), detectedLanguage: mapDetectedLanguage(result.language) };
}
/** Synthesizes speech via Groq's Orpheus TTS. Returns a ready-to-play WAV — no PCM wrapping needed, unlike Gemini. */
async function groqSynthesizeSpeech(text) {
    const response = await groq_1.default.audio.speech.create({
        model: env_1.env.groq.ttsModel,
        voice: env_1.env.groq.ttsVoice,
        input: text,
        response_format: 'wav',
    });
    return Buffer.from(await response.arrayBuffer());
}
// ---------------------------------------------------------------------------
// Router — the only exports the rest of the app talks to
// ---------------------------------------------------------------------------
async function routeGenerateContent(messages, jsonMode) {
    if (needsVision(messages) || !groq_1.isGroqConfigured) {
        return geminiGenerateContent(messages, jsonMode);
    }
    try {
        return await groqGenerateContent(messages, jsonMode);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger_1.default.warn(`Groq chat completion failed, falling back to Gemini: ${message}`);
        return geminiGenerateContent(messages, jsonMode);
    }
}
/** Plain-text reply — used for open-ended chat. Routes to Groq when configured, Gemini otherwise/on failure. */
async function chatComplete(messages) {
    return routeGenerateContent(messages, false);
}
/**
 * Structured reply — used for every one-shot advisory type. Both providers'
 * JSON modes guarantee syntactically valid JSON, so a parse failure here
 * would mean something is genuinely wrong upstream, not a normal case to
 * design around.
 */
async function chatCompleteJson(messages) {
    const raw = await routeGenerateContent(messages, true);
    try {
        return JSON.parse(raw);
    }
    catch (err) {
        logger_1.default.error(`AI provider returned non-JSON despite JSON mode: ${raw.slice(0, 500)}`);
        throw ApiError_1.default.internal('The AI service returned a response we could not parse. Please try again.');
    }
}
/**
 * Transcribes an uploaded audio file to text. Tries Groq's Whisper Large v3
 * Turbo first when configured (purpose-built for this, and noticeably
 * faster than Gemini's multimodal workaround), falling back to Gemini on
 * any failure so a Groq outage or rate limit never breaks the voice
 * assistant outright.
 */
async function transcribeAudio(buffer, filename, mimetype) {
    if (groq_1.isGroqConfigured) {
        try {
            const result = await groqTranscribeAudio(buffer, filename, mimetype);
            if (result.text)
                return result;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger_1.default.warn(`Groq transcription failed (file: ${filename}), falling back to Gemini: ${message}`);
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
function looksPersistent(err) {
    const status = err?.status;
    return typeof status === 'number' && status >= 400 && status < 500;
}
/**
 * Synthesizes speech from text. Defaults to Gemini (free); set
 * AI_TTS_PROVIDER=groq to use Groq's Orpheus voices instead, which are more
 * expressive but billed per character and English-only. Falls back to
 * Gemini if the Groq call fails for any reason, or up front if the text
 * itself isn't in a script Orpheus can speak.
 */
async function synthesizeSpeech(text) {
    const wantsGroq = env_1.env.groq.ttsProvider === 'groq' && groq_1.isGroqConfigured && Date.now() >= groqTtsRetryAt;
    if (wantsGroq && NON_LATIN_SCRIPT.test(text)) {
        logger_1.default.warn('Skipping Groq TTS for non-Latin-script text (Orpheus is English-only); using Gemini instead.');
    }
    else if (wantsGroq) {
        try {
            return await groqSynthesizeSpeech(text);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger_1.default.warn(`Groq speech synthesis failed, falling back to Gemini: ${message}`);
            if (looksPersistent(err)) {
                groqTtsRetryAt = Date.now() + GROQ_TTS_BACKOFF_MS;
                logger_1.default.warn(`Groq TTS looks misconfigured (likely unaccepted model terms — see console.groq.com) — ` +
                    `pausing further attempts for ${GROQ_TTS_BACKOFF_MS / 60000} minutes so future voice replies don't ` +
                    `each pay for a call that's going to fail the same way.`);
            }
        }
    }
    return geminiSynthesizeSpeech(text);
}
//# sourceMappingURL=aiProvider.service.js.map