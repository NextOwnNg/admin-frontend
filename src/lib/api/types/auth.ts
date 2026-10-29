import type { StaffRole } from '@/lib/copy/labels'

/**
 * Staff authentication contract. Hand-written in the shape an OpenAPI generator would produce, so
 * `src/lib/api/generated/` can replace it when the backend spec lands (design §5). The second-factor
 * shape is a guess pending AD-D-02.
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

/** `POST /admin/auth/otp/request` */
export type OtpRequestBody = { phone: string }
export type OtpRequestResult = { resendAfterSeconds: number }

/** `POST /admin/auth/otp/verify` */
export type OtpVerifyBody = { phone: string; code: string }
export type OtpVerifyResult = { secondFactorRequired: boolean }

/** `POST /admin/auth/second-factor` */
export type SecondFactorBody = { code: string }
