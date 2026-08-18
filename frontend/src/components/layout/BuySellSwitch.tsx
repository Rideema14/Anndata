import { ShoppingBasket, Store } from 'lucide-react'
import { useAppMode } from '@/context/AppModeContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'

interface BuySellSwitchProps {
  className?: string
  /** Compact renders icon-only segments for tight header space on mobile. */
  compact?: boolean
}

/**
 * Switching modes changes which set of tools is visible (buyer tools vs.
 * seller tools) — it never signs the user out and never implies a
 * different account. Only rendered for users with the seller role; buyers
 * without seller access see a "Become a Seller" CTA instead (see Header).
 */
export function BuySellSwitch({ className, compact = false }: BuySellSwitchProps) {
  const { mode, setMode } = useAppMode()
  const { t } = useLanguage()

  return (
    <div
      role="group"
      aria-label="Buy or sell mode"
      className={cn(
        'relative inline-flex items-center rounded-full bg-surface-sunk p-1',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-1 bottom-1 rounded-full shadow-card transition-transform duration-200 ease-out',
          compact ? 'w-[calc(50%-4px)]' : 'w-[calc(50%-4px)]',
          mode === 'buy' ? 'translate-x-0 bg-brand-600' : 'translate-x-[calc(100%)] bg-gold-400',
        )}
        style={{ left: '4px', right: '4px' }}
      />
      <button
        type="button"
        onClick={() => setMode('buy')}
        aria-pressed={mode === 'buy'}
        aria-label={t('mode.switchToBuy')}
        className={cn(
          ' ml-3.5 relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
          mode === 'buy' ? 'text-white' : 'text-ink-500',
        )}
      >
        <ShoppingBasket className="h-4 w-4" aria-hidden="true" />
        {!compact && t('mode.buy')}
      </button>
      <button
        type="button"
        onClick={() => setMode('sell')}
        aria-pressed={mode === 'sell'}
        aria-label={t('mode.switchToSell')}
        className={cn(
          ' ml-6 relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
          mode === 'sell' ? 'text-white' : 'text-ink-500',
        )}
      >
        <Store className="h-4 w-4" aria-hidden="true" />
        {!compact && t('mode.sell')}
      </button>
    </div>
  )
}