import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CalendarClock,
  ChevronLeft,
  MapPin,
  Ruler,
  Droplets,
  Layers,
  Phone,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Upload,
  AlertCircle,
  Building2,
  CalendarCheck,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useLand } from '@/context/LandContext'
import { useAuth } from '@/context/AuthContext'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

const VISIT_STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Clock; className: string }
> = {
  PENDING: { label: 'Visit Pending Seller Approval', icon: Clock, className: 'bg-amber-50 text-amber-800 border-amber-200' },
  ACCEPTED: { label: 'Visit Approved by Seller', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  REJECTED: { label: 'Visit Request Rejected', icon: XCircle, className: 'bg-red-50 text-red-800 border-red-200' },
  COMPLETED: { label: 'Visit Completed', icon: CheckCircle2, className: 'bg-blue-50 text-blue-800 border-blue-200' },
  CANCELLED: { label: 'Visit Request Cancelled', icon: AlertCircle, className: 'bg-ink-100 text-ink-600 border-ink-200' },
}

export default function LandDetailsPage() {
  const { id: slugOrId } = useParams<{ id: string }>()
  const { getListingBySlug, selectedListing, getVisitForLand, cancelVisitRequest, uploadImages, removeImage, deleteLand, isActionLoading } = useLand()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [fetching, setFetching] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (slugOrId) {
      setFetching(true)
      getListingBySlug(slugOrId).finally(() => setFetching(false))
    }
  }, [slugOrId, getListingBySlug])

  if (fetching) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        <p className="mt-4 text-xs font-medium text-ink-500">Loading land listing details…</p>
      </div>
    )
  }

  if (!selectedListing) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <MapPin className="mx-auto h-12 w-12 text-ink-300" />
        <h2 className="mt-3 text-lg font-semibold text-ink-900">Land Listing Not Found</h2>
        <p className="mt-1 text-xs text-ink-500">The plot you are looking for may have been removed or deactivated.</p>
        <Link to="/land" className="mt-4 inline-block rounded-full bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-brand-700">
          Back to Land Marketplace
        </Link>
      </div>
    )
  }

  const land = selectedListing
  const isOwner = user?.id === land.sellerId || user?.roles.includes('admin')
  const existingVisit = getVisitForLand(land.id)

  const priceNum = typeof land.price === 'string' ? parseFloat(land.price) : land.price
  const areaNum = typeof land.areaAcres === 'string' ? parseFloat(land.areaAcres) : land.areaAcres
  const pricePerAcre = areaNum > 0 ? priceNum / areaNum : 0
  const images = land.images || []
  const activeImage = images[activeImageIndex]?.url

  const handleCancelVisit = async () => {
    if (!existingVisit) return
    setCancelling(true)
    setActionError(null)
    try {
      await cancelVisitRequest(existingVisit.id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel visit request')
    } finally {
      setCancelling(false)
    }
  }

  const handleDeleteListing = async () => {
    if (!window.confirm('Are you sure you want to delete this land listing?')) return
    setActionError(null)
    try {
      await deleteLand(land.id)
      navigate('/land')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete listing')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setActionError(null)
    try {
      await uploadImages(land.id, files)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to upload images')
    }
  }

  const handleRemoveImage = async (imageId: string) => {
    setActionError(null)
    try {
      await removeImage(land.id, imageId)
      setActiveImageIndex(0)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove image')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      {/* Navigation Breadcrumb */}
      <Link to="/land" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-4 w-4" />
        Back to Land Marketplace
      </Link>

      {actionError && (
        <div className="mb-4 rounded-2xl border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
          {actionError}
        </div>
      )}

      {/* Main Image Gallery */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-ink-100 bg-surface shadow-sm">
        <div className="relative h-72 sm:h-96 w-full bg-soil-900/5">
          {activeImage ? (
            <img src={activeImage} alt={land.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-soil-900/10 via-emerald-900/5 to-soil-800/10 text-center">
              <MapPin className="h-16 w-16 text-soil-400 opacity-60" strokeWidth={1.2} />
              <span className="mt-2 text-xs font-medium text-ink-500">No photos uploaded for this plot</span>
            </div>
          )}
          <span
            className={cn(
              'absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold shadow-md backdrop-blur-md',
              land.dealType === 'SALE' ? 'bg-emerald-600/90 text-white' : 'bg-amber-500/90 text-white',
            )}
          >
            For {land.dealType === 'SALE' ? 'Sale' : 'Lease'}
          </span>
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
            <Eye className="h-3.5 w-3.5" /> {land.viewCount || 1} views
          </div>
        </div>

        {/* Image Thumbnails & Upload option */}
        {images.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto p-3 border-t border-ink-100 bg-surface-sunk">
            {images.map((img, idx) => (
              <div key={img.id} className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={cn(
                    'h-16 w-20 overflow-hidden rounded-xl border-2 transition',
                    activeImageIndex === idx ? 'border-brand-600 ring-2 ring-brand-500/20' : 'border-transparent opacity-70 hover:opacity-100',
                  )}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute -top-1 -right-1 hidden h-5 w-5 items-center justify-center rounded-full bg-danger-600 text-white shadow group-hover:flex"
                    title="Remove Image"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Title & Price Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-ink-100 bg-surface p-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{land.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
            <MapPin className="h-4 w-4 text-brand-600" />
            <span>{land.location} {land.city ? `· ${land.city}` : ''} {land.state ? `, ${land.state}` : ''}</span>
          </p>
        </div>
        <div className="border-t sm:border-t-0 sm:border-l border-ink-100 pt-3 sm:pt-0 sm:pl-6">
          <p className="text-xs uppercase tracking-wider text-ink-400">
            {land.dealType === 'LEASE' ? 'Annual Lease Rent' : 'Total Sale Price'}
          </p>
          <p className="text-2xl font-black text-ink-900 sm:text-3xl">
            {formatINR(priceNum)}
            {land.dealType === 'LEASE' && <span className="text-sm font-normal text-ink-400"> / yr</span>}
          </p>
          {areaNum > 0 && (
            <p className="mt-0.5 text-xs text-brand-700 font-semibold">
              ≈ {formatINR(Math.round(pricePerAcre))} / acre
            </p>
          )}
        </div>
      </div>

      {/* Grid Specs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-ink-100 bg-surface p-4 text-center">
          <Ruler className="mx-auto h-5 w-5 text-soil-600" />
          <p className="mt-1 text-[11px] text-ink-400 uppercase tracking-wider font-semibold">Plot Area</p>
          <p className="mt-0.5 text-base font-bold text-ink-900">{areaNum} Acres</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-surface p-4 text-center">
          <Layers className="mx-auto h-5 w-5 text-soil-600" />
          <p className="mt-1 text-[11px] text-ink-400 uppercase tracking-wider font-semibold">Soil Type</p>
          <p className="mt-0.5 text-base font-bold text-ink-900">{land.soilType || 'Not specified'}</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-surface p-4 text-center">
          <Droplets className="mx-auto h-5 w-5 text-sky-600" />
          <p className="mt-1 text-[11px] text-ink-400 uppercase tracking-wider font-semibold">Water Source</p>
          <p className="mt-0.5 text-base font-bold text-ink-900">{land.waterSource || 'Rain-fed'}</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-surface p-4 text-center">
          <Building2 className="mx-auto h-5 w-5 text-emerald-600" />
          <p className="mt-1 text-[11px] text-ink-400 uppercase tracking-wider font-semibold">Deal Type</p>
          <p className="mt-0.5 text-base font-bold text-ink-900">For {land.dealType === 'SALE' ? 'Sale' : 'Lease'}</p>
        </div>
      </div>

      {/* Listing Description */}
      <div className="mb-6 rounded-3xl border border-ink-100 bg-surface p-6">
        <h3 className="text-base font-bold text-ink-900 mb-2">About this Farmland</h3>
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600">
          {land.description || 'No additional description provided for this land listing.'}
        </p>
      </div>

      {/* Seller Information & Contact */}
      {land.seller && (
        <div className="mb-6 flex items-center justify-between rounded-3xl border border-ink-100 bg-surface p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 font-bold text-lg">
              {land.seller.name ? land.seller.name.charAt(0).toUpperCase() : 'S'}
            </span>
            <div>
              <p className="text-xs text-ink-400">Landowner / Seller</p>
              <p className="text-base font-bold text-ink-900">{land.seller.name}</p>
            </div>
          </div>
          {land.seller.phone && (
            <a
              href={`tel:${land.seller.phone}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              <Phone className="h-4 w-4" /> Call Seller
            </a>
          )}
        </div>
      )}

      {/* Site Visit Status / Booking Card */}
      <div className="mb-6 rounded-3xl border border-ink-100 bg-surface p-6 shadow-sm">
        <h3 className="text-base font-bold text-ink-900 mb-2">Physical Site Visit</h3>
        <p className="text-xs text-ink-500 mb-4">
          Schedule an in-person site visit to inspect boundaries, soil, and water facilities with the landowner.
        </p>

        {existingVisit ? (
          <div className={cn('rounded-2xl border p-4', VISIT_STATUS_CONFIG[existingVisit.status]?.className || 'bg-surface-sunk')}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CalendarClock className="h-5 w-5" />
                <span>Visit Requested for {new Date(existingVisit.visitDate).toLocaleDateString()} at {existingVisit.visitTime}</span>
              </div>
              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase">
                {existingVisit.status}
              </span>
            </div>
            {existingVisit.message && (
              <p className="mt-2 text-xs italic opacity-90">"{existingVisit.message}"</p>
            )}
            {existingVisit.responseNote && (
              <div className="mt-3 rounded-xl bg-white/80 p-2.5 text-xs">
                <span className="font-bold">Seller Note:</span> {existingVisit.responseNote}
              </div>
            )}
            {(existingVisit.status === 'PENDING' || existingVisit.status === 'ACCEPTED') && (
              <button
                type="button"
                onClick={handleCancelVisit}
                disabled={cancelling}
                className="mt-3 text-xs font-semibold text-danger-600 hover:underline disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Cancel Visit Request'}
              </button>
            )}
          </div>
        ) : (
          <Link to={`/land/${land.id}/visit`}>
            <Button fullWidth className="py-3 text-sm">
              <CalendarClock className="mr-2 h-4 w-4" /> Request Physical Site Visit
            </Button>
          </Link>
        )}
      </div>

      {/* Seller Management Panel (if Owner) */}
      {isOwner && (
        <div className="rounded-3xl border border-brand-200 bg-brand-50/50 p-6">
          <h3 className="text-base font-bold text-brand-900 mb-3">Seller Management Tools</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/seller/land`}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-700"
            >
              <CalendarCheck className="h-4 w-4" /> Manage Visit Requests
            </Link>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-2xl border border-ink-200 bg-surface px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50">
              <Upload className="h-4 w-4 text-brand-600" />
              Upload Photos
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isActionLoading} />
            </label>
            <button
              type="button"
              onClick={handleDeleteListing}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-danger-200 bg-white px-4 py-2 text-xs font-semibold text-danger-600 hover:bg-danger-50"
            >
              <Trash2 className="h-4 w-4" /> Delete Listing
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
