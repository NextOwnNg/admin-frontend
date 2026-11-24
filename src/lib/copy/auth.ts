import type { PasswordStrength } from '@/features/auth/password-strength'

/** Sign-in, password and invite wording (design 2026-11-21 §4). Same answers whether or not an account exists. */
export const AUTH_COPY = {
  invalidEmail: 'Enter an email address, like name@nextown.ng.',
  passwordRequired: 'Enter your password.',
  passwordRule: 'Use at least 8 characters.',
  passwordMismatch: "The passwords don't match.",
  invalidCredentials: "That email and password don't match.",
  notStaff: "This account can't sign in here.",
  inviteInvalid: 'This invite link no longer works. Ask an administrator for a new one.',
  codeSent: "If that email has a staff account, we've sent a code.",
  hasAccess: 'This email already has staff access.',
  invitePending: 'An invite is already waiting for this email.',
  codeInvalid: "That code doesn't match. Check the email and try again.",
  codeExpired: 'That code has expired. Send a new code and use the latest one.',
} as const

export const STRENGTH_LABELS: Record<Exclude<PasswordStrength, 'empty'>, string> = {
  short: 'Too short',
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
}
