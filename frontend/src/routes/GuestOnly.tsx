import { Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * Wraps the auth pages (login, register, forgot/reset password, OTP).
 * If a session is already active — including one just restored from a
 * stored refresh token on app load — there's no reason to show a login
 * form again, so this sends the person straight into the app instead.
 */
export function GuestOnly() {
  const { isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()

  if (isAuthenticated) {
    const next = searchParams.get('next') ?? '/home'
    return <Navigate to={next} replace />
  }

  return <Outlet />
}
