import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { initialSellerApplications, type SellerApplication } from '@/data/mock/mockAdminData'
import { mockProductCatalog } from '@/data/mock/mockProductCatalog'

interface AdminContextValue {
  sellerApplications: SellerApplication[]
  approveApplication: (id: string) => void
  rejectApplication: (id: string) => void
  removedProductIds: string[]
  removeProduct: (id: string) => void
  removedReviewIds: string[]
  removeReview: (id: string) => void
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [sellerApplications, setSellerApplications] = useState<SellerApplication[]>(initialSellerApplications)
  const [removedProductIds, setRemovedProductIds] = useState<string[]>([])
  const [removedReviewIds, setRemovedReviewIds] = useState<string[]>([])

  const approveApplication = useCallback((id: string) => {
    setSellerApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'verified' } : a)))
  }, [])

  const rejectApplication = useCallback((id: string) => {
    setSellerApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a)))
  }, [])

  const removeProduct = useCallback((id: string) => {
    setRemovedProductIds((prev) => [...prev, id])
  }, [])

  const removeReview = useCallback((id: string) => {
    setRemovedReviewIds((prev) => [...prev, id])
  }, [])

  const value = useMemo(
    () => ({ sellerApplications, approveApplication, rejectApplication, removedProductIds, removeProduct, removedReviewIds, removeReview }),
    [sellerApplications, approveApplication, rejectApplication, removedProductIds, removeProduct, removedReviewIds, removeReview],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within an AdminProvider')
  return ctx
}

export function useVisibleAdminProducts() {
  const { removedProductIds } = useAdmin()
  return mockProductCatalog.filter((p) => !removedProductIds.includes(p.id))
}
