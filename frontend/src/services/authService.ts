import { simulateRequest } from './api'
import { defaultMockUser, mockUsers } from '@/data/mock/mockUsers'
import type { User } from '@/types'

const SESSION_KEY = 'aandata.session.userId'

/**
 * Mock authentication service. No real JWT is issued — a fake token string
 * is stored so the rest of the app (Axios interceptor, route guards) can be
 * built against the *shape* of a real session today.
 *
 * Backend integration point: replace the bodies below with
 *   POST /auth/login          (phone + password or OTP)
 *   POST /auth/register
 *   POST /auth/otp/request
 *   POST /auth/otp/verify
 *   POST /auth/google
 *   GET  /auth/me
 * Endpoint names are not final — see docs/API_INTEGRATION.md.
 */
export const authService = {
  async getCurrentUser(): Promise<User | null> {
    const id = window.localStorage.getItem(SESSION_KEY)
    if (!id) return null
    const user = mockUsers.find((u) => u.id === id) ?? null
    return simulateRequest(user, 200)
  },

  async loginWithPhone(_phone: string): Promise<{ user: User; token: string }> {
    const user = defaultMockUser
    window.localStorage.setItem(SESSION_KEY, user.id)
    window.localStorage.setItem('aandata.authToken', 'mock-token')
    return simulateRequest({ user, token: 'mock-token' })
  },

  async loginWithGoogle(): Promise<{ user: User; token: string }> {
    return this.loginWithPhone('')
  },

  /** OTP is mocked — any 4-6 digit code succeeds. Real endpoint: POST /auth/otp/verify */
  async verifyOtp(_phone: string, _otp: string): Promise<{ user: User; token: string }> {
    return this.loginWithPhone(_phone)
  },

  async register(_name: string, _phone: string): Promise<{ user: User; token: string }> {
    return this.loginWithPhone(_phone)
  },

  async requestPasswordReset(_phone: string): Promise<{ requestId: string }> {
    return simulateRequest({ requestId: 'mock-reset-request' }, 400)
  },

  async resetPassword(_requestId: string, _newPassword: string): Promise<void> {
    return simulateRequest(undefined, 400)
  },

  async logout(): Promise<void> {
    window.localStorage.removeItem(SESSION_KEY)
    window.localStorage.removeItem('aandata.authToken')
    return simulateRequest(undefined, 150)
  },
}
