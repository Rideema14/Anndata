import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Search } from 'lucide-react'
<<<<<<< HEAD

=======
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
import { Logo } from '@/components/common/Logo'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { CartIconButton } from '@/components/layout/CartIconButton'
import { ProfileMenu } from '@/components/layout/ProfileMenu'
import { BuySellSwitch } from '@/components/layout/BuySellSwitch'
<<<<<<< HEAD

=======
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

export function Header() {
  const { user, isSeller } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
<<<<<<< HEAD

=======
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
  const [query, setQuery] = useState('')

  function handleSearch(event: FormEvent) {
    event.preventDefault()
<<<<<<< HEAD

    const trimmed = query.trim()

    navigate(
      trimmed
        ? `/market?q=${encodeURIComponent(trimmed)}`
        : '/market',
    )
  }

  return (
    <header
      className="
        sticky
        top-0
        z-30
        border-b
        border-[#E5E2D9]
        bg-[#FBFAF6]/95
        backdrop-blur-xl
      "
    >

      {/* =====================================================
          TOP ROW
      ===================================================== */}

      <div
        className="
          flex
          min-h-[62px]
          items-center
          gap-2
          px-3
          py-2.5
          sm:px-4
          md:px-6
        "
      >

        {/* MOBILE LOGO */}

        <Link
          to="/"
          className="
            shrink-0
            transition-transform
            duration-200
            active:scale-95
            md:hidden
          "
          aria-label="Aandata home"
        >
          <Logo showWordmark={false} />
        </Link>


        {/* DESKTOP LOCATION */}

        {user && (
          <Link
            to="/profile"
            className="
              hidden
              shrink-0
              items-center
              gap-1.5
              rounded-full
              bg-[#F1EFE7]
              px-3
              py-2
              text-xs
              font-medium
              text-[#68665E]
              transition-colors
              hover:bg-[#E9E6DC]
              sm:flex
            "
          >
            <MapPin
              className="h-3.5 w-3.5 text-[#68765A]"
              aria-hidden="true"
            />

            <span className="max-w-[10rem] truncate">
              {user.location}
            </span>
          </Link>
        )}


        {/* DESKTOP SEARCH */}

        <form
          onSubmit={handleSearch}
          className="
            hidden
            max-w-md
            flex-1
            md:block
          "
        >
          <label className="relative block">

            <span className="sr-only">
              {t('common.search')}
            </span>

            <Search
              className="
                pointer-events-none
                absolute
                left-3.5
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-[#89877F]
              "
              aria-hidden="true"
            />

=======
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
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('common.searchPlaceholder')}
<<<<<<< HEAD
              className="
                h-10
                w-full
                rounded-full
                bg-[#F0EFE8]
                pl-10
                pr-4
                text-sm
                font-medium
                text-[#252A20]
                outline-none
                transition-all
                duration-200
                placeholder:text-[#949189]
                hover:bg-[#EBE9E1]
                focus:bg-white
                focus:ring-2
                focus:ring-[#D5D2C8]
              "
            />

          </label>
        </form>


        {/* =====================================================
            RIGHT SIDE

            MOBILE:
            CART + NOTIFICATION + PROFILE

            DESKTOP:
            LANGUAGE + CART + NOTIFICATION + PROFILE
        ===================================================== */}

        <div
          className="
            ml-auto
            flex
            shrink-0
            items-center
            gap-1
            sm:gap-1.5
          "
        >

          <LanguageSwitcher className="hidden sm:block" />

          {/* CART IS NOW ON TOP ROW */}

          <CartIconButton
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              transition-all
              duration-200
              hover:bg-[#ECEAE2]
              active:scale-90
              md:h-10
              md:w-10
            "
          />

          <NotificationBell />

          <ProfileMenu />

        </div>
      </div>


      {/* =====================================================
          MOBILE SEARCH ROW

          SEARCH IS NOT REMOVED
      ===================================================== */}

      <div
        className="
          flex
          items-center
          gap-2
          px-3
          pb-3
          sm:px-4
          md:hidden
        "
      >

        {/* SEARCH */}

        <form
          onSubmit={handleSearch}
          className="min-w-0 flex-1"
        >
          <label className="relative block">

            <span className="sr-only">
              {t('common.search')}
            </span>

            <Search
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-[#89877F]
              "
              aria-hidden="true"
            />

=======
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
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('common.searchPlaceholder')}
<<<<<<< HEAD
              className="
                h-10
                w-full
                rounded-full
                bg-[#F0EFE8]
                pl-9
                pr-3
                text-sm
                font-medium
                text-[#252A20]
                outline-none
                transition-all
                duration-200
                placeholder:text-[#949189]
                focus:bg-white
                focus:ring-2
                focus:ring-[#D5D2C8]
              "
            />

          </label>
        </form>


        {/* ONLY ICONS ON MOBILE */}

        {isSeller && (
          <BuySellSwitch
            compact
            className="shrink-0"
          />
        )}

      </div>

    </header>
  )
}
=======
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
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
