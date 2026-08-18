import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AiHistoryEntry, AiHistoryType } from '@/types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

const initialHistory: AiHistoryEntry[] = [
  {
    id: 'ai_1',
    type: 'crop_advisor',
    title: 'Crop Advisor',
    summary: 'Recommended Soybean for Katni, Kharif season, black soil.',
    createdAt: '2026-08-10T07:00:00.000Z',
  },
  {
    id: 'ai_2',
    type: 'soil',
    title: 'Soil Analysis',
    summary: 'pH 6.8 (Good), Nitrogen Low, Phosphorus Medium, Potassium Good.',
    createdAt: '2026-08-05T07:00:00.000Z',
  },
]

const initialMessages: ChatMessage[] = [
  {
    id: 'msg_1',
    role: 'assistant',
    text: 'नमस्ते! मैं आपकी खेती से जुड़े सवालों में मदद कर सकता हूँ। आप क्या जानना चाहते हैं?',
    createdAt: '2026-08-16T06:00:00.000Z',
  },
]

interface AiContextValue {
  history: AiHistoryEntry[]
  addHistoryEntry: (type: AiHistoryType, title: string, summary: string) => void
  messages: ChatMessage[]
  addMessage: (role: ChatMessage['role'], text: string) => void
}

const AiContext = createContext<AiContextValue | null>(null)

export function AiProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<AiHistoryEntry[]>(initialHistory)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)

  const addHistoryEntry = useCallback((type: AiHistoryType, title: string, summary: string) => {
    setHistory((prev) => [{ id: `ai_${Date.now()}`, type, title, summary, createdAt: new Date().toISOString() }, ...prev])
  }, [])

  const addMessage = useCallback((role: ChatMessage['role'], text: string) => {
    setMessages((prev) => [...prev, { id: `msg_${Date.now()}_${role}`, role, text, createdAt: new Date().toISOString() }])
  }, [])

  const value = useMemo(
    () => ({ history, addHistoryEntry, messages, addMessage }),
    [history, addHistoryEntry, messages, addMessage],
  )

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>
}

export function useAi(): AiContextValue {
  const ctx = useContext(AiContext)
  if (!ctx) throw new Error('useAi must be used within an AiProvider')
  return ctx
}
