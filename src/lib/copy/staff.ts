import type { StaffAccountRow } from '@/lib/api/types/staff'
import { formatWATDate } from '@/lib/time/time'

/** Staff page wording (design 2026-11-21 §4.3) */
export const STAFF_COPY = {
  intro: 'Everyone with access to this console, and the people invited to join. Invites last 7 days.',
  nameRequired: 'Enter their name.',
  roleRequired: 'Choose a role.',
  reasonRequired: 'Say why you are adding them.',
  resendReasonRequired: 'Say why you are resending it.',
  revokeReasonRequired: 'Say why you are revoking it.',
  empty: 'No staff to show.',
} as const

export function staffStatus(row: Pick<StaffAccountRow, 'status' | 'expiresAt'>): string {
  if (row.status === 'active') return 'Active'
  if (row.status === 'invite_expired') return 'Invite expired'
  return row.expiresAt ? `Invited · expires ${formatWATDate(row.expiresAt)}` : 'Invited'
}
