import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField, TextAreaField, TextField } from '@/components/common/FormField'
import { useLand } from '@/context/LandContext'
import { useAuth } from '@/context/AuthContext'

export default function AddLandListingPage() {
  const { addLandListing } = useLand()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [areaAcres, setAreaAcres] = useState('')
  const [location, setLocation] = useState(user?.location ?? '')
  const [price, setPrice] = useState('')
  const [dealType, setDealType] = useState<'Sale' | 'Lease'>('Sale')
  const [soilType, setSoilType] = useState('Black soil')
  const [waterSource, setWaterSource] = useState('Borewell')
  const [description, setDescription] = useState('')
  const [published, setPublished] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !areaAcres || !price) return
    addLandListing({
      title,
      areaAcres: Number(areaAcres),
      location,
      price: Number(price),
      dealType,
      sellerName: user?.name ?? 'You',
      description,
      soilType,
      waterSource,
    })
    setPublished(true)
  }

  if (published) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <MapPin className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="text-xl">Land listing published</h1>
        <p className="mt-1 text-sm text-ink-500">{title} is now visible on the Land Marketplace.</p>
        <Button className="mt-6" onClick={() => navigate('/land')}>
          View Land Marketplace
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
      <h1 className="mb-1 text-xl">List Agricultural Land</h1>
      <p className="mb-5 text-sm text-ink-500">Publish a plot for sale or lease on Aandata.</p>

      <form onSubmit={handleSubmit}>
        <TextField id="title" label="Listing Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Irrigated Farmland near Katni" required />
        <div className="grid grid-cols-2 gap-3">
          <TextField id="area" label="Area (acres)" type="number" value={areaAcres} onChange={(e) => setAreaAcres(e.target.value)} required />
          <SelectField id="deal-type" label="Deal Type" value={dealType} onChange={(e) => setDealType(e.target.value as 'Sale' | 'Lease')}>
            <option value="Sale">Sale</option>
            <option value="Lease">Lease</option>
          </SelectField>
        </div>
        <TextField id="location" label="Location" value={location} onChange={(e) => setLocation(e.target.value)} required />
        <TextField id="price" label={dealType === 'Sale' ? 'Price (₹)' : 'Price per year (₹)'} type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <SelectField id="soil" label="Soil Type" value={soilType} onChange={(e) => setSoilType(e.target.value)}>
            {['Black soil', 'Alluvial soil', 'Red soil', 'Loamy soil'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </SelectField>
          <TextField id="water" label="Water Source" value={waterSource} onChange={(e) => setWaterSource(e.target.value)} />
        </div>
        <TextAreaField id="description" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell buyers about access, soil, irrigation…" />
        <Button type="submit" fullWidth>
          Publish Land Listing
        </Button>
      </form>
    </div>
  )
}
