import { Link } from 'react-router-dom'
import { CalendarClock, Loader2, Tractor } from 'lucide-react'
import { useMachinery } from '@/context/MachineryContext'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-gold-50 text-gold-700',
  confirmed: 'bg-brand-50 text-brand-700',
  active: 'bg-sky-50 text-sky-700',
  completed: 'bg-ink-100 text-ink-700',
  cancelled: 'bg-danger-50 text-danger-500',
}

export default function MachineryBookingsPage() {
  const { bookings, isLoading } = useMachinery()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-300" aria-hidden="true" />
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <CalendarClock className="mb-3 h-12 w-12 text-ink-300" aria-hidden="true" />
        <h1 className="text-lg">You haven't booked anything yet</h1>
        <Link to="/machinery" className="mt-5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Find Machines to Rent
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">My Rentals</h1>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <Link
            key={booking.id}
            to={booking.machinerySlug ? `/machinery/${booking.machinerySlug}` : '/machinery'}
            className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-surface p-4 hover:shadow-card"
          >
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-brand-600">
              <Tractor className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">{booking.machineryName}</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}
                {booking.quantity > 1 ? ` · ${booking.quantity} machines` : ''}
              </p>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className={cn('rounded-full px-2 py-0.5 font-semibold capitalize', STATUS_STYLE[booking.status])}>
                  {booking.status}
                </span>
                <span className="font-semibold text-ink-800">{formatINR(booking.totalPrice)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
