import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService, addressService } from '@/services/authService'
import type { Address, User } from '@/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isBuyer: boolean
  isSeller: boolean
  isAdmin: boolean
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ email: string; emailSent: boolean; message: string }>
  verifyOtp: (email: string, otp: string) => Promise<void>
  resendOtp: (email: string, purpose?: 'REGISTER' | 'RESET_PASSWORD') => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (fields: { name?: string; phone?: string }) => Promise<void>
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>
  updateAddress: (id: string, fields: Partial<Omit<Address, 'id'>>) => Promise<void>
  removeAddress: (id: string) => Promise<void>
  setDefaultAddress: (id: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const current = await authService.getCurrentUser()
    setUser(current)
  }, [])

  useEffect(() => {
    let cancelled = false
    authService.getCurrentUser().then((current) => {
      if (!cancelled) {
        setUser(current)
        setIsLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isBuyer: !!user?.roles.includes('buyer'),
      isSeller: !!user?.roles.includes('seller'),
      isAdmin: !!user?.roles.includes('admin'),

      register: (name, email, password, phone) => authService.register(name, email, password, phone),

      verifyOtp: async (email, otp) => {
        const { user: verified } = await authService.verifyRegistrationOtp(email, otp)
        setUser(verified)
      },

      resendOtp: (email, purpose = 'REGISTER') => authService.resendOtp(email, purpose),

      login: async (email, password) => {
        const { user: loggedIn } = await authService.login(email, password)
        setUser(loggedIn)
      },

      loginWithGoogle: async (idToken) => {
        const { user: loggedIn } = await authService.loginWithGoogle(idToken)
        setUser(loggedIn)
      },

      forgotPassword: (email) => authService.forgotPassword(email),

      resetPassword: (email, otp, newPassword) => authService.resetPassword(email, otp, newPassword),

      logout: async () => {
        await authService.logout()
        setUser(null)
      },

      updateProfile: async (fields) => {
        const updated = await authService.updateProfile(fields)
        setUser(updated)
      },

      addAddress: async (address) => {
        await addressService.create(address)
        await refreshUser()
      },

      updateAddress: async (id, fields) => {
        await addressService.update(id, fields)
        await refreshUser()
      },

      removeAddress: async (id) => {
        await addressService.remove(id)
        await refreshUser()
      },

      setDefaultAddress: async (id) => {
        await addressService.update(id, { isDefault: true })
        await refreshUser()
      },

      refreshUser,
    }),
    [user, isLoading, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
