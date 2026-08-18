import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export interface MandiFavorite {
  id: string
  crop: string
  mandi: string
}

export interface MandiAlert {
  id: string
  crop: string
  mandi: string
  targetPrice: number
  active: boolean
}

interface MandiContextValue {
  favorites: MandiFavorite[]
  isFavorite: (crop: string, mandi: string) => boolean
  toggleFavorite: (crop: string, mandi: string) => void
  alerts: MandiAlert[]
  addAlert: (crop: string, mandi: string, targetPrice: number) => void
  removeAlert: (id: string) => void
}

const MandiContext = createContext<MandiContextValue | null>(null)

export function MandiProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<MandiFavorite[]>([
    { id: 'fav_1', crop: 'Wheat', mandi: 'Katni Mandi' },
    { id: 'fav_2', crop: 'Soybean', mandi: 'Katni Mandi' },
  ])
  const [alerts, setAlerts] = useState<MandiAlert[]>([
    { id: 'alert_1', crop: 'Wheat', mandi: 'Katni Mandi', targetPrice: 2300, active: true },
  ])

  const isFavorite = useCallback(
    (crop: string, mandi: string) => favorites.some((f) => f.crop === crop && f.mandi === mandi),
    [favorites],
  )

  const toggleFavorite = useCallback((crop: string, mandi: string) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.crop === crop && f.mandi === mandi)
      if (exists) return prev.filter((f) => !(f.crop === crop && f.mandi === mandi))
      return [...prev, { id: `fav_${Date.now()}`, crop, mandi }]
    })
  }, [])

  const addAlert = useCallback((crop: string, mandi: string, targetPrice: number) => {
    setAlerts((prev) => [...prev, { id: `alert_${Date.now()}`, crop, mandi, targetPrice, active: true }])
  }, [])

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, alerts, addAlert, removeAlert }),
    [favorites, isFavorite, toggleFavorite, alerts, addAlert, removeAlert],
  )

  return <MandiContext.Provider value={value}>{children}</MandiContext.Provider>
}

export function useMandi(): MandiContextValue {
  const ctx = useContext(MandiContext)
  if (!ctx) throw new Error('useMandi must be used within a MandiProvider')
  return ctx
}
