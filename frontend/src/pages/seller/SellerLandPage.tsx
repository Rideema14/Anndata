import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Plus,
  Ruler,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ExternalLink,
  Phone,
  Mail,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
} from 'lucide-react'
import { useLand } from '@/context/LandContext'
import { useAuth } from '@/context/AuthContext'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { BackendVisitStatus } from '@/services/landService'

type Tab = 'listings' | 'visits'

export default function SellerLandPage() {
  const {
    sellerListings,
    fetchSellerListings,
    sellerVisitRequests,
    fetchSellerVisitRequests,
    updateVisitStatus,
    updateLand,
    deleteLand,
    isLoading,
    isActionLoading,
  } = useLand()

  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('listings')
  const [visitStatusFilter, setVisitStatusFilter] = useState<BackendVisitStatus | 'ALL'>('ALL')
  
  // State for updating a visit request status with a seller note
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null)
  const [responseNote, setResponseNote] = useState('')
  const [updatingVisit, setUpdatingVisit] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchSellerListings()
      fetchSellerVisitRequests()
    }
  }, [user, fetchSellerListings, fetchSellerVisitRequests])

  const pendingVisitsCount = sellerVisitRequests.filter((v) => v.status === 'PENDING').length

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updateLand(id, { isActive: !currentActive })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update listing status')
    }
  }

  const handleDeleteListing = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this land listing?')) return
    try {
      await deleteLand(id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete listing')
    }
  }

  const handleUpdateVisit = async (visitId: string, status: BackendVisitStatus) => {
    setUpdatingVisit(true)
    setErrorMsg(null)
    try {
      await updateVisitStatus(visitId, status, responseNote.trim() || undefined)
      setSelectedVisitId(null)
      setResponseNote('')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update visit request status')
    } finally {
      setUpdatingVisit(false)
    }
  }

  const filteredVisits = sellerVisitRequests.filter((v) =>
    visitStatusFilter === 'ALL' ? true : v.status === visitStatusFilter,
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/seller" className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
            <ChevronLeft className="h-4 w-4" /> Seller Hub
          </Link>
          <h1 className="text-2xl font-extrabold text-ink-900">Seller Land Management</h1>
          <p className="text-xs text-ink-500">
            Manage your land plots, activate/deactivate listings, and respond to buyer site visit requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/seller/add-land"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Post Land Listing
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-2xl border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
          {errorMsg}
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="mb-6 flex border-b border-ink-200">
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={cn(
            'flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-bold transition',
            activeTab === 'listings'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-ink-500 hover:text-ink-900',
          )}
        >
          <MapPin className="h-4 w-4" />
          My Land Listings ({sellerListings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('visits')}
          className={cn(
            'relative flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-bold transition',
            activeTab === 'visits'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-ink-500 hover:text-ink-900',
          )}
        >
          <CalendarCheck className="h-4 w-4" />
          Visit Requests ({sellerVisitRequests.length})
          {pendingVisitsCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] text-white font-extrabold">
              {pendingVisitsCount} new
            </span>
          )}
        </button>
      </div>

      {/* MY LISTINGS TAB */}
      {activeTab === 'listings' && (
        <div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border border-ink-100 bg-surface" />
              ))}
            </div>
          ) : sellerListings.length === 0 ? (
            <div className="mx-auto my-12 max-w-sm rounded-3xl border border-dashed border-ink-200 p-8 text-center">
              <MapPin className="mx-auto h-10 w-10 text-soil-400" />
              <h3 className="mt-2 text-sm font-bold text-ink-900">No land listings created yet</h3>
              <p className="mt-1 text-xs text-ink-500">Post your agricultural plots to connect with interested buyers.</p>
              <Link
                to="/seller/add-land"
                className="mt-4 inline-block rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-700"
              >
                Create First Land Listing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sellerListings.map((land) => {
                const primaryImg = land.images?.find((img) => img.isPrimary)?.url || land.images?.[0]?.url
                const priceNum = typeof land.price === 'string' ? parseFloat(land.price) : land.price
                const areaNum = typeof land.areaAcres === 'string' ? parseFloat(land.areaAcres) : land.areaAcres

                return (
                  <div
                    key={land.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-ink-100 bg-surface p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-soil-50 border border-ink-100">
                        {primaryImg ? (
                          <img src={primaryImg} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-soil-400">
                            <MapPin className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-bold text-ink-900">{land.title}</h3>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase',
                              land.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500',
                            )}
                          >
                            {land.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {land.location} · {areaNum} Acres · For {land.dealType === 'SALE' ? 'Sale' : 'Lease'}
                        </p>
                        <p className="mt-1 text-sm font-extrabold text-ink-900">
                          {formatINR(priceNum)}
                          {land.dealType === 'LEASE' && <span className="text-xs font-normal text-ink-400"> / yr</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-ink-100">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(land.id, land.isActive)}
                        className={cn(
                          'rounded-xl border px-3 py-1.5 text-xs font-semibold transition',
                          land.isActive
                            ? 'border-ink-200 text-ink-700 hover:bg-ink-50'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                        )}
                      >
                        {land.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <Link
                        to={`/land/${land.slug || land.id}`}
                        className="rounded-xl border border-ink-200 bg-surface px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(land.id)}
                        className="rounded-xl border border-danger-200 p-1.5 text-danger-600 hover:bg-danger-50"
                        title="Delete Listing"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* VISIT REQUESTS TAB */}
      {activeTab === 'visits' && (
        <div>
          {/* Sub-filter tabs for visit status */}
          <div className="mb-4 flex flex-wrap gap-1 rounded-2xl bg-surface-sunk p-1">
            {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setVisitStatusFilter(status)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-semibold transition',
                  visitStatusFilter === status ? 'bg-surface shadow-card text-ink-900' : 'text-ink-500 hover:text-ink-900',
                )}
              >
                {status}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-ink-100 bg-surface" />
              ))}
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="mx-auto my-12 max-w-sm rounded-3xl border border-dashed border-ink-200 p-8 text-center">
              <CalendarCheck className="mx-auto h-10 w-10 text-ink-300" />
              <h3 className="mt-2 text-sm font-bold text-ink-900">No visit requests found</h3>
              <p className="mt-1 text-xs text-ink-500">When buyers request site visits for your land, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVisits.map((visit) => (
                <div key={visit.id} className="rounded-3xl border border-ink-100 bg-surface p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Land Listing</span>
                      <h3 className="text-base font-bold text-ink-900">{visit.land?.title || 'Land Plot'}</h3>
                      <p className="text-xs text-ink-500">{visit.land?.location}</p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-extrabold uppercase',
                        visit.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : visit.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : visit.status === 'COMPLETED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-ink-100 text-ink-600',
                      )}
                    >
                      {visit.status}
                    </span>
                  </div>

                  {/* Buyer details */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-ink-500">Buyer Name: </span>
                      <span className="font-bold text-ink-900">{visit.buyer?.name || 'Interested Buyer'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {visit.buyer?.phone && (
                        <a
                          href={`tel:${visit.buyer.phone}`}
                          className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" /> {visit.buyer.phone}
                        </a>
                      )}
                      {visit.buyer?.email && (
                        <a
                          href={`mailto:${visit.buyer.email}`}
                          className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
                        >
                          <Mail className="h-3.5 w-3.5" /> Email
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-surface-sunk p-3 text-xs">
                    <p>
                      <span className="font-bold text-ink-900">Requested Visit Date: </span>
                      <span className="font-bold text-brand-700">{new Date(visit.visitDate).toLocaleDateString()}</span> at{' '}
                      <span className="font-bold text-brand-700">{visit.visitTime}</span>
                    </p>
                    {visit.message && (
                      <p className="mt-1.5 italic text-ink-600">"{visit.message}"</p>
                    )}
                  </div>

                  {visit.responseNote && (
                    <div className="mt-3 text-xs text-ink-700">
                      <span className="font-bold">Seller Note Provided:</span> {visit.responseNote}
                    </div>
                  )}

                  {/* Seller Action Controls */}
                  {visit.status === 'PENDING' && (
                    <div className="mt-4 border-t border-ink-100 pt-3">
                      {selectedVisitId === visit.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Add response note for buyer (e.g. 'Meeting at village landmark', 'Please call before arrival')..."
                            value={responseNote}
                            onChange={(e) => setResponseNote(e.target.value)}
                            className="w-full rounded-xl border border-ink-200 px-3 py-1.5 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedVisitId(null)}
                              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-ink-500 hover:bg-ink-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateVisit(visit.id, 'REJECTED')}
                              disabled={updatingVisit}
                              className="rounded-xl bg-danger-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-danger-700 disabled:opacity-50"
                            >
                              Reject Visit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateVisit(visit.id, 'ACCEPTED')}
                              disabled={updatingVisit}
                              className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Approve Visit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVisitId(visit.id)
                              setResponseNote('')
                            }}
                            className="rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-brand-700"
                          >
                            Respond to Visit Request
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {visit.status === 'ACCEPTED' && (
                    <div className="mt-3 flex justify-end border-t border-ink-100 pt-3">
                      <button
                        type="button"
                        onClick={() => updateVisitStatus(visit.id, 'COMPLETED')}
                        disabled={isActionLoading}
                        className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Visit as Completed
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
