import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface WishlistContextValue {
  productIds: string[]
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (productId: string) => void
  removeFromWishlist: (productId: string) => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [productIds, setProductIds] = useState<string[]>(['prd_3', 'prd_9'])

  const isWishlisted = useCallback((productId: string) => productIds.includes(productId), [productIds])

  const toggleWishlist = useCallback((productId: string) => {
    setProductIds((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]))
  }, [])

  const removeFromWishlist = useCallback((productId: string) => {
    setProductIds((prev) => prev.filter((id) => id !== productId))
  }, [])

  const value = useMemo(
    () => ({ productIds, isWishlisted, toggleWishlist, removeFromWishlist }),
    [productIds, isWishlisted, toggleWishlist, removeFromWishlist],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider')
  return ctx
}
