import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartFrame } from '@/features/dashboard/components/ChartFrame'
import { AXIS, CHART, GRID, LEGEND, SERIES, TOOLTIP } from '@/features/dashboard/components/chart-style'
import { FigureTable } from '@/features/dashboard/components/FigureTable'
import { MetricSection } from '@/features/dashboard/components/MetricSection'
import { noneInRange, percentOf } from '@/features/dashboard/format'
import type { DashboardData, LiquidityRow, Window } from '@/lib/api/types/dashboard'
import { DASHBOARD_COPY, TOO_RECENT } from '@/lib/copy/dashboard'

const WINDOWS = [
  { key: 'd7', days: 7 },
  { key: 'd14', days: 14 },
  { key: 'd30', days: 30 },
] as const

const windowText = (window: Window | null, days: number) =>
  window === null ? TOO_RECENT(days) : (percentOf(window.completed, window.eligible) ?? TOO_RECENT(days))
const windowShare = (window: Window | null) =>
  window && window.eligible > 0 ? Math.round((window.completed / window.eligible) * 100) : null

function LiquidityTable({ caption, head, rows }: { caption: string; head: string; rows: LiquidityRow[] }) {
  return (
    <FigureTable
      caption={caption}
      columns={[head, 'Listings published', '7-day', '14-day', '30-day']}
      rows={rows.map((row) => ({
        key: row.id,
        head: row.name,
        cells: [row.cohort, ...WINDOWS.map(({ key, days }) => windowText(row[key], days))],
      }))}
    />
  )
}

/** 7/14/30-day liquidity by category, and by area while no area is chosen (PRD §13.1) */
export function LiquiditySection({ data, showAreas }: { data: DashboardData; showAreas: boolean }) {
  const { title, definition } = DASHBOARD_COPY.liquidity
  const { byCategory, byArea } = data.liquidity
  const chartRows = byCategory.map((row) => ({
    name: row.name,
    d7: windowShare(row.d7),
    d14: windowShare(row.d14),
    d30: windowShare(row.d30),
    text: Object.fromEntries(WINDOWS.map(({ key, days }) => [`${days}-day`, windowText(row[key], days)])),
  }))

  return (
    <MetricSection
      id="liquidity"
      title={title}
      definition={<p>{definition}</p>}
      empty={byCategory.length === 0 ? noneInRange('published listings') : undefined}
      chart={
        <ChartFrame>
          <BarChart {...CHART} data={chartRows} margin={{ top: 8 }} barGap={2}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="name" interval={0} {...AXIS} />
            <YAxis domain={[0, 100]} unit="%" {...AXIS} />
            <Tooltip
              {...TOOLTIP}
              formatter={(_value, seriesName, item) => [
                (item.payload as (typeof chartRows)[number]).text[String(seriesName)],
                seriesName,
              ]}
            />
            <Legend {...LEGEND} />
            {WINDOWS.map(({ key, days }, i) => (
              <Bar key={key} dataKey={key} name={`${days}-day`} fill={SERIES[i]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ChartFrame>
      }
      table={
        <div className="flex flex-col gap-6">
          <LiquidityTable caption="Liquidity by category" head="Category" rows={byCategory} />
          {showAreas && <LiquidityTable caption="Liquidity by area" head="Area" rows={byArea} />}
        </div>
      }
    />
  )
}
