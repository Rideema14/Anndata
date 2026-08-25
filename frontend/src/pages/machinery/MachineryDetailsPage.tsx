import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, Loader2, MapPin, Star, Tractor, User } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import { machineryService, type MachineryListing } from '@/services/machineryService'
import { paymentService } from '@/services/paymentService'
import { getApiErrorMessage } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useMachinery } from '@/context/MachineryContext'
import { formatINR } from '@/utils/format'

function addDaysToDateString(dateStr: string, days: number): string {
  // Do the math in UTC only. Parsing "YYYY-MM-DDT00:00:00" (no Z) reads the
  // date in the browser's LOCAL timezone, but .toISOString() always writes
  // it back out in UTC — so in any timezone ahead of UTC (like India,
  // UTC+5:30) the result silently rolls back to the previous day. That was
  // producing an end date before the start date and tripping the "start
  // date must be before end date" booking error.
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Turns a technical backend error into plain, everyday language for the booking form. */
function friendlyBookingError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('past')) return "That start date has already passed. Please pick today or a later date."
  if (m.includes('start') && m.includes('end')) return "Please check your dates — the start date should come before the end date."
  if (m.includes('available') || m.includes('unit')) return "Not enough machines are free for those dates. Try different dates or fewer units."
  if (m.includes('validation')) return "Something in the form doesn't look right. Please check your dates and try again."
  return message
}

export default function MachineryDetailsPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, isAuthenticated } = useAuth()
  const { refresh: refreshBookings } = useMachinery()
  const navigate = useNavigate()

  const [machine, setMachine] = useState<MachineryListing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [startDate, setStartDate] = useState('')
  const [days, setDays] = useState(1)
  const [quantity, setQuantity] = useState(1)
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState<{ bookingNumber: string; total: number } | null>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setIsLoading(true)
    setNotFound(false)
    machineryService
      .getBySlug(slug)
      .then((data) => {
        if (!cancelled) setMachine(data)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-300" aria-hidden="true" />
      </div>
    )
  }

  if (notFound || !machine) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-ink-500">We couldn't find this machine.</p>
        <Link to="/machinery" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Machinery Rental
        </Link>
      </div>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!machine || !startDate) return
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setError('')
    setIsBooking(true)
    try {
      const endDate = addDaysToDateString(startDate, Math.max(1, days) - 1)
      const { booking, razorpayOrderId, amount } = await machineryService.createBooking({
        machineryId: machine.id,
        startDate,
        endDate,
        quantity,
      })

      if (razorpayOrderId && amount) {
        try {
          await paymentService.openCheckout({
            razorpayOrderId,
            amountInRupees: amount,
            name: user?.name ?? '',
            email: user?.email,
            phone: user?.phone,
            description: `Rental — ${machine.name}`,
            verifyEndpoint: '/machinery/payments/verify',
          })
        } catch (payErr) {
          setError(getApiErrorMessage(payErr, 'Booking created but payment did not complete. You can pay from My Bookings.'))
        }
      }

      await refreshBookings()
      setConfirmed({ bookingNumber: booking.bookingNumber, total: booking.totalPrice })
    } catch (err) {
      setError(friendlyBookingError(getApiErrorMessage(err, 'Could not complete the booking. Please try again.')))
    } finally {
      setIsBooking(false)
    }
  }

  if (confirmed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="text-xl">Booking confirmed!</h1>
        <p className="mt-1 text-sm text-ink-500">
          {machine.name} — {formatINR(confirmed.total)}
        </p>
        <p className="mt-0.5 text-xs text-ink-400">Booking #{confirmed.bookingNumber}</p>
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/machinery')}>
            Browse More
          </Button>
          <Button onClick={() => navigate('/machinery/bookings')}>View My Bookings</Button>
        </div>
      </div>
    )
  }

  const total = machine.pricePerDay * Math.max(1, days) * Math.max(1, quantity)

  return (
    <div className="mx-auto max-w-lg px-4 py-5 md:px-6 md:py-8">
      <Link to="/machinery" className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Machinery Rental
      </Link>

      <div className="mb-4 flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-soil-50">
        {machine.images[0] ? (
          <img src={machine.images[0]} alt={machine.name} className="h-full w-full object-cover" />
        ) : (
          <Tractor className="h-14 w-14 text-soil-400" strokeWidth={1.3} aria-hidden="true" />
        )}
      </div>

      <h1 className="text-xl">{machine.name}</h1>
      <div className="mt-1.5 flex flex-wrap gap-3 text-sm text-ink-500">
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {machine.categoryName}
        </span>
        {machine.ownerName && (
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" aria-hidden="true" />
            {machine.ownerName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-gold-400 text-gold-400" aria-hidden="true" />
          {machine.rating.toFixed(1)} ({machine.reviewCount})
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-ink-900">
        {formatINR(machine.pricePerDay)} <span className="text-sm font-normal text-ink-400">/ day</span>
      </p>
      {machine.description && <p className="mt-3 text-sm leading-relaxed text-ink-600">{machine.description}</p>}

      {machine.available ? (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-ink-100 bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink-800">Rent This Machine</h2>
          <div className="grid grid-cols-2 gap-3">
            <TextField id="start-date" label="When do you need it?" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <TextField
              id="days"
              label="How many days?"
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
              required
            />
          </div>
          {machine.totalUnits > 1 && (
            <TextField
              id="quantity"
              label={`How many machines? (up to ${machine.totalUnits})`}
              type="number"
              min={1}
              max={machine.totalUnits}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(machine.totalUnits, Number(e.target.value) || 1)))}
            />
          )}
          <p className="mb-3 text-sm text-ink-500">
            You will pay: <span className="font-bold text-ink-900">{formatINR(total)}</span>
          </p>
          {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
          <Button type="submit" fullWidth loading={isBooking}>
            {isAuthenticated ? 'Book Now' : 'Log In to Book'}
          </Button>
        </form>
      ) : (
        <p className="mt-6 rounded-2xl bg-danger-50 p-4 text-center text-sm font-medium text-danger-600">
          This machine isn't available for rent right now.
        </p>
      )}
    </div>
  )
}
