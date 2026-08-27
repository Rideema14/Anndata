import { useRef, useState } from 'react'
import { AlertTriangle, Mic, Volume2 } from 'lucide-react'
import { voiceService } from '@/services/aiService'
import { getApiErrorMessage } from '@/services/api'
import { useAi } from '@/context/AiContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'

type VoiceState = 'ready' | 'listening' | 'processing' | 'response' | 'error'

const STATE_LABEL: Record<VoiceState, string> = {
  ready: 'Tap the mic and ask your question',
  listening: 'Listening… tap again to stop',
  processing: 'Processing…',
  response: 'Here is what I found',
  error: 'Something went wrong',
}

export default function VoiceAssistantPage() {
  const [state, setState] = useState<VoiceState>('ready')
  const [transcript, setTranscript] = useState('')
  const [reply, setReply] = useState('')
  const [replyAudioUrl, setReplyAudioUrl] = useState<string | undefined>()
  const [errorMessage, setErrorMessage] = useState('')
  const sessionIdRef = useRef<string | undefined>(undefined)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const { refreshHistory } = useAi()
  const { language, supportedLanguages } = useLanguage()
  const languageLabel = supportedLanguages.find((l) => l.code === language)?.nativeLabel ?? 'your app language'

  async function startListening() {
    setErrorMessage('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        void submitRecording(blob)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setState('listening')
    } catch {
      setErrorMessage('Microphone access is required for the voice assistant.')
      setState('error')
    }
  }

  function stopListening() {
    mediaRecorderRef.current?.stop()
    setState('processing')
  }

  async function submitRecording(blob: Blob) {
    try {
      const result = await voiceService.query(blob, 'voice-query.webm', { sessionId: sessionIdRef.current, language })
      sessionIdRef.current = result.sessionId
      setTranscript(result.transcript)
      setReply(result.replyText)
      setReplyAudioUrl(result.replyAudioUrl)
      setState('response')
      refreshHistory()
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, "Couldn't process that recording. Please try again."))
      setState('error')
    }
  }

  function handleMicTap() {
    if (state === 'ready' || state === 'error' || state === 'response') {
      startListening()
      return
    }
    if (state === 'listening') {
      stopListening()
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <button
        type="button"
        onClick={handleMicTap}
        disabled={state === 'processing'}
        aria-label="Toggle voice assistant"
        className={cn(
          'flex h-28 w-28 items-center justify-center rounded-full transition-all',
          state === 'listening' && 'bg-danger-500 text-white shadow-float animate-pulse',
          state === 'processing' && 'bg-gold-400 text-white shadow-float',
          (state === 'ready' || state === 'response' || state === 'error') && 'bg-brand-600 text-white shadow-float',
        )}
      >
        <Mic className="h-11 w-11" strokeWidth={1.5} aria-hidden="true" />
      </button>

      <p className="mt-5 text-sm font-medium text-ink-700">{STATE_LABEL[state]}</p>
      <p className="mt-1 text-xs text-ink-400">Speak in any language — I'll reply in {languageLabel}</p>

      {state === 'error' && errorMessage && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-danger-50 p-3.5 text-left text-sm text-danger-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </div>
      )}

      {(state === 'processing' || state === 'response') && transcript && (
        <div className="mt-6 w-full rounded-2xl border border-ink-100 bg-surface p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">You said</p>
          <p className="mt-1 text-sm text-ink-800">{transcript}</p>
        </div>
      )}

      {state === 'response' && reply && (
        <div className="mt-3 flex w-full items-start gap-2 rounded-2xl bg-brand-50 p-4 text-left">
          <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
          <div>
            <p className="text-sm text-brand-800">{reply}</p>
            {replyAudioUrl && (
              <audio controls src={replyAudioUrl} className="mt-2 h-9 w-full">
                <track kind="captions" />
              </audio>
            )}
          </div>
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
