import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  ClipboardList,
  Heart,
  MapPin,
  Pencil,
  PlusCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Trash2,
} from 'lucide-react'
import { AddressForm } from '@/components/common/AddressForm'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function ProfilePage() {
  const { user, isBuyer, isSeller, isAdmin, addAddress, updateAddress, removeAddress, setDefaultAddress } = useAuth()
  const { t } = useLanguage()
  const [addingAddress, setAddingAddress] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-500">You're not signed in yet.</p>
        <Link to="/login" className="mt-4 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
          {t('auth.login')}
        </Link>
      </div>
    )
  }

  const links = [
    { to: '/orders', label: t('nav.orders'), icon: ClipboardList },
    { to: '/wishlist', label: t('nav.wishlist'), icon: Heart },
    { to: '/ai/history', label: 'AI History', icon: Sparkles },
    { to: '/notifications', label: t('nav.notifications'), icon: Bell },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
      {/* Identity card */}
      <div className="rounded-2xl border border-ink-100 bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl">{user.name}</h1>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-500">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {user.location}
              </p>
            </div>
          </div>
          <Link
            to="/profile/edit"
            aria-label="Edit profile"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-100 text-ink-500 hover:border-brand-300 hover:text-brand-700"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* This is the mandatory demonstration: one account, both roles, no separate seller login. */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-4">
          <span className="text-xs font-medium text-ink-400">Account capabilities:</span>
          {isAdmin && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-2.5 py-1 text-xs font-semibold text-white">
              {t('roles.admin')} ✓
            </span>
          )}
          {isSeller && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-1 text-xs font-semibold text-gold-700">
              {t('roles.seller')} ✓
            </span>
          )}
          {isBuyer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              {t('roles.buyer')} ✓
            </span>
          )}
          {!isSeller && !isAdmin && (
            <Link
              to="/seller/onboarding"
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-brand-300 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
            >
              + {t('roles.becomeSeller')}
            </Link>
          )}
        </div>
      </div>

      {/* Admin shortcut, only if the role is active */}
      {isAdmin && (
        <Link
          to="/admin"
          className="mt-4 flex items-center justify-between rounded-2xl bg-ink-900 p-4 text-white transition-transform hover:-translate-y-0.5"
        >
          <span className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-semibold">{t('nav.adminDashboard')}</span>
          </span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      {/* Seller shortcut, only if the role is active */}
      {isSeller && (
        <Link
          to="/seller/dashboard"
          className="mt-4 flex items-center justify-between rounded-2xl bg-brand-700 p-4 text-white transition-transform hover:-translate-y-0.5"
        >
          <span className="flex items-center gap-3">
            <Store className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-semibold">{t('nav.sellerDashboard')}</span>
          </span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      {/* Quick links */}
      <div className="mt-5 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100 bg-surface">
        {links.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center justify-between px-4 py-3.5 hover:bg-surface-sunk">
            <span className="flex items-center gap-3 text-sm font-medium text-ink-800">
              <Icon className="h-4.5 w-4.5 text-ink-500" aria-hidden="true" />
              {label}
            </span>
            <ChevronRight className="h-4 w-4 text-ink-300" aria-hidden="true" />
          </Link>
        ))}
      </div>

      {/* Addresses */}
      <div className="mt-5 rounded-2xl border border-ink-100 bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base">Addresses</h2>
          {!addingAddress && (
            <button
              type="button"
              onClick={() => {
                setEditingAddressId(null)
                setAddingAddress(true)
              }}
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
            >
              <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Add Address
            </button>
          )}
        </div>

        <div className="space-y-2">
          {user.addresses.map((addr) =>
            editingAddressId === addr.id ? (
              <AddressForm
                key={addr.id}
                initial={addr}
                onCancel={() => setEditingAddressId(null)}
                onSubmit={(fields) => {
                  updateAddress(addr.id, fields)
                  setEditingAddressId(null)
                }}
              />
            ) : (
              <div key={addr.id} className="flex items-start gap-3 rounded-xl bg-surface-sunk p-3 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium text-ink-900">
                    {addr.label}
                    {addr.isDefault && (
                      <span className={cn('inline-flex items-center gap-0.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-800')}>
                        <Star className="h-2.5 w-2.5 fill-brand-800" aria-hidden="true" />
                        Default
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-ink-500">
                    {addr.line1}, {addr.city}, {addr.state} – {addr.pincode}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs">
                    {!addr.isDefault && (
                      <button type="button" onClick={() => setDefaultAddress(addr.id)} className="font-semibold text-brand-600 hover:underline">
                        Set as default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAddingAddress(false)
                        setEditingAddressId(addr.id)
                      }}
                      className="font-semibold text-ink-500 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAddress(addr.id)}
                      className="flex items-center gap-1 font-semibold text-danger-500 hover:underline"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}

          {addingAddress && (
            <AddressForm
              onCancel={() => setAddingAddress(false)}
              onSubmit={(fields) => {
                addAddress(fields)
                setAddingAddress(false)
              }}
            />
          )}

          {user.addresses.length === 0 && !addingAddress && (
            <p className="py-4 text-center text-xs text-ink-400">No addresses saved yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}