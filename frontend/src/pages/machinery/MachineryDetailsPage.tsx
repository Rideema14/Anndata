import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, MapPin, Star, Tractor, User } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import { useMachinery } from '@/context/MachineryContext'
import { formatINR } from '@/utils/format'

export default function MachineryDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { allListings, bookMachinery } = useMachinery()
  const machine = allListings.find((m) => m.id === id)
  const navigate = useNavigate()
  const [startDate, setStartDate] = useState('')
  const [days, setDays] = useState(1)
  const [confirmed, setConfirmed] = useState<{ id: string; total: number } | null>(null)

  if (!machine) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-ink-500">Listing not found.</p>
        <Link to="/machinery" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Machinery Rental
        </Link>
      </div>
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!startDate) return
    const booking = bookMachinery(machine!.id, startDate, days)
    setConfirmed({ id: booking.id, total: booking.totalPrice })
  }

  if (confirmed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="text-xl">Booking confirmed!</h1>
        <p className="mt-1 text-sm text-ink-500">{machine.name} — {formatINR(confirmed.total)}</p>
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/machinery')}>
            Browse More
          </Button>
          <Button onClick={() => navigate('/machinery/bookings')}>View My Bookings</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-5 md:px-6 md:py-8">
      <Link to="/machinery" className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Machinery Rental
      </Link>

      <div className="mb-4 flex h-48 items-center justify-center rounded-2xl bg-soil-50">
        <Tractor className="h-14 w-14 text-soil-400" strokeWidth={1.3} aria-hidden="true" />
      </div>

      <h1 className="text-xl">{machine.name}</h1>
      <div className="mt-1.5 flex flex-wrap gap-3 text-sm text-ink-500">
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {machine.location}
        </span>
        <span className="flex items-center gap-1">
          <User className="h-4 w-4" aria-hidden="true" />
          {machine.ownerName}
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-gold-400 text-gold-400" aria-hidden="true" />
          {machine.rating}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-ink-900">
        {formatINR(machine.pricePerDay)} <span className="text-sm font-normal text-ink-400">/ day</span>
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-600">{machine.description}</p>

      {machine.available ? (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-ink-100 bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink-800">Book this machinery</h2>
          <div className="grid grid-cols-2 gap-3">
            <TextField id="start-date" label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <TextField id="days" label="Number of Days" type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} required />
          </div>
          <p className="mb-3 text-sm text-ink-500">
            Total: <span className="font-bold text-ink-900">{formatINR(machine.pricePerDay * days)}</span>
          </p>
          <Button type="submit" fullWidth>
            Confirm Booking
          </Button>
        </form>
      ) : (
        <p className="mt-6 rounded-2xl bg-danger-50 p-4 text-center text-sm font-medium text-danger-600">
          Currently booked — check back later.
        </p>
      )}
    </div>
  )
}
