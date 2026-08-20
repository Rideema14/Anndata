import { useState, type FormEvent, useEffect } from 'react'
import { Bell, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField, TextField } from '@/components/common/FormField'
import { useMandi } from '@/context/MandiContext'
import { mandiService } from '@/services/mandiService'
import { formatINR } from '@/utils/format'

export default function MandiAlertsPage() {
  const { alerts, addAlert, removeAlert, isLoading } = useMandi()
  
  const [crops, setCrops] = useState<{ id: string; name: string }[]>([])
  const [mandis, setMandis] = useState<{ id: string; name: string }[]>([])
  
  const [cropId, setCropId] = useState('')
  const [mandiId, setMandiId] = useState('')
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('BELOW')
  const [targetPrice, setTargetPrice] = useState('')

  useEffect(() => {
    // We need lists of crops and mandis to populate the form
    async function fetchFormOptions() {
      try {
        const [cropsRes, mandisRes] = await Promise.all([
          mandiService.getCrops(),
          // Passing empty params fetches a sample/all of mandis (or we could fetch states->districts->mandis here too)
          // For simplicity, let's fetch all markets or just let them select crop and then maybe specific mandi
          mandiService.getMarkets()
        ])
        const c = cropsRes.data || cropsRes || []
        const m = mandisRes.data?.items || mandisRes.data?.data || mandisRes.data || mandisRes || []
        setCrops(c)
        setMandis(m)
        if (c.length > 0) setCropId(c[0].id)
        if (m.length > 0) setMandiId(m[0].id)
      } catch (err) {
        console.error('Failed to load form options', err)
      }
    }
    fetchFormOptions()
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const price = Number(targetPrice)
    if (!price || !cropId) return
    
    await addAlert({
      cropId,
      mandiId: mandiId || undefined,
      thresholdPrice: price,
      condition,
      priceType: 'MODAL'
    })
    
    setTargetPrice('')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Price Alerts</h1>

      <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Create Price Alert</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField id="alert-crop" label="Crop" value={cropId} onChange={(e) => setCropId(e.target.value)} required>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SelectField>
          <SelectField id="alert-mandi" label="Mandi (Optional)" value={mandiId} onChange={(e) => setMandiId(e.target.value)}>
            <option value="">Any Mandi</option>
            {mandis.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </SelectField>
          <SelectField id="alert-condition" label="Condition" value={condition} onChange={(e) => setCondition(e.target.value as any)} required>
            <option value="BELOW">Falls Below</option>
            <option value="ABOVE">Rises Above</option>
          </SelectField>
          <TextField
            id="target-price"
            label="Target Price (₹)"
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="2300"
            required
          />
        </div>
        <Button type="submit" className="mt-4">
          Create Alert
        </Button>
      </form>

      <h2 className="mb-3 text-sm font-semibold text-ink-800">Active Alerts</h2>
      {isLoading ? (
        <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-ink-400" /></div>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-ink-500">No active alerts.</p>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {alert.crop?.name || 'Unknown Crop'} {alert.mandi ? `at ${alert.mandi.name}` : '(Any Mandi)'}
                  </p>
                  <p className="text-xs text-ink-400">Alert when price {alert.condition === 'ABOVE' ? 'rises above' : 'falls below'} {formatINR(alert.thresholdPrice)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAlert(alert.id)}
                aria-label="Remove alert"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-100 text-danger-500"
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
