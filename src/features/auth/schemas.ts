import { z } from 'zod'
import { AUTH_COPY } from '@/lib/copy/auth'

/** Emails are compared trimmed and lowercased, here and on the server. */
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email(AUTH_COPY.invalidEmail))

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128

/** A new password. Signing in only checks that one was typed, so an older, shorter password still works. */
export const newPasswordSchema = z.string().min(PASSWORD_MIN, AUTH_COPY.passwordRule).max(PASSWORD_MAX)

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, AUTH_COPY.passwordRequired),
})

/** Setting a password (reset, accepting an invite): typed twice */
export const newPasswordFormSchema = z
  .object({ password: newPasswordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: AUTH_COPY.passwordMismatch })

export const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code.'),
})

/** A password reset: the emailed code and the new password */
export const resetFormSchema = z
  .object({ code: codeSchema.shape.code, password: newPasswordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: AUTH_COPY.passwordMismatch })

export type SignInInput = z.input<typeof signInSchema>
export type SignInForm = z.output<typeof signInSchema>
export type NewPasswordForm = z.output<typeof newPasswordFormSchema>
export type CodeForm = z.output<typeof codeSchema>
export type ResetForm = z.output<typeof resetFormSchema>
