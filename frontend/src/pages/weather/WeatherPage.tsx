import { useEffect, useState } from 'react'
import { Droplets, Info, MapPin, Wind, Cloud, Sun, CloudRain, CloudLightning, Snowflake, Loader2 } from 'lucide-react'
import { weatherService } from '@/services/weatherService'

// Helper to map WMO weather codes to Lucide icons
function getWeatherIcon(code: number) {
  if (code === 0 || code === 1) return Sun;
  if (code >= 2 && code <= 48) return Cloud;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return CloudRain;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return Snowflake;
  if (code >= 95) return CloudLightning;
  return Cloud;
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
          fetchWeather(28.6139, 77.2090)
        }
      )
    } else {
      setLocationName('New Delhi (Fallback)')
      fetchWeather(28.6139, 77.2090)
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center text-danger-500">
        {error || 'Unable to load weather.'}
      </div>
    )
  }

  const { current, daily } = data
  const CurrentIcon = getWeatherIcon(current.weatherCode)

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
      {/* Current conditions */}
      <div className="rounded-3xl bg-sky-500 p-6 text-white">
        <p className="flex items-center gap-1 text-xs text-sky-50/90">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {locationName}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <CurrentIcon className="h-16 w-16" strokeWidth={1.4} aria-hidden="true" />
          <div>
            <p className="text-5xl font-bold">{Math.round(current.temperatureC)}°</p>
            <p className="text-sm text-sky-50/90">{current.condition} · Feels like {Math.round(current.feelsLikeC)}°</p>
          </div>
        </div>
        <div className="mt-4 flex gap-5 text-xs text-sky-50/90">
          <span className="flex items-center gap-1">
            <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
            {current.humidityPercent}% humidity
          </span>
          <span className="flex items-center gap-1">
            <Wind className="h-3.5 w-3.5" aria-hidden="true" />
            {current.windSpeedKmh} km/h wind
          </span>
          <span className="flex items-center gap-1">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            {current.precipitationMm} mm rain
          </span>
        </div>
      </div>

      {/* 7-day */}
      <section className="mt-5">
        <h2 className="mb-2 text-base">7-Day Forecast</h2>
        <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-surface">
          {daily.map((d: any, idx: number) => {
            const Icon = getWeatherIcon(d.weatherCode)
            const dayLabel = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
            return (
              <div key={d.date} className="flex items-center justify-between px-4 py-3">
                <span className="w-20 text-sm font-medium text-ink-800">{dayLabel}</span>
                <Icon className="h-5 w-5 text-sky-500" aria-hidden="true" />
                <span className="w-10 text-right text-xs text-sky-600">{d.precipitationProbabilityMax}% rain</span>
                <span className="w-24 text-right text-sm text-ink-700">
                  <span className="font-semibold text-ink-900">{Math.round(d.tempMaxC)}°</span> / {Math.round(d.tempMinC)}°
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Farming advice (Mocked for now since backend only sends weather data) */}
      <section className="mt-5 mb-4">
        <h2 className="mb-2 text-base">Farming Advice</h2>
        <div className="space-y-2">
          {current.precipitationMm > 5 ? (
            <div className="flex items-start gap-2 rounded-2xl bg-brand-50 p-3 text-sm text-brand-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Heavy rain expected. Delay fertilizer application to avoid runoff.
            </div>
          ) : current.temperatureC > 35 ? (
            <div className="flex items-start gap-2 rounded-2xl bg-danger-50 p-3 text-sm text-danger-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              High temperatures. Ensure adequate irrigation in the late afternoon.
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-2xl bg-brand-50 p-3 text-sm text-brand-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Conditions are optimal for routine field maintenance and harvesting.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
