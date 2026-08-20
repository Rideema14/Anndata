import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { notificationService, type AppNotification } from '@/services/notificationService'
import { useAuth } from '@/context/AuthContext'

interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  markRead: (id: string) => void
  markAllRead: () => void
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([])
      return
    }
    setIsLoading(true)
    try {
      const { items } = await notificationService.list({ limit: 50 })
      setNotifications(items)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
  }, [refresh])

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    notificationService.markRead(id).catch(() => {
      // Revert on failure so the UI doesn't silently drift from the server.
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)))
    })
  }, [])

  const markAllRead = useCallback(() => {
    const previous = notifications
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    notificationService.markAllRead().catch(() => {
      setNotifications(previous)
    })
  }, [notifications])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const value = useMemo(
    () => ({ notifications, unreadCount, isLoading, markRead, markAllRead, refresh }),
    [notifications, unreadCount, isLoading, markRead, markAllRead, refresh],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider')
  return ctx
}
