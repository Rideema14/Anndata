import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { getApiErrorMessage } from '@/services/api'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()
  const { t } = useLanguage()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !email.trim() || !password) return
    setError('')
    setLoading(true)
    try {
      const cleanedPhone = phone.replace(/[^\d+]/g, '')
      const { email: confirmedEmail } = await register(name.trim(), email.trim().toLowerCase(), password, cleanedPhone || undefined)
      navigate(`/otp-verification?email=${encodeURIComponent(confirmedEmail)}&mode=register&next=${encodeURIComponent('/home')}`)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create your account.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <UserPlus className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl">{t('auth.register')}</h1>
        <p className="mt-1 text-sm text-ink-500">One account for buying and selling.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <TextField id="name" label="Full Name" placeholder="Rajesh Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextField
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
          id="phone"
          label={`${t('auth.phoneNumber')} (optional)`}
          type="tel"
          inputMode="tel"
          placeholder="98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with an uppercase letter, a lowercase letter, and a number."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          {t('common.continue')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          {t('auth.login')}
        </Link>
      </p>
    </div>
  )
}
