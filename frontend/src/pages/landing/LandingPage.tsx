import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Tractor,
  Sprout,
  User,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'

import { PlantGrowthSection } from '@/components/layout/PlantGrowthSection'
import { ServicesSection } from '@/components/layout/ServiceSection'
import { ContactSection } from '@/components/layout/ContactSection'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // =========================================================
  // SMART NAVBAR HIDE / SHOW
  // =========================================================

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      setScrolled(currentScrollY > 30)

      // Never hide navbar while mobile menu is open
      if (mobileMenuOpen) {
        setIsVisible(true)
        return
      }

      if (currentScrollY < 40) {
        setIsVisible(true)
      } else if (
        currentScrollY > lastScrollY &&
        currentScrollY > 80
      ) {
        // Scrolling down
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY, mobileMenuOpen])

  // =========================================================
  // CLOSE MOBILE MENU WHEN ESC IS PRESSED
  // =========================================================

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  // =========================================================
  // CLOSE MOBILE MENU WHEN SCREEN BECOMES DESKTOP
  // =========================================================

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // =========================================================
  // FEATURES NAVIGATION
  // =========================================================

  const goToFeatures = () => {
    setMobileMenuOpen(false)

    window.dispatchEvent(new Event('growth-final'))
  }

  // =========================================================
  // NAVIGATION ITEM
  // =========================================================

  const mobileLinkClass =
    'flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-[#d5d9d0] transition-all duration-200 hover:bg-[#27351d] hover:text-[#d6b841] active:scale-[0.98]'

  return (
    <div
      className="
        min-h-screen
        overflow-x-hidden
        bg-[#1c2a13]
        font-['Plus_Jakarta_Sans',sans-serif]
        text-[#f8f4e9]
        antialiased
        selection:bg-[#d6b841]
        selection:text-[#262c1d]
      "
    >
      {/* =====================================================
          CUSTOM TYPOGRAPHY
      ===================================================== */}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@700&family=Yellowtail&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        :root {
          --sticker-stroke: 6px;
          --script-stroke: 4px;
        }

        @media (min-width: 640px) {
          :root {
            --sticker-stroke: 10px;
            --script-stroke: 7px;
          }
        }

        @media (min-width: 1024px) {
          :root {
            --sticker-stroke: 14px;
            --script-stroke: 10px;
          }
        }

        .brand-sticker-green {
          font-family: 'Fredoka', cursive, sans-serif;
          font-weight: 700;
          color: #27351d;
          -webkit-text-stroke: var(--sticker-stroke) #f8f4e9;
          paint-order: stroke fill;
          stroke-linejoin: round;
          stroke-linecap: round;
          letter-spacing: -0.01em;
          filter: drop-shadow(
            0px 6px 16px rgba(0, 0, 0, 0.45)
          );
        }

        .brand-script-yellow {
          font-family: 'Yellowtail', cursive;
          color: #d6b841;
          -webkit-text-stroke: var(--script-stroke) #f8f4e9;
          paint-order: stroke fill;
          stroke-linejoin: round;
          stroke-linecap: round;
          filter: drop-shadow(
            0px 4px 12px rgba(0, 0, 0, 0.35)
          );
        }
      `}</style>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header
        className={`
          fixed
          inset-x-0
          top-0
          z-50
          transition-all
          duration-500
          ease-in-out

          ${
            isVisible
              ? 'translate-y-0'
              : '-translate-y-full'
          }

          ${
            scrolled
              ? 'bg-[#1c2a13]/90 py-3 shadow-2xl shadow-black/80 backdrop-blur-xl'
              : 'bg-gradient-to-b from-[#1c2a13]/90 via-[#1c2a13]/40 to-transparent py-4'
          }
        `}
      >
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            items-center
            justify-between
            px-4
            sm:px-8
            lg:px-12
          "
        >
          {/* =================================================
              LOGO
          ================================================= */}

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="group flex items-center gap-2.5 sm:gap-3"
          >
            <div
              className="
                relative
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                border
                border-white/30
                bg-[#27351d]
                transition-all
                duration-300
                group-hover:border-[#d6b841]
                group-hover:bg-[#394a2d]
              "
            >
              <Sprout className="h-5 w-5 text-white" />
            </div>

            <span
              className="
                text-lg
                font-black
                tracking-tight
                text-white
                transition-colors
                duration-300
                group-hover:text-[#d6b841]
                sm:text-xl
              "
            >
              FarmVerse
            </span>
          </Link>

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}

          <nav
            className="
              hidden
              items-center
              gap-6
              text-xs
              font-bold
              uppercase
              tracking-[0.16em]
              text-[#e7eee1]
              md:flex
              lg:gap-8
              lg:text-sm
            "
          >
            {/* HOME */}

            <a
              href="#hero"
              className="
                group
                relative
                py-1
                transition-colors
                duration-300
                hover:text-white
              "
            >
              <span>Home</span>

              <span
                className="
                  absolute
                  bottom-0
                  left-0
                  h-[2px]
                  w-0
                  bg-[#d6b841]
                  transition-all
                  duration-300
                  ease-out
                  group-hover:w-full
                "
              />
            </a>

            {/* FEATURES */}

            <button
              type="button"
              onClick={goToFeatures}
              className="
                group
                relative
                cursor-pointer
                py-1
                uppercase
                transition-colors
                duration-300
                hover:text-white
              "
            >
              <span>Features</span>

              <span
                className="
                  absolute
                  bottom-0
                  left-0
                  h-[2px]
                  w-0
                  bg-[#d6b841]
                  transition-all
                  duration-300
                  ease-out
                  group-hover:w-full
                "
              />
            </button>

            {/* SERVICES */}

            <a
              href="#about"
              className="
                group
                relative
                py-1
                transition-colors
                duration-300
                hover:text-white
              "
            >
              <span>Services</span>

              <span
                className="
                  absolute
                  bottom-0
                  left-0
                  h-[2px]
                  w-0
                  bg-[#d6b841]
                  transition-all
                  duration-300
                  ease-out
                  group-hover:w-full
                "
              />
            </a>

            {/* CONTACT */}

            <a
              href="#contact"
              className="
                group
                relative
                py-1
                transition-colors
                duration-300
                hover:text-white
              "
            >
              <span>Contact</span>

              <span
                className="
                  absolute
                  bottom-0
                  left-0
                  h-[2px]
                  w-0
                  bg-[#d6b841]
                  transition-all
                  duration-300
                  ease-out
                  group-hover:w-full
                "
              />
            </a>
          </nav>

          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <div className="flex items-center gap-2 sm:gap-3">
            {/* LANGUAGE SWITCHER
                Visible on BOTH desktop and mobile
            */}

            <div className="shrink-0">
              <LanguageSwitcher
                className="
                  [&>button]:border-[#394a2d]
                  [&>button]:bg-[#27351d]/90
                  [&>button]:text-[#e7eee1]

                  hover:[&>button]:border-[#d6b841]/50
                  hover:[&>button]:text-[#e0c64d]

                  [&>div[role=menu]]:bg-[#1c2a13]/95
                  [&>div[role=menu]]:border-[#394a2d]
                  [&>div[role=menu]]:text-[#e7eee1]

                  [&_p]:text-[#7d806f]

                  [&_button[role=menuitemradio]]:text-[#d5d9d0]
                  hover:[&_button[role=menuitemradio]]:bg-[#27351d]
                  hover:[&_button[role=menuitemradio]]:text-white

                  [&_div[aria-disabled]]:text-[#7d806f]
                  [&_div.border-t]:border-[#394a2d]
                "
              />
            </div>

            {/* DESKTOP LOGIN */}

            <Link
              to="/login"
              className="
                group
                hidden
                items-center
                gap-2
                rounded-full
                bg-[#27351d]/80
                px-5
                py-2.5
                text-xs
                font-extrabold
                uppercase
                tracking-wider
                text-[#f8f4e9]
                shadow-md
                backdrop-blur-md
                transition-all
                duration-300
                hover:bg-[#d6b841]
                hover:text-[#262c1d]
                active:scale-95
                sm:text-sm
                md:inline-flex
              "
            >
              <User
                className="
                  h-4
                  w-4
                  transition-transform
                  duration-300
                  group-hover:scale-110
                "
              />

              <span>Login / Register</span>
            </Link>

            {/* =================================================
                MOBILE MENU BUTTON
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)
              }
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                border
                border-[#394a2d]
                bg-[#27351d]/90
                text-[#d5d9d0]
                backdrop-blur-md
                transition-all
                duration-300
                hover:border-[#d6b841]/50
                hover:text-white
                active:scale-95
                md:hidden
              "
              aria-label={
                mobileMenuOpen
                  ? 'Close Navigation'
                  : 'Open Navigation'
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* =====================================================
            MOBILE MENU
        ===================================================== */}

        <div
          className={`
            overflow-hidden
            px-4
            transition-all
            duration-300
            md:hidden
            ${
              mobileMenuOpen
                ? 'max-h-[500px] pt-3 opacity-100'
                : 'max-h-0 pt-0 opacity-0'
            }
          `}
        >
          <div
            className="
              mx-auto
              max-w-7xl
              rounded-2xl
              border
              border-[#394a2d]
              bg-[#1c2a13]/98
              p-3
              shadow-2xl
              shadow-black/70
              backdrop-blur-2xl
            "
          >
            {/* HOME */}

            <a
              href="#hero"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClass}
            >
              <span>Home</span>

              <ChevronRight className="h-4 w-4 text-[#7d806f]" />
            </a>

            {/* FEATURES */}

            <button
              type="button"
              onClick={goToFeatures}
              className={`${mobileLinkClass} w-full text-left`}
            >
              <span>Features</span>

              <ChevronRight className="h-4 w-4 text-[#7d806f]" />
            </button>

            {/* SERVICES */}

            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClass}
            >
              <span>Services</span>

              <ChevronRight className="h-4 w-4 text-[#7d806f]" />
            </a>

            {/* CONTACT */}

            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClass}
            >
              <span>Contact</span>

              <ChevronRight className="h-4 w-4 text-[#7d806f]" />
            </a>

            {/* =================================================
                LOGIN / REGISTER INSIDE MOBILE MENU
            ================================================= */}

            <div className="my-2 border-t border-[#394a2d]" />

            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="
                flex
                items-center
                justify-between
                rounded-xl
                bg-[#d6b841]
                px-4
                py-3.5
                text-sm
                font-black
                uppercase
                tracking-wider
                text-[#262c1d]
                transition-all
                duration-200
                hover:bg-[#e0c64d]
                active:scale-[0.98]
              "
            >
              <span className="flex items-center gap-2.5">
                <User className="h-4 w-4" />

                Login / Register
              </span>

              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <section
        id="hero"
        className="
          relative
          flex
          min-h-[100dvh]
          items-center
          overflow-hidden
          px-4
          pb-16
          pt-28
          sm:px-8
          md:px-16
          md:pt-32
          lg:pt-32
        "
      >
        {/* BACKGROUND */}

        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1600&auto=format&fit=crop"
            alt="Tractor working a farm field"
            className="
              h-full
              w-full
              scale-105
              object-cover
              object-center
            "
          />

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-r
              from-[#1c2a13]/95
              via-[#1c2a13]/75
              to-[#1c2a13]/20
              sm:via-[#1c2a13]/70
            "
          />
        </div>

        {/* HERO CONTENT */}

        <div
          className="
            relative
            z-10
            my-auto
            w-full
            max-w-5xl
            space-y-6
            py-6
            sm:space-y-8
            sm:py-12
          "
        >
          {/* HERO TITLE */}

          <div
            className="
              flex
              flex-col
              items-start
              leading-none
              select-none
            "
          >
            <h1
              className="
                brand-sticker-green
                py-1
                text-5xl
                leading-[1.1]
                sm:text-7xl
                sm:leading-none
                md:text-8xl
                lg:text-[96px]
              "
            >
              Rent Machines.
            </h1>

            <div
              className="
                -mt-1
                flex
                flex-wrap
                items-center
                gap-2
                py-1
                sm:-mt-4
                sm:gap-4
                md:-mt-6
                lg:-mt-8
              "
            >
              <span
                className="
                  brand-script-yellow
                  transform
                  -rotate-6
                  pr-1
                  text-4xl
                  sm:text-6xl
                  md:text-7xl
                  lg:text-8xl
                "
              >
                Lease Land.
              </span>

              <h2
                className="
                  brand-sticker-green
                  text-5xl
                  leading-[1.1]
                  sm:text-7xl
                  sm:leading-none
                  md:text-8xl
                  lg:text-[96px]
                "
              >
                Sell Smart.
              </h2>
            </div>
          </div>

          {/* DESCRIPTION */}

          <p
            className="
              max-w-xl
              pt-1
              text-sm
              font-light
              leading-relaxed
              text-[#d5d9d0]
              sm:text-base
              md:text-lg
            "
          >
            Book tractors and harvesters by the day, find farmland to lease
            near you, and track live mandi prices across 2,500+ markets —
            everything your farm needs, in one place.
          </p>

          {/* CTA BUTTONS */}

          <div
            className="
              flex
              flex-col
              items-stretch
              gap-3
              pt-2
              sm:flex-row
              sm:items-center
              sm:gap-4
            "
          >
            <Link
              to="/login"
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-[#5c744d]
                bg-[#394a2d]
                px-6
                py-3.5
                text-xs
                font-bold
                uppercase
                tracking-wider
                text-white
                shadow-xl
                transition-all
                hover:bg-[#435c39]
                active:scale-[0.98]
                sm:px-8
                sm:py-4
              "
            >
              <Tractor className="h-4 w-4 sm:h-5 sm:w-5" />

              Browse Machinery
            </Link>

            <Link
              to="/login"
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#d6b841]
                px-6
                py-3.5
                text-xs
                font-black
                uppercase
                tracking-wider
                text-[#262c1d]
                shadow-xl
                transition-all
                hover:bg-[#e0c64d]
                active:scale-[0.98]
                sm:px-8
                sm:py-4
              "
            >
              Get Started Now

              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          PLANT GROWTH
      ===================================================== */}

      <PlantGrowthSection />

      {/* =====================================================
          SERVICES
      ===================================================== */}

      <ServicesSection />

      {/* =====================================================
          CONTACT
      ===================================================== */}

      <ContactSection />
    </div>
  )
}