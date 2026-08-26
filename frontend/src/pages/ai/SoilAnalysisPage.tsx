import { useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, FlaskConical, RotateCcw } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField } from '@/components/common/FormField'
import { useAi } from '@/context/AiContext'
import { soilService, type AdvisoryResult } from '@/services/aiService'
import { getApiErrorMessage } from '@/services/api'
import { cn } from '@/utils/cn'

type Level = 'Low' | 'Medium' | 'High'
const LEVELS: Level[] = ['Low', 'Medium', 'High']
const LEVEL_STYLES: Record<Level, string> = {
  Low: 'bg-danger-50 text-danger-500',
  Medium: 'bg-gold-50 text-gold-700',
  High: 'bg-brand-50 text-brand-700',
}

export default function SoilAnalysisPage() {
  const [ph, setPh] = useState('6.8')
  const [nitrogenLevel, setNitrogenLevel] = useState<Level>('Medium')
  const [phosphorusLevel, setPhosphorusLevel] = useState<Level>('Medium')
  const [potassiumLevel, setPotassiumLevel] = useState<Level>('Medium')
  const [soilType, setSoilType] = useState('Black soil')
  const [result, setResult] = useState<AdvisoryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { refreshHistory } = useAi()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const advice = await soilService.analyze({
        soilPh: ph ? Number(ph) : undefined,
        nitrogenLevel,
        phosphorusLevel,
        potassiumLevel,
        soilType,
      })
      setResult(advice)
      refreshHistory()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not analyze the soil data right now.'))
    } finally {
      setIsLoading(false)
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-soil-50 text-soil-700">
          <FlaskConical className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="text-xl">Soil Analysis Result</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">{result.summary}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', LEVEL_STYLES[nitrogenLevel])}>N: {nitrogenLevel}</span>
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', LEVEL_STYLES[phosphorusLevel])}>P: {phosphorusLevel}</span>
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', LEVEL_STYLES[potassiumLevel])}>K: {potassiumLevel}</span>
        </div>

        {result.suitableCrops && result.suitableCrops.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Suitable Crops</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {result.suitableCrops.map((c) => (
                <span key={c} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.amendments && result.amendments.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Recommended Amendments</p>
            {result.amendments.map((a) => (
              <div key={a} className="flex items-start gap-2 rounded-xl bg-surface-sunk p-3 text-sm text-ink-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                {a}
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
          New Analysis
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Soil Analysis</h1>
      <p className="mb-5 text-sm text-ink-500">Enter your soil test values for AI-based recommendations.</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="ph" className="mb-1.5 block text-xs font-medium text-ink-700">
            pH
          </label>
          <input
            id="ph"
            type="number"
            step="0.1"
            min="0"
            max="14"
            value={ph}
            onChange={(e) => setPh(e.target.value)}
            className="h-11 w-full rounded-xl border border-ink-200 bg-surface px-3 text-sm"
          />
        </div>
        <SelectField id="soilType" label="Soil Type" value={soilType} onChange={(e) => setSoilType(e.target.value)}>
          {['Black soil', 'Alluvial soil', 'Red soil', 'Loamy soil'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </SelectField>
        <SelectField id="n" label="Nitrogen (N)" value={nitrogenLevel} onChange={(e) => setNitrogenLevel(e.target.value as Level)}>
          {LEVELS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </SelectField>
        <SelectField id="p" label="Phosphorus (P)" value={phosphorusLevel} onChange={(e) => setPhosphorusLevel(e.target.value as Level)}>
          {LEVELS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </SelectField>
        <SelectField id="k" label="Potassium (K)" value={potassiumLevel} onChange={(e) => setPotassiumLevel(e.target.value as Level)}>
          {LEVELS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </SelectField>
        {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
        <Button type="submit" fullWidth loading={isLoading} className="mt-1">
          Analyze
        </Button>
      </form>
    </div>
  )
}
