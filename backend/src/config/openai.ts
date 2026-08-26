// AI Farm Advisory Suite runs on OpenAI (Chat Completions for text + vision,
// separate Whisper-family transcription and TTS endpoints for voice) —
// deliberately the older, "supported indefinitely" Chat Completions surface
// rather than OpenAI's newer Responses API, since this project's knowledge
// of the exact newer request/response shape is much less reliable than its
// knowledge of Chat Completions, which has been stable for years. The
// `openai` package ships its own TypeScript types, so no local .d.ts is
// needed here (unlike razorpay).
import OpenAI from 'openai';
import { env } from './env';

const openai = new OpenAI({ apiKey: env.openai.apiKey });

export default openai;
