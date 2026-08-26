import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Sparkles, Sprout, Star } from 'lucide-react'
import { seedService, type Seed } from '@/services/seedService'
import { useSeedCart } from '@/context/SeedCartContext'
import { getApiErrorMessage } from '@/services/api'
import { formatINR } from '@/utils/format'

export default function SeedStorePage() {
  const [seeds, setSeeds] = useState<Seed[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { addToCart, itemCount } = useSeedCart()

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    seedService
      .list({ sortBy: 'newest', limit: 24 })
      .then(({ items }) => {
        if (!cancelled) setSeeds(items)
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load the seed store.'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Sprout className="h-5.5 w-5.5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl">Seed Store</h1>
            <p className="text-xs text-ink-500">Certified seeds, sourced from verified sellers</p>
          </div>
        </div>
        <Link
          to="/seeds/cart"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink-100 bg-surface text-ink-700"
        >
          <ShoppingCart className="h-4.5 w-4.5" aria-hidden="true" />
          {itemCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
              {itemCount}
            </span>
          )}
        </Link>
      </div>

      <Link
        to="/ai/crop-advisor"
        className="mb-5 flex items-center justify-between rounded-2xl bg-gold-400 p-4 text-gold-900"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
          Not sure which seed to buy? Ask the AI Seed Advisor
        </span>
        <span className="text-xs font-semibold">Open →</span>
      </Link>

      {error && <p className="mb-4 text-sm font-medium text-danger-500">{error}</p>}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-ink-100 bg-surface-sunk" />
          ))}
        </div>
      ) : seeds.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-500">No seeds listed yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {seeds.map((seed) => (
            <div key={seed.id} className="rounded-2xl border border-ink-100 bg-surface p-3">
              <Link to={`/seeds/${seed.slug}`}>
                <div className="mb-2 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-surface-sunk">
                  {seed.images[0] ? (
                    <img src={seed.images[0]} alt={seed.name} className="h-full w-full object-cover" />
                  ) : (
                    <Sprout className="h-8 w-8 text-brand-400" strokeWidth={1.5} aria-hidden="true" />
                  )}
                </div>
                <p className="line-clamp-2 text-xs font-medium leading-snug text-ink-900">{seed.name}</p>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-500">
                  <Star className="h-3 w-3 fill-gold-400 text-gold-400" aria-hidden="true" />
                  {seed.rating.toFixed(1)} · {seed.categoryName}
                </div>
                <p className="mt-1 text-sm font-bold text-ink-900">{formatINR(seed.price)}</p>
              </Link>
              <button
                type="button"
                onClick={() => addToCart(seed.id)}
                disabled={seed.stock <= 0}
                className="mt-2 w-full rounded-full bg-brand-50 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {seed.stock <= 0 ? 'Out of stock' : 'Add to Seed Cart'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
