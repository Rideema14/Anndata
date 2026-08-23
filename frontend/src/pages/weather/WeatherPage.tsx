import { useEffect, useState } from 'react'
import {
  Droplets,
  MapPin,
  Wind,
  Cloud,
  Sun,
  CloudRain,
  CloudLightning,
  Snowflake,
  Loader2,
  Leaf,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'
import { weatherService } from '@/services/weatherService'

// Helper to map WMO weather codes to Lucide icons
function getWeatherIcon(code: number) {
  if (code === 0 || code === 1) return Sun
  if (code >= 2 && code <= 48) return Cloud
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return CloudRain
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return Snowflake
  if (code >= 95) return CloudLightning
  return Cloud
}

function isRainCode(code: number) {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 99)
}

function isClearCode(code: number) {
  return code === 0 || code === 1
}

export default function WeatherPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locationName, setLocationName] = useState('Your Location')

  useEffect(() => {
    async function fetchWeather(lat: number, lng: number) {
      try {
        setLoading(true)
        const res = await weatherService.getWeather(lat, lng, 7)
        setData(res.data || res)
      } catch (err) {
        console.error('Failed to fetch weather', err)
        setError('Failed to load weather data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude)
        },
        (err) => {
          console.warn('Geolocation blocked or failed', err)
          // Fallback to New Delhi if denied
          setLocationName('New Delhi (Fallback)')
          fetchWeather(28.6139, 77.209)
        },
      )
    } else {
      setLocationName('New Delhi (Fallback)')
      fetchWeather(28.6139, 77.209)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f4f0e6]">
        <Loader2 className="h-7 w-7 animate-spin text-[#788d66]" aria-hidden="true" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center bg-[#f4f0e6] px-4 text-center text-[#8a513d]">
        {error || 'Unable to load weather.'}
      </div>
    )
  }

  const { current, daily } = data
  const CurrentIcon = getWeatherIcon(current.weatherCode)
  const rainy = isRainCode(current.weatherCode)
  const clear = isClearCode(current.weatherCode)

  // Calculate global min/max for the 7 days to scale the temperature bars
  const weeklyMin = Math.min(...daily.map((d: any) => d.tempMinC))
  const weeklyMax = Math.max(...daily.map((d: any) => d.tempMaxC))
  const rangeSpan = weeklyMax - weeklyMin || 1

  // Which advisory applies right now
  const advisory =
    current.precipitationMm > 5
      ? {
          eyebrow: 'Advisory / Rain',
          title: 'Heavy rain expected',
          body: 'Delay fertilizer application and spraying to avoid runoff. Ensure drainage channels are clear.',
          icon: CloudRain,
          cardBg: '#3a4a52',
          iconBg: '#4f636b',
          iconColor: '#cfe0e6',
          eyebrowColor: '#a9c1c8',
          titleColor: '#eef4f5',
          bodyColor: '#c6d5d8',
        }
      : current.temperatureC > 35
        ? {
            eyebrow: 'Advisory / Heat',
            title: 'High temperatures',
            body: 'Ensure adequate irrigation in the late afternoon. Protect temperature-sensitive crops with shade netting if possible.',
            icon: Sun,
            cardBg: '#5c3b2e',
            iconBg: '#75503f',
            iconColor: '#f0c9a0',
            eyebrowColor: '#d8b79c',
            titleColor: '#f7ece2',
            bodyColor: '#e0c8b8',
          }
        : {
            eyebrow: 'Advisory / Field',
            title: 'Optimal conditions',
            body: 'Weather is perfect for routine field maintenance, spraying, and harvesting. Proceed with planned agricultural activities.',
            icon: Leaf,
            cardBg: '#27351d',
            iconBg: '#3a4a2c',
            iconColor: '#d6b841',
            eyebrowColor: '#b7c79f',
            titleColor: '#f8f4e9',
            bodyColor: '#d5d9d0',
          }
  const AdvisoryIcon = advisory.icon

  return (
    <div className="min-h-screen bg-[#f4f0e6] text-[#292b24]">
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-9">
        {/* =================================================
            HERO
        ================================================= */}
        <section className="relative overflow-hidden rounded-[28px] bg-[#27351d] px-5 py-7 text-[#f8f4e9] sm:px-8 sm:py-8">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#b7c79f]">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {locationName}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3a4a2c] text-[#d6b841] transition-transform hover:-translate-y-0.5 hover:bg-[#425331]"
                aria-label="Refresh weather"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="text-[3.5rem] font-semibold leading-none tracking-[-0.05em] text-[#fbf7ec] sm:text-[4rem]">
                  {Math.round(current.temperatureC)}°
                </p>
                <p className="mt-3 text-[15px] font-semibold text-[#f0ede3]">{current.condition}</p>
                <p className="mt-1 text-[12px] text-[#c9d0c1]">Feels like {Math.round(current.feelsLikeC)}°</p>
              </div>

              {/* Decorative glyph — same construction language as the homepage snapshot */}
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                {clear && (
                  <>
                    <span className="absolute inset-2 rounded-full border-[4px] border-[#e7c94e] opacity-30" />
                    <Sun className="h-14 w-14 text-[#e7b92f]" strokeWidth={1.4} aria-hidden="true" />
                  </>
                )}
                {rainy && (
                  <div className="relative">
                    <CloudRain className="h-16 w-16 text-[#a7c3cc]" strokeWidth={1.2} aria-hidden="true" />
                    <div className="absolute left-3 top-[54px] flex gap-1.5">
                      <span className="h-4 w-[1.5px] rounded-full bg-[#a7c3cc]" />
                      <span className="h-5 w-[1.5px] rounded-full bg-[#a7c3cc]" />
                      <span className="h-3 w-[1.5px] rounded-full bg-[#a7c3cc]" />
                      <span className="h-5 w-[1.5px] rounded-full bg-[#a7c3cc]" />
                    </div>
                  </div>
                )}
                {!clear && !rainy && <CurrentIcon className="h-16 w-16 text-[#d8e0c9]" strokeWidth={1.2} aria-hidden="true" />}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-14 -right-8 opacity-[0.10]">
            <CurrentIcon className="h-56 w-56 text-[#d6b841]" strokeWidth={0.6} aria-hidden="true" />
          </div>
        </section>

        {/* =================================================
            METRICS
        ================================================= */}
        <section className="grid grid-cols-3 gap-3">
          <div className="group rounded-[22px] border border-[#d8d0bf] bg-[#fffdf7] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(63,55,38,0.08)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7eddf]">
              <Droplets className="h-4 w-4 text-[#5f7651]" strokeWidth={1.6} aria-hidden="true" />
            </div>
            <p className="mt-3 text-[1.4rem] font-semibold leading-none tracking-[-0.03em] text-[#25291f]">
              {current.humidityPercent}%
            </p>
            <p className="mt-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#898274]">Humidity</p>
          </div>

          <div className="group rounded-[22px] border border-[#d8d0bf] bg-[#fffdf7] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(63,55,38,0.08)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e3e9ec]">
              <Wind className="h-4 w-4 text-[#4a6b78]" strokeWidth={1.6} aria-hidden="true" />
            </div>
            <p className="mt-3 text-[1.4rem] font-semibold leading-none tracking-[-0.03em] text-[#25291f]">
              {current.windSpeedKmh}
              <span className="text-[11px] font-semibold text-[#898274]"> km/h</span>
            </p>
            <p className="mt-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#898274]">Wind</p>
          </div>

          <div className="group rounded-[22px] border border-[#d8d0bf] bg-[#fffdf7] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(63,55,38,0.08)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eee9dc]">
              <CloudRain className="h-4 w-4 text-[#8a6a2e]" strokeWidth={1.6} aria-hidden="true" />
            </div>
            <p className="mt-3 text-[1.4rem] font-semibold leading-none tracking-[-0.03em] text-[#25291f]">
              {current.precipitationMm}
              <span className="text-[11px] font-semibold text-[#898274]"> mm</span>
            </p>
            <p className="mt-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#898274]">Rainfall</p>
          </div>
        </section>

        {/* =================================================
            7-DAY FORECAST
        ================================================= */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#898274]">Outlook</p>
              <h2 className="mt-1 text-[19px] font-extrabold tracking-[-0.02em] text-[#292c23]">7-day forecast</h2>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#d8d0bf] bg-[#fffdf7]">
            {daily.map((d: any, idx: number) => {
              const Icon = getWeatherIcon(d.weatherCode)
              const dayLabel =
                idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })

              const minTemp = Math.round(d.tempMinC)
              const maxTemp = Math.round(d.tempMaxC)

              const leftPercent = ((minTemp - weeklyMin) / rangeSpan) * 100
              const widthPercent = ((maxTemp - minTemp) / rangeSpan) * 100

              return (
                <div
                  key={d.date}
                  className="flex items-center justify-between border-b border-[#e5dfd1] px-5 py-4 transition-colors last:border-b-0 hover:bg-[#f4f0e0]/60"
                >
                  <span className="w-[74px] text-[13px] font-bold text-[#454238]">{dayLabel}</span>

                  <div className="flex w-16 items-center justify-center gap-1">
                    <Icon className="h-4.5 w-4.5 text-[#6c7a5e]" strokeWidth={1.6} aria-hidden="true" />
                    {d.precipitationProbabilityMax > 10 && (
                      <span className="text-[10px] font-bold text-[#4a6b78]">{d.precipitationProbabilityMax}%</span>
                    )}
                  </div>

                  <div className="flex flex-1 items-center gap-3 pl-4">
                    <span className="w-6 text-right text-[12px] font-medium text-[#969082]">{minTemp}°</span>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#eee9dc]">
                      <div
                        className="absolute top-0 h-full rounded-full bg-gradient-to-r from-[#788d66] to-[#d6b841]"
                        style={{ left: `${leftPercent}%`, width: `${Math.max(widthPercent, 6)}%` }}
                      />
                    </div>
                    <span className="w-6 text-left text-[12px] font-bold text-[#25291f]">{maxTemp}°</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* =================================================
            FARM ADVISORY
        ================================================= */}
        <section>
          <div className="mb-3">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#898274]">Recommendation</p>
            <h2 className="mt-1 text-[19px] font-extrabold tracking-[-0.02em] text-[#292c23]">Farm advisory</h2>
          </div>

          <div className="rounded-[22px] p-5" style={{ backgroundColor: advisory.cardBg }}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3.5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: advisory.iconBg }}
                >
                  <AdvisoryIcon className="h-4.5 w-4.5" style={{ color: advisory.iconColor }} aria-hidden="true" />
                </div>
                <div>
                  <p
                    className="font-mono text-[9px] font-bold uppercase tracking-[0.16em]"
                    style={{ color: advisory.eyebrowColor }}
                  >
                    {advisory.eyebrow}
                  </p>
                  <h3 className="mt-1.5 text-[15px] font-bold" style={{ color: advisory.titleColor }}>
                    {advisory.title}
                  </h3>
                  <p className="mt-1.5 max-w-md text-[13px] leading-relaxed" style={{ color: advisory.bodyColor }}>
                    {advisory.body}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="hidden h-3.5 w-3.5 shrink-0 text-[#d6b841] sm:block" aria-hidden="true" />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}