import { describe, expect, it } from 'vitest'
import { safeNext, signInPath } from '@/lib/auth/next'

describe('safeNext (no open redirects)', () => {
  it('keeps a same-origin path with its query', () => {
    expect(safeNext('/reports?severity=S1')).toBe('/reports?severity=S1')
  })

  it.each(['//evil.example', 'https://evil.example', '/\\evil.example', 'reports', '', null])(
    'sends %s home',
    (raw) => {
      expect(safeNext(raw)).toBe('/')
    },
  )

  it('never returns to the sign-in page itself', () => {
    expect(safeNext('/sign-in?next=/x')).toBe('/')
  })

  it('recognises the sign-in page in any letter case (Phase A review)', () => {
    expect(safeNext('/SIGN-IN?next=/x')).toBe('/')
    expect(safeNext('/Sign-In')).toBe('/')
  })
})

describe('signInPath', () => {
  it('carries where to return', () => {
    expect(signInPath('/cases/NX-1?tab=notes')).toBe('/sign-in?next=%2Fcases%2FNX-1%3Ftab%3Dnotes')
  })
})
