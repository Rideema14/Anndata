import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { wishlistService } from '@/services/wishlistService'
import { useAuth } from '@/context/AuthContext'
import type { Product } from '@/types'

interface WishlistContextValue {
  productIds: string[]
  products: Product[]
  isLoading: boolean
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (productId: string) => Promise<void>
  removeFromWishlist: (productId: string) => Promise<void>
  refresh: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setProducts([])
      return
    }
    setIsLoading(true)
    try {
      setProducts(await wishlistService.list())
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
  }, [refresh])

  const productIds = useMemo(() => products.map((p) => p.id), [products])

  const isWishlisted = useCallback((productId: string) => productIds.includes(productId), [productIds])

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) return
      if (isWishlisted(productId)) {
        await wishlistService.remove(productId)
        setProducts((prev) => prev.filter((p) => p.id !== productId))
      } else {
        await wishlistService.add(productId)
        await refresh()
      }
    },
    [isAuthenticated, isWishlisted, refresh],
  )

  const removeFromWishlist = useCallback(async (productId: string) => {
    await wishlistService.remove(productId)
    setProducts((prev) => prev.filter((p) => p.id !== productId))
  }, [])

  const value = useMemo(
    () => ({ productIds, products, isLoading, isWishlisted, toggleWishlist, removeFromWishlist, refresh }),
    [productIds, products, isLoading, isWishlisted, toggleWishlist, removeFromWishlist, refresh],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider')
  return ctx
}
