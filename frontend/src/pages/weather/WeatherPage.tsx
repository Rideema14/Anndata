import { useEffect, useState } from 'react'
import { Droplets, Info, MapPin, Wind, Cloud, Sun, CloudRain, CloudLightning, Snowflake, Loader2, Leaf } from 'lucide-react'
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

  // Determine a dynamic background gradient based on weather code
  // Sunny/Clear
  let bgGradient = 'bg-gradient-to-br from-amber-400 to-orange-500'
  let textColor = 'text-white'
  
  // Cloudy
  if (current.weatherCode >= 2 && current.weatherCode <= 48) {
    bgGradient = 'bg-gradient-to-br from-slate-400 to-slate-600'
  }
  // Rain/Storm
  else if (current.weatherCode >= 51 && current.weatherCode <= 99) {
    bgGradient = 'bg-gradient-to-br from-indigo-700 to-slate-800'
  }

  // Calculate global min/max for the 7 days to scale the temperature bars
  const weeklyMin = Math.min(...daily.map((d: any) => d.tempMinC))
  const weeklyMax = Math.max(...daily.map((d: any) => d.tempMaxC))
  const rangeSpan = weeklyMax - weeklyMin || 1

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8 space-y-6">
      
      {/* 1. Dynamic Hero Card (Glassmorphism) */}
      <div className={`relative overflow-hidden rounded-3xl p-6 ${bgGradient} ${textColor} shadow-lg transition-colors duration-700`}>
        {/* Decorative background glow/blur (Glassmorphism hint) */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" aria-hidden="true" />
        
        <div className="relative z-10">
          <p className="flex items-center gap-1.5 text-sm font-medium opacity-90 drop-shadow-sm">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {locationName}
          </p>
          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="text-6xl font-extrabold tracking-tight drop-shadow-sm">{Math.round(current.temperatureC)}°</p>
              <p className="mt-1 text-lg font-medium opacity-95 drop-shadow-sm">
                {current.condition}
              </p>
              <p className="text-sm opacity-80 drop-shadow-sm">
                Feels like {Math.round(current.feelsLikeC)}°
              </p>
            </div>
            {/* Animated weather icon */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center">
              <CurrentIcon className="h-20 w-20 animate-[pulse_3s_ease-in-out_infinite] opacity-90 drop-shadow-md" strokeWidth={1.2} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sleek Metrics Grid (Translucent Tiles) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-100 bg-surface/80 p-4 shadow-sm backdrop-blur-md transition-transform hover:scale-105">
          <Droplets className="mb-2 h-6 w-6 text-brand-500" aria-hidden="true" />
          <p className="text-xs font-medium text-ink-500">Humidity</p>
          <p className="text-sm font-bold text-ink-900">{current.humidityPercent}%</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-100 bg-surface/80 p-4 shadow-sm backdrop-blur-md transition-transform hover:scale-105">
          <Wind className="mb-2 h-6 w-6 text-sky-500" aria-hidden="true" />
          <p className="text-xs font-medium text-ink-500">Wind</p>
          <p className="text-sm font-bold text-ink-900">{current.windSpeedKmh} km/h</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-100 bg-surface/80 p-4 shadow-sm backdrop-blur-md transition-transform hover:scale-105">
          <CloudRain className="mb-2 h-6 w-6 text-indigo-500" aria-hidden="true" />
          <p className="text-xs font-medium text-ink-500">Rainfall</p>
          <p className="text-sm font-bold text-ink-900">{current.precipitationMm} mm</p>
        </div>
      </div>

      {/* 3. Apple-Style 7-Day Forecast */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900">7-Day Forecast</h2>
        <div className="rounded-3xl border border-ink-100 bg-surface/80 shadow-sm backdrop-blur-md">
          {daily.map((d: any, idx: number) => {
            const Icon = getWeatherIcon(d.weatherCode)
            const dayLabel = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
            
            // Calculate bar positioning and width
            const minTemp = Math.round(d.tempMinC)
            const maxTemp = Math.round(d.tempMaxC)
            
            const leftPercent = ((minTemp - weeklyMin) / rangeSpan) * 100
            const widthPercent = ((maxTemp - minTemp) / rangeSpan) * 100

            return (
              <div key={d.date} className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-ink-50/50 first:rounded-t-3xl last:rounded-b-3xl border-b border-ink-100 last:border-b-0">
                <span className="w-20 text-sm font-semibold text-ink-800">{dayLabel}</span>
                
                <div className="flex w-16 items-center justify-center gap-1">
                  <Icon className="h-5 w-5 text-ink-600 transition-transform group-hover:scale-110" aria-hidden="true" />
                  {d.precipitationProbabilityMax > 10 && (
                    <span className="text-[10px] font-bold text-sky-500">{d.precipitationProbabilityMax}%</span>
                  )}
                </div>
                
                <div className="flex flex-1 items-center gap-3 pl-4">
                  <span className="w-6 text-right text-sm font-medium text-ink-500">{minTemp}°</span>
                  {/* Temperature Bar Background */}
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-ink-100">
                    {/* Active Temperature Range Bar */}
                    <div 
                      className="absolute top-0 h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                      style={{ left: `${leftPercent}%`, width: `${Math.max(widthPercent, 5)}%` }} // min 5% width for visibility
                    />
                  </div>
                  <span className="w-6 text-left text-sm font-bold text-ink-900">{maxTemp}°</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. Premium Farming Advice Call-out */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900">Farm Advisory</h2>
        <div className="space-y-3">
          {current.precipitationMm > 5 ? (
            <div className="flex items-start gap-4 rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-100 p-5 shadow-sm border border-indigo-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-200/50">
                <CloudRain className="h-5 w-5 text-indigo-700" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-indigo-900">Heavy Rain Expected</h3>
                <p className="mt-1 text-sm text-indigo-800/90 leading-relaxed">Delay fertilizer application and spraying to avoid runoff. Ensure drainage channels are clear.</p>
              </div>
            </div>
          ) : current.temperatureC > 35 ? (
            <div className="flex items-start gap-4 rounded-3xl bg-gradient-to-br from-orange-50 to-red-100 p-5 shadow-sm border border-red-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-200/50">
                <Sun className="h-5 w-5 text-red-700" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-red-900">High Temperatures</h3>
                <p className="mt-1 text-sm text-red-800/90 leading-relaxed">Ensure adequate irrigation in the late afternoon. Protect temperature-sensitive crops with shade netting if possible.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4 rounded-3xl bg-gradient-to-br from-brand-50 to-green-100 p-5 shadow-sm border border-brand-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-200/50">
                <Leaf className="h-5 w-5 text-brand-700" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-brand-900">Optimal Conditions</h3>
                <p className="mt-1 text-sm text-brand-800/90 leading-relaxed">Weather is perfect for routine field maintenance, spraying, and harvesting. Proceed with planned agricultural activities.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
