import { Star, Trash2 } from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import { mockProductCatalog } from '@/data/mock/mockProductCatalog'

export default function AdminReviewsPage() {
  const { removedReviewIds, removeReview } = useAdmin()
  const allReviews = mockProductCatalog.flatMap((p) => p.reviews.map((r) => ({ ...r, productName: p.name })))
  const visible = allReviews.filter((r) => !removedReviewIds.includes(r.id))

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Reviews</h1>
      <p className="mb-5 text-sm text-ink-500">Moderate product and seller reviews.</p>

      <div className="space-y-2">
        {visible.map((review) => (
          <div key={`${review.id}-${review.productName}`} className="flex items-start justify-between rounded-2xl border border-ink-100 bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-ink-900">{review.author}</p>
              <p className="text-xs text-ink-400">on {review.productName}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-gold-600">
                <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden="true" />
                {review.rating}
              </p>
              <p className="mt-1 text-sm text-ink-600">{review.comment}</p>
            </div>
            <button type="button" onClick={() => removeReview(review.id)} aria-label="Remove review" className="shrink-0 text-danger-500">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
