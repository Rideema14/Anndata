
import { api, setSessionTokens, clearSessionTokens, getRefreshToken } from './api'
import type { Address, User } from '@/types'

/** Shape returned by the backend for a user record (see authService.sanitizeUser on the server). */
interface BackendUser {
  id: string
  name: string
  email: string
  phone?: string | null
  role: 'BUYER' | 'SELLER' | 'ADMIN'
  authProvider: 'LOCAL' | 'GOOGLE'
  profileImage?: string | null
  isEmailVerified: boolean
  isActive: boolean
  latitude?: number | null
  longitude?: number | null
  createdAt: string
}

interface BackendAddress {
  id: string
  label: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  postalCode: string
  country: string
  latitude?: number | null
  longitude?: number | null
  isDefault: boolean
}

export function mapAddress(a: BackendAddress): Address {
  return {
    id: a.id,
    label: a.label,
    line1: a.addressLine1,
    line2: a.addressLine2 ?? undefined,
    city: a.city,
    state: a.state,
    pincode: a.postalCode,
    isDefault: a.isDefault,
    fullName: a.fullName,
    phone: a.phone,
    country: a.country,
    latitude: a.latitude ?? undefined,
    longitude: a.longitude ?? undefined,
  }
}

function mapUser(u: BackendUser, addresses: Address[] = []): User {
  const roles: User['roles'] = [u.role === 'ADMIN' ? 'admin' : u.role === 'SELLER' ? 'seller' : 'buyer']
  if (u.role !== 'BUYER') roles.unshift('buyer') // sellers/admins can still buy — one account, multiple capabilities
  return {
    id: u.id,
    name: u.name,
    phone: u.phone ?? '',
    email: u.email,
    avatarUrl: u.profileImage ?? undefined,
    location: addresses.find((a) => a.isDefault)?.city ?? addresses[0]?.city ?? '',
    language: 'en',
    roles: Array.from(new Set(roles)),
    sellerVerification: u.role === 'SELLER' ? 'verified' : 'none',
    addresses,
    createdAt: u.createdAt,
  }
}

interface TokenPair {
  accessToken: string
  refreshToken: string
}

async function fetchAddresses(): Promise<Address[]> {
  try {
    const res = await api.get<{ data: BackendAddress[] }>('/users/me/addresses')
    return res.data.data.map(mapAddress)
  } catch {
    return []
  }
}

async function hydrateSession(backendUser: BackendUser, tokens: TokenPair): Promise<{ user: User; token: string }> {
  setSessionTokens(tokens.accessToken, tokens.refreshToken)
  const addresses = await fetchAddresses()
  return { user: mapUser(backendUser, addresses), token: tokens.accessToken }
}

export const authService = {
  /** Called once on app load to restore a session from a stored token, if any. */
  async getCurrentUser(): Promise<User | null> {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return null
    try {
      const res = await api.get<{ data: BackendUser }>('/auth/me')
      const addresses = await fetchAddresses()
      return mapUser(res.data.data, addresses)
    } catch {
      clearSessionTokens()
      return null
    }
  },

  /** POST /auth/register — sends an email OTP; account isn't usable until verify-otp succeeds. */
  async register(name: string, email: string, password: string, phone?: string): Promise<{ email: string; emailSent: boolean; message: string }> {
    const res = await api.post<{ data: { email: string; emailSent: boolean }; message: string }>('/auth/register', { name, email, password, phone })
    return { ...res.data.data, message: res.data.message }
  },

  /** POST /auth/verify-otp — completes registration and logs the user in. */
  async verifyRegistrationOtp(email: string, otp: string): Promise<{ user: User; token: string }> {
    const res = await api.post<{ data: { user: BackendUser } & TokenPair }>('/auth/verify-otp', {
      email,
      otp,
      purpose: 'REGISTER',
    })
    return hydrateSession(res.data.data.user, res.data.data)
  },

  async resendOtp(email: string, purpose: 'REGISTER' | 'RESET_PASSWORD' = 'REGISTER'): Promise<void> {
    await api.post('/auth/resend-otp', { email, purpose })
  },

  /** POST /auth/login — email + password. */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await api.post<{ data: { user: BackendUser } & TokenPair }>('/auth/login', { email, password })
    return hydrateSession(res.data.data.user, res.data.data)
  },

  /** POST /auth/google — expects a Google Sign-In idToken from the frontend's Google button integration. */
  async loginWithGoogle(idToken: string): Promise<{ user: User; token: string }> {
    const res = await api.post<{ data: { user: BackendUser } & TokenPair }>('/auth/google', { idToken })
    return hydrateSession(res.data.data.user, res.data.data)
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email })
  },

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { email, otp, newPassword })
  },

  async logout(): Promise<void> {
    const refreshToken = getRefreshToken()
    try {
      await api.post('/auth/logout', { refreshToken })
    } finally {
      clearSessionTokens()
    }
  },

  async updateProfile(fields: { name?: string; phone?: string; latitude?: number; longitude?: number }): Promise<User> {
    const res = await api.patch<{ data: BackendUser }>('/users/me', fields)
    const addresses = await fetchAddresses()
    return mapUser(res.data.data, addresses)
  },

  async uploadProfileImage(file: File): Promise<string> {
    const form = new FormData()
    form.append('image', file)
    const res = await api.post<{ data: BackendUser }>('/users/me/image', form)
    return res.data.data.profileImage ?? ''
  },
}

export const addressService = {
  async list(): Promise<Address[]> {
    return fetchAddresses()
  },

  async create(address: Omit<Address, 'id'>): Promise<Address> {
    const res = await api.post<{ data: BackendAddress }>('/users/me/addresses', {
      label: address.label,
      fullName: address.fullName ?? address.label,
      phone: address.phone ?? '',
      addressLine1: address.line1,
      addressLine2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.pincode,
      country: address.country ?? 'India',
      latitude: address.latitude,
      longitude: address.longitude,
      isDefault: address.isDefault,
    })
    return mapAddress(res.data.data)
  },

  async update(id: string, fields: Partial<Omit<Address, 'id'>>): Promise<Address> {
    const res = await api.patch<{ data: BackendAddress }>(`/users/me/addresses/${id}`, {
      ...(fields.label !== undefined && { label: fields.label }),
      ...(fields.fullName !== undefined && { fullName: fields.fullName }),
      ...(fields.phone !== undefined && { phone: fields.phone }),
      ...(fields.line1 !== undefined && { addressLine1: fields.line1 }),
      ...(fields.line2 !== undefined && { addressLine2: fields.line2 }),
      ...(fields.city !== undefined && { city: fields.city }),
      ...(fields.state !== undefined && { state: fields.state }),
      ...(fields.pincode !== undefined && { postalCode: fields.pincode }),
      ...(fields.country !== undefined && { country: fields.country }),
      ...(fields.isDefault !== undefined && { isDefault: fields.isDefault }),
    })
    return mapAddress(res.data.data)
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/users/me/addresses/${id}`)

  },
}
