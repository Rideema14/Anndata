import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

interface QuickActionTileProps {
  to: string
  label: string
  icon: LucideIcon
  colorClass: string
}

export function QuickActionTile({ to, label, icon: Icon, colorClass }: QuickActionTileProps) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-2xl border border-ink-100 bg-surface p-3 text-center transition-transform hover:-translate-y-0.5 hover:shadow-card active:translate-y-0"
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorClass}`}>
        <Icon className="h-5.5 w-5.5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="text-xs font-medium leading-tight text-ink-700">{label}</span>
    </Link>
  )
}
