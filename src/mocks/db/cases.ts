import type { CaseDetail, CaseFilters, CasePage, CaseSummary } from '@/lib/api/types/cases'
import type { StaffRole } from '@/lib/copy/labels'
import { ACTIVE_CASE_STATUSES, SEVERITIES, type Severity } from '@/lib/copy/status'
import type { Overview } from '@/lib/api/types/reference'
import type { CaseRecord } from '@/mocks/seed'
import { auditDb, page } from '@/mocks/db/audit'
import { droppedAnswers, reseed, store } from '@/mocks/db/store'
import { transactionsDb } from '@/mocks/db/transactions'

export type Viewer = { staffId: string; roles: StaffRole[] }

const HOUR = 3_600_000
const AGE_LIMITS: Record<NonNullable<CaseFilters['age']>, [number, number]> = {
  '1h': [0, HOUR],
  '24h': [0, 24 * HOUR],
  '7d': [0, 7 * 24 * HOUR],
  older: [7 * 24 * HOUR, Number.POSITIVE_INFINITY],
}

const isActive = (c: CaseRecord) => ACTIVE_CASE_STATUSES.includes(c.status)
const isOverdue = (c: CaseRecord, now: number) => isActive(c) && Date.parse(c.dueAt) < now

/** Administrators and moderators see every case; support agents only the cases assigned to them. */
export const canSee = (viewer: Viewer, c: CaseRecord) =>
  viewer.roles.some((r) => r !== 'support_agent') || c.assignee?.staffId === viewer.staffId

function toSummary(c: CaseRecord, now: number): CaseSummary {
  const {
    id,
    severity,
    status,
    type,
    summary,
    reasonCode,
    reportCount,
    openedAt,
    dueAt,
    assignee,
    redaction,
    version,
  } = c
  return structuredClone({
    id,
    severity,
    status,
    type,
    summary,
    reasonCode,
    reportCount,
    openedAt,
    dueAt,
    overdue: isOverdue(c, now),
    assignee,
    redaction,
    version,
  })
}

const severityRank = (s: Severity) => SEVERITIES.indexOf(s)

function compare(sort: CaseFilters['sort']) {
  return (a: CaseRecord, b: CaseRecord) => {
    // S1 stays pinned at the top whatever the sort (design §4.2)
    const pinned = Number(b.severity === 'S1') - Number(a.severity === 'S1')
    if (pinned !== 0) return pinned
    const oldest = a.openedAt.localeCompare(b.openedAt)
    if (sort === 'age') return oldest
    if (sort === '-age') return -oldest
    return severityRank(a.severity) - severityRank(b.severity) || oldest
  }
}

export const casesDb = {
  record: (id: string): CaseRecord | undefined => store().cases.find((c) => c.id === id),

  list(filters: CaseFilters, viewer: Viewer, now = Date.now()): CasePage {
    const rows = store()
      .cases.filter((c) => canSee(viewer, c))
      .filter((c) => !filters.status?.length || filters.status.includes(c.status))
      .filter((c) => !filters.severity?.length || filters.severity.includes(c.severity))
      .filter((c) => !filters.type?.length || filters.type.includes(c.type))
      .filter((c) => {
        if (!filters.age) return true
        const [min, max] = AGE_LIMITS[filters.age]
        const age = now - Date.parse(c.openedAt)
        return age >= min && age < max
      })
      .filter((c) => {
        if (!filters.assignee) return true
        if (filters.assignee === 'unassigned') return c.assignee === null
        const staffId = filters.assignee === 'me' ? viewer.staffId : filters.assignee
        return c.assignee?.staffId === staffId
      })
      .sort(compare(filters.sort))
    const result = page(rows, filters.cursor)
    return { ...result, items: result.items.map((c) => toSummary(c, now)) }
  },

  detail(id: string, now = Date.now()): CaseDetail | undefined {
    const c = casesDb.record(id)
    if (!c) return undefined
    const { secrets: _secrets, ...rest } = c
    return structuredClone({
      ...rest,
      overdue: isOverdue(c, now),
      transactionSummary: c.transactionId ? transactionsDb.summary(c.transactionId) : null,
      history: auditDb.forCase(id),
    })
  },

  overview(viewer: Viewer, now = Date.now()): Overview {
    const visible = store().cases.filter((c) => canSee(viewer, c) && isActive(c))
    const bySeverityThenDue = (a: CaseRecord, b: CaseRecord) =>
      severityRank(a.severity) - severityRank(b.severity) || a.dueAt.localeCompare(b.dueAt)
    const overdue = visible.filter((c) => isOverdue(c, now)).sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    return {
      myCases: visible
        .filter((c) => c.assignee?.staffId === viewer.staffId)
        .sort(bySeverityThenDue)
        .slice(0, 10)
        .map((c) => toSummary(c, now)),
      openBySeverity: Object.fromEntries(
        SEVERITIES.map((s) => [s, visible.filter((c) => c.severity === s).length]),
      ) as Record<Severity, number>,
      overdueCount: overdue.length,
      oldestOverdue: overdue.slice(0, 5).map((c) => toSummary(c, now)),
    }
  },

  /** Tests: another operator changed the case */
  bumpVersion(id: string) {
    const c = casesDb.record(id)
    if (c) c.version += 1
  },

  /** Tests: the next write to this case or transaction is applied, then its answer is lost (design §5.6) */
  failNextWithTimeoutAfterApply(id: string) {
    droppedAnswers().add(id)
  },

  reset: reseed,
}
