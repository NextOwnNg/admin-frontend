import type { ReactNode } from 'react'
import { DataTable, type TableStatus } from '@/components/data/DataTable'
import { SeverityBadge } from '@/components/domain/SeverityBadge'
import { RecordLink } from '@/features/records/components/RecordLink'
import { useNow } from '@/hooks/useNow'
import type { ExceptionRow } from '@/lib/api/types/exceptions'
import { cx } from '@/lib/cx'
import { dueText, formatWAT } from '@/lib/time/time'

/** A transaction is known by its ID here; anything else by its name */
const shortLabel = (r: ExceptionRow) => (r.subject.kind === 'transactions' ? r.subject.id : r.subject.label)

/** One exception queue as a table: priority, what it's about, when it's due, who has it, what's next */
export function ExceptionTable({
  label,
  rows,
  status,
  onRetry,
  nextAction,
  canOpenCase,
  canBrowse,
  empty,
}: {
  label: string
  rows: ExceptionRow[] | undefined
  status: TableStatus
  onRetry: () => void
  nextAction: (row: ExceptionRow) => ReactNode
  /** Whether the viewer may open this row's case now (a support agent only once it is theirs) */
  canOpenCase: (row: ExceptionRow) => boolean
  /** Whether the viewer may open record pages; links nobody can follow are plain text */
  canBrowse: boolean
  empty: ReactNode
}) {
  const now = useNow()
  return (
    <DataTable
      label={label}
      tableId="exceptions"
      rows={rows}
      rowKey={(r) => r.caseId}
      status={status}
      onRetry={onRetry}
      empty={empty}
      columns={[
        { id: 'priority', header: 'Priority', cell: (r) => <SeverityBadge severity={r.priority} /> },
        {
          id: 'record',
          header: 'Record',
          cell: (r) => (
            <span className="flex flex-col gap-0.5 whitespace-nowrap">
              {canOpenCase(r) ? (
                <RecordLink record={{ kind: 'cases', id: r.caseId, label: r.caseId }} />
              ) : (
                <span className="font-medium text-ink tabular-nums">{r.caseId}</span>
              )}
              {canBrowse ? (
                <RecordLink record={{ ...r.subject, label: shortLabel(r) }} showId={false} />
              ) : (
                <span className="text-muted">{shortLabel(r)}</span>
              )}
            </span>
          ),
        },
        { id: 'what', header: 'What happened', cell: (r) => r.whatHappened },
        {
          // Due and who has it share a column, so Next action stays in view at 1024 px
          id: 'due',
          header: 'Due and assignee',
          cell: (r) => (
            <span className="flex flex-col gap-0.5">
              <span
                title={formatWAT(r.dueAt)}
                className={cx('whitespace-nowrap tabular-nums', r.overdue && 'font-semibold text-danger')}
              >
                {dueText(r.dueAt, now)}
              </span>
              <span className="text-muted">{r.assignee?.displayName ?? 'Unassigned'}</span>
            </span>
          ),
        },
        { id: 'next', header: 'Next action', hideable: false, cell: nextAction },
      ]}
    />
  )
}
