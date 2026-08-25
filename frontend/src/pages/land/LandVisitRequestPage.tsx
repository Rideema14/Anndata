import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarCheck, ChevronLeft, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextAreaField, TextField } from '@/components/common/FormField'
import { useLand } from '@/context/LandContext'
import { useAuth } from '@/context/AuthContext'

export default function LandVisitRequestPage() {
  const { id: slugOrId } = useParams<{ id: string }>()
  const { getListingBySlug, selectedListing, requestVisit, isActionLoading } = useLand()
  const { user } = useAuth()
  const navigate = useNavigate()

  const todayStr = new Date().toISOString().split('T')[0]

  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00 AM')
  const [message, setMessage] = useState('')
  const [fetching, setFetching] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (slugOrId) {
      setFetching(true)
      getListingBySlug(slugOrId).finally(() => setFetching(false))
    }
  }, [slugOrId, getListingBySlug])

  if (fetching) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        <p className="mt-3 text-xs font-medium text-ink-500">Loading listing info…</p>
      </div>
    )
  }

  if (!selectedListing) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm font-semibold text-ink-700">Listing not found.</p>
        <Link to="/land" className="mt-3 inline-block text-xs font-semibold text-brand-600 hover:underline">
          Back to Land Marketplace
        </Link>
      </div>
    )
  }

  const land = selectedListing

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!date || !time) return

    if (!user) {
      navigate('/login')
      return
    }

    setErrorMsg(null)
    try {
      await requestVisit(land.id, date, time, message)
      navigate(`/land/${land.slug || land.id}`)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send visit request')
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <Link
        to={`/land/${land.slug || land.id}`}
        className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {land.title}
      </Link>

      <div className="mb-6 rounded-3xl border border-ink-100 bg-surface p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3.5 border-b border-ink-100 pb-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <CalendarCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-ink-900">Schedule Physical Site Visit</h1>
            <p className="flex items-center gap-1 text-xs text-ink-500">
              <MapPin className="h-3.5 w-3.5 text-soil-500" />
              {land.title} ({land.location})
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-2xl border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="date"
              label="Preferred Visit Date"
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <div className="flex flex-col">
              <label htmlFor="time-slot" className="mb-1 text-xs font-medium text-ink-700">
                Preferred Slot
              </label>
              <select
                id="time-slot"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-2xl border border-ink-200 bg-surface px-3 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
              >
                <option value="09:00 AM">09:00 AM (Morning)</option>
                <option value="11:00 AM">11:00 AM (Late Morning)</option>
                <option value="02:00 PM">02:00 PM (Afternoon)</option>
                <option value="04:00 PM">04:00 PM (Late Afternoon)</option>
              </select>
            </div>
          </div>

          <TextAreaField
            id="message"
            label="Note for Seller (optional)"
            placeholder="Tell the seller if you are visiting with family/partner, specific questions about borewell/boundaries..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div className="rounded-2xl bg-surface-sunk p-3 text-xs text-ink-500 flex items-start gap-2">
            <Clock className="h-4 w-4 shrink-0 text-brand-600 mt-0.5" />
            <span>
              The seller will review your requested date and time. Once confirmed, you can contact them directly or meet at the plot location.
            </span>
          </div>

          <Button type="submit" fullWidth disabled={isActionLoading} className="py-3 text-sm">
            {isActionLoading ? 'Sending Request…' : 'Submit Visit Request'}
          </Button>
        </form>
      </div>
    </div>
  )
}
