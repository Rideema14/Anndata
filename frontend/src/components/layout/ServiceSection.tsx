import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Store,
  Cpu,
  TrendingUp,
  Tractor,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
 type LucideIcon,
} from 'lucide-react'

interface ServiceStep {
  id: string
  number: string
  title: string
  subtitle: string
  description: string
  icon: LucideIcon
  badge: string
  features: string[]
  image: string
  align: 'left' | 'right'
}

const services: ServiceStep[] = [
  {
    id: 'marketplace',
    number: '01',
    title: 'Direct Agri Marketplace',
    subtitle: 'Farm to Buyer • Zero Commission',
    description:
      'Connect directly with verified institutional buyers, retail chains, and exporters. Eliminate agent cuts and secure guaranteed escrow settlements with instant payouts.',
    icon: Store,
    badge: 'Direct Trade',
    features: [
      'Zero broker commission fees',
      'Instant escrow payouts upon delivery',
      '100% verified institutional buyers',
    ],
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    align: 'left',
  },
  {
    id: 'ai-advisory',
    number: '02',
    title: 'AI Crop Intelligence',
    subtitle: '7-Day Predictive Diagnostics',
    description:
      'Upload crop photos or sync satellite telemetry to detect fungal infections, soil stress, and irrigation needs up to a week before symptoms become visible.',
    icon: Cpu,
    badge: 'AI Telemetry',
    features: [
      '98.4% diagnostic accuracy',
      'Micro-climate weather forecasting',
      'Organic treatment scheduling',
    ],
    image:
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
    align: 'right',
  },
  {
    id: 'mandi-rates',
    number: '03',
    title: 'Real-Time Mandi Analytics',
    subtitle: 'Live Spot Prices & Trend Forecasts',
    description:
      'Track live prices across 2,500+ APMC mandis. Predictive algorithms analyze arrival volumes to advise you on the exact day and market to sell for maximum profit.',
    icon: TrendingUp,
    badge: 'Live Data',
    features: [
      '2,500+ APMC live price feeds',
      '7-Day price trajectory modeling',
      'Historical volume & demand charts',
    ],
    image:
      'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=1200&q=80',
    align: 'left',
  },
  {
    id: 'machinery-rentals',
    number: '04',
    title: 'Smart Equipment Fleet',
    subtitle: 'On-Demand Pay-Per-Acre Automation',
    description:
      'Rent modern tractors, combine harvesters, and precision spraying drones on-demand with certified operators, or earn passive revenue renting out your idle machinery.',
    icon: Tractor,
    badge: 'Machinery Pool',
    features: [
      '15-Minute instant booking',
      'Certified machine operators included',
      'Real-time GPS work tracking',
    ],
    image:
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80',
    align: 'right',
  },
]

