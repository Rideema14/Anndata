import axios from 'axios'

/**
 * Central Axios instance. Every service module (authService, productService,
 * etc.) should import `api` from here rather than calling axios directly, so
 * base URL, headers, and interceptors stay in one place.
 *
 * Right now most services short-circuit and resolve mock data without ever
 * touching this client — see MOCK_DELAY_MS and simulateRequest() below. Once
 * the backend is ready, swap the mock branch inside each service method for
 * a real `api.get/post(...)` call; UI code calling the service does not
 * need to change.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('aandata.authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** Simulated network latency for mock service calls, so loading states are visible and real. */
export const MOCK_DELAY_MS = 500

/** Wraps a mock value in a delayed Promise, standing in for a real request. */
export function simulateRequest<T>(value: T, delayMs: number = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), delayMs)
  })
}
