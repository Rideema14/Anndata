/** Formats a number as Indian Rupees with lakh/crore grouping, e.g. 1,25,000. */
export function formatINR(amount: number, options?: { maxFractionDigits?: number }): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: options?.maxFractionDigits ?? 0,
  }).format(amount)
}

/** Formats a plain number with Indian digit grouping, no currency symbol. */
export function formatNumberIN(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value)
}

/** Relative-ish date label: "Today", "Yesterday", or a short date. */
export function formatDateLabel(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Relative-ish date label with time, e.g. "Today, 10:30 AM" or "24 Aug 2026, 04:00 PM". */
export function formatDateTimeLabel(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86_400_000)
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  
  if (diffDays === 0) return `Today, ${timeStr}`
  if (diffDays === 1) return `Yesterday, ${timeStr}`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${timeStr}`
}

/** Formats a percentage change with a leading sign, e.g. "+4.2%" / "-1.1%". */
export function formatPercentChange(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}
