import { describe, expect, it } from 'vitest'
import { findMockLeaks } from './check-dist.ts'

describe('production bundle check (design §7)', () => {
  it('flags the worker file', () => {
    const leaks = findMockLeaks([{ path: 'mockServiceWorker.js', content: '' }])
    expect(leaks).toHaveLength(1)
    expect(leaks[0]).toContain('mockServiceWorker.js')
  })

  it('flags MSW and sample-account code', () => {
    for (const marker of ['[MSW]', 'Sample staff accounts', '+2348000000101']) {
      const leaks = findMockLeaks([{ path: 'assets/index-A.js', content: `x;${marker};y` }])
      expect(leaks).toHaveLength(1)
      expect(leaks[0]).toContain('assets/index-A.js')
      expect(leaks[0]).toContain(marker.startsWith('+234') ? '+2348000000' : marker)
    }
  })

  it('passes a clean bundle', () => {
    expect(findMockLeaks([{ path: 'assets/index-A.js', content: 'const a = 1' }])).toEqual([])
  })
})
