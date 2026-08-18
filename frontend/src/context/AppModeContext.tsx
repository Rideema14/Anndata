import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AppMode } from '@/types'

const STORAGE_KEY = 'aandata.mode'

interface AppModeContextValue {
  mode: AppMode
  setMode: (mode: AppMode) => void
  toggleMode: () => void
}

const AppModeContext = createContext<AppModeContextValue | null>(null)

function getInitialMode(): AppMode {
  if (typeof window === 'undefined') return 'buy'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'sell' ? 'sell' : 'buy'
}

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(getInitialMode)

  const setMode = useCallback((next: AppMode) => {
    setModeState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'buy' ? 'sell' : 'buy'
      window.localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode])

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
}

export function useAppMode(): AppModeContextValue {
  const ctx = useContext(AppModeContext)
  if (!ctx) throw new Error('useAppMode must be used within an AppModeProvider')
  return ctx
}
