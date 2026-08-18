import { Check, X } from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import { formatDateLabel } from '@/utils/format'
import { cn } from '@/utils/cn'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gold-50 text-gold-700',
  verified: 'bg-brand-50 text-brand-700',
  rejected: 'bg-danger-50 text-danger-500',
}

export default function AdminSellersPage() {
  const { sellerApplications, approveApplication, rejectApplication } = useAdmin()

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Sellers</h1>
      <p className="mb-5 text-sm text-ink-500">Review seller applications and verification status.</p>

      <div className="space-y-2">
        {sellerApplications.map((app) => (
          <div key={app.id} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-surface p-4">
            <div>
              <p className="text-sm font-semibold text-ink-900">{app.businessName}</p>
              <p className="text-xs text-ink-500">{app.name} · {app.location} · {app.primaryCrop}</p>
              <p className="text-[11px] text-ink-400">Applied {formatDateLabel(app.submittedAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize', STATUS_STYLES[app.status])}>{app.status}</span>
              {app.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => approveApplication(app.id)}
                    aria-label="Approve"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectApplication(app.id)}
                    aria-label="Reject"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-50 text-danger-500"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
