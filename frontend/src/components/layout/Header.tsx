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
import {WishlistIconButton} from '@/components/layout/WishlistIconButton'
export function Header() {
  const { user, isSeller } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')

  function handleSearch(event: FormEvent) {
    event.preventDefault()

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
        bg-[#FBFAF6]/90
        backdrop-blur-2xl
      "
    >
      {/* =====================================================
          MAIN HEADER
      ===================================================== */}

      <div
        className="
          mx-auto
          flex
          min-h-[68px]
          max-w-[1600px]
          items-center
          gap-3
          px-3
          sm:px-5
          lg:px-7
        "
      >
        {/* ===================================================
            MOBILE LOGO
        =================================================== */}

        <Link
          to="/"
          aria-label="FarmVerse home"
          className="
            shrink-0
            rounded-xl
            transition-transform
            duration-200
            active:scale-95
            md:hidden
          "
        >
          <Logo showWordmark={false} />
        </Link>

        {/* ===================================================
            DESKTOP LOCATION
        =================================================== */}

        {user && (
          <Link
            to="/profile"
            className="
              group
              hidden
              shrink-0
              items-center
              gap-2
              rounded-2xl
              border
              border-[#E6E2D8]
              bg-[#F3F1E9]
              px-3.5
              py-2
              transition-all
              duration-200
              hover:border-[#D8D4C8]
              hover:bg-[#ECEAE1]
              hover:shadow-sm
              sm:flex
            "
          >
            <span
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#E4E8D9]
              "
            >
              <MapPin
                className="
                  h-3.5
                  w-3.5
                  text-[#68765A]
                  transition-transform
                  duration-200
                  group-hover:-translate-y-0.5
                "
                aria-hidden="true"
              />
            </span>

            <span className="flex min-w-0 flex-col">
              <span
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.08em]
                  text-[#97948A]
                "
              >
                Location
              </span>

              <span
                className="
                  max-w-[9rem]
                  truncate
                  text-xs
                  font-semibold
                  text-[#45443E]
                "
              >
                {user.location}
              </span>
            </span>
          </Link>
        )}

        {/* ===================================================
            DESKTOP SEARCH
        =================================================== */}

        <form
          onSubmit={handleSearch}
          className="
            hidden
            min-w-0
            max-w-2xl
            flex-1
            md:block
          "
        >
          <label className="group relative block">
            <span className="sr-only">
              {t('common.search')}
            </span>
            <Search
              className="
                pointer-events-none
                absolute
                left-4
                top-1/2
                h-[17px]
                w-[17px]
                -translate-y-1/2
                text-[#8C8A82]
                transition-colors
                duration-200
                group-focus-within:text-[#68765A]
              "
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('common.searchPlaceholder')}
              className="
                h-11
                w-full
                rounded-2xl
                border
                border-transparent
                bg-[#F0EFE8]
                pl-11
                pr-12
                text-sm
                font-medium
                text-[#252A20]
                outline-none
                transition-all
                duration-200
                placeholder:text-[#9B9991]
                hover:border-[#E1DED4]
                hover:bg-[#ECEAE3]
                focus:border-[#D8D5CB]
                focus:bg-white
                focus:shadow-[0_4px_18px_rgba(50,50,40,0.06)]
                focus:ring-0
              "
            />
            {/* Search shortcut */}
            <span
              className="
                pointer-events-none
                absolute
                right-3
                top-1/2
                hidden
                -translate-y-1/2
                items-center
                rounded-lg
                border
                border-[#DDDAD1]
                bg-white/70
                px-2
                py-1
                text-[10px]
                font-semibold
                text-[#AAA79F]
                lg:flex
              "
            >
              /
            </span>
          </label>
        </form>
        {/* ===================================================
            DESKTOP SELLER SWITCH
        =================================================== */}
       
        {/* ===================================================
            RIGHT ACTIONS
        =================================================== */}
        <div
          className="
            ml-auto
            flex
            shrink-0
            items-center
            gap-0.5
            sm:gap-1
          "
        >
          {/* Language */}
          <LanguageSwitcher className="hidden md:block" />
          {/* Divider */}
          <span
            className="
              mx-1
              hidden
              h-7
              w-px
              bg-[#E5E2D9]
              md:block
            "
            aria-hidden="true"
          />
          {/*wishlist*/}
          <WishlistIconButton
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-[#57564F]
              transition-all
              duration-200
              hover:bg-[#EEECE5]
              hover:text-[#3F4935]
              active:scale-90
              md:h-10
              md:w-10
            "
          />
          
          {/* Cart */}
          <CartIconButton
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-[#57564F]
              transition-all
              duration-200
              hover:bg-[#EEECE5]
              hover:text-[#3F4935]
              active:scale-90
              md:h-10
              md:w-10
            "
          />
          {/* Notification */}
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              transition-colors
              duration-200
              hover:bg-[#EEECE5]
            "
          >
            <NotificationBell />
          </div>

          {/* Profile */}
          <div
            className="
              ml-0.5
              flex
              items-center
              rounded-xl
              transition-colors
              duration-200
              hover:bg-[#EEECE5]
            "
          >
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* =====================================================
          MOBILE SEARCH
      ===================================================== */}

      <div
        className="
          border-t
          border-[#EFEBE2]
          px-3
          pb-3
          pt-1
          md:hidden
          sm:px-5
        "
      >
        <div className="flex items-center gap-2">
          <form
            onSubmit={handleSearch}
            className="min-w-0 flex-1"
          >
            <label className="group relative block">
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
                  text-[#8E8B83]
                  transition-colors
                  duration-200
                  group-focus-within:text-[#68765A]
                "
                aria-hidden="true"
              />

              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('common.searchPlaceholder')}
                className="
                  h-11
                  w-full
                  rounded-2xl
                  border
                  border-transparent
                  bg-[#F0EFE8]
                  pl-10
                  pr-3
                  text-sm
                  font-medium
                  text-[#252A20]
                  outline-none
                  transition-all
                  duration-200
                  placeholder:text-[#9A978F]
                  focus:border-[#D8D5CB]
                  focus:bg-white
                  focus:shadow-sm
                "
              />
            </label>
          </form>

          {/* Seller switch */}
          {isSeller && (
            <BuySellSwitch
              compact
              className="
                shrink-0
                rounded-xl
              "
            />
          )}
        </div>
      </div>
    </header>
  )
}

