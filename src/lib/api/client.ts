import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toApiError } from '@/lib/api/api-error'
import { apiBaseUrl } from '@/lib/env'
import { recordServerDate } from '@/lib/time/server-clock'

/**
 * The one Axios instance for the admin API (PRD §3.3). Axios never retries; TanStack Query decides.
 * Components never call it directly: they use TanStack Query hooks in features/<domain>/api.
 * Never log request bodies, phone numbers, message text or evidence.
 */
export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // HttpOnly session cookie; no tokens in JS
  timeout: 15_000,
  headers: { Accept: 'application/json' },
})

let csrfToken: string | null = null

/** The session response's CSRF token, if the API uses one; sent on every write. Cleared on sign-out. */
export function setCsrfToken(token: string | null) {
  csrfToken = token
}

const isWrite = (method?: string) => !['get', 'head', 'options'].includes((method ?? 'get').toLowerCase())

apiClient.interceptors.request.use((config) => {
  config.headers.set('X-Request-ID', crypto.randomUUID())
  if (csrfToken && isWrite(config.method)) config.headers.set('X-CSRF-Token', csrfToken)
  return config
})

let authExpiredHandler: (() => void) | null = null

/**
 * Called when a staff request comes back 401: the session ended on the server (PRD §3.3). The session check
 * itself (`GET /admin/session`) and the sign-in endpoints answer 401 as a normal "signed out", so they don't count.
 */
export function onAuthExpired(handler: () => void) {
  authExpiredHandler = handler
  return () => {
    if (authExpiredHandler === handler) authExpiredHandler = null
  }
}

const isSessionProbe = (config?: InternalAxiosRequestConfig) =>
  config?.url?.startsWith('/admin/auth/') || (config?.url === '/admin/session' && config.method === 'get')

apiClient.interceptors.response.use(
  (response) => {
    recordServerDate(response.headers['date'] as string | undefined)
    return response
  },
  (error: unknown) => {
    const apiError = toApiError(error)
    if (apiError.status === 401 && !isSessionProbe(isAxiosError(error) ? error.config : undefined)) {
      authExpiredHandler?.()
    }
    return Promise.reject(apiError)
  },
)
