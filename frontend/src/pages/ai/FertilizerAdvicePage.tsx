import { useState, type FormEvent } from 'react'
import { Leaf, RotateCcw } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField } from '@/components/common/FormField'
import { useAi } from '@/context/AiContext'
import { mandiCrops } from '@/data/mock/mockMandiData'

const STAGES = ['Sowing', 'Vegetative growth', 'Flowering', 'Grain filling']

const STAGE_ADVICE: Record<string, { fertilizer: string; why: string; when: string; how: string }> = {
  Sowing: {
    fertilizer: 'DAP (Di-Ammonium Phosphate)',
    why: 'Provides phosphorus for strong early root development.',
    when: 'Apply at the time of sowing, mixed into the soil.',
    how: 'Broadcast evenly and incorporate 5–7 cm deep before sowing seeds.',
  },
  'Vegetative growth': {
    fertilizer: 'Urea (Nitrogen)',
    why: 'Nitrogen drives leaf and stem growth during this stage.',
    when: 'Apply 25–30 days after sowing.',
    how: 'Split into two doses; broadcast and irrigate lightly afterward.',
  },
  Flowering: {
    fertilizer: 'NPK 19:19:19',
    why: 'Balanced nutrition supports flower formation and reduces flower drop.',
    when: 'Apply at the start of the flowering stage.',
    how: 'Dissolve in water for a foliar spray, or broadcast near the root zone.',
  },
  'Grain filling': {
    fertilizer: 'Potash (MOP)',
    why: 'Potassium improves grain weight and disease resistance.',
    when: 'Apply once grain filling begins.',
    how: 'Broadcast around the root zone and irrigate after application.',
  },
}

export default function FertilizerAdvicePage() {
  const [crop, setCrop] = useState(mandiCrops[0])
  const [soil, setSoil] = useState('Black soil')
  const [stage, setStage] = useState(STAGES[0])
  const [result, setResult] = useState<(typeof STAGE_ADVICE)[string] | null>(null)
  const { addHistoryEntry } = useAi()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const advice = STAGE_ADVICE[stage]
    setResult(advice)
    addHistoryEntry('fertilizer', 'Fertilizer Advice', `${advice.fertilizer} recommended for ${crop} at ${stage.toLowerCase()} stage.`)
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-50 text-gold-600">
          <Leaf className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="text-xl">{result.fertilizer}</h1>
        <p className="text-xs text-ink-400">for {crop} · {stage} stage</p>

        <div className="mt-5 space-y-3">
          {[
            { label: 'Why', value: result.why },
            { label: 'When', value: result.when },
            { label: 'How', value: result.how },
          ].map((row) => (
            <div key={row.label} className="rounded-2xl border border-ink-100 bg-surface p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{row.label}</p>
              <p className="mt-1 text-sm text-ink-700">{row.value}</p>
            </div>
          ))}
        </div>
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
        <Button type="submit" fullWidth>
          Get Advice
        </Button>
      </form>
    </div>
  )
}
