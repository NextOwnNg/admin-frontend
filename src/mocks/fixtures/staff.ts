import type { StaffMember } from '@/lib/api/types/reference'
import { staffDb } from '@/mocks/db/staff'

/** Active staff for assignment, read from the mock's accounts so an accepted invitee appears. FICTIONAL. */
export const activeStaff = (): StaffMember[] => staffDb.activeStaff()

export const staffMember = (staffId: string): StaffMember => {
  const member = activeStaff().find((s) => s.staffId === staffId)
  if (!member) throw new Error(`Unknown staff ${staffId}`)
  return member
}
