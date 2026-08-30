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
exports.handleVoiceQuery = handleVoiceQuery;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const logger_1 = __importDefault(require("../../common/utils/logger"));
const aiProvider_service_1 = require("./aiProvider.service");
const chatSessionService = __importStar(require("./chatSession.service"));
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
async function handleVoiceQuery(userId, fileBuffer, filename, mimetype, sessionId, synthesizeReply, explicitLanguage) {
    const { text: transcript, detectedLanguage } = await (0, aiProvider_service_1.transcribeAudio)(fileBuffer, filename, mimetype);
    if (!transcript.trim()) {
        throw ApiError_1.default.badRequest('Could not detect any speech in the audio.');
    }
    const replyLanguage = detectedLanguage ?? explicitLanguage;
    let activeSessionId;
    if (sessionId) {
        const owned = await prisma_1.default.aiChatSession.findFirst({ where: { id: sessionId, userId } });
        if (!owned)
            throw ApiError_1.default.notFound('Chat session not found.');
        activeSessionId = sessionId;
    }
    else {
        const session = await chatSessionService.createSession(userId);
        activeSessionId = session.id;
    }
    const { assistantMessage } = await chatSessionService.sendMessage(userId, activeSessionId, transcript, replyLanguage);
    let replyAudioUrl;
    if (synthesizeReply) {
        try {
            const audioBuffer = await (0, aiProvider_service_1.synthesizeSpeech)(assistantMessage.content);
            // Returned inline as a data URI rather than uploaded to Cloudinary first.
            // The person is actively waiting on this response — for a live voice
            // reply, skipping the extra upload-then-fetch round trip is the single
            // biggest latency win available here, and the reply is ephemeral by
            // nature (nobody re-visits a past spoken answer by URL), so there's no
            // real loss from not persisting it to cloud storage.
            replyAudioUrl = `data:audio/wav;base64,${audioBuffer.toString('base64')}`;
        }
        catch (err) {
            // A TTS outage (rate limits, an unaccepted model's terms, etc.) must
            // never take down the whole reply — transcription and the actual
            // answer already succeeded by this point. Log it and hand back a
            // text-only reply instead of failing the request; the person still
            // gets their answer, just without spoken playback this one time.
            const message = err instanceof Error ? err.message : String(err);
            logger_1.default.warn(`Speech synthesis failed for a voice reply — returning text-only instead of failing the request: ${message}`);
        }
    }
    return { transcript, replyText: assistantMessage.content, replyAudioUrl, sessionId: activeSessionId };
}
//# sourceMappingURL=voice.service.js.map