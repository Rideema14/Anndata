import React, { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Sprout, ShieldCheck, Sun, TrendingUp } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

/* =========================================================
   TYPES & CONFIGURATION
========================================================= */

interface WheatLeafDef {
  heightRatio: number
  side: -1 | 1
  lengthRatio: number
  archFactor: number
  hue: number
}

interface FeatureCallout {
  id: string
  title: string
  category: string
  description: string
  minProgress: number
  position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom'
  metric: string
  icon: React.ElementType
  theme: 'green' | 'yellow'
  patchRadius: string
  rotateDeg: string
}

const WHEAT_LEAVES: WheatLeafDef[] = [
  { heightRatio: 0.15, side: -1, lengthRatio: 0.45, archFactor: 1.2, hue: 88 },
  { heightRatio: 0.28, side: 1, lengthRatio: 0.52, archFactor: 1.1, hue: 92 },
  { heightRatio: 0.42, side: -1, lengthRatio: 0.56, archFactor: 0.95, hue: 85 },
  { heightRatio: 0.58, side: 1, lengthRatio: 0.50, archFactor: 0.85, hue: 90 },
  { heightRatio: 0.72, side: -1, lengthRatio: 0.42, archFactor: 0.75, hue: 82 },
]

const FEATURES: FeatureCallout[] = [
  {
    id: 'grain',
    category: '01 / REPRODUCTIVE',
    title: 'Direct Market Value',
    description:
      'Spikelet density calculation providing automated mandi market rate predictions.',
    minProgress: 0.15,
    position: 'left-top',
    metric: 'Grade A++ Premium',
    icon: TrendingUp,
    theme: 'green',
    patchRadius: '28px 10px 36px 14px',
    rotateDeg: '-1.8deg',
  },
  {
    id: 'roots',
    category: '02 / GERMINATION',
    title: 'Deep Soil Intelligence',
    description:
      'Real-time root moisture tracking and organic soil nutrient analysis synced via AI.',
    minProgress: 0.38,
    position: 'left-bottom',
    metric: '99.4% Absorption',
    icon: Sprout,
    theme: 'yellow',
    patchRadius: '12px 32px 14px 28px',
    rotateDeg: '1.5deg',
  },
  {
    id: 'harvest',
    category: '03 / MATURITY',
    title: 'Harvest Yield Readiness',
    description:
      'Autonomous crop harvesting triggers activated precisely at peak golden maturity.',
    minProgress: 0.62,
    position: 'right-top',
    metric: '100% Ready To Sell',
    icon: ShieldCheck,
    theme: 'yellow',
    patchRadius: '32px 14px 26px 10px',
    rotateDeg: '2.0deg',
  },
  {
    id: 'foliage',
    category: '04 / VEGETATIVE',
    title: 'Solar Photosynthesis',
    description:
      'Optimized leaf canopy geometry engineered for maximum solar energy absorption.',
    minProgress: 0.82,
    position: 'right-bottom',
    metric: '+34% Biomass Growth',
    icon: Sun,
    theme: 'green',
    patchRadius: '14px 28px 10px 34px',
    rotateDeg: '-1.4deg',
  },
]

/* =========================================================
   MATH & CANVAS UTILITIES
========================================================= */

function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function easeOutCubic(t: number) {
  const v = clamp(t)
  return 1 - Math.pow(1 - v, 3)
}

function turbulence(t: number, seed: number) {
  return (
    Math.sin(t * 1.2 + seed) * 0.55 +
    Math.sin(t * 2.7 + seed * 1.4) * 0.3 +
    Math.sin(t * 4.2 + seed * 2.8) * 0.15
  )
}

/* =========================================================
   CANVAS DRAWING ROUTINES
========================================================= */

