import { useRef, useState } from 'react'
import { AlertTriangle, Camera, CheckCircle2, RotateCcw, ScanEye, Upload } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useAi } from '@/context/AiContext'

type Stage = 'idle' | 'analyzing' | 'success' | 'error'

const MOCK_RESULT = {
  disease: 'Leaf Rust (Wheat)',
  confidencePercent: 87,
  symptoms: ['Orange-brown pustules on leaf surface', 'Yellowing around infected areas', 'Reduced leaf area over time'],
  action: 'Apply a recommended fungicide (e.g. Propiconazole) within 2–3 days. Remove severely affected leaves.',
  prevention: 'Use rust-resistant wheat varieties next season and avoid excess nitrogen application.',
}

export default function DiseaseDetectionPage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addHistoryEntry } = useAi()

  function handleFile(file: File | undefined) {
    if (!file) return
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    setStage('analyzing')

    // Simulated analysis — 10% of attempts show the error/retry path.
    window.setTimeout(() => {
      const failed = Math.random() < 0.1
      setStage(failed ? 'error' : 'success')
      if (!failed) {
        addHistoryEntry('disease', 'Disease Detection', `${MOCK_RESULT.disease} detected, ${MOCK_RESULT.confidencePercent}% confidence.`)
      }
    }, 1800)
  }

  function reset() {
    setStage('idle')
    setImagePreview(null)
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
          <p className="text-sm font-medium text-danger-700">Couldn't analyze this image. Please try again.</p>
          <Button variant="danger" className="mt-4" onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {stage === 'success' && imagePreview && (
        <div>
          <img src={imagePreview} alt="Analyzed crop" className="mb-4 h-48 w-full rounded-2xl object-cover" />
          <div className="rounded-2xl border border-ink-100 bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-ink-900">{MOCK_RESULT.disease}</p>
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {MOCK_RESULT.confidencePercent}% confidence
              </span>
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Symptoms</p>
            <ul className="mt-1.5 space-y-1 text-sm text-ink-700">
              {MOCK_RESULT.symptoms.map((s) => (
                <li key={s} className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
                  {s}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Recommended Action</p>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
              {MOCK_RESULT.action}
            </p>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Prevention</p>
            <p className="mt-1 text-sm text-ink-700">{MOCK_RESULT.prevention}</p>
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
