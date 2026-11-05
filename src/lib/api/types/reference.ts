import type { CaseSummary } from '@/lib/api/types/cases'
import type { StaffRole } from '@/lib/copy/labels'
import type { Severity } from '@/lib/copy/status'

/** Reference data and the overview (design §5.3, §9a.5, §4.1). Hand-written until the OpenAPI spec lands. */

export type TargetType =
  'account' | 'listing' | 'comment' | 'feed_post' | 'message' | 'transaction' | 'case' | 'settings'

/** `GET /admin/reason-codes`. Draft codes (design §5.3) until the API serves the real list. */
export type ReasonCode = {
  code: string
  label: string
  severity: Severity | null
  /** Violation codes go with sanctions; decision codes with resolutions (design §9a.6) */
  kind: 'violation' | 'decision'
  appliesTo: TargetType[]
}

/** `GET /admin/staff`: active staff, for assignment */
export type StaffMember = { staffId: string; displayName: string; roles: StaffRole[] }

/** `GET /admin/overview`, scoped to what the signed-in staff member may see */
export type Overview = {
  myCases: CaseSummary[]
  openBySeverity: Record<Severity, number>
  overdueCount: number
  oldestOverdue: CaseSummary[]
}
