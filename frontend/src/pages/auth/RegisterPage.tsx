import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  Leaf,
  Mail,
  Phone,
  ShieldCheck,
  Sprout,
  User,
} from 'lucide-react'

import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import { GoogleSignInButton } from '@/components/common/GoogleSignInButton'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { getApiErrorMessage } from '@/services/api'

/** Shared "underlined, icon-led" input treatment — kept in one place so Login and Register can never drift apart again. */
const fieldInputClass = `
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
`

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { register } = useAuth()
  const { t } = useLanguage()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !email.trim() || !password) return

    setError('')
    setNotice('')
    setLoading(true)

    try {
      const cleanedPhone = phone.replace(/[^\d+]/g, '')
      const { email: confirmedEmail, emailSent } = await register(
        name.trim(),
        email.trim().toLowerCase(),
        password,
        cleanedPhone || undefined,
      )

      // The account is created either way — a slow/broken mail provider is
      // not the user's problem, so this never blocks moving forward. We just
      // let them know the code might be late and that Resend is right there.
      if (!emailSent) {
        setNotice(
          "We created your account, but the verification email is delayed. Use \"Resend Code\" on the next screen if it doesn't arrive shortly.",
        )
      }

      navigate(
        `/otp-verification?email=${encodeURIComponent(confirmedEmail)}&mode=register&next=${encodeURIComponent('/home')}`,
      )
    } catch (err) {
      setError(getApiErrorMessage(err, t('auth.couldNotCreateAccount')))
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
        {/* LEFT — brand panel, hidden on mobile, mirrors LoginPage exactly for a consistent auth experience */}
        <section className="relative hidden bg-[#2B3621] lg:block">
          <div className="flex h-full flex-col justify-between px-10 py-9 xl:px-14">
            <Link to="/" className="flex w-fit items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#45572D] text-[#E3E9D8]">
                <Sprout className="h-[17px] w-[17px]" strokeWidth={1.8} />
              </span>
              <span className="text-sm font-semibold text-[#F1F3EB]">FarmVerse</span>
            </Link>

            <div className="max-w-[430px]">
              <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[#AAB991]">
                Join the community
              </p>

              <h1 className="text-[clamp(38px,4.6vw,58px)] font-semibold leading-[0.95] tracking-[-0.06em] text-[#F3F5EE]">
                Grow with
                <br />
                <span className="text-[#A7BA80]">confidence.</span>
              </h1>

              <p className="mt-6 max-w-[380px] text-[13px] leading-6 text-[#AEB7A1]">
                Create your free account to buy and sell agricultural
                products, track market prices, and get AI-powered farming
                guidance — all in one place.
              </p>

              <ul className="mt-7 space-y-2.5">
                <li className="flex items-center gap-2.5 text-[11px] text-[#C2CAB6]">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#A7BA80]" />
                  Verified sellers and secure payments
                </li>
                <li className="flex items-center gap-2.5 text-[11px] text-[#C2CAB6]">
                  <Leaf className="h-3.5 w-3.5 shrink-0 text-[#A7BA80]" />
                  Real-time mandi prices and crop insights
                </li>
              </ul>
            </div>

            <span className="text-[9px] text-[#7F8B70]">
              Intelligent tools for modern agriculture
            </span>
          </div>
        </section>

        {/* RIGHT — form panel */}
        <section className="flex items-center justify-center overflow-y-auto bg-[#EFF1E9] py-8">
          <div className="w-full max-w-[380px] px-6 sm:px-10">
            <div className="mb-6">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#657A3E]">
                Get started
              </p>
              <h2 className="text-[32px] font-semibold leading-none tracking-[-0.05em] text-[#283020]">
                {t('auth.register')}
              </h2>
              <p className="mt-3 text-xs text-[#7D8676]">{t('auth.oneAccountTagline')}</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="relative">
                <User className="pointer-events-none absolute left-0 top-[31px] h-[15px] w-[15px] text-[#657A45]" />
                <TextField
                  id="name"
                  label={t('auth.fullName')}
                  placeholder="Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={fieldInputClass}
                />
              </div>

              <div className="relative mt-5">
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
                  className={fieldInputClass}
                />
              </div>

              <div className="relative mt-5">
                <Phone className="pointer-events-none absolute left-0 top-[31px] h-[15px] w-[15px] text-[#657A45]" />
                <TextField
                  id="phone"
                  label={t('auth.phoneOptional')}
                  type="tel"
                  inputMode="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={fieldInputClass}
                />
              </div>

              <div className="relative mt-5">
                <ShieldCheck className="pointer-events-none absolute left-0 top-[31px] h-[15px] w-[15px] text-[#657A45]" />
                <TextField
                  id="password"
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  hint={t('auth.passwordHint')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${fieldInputClass} pr-9`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-[27px] flex h-7 w-7 items-center justify-center rounded-md text-[#899285] hover:bg-[#E1E5DC]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-[10px] text-red-600">{error}</p>
                </div>
              )}

              {notice && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <p className="text-[10px] leading-4 text-amber-700">{notice}</p>
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
                {t('common.continue')}
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

            <GoogleSignInButton onSuccess={() => navigate('/home')} onError={setError} />

            <p className="mt-5 text-center text-[10px] text-[#858D80]">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/login" className="font-semibold text-[#536A31] hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
