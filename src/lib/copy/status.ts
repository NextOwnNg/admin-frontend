import {
  Ban,
  CircleCheck,
  CircleDot,
  Clock,
  Flag,
  Gavel,
  Handshake,
  Hourglass,
  LifeBuoy,
  MessageCircleQuestion,
  Siren,
  TriangleAlert,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'
import type { StatusTone } from '@/components/ui/StatusBadge'

/**
 * The one map of severity, status, outcome and flag labels (design §5). Case statuses and severities are
 * drafts pending AD-D-03; the API's values replace them.
 */

type Label = { label: string; icon: LucideIcon; tone: StatusTone }

export type Severity = 'S1' | 'S2' | 'S3' | 'S4'
export const SEVERITIES: readonly Severity[] = ['S1', 'S2', 'S3', 'S4']

export const SEVERITY: Record<Severity, Label> = {
  S1: { label: 'S1 Urgent safety', icon: Siren, tone: 'danger' },
  S2: { label: 'S2 Trade harm', icon: TriangleAlert, tone: 'warning' },
  S3: { label: 'S3 Policy', icon: Flag, tone: 'info' },
  S4: { label: 'S4 Help', icon: LifeBuoy, tone: 'neutral' },
}

export type CaseStatus = 'open' | 'assigned' | 'awaiting_info' | 'escalated' | 'resolved' | 'closed'
export const CASE_STATUSES: readonly CaseStatus[] = [
  'open',
  'assigned',
  'awaiting_info',
  'escalated',
  'resolved',
  'closed',
]
/** The queue's default filter: everything still being worked */
export const ACTIVE_CASE_STATUSES: CaseStatus[] = ['open', 'assigned', 'awaiting_info', 'escalated']

export const CASE_STATUS: Record<CaseStatus, Label> = {
  open: { label: 'Open', icon: CircleDot, tone: 'info' },
  assigned: { label: 'Assigned', icon: UserCheck, tone: 'info' },
  awaiting_info: { label: 'Awaiting information', icon: MessageCircleQuestion, tone: 'warning' },
  escalated: { label: 'Escalated', icon: TriangleAlert, tone: 'warning' },
  resolved: { label: 'Resolved', icon: CircleCheck, tone: 'success' },
  closed: { label: 'Closed', icon: CircleCheck, tone: 'neutral' },
}

export const OVERDUE: Label = { label: 'Overdue', icon: Clock, tone: 'warning' }

export type TransactionStatus =
  | 'AWAITING_HANDOVER'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'RESOLVED_BY_SUPPORT_CANCELLED'
  | 'RESOLVED_BY_SUPPORT_NO_COMPLETION'

/** "Completed" is only ever participant-confirmed completion; support outcomes say so (design §5.8). */
export const TRANSACTION_STATUS: Record<TransactionStatus, Label> = {
  AWAITING_HANDOVER: { label: 'Awaiting handover', icon: Hourglass, tone: 'info' },
  COMPLETED: { label: 'Completed', icon: Handshake, tone: 'success' },
  CANCELLED: { label: 'Cancelled', icon: Ban, tone: 'neutral' },
  DISPUTED: { label: 'Disputed', icon: TriangleAlert, tone: 'warning' },
  RESOLVED_BY_SUPPORT_CANCELLED: { label: 'Resolved by support: cancelled', icon: Gavel, tone: 'neutral' },
  RESOLVED_BY_SUPPORT_NO_COMPLETION: { label: 'Resolved by support: no completion', icon: Gavel, tone: 'neutral' },
}

export type TransactionFlag = 'DISPUTED' | 'PARTIAL_CONFIRMATION_TIMEOUT' | 'EXPIRED_HANDOVER'

export const TRANSACTION_FLAG: Record<TransactionFlag, Label> = {
  DISPUTED: { label: 'Disputed', icon: TriangleAlert, tone: 'warning' },
  PARTIAL_CONFIRMATION_TIMEOUT: { label: 'Partial confirmation expired', icon: Clock, tone: 'warning' },
  EXPIRED_HANDOVER: { label: 'Handover expired', icon: Clock, tone: 'warning' },
}

export type TransactionOutcome = 'completed' | 'cancelled' | 'administratively_resolved'

/** Outcome choices in Resolve transaction; support outcomes never read as participant completion. */
export const TRANSACTION_OUTCOME: Record<TransactionOutcome, string> = {
  completed: 'Completed (both participants confirmed)',
  cancelled: 'Resolved by support: cancelled',
  administratively_resolved: 'Resolved by support: no completion',
}

/** `"1 of 2 confirmed"` */
export function confirmationCount(count: 0 | 1 | 2): string {
  return `${count} of 2 confirmed`
}

export type Redaction = 'removed_by_author' | 'hidden_by_moderation' | 'removed_by_moderation'

/** Shown instead of redacted content, in lists and on the case (design §4.2) */
export const REDACTION: Record<Redaction, string> = {
  removed_by_author: 'Content removed by its author',
  hidden_by_moderation: 'Content hidden by moderation',
  removed_by_moderation: 'Content removed by moderation',
}

/** Recorded decisions on a case: Close report outcomes and transaction resolutions */
export const DECISION_OUTCOME: Record<string, string> = {
  no_violation: 'No violation',
  action_taken: 'Action taken',
  duplicate: 'Duplicate report',
  ...TRANSACTION_OUTCOME,
}
