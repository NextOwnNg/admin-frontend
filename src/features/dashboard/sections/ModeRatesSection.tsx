import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartFrame } from '@/features/dashboard/components/ChartFrame'
import { AXIS, CHART, GRID, LEGEND, SERIES, TOOLTIP } from '@/features/dashboard/components/chart-style'
import { FigureTable } from '@/features/dashboard/components/FigureTable'
import { MetricSection } from '@/features/dashboard/components/MetricSection'
import { formatHours, noneInRange, percentOf } from '@/features/dashboard/format'
import type { DashboardData, ModeKey } from '@/lib/api/types/dashboard'
import { ALL_MODES, completionDefinition, DASHBOARD_COPY } from '@/lib/copy/dashboard'
import { LISTING_MODE } from '@/lib/copy/records'

const MODES: ModeKey[] = ['ALL', 'CASH', 'SWAP', 'SWAP_PLUS_CASH']
const label = (mode: ModeKey) => (mode === 'ALL' ? ALL_MODES : LISTING_MODE[mode])
const share = (n: number, d: number) => (d === 0 ? null : Math.round((n / d) * 100))

/** Offer acceptance rate, completion rate and time to completion, by mode (PRD §13.1) */
export function ModeRatesSection({ data }: { data: DashboardData }) {
  const { acceptance, completion, time } = {
    acceptance: DASHBOARD_COPY.acceptance,
    completion: DASHBOARD_COPY.completion,
    time: DASHBOARD_COPY.timeToCompletion,
  }
  const rows = MODES.map((mode) => {
    const a = data.acceptance[mode]
    const c = data.completion[mode]
    return {
      mode,
      name: label(mode),
      acceptance: percentOf(a.accepted, a.decided) ?? noneInRange('decided negotiations'),
      completion: percentOf(c.completed, c.matureAccepted) ?? noneInRange('mature accepted transactions'),
      time: formatHours(c.medianHours) ?? noneInRange('completed deals'),
      incomplete:
        percentOf(c.matureAccepted - c.completed, c.matureAccepted) ?? noneInRange('mature accepted transactions'),
      acceptancePct: share(a.accepted, a.decided),
      completionPct: share(c.completed, c.matureAccepted),
    }
  })
  const byName = new Map(rows.map((row) => [row.name, row]))

  return (
    <MetricSection
      id="modes"
      title="Rates by mode"
      definition={
        <dl className="grid gap-1">
          {[
            [acceptance.title, acceptance.definition],
            [completion.title, completionDefinition(data.maturityDays)],
            [time.title, time.definition],
          ].map(([term, text]) => (
            <div key={term}>
              <dt className="inline font-medium text-ink">{term}: </dt>
              <dd className="inline">{text}</dd>
            </div>
          ))}
        </dl>
      }
      chart={
        <ChartFrame>
          <BarChart {...CHART} data={rows} margin={{ top: 8 }} barGap={2}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="name" {...AXIS} />
            <YAxis domain={[0, 100]} unit="%" {...AXIS} />
            <Tooltip
              {...TOOLTIP}
              formatter={(_value, seriesName, item) => {
                const row = byName.get((item.payload as { name: string }).name)!
                return [seriesName === acceptance.title ? row.acceptance : row.completion, seriesName]
              }}
            />
            <Legend {...LEGEND} />
            <Bar dataKey="acceptancePct" name={acceptance.title} fill={SERIES[0]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="completionPct" name={completion.title} fill={SERIES[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartFrame>
      }
      table={
        <FigureTable
          caption="Rates by mode"
          columns={['Mode', acceptance.title, completion.title, time.title, 'Incomplete share']}
          rows={rows.map((row) => ({
            key: row.mode,
            head: row.name,
            cells: [row.acceptance, row.completion, row.time, row.incomplete],
          }))}
        />
      }
    />
  )
}
