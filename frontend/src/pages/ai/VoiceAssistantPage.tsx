import { useState } from 'react'
import { Mic, Volume2 } from 'lucide-react'
import { cn } from '@/utils/cn'

type VoiceState = 'ready' | 'listening' | 'processing' | 'response'

const STATE_LABEL: Record<VoiceState, string> = {
  ready: 'Tap the mic and ask your question',
  listening: 'Listening…',
  processing: 'Processing…',
  response: 'Here is what I found',
}

const MOCK_TRANSCRIPT = 'मेरी सोयाबीन की फसल में कीड़े लग गए हैं, क्या करूं?'
const MOCK_RESPONSE =
  'नीम के तेल का छिड़काव करें और प्रभावित पत्तियों को हटा दें। अगर समस्या बनी रहे तो "Disease Detection" में फोटो अपलोड करके जांच करवाएं।'

export default function VoiceAssistantPage() {
  const [state, setState] = useState<VoiceState>('ready')

  function handleMicTap() {
    if (state === 'response') {
      setState('ready')
      return
    }
    if (state !== 'ready') return
    setState('listening')
    window.setTimeout(() => setState('processing'), 2200)
    window.setTimeout(() => setState('response'), 3600)
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <button
        type="button"
        onClick={handleMicTap}
        aria-label="Toggle voice assistant"
        className={cn(
          'flex h-28 w-28 items-center justify-center rounded-full transition-all',
          state === 'listening' && 'bg-danger-500 text-white shadow-float animate-pulse',
          state === 'processing' && 'bg-gold-400 text-white shadow-float',
          (state === 'ready' || state === 'response') && 'bg-brand-600 text-white shadow-float',
        )}
      >
        <Mic className="h-11 w-11" strokeWidth={1.5} aria-hidden="true" />
      </button>

      <p className="mt-5 text-sm font-medium text-ink-700">{STATE_LABEL[state]}</p>
      <p className="mt-1 text-xs text-ink-400">Supports Hindi and English</p>

      {(state === 'processing' || state === 'response') && (
        <div className="mt-6 w-full rounded-2xl border border-ink-100 bg-surface p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">You said</p>
          <p className="mt-1 text-sm text-ink-800">{MOCK_TRANSCRIPT}</p>
        </div>
      )}

      {state === 'response' && (
        <div className="mt-3 flex w-full items-start gap-2 rounded-2xl bg-brand-50 p-4 text-left">
          <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
          <p className="text-sm text-brand-800">{MOCK_RESPONSE}</p>
        </div>
      )}

      {state === 'response' && (
        <button type="button" onClick={() => setState('ready')} className="mt-5 text-xs font-semibold text-brand-600 hover:underline">
          Ask another question
        </button>
      )}
    </div>
  )
}