function drawWheatRoots(
  ctx: CanvasRenderingContext2D,
  cx: number,
  soilY: number,
  spread: number,
  depth: number,
  growth: number,
) {
  if (growth <= 0) return

  const g = easeOutCubic(growth)

  ctx.save()
  ctx.lineCap = 'round'

  const rootCount = 20

  for (let i = 0; i < rootCount; i++) {
    const angleOffset = (i / (rootCount - 1) - 0.5) * 1.7

    const maxLen =
      depth *
      (0.65 + Math.abs(Math.sin(i * 4.3)) * 0.5) *
      g

    const sideSpread =
      spread * angleOffset * 0.55 * g

    const endX =
      cx +
      sideSpread +
      Math.sin(i * 2.5) * 18

    const endY = soilY + maxLen

    const midX =
      cx +
      sideSpread * 0.4 +
      Math.cos(i * 1.8) * 14

    const midY = soilY + maxLen * 0.5

    ctx.beginPath()
    ctx.moveTo(cx, soilY)

    ctx.quadraticCurveTo(
      midX,
      midY,
      endX,
      endY,
    )

    const rootGrad = ctx.createLinearGradient(
      cx,
      soilY,
      endX,
      endY,
    )

    /* Smart Krishi green + golden yellow */
    rootGrad.addColorStop(0, '#f5bd06')
    rootGrad.addColorStop(0.5, '#65a30f')
    rootGrad.addColorStop(
      1,
      'rgba(16, 39, 1, 0)',
    )

    ctx.strokeStyle = rootGrad

    ctx.lineWidth = Math.max(
      0.6,
      2.5 *
        (1 - (i / rootCount) * 0.3) *
        (1 - (endY - soilY) / depth),
    )

    ctx.stroke()
  }

  ctx.restore()
}

function drawWheatBladeLeaf(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  stemWidth: number,
  side: -1 | 1,
  bladeLength: number,
  growth: number,
  wind: number,
  archFactor: number,
  hue: number,
  ripeness: number,
) {
  if (growth <= 0) return

  const g = easeOutCubic(growth)

  const len = bladeLength * g

  const maxBladeWidth = Math.max(
    4.0,
    len * 0.06,
  )

  const tipX =
    startX +
    side * len * 0.72 +
    wind * 28

  const tipY =
    startY -
    len * (0.35 / archFactor) +
    (1 - g * 0.3) * 30 +
    (1 - ripeness) * 10

  const midX =
    startX +
    side * len * 0.45 +
    wind * 12

  const midY =
    startY -
    len * (0.6 / archFactor)

  ctx.save()

  ctx.beginPath()

  ctx.moveTo(
    startX - stemWidth * 0.5,
    startY + 6,
  )

  ctx.quadraticCurveTo(
    midX + side * maxBladeWidth,
    midY,
    tipX,
    tipY,
  )

  ctx.quadraticCurveTo(
    midX - side * (maxBladeWidth * 0.3),
    midY + 8,
    startX + stemWidth * 0.5,
    startY - 4,
  )

  ctx.closePath()

  const currentHue = lerp(
    hue,
    43,
    ripeness,
  )

  const lightness = lerp(
    28,
    48,
    ripeness,
  )

  const saturation = lerp(
    60,
    85,
    ripeness,
  )

  const leafGrad = ctx.createLinearGradient(
    startX,
    startY,
    tipX,
    tipY,
  )

  leafGrad.addColorStop(
    0,
    `hsl(${currentHue - 8}, ${saturation}%, ${lightness - 10}%)`,
  )

  leafGrad.addColorStop(
    0.5,
    `hsl(${currentHue}, ${saturation}%, ${lightness}%)`,
  )

  leafGrad.addColorStop(
    1,
    `hsl(${currentHue + 12}, ${saturation + 10}%, ${lightness + 12}%)`,
  )

  ctx.fillStyle = leafGrad
  ctx.fill()

  ctx.beginPath()

  ctx.moveTo(
    startX,
    startY,
  )

  ctx.quadraticCurveTo(
    midX,
    midY,
    tipX,
    tipY,
  )

  ctx.strokeStyle = `hsl(${currentHue + 15}, 80%, ${lightness + 25}%)`

  ctx.lineWidth = 1.2

  ctx.stroke()

  ctx.restore()
}

