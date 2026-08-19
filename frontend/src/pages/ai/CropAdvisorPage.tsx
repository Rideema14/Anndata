import { useState, type FormEvent } from 'react'
import { CheckCircle2, RotateCcw, Sprout } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField } from '@/components/common/FormField'
import { useAi } from '@/context/AiContext'

const SEASONS = ['Kharif (Jun–Oct)', 'Rabi (Nov–Mar)', 'Zaid (Mar–Jun)']
const SOILS = ['Black soil', 'Alluvial soil', 'Red soil', 'Loamy soil']
const WATER = ['Rainfed only', 'Partial irrigation', 'Full irrigation']

const RECOMMENDATIONS: Record<string, { crop: string; reasons: string[] }> = {
  'Kharif (Jun–Oct)': { crop: 'Soybean', reasons: ['Well suited to Kharif rainfall patterns', 'Performs well in black soil', 'Good market demand in your region'] },
  'Rabi (Nov–Mar)': { crop: 'Wheat', reasons: ['Ideal for Rabi season temperatures', 'High-yield varieties available locally', 'Strong mandi demand through winter'] },
  'Zaid (Mar–Jun)': { crop: 'Moong (Green Gram)', reasons: ['Short duration crop fits the Zaid window', 'Improves soil nitrogen for the next crop', 'Requires less irrigation than most Zaid crops'] },
}

export default function CropAdvisorPage() {
  const [location, setLocation] = useState('Katni, Madhya Pradesh')
  const [season, setSeason] = useState(SEASONS[0])
  const [soil, setSoil] = useState(SOILS[0])
  const [water, setWater] = useState(WATER[1])
  const [result, setResult] = useState<{ crop: string; reasons: string[] } | null>(null)
  const { addHistoryEntry } = useAi()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const rec = RECOMMENDATIONS[season]
    setResult(rec)
    addHistoryEntry('crop_advisor', 'Crop Advisor', `Recommended ${rec.crop} for ${location}, ${season}, ${soil}.`)
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center md:px-6">
        <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Sprout className="h-8 w-8" aria-hidden="true" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Recommended Crop</p>
        <h1 className="mt-1 text-3xl">{result.crop}</h1>
        <div className="mt-5 space-y-2 text-left">
          {result.reasons.map((reason) => (
            <div key={reason} className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {reason}
            </div>
          ))}
        </div>
        <Button variant="secondary" className="mt-6" onClick={() => setResult(null)}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try Another
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Crop Advisor</h1>
      <p className="mb-5 text-sm text-ink-500">Tell us about your land and we'll recommend the best crop.</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-ink-800">
            Location
          </label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-11 w-full rounded-xl border border-ink-200 bg-surface px-3.5 text-sm"
          />
        </div>
        <SelectField id="season" label="Season" value={season} onChange={(e) => setSeason(e.target.value)}>
          {SEASONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </SelectField>
        <SelectField id="soil" label="Soil Type" value={soil} onChange={(e) => setSoil(e.target.value)}>
          {SOILS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </SelectField>
        <SelectField id="water" label="Water Availability" value={water} onChange={(e) => setWater(e.target.value)}>
          {WATER.map((w) => (
            <option key={w}>{w}</option>
          ))}
        </SelectField>
        <Button type="submit" fullWidth>
          Get Recommendation
        </Button>
      </form>
    </div>
  )
}
