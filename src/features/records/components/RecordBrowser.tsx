import { Search, SearchX, Inbox } from 'lucide-react'
import { useState } from 'react'
import { DataTable } from '@/components/data/DataTable'
import type { FilterChip } from '@/components/data/FilterBar'
import { FilterBar } from '@/components/data/FilterBar'
import { MultiFilter, SingleFilter } from '@/components/data/FilterControls'
import { labelsOf, type FilterOption } from '@/components/data/filter-utils'
import { Pagination } from '@/components/data/Pagination'
import { PageHead } from '@/components/seo/PageHead'
import { PlainButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'
import { useRecordList } from '@/features/records/api/useRecordList'
import { BROWSER_SCHEMAS, BROWSERS, type BrowserConfig, type FilterSpec } from '@/features/records/browsers'
import { useCursorStack } from '@/hooks/useCursorStack'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { isForbidden } from '@/lib/api/error-message'
import type { RecordKind } from '@/lib/api/types/records'

type Values = Record<string, unknown>

/** The choices of each filter; hooks run in the same order on every render of one browser */
function useFilterOptions(specs: FilterSpec[]): FilterOption[][] {
  return specs.map((spec) => (typeof spec.options === 'function' ? spec.options() : spec.options))
}

/**
 * One record browser (ADM-FE-07): search, filters and paging kept in the URL, and every record linked to
 * its page. Render it keyed by kind, so switching tabs starts fresh.
 */
export function RecordBrowser({ kind }: { kind: RecordKind }) {
  const config = BROWSERS[kind] as BrowserConfig<RecordKind>
  const { filters, present, setFilter, clear } = useUrlFilters(BROWSER_SCHEMAS[kind])
  const values = filters
  const shown = present as Values
  const pages = useCursorStack(values)
  const list = useRecordList(kind, values)
  const choices = useFilterOptions(config.filters)
  const [text, setText] = useState(typeof values.q === 'string' ? values.q : '')

  const set = (key: string, value: unknown) => setFilter(key, value)
  const chips: FilterChip[] = config.filters.flatMap((spec, index) => {
    const value = shown[spec.key]
    if (value === undefined) return []
    const list = Array.isArray(value) ? (value as string[]) : typeof value === 'string' ? [value] : []
    return [
      {
        key: spec.key,
        label: `${spec.label}: ${labelsOf(list, choices[index] ?? [])}`,
        onRemove: () => set(spec.key, undefined),
      },
    ]
  })
  if (typeof shown.q === 'string') {
    chips.unshift({
      key: 'q',
      label: `Search: ${shown.q}`,
      onRemove: () => {
        setText('')
        set('q', undefined)
      },
    })
  }
  const clearAll = () => {
    setText('')
    clear()
  }

  const status = list.isPending ? 'pending' : isForbidden(list.error) ? 'forbidden' : list.isError ? 'error' : 'success'
  const page = list.data
  const filtered = chips.length > 0

  return (
    <>
      <PageHead title={config.title} />
      <div className="flex flex-col gap-6">
        <h1 className="text-h1 text-ink">{config.title}</h1>

        <FilterBar chips={chips} onClear={clearAll}>
          <form
            role="search"
            className="relative"
            onSubmit={(e) => {
              e.preventDefault()
              set('q', text.trim() || undefined)
            }}
          >
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              aria-label={`Search ${config.noun} by ID or name`}
              placeholder="Search by ID or name"
              maxLength={80}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="field-input h-control-compact w-64 pl-9 text-compact"
            />
          </form>
          {config.filters.map((spec, index) =>
            spec.multiple ? (
              <MultiFilter
                key={spec.key}
                label={spec.label}
                options={choices[index] ?? []}
                selected={shown[spec.key] as string[] | undefined}
                onChange={(v) => set(spec.key, v)}
              />
            ) : (
              <SingleFilter
                key={spec.key}
                label={spec.label}
                options={choices[index] ?? []}
                value={shown[spec.key] as string | undefined}
                onChange={(v) => set(spec.key, v)}
              />
            ),
          )}
        </FilterBar>

        <DataTable
          label={config.title}
          tableId={`records-${kind}`}
          columns={config.columns}
          rows={page?.items}
          rowKey={(row) => row.id}
          status={status}
          onRetry={() => void list.refetch()}
          empty={
            filtered ? (
              <EmptyState
                icon={SearchX}
                title={`No ${config.noun} match these filters`}
                body="Try fewer filters, or clear them to see everything."
                action={
                  <PlainButton variant="secondary" onClick={clearAll}>
                    Clear filters
                  </PlainButton>
                }
              />
            ) : (
              <EmptyState
                icon={Inbox}
                title={`No ${config.noun} yet`}
                body="They appear here as soon as there are some."
              />
            )
          }
        />

        {page && page.items.length > 0 && (
          <Pagination
            label={config.title}
            shown={page.items.length}
            total={page.total}
            hasNext={Boolean(page.nextCursor)}
            hasPrevious={pages.hasPrevious}
            onNext={() => {
              pages.push()
              set('cursor', page.nextCursor ?? undefined)
            }}
            onPrevious={() => set('cursor', pages.pop())}
          />
        )}
      </div>
    </>
  )
}
