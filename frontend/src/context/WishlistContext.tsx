import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { wishlistService } from '@/services/wishlistService'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
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
  const { showToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  // Fast membership set, updated optimistically the instant someone clicks —
  // this is what every heart icon actually reads, so it never waits on a
  // network round trip. `products` (the full listing, with images/prices/etc.)
  // is only needed by the Wishlist page itself and stays in sync separately.
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setProducts([])
      setWishlistedIds(new Set())
      return
    }
    setIsLoading(true)
    try {
      const list = await wishlistService.list()
      setProducts(list)
      setWishlistedIds(new Set(list.map((p) => p.id)))
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
  }, [refresh])

  const productIds = useMemo(() => Array.from(wishlistedIds), [wishlistedIds])

  const isWishlisted = useCallback((productId: string) => wishlistedIds.has(productId), [wishlistedIds])

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) return
      const wasWishlisted = wishlistedIds.has(productId)

      // Optimistic: flip the membership set immediately so the heart icon
      // (and any "isWishlisted" check anywhere in the app) responds instantly,
      // instead of waiting on the network before showing anything.
      setWishlistedIds((prev) => {
        const next = new Set(prev)
        if (wasWishlisted) next.delete(productId)
        else next.add(productId)
        return next
      })
      if (wasWishlisted) {
        setProducts((prev) => prev.filter((p) => p.id !== productId))
      }
      showToast(wasWishlisted ? 'Removed from your wishlist.' : 'Saved to your wishlist.', {
        type: wasWishlisted ? 'info' : 'success',
      })

      try {
        if (wasWishlisted) {
          await wishlistService.remove(productId)
        } else {
          // No need to re-fetch the whole list here — the heart icon is
          // already showing the right state. The full `products` list (with
          // images/prices) only needs to be accurate before the Wishlist
          // page itself is opened, so let that page's own mount just call
          // refresh() rather than doing it again on every single click.
          await wishlistService.add(productId)
        }
      } catch (err) {
        // Roll back on failure so the UI doesn't lie about what's saved.
        setWishlistedIds((prev) => {
          const next = new Set(prev)
          if (wasWishlisted) next.add(productId)
          else next.delete(productId)
          return next
        })
        showToast("Couldn't update your wishlist. Please try again.", { type: 'error' })
        throw err
      }
    },
    [isAuthenticated, wishlistedIds, showToast],
  )

  const removeFromWishlist = useCallback(
    async (productId: string) => {
      setWishlistedIds((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      try {
        await wishlistService.remove(productId)
      } catch (err) {
        showToast("Couldn't remove that item. Please try again.", { type: 'error' })
        throw err
      }
    },
    [showToast],
  )

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