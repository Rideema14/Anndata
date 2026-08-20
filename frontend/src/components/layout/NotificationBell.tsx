import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BellRing, ClipboardCheck, CreditCard, LineChart, MessageSquareText, Sparkles, Truck } from 'lucide-react'
import type { NotificationType } from '@/services/notificationService'
import { useNotifications } from '@/context/NotificationContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'

const ICONS: Record<NotificationType, typeof Bell> = {
  ORDER_STATUS: Truck,
  PAYMENT: CreditCard,
  SELLER_VERIFICATION: ClipboardCheck,
  REVIEW: MessageSquareText,
  PRICE_ALERT: LineChart,
  GENERAL: Sparkles,
}

export function NotificationBell({ className }: { className?: string }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t('nav.notifications')}${unreadCount ? `, ${unreadCount} unread` : ''}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink-100 bg-surface text-ink-700 hover:border-brand-300 hover:text-brand-700"
      >
        {unreadCount > 0 ? <BellRing className="h-4.5 w-4.5" aria-hidden="true" /> : <Bell className="h-4.5 w-4.5" aria-hidden="true" />}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-80 max-w-[85vw] overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-float"
        >
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">{t('nav.notifications')}</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                {t('common.markAllRead')}
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.slice(0, 5).map((n) => {
              const Icon = ICONS[n.type]
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'flex w-full items-start gap-3 border-b border-ink-100 px-4 py-3 text-left last:border-0 hover:bg-surface-sunk',
                      !n.read && 'bg-brand-50/60',
                    )}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-brand-700">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink-900">{n.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-ink-500">{n.body}</span>
                    </span>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-sm font-semibold text-brand-600 hover:bg-surface-sunk"
          >
            {t('common.viewAll')}
          </Link>
        </div>
      )}
    </div>
  )
}
