import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banknote, CheckCircle2, ClipboardCheck, MapPin, Sprout, User } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { StepperHeader } from '@/components/common/StepperHeader'
import { TextField } from '@/components/common/FormField'
import { useAuth } from '@/context/AuthContext'

const STEPS = ['Seller Info', 'Farming Info', 'Location', 'Bank Details', 'Submit']

export default function SellerOnboardingPage() {
  const { user, isSeller } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [businessName, setBusinessName] = useState(user?.name ? `${user.name} Farms` : '')
  const [farmSize, setFarmSize] = useState('5')
  const [primaryCrop, setPrimaryCrop] = useState('Soybean')
  const [village, setVillage] = useState(user?.location ?? '')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (isSeller && !submitted) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 className="mb-3 h-12 w-12 text-brand-600" aria-hidden="true" />
        <h1 className="text-lg">You're already a seller</h1>
        <p className="mt-1 text-sm text-ink-500">Selling tools are available from your Profile or the Buy/Sell switch.</p>
        <Button className="mt-5" onClick={() => navigate('/seller/dashboard')}>
          Go to Seller Dashboard
        </Button>
      </div>
    )
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    // Adds the seller role to the SAME account — no second account is created.
    // In a connected backend this would call e.g. POST /seller/onboarding
    // and the returned user would include 'seller' in `roles`.
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-50 text-gold-600">
          <ClipboardCheck className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="text-xl">Application submitted</h1>
        <p className="mt-1 text-sm text-ink-500">Pending Verification — this usually takes 1–2 business days.</p>
        <p className="mt-3 text-xs text-ink-400">
          Once approved, seller tools appear automatically on your existing account — no new login needed.
        </p>
        <Button className="mt-6" onClick={() => navigate('/profile')}>
          Back to Profile
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Become a Seller</h1>
      <p className="mb-5 text-sm text-ink-500">One account — this adds selling tools to your existing Aandata login.</p>

      <StepperHeader steps={STEPS} currentIndex={step} />

      {step === 0 && (
        <div>
          <TextField id="business-name" label="Seller / Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          <TextField id="phone" label="Contact Phone" value={user?.phone ?? ''} disabled />
          <Button fullWidth onClick={next}>
            Continue
          </Button>
        </div>
      )}

      {step === 1 && (
        <div>
          <TextField id="farm-size" label="Farm Size (acres)" type="number" value={farmSize} onChange={(e) => setFarmSize(e.target.value)} required />
          <TextField id="primary-crop" label="Primary Crop" value={primaryCrop} onChange={(e) => setPrimaryCrop(e.target.value)} required />
          <Button fullWidth onClick={next}>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <TextField id="village" label="Village / Town" value={village} onChange={(e) => setVillage(e.target.value)} required />
          <p className="mb-4 flex items-center gap-1.5 text-xs text-ink-400">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            This location is shown to buyers on your listings.
          </p>
          <Button fullWidth onClick={next}>
            Continue
          </Button>
        </div>
      )}

      {step === 3 && (
        <div>
          <TextField id="account-number" label="Bank Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
          <TextField id="ifsc" label="IFSC Code" value={ifsc} onChange={(e) => setIfsc(e.target.value)} required />
          <p className="mb-4 flex items-center gap-1.5 text-xs text-ink-400">
            <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
            Used for payouts on completed orders.
          </p>
          <Button fullWidth onClick={next}>
            Continue
          </Button>
        </div>
      )}

      {step === 4 && (
        <form onSubmit={handleSubmit}>
          <div className="mb-5 space-y-2 rounded-2xl border border-ink-100 bg-surface p-4 text-sm">
            <p className="flex items-center gap-2 text-ink-700">
              <User className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {businessName}
            </p>
            <p className="flex items-center gap-2 text-ink-700">
              <Sprout className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {farmSize} acres · {primaryCrop}
            </p>
            <p className="flex items-center gap-2 text-ink-700">
              <MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {village}
            </p>
          </div>
          <Button type="submit" fullWidth>
            Submit Application
          </Button>
        </form>
      )}
    </div>
  )
}
