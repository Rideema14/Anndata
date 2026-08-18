import { Link, useNavigate } from 'react-router-dom'
import { Bookmark, BookmarkCheck, Minus, Plus, ShoppingCart, Sprout, Trash2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useCart, getDeliveryFee } from '@/context/CartContext'
import { getProductById } from '@/data/mock/mockProductCatalog'
import { useLanguage } from '@/context/LanguageContext'
import { formatINR } from '@/utils/format'

export default function CartPage() {
  const { lines, removeFromCart, setQuantity, toggleSaveForLater, subtotal, itemCount } = useCart()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const activeLines = lines.filter((l) => !l.savedForLater)
  const savedLines = lines.filter((l) => l.savedForLater)
  const deliveryFee = getDeliveryFee(subtotal)
  const total = subtotal + deliveryFee

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <ShoppingCart className="mb-3 h-12 w-12 text-ink-300" aria-hidden="true" />
        <h1 className="text-lg">Your cart is empty</h1>
        <p className="mt-1 text-sm text-ink-500">Browse the marketplace to add seeds, fertilizers and more.</p>
        <Link to="/market" className="mt-5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          {t('nav.market')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">{t('nav.cart')} ({itemCount})</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-3 md:col-span-2">
          {activeLines.map((line) => {
            const product = getProductById(line.productId)
            if (!product) return null
            return (
              <div key={line.productId} className="flex gap-3 rounded-2xl border border-ink-100 bg-surface p-3">
                <Link to={`/product/${product.id}`} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-sunk">
                  <Sprout className="h-6 w-6 text-brand-400" aria-hidden="true" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${product.id}`} className="line-clamp-2 text-sm font-medium text-ink-900">
                    {product.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-400">{product.sellerName}</p>
                  <p className="mt-1 text-sm font-bold text-ink-900">{formatINR(product.price)}</p>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-ink-200">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="flex h-8 w-8 items-center justify-center text-ink-600"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                        aria-label="Increase quantity"
                        className="flex h-8 w-8 items-center justify-center text-ink-600"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSaveForLater(line.productId)}
                      className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-brand-600"
                    >
                      <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                      Save for later
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(line.productId)}
                      className="flex items-center gap-1 text-xs font-medium text-danger-500 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {savedLines.length > 0 && (
            <div className="pt-4">
              <h2 className="mb-2 text-sm font-semibold text-ink-700">Saved for later ({savedLines.length})</h2>
              <div className="space-y-3">
                {savedLines.map((line) => {
                  const product = getProductById(line.productId)
                  if (!product) return null
                  return (
                    <div key={line.productId} className="flex items-center gap-3 rounded-2xl border border-dashed border-ink-200 p-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-sunk">
                        <Sprout className="h-5 w-5 text-ink-300" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm text-ink-700">{product.name}</p>
                        <p className="text-xs text-ink-400">{formatINR(product.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSaveForLater(line.productId)}
                        className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                      >
                        <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        Move to cart
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="h-fit rounded-2xl border border-ink-100 bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink-800">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>Delivery</span>
              <span>{deliveryFee === 0 ? 'Free' : formatINR(deliveryFee)}</span>
            </div>
            {deliveryFee > 0 && <p className="text-[11px] text-ink-400">Free delivery on orders above ₹1,000</p>}
            <div className="border-t border-ink-100 pt-2 flex justify-between font-bold text-ink-900">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
          <Button fullWidth className="mt-4" onClick={() => navigate('/checkout')} disabled={activeLines.length === 0}>
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}
