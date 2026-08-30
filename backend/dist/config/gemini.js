"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// AI Farm Advisory Suite runs on Google's Gemini API — one free key covers
// chat + vision (generateContent with inline image data), audio input for
// transcription, and TTS for voice replies, which is why a single client
// here replaces what OpenAI needed a dedicated Chat Completions client plus
// separate transcription/TTS calls for. See config/env.ts for the free-tier
// notes and how to get a key. The `@google/genai` package ships its own
// TypeScript types, so no local .d.ts is needed here (unlike razorpay).
const genai_1 = require("@google/genai");
const env_1 = require("./env");
const genai = new genai_1.GoogleGenAI({ apiKey: env_1.env.gemini.apiKey });
exports.default = genai;
//# sourceMappingURL=gemini.js.map