import { Bell, ClipboardCheck, LineChart, PackageCheck, Sparkles, Truck } from 'lucide-react'
import type { NotificationType } from '@/data/mock/mockNotifications'
import { useNotifications } from '@/context/NotificationContext'
import { useLanguage } from '@/context/LanguageContext'
import { formatDateLabel } from '@/utils/format'
import { cn } from '@/utils/cn'

const ICONS: Record<NotificationType, typeof Bell> = {
  mandi_alert: LineChart,
  order_update: Truck,
  seller_verification: ClipboardCheck,
  new_order: PackageCheck,
  ai_recommendation: Sparkles,
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl">{t('nav.notifications')}</h1>
        {unreadCount > 0 && (
          <button type="button" onClick={markAllRead} className="text-xs font-semibold text-brand-600 hover:underline">
            {t('common.markAllRead')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Bell className="mb-3 h-10 w-10 text-ink-300" aria-hidden="true" />
          <p className="text-sm text-ink-500">{t('common.emptyGeneric')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICONS[n.type]
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border p-3 text-left',
                    n.read ? 'border-ink-100 bg-surface' : 'border-brand-200 bg-brand-50/60',
                  )}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-brand-700">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink-900">{n.title}</span>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-500">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-ink-400">{formatDateLabel(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
