import { useRef, useState } from 'react'
import { AlertTriangle, Camera, CheckCircle2, RotateCcw, ScanEye, Upload } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useAi } from '@/context/AiContext'
import { cropAnalysisService, type AdvisoryResult } from '@/services/aiService'
import { getApiErrorMessage } from '@/services/api'

type Stage = 'idle' | 'analyzing' | 'success' | 'error'

export default function DiseaseDetectionPage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [result, setResult] = useState<AdvisoryResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { refreshHistory } = useAi()

  async function handleFile(file: File | undefined) {
    if (!file) return
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    setStage('analyzing')

    try {
      const res = await cropAnalysisService.diseaseDetection(file)
      setResult(res)
      setStage('success')
      refreshHistory()
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, "Couldn't analyze this image. Please try again."))
      setStage('error')
    }
  }

  function reset() {
    setStage('idle')
    setImagePreview(null)
    setResult(null)
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Disease Detection</h1>
      <p className="mb-5 text-sm text-ink-500">Take or upload a photo of the affected crop.</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {stage === 'idle' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 py-16 text-center">
          <ScanEye className="mb-3 h-12 w-12 text-ink-300" aria-hidden="true" />
          <p className="mb-5 text-sm text-ink-500">No image selected yet</p>
          <div className="flex gap-2">
            <Button onClick={() => fileInputRef.current?.click()}>
              <Camera className="h-4 w-4" aria-hidden="true" />
              Take Photo
            </Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload Image
            </Button>
          </div>
        </div>
      )}

      {stage === 'analyzing' && imagePreview && (
        <div className="flex flex-col items-center text-center">
          <img src={imagePreview} alt="Uploaded crop for analysis" className="mb-4 h-56 w-full rounded-2xl object-cover" />
          <span className="h-8 w-8 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-ink-700">Analyzing…</p>
        </div>
      )}

      {stage === 'error' && (
        <div className="flex flex-col items-center rounded-2xl bg-danger-50 py-12 text-center">
          <AlertTriangle className="mb-3 h-10 w-10 text-danger-500" aria-hidden="true" />
          <p className="px-6 text-sm font-medium text-danger-700">{errorMessage}</p>
          <Button variant="danger" className="mt-4" onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {stage === 'success' && imagePreview && result && (
        <div>
          <img src={imagePreview} alt="Analyzed crop" className="mb-4 h-48 w-full rounded-2xl object-cover" />
          <div className="rounded-2xl border border-ink-100 bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-bold text-ink-900">
                {result.isHealthy ? 'Looks healthy' : result.diseaseName || 'Analysis complete'}
              </p>
              {result.confidence && (
                <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 capitalize">
                  {result.confidence} confidence
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-ink-700">{result.summary}</p>

            {result.recommendations && result.recommendations.length > 0 && (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Recommended Action</p>
                <ul className="mt-1.5 space-y-1.5 text-sm text-ink-700">
                  {result.recommendations.map((r) => (
                    <li key={r} className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {result.warnings && result.warnings.length > 0 && (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Warnings</p>
                <ul className="mt-1.5 space-y-1.5 text-sm text-ink-700">
                  {result.warnings.map((w) => (
                    <li key={w} className="flex items-start gap-1.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
                      {w}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <Button variant="secondary" className="mt-4" onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Analyze Another
          </Button>
        </div>
      )}
    </div>
  )
}
