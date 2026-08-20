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
   * Everything that is not directly shown in the mobile
   * bottom pill goes inside More.
   *
   * First 4 items:
   * Home
   * Market
   * Ask AI
   * Mandi
   *
   * Profile is added separately.
   */
  const mobilePrimaryItems = items.slice(0, 4)

  const mobileMoreItems = [
    ...items.slice(4),
    ...(isSeller ? sellerUtilityNavItems : []),
    ...utilityNavItems,
  ]

  /*
   * Remove duplicate paths so an item does not appear twice
   * inside More.
   */
  const uniqueMoreItems = mobileMoreItems.filter(
    (item, index, array) =>
      array.findIndex((x) => x.path === item.path) === index,
  )

  return (
    <>
      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside
        className="
          sticky
          top-0
          hidden
          h-svh
          w-[260px]
          shrink-0
          flex-col
          bg-[#F8F7F2]
          md:flex
        "
      >
        {/* BRAND */}

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

        {/* BUY / SELL */}

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

        {/* DESKTOP MAIN NAV */}

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
                          strokeWidth={isActive ? 2.2 : 1.8}
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

        {/* DESKTOP MORE */}

        <div className="relative px-3 pb-5 pt-3">
          <div className="mb-3 px-3">
            <div className="h-px bg-[#E5E1D7]" />
          </div>

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
            <div className="more-menu-scroll max-h-[360px] overflow-y-auto">
              {uniqueMoreItems.map(
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
                          strokeWidth={isActive ? 2.2 : 1.8}
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

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
          EVERYTHING IS INSIDE ONE PILL
      ===================================================== */}

      <div
        className="
          fixed
          inset-x-0
          bottom-0
          z-50
          px-3
          pb-[calc(8px+env(safe-area-inset-bottom))]
          md:hidden
        "
      >
        <div
          className="
            relative
            mx-auto
            flex
            h-[58px]
            w-full
            max-w-[390px]
            items-center
            justify-between
            rounded-[20px]
            border
            border-[#E6E4DC]
            bg-[#FAFAF6]/95
            px-1.5
            shadow-[0_-4px_25px_rgba(30,45,30,0.10),0_4px_20px_rgba(30,45,30,0.08)]
            backdrop-blur-xl
          "
        >
          {/* ===============================================
              MOBILE PRIMARY ITEMS
          =============================================== */}

          {mobilePrimaryItems.map(
            ({ path, labelKey, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  cn(
                    `
                      relative
                      flex
                      h-[48px]
                      min-w-0
                      flex-1
                      flex-col
                      items-center
                      justify-center
                      gap-0.5
                      rounded-[15px]
                      px-1
                      text-[9px]
                      font-medium
                      transition-all
                      duration-200
                    `,
                    isActive
                      ? `
                        bg-[#EEF2E8]
                        text-[#245B35]
                      `
                      : `
                        text-[#7B8178]
                        active:bg-[#F0F1EC]
                      `,
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className="h-[18px] w-[18px]"
                      strokeWidth={isActive ? 2.2 : 1.7}
                    />

                    <span className="max-w-full truncate">
                      {t(labelKey)}
                    </span>
                  </>
                )}
              </NavLink>
            ),
          )}

          {/* ===============================================
              MOBILE PROFILE
          =============================================== */}

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                `
                  relative
                  flex
                  h-[48px]
                  min-w-0
                  flex-1
                  flex-col
                  items-center
                  justify-center
                  gap-0.5
                  rounded-[15px]
                  px-1
                  text-[9px]
                  font-medium
                  transition-all
                  duration-200
                `,
                isActive
                  ? `
                    bg-[#EEF2E8]
                    text-[#245B35]
                  `
                  : `
                    text-[#7B8178]
                  `,
              )
            }
          >
            <span className="flex h-[18px] items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5.5 20c.8-3.4 3.1-5.2 6.5-5.2s5.7 1.8 6.5 5.2" />
              </svg>
            </span>

            <span>Profile</span>
          </NavLink>

          {/* ===============================================
              MORE BUTTON
              THIS IS INSIDE THE SAME PILL
          =============================================== */}

          <button
            type="button"
            onClick={() => setShowMore((prev) => !prev)}
            aria-label="More navigation"
            aria-expanded={showMore}
            className={cn(
              `
                relative
                flex
                h-[48px]
                min-w-0
                flex-1
                flex-col
                items-center
                justify-center
                gap-0.5
                rounded-[15px]
                px-1
                text-[9px]
                font-medium
                transition-all
                duration-200
              `,
              showMore
                ? `
                  bg-[#E8EEE2]
                  text-[#245B35]
                `
                : `
                  text-[#7B8178]
                `,
            )}
          >
            <span
              className="
                flex
                h-[18px]
                w-[22px]
                items-center
                justify-center
              "
            >
              {showMore ? (
                <X
                  className="h-[18px] w-[18px]"
                  strokeWidth={2}
                />
              ) : (
                <Menu
                  className="h-[19px] w-[19px]"
                  strokeWidth={2}
                />
              )}
            </span>

            <span>More</span>
          </button>

          {/* ===============================================
              MOBILE MORE POPUP
              OPENS ABOVE THE SAME PILL
          =============================================== */}

          <div
            className={cn(
              `
                absolute
                bottom-[66px]
                left-1/2
                z-50
                w-[calc(100%-8px)]
                -translate-x-1/2
                origin-bottom
                rounded-[20px]
                border
                border-[#E4E5DD]
                bg-[#F8F9F4]
                p-2
                shadow-[0_12px_35px_rgba(25,40,25,0.16)]
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
                  scale-[0.96]
                  opacity-0
                `,
            )}
          >
            <div
              className="
                more-menu-scroll
                max-h-[55vh]
                overflow-y-auto
                overscroll-contain
                pr-0.5
              "
            >
              <div className="grid grid-cols-2 gap-1.5">
                {uniqueMoreItems.map(
                  ({ path, labelKey, icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={path}
                      onClick={() => setShowMore(false)}
                      className={({ isActive }) =>
                        cn(
                          `
                            flex
                            min-h-[48px]
                            items-center
                            gap-2.5
                            rounded-[14px]
                            px-3
                            text-[11px]
                            font-semibold
                            transition-all
                            duration-150
                          `,
                          isActive
                            ? `
                              bg-[#E3EBDD]
                              text-[#245B35]
                            `
                            : `
                              bg-white
                              text-[#5F665D]
                              hover:bg-[#EEF1EA]
                            `,
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              `
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-[10px]
                              `,
                              isActive
                                ? `bg-[#D5E1CF]`
                                : `bg-[#F1F2ED]`,
                            )}
                          >
                            <Icon
                              className="h-[16px] w-[16px]"
                              strokeWidth={
                                isActive ? 2.1 : 1.7
                              }
                            />
                          </span>

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
        </div>
      </div>
    </>
  )
}