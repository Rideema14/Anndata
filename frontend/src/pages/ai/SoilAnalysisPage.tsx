import { useRef, useState, type FormEvent } from 'react'
import { FlaskConical, RotateCcw, Upload } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useAi } from '@/context/AiContext'
import { cn } from '@/utils/cn'

type Level = 'Low' | 'Medium' | 'Good'

function levelFor(value: number, lowMax: number, mediumMax: number): Level {
  if (value <= lowMax) return 'Low'
  if (value <= mediumMax) return 'Medium'
  return 'Good'
}

const LEVEL_STYLES: Record<Level, { bar: string; badge: string }> = {
  Low: { bar: 'bg-danger-500', badge: 'bg-danger-50 text-danger-500' },
  Medium: { bar: 'bg-gold-400', badge: 'bg-gold-50 text-gold-700' },
  Good: { bar: 'bg-brand-500', badge: 'bg-brand-50 text-brand-700' },
}

const LEVEL_WIDTH: Record<Level, string> = { Low: 'w-1/4', Medium: 'w-2/3', Good: 'w-full' }

const RECOMMENDATIONS: Record<string, string> = {
  ph: 'Apply agricultural lime to raise pH, or gypsum if pH is too high.',
  nitrogen: 'Apply urea or a nitrogen-rich fertilizer before the next sowing.',
  phosphorus: 'Use DAP or single super phosphate to boost phosphorus levels.',
  potassium: 'Apply muriate of potash (MOP) to improve potassium content.',
}

export default function SoilAnalysisPage() {
  const [ph, setPh] = useState('6.8')
  const [n, setN] = useState('45')
  const [p, setP] = useState('62')
  const [k, setK] = useState('78')
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addHistoryEntry } = useAi()

  const results = submitted
    ? {
        ph: levelFor(Math.abs(Number(ph) - 6.8) * -10 + 100, 40, 70), // closeness to ideal 6.8
        nitrogen: levelFor(Number(n), 30, 60),
        phosphorus: levelFor(Number(p), 30, 60),
        potassium: levelFor(Number(k), 30, 60),
      }
    : null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    const r = {
      ph: levelFor(Math.abs(Number(ph) - 6.8) * -10 + 100, 40, 70),
      nitrogen: levelFor(Number(n), 30, 60),
      phosphorus: levelFor(Number(p), 30, 60),
      potassium: levelFor(Number(k), 30, 60),
    }
    addHistoryEntry('soil', 'Soil Analysis', `pH ${ph} (${r.ph}), Nitrogen ${r.nitrogen}, Phosphorus ${r.phosphorus}, Potassium ${r.potassium}.`)
  }

  function handleReportUpload() {
    // Mock: pretend we parsed a report and pre-fill typical values
    setPh('6.2')
    setN('28')
    setP('55')
    setK('70')
  }

  if (submitted && results) {
    const rows: { key: keyof typeof results; label: string }[] = [
      { key: 'ph', label: 'pH Level' },
      { key: 'nitrogen', label: 'Nitrogen (N)' },
      { key: 'phosphorus', label: 'Phosphorus (P)' },
      { key: 'potassium', label: 'Potassium (K)' },
    ]
    return (
      <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
        <h1 className="mb-5 text-xl">Soil Analysis Result</h1>
        <div className="space-y-4">
          {rows.map(({ key, label }) => {
            const level = results[key]
            return (
              <div key={key} className="rounded-2xl border border-ink-100 bg-surface p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink-800">{label}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', LEVEL_STYLES[level].badge)}>{level}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunk">
                  <div className={cn('h-full rounded-full', LEVEL_STYLES[level].bar, LEVEL_WIDTH[level])} />
                </div>
                {level !== 'Good' && <p className="mt-2 text-xs text-ink-500">{RECOMMENDATIONS[key]}</p>}
              </div>
            )
          })}
        </div>
        <Button variant="secondary" className="mt-5" onClick={() => setSubmitted(false)}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          New Analysis
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Soil Analysis</h1>
      <p className="mb-5 text-sm text-ink-500">Enter your soil test values, or upload a lab report.</p>

      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleReportUpload} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 py-4 text-sm font-medium text-ink-600 hover:border-brand-300"
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        Upload Soil Report
      </button>

      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
        <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
        Or enter manually
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        {[
          { id: 'ph', label: 'pH', value: ph, setValue: setPh, step: '0.1' },
          { id: 'n', label: 'Nitrogen (kg/ha)', value: n, setValue: setN, step: '1' },
          { id: 'p', label: 'Phosphorus (kg/ha)', value: p, setValue: setP, step: '1' },
          { id: 'k', label: 'Potassium (kg/ha)', value: k, setValue: setK, step: '1' },
        ].map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className="mb-1.5 block text-xs font-medium text-ink-700">
              {field.label}
            </label>
            <input
              id={field.id}
              type="number"
              step={field.step}
              value={field.value}
              onChange={(e) => field.setValue(e.target.value)}
              className="h-11 w-full rounded-xl border border-ink-200 bg-surface px-3 text-sm"
            />
          </div>
        ))}
        <Button type="submit" fullWidth className="col-span-2 mt-1">
          Analyze
        </Button>
      </form>
    </div>
  )
}
