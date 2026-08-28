import { useState, type FormEvent } from 'react'
import { AlertTriangle, Leaf, RotateCcw } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField } from '@/components/common/FormField'
import { useAi } from '@/context/AiContext'
import { useLanguage } from '@/context/LanguageContext'
import { cropAnalysisService, type AdvisoryResult } from '@/services/aiService'
import { getApiErrorMessage } from '@/services/api'
import { mandiCrops } from '@/data/mock/mockMandiData'

const STAGES = ['Sowing', 'Vegetative growth', 'Flowering', 'Grain filling']

export default function FertilizerAdvicePage() {
  const [crop, setCrop] = useState(mandiCrops[0])
  const [soil, setSoil] = useState('Black soil')
  const [stage, setStage] = useState(STAGES[0])
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
      const advice = await cropAnalysisService.fertilizerAdvice({ cropType: crop, soilType: soil, growthStage: stage, language })
      setResult(advice)
      refreshHistory()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not get fertilizer advice right now.'))
    } finally {
      setIsLoading(false)
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-50 text-gold-600">
          <Leaf className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="text-xs text-ink-400">
          {crop} · {stage} stage
        </p>
        <h1 className="mt-1 text-xl">{result.summary}</h1>

        {result.npkGuidance && (
          <div className="mt-5 rounded-2xl border border-ink-100 bg-surface p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">NPK Guidance</p>
            <p className="mt-1 text-sm text-ink-700">{result.npkGuidance}</p>
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

        <Button variant="secondary" className="mt-5" onClick={() => setResult(null)}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          New Recommendation
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Fertilizer Advice</h1>
      <p className="mb-5 text-sm text-ink-500">Get the right fertilizer for your crop's current stage.</p>
      <form onSubmit={handleSubmit}>
        <SelectField id="crop" label="Crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
          {mandiCrops.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </SelectField>
        <SelectField id="soil" label="Soil Type" value={soil} onChange={(e) => setSoil(e.target.value)}>
          {['Black soil', 'Alluvial soil', 'Red soil', 'Loamy soil'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </SelectField>
        <SelectField id="stage" label="Growth Stage" value={stage} onChange={(e) => setStage(e.target.value)}>
          {STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </SelectField>
        {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
        <Button type="submit" fullWidth loading={isLoading}>
          Get Advice
        </Button>
      </form>
    </div>
  )
}
