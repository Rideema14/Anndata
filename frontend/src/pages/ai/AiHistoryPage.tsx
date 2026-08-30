import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Droplets, FlaskConical, History, Leaf, MessageCircle, RefreshCw, ScanEye, Sprout } from 'lucide-react'
import { useAi } from '@/context/AiContext'
import { formatDateLabel } from '@/utils/format'
import type { HistoryItem } from '@/services/aiService'

type FilterKey = 'ALL' | 'CHAT' | 'SOIL_REPORT' | 'CROP_ADVISOR' | 'DISEASE_DETECTION' | 'FERTILIZER_ADVICE' | 'IRRIGATION_ADVICE' | 'CROP_ROTATION' | 'WEATHER_ADVICE'

const FILTERS: { key: FilterKey; label: string; icon: typeof History }[] = [
  { key: 'ALL', label: 'All', icon: History },
  { key: 'CHAT', label: 'Ask AI Chat', icon: MessageCircle },
  { key: 'CROP_ADVISOR', label: 'Crop Advisor', icon: Sprout },
  { key: 'DISEASE_DETECTION', label: 'Disease Detection', icon: ScanEye },
  { key: 'SOIL_REPORT', label: 'Soil Analysis', icon: FlaskConical },
  { key: 'FERTILIZER_ADVICE', label: 'Fertilizer Advice', icon: Leaf },
  { key: 'IRRIGATION_ADVICE', label: 'Irrigation Advice', icon: Droplets },
  { key: 'CROP_ROTATION', label: 'Crop Rotation', icon: RefreshCw },
  { key: 'WEATHER_ADVICE', label: 'Weather Advice', icon: FlaskConical },
]

const SUBTYPE_ICON: Record<string, typeof History> = {
  CROP_ADVISOR: Sprout,
  DISEASE_DETECTION: ScanEye,
  FERTILIZER_ADVICE: Leaf,
  IRRIGATION_ADVICE: Droplets,
  CROP_ROTATION: RefreshCw,
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
/** Which filter key a given history item belongs to. */
function filterKeyFor(item: HistoryItem): FilterKey {
  if (item.kind === 'CHAT') return 'CHAT'
  if (item.kind === 'SOIL_REPORT') return 'SOIL_REPORT'
  return (item.subtype as FilterKey) ?? 'ALL'
}
/** Where tapping this item should take the person — every kind is openable. */
function linkFor(item: HistoryItem): string {
  if (item.kind === 'CHAT') return `/ai/chat/${item.id}`
  if (item.kind === 'SOIL_REPORT') return `/ai/history/soil/${item.id}`
  return `/ai/history/crop/${item.id}`
}

export default function AiHistoryPage() {
  const { history, isLoadingHistory } = useAi()
  const [filter, setFilter] = useState<FilterKey>('ALL')

  const availableFilters = useMemo(() => {
    const present = new Set(history.map(filterKeyFor))
    return FILTERS.filter((f) => f.key === 'ALL' || present.has(f.key))
  }, [history])

  const filtered = useMemo(
    () => (filter === 'ALL' ? history : history.filter((item) => filterKeyFor(item) === filter)),
    [history, filter]
  )

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
      <h1 className="mb-4 text-xl">AI History</h1>

      {/* Filter by AI tool — only shows tools that actually appear in this person's history */}
      {availableFilters.length > 2 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {availableFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.key ? 'bg-brand-600 text-white' : 'bg-surface-sunk text-ink-600 hover:bg-ink-100'
              }`}
            >
              <f.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {f.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-400">No entries for this filter yet.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const Icon = iconFor(entry)
            return (
              <Link
                key={entry.id}
                to={linkFor(entry)}
                className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-surface p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-brand-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink-900">{labelFor(entry)}</p>
                    <span className="shrink-0 text-[11px] text-ink-400">{formatDateLabel(entry.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{entry.summary}</p>
                </div>
                <ChevronRight className="mt-1.5 h-4 w-4 shrink-0 text-ink-300" aria-hidden="true" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
