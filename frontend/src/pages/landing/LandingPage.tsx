
import { Link } from 'react-router-dom'
import {ArrowRight,ShoppingBag,Sprout,User,} from 'lucide-react'
import { WheatGrowthSection } from '@/pages/landing/PlantGrowthSection'
export default function LandingPage() {
  
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

      {/* HEADER NAVIGATION */}
      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent px-4 py-4 sm:px-8 sm:py-6 md:px-12">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="flex items-center justify-center rounded-xl bg-green-900 p-2 sm:p-2.5 shadow-lg shadow-emerald-950/50">
            <Sprout className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-wider text-white drop-shadow-md">
            AANDATA<span className="text-amber-400">.</span>
          </span>
        </div>

        <nav className="hidden items-center space-x-8 text-xs font-bold tracking-widest text-stone-200 uppercase md:flex">
          <a href="#hero" className="transition-colors hover:text-amber-400">
            Home
          </a>
          <a href="#growth" className="transition-colors hover:text-amber-400">
            Growth
          </a>
          <a href="#about" className="transition-colors hover:text-amber-400">
            Our Mission
          </a>
          <a href="#features" className="transition-colors hover:text-amber-400">
            Ecosystem
          </a>
        </nav>

        <Link
          to="/login"
          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-amber-300 bg-amber-500 px-3.5 py-2 sm:px-5 sm:py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-stone-950 shadow-lg transition-all hover:bg-amber-400 hover:shadow-amber-500/30 active:scale-95"
        >
          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Login / Register</span>
        </Link>
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
               bg-[#102701] px-6 sm:px-8 py-3.5 sm:py-4 text-xs font-bold uppercase tracking-wider text-emerald-100 shadow-xl backdrop-blur-sm transition-all hover:bg-[#102701]-80 hover:shadow-emerald-900/40 active:scale-98"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
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
      <WheatGrowthSection />
    </div>
  )
}