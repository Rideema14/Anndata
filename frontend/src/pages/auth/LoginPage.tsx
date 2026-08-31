import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sprout,
} from 'lucide-react'

import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import { GoogleSignInButton } from '@/components/common/GoogleSignInButton'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { getApiErrorMessage } from '@/services/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

 return (
  <main className="min-h-[calc(100svh-64px)] w-full overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
    <div
      className="
        mx-auto
        grid
        h-full
        min-h-[calc(100svh-96px)]
        w-full
        max-w-[1180px]
        overflow-hidden
        rounded-[24px]
        bg-[#EFF1E9]
        shadow-[0_24px_70px_rgba(20,30,14,0.25)]
        lg:grid-cols-2
      "
    >

      {/* LEFT */}
      <section className="relative hidden bg-[#2B3621] lg:block">
        <div className="flex h-full flex-col justify-between px-10 py-9 xl:px-14">

          <Link to="/" className="flex w-fit items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#45572D] text-[#E3E9D8]">
              <Sprout className="h-[17px] w-[17px]" strokeWidth={1.8} />
            </span>

            <span className="text-sm font-semibold text-[#F1F3EB]">
              Anndata
            </span>
          </Link>

          <div className="max-w-[430px]">
            <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[#AAB991]">
              Smart agriculture
            </p>

            <h1 className="text-[clamp(42px,5vw,64px)] font-semibold leading-[0.92] tracking-[-0.06em] text-[#F3F5EE]">
              Farm
              <br />
              <span className="text-[#A7BA80]">
                smarter.
              </span>
            </h1>

            <p className="mt-6 max-w-[380px] text-[13px] leading-6 text-[#AEB7A1]">
              One intelligent platform for agricultural
              products, market insights and smarter
              farming decisions.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] text-[#C2CAB6]">
                Marketplace
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] text-[#C2CAB6]">
                AI insights
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] text-[#C2CAB6]">
                Market data
              </span>
            </div>
          </div>

          <span className="text-[9px] text-[#7F8B70]">
            Intelligent tools for modern agriculture
          </span>

        </div>
      </section>

      {/* RIGHT */}
      <section className="flex items-center justify-center bg-[#EFF1E9]">
        <div className="w-full max-w-[380px] px-6 py-8 sm:px-10">

          <div className="mb-7">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#657A3E]">
              Welcome back
            </p>

            <h2 className="text-[32px] font-semibold leading-none tracking-[-0.05em] text-[#283020]">
              {t('auth.login')}
            </h2>

            <p className="mt-3 text-xs text-[#7D8676]">
              {t('auth.welcomeBack')}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-0 top-[31px] h-[15px] w-[15px] text-[#657A45]" />

              <TextField
                id="email"
                label={t('auth.email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="
                  h-10
                  rounded-none
                  border-x-0
                  border-t-0
                  border-b-[#C9D0C0]
                  bg-transparent
                  pl-6
                  text-xs
                  shadow-none
                  focus:border-[#526A30]
                  focus:ring-0
                "
              />
            </div>

            <div className="relative mt-5">
              <LockKeyhole className="pointer-events-none absolute left-0 top-[31px] h-[15px] w-[15px] text-[#657A45]" />

              <TextField
                id="password"
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="
                  h-10
                  rounded-none
                  border-x-0
                  border-t-0
                  border-b-[#C9D0C0]
                  bg-transparent
                  pl-6
                  pr-9
                  text-xs
                  shadow-none
                  focus:border-[#526A30]
                  focus:ring-0
                "
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-[27px] flex h-7 w-7 items-center justify-center rounded-md text-[#899285] hover:bg-[#E1E5DC]"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div className="mt-2.5 flex justify-end">
              <Link
                to="/forgot-password"
                className="text-[10px] font-semibold text-[#687857] hover:underline"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-[10px] text-red-600">
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              className="
                mt-5
                h-10
                rounded-[9px]
                bg-[#405329]
                text-xs
                font-semibold
                text-white
                shadow-[0_6px_16px_rgba(64,83,41,0.18)]
                hover:bg-[#34461F]
              "
            >
              {t('auth.login')}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#D7DCD2]" />
            <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#9BA297]">
              {t('auth.orDivider')}
            </span>
            <span className="h-px flex-1 bg-[#D7DCD2]" />
          </div>

          <GoogleSignInButton
            onSuccess={() => navigate(next)}
            onError={setError}
          />

          <p className="mt-5 text-center text-[10px] text-[#858D80]">
            {t('auth.newToFarmVerse')}{' '}
            <Link
              to="/register"
              className="font-semibold text-[#536A31] hover:underline"
            >
              {t('auth.register')}
            </Link>
          </p>

        </div>
      </section>

    </div>
  </main>
)
}