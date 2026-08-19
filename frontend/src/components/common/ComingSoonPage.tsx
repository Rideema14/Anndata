import type { LucideIcon } from 'lucide-react'
import { Construction } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface ComingSoonPageProps {
  title: string
  description: string
  phase: number
  icon?: LucideIcon
}

/**
 * Placeholder for routes that exist in the route map (so navigation and
 * deep links never 404) but whose real screen hasn't been built yet.
 * Each one is labeled with the implementation phase from the project plan,
 * so it doubles as a visible build roadmap rather than a dead end.
 */
export function ComingSoonPage({ title, description, phase, icon: Icon = Construction }: ComingSoonPageProps) {
  const { t } = useLanguage()
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="h-8 w-8" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <h1 className="text-xl">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">{description}</p>
      <span className="mt-5 inline-flex items-center rounded-full bg-surface-sunk px-3 py-1 text-xs font-medium text-ink-500">
        Phase {phase} · {t('common.comingInNextPhase')}
      </span>
    </div>
  )
}
