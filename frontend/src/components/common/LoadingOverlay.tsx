import { Sprout } from 'lucide-react'

interface LoadingOverlayProps {
  isLoading: boolean
  title?: string
  message?: string
  fullScreen?: boolean
}

export function LoadingOverlay({
  isLoading,
  title = 'Processing…',
  message = 'Please wait while we process your request.',
  fullScreen = true,
}: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className={`
        z-50 flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in
        ${
          fullScreen
            ? 'fixed inset-0 bg-ink-900/30 backdrop-blur-md'
            : 'absolute inset-0 rounded-2xl bg-surface/80 backdrop-blur-sm'
        }
      `}
    >
      <div className="flex w-full max-w-xs flex-col items-center justify-center rounded-3xl border border-white/40 bg-surface/95 p-6 text-center shadow-float backdrop-blur-lg">
        {/* Animated Brand Pulse Spinner */}
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-brand-400/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-3 border-brand-100 border-t-brand-600 border-r-gold-500" />
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600 shadow-inner">
            <Sprout className="h-6 w-6 animate-pulse" />
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-extrabold text-ink-900">{title}</h3>
        <p className="mt-1 text-xs text-ink-500">{message}</p>

        {/* Progress Bar / Indicator */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div className="h-full w-full origin-left animate-pulse rounded-full bg-gradient-to-r from-brand-500 via-gold-400 to-brand-600" />
        </div>
      </div>
    </div>
  )
}
