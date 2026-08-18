import { Link } from 'react-router-dom'
import { MapPin, Star, Tractor } from 'lucide-react'
import { useMachinery } from '@/context/MachineryContext'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

export default function MachineryMarketplacePage() {
  const { allListings } = useMachinery()
  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Machinery Rental</h1>
      <p className="mb-5 text-sm text-ink-500">Tractors, harvesters and tools for rent nearby.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {allListings.map((m) => (
          <Link key={m.id} to={`/machinery/${m.id}`} className="rounded-2xl border border-ink-100 bg-surface p-4 hover:shadow-card">
            <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-soil-50">
              <Tractor className="h-10 w-10 text-soil-400" strokeWidth={1.4} aria-hidden="true" />
            </div>
            <div className="flex items-start justify-between">
              <h2 className="text-sm font-semibold text-ink-900">{m.name}</h2>
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', m.available ? 'bg-brand-50 text-brand-700' : 'bg-danger-50 text-danger-500')}>
                {m.available ? 'Available' : 'Booked'}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {m.location} · {m.ownerName}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
              <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden="true" />
              {m.rating}
            </p>
            <p className="mt-2 text-base font-bold text-ink-900">
              {formatINR(m.pricePerDay)} <span className="text-xs font-normal text-ink-400">/ day</span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
