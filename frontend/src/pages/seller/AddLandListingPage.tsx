import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Upload, X } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField, TextAreaField, TextField } from '@/components/common/FormField'
import { useLand } from '@/context/LandContext'
import { useAuth } from '@/context/AuthContext'
import type { BackendLandDealType } from '@/services/landService'

import { LoadingOverlay } from '@/components/common/LoadingOverlay'

export default function AddLandListingPage() {
  const { addLandListing, isActionLoading } = useLand()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [areaAcres, setAreaAcres] = useState('')
  const [location, setLocation] = useState(user?.location ?? '')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [price, setPrice] = useState('')
  const [dealType, setDealType] = useState<BackendLandDealType>('SALE')
  const [soilType, setSoilType] = useState('Black soil')
  const [waterSource, setWaterSource] = useState('Borewell')
  const [description, setDescription] = useState('')
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setSelectedFiles((prev) => [...prev, ...files])
    const newUrls = files.map((file) => URL.createObjectURL(file))
    setPreviewUrls((prev) => [...prev, ...newUrls])
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !areaAcres || !price || !location.trim()) {
      setErrorMsg('Please fill in all required fields.')
      return
    }

    setErrorMsg(null)
    try {
      const created = await addLandListing(
        {
          title: title.trim(),
          areaAcres: Number(areaAcres),
          location: location.trim(),
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          price: Number(price),
          dealType,
          soilType,
          waterSource,
          description: description.trim() || undefined,
        },
        selectedFiles,
      )

      navigate(`/land/${created.slug || created.id}`)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish land listing')
    }
  }

  return (
    <div className="relative mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <LoadingOverlay
        isLoading={isActionLoading}
        title="Publishing Land Listing…"
        message="Uploading plot photos and publishing to Aandata marketplace."
      />
      <Link to="/seller/land" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-4 w-4" />
        Back to Seller Land Management
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink-900">List Agricultural Land</h1>
        <p className="text-xs text-ink-500">Post your plot for sale or lease on Aandata marketplace.</p>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-2xl border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="title"
          label="Listing Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Irrigated Black Soil Farmland near Katni"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <TextField
            id="area"
            label="Area (acres)"
            type="number"
            step="0.1"
            min="0.1"
            value={areaAcres}
            onChange={(e) => setAreaAcres(e.target.value)}
            placeholder="e.g. 5.5"
            required
          />
          <SelectField
            id="deal-type"
            label="Deal Type"
            value={dealType}
            onChange={(e) => setDealType(e.target.value as BackendLandDealType)}
          >
            <option value="SALE">For Sale</option>
            <option value="LEASE">For Lease</option>
          </SelectField>
        </div>

        <TextField
          id="location"
          label="Location Landmark / Village"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Bahoriband, Katni Highway"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <TextField
            id="city"
            label="City / District"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Katni"
          />
          <TextField
            id="state"
            label="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="e.g. Madhya Pradesh"
          />
        </div>

        <TextField
          id="price"
          label={dealType === 'SALE' ? 'Total Selling Price (₹)' : 'Annual Lease Rent (₹)'}
          type="number"
          min="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 1850000"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <SelectField id="soil" label="Soil Type" value={soilType} onChange={(e) => setSoilType(e.target.value)}>
            {['Black soil', 'Alluvial soil', 'Red soil', 'Loamy soil', 'Sandy soil', 'Clay soil'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectField>
          <TextField
            id="water"
            label="Water Source"
            value={waterSource}
            onChange={(e) => setWaterSource(e.target.value)}
            placeholder="e.g. Borewell + Canal"
          />
        </div>

        <TextAreaField
          id="description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detail road access, fencing, crops grown previously, electricity connection, boundary clarity..."
        />

        {/* Photo Upload Section */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-700">Plot Photos (optional)</label>
          <div className="flex flex-wrap gap-2">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative h-20 w-24 overflow-hidden rounded-xl border border-ink-200">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeSelectedFile(idx)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex h-20 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-surface-sunk text-ink-500 hover:border-brand-500 hover:text-brand-600">
              <Upload className="h-5 w-5" />
              <span className="mt-1 text-[10px] font-semibold">Add Photo</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        <Button type="submit" fullWidth disabled={isActionLoading} className="py-3 text-sm">
          {isActionLoading ? 'Publishing Listing…' : 'Publish Land Listing'}
        </Button>
      </form>
    </div>
  )
}
