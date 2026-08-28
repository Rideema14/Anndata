import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { mandiService, type MandiAlertPayload } from '@/services/mandiService'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

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
  /** Re-fetches favorites with their full populated mandi details — call
   *  this from the favorites list page itself; the star/heart toggle
   *  elsewhere doesn't need it and stays instant without it. */
  refreshFavorites: () => Promise<void>
  alerts: MandiAlert[]
  addAlert: (data: MandiAlertPayload) => Promise<void>
  updateAlert: (id: string, data: Partial<MandiAlertPayload & { active: boolean }>) => Promise<void>
  removeAlert: (id: string) => Promise<void>
  isLoading: boolean
}

const MandiContext = createContext<MandiContextValue | null>(null)

export function MandiProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [favorites, setFavorites] = useState<MandiFavorite[]>([])
  const [alerts, setAlerts] = useState<MandiAlert[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([])
      return
    }
    try {
      const favsRes = await mandiService.getFavorites()
      setFavorites(favsRes.data || favsRes || [])
    } catch (err) {
      console.error('Failed to fetch mandi favorites', err)
    }
  }, [isAuthenticated])

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
    const existing = favorites.find((f) => f.mandiId === mandiId)

    // Optimistic: update the star instantly, sync with the server in the
    // background, and only roll back if that call actually fails. Adding a
    // favorite no longer waits on a second full refetch just to reflect
    // "this is now favorited" — that data (with populated mandi details)
    // only gets pulled in when refreshFavorites() is called, i.e. when the
    // favorites list page itself is opened.
    if (existing) {
      setFavorites((prev) => prev.filter((f) => f.mandiId !== mandiId))
    } else {
      setFavorites((prev) => [
        ...prev,
        { id: `temp-${mandiId}`, userId: '', mandiId, createdAt: new Date().toISOString() },
      ])
    }
    showToast(existing ? 'Removed from favorites.' : 'Added to favorites.', {
      type: existing ? 'info' : 'success',
    })

    try {
      if (existing) {
        await mandiService.removeFavorite(mandiId)
      } else {
        await mandiService.addFavorite(mandiId)
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err)
      // Roll back — the UI shouldn't claim it saved when it didn't.
      if (existing) {
        setFavorites((prev) => [...prev, existing])
      } else {
        setFavorites((prev) => prev.filter((f) => f.mandiId !== mandiId))
      }
      showToast("Couldn't update your favorites. Please try again.", { type: 'error' })
    }
  }, [isAuthenticated, favorites, showToast])

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
    () => ({ favorites, isFavorite, toggleFavorite, refreshFavorites, alerts, addAlert, updateAlert, removeAlert, isLoading }),
    [favorites, isFavorite, toggleFavorite, refreshFavorites, alerts, addAlert, updateAlert, removeAlert, isLoading],
  )

  return <MandiContext.Provider value={value}>{children}</MandiContext.Provider>
}

export function useMandi(): MandiContextValue {
  const ctx = useContext(MandiContext)
  if (!ctx) throw new Error('useMandi must be used within a MandiProvider')
  return ctx
}
