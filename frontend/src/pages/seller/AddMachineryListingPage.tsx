import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ImagePlus, Tractor } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField, TextAreaField, TextField } from '@/components/common/FormField'
import { machineryService, type MachineryCategory } from '@/services/machineryService'
import { getApiErrorMessage } from '@/services/api'

export default function AddMachineryListingPage() {
  const navigate = useNavigate()

  const [categories, setCategories] = useState<MachineryCategory[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [totalUnits, setTotalUnits] = useState('1')
  const [pricePerDay, setPricePerDay] = useState('')
  const [bufferDays, setBufferDays] = useState('1')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState('')
  const [published, setPublished] = useState(false)

  useEffect(() => {
    let cancelled = false
    machineryService
      .listCategories()
      .then((cats) => {
        if (cancelled) return
        setCategories(cats)
        if (cats.length > 0) setCategoryId((prev) => prev || cats[0].id)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load machinery categories.')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCategories(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleImagePick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !pricePerDay || !categoryId) return
    setError('')
    setIsPublishing(true)
    try {
      const listing = await machineryService.create({
        categoryId,
        name,
        brand: brand || undefined,
        model: model || undefined,
        totalUnits: Number(totalUnits) || 1,
        pricePerDay: Number(pricePerDay),
        bufferDays: Number(bufferDays) || 0,
        description: description || undefined,
      })
      if (imageFile) {
        await machineryService.uploadImages(listing.id, [imageFile])
      }
      setPublished(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not publish this listing. Please try again.'))
    } finally {
      setIsPublishing(false)
    }
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
      <h1 className="mb-1 text-xl">Add a Machine for Rent</h1>
      <p className="mb-5 text-sm text-ink-500">Add your tractor or tool here so other farmers nearby can rent it from you.</p>

      <form onSubmit={handleSubmit}>
        {isLoadingCategories ? (
          <p className="mb-4 text-sm text-ink-400">Loading categories…</p>
        ) : (
          <SelectField id="category" label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        )}

        <TextField id="name" label="Machinery Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mahindra 575 DI Tractor" required />

        <div className="grid grid-cols-2 gap-3">
          <TextField id="brand" label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Mahindra" />
          <TextField id="model" label="Model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. 575 DI" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField id="price" label="Price per Day (₹)" type="number" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} required />
          <TextField id="units" label="How many do you have?" type="number" min={1} value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} required />
        </div>

        <TextField
          id="buffer"
          label="Rest days after each rental"
          type="number"
          min={0}
          value={bufferDays}
          onChange={(e) => setBufferDays(e.target.value)}
          hint="Days to clean or service the machine before it goes out again. Enter 0 if it can go straight to the next renter."
        />

        <TextAreaField id="description" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition, attachments, operator availability…" />

        <label className="mb-4 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 py-8 text-ink-500 hover:border-brand-300">
          {imagePreviewUrl ? (
            <img src={imagePreviewUrl} alt="Machinery preview" className="h-20 w-20 rounded-xl object-cover" />
          ) : (
            <ImagePlus className="h-8 w-8" aria-hidden="true" />
          )}
          <span className="text-sm">{imagePreviewUrl ? 'Photo added — tap to change' : 'Tap to add a photo (optional)'}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
        </label>

        {error && <p className="mb-3 text-sm font-medium text-danger-500">{error}</p>}

        <Button type="submit" fullWidth loading={isPublishing} disabled={!categoryId}>
          Add My Machine
        </Button>
      </form>
    </div>
  )
}
