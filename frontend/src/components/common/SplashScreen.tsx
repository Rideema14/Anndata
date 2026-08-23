import { Logo } from '@/components/common/Logo'

/**
 * Shown once, only while AuthContext is restoring a session on first app
 * load (checking/refreshing the stored token). Without this, routes render
 * immediately with `user = null`, so a logged-in person briefly sees the
 * logged-out UI (or gets bounced by a route guard) until that check
 * resolves — this replaces that flash with a deliberate loading screen.
 */
export function SplashScreen() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-bg px-6">
      <Logo className="scale-110" />
      <span className="h-8 w-8 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" role="status" aria-live="polite">
        <span className="sr-only">Loading your session…</span>
      </span>
    </div>
  )
}
