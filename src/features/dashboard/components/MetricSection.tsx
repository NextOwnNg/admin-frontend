import type { ReactNode } from 'react'
import { Section } from '@/components/ui/Section'
import { cx } from '@/lib/cx'
import type { DashboardSectionId } from '@/lib/copy/dashboard'
import { useUiStore, type ChartView } from '@/stores/ui'
import { ScreenReaderOnlyTable } from '@/features/dashboard/components/table-context'

const VIEWS: { view: ChartView; label: string }[] = [
  { view: 'chart', label: 'Chart' },
  { view: 'table', label: 'Table' },
]

/**
 * One dashboard section (Phase D design §4.3): title, definition, figures, and a Chart / Table switch remembered per
 * user. The chart is decoration for sighted readers; the table carries the figures and is always in the
 * accessibility tree, visually hidden in chart view.
 */
export function MetricSection({
  id,
  title,
  definition,
  chart,
  table,
  summary,
  empty,
}: {
  id: DashboardSectionId
  title: string
  definition: ReactNode
  chart: ReactNode
  table: ReactNode
  /** Figures shown in both views, above the chart or table */
  summary?: ReactNode
  /** Shown instead of chart and table when there is nothing to show */
  empty?: string
}) {
  const view = useUiStore((s) => s.chartViews[id] ?? 'chart')
  const setChartView = useUiStore((s) => s.setChartView)

  const toggle = (
    <div role="group" aria-label={`Show ${title} as`} className="flex rounded-control border border-border p-0.5">
      {VIEWS.map(({ view: option, label }) => (
        <button
          key={option}
          type="button"
          aria-pressed={view === option}
          onClick={() => setChartView(id, option)}
          className={cx(
            'h-8 rounded-sm px-3 text-compact font-medium',
            view === option ? 'bg-mint text-ink' : 'text-muted hover:text-ink',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <Section title={title} action={empty ? undefined : toggle}>
      <div className="text-compact text-muted">{definition}</div>
      {summary}
      {empty ? (
        <p className="text-body text-muted">{empty}</p>
      ) : view === 'chart' ? (
        <>
          <p className="text-caption text-muted">The same figures are in the table view.</p>
          <div aria-hidden>{chart}</div>
          <div className="sr-only">
            <ScreenReaderOnlyTable value={true}>{table}</ScreenReaderOnlyTable>
          </div>
        </>
      ) : (
        table
      )}
    </Section>
  )
}
