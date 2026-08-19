import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '@/services/authService'
import type { Address, User } from '@/types'

type EditableProfileFields = Pick<User, 'name' | 'phone' | 'email' | 'location'>

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isBuyer: boolean
  isSeller: boolean
  isAdmin: boolean
  loginWithPhone: (phone: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (fields: Partial<EditableProfileFields>) => void
  addAddress: (address: Omit<Address, 'id'>) => void
  updateAddress: (id: string, fields: Partial<Omit<Address, 'id'>>) => void
  removeAddress: (id: string) => void
  setDefaultAddress: (id: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isBuyer: !!user?.roles.includes('buyer'),
      isSeller: !!user?.roles.includes('seller'),
      isAdmin: !!user?.roles.includes('admin'),
      loginWithPhone: async (phone: string) => {
        const { user: loggedIn } = await authService.loginWithPhone(phone)
        setUser(loggedIn)
      },
      loginWithGoogle: async () => {
        const { user: loggedIn } = await authService.loginWithGoogle()
        setUser(loggedIn)
      },
      logout: async () => {
        await authService.logout()
        setUser(null)
      },
      updateProfile,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
    }),
    [user, isLoading, updateProfile, addAddress, updateAddress, removeAddress, setDefaultAddress],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
