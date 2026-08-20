import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
<<<<<<< HEAD
import { authService, addressService } from '@/services/authService'
import type { Address, User } from '@/types'

=======
import { authService } from '@/services/authService'
import type { Address, User } from '@/types'

type EditableProfileFields = Pick<User, 'name' | 'phone' | 'email' | 'location'>

>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isBuyer: boolean
  isSeller: boolean
  isAdmin: boolean
<<<<<<< HEAD
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ email: string }>
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
=======
  loginWithPhone: (phone: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (fields: Partial<EditableProfileFields>) => void
  addAddress: (address: Omit<Address, 'id'>) => void
  updateAddress: (id: string, fields: Partial<Omit<Address, 'id'>>) => void
  removeAddress: (id: string) => void
  setDefaultAddress: (id: string) => void
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

<<<<<<< HEAD
  const refreshUser = useCallback(async () => {
    const current = await authService.getCurrentUser()
    setUser(current)
  }, [])

=======
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
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

<<<<<<< HEAD
=======
  const updateProfile = useCallback((fields: Partial<EditableProfileFields>) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev))
  }, [])

  const addAddress = useCallback((address: Omit<Address, 'id'>) => {
    setUser((prev) => {
      if (!prev) return prev
      const id = `addr_${Date.now()}`
      // If this is the first address, or marked default, unset default on the rest.
      const shouldBeDefault = address.isDefault || prev.addresses.length === 0
      const addresses = shouldBeDefault
        ? prev.addresses.map((a) => ({ ...a, isDefault: false }))
        : prev.addresses
      return { ...prev, addresses: [...addresses, { ...address, id, isDefault: shouldBeDefault }] }
    })
  }, [])

  const updateAddress = useCallback((id: string, fields: Partial<Omit<Address, 'id'>>) => {
    setUser((prev) => {
      if (!prev) return prev
      let addresses = prev.addresses.map((a) => (a.id === id ? { ...a, ...fields } : a))
      if (fields.isDefault) {
        addresses = addresses.map((a) => (a.id === id ? a : { ...a, isDefault: false }))
      }
      return { ...prev, addresses }
    })
  }, [])

  const removeAddress = useCallback((id: string) => {
    setUser((prev) => {
      if (!prev) return prev
      const wasDefault = prev.addresses.find((a) => a.id === id)?.isDefault
      let addresses = prev.addresses.filter((a) => a.id !== id)
      if (wasDefault && addresses.length > 0) {
        addresses = addresses.map((a, i) => (i === 0 ? { ...a, isDefault: true } : a))
      }
      return { ...prev, addresses }
    })
  }, [])

  const setDefaultAddress = useCallback((id: string) => {
    setUser((prev) => {
      if (!prev) return prev
      return { ...prev, addresses: prev.addresses.map((a) => ({ ...a, isDefault: a.id === id })) }
    })
  }, [])

>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isBuyer: !!user?.roles.includes('buyer'),
      isSeller: !!user?.roles.includes('seller'),
      isAdmin: !!user?.roles.includes('admin'),
<<<<<<< HEAD

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

=======
      loginWithPhone: async (phone: string) => {
        const { user: loggedIn } = await authService.loginWithPhone(phone)
        setUser(loggedIn)
      },
      loginWithGoogle: async () => {
        const { user: loggedIn } = await authService.loginWithGoogle()
        setUser(loggedIn)
      },
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
      logout: async () => {
        await authService.logout()
        setUser(null)
      },
<<<<<<< HEAD

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
=======
      updateProfile,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
    }),
    [user, isLoading, updateProfile, addAddress, updateAddress, removeAddress, setDefaultAddress],
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
