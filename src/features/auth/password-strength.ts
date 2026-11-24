import { PASSWORD_MIN } from '@/features/auth/schemas'

export type PasswordStrength = 'empty' | 'short' | 'weak' | 'fair' | 'good' | 'strong'

/** Passwords people pick first; any of these, however long, reads as weak. Same list as the marketplace app. */
const COMMON = new Set([
  'password',
  'password1',
  'password123',
  'passw0rd',
  '12345678',
  '123456789',
  '1234567890',
  '11111111',
  '00000000',
  'qwerty123',
  'qwertyuiop',
  'iloveyou',
  'abcd1234',
  'abc12345',
  'nextown',
  'nextown123',
  'nigeria',
  'nigeria123',
  'naija123',
  'letmein1',
  'welcome1',
  'admin123',
])

const SEQUENCES = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm']

/** Mostly one repeated character, or a run along the alphabet, digits or keyboard. */
function isPredictable(password: string) {
  const lower = password.toLowerCase()
  if (new Set(lower).size <= 2) return true
  return SEQUENCES.some((run) => run.includes(lower) || [...run].reverse().join('').includes(lower))
}

/**
 * A quick, local estimate for the meter under a new password: length counts most, then a mix of kinds of
 * character. It guides; only the minimum length is enforced (the server checks the same). Ported from
 * client-frontend so both apps rate a password alike.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 'empty'
  if (password.length < PASSWORD_MIN) return 'short'
  if (COMMON.has(password.toLowerCase()) || isPredictable(password)) return 'weak'

  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z\d]/].filter((kind) => kind.test(password)).length
  let score = 0
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (kinds >= 2) score++
  if (kinds >= 3) score++

  if (score <= 1) return 'weak'
  if (score === 2) return 'fair'
  if (score === 3) return 'good'
  return 'strong'
}
