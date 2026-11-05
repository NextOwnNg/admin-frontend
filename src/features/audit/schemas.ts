import { z } from 'zod'
import { AUDIT_ACTIONS } from '@/lib/copy/audit'

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const actions = Object.keys(AUDIT_ACTIONS) as [string, ...string[]]

/** The log's URL parameters (design §4.6) */
export const auditFilterSchema = z.object({
  actor: z.string().min(1).max(64).optional(),
  action: z.enum(actions).optional(),
  targetType: z.enum(['account', 'listing', 'comment', 'feed_post', 'message', 'transaction', 'case']).optional(),
  from: date.optional(),
  to: date.optional(),
  cursor: z.string().min(1).max(64).optional(),
})

export type AuditLogFilters = z.output<typeof auditFilterSchema>
