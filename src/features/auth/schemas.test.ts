import { describe, expect, it } from 'vitest'
import { newPasswordFormSchema, signInSchema } from '@/features/auth/schemas'

describe('auth schemas', () => {
  it('accepts an email typed with capitals and spaces', () => {
    expect(signInSchema.parse({ email: '  Ngozi@NextOwn.TEST ', password: 'x' }).email).toBe('ngozi@nextown.test')
  })

  it('asks for a real email and any password to sign in', () => {
    const result = signInSchema.safeParse({ email: 'ngozi', password: '' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    expect(messages).toEqual(['email: Enter an email address, like name@nextown.ng.', 'password: Enter your password.'])
  })

  it('rejects a short new password and a mismatch', () => {
    const short = newPasswordFormSchema.safeParse({ password: 'short', confirm: 'short' })
    expect(short.error?.issues.map((i) => [i.path.join('.'), i.message])).toEqual([
      ['password', 'Use at least 8 characters.'],
    ])
    const mismatch = newPasswordFormSchema.safeParse({ password: 'Mangoes7 at Ikeja', confirm: 'Mangoes7' })
    expect(mismatch.error?.issues.map((i) => [i.path.join('.'), i.message])).toEqual([
      ['confirm', "The passwords don't match."],
    ])
  })
})
