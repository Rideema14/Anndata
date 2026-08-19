import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CloudRain, Droplets } from 'lucide-react'
import { SelectField } from '@/components/common/FormField'
import { currentWeather, dailyForecast } from '@/data/mock/mockWeatherForecast'
import { mandiCrops } from '@/data/mock/mockMandiData'
import { cn } from '@/utils/cn'

export default function IrrigationAdvicePage() {
  const [crop, setCrop] = useState(mandiCrops[0])
  const tomorrow = dailyForecast[1]
  const needsIrrigation = tomorrow.rainChancePercent < 50

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Irrigation Advice</h1>
      <p className="mb-5 text-sm text-ink-500">Based on your crop and the local weather forecast.</p>

      <SelectField id="crop" label="Current Crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
        {mandiCrops.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </SelectField>

      <div
        className={cn(
          'mt-4 rounded-2xl p-5 text-center',
          needsIrrigation ? 'bg-sky-500 text-white' : 'bg-brand-600 text-white',
        )}
      >
        {needsIrrigation ? <Droplets className="mx-auto mb-2 h-9 w-9" aria-hidden="true" /> : <CloudRain className="mx-auto mb-2 h-9 w-9" aria-hidden="true" />}
        <p className="text-lg font-bold">{needsIrrigation ? 'Irrigation needed today' : 'Irrigation not required today'}</p>
        <p className="mt-1 text-sm text-white/85">
          {needsIrrigation
            ? `Low rain chance (${tomorrow.rainChancePercent}%) expected tomorrow — irrigate ${crop.toLowerCase()} today.`
            : `Rain is expected tomorrow (${tomorrow.rainChancePercent}% chance) — you can skip irrigation today.`}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-ink-100 bg-surface p-4 text-sm">
        <div className="flex justify-between text-ink-600">
          <span>Today's condition</span>
          <span className="font-medium text-ink-900">{currentWeather.condition}, {currentWeather.tempC}°C</span>
        </div>
        <div className="mt-1.5 flex justify-between text-ink-600">
          <span>Tomorrow's rain chance</span>
          <span className="font-medium text-ink-900">{tomorrow.rainChancePercent}%</span>
        </div>
      </div>

      <Link to="/weather" className="mt-3 block text-center text-xs font-semibold text-brand-600 hover:underline">
        View full weather forecast →
      </Link>
    </div>
  )
}
