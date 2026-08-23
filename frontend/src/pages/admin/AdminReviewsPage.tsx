import { useEffect, useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { adminService, type AdminReview } from '@/services/adminService'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    adminService
      .listReviews({ limit: 100 })
      .then(({ items }) => {
        if (!cancelled) setReviews(items)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleRemove(review: AdminReview) {
    setBusyId(review.id)
    try {
      await adminService.removeReview(review.product.id, review.id)
      setReviews((prev) => prev.filter((r) => r.id !== review.id))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Reviews</h1>
      <p className="mb-5 text-sm text-ink-500">Moderate product and seller reviews.</p>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((review) => (
            <div key={review.id} className="flex items-start justify-between rounded-2xl border border-ink-100 bg-surface p-4">
              <div>
                <p className="text-sm font-medium text-ink-900">{review.user.name}</p>
                <p className="text-xs text-ink-400">on {review.product.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-gold-600">
                  <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden="true" />
                  {review.rating}
                  {!review.isApproved && <span className="ml-2 rounded-full bg-gold-50 px-2 py-0.5 text-[10px] font-semibold text-gold-700">pending approval</span>}
                </p>
                {review.comment && <p className="mt-1 text-sm text-ink-600">{review.comment}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(review)}
                disabled={busyId === review.id}
                aria-label="Remove review"
                className="shrink-0 text-danger-500 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          {reviews.length === 0 && <p className="py-10 text-center text-sm text-ink-500">No reviews yet.</p>}
        </div>
      )}
    </div>
  )
}
