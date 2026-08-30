import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Mic, PhoneOff, Volume2 } from 'lucide-react'
import { AiMarkdown } from '@/components/common/AiMarkdown'
import { chatService } from '@/services/aiService'
import { getApiErrorMessage } from '@/services/api'
import { useAi } from '@/context/AiContext'
import { cn } from '@/utils/cn'

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
type VoiceLang = 'hi' | 'en'
type Turn = { role: 'user' | 'assistant'; text: string }

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

// The AI's reply is shown formatted (bullets, bold, links) in the transcript
// panel, but speech synthesis should never read out markdown punctuation
// ("asterisk asterisk", "hash") — so this strips markdown syntax down to
// plain words before the text is handed to the speech synthesizer.
function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ') // code blocks
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]+\)/g, '') // images
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1') // links -> link text only
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/^\s*[-*+]\s+/gm, '') // bullet markers
    .replace(/^\s*\d+\.\s+/gm, '') // numbered list markers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italics
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/[-*_]{3,}/g, ' ')
    .trim()
}

export default function VoiceAssistantPage() {
  const [state, setState] = useState<VoiceState>('idle')
  const [voiceLang, setVoiceLang] = useState<VoiceLang>('hi')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [history, setHistory] = useState<Turn[]>([]) // full running transcript, shown below the mic at all times
  const [errorMessage, setErrorMessage] = useState('')
  const [unsupported, setUnsupported] = useState(false)

  const sessionIdRef = useRef<string | undefined>(undefined)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const conversationActiveRef = useRef(false) // whether to auto-resume listening after speaking
  const finalTranscriptRef = useRef('')
  const voiceLangRef = useRef<VoiceLang>('hi') // recognition callbacks close over stale state, so read the current language from here
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)

  const { refreshHistory } = useAi()

  // Keep the transcript panel scrolled to the latest line, ChatGPT-voice-style.
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [history, interimTranscript])

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
    const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text))
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
      setState('idle')
      conversationActiveRef.current = false
    }

    setState('speaking')
    window.speechSynthesis.speak(utterance)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submitTranscript = useCallback(
    async (text: string) => {
      // Show what the person said immediately — don't wait on the network
      // round trip before the transcript panel updates.
      setHistory((prev) => [...prev, { role: 'user', text }])
      setState('processing')
      try {
        if (!sessionIdRef.current) {
          const session = await chatService.createSession()
          sessionIdRef.current = session.id
        }
        const { assistantMessage } = await chatService.sendMessage(sessionIdRef.current, text, voiceLangRef.current)
        setHistory((prev) => [...prev, { role: 'assistant', text: assistantMessage.content }])
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
      // Live-update the interim line so the transcript panel below the mic
      // reflects speech as it's being recognized, not just after the fact.
      setInterimTranscript(finalTranscriptRef.current + interim)
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

  const hasTranscript = history.length > 0 || (state === 'listening' && interimTranscript)

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col px-4 pt-6 text-center">
      {/* Hindi/English toggle — only these two, per the voice assistant's scope */}
      <div className="mx-auto mb-4 flex items-center gap-1 rounded-full bg-surface-sunk p-1">
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

      {/* Live transcript panel — always visible, ChatGPT-voice-style: every
          turn (what you said, what the AI said) stays on screen as the
          conversation goes, instead of being hidden behind a toggle. */}
      <div className="mb-3 flex-1 overflow-y-auto rounded-2xl border border-ink-100 bg-surface p-3.5 text-left" style={{ maxHeight: '48vh' }}>
        {!hasTranscript ? (
          <p className="mt-6 text-center text-sm text-ink-400">
            {voiceLang === 'hi'
              ? 'बातचीत यहाँ दिखेगी — माइक दबाकर बोलना शुरू करें'
              : 'Your conversation will appear here — tap the mic to start'}
          </p>
        ) : (
          <div className="space-y-2.5">
            {history.map((turn, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[90%] rounded-2xl p-3',
                  turn.role === 'user' ? 'ml-auto bg-brand-600 text-white' : 'mr-auto bg-surface-sunk text-ink-800'
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                  {turn.role === 'user' ? 'You' : 'AI'}
                </p>
                {turn.role === 'assistant' ? (
                  <AiMarkdown content={turn.text} className="mt-0.5" tone="light" />
                ) : (
                  <p className="mt-0.5 whitespace-pre-wrap text-sm">{turn.text}</p>
                )}
              </div>
            ))}
            {state === 'listening' && interimTranscript && (
              <div className="ml-auto max-w-[90%] rounded-2xl bg-brand-600/60 p-3 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">You</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm italic">{interimTranscript}</p>
              </div>
            )}
          </div>
        )}
        <div ref={transcriptEndRef} />
      </div>

      <div className="flex flex-col items-center pb-6">
        <button
          type="button"
          onClick={handleMicTap}
          disabled={state === 'processing'}
          aria-label="Toggle voice assistant"
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-full transition-colors',
            state === 'listening' && 'bg-danger-500 text-white shadow-float',
            state === 'processing' && 'bg-gold-400 text-white shadow-float',
            state === 'speaking' && 'bg-brand-600 text-white shadow-float animate-pulse',
            (state === 'idle' || state === 'error') && 'bg-brand-600 text-white shadow-float'
          )}
        >
          {state === 'speaking' ? (
            <Volume2 className="h-10 w-10" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Mic className="h-10 w-10" strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>

        <p className="mt-4 text-sm font-medium text-ink-700">{STATE_LABEL[state]}</p>
        <p className="mt-1 text-xs text-ink-400">
          {voiceLang === 'hi' ? 'हिंदी में बोलें — जवाब भी हिंदी में मिलेगा' : 'Speak in English — reply comes back in English'}
        </p>

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
      </div>
    </div>
  )
}
