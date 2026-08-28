// Shared language support for the AI Advisory Suite. Kept in sync with the
// frontend's src/locales supported languages, so a person's UI language
// selection can pin every AI tool's output — chat, voice, and every
// one-shot JSON advisory endpoint — to that language deterministically,
// rather than leaving it to the model to infer from the input alone.

export const LANGUAGE_CODES = ['en', 'hi', 'mr', 'pa', 'gu'] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
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
export function jsonLanguageInstruction(code?: LanguageCode): string {
  if (!code || code === 'en') return '';
  const name = LANGUAGE_NAMES[code];
  return (
    ` Write every human-readable string value in the JSON response (summary, recommendations, warnings, and any ` +
    `other text fields) in ${name} — do not answer in English. Keep the JSON keys themselves in English exactly ` +
    `as specified, since calling code parses them by name; only the text values change language.`
  );
}
