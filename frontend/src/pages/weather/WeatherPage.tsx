import { Droplets, Info, MapPin, Wind } from 'lucide-react'
import { currentWeather, dailyForecast, farmingAdvice, hourlyForecast } from '@/data/mock/mockWeatherForecast'

export default function WeatherPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
      {/* Current conditions */}
      <div className="rounded-3xl bg-sky-500 p-6 text-white">
        <p className="flex items-center gap-1 text-xs text-sky-50/90">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {currentWeather.location}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <currentWeather.icon className="h-16 w-16" strokeWidth={1.4} aria-hidden="true" />
          <div>
            <p className="text-5xl font-bold">{currentWeather.tempC}°</p>
            <p className="text-sm text-sky-50/90">{currentWeather.condition} · Feels like {currentWeather.feelsLikeC}°</p>
          </div>
        </div>
        <div className="mt-4 flex gap-5 text-xs text-sky-50/90">
          <span className="flex items-center gap-1">
            <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
            {currentWeather.humidityPercent}% humidity
          </span>
          <span className="flex items-center gap-1">
            <Wind className="h-3.5 w-3.5" aria-hidden="true" />
            {currentWeather.windKmh} km/h wind
          </span>
          <span>{currentWeather.rainChancePercent}% rain chance</span>
        </div>
      </div>

      {/* Hourly */}
      <section className="mt-5">
        <h2 className="mb-2 text-base">Hourly Forecast</h2>
        <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
          {hourlyForecast.map((h) => (
            <div key={h.hour} className="flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-ink-100 bg-surface py-3">
              <span className="text-[11px] text-ink-500">{h.hour}</span>
              <h.icon className="h-5 w-5 text-sky-500" aria-hidden="true" />
              <span className="text-sm font-semibold text-ink-900">{h.tempC}°</span>
              <span className="text-[10px] text-sky-600">{h.rainChancePercent}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* 7-day */}
      <section className="mt-5">
        <h2 className="mb-2 text-base">7-Day Forecast</h2>
        <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-surface">
          {dailyForecast.map((d) => (
            <div key={d.day} className="flex items-center justify-between px-4 py-3">
              <span className="w-20 text-sm font-medium text-ink-800">{d.day}</span>
              <d.icon className="h-5 w-5 text-sky-500" aria-hidden="true" />
              <span className="w-10 text-right text-xs text-sky-600">{d.rainChancePercent}%</span>
              <span className="w-20 text-right text-sm text-ink-700">
                <span className="font-semibold text-ink-900">{d.highC}°</span> / {d.lowC}°
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Farming advice */}
      <section className="mt-5 mb-4">
        <h2 className="mb-2 text-base">Farming Advice</h2>
        <div className="space-y-2">
          {farmingAdvice.map((advice) => (
            <div key={advice} className="flex items-start gap-2 rounded-2xl bg-brand-50 p-3 text-sm text-brand-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {advice}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
