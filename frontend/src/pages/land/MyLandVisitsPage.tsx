import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarClock,
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { useLand } from '@/context/LandContext'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'
import type { BackendVisitStatus } from '@/services/landService'

const STATUS_CONFIG: Record<
  BackendVisitStatus,
  { label: string; icon: typeof Clock; className: string }
> = {
  PENDING: { label: 'Pending', icon: Clock, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  ACCEPTED: { label: 'Approved', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Rejected', icon: XCircle, className: 'bg-red-50 text-red-700 border-red-200' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  CANCELLED: { label: 'Cancelled', icon: AlertCircle, className: 'bg-ink-100 text-ink-600 border-ink-200' },
}

export default function MyLandVisitsPage() {
  const { visitRequests, fetchMyVisitRequests, cancelVisitRequest, isLoading, isActionLoading } = useLand()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<BackendVisitStatus | 'ALL'>('ALL')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchMyVisitRequests(activeTab === 'ALL' ? undefined : activeTab)
    }
  }, [user, activeTab, fetchMyVisitRequests])

  const filteredVisits = visitRequests.filter((v) => (activeTab === 'ALL' ? true : v.status === activeTab))

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this visit request?')) return
    setCancellingId(id)
    setErrorMsg(null)
    try {
      await cancelVisitRequest(id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to cancel visit')
    } finally {
      setCancellingId(null)
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <CalendarClock className="mx-auto h-12 w-12 text-ink-300" />
        <h2 className="mt-3 text-lg font-bold text-ink-900">Sign in to view site visits</h2>
        <p className="mt-1 text-xs text-ink-500">Track status and seller responses for your land visits.</p>
        <Link to="/login" className="mt-4 inline-block rounded-full bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-brand-700">
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/land" className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
            <ChevronLeft className="h-4 w-4" /> Land Marketplace
          </Link>
          <h1 className="text-2xl font-extrabold text-ink-900">My Requested Site Visits</h1>
          <p className="text-xs text-ink-500">Track and manage your scheduled agricultural land site visits.</p>
        </div>
        <button
          type="button"
          onClick={() => fetchMyVisitRequests(activeTab === 'ALL' ? undefined : activeTab)}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-surface px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-2xl bg-surface-sunk p-1">
        {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-xl px-3.5 py-2 text-xs font-semibold transition',
              activeTab === tab ? 'bg-surface shadow-card text-ink-900' : 'text-ink-500 hover:text-ink-900',
            )}
          >
            {tab === 'ALL' ? 'All Requests' : STATUS_CONFIG[tab]?.label || tab}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-2xl border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
          {errorMsg}
        </div>
      )}

      {/* Visits List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-ink-100 bg-surface" />
          ))}
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="mx-auto my-12 max-w-sm rounded-3xl border border-dashed border-ink-200 p-8 text-center">
          <CalendarClock className="mx-auto h-10 w-10 text-ink-300" />
          <h3 className="mt-2 text-sm font-bold text-ink-900">No visit requests found</h3>
          <p className="mt-1 text-xs text-ink-500">Schedule site visits directly on land detail pages.</p>
          <Link to="/land" className="mt-4 inline-block rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-700">
            Browse Land Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map((visit) => {
            const statusCfg = STATUS_CONFIG[visit.status] || STATUS_CONFIG.PENDING
            const StatusIcon = statusCfg.icon

            return (
              <div key={visit.id} className="rounded-3xl border border-ink-100 bg-surface p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold', statusCfg.className)}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusCfg.label}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-ink-900">
                      {visit.land?.title || 'Agricultural Land Plot'}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-ink-500">
                      <MapPin className="h-3.5 w-3.5 text-soil-500" />
                      {visit.land?.location || 'Location details in plot'}
                    </p>
                  </div>
                  {visit.land?.slug && (
                    <Link
                      to={`/land/${visit.land.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                    >
                      View Plot Details <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                <div className="mt-4 grid gap-3 rounded-2xl bg-surface-sunk p-3.5 text-xs sm:grid-cols-2">
                  <div>
                    <span className="font-semibold text-ink-500">Visit Date & Time:</span>
                    <p className="font-bold text-ink-900">{new Date(visit.visitDate).toLocaleDateString()} at {visit.visitTime}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-ink-500">Request Date:</span>
                    <p className="text-ink-700">{new Date(visit.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {visit.message && (
                  <p className="mt-3 text-xs text-ink-600">
                    <span className="font-semibold text-ink-900">Your Message:</span> "{visit.message}"
                  </p>
                )}

                {visit.responseNote && (
                  <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-900">
                    <span className="font-bold">Seller Response Note:</span> {visit.responseNote}
                  </div>
                )}

                {(visit.status === 'PENDING' || visit.status === 'ACCEPTED') && (
                  <div className="mt-4 flex justify-end border-t border-ink-100 pt-3">
                    <button
                      type="button"
                      onClick={() => handleCancel(visit.id)}
                      disabled={cancellingId === visit.id || isActionLoading}
                      className="text-xs font-semibold text-danger-600 hover:underline disabled:opacity-50"
                    >
                      {cancellingId === visit.id ? 'Cancelling…' : 'Cancel Visit Request'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
