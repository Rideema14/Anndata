import { FlaskConical, History, Leaf, MessageCircle, ScanEye, Sprout } from 'lucide-react'
import { useAi } from '@/context/AiContext'
import { formatDateLabel } from '@/utils/format'
import type { HistoryItem } from '@/services/aiService'

const SUBTYPE_ICON: Record<string, typeof History> = {
  CROP_ADVISOR: Sprout,
  DISEASE_DETECTION: ScanEye,
  FERTILIZER_ADVICE: Leaf,
  IRRIGATION_ADVICE: FlaskConical,
  CROP_ROTATION: Sprout,
  WEATHER_ADVICE: FlaskConical,
}
const SUBTYPE_LABEL: Record<string, string> = {
  CROP_ADVISOR: 'Crop Advisor',
  DISEASE_DETECTION: 'Disease Detection',
  FERTILIZER_ADVICE: 'Fertilizer Advice',
  IRRIGATION_ADVICE: 'Irrigation Advice',
  CROP_ROTATION: 'Crop Rotation',
  WEATHER_ADVICE: 'Weather Advice',
}

function iconFor(item: HistoryItem) {
  if (item.kind === 'SOIL_REPORT') return FlaskConical
  if (item.kind === 'CHAT') return MessageCircle
  return SUBTYPE_ICON[item.subtype ?? ''] ?? History
}
function labelFor(item: HistoryItem) {
  if (item.kind === 'SOIL_REPORT') return 'Soil Analysis'
  if (item.kind === 'CHAT') return 'AI Chat'
  return SUBTYPE_LABEL[item.subtype ?? ''] ?? 'Analysis'
}

export default function AiHistoryPage() {
  const { history, isLoadingHistory } = useAi()

  if (isLoadingHistory && history.length === 0) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-400">Loading…</div>
  }

  if (history.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <History className="mb-3 h-12 w-12 text-ink-300" aria-hidden="true" />
        <p className="text-sm text-ink-500">No AI analyses yet. Try Crop Advisor or Disease Detection.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">AI History</h1>
      <div className="space-y-2">
        {history.map((entry) => {
          const Icon = iconFor(entry)
          return (
            <div key={entry.id} className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-surface p-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-brand-700">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900">{labelFor(entry)}</p>
                  <span className="text-[11px] text-ink-400">{formatDateLabel(entry.createdAt)}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{entry.summary}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
