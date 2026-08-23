import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ImagePlus, Sprout } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { StepperHeader } from '@/components/common/StepperHeader'
import { SelectField, TextField } from '@/components/common/FormField'
import { categoryService, type Category } from '@/services/categoryService'
import { productService } from '@/services/productService'
import { formatINR } from '@/utils/format'

const STEPS = ['Category', 'Details', 'Images', 'Price & Stock', 'Location', 'Preview', 'Publish']

export default function AddProductPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  const [step, setStep] = useState(0)
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('per unit')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [location, setLocation] = useState('Katni, Madhya Pradesh')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [published, setPublished] = useState(false)

  useEffect(() => {
    let cancelled = false
    categoryService
      .list()
      .then((cats) => {
        if (cancelled) return
        setCategories(cats)
        if (cats.length > 0) setCategoryId((prev) => prev || cats[0].id)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCategories(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  function handleImagePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
  }

  async function handlePublish(event: FormEvent) {
    event.preventDefault()
    setPublishError(null)
    setIsPublishing(true)
    try {
      const product = await productService.create({
        categoryId,
        name,
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        unit,
        // The backend has no free-text "pickup location" field on a product —
        // location comes from the seller's own profile/geo-coordinates, not
        // per-listing. Folding it into the description keeps the info visible
        // to buyers without inventing a field the schema doesn't have.
        description: location ? `Pickup location: ${location}` : undefined,
      })
      if (imageFile) {
        await productService.uploadImages(product.id, [imageFile])
      }
      setPublished(true)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Could not publish this listing. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  if (published) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="text-xl">Listing published</h1>
        <p className="mt-1 text-sm text-ink-500">{name} is now live and will appear in My Listings.</p>
        <Button className="mt-6" onClick={() => navigate('/seller/listings')}>
          View My Listings
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Add Product</h1>
      <p className="mb-5 text-sm text-ink-500">List a product for sale on Aandata.</p>

      <StepperHeader steps={STEPS} currentIndex={step} />

      {step === 0 && (
        <div>
          {isLoadingCategories ? (
            <p className="mb-4 text-sm text-ink-400">Loading categories…</p>
          ) : (
            <SelectField id="category" label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
          )}
          <Button fullWidth onClick={next} disabled={!categoryId}>
            Continue
          </Button>
        </div>
      )}

      {step === 1 && (
        <div>
          <TextField id="name" label="Product Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Soybean Seeds — JS-9560" required />
          <Button fullWidth onClick={next} disabled={!name.trim()}>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <label className="mb-4 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 py-10 text-ink-500 hover:border-brand-300">
            {imagePreviewUrl ? (
              <img src={imagePreviewUrl} alt="Product preview" className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <ImagePlus className="h-8 w-8" aria-hidden="true" />
            )}
            <span className="text-sm">{imagePreviewUrl ? 'Photo added — tap to change' : 'Tap to add a product photo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          </label>
          <Button fullWidth onClick={next}>
            Continue
          </Button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="grid grid-cols-2 gap-3">
            <TextField id="price" label="Price (₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <TextField id="unit" label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. 30 kg bag" required />
          </div>
          <TextField id="stock" label="Stock Quantity" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
          <Button fullWidth onClick={next} disabled={!price || !stock}>
            Continue
          </Button>
        </div>
      )}

      {step === 4 && (
        <div>
          <TextField id="location" label="Pickup / Seller Location" value={location} onChange={(e) => setLocation(e.target.value)} required />
          <Button fullWidth onClick={next}>
            Continue
          </Button>
        </div>
      )}

      {step === 5 && (
        <div>
          <div className="mb-5 rounded-2xl border border-ink-100 bg-surface p-4">
            <div className="mb-3 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-surface-sunk">
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Sprout className="h-8 w-8 text-brand-400" aria-hidden="true" />
              )}
            </div>
            <p className="text-sm font-semibold text-ink-900">{name || 'Untitled product'}</p>
            <p className="text-xs text-ink-400">{categories.find((c) => c.id === categoryId)?.name} · {location}</p>
            <p className="mt-1 text-sm font-bold text-ink-900">
              {formatINR(Number(price) || 0)} <span className="text-xs font-normal text-ink-400">/ {unit}</span>
            </p>
            <p className="text-xs text-ink-400">Stock: {stock || 0}</p>
          </div>
          <Button fullWidth onClick={next}>
            Looks Good
          </Button>
        </div>
      )}

      {step === 6 && (
        <form onSubmit={handlePublish}>
          <p className="mb-3 text-sm text-ink-600">Your listing goes live on the marketplace as soon as you publish it.</p>
          {publishError && <p className="mb-3 text-sm text-danger-500">{publishError}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={back} disabled={isPublishing}>
              Back
            </Button>
            <Button type="submit" fullWidth loading={isPublishing}>
              Publish Listing
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
