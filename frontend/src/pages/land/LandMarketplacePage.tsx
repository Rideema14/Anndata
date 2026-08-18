import { Link } from 'react-router-dom'
import { MapPin, Ruler } from 'lucide-react'
import { useLand } from '@/context/LandContext'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

export default function LandMarketplacePage() {
  const { allListings } = useLand()
  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Agricultural Land</h1>
      <p className="mb-5 text-sm text-ink-500">Land for sale or lease near you.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {allListings.map((land) => (
          <Link key={land.id} to={`/land/${land.id}`} className="rounded-2xl border border-ink-100 bg-surface p-4 hover:shadow-card">
            <div className="mb-3 flex h-36 items-center justify-center rounded-xl bg-soil-50">
              <MapPin className="h-10 w-10 text-soil-400" strokeWidth={1.4} aria-hidden="true" />
            </div>
            <div className="flex items-start justify-between">
              <h2 className="text-sm font-semibold text-ink-900">{land.title}</h2>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  land.dealType === 'Sale' ? 'bg-brand-50 text-brand-700' : 'bg-gold-50 text-gold-700',
                )}
              >
                {land.dealType}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {land.location}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
              <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
              {land.areaAcres} acres
            </p>
            <p className="mt-2 text-base font-bold text-ink-900">
              {formatINR(land.price)}
              {land.dealType === 'Lease' && <span className="text-xs font-normal text-ink-400"> / year</span>}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
