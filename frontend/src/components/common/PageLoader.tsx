export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6" role="status" aria-live="polite">
      <span className="h-9 w-9 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
