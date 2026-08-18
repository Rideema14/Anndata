import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Search } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { CartIconButton } from '@/components/layout/CartIconButton'
import { ProfileMenu } from '@/components/layout/ProfileMenu'
import { BuySellSwitch } from '@/components/layout/BuySellSwitch'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

export function Header() {
  const { user, isSeller } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/market?q=${encodeURIComponent(trimmed)}` : '/market')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-surface/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <Link to="/" className="shrink-0 md:hidden" aria-label="Aandata home">
          <Logo showWordmark={false} />
        </Link>

        {user && (
          <Link
            to="/profile"
            className="hidden shrink-0 items-center gap-1.5 rounded-full border border-ink-100 px-3 py-2 text-xs font-medium text-ink-600 hover:border-brand-300 sm:flex"
          >
            <MapPin className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
            <span className="max-w-[10rem] truncate">{user.location}</span>
          </Link>
        )}

        <form onSubmit={handleSearch} className="hidden flex-1 max-w-md md:block">
          <label className="relative block">
            <span className="sr-only">{t('common.search')}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('common.searchPlaceholder')}
              className="h-10 w-full rounded-full border border-ink-100 bg-surface-sunk pl-9 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:bg-surface"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:block" />
          <CartIconButton className="hidden md:flex" />
          <NotificationBell />
          <ProfileMenu />
        </div>
      </div>

      {/* Mobile-only second row: search + cart + buy/sell switch, kept off the crowded top row */}
      <div className="flex items-center gap-2 px-4 pb-3 md:hidden">
        <form onSubmit={handleSearch} className="flex-1">
          <label className="relative block">
            <span className="sr-only">{t('common.search')}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('common.searchPlaceholder')}
              className="h-10 w-full rounded-full border border-ink-100 bg-surface-sunk pl-9 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:bg-surface"
            />
          </label>
        </form>
        <CartIconButton />
        {isSeller && <BuySellSwitch compact />}
      </div>
    </header>
  )
}
