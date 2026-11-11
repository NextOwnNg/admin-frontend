import { useContext, type ReactNode } from 'react'
import { ScreenReaderOnlyTable } from '@/features/dashboard/components/table-context'

export type FigureRow = { key: string; head: string; cells: ReactNode[] }

/** The table behind a chart: every figure with its count, row headers for screen readers */
export function FigureTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: FigureRow[] }) {
  const hidden = useContext(ScreenReaderOnlyTable)
  const table = (
    <table className="w-full border-collapse text-left text-compact">
      <caption className="pb-2 text-left text-caption font-medium text-muted">{caption}</caption>
      <thead>
        <tr className="border-b border-border">
          {columns.map((column) => (
            <th key={column} scope="col" className="px-3 py-2 font-medium text-muted first:pl-0">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b border-border last:border-0">
            <th scope="row" className="py-2 pr-3 font-medium text-ink">
              {row.head}
            </th>
            {row.cells.map((cell, i) => (
              <td key={i} className="px-3 py-2 text-ink tabular-nums">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
  if (hidden) return table
  // A wide table scrolls sideways (768 px): the keyboard can reach it to scroll (WCAG 2.1.1)
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scroll area must take focus to scroll
    <div role="group" aria-label={caption} tabIndex={0} className="overflow-x-auto">
      {table}
    </div>
  )
}
