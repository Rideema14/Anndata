import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Search, Wallet, X, Undo2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextField, SelectField, TextAreaField } from '@/components/common/FormField'
import { LoadingOverlay } from '@/components/common/LoadingOverlay'
import { adminService, type SellerBalance, type Payout } from '@/services/adminService'
import { getApiErrorMessage } from '@/services/api'
import { formatDateTimeLabel, formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

type Tab = 'balances' | 'ledger'

export default function AdminPayoutsPage() {
  const [tab, setTab] = useState<Tab>('balances')

  // --- Seller balances -------------------------------------------------
  const [sellers, setSellers] = useState<SellerBalance[]>([])
  const [totalSellers, setTotalSellers] = useState(0)
  const [isLoadingSellers, setIsLoadingSellers] = useState(true)
  const [search, setSearch] = useState('')

  const loadSellers = useCallback(async (query = '') => {
    setIsLoadingSellers(true)
    try {
      const { items, totalItems } = await adminService.getSellerBalances({ limit: 100, search: query || undefined })
      setSellers(items)
      setTotalSellers(totalItems)
    } finally {
      setIsLoadingSellers(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => loadSellers(search), 300) // debounce search-as-you-type
    return () => clearTimeout(t)
  }, [search, loadSellers])

  // --- Ledger ------------------------------------------------------------
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [totalPayouts, setTotalPayouts] = useState(0)
  const [isLoadingLedger, setIsLoadingLedger] = useState(false)
  const [reversingId, setReversingId] = useState<string | null>(null)
  const [ledgerError, setLedgerError] = useState('')

  const loadLedger = useCallback(async () => {
    setIsLoadingLedger(true)
    try {
      const { items, totalItems } = await adminService.listPayouts({ limit: 100 })
      setPayouts(items)
      setTotalPayouts(totalItems)
    } finally {
      setIsLoadingLedger(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'ledger') loadLedger()
  }, [tab, loadLedger])

  async function handleReverse(payoutId: string) {
    if (!window.confirm('Reverse this payout? It will no longer count toward the seller\'s paid-out total.')) return
    setReversingId(payoutId)
    setLedgerError('')
    try {
      const updated = await adminService.reversePayout(payoutId)
      setPayouts((prev) => prev.map((p) => (p.id === payoutId ? updated : p)))
      loadSellers(search) // balances changed — refresh the other tab's numbers too
    } catch (err) {
      setLedgerError(getApiErrorMessage(err, 'Could not reverse this payout.'))
    } finally {
      setReversingId(null)
    }
  }

  // --- Pay-out modal -------------------------------------------------------
  const [payingOut, setPayingOut] = useState<SellerBalance | null>(null)
  const [isRefreshingModal, setIsRefreshingModal] = useState(false)

  function openPayoutModal(seller: SellerBalance) {
    setIsRefreshingModal(true)
    setPayingOut(seller) // show cached figures immediately…
    adminService
      .getSellerBalance(seller.id)
      .then((fresh) => setPayingOut(fresh)) // …then swap in fresh ones once they land
      .finally(() => setIsRefreshingModal(false))
  }

  function handlePayoutRecorded() {
    setPayingOut(null)
    loadSellers(search)
    if (tab === 'ledger') loadLedger()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 flex items-center gap-2 text-xl">
        <Wallet className="h-5 w-5 text-brand-600" aria-hidden="true" />
        Seller Payouts
      </h1>
      <p className="mb-5 text-sm text-ink-500">
        Balance = delivered/completed sales revenue (products, seeds & machinery) minus payouts already made.
        There's no automated payout API — record it here after you've sent the money via bank transfer or UPI.
      </p>

      <div className="mb-5 flex gap-1 rounded-full bg-surface-sunk p-1 max-w-xs">
        <button
          type="button"
          onClick={() => setTab('balances')}
          className={cn('flex-1 rounded-full py-2 text-xs font-semibold', tab === 'balances' ? 'bg-surface shadow-card text-ink-900' : 'text-ink-500')}
        >
          Balances
        </button>
        <button
          type="button"
          onClick={() => setTab('ledger')}
          className={cn('flex-1 rounded-full py-2 text-xs font-semibold', tab === 'ledger' ? 'bg-surface shadow-card text-ink-900' : 'text-ink-500')}
        >
          Payout Ledger
        </button>
      </div>

      {tab === 'balances' ? (
        <>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by seller name, email, or business"
                className="h-10 w-full rounded-xl border border-ink-200 bg-surface pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400"
              />
            </div>
            <span className="text-xs text-ink-400">{totalSellers} seller{totalSellers === 1 ? '' : 's'}</span>
          </div>

          {isLoadingSellers ? (
            <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
          ) : sellers.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-500">No sellers found.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-surface">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                    <th className="px-4 py-3 font-medium">Seller</th>
                    <th className="px-4 py-3 font-medium">Earned</th>
                    <th className="px-4 py-3 font-medium">Paid Out</th>
                    <th className="px-4 py-3 font-medium">Balance</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {sellers.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-900">{s.name}</p>
                        <p className="text-xs text-ink-500">{s.businessName || s.email}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-700">{formatINR(s.totalEarned)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatINR(s.totalPaidOut)}</td>
                      <td className="px-4 py-3 font-semibold text-ink-900">{formatINR(s.balance)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="secondary"
                          className="h-8 px-3 text-xs"
                          disabled={s.balance <= 0}
                          onClick={() => openPayoutModal(s)}
                        >
                          Pay Out
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="mb-3 text-xs text-ink-400">{totalPayouts} payout{totalPayouts === 1 ? '' : 's'} recorded.</p>
          {ledgerError && <p className="mb-3 text-sm font-medium text-danger-500">{ledgerError}</p>}
          {isLoadingLedger ? (
            <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
          ) : payouts.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-500">No payouts recorded yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-surface">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                    <th className="px-4 py-3 font-medium">Seller</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-900">{p.seller?.name}</p>
                        <p className="text-xs text-ink-500">{p.seller?.sellerProfile?.businessName || p.seller?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink-900">{formatINR(Number(p.amount))}</td>
                      <td className="px-4 py-3 text-ink-600 capitalize">{p.method.replace(/_/g, ' ').toLowerCase()}</td>
                      <td className="px-4 py-3 text-ink-500">{p.reference || '—'}</td>
                      <td className="px-4 py-3 text-ink-500">{formatDateTimeLabel(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize',
                            p.status === 'PAID' ? 'bg-brand-50 text-brand-700' : 'bg-danger-50 text-danger-500',
                          )}
                        >
                          {p.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.status === 'PAID' && (
                          <button
                            type="button"
                            onClick={() => handleReverse(p.id)}
                            disabled={reversingId === p.id}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-danger-500 hover:underline disabled:opacity-50"
                          >
                            <Undo2 className="h-3 w-3" aria-hidden="true" />
                            Reverse
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {payingOut && (
        <PayoutModal
          seller={payingOut}
          isRefreshing={isRefreshingModal}
          onClose={() => setPayingOut(null)}
          onRecorded={handlePayoutRecorded}
        />
      )}
    </div>
  )
}

function PayoutModal({
  seller,
  isRefreshing,
  onClose,
  onRecorded,
}: {
  seller: SellerBalance
  isRefreshing: boolean
  onClose: () => void
  onRecorded: () => void
}) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'BANK_TRANSFER' | 'UPI' | 'OTHER'>('BANK_TRANSFER')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Prefill with the full outstanding balance — the common case is paying it off in full.
  useEffect(() => {
    setAmount(seller.balance > 0 ? String(seller.balance) : '')
  }, [seller.balance])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const amountNum = Number(amount)
    if (!amountNum || amountNum <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }
    if (amountNum > seller.balance) {
      setError(`Amount exceeds this seller's outstanding balance of ${formatINR(seller.balance)}.`)
      return
    }
    setIsSubmitting(true)
    try {
      await adminService.createPayout(seller.id, { amount: amountNum, method, reference: reference.trim() || undefined, note: note.trim() || undefined })
      onRecorded()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not record this payout.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <LoadingOverlay isLoading={isSubmitting} fullScreen={false} title="Recording payout…" message="Saving this payout to the ledger." />
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 text-ink-400 hover:text-ink-700">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 className="text-base font-semibold text-ink-900">Pay Out {seller.name}</h2>
        <p className="mt-1 text-xs text-ink-500">
          Outstanding balance: <span className="font-semibold text-ink-800">{isRefreshing ? '…' : formatINR(seller.balance)}</span>
        </p>

        {(seller.bankAccountNumber || seller.bankName) && (
          <div className="mt-3 rounded-xl bg-surface-sunk p-3 text-xs text-ink-600">
            <p className="mb-1 font-semibold text-ink-700">Bank details on file</p>
            {seller.bankAccountHolder && <p>Holder: {seller.bankAccountHolder}</p>}
            {seller.bankAccountNumber && <p>A/C: {seller.bankAccountNumber}</p>}
            {seller.bankIfscCode && <p>IFSC: {seller.bankIfscCode}</p>}
            {seller.bankName && <p>Bank: {seller.bankName}</p>}
          </div>
        )}

        <form className="mt-4" onSubmit={handleSubmit}>
          <TextField
            id="payout-amount"
            label="Amount (₹)"
            type="number"
            min={1}
            max={seller.balance || undefined}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <SelectField id="payout-method" label="Method" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="UPI">UPI</option>
            <option value="OTHER">Other</option>
          </SelectField>
          <TextField
            id="payout-reference"
            label="Reference / UTR number"
            hint="Optional — the bank UTR, UPI transaction ID, or cheque number, for reconciliation."
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <TextAreaField id="payout-note" label="Note" hint="Optional, visible to the seller." value={note} onChange={(e) => setNote(e.target.value)} rows={2} />

          {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}

          <div className="mt-2 flex gap-2">
            <Button type="submit" fullWidth loading={isSubmitting} disabled={seller.balance <= 0}>
              Record Payout
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
