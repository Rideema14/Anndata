import { Link } from 'react-router-dom'
import { ShoppingCart, Sparkles, Sprout, Star } from 'lucide-react'
import { getProductsByCategory } from '@/data/mock/mockProductCatalog'
import { useSeedCart } from '@/context/SeedCartContext'
import { formatINR } from '@/utils/format'

export default function SeedStorePage() {
  const seeds = getProductsByCategory('seeds')
  const { addToCart, itemCount } = useSeedCart()

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {seeds.map((seed) => (
          <div key={seed.id} className="rounded-2xl border border-ink-100 bg-surface p-3">
            <Link to={`/seeds/${seed.id}`}>
              <div className="mb-2 flex h-24 items-center justify-center rounded-xl bg-surface-sunk">
                <Sprout className="h-8 w-8 text-brand-400" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <p className="line-clamp-2 text-xs font-medium leading-snug text-ink-900">{seed.name}</p>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-500">
                <Star className="h-3 w-3 fill-gold-400 text-gold-400" aria-hidden="true" />
                {seed.rating} · {seed.location}
              </div>
              <p className="mt-1 text-sm font-bold text-ink-900">{formatINR(seed.price)}</p>
            </Link>
            <button
              type="button"
              onClick={() => addToCart(seed.id)}
              className="mt-2 w-full rounded-full bg-brand-50 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
            >
              Add to Seed Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
