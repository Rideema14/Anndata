import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { useAi } from '@/context/AiContext'
import { cn } from '@/utils/cn'

const SUGGESTIONS = ['मेरी गेहूं की फसल पीली हो रही है', 'Best time to sow soybean?', 'सिंचाई कब करें?']

function mockReply(input: string): string {
  const text = input.toLowerCase()
  if (text.includes('पीली') || text.includes('yellow')) {
    return 'पत्तियों का पीला पड़ना अक्सर नाइट्रोजन की कमी के कारण होता है। यूरिया का हल्का छिड़काव करें और मिट्टी की जांच करवाएं। ज़्यादा जानकारी के लिए "Soil Analysis" खोलें।'
  }
  if (text.includes('sow') || text.includes('बुवाई')) {
    return 'Soybean is best sown at the start of the Kharif season (mid-June to early July), right after the first good monsoon rain.'
  }
  if (text.includes('सिंचाई') || text.includes('irrigat')) {
    return 'आज बारिश की संभावना है, इसलिए सिंचाई की ज़रूरत नहीं है। कल मौसम देखने के बाद फिर से पूछें — "Irrigation Advice" में विस्तार से देखा जा सकता है।'
  }
  return "That's a great question — based on typical conditions in your area, I'd suggest checking Soil Analysis and Crop Advisor for a more specific answer. Could you share more detail about your crop and field?"
}

export default function AiChatPage() {
  const { messages, addMessage } = useAi()
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function send(text: string) {
    if (!text.trim()) return
    addMessage('user', text)
    setInput('')
    setTyping(true)
    window.setTimeout(() => {
      addMessage('assistant', mockReply(text))
      setTyping(false)
    }, 900)
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
        {messages.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <p
              className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-surface-sunk text-ink-800',
              )}
            >
              {m.text}
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

      {messages.length < 2 && (
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
          disabled={!input.trim()}
          aria-label="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white disabled:bg-ink-200"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
