import type { StaffRole } from '@/lib/copy/labels'

/** Staff administration contract (design 2026-11-21 §4.3, §5). Administrators only. */

export type StaffAccountStatus = 'active' | 'invited' | 'invite_expired'

/** `GET /admin/staff/members`: a staff member, or someone invited who hasn't accepted yet */
export type StaffAccountRow = {
  id: string
  displayName: string
  email: string
  role: StaffRole
  status: StaffAccountStatus
  invitedAt?: string
  expiresAt?: string
  inviteId?: string
}

/** `POST /admin/staff/invites` */
export type InviteBody = { email: string; displayName: string; role: StaffRole; reason: string }
export type InviteResult = StaffAccountRow & {
  /** Mock only, never in the real contract: the link the invite email would carry */
  mockInviteUrl?: string
}

/** Resend and revoke */
export type ReasonBody = { reason: string }
