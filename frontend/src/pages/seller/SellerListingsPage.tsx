import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusSquare, Sprout, Trash2 } from 'lucide-react'
import type { ListingStatus } from '@/types'
import { useSeller } from '@/context/SellerContext'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

const TABS: { key: ListingStatus; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'inactive', label: 'Inactive' },
]

const STATUS_STYLES: Record<ListingStatus, string> = {
  active: 'bg-brand-50 text-brand-700',
  pending: 'bg-gold-50 text-gold-700',
  inactive: 'bg-ink-100 text-ink-500',
}

export default function SellerListingsPage() {
  const { listings, setListingStatus, removeListing } = useSeller()
  const [tab, setTab] = useState<ListingStatus>('active')
  const filtered = listings.filter((l) => l.status === tab)

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl">My Listings</h1>
        <Link to="/seller/add-product" className="flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white">
          <PlusSquare className="h-3.5 w-3.5" aria-hidden="true" />
          Add
        </Link>
      </div>

      <div className="mb-4 flex gap-1 rounded-full bg-surface-sunk p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn('flex-1 rounded-full py-2 text-xs font-semibold', tab === t.key ? 'bg-surface shadow-card text-ink-900' : 'text-ink-500')}
          >
            {t.label} ({listings.filter((l) => l.status === t.key).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-500">No {tab} listings.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((listing) => (
            <div key={listing.id} className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-surface p-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-sunk text-brand-600">
                <Sprout className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-ink-900">{listing.name}</p>
                <p className="text-xs text-ink-400">
                  {formatINR(listing.price)} / {listing.unit} · Stock: {listing.stock}
                </p>
              </div>
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', STATUS_STYLES[listing.status])}>
                {listing.status}
              </span>
              {listing.status === 'active' ? (
                <button
                  type="button"
                  onClick={() => setListingStatus(listing.id, 'inactive')}
                  className="shrink-0 text-xs font-semibold text-ink-500 hover:underline"
                >
                  Deactivate
                </button>
              ) : listing.status === 'inactive' ? (
                <button
                  type="button"
                  onClick={() => setListingStatus(listing.id, 'active')}
                  className="shrink-0 text-xs font-semibold text-brand-600 hover:underline"
                >
                  Activate
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => removeListing(listing.id)}
                aria-label="Delete listing"
                className="shrink-0 text-danger-500"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
