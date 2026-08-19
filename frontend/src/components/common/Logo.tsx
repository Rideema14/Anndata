import { cn } from '@/utils/cn'

interface LogoProps {
  className?: string
  showWordmark?: boolean
}

export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 64 64" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="var(--color-brand-600)" />
        <g fill="var(--color-gold-400)">
          <line x1="32" y1="50" x2="32" y2="16" stroke="var(--color-gold-400)" strokeWidth="3" />
          <ellipse cx="27.2" cy="41" rx="6.4" ry="3.6" />
          <ellipse cx="36.8" cy="41" rx="6.4" ry="3.6" />
          <ellipse cx="27.9" cy="32" rx="5.2" ry="2.9" />
          <ellipse cx="36.1" cy="32" rx="5.2" ry="2.9" />
          <ellipse cx="28.6" cy="24" rx="3.9" ry="2.2" />
          <ellipse cx="35.4" cy="24" rx="3.9" ry="2.2" />
          <circle cx="32" cy="14.5" r="2.6" />
        </g>
      </svg>
      {showWordmark && (
        <span className="font-display text-lg font-extrabold tracking-tight text-ink-900">Aandata</span>
      )}
    </span>
  )
}
