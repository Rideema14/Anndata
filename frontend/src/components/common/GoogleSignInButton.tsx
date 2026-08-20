import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getApiErrorMessage } from '@/services/api'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}

let scriptPromise: Promise<boolean> | null = null

function loadGoogleScript(): Promise<boolean> {
  if (window.google?.accounts?.id) return Promise.resolve(true)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }
  return scriptPromise
}

interface GoogleSignInButtonProps {
  onSuccess: () => void
  onError?: (message: string) => void
}

/**
 * Renders Google's own "Sign in with Google" button and, on success, hands
 * the returned idToken to AuthContext.loginWithGoogle (which POSTs it to
 * the backend's /auth/google — creates the account on first sign-in, logs
 * in an existing one otherwise). Requires VITE_GOOGLE_CLIENT_ID to match
 * the backend's GOOGLE_CLIENT_ID; renders nothing if that's unset so the
 * rest of the auth form still works without it configured.
 */
export function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { loginWithGoogle } = useAuth()
  const [ready, setReady] = useState(false)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId) return
    let cancelled = false

    loadGoogleScript().then((loaded) => {
      if (cancelled || !loaded || !window.google || !containerRef.current) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            await loginWithGoogle(response.credential)
            onSuccess()
          } catch (err) {
            onError?.(getApiErrorMessage(err, 'Could not sign in with Google.'))
          }
        },
      })
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'pill',
      })
      setReady(true)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  if (!clientId) return null

  return (
    <div className="flex flex-col items-center">
      <div ref={containerRef} className={ready ? '' : 'h-11 w-[320px] animate-pulse rounded-full bg-surface-sunk'} />
    </div>
  )
}
