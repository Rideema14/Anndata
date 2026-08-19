import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ShoppingBag,
  Sprout,
  User,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { PlantGrowthSection } from '@/components/layout/PlantGrowthSection'
import { ServicesSection } from '@/components/layout/ServiceSection'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Smart Hide on Scroll Down / Reveal on Scroll Up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      setScrolled(currentScrollY > 30)

      if (mobileMenuOpen) {
        setIsVisible(true)
        return
      }

      if (currentScrollY < 40) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false) // Hide when scrolling down
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true) // Show when scrolling up
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, mobileMenuOpen])

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-stone-950 font-['Plus_Jakarta_Sans',sans-serif] antialiased overflow-x-hidden">
      {/* Responsive Custom Typography & Sticker Outline Styling */}
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
          color: #102701;
          -webkit-text-stroke: var(--sticker-stroke) #faf5e8;
          paint-order: stroke fill;
          stroke-linejoin: round;
          stroke-linecap: round;
          letter-spacing: -0.01em;
          filter: drop-shadow(0px 6px 16px rgba(0, 0, 0, 0.45));
        }

        .brand-script-yellow {
          font-family: 'Yellowtail', cursive;
          color: #f5bd06;
          -webkit-text-stroke: var(--script-stroke) #faf5e8;
          paint-order: stroke fill;
          stroke-linejoin: round;
          stroke-linecap: round;
          filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.35));
        }
      `}</style>

      {/* ================= CLEAN & SLEEK AWWWARDS NAVBAR ================= */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          scrolled
            ? 'bg-stone-950/85 backdrop-blur-xl py-3 shadow-2xl shadow-black/80'
            : 'bg-gradient-to-b from-stone-950/90 via-stone-950/40 to-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 flex items-center justify-between">
          
          {/* Logo with Live Indicator */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#102701] border border-white/30 group-hover:border-emerald-400 group-hover:bg-emerald-500/20 transition-all duration-300">
              <Sprout className="h-5 w-5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors duration-300">
                Anndataa
              </span>
    
            </div>
          </Link>

          {/* Center Links (Bigger Fonts, Pure Transparent Borderless) */}
          <nav className="hidden md:flex items-center gap-8 text-xs lg:text-sm font-bold tracking-[0.18em] text-stone-200 uppercase">
            <a
              href="#hero"
              className="relative py-1 transition-colors duration-300 hover:text-white group"
            >
              <span>Home</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-amber-400 group-hover:w-full transition-all duration-300 ease-out" />
            </a>

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new Event('growth-final'))
              }}
              className="relative py-1 uppercase transition-colors duration-300 hover:text-white group cursor-pointer"
            >
              <span>Features</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-amber-400 group-hover:w-full transition-all duration-300 ease-out" />
            </button>

            <a
              href="#about"
              className="relative py-1 transition-colors duration-300 hover:text-white group"
            >
              <span>Our Mission</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-amber-400 group-hover:w-full transition-all duration-300 ease-out" />
            </a>

            <a
              href="#features"
              className="relative py-1 transition-colors duration-300 hover:text-white group"
            >
              <span>Ecosystem</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-amber-400 group-hover:w-full transition-all duration-300 ease-out" />
            </a>
          </nav>

          {/* Right Action CTA */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="group relative inline-flex items-center gap-2 rounded-full bg-stone-900/80 hover:bg-amber-400 px-5 py-2.5 text-xs sm:text-sm font-extrabold tracking-wider uppercase text-stone-100 hover:text-stone-950 backdrop-blur-md transition-all duration-300 active:scale-95 shadow-md"
            >
              <User className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              <span>Login / Register</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/80 text-stone-300 hover:text-white md:hidden focus:outline-none backdrop-blur-md transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="max-w-7xl mx-auto px-6 pt-4 pb-2 md:hidden">
            <div className="bg-stone-950/98 rounded-2xl p-4 space-y-2 shadow-2xl backdrop-blur-2xl">
              <a
                href="#hero"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider text-stone-300 hover:bg-stone-900 hover:text-amber-400 transition-all"
              >
                <span>Home</span>
                <ChevronRight className="h-4 w-4 text-stone-500" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  window.dispatchEvent(new Event('growth-final'))
                }}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider text-stone-300 hover:bg-stone-900 hover:text-amber-400 transition-all text-left"
              >
                <span>Features</span>
                <ChevronRight className="h-4 w-4 text-stone-500" />
              </button>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider text-stone-300 hover:bg-stone-900 hover:text-amber-400 transition-all"
              >
                <span>Our Mission</span>
                <ChevronRight className="h-4 w-4 text-stone-500" />
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider text-stone-300 hover:bg-stone-900 hover:text-amber-400 transition-all"
              >
                <span>Ecosystem</span>
                <ChevronRight className="h-4 w-4 text-stone-500" />
              </a>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section id="hero" className="relative flex min-h-[100dvh] items-center overflow-hidden px-4 pt-28 pb-16 sm:px-8 md:px-16 lg:pt-32">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1623958045855-0b7a60cfb9eb?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Farmers harvesting crop in field"
            className="h-full w-full scale-105 object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/70 to-stone-950/20" />
        </div>

        <div className="relative z-10 my-auto w-full max-w-5xl space-y-6 sm:space-y-8 py-6 sm:py-12">
          <div className="flex flex-col items-start leading-none select-none">
            <h1 className="brand-sticker-green text-5xl sm:text-7xl md:text-8xl lg:text-[96px] leading-[1.1] sm:leading-none py-1">
              Every Meal
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 -mt-1 sm:-mt-4 md:-mt-6 lg:-mt-8 py-1">
              <span className="brand-script-yellow text-4xl sm:text-6xl md:text-7xl lg:text-8xl -rotate-6 transform pr-1">
                begins with
              </span>
              <h2 className="brand-sticker-green text-5xl sm:text-7xl md:text-8xl lg:text-[96px] leading-[1.1] sm:leading-none">
                a Farmer.
              </h2>
            </div>
          </div>

          <p className="max-w-xl text-sm sm:text-base md:text-lg font-light leading-relaxed text-stone-300 pt-1">
            Empowering agricultural communities with direct produce markets, real-time mandi prices, modern equipment rentals, and AI-driven crop intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 rounded-xl border border-[#102701]/80
               bg-[#102701] px-6 sm:px-8 py-3.5 sm:py-4 text-xs font-bold uppercase tracking-wider text-white shadow-xl backdrop-blur-sm transition-all hover:bg-[#102701]-80 hover:shadow-[#102701]/20 active:scale-98"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              Explore Marketplace
            </Link>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 sm:px-8 py-3.5 sm:py-4 text-xs font-black uppercase tracking-wider text-stone-950 shadow-xl transition-all hover:bg-amber-400 hover:shadow-amber-500/40 active:scale-98"
            >
              Get Started Now
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </section>
      <PlantGrowthSection />
      <ServicesSection />
    </div>
  )
}