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
            callback: (response: {
              credential: string
            }) => void
          }) => void

          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void
        }
      }
    }
  }
}

let scriptPromise: Promise<boolean> | null = null

function loadGoogleScript(): Promise<boolean> {
  if (window.google?.accounts?.id) {
    return Promise.resolve(true)
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const script = document.createElement('script')

      script.src =
        'https://accounts.google.com/gsi/client'

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
  onStart?: () => void
  onSuccess: () => void
  onError?: (message: string) => void
}

/**
 * Google Sign-In button.
 *
 * onStart is called immediately after Google returns a credential,
 * before the backend authentication request starts.
 */
export function GoogleSignInButton({
  onStart,
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { loginWithGoogle } = useAuth()

  const [ready, setReady] = useState(false)

  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId) return

    let cancelled = false

    loadGoogleScript().then((loaded) => {
      if (
        cancelled ||
        !loaded ||
        !window.google ||
        !containerRef.current
      ) {
        return
      }

      /*
       * Clear any previous Google button.
       * This prevents duplicate buttons during development
       * / React StrictMode remounts.
       */
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }

      window.google.accounts.id.initialize({
        client_id: clientId,

        callback: async (response) => {
          /*
           * Start our loading screen immediately.
           */
          onStart?.()

          try {
            /*
             * Send Google credential to backend.
             */
            await loginWithGoogle(
              response.credential,
            )

            /*
             * Authentication succeeded.
             */
            onSuccess()
          } catch (err) {
            /*
             * Authentication failed.
             */
            onError?.(
              getApiErrorMessage(
                err,
                'Could not sign in with Google.',
              ),
            )
          }
        },
      })

      window.google.accounts.id.renderButton(
        containerRef.current,
        {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'pill',
        },
      )

      setReady(true)
    })

    return () => {
      cancelled = true
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  if (!clientId) {
    return null
  }

  return (
    <div className="flex flex-col items-center">

      {!ready && (
        <div
          className="
            h-11
            w-[320px]
            animate-pulse
            rounded-full
            bg-surface-sunk
          "
        />
      )}

      <div
        ref={containerRef}
        className={ready ? '' : 'hidden'}
      />

    </div>
  )
}