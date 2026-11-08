import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartFrame } from '@/features/dashboard/components/ChartFrame'
import { AXIS, CHART, GRID, LEGEND, SERIES, TOOLTIP } from '@/features/dashboard/components/chart-style'
import { FigureList } from '@/features/dashboard/components/FigureList'
import { FigureTable } from '@/features/dashboard/components/FigureTable'
import { MetricSection } from '@/features/dashboard/components/MetricSection'
import { formatDay, noneInRange, per100 } from '@/features/dashboard/format'
import type { DashboardData, TrustCounts } from '@/lib/api/types/dashboard'
import { DASHBOARD_COPY } from '@/lib/copy/dashboard'

const KINDS = [
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'disputed', label: 'Disputed' },
  { key: 'lossReported', label: 'Loss-reported' },
] as const

const NONE = noneInRange('accepted transactions')
const rate = (counts: TrustCounts, key: (typeof KINDS)[number]['key']) =>
  per100(counts[key], counts.accepted, 'accepted') ?? NONE

/** Cancelled, disputed and loss-reported transactions per 100 accepted (PRD §13.1 "Trust and cost") */
export function TrustSection({ data }: { data: DashboardData }) {
  const { title, definition } = DASHBOARD_COPY.trust
  const { trust } = data
  const weeks = trust.weekly.map((week) => ({
    week: formatDay(week.weekStart),
    accepted: week.accepted,
    ...Object.fromEntries(
      KINDS.map(({ key }) => [key, week.accepted > 0 ? Math.round((week[key] / week.accepted) * 1000) / 10 : null]),
    ),
    text: Object.fromEntries(KINDS.map(({ key, label }) => [label, rate(week, key)])),
  }))

  return (
    <MetricSection
      id="trust"
      title={title}
      definition={<p>{definition}</p>}
      summary={
        <FigureList
          items={KINDS.map(({ key, label }) => ({ label: `${label} per 100 accepted`, value: rate(trust, key) }))}
        />
      }
      empty={trust.weekly.length === 0 ? NONE : undefined}
      chart={
        <ChartFrame>
          <LineChart {...CHART} data={weeks} margin={{ top: 8, right: 16 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="week" {...AXIS} />
            <YAxis allowDecimals {...AXIS} />
            <Tooltip
              {...TOOLTIP}
              cursor={{ stroke: 'var(--nx-border)' }}
              formatter={(_value, seriesName, item) => [
                (item.payload as (typeof weeks)[number]).text[String(seriesName)],
                seriesName,
              ]}
            />
            <Legend {...LEGEND} />
            {KINDS.map(({ key, label }, i) => (
              <Line
                key={key}
                dataKey={key}
                name={label}
                stroke={SERIES[i]}
                strokeWidth={2}
                dot={{ r: 4, fill: SERIES[i], stroke: 'var(--nx-paper)', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ChartFrame>
      }
      table={
        <FigureTable
          caption="Cancellations and disputes by week"
          columns={['Week of', 'Accepted', ...KINDS.map(({ label }) => label)]}
          rows={trust.weekly.map((week) => ({
            key: week.weekStart,
            head: formatDay(week.weekStart),
            cells: [week.accepted, ...KINDS.map(({ key }) => rate(week, key))],
          }))}
        />
      }
    />
  )
}
