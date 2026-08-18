import { useState } from 'react'
import { ArrowDown, RefreshCw, Sprout } from 'lucide-react'
import { mandiCrops } from '@/data/mock/mockMandiData'

const ROTATION_SUGGESTIONS: Record<string, string> = {
  Wheat: 'Gram',
  Soybean: 'Wheat',
  Gram: 'Maize',
  Mustard: 'Moong (Green Gram)',
  Rice: 'Mustard',
  Maize: 'Gram',
}

const ALL_OPTIONS = [...mandiCrops, 'Gram', 'Moong (Green Gram)']

function suggestNext(crop: string): string {
  return ROTATION_SUGGESTIONS[crop] ?? 'Gram'
}

function RotationStep({
  label,
  value,
  onChange,
  editable,
  accent,
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  editable: boolean
  accent: string
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</span>
      <div className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 ${accent}`}>
        <Sprout className="h-5 w-5 shrink-0" aria-hidden="true" />
        {editable && onChange ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold outline-none"
          >
            {[...new Set(ALL_OPTIONS)].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm font-semibold">{value}</span>
        )}
      </div>
    </div>
  )
}

export default function CropRotationPage() {
  const [current, setCurrent] = useState(mandiCrops[0])
  const [next, setNext] = useState(suggestNext(mandiCrops[0]))

  function handleCurrentChange(value: string) {
    setCurrent(value)
    setNext(suggestNext(value))
  }

  const following = suggestNext(next)

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Crop Rotation Planner</h1>
      <p className="mb-6 text-sm text-ink-500">Rotating crops improves soil health and breaks pest cycles.</p>

      <div className="flex flex-col items-center gap-2">
        <RotationStep label="Current" value={current} onChange={handleCurrentChange} editable accent="border-ink-200 bg-surface text-ink-900" />
        <ArrowDown className="h-5 w-5 text-ink-300" aria-hidden="true" />
        <RotationStep label="Next" value={next} onChange={setNext} editable accent="border-brand-300 bg-brand-50 text-brand-800" />
        <ArrowDown className="h-5 w-5 text-ink-300" aria-hidden="true" />
        <RotationStep label="Following" value={following} editable={false} accent="border-gold-200 bg-gold-50 text-gold-800" />
      </div>

      <button
        type="button"
        onClick={() => setNext(suggestNext(current))}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-ink-200 py-2.5 text-sm font-semibold text-ink-700 hover:bg-surface-sunk"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Reset to Suggested Rotation
      </button>

      <div className="mt-5 rounded-2xl bg-brand-50 p-3.5 text-sm text-brand-800">
        Rotating {current} → {next} helps restore soil nutrients and reduces pest and disease buildup specific to {current.toLowerCase()}.
      </div>
    </div>
  )
}
