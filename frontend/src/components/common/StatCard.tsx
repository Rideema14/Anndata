import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  trend?: string
  trendPositive?: boolean
  accent?: string
}

export function StatCard({ label, value, icon: Icon, trend, trendPositive = true, accent = 'bg-brand-50 text-brand-700' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', accent)}>
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        {trend && (
          <span className={cn('text-xs font-semibold', trendPositive ? 'text-brand-600' : 'text-danger-500')}>{trend}</span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  )
}