function drawWheatHead(
  ctx: CanvasRenderingContext2D,
  topX: number,
  topY: number,
  headLength: number,
  growth: number,
  wind: number,
  ripeness: number,
) {
  if (growth <= 0) return

  const g = easeOutCubic(growth)

  const len = headLength * g

  const spikeletCount = 15

  ctx.save()

  ctx.translate(topX, topY)

  ctx.rotate(wind * 0.15)

  const hue = lerp(
    85,
    43,
    ripeness,
  )

  const sat = lerp(
    55,
    90,
    ripeness,
  )

  const light = lerp(
    32,
    54,
    ripeness,
  )

  ctx.beginPath()

  ctx.moveTo(0, 0)

  ctx.lineTo(0, -len)

  ctx.strokeStyle = `hsl(${hue}, ${sat}%, ${light - 10}%)`

  ctx.lineWidth = 3.0

  ctx.stroke()

  for (let i = 0; i < spikeletCount; i++) {
    const progress = i / spikeletCount

    if (progress > g) continue

    const sy = -len * progress

    const side =
      i % 2 === 0 ? 1 : -1

    const size =
      (1 -
        Math.abs(progress - 0.5) *
          0.65) *
      15 *
      Math.min(1, g * 1.2)

    ctx.save()

    ctx.translate(
      side * 2.5,
      sy,
    )

    ctx.rotate(
      side * 0.38 +
        wind * 0.05,
    )

    ctx.beginPath()

    ctx.ellipse(
      side * (size * 0.45),
      0,
      size * 0.52,
      size * 0.88,
      side * -0.25,
      0,
      Math.PI * 2,
    )

    const grainGrad =
      ctx.createRadialGradient(
        side * (size * 0.2),
        -size * 0.2,
        1,
        0,
        0,
        size * 0.9,
      )

    grainGrad.addColorStop(
      0,
      `hsl(${hue + 14}, ${sat + 10}%, ${light + 22}%)`,
    )

    grainGrad.addColorStop(
      0.6,
      `hsl(${hue}, ${sat}%, ${light}%)`,
    )

    grainGrad.addColorStop(
      1,
      `hsl(${hue - 8}, ${sat - 10}%, ${light - 15}%)`,
    )

    ctx.fillStyle = grainGrad

    ctx.strokeStyle = `hsl(${hue - 12}, ${sat}%, ${light - 20}%)`

    ctx.lineWidth = 0.7

    ctx.fill()

    ctx.stroke()

    const awnLength =
      size *
      2.8 *
      Math.min(1, g * 1.5)

    ctx.beginPath()

    ctx.moveTo(
      side * (size * 0.6),
      -size * 0.6,
    )

    ctx.quadraticCurveTo(
      side * (size * 1.2),
      -size * 1.8,
      side * (size * 1.5),
      -size * 0.6 -
        awnLength,
    )

    ctx.strokeStyle = `hsl(${hue + 12}, ${sat + 15}%, ${light + 20}%)`

    ctx.lineWidth = 0.95

    ctx.stroke()

    ctx.restore()
  }

  if (g > 0.8) {
    for (let a = -2; a <= 2; a++) {
      ctx.beginPath()

      ctx.moveTo(
        a * 1.8,
        -len,
      )

      ctx.quadraticCurveTo(
        a * 4.5,
        -len - 20,
        a * 8,
        -len - 45,
      )

      ctx.strokeStyle = `hsl(${hue + 12}, ${sat + 15}%, ${light + 22}%)`

      ctx.lineWidth = 1.0

      ctx.stroke()
    }
  }

  ctx.restore()
}

function drawWheatScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  time: number,
) {
  const p = clamp(progress)

  ctx.clearRect(
    0,
    0,
    width,
    height,
  )

  const cx = width / 2

  const soilY = height * 0.88

  const cropMaxHeight = Math.min(
    height * 0.46,
    380,
  )

  const cropWidth = Math.min(
    width * 0.38,
    320,
  )

  const rootProgress = clamp(
    p / 0.3,
  )

  drawWheatRoots(
    ctx,
    cx,
    soilY,
    cropWidth * 0.65,
    cropMaxHeight * 0.25,
    rootProgress,
  )

  const stemProgress = easeOutCubic(
    clamp((p - 0.1) / 0.65),
  )

  const currentStemHeight =
    cropMaxHeight * stemProgress

  const ripeness = clamp(
    (p - 0.68) / 0.32,
  )

  if (stemProgress > 0) {
    const wind =
      turbulence(
        time * 0.7,
        1.2,
      ) *
      0.08 *
      stemProgress

    const stemTopY =
      soilY -
      currentStemHeight

    const c1x =
      cx +
      wind * 15

    const c1y =
      soilY -
      currentStemHeight *
        0.4

    const c2x =
      cx +
      wind * 35

    const c2y =
      soilY -
      currentStemHeight *
        0.75

    const topX =
      cx +
      wind * 50

    const topY =
      stemTopY

    ctx.save()

    ctx.beginPath()

    ctx.moveTo(
      cx,
      soilY,
    )

    ctx.bezierCurveTo(
      c1x,
      c1y,
      c2x,
      c2y,
      topX,
      topY,
    )

    const stemHue = lerp(
      85,
      44,
      ripeness,
    )

    const stemGrad =
      ctx.createLinearGradient(
        cx,
        soilY,
        topX,
        topY,
      )

    stemGrad.addColorStop(
      0,
      `hsl(${stemHue - 10}, 60%, 20%)`,
    )

    stemGrad.addColorStop(
      0.5,
      `hsl(${stemHue}, 65%, 32%)`,
    )

    stemGrad.addColorStop(
      1,
      `hsl(${stemHue + 12}, 75%, 45%)`,
    )

    ctx.strokeStyle = stemGrad

    ctx.lineWidth = Math.max(
      2.6,
      7.5 *
        (1 -
          stemProgress *
            0.45),
    )

    ctx.lineCap = 'round'

    ctx.stroke()

    const nodeRatios = [
      0.25,
      0.5,
      0.72,
    ]

    nodeRatios.forEach(
      (ratio) => {
        if (
          stemProgress >=
          ratio
        ) {
          const t = ratio

          const nx =
            lerp(
              cx,
              topX,
              t,
            ) +
            Math.sin(
              t * Math.PI,
            ) *
              wind *
              20

          const ny =
            soilY -
            currentStemHeight *
              t

          ctx.beginPath()

          ctx.arc(
            nx,
            ny,
            Math.max(
              2.2,
              5.0 *
                (1 -
                  t * 0.3),
            ),
            0,
            Math.PI * 2,
          )

          ctx.fillStyle = `hsl(${stemHue - 12}, 50%, 22%)`

          ctx.fill()
        }
      },
    )

    WHEAT_LEAVES.forEach(
      (leaf) => {
        if (
          stemProgress >=
          leaf.heightRatio
        ) {
          const leafGrowth =
            clamp(
              (stemProgress -
                leaf.heightRatio) /
                0.22,
            )

          const t =
            leaf.heightRatio

          const lx =
            lerp(
              cx,
              topX,
              t,
            ) +
            Math.sin(
              t * Math.PI,
            ) *
              wind *
              20

          const ly =
            soilY -
            currentStemHeight *
              t

          const currentStemW =
            6.0 *
            (1 -
              t * 0.4)

          drawWheatBladeLeaf(
            ctx,
            lx,
            ly,
            currentStemW,
            leaf.side,
            cropWidth *
              leaf.lengthRatio,
            leafGrowth,
            wind,
            leaf.archFactor,
            leaf.hue,
            ripeness,
          )
        }
      },
    )

    if (p > 0.55) {
      const headGrowth =
        clamp(
          (p - 0.55) /
            0.4,
        )

      const headLength =
        Math.min(
          105,
          cropMaxHeight *
            0.26,
        )

      drawWheatHead(
        ctx,
        topX,
        topY,
        headLength,
        headGrowth,
        wind,
        ripeness,
      )
    }

    ctx.restore()
  }
}

/* =========================================================
   EXPORTED REACT COMPONENT
========================================================= */

