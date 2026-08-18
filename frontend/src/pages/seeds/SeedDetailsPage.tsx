import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, Sprout, Star } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { getProductById } from '@/data/mock/mockProductCatalog'
import { useSeedCart } from '@/context/SeedCartContext'
import { formatINR } from '@/utils/format'

export default function SeedDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const seed = getProductById(id ?? '')
  const { addToCart } = useSeedCart()
  const [added, setAdded] = useState(false)

  if (!seed) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-ink-500">Seed not found.</p>
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

      <div className="mb-4 flex h-56 items-center justify-center rounded-2xl bg-surface-sunk">
        <Sprout className="h-16 w-16 text-brand-400" strokeWidth={1.3} aria-hidden="true" />
      </div>

      <h1 className="text-xl">{seed.name}</h1>
      <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
        <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden="true" />
        {seed.rating} ({seed.reviewCount} reviews) · {seed.location}
      </p>
      <p className="mt-3 text-2xl font-bold text-ink-900">
        {formatINR(seed.price)} <span className="text-xs font-normal text-ink-400">/ {seed.unit}</span>
      </p>

      <div className="mt-5 divide-y divide-ink-100 rounded-2xl border border-ink-100">
        {seed.specifications.map((spec) => (
          <div key={spec.label} className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-ink-500">{spec.label}</span>
            <span className="font-medium text-ink-900">{spec.value}</span>
          </div>
        ))}
      </div>

      <p className="mt-5 text-sm leading-relaxed text-ink-600">{seed.description}</p>

      <Button
        fullWidth
        className="mt-6"
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
        ) : (
          'Add to Seed Cart'
        )}
      </Button>
    </div>
  )
}
