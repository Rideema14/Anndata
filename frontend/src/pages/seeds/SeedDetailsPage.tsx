import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, Sprout, Star } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { seedService, type Seed } from '@/services/seedService'
import { useSeedCart } from '@/context/SeedCartContext'
import { getApiErrorMessage } from '@/services/api'
import { formatINR } from '@/utils/format'

export default function SeedDetailsPage() {
  const { id: slug } = useParams<{ id: string }>()
  const [seed, setSeed] = useState<Seed | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { addToCart } = useSeedCart()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setIsLoading(true)
    setError('')
    seedService
      .getBySlug(slug)
      .then((s) => {
        if (!cancelled) setSeed(s)
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Seed not found.'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
        <div className="h-56 animate-pulse rounded-2xl bg-surface-sunk" />
      </div>
    )
  }

  if (!seed || error) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-ink-500">{error || 'Seed not found.'}</p>
        <Link to="/seeds" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Seed Store
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <Link to="/seeds" className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Seed Store
      </Link>

      <div className="mb-4 flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-surface-sunk">
        {seed.images[0] ? (
          <img src={seed.images[0]} alt={seed.name} className="h-full w-full object-cover" />
        ) : (
          <Sprout className="h-16 w-16 text-brand-400" strokeWidth={1.3} aria-hidden="true" />
        )}
      </div>

      <h1 className="text-xl">{seed.name}</h1>
      <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
        <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden="true" />
        {seed.rating.toFixed(1)} ({seed.reviewCount} reviews) · {seed.categoryName}
        {seed.sellerName && <> · Sold by {seed.sellerName}</>}
      </p>
      <p className="mt-3 text-2xl font-bold text-ink-900">
        {formatINR(seed.price)} <span className="text-xs font-normal text-ink-400">/ {seed.unit}</span>
      </p>
      {seed.stock <= 0 && <p className="mt-1 text-xs font-semibold text-danger-500">Out of stock</p>}

      {seed.specifications.length > 0 && (
        <div className="mt-5 divide-y divide-ink-100 rounded-2xl border border-ink-100">
          {seed.specifications.map((spec) => (
            <div key={spec.label} className="flex justify-between px-4 py-2.5 text-sm">
              <span className="text-ink-500">{spec.label}</span>
              <span className="font-medium text-ink-900">{spec.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
        {seed.brand && (
          <div className="rounded-xl bg-surface-sunk px-3 py-2">
            <p className="text-[11px] text-ink-400">Brand</p>
            <p className="font-medium text-ink-900">{seed.brand}</p>
          </div>
        )}
        {seed.variety && (
          <div className="rounded-xl bg-surface-sunk px-3 py-2">
            <p className="text-[11px] text-ink-400">Variety</p>
            <p className="font-medium text-ink-900">{seed.variety}</p>
          </div>
        )}
        {seed.sowingSeason && (
          <div className="rounded-xl bg-surface-sunk px-3 py-2">
            <p className="text-[11px] text-ink-400">Sowing Season</p>
            <p className="font-medium text-ink-900">{seed.sowingSeason}</p>
          </div>
        )}
        {typeof seed.germinationRatePercent === 'number' && (
          <div className="rounded-xl bg-surface-sunk px-3 py-2">
            <p className="text-[11px] text-ink-400">Germination Rate</p>
            <p className="font-medium text-ink-900">{seed.germinationRatePercent}%</p>
          </div>
        )}
      </div>

      {seed.description && <p className="mt-5 text-sm leading-relaxed text-ink-600">{seed.description}</p>}

      <Button
        fullWidth
        className="mt-6"
        disabled={seed.stock <= 0}
        onClick={() => {
          addToCart(seed.id)
          setAdded(true)
          window.setTimeout(() => setAdded(false), 2000)
        }}
      >
        {added ? (
          <>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Added to Seed Cart
          </>
        ) : seed.stock <= 0 ? (
          'Out of stock'
        ) : (
          'Add to Seed Cart'
        )}
      </Button>
    </div>
  )
}
