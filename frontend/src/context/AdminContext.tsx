import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { sellerService, type SellerApplication } from '@/services/sellerService'
import { useAuth } from '@/context/AuthContext'

interface AdminContextValue {
  sellerApplications: SellerApplication[]
  isLoadingApplications: boolean
  refreshApplications: () => Promise<void>
  approveApplication: (id: string) => Promise<void>
  rejectApplication: (id: string) => Promise<void>
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth()
  const [sellerApplications, setSellerApplications] = useState<SellerApplication[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)

  const refreshApplications = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) {
      setSellerApplications([])
      return
    }
    setIsLoadingApplications(true)
    try {
      setSellerApplications(await sellerService.listApplications())
    } finally {
      setIsLoadingApplications(false)
    }
  }, [isAuthenticated, isAdmin])

  useEffect(() => {
    refreshApplications()
  }, [refreshApplications])

  const approveApplication = useCallback(async (id: string) => {
    const status = await sellerService.reviewApplication(id, 'APPROVE')
    setSellerApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }, [])

  const rejectApplication = useCallback(async (id: string) => {
    const status = await sellerService.reviewApplication(id, 'REJECT')
    setSellerApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }, [])

  const value = useMemo(
    () => ({ sellerApplications, isLoadingApplications, refreshApplications, approveApplication, rejectApplication }),
    [sellerApplications, isLoadingApplications, refreshApplications, approveApplication, rejectApplication],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within an AdminProvider')
  return ctx
}
