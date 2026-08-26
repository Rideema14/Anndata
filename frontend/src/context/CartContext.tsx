import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cartService } from '@/services/cartService'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import type { CartLine, Product } from '@/types'

interface CartContextValue {
  lines: CartLine[]
  isLoading: boolean
  addToCart: (product: Product, quantity?: number, variantId?: string) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  setQuantity: (productId: string, quantity: number) => Promise<void>
  toggleSaveForLater: (productId: string) => void
  clearCart: () => Promise<void>
  refresh: () => Promise<void>
  itemCount: number
  subtotal: number
  quantityOf: (productId: string) => number
}

const DELIVERY_FLAT_FEE = 49
const FREE_DELIVERY_THRESHOLD = 999

/** Prefix used for lines that only exist optimistically (server hasn't confirmed the real itemId yet). */
const TEMP_ITEM_PREFIX = 'temp-'

/** How long to wait after the last +/- click before actually hitting the network, so a burst of rapid clicks collapses into a single request. */
const QUANTITY_DEBOUNCE_MS = 450

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [rawLines, setRawLines] = useState<CartLine[]>([])
  // Saved-for-later has no backend equivalent — tracked locally by productId.
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  // Debounce bookkeeping for setQuantity: one pending timer + one "state
  // before this burst of clicks started" snapshot per productId, so a rapid
  // string of +/- clicks sends exactly one request and rolls back cleanly.
  const quantityTimers = useRef<Record<string, number>>({})
  const quantityBaseline = useRef<Record<string, CartLine[]>>({})

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setRawLines([])
      return
    }
    setIsLoading(true)
    try {
      const cart = await cartService.get()
      setRawLines(cart.lines)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Clear any in-flight debounce timers on unmount so they don't fire against a gone component.
  useEffect(() => {
    return () => {
      Object.values(quantityTimers.current).forEach((id) => window.clearTimeout(id))
    }
  }, [])

  const lines = useMemo<CartLine[]>(
    () => rawLines.map((l) => ({ ...l, savedForLater: savedIds.has(l.productId) })),
    [rawLines, savedIds],
  )

  const quantityOf = useCallback(
    (productId: string) => rawLines.find((l) => l.productId === productId)?.quantity ?? 0,
    [rawLines],
  )

  /**
   * Adds an item and shows it in the cart immediately, using the product
   * data already on hand (product card / product page) instead of waiting
   * on a round trip. The real line (with its server-assigned itemId) is
   * swapped in once the request resolves; on failure the optimistic line is
   * rolled back and the person is told to retry.
   */
  const addToCart = useCallback(
    async (product: Product, quantity = 1, variantId?: string) => {
      if (!isAuthenticated) return

      const variant = product.variantOptions?.find((v) => v.id === variantId)
      const unitPrice = variant?.price ?? product.price

      let previousLines: CartLine[] = []
      setRawLines((prev) => {
        previousLines = prev
        const idx = prev.findIndex((l) => l.productId === product.id && (l.variantId ?? undefined) === variantId)
        if (idx >= 0) {
          const next = [...prev]
          const newQuantity = next[idx].quantity + quantity
          next[idx] = { ...next[idx], quantity: newQuantity, lineTotal: unitPrice * newQuantity }
          return next
        }
        const optimisticLine: CartLine = {
          productId: product.id,
          quantity,
          savedForLater: false,
          itemId: `${TEMP_ITEM_PREFIX}${product.id}-${variantId ?? 'default'}`,
          variantId,
          variantName: variant?.name,
          unitPrice,
          lineTotal: unitPrice * quantity,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug ?? product.id,
            price: unitPrice,
            imageUrl: product.images?.[0],
            stock: variant?.stock ?? product.stock,
          },
        }
        return [...prev, optimisticLine]
      })

      setSavedIds((prev) => {
        if (!prev.has(product.id)) return prev
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })

      showToast('Added to your cart.', { type: 'success' })

      try {
        const cart = await cartService.addItem(product.id, quantity, variantId)
        setRawLines(cart.lines)
      } catch (err) {
        setRawLines(previousLines)
        showToast("Couldn't add that to your cart. Please try again.", { type: 'error' })
        throw err
      }
    },
    [isAuthenticated, showToast],
  )

  const removeFromCart = useCallback(
    async (productId: string) => {
      // A pending quantity change for this line is now moot.
      if (quantityTimers.current[productId]) {
        window.clearTimeout(quantityTimers.current[productId])
        delete quantityTimers.current[productId]
        delete quantityBaseline.current[productId]
      }

      let previousLines: CartLine[] = []
      let itemId: string | undefined
      setRawLines((prev) => {
        previousLines = prev
        const line = prev.find((l) => l.productId === productId)
        itemId = line?.itemId
        return prev.filter((l) => l.productId !== productId)
      })

      // Optimistic-only line that never made it to the server — nothing to delete remotely.
      if (!itemId || itemId.startsWith(TEMP_ITEM_PREFIX)) return

      try {
        const cart = await cartService.removeItem(itemId)
        setRawLines(cart.lines)
      } catch (err) {
        setRawLines(previousLines)
        showToast("Couldn't remove that item. Please try again.", { type: 'error' })
        throw err
      }
    },
    [showToast],
  )

  /**
   * Updates the displayed quantity the instant a +/- button is clicked.
   * The actual PATCH is debounced, so mashing the button five times in a
   * row sends one request (with the final quantity) instead of five.
   */
  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const targetQuantity = Math.max(1, quantity)
      let itemId: string | undefined

      setRawLines((prev) => {
        if (!quantityBaseline.current[productId]) {
          quantityBaseline.current[productId] = prev
        }
        return prev.map((l) => {
          if (l.productId !== productId) return l
          itemId = l.itemId
          const unitPrice = l.unitPrice ?? l.product?.price ?? 0
          return { ...l, quantity: targetQuantity, lineTotal: unitPrice * targetQuantity }
        })
      })

      if (!itemId || itemId.startsWith(TEMP_ITEM_PREFIX)) return

      const resolvedItemId = itemId
      if (quantityTimers.current[productId]) {
        window.clearTimeout(quantityTimers.current[productId])
      }

      quantityTimers.current[productId] = window.setTimeout(async () => {
        const baseline = quantityBaseline.current[productId]
        delete quantityBaseline.current[productId]
        delete quantityTimers.current[productId]

        try {
          const cart = await cartService.updateQuantity(resolvedItemId, targetQuantity)
          setRawLines(cart.lines)
        } catch {
          if (baseline) setRawLines(baseline)
          showToast("Couldn't update quantity. Please try again.", { type: 'error' })
        }
      }, QUANTITY_DEBOUNCE_MS)
    },
    [showToast],
  )

  const toggleSaveForLater = useCallback((productId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }, [])

  const clearCart = useCallback(async () => {
    Object.values(quantityTimers.current).forEach((id) => window.clearTimeout(id))
    quantityTimers.current = {}
    quantityBaseline.current = {}

    let previousLines: CartLine[] = []
    setRawLines((prev) => {
      previousLines = prev
      return []
    })
    setSavedIds(new Set())

    try {
      const cart = await cartService.clear()
      setRawLines(cart.lines)
    } catch (err) {
      setRawLines(previousLines)
      showToast("Couldn't clear your cart. Please try again.", { type: 'error' })
      throw err
    }
  }, [showToast])

  const { itemCount, subtotal } = useMemo(() => {
    const active = lines.filter((l) => !l.savedForLater)
    const count = active.reduce((sum, l) => sum + l.quantity, 0)
    const sub = active.reduce((sum, l) => sum + (l.lineTotal ?? (l.product?.price ?? 0) * l.quantity), 0)
    return { itemCount: count, subtotal: Math.round(sub * 100) / 100 }
  }, [lines])

  const value = useMemo(
    () => ({
      lines,
      isLoading,
      addToCart,
      removeFromCart,
      setQuantity,
      toggleSaveForLater,
      clearCart,
      refresh,
      itemCount,
      subtotal,
      quantityOf,
    }),
    [lines, isLoading, addToCart, removeFromCart, setQuantity, toggleSaveForLater, clearCart, refresh, itemCount, subtotal, quantityOf],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}

export function getDeliveryFee(subtotal: number): number {
  return subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FLAT_FEE
}
