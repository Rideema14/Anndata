import { useEffect } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { AlertTriangle, RefreshCw } from 'lucide-react'

const RELOAD_FLAG_KEY = 'farmverse:chunk-reload-attempted'

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|loading chunk|importing a module script failed/i.test(message)
}

/**
 * Root errorElement for the router. Two jobs:
 *  1. If this render error is a stale-chunk failure that lazyWithRetry
 *     hasn't already handled (e.g. it happened outside a lazy() import),
 *     reload once automatically — same one-shot guard as lazyWithRetry, so
 *     the person never even sees this screen for that case.
 *  2. For every other error, show a calm "something went wrong, try
 *     again" screen instead of React Router's bare default message.
 */
export function RouteErrorBoundary() {
  const error = useRouteError()

  useEffect(() => {
    if (!isChunkLoadError(error)) return
    const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG_KEY) === '1'
    if (!alreadyReloaded) {
      sessionStorage.setItem(RELOAD_FLAG_KEY, '1')
      window.location.reload()
    }
  }, [error])

  const status = isRouteErrorResponse(error) ? error.status : undefined

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-500">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="text-lg font-semibold text-ink-900">
        {status === 404 ? "That page couldn't be found" : 'Something went wrong'}
      </h1>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500">
        {status === 404
          ? "The page you're looking for doesn't exist."
          : "The app hit an unexpected error. This is usually fixed by reloading — sorry for the interruption."}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-5 flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Reload
      </button>
    </div>
  )
}
