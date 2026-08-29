import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Droplets, RotateCcw } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField } from '@/components/common/FormField'
import { useAi } from '@/context/AiContext'
import { useLanguage } from '@/context/LanguageContext'
import { cropAnalysisService, type AdvisoryResult } from '@/services/aiService'
import { getApiErrorMessage } from '@/services/api'
import { mandiCrops } from '@/data/mock/mockMandiData'

export default function IrrigationAdvicePage() {
  const [crop, setCrop] = useState(mandiCrops[0])
  const [soil, setSoil] = useState('Black soil')
  const [location, setLocation] = useState('')
  const [result, setResult] = useState<AdvisoryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { refreshHistory } = useAi()
  const { language } = useLanguage()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const advice = await cropAnalysisService.irrigationAdvice({ cropType: crop, soilType: soil, location: location || undefined, language })
      setResult(advice)
      refreshHistory()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not get irrigation advice right now.'))
    } finally {
      setIsLoading(false)
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
        <div className="rounded-2xl bg-sky-500 p-5 text-center text-white">
          <Droplets className="mx-auto mb-2 h-9 w-9" aria-hidden="true" />
          <p className="text-sm text-white/90">{result.summary}</p>
        </div>

        {result.suggestedSchedule && (
          <div className="mt-4 rounded-2xl border border-ink-100 bg-surface p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Suggested Schedule</p>
            <p className="mt-1 text-sm text-ink-700">{result.suggestedSchedule}</p>
          </div>
        )}

        {result.recommendations && result.recommendations.length > 0 && (
          <div className="mt-3 space-y-2">
            {result.recommendations.map((r) => (
              <div key={r} className="rounded-2xl border border-ink-100 bg-surface p-3.5 text-sm text-ink-700">
                {r}
              </div>
            ))}
          </div>
        )}

        {result.warnings && result.warnings.length > 0 && (
          <div className="mt-3 space-y-2">
            {result.warnings.map((w) => (
              <div key={w} className="flex items-start gap-2 rounded-xl bg-gold-50 p-3 text-sm text-gold-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {w}
              </div>
            ))}
          </div>
        )}

        <Link to="/weather" className="mt-3 block text-center text-xs font-semibold text-brand-600 hover:underline">
          View full weather forecast →
        </Link>

        <Button variant="secondary" className="mt-5" onClick={() => setResult(null)}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          New Advice
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Irrigation Advice</h1>
      <p className="mb-5 text-sm text-ink-500">Based on your crop, soil, and location.</p>

      <form onSubmit={handleSubmit}>
        <SelectField id="crop" label="Current Crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
          {mandiCrops.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </SelectField>
        <SelectField id="soil" label="Soil Type" value={soil} onChange={(e) => setSoil(e.target.value)}>
          {['Black soil', 'Alluvial soil', 'Red soil', 'Loamy soil'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </SelectField>
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
        {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
        <Button type="submit" fullWidth loading={isLoading}>
          Get Irrigation Advice
        </Button>
      </form>
    </div>
  )
}
