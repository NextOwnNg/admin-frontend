import { History } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { DataTable, type Column, type TableStatus } from '@/components/data/DataTable'
import { AuditChanges } from '@/components/domain/AuditEntry'
import { EmptyState } from '@/components/ui/States'
import { useReasonLabel } from '@/lib/api/reference'
import type { AuditEntry } from '@/lib/api/types/audit'
import { AUDIT_ACTIONS } from '@/lib/copy/audit'
import { formatUTC, formatWAT } from '@/lib/time/time'

function Reason({ code }: { code: string | null }) {
  return <>{useReasonLabel(code) ?? <span className="text-muted">None</span>}</>
}

function Target({ entry }: { entry: AuditEntry }) {
  const { target, caseId, transactionId } = entry
  const links: ReactNode[] = []
  if (caseId) {
    links.push(
      <Link key="case" to={`/cases/${caseId}`} className="text-action tabular-nums underline underline-offset-2">
        Case {caseId}
      </Link>,
    )
  }
  if (transactionId) {
    links.push(
      <Link
        key="tx"
        to={`/transactions/${transactionId}`}
        className="text-action tabular-nums underline underline-offset-2"
      >
        Transaction {transactionId}
      </Link>,
    )
  }
  const own = (target.type === 'case' && caseId) || (target.type === 'transaction' && transactionId)
  return (
    <span className="flex flex-col">
      {!own && <span className="text-ink">{target.label}</span>}
      {links}
    </span>
  )
}

/** Read-only log rows (design §4.6): no edit or delete anywhere. */
export function AuditTable({
  rows,
  status,
  onRetry,
  filtered,
  onClear,
}: {
  rows: AuditEntry[] | undefined
  status: TableStatus
  onRetry: () => void
  filtered: boolean
  onClear: () => void
}) {
  const columns: Column<AuditEntry>[] = [
    {
      id: 'time',
      header: 'Time',
      cell: (e) => (
        <span className="flex flex-col whitespace-nowrap tabular-nums">
          <time dateTime={e.at}>{formatWAT(e.at)}</time>
          <span className="text-caption text-muted">{formatUTC(e.at)}</span>
        </span>
      ),
    },
    { id: 'actor', header: 'Actor', cell: (e) => e.actor },
    { id: 'action', header: 'Action', cell: (e) => AUDIT_ACTIONS[e.action]?.label ?? e.action },
    { id: 'target', header: 'Target', cell: (e) => <Target entry={e} /> },
    { id: 'reason', header: 'Reason', cell: (e) => <Reason code={e.reasonCode} /> },
    { id: 'details', header: 'Details', cell: (e) => <AuditChanges entry={e} />, className: 'min-w-48' },
  ]
  return (
    <DataTable
      label="Moderation log"
      columns={columns}
      rows={rows}
      rowKey={(e) => e.id}
      status={status}
      onRetry={onRetry}
      empty={
        <EmptyState
          icon={History}
          title={filtered ? 'No entries match these filters' : 'Nothing recorded yet'}
          action={
            filtered ? (
              <button type="button" onClick={onClear} className="button button--secondary button--md">
                Clear filters
              </button>
            ) : undefined
          }
        />
      }
    />
  )
}
