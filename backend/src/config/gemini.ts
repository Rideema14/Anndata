// AI Farm Advisory Suite runs on Google's Gemini API — one free key covers
// chat + vision (generateContent with inline image data), audio input for
// transcription, and TTS for voice replies, which is why a single client
// here replaces what OpenAI needed a dedicated Chat Completions client plus
// separate transcription/TTS calls for. See config/env.ts for the free-tier
// notes and how to get a key. The `@google/genai` package ships its own
// TypeScript types, so no local .d.ts is needed here (unlike razorpay).
import { GoogleGenAI } from '@google/genai';
import { env } from './env';

const genai = new GoogleGenAI({ apiKey: env.gemini.apiKey });

export default genai;
