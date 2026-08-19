import { NavLink, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { BuySellSwitch } from '@/components/layout/BuySellSwitch'
import { buyNavItems, sellNavItems, utilityNavItems } from '@/routes/navConfig'
import { useAppMode } from '@/context/AppModeContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'

export function Sidebar() {
  const { mode } = useAppMode()
  const { isSeller } = useAuth()
  const { t } = useLanguage()
  const items = mode === 'buy' ? buyNavItems : sellNavItems

  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-ink-100 bg-surface md:flex">
      <div className="flex items-center px-5 py-5">
        <Link to="/home">
          <Logo />
        </Link>
      </div>

      {isSeller ? (
        <div className="px-5 pb-4">
          <BuySellSwitch className="w-full" />
        </div>
      ) : (
        <div className="mx-5 mb-4 rounded-2xl border border-dashed border-brand-300 bg-brand-50 p-3">
          <p className="text-xs font-medium text-brand-800">{t('home.sellerShortcut')}</p>
          <Link
            to="/seller/onboarding"
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
          >
            {t('roles.becomeSeller')}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}

      <nav aria-label={mode === 'buy' ? 'Buyer navigation' : 'Seller navigation'} className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {items.map(({ path, labelKey, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-surface-sunk hover:text-ink-900',
                  )
                }
              >
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                {t(labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-ink-100 px-3 py-3">
        <ul className="space-y-0.5">
          {utilityNavItems.map(({ path, labelKey, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-surface-sunk hover:text-ink-900',
                  )
                }
              >
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                {t(labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}