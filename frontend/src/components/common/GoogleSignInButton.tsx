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

export function GoogleSignInButton({
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { loginWithGoogle } = useAuth()

  const [ready, setReady] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

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

      window.google.accounts.id.initialize({
        client_id: clientId,

        callback: async (response) => {
          // Start loading immediately after Google returns the credential
          setIsSigningIn(true)

          try {
            // Your existing backend login
            await loginWithGoogle(response.credential)

            // Redirect / success callback
            onSuccess()
          } catch (err) {
            onError?.(
              getApiErrorMessage(
                err,
                'Could not sign in with Google.',
              ),
            )
          } finally {
            setIsSigningIn(false)
          }
        },
      })

      window.google.accounts.id.renderButton(
        containerRef.current,
        {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          // Google's button width is a hard pixel number, not a CSS unit, so
          // it can't be set responsively via className. Read the container's
          // actual rendered width (which itself IS responsive — see the
          // wrapper's `w-full max-w-[320px]` below) instead of hardcoding
          // 320, so the button doesn't overflow narrow phones (e.g. 320px
          // viewports where 320px of button plus page padding overflows).
          width: Math.min(320, containerRef.current.offsetWidth || 320),
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

  if (!clientId) return null

  return (
    <>
      {/* Google Button */}
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[320px]">
          <div
            ref={containerRef}
            className={
              ready
                ? ''
                : 'h-11 w-full animate-pulse rounded-full bg-surface-sunk'
            }
            aria-hidden={isSigningIn}
          />

          {/* Google login loading overlay */}
          {isSigningIn && (
            <div
              role="status"
              aria-live="polite"
              className="
                absolute inset-0
                z-20
                flex items-center justify-center
                gap-3
                rounded-full
                bg-surface/95
                backdrop-blur-sm
              "
            >
              <span
                className="
                  h-5 w-5
                  animate-spin
                  rounded-full
                  border-2
                  border-brand-200
                  border-t-brand-600
                "
                aria-hidden="true"
              />

              <span className="text-sm font-semibold text-ink-700">
                Signing you in…
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen loading screen */}
      {isSigningIn && (
        <div
          className="
            fixed inset-0
            z-[9999]
            flex items-center justify-center
            bg-black/20
            backdrop-blur-sm
          "
          role="status"
          aria-live="polite"
        >
          <div
            className="
              flex min-w-[280px]
              flex-col items-center
              rounded-2xl
              bg-surface
              px-8 py-7
              shadow-2xl
            "
          >
            {/* Spinner */}
            <div
              className="
                mb-4
                h-10 w-10
                animate-spin
                rounded-full
                border-4
                border-brand-200
                border-t-brand-600
              "
            />

            {/* Title */}
            <p className="text-base font-semibold text-ink-900">
              Signing you in
            </p>

            {/* Description */}
            <p className="mt-1 text-center text-sm text-ink-500">
              Please wait while we securely sign you in…
            </p>
          </div>
        </div>
      )}
    </>
  )
}

