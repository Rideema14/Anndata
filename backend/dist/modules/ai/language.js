"use strict";
// Shared language support for the AI Advisory Suite. Kept in sync with the
// frontend's src/locales supported languages, so a person's UI language
// selection can pin every AI tool's output — chat, voice, and every
// one-shot JSON advisory endpoint — to that language deterministically,
// rather than leaving it to the model to infer from the input alone.
Object.defineProperty(exports, "__esModule", { value: true });
exports.LANGUAGE_NAMES = exports.LANGUAGE_CODES = void 0;
exports.jsonLanguageInstruction = jsonLanguageInstruction;
exports.LANGUAGE_CODES = ['en', 'hi', 'mr', 'pa', 'gu'];
exports.LANGUAGE_NAMES = {
    en: 'English',
    hi: 'Hindi (हिन्दी, Devanagari script)',
    mr: 'Marathi (मराठी, Devanagari script)',
    pa: 'Punjabi (ਪੰਜਾਬੀ, Gurmukhi script)',
    gu: 'Gujarati (ગુજરાતી, Gujarati script)',
};
/**
 * Instruction appended to a JSON-mode advisory prompt (crop advisor,
 * fertilizer/irrigation/crop-rotation advice, disease detection, soil
 * analysis) so every human-readable string VALUE in the response comes
 * back in the target language while the JSON keys — which calling code
 * parses by name — stay in English. Returns '' for English/omitted, since
 * English is already the model's default and needs no extra instruction.
 */
function jsonLanguageInstruction(code) {
    if (!code || code === 'en')
        return '';
    const name = exports.LANGUAGE_NAMES[code];
    return (` Write every human-readable string value in the JSON response (summary, recommendations, warnings, and any ` +
        `other text fields) in ${name} — do not answer in English. Keep the JSON keys themselves in English exactly ` +
        `as specified, since calling code parses them by name; only the text values change language.`);
}
//# sourceMappingURL=language.js.map