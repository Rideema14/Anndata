import { ShoppingBasket, Store } from 'lucide-react'
import { useAppMode } from '@/context/AppModeContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'

interface BuySellSwitchProps {
  className?: string
<<<<<<< HEAD
  compact?: boolean
}

export function BuySellSwitch({
  className,
  compact = false,
}: BuySellSwitchProps) {
  const { mode, setMode } = useAppMode()
  const { t } = useLanguage()

  /*
   * MOBILE COMPACT VERSION
   * ----------------------
   * Small pill containing only the two icons.
   *
   * Desktop keeps the normal Buy / Sell text.
   */

  if (compact) {
    return (
      <div
        role="group"
        aria-label="Buy or sell mode"
        className={cn(
          `
            relative
            inline-flex
            h-10
            w-[64px]
            shrink-0
            items-center
            rounded-full
            bg-[#E9E7DF]
            p-1
          `,
          className,
        )}
      >
        {/* Sliding active background */}

        <span
          aria-hidden="true"
          className={cn(
            `
              absolute
              left-1
              top-1
              h-8
              w-[27px]
              rounded-full
              shadow-sm
              transition-transform
              duration-300
              ease-out
            `,
            mode === 'buy'
              ? 'translate-x-0 bg-[#647452]'
              : 'translate-x-[30px] bg-[#C9A85C]',
          )}
        />

        {/* BUY */}

        <button
          type="button"
          onClick={() => setMode('buy')}
          aria-pressed={mode === 'buy'}
          aria-label={t('mode.switchToBuy')}
          className={cn(
            `
              relative
              z-10
              flex
              h-8
              w-[27px]
              shrink-0
              items-center
              justify-center
              rounded-full
              transition-all
              duration-200
              active:scale-90
            `,
            mode === 'buy'
              ? 'text-white'
              : 'text-[#74746C]',
          )}
        >
          <ShoppingBasket
            className="h-[15px] w-[15px]"
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        {/* SELL */}

        <button
          type="button"
          onClick={() => setMode('sell')}
          aria-pressed={mode === 'sell'}
          aria-label={t('mode.switchToSell')}
          className={cn(
            `
              relative
              z-10
              flex
              h-8
              w-[27px]
              shrink-0
              items-center
              justify-center
              rounded-full
              transition-all
              duration-200
              active:scale-90
            `,
            mode === 'sell'
              ? 'text-[#252A20]'
              : 'text-[#74746C]',
          )}
        >
          <Store
            className="h-[15px] w-[15px]"
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>
      </div>
    )
  }

  /*
   * DESKTOP VERSION
   * ----------------
   * Keep the normal full Buy / Sell switch.
   */

=======
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

>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
  return (
    <div
      role="group"
      aria-label="Buy or sell mode"
      className={cn(
<<<<<<< HEAD
        `
          relative
          inline-flex
          items-center
          rounded-full
          bg-[#E9E7DF]
          p-1
        `,
=======
        'relative inline-flex items-center rounded-full bg-surface-sunk p-1',
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
<<<<<<< HEAD
          `
            absolute
            bottom-1
            left-1
            top-1
            w-[calc(50%-4px)]
            rounded-full
            shadow-sm
            transition-transform
            duration-300
            ease-out
          `,
          mode === 'buy'
            ? 'translate-x-0 bg-[#647452]'
            : 'translate-x-[calc(100%)] bg-[#C9A85C]',
        )}
      />

=======
          'absolute top-1 bottom-1 rounded-full shadow-card transition-transform duration-200 ease-out',
          compact ? 'w-[calc(50%-4px)]' : 'w-[calc(50%-4px)]',
          mode === 'buy' ? 'translate-x-0 bg-brand-600' : 'translate-x-[calc(100%)] bg-gold-400',
        )}
        style={{ left: '4px', right: '4px' }}
      />
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
      <button
        type="button"
        onClick={() => setMode('buy')}
        aria-pressed={mode === 'buy'}
        aria-label={t('mode.switchToBuy')}
        className={cn(
<<<<<<< HEAD
          `
            relative
            z-10
            flex
            items-center
            justify-center
            gap-1.5
            rounded-full
            px-4
            py-1.5
            text-sm
            font-semibold
            transition-colors
          `,
          mode === 'buy'
            ? 'text-white'
            : 'text-[#74746C]',
        )}
      >
        <ShoppingBasket
          className="h-4 w-4"
          aria-hidden="true"
        />

        {t('mode.buy')}
      </button>

=======
          ' ml-3.5 relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
          mode === 'buy' ? 'text-white' : 'text-ink-500',
        )}
      >
        <ShoppingBasket className="h-4 w-4" aria-hidden="true" />
        {!compact && t('mode.buy')}
      </button>
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
      <button
        type="button"
        onClick={() => setMode('sell')}
        aria-pressed={mode === 'sell'}
        aria-label={t('mode.switchToSell')}
        className={cn(
<<<<<<< HEAD
          `
            relative
            z-10
            flex
            items-center
            justify-center
            gap-1.5
            rounded-full
            px-4
            py-1.5
            text-sm
            font-semibold
            transition-colors
          `,
          mode === 'sell'
            ? 'text-[#252A20]'
            : 'text-[#74746C]',
        )}
      >
        <Store
          className="h-4 w-4"
          aria-hidden="true"
        />

        {t('mode.sell')}
=======
          ' ml-6 relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
          mode === 'sell' ? 'text-white' : 'text-ink-500',
        )}
      >
        <Store className="h-4 w-4" aria-hidden="true" />
        {!compact && t('mode.sell')}
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
      </button>
    </div>
  )
}