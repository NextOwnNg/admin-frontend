import { passwordStrength } from '@/features/auth/password-strength'
import { STRENGTH_LABELS } from '@/lib/copy/auth'

/** The strength of a new password in words, as the field's hint. A guide only: just the length is enforced. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = passwordStrength(password)
  if (strength === 'empty') return <>Use at least 8 characters. A short phrase is easy to remember.</>
  return <>Strength: {STRENGTH_LABELS[strength]}</>
}
