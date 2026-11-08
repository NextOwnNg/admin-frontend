import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartFrame } from '@/features/dashboard/components/ChartFrame'
import { AXIS, CHART, GRID, LEGEND, SERIES, TOOLTIP } from '@/features/dashboard/components/chart-style'
import { FigureList } from '@/features/dashboard/components/FigureList'
import { FigureTable } from '@/features/dashboard/components/FigureTable'
import { MetricSection } from '@/features/dashboard/components/MetricSection'
import { formatDay, formatHours, noneInRange, per100Against } from '@/features/dashboard/format'
import type { DashboardData, Unmeasured } from '@/lib/api/types/dashboard'
import { DASHBOARD_COPY, NOT_MEASURED } from '@/lib/copy/dashboard'

const unmeasured = ({ reason }: Unmeasured) => (
  <>
    <span>{NOT_MEASURED}</span>
    <span className="block text-caption text-muted">{reason}</span>
  </>
)

/** Support cases and what support costs per deal, where it can be measured (PRD §13.1 "Trust and cost") */
export function SupportSection({ data }: { data: DashboardData }) {
  const { title, definition } = DASHBOARD_COPY.support
  const { support, trust } = data
  const weeks = support.weekly.map((week) => ({ ...week, week: formatDay(week.weekStart) }))

  return (
    <MetricSection
      id="support"
      title={title}
      definition={<p>{definition}</p>}
      summary={
        <FigureList
          items={[
            { label: 'Cases opened', value: support.opened },
            { label: 'Cases resolved', value: support.resolved },
            {
              label: 'Median time to resolve',
              value: formatHours(support.medianHoursToResolve) ?? noneInRange('resolved cases'),
            },
            {
              label: 'Cases per 100 accepted',
              value:
                per100Against(support.opened, trust.accepted, 'cases', 'accepted') ??
                noneInRange('accepted transactions'),
            },
            { label: 'Support minutes per completed deal', value: unmeasured(support.minutesPerCompleted) },
            { label: 'Variable operating cost per completed deal', value: unmeasured(support.costPerCompleted) },
          ]}
        />
      }
      empty={support.weekly.length === 0 ? noneInRange('support cases') : undefined}
      chart={
        <ChartFrame>
          <BarChart {...CHART} data={weeks} margin={{ top: 8 }} barGap={2}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="week" {...AXIS} />
            <YAxis allowDecimals={false} {...AXIS} />
            <Tooltip {...TOOLTIP} />
            <Legend {...LEGEND} />
            <Bar dataKey="opened" name="Opened" fill={SERIES[0]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="resolved" name="Resolved" fill={SERIES[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartFrame>
      }
      table={
        <FigureTable
          caption="Support cases by week"
          columns={['Week of', 'Opened', 'Resolved']}
          rows={support.weekly.map((week) => ({
            key: week.weekStart,
            head: formatDay(week.weekStart),
            cells: [week.opened, week.resolved],
          }))}
        />
      }
    />
  )
}
