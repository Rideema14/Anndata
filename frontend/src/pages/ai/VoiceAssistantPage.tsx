import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Mic, PhoneOff, Volume2 } from 'lucide-react'
import { voiceService } from '@/services/aiService'
import { getApiErrorMessage } from '@/services/api'
import { useAi } from '@/context/AiContext'
import { cn } from '@/utils/cn'

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

const STATE_LABEL: Record<VoiceState, string> = {
  idle: 'Tap the mic to start talking',
  listening: 'Listening…',
  processing: 'Thinking…',
  speaking: 'Speaking…',
  error: 'Something went wrong',
}

// Voice-activity thresholds. Amplitude is a normalized 0–1 RMS level read
// from the mic roughly 60x/sec, so the assistant stops listening on its
// own the moment you stop talking — no "tap again to stop" needed, the
// way ChatGPT's voice mode or Alexa behave.
const SPEAKING_THRESHOLD = 0.02
const SILENCE_HOLD_MS = 1100
const MAX_RECORDING_MS = 20000
const NO_SPEECH_TIMEOUT_MS = 6000

function pickRecorderMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return candidates.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(t))
}

export default function VoiceAssistantPage() {
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [reply, setReply] = useState('')
  const [showCaptions, setShowCaptions] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false)
  const [audioUnavailableNotice, setAudioUnavailableNotice] = useState(false)

  const sessionIdRef = useRef<string | undefined>(undefined)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)
  const micButtonRef = useRef<HTMLButtonElement>(null)

  // Kept alive across the whole conversation rather than recreated per turn.
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const vadRef = useRef({ hasSpoken: false, silenceStartedAt: 0, recordingStartedAt: 0 })
  const conversationActiveRef = useRef(false) // whether to auto-resume listening after speaking
  const shouldSubmitRef = useRef(true) // whether the recording in flight should be sent when it stops

  const { refreshHistory } = useAi()

  useEffect(() => {
    return () => {
      stopVadLoop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopVadLoop() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (micButtonRef.current) micButtonRef.current.style.transform = ''
  }

  async function getStream(): Promise<MediaStream> {
    // Reused across the whole conversation instead of re-requested every
    // turn — skips the permission/device-negotiation delay after the first
    // grant, and keeps one AnalyserNode graph wired up for VAD.
    if (streamRef.current && streamRef.current.getAudioTracks().some((t) => t.readyState === 'live')) {
      return streamRef.current
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
    streamRef.current = stream

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const audioCtx = new AudioCtx()
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser) // analysis only — not connected to destination, so there's no feedback/echo
    audioCtxRef.current = audioCtx
    analyserRef.current = analyser

    return stream
  }

  function startVadLoop() {
    const analyser = analyserRef.current
    if (!analyser) return
    const data = new Uint8Array(analyser.fftSize)
    vadRef.current = { hasSpoken: false, silenceStartedAt: 0, recordingStartedAt: Date.now() }

    const tick = () => {
      analyser.getByteTimeDomainData(data)
      let sumSquares = 0
      for (let i = 0; i < data.length; i++) {
        const centered = (data[i] - 128) / 128
        sumSquares += centered * centered
      }
      const amplitude = Math.sqrt(sumSquares / data.length)
      const now = Date.now()
      const v = vadRef.current

      if (micButtonRef.current) {
        const scale = 1 + Math.min(amplitude * 6, 0.35)
        micButtonRef.current.style.transform = `scale(${scale})`
      }

      if (amplitude > SPEAKING_THRESHOLD) {
        v.hasSpoken = true
        v.silenceStartedAt = 0
      } else if (v.hasSpoken) {
        if (v.silenceStartedAt === 0) v.silenceStartedAt = now
        else if (now - v.silenceStartedAt > SILENCE_HOLD_MS) {
          stopListening(true)
          return
        }
      }

      if (!v.hasSpoken && now - v.recordingStartedAt > NO_SPEECH_TIMEOUT_MS) {
        stopListening(false) // gave up waiting — nothing was said, don't submit
        return
      }
      if (now - v.recordingStartedAt > MAX_RECORDING_MS) {
        stopListening(true) // safety cap so a stuck mic can't record forever
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  async function startListening() {
    setErrorMessage('')
    setNeedsTapToPlay(false)
    conversationActiveRef.current = true
    shouldSubmitRef.current = true
    try {
      const stream = await getStream()
      chunksRef.current = []
      const mimeType = pickRecorderMimeType()
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 128000, // higher than the browser default — cleaner audio makes for a much more accurate transcription
      })
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stopVadLoop()
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (shouldSubmitRef.current) void submitRecording(blob)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setState('listening')
      startVadLoop()
    } catch {
      setErrorMessage('Microphone access is required for the voice assistant.')
      setState('error')
      conversationActiveRef.current = false
    }
  }

  function stopListening(submit: boolean) {
    stopVadLoop()
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return
    shouldSubmitRef.current = submit
    if (submit) setState('processing')
    else setState('idle')
    recorder.stop()
  }

  async function submitRecording(blob: Blob) {
    try {
      const result = await voiceService.query(blob, 'voice-query.webm', { sessionId: sessionIdRef.current })
      sessionIdRef.current = result.sessionId
      setTranscript(result.transcript)
      setReply(result.replyText)
      refreshHistory()

      if (result.replyAudioUrl && audioRef.current) {
        setAudioUnavailableNotice(false)
        audioRef.current.src = result.replyAudioUrl
        setState('speaking')
        try {
          await audioRef.current.play()
        } catch {
          // Autoplay blocked (rare, since this follows a user-initiated mic
          // tap) — fall back to a visible tap-to-play control.
          setNeedsTapToPlay(true)
        }
      } else {
        // Speech synthesis failed on the backend (e.g. a provider is
        // rate-limited) — surface that plainly with the text reply rather
        // than silently going quiet, which would just look broken.
        setAudioUnavailableNotice(true)
        setShowCaptions(true)
        setState('idle')
        conversationActiveRef.current = false
      }
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, "Couldn't process that recording. Please try again."))
      setState('error')
      conversationActiveRef.current = false
    }
  }

  function handleReplyEnded() {
    setNeedsTapToPlay(false)
    // The core of the "like ChatGPT / Alexa" behavior: once the assistant
    // finishes speaking, it starts listening again on its own — a real
    // back-and-forth conversation instead of tap → answer → tap → answer.
    if (conversationActiveRef.current) startListening()
    else setState('idle')
  }

  function handleMicTap() {
    if (state === 'idle' || state === 'error') {
      startListening()
      return
    }
    if (state === 'listening') {
      stopListening(true)
      return
    }
    if (state === 'speaking') {
      // Barge-in: interrupt the reply and ask something else right away.
      audioRef.current?.pause()
      startListening()
    }
  }

  function endConversation() {
    conversationActiveRef.current = false
    stopVadLoop()
    audioRef.current?.pause()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      shouldSubmitRef.current = false
      mediaRecorderRef.current.stop()
    }
    setState('idle')
  }

  const inConversation = state !== 'idle' && state !== 'error'

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <audio ref={audioRef} onEnded={handleReplyEnded} className="absolute h-px w-px overflow-hidden opacity-0">
        <track kind="captions" />
      </audio>

      <button
        ref={micButtonRef}
        type="button"
        onClick={handleMicTap}
        disabled={state === 'processing'}
        aria-label="Toggle voice assistant"
        className={cn(
          'flex h-28 w-28 items-center justify-center rounded-full transition-colors will-change-transform',
          state === 'listening' && 'bg-danger-500 text-white shadow-float',
          state === 'processing' && 'bg-gold-400 text-white shadow-float',
          state === 'speaking' && 'bg-brand-600 text-white shadow-float animate-pulse',
          (state === 'idle' || state === 'error') && 'bg-brand-600 text-white shadow-float',
        )}
      >
        {state === 'speaking' ? (
          <Volume2 className="h-11 w-11" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Mic className="h-11 w-11" strokeWidth={1.5} aria-hidden="true" />
        )}
      </button>

      <p className="mt-5 text-sm font-medium text-ink-700">{STATE_LABEL[state]}</p>
      <p className="mt-1 text-xs text-ink-400">Speak in any language — I'll reply in that same language</p>

      {inConversation && (
        <button
          type="button"
          onClick={endConversation}
          className="mt-4 flex items-center gap-1.5 rounded-full border border-ink-200 px-4 py-1.5 text-xs font-semibold text-ink-500 hover:bg-surface-sunk"
        >
          <PhoneOff className="h-3.5 w-3.5" aria-hidden="true" />
          End conversation
        </button>
      )}

      {needsTapToPlay && (
        <button
          type="button"
          onClick={() => {
            audioRef.current?.play()
            setNeedsTapToPlay(false)
          }}
          className="mt-4 flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <Volume2 className="h-4 w-4" aria-hidden="true" />
          Tap to hear the answer
        </button>
      )}

      {state === 'error' && errorMessage && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-danger-50 p-3.5 text-left text-sm text-danger-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </div>
      )}

      {audioUnavailableNotice && (
        <p className="mt-4 text-xs text-gold-700">Voice reply is briefly unavailable — showing the answer as text below.</p>
      )}

      {(reply || transcript) && state !== 'listening' && (
        <div className="mt-6 w-full">
          <button
            type="button"
            onClick={() => setShowCaptions((v) => !v)}
            className="mx-auto flex items-center gap-1 text-xs font-semibold text-ink-400 hover:text-ink-600"
          >
            {showCaptions ? 'Hide captions' : 'Show captions'}
            {showCaptions ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
          {showCaptions && (
            <div className="mt-2 space-y-2 text-left">
              {transcript && (
                <div className="rounded-2xl border border-ink-100 bg-surface p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">You said</p>
                  <p className="mt-1 text-sm text-ink-800">{transcript}</p>
                </div>
              )}
              {reply && (
                <div className="rounded-2xl bg-brand-50 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Reply</p>
                  <p className="mt-1 text-sm text-brand-800">{reply}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
