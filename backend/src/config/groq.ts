// AI Farm Advisory Suite also runs select tasks on Groq's LPU inference —
// not instead of Gemini, but alongside it. Groq is dramatically faster for
// pure-text work (openai/gpt-oss-120b runs at roughly 500 tokens/sec vs.
// Gemini Flash's typical throughput) and ships a purpose-built
// speech-to-text endpoint (Whisper Large v3 Turbo) instead of Gemini's
// "feed audio into a text model and hope" workaround. For a farmer-facing
// voice assistant, that speed difference is the gap between a reply that
// feels instant and one that feels like a satellite phone call. See
// aiProvider.service.ts for exactly which tasks route here vs. to Gemini
// (short version: text chat/advisory and voice transcription go to Groq;
// image-based disease detection stays on Gemini, since Groq's only
// multimodal model is a preview model Groq itself says isn't meant for
// production).
//
// Groq is optional, not required: GROQ_API_KEY is deliberately absent from
// env.ts's REQUIRED_VARS, so the app runs fine on Gemini alone if it's never
// set — every caller checks isGroqConfigured first, and aiProvider.service.ts
// falls back to Gemini automatically if a Groq call fails for any reason
// (rate limit, outage, etc). Get a free key (no card required) at
// https://console.groq.com/keys. The `groq-sdk` package ships its own
// TypeScript types, so no local .d.ts is needed here (unlike razorpay).
import Groq from 'groq-sdk';
import { env } from './env';

export const isGroqConfigured = Boolean(env.groq.apiKey);

// Constructed even when no key is present so this module never crashes on
// import — every exported function in aiProvider.service.ts checks
// isGroqConfigured before touching this client, so the placeholder key is
// never actually sent in a request.
const groq = new Groq({ apiKey: env.groq.apiKey || 'unset' });

export default groq;
