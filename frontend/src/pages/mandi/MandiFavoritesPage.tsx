import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, MapPin } from 'lucide-react'
import { useMandi } from '@/context/MandiContext'

export default function MandiFavoritesPage() {
  const { favorites, toggleFavorite, refreshFavorites, isLoading } = useMandi()

  // The context keeps favorites in sync instantly by mandiId for the star
  // toggle everywhere else, but the full mandi details (name, location, etc.)
  // that this page displays only need to be accurate the moment it's opened.
  useEffect(() => {
    refreshFavorites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center">
        <p className="text-ink-500">Loading favorites...</p>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <Heart className="mb-3 h-12 w-12 text-ink-300" aria-hidden="true" />
        <h1 className="text-lg">No favorite mandis yet</h1>
        <p className="mt-1 text-sm text-ink-500">Bookmark a mandi from the Mandi page.</p>
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
          return (
            <div key={fav.id} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-surface p-4">
              <div>
                <p className="text-sm font-semibold text-ink-900">{fav.mandi?.name || 'Unknown Mandi'}</p>
                <div className="flex items-center gap-1 text-xs text-ink-400 mt-1">
                  <MapPin className="h-3 w-3" />
                  {fav.mandi?.district}, {fav.mandi?.state}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/mandi"
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  View Prices
                </Link>
                <button
                  type="button"
                  onClick={() => toggleFavorite(fav.mandiId)}
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
