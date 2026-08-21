import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sprout, Loader2 } from 'lucide-react'

import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import { GoogleSignInButton } from '@/components/common/GoogleSignInButton'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { getApiErrorMessage } from '@/services/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { login } = useAuth()
  const { t } = useLanguage()

  const next = searchParams.get('next') ?? '/home'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!email.trim() || !password) return

    setError('')
    setLoading(true)

    try {
      await login(email.trim().toLowerCase(), password)
      navigate(next)
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          t('auth.couldNotLogIn'),
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleStart() {
    setError('')
    setGoogleLoading(true)
  }

  function handleGoogleSuccess() {
    navigate(next)
  }

  function handleGoogleError(message: string) {
    setGoogleLoading(false)
    setError(message)
  }

  /*
   * ============================================================
   * GOOGLE LOGIN LOADING SCREEN
   * ============================================================
   */
  if (googleLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-[#F8F7F2] px-6">
        <div className="flex w-full max-w-sm flex-col items-center text-center">

          {/* Logo / icon */}
          <div
            className="
              relative
              mb-7
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-[22px]
              bg-brand-50
              text-brand-600
              shadow-[0_12px_35px_rgba(43,48,36,0.10)]
            "
          >
            <span
              className="
                absolute
                inset-0
                animate-ping
                rounded-[22px]
                bg-brand-200/40
              "
            />

            <Sprout
              className="relative z-10 h-7 w-7"
              strokeWidth={2}
            />
          </div>

          {/* Spinner */}
          <div className="mb-5 flex items-center justify-center">
            <Loader2
              className="
                h-7
                w-7
                animate-spin
                text-brand-600
              "
              strokeWidth={2}
            />
          </div>

          <h1
            className="
              text-lg
              font-semibold
              tracking-[-0.02em]
              text-ink-900
            "
          >
            Signing you in
          </h1>

          <p
            className="
              mt-2
              max-w-xs
              text-sm
              leading-6
              text-ink-500
            "
          >
            Please wait while we securely connect your Google account
            to Aandata.
          </p>

          {/* Animated loading bar */}
          <div
            className="
              mt-7
              h-1
              w-44
              overflow-hidden
              rounded-full
              bg-ink-100
            "
          >
            <div
              className="
                h-full
                w-1/2
                animate-[loading_1.2s_ease-in-out_infinite]
                rounded-full
                bg-brand-600
              "
            />
          </div>

        </div>

        <style>
          {`
            @keyframes loading {
              0% {
                transform: translateX(-120%);
              }
              50% {
                transform: translateX(100%);
              }
              100% {
                transform: translateX(250%);
              }
            }
          `}
        </style>
      </div>
    )
  }

  return (
    <div>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col items-center text-center">

        <span
          className="
            mb-3
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            bg-brand-50
            text-brand-600
          "
        >
          <Sprout
            className="h-6 w-6"
            aria-hidden="true"
          />
        </span>

        <h1 className="text-xl">
          {t('auth.login')}
        </h1>

        <p className="mt-1 text-sm text-ink-500">
          {t('auth.welcomeBack')}
        </p>

      </div>


      {/* ======================================================
          EMAIL / PASSWORD LOGIN
      ====================================================== */}

      <form
        onSubmit={handleSubmit}
        noValidate
      >

        <TextField
          id="email"
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <TextField
          id="password"
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="mb-3 text-xs font-medium text-danger-500">
            {error}
          </p>
        )}

        <Button
          type="submit"
          fullWidth
          loading={loading}
        >
          {t('auth.login')}
        </Button>

      </form>


      {/* ======================================================
          DIVIDER
      ====================================================== */}

      <div className="my-5 flex items-center gap-3">

        <div className="h-px flex-1 bg-ink-100" />

        <span className="text-xs text-ink-400">
          {t('auth.orDivider')}
        </span>

        <div className="h-px flex-1 bg-ink-100" />

      </div>


      {/* ======================================================
          GOOGLE LOGIN
      ====================================================== */}

      <GoogleSignInButton
        onStart={handleGoogleStart}
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
      />


      {/* ======================================================
          REGISTER
      ====================================================== */}

      <p className="mt-6 text-center text-sm text-ink-500">

        {t('auth.newToAandata')}{' '}

        <Link
          to="/register"
          className="
            font-semibold
            text-brand-600
            hover:underline
          "
        >
          {t('auth.register')}
        </Link>

      </p>


      {/* ======================================================
          FORGOT PASSWORD
      ====================================================== */}

      <p className="mt-2 text-center text-sm">

        <Link
          to="/forgot-password"
          className="
            text-ink-400
            hover:underline
          "
        >
          {t('auth.forgotPassword')}
        </Link>

      </p>

    </div>
  )
}