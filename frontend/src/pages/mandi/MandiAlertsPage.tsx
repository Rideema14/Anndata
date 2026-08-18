import { useState, type FormEvent } from 'react'
import { Bell, Trash2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField, TextField } from '@/components/common/FormField'
import { mandiCrops, mockMandiRecords } from '@/data/mock/mockMandiData'
import { useMandi } from '@/context/MandiContext'
import { formatINR } from '@/utils/format'

export default function MandiAlertsPage() {
  const allMandis = [...new Set(mockMandiRecords.map((r) => r.mandi))]
  const { alerts, addAlert, removeAlert } = useMandi()
  const [crop, setCrop] = useState(mandiCrops[0])
  const [mandi, setMandi] = useState(allMandis[0])
  const [targetPrice, setTargetPrice] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const price = Number(targetPrice)
    if (!price) return
    addAlert(crop, mandi, price)
    setTargetPrice('')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Price Alerts</h1>

      <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Create Price Alert</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SelectField id="alert-crop" label="Crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
            {mandiCrops.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectField>
          <SelectField id="alert-mandi" label="Mandi" value={mandi} onChange={(e) => setMandi(e.target.value)}>
            {allMandis.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </SelectField>
          <TextField
            id="target-price"
            label="Target Price (₹)"
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="2300"
          />
        </div>
        <Button type="submit" className="mt-1">
          Create Alert
        </Button>
      </form>

      <h2 className="mb-3 text-sm font-semibold text-ink-800">Active Alerts</h2>
      {alerts.length === 0 ? (
        <p className="text-sm text-ink-500">No active alerts.</p>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {alert.crop} at {alert.mandi}
                  </p>
                  <p className="text-xs text-ink-400">Alert when price reaches {formatINR(alert.targetPrice)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAlert(alert.id)}
                aria-label="Remove alert"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-100 text-danger-500"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
