import type { AuditEntry } from '@/lib/api/types/audit'
import type { RecordRef } from '@/lib/api/types/records'
import type { StaffMember, TargetType } from '@/lib/api/types/reference'
import type { TransactionOutcome, TransactionSummary } from '@/lib/api/types/transactions'
import type { CaseStatus, Severity } from '@/lib/copy/status'

/** Moderation cases (design §4.2, §4.3, §6). */

export type Redaction = null | 'removed_by_author' | 'hidden_by_moderation' | 'removed_by_moderation'

export type PartyRef = {
  userId: string
  displayName: string
  role: 'reporter' | 'reported' | 'participant_a' | 'participant_b' | 'appellant'
  memberSince: string
  /** Moderation actions against this member in the last 90 days: a fact, never a score */
  priorActions90d: number
}

/** The reported thing as plain text; `text` is null when redacted */
export type ContentRef = { type: TargetType; id: string; text: string | null; redaction: Redaction }

export type CaseSummary = {
  id: string
  severity: Severity
  status: CaseStatus
  type: TargetType
  /** One line about the report, never message text or phone numbers */
  summary: string
  reasonCode: string
  reportCount: number
  openedAt: string
  dueAt: string
  overdue: boolean
  assignee: StaffMember | null
  /** The reported content's redaction, so lists say so instead of describing it */
  redaction: Redaction
  /** A member's report, a restricted member's appeal, or a possible duplicate listing (Phase C §4.4) */
  kind: CaseKind
  version: number
}

export type CaseKind = 'report' | 'appeal' | 'duplicate'

/** The restriction a member is appealing, and what they said */
export type AppealInfo = { restrictedUntil: string; reasonCode: string; statement: string }

export type CaseDecision = { outcome: string; reasonCode: string; by: string; at: string }

export type CaseDetail = CaseSummary & {
  description: string
  reports: { reporterName: string; at: string; reasonCode: string }[]
  parties: PartyRef[]
  content: ContentRef | null
  hasPrivateMessages: boolean
  evidence: { id: string; label: string }[]
  transactionId: string | null
  transactionSummary: TransactionSummary | null
  notes: { id: string; author: string; body: string; at: string }[]
  nextAction: string | null
  decision: CaseDecision | null
  appeal: AppealInfo | null
  /** For a duplicate: the earlier listing this one may repeat */
  duplicateOf: RecordRef | null
  history: AuditEntry[]
}

export type CasePage = { items: CaseSummary[]; nextCursor: string | null; total: number }

export type CaseAge = '1h' | '24h' | '7d' | 'older'
export type CaseSort = 'severity' | 'age' | '-age'

/** `GET /admin/cases` query: lists are comma-separated in the URL */
export type CaseFilters = {
  status?: CaseStatus[]
  severity?: Severity[]
  type?: TargetType[]
  age?: CaseAge
  assignee?: 'me' | 'unassigned' | (string & {})
  sort?: CaseSort
  cursor?: string
}

export type RevealField = 'phone' | 'messages' | 'evidence' | 'venue'

/** `POST /admin/cases/:id/reveal` and `POST /admin/transactions/:id/reveal` */
export type RevealBody = { field: RevealField; subjectId?: string; reason: string }
export type RevealResult = { value?: string; url?: string; expiresAt?: string }

export type CaseActionId =
  'hide' | 'remove' | 'warn' | 'restrict' | 'lift_restriction' | 'close' | 'request_info' | 'escalate' | 'propose'

/** `upheld` closes an appeal with the restriction left in place */
export type CloseOutcome = 'no_violation' | 'action_taken' | 'duplicate' | 'upheld'

/** `POST /admin/cases/:id/actions` (design §9a.3) */
export type CaseActionBody = {
  action: CaseActionId
  target: { type: TargetType; id: string }
  reasonCode?: string
  note?: string
  message?: string
  durationDays?: 1 | 3 | 7 | 30
  outcome?: CloseOutcome | TransactionOutcome
  expectedVersion: number
}

export type CaseActionResult = { case: CaseDetail; auditEntry: AuditEntry }

export type AssignBody = { assigneeId: string | null; expectedVersion: number }
export type NoteBody = { body: string }
