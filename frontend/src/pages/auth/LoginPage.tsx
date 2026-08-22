import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sprout } from 'lucide-react'
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
      setError(getApiErrorMessage(err, t('auth.couldNotLogIn')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Sprout className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl">{t('auth.login')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('auth.welcomeBack')}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
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
        {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          {t('auth.login')}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-100" />
        <span className="text-xs text-ink-400">{t('auth.orDivider')}</span>
        <div className="h-px flex-1 bg-ink-100" />
      </div>

      <GoogleSignInButton onSuccess={() => navigate(next)} onError={setError} />

      <p className="mt-6 text-center text-sm text-ink-500">
        {t('auth.newToAandata')}{' '}
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
}