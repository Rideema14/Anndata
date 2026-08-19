import { Link } from 'react-router-dom'
import { CalendarClock, Tractor } from 'lucide-react'
import { useMachinery } from '@/context/MachineryContext'
import { formatINR } from '@/utils/format'

export default function MachineryBookingsPage() {
  const { bookings, allListings } = useMachinery()

  if (bookings.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <CalendarClock className="mb-3 h-12 w-12 text-ink-300" aria-hidden="true" />
        <h1 className="text-lg">No bookings yet</h1>
        <Link to="/machinery" className="mt-5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Browse Machinery
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">My Bookings</h1>
      <div className="space-y-3">
        {bookings.map((booking) => {
          const machine = allListings.find((m) => m.id === booking.machineryId)
          return (
            <div key={booking.id} className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-surface p-4">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-brand-600">
                <Tractor className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{machine?.name ?? 'Machinery'}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  From {booking.startDate} · {booking.days} day{booking.days > 1 ? 's' : ''}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold capitalize text-brand-700">{booking.status}</span>
                  <span className="font-semibold text-ink-800">{formatINR(booking.totalPrice)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
