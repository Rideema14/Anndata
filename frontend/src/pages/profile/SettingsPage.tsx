import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, Globe, LogOut, MessageSquareText, Smartphone } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-ink-200')}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { language, setLanguage, supportedLanguages, t } = useLanguage()
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState({ mandi: true, orders: true, ai: true, sms: false })
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  async function handleLogout() {
    setConfirmingLogout(false)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">{t('nav.settings')}</h1>

      <section className="mb-5 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
          <Globe className="h-4 w-4" aria-hidden="true" />
          {t('common.language')}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {supportedLanguages.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => setLanguage(option.code)}
              className={cn(
                'flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm',
                language === option.code ? 'border-brand-400 bg-brand-50 text-brand-800' : 'border-ink-100 text-ink-600',
              )}
            >
              {option.nativeLabel}
              {language === option.code && <Check className="h-4 w-4" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-5 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
          <Bell className="h-4 w-4" aria-hidden="true" />
          Notifications
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-700">Mandi price alerts</span>
            <Toggle checked={notifs.mandi} onChange={() => setNotifs((p) => ({ ...p, mandi: !p.mandi }))} label="Mandi price alerts" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-700">Order updates</span>
            <Toggle checked={notifs.orders} onChange={() => setNotifs((p) => ({ ...p, orders: !p.orders }))} label="Order updates" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-700">AI recommendations</span>
            <Toggle checked={notifs.ai} onChange={() => setNotifs((p) => ({ ...p, ai: !p.ai }))} label="AI recommendations" />
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-ink-700">
              <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
              SMS alerts
            </span>
            <Toggle checked={notifs.sms} onChange={() => setNotifs((p) => ({ ...p, sms: !p.sms }))} label="SMS alerts" />
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
          <Smartphone className="h-4 w-4" aria-hidden="true" />
          Account
        </h2>
        <p className="text-sm text-ink-700">{user?.name}</p>
        <p className="text-xs text-ink-400">{user?.phone}</p>
      </section>

      <button
        type="button"
        onClick={() => setConfirmingLogout(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-danger-200 py-2.5 text-sm font-semibold text-danger-500 hover:bg-danger-50"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {t('nav.logout')}
      </button>

      <ConfirmDialog
        open={confirmingLogout}
        title="Log out?"
        message="You'll need to log in again to access your account."
        confirmLabel="Log Out"
        variant="danger"
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={handleLogout}
      />
    </div>
  )
}