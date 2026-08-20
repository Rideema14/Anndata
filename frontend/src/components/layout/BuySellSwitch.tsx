
import { ShoppingBasket, Store } from 'lucide-react'
import { useAppMode } from '@/context/AppModeContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'

interface BuySellSwitchProps {
  className?: string
  /** Compact renders icon-only segments for tight header space on mobile. */
  compact?: boolean
}

export function BuySellSwitch({
  className,
  compact = false,
}: BuySellSwitchProps) {
  const { mode, setMode } = useAppMode()
  const { t } = useLanguage()

  return (
    <div
      role="group"
      aria-label="Buy or sell mode"
      className={cn(
        `
        relative
        flex
        items-center
        rounded-2xl
        bg-[#ECEAE2]
        p-1
        shadow-[inset_0_1px_2px_rgba(37,42,32,0.06)]
        `,
        compact
          ? 'h-10 w-[76px] shrink-0 rounded-full'
          : 'w-full',
        className,
      )}
    >
      {/* ACTIVE SLIDER */}

      <span
        aria-hidden="true"
        className={cn(
          `
          pointer-events-none
          absolute
          bottom-1
          left-1
          top-1
          z-0
          rounded-xl
          shadow-[0_2px_7px_rgba(37,42,32,0.14)]
          transition-all
          duration-300
          ease-[cubic-bezier(.4,0,.2,1)]
          `,
          compact
            ? 'w-[34px] rounded-full'
            : 'w-[calc(50%-4px)]',
          mode === 'buy'
            ? 'translate-x-0 bg-[#2B3024]'
            : compact
              ? 'translate-x-[34px] bg-[#C89D3D]'
              : 'translate-x-[calc(100%+0px)] bg-[#C89D3D]',
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
          min-w-0
          items-center
          justify-center
          rounded-xl
          py-2
          text-sm
          font-semibold
          transition-all
          duration-200
          active:scale-[0.97]
          `,
          compact
            ? 'h-8 w-[34px] shrink-0 p-0'
            : 'flex-1 gap-1.5 px-3 sm:px-4',
          mode === 'buy'
            ? 'text-white'
            : 'text-[#716D63] hover:text-[#252A20]',
        )}
      >
        <ShoppingBasket
          className={cn(
            'shrink-0 transition-transform duration-200',
            compact ? 'h-4 w-4' : 'h-[17px] w-[17px]',
            mode === 'buy' && 'scale-105',
          )}
          strokeWidth={mode === 'buy' ? 2.2 : 1.8}
          aria-hidden="true"
        />

        {!compact && (
          <span className="truncate">
            {t('mode.buy')}
          </span>
        )}
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
          min-w-0
          items-center
          justify-center
          rounded-xl
          py-2
          text-sm
          font-semibold
          transition-all
          duration-200
          active:scale-[0.97]
          `,
          compact
            ? 'h-8 w-[34px] shrink-0 p-0'
            : 'flex-1 gap-1.5 px-3 sm:px-4',
          mode === 'sell'
            ? 'text-[#252A20]'
            : 'text-[#716D63] hover:text-[#252A20]',
        )}
      >
        <Store
          className={cn(
            'shrink-0 transition-transform duration-200',
            compact ? 'h-4 w-4' : 'h-[17px] w-[17px]',
            mode === 'sell' && 'scale-105',
          )}
          strokeWidth={mode === 'sell' ? 2.2 : 1.8}
          aria-hidden="true"
        />

        {!compact && (
          <span className="truncate">
            {t('mode.sell')}
          </span>
        )}
      </button>
    </div>
  )
}
