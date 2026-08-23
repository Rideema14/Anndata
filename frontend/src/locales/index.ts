import en from './en.json'

export type TranslationShape = typeof en

/** Languages with a complete translation file today. English ships in the
 *  main bundle since it's the default; the rest are fetched on demand via
 *  loadTranslation() so a visitor never downloads 4 languages they didn't
 *  ask for. */
export const translations: Partial<Record<string, TranslationShape>> = {
  en,
}

const loaders: Record<string, () => Promise<{ default: TranslationShape }>> = {
  hi: () => import('./hi.json'),
  mr: () => import('./mr.json'),
  pa: () => import('./pa.json'),
  gu: () => import('./gu.json'),
}

/** Fetches and caches a language's translation file the first time it's
 *  needed (language switch or a stored preference on load). Resolves
 *  immediately from cache on subsequent calls. */
export async function loadTranslation(code: string): Promise<TranslationShape | null> {
  if (translations[code]) return translations[code]!
  const loader = loaders[code]
  if (!loader) return null
  const mod = await loader()
  translations[code] = mod.default
  return mod.default
}

export interface LanguageOption {
  code: string
  label: string
  nativeLabel: string
}

/** Fully supported — selectable anywhere in the product today. */
export const supportedLanguages: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
]

/**
 * Planned for future translation files (src/locales/<code>.json).
 * Shown in the language picker as "coming soon" so the architecture and
 * the UI both make room for them without requiring a redesign later.
 */
export const plannedLanguages: LanguageOption[] = [
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
]

export const DEFAULT_LANGUAGE = 'en'