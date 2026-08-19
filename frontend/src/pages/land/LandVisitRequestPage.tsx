import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarCheck, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextAreaField, TextField } from '@/components/common/FormField'
import { useLand } from '@/context/LandContext'

export default function LandVisitRequestPage() {
  const { id } = useParams<{ id: string }>()
  const { allListings, requestVisit } = useLand()
  const land = allListings.find((l) => l.id === id)
  const navigate = useNavigate()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [message, setMessage] = useState('')

  if (!land) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-ink-500">Listing not found.</p>
      </div>
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!date || !time) return
    requestVisit(land!.id, date, time, message)
    navigate(`/land/${land!.id}`)
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <Link to={`/land/${land.id}`} className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back
      </Link>

      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <CalendarCheck className="h-5.5 w-5.5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-lg">Request a Visit</h1>
          <p className="text-xs text-ink-400">{land.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <TextField id="date" label="Preferred Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <TextField id="time" label="Preferred Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
        <TextAreaField
          id="message"
          label="Message (optional)"
          placeholder="Let the seller know anything relevant — group size, questions, etc."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button type="submit" fullWidth>
          Send Visit Request
        </Button>
      </form>
    </div>
  )
}
