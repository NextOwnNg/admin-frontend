import { describe, expect, it } from 'vitest'
import { passwordStrength } from '@/features/auth/password-strength'

// Ported from client-frontend: the two apps rate passwords the same way
describe('passwordStrength', () => {
  it('says nothing for an empty password and "short" under 8 characters', () => {
    expect(passwordStrength('')).toBe('empty')
    expect(passwordStrength('Ab1!xyz')).toBe('short')
  })

  it.each(['password', 'Password123', '12345678', 'aaaaaaaaaaaa', 'abcdefghij', 'qwertyuiop', '98765432'])(
    'calls a common or predictable password like %j weak',
    (password) => expect(passwordStrength(password)).toBe('weak'),
  )

  it('rates by length first, then a mix of character kinds', () => {
    expect(passwordStrength('mangoesx')).toBe('weak')
    expect(passwordStrength('Mangoes7')).toBe('fair')
    expect(passwordStrength('Mangoes7 at Ikeja')).toBe('strong')
    expect(passwordStrength('mangoesattheplaza')).toBe('fair')
    // A space counts as a symbol, so a long passphrase does well without any rules
    expect(passwordStrength('mangoes at the market')).toBe('good')
  })
})
