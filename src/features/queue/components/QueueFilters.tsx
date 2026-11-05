import { FilterBar, type FilterChip } from '@/components/data/FilterBar'
import { MultiFilter, SingleFilter } from '@/components/data/FilterControls'
import { labelsOf } from '@/components/data/filter-utils'
import type { QueueFilters as Filters } from '@/features/queue/schemas'
import { useStaff } from '@/lib/api/reference'
import { TARGET_TYPE_LABELS } from '@/lib/copy/labels'
import { CASE_STATUS, SEVERITY } from '@/lib/copy/status'

type SetFilter = <K extends keyof Filters>(key: K, value: Filters[K] | undefined) => void

const STATUS_OPTIONS = Object.entries(CASE_STATUS).map(([value, { label }]) => ({ value, label }))
const SEVERITY_OPTIONS = Object.entries(SEVERITY).map(([value, { label }]) => ({ value, label }))
const TYPE_OPTIONS = Object.entries(TARGET_TYPE_LABELS)
  .filter(([value]) => value !== 'case' && value !== 'settings')
  .map(([value, label]) => ({ value, label }))
const AGE_OPTIONS = [
  { value: '1h', label: 'Under 1 hour' },
  { value: '24h', label: 'Under 24 hours' },
  { value: '7d', label: 'Under 7 days' },
  { value: 'older', label: 'Older than 7 days' },
]

/** Status, severity, type, age and assignee, all kept in the URL (design §4.2). */
export function QueueFilters({
  filters,
  present,
  setFilter,
  onClear,
  canFilterAssignee,
}: {
  filters: Filters
  present: Partial<Filters>
  setFilter: SetFilter
  onClear: () => void
  canFilterAssignee: boolean
}) {
  const staff = useStaff()
  const assigneeOptions = [
    { value: 'me', label: 'Me' },
    { value: 'unassigned', label: 'Unassigned' },
    ...(staff.data ?? []).map((s) => ({ value: s.staffId, label: s.displayName })),
  ]

  const chips: FilterChip[] = []
  if (present.status) {
    chips.push({
      key: 'status',
      label: `Status: ${labelsOf(present.status, STATUS_OPTIONS)}`,
      onRemove: () => setFilter('status', undefined),
    })
  }
  if (present.severity) {
    chips.push({
      key: 'severity',
      label: `Severity: ${labelsOf(present.severity, SEVERITY_OPTIONS)}`,
      onRemove: () => setFilter('severity', undefined),
    })
  }
  if (present.type) {
    chips.push({
      key: 'type',
      label: `Type: ${labelsOf(present.type, TYPE_OPTIONS)}`,
      onRemove: () => setFilter('type', undefined),
    })
  }
  if (present.age) {
    chips.push({
      key: 'age',
      label: `Age: ${labelsOf([present.age], AGE_OPTIONS)}`,
      onRemove: () => setFilter('age', undefined),
    })
  }
  if (present.assignee && canFilterAssignee) {
    chips.push({
      key: 'assignee',
      label: `Assignee: ${labelsOf([present.assignee], assigneeOptions)}`,
      onRemove: () => setFilter('assignee', undefined),
    })
  }

  return (
    <FilterBar chips={chips} onClear={onClear}>
      <MultiFilter
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.status}
        onChange={(v) => setFilter('status', v as Filters['status'] | undefined)}
      />
      <MultiFilter
        label="Severity"
        options={SEVERITY_OPTIONS}
        selected={present.severity}
        onChange={(v) => setFilter('severity', v as Filters['severity'])}
      />
      <MultiFilter
        label="Type"
        options={TYPE_OPTIONS}
        selected={present.type}
        onChange={(v) => setFilter('type', v as Filters['type'])}
      />
      <SingleFilter
        label="Age"
        options={AGE_OPTIONS}
        value={present.age}
        onChange={(v) => setFilter('age', v as Filters['age'])}
      />
      {canFilterAssignee && (
        <SingleFilter
          label="Assignee"
          options={assigneeOptions}
          value={present.assignee}
          onChange={(v) => setFilter('assignee', v)}
        />
      )}
    </FilterBar>
  )
}
