import type { AuditEntry, AuditFilters, AuditPage } from '@/lib/api/types/audit'
import type { AuditRecord } from '@/mocks/seed'
import { reseed, store } from '@/mocks/db/store'

const PAGE_SIZE = 25

const newestFirst = (a: AuditRecord, b: AuditRecord) =>
  b.entry.at.localeCompare(a.entry.at) || b.entry.id.localeCompare(a.entry.id)

export const auditDb = {
  append(record: Omit<AuditRecord, 'entry'> & { entry: Omit<AuditEntry, 'id' | 'at'> }): AuditEntry {
    const { audit } = store()
    const entry: AuditEntry = {
      ...record.entry,
      caseId: record.caseId,
      transactionId: record.transactionId,
      id: `A-${String(audit.length + 1).padStart(6, '0')}`,
      at: new Date().toISOString(),
    }
    audit.push({ ...record, entry })
    return entry
  },

  forCase: (caseId: string) =>
    store()
      .audit.filter((r) => r.caseId === caseId)
      .sort(newestFirst)
      .map((r) => r.entry),

  forTransaction: (transactionId: string) =>
    store()
      .audit.filter((r) => r.transactionId === transactionId)
      .sort(newestFirst)
      .map((r) => r.entry),

  /** The entry an earlier request with this Idempotency-Key produced */
  byKey: (key: string) => store().audit.find((r) => r.idempotencyKey === key)?.entry,

  list(filters: AuditFilters): AuditPage {
    const from = filters.from ? Date.parse(filters.from) : Number.NaN
    const to = filters.to ? Date.parse(filters.to) : Number.NaN
    const rows = store()
      .audit.filter(
        (r) =>
          (!filters.actor || r.actorId === filters.actor) &&
          (!filters.action || r.entry.action === filters.action) &&
          (!filters.targetType || r.entry.target.type === filters.targetType) &&
          (Number.isNaN(from) || Date.parse(r.entry.at) >= from) &&
          // A bare date includes that whole day
          (Number.isNaN(to) || Date.parse(r.entry.at) < to + (filters.to!.length <= 10 ? 86_400_000 : 1)),
      )
      .sort(newestFirst)
    return page(
      rows.map((r) => r.entry),
      filters.cursor,
    )
  },

  reset: reseed,
}

/** Cursor paging: the cursor is an opaque offset; anything unreadable starts at the beginning. */
export function page<T>(rows: T[], cursor?: string): { items: T[]; nextCursor: string | null; total: number } {
  const parsed = Number.parseInt(cursor ?? '', 10)
  const start = Number.isInteger(parsed) && parsed > 0 && parsed < rows.length ? parsed : 0
  const end = start + PAGE_SIZE
  return { items: rows.slice(start, end), nextCursor: end < rows.length ? String(end) : null, total: rows.length }
}
