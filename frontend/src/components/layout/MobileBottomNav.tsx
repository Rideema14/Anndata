import { NavLink } from 'react-router-dom'
import { mobileBottomNavItems } from '@/routes/navConfig'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'

export function MobileBottomNav() {
  const { t } = useLanguage()

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-surface/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {mobileBottomNavItems.map(({ path, labelKey, icon: Icon }) => (
          <li key={path} className="flex-1">
            <NavLink
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-brand-600' : 'text-ink-400',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-5.5 w-5.5" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
                  <span>{t(labelKey)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
