import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import { useLanguage } from '@/context/LanguageContext'

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('')
  const navigate = useNavigate()
  const { t } = useLanguage()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (phone.trim().length < 10) return
    navigate(`/otp-verification?phone=${encodeURIComponent(phone)}&mode=reset`)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl">{t('auth.forgotPassword')}</h1>
        <p className="mt-1 text-sm text-ink-500">We'll send a code to reset your password.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <TextField
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

      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          {t('common.back')} to {t('auth.login')}
        </Link>
      </p>
    </div>
  )
}
