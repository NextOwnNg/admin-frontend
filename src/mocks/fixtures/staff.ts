import type { StaffMember } from '@/lib/api/types/reference'
import { STAFF_ACCOUNTS } from '@/mocks/db/staff'

/** Active staff for assignment: the three sample accounts plus two colleagues who can't sign in. FICTIONAL. */
export const STAFF: StaffMember[] = [
  ...STAFF_ACCOUNTS.map(({ id, displayName, roles }) => ({ staffId: id, displayName, roles: [...roles] })),
  { staffId: 's-mod-2', displayName: 'Bola Akinola', roles: ['moderator'] },
  { staffId: 's-agent-2', displayName: 'Musa Ibrahim', roles: ['support_agent'] },
]

export const staffMember = (staffId: string): StaffMember => {
  const member = STAFF.find((s) => s.staffId === staffId)
  if (!member) throw new Error(`Unknown staff ${staffId}`)
  return member
}
