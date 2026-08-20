import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { mandiService, type MandiAlertPayload } from '@/services/mandiService'
import { useAuth } from './AuthContext'

export interface MandiFavorite {
  id: string
  userId: string
  mandiId: string
  createdAt: string
  mandi?: any
}

export interface MandiAlert {
  id: string
  userId: string
  cropId: string
  mandiId: string | null
  priceType: 'MIN' | 'MAX' | 'MODAL'
  condition: 'ABOVE' | 'BELOW'
  thresholdPrice: number
  isActive: boolean
  crop?: any
  mandi?: any
}

interface MandiContextValue {
  favorites: MandiFavorite[]
  isFavorite: (mandiId: string) => boolean
  toggleFavorite: (mandiId: string) => Promise<void>
  alerts: MandiAlert[]
  addAlert: (data: MandiAlertPayload) => Promise<void>
  updateAlert: (id: string, data: Partial<MandiAlertPayload & { active: boolean }>) => Promise<void>
  removeAlert: (id: string) => Promise<void>
  isLoading: boolean
}

const MandiContext = createContext<MandiContextValue | null>(null)

export function MandiProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [favorites, setFavorites] = useState<MandiFavorite[]>([])
  const [alerts, setAlerts] = useState<MandiAlert[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([])
      setAlerts([])
      return
    }
    try {
      setIsLoading(true)
      const [favsRes, alertsRes] = await Promise.all([
        mandiService.getFavorites(),
        mandiService.getAlerts()
      ])
      setFavorites(favsRes.data || favsRes || [])
      setAlerts(alertsRes.data || alertsRes || [])
    } catch (err) {
      console.error('Failed to fetch mandi user data', err)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isFavorite = useCallback(
    (mandiId: string) => favorites.some((f) => f.mandiId === mandiId),
    [favorites],
  )

  const toggleFavorite = useCallback(async (mandiId: string) => {
    if (!isAuthenticated) return
    const exists = favorites.find((f) => f.mandiId === mandiId)
    try {
      if (exists) {
        await mandiService.removeFavorite(mandiId)
        setFavorites((prev) => prev.filter((f) => f.mandiId !== mandiId))
      } else {
        const newFav = await mandiService.addFavorite(mandiId)
        // refresh to get populated mandi object if needed, or just append
        fetchData()
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err)
    }
  }, [isAuthenticated, favorites, fetchData])

  const addAlert = useCallback(async (data: MandiAlertPayload) => {
    if (!isAuthenticated) return
    try {
      await mandiService.createAlert(data)
      fetchData()
    } catch (err) {
      console.error('Failed to add alert', err)
      throw err
    }
  }, [isAuthenticated, fetchData])

  const updateAlert = useCallback(async (id: string, data: Partial<MandiAlertPayload & { active: boolean }>) => {
    if (!isAuthenticated) return
    try {
      await mandiService.updateAlert(id, data)
      fetchData()
    } catch (err) {
      console.error('Failed to update alert', err)
      throw err
    }
  }, [isAuthenticated, fetchData])

  const removeAlert = useCallback(async (id: string) => {
    if (!isAuthenticated) return
    try {
      await mandiService.deleteAlert(id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Failed to remove alert', err)
    }
  }, [isAuthenticated])

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, alerts, addAlert, updateAlert, removeAlert, isLoading }),
    [favorites, isFavorite, toggleFavorite, alerts, addAlert, updateAlert, removeAlert, isLoading],
  )

  return <MandiContext.Provider value={value}>{children}</MandiContext.Provider>
}

export function useMandi(): MandiContextValue {
  const ctx = useContext(MandiContext)
  if (!ctx) throw new Error('useMandi must be used within a MandiProvider')
  return ctx
}
