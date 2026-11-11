import { Link } from 'react-router'
import { DataTable, type Column, type RowAction, type SortState, type TableStatus } from '@/components/data/DataTable'
import { CaseStatusBadge } from '@/components/domain/CaseStatusBadge'
import { SeverityBadge } from '@/components/domain/SeverityBadge'
import { useNow } from '@/hooks/useNow'
import { useReasonCodes } from '@/lib/api/reference'
import type { CaseSummary } from '@/lib/api/types/cases'
import { TARGET_TYPE_LABELS } from '@/lib/copy/labels'
import { REDACTION } from '@/lib/copy/status'
import { dueText, formatWAT, timeAgo } from '@/lib/time/time'
import type { ReactNode } from 'react'

export type QueueSort = 'severity' | 'age' | '-age'

/** Age column: descending = oldest first */
const toSortState = (sort: QueueSort | undefined): SortState =>
  sort === 'age'
    ? { column: 'age', direction: 'descending' }
    : sort === '-age'
      ? { column: 'age', direction: 'ascending' }
      : { column: 'severity', direction: 'ascending' }

const fromSortState = ({ column, direction }: SortState): QueueSort =>
  column === 'age' ? (direction === 'descending' ? 'age' : '-age') : 'severity'

/** One row per case, S1 pinned and tinted (design §4.2). Never message text or phone numbers. */
export function QueueTable({
  rows,
  status,
  onRetry,
  sort,
  onSortChange,
  rowActions,
  empty,
}: {
  rows: CaseSummary[] | undefined
  status: TableStatus
  onRetry: () => void
  sort: QueueSort | undefined
  onSortChange: (sort: QueueSort) => void
  rowActions: (row: CaseSummary) => RowAction[]
  empty: ReactNode
}) {
  const now = useNow()
  const reasons = useReasonCodes()
  const reasonLabel = (code: string) => reasons.data?.find((r) => r.code === code)?.label ?? code

  const columns: Column<CaseSummary>[] = [
    { id: 'severity', header: 'Severity', sortable: true, cell: (c) => <SeverityBadge severity={c.severity} /> },
    {
      id: 'case',
      header: 'Case',
      rowHeader: true,
      cell: (c) => (
        <div className="flex min-w-56 flex-col gap-0.5">
          <Link
            to={`/cases/${c.id}`}
            className="font-semibold text-ink tabular-nums underline-offset-2 hover:underline"
          >
            {c.id}
          </Link>
          <span className="text-muted">
            {TARGET_TYPE_LABELS[c.type]} · {c.redaction ? REDACTION[c.redaction] : c.summary}
          </span>
          {c.reportCount > 1 && <span className="text-caption text-muted">{c.reportCount} reports</span>}
        </div>
      ),
    },
    { id: 'flag', header: 'Flag', cell: (c) => reasonLabel(c.reasonCode) },
    {
      id: 'age',
      header: 'Age',
      sortable: true,
      cell: (c) => (
        <div className="flex flex-col gap-0.5 whitespace-nowrap tabular-nums">
          <span title={formatWAT(c.openedAt)}>{timeAgo(c.openedAt, now)}</span>
          {c.status !== 'closed' && c.status !== 'resolved' && (
            <span className={c.overdue ? 'text-caption font-semibold text-warning' : 'text-caption text-muted'}>
              {c.overdue ? 'Overdue' : dueText(c.dueAt, now)}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'assignee',
      header: 'Assignee',
      cell: (c) => (c.assignee ? c.assignee.displayName : <span className="text-muted">Unassigned</span>),
    },
    { id: 'status', header: 'Status', cell: (c) => <CaseStatusBadge status={c.status} /> },
  ]

  return (
    <DataTable
      label="Reports"
      tableId="queue"
      columns={columns}
      rows={rows}
      rowKey={(c) => c.id}
      status={status}
      onRetry={onRetry}
      sort={toSortState(sort)}
      onSortChange={(s) => onSortChange(fromSortState(s))}
      rowClassName={(c) => (c.severity === 'S1' ? 'bg-danger/5 [&>td]:bg-danger/5' : undefined)}
      rowActions={rowActions}
      empty={empty}
    />
  )
}
