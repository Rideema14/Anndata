import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_LANGUAGE,
  plannedLanguages,
  supportedLanguages,
  translations,
  type TranslationShape,
} from '@/locales'

const STORAGE_KEY = 'aandata.language'

// Builds a union of dot-delimited paths into the translation object, e.g.
// "nav.home" | "common.search" | ... — gives autocomplete + compile-time
// safety on every t() call across the whole app.
type Join<K extends string, P extends string> = P extends '' ? K : `${K}.${P}`
type PathsOf<T> = {
  [K in keyof T & string]: T[K] extends object ? Join<K, PathsOf<T[K]>> : K
}[keyof T & string]
export type TranslationKey = PathsOf<TranslationShape>

function resolvePath(obj: unknown, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in acc) {
      return (acc as Record<string, unknown>)[segment]
    }
    return undefined
  }, obj)
  return typeof value === 'string' ? value : path
}

interface LanguageContextValue {
  language: string
  setLanguage: (code: string) => void
  t: (key: TranslationKey) => string
  supportedLanguages: typeof supportedLanguages
  plannedLanguages: typeof plannedLanguages
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getInitialLanguage(): string {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored && translations[stored]) return stored
  return DEFAULT_LANGUAGE
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(getInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    window.localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  const setLanguage = useCallback((code: string) => {
    if (!translations[code]) return // not yet translated — picker marks these "coming soon"
    setLanguageState(code)
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => {
      const table = translations[language] ?? translations[DEFAULT_LANGUAGE]
      const value = resolvePath(table, key)
      if (value === key) {
        // fall back to English rather than showing a raw dotted key
        return resolvePath(translations[DEFAULT_LANGUAGE], key)
      }
      return value
    },
    [language],
  )

  const value = useMemo(
    () => ({ language, setLanguage, t, supportedLanguages, plannedLanguages }),
    [language, setLanguage, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
