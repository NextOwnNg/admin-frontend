import { FilterBar, type FilterChip } from '@/components/data/FilterBar'
import { Pagination } from '@/components/data/Pagination'
import { PageHead } from '@/components/seo/PageHead'
import { useAuditLog } from '@/features/audit/api/useAuditLog'
import { AuditTable } from '@/features/audit/components/AuditTable'
import { auditFilterSchema, type AuditLogFilters } from '@/features/audit/schemas'
import { useCursorStack } from '@/hooks/useCursorStack'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { isForbidden } from '@/lib/api/error-message'
import { useStaff } from '@/lib/api/reference'
import { AUDIT_ACTIONS } from '@/lib/copy/audit'
import { TARGET_TYPE_LABELS } from '@/lib/copy/labels'

const controlClass = 'h-control-compact rounded-control border border-border bg-paper px-3 text-compact text-ink'

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-caption text-muted">
      {label}
      {children}
    </label>
  )
}

/** Every privileged action, read-only, for administrators (design §4.6). */
export function AuditLogPage() {
  const { filters, present, setFilter, clear } = useUrlFilters(auditFilterSchema)
  const pages = useCursorStack(filters)
  const log = useAuditLog(filters)
  const staff = useStaff()
  const page = log.data
  const status = log.isPending ? 'pending' : isForbidden(log.error) ? 'forbidden' : log.isError ? 'error' : 'success'

  const set =
    <K extends keyof AuditLogFilters>(key: K) =>
    (value: string) =>
      setFilter(key, (value || undefined) as AuditLogFilters[K])

  const chips: FilterChip[] = []
  if (present.actor) {
    const name = staff.data?.find((s) => s.staffId === present.actor)?.displayName ?? present.actor
    chips.push({ key: 'actor', label: `Actor: ${name}`, onRemove: () => setFilter('actor', undefined) })
  }
  if (present.action) {
    chips.push({
      key: 'action',
      label: `Action: ${AUDIT_ACTIONS[present.action]?.label}`,
      onRemove: () => setFilter('action', undefined),
    })
  }
  if (present.targetType) {
    chips.push({
      key: 'targetType',
      label: `Target: ${TARGET_TYPE_LABELS[present.targetType]}`,
      onRemove: () => setFilter('targetType', undefined),
    })
  }
  if (present.from)
    chips.push({ key: 'from', label: `From ${present.from}`, onRemove: () => setFilter('from', undefined) })
  if (present.to) chips.push({ key: 'to', label: `To ${present.to}`, onRemove: () => setFilter('to', undefined) })

  return (
    <>
      <PageHead title="Moderation log" />
      <div className="flex flex-col gap-6">
        <h1 className="text-h1 text-ink">Moderation log</h1>
        <FilterBar chips={chips} onClear={clear}>
          <Filter label="Actor">
            <select className={controlClass} value={filters.actor ?? ''} onChange={(e) => set('actor')(e.target.value)}>
              <option value="">Anyone</option>
              {(staff.data ?? []).map((s) => (
                <option key={s.staffId} value={s.staffId}>
                  {s.displayName}
                </option>
              ))}
            </select>
          </Filter>
          <Filter label="Action">
            <select
              className={controlClass}
              value={filters.action ?? ''}
              onChange={(e) => set('action')(e.target.value)}
            >
              <option value="">Any action</option>
              {Object.entries(AUDIT_ACTIONS).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Filter>
          <Filter label="Target type">
            <select
              className={controlClass}
              value={filters.targetType ?? ''}
              onChange={(e) => set('targetType')(e.target.value)}
            >
              <option value="">Any target</option>
              {Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Filter>
          <Filter label="From">
            <input
              type="date"
              className={controlClass}
              value={filters.from ?? ''}
              onChange={(e) => set('from')(e.target.value)}
            />
          </Filter>
          <Filter label="To">
            <input
              type="date"
              className={controlClass}
              value={filters.to ?? ''}
              onChange={(e) => set('to')(e.target.value)}
            />
          </Filter>
        </FilterBar>

        <AuditTable
          rows={page?.items}
          status={status}
          onRetry={() => void log.refetch()}
          filtered={chips.length > 0}
          onClear={clear}
        />

        {page && page.items.length > 0 && (
          <Pagination
            label="Moderation log"
            shown={page.items.length}
            total={page.total}
            hasNext={Boolean(page.nextCursor)}
            hasPrevious={pages.hasPrevious}
            onNext={() => {
              pages.push()
              setFilter('cursor', page.nextCursor ?? undefined)
            }}
            onPrevious={() => {
              setFilter('cursor', pages.pop())
            }}
          />
        )}
      </div>
    </>
  )
}
