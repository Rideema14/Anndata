import { lazy, type ComponentType } from 'react'

// After a new Vercel deploy, the JS/CSS chunk filenames change (they're
// content-hashed). If someone has an old tab open, or their browser served
// a cached copy of index.html, that old bundle can still try to
// dynamically import a chunk that no longer exists on the server — the
// import rejects with "Failed to fetch dynamically imported module" (or,
// occasionally, just a transient network hiccup mid-download). Left
// unhandled, that rejection propagates up as a render error with no
// errorElement to catch it gracefully, which is exactly the
// "Unexpected Application Error!" screen.
//
// The fix used across most production Vite/CRA apps: on a chunk-load
// failure, force one full page reload so the browser re-fetches the
// current index.html and its correct chunk manifest, then retries the
// import as if nothing happened. The sessionStorage flag caps this at one
// automatic reload so a *genuinely* broken chunk doesn't reload forever —
// on a second failure it gives up and lets the error surface normally
// (caught by RouteErrorBoundary instead).
const RELOAD_FLAG_KEY = 'farmverse:chunk-reload-attempted'

export function lazyWithRetry<T extends ComponentType<unknown>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await factory()
      // A later successful load means the earlier failure (if any) is
      // resolved — clear the flag so a future, unrelated chunk failure
      // still gets its own automatic reload rather than being silently
      // skipped.
      sessionStorage.removeItem(RELOAD_FLAG_KEY)
      return mod
    } catch (error) {
      const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG_KEY) === '1'
      if (!alreadyReloaded) {
        sessionStorage.setItem(RELOAD_FLAG_KEY, '1')
        window.location.reload()
        // The reload is about to tear this page down anyway — return a
        // promise that never resolves so React doesn't render an error
        // state in the split second before that happens.
        return new Promise<{ default: T }>(() => {})
      }
      throw error
    }
  })
}
