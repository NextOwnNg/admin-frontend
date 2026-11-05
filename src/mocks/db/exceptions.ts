import type { ExceptionPage, ExceptionQueue, ExceptionRow, NextAction } from '@/lib/api/types/exceptions'
import type { RecordRef } from '@/lib/api/types/records'
import { ACTIVE_CASE_STATUSES, SEVERITIES } from '@/lib/copy/status'
import { formatWAT } from '@/lib/time/time'
import { page } from '@/mocks/db/audit'
import { store } from '@/mocks/db/store'
import type { CaseRecord, TransactionRecord } from '@/mocks/seed'

/** The exception queues, derived from active cases and their transactions (Phase C design §4.4) */

export const EXCEPTION_QUEUES: readonly ExceptionQueue[] = [
  'partial_confirmation',
  'reservation_expiry',
  'duplicate',
  'dispute',
  'appeal',
]

const DAY = 24 * 60 * 60_000

const unreleased = (t: TransactionRecord) => t.reservations.filter((r) => !r.releasedAt)

/** The first queue a case belongs in, or none */
function queueOf(c: CaseRecord, now: number): ExceptionQueue | null {
  if (!ACTIVE_CASE_STATUSES.includes(c.status)) return null
  const t = c.transactionId ? store().transactions.find((x) => x.id === c.transactionId) : undefined
  if (t?.flags.includes('PARTIAL_CONFIRMATION_TIMEOUT')) return 'partial_confirmation'
  if (t?.flags.includes('DISPUTED')) return 'dispute'
  if (t?.flags.includes('EXPIRED_HANDOVER') && unreleased(t).length > 0) return 'reservation_expiry'
  if (
    t?.status === 'AWAITING_HANDOVER' &&
    t.confirmations === 0 &&
    unreleased(t).some((r) => Date.parse(r.expiresAt) - now < DAY)
  ) {
    return 'reservation_expiry'
  }
  if (c.kind === 'duplicate') return 'duplicate'
  if (c.kind === 'appeal') return 'appeal'
  return null
}

function nextAction(queue: ExceptionQueue, c: CaseRecord, t: TransactionRecord | undefined): NextAction {
  const tx = t ? `/transactions/${t.id}?case=${c.id}` : `/cases/${c.id}`
  switch (queue) {
    case 'partial_confirmation':
      return { label: 'Review confirmations', href: tx, note: null }
    case 'dispute':
      return { label: 'Resolve dispute', href: tx, note: null }
    case 'reservation_expiry': {
      if (t?.flags.includes('EXPIRED_HANDOVER')) return { label: 'Release items', href: tx, note: null }
      // Reminders are the system's job; nothing is needed before the reservation ends (spec §9 call 4)
      const ends = unreleased(t!)
        .map((r) => r.expiresAt)
        .sort()[0]!
      return { label: 'Open transaction', href: tx, note: `Due to expire. No action needed before ${formatWAT(ends)}` }
    }
    case 'duplicate':
      return { label: 'Compare listings', href: `/cases/${c.id}`, note: null }
    case 'appeal':
      return { label: 'Review appeal', href: `/cases/${c.id}`, note: null }
  }
}

function subjectOf(c: CaseRecord, t: TransactionRecord | undefined): RecordRef {
  if (t) return { kind: 'transactions', id: t.id, label: `Transaction ${t.id}` }
  if (c.content?.type === 'listing') return { kind: 'listings', id: c.content.id, label: `Listing ${c.content.id}` }
  const member = c.parties.find((p) => p.role === 'appellant' || p.role === 'reported') ?? c.parties[0]!
  return { kind: 'users', id: member.userId, label: member.displayName }
}

function rowsFor(now: number): ExceptionRow[] {
  return store().cases.flatMap((c) => {
    const queue = queueOf(c, now)
    if (!queue) return []
    const t = c.transactionId ? store().transactions.find((x) => x.id === c.transactionId) : undefined
    return [
      {
        queue,
        caseId: c.id,
        caseVersion: c.version,
        subject: subjectOf(c, t),
        whatHappened: c.redaction ? 'Reported content was moderated' : c.summary,
        priority: c.severity,
        dueAt: c.dueAt,
        overdue: Date.parse(c.dueAt) < now,
        assignee: c.assignee,
        nextAction: nextAction(queue, c, t),
      },
    ]
  })
}

const order = (a: ExceptionRow, b: ExceptionRow) =>
  Number(b.overdue) - Number(a.overdue) ||
  SEVERITIES.indexOf(a.priority) - SEVERITIES.indexOf(b.priority) ||
  a.dueAt.localeCompare(b.dueAt)

export const exceptionsDb = {
  queueOf,

  list(queue: ExceptionQueue, cursor?: string, now = Date.now()): ExceptionPage {
    const all = rowsFor(now)
    const counts = Object.fromEntries(
      EXCEPTION_QUEUES.map((q) => [q, all.filter((r) => r.queue === q).length]),
    ) as Record<ExceptionQueue, number>
    return structuredClone({ ...page(all.filter((r) => r.queue === queue).sort(order), cursor), counts })
  },
}
