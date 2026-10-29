import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { apiClient } from '@/lib/api/client'
import { createQueryClient } from '@/app/query-client'
import { server } from '@/test/msw/server'

const url = (path: string) => `${import.meta.env.VITE_ADMIN_API_BASE_URL}${path}`

function countCalls(status: number) {
  let calls = 0
  server.use(
    http.all(url('/admin/thing'), () => {
      calls += 1
      return HttpResponse.json({ code: 'X' }, { status })
    }),
  )
  return () => calls
}

describe('query client (PRD §3.3)', () => {
  it('retries a failing read twice', async () => {
    const calls = countCalls(503)
    const client = createQueryClient()
    client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retryDelay: 0 } })

    await client.fetchQuery({ queryKey: ['t'], queryFn: () => apiClient.get('/admin/thing') }).catch(() => {})

    expect(calls()).toBe(3)
  })

  it('never retries a 4xx', async () => {
    const calls = countCalls(403)
    const client = createQueryClient()

    await client.fetchQuery({ queryKey: ['t'], queryFn: () => apiClient.get('/admin/thing') }).catch(() => {})

    expect(calls()).toBe(1)
  })

  it('never retries an action', () => {
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false)
  })
})
