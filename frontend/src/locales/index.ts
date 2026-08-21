import en from './en.json'
import hi from './hi.json'
import mr from './mr.json'
import pa from './pa.json'
import gu from './gu.json'

export type TranslationShape = typeof en

/** Languages with a complete translation file today. */
export const translations: Record<string, TranslationShape> = {
  en,
  hi,
  mr,
  pa,
  gu,
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