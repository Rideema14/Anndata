import { useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, RotateCcw, Sprout } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField } from '@/components/common/FormField'
import { useAi } from '@/context/AiContext'
import { cropAnalysisService, type AdvisoryResult } from '@/services/aiService'
import { getApiErrorMessage } from '@/services/api'

const SEASONS = ['Kharif (Jun–Oct)', 'Rabi (Nov–Mar)', 'Zaid (Mar–Jun)']
const SOILS = ['Black soil', 'Alluvial soil', 'Red soil', 'Loamy soil']
const WATER = ['Rainfed only', 'Partial irrigation', 'Full irrigation']

export default function CropAdvisorPage() {
  const [location, setLocation] = useState('')
  const [season, setSeason] = useState(SEASONS[0])
  const [soil, setSoil] = useState(SOILS[0])
  const [water, setWater] = useState(WATER[1])
  const [result, setResult] = useState<AdvisoryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { refreshHistory } = useAi()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const advice = await cropAnalysisService.cropAdvisor({
        location: location || undefined,
        season,
        soilType: soil,
        notes: `Water availability: ${water}`,
      })
      setResult(advice)
      refreshHistory()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not get a recommendation right now.'))
    } finally {
      setIsLoading(false)
    }
  }

  if (result) {
    const crop = result.recommendedCrops?.[0]
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center md:px-6">
        <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Sprout className="h-8 w-8" aria-hidden="true" />
        </span>
        {crop && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Recommended Crop</p>
            <h1 className="mt-1 text-3xl">{crop}</h1>
          </>
        )}
        <p className="mt-3 text-sm leading-relaxed text-ink-700">{result.summary}</p>

        {(result.recommendedCrops?.length ?? 0) > 1 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {result.recommendedCrops!.map((c) => (
              <span key={c} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {c}
              </span>
            ))}
          </div>
        )}

        {result.recommendations && result.recommendations.length > 0 && (
          <div className="mt-5 space-y-2 text-left">
            {result.recommendations.map((reason) => (
              <div key={reason} className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {reason}
              </div>
            ))}
          </div>
        )}

        {result.warnings && result.warnings.length > 0 && (
          <div className="mt-3 space-y-2 text-left">
            {result.warnings.map((w) => (
              <div key={w} className="flex items-start gap-2 rounded-xl bg-gold-50 p-3 text-sm text-gold-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {w}
              </div>
            ))}
          </div>
        )}

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
            Location (optional)
          </label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Katni, Madhya Pradesh"
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
        {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
        <Button type="submit" fullWidth loading={isLoading}>
          Get Recommendation
        </Button>
      </form>
    </div>
  )
}
