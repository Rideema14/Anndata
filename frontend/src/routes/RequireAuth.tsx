import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * Wraps every logged-in-only route (see AppRouter). If there's no active
 * session it bounces straight to /login, remembering where the person was
 * headed via ?next= so LoginPage can send them back after they sign in.
 *
 * By the time this renders, App's top-level AuthGate has already resolved
 * `isLoading`, so this only ever has to react to `isAuthenticated`. That
 * also means logout "just works" everywhere: the moment AuthContext clears
 * the user, isAuthenticated flips to false, this re-renders, and the whole
 * protected subtree is swapped for a redirect to /login automatically.
 */
export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  return <Outlet />
}
