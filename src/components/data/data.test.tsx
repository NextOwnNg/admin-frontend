import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { DataTable, type Column } from '@/components/data/DataTable'
import { FilterBar } from '@/components/data/FilterBar'
import { KeyValueList } from '@/components/data/KeyValueList'
import { Pagination } from '@/components/data/Pagination'
import { expectNoA11yViolations } from '@/test/axe'

type Row = { id: string; name: string; age: number }
const rows: Row[] = [
  { id: 'NX-1', name: 'First', age: 2 },
  { id: 'NX-2', name: 'Second', age: 5 },
]
const columns: Column<Row>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name },
  { id: 'age', header: 'Age', sortable: true, cell: (r) => `${r.age} h` },
]
const base = { label: 'Reports', columns, rowKey: (r: Row) => r.id, empty: <p>No reports</p> }

describe('DataTable (design §7)', () => {
  it('shows skeleton rows while loading', () => {
    render(<DataTable {...base} rows={undefined} status="pending" />)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('offers a retry when loading fails', async () => {
    const onRetry = vi.fn()
    render(<DataTable {...base} rows={undefined} status="error" onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('shows the permission state', () => {
    const router = createMemoryRouter([
      { path: '/', element: <DataTable {...base} rows={undefined} status="forbidden" /> },
    ])
    render(<RouterProvider router={router} />)
    expect(screen.getByRole('heading', { name: "You don't have permission to view this page" })).toBeInTheDocument()
  })

  it('shows the empty state when there are no rows', () => {
    render(<DataTable {...base} rows={[]} status="success" />)
    expect(screen.getByText('No reports')).toBeInTheDocument()
  })

  it('renders rows in a labelled grid', async () => {
    const { container } = render(<DataTable {...base} rows={rows} status="success" />)
    const table = screen.getByRole('grid', { name: 'Reports' })
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(within(table).getByText('Second')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('asks to sort when a sortable header is pressed', async () => {
    const onSortChange = vi.fn()
    render(
      <DataTable
        {...base}
        rows={rows}
        status="success"
        sort={{ column: 'age', direction: 'ascending' }}
        onSortChange={onSortChange}
      />,
    )
    await userEvent.click(screen.getByRole('columnheader', { name: /Age/ }))
    expect(onSortChange).toHaveBeenCalledWith({ column: 'age', direction: 'descending' })
  })

  it('lists row actions in a menu named for the row', async () => {
    const open = vi.fn<(id: string) => void>()
    render(
      <DataTable
        {...base}
        rows={rows}
        status="success"
        rowActions={(r) => [{ label: 'Open case', onAction: () => open(r.id) }]}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Actions for NX-2' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Open case' }))
    expect(open).toHaveBeenCalledWith('NX-2')
  })
})

describe('FilterBar', () => {
  it('removes one filter or clears them all', async () => {
    const onRemove = vi.fn()
    const onClear = vi.fn()
    const { container } = render(
      <FilterBar chips={[{ key: 'severity', label: 'Severity: S1', onRemove }]} onClear={onClear}>
        <span>controls</span>
      </FilterBar>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter Severity: S1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(onRemove).toHaveBeenCalledOnce()
    expect(onClear).toHaveBeenCalledOnce()
    await expectNoA11yViolations(container)
  })

  it('hides Clear filters when nothing is filtered', () => {
    render(
      <FilterBar chips={[]} onClear={() => {}}>
        <span>controls</span>
      </FilterBar>,
    )
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
  })
})

describe('Pagination and KeyValueList', () => {
  it('counts what is shown and pages on', async () => {
    const onNext = vi.fn()
    render(
      <Pagination
        label="Reports"
        shown={25}
        total={61}
        hasNext
        hasPrevious={false}
        onNext={onNext}
        onPrevious={() => {}}
      />,
    )
    expect(screen.getByText('Showing 25 of 61')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('lists terms and values', async () => {
    const { container } = render(<KeyValueList items={[{ term: 'Status', value: 'Assigned' }]} />)
    expect(screen.getByRole('term')).toHaveTextContent('Status')
    expect(screen.getByRole('definition')).toHaveTextContent('Assigned')
    await expectNoA11yViolations(container)
  })
})
