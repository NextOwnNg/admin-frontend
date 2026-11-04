import { z } from 'zod'
import { commaList } from '@/hooks/useUrlFilters'
import { ACTIVE_CASE_STATUSES } from '@/lib/copy/status'

/** The queue's URL parameters (design §4.2). Anything else in the address is ignored. */
export const queueFilterSchema = z.object({
  status: commaList(['open', 'assigned', 'awaiting_info', 'escalated', 'resolved', 'closed']).default(
    ACTIVE_CASE_STATUSES,
  ),
  severity: commaList(['S1', 'S2', 'S3', 'S4']).optional(),
  type: commaList(['account', 'listing', 'comment', 'feed_post', 'message', 'transaction']).optional(),
  age: z.enum(['1h', '24h', '7d', 'older']).optional(),
  assignee: z.string().min(1).max(64).optional(),
  sort: z.enum(['severity', 'age', '-age']).optional(),
  cursor: z.string().min(1).max(64).optional(),
})

export type QueueFilters = z.output<typeof queueFilterSchema>
