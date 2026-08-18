import { Link, useParams } from 'react-router-dom'
import { CalendarClock, ChevronLeft, MapPin, Ruler, User } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useLand } from '@/context/LandContext'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gold-50 text-gold-700',
  accepted: 'bg-brand-50 text-brand-700',
  rejected: 'bg-danger-50 text-danger-500',
  completed: 'bg-ink-100 text-ink-600',
}

export default function LandDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { allListings, getVisitForLand } = useLand()
  const land = allListings.find((l) => l.id === id)

  if (!land) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-ink-500">Listing not found.</p>
        <Link to="/land" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Land Marketplace
        </Link>
      </div>
    )
  }

  const visit = getVisitForLand(land.id)

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <Link to="/land" className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Land Marketplace
      </Link>

      <div className="mb-3 flex h-52 items-center justify-center rounded-2xl bg-soil-50">
        <MapPin className="h-14 w-14 text-soil-400" strokeWidth={1.3} aria-hidden="true" />
      </div>
      {/* Map placeholder */}
      <div className="mb-4 flex h-32 items-center justify-center rounded-2xl border border-dashed border-ink-200 text-xs text-ink-400">
        Map preview — plot location in {land.location}
      </div>

      <div className="flex items-start justify-between">
        <h1 className="text-xl">{land.title}</h1>
        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', land.dealType === 'Sale' ? 'bg-brand-50 text-brand-700' : 'bg-gold-50 text-gold-700')}>
          {land.dealType}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-500">
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {land.location}
        </span>
        <span className="flex items-center gap-1">
          <Ruler className="h-4 w-4" aria-hidden="true" />
          {land.areaAcres} acres
        </span>
        <span className="flex items-center gap-1">
          <User className="h-4 w-4" aria-hidden="true" />
          {land.sellerName}
        </span>
      </div>

      <p className="mt-3 text-2xl font-bold text-ink-900">
        {formatINR(land.price)}
        {land.dealType === 'Lease' && <span className="text-sm font-normal text-ink-400"> / year</span>}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-surface-sunk px-3 py-2">
          <p className="text-xs text-ink-400">Soil Type</p>
          <p className="font-medium text-ink-900">{land.soilType}</p>
        </div>
        <div className="rounded-xl bg-surface-sunk px-3 py-2">
          <p className="text-xs text-ink-400">Water Source</p>
          <p className="font-medium text-ink-900">{land.waterSource}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-600">{land.description}</p>

      {visit ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-ink-100 bg-surface p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-brand-600">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink-900">
              Visit requested — {visit.date} at {visit.time}
            </p>
            <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', STATUS_STYLES[visit.status])}>
              {visit.status}
            </span>
          </div>
        </div>
      ) : (
        <Link to={`/land/${land.id}/visit`}>
          <Button fullWidth className="mt-6">
            Request a Visit
          </Button>
        </Link>
      )}
    </div>
  )
}
