import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { chatService, type ChatMessage } from '@/services/aiService'
import { getApiErrorMessage } from '@/services/api'
import { useAi } from '@/context/AiContext'
import { cn } from '@/utils/cn'

const SUGGESTIONS = ['मेरी गेहूं की फसल पीली हो रही है', 'Best time to sow soybean?', 'सिंचाई कब करें?']

export default function AiChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const { refreshHistory } = useAi()

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId
    const session = await chatService.createSession()
    setSessionId(session.id)
    return session.id
  }

  async function send(text: string) {
    if (!text.trim()) return
    setError('')
    const tempId = `local_${Date.now()}`
    setMessages((prev) => [...prev, { id: tempId, role: 'user', content: text, createdAt: new Date().toISOString() }])
    setInput('')
    setTyping(true)
    try {
      const id = await ensureSession()
      const { assistantMessage } = await chatService.sendMessage(id, text)
      setMessages((prev) => [...prev, assistantMessage])
      refreshHistory()
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't send that message. Please try again."))
    } finally {
      setTyping(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    send(input)
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-4rem)] max-w-2xl flex-col px-4 md:h-[calc(100svh-4.5rem)] md:px-6">
      <div className="flex items-center gap-2 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-50 text-gold-600">
          <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <h1 className="text-lg">Ask AI</h1>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-3">
        {messages.length === 0 && !typing && (
          <div className="flex justify-start">
            <p className="max-w-[80%] rounded-2xl bg-surface-sunk px-3.5 py-2.5 text-sm leading-relaxed text-ink-800">
              नमस्ते! मैं आपकी खेती से जुड़े सवालों में मदद कर सकता हूँ। आप क्या जानना चाहते हैं?
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <p
              className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-surface-sunk text-ink-800',
              )}
            >
              {m.content}
            </p>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <span className="flex items-center gap-1 rounded-2xl bg-surface-sunk px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:0.2s]" />
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="mb-2 text-xs font-medium text-danger-500">{error}</p>}

      {messages.length === 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-ink-100 bg-surface px-3 py-1.5 text-xs text-ink-600 hover:border-brand-300"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-ink-100 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          className="h-11 flex-1 rounded-full border border-ink-200 bg-surface px-4 text-sm focus:border-brand-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || typing}
          aria-label="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white disabled:bg-ink-200"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
