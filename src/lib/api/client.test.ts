import { delay, http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/api-error'
import { apiClient, onAuthExpired, setCsrfToken } from '@/lib/api/client'
import { server } from '@/test/msw/server'

const url = (path: string) => `${import.meta.env.VITE_ADMIN_API_BASE_URL}${path}`

afterEach(() => setCsrfToken(null))

describe('apiClient', () => {
  it('sends a request ID with every call', async () => {
    let requestId: string | null = null
    server.use(
      http.get(url('/ping'), ({ request }) => {
        requestId = request.headers.get('X-Request-ID')
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiClient.get('/ping')

    expect(requestId).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('sends the CSRF token on writes only, once the session provides one', async () => {
    const seen: Record<string, string | null> = {}
    server.use(
      http.get(url('/admin/cases'), ({ request }) => {
        seen.get = request.headers.get('X-CSRF-Token')
        return HttpResponse.json([])
      }),
      http.post(url('/admin/cases/1/notes'), ({ request }) => {
        seen.post = request.headers.get('X-CSRF-Token')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await apiClient.post('/admin/cases/1/notes')
    expect(seen.post).toBeNull()

    setCsrfToken('t1')
    await apiClient.get('/admin/cases')
    await apiClient.post('/admin/cases/1/notes')

    expect(seen.get).toBeNull()
    expect(seen.post).toBe('t1')
  })

  it('reports an ended session on a 401 from an admin endpoint', async () => {
    const expired = vi.fn()
    const stop = onAuthExpired(expired)
    server.use(http.get(url('/admin/cases'), () => HttpResponse.json({ code: 'AUTH_REQUIRED' }, { status: 401 })))

    await apiClient.get('/admin/cases').catch(() => {})
    stop()

    expect(expired).toHaveBeenCalledOnce()
  })

  it('treats a 401 from the session check as a plain "signed out"', async () => {
    const expired = vi.fn()
    const stop = onAuthExpired(expired)
    server.use(http.get(url('/admin/session'), () => HttpResponse.json({ code: 'AUTH_REQUIRED' }, { status: 401 })))

    await apiClient.get('/admin/session').catch(() => {})
    stop()

    expect(expired).not.toHaveBeenCalled()
  })

  it('normalises API errors into ApiError with the stable code', async () => {
    server.use(
      http.post(url('/admin/cases/1/actions'), () =>
        HttpResponse.json({ code: 'CONFLICT', message: 'Case changed' }, { status: 409 }),
      ),
    )

    const error = await apiClient.post('/admin/cases/1/actions').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'http', status: 409, code: 'CONFLICT', isOutcomeUnknown: false })
  })

  it('reports a timeout as kind "timeout"', async () => {
    server.use(
      http.get(url('/admin/slow'), async () => {
        await delay('infinite')
        return HttpResponse.json({})
      }),
    )

    const error = await apiClient.get('/admin/slow', { timeout: 20 }).catch((e: unknown) => e)

    expect(error).toMatchObject({ kind: 'timeout', isOutcomeUnknown: true })
  })

  it('reads Retry-After on rate limiting', async () => {
    server.use(
      http.post(url('/admin/auth/otp/request'), () =>
        HttpResponse.json({ code: 'RATE_LIMITED' }, { status: 429, headers: { 'Retry-After': '30' } }),
      ),
    )

    const error = await apiClient.post('/admin/auth/otp/request').catch((e: unknown) => e)

    expect(error).toMatchObject({ code: 'RATE_LIMITED', retryAfterSeconds: 30 })
  })
})
