import { DataTable, type Column, type RowAction, type TableStatus } from '@/components/data/DataTable'
import type { StaffAccountRow } from '@/lib/api/types/staff'
import { ROLE_LABELS } from '@/lib/copy/labels'
import { STAFF_COPY, staffStatus } from '@/lib/copy/staff'

const columns: Column<StaffAccountRow>[] = [
  {
    id: 'name',
    header: 'Name',
    rowHeader: true,
    cell: (r) => <span className="font-medium text-ink">{r.displayName}</span>,
  },
  { id: 'email', header: 'Email', cell: (r) => r.email },
  { id: 'role', header: 'Role', cell: (r) => ROLE_LABELS[r.role] },
  {
    id: 'status',
    header: 'Status',
    cell: (r) => <span className={r.status === 'active' ? 'text-ink' : 'text-muted'}>{staffStatus(r)}</span>,
  },
]

/** Everyone with access and everyone invited. Only invites have actions: roles are changed outside the console. */
export function StaffTable({
  rows,
  status,
  onRetry,
  onResend,
  onRevoke,
}: {
  rows: StaffAccountRow[] | undefined
  status: TableStatus
  onRetry: () => void
  onResend: (row: StaffAccountRow) => void
  onRevoke: (row: StaffAccountRow) => void
}) {
  const actions = (row: StaffAccountRow): RowAction[] =>
    row.status === 'active'
      ? []
      : [
          { label: 'Resend invite', onAction: () => onResend(row) },
          { label: 'Revoke invite', onAction: () => onRevoke(row) },
        ]

  return (
    <DataTable
      label="Staff"
      columns={columns}
      rows={rows}
      rowKey={(r) => r.email}
      status={status}
      onRetry={onRetry}
      rowActions={actions}
      empty={<p className="text-body text-muted">{STAFF_COPY.empty}</p>}
    />
  )
}
