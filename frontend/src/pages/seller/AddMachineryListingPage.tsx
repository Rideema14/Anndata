import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Tractor } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextAreaField, TextField } from '@/components/common/FormField'
import { useMachinery } from '@/context/MachineryContext'
import { useAuth } from '@/context/AuthContext'

export default function AddMachineryListingPage() {
  const { addMachineryListing } = useMachinery()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [location, setLocation] = useState(user?.location ?? '')
  const [pricePerDay, setPricePerDay] = useState('')
  const [description, setDescription] = useState('')
  const [published, setPublished] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !pricePerDay) return
    addMachineryListing({
      name,
      ownerName: user?.name ?? 'You',
      location,
      pricePerDay: Number(pricePerDay),
      available: true,
      rating: 5,
      description,
    })
    setPublished(true)
  }

  if (published) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Tractor className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="text-xl">Machinery listed</h1>
        <p className="mt-1 text-sm text-ink-500">{name} is now available for rent on Aandata.</p>
        <Button className="mt-6" onClick={() => navigate('/machinery')}>
          View Machinery Rental
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <Link to="/seller" className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Seller Hub
      </Link>
      <h1 className="mb-1 text-xl">List Machinery for Rent</h1>
      <p className="mb-5 text-sm text-ink-500">Publish a tractor, tool, or implement for other farmers to rent.</p>

      <form onSubmit={handleSubmit}>
        <TextField id="name" label="Machinery Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mahindra 575 DI Tractor" required />
        <TextField id="location" label="Location" value={location} onChange={(e) => setLocation(e.target.value)} required />
        <TextField id="price" label="Rental Price per Day (₹)" type="number" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} required />
        <TextAreaField id="description" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition, attachments, operator availability…" />
        <Button type="submit" fullWidth>
          Publish Listing
        </Button>
      </form>
    </div>
  )
}
