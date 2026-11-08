import { describe, expect, it } from 'vitest'
import { mockBuildProblem } from './mock-guard.ts'

describe('mock guard (design §7)', () => {
  it('refuses the mock in production', () => {
    expect(mockBuildProblem({ VITE_ENV_NAME: 'production', VITE_USE_MOCK_API: 'true' })).toContain('VITE_USE_MOCK_API')
  })

  it('allows the mock on previews', () => {
    expect(mockBuildProblem({ VITE_ENV_NAME: 'preview', VITE_USE_MOCK_API: 'true' })).toBeNull()
  })

  it('allows production without the mock', () => {
    expect(mockBuildProblem({ VITE_ENV_NAME: 'production' })).toBeNull()
  })
})
