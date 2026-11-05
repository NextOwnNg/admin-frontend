import { Dropdown, Table } from '@heroui/react'
import { EllipsisVertical } from 'lucide-react'
import type { ReactNode } from 'react'
import { ErrorState, PermissionDenied, TableSkeleton } from '@/components/ui/States'
import { cx } from '@/lib/cx'

export type Column<T> = {
  id: string
  header: string
  sortable?: boolean
  cell: (row: T) => ReactNode
  className?: string
}

export type SortState = { column: string; direction: 'ascending' | 'descending' }
export type RowAction = { label: string; onAction: () => void }
export type TableStatus = 'pending' | 'error' | 'forbidden' | 'success'

type DataTableProps<T> = {
  /** Names the grid for screen readers */
  label: string
  columns: Column<T>[]
  rows: T[] | undefined
  rowKey: (row: T) => string
  status: TableStatus
  onRetry?: () => void
  sort?: SortState
  onSortChange?: (sort: SortState) => void
  rowClassName?: (row: T) => string | undefined
  rowActions?: (row: T) => RowAction[]
  /** Shown when the request succeeded with no rows */
  empty: ReactNode
}

/**
 * The console's table (design §7): HeroUI's keyboard grid with a sticky header, server-side sort and an
 * overflow menu per row. Loading, error, permission and empty states replace the rows, never the page.
 */
export function DataTable<T>({
  label,
  columns,
  rows,
  rowKey,
  status,
  onRetry,
  sort,
  onSortChange,
  rowClassName,
  rowActions,
  empty,
}: DataTableProps<T>) {
  if (status === 'pending' && !rows) return <TableSkeleton columns={columns.length} />
  if (status === 'error' && !rows) return <ErrorState onRetry={onRetry} />
  if (status === 'forbidden') return <PermissionDenied />
  if (!rows || rows.length === 0) return <>{empty}</>

  const allColumns: Column<T>[] = rowActions
    ? [...columns, { id: '__actions', header: 'Actions', cell: () => null, className: 'w-14' }]
    : columns

  return (
    <Table className="rounded-card border border-border bg-paper">
      <Table.ScrollContainer className="max-h-[70dvh] overflow-auto">
        <Table.Content
          aria-label={label}
          className="min-w-full"
          sortDescriptor={sort ? { column: sort.column, direction: sort.direction } : undefined}
          onSortChange={(d) => onSortChange?.({ column: String(d.column), direction: d.direction })}
        >
          <Table.Header className="sticky top-0 z-10 bg-paper">
            {allColumns.map((column, index) => (
              <Table.Column
                key={column.id}
                id={column.id}
                isRowHeader={index === 0}
                allowsSorting={column.sortable}
                className={cx('text-left text-caption text-muted', column.className)}
              >
                {({ sortDirection }) =>
                  column.id === '__actions' ? (
                    <span className="sr-only">{column.header}</span>
                  ) : column.sortable ? (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                      {column.header}
                    </Table.SortableColumnHeader>
                  ) : (
                    column.header
                  )
                }
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {rows.map((row) => {
              const key = rowKey(row)
              return (
                <Table.Row key={key} id={key} className={rowClassName?.(row)}>
                  {allColumns.map((column) => (
                    <Table.Cell key={column.id} className={cx('align-top text-compact', column.className)}>
                      {column.id === '__actions' && rowActions ? (
                        <RowMenu rowKey={key} actions={rowActions(row)} />
                      ) : (
                        column.cell(row)
                      )}
                    </Table.Cell>
                  ))}
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}

function RowMenu({ rowKey, actions }: { rowKey: string; actions: RowAction[] }) {
  if (actions.length === 0) return null
  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={`Actions for ${rowKey}`}
        className="flex size-10 items-center justify-center rounded-control text-muted hover:bg-cloud"
      >
        <EllipsisVertical aria-hidden className="size-5" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu onAction={(key) => actions[Number(key)]?.onAction()}>
          {actions.map((action, index) => (
            <Dropdown.Item key={action.label} id={String(index)} textValue={action.label}>
              {action.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
