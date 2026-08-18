import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { authService } from '@/services/authService'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

const OTP_LENGTH = 6

export default function OtpVerificationPage() {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loginWithPhone } = useAuth()
  const { t } = useLanguage()

  const phone = searchParams.get('phone') ?? ''
  const mode = searchParams.get('mode') // 'register' | 'reset' | null (login)
  const next = searchParams.get('next') ?? '/'

  function handleChange(index: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return
    const updated = [...digits]
    updated[index] = value
    setDigits(updated)
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const code = digits.join('')
    if (code.length < OTP_LENGTH) {
      setError('Enter the complete 6-digit code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (mode === 'reset') {
        const { requestId } = await authService.requestPasswordReset(phone)
        navigate(`/reset-password?requestId=${requestId}`)
        return
      }
      await authService.verifyOtp(phone, code)
      await loginWithPhone(phone)
      navigate(next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl">{t('auth.otp')}</h1>
        <p className="mt-1 text-sm text-ink-500">
          Enter the code sent to {phone ? <span className="font-medium text-ink-700">{phone}</span> : 'your phone'}
        </p>
        <p className="mt-1 text-xs text-ink-400">Demo mode — any 6 digits will work.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4 flex justify-center gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el
              }}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${index + 1}`}
              className="h-12 w-10 rounded-xl border border-ink-200 text-center text-lg font-semibold focus:border-brand-400"
            />
          ))}
        </div>
        {error && <p className="mb-3 text-center text-xs font-medium text-danger-500">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          {t('common.submit')}
        </Button>
      </form>
    </div>
  )
}
