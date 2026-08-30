import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { AppMode } from '@/types'

const STORAGE_KEY = 'farmverse.mode'

interface AppModeContextValue {
  mode: AppMode
  setMode: (mode: AppMode) => void
  toggleMode: () => void
}

const AppModeContext = createContext<AppModeContextValue | null>(null)

function readStoredMode(): AppMode {
  if (typeof window === 'undefined') return 'buy'
  return window.localStorage.getItem(STORAGE_KEY) === 'sell' ? 'sell' : 'buy'
}

/**
 * The sidebar/nav mode is derived from the account's actual role, not just
 * whatever was last clicked. Without this, a plain buyer whose browser has a
 * stale "sell" preference (e.g. shared device, or downgraded from seller)
 * would see the full seller navigation despite not being a seller — and an
 * admin, who is neither buyer nor seller, would fall through to the plain
 * buyer sidebar with no admin section at all.
 */
function resolveMode(isAdmin: boolean, isSeller: boolean, preferred: AppMode): AppMode {
  if (isAdmin) return 'admin'
  if (isSeller) return preferred === 'sell' ? 'sell' : 'buy'
  return 'buy'
}

export function AppModeProvider({ children }: { children: ReactNode }) {
  const { isAdmin, isSeller } = useAuth()
  const [mode, setModeState] = useState<AppMode>(() => resolveMode(isAdmin, isSeller, readStoredMode()))

  // Re-clamp whenever the signed-in account (or its role) changes — e.g. on
  // login, logout, or a seller application being approved mid-session.
  useEffect(() => {
    setModeState(resolveMode(isAdmin, isSeller, readStoredMode()))
  }, [isAdmin, isSeller])

  const setMode = useCallback(
    (next: AppMode) => {
      const resolved = resolveMode(isAdmin, isSeller, next)
      setModeState(resolved)
      if (resolved !== 'admin') window.localStorage.setItem(STORAGE_KEY, resolved)
    },
    [isAdmin, isSeller],
  )

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      if (isAdmin) return 'admin'
      if (!isSeller) return 'buy'
      const next = prev === 'buy' ? 'sell' : 'buy'
      window.localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [isAdmin, isSeller])

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode])

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
}

export function useAppMode(): AppModeContextValue {
  const ctx = useContext(AppModeContext)
  if (!ctx) throw new Error('useAppMode must be used within an AppModeProvider')
  return ctx
}