export function PlantGrowthSection() {
  const sectionRef =
    useRef<HTMLDivElement>(null)

  const pinRef =
    useRef<HTMLDivElement>(null)

  const canvasRef =
    useRef<HTMLCanvasElement>(null)

  /* NEW: stores the ScrollTrigger instance */
  const triggerRef =
    useRef<ScrollTrigger | null>(null)

  const [scrollProgress, setScrollProgress] =
    useState(0)

  const targetProgressRef =
    useRef(0)

  const currentProgressRef =
    useRef(0)

  const animationRef =
    useRef<number | null>(null)

  const renderCanvas = useCallback(
    (
      canvas: HTMLCanvasElement,
      time: number,
    ) => {
      const rect =
        canvas.getBoundingClientRect()

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2,
      )

      const width = rect.width
      const height = rect.height

      const pixelWidth =
        Math.floor(
          width * dpr,
        )

      const pixelHeight =
        Math.floor(
          height * dpr,
        )

      if (
        canvas.width !==
          pixelWidth ||
        canvas.height !==
          pixelHeight
      ) {
        canvas.width =
          pixelWidth

        canvas.height =
          pixelHeight
      }

      const ctx =
        canvas.getContext('2d')

      if (!ctx) return

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0,
      )

      currentProgressRef.current =
        lerp(
          currentProgressRef.current,
          targetProgressRef.current,
          0.075,
        )

      drawWheatScene(
        ctx,
        width,
        height,
        currentProgressRef.current,
        time,
      )
    },
    [],
  )

  useEffect(() => {
    const section =
      sectionRef.current

    const pin =
      pinRef.current

    const canvas =
      canvasRef.current

    if (
      !section ||
      !pin ||
      !canvas
    ) {
      return
    }

    let destroyed = false

    const clockStart =
      performance.now()

    const animate = (
      now: number,
    ) => {
      if (destroyed) return

      const elapsed =
        (now -
          clockStart) /
        1000

      renderCanvas(
        canvas,
        elapsed,
      )

      animationRef.current =
        requestAnimationFrame(
          animate,
        )
    }

    animationRef.current =
      requestAnimationFrame(
        animate,
      )

    /* =====================================================
       GSAP SCROLLTRIGGER
    ===================================================== */

    const trigger =
      ScrollTrigger.create({
        trigger: section,

        pin,

        start: 'top top',

        end: '+=2800',

        scrub: 0.5,

        invalidateOnRefresh: true,

        onUpdate: (
          self,
        ) => {
          const p =
            clamp(
              self.progress,
            )

          targetProgressRef.current =
            p

          setScrollProgress(
            p,
          )
        },
      })

    /* Store trigger so navbar can use it */
    triggerRef.current =
      trigger

    /* =====================================================
       RESPONSIVE REFRESH
    ===================================================== */

    const handleResize =
      () => {
        ScrollTrigger.refresh()
      }

    window.addEventListener(
      'resize',
      handleResize,
    )

    /* =====================================================
       GROWTH NAVIGATION
       
       Navbar can dispatch:
       
       window.dispatchEvent(
         new Event('growth-final')
       )
    ===================================================== */

    const handleGrowthNavigation =
      () => {
        const activeTrigger =
          triggerRef.current

        if (
          !activeTrigger
        ) {
          return
        }

        /*
         * Feature 4 begins at 0.82.
         *
         * 0.86 gives enough progress for
         * ALL four feature cards to be visible.
         */

        const targetProgress =
          0.86

        /*
         * Use GSAP's REAL calculated
         * start/end positions.
         *
         * This makes it responsive.
         */

        const targetScroll =
          activeTrigger.start +
          (
            activeTrigger.end -
            activeTrigger.start
          ) *
            targetProgress

        window.scrollTo({
          top: targetScroll,
          behavior:
            'smooth',
        })
      }

    window.addEventListener(
      'growth-final',
      handleGrowthNavigation,
    )

    /* =====================================================
       CLEANUP
    ===================================================== */

    return () => {
      destroyed = true

      window.removeEventListener(
        'resize',
        handleResize,
      )

      window.removeEventListener(
        'growth-final',
        handleGrowthNavigation,
      )

      if (
        animationRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationRef.current,
        )
      }

      trigger.kill()

      triggerRef.current =
        null
    }
  }, [renderCanvas])

  const getPositionClasses = (
    pos: FeatureCallout['position'],
  ) => {
    switch (pos) {
      case 'left-top':
        return 'left-4 sm:left-8 md:left-12 top-[26%] sm:top-[28%]'

      case 'left-bottom':
        return 'left-4 sm:left-8 md:left-12 bottom-[8%] sm:bottom-[10%]'

      case 'right-top':
        return 'right-4 sm:right-8 md:right-12 top-[24%] sm:top-[26%]'

      case 'right-bottom':
        return 'right-4 sm:right-8 md:right-12 bottom-[10%] sm:bottom-[12%]'
    }
  }

  const progressPercent =
    Math.round(
      scrollProgress * 100,
    )

  return (
    <section
      id="growth"
      ref={sectionRef}
      className="relative w-full bg-[#0a0a0a] text-[#faf5e8]"
    >
      {/* SEAMLESS TRANSITION GRADIENT */}

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 h-28 bg-gradient-to-b from-[#0a0a0a] to-transparent" />

      <div
        ref={pinRef}
        className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#0a0a0a]"
      >
        {/* BACKGROUND GLOW */}

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(245,189,6,0.06),transparent_42%)]" />
        </div>

        {/* HEADER — SAME STICKER STYLE AS LANDING TAGLINE */}

        <div className="pointer-events-none absolute inset-x-0 top-8 sm:top-10 z-30 flex justify-center px-4">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 leading-none select-none">

            <h2 className="brand-sticker-green text-4xl sm:text-6xl md:text-7xl lg:text-[96px] leading-[1.1] sm:leading-none py-1">
              Why
            </h2>

            <span className=" -ml-4 brand-script-yellow text-3xl sm:text-5xl md:text-6xl lg:text-8xl -rotate-6 transform">
              choose
            </span>

            <h2 className="brand-sticker-green text-4xl sm:text-6xl md:text-7xl lg:text-[96px] leading-[1.1] sm:leading-none">
              Us
            </h2>

          </div>
        </div>

        {/* CENTERED CANVAS CROP */}

        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
        />

        {/* FEATURE CALLOUT PATCHES */}

        {FEATURES.map(
          (feature) => {
            const isVisible =
              scrollProgress >=
              feature.minProgress

            const IconComponent =
              feature.icon

            const isGreen =
              feature.theme ===
              'green'

            return (
              <div
                key={feature.id}
                className={`absolute z-20 w-[260px] sm:w-[310px] transition-all duration-700 ease-out ${getPositionClasses(
                  feature.position,
                )} ${
                  isVisible
                    ? 'pointer-events-auto scale-100 translate-y-0 opacity-100'
                    : 'pointer-events-none scale-95 translate-y-8 opacity-0'
                }`}
                style={{
                  transform:
                    isVisible
                      ? `rotate(${feature.rotateDeg})`
                      : undefined,
                }}
              >
                {/* ORGANIC ASYMMETRIC PATCH CARD */}

                <div
                  className={`relative p-5 border-2 shadow-[0_16px_36px_rgba(0,0,0,0.8)] ${
                    isGreen
                      ? 'border-[#2f6508] bg-[#102701] text-[#faf5e8]'
                      : 'border-[#f5bd06] bg-[#3a2800] text-[#fff9df]'
                  }`}
                  style={{
                    borderRadius:
                      feature.patchRadius,
                  }}
                >
                  {/* SOLID BADGE & METRIC BAR */}

                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider ${
                        isGreen
                          ? 'bg-[#1e4a03] text-[#b5d66a]'
                          : 'bg-[#5a4000] text-[#fde58a]'
                      }`}
                    >
                      {
                        feature.category
                      }
                    </span>

                    <span
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-extrabold ${
                        isGreen
                          ? 'border-[#65a30f] bg-[#163801] text-[#dcebb9]'
                          : 'border-[#f8c92f] bg-[#795600] text-[#fff1b8]'
                      }`}
                    >
                      <IconComponent className="h-3 w-3" />

                      {
                        feature.metric
                      }
                    </span>
                  </div>

                  <h3 className="text-base font-black tracking-tight text-[#faf5e8]">
                    {
                      feature.title
                    }
                  </h3>

                  <p
                    className={`mt-2 text-xs font-semibold leading-relaxed ${
                      isGreen
                        ? 'text-[#dcebb9]'
                        : 'text-[#fff1b8]'
                    }`}
                  >
                    {
                      feature.description
                    }
                  </p>
                </div>
              </div>
            )
          },
        )}
      </div>
    </section>
  )
}

export default PlantGrowthSection