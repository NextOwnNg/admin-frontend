import type { TargetType } from '@/lib/api/types/reference'

/** The moderation log (design §4.6). Entries are append-only; nothing edits or deletes them. */

export type AuditEntry = {
  id: string
  at: string
  actor: string
  /** An action code, e.g. `hide`; `AUDIT_ACTIONS` words it */
  action: string
  target: { type: TargetType; id: string; label: string }
  reasonCode: string | null
  note: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  /** The case and transaction the entry belongs to, for links from the log */
  caseId?: string | null
  transactionId?: string | null
}

export type AuditPage = { items: AuditEntry[]; nextCursor: string | null; total: number }

export type AuditFilters = {
  actor?: string
  action?: string
  targetType?: TargetType
  from?: string
  to?: string
  cursor?: string
}
