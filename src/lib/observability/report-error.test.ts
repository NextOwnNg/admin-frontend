import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/api-error'
import { onAuthExpired } from '@/lib/api/client'
import {
  createReporter,
  installGlobalErrorReporting,
  reportError,
  routePattern,
  scrub,
  toReport,
  type ClientErrorReport,
} from '@/lib/observability/report-error'
import { clientErrorsDb } from '@/mocks/handlers/client-errors'
import { useSessionStore } from '@/stores/session'
import { server } from '@/test/msw/server'

const at = (pathname: string, params: Record<string, string> = {}) => [
  { pathname: '/', params: {} },
  { pathname, params },
]

describe('client error reports (PRD §9, design §7)', () => {
  it('reports the route pattern, never the address', () => {
    expect(routePattern(at('/cases/NX-000202', { id: 'NX-000202' }))).toBe('/cases/:id')
    expect(routePattern(at('/records/users/u-kunle', { kind: 'users', id: 'u-kunle' }))).toBe('/records/:kind/:id')
    expect(routePattern(at('/sign-in'))).toBe('/sign-in')
    expect(routePattern(at('/'))).toBe('/')
    expect(routePattern(at('/nope/Kunle%20Ade', { '*': 'nope/Kunle Ade' }))).toBe('/*')
    expect(routePattern([])).toBe('/')
  })

  it('scrubs URLs, emails and long digit runs from messages', () => {
    expect(scrub('GET https://x.test/api/admin/users?q=Kunle failed for +2348000000101 ada@x.test')).toBe(
      'GET [url] failed for # [email]',
    )
    expect(scrub('No account for +234 803 123 4567')).toBe('No account for #')
    expect(scrub('Call 0803 123 4567 or (0803) 123-4567 today')).toBe('Call # or # today')
    expect(scrub('Retry in 30 s, page 2 of 12')).toBe('Retry in 30 s, page 2 of 12')
    expect(scrub('a'.repeat(500))).toHaveLength(200)
  })

  it('sends only the allowed fields', () => {
    const report = toReport(
      new ApiError({ kind: 'http', status: 500, code: 'SERVER_ERROR', message: 'boom', requestId: 'r-1' }),
      '/reports',
    )
    expect(Object.keys(report).sort()).toEqual(['env', 'message', 'name', 'requestId', 'route', 'version'])
    expect(report.requestId).toBe('r-1')
    expect(toReport('oops', '/')).toMatchObject({ name: 'Error', message: 'oops' })
  })

  it('sends at most 10 reports a minute', () => {
    let now = 0
    const send = vi.fn(() => Promise.resolve())
    const report = createReporter({ send, now: () => now })
    for (let i = 0; i < 12; i++) report(new Error(`e${i}`), '/')
    expect(send).toHaveBeenCalledTimes(10)
    now = 60_001
    report(new Error('later'), '/')
    expect(send).toHaveBeenCalledTimes(11)
  })

  it('never reports its own failure and never signs out', async () => {
    const send = vi.fn<(report: ClientErrorReport) => Promise<unknown>>(() => Promise.reject(new Error('offline')))
    const report = createReporter({ send })
    expect(() => report(new Error('x'), '/')).not.toThrow()
    await Promise.resolve()
    expect(send).toHaveBeenCalledTimes(1)

    const expired = vi.fn()
    onAuthExpired(expired)
    useSessionStore.setState({ status: 'staff' })
    let answered = false
    server.use(
      http.post('/api/admin/client-errors', () => {
        answered = true
        return HttpResponse.json({ code: 'AUTH_REQUIRED', message: 'Signed out' }, { status: 401 })
      }),
    )
    reportError(new Error('y'), '/audit')
    await waitFor(() => expect(answered).toBe(true))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(expired).not.toHaveBeenCalled()
    expect(useSessionStore.getState().status).toBe('staff')
  })

  it('posts to the mock', async () => {
    reportError(new Error('x'), '/audit')
    await waitFor(() => expect(clientErrorsDb.list()).toHaveLength(1))
    expect(clientErrorsDb.list()[0]?.route).toBe('/audit')
  })

  it('reports uncaught errors and rejections', async () => {
    const target = new EventTarget()
    const uninstall = installGlobalErrorReporting(target)
    target.dispatchEvent(Object.assign(new Event('error'), { error: new Error('a') }))
    const rejection = Object.assign(new Event('unhandledrejection'), { reason: new Error('b') })
    target.dispatchEvent(rejection)
    await waitFor(() =>
      expect(
        clientErrorsDb
          .list()
          .map((r) => r.message)
          .sort(),
      ).toEqual(['a', 'b']),
    )

    uninstall()
    target.dispatchEvent(Object.assign(new Event('error'), { error: new Error('c') }))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(clientErrorsDb.list()).toHaveLength(2)
  })
})
