import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
<<<<<<< HEAD
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { getApiErrorMessage } from '@/services/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      setError(getApiErrorMessage(err, 'Could not log in. Check your email and password.'))
    } finally {
      setLoading(false)
    }
=======
import { GoogleGlyph } from '@/components/common/GoogleGlyph'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loginWithGoogle } = useAuth()
  const { t } = useLanguage()
  const next = searchParams.get('next') ?? '/home'

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (phone.trim().length < 10) return
    navigate(`/otp-verification?phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(next)}`)
  }

  async function handleGoogle() {
    setLoading(true)
    await loginWithGoogle()
    navigate(next)
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Sprout className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl">{t('auth.login')}</h1>
        <p className="mt-1 text-sm text-ink-500">Welcome back to Aandata.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <TextField
<<<<<<< HEAD
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          {t('auth.login')}
        </Button>
      </form>

=======
          id="phone"
          label={t('auth.phoneNumber')}
          type="tel"
          inputMode="tel"
          placeholder="98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <Button type="submit" fullWidth>
          {t('common.continue')}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-100" />
        or
        <span className="h-px flex-1 bg-ink-100" />
      </div>

      <Button variant="secondary" fullWidth onClick={handleGoogle} loading={loading}>
        <GoogleGlyph className="h-4 w-4" />
        {t('auth.continueWithGoogle')}
      </Button>

>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
      <p className="mt-6 text-center text-sm text-ink-500">
        New to Aandata?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline">
          {t('auth.register')}
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link to="/forgot-password" className="text-ink-400 hover:underline">
          {t('auth.forgotPassword')}
        </Link>
      </p>
    </div>
  )
<<<<<<< HEAD
}
=======
}
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
