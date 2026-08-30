import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { AiMarkdown } from '@/components/common/AiMarkdown'
import type { AdvisoryResult, Confidence } from '@/services/aiService'

const CONFIDENCE_STYLE: Record<Confidence, string> = {
  high: 'bg-brand-50 text-brand-700',
  medium: 'bg-gold-50 text-gold-700',
  low: 'bg-danger-50 text-danger-600',
}

function Chips({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="mt-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <AiMarkdown content={value} />
    </div>
  )
}

/**
 * Renders any of the six one-shot advisory result shapes generically — used
 * to reopen a past crop analysis / soil report from AI History, where each
 * advisor page's bespoke "just generated" UI doesn't apply.
 */
export function AdvisoryResultView({ result, imageUrl }: { result: AdvisoryResult; imageUrl?: string | null }) {
  return (
    <div className="text-left">
      {imageUrl && (
        <img src={imageUrl} alt="Analyzed crop" className="mb-4 h-48 w-full rounded-2xl object-cover" />
      )}

      <div className="flex items-start justify-between gap-3">
        <AiMarkdown content={result.summary} className="flex-1" />
        {result.confidence && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${CONFIDENCE_STYLE[result.confidence]}`}>
            {result.confidence} confidence
          </span>
        )}
      </div>

      {typeof result.isHealthy === 'boolean' && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-medium ${
            result.isHealthy ? 'bg-brand-50 text-brand-700' : 'bg-danger-50 text-danger-600'
          }`}
        >
          {result.isHealthy ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {result.isHealthy ? 'Crop appears healthy' : `Issue detected${result.diseaseName ? `: ${result.diseaseName}` : ''}`}
        </div>
      )}

      <Chips label="Recommended Crops" items={result.recommendedCrops} />
      <Chips label="Suggested Next Crops" items={result.suggestedNextCrops} />
      <Chips label="Suitable Crops" items={result.suitableCrops} />

      <Field label="Fertilizer / NPK Guidance" value={result.npkGuidance} />
      <Field label="Suggested Schedule" value={result.suggestedSchedule} />
      <Field label="Rotation Plan" value={result.rotationPlan} />
      <Chips label="Soil Amendments" items={result.amendments} />

      {result.recommendations && result.recommendations.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Recommendations</p>
          <div className="space-y-2">
            {result.recommendations.map((reason) => (
              <div key={reason} className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <AiMarkdown content={reason} tone="light" />
              </div>
            ))}
          </div>
        </div>
      )}

      {result.warnings && result.warnings.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Warnings</p>
          <div className="space-y-2">
            {result.warnings.map((w) => (
              <div key={w} className="flex items-start gap-2 rounded-xl bg-gold-50 p-3 text-sm text-gold-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <AiMarkdown content={w} tone="light" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
