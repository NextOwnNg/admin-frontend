import { ChartColumn } from 'lucide-react'
import { PageHead } from '@/components/seo/PageHead'
import { PlainButton } from '@/components/ui/Button'
import { EmptyState, ErrorState, PermissionDenied } from '@/components/ui/States'
import { useDashboard } from '@/features/dashboard/api/useDashboard'
import { DashboardFilters } from '@/features/dashboard/components/DashboardFilters'
import { formatDay } from '@/features/dashboard/format'
import { FunnelSection } from '@/features/dashboard/sections/FunnelSection'
import { LiquiditySection } from '@/features/dashboard/sections/LiquiditySection'
import { ModeRatesSection } from '@/features/dashboard/sections/ModeRatesSection'
import { SupportSection } from '@/features/dashboard/sections/SupportSection'
import { TrustSection } from '@/features/dashboard/sections/TrustSection'
import { rangeError } from '@/features/dashboard/range'
import { dashboardFilterSchema, resolveRange } from '@/features/dashboard/schemas'
import { useSettings } from '@/features/settings/api/useSettings'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { isForbidden } from '@/lib/api/error-message'
import type { DashboardData, DashboardQuery } from '@/lib/api/types/dashboard'
import { serverNow } from '@/lib/time/server-clock'
import { formatWAT, watToday } from '@/lib/time/time'

/** The sections; Recharts stays in this lazy chunk */
function Figures({ data, showAreas }: { data: DashboardData; showAreas: boolean }) {
  return (
    <>
      <FunnelSection data={data} />
      <ModeRatesSection data={data} />
      <LiquiditySection data={data} showAreas={showAreas} />
      <TrustSection data={data} />
      <SupportSection data={data} />
    </>
  )
}

/** How the pilot is doing, by PRD §13.1's definitions, with no targets (ADM-FE-10, Phase D design §4). */
export function DashboardPage() {
  const { filters, setFilters, clear } = useUrlFilters(dashboardFilterSchema)
  const settings = useSettings()
  const categories = settings.data?.categories ?? []
  const areas = settings.data?.locations.flatMap((city) => city.areas) ?? []
  // An ID settings doesn't know (removed, or typed into the address) is no filter at all
  const category = categories.some((c) => c.id === filters.category) ? filters.category : undefined
  const area = areas.some((a) => a.id === filters.area) ? filters.area : undefined

  const range = resolveRange(filters, watToday(serverNow()))
  const problem = range.preset === 'custom' ? rangeError(range.from, range.to) : null
  const query: DashboardQuery | null =
    settings.isSuccess && !problem
      ? {
          to: range.to,
          ...(range.from && { from: range.from }),
          ...(category && { category }),
          ...(area && { area }),
        }
      : null
  const dashboard = useDashboard(query)
  const data = dashboard.data
  // A held query (invalid range) keeps its old data as a placeholder without loading anything
  const updating = query !== null && dashboard.isPlaceholderData && dashboard.isFetching
  const forbidden = isForbidden(dashboard.error) || isForbidden(settings.error)

  const body = () => {
    if (forbidden) return <PermissionDenied />
    if (problem) return null
    if (dashboard.isError || settings.isError) {
      return (
        <ErrorState
          onRetry={() => {
            void settings.refetch()
            void dashboard.refetch()
          }}
        />
      )
    }
    if (!data) {
      return (
        <div className="flex flex-col gap-6" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-card bg-mint" />
          ))}
        </div>
      )
    }
    if (data.funnel.published === 0 && data.support.opened === 0) {
      return (
        <EmptyState
          icon={ChartColumn}
          title="No activity in this range"
          body="Try a longer date range, or clear the filters."
          action={
            <PlainButton variant="secondary" onClick={clear}>
              Clear filters
            </PlainButton>
          }
        />
      )
    }
    return <Figures data={data} showAreas={!area} />
  }

  return (
    <>
      <PageHead title="Dashboard" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-ink">Dashboard</h1>
          {data && !forbidden && !problem && (
            <p className="text-body text-muted">
              Figures for {formatDay(data.range.from)} – {formatDay(data.range.to)} · Data through{' '}
              {formatWAT(data.dataThrough)}
            </p>
          )}
        </div>
        {!forbidden && (
          <DashboardFilters
            filters={filters}
            range={range}
            shown={data?.range}
            categories={categories}
            areas={areas}
            category={category}
            area={area}
            problem={problem}
            setFilters={setFilters}
            clear={clear}
          />
        )}
        <div role="region" aria-label="Figures" aria-busy={updating} className="flex flex-col gap-6">
          <p role="status" className="text-caption text-muted empty:hidden">
            {updating ? 'Updating…' : ''}
          </p>
          {body()}
        </div>
      </div>
    </>
  )
}
