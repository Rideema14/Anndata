import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Minus, Plus, ShoppingCart, Sprout, Trash2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useSeedCart } from '@/context/SeedCartContext'
import { useAuth } from '@/context/AuthContext'
import { getProductById } from '@/data/mock/mockProductCatalog'
import { formatINR } from '@/utils/format'

export default function SeedCartPage() {
  const { lines, removeFromCart, setQuantity, subtotal, placeSeedOrder } = useSeedCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [placedId, setPlacedId] = useState<string | null>(null)

  if (placedId) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="text-xl">Seed order placed!</h1>
        <p className="mt-1 text-sm text-ink-500">Order #{placedId}</p>
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/seeds')}>
            Continue Shopping
          </Button>
          <Button onClick={() => navigate('/seeds/orders')}>View Seed Orders</Button>
        </div>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <ShoppingCart className="mb-3 h-12 w-12 text-ink-300" aria-hidden="true" />
        <h1 className="text-lg">Seed cart is empty</h1>
        <Link to="/seeds" className="mt-5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Browse Seed Store
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Seed Cart</h1>
      <div className="space-y-3">
        {lines.map((line) => {
          const product = getProductById(line.productId)
          if (!product) return null
          return (
            <div key={line.productId} className="flex gap-3 rounded-2xl border border-ink-100 bg-surface p-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-sunk">
                <Sprout className="h-5 w-5 text-brand-400" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-ink-900">{product.name}</p>
                <p className="mt-0.5 text-sm font-bold text-ink-900">{formatINR(product.price)}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-ink-200">
                    <button type="button" onClick={() => setQuantity(line.productId, line.quantity - 1)} className="flex h-7 w-7 items-center justify-center">
                      <Minus className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold">{line.quantity}</span>
                    <button type="button" onClick={() => setQuantity(line.productId, line.quantity + 1)} className="flex h-7 w-7 items-center justify-center">
                      <Plus className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                  <button type="button" onClick={() => removeFromCart(line.productId)} className="flex items-center gap-1 text-xs font-medium text-danger-500">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-ink-100 bg-surface p-4">
        <div className="flex justify-between text-sm font-bold text-ink-900">
          <span>Total</span>
          <span>{formatINR(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-ink-400">
          Deliver to: {user?.addresses[0] ? `${user.addresses[0].city}, ${user.addresses[0].state}` : 'your default address'}
        </p>
        <Button
          fullWidth
          className="mt-3"
          onClick={() => {
            const order = placeSeedOrder(
              user?.addresses[0] ? `${user.addresses[0].line1}, ${user.addresses[0].city}, ${user.addresses[0].state} – ${user.addresses[0].pincode}` : 'Address',
              'UPI',
            )
            setPlacedId(order.id)
          }}
        >
          Place Seed Order — {formatINR(subtotal)}
        </Button>
      </div>
    </div>
  )
}
