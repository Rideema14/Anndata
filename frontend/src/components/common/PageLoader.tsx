import { Sprout } from 'lucide-react'

export function PageLoader() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 px-6 text-center" role="status" aria-live="polite">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-brand-400/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-3 border-brand-100 border-t-brand-600 border-r-gold-500" />
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600 shadow-inner">
          <Sprout className="h-6 w-6 animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-bold text-ink-800">Loading FarmVerse…</span>
        <span className="text-xs text-ink-400">Fetching latest market data</span>
      </div>
    </div>
  )
}
