import type { StaffRole } from '@/lib/copy/labels'

/**
 * Staff authentication contract: email and password, with one-time codes by email (design 2026-11-21 §5).
 * Hand-written in the shape an OpenAPI generator would produce, mirroring the marketplace's `/auth` API.
 */

export type { StaffRole }

/** `GET /admin/session` */
export type StaffSession = {
  staffId: string
  displayName: string
  roles: StaffRole[]
  /** Idle sign-out after this many seconds without activity (PRD §3.5) */
  idleTimeoutSeconds: number
  /** Sent back as `X-CSRF-Token` on writes when present */
  csrfToken?: string
}

/** `POST /admin/auth/login`, and the answer to a password reset */
export type LoginBody = { email: string; password: string }
export type LoginResult = { secondFactorRequired: boolean }

/** `POST /admin/auth/second-factor` */
export type SecondFactorBody = { code: string }

/** `POST /admin/auth/second-factor/resend`, `POST /admin/auth/password/forgot` */
export type ResendResult = { resendAfterSeconds: number }

export type ForgotPasswordBody = { email: string }
/** `POST /admin/auth/password/reset` */
export type ResetPasswordBody = { email: string; code: string; password: string }

/** `GET /admin/invites/:token` */
export type InviteDetails = { email: string; displayName: string; role: StaffRole; expiresAt: string }
/** `POST /admin/invites/:token/accept` */
export type AcceptInviteBody = { password: string }
