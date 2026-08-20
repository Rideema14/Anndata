import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'

import { Logo } from '@/components/common/Logo'
import { BuySellSwitch } from '@/components/layout/BuySellSwitch'

import {
  buyNavItems,
  sellNavItems,
  sellerUtilityNavItems,
  utilityNavItems,
} from '@/routes/navConfig'

import { useAppMode } from '@/context/AppModeContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'

export function Sidebar() {
  const { mode } = useAppMode()
  const { isSeller } = useAuth()
  const { t } = useLanguage()

  const [showMore, setShowMore] = useState(false)

  const items = mode === 'buy' ? buyNavItems : sellNavItems

  /*
   * ONLY CHANGE:
   * Put all remaining navigation inside the existing
   * three-dash More menu.
   */
  const moreItems = [
    ...(isSeller ? sellerUtilityNavItems : []),
    ...utilityNavItems,
  ]

  return (
    <aside
      className="
        sticky top-0
        hidden
        h-svh
        w-[260px]
        shrink-0
        flex-col
        bg-[#F8F7F2]
        md:flex
      "
    >

      {/* =====================================================
          BRAND
      ===================================================== */}

      <div className="px-6 pb-5 pt-7">
        <Link
          to="/home"
          className="
            inline-flex
            transition-transform
            duration-300
            hover:scale-[1.015]
          "
        >
          <Logo />
        </Link>
      </div>


      {/* =====================================================
          BUY / SELL SWITCH
      ===================================================== */}

      {isSeller ? (
        <div className="px-4 pb-6">
          <BuySellSwitch className="w-full" />
        </div>
      ) : (
        <div className="px-4 pb-6">
          <Link
            to="/seller/onboarding"
            className="
              group
              flex
              items-center
              justify-between
              rounded-2xl
              bg-[#2B3024]
              px-4
              py-3.5
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:bg-[#343A2B]
              hover:shadow-[0_10px_25px_rgba(43,48,36,0.14)]
            "
          >
            <div className="min-w-0">

              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-[#D8B15A]
                "
              >
                Sell on Aandata
              </p>

              <p
                className="
                  mt-1
                  truncate
                  text-[12px]
                  font-semibold
                  text-[#F5F2E9]
                "
              >
                {t('roles.becomeSeller')}
              </p>

            </div>

            <span
              className="
                ml-3
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#D8B15A]
                text-[#2B3024]
                transition-transform
                duration-300
                group-hover:translate-x-1
              "
            >
              <ChevronRight className="h-4 w-4" />
            </span>

          </Link>
        </div>
      )}


      {/* =====================================================
          MAIN NAVIGATION
      ===================================================== */}

      <nav
        aria-label={
          mode === 'buy'
            ? 'Buyer navigation'
            : 'Seller navigation'
        }
        className="
          sidebar-scroll
          flex-1
          overflow-y-auto
          overflow-x-hidden
          px-3
        "
      >

        <ul className="space-y-1">

          {items.map(({ path, labelKey, icon: Icon }) => (

            <li key={path}>

              <NavLink
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  cn(
                    `
                    group
                    relative
                    flex
                    h-[48px]
                    items-center
                    gap-3
                    rounded-xl
                    px-3.5
                    text-[13px]
                    font-semibold
                    transition-all
                    duration-200
                    `,
                    isActive
                      ? `
                        bg-[#E9E6DA]
                        text-[#252A20]
                      `
                      : `
                        text-[#716D63]
                        hover:bg-[#F0EEE7]
                        hover:text-[#252A20]
                        hover:translate-x-0.5
                      `,
                  )
                }
              >

                {({ isActive }) => (
                  <>

                    {isActive && (
                      <span
                        className="
                          absolute
                          left-0
                          top-1/2
                          h-6
                          w-[3px]
                          -translate-y-1/2
                          rounded-r-full
                          bg-[#C89D3D]
                        "
                      />
                    )}

                    <span
                      className={cn(
                        `
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        transition-all
                        duration-200
                        `,
                        isActive
                          ? `
                            bg-[#2B3024]
                            text-[#E4B957]
                          `
                          : `
                            text-[#77736A]
                            group-hover:text-[#252A20]
                          `,
                      )}
                    >

                      <Icon
                        className="h-[17px] w-[17px]"
                        strokeWidth={
                          isActive ? 2.2 : 1.8
                        }
                        aria-hidden="true"
                      />

                    </span>

                    <span className="truncate">
                      {t(labelKey)}
                    </span>

                  </>
                )}

              </NavLink>

            </li>

          ))}

        </ul>

      </nav>


      {/* =====================================================
          MORE MENU
          SAME THREE DASH BUTTON
      ===================================================== */}

      <div className="relative px-3 pb-5 pt-3">

        {/* divider */}

        <div className="mb-3 px-3">
          <div className="h-px bg-[#E5E1D7]" />
        </div>


        {/* =================================================
            THREE DASH BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          aria-label="More navigation"
          aria-expanded={showMore}
          className="
            group
            flex
            h-11
            w-full
            items-center
            gap-3
            rounded-xl
            px-3.5
            text-[#77736A]
            transition-all
            duration-200
            hover:bg-[#F0EEE7]
            hover:text-[#252A20]
          "
        >

          <span
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              bg-[#F0EEE7]
              transition-all
              duration-200
              group-hover:bg-[#E5E1D7]
            "
          >

            {showMore ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}

          </span>

          <span className="text-[13px] font-semibold">
            More
          </span>

        </button>


        {/* =================================================
            EXISTING THREE-DASH POPUP
            ONLY CONTENT UPDATED
        ================================================= */}

        <div
          className={cn(
            `
            absolute
            bottom-[70px]
            left-5
            right-5
            z-50

            origin-bottom

            rounded-[18px]

            bg-[#42483A]

            p-1.5

            shadow-[0_16px_35px_rgba(37,42,32,0.16)]

            ring-1
            ring-black/[0.04]

            transition-all
            duration-200
            ease-out
            `,
            showMore
              ? `
                visible
                translate-y-0
                scale-100
                opacity-100
              `
              : `
                pointer-events-none
                invisible
                translate-y-2
                scale-[0.97]
                opacity-0
              `,
          )}
        >

          {/* =================================================
              ALL REMAINING ITEMS
          ================================================= */}

          <div
            className="
              more-menu-scroll
              max-h-[360px]
              overflow-y-auto
              overflow-x-hidden
            "
          >

            {moreItems.map(
              ({ path, labelKey, icon: Icon }) => (

                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    cn(
                      `
                      group
                      flex
                      min-h-[42px]
                      items-center
                      gap-3
                      rounded-[13px]
                      px-3
                      py-2
                      text-[12.5px]
                      font-semibold
                      transition-all
                      duration-200
                      `,
                      isActive
                        ? `
                          bg-[#D8B15A]
                          text-[#252A20]
                        `
                        : `
                          text-[#ECE8DD]
                          hover:bg-[#505646]
                          hover:text-white
                        `,
                    )
                  }
                >

                  {({ isActive }) => (
                    <>

                      <Icon
                        className="h-4 w-4 shrink-0"
                        strokeWidth={
                          isActive ? 2.2 : 1.8
                        }
                        aria-hidden="true"
                      />

                      <span className="truncate">
                        {t(labelKey)}
                      </span>

                    </>
                  )}

                </NavLink>

              ),
            )}

          </div>

        </div>

      </div>

    </aside>
  )
}