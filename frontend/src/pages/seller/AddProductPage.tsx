import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ImagePlus, Sprout } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { StepperHeader } from '@/components/common/StepperHeader'
import { SelectField, TextField } from '@/components/common/FormField'
import { mockCategories } from '@/data/mock/mockCategories'
import { useSeller } from '@/context/SellerContext'
import { formatINR } from '@/utils/format'

const STEPS = ['Category', 'Details', 'Images', 'Price & Stock', 'Location', 'Preview', 'Publish']

export default function AddProductPage() {
  const { addListing } = useSeller()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [category, setCategory] = useState(mockCategories[0].slug)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('per unit')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [location, setLocation] = useState('Katni, Madhya Pradesh')
  const [published, setPublished] = useState(false)
  const [imageAdded, setImageAdded] = useState(false)

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  function handlePublish(event: FormEvent) {
    event.preventDefault()
    addListing({ name, categorySlug: category, price: Number(price) || 0, unit, stock: Number(stock) || 0 })
    setPublished(true)
  }

  if (published) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="text-xl">Listing published</h1>
        <p className="mt-1 text-sm text-ink-500">{name} is now pending review and will appear in My Listings.</p>
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
          <SelectField id="category" label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {mockCategories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <Button fullWidth onClick={next}>
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
          <button
            type="button"
            onClick={() => setImageAdded(true)}
            className="mb-4 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 py-10 text-ink-500 hover:border-brand-300"
          >
            {imageAdded ? <Sprout className="h-8 w-8 text-brand-500" aria-hidden="true" /> : <ImagePlus className="h-8 w-8" aria-hidden="true" />}
            <span className="text-sm">{imageAdded ? 'Image added' : 'Tap to add a product photo'}</span>
          </button>
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
            <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-surface-sunk">
              <Sprout className="h-8 w-8 text-brand-400" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-ink-900">{name || 'Untitled product'}</p>
            <p className="text-xs text-ink-400">{mockCategories.find((c) => c.slug === category)?.name} · {location}</p>
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
          <p className="mb-5 text-sm text-ink-600">Your listing will be marked <strong>Pending</strong> until reviewed, then it will go live automatically.</p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={back}>
              Back
            </Button>
            <Button type="submit" fullWidth>
              Publish Listing
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
