import { useState, type FormEvent } from 'react'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import { useLanguage } from '@/context/LanguageContext'
import type { Address } from '@/types'

interface AddressFormProps {
  initial?: Address
  onSubmit: (address: Omit<Address, 'id'>) => void
  onCancel: () => void
}

export function AddressForm({ initial, onSubmit, onCancel }: AddressFormProps) {
  const { t } = useLanguage()
  const [label, setLabel] = useState(initial?.label ?? '')
  const [fullName, setFullName] = useState(initial?.fullName ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [line1, setLine1] = useState(initial?.line1 ?? '')
  const [line2, setLine2] = useState(initial?.line2 ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [state, setState] = useState(initial?.state ?? '')
  const [pincode, setPincode] = useState(initial?.pincode ?? '')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!label.trim() || !fullName.trim() || !line1.trim() || !city.trim() || !state.trim() || !pincode.trim()) return
    const cleanedPhone = phone.replace(/[^\d+]/g, '')
    if (!/^\+?[0-9]{10,15}$/.test(cleanedPhone)) {
      setError(t('address.invalidPhone'))
      return
    }
    setError('')
    onSubmit({
      label,
      fullName,
      phone: cleanedPhone,
      line1,
      line2: line2.trim() || undefined,
      city,
      state,
      pincode,
      country: initial?.country ?? 'India',
      isDefault: initial?.isDefault ?? false,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-dashed border-brand-300 bg-brand-50/40 p-3">
      <div className="grid grid-cols-2 gap-2">
        <TextField
          id="addr-label"
          label={t('address.label')}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('address.labelPlaceholder')}
          required
        />
        <TextField id="addr-fullname" label={t('address.recipientName')} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <TextField
        id="addr-phone"
        label={t('address.phoneNumber')}
        type="tel"
        inputMode="tel"
        placeholder="98765 43210"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      <TextField id="addr-line1" label={t('address.addressLine1')} value={line1} onChange={(e) => setLine1(e.target.value)} required />
      <TextField id="addr-line2" label={t('address.addressLine2')} value={line2} onChange={(e) => setLine2(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <TextField id="addr-city" label={t('address.city')} value={city} onChange={(e) => setCity(e.target.value)} required />
        <TextField id="addr-state" label={t('address.state')} value={state} onChange={(e) => setState(e.target.value)} required />
      </div>
      <TextField id="addr-pincode" label={t('address.pincode')} value={pincode} onChange={(e) => setPincode(e.target.value)} required />
      {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="h-9 px-4 text-xs">
          {t('address.cancel')}
        </Button>
        <Button type="submit" className="h-9 px-4 text-xs">
          {t('address.save')}
        </Button>
      </div>
    </form>
  )
}