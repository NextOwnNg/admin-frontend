import type { StaffMember } from '@/lib/api/types/reference'
import type { RecordRef } from '@/lib/api/types/records'
import type { Severity } from '@/lib/copy/status'

/** Exception queues (Phase C design §4.4, ADM-FE-08). Every row is backed by a case. */

export type ExceptionQueue = 'partial_confirmation' | 'reservation_expiry' | 'duplicate' | 'dispute' | 'appeal'

/** What to do next, chosen by the API; `note` says when nothing is needed yet */
export type NextAction = { label: string; href: string; note: string | null }

export type ExceptionRow = {
  queue: ExceptionQueue
  caseId: string
  caseVersion: number
  /** The transaction, listing or member the case is about */
  subject: RecordRef
  whatHappened: string
  priority: Severity
  dueAt: string
  overdue: boolean
  assignee: StaffMember | null
  nextAction: NextAction
}

export type ExceptionPage = {
  items: ExceptionRow[]
  nextCursor: string | null
  total: number
  counts: Record<ExceptionQueue, number>
}
