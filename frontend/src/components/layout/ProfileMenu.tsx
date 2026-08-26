import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut, Settings, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function ProfileMenu({ className }: { className?: string }) {
  const { user, isSeller, isAdmin, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return (
      <Link
        to="/login"
        className="flex h-10 items-center rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
      >
        {t('auth.login')}
      </Link>
    )
  }

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.profile')}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-800 text-sm font-bold text-white"
      >
        {initials(user.name)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-float"
        >
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
            <p className="truncate text-xs text-ink-500">{user.phone}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {isAdmin ? (
                <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {t('roles.admin')} ✓
                </span>
              ) : isSeller ? (
                <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-semibold text-gold-700">
                  {t('roles.seller')} ✓
                </span>
              ) : (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                  {t('roles.buyer')} ✓
                </span>
              )}
            </div>
          </div>
          <div className="py-1">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-sunk"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              {t('nav.profile')}
            </Link>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-sunk"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              {t('nav.settings')}
            </Link>
            {!isSeller && !isAdmin && (
              <Link
                to="/seller/onboarding"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gold-700 hover:bg-surface-sunk"
              >
                <span>{t('roles.becomeSeller')}</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
          <div className="border-t border-ink-100 py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setConfirmingLogout(true)
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger-500 hover:bg-danger-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmingLogout}
        title="Log out?"
        message="You'll need to log in again to access your account."
        confirmLabel="Log Out"
        variant="danger"
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={() => {
          setConfirmingLogout(false)
          logout().then(() => navigate('/login', { replace: true }))
        }}
      />
    </div>
  )
}