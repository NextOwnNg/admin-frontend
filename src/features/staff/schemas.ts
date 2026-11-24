import { z } from 'zod'
import { emailSchema } from '@/features/auth/schemas'
import { STAFF_ROLES, type StaffRole } from '@/lib/copy/labels'
import { STAFF_COPY } from '@/lib/copy/staff'

/** A required reason, as on every privileged action (ADM-T-03) */
export const reasonSchema = (message: string) => z.string().trim().min(1, message).max(500)

export const inviteFormSchema = z.object({
  displayName: z.string().trim().min(1, STAFF_COPY.nameRequired).max(120),
  email: emailSchema,
  role: z.string().refine((r): r is StaffRole => STAFF_ROLES.includes(r as StaffRole), STAFF_COPY.roleRequired),
  reason: reasonSchema(STAFF_COPY.reasonRequired),
})

export type InviteInput = z.input<typeof inviteFormSchema>
export type InviteForm = z.output<typeof inviteFormSchema>
