import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { machineryService, type MachineryBooking } from '@/services/machineryService'
import { useAuth } from '@/context/AuthContext'

interface MachineryContextValue {
  bookings: MachineryBooking[]
  isLoading: boolean
  refresh: () => Promise<void>
}

const MachineryContext = createContext<MachineryContextValue | null>(null)

export function MachineryProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [bookings, setBookings] = useState<MachineryBooking[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setBookings([])
      return
    }
    setIsLoading(true)
    try {
      const { items } = await machineryService.listBookings({ limit: 50 })
      setBookings(items)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(() => ({ bookings, isLoading, refresh }), [bookings, isLoading, refresh])

  return <MachineryContext.Provider value={value}>{children}</MachineryContext.Provider>
}

export function useMachinery(): MachineryContextValue {
  const ctx = useContext(MachineryContext)
  if (!ctx) throw new Error('useMachinery must be used within a MachineryProvider')
  return ctx
}
