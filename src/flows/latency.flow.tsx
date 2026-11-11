import { describe, expect, it } from 'vitest'
import { apiClient } from '@/lib/api/client'

describe('flow environment', () => {
  it('answers with the mock API latency, as the dev server does (D3 final review)', async () => {
    const started = performance.now()
    await apiClient.get('/admin/session').catch(() => undefined)
    expect(performance.now() - started).toBeGreaterThanOrEqual(350)
  })
})
