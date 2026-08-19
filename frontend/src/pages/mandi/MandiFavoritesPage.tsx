import { Link } from 'react-router-dom'
import { Heart, History, Trash2 } from 'lucide-react'
import { useMandi } from '@/context/MandiContext'
import { mockMandiRecords } from '@/data/mock/mockMandiData'
import { formatINR } from '@/utils/format'

export default function MandiFavoritesPage() {
  const { favorites, toggleFavorite } = useMandi()

  if (favorites.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <Heart className="mb-3 h-12 w-12 text-ink-300" aria-hidden="true" />
        <h1 className="text-lg">No favorite mandis yet</h1>
        <p className="mt-1 text-sm text-ink-500">Bookmark a crop + mandi pair from the Mandi page.</p>
        <Link to="/mandi" className="mt-5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Browse Mandi Prices
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">My Favorite Mandis</h1>
      <div className="space-y-2">
        {favorites.map((fav) => {
          const record = mockMandiRecords.find((r) => r.crop === fav.crop && r.mandi === fav.mandi)
          return (
            <div key={fav.id} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-surface p-4">
              <div>
                <p className="text-sm font-semibold text-ink-900">{fav.crop}</p>
                <p className="text-xs text-ink-400">{fav.mandi}</p>
              </div>
              <div className="flex items-center gap-3">
                {record && <p className="text-sm font-bold text-ink-900">{formatINR(record.price)}</p>}
                <Link
                  to={`/mandi/history?crop=${encodeURIComponent(fav.crop)}&mandi=${encodeURIComponent(fav.mandi)}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-100 text-ink-500"
                  aria-label="View history"
                >
                  <History className="h-4 w-4" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => toggleFavorite(fav.crop, fav.mandi)}
                  aria-label="Remove from favorites"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-100 text-danger-500"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
