import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
<<<<<<< HEAD
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { getApiErrorMessage } from '@/services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()
  const { t } = useLanguage()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!email.trim()) return
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email.trim().toLowerCase())
      navigate(`/otp-verification?email=${encodeURIComponent(email.trim().toLowerCase())}&mode=reset`)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
=======
import { useLanguage } from '@/context/LanguageContext'

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('')
  const navigate = useNavigate()
  const { t } = useLanguage()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (phone.trim().length < 10) return
    navigate(`/otp-verification?phone=${encodeURIComponent(phone)}&mode=reset`)
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl">{t('auth.forgotPassword')}</h1>
<<<<<<< HEAD
        <p className="mt-1 text-sm text-ink-500">We'll email you a code to reset your password.</p>
=======
        <p className="mt-1 text-sm text-ink-500">We'll send a code to reset your password.</p>
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
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
        {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
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
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
          {t('common.continue')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          {t('common.back')} to {t('auth.login')}
        </Link>
      </p>
    </div>
  )
}