export function ServicesSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const [scrollProgress, setScrollProgress] = useState(0)
  const [totalPathLength, setTotalPathLength] = useState(0)

  // Measure exact SVG path length dynamically
  useEffect(() => {
    if (pathRef.current) {
      setTotalPathLength(pathRef.current.getTotalLength())
    }
  }, [])

  // Card-Anchored Scroll Listener (Fixes line speed & lag)
  useEffect(() => {
    let animationFrameId: number

    const handleScroll = () => {
      const card1 = cardRefs.current[0]
      const card4 = cardRefs.current[3]

      if (!card1 || !card4) return

      const card1Rect = card1.getBoundingClientRect()
      const card4Rect = card4.getBoundingClientRect()

      // Vertical midpoints of Card 1 and Card 4
      const card1Center = card1Rect.top + card1Rect.height / 2
      const card4Center = card4Rect.top + card4Rect.height / 2

      // Target position: Middle of current screen viewport
      const viewportCenter = window.innerHeight * 0.50

      const totalDistanceBetweenCards = card4Center - card1Center
      if (totalDistanceBetweenCards <= 0) return

      const currentScrollDistance = viewportCenter - card1Center
      const progress = Math.min(
        Math.max(currentScrollDistance / totalDistanceBetweenCards, 0),
        1
      )

      setScrollProgress(progress)
    }

    const onScroll = () => {
      animationFrameId = requestAnimationFrame(handleScroll)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const strokeOffset = totalPathLength
    ? totalPathLength - totalPathLength * scrollProgress
    : 0

  return (
    <section
      ref={containerRef}
      id="services"
      className="relative bg-[#1c2a13] py-24 sm:py-32 text-[#f8f4e9] font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden "
    >
      {/* ================= HERO MATCH: MICRO-GRID ================= */}

      <div className=" -mt-15 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ================= HERO-STYLE HEADER ================= */}
        <div className="text-center max-w-5xl mx-auto mb-20 sm:mb-28 space-y-5">
             <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 leading-none select-none">

            <h2 className="brand-sticker-green text-4xl sm:text-6xl md:text-7xl lg:text-[96px] leading-[1.1] sm:leading-none py-1">
              Services
            </h2>

            <span className=" -ml-4 brand-script-yellow text-3xl sm:text-5xl md:text-6xl lg:text-8xl -rotate-6 transform">
              that we 
            </span>

            <h2 className="brand-sticker-green text-4xl sm:text-6xl md:text-7xl lg:text-[96px] leading-[1.1] sm:leading-none">
              Provide
            </h2>

          </div>
        </div>

        {/* ================= ZIGZAG TRACK FLOW ================= */}
        <div className="relative">
          
          {/* DESKTOP SVG TRACK (Aligned 1:1 with card row centers) */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 1200"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Static Guide Line */}
              <path
                d="M 250 150 C 250 300, 750 300, 750 450 C 750 600, 250 600, 250 750 C 250 900, 750 900, 750 1050"
                stroke="#394a2d"
                strokeWidth="4"
                strokeDasharray="8 8"
              />

              {/* Perfectly Synchronized Moving Amber Line */}
              <path
                ref={pathRef}
                d="M 250 150 C 250 300, 750 300, 750 450 C 750 600, 250 600, 250 750 C 250 900, 750 900, 750 1050"
                stroke="#d6b841"
                strokeWidth="5"
                strokeDasharray={totalPathLength || 1500}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* MOBILE VERTICAL TRACK */}
          <div className="lg:hidden absolute left-6 top-0 bottom-0 w-1 bg-[#27351d] pointer-events-none z-0">
            <div
              className="w-full bg-[#d6b841]"
              style={{ height: `${scrollProgress * 100}%` }}
            />
          </div>

          {/* ================= STEP CARDS ================= */}
          <div className="space-y-16 sm:space-y-24 relative z-10">
            {services.map((step, index) => {
              const Icon = step.icon
              const isRightAligned = step.align === 'right'

              return (
                <div
                  key={step.id}
                  ref={(el) => {
                    cardRefs.current[index] = el
                  }}
                  className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                    isRightAligned ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* --- STATIC PICTURE CARD (No hover zooms or glow) --- */}
                  <div className="w-full lg:w-1/2 pl-10 lg:pl-0">
                    <div className="relative rounded-2xl overflow-hidden border border-[#394a2d]/80 bg-[#27351d]/80 p-2 shadow-xl">
                      <div className="relative h-60 sm:h-72 w-full rounded-xl overflow-hidden">
                        <img
                          src={step.image}
                          alt={step.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1c2a13] via-[#1c2a13]/20 to-transparent" />

                        {/* Top Badge Overlay */}
                        <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full border border-[#394a2d] bg-[#1c2a13]/90 px-3.5 py-1">
                          <Icon className="h-3.5 w-3.5 text-[#d6b841]" />
                          <span className="text-[11px] font-black uppercase tracking-wider text-[#e7eee1]">
                            {step.badge}
                          </span>
                        </div>

                        {/* Step Number Tag */}
                        <div className="absolute bottom-3 right-4 font-mono text-4xl font-black text-white/20">
                          {step.number}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- TEXT CONTENT & DESCRIPTION --- */}
                  <div className="w-full lg:w-1/2 space-y-4 pl-10 lg:pl-0">
                    
                    {/* Subtitle Tag */}
                    <div className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#d6b841]" />
                      <span className="text-xs font-black uppercase tracking-widest text-[#d6b841]">
                        {step.subtitle}
                      </span>
                    </div>

                    {/* Card Title */}
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      {step.title}
                    </h3>

                    {/* Description Paragraph */}
                    <p className="text-sm font-light text-[#d5d9d0] leading-relaxed max-w-lg">
                      {step.description}
                    </p>

                    {/* Bullet Points */}
                    <ul className="space-y-2 pt-2 border-t border-[#394a2d]/80">
                      {step.features.map((feat, fIdx) => (
                        <li
                          key={fIdx}
                          className="flex items-center gap-2.5 text-xs font-medium text-[#d5d9d0]"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#d6b841] shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Link */}
                    <div className="pt-1">
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#d6b841] hover:text-[#e0c64d] transition-colors"
                      >
                        <span>Explore Capability</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        </div>

        {/* ================= BOTTOM CTA BANNER ================= */}
        <div className="mt-20 sm:mt-28 rounded-2xl border border-[#394a2d] bg-[#27351d]/90 p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Ready to elevate your harvest workflow?
            </h3>
            <p className="text-xs sm:text-sm text-[#aebca2] leading-relaxed font-light">
              Join 45,000+ agricultural enterprises and farmers maximizing yields on FarmVerse.
            </p>
            <div className="pt-1">
              <Link
                to="/register"
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#d6b841] px-8 py-3.5 text-xs font-black uppercase tracking-widest text-[#262c1d] transition-colors hover:bg-[#e0c64d]"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Create Free Account</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}