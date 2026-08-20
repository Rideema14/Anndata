import axios, { AxiosError } from 'axios'

/**
 * Central Axios instance. Every service module (authService, productService,
 * etc.) imports `api` from here so base URL, headers, and interceptors stay
 * in one place.
 *
 * Backend integration status: auth, categories, products, reviews, wishlist,
 * cart, orders, and payments are wired to the real API (see the matching
 * service files). Features the backend doesn't implement yet (land,
 * machinery, mandi, weather, AI, seeds, notifications, seller/admin tools)
 * still resolve mock data via simulateRequest() below until a backend module
 * exists for them.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const ACCESS_TOKEN_KEY = 'aandata.authToken'
const REFRESH_TOKEN_KEY = 'aandata.refreshToken'

export function getAccessToken(): string | null {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setSessionTokens(accessToken: string, refreshToken: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearSessionTokens(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * On a 401 (expired access token), try exactly once to exchange the refresh
 * token for a new pair and replay the original request. If that fails too,
 * the session is dead — clear it and let the error propagate so route
 * guards / AuthContext can react.
 */
let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
      .then((res) => {
        const { accessToken, refreshToken: nextRefreshToken } = res.data.data
        setSessionTokens(accessToken, nextRefreshToken)
        return accessToken as string
      })
      .catch(() => {
        clearSessionTokens()
        return null
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined
    const status = error.response?.status

    if (status === 401 && original && !original._retried && !original.url?.includes('/auth/')) {
      original._retried = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return api.request(original)
      }
    }
    return Promise.reject(error)
  },
)

/** Pulls a readable message out of a failed Axios request, matching the backend's { success:false, message } shape. */
/**
 * Pulls a readable message out of a failed Axios request, matching the
 * backend's `{ success:false, message, details? }` shape. Validation errors
 * (400s from the Zod `validate` middleware) carry a generic top-level
 * message ("Validation failed.") plus a `details` array of per-field
 * reasons — surface the first of those instead, since that's the part
 * that actually tells the person what to fix.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; details?: Array<{ field: string; message: string }> }
      | undefined
    if (data?.details?.length) {
      return data.details.map((d) => d.message).join(' ')
    }
    return data?.message ?? fallback
  }
  return fallback
}

/** Simulated network latency for still-mocked service calls, so loading states are visible and real. */
export const MOCK_DELAY_MS = 500

/** Wraps a mock value in a delayed Promise, standing in for a real request. Used only by modules with no backend yet. */
export function simulateRequest<T>(value: T, delayMs: number = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), delayMs)
  })
}