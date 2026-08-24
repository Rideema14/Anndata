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
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
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
        <p className="text-sm text-ink-500">Listing not found.</p>
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
      setError(getApiErrorMessage(err, 'Could not complete the booking. Please try again.'))
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

  const total = machine.pricePerDay * days * quantity

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
          <h2 className="mb-3 text-sm font-semibold text-ink-800">Book this machinery</h2>
          <div className="grid grid-cols-2 gap-3">
            <TextField id="start-date" label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <TextField id="days" label="Number of Days" type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} required />
          </div>
          {machine.totalUnits > 1 && (
            <TextField
              id="quantity"
              label={`Units (up to ${machine.totalUnits})`}
              type="number"
              min={1}
              max={machine.totalUnits}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          )}
          <p className="mb-3 text-sm text-ink-500">
            Total: <span className="font-bold text-ink-900">{formatINR(total)}</span>
          </p>
          {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
          <Button type="submit" fullWidth loading={isBooking}>
            {isAuthenticated ? 'Confirm Booking' : 'Log in to Book'}
          </Button>
        </form>
      ) : (
        <p className="mt-6 rounded-2xl bg-danger-50 p-4 text-center text-sm font-medium text-danger-600">
          This listing is currently unavailable.
        </p>
      )}
    </div>
  )
}
