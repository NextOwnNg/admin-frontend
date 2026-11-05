import { z } from 'zod'
import { commaList, CURSOR } from '@/hooks/useUrlFilters'
import { ACTIVE_CASE_STATUSES } from '@/lib/copy/status'

/** The queue's URL parameters (design §4.2). Anything else in the address is ignored. */
export const queueFilterSchema = z.object({
  status: commaList(['open', 'assigned', 'awaiting_info', 'escalated', 'resolved', 'closed']).default(
    ACTIVE_CASE_STATUSES,
  ),
  severity: commaList(['S1', 'S2', 'S3', 'S4']).optional(),
  type: commaList(['account', 'listing', 'comment', 'feed_post', 'message', 'transaction']).optional(),
  age: z.enum(['1h', '24h', '7d', 'older']).optional(),
  // `me`, `unassigned` or a staff id; an id that isn't on the staff list is dropped by the page
  assignee: z.union([z.enum(['me', 'unassigned']), z.string().regex(/^s-[a-z0-9-]{1,40}$/)]).optional(),
  sort: z.enum(['severity', 'age', '-age']).optional(),
  cursor: CURSOR.optional(),
})

export type QueueFilters = z.output<typeof queueFilterSchema>
