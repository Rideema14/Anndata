import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { historyService, type HistoryItem } from '@/services/aiService'
import { useAuth } from '@/context/AuthContext'

interface AiContextValue {
  history: HistoryItem[]
  isLoadingHistory: boolean
  refreshHistory: () => Promise<void>
}

const AiContext = createContext<AiContextValue | null>(null)

export function AiProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const refreshHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistory([])
      return
    }
    setIsLoadingHistory(true)
    try {
      const items = await historyService.getHistory(30)
      setHistory(items)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshHistory()
  }, [refreshHistory])

  const value = useMemo(() => ({ history, isLoadingHistory, refreshHistory }), [history, isLoadingHistory, refreshHistory])

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>
}

export function useAi(): AiContextValue {
  const ctx = useContext(AiContext)
  if (!ctx) throw new Error('useAi must be used within an AiProvider')
  return ctx
}
