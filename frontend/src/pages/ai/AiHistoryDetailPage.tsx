import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FlaskConical, Sprout } from 'lucide-react'
import { AdvisoryResultView } from '@/components/common/AdvisoryResultView'
import { cropAnalysisService, soilService, type AdvisoryResult, type CropAnalysisType } from '@/services/aiService'
import { getApiErrorMessage } from '@/services/api'
import { formatDateLabel } from '@/utils/format'

const TYPE_LABEL: Record<CropAnalysisType, string> = {
  CROP_ADVISOR: 'Crop Advisor',
  DISEASE_DETECTION: 'Disease Detection',
  FERTILIZER_ADVICE: 'Fertilizer Advice',
  IRRIGATION_ADVICE: 'Irrigation Advice',
  CROP_ROTATION: 'Crop Rotation',
  WEATHER_ADVICE: 'Weather Advice',
}

interface Loaded {
  title: string
  createdAt: string
  result: AdvisoryResult
  imageUrl?: string | null
  soilMeta?: { label: string; value: string }[]
}

export default function AiHistoryDetailPage() {
  const { kind, id } = useParams<{ kind: 'crop' | 'soil'; id: string }>()
  const [data, setData] = useState<Loaded | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!kind || !id) return
    let cancelled = false
    setIsLoading(true)
    setError('')

    const load = async () => {
      if (kind === 'crop') {
        const analysis = await cropAnalysisService.getOne(id)
        return {
          title: TYPE_LABEL[analysis.type] ?? 'Crop Analysis',
          createdAt: analysis.createdAt,
          result: analysis.resultData,
          imageUrl: analysis.imageUrl,
        } satisfies Loaded
      }
      const report = await soilService.getOne(id)
      const soilMeta = [
        report.soilPh != null && { label: 'Soil pH', value: String(report.soilPh) },
        report.nitrogenLevel && { label: 'Nitrogen', value: report.nitrogenLevel },
        report.phosphorusLevel && { label: 'Phosphorus', value: report.phosphorusLevel },
        report.potassiumLevel && { label: 'Potassium', value: report.potassiumLevel },
        report.organicCarbonPercent != null && { label: 'Organic Carbon', value: `${report.organicCarbonPercent}%` },
        report.soilType && { label: 'Soil Type', value: report.soilType },
        report.location && { label: 'Location', value: report.location },
      ].filter(Boolean) as { label: string; value: string }[]

      return {
        title: 'Soil Analysis',
        createdAt: report.createdAt,
        result: report.recommendationData,
        soilMeta,
      } satisfies Loaded
    }

    load()
      .then((loaded) => {
        if (!cancelled) setData(loaded)
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, "Couldn't load this analysis."))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [kind, id])

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <Link to="/ai/history" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to AI History
      </Link>

      {isLoading && <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink-400">Loading…</div>}

      {!isLoading && error && (
        <div className="rounded-2xl bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
      )}

      {!isLoading && !error && data && (
        <div className="rounded-2xl border border-ink-100 bg-surface p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              {kind === 'soil' ? <FlaskConical className="h-4 w-4" aria-hidden="true" /> : <Sprout className="h-4 w-4" aria-hidden="true" />}
            </span>
            <div>
              <h1 className="text-lg">{data.title}</h1>
              <p className="text-xs text-ink-400">{formatDateLabel(data.createdAt)}</p>
            </div>
          </div>

          {data.soilMeta && data.soilMeta.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-surface-sunk p-3 sm:grid-cols-3">
              {data.soilMeta.map((m) => (
                <div key={m.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{m.label}</p>
                  <p className="text-sm font-medium text-ink-800">{m.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <AdvisoryResultView result={data.result} imageUrl={data.imageUrl} />
          </div>
        </div>
      )}
    </div>
  )
}
