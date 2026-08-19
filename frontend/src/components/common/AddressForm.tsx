import { useState, type FormEvent } from 'react'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import type { Address } from '@/types'

interface AddressFormProps {
  initial?: Address
  onSubmit: (address: Omit<Address, 'id'>) => void
  onCancel: () => void
}

export function AddressForm({ initial, onSubmit, onCancel }: AddressFormProps) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [line1, setLine1] = useState(initial?.line1 ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [state, setState] = useState(initial?.state ?? '')
  const [pincode, setPincode] = useState(initial?.pincode ?? '')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!label.trim() || !line1.trim() || !city.trim() || !state.trim() || !pincode.trim()) return
    onSubmit({ label, line1, city, state, pincode, isDefault: initial?.isDefault ?? false })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-dashed border-brand-300 bg-brand-50/40 p-3">
      <div className="grid grid-cols-2 gap-2">
        <TextField id="addr-label" label="Label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Home, Farm House…" required />
        <TextField id="addr-city" label="City" value={city} onChange={(e) => setCity(e.target.value)} required />
      </div>
      <TextField id="addr-line1" label="Address" value={line1} onChange={(e) => setLine1(e.target.value)} required />
      <div className="grid grid-cols-2 gap-2">
        <TextField id="addr-state" label="State" value={state} onChange={(e) => setState(e.target.value)} required />
        <TextField id="addr-pincode" label="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="h-9 px-4 text-xs">
          Cancel
        </Button>
        <Button type="submit" className="h-9 px-4 text-xs">
          Save Address
        </Button>
      </div>
    </form>
  )
}
