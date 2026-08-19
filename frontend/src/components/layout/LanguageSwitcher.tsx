import { useEffect, useRef, useState } from 'react'
import { Check, Globe } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, supportedLanguages, plannedLanguages, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const current = supportedLanguages.find((l) => l.code === language)

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('common.language')}
        className="flex h-10 items-center gap-1.5 rounded-full border border-ink-100 bg-surface px-3 text-sm font-medium text-ink-700 hover:border-brand-300 hover:text-brand-700"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span>{current?.nativeLabel ?? 'English'}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-ink-100 bg-surface py-1 shadow-float"
        >
          <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
            {t('common.language')}
          </p>
          {supportedLanguages.map((option) => (
            <button
              key={option.code}
              type="button"
              role="menuitemradio"
              aria-checked={option.code === language}
              onClick={() => {
                setLanguage(option.code)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-ink-700 hover:bg-surface-sunk"
            >
              <span>
                {option.nativeLabel}
                {option.nativeLabel !== option.label && (
                  <span className="ml-1.5 text-ink-400">· {option.label}</span>
                )}
              </span>
              {option.code === language && <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />}
            </button>
          ))}
          <div className="my-1 border-t border-ink-100" />
          <p className="px-3 pt-1 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Coming soon
          </p>
          {plannedLanguages.map((option) => (
            <div
              key={option.code}
              aria-disabled="true"
              className="flex w-full cursor-not-allowed items-center justify-between px-3 py-1.5 text-sm text-ink-300"
            >
              <span>{option.nativeLabel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
