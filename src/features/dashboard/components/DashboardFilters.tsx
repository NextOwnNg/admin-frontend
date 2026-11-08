import { useId, type ReactNode } from 'react'
import { FilterBar, type FilterChip } from '@/components/data/FilterBar'
import { formatDay } from '@/features/dashboard/format'
import type { DashboardFilters as Filters, ResolvedRange } from '@/features/dashboard/schemas'
import type { Area, Category } from '@/lib/api/types/settings'
import { RANGE_PRESETS } from '@/lib/copy/dashboard'

const controlClass = 'h-control-compact rounded-control border border-border bg-paper px-3 text-compact text-ink'

function Filter({ label, children, error }: { label: string; children: ReactNode; error?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex flex-col gap-1 text-caption text-muted">
        {label}
        {children}
      </label>
      {error}
    </div>
  )
}

type Patch = { [K in keyof Filters]?: Filters[K] | undefined }

const option = (item: { id: string; name: string; active: boolean }) => (
  <option key={item.id} value={item.id}>
    {item.active ? item.name : `${item.name} (inactive)`}
  </option>
)

/**
 * Date range, category and area (Phase D design §4.1). Category and area come from settings, inactive ones included
 * because history uses them; `category` and `area` are only the IDs settings know, so an unknown one shows nothing.
 */
export function DashboardFilters({
  filters,
  range,
  shown,
  pilotStart,
  categories,
  areas,
  category,
  area,
  problem,
  setFilters,
  clear,
}: {
  filters: Filters
  range: ResolvedRange
  /** The range the figures on screen cover, which Custom starts from */
  shown?: { from: string; to: string }
  /** Where a range with no start begins, for filling Custom */
  pilotStart: string
  categories: Category[]
  areas: Area[]
  category?: string
  area?: string
  problem: { field: 'from' | 'to'; message: string } | null
  setFilters: (patch: Patch) => void
  clear: () => void
}) {
  const errorId = useId()

  const choosePreset = (value: string) => {
    if (value === 'custom') {
      // The figures on screen, once settled; while new ones load, the range just asked for
      setFilters({ range: undefined, from: shown?.from ?? range.from ?? pilotStart, to: shown?.to ?? range.to })
    } else {
      // The default needs no parameter
      setFilters({ range: value === '30d' ? undefined : (value as Filters['range']), from: undefined, to: undefined })
    }
  }

  const dateInput = (field: 'from' | 'to', label: string) => {
    const invalid = problem?.field === field
    return (
      <Filter
        label={label}
        error={
          invalid && (
            <p id={errorId} role="alert" className="max-w-56 text-caption text-danger">
              {problem.message}
            </p>
          )
        }
      >
        <input
          type="date"
          className={controlClass}
          value={(field === 'from' ? range.from : range.to) ?? ''}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          onChange={(e) => setFilters({ [field]: e.target.value || undefined })}
        />
      </Filter>
    )
  }

  const chips: FilterChip[] = []
  // Dates in the address make it Custom, so a preset left beside them means nothing
  if (filters.range && range.preset !== 'custom') {
    chips.push({ key: 'range', label: RANGE_PRESETS[filters.range], onRemove: () => setFilters({ range: undefined }) })
  }
  if (filters.from) {
    chips.push({
      key: 'from',
      label: `From ${formatDay(filters.from)}`,
      onRemove: () => setFilters({ from: undefined }),
    })
  }
  if (filters.to) {
    chips.push({ key: 'to', label: `To ${formatDay(filters.to)}`, onRemove: () => setFilters({ to: undefined }) })
  }
  const categoryName = categories.find((c) => c.id === category)?.name
  if (categoryName) {
    chips.push({
      key: 'category',
      label: `Category: ${categoryName}`,
      onRemove: () => setFilters({ category: undefined }),
    })
  }
  const areaName = areas.find((a) => a.id === area)?.name
  if (areaName) chips.push({ key: 'area', label: `Area: ${areaName}`, onRemove: () => setFilters({ area: undefined }) })

  return (
    <FilterBar chips={chips} onClear={clear}>
      <Filter label="Date range">
        <select className={controlClass} value={range.preset} onChange={(e) => choosePreset(e.target.value)}>
          {Object.entries(RANGE_PRESETS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Filter>
      {range.preset === 'custom' && (
        <>
          {dateInput('from', 'From')}
          {dateInput('to', 'To')}
        </>
      )}
      <Filter label="Category">
        <select
          className={controlClass}
          value={category ?? ''}
          onChange={(e) => setFilters({ category: e.target.value || undefined })}
        >
          <option value="">Any category</option>
          {categories.map(option)}
        </select>
      </Filter>
      <Filter label="Area">
        <select
          className={controlClass}
          value={area ?? ''}
          onChange={(e) => setFilters({ area: e.target.value || undefined })}
        >
          <option value="">Any area</option>
          {areas.map(option)}
        </select>
      </Filter>
    </FilterBar>
  )
}
