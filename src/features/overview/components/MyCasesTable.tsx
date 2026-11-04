import { Inbox } from 'lucide-react'
import { Link } from 'react-router'
import { DataTable, type Column, type TableStatus } from '@/components/data/DataTable'
import { CaseStatusBadge } from '@/components/domain/CaseStatusBadge'
import { SeverityBadge } from '@/components/domain/SeverityBadge'
import { EmptyState } from '@/components/ui/States'
import { useNow } from '@/hooks/useNow'
import type { CaseSummary } from '@/lib/api/types/cases'
import { REDACTION } from '@/lib/copy/status'
import { dueText, formatWAT } from '@/lib/time/time'

export function MyCasesTable({
  rows,
  status,
  onRetry,
}: {
  rows: CaseSummary[] | undefined
  status: TableStatus
  onRetry: () => void
}) {
  const now = useNow()
  const columns: Column<CaseSummary>[] = [
    { id: 'severity', header: 'Severity', cell: (c) => <SeverityBadge severity={c.severity} /> },
    {
      id: 'case',
      header: 'Case',
      cell: (c) => (
        <span className="flex flex-col">
          <Link
            to={`/cases/${c.id}`}
            className="font-semibold text-ink tabular-nums underline-offset-2 hover:underline"
          >
            {c.id}
          </Link>
          <span className="text-muted">{c.redaction ? REDACTION[c.redaction] : c.summary}</span>
        </span>
      ),
    },
    {
      id: 'due',
      header: 'Due',
      cell: (c) => (
        <span title={formatWAT(c.dueAt)} className={c.overdue ? 'font-semibold text-warning' : undefined}>
          {dueText(c.dueAt, now)}
        </span>
      ),
    },
    { id: 'status', header: 'Status', cell: (c) => <CaseStatusBadge status={c.status} /> },
  ]
  return (
    <DataTable
      label="My cases"
      columns={columns}
      rows={rows}
      rowKey={(c) => c.id}
      status={status}
      onRetry={onRetry}
      empty={<EmptyState icon={Inbox} title="No cases assigned to you" body="Take one from the reports queue." />}
    />
  )
}
