import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartFrame } from '@/features/dashboard/components/ChartFrame'
import { AXIS, CHART, GRID, SERIES, TOOLTIP } from '@/features/dashboard/components/chart-style'
import { FigureTable } from '@/features/dashboard/components/FigureTable'
import { MetricSection } from '@/features/dashboard/components/MetricSection'
import { noneInRange, percentOf } from '@/features/dashboard/format'
import type { DashboardData } from '@/lib/api/types/dashboard'
import { DASHBOARD_COPY } from '@/lib/copy/dashboard'

/** Listing → offer → acceptance → completion (ADM-FE-10). "Received an offer" counts any offer. */
export function FunnelSection({ data }: { data: DashboardData }) {
  const { published, receivedOffer, accepted, completed } = data.funnel
  const stages = [
    { stage: 'Published', listings: published },
    { stage: 'Received an offer', listings: receivedOffer },
    { stage: 'Accepted', listings: accepted },
    { stage: 'Completed', listings: completed },
  ]
  const { title, definition } = DASHBOARD_COPY.funnel

  return (
    <MetricSection
      id="funnel"
      title={title}
      definition={<p>{definition}</p>}
      empty={published === 0 ? noneInRange('published listings') : undefined}
      chart={
        <ChartFrame>
          <BarChart {...CHART} data={stages} layout="vertical" margin={{ left: 8, right: 48 }}>
            <CartesianGrid {...GRID} horizontal={false} vertical />
            <XAxis type="number" allowDecimals={false} {...AXIS} />
            <YAxis type="category" dataKey="stage" width={136} {...AXIS} />
            <Tooltip {...TOOLTIP} />
            <Bar dataKey="listings" name="Listings" fill={SERIES[0]} radius={[0, 4, 4, 0]} barSize={28}>
              <LabelList dataKey="listings" position="right" fill="var(--nx-ink)" fontSize={13} />
            </Bar>
          </BarChart>
        </ChartFrame>
      }
      table={
        <FigureTable
          caption={title}
          columns={['Stage', 'Listings', 'From previous stage']}
          rows={stages.map(({ stage, listings }, i) => ({
            key: stage,
            head: stage,
            cells: [
              listings,
              i === 0
                ? '—'
                : (percentOf(listings, stages[i - 1]!.listings) ?? noneInRange('listings at the stage before')),
            ],
          }))}
        />
      }
    />
  )
}
