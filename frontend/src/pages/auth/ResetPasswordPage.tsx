import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import { useAuth } from '@/context/AuthContext'
import { getApiErrorMessage } from '@/services/api'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  const email = searchParams.get('email') ?? ''
  const otp = searchParams.get('otp') ?? ''

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters, with an uppercase letter, a lowercase letter, and a number.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await resetPassword(email, otp, password)
      setDone(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not reset your password.'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl">Password updated</h1>
        <p className="mt-1 text-sm text-ink-500">You can now log in with your new password.</p>
        <Button className="mt-6" onClick={() => navigate('/login')}>
          Go to Log In
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl">Set a new password</h1>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <TextField id="password" label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <TextField id="confirm" label="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          Update Password
        </Button>
      </form>
    </div>
  )
}
