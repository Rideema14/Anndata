import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Mic, PhoneOff, Volume2 } from 'lucide-react'
import { chatService } from '@/services/aiService'
import { getApiErrorMessage } from '@/services/api'
import { useAi } from '@/context/AiContext'
import { cn } from '@/utils/cn'

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
type VoiceLang = 'hi' | 'en'

const STATE_LABEL: Record<VoiceState, string> = {
  idle: 'Tap the mic to start talking',
  listening: 'Listening…',
  processing: 'Thinking…',
  speaking: 'Speaking…',
  error: 'Something went wrong',
}

// Kept to just these two — the app supports five languages elsewhere, but
// the voice assistant is scoped to Hindi/English only, both for the browser
// speech-recognition/synthesis voice quality (by far the best-supported
// pair on Indian-English devices) and to keep the mandi/land/machinery
// keyword-matching in the backend's grounding lookup reliable.
const SPEECH_LANG: Record<VoiceLang, string> = { hi: 'hi-IN', en: 'en-IN' }

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | undefined {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

export default function VoiceAssistantPage() {
  const [state, setState] = useState<VoiceState>('idle')
  const [voiceLang, setVoiceLang] = useState<VoiceLang>('hi')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [reply, setReply] = useState('')
  const [showCaptions, setShowCaptions] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [unsupported, setUnsupported] = useState(false)

  const sessionIdRef = useRef<string | undefined>(undefined)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const conversationActiveRef = useRef(false) // whether to auto-resume listening after speaking
  const finalTranscriptRef = useRef('')
  const voiceLangRef = useRef<VoiceLang>('hi') // recognition callbacks close over stale state, so read the current language from here

  const { refreshHistory } = useAi()

  useEffect(() => {
    voiceLangRef.current = voiceLang
  }, [voiceLang])

  useEffect(() => {
    if (!getSpeechRecognitionCtor() || typeof window.speechSynthesis === 'undefined') {
      setUnsupported(true)
      return
    }
    // Voice lists load asynchronously in Chrome — cache once available so
    // speakReply doesn't have to wait on it mid-conversation.
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      conversationActiveRef.current = false
      recognitionRef.current?.abort()
      window.speechSynthesis.cancel()
    }
  }, [])

  function pickVoice(lang: VoiceLang): SpeechSynthesisVoice | undefined {
    const prefix = SPEECH_LANG[lang].split('-')[0]
    const voices = voicesRef.current
    return voices.find((v) => v.lang === SPEECH_LANG[lang]) ?? voices.find((v) => v.lang.startsWith(prefix))
  }

  const speakReply = useCallback((text: string) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const lang = voiceLangRef.current
    utterance.lang = SPEECH_LANG[lang]
    const voice = pickVoice(lang)
    if (voice) utterance.voice = voice

    utterance.onend = () => {
      // The core "like a real back-and-forth" behavior: once the assistant
      // finishes speaking, it starts listening again on its own.
      if (conversationActiveRef.current) startListening()
      else setState('idle')
    }
    utterance.onerror = () => {
      setShowCaptions(true)
      setState('idle')
      conversationActiveRef.current = false
    }

    setState('speaking')
    window.speechSynthesis.speak(utterance)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submitTranscript = useCallback(
    async (text: string) => {
      setState('processing')
      try {
        if (!sessionIdRef.current) {
          const session = await chatService.createSession()
          sessionIdRef.current = session.id
        }
        const { assistantMessage } = await chatService.sendMessage(sessionIdRef.current, text, voiceLangRef.current)
        setReply(assistantMessage.content)
        refreshHistory()
        speakReply(assistantMessage.content)
      } catch (err) {
        setErrorMessage(getApiErrorMessage(err, "Couldn't get a reply. Please try again."))
        setState('error')
        conversationActiveRef.current = false
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshHistory, speakReply]
  )

  function startListening() {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setUnsupported(true)
      return
    }

    setErrorMessage('')
    setTranscript('')
    setInterimTranscript('')
    finalTranscriptRef.current = ''
    conversationActiveRef.current = true

    const recognition = new Ctor()
    recognition.lang = SPEECH_LANG[voiceLangRef.current]
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) finalTranscriptRef.current += text
        else interim += text
      }
      setInterimTranscript(interim)
      if (finalTranscriptRef.current) setTranscript(finalTranscriptRef.current)
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Gave up waiting / was deliberately stopped — not a real error,
        // just end the turn quietly the same way onend below would.
        return
      }
      const message =
        event.error === 'not-allowed' || event.error === 'audio-capture'
          ? 'Microphone access is required for the voice assistant.'
          : "Couldn't hear that clearly. Please try again."
      setErrorMessage(message)
      setState('error')
      conversationActiveRef.current = false
    }

    recognition.onend = () => {
      const finalText = finalTranscriptRef.current.trim()
      setInterimTranscript('')
      if (finalText) {
        void submitTranscript(finalText)
      } else if (conversationActiveRef.current) {
        // Nothing was said before the browser's own silence timeout fired.
        setState('idle')
        conversationActiveRef.current = false
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setState('listening')
    } catch {
      setErrorMessage('Microphone access is required for the voice assistant.')
      setState('error')
      conversationActiveRef.current = false
    }
  }

  function stopListening() {
    recognitionRef.current?.stop() // triggers onresult (final) then onend, which submits whatever was captured
  }

  function handleMicTap() {
    if (state === 'idle' || state === 'error') {
      startListening()
      return
    }
    if (state === 'listening') {
      stopListening()
      return
    }
    if (state === 'speaking') {
      // Barge-in: interrupt the reply and ask something else right away.
      window.speechSynthesis.cancel()
      startListening()
    }
  }

  function endConversation() {
    conversationActiveRef.current = false
    recognitionRef.current?.abort()
    window.speechSynthesis.cancel()
    setState('idle')
  }

  const inConversation = state !== 'idle' && state !== 'error'
  const displayTranscript = interimTranscript || transcript

  if (unsupported) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="flex items-start gap-2 rounded-2xl bg-danger-50 p-4 text-left text-sm text-danger-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Voice assistant needs your browser's built-in speech support, which isn't available here. Please try
          Chrome, Edge, or Safari instead.
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      {/* Hindi/English toggle — only these two, per the voice assistant's scope */}
      <div className="mb-6 flex items-center gap-1 rounded-full bg-surface-sunk p-1">
        {(['hi', 'en'] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setVoiceLang(lang)}
            disabled={state !== 'idle' && state !== 'error'}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
              voiceLang === lang ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-500 hover:text-ink-800'
            )}
          >
            {lang === 'hi' ? 'हिंदी' : 'English'}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleMicTap}
        disabled={state === 'processing'}
        aria-label="Toggle voice assistant"
        className={cn(
          'flex h-28 w-28 items-center justify-center rounded-full transition-colors',
          state === 'listening' && 'bg-danger-500 text-white shadow-float',
          state === 'processing' && 'bg-gold-400 text-white shadow-float',
          state === 'speaking' && 'bg-brand-600 text-white shadow-float animate-pulse',
          (state === 'idle' || state === 'error') && 'bg-brand-600 text-white shadow-float'
        )}
      >
        {state === 'speaking' ? (
          <Volume2 className="h-11 w-11" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Mic className="h-11 w-11" strokeWidth={1.5} aria-hidden="true" />
        )}
      </button>

      <p className="mt-5 text-sm font-medium text-ink-700">{STATE_LABEL[state]}</p>
      <p className="mt-1 text-xs text-ink-400">
        {voiceLang === 'hi' ? 'हिंदी में बोलें — जवाब भी हिंदी में मिलेगा' : 'Speak in English — reply comes back in English'}
      </p>

      {state === 'listening' && displayTranscript && (
        <p className="mt-3 max-w-full text-sm italic text-ink-500">"{displayTranscript}"</p>
      )}

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

      {state === 'error' && errorMessage && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-danger-50 p-3.5 text-left text-sm text-danger-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </div>
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
